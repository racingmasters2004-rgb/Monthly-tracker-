<?php
require_once __DIR__ . '/db.php';

function priority_weight($priority) {
    switch ($priority) {
        case 'high': return 2.0;
        case 'medium': return 1.5;
        default: return 1.0;
    }
}

// Tags are always stored upper-case and de-duplicated so "Nayan sir" and
// "nayan sir" can never both exist as separate tags going forward.
function normalize_tags($str) {
    $parts = array_filter(array_map('trim', explode(',', (string)$str)));
    $upper = array_map(function($p){ return mb_strtoupper($p, 'UTF-8'); }, $parts);
    $unique = array_values(array_unique($upper));
    return implode(', ', $unique);
}

// Eisenhower quadrant from important/urgent flags
function eisenhower_quadrant($important, $urgent) {
    if ($important && $urgent) return ['key' => 'do', 'label' => 'Do now'];
    if ($important && !$urgent) return ['key' => 'plan', 'label' => 'Plan it'];
    if (!$important && $urgent) return ['key' => 'delegate', 'label' => 'Delegate'];
    return ['key' => 'drop', 'label' => 'Drop / later'];
}

// ---- Recurring task generation (runs on every dashboard load, since
// InfinityFree free hosting has no reliable background cron) ----
function generate_recurring_instances() {
    $pdo = get_db();
    $templates = $pdo->query("SELECT * FROM recurring_templates WHERE active = 1")->fetchAll();
    $today = new DateTime('now');
    $todayStr = $today->format('Y-m-d');
    $todayWeekday = (int)$today->format('w'); // 0=Sun..6=Sat

    foreach ($templates as $t) {
        $eligible = false;
        if ($t['frequency'] === 'daily') {
            $eligible = true;
        } else { // weekly -- comma-separated list of weekdays, e.g. "1,3,5"
            $days = array_filter(array_map('trim', explode(',', (string)$t['weekday'])), fn($d) => $d !== '');
            $days = array_map('intval', $days);
            $eligible = in_array($todayWeekday, $days, true);
        }
        if (!$eligible) continue;

        // Check whether today's instance already exists before creating another
        // (replaces the old last_generated_period tracker, which couldn't
        // handle a template firing on more than one day per week).
        if (!empty($t['task_id'])) {
            $chk = $pdo->prepare("SELECT COUNT(*) FROM subtasks WHERE recurring_template_id = ? AND deadline = ?");
            $chk->execute([$t['id'], $todayStr]);
        } else {
            $chk = $pdo->prepare("SELECT COUNT(*) FROM tasks WHERE recurring_template_id = ? AND deadline = ?");
            $chk->execute([$t['id'], $todayStr]);
        }
        if ($chk->fetchColumn() > 0) continue;

        create_instance_from_template($pdo, $t, $todayStr);
    }
}

