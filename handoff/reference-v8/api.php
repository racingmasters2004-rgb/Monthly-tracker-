<?php
require_once __DIR__ . '/includes/functions.php';
header('Content-Type: application/json');

$pdo = get_db();
$action = $_POST['action'] ?? $_GET['action'] ?? '';

function input($key, $default = null) {
    return $_POST[$key] ?? $default;
}
function respond($data) {
    echo json_encode($data);
    exit;
}
function fail($msg) {
    respond(['ok' => false, 'error' => $msg]);
}

try {
    switch ($action) {

        case 'get_data': {
            generate_recurring_instances();

            $domains = $pdo->query("SELECT * FROM domains ORDER BY sort_order, id")->fetchAll();
            foreach ($domains as &$d) {
                $stmt = $pdo->prepare("SELECT * FROM tasks WHERE domain_id = ? ORDER BY status, deadline IS NULL, deadline, id");
                $stmt->execute([$d['id']]);
                $tasks = $stmt->fetchAll();
                foreach ($tasks as &$t) {
                    $stmt2 = $pdo->prepare("SELECT * FROM subtasks WHERE task_id = ? ORDER BY done, deadline IS NULL, deadline, id");
                    $stmt2->execute([$t['id']]);
                    $t['subtasks'] = $stmt2->fetchAll();
                    $t['idle'] = is_task_idle($t, $t['subtasks']);
                    $t['quadrant'] = eisenhower_quadrant($t['important'], $t['urgent']);
                }
                unset($t);
                $d['tasks'] = $tasks;
                $d['score'] = domain_score($tasks);
            }
            unset($d);

            $recurring = $pdo->query("SELECT * FROM recurring_templates ORDER BY id DESC")->fetchAll();
            foreach ($recurring as &$r) { $r['streak'] = recurring_streak($pdo, $r); }
            unset($r);
            $goals = $pdo->query("SELECT * FROM goals ORDER BY year DESC, quarter, month, id")->fetchAll();
            $goalIds = array_column($goals, 'id');
            $itemsByGoal = [];
            if ($goalIds) {
                $in = implode(',', array_fill(0, count($goalIds), '?'));
                $gi = $pdo->prepare("SELECT * FROM goal_items WHERE goal_id IN ($in) ORDER BY done, id");
                $gi->execute($goalIds);
                foreach ($gi->fetchAll() as $row) { $itemsByGoal[$row['goal_id']][] = $row; }
            }
            foreach ($goals as &$g) {
                $items = $itemsByGoal[$g['id']] ?? [];
                $g['items'] = $items;
                if ($g['type'] === 'monthly') {
                    $g['progress'] = $g['done'] == 1 ? 100 : 0;
                } else {
                    $total = count($items);
                    $done = count(array_filter($items, fn($i) => $i['done'] == 1));
                    $g['progress'] = $total ? round($done / $total * 100) : null;
                }
            }
            unset($g);
            $scorecard = daily_scorecard($pdo);
            $weekly = weekly_review($pdo);
            $journalRow = $pdo->query("SELECT content FROM journal WHERE id = 1")->fetch();
            $journal = $journalRow ? $journalRow['content'] : '';

            respond(['ok' => true, 'domains' => $domains, 'recurring' => $recurring,
                     'goals' => $goals, 'scorecard' => $scorecard, 'weekly' => $weekly,
                     'journal' => $journal, 'server_date' => date('Y-m-d')]);
        }

        // ---------------- Domains ----------------
        case 'add_domain': {
            $name = trim(input('name', ''));
            if ($name === '') fail('Domain name required');
            $pdo->prepare("INSERT INTO domains (name) VALUES (?)")->execute([$name]);
            respond(['ok' => true, 'id' => $pdo->lastInsertId()]);
        }
        case 'rename_domain': {
            $pdo->prepare("UPDATE domains SET name = ? WHERE id = ?")->execute([trim(input('name','')), input('id')]);
            respond(['ok' => true]);
        }
        case 'delete_domain': {
            $pdo->prepare("DELETE FROM domains WHERE id = ?")->execute([input('id')]);
            respond(['ok' => true]);
        }

        // ---------------- Tasks ----------------
        case 'add_task': {
            $name = trim(input('name', ''));
            if ($name === '') fail('Task name required');
            $stmt = $pdo->prepare("INSERT INTO tasks (domain_id, name, priority, tags, important, urgent, deadline, estimated_hours)
                VALUES (?,?,?,?,?,?,?,?)");
            $stmt->execute([
                input('domain_id'), $name, input('priority','medium'), normalize_tags(input('tags','')),
                input('important',0) ? 1 : 0, input('urgent',0) ? 1 : 0,
                input('deadline') ?: null, input('estimated_hours') ?: null
            ]);
            respond(['ok' => true, 'id' => $pdo->lastInsertId()]);
        }
        case 'edit_task': {
            $stmt = $pdo->prepare("UPDATE tasks SET name=?, priority=?, tags=?, important=?, urgent=?, deadline=?, estimated_hours=? WHERE id=?");
            $stmt->execute([
                trim(input('name','')), input('priority','medium'), normalize_tags(input('tags','')),
                input('important',0) ? 1 : 0, input('urgent',0) ? 1 : 0,
                input('deadline') ?: null, input('estimated_hours') ?: null, input('id')
            ]);
            respond(['ok' => true]);
        }
        case 'delete_task': {
            $pdo->prepare("DELETE FROM tasks WHERE id = ?")->execute([input('id')]);
            respond(['ok' => true]);
        }
        case 'toggle_task_done': {
            $id = input('id');
            $t = $pdo->prepare("SELECT status FROM tasks WHERE id = ?"); $t->execute([$id]);
            $row = $t->fetch();
            if (!$row) fail('Task not found');
            $newStatus = $row['status'] === 'done' ? 'active' : 'done';
            $completedAt = $newStatus === 'done' ? date('Y-m-d H:i:s') : null;
            $pdo->prepare("UPDATE tasks SET status=?, completed_at=? WHERE id=?")->execute([$newStatus, $completedAt, $id]);
            respond(['ok' => true, 'status' => $newStatus]);
        }

        // ---------------- Timer (server-timestamp based: survives closed tabs) ----------------
        case 'start_timer': {
            $pdo->prepare("UPDATE tasks SET timer_started_at = ? WHERE id = ?")->execute([date('Y-m-d H:i:s'), input('id')]);
            respond(['ok' => true]);
        }
        case 'stop_timer': {
            $id = input('id');
            $stmt = $pdo->prepare("SELECT timer_started_at, actual_hours FROM tasks WHERE id = ?");
            $stmt->execute([$id]);
            $row = $stmt->fetch();
            if (!$row || !$row['timer_started_at']) fail('Timer was not running');
            $start = new DateTime($row['timer_started_at']);
            $now = new DateTime('now');
            $hours = ($now->getTimestamp() - $start->getTimestamp()) / 3600.0;
            $newTotal = round((float)$row['actual_hours'] + $hours, 2);
            $pdo->prepare("UPDATE tasks SET actual_hours = ?, timer_started_at = NULL WHERE id = ?")->execute([$newTotal, $id]);
            respond(['ok' => true, 'actual_hours' => $newTotal]);
        }

        // ---------------- Subtasks ----------------
        case 'add_subtask': {
            $name = trim(input('name', ''));
            if ($name === '') fail('Subtask name required');
            $stmt = $pdo->prepare("INSERT INTO subtasks (task_id, name, priority, tags, deadline) VALUES (?,?,?,?,?)");
            $stmt->execute([input('task_id'), $name, input('priority','medium'), normalize_tags(input('tags','')), input('deadline') ?: null]);
            respond(['ok' => true, 'id' => $pdo->lastInsertId()]);
        }
        case 'bulk_add_subtasks': {
            $taskId = input('task_id');
            $lines = array_filter(array_map('trim', explode("\n", (string)input('names',''))), fn($l) => $l !== '');
            if (empty($lines)) fail('Enter at least one line');
            $priority = input('priority','medium');
            $tags = normalize_tags(input('tags',''));
            $deadline = input('deadline') ?: null;
            $stmt = $pdo->prepare("INSERT INTO subtasks (task_id, name, priority, tags, deadline) VALUES (?,?,?,?,?)");
            $count = 0;
            foreach ($lines as $line) {
                $stmt->execute([$taskId, $line, $priority, $tags, $deadline]);
                $count++;
            }
            respond(['ok' => true, 'count' => $count]);
        }
        case 'edit_subtask': {
            $stmt = $pdo->prepare("UPDATE subtasks SET name=?, priority=?, tags=?, deadline=? WHERE id=?");
            $stmt->execute([trim(input('name','')), input('priority','medium'), normalize_tags(input('tags','')), input('deadline') ?: null, input('id')]);
            respond(['ok' => true]);
        }
        case 'delete_subtask': {
            $pdo->prepare("DELETE FROM subtasks WHERE id = ?")->execute([input('id')]);
            respond(['ok' => true]);
        }
        case 'toggle_subtask_done': {
            $id = input('id');
            $stmt = $pdo->prepare("SELECT done FROM subtasks WHERE id = ?"); $stmt->execute([$id]);
            $row = $stmt->fetch();
            if (!$row) fail('Subtask not found');
            $newDone = $row['done'] ? 0 : 1;
            $completedAt = $newDone ? date('Y-m-d H:i:s') : null;
            $pdo->prepare("UPDATE subtasks SET done=?, completed_at=? WHERE id=?")->execute([$newDone, $completedAt, $id]);

            // Auto-complete parent task if this was the last open subtask (feature #9 from your list)
            $allDone = false;
            if ($newDone) {
                $tid = $pdo->prepare("SELECT task_id FROM subtasks WHERE id = ?");
                $tid->execute([$id]);
                $taskId = $tid->fetchColumn();
                $remaining = $pdo->prepare("SELECT COUNT(*) FROM subtasks WHERE task_id = ? AND done = 0");
                $remaining->execute([$taskId]);
                if ($remaining->fetchColumn() == 0) {
                    $pdo->prepare("UPDATE tasks SET status='done', completed_at=? WHERE id=?")
                        ->execute([date('Y-m-d H:i:s'), $taskId]);
                    $allDone = true;
                }
            }
            respond(['ok' => true, 'done' => (bool)$newDone, 'task_auto_completed' => $allDone]);
        }

        // ---------------- Recurring templates ----------------
        case 'add_recurring': {
            $name = trim(input('name',''));
            if ($name === '') fail('Name required');
            $taskId = input('task_id') ?: null;
            $frequency = input('frequency','daily');
            $weekdays = $frequency === 'weekly' ? input('weekdays','') : null;
            $stmt = $pdo->prepare("INSERT INTO recurring_templates (domain_id, task_id, name, frequency, weekday, priority, tags, important, urgent) VALUES (?,?,?,?,?,?,?,?,?)");
            $stmt->execute([input('domain_id'), $taskId, $name, $frequency, $weekdays,
                input('priority','medium'), normalize_tags(input('tags','')),
                input('important',0) ? 1 : 0, input('urgent',0) ? 1 : 0]);
            respond(['ok' => true, 'id' => $pdo->lastInsertId()]);
        }
        case 'toggle_recurring_active': {
            $id = input('id');
            $stmt = $pdo->prepare("SELECT active FROM recurring_templates WHERE id=?"); $stmt->execute([$id]);
            $row = $stmt->fetch();
            $pdo->prepare("UPDATE recurring_templates SET active=? WHERE id=?")->execute([$row['active'] ? 0 : 1, $id]);
            respond(['ok' => true]);
        }
        case 'delete_recurring': {
            $pdo->prepare("DELETE FROM recurring_templates WHERE id = ?")->execute([input('id')]);
            respond(['ok' => true]);
        }

        // ---------------- Goals (annual / quarterly) ----------------
        case 'add_goal': {
            $title = trim(input('title',''));
            if ($title === '') fail('Title required');
            $type = input('type','annual');
            $year = input('year') ?: date('Y');
            $quarter = $type === 'quarterly' ? input('quarter') : null;
            $month = $type === 'monthly' ? input('month') : null;
            $stmt = $pdo->prepare("INSERT INTO goals (title, type, year, quarter, month, target_date, notes) VALUES (?,?,?,?,?,?,?)");
            $stmt->execute([$title, $type, $year, $quarter, $month, input('target_date') ?: null, input('notes','')]);
            respond(['ok' => true, 'id' => $pdo->lastInsertId()]);
        }
        case 'edit_goal': {
            $stmt = $pdo->prepare("UPDATE goals SET title=?, target_date=?, notes=? WHERE id=?");
            $stmt->execute([trim(input('title','')), input('target_date') ?: null, input('notes',''), input('id')]);
            respond(['ok' => true]);
        }
        case 'toggle_goal_done': {
            $id = input('id');
            $stmt = $pdo->prepare("SELECT done FROM goals WHERE id=?"); $stmt->execute([$id]);
            $row = $stmt->fetch();
            if (!$row) fail('Goal not found');
            $pdo->prepare("UPDATE goals SET done=? WHERE id=?")->execute([$row['done'] ? 0 : 1, $id]);
            respond(['ok' => true]);
        }
        case 'delete_goal': {
            $pdo->prepare("DELETE FROM goals WHERE id = ?")->execute([input('id')]);
            respond(['ok' => true]);
        }
        case 'add_goal_item': {
            $name = trim(input('name',''));
            if ($name === '') fail('Sub-goal name required');
            $stmt = $pdo->prepare("INSERT INTO goal_items (goal_id, name) VALUES (?,?)");
            $stmt->execute([input('goal_id'), $name]);
            respond(['ok' => true, 'id' => $pdo->lastInsertId()]);
        }
        case 'toggle_goal_item': {
            $id = input('id');
            $stmt = $pdo->prepare("SELECT done FROM goal_items WHERE id=?"); $stmt->execute([$id]);
            $row = $stmt->fetch();
            if (!$row) fail('Sub-goal not found');
            $newDone = $row['done'] ? 0 : 1;
            $completedAt = $newDone ? date('Y-m-d H:i:s') : null;
            $pdo->prepare("UPDATE goal_items SET done=?, completed_at=? WHERE id=?")->execute([$newDone, $completedAt, $id]);
            respond(['ok' => true]);
        }
        case 'delete_goal_item': {
            $pdo->prepare("DELETE FROM goal_items WHERE id = ?")->execute([input('id')]);
            respond(['ok' => true]);
        }

        // ---------------- Journal (free-write scratchpad) ----------------
        case 'save_journal': {
            $content = input('content', '');
            $stmt = $pdo->prepare("INSERT INTO journal (id, content) VALUES (1, ?) ON DUPLICATE KEY UPDATE content = VALUES(content)");
            $stmt->execute([$content]);
            respond(['ok' => true]);
        }

        default:
            fail('Unknown action: ' . $action);
    }
} catch (Exception $e) {
    fail($e->getMessage());
}
