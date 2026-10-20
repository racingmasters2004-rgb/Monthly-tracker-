<?php require_once __DIR__ . '/includes/functions.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<title>Monthly Planner</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/style.css?v=11">
</head>
<body>

<header id="topHeader">
  <div class="header-row">
    <h1>Monthly Planner <span class="tag-mark">v2</span></h1>
    <div style="display:flex; gap:8px;">
      <button class="icon-btn header-icon" id="homeBtn" title="Home"></button>
      <button class="icon-btn header-icon" id="calendarToggleBtn" title="Calendar view"></button>
    </div>
  </div>
  <div id="quoteBar" class="quote-bar"></div>
</header>

<main>
  <section id="reportRoot" class="report-card"></section>
  <section id="weeklyRoot"></section>

  <div id="calendarPanel" class="calendar-panel hidden"></div>

  <div class="control-strip">
    <div class="views" id="viewBar"></div>
    <select id="tagFilterSelect" class="tag-select" onchange="onTagFilterChange(this.value)">
      <option value="">Filter by person / tag&hellip;</option>
    </select>
  </div>
  <input type="text" id="searchBox" class="search-box" placeholder="Search tasks and subtasks&hellip;" oninput="onSearchInput(this.value)">

  <div id="idleBar" class="idle-bar"></div>

  <div class="section-block">
    <div class="section-title-row">
      <h2>Domains</h2>
      <div style="display:flex; gap:6px;">
        <button class="btn ghost small" onclick="exportData()">&#8681; JSON</button>
        <button class="btn ghost small" onclick="openExportPdfModal()">&#128196; PDF Report</button>
        <button class="btn ghost small" onclick="showAddDomainForm()">+ Add Domain</button>
      </div>
    </div>
    <div id="addDomainFormSlot"></div>
    <div id="domainsRoot"></div>
  </div>

  <div class="section-block">
    <div class="section-title-row">
      <h2>Recurring tasks</h2>
      <button class="btn ghost small" onclick="showAddRecurringForm()">+ Add</button>
    </div>
    <div id="addRecurringFormSlot"></div>
    <div id="recurringRoot"></div>
  </div>

  <div class="section-block">
    <div class="section-title-row">
      <h2>Goals</h2>
    </div>
    <div id="goalsRoot"></div>
  </div>

  <div class="section-block">
    <div class="section-title-row">
      <h2>Eisenhower matrix</h2>
    </div>
    <div id="matrixRoot"></div>
  </div>

  <div class="section-block">
    <div class="section-title-row">
      <h2>Journal <span class="tag-mark" style="background:transparent;border:1px solid var(--ink);color:var(--ink);">scratchpad</span></h2>
      <span class="journal-status" id="journalStatus"></span>
    </div>
    <div class="journal-wrap">
      <textarea id="journalPad" class="journal-pad" placeholder="Anything on your mind... jot it here. Saved automatically." oninput="onJournalInput()"></textarea>
    </div>
  </div>
</main>

<div id="modalRoot"></div>
<datalist id="globalTagList"></datalist>
<div id="celebrationLayer"></div>

<script src="assets/quotes-data.js?v=11"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js"></script>
<script src="assets/app.js?v=11"></script>
</body>
</html>