// Creates either a new subtask under an existing task (when the template has
// a task_id -- e.g. a weekly "LinkedIn post" subtask under the "Linkedin post 4"
// task) or a brand new standalone task in the domain (when task_id is empty).
function create_instance_from_template($pdo, $template, $dateLabel) {
    $name = $template['name'] . ' (' . $dateLabel . ')';
    if (!empty($template['task_id'])) {
        $stmt = $pdo->prepare("INSERT INTO subtasks (task_id, name, priority, tags, deadline, is_recurring_instance, recurring_template_id) VALUES (?,?,?,?,?,1,?)");
        $stmt->execute([$template['task_id'], $name, $template['priority'], $template['tags'], $dateLabel, $template['id']]);
    } else {
        $stmt = $pdo->prepare("INSERT INTO tasks
            (domain_id, name, priority, tags, important, urgent, status, deadline, is_recurring_instance, recurring_template_id)
            VALUES (?, ?, ?, ?, ?, ?, 'active', ?, 1, ?)");
        $stmt->execute([$template['domain_id'], $name, $template['priority'], $template['tags'],
            $template['important'] ?? 0, $template['urgent'] ?? 0, $dateLabel, $template['id']]);
    }
}

// ---- Idle detection: task has incomplete subtasks and none of them
// (nor the task itself, if it has none) has been completed in 3+ days ----
function is_task_idle($task, $subtasks) {
    if ($task['status'] === 'done') return false;
    $incomplete = array_filter($subtasks, fn($s) => !$s['done']);
    if (empty($incomplete)) return false; // nothing left to do, not idle
    $createdAt = new DateTime($task['created_at']);
    $now = new DateTime('now');
    if ($now->diff($createdAt)->days < 3) return false; // grace period for new tasks

    $lastActivity = $createdAt;
    foreach ($subtasks as $s) {
        if (!empty($s['completed_at'])) {
            $c = new DateTime($s['completed_at']);
            if ($c > $lastActivity) $lastActivity = $c;
        }
    }
    return $now->diff($lastActivity)->days >= 3;
}

// ---- Weighted domain score: high=2x, medium=1.5x, low=1x, based on subtask priority ----
function domain_score($tasks_with_subtasks) {
    $totalWeight = 0.0;
    $doneWeight = 0.0;
    foreach ($tasks_with_subtasks as $t) {
        foreach ($t['subtasks'] as $s) {
            $w = priority_weight($s['priority']);
            $totalWeight += $w;
            if ($s['done']) $doneWeight += $w;
        }
    }
    if ($totalWeight == 0) return null; // no subtasks yet, score not meaningful
    return round(($doneWeight / $totalWeight) * 100, 1);
}

// ---- Deadline bucket for a date string ----
function deadline_bucket($deadline, $done) {
    if ($done) return 'done';
    if (!$deadline) return 'none';
    $today = new DateTime('today');
    $d = new DateTime($deadline);
    $diff = (int)$today->diff($d)->format('%r%a');
    if ($diff < 0) return 'overdue';
    if ($diff === 0) return 'today';
    if ($diff === 1) return 'tomorrow';
    if ($diff <= 7) return 'week';
    return 'future';
}

function daily_scorecard($pdo) {
    $today = (new DateTime('today'))->format('Y-m-d');
    $stmt = $pdo->prepare("SELECT s.priority FROM subtasks s WHERE DATE(s.completed_at) = ?");
    $stmt->execute([$today]);
    $rows = $stmt->fetchAll();
    $count = count($rows);
    $weighted = 0.0;
    foreach ($rows as $r) $weighted += priority_weight($r['priority']);
    return ['count' => $count, 'weighted_score' => round($weighted, 1)];
}

// ---- Weekly review: Mon-Sun, derived entirely from existing deadlines
// (no separate "weekly target" data entry needed) ----
function weekly_review($pdo) {
    $today = new DateTime('today');
    $dow = (int)$today->format('N'); // 1=Mon..7=Sun
    $monday = (clone $today)->modify('-' . ($dow - 1) . ' days');
    $sunday = (clone $monday)->modify('+6 days');
    $mondayStr = $monday->format('Y-m-d');
    $sundayStr = $sunday->format('Y-m-d');

    $dayNames = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    $byDay = [];
    foreach ($dayNames as $n) $byDay[$n] = ['planned' => 0, 'done' => 0];
    $byDomain = [];
    $totalPlanned = 0; $totalDone = 0; $weightedDone = 0.0;

    $stmt = $pdo->prepare("SELECT s.deadline, s.done, s.priority, t.domain_id, d.name AS domain_name
                            FROM subtasks s JOIN tasks t ON t.id = s.task_id JOIN domains d ON d.id = t.domain_id
                            WHERE s.deadline BETWEEN ? AND ?");
    $stmt->execute([$mondayStr, $sundayStr]);
    $rows = $stmt->fetchAll();

    $stmt2 = $pdo->prepare("SELECT tk.deadline, (tk.status='done') AS done, tk.priority, tk.domain_id, d.name AS domain_name
                             FROM tasks tk JOIN domains d ON d.id = tk.domain_id
                             WHERE tk.deadline BETWEEN ? AND ?
                             AND NOT EXISTS (SELECT 1 FROM subtasks sub WHERE sub.task_id = tk.id)");
    $stmt2->execute([$mondayStr, $sundayStr]);
    $rows2 = $stmt2->fetchAll();

    foreach (array_merge($rows, $rows2) as $r) {
        $done = (bool)$r['done'];
        $dt = new DateTime($r['deadline']);
        $dayName = $dayNames[((int)$dt->format('N')) - 1];
        $byDay[$dayName]['planned']++;
        if ($done) $byDay[$dayName]['done']++;

        $domId = $r['domain_id'];
        if (!isset($byDomain[$domId])) $byDomain[$domId] = ['name' => $r['domain_name'], 'planned' => 0, 'done' => 0];
        $byDomain[$domId]['planned']++;
        if ($done) $byDomain[$domId]['done']++;

        $totalPlanned++;
        if ($done) { $totalDone++; $weightedDone += priority_weight($r['priority']); }
    }

    return [
        'range' => ['start' => $mondayStr, 'end' => $sundayStr],
        'total_planned' => $totalPlanned,
        'total_done' => $totalDone,
        'weighted_done' => round($weightedDone, 1),
        'by_day' => $byDay,
        'by_domain' => array_values($byDomain),
    ];
}

// ---- Recurring habit streaks: consecutive scheduled days completed in a row ----
function step_back_scheduled($template, $date) {
    if ($template['frequency'] === 'daily') {
        $date->modify('-1 day');
        return $date;
    }
    $days = array_values(array_filter(array_map('intval', explode(',', (string)$template['weekday'])), fn($d) => $d !== '' ));
    if (empty($days)) { $date->modify('-1 day'); return $date; }
    for ($i = 0; $i < 8; $i++) {
        $date->modify('-1 day');
        if (in_array((int)$date->format('w'), $days, true)) return $date;
    }
    return $date;
}

function recurring_streak($pdo, $template) {
    $isSub = !empty($template['task_id']);
    $stmt = $isSub
        ? $pdo->prepare("SELECT deadline, done FROM subtasks WHERE recurring_template_id = ?")
        : $pdo->prepare("SELECT deadline, status FROM tasks WHERE recurring_template_id = ?");
    $stmt->execute([$template['id']]);
    $map = [];
    foreach ($stmt->fetchAll() as $r) {
        $map[$r['deadline']] = $isSub ? ($r['done'] == 1) : ($r['status'] === 'done');
    }
    $cursor = new DateTime('today');
    $todayKey = $cursor->format('Y-m-d');
    if (empty($map[$todayKey])) {
        $cursor = step_back_scheduled($template, $cursor);
    }
    $streak = 0;
    while (isset($map[$cursor->format('Y-m-d')]) && $map[$cursor->format('Y-m-d')]) {
        $streak++;
        $cursor = step_back_scheduled($template, $cursor);
    }
    return $streak;
}
