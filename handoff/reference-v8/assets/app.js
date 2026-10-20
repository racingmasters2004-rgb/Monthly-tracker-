/* ===================== State ===================== */
let DATA = null;
let currentView = 'all';
let searchQuery = '';
let SERVER_TODAY = null; // authoritative "today" from the server, avoids phone-clock/timezone mismatches
let activeTag = null;
let collapsedDomains = {};
let collapsedTasks = {};
let showCompleted = {};
let firstRender = true;
let reportExpanded = null;

/* ===================== API helper ===================== */
async function api(action, params = {}) {
  const body = new URLSearchParams({ action, ...params });
  let json;
  try {
    const res = await fetch('api.php', { method: 'POST', body });
    json = await res.json();
  } catch (e) {
    alert('Could not reach the server. Check your connection and try again.\n\n(' + e.message + ')');
    return { ok: false, error: 'network error' };
  }
  if (json && json.ok === false) {
    alert('That didn\'t save: ' + (json.error || 'unknown error') + '\n\nAction: ' + action);
  }
  return json;
}

async function loadData() {
  const res = await api('get_data');
  if (!res.ok) { return; } // api() already alerted the specific error
  DATA = res;
  if (res.server_date) {
    SERVER_TODAY = res.server_date;
    if (!calViewSynced) {
      const ref = new Date(SERVER_TODAY + 'T00:00:00');
      calView = new Date(ref.getFullYear(), ref.getMonth(), 1);
      calViewSynced = true;
    }
  }
  render();
  firstRender = false;
}

function anythingOpenRightNow(){
  if (document.getElementById('modalRoot').innerHTML.trim()) return true;
  return !!document.querySelector('.inline-form');
}

/* ===================== Render root ===================== */
function render() {
  renderQuote();
  renderReport();
  renderWeekly();
  renderViewBar();
  renderTagSelect();
  renderIdleBar();
  renderDomains();
  renderRecurring();
  renderGoals();
  renderMatrix();
  renderJournal();
  if (!document.getElementById('calendarPanel').classList.contains('hidden')) renderCalendar();
}

function renderQuote(){
  document.getElementById('quoteBar').textContent = '\u201C' + generateQuote() + '\u201D';
}

/* ===================== Report (hero) ===================== */
function renderReport(){
  const s = DATA.scorecard;
  const scored = DATA.domains.filter(d=>d.score !== null);
  const avgScore = scored.length ? Math.round(scored.reduce((a,d)=>a+d.score,0)/scored.length) : null;

  let openTasks = 0, idleCount = 0;
  const openList = [], idleList = [];
  DATA.domains.forEach(d=>d.tasks.forEach(t=>{
    if (t.status!=='done'){ openTasks++; openList.push({id:t.id, name:t.name, domain:d.name}); }
    if (t.idle){ idleCount++; idleList.push({id:t.id, name:t.name, domain:d.name}); }
  }));
  const completedToday = [];
  DATA.domains.forEach(d=>d.tasks.forEach(t=>{
    t.subtasks.forEach(sub=>{ if (sub.done==1 && sub.completed_at && sub.completed_at.slice(0,10)===SERVER_TODAY) completedToday.push({id:t.id, name:sub.name, domain:d.name, taskName:t.name}); });
    if (t.subtasks.length===0 && t.status==='done' && t.completed_at && t.completed_at.slice(0,10)===SERVER_TODAY) completedToday.push({id:t.id, name:t.name, domain:d.name});
  }));

  const today = new Date();
  const dateLabel = today.toLocaleDateString(undefined,{weekday:'long', day:'numeric', month:'long'}).toUpperCase();
  const anim = firstRender ? '' : 'no-anim';

  document.getElementById('reportRoot').innerHTML = `
    <div class="${anim}">
      <div class="report-eyebrow">${dateLabel} &middot; DAILY REPORT</div>
      <div class="stat-grid">
        <button type="button" class="stat-tile ${reportExpanded==='completed'?'active':''}" onclick="toggleReportPanel('completed')">
          <span class="stat-num">${s.count}</span><span class="stat-label">Completed today</span>
        </button>
        <button type="button" class="stat-tile ${reportExpanded==='open'?'active':''}" onclick="toggleReportPanel('open')">
          <span class="stat-num">${openTasks}</span><span class="stat-label">Open tasks</span>
        </button>
        <button type="button" class="stat-tile ${reportExpanded==='stalled'?'active':''}" onclick="toggleReportPanel('stalled')">
          <span class="stat-num">${idleCount}</span><span class="stat-label">Stalled</span>
        </button>
        <button type="button" class="stat-tile ${reportExpanded==='progress'?'active':''}" onclick="toggleReportPanel('progress')">
          <span class="stat-num">${avgScore===null?'--':avgScore+'%'}</span><span class="stat-label">Overall progress</span>
        </button>
      </div>
      <div class="report-detail ${reportExpanded?'open':''}">
        ${renderReportPanelContent(reportExpanded, {completedToday, openList, idleList})}
      </div>
    </div>`;
}
function toggleReportPanel(key){ reportExpanded = (reportExpanded===key) ? null : key; renderReport(); }
function renderReportPanelContent(key, data){
  if (!key) return '';
  if (key==='completed'){
    if (!data.completedToday.length) return `<div class="empty" style="padding:8px 0;">Nothing completed yet today.</div>`;
    return data.completedToday.map(it=>`<button type="button" class="cal-day-item" onclick="jumpToTaskGeneric(${it.id})"><span class="cal-day-item-name">${escapeHtml(it.name)}</span><span class="cal-day-item-meta">${escapeHtml(it.domain)}${it.taskName?' &rsaquo; '+escapeHtml(it.taskName):''}</span></button>`).join('');
  }
  if (key==='open'){
    if (!data.openList.length) return `<div class="empty" style="padding:8px 0;">No open tasks. \u{1F389}</div>`;
    return data.openList.map(it=>`<button type="button" class="cal-day-item" onclick="jumpToTaskGeneric(${it.id})"><span class="cal-day-item-name">${escapeHtml(it.name)}</span><span class="cal-day-item-meta">${escapeHtml(it.domain)}</span></button>`).join('');
  }
  if (key==='stalled'){
    if (!data.idleList.length) return `<div class="empty" style="padding:8px 0;">Nothing stalled right now.</div>`;
    return data.idleList.map(it=>`<button type="button" class="cal-day-item" onclick="jumpToTaskGeneric(${it.id})"><span class="cal-day-item-name">${escapeHtml(it.name)}</span><span class="cal-day-item-meta">${escapeHtml(it.domain)}</span></button>`).join('');
  }
  if (key==='progress'){
    if (!DATA.domains.length) return `<div class="empty" style="padding:8px 0;">No domains yet.</div>`;
    return DATA.domains.map(d=>`<div class="report-domain-row"><span>${escapeHtml(d.name)}</span><span>${d.score===null?'no items yet':d.score+'%'}</span></div>`).join('');
  }
  return '';
}

/* ===================== Weekly review ===================== */
function formatShortDate(iso){ const d=new Date(iso+'T00:00:00'); return d.toLocaleDateString(undefined,{month:'short',day:'numeric'}); }
function renderWeekly(){
  const root = document.getElementById('weeklyRoot');
  const w = DATA.weekly;
  if (!w){ root.innerHTML=''; return; }
  const dayNames = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const maxPlanned = Math.max(1, ...dayNames.map(d=>w.by_day[d].planned));
  const rangeLabel = `${formatShortDate(w.range.start)} \u2013 ${formatShortDate(w.range.end)}`;
  const anim = firstRender ? '' : 'no-anim';
  root.innerHTML = `
    <div class="report-card ${anim}" style="margin-top:0;">
      <div class="report-eyebrow">THIS WEEK &middot; ${rangeLabel}</div>
      <div class="report-main">
        <div class="report-score">${w.total_done}<sub>of ${w.total_planned} planned items done</sub></div>
      </div>
      <div class="report-stats">
        <div class="report-stat"><b>${w.weighted_done}</b>weighted score</div>
        <div class="report-stat"><b>${Math.max(0,w.total_planned-w.total_done)}</b>remaining this week</div>
      </div>
      <div class="week-bars">
        ${dayNames.map(d=>{
          const info = w.by_day[d];
          const heightPct = info.planned ? Math.max(10, Math.round((info.planned/maxPlanned)*100)) : 4;
          const donePct = info.planned ? Math.round((info.done/info.planned)*100) : 0;
          return `<div class="week-bar-col">
            <div class="week-bar-track" style="height:${heightPct}%">
              <div class="week-bar-fill" style="height:${donePct}%"></div>
            </div>
            <div class="week-bar-count">${info.done}/${info.planned}</div>
            <div class="week-bar-label">${d}</div>
          </div>`;
        }).join('')}
      </div>
      ${w.by_domain.length? `
      <div class="report-detail open" style="margin-top:10px;">
        ${w.by_domain.map(d=>`<div class="report-domain-row"><span>${escapeHtml(d.name)}</span><span>${d.done}/${d.planned}</span></div>`).join('')}
      </div>` : ''}
    </div>`;
}

/* ===================== Journal / scratchpad ===================== */
let journalSaveTimer = null;
function renderJournal(){
  const el = document.getElementById('journalPad');
  if (!el) return;
  // Never overwrite while the user is actively typing (avoids clobbering
  // mid-sentence during the periodic background refresh).
  if (document.activeElement === el) return;
  const content = DATA.journal || '';
  if (el.value !== content) el.value = content;
}
function onJournalInput(){
  const status = document.getElementById('journalStatus');
  if (status) status.textContent = 'Saving\u2026';
  clearTimeout(journalSaveTimer);
  journalSaveTimer = setTimeout(saveJournal, 900);
}
async function saveJournal(){
  const el = document.getElementById('journalPad');
  if (!el) return;
  const content = el.value;
  const res = await api('save_journal', {content});
  const status = document.getElementById('journalStatus');
  if (!status) return;
  status.textContent = res.ok ? 'Saved' : '';
  setTimeout(()=>{ if (status) status.textContent=''; }, 1500);
}

/* ===================== Views + tag filter ===================== */
const VIEWS = [
  {id:'all', label:'All'}, {id:'overdue', label:'Overdue'}, {id:'today', label:'Today'},
  {id:'tomorrow', label:'Tomorrow'}, {id:'week', label:'This Week'},
];
function subtaskBucket(sub){
  if (sub.done == 1) return 'done';
  if (!sub.deadline) return 'none';
  const today = new Date((SERVER_TODAY || new Date().toISOString().slice(0,10)) + 'T00:00:00');
  const d = new Date(sub.deadline + 'T00:00:00');
  const diff = Math.round((d - today) / 86400000);
  if (diff < 0) return 'overdue';
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  if (diff <= 7) return 'week';
  return 'future';
}
function matchesBucket(b){
  if (currentView === 'all') return true;
  if (currentView === 'week') return ['overdue','today','tomorrow','week'].includes(b);
  return b === currentView;
}
function matchesView(sub){ return matchesBucket(subtaskBucket(sub)); }
// A task's OWN deadline (e.g. a recurring-generated task, or any task you set
// a deadline on directly) only counts for filtering when it has no open
// subtasks of its own -- otherwise the subtasks are the granular items.
function taskDeadlineBucket(t){
  if (t.status === 'done') return 'done';
  if (!t.deadline) return 'none';
  return subtaskBucket({deadline: t.deadline, done: 0});
}
function taskHasOwnDeadlineMatch(t){
  if (!t.deadline) return false;
  const openSubs = t.subtasks.filter(s=>s.done==0);
  if (openSubs.length > 0) return false;
  return matchesBucket(taskDeadlineBucket(t));
}
function renderViewBar(){
  const counts = {all:0,overdue:0,today:0,tomorrow:0,week:0};
  DATA.domains.forEach(d=>d.tasks.forEach(t=>{
    if (t.status==='done') return;
    const openSubs = t.subtasks.filter(s=>s.done==0);
    if (openSubs.length===0 && t.deadline){
      counts.all++;
      const b = taskDeadlineBucket(t);
      if (counts[b]!==undefined) counts[b]++;
      if (['overdue','today','tomorrow','week'].includes(b)) counts.week++;
      return;
    }
    t.subtasks.forEach(s=>{
      if (s.done==1) return;
      counts.all++;
      const b = subtaskBucket(s);
      if (counts[b]!==undefined) counts[b]++;
      if (['overdue','today','tomorrow','week'].includes(b)) counts.week++;
    });
  }));
  document.getElementById('viewBar').innerHTML = VIEWS.map(v=>`
    <button class="view-btn ${currentView===v.id?'active':''}" onclick="setView('${v.id}')">
      ${v.label}${counts[v.id]?`<span class="count">${counts[v.id]}</span>`:''}
    </button>`).join('');
}
function setView(id){ currentView=id; render(); }

function allTagsWithCounts(){
  const counts = {};
  DATA.domains.forEach(d=>d.tasks.forEach(t=>{
    tagsOf(t.tags).forEach(tag=>counts[tag]=(counts[tag]||0)+1);
    t.subtasks.forEach(st=>tagsOf(st.tags).forEach(tag=>counts[tag]=(counts[tag]||0)+1));
  }));
  return Object.entries(counts).sort((a,b)=>a[0].localeCompare(b[0]));
}
function renderTagSelect(){
  const sel = document.getElementById('tagFilterSelect');
  const tags = allTagsWithCounts();
  const current = activeTag || '';
  sel.innerHTML = `<option value="">Filter by person / tag&hellip;</option>` +
    tags.map(([t,c])=>`<option value="${escapeAttr(t)}" ${t===current?'selected':''}>${escapeHtml(t)} (${c})</option>`).join('');
  sel.value = current;
  const dl = document.getElementById('globalTagList');
  if (dl) dl.innerHTML = tags.map(([t])=>`<option value="${escapeAttr(t)}">`).join('');
}
function onTagFilterChange(v){ activeTag = v || null; render(); }
function tagsOf(str){ return (str||'').split(',').map(x=>x.trim()).filter(Boolean); }
function taskMatchesTag(t){ if(!activeTag) return true; if(tagsOf(t.tags).includes(activeTag)) return true; return t.subtasks.some(s=>tagsOf(s.tags).includes(activeTag)); }
function subMatchesTag(s){ if(!activeTag) return true; return tagsOf(s.tags).includes(activeTag); }
function onSearchInput(v){ searchQuery = v.trim().toLowerCase(); render(); }
function taskMatchesSearch(t){
  if (!searchQuery) return true;
  if (t.name.toLowerCase().includes(searchQuery)) return true;
  return t.subtasks.some(s=>s.name.toLowerCase().includes(searchQuery));
}
function subMatchesSearch(s){ if (!searchQuery) return true; return s.name.toLowerCase().includes(searchQuery); }
function exportData(){
  const blob = new Blob([JSON.stringify(DATA, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `planner-backup-${SERVER_TODAY||'export'}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ===================== PDF report export (jsPDF, entirely client-side) ===================== */
function openExportPdfModal(){
  openModal('Export PDF report', `
    <label class="small">From (optional)</label>
    <input type="date" id="pdfFrom">
    <label class="small">To (optional)</label>
    <input type="date" id="pdfTo">
    <div class="empty" style="text-align:left; padding:8px 2px 0;">Leave both blank to export everything, regardless of date.</div>
    <div class="form-actions" style="margin-top:14px;">
      <button class="btn ghost" onclick="closeModal()">Cancel</button>
      <button class="btn primary" onclick="runExportPdf()">Generate PDF</button>
    </div>`);
}
function runExportPdf(){
  const from = document.getElementById('pdfFrom').value;
  const to = document.getElementById('pdfTo').value;
  closeModal();
  exportPlannerPdf(from, to);
}
function collectReportRows(fromDate, toDate){
  const hasRange = !!(fromDate || toDate);
  const inRange = (dateStr) => {
    if (!hasRange) return true;
    if (!dateStr) return false;
    if (fromDate && dateStr < fromDate) return false;
    if (toDate && dateStr > toDate) return false;
    return true;
  };
  const byDomain = {};
  DATA.domains.forEach(d=>{
    const rows = [];
    d.tasks.forEach(t=>{
      const hasSubs = t.subtasks.length > 0;
      if (!hasSubs){
        if (inRange(t.deadline)) rows.push([t.name, 'Task', t.priority, t.status, t.deadline||'\u2014']);
        return;
      }
      const matchingSubs = t.subtasks.filter(s=>inRange(s.deadline));
      if (!matchingSubs.length) return;
      rows.push([t.name, 'Task', t.priority, t.status, '\u2014']);
      matchingSubs.forEach(s=>{
        rows.push(['   \u21B3 ' + s.name, 'Subtask', s.priority, s.done==1?'done':'open', s.deadline||'\u2014']);
      });
    });
    if (rows.length) byDomain[d.name] = rows;
  });
  return byDomain;
}
function exportPlannerPdf(fromDate, toDate){
  if (!window.jspdf){ alert('PDF library did not load -- check your internet connection and try again.'); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const byDomain = collectReportRows(fromDate, toDate);
  const rangeLabel = (fromDate || toDate) ? `${fromDate||'earliest'} to ${toDate||'latest'}` : 'All data';

  doc.setFontSize(17);
  doc.text('Monthly Planner \u2014 Report', 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(`Range: ${rangeLabel}`, 14, 25);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

  let y = 38;
  const domainNames = Object.keys(byDomain);
  if (!domainNames.length){
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text('No items match this date range.', 14, y);
  }
  domainNames.forEach(domName=>{
    doc.autoTable({
      startY: y,
      head: [[domName, 'Type', 'Priority', 'Status', 'Deadline']],
      body: byDomain[domName],
      theme: 'grid',
      headStyles: { fillColor: [31, 58, 82] },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 8;
  });

  doc.save(`planner-report-${SERVER_TODAY||'export'}.pdf`);
}

/* ===================== Idle bar ===================== */
function renderIdleBar(){
  const idleTasks = [];
  DATA.domains.forEach(d => d.tasks.forEach(t => { if (t.idle) idleTasks.push({...t, domainName: d.name}); }));
  const bar = document.getElementById('idleBar');
  if (idleTasks.length === 0){ bar.classList.remove('show'); bar.innerHTML=''; return; }
  bar.classList.add('show');
  bar.innerHTML = `<div class="idle-title">Stalled &mdash; no progress in 3+ days</div>` +
    idleTasks.map(t => `<button class="idle-link" onclick="jumpToTask(${t.id})">${escapeHtml(t.domainName)} &rsaquo; ${escapeHtml(t.name)}</button>`).join('');
}
function jumpToTask(taskId){
  const el = document.getElementById('task-' + taskId);
  if (!el) return;
  el.scrollIntoView({behavior:'smooth', block:'center'});
  el.classList.add('blink-3x');
  setTimeout(()=>el.classList.remove('blink-3x'), 2000);
}

/* ===================== Domains / Tasks / Subtasks ===================== */
const DOMAIN_ACCENTS = ['#1F3A52','#2A7F73','#7A4F82','#5B6670','#8A5A3B','#3E6B7A'];

function renderDomains(){
  const root = document.getElementById('domainsRoot');
  if (DATA.domains.length===0){ root.innerHTML = `<div class="empty">No domains yet.</div>`; return; }
  root.innerHTML = DATA.domains.map((d,i)=>renderDomain(d,i)).join('');
}

function renderDomain(d, idx){
  const accent = DOMAIN_ACCENTS[idx % DOMAIN_ACCENTS.length];
  const collapsed = !!collapsedDomains[d.id];
  const visibleTasks = d.tasks.filter(t=>{
    if (!taskMatchesTag(t)) return false;
    if (!taskMatchesSearch(t)) return false;
    if (t.status === 'done') return false;
    if (currentView === 'all') return true;
    const subMatch = t.subtasks.some(s=>s.done==0 && matchesView(s) && subMatchesTag(s) && subMatchesSearch(s));
    return subMatch || taskHasOwnDeadlineMatch(t);
  });
  const completedTasks = d.tasks.filter(t=>t.status==='done' && taskMatchesTag(t) && taskMatchesSearch(t));
  const scoreLabel = d.score === null ? 'no items yet' : d.score + '%';
  const anim = firstRender ? '' : 'no-anim';
  return `
  <div class="domain ${anim}">
    <div class="domain-head ${collapsed?'collapsed':''}" style="--domain-accent:${accent}" onclick="toggleDomain(${d.id})">
      <span class="chev"></span>
      <span class="domain-name">${escapeHtml(d.name)}</span>
      <span class="domain-score">${scoreLabel}</span>
      <span class="domain-actions" onclick="event.stopPropagation()">
        <button class="icon-btn" onclick="showAddTaskForm(${d.id}, 'top')" title="Add task">+</button>
        <button class="icon-btn" onclick="openDomainModal(${d.id})" title="Rename">&#9998;</button>
        <button class="icon-btn" onclick="deleteDomain(${d.id})" title="Delete">&times;</button>
      </span>
    </div>
    ${d.score!==null?`<div class="score-bar-track"><div class="score-bar-fill" style="width:${d.score}%"></div></div>`:''}
    <div class="domain-body ${collapsed?'hidden':''}">
      <div id="add-task-form-${d.id}"></div>
      ${visibleTasks.length? visibleTasks.map(t=>renderTask(t)).join('') : `<div class="empty" style="padding:10px 0;">No matching tasks.</div>`}
      <div id="add-task-form-bottom-${d.id}"></div>
      <button class="add-task-btn" onclick="showAddTaskForm(${d.id}, 'bottom')">+ Add Task</button>
      ${completedTasks.length? `
        <button class="completed-toggle" onclick="toggleCompletedTasks(${d.id})">Completed tasks (${completedTasks.length}) &#9662;</button>
        <div class="completed-list ${collapsedDomains['done-'+d.id]!==true?'hidden':''}" id="completed-tasks-${d.id}">
          ${completedTasks.map(t=>renderTask(t)).join('')}
        </div>` : ''}
    </div>
  </div>`;
}
function toggleDomain(id){ collapsedDomains[id]=!collapsedDomains[id]; render(); }
function toggleCompletedTasks(domainId){
  const key='done-'+domainId;
  collapsedDomains[key] = !collapsedDomains[key];
  const el = document.getElementById('completed-tasks-'+domainId);
  if (el) el.classList.toggle('hidden');
}

function renderTask(t){
  const collapsed = !!collapsedTasks[t.id];
  const visibleSubs = t.subtasks.filter(s=> s.done==0 && (currentView==='all'||matchesView(s)) && subMatchesTag(s) && subMatchesSearch(s));
  const completedSubs = t.subtasks.filter(s=>s.done==1);
  const doneCount = completedSubs.length;
  const isSpotlight = t.priority==='high' && deadlineUrgencyForSpotlight(t)==='soon';
  const quad = t.quadrant || {key:'drop',label:'Drop / later'};
  const anim = firstRender ? '' : 'no-anim';
  return `
  <div class="task ${anim} ${t.idle?'idle-flag':''} ${isSpotlight?'spotlight':''}" id="task-${t.id}">
    <div class="task-head ${collapsed?'collapsed':''}" onclick="toggleTask(${t.id})">
      <span class="chev"></span>
      <span class="prio-dot ${t.priority}"></span>
      <input type="checkbox" class="task-check" onclick="event.stopPropagation()" ${t.status==='done'?'checked':''} onchange="toggleTaskDone(${t.id})" title="Mark task complete">
      <span class="task-name ${t.status==='done'?'done-strike':''}">${escapeHtml(t.name)}</span>
      ${t.subtasks.length===0 && t.deadline ? `<span class="deadline-tag ${taskDeadlineBucket(t)}">${taskDeadlineLabel(t)}</span>` : ''}
      <span class="task-meta">${doneCount}/${t.subtasks.length}</span>
      <span class="task-actions" onclick="event.stopPropagation()">
        <button class="icon-btn-sm" onclick="showAddSubForm(${t.id}, 'top')" title="Add subtask">+</button>
        <button class="icon-btn-sm" onclick="openTaskModal(${t.id})" title="Edit">&#9998;</button>
        <button class="icon-btn-sm" onclick="deleteTask(${t.id})" title="Delete">&times;</button>
      </span>
    </div>
    <div class="chips-row">
      ${t.idle?`<span class="mini-chip idle-badge">STALLED</span>`:''}
      <span class="mini-chip eisen ${quad.key}">${quad.label}</span>
      ${tagsOf(t.tags).map(tag=>`<span class="mini-chip">#${escapeHtml(tag)}</span>`).join('')}
    </div>
    <div class="task-body ${collapsed?'hidden':''}">
      <div id="add-sub-form-${t.id}"></div>
      ${visibleSubs.length? visibleSubs.map(s=>renderSubtask(s,t.id)).join('') : `<div class="empty" style="padding:6px 0;font-size:11px;">No matching subtasks.</div>`}
      <div id="add-sub-form-bottom-${t.id}"></div>
      <button class="add-sub-btn" onclick="showAddSubForm(${t.id}, 'bottom')">+ Add subtask</button>
      <button class="add-sub-btn" onclick="showBulkAddSubForm(${t.id}, 'bottom')">+ Add multiple at once</button>
      ${completedSubs.length? `
        <button class="completed-toggle" onclick="toggleCompletedSubs(${t.id})">Completed (${completedSubs.length}) &#9662;</button>
        <div class="completed-list ${showCompleted[t.id]?'':'hidden'}" id="completed-subs-${t.id}">
          ${completedSubs.map(s=>renderSubtask(s,t.id)).join('')}
        </div>`:''}
    </div>
  </div>`;
}
function deadlineUrgencyForSpotlight(t){
  const upcoming = t.subtasks.filter(s=>s.done==0 && s.deadline);
  if (!upcoming.length) return '';
  return upcoming.some(s=>['overdue','today','tomorrow'].includes(subtaskBucket(s))) ? 'soon' : '';
}
function toggleTask(id){ collapsedTasks[id]=!collapsedTasks[id]; render(); }
function toggleCompletedSubs(taskId){
  showCompleted[taskId] = !showCompleted[taskId];
  const el = document.getElementById('completed-subs-'+taskId);
  if (el) el.classList.toggle('hidden');
}

function renderSubtask(s, taskId){
  const bucket = subtaskBucket(s);
  const label = deadlineLabel(s);
  return `
  <div class="subtask ${s.done==1?'done':''}">
    <input type="checkbox" class="sub-check" ${s.done==1?'checked':''} onchange="toggleSubDone(${s.id})">
    <div class="sub-main">
      <div class="sub-name">${escapeHtml(s.name)}</div>
      ${tagsOf(s.tags).length?`<div class="sub-tags">${tagsOf(s.tags).map(tg=>`<span class="sub-tag">#${escapeHtml(tg)}</span>`).join('')}</div>`:''}
    </div>
    <span class="deadline-tag ${bucket}">${label}</span>
    <button class="icon-btn-sm" onclick="openSubtaskModal(${s.id})">&#9998;</button>
    <button class="icon-btn-sm" onclick="deleteSubtask(${s.id})">&times;</button>
  </div>`;
}
function taskDeadlineLabel(t){
  const b = taskDeadlineBucket(t);
  if (b==='overdue') return 'OVERDUE';
  if (b==='today') return 'TODAY';
  if (b==='tomorrow') return 'TOMORROW';
  const d = new Date(t.deadline+'T00:00:00');
  return d.toLocaleDateString(undefined,{month:'short',day:'numeric'});
}
function deadlineLabel(s){
  if (s.done==1) return 'DONE';
  if (!s.deadline) return 'NO DATE';
  const b = subtaskBucket(s);
  if (b==='overdue') return 'OVERDUE';
  if (b==='today') return 'TODAY';
  if (b==='tomorrow') return 'TOMORROW';
  const d = new Date(s.deadline+'T00:00:00');
  return d.toLocaleDateString(undefined,{month:'short',day:'numeric'});
}

/* ===================== Tag chip input (autocomplete, multi-select) ===================== */
let chipInputState = {};
function chipInputHtml(containerId, initialTags){
  chipInputState[containerId] = { tags: [...initialTags] };
  return `
    <div class="chip-input" id="${containerId}">
      <div class="chip-list" id="${containerId}-chips">${initialTags.map(t=>chipPillHtml(containerId,t)).join('')}</div>
      <input type="text" class="chip-text-input" id="${containerId}-text" placeholder="Type a name, e.g. Nayan sir"
        autocapitalize="characters"
        oninput="onChipInput('${containerId}')" onfocus="onChipInput('${containerId}')" onblur="onChipBlur('${containerId}')"
        onkeydown="onChipKeydown(event,'${containerId}')">
      <div class="chip-suggestions hidden" id="${containerId}-suggestions"></div>
    </div>`;
}
function chipPillHtml(containerId, tag){
  return `<span class="chip">${escapeHtml(tag)}<button type="button" onmousedown="event.preventDefault()" onclick="removeChip('${containerId}','${escapeAttr(tag)}')">&times;</button></span>`;
}
function renderChipList(containerId){
  const el = document.getElementById(`${containerId}-chips`);
  if (el) el.innerHTML = chipInputState[containerId].tags.map(t=>chipPillHtml(containerId,t)).join('');
}
function knownTagsUnique(){
  const map = new Map();
  allTagsWithCounts().forEach(([tag,count])=>{
    const key = tag.toUpperCase();
    map.set(key, (map.get(key)||0) + count);
  });
  return Array.from(map.entries()).sort((a,b)=>a[0].localeCompare(b[0]));
}
function onChipInput(containerId){
  const text = document.getElementById(`${containerId}-text`).value.trim();
  const box = document.getElementById(`${containerId}-suggestions`);
  const existing = chipInputState[containerId].tags.map(t=>t.toUpperCase());
  const known = knownTagsUnique();
  let matches = known.filter(([tag])=> !existing.includes(tag) && (text==='' || tag.startsWith(text.toUpperCase())));
  matches = matches.slice(0,8);
  let html = matches.map(([tag,count])=>`<div class="chip-suggestion-item" onmousedown="pickChip('${containerId}','${escapeAttr(tag)}')">${escapeHtml(tag)} <span style="opacity:.5">(${count})</span></div>`).join('');
  const exactExists = known.some(([tag])=>tag===text.toUpperCase());
  if (text !== '' && !exactExists){
    html += `<div class="chip-suggestion-item add-new" onmousedown="pickChip('${containerId}','${escapeAttr(text.toUpperCase())}')">+ Add &ldquo;${escapeHtml(text.toUpperCase())}&rdquo; as a new tag</div>`;
  }
  if (html === ''){ box.classList.add('hidden'); box.innerHTML=''; return; }
  box.innerHTML = html;
  box.classList.remove('hidden');
}
function onChipBlur(containerId){
  setTimeout(()=>{ const box = document.getElementById(`${containerId}-suggestions`); if (box) box.classList.add('hidden'); }, 150);
}
function onChipKeydown(e, containerId){
  if (e.key === 'Enter' || e.key === ','){
    e.preventDefault();
    const input = document.getElementById(`${containerId}-text`);
    const text = input.value.trim();
    if (text) pickChip(containerId, text.toUpperCase());
  }
}
function pickChip(containerId, tag){
  tag = tag.toUpperCase();
  if (!chipInputState[containerId].tags.map(t=>t.toUpperCase()).includes(tag)) chipInputState[containerId].tags.push(tag);
  renderChipList(containerId);
  const input = document.getElementById(`${containerId}-text`);
  input.value = '';
  input.focus();
  onChipInput(containerId);
}
function removeChip(containerId, tag){
  chipInputState[containerId].tags = chipInputState[containerId].tags.filter(t=>t!==tag);
  renderChipList(containerId);
}
function getChipTagsForSubmit(containerId){
  const input = document.getElementById(`${containerId}-text`);
  const leftover = input ? input.value.trim() : '';
  const tags = [...chipInputState[containerId].tags];
  if (leftover && !tags.map(t=>t.toUpperCase()).includes(leftover.toUpperCase())) tags.push(leftover.toUpperCase());
  return tags.join(', ');
}

/* ===================== Modal system ===================== */
function openModal(titleHtml, bodyHtml){
  document.getElementById('modalRoot').innerHTML = `
    <div class="modal-overlay" onclick="if(event.target===this) closeModal()">
      <div class="modal-sheet">
        <div class="modal-title">${titleHtml}</div>
        ${bodyHtml}
      </div>
    </div>`;
}
function closeModal(){ document.getElementById('modalRoot').innerHTML = ''; }

/* ===================== CRUD: Domains ===================== */
function showAddDomainForm(){
  document.getElementById('addDomainFormSlot').innerHTML = `
    <div class="inline-form">
      <label class="small">Domain name</label>
      <input type="text" id="newDomainName" placeholder="e.g. Finance">
      <div class="form-actions">
        <button class="btn ghost" onclick="document.getElementById('addDomainFormSlot').innerHTML=''">Cancel</button>
        <button class="btn primary" onclick="addDomain()">Add</button>
      </div>
    </div>`;
}
async function addDomain(){
  const name = document.getElementById('newDomainName').value.trim();
  if (!name) return;
  await api('add_domain', {name});
  document.getElementById('addDomainFormSlot').innerHTML='';
  loadData();
}
function openDomainModal(id){
  const d = DATA.domains.find(x=>x.id===id);
  openModal('Rename domain', `
    <label class="small">Domain name</label>
    <input type="text" id="editDomainName" value="${escapeAttr(d.name)}">
    <div class="form-actions" style="margin-top:14px;">
      <button class="btn ghost" onclick="closeModal()">Cancel</button>
      <button class="btn primary" onclick="saveDomainModal(${id})">Save</button>
    </div>`);
}
async function saveDomainModal(id){
  const name = document.getElementById('editDomainName').value.trim();
  if (!name) return;
  await api('rename_domain', {id, name});
  closeModal(); loadData();
}
async function deleteDomain(id){
  if (!confirm('Delete this domain and everything inside it?')) return;
  await api('delete_domain', {id});
  loadData();
}

/* ===================== CRUD: Tasks ===================== */
function showAddTaskForm(domainId, position='top'){
  document.querySelectorAll('[id^="add-task-form-"]').forEach(el=>el.innerHTML='');
  const slotId = position==='bottom' ? `add-task-form-bottom-${domainId}` : `add-task-form-${domainId}`;
  document.getElementById(slotId).innerHTML = `
    <div class="inline-form">
      <label class="small">Task name</label>
      <input type="text" id="newTaskName" placeholder="e.g. Linkedin post 4">
      <div class="form-row">
        <div><label class="small">Priority</label>
          <select id="newTaskPriority"><option value="high">High</option><option value="medium" selected>Medium</option><option value="low">Low</option></select>
        </div>
        <div><label class="small">Deadline (optional)</label><input type="date" id="newTaskDeadline"></div>
      </div>
      <label class="small">Tags (people)</label>
      ${chipInputHtml('newTaskTagsChip', [])}
      <div class="form-row">
        <label class="checkbox-row"><input type="checkbox" id="newTaskImportant"> Important</label>
        <label class="checkbox-row"><input type="checkbox" id="newTaskUrgent"> Urgent</label>
      </div>
      <div class="form-actions">
        <button class="btn ghost" onclick="clearAddTaskForms(${domainId})">Cancel</button>
        <button class="btn primary" onclick="addTask(${domainId})">Add</button>
      </div>
    </div>`;
}
function clearAddTaskForms(domainId){
  const a = document.getElementById(`add-task-form-${domainId}`); if (a) a.innerHTML='';
  const b = document.getElementById(`add-task-form-bottom-${domainId}`); if (b) b.innerHTML='';
}
async function addTask(domainId){
  const name = document.getElementById('newTaskName').value.trim();
  if (!name) return;
  await api('add_task', {
    domain_id: domainId, name,
    priority: document.getElementById('newTaskPriority').value,
    deadline: document.getElementById('newTaskDeadline').value,
    tags: getChipTagsForSubmit('newTaskTagsChip'),
    important: document.getElementById('newTaskImportant').checked ? 1 : 0,
    urgent: document.getElementById('newTaskUrgent').checked ? 1 : 0,
  });
  clearAddTaskForms(domainId);
  loadData();
}
function findTask(id){ for (const d of DATA.domains) for (const t of d.tasks) if (t.id==id) return t; return null; }

function openTaskModal(id){
  const t = findTask(id);
  openModal('Edit task', `
    <label class="small">Task name</label>
    <input type="text" id="mTaskName" value="${escapeAttr(t.name)}">
    <div class="form-row">
      <div><label class="small">Priority</label>
        <select id="mTaskPriority">
          <option value="high" ${t.priority==='high'?'selected':''}>High</option>
          <option value="medium" ${t.priority==='medium'?'selected':''}>Medium</option>
          <option value="low" ${t.priority==='low'?'selected':''}>Low</option>
        </select>
      </div>
      <div><label class="small">Deadline</label><input type="date" id="mTaskDeadline" value="${t.deadline||''}"></div>
    </div>
    <label class="small">Tags (people)</label>
    ${chipInputHtml('mTaskTagsChip', tagsOf(t.tags))}
    <div class="form-row">
      <label class="checkbox-row"><input type="checkbox" id="mTaskImportant" ${t.important==1?'checked':''}> Important</label>
      <label class="checkbox-row"><input type="checkbox" id="mTaskUrgent" ${t.urgent==1?'checked':''}> Urgent</label>
    </div>
    <div class="form-actions" style="margin-top:14px;">
      <button class="btn danger" onclick="deleteTask(${id}); closeModal();">Delete</button>
      <button class="btn ghost" onclick="closeModal()">Cancel</button>
      <button class="btn primary" onclick="saveTaskModal(${id})">Save</button>
    </div>`);
}
async function saveTaskModal(id){
  const name = document.getElementById('mTaskName').value.trim();
  if (!name) return;
  await api('edit_task', {
    id, name,
    priority: document.getElementById('mTaskPriority').value,
    deadline: document.getElementById('mTaskDeadline').value,
    tags: getChipTagsForSubmit('mTaskTagsChip'),
    important: document.getElementById('mTaskImportant').checked ? 1 : 0,
    urgent: document.getElementById('mTaskUrgent').checked ? 1 : 0,
  });
  closeModal(); loadData();
}
async function deleteTask(id){
  if (!confirm('Delete this task and its subtasks?')) return;
  await api('delete_task', {id});
  loadData();
}
async function toggleTaskDone(id){
  const res = await api('toggle_task_done', {id});
  if (res.status === 'done') celebrateBig();
  loadData();
}

/* ===================== Timer ===================== */
/* ===================== (timer feature removed) ===================== */

/* ===================== CRUD: Subtasks ===================== */
function tagCheckboxList(idPrefix, availableTags, selectedTags){
  if (!availableTags.length){
    return `<div class="empty" style="padding:8px; text-align:left;">This task has no tags yet &mdash; add tags on the task itself first, then they'll show up here to pick from.</div>`;
  }
  return `<div class="tag-check-list">` + availableTags.map((tag,i)=>`
    <label class="tag-check-chip">
      <input type="checkbox" id="${idPrefix}-${i}" value="${escapeAttr(tag)}" ${selectedTags.includes(tag)?'checked':''}>
      <span>#${escapeHtml(tag)}</span>
    </label>`).join('') + `</div>`;
}
function collectCheckedTags(idPrefix, availableTags){
  return availableTags.filter((tag,i)=>{
    const el = document.getElementById(`${idPrefix}-${i}`);
    return el && el.checked;
  }).join(', ');
}

function showAddSubForm(taskId, position='top'){
  document.querySelectorAll('[id^="add-sub-form-"]').forEach(el=>el.innerHTML='');
  const t = findTask(taskId);
  const taskTags = tagsOf(t.tags);
  const slotId = position==='bottom' ? `add-sub-form-bottom-${taskId}` : `add-sub-form-${taskId}`;
  document.getElementById(slotId).innerHTML = `
    <div class="inline-form">
      <label class="small">Subtask name</label>
      <input type="text" id="newSubName" placeholder="e.g. Post 3">
      <div class="form-row">
        <div><label class="small">Deadline</label><input type="date" id="newSubDate"></div>
        <div><label class="small">Priority</label>
          <select id="newSubPriority"><option value="high">High</option><option value="medium" selected>Medium</option><option value="low">Low</option></select>
        </div>
      </div>
      <label class="small">Tags &mdash; from this task's tags</label>
      ${tagCheckboxList('newSubTag', taskTags, [])}
      <div class="form-actions">
        <button class="btn ghost" onclick="clearAddSubForms(${taskId})">Cancel</button>
        <button class="btn primary" onclick="addSubtask(${taskId})">Add</button>
      </div>
    </div>`;
  window['_taskTags_'+taskId] = taskTags;
}
function clearAddSubForms(taskId){
  const a = document.getElementById(`add-sub-form-${taskId}`); if (a) a.innerHTML='';
  const b = document.getElementById(`add-sub-form-bottom-${taskId}`); if (b) b.innerHTML='';
}
async function addSubtask(taskId){
  const name = document.getElementById('newSubName').value.trim();
  if (!name) return;
  const taskTags = window['_taskTags_'+taskId] || [];
  await api('add_subtask', {
    task_id: taskId, name,
    deadline: document.getElementById('newSubDate').value,
    priority: document.getElementById('newSubPriority').value,
    tags: collectCheckedTags('newSubTag', taskTags),
  });
  clearAddSubForms(taskId);
  loadData();
}
function showBulkAddSubForm(taskId, position='top'){
  document.querySelectorAll('[id^="add-sub-form-"]').forEach(el=>el.innerHTML='');
  const t = findTask(taskId);
  const taskTags = tagsOf(t.tags);
  const slotId = position==='bottom' ? `add-sub-form-bottom-${taskId}` : `add-sub-form-${taskId}`;
  document.getElementById(slotId).innerHTML = `
    <div class="inline-form">
      <label class="small">One subtask per line</label>
      <textarea id="bulkSubNames" rows="5" placeholder="Listing 1&#10;Listing 2&#10;Listing 3"></textarea>
      <div class="form-row">
        <div><label class="small">Shared deadline (optional)</label><input type="date" id="bulkSubDate"></div>
        <div><label class="small">Shared priority</label>
          <select id="bulkSubPriority"><option value="high">High</option><option value="medium" selected>Medium</option><option value="low">Low</option></select>
        </div>
      </div>
      <label class="small">Shared tags &mdash; from this task's tags</label>
      ${tagCheckboxList('bulkSubTag', taskTags, [])}
      <div class="form-actions">
        <button class="btn ghost" onclick="clearAddSubForms(${taskId})">Cancel</button>
        <button class="btn primary" onclick="bulkAddSubtasks(${taskId})">Add all</button>
      </div>
    </div>`;
  window['_taskTags_'+taskId] = taskTags;
}
async function bulkAddSubtasks(taskId){
  const namesRaw = document.getElementById('bulkSubNames').value;
  if (!namesRaw.trim()) return;
  const taskTags = window['_taskTags_'+taskId] || [];
  const res = await api('bulk_add_subtasks', {
    task_id: taskId, names: namesRaw,
    deadline: document.getElementById('bulkSubDate').value,
    priority: document.getElementById('bulkSubPriority').value,
    tags: collectCheckedTags('bulkSubTag', taskTags),
  });
  if (!res.ok) return;
  clearAddSubForms(taskId);
  loadData();
}
function findSubtaskAndParent(id){
  for (const d of DATA.domains) for (const t of d.tasks) for (const s of t.subtasks) if (s.id==id) return {s, t};
  return {s:null, t:null};
}
function openSubtaskModal(id){
  const {s, t} = findSubtaskAndParent(id);
  const taskTags = tagsOf(t.tags);
  const selected = tagsOf(s.tags);
  openModal('Edit subtask', `
    <label class="small">Subtask name</label>
    <input type="text" id="mSubName" value="${escapeAttr(s.name)}">
    <div class="form-row">
      <div><label class="small">Deadline</label><input type="date" id="mSubDate" value="${s.deadline||''}"></div>
      <div><label class="small">Priority</label>
        <select id="mSubPriority">
          <option value="high" ${s.priority==='high'?'selected':''}>High</option>
          <option value="medium" ${s.priority==='medium'?'selected':''}>Medium</option>
          <option value="low" ${s.priority==='low'?'selected':''}>Low</option>
        </select>
      </div>
    </div>
    <label class="small">Tags &mdash; from parent task's tags</label>
    ${tagCheckboxList('mSubTag', taskTags, selected)}
    <div class="form-actions" style="margin-top:14px;">
      <button class="btn danger" onclick="deleteSubtask(${id}); closeModal();">Delete</button>
      <button class="btn ghost" onclick="closeModal()">Cancel</button>
      <button class="btn primary" onclick="saveSubtaskModal(${id})">Save</button>
    </div>`);
  window['_subTaskTags_'+id] = taskTags;
}
async function saveSubtaskModal(id){
  const name = document.getElementById('mSubName').value.trim();
  if (!name) return;
  const taskTags = window['_subTaskTags_'+id] || [];
  await api('edit_subtask', {
    id, name,
    deadline: document.getElementById('mSubDate').value,
    priority: document.getElementById('mSubPriority').value,
    tags: collectCheckedTags('mSubTag', taskTags),
  });
  closeModal(); loadData();
}
async function deleteSubtask(id){
  if (!confirm('Delete this subtask?')) return;
  await api('delete_subtask', {id});
  loadData();
}
async function toggleSubDone(id){
  const res = await api('toggle_subtask_done', {id});
  if (res.done) {
    celebrateSmall();
    if (res.task_auto_completed) setTimeout(celebrateBig, 300);
  }
  loadData();
}

/* ===================== Recurring tasks ===================== */
function renderRecurring(){
  const root = document.getElementById('recurringRoot');
  if (!DATA.recurring.length){ root.innerHTML = `<div class="empty">No recurring tasks set up yet.</div>`; return; }
  const wdNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  root.innerHTML = DATA.recurring.map(r=>{
    const domain = DATA.domains.find(d=>d.id==r.domain_id);
    let freqLabel;
    if (r.frequency==='daily') freqLabel = 'Daily';
    else {
      const days = (r.weekday||'').split(',').map(x=>x.trim()).filter(Boolean).map(n=>wdNames[parseInt(n,10)]);
      freqLabel = days.length ? days.join(', ') : 'Weekly';
    }
    const parentTask = r.task_id ? findTask(r.task_id) : null;
    const targetLabel = parentTask ? `subtask under &ldquo;${escapeHtml(parentTask.name)}&rdquo;` : `new task in ${domain?escapeHtml(domain.name):'-'}`;
    const iu = (!parentTask && (r.important==1 || r.urgent==1)) ?
      ` &middot; ${[r.important==1?'Important':null, r.urgent==1?'Urgent':null].filter(Boolean).join('/')}` : '';
    const streakBadge = r.streak > 0 ? `<span class="streak-badge">&#128293; ${r.streak}-day streak</span>` : '';
    return `<div class="mini-card">
      <div class="info">
        <div class="title">${escapeHtml(r.name)} ${streakBadge}</div>
        <div class="sub">${freqLabel} &middot; ${targetLabel} &middot; ${r.priority}${iu}</div>
      </div>
      <button class="btn small ${r.active==1?'':'ghost'}" onclick="toggleRecurring(${r.id})">${r.active==1?'Active':'Paused'}</button>
      <button class="icon-btn-sm" onclick="deleteRecurring(${r.id})">&times;</button>
    </div>`;
  }).join('');
}
function allTasksFlat(){
  const list = [];
  DATA.domains.forEach(d=>d.tasks.forEach(t=>{ if(t.status!=='done') list.push({id:t.id, domainId:d.id, label:`${d.name} \u203a ${t.name}`}); }));
  return list;
}
function showAddRecurringForm(){
  const domainOptions = DATA.domains.map(d=>`<option value="${d.id}">${escapeHtml(d.name)}</option>`).join('');
  const taskOptions = allTasksFlat().map(t=>`<option value="${t.id}" data-domain="${t.domainId}">${escapeHtml(t.label)}</option>`).join('');
  const wdNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  document.getElementById('addRecurringFormSlot').innerHTML = `
    <div class="inline-form">
      <label class="small">Habit / recurring item name</label>
      <input type="text" id="newRecName" placeholder="e.g. Eye exercises, or LinkedIn post">
      <label class="small">Applies to</label>
      <select id="newRecMode" onchange="onRecModeChange()">
        <option value="task">A brand-new task, each time</option>
        <option value="subtask">A subtask under an existing task (e.g. weekly LinkedIn post)</option>
      </select>
      <div id="newRecDomainWrap">
        <label class="small">Domain</label><select id="newRecDomain">${domainOptions}</select>
      </div>
      <div id="newRecTaskWrap" style="display:none">
        <label class="small">Existing task</label><select id="newRecTask">${taskOptions}</select>
      </div>
      <label class="small">Repeats on</label>
      <div class="weekday-picker">
        ${wdNames.map((label,i)=>`
          <label class="weekday-chip">
            <input type="checkbox" class="rec-weekday-cb" value="${i}" ${i>=1&&i<=5?'checked':''}>
            <span>${label}</span>
          </label>`).join('')}
      </div>
      <div class="form-row" style="margin-top:2px;">
        <button type="button" class="btn small ghost" onclick="setAllWeekdays(true)">Every day</button>
        <button type="button" class="btn small ghost" onclick="setAllWeekdays(false)">Clear</button>
      </div>
      <div class="form-row" id="newRecImportantUrgentWrap">
        <label class="checkbox-row"><input type="checkbox" id="newRecImportant"> Important</label>
        <label class="checkbox-row"><input type="checkbox" id="newRecUrgent"> Urgent</label>
      </div>
      <label class="small">Priority</label>
      <select id="newRecPriority"><option value="high">High</option><option value="medium" selected>Medium</option><option value="low">Low</option></select>
      <div class="form-actions">
        <button class="btn ghost" onclick="document.getElementById('addRecurringFormSlot').innerHTML=''">Cancel</button>
        <button class="btn primary" onclick="addRecurring()">Add</button>
      </div>
    </div>`;
}
function setAllWeekdays(on){
  document.querySelectorAll('.rec-weekday-cb').forEach(cb=>cb.checked=on);
}
function onRecModeChange(){
  const mode = document.getElementById('newRecMode').value;
  document.getElementById('newRecDomainWrap').style.display = mode==='task' ? 'block' : 'none';
  document.getElementById('newRecTaskWrap').style.display = mode==='subtask' ? 'block' : 'none';
  document.getElementById('newRecImportantUrgentWrap').style.display = mode==='task' ? 'flex' : 'none';
}
async function addRecurring(){
  const name = document.getElementById('newRecName').value.trim();
  if (!name) return;
  const mode = document.getElementById('newRecMode').value;
  let domainId, taskId = '';
  if (mode === 'subtask'){
    const taskSel = document.getElementById('newRecTask');
    if (!taskSel.value){ alert('Add at least one task first, then come back to attach a recurring subtask to it.'); return; }
    taskId = taskSel.value;
    domainId = taskSel.selectedOptions[0].dataset.domain;
  } else {
    domainId = document.getElementById('newRecDomain').value;
  }
  const checked = Array.from(document.querySelectorAll('.rec-weekday-cb:checked')).map(cb=>cb.value);
  if (checked.length === 0){ alert('Pick at least one day of the week.'); return; }
  const frequency = checked.length === 7 ? 'daily' : 'weekly';
  const weekdaysStr = frequency === 'weekly' ? checked.join(',') : '';
  await api('add_recurring', {
    name, domain_id: domainId, task_id: taskId,
    frequency, weekdays: weekdaysStr,
    priority: document.getElementById('newRecPriority').value,
    important: (mode==='task' && document.getElementById('newRecImportant').checked) ? 1 : 0,
    urgent: (mode==='task' && document.getElementById('newRecUrgent').checked) ? 1 : 0,
  });
  document.getElementById('addRecurringFormSlot').innerHTML='';
  loadData();
}
async function toggleRecurring(id){ await api('toggle_recurring_active', {id}); loadData(); }
async function deleteRecurring(id){ if(!confirm('Delete this recurring task template?')) return; await api('delete_recurring', {id}); loadData(); }

/* ===================== Goals ===================== */
let goalsTab = 'annual';
let goalsYear = null, goalsQuarter = null, goalsMonth = null;
let collapsedGoals = {};
let lastGoalsRenderKey = null;

function initGoalsDefaults(){
  if (goalsYear !== null) return;
  const d = new Date((SERVER_TODAY||new Date().toISOString().slice(0,10))+'T00:00:00');
  goalsYear = d.getFullYear();
  goalsQuarter = Math.floor(d.getMonth()/3)+1;
  goalsMonth = {year: d.getFullYear(), month: d.getMonth()+1};
}
function setGoalsTab(tab){ goalsTab = tab; render(); }
function shiftGoalsYear(delta){ goalsYear += delta; render(); }
function setGoalsQuarter(q){ goalsQuarter = q; render(); }
function shiftGoalsMonth(delta){
  let {year, month} = goalsMonth;
  month += delta;
  if (month<1){ month=12; year--; }
  if (month>12){ month=1; year++; }
  goalsMonth = {year, month};
  render();
}
function goalsMonthToday(){
  const d = new Date((SERVER_TODAY||new Date().toISOString().slice(0,10))+'T00:00:00');
  goalsMonth = {year: d.getFullYear(), month: d.getMonth()+1};
  render();
}
function toggleGoalCollapse(id){ collapsedGoals[id] = !collapsedGoals[id]; render(); }

function goalsOfType(type){
  return (DATA.goals||[]).filter(g=>{
    if (g.type !== type) return false;
    if (type==='annual') return g.year == goalsYear;
    if (type==='quarterly') return g.year == goalsYear && g.quarter == goalsQuarter;
    if (type==='monthly') return g.year == goalsMonth.year && g.month == goalsMonth.month;
    return true;
  });
}

function renderGoalWithItems(g){
  const collapsed = !!collapsedGoals[g.id];
  const progress = g.progress;
  return `<div class="goal-card">
    <div class="goal-card-head" onclick="toggleGoalCollapse(${g.id})">
      <span class="chev ${collapsed?'':'open'}"></span>
      <span class="goal-title">${escapeHtml(g.title)}</span>
      <span class="goal-progress-label">${progress===null?'no sub-goals yet':progress+'%'}</span>
      <span class="goal-actions" onclick="event.stopPropagation()">
        <button class="icon-btn-sm" onclick="showAddGoalItemForm(${g.id})" title="Add sub-goal">+</button>
        <button class="icon-btn-sm" onclick="openGoalEditModal(${g.id})" title="Edit">&#9998;</button>
        <button class="icon-btn-sm" onclick="deleteGoal(${g.id})" title="Delete">&times;</button>
      </span>
    </div>
    ${progress!==null?`<div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div>`:''}
    <div class="goal-card-body ${collapsed?'hidden':''}">
      <div id="add-goal-item-form-${g.id}"></div>
      ${g.items.length? g.items.map(it=>`
        <div class="goal-item-row ${it.done==1?'done':''}">
          <input type="checkbox" class="sub-check" ${it.done==1?'checked':''} onchange="toggleGoalItem(${it.id})">
          <span class="goal-item-name">${escapeHtml(it.name)}</span>
          <button class="icon-btn-sm" onclick="deleteGoalItem(${it.id})">&times;</button>
        </div>`).join('') : `<div class="empty" style="padding:6px 0;font-size:11px;">No sub-goals yet.</div>`}
      <button class="add-sub-btn" onclick="showAddGoalItemForm(${g.id})">+ Add sub-goal</button>
    </div>
  </div>`;
}

function renderAnnualGoals(){
  const goals = goalsOfType('annual');
  return `
    <div class="goal-year-nav">
      <button class="btn small ghost" onclick="shiftGoalsYear(-1)">&lsaquo; ${goalsYear-1}</button>
      <span class="goal-year-label">${goalsYear}</span>
      <button class="btn small ghost" onclick="shiftGoalsYear(1)">${goalsYear+1} &rsaquo;</button>
    </div>
    <div id="addGoalFormSlot-annual"></div>
    <button class="add-task-btn" onclick="showAddGoalForm('annual')">+ Add annual goal</button>
    ${goals.length? goals.map(renderGoalWithItems).join('') : `<div class="empty">No annual goals for ${goalsYear} yet.</div>`}
  `;
}
function renderQuarterlyGoals(){
  const goals = goalsOfType('quarterly');
  return `
    <div class="goal-year-nav">
      <button class="btn small ghost" onclick="shiftGoalsYear(-1)">&lsaquo;</button>
      <span class="goal-year-label">${goalsYear}</span>
      <button class="btn small ghost" onclick="shiftGoalsYear(1)">&rsaquo;</button>
    </div>
    <div class="quarter-tabs">
      ${[1,2,3,4].map(q=>`<button class="quarter-tab ${goalsQuarter===q?'active':''}" onclick="setGoalsQuarter(${q})">Q${q}</button>`).join('')}
    </div>
    <div id="addGoalFormSlot-quarterly"></div>
    <button class="add-task-btn" onclick="showAddGoalForm('quarterly')">+ Add Q${goalsQuarter} goal</button>
    ${goals.length? goals.map(renderGoalWithItems).join('') : `<div class="empty">No goals for Q${goalsQuarter} ${goalsYear} yet.</div>`}
  `;
}
function renderMonthlyGoals(){
  const goals = goalsOfType('monthly');
  const label = new Date(goalsMonth.year, goalsMonth.month-1, 1).toLocaleDateString(undefined,{month:'long', year:'numeric'});
  return `
    <div class="goal-year-nav">
      <button class="btn small ghost" onclick="shiftGoalsMonth(-1)">&lsaquo; Prev</button>
      <span class="goal-year-label">${label}</span>
      <button class="btn small ghost" onclick="goalsMonthToday()">This month</button>
      <button class="btn small ghost" onclick="shiftGoalsMonth(1)">Next &rsaquo;</button>
    </div>
    <div id="addGoalFormSlot-monthly"></div>
    <button class="add-task-btn" onclick="showAddGoalForm('monthly')">+ Add goal for ${label}</button>
    ${goals.length? goals.map(g=>`
      <div class="goal-item-row ${g.done==1?'done':''}">
        <input type="checkbox" class="sub-check" ${g.done==1?'checked':''} onchange="toggleGoalDone(${g.id})">
        <span class="goal-item-name">${escapeHtml(g.title)}</span>
        <button class="icon-btn-sm" onclick="deleteGoal(${g.id})">&times;</button>
      </div>`).join('') : `<div class="empty">No goals for ${label} yet.</div>`}
  `;
}

function renderGoals(){
  initGoalsDefaults();
  const root = document.getElementById('goalsRoot');
  const tabsHtml = `<div class="goal-tabs">
    ${['annual','quarterly','monthly'].map(t=>`<button class="goal-tab ${goalsTab===t?'active':''}" onclick="setGoalsTab('${t}')">${t.charAt(0).toUpperCase()+t.slice(1)}</button>`).join('')}
  </div>`;
  let body = '';
  if (goalsTab === 'annual') body = renderAnnualGoals();
  else if (goalsTab === 'quarterly') body = renderQuarterlyGoals();
  else body = renderMonthlyGoals();

  const key = goalsTab + (goalsTab==='quarterly'?('-'+goalsYear+'-'+goalsQuarter):'') + (goalsTab==='monthly'?('-'+goalsMonth.year+'-'+goalsMonth.month):('-'+goalsYear));
  const animate = key !== lastGoalsRenderKey;
  lastGoalsRenderKey = key;
  root.innerHTML = tabsHtml + `<div class="goal-tab-body ${animate?'':'no-anim'}">${body}</div>`;
}

function showAddGoalForm(type){
  const slotId = `addGoalFormSlot-${type}`;
  const slot = document.getElementById(slotId);
  if (!slot) return;
  slot.innerHTML = `
    <div class="inline-form">
      <label class="small">Goal title</label>
      <input type="text" id="newGoalTitle-${type}" placeholder="e.g. Grow PCA Marketing">
      ${type!=='monthly'?`<label class="small">Target date (optional)</label><input type="date" id="newGoalDate-${type}">`:''}
      <div class="form-actions">
        <button class="btn ghost" onclick="document.getElementById('${slotId}').innerHTML=''">Cancel</button>
        <button class="btn primary" onclick="addGoal('${type}')">Add</button>
      </div>
    </div>`;
}
async function addGoal(type){
  const titleEl = document.getElementById(`newGoalTitle-${type}`);
  const title = titleEl.value.trim();
  if (!title) return;
  const params = {title, type};
  if (type==='annual') params.year = goalsYear;
  if (type==='quarterly') { params.year = goalsYear; params.quarter = goalsQuarter; }
  if (type==='monthly') { params.year = goalsMonth.year; params.month = goalsMonth.month; }
  const dateEl = document.getElementById(`newGoalDate-${type}`);
  if (dateEl) params.target_date = dateEl.value;
  await api('add_goal', params);
  document.getElementById(`addGoalFormSlot-${type}`).innerHTML='';
  loadData();
}
function showAddGoalItemForm(goalId){
  document.querySelectorAll('[id^="add-goal-item-form-"]').forEach(el=>el.innerHTML='');
  document.getElementById(`add-goal-item-form-${goalId}`).innerHTML = `
    <div class="inline-form">
      <label class="small">Sub-goal name</label>
      <input type="text" id="newGoalItemName-${goalId}">
      <div class="form-actions">
        <button class="btn ghost" onclick="document.getElementById('add-goal-item-form-${goalId}').innerHTML=''">Cancel</button>
        <button class="btn primary" onclick="addGoalItem(${goalId})">Add</button>
      </div>
    </div>`;
}
async function addGoalItem(goalId){
  const el = document.getElementById(`newGoalItemName-${goalId}`);
  const name = el.value.trim();
  if (!name) return;
  await api('add_goal_item', {goal_id: goalId, name});
  document.getElementById(`add-goal-item-form-${goalId}`).innerHTML='';
  loadData();
}
async function toggleGoalItem(id){ await api('toggle_goal_item', {id}); loadData(); }
async function deleteGoalItem(id){ if(!confirm('Delete this sub-goal?')) return; await api('delete_goal_item', {id}); loadData(); }
async function toggleGoalDone(id){ await api('toggle_goal_done', {id}); loadData(); }
function openGoalEditModal(id){
  const g = (DATA.goals||[]).find(x=>x.id==id);
  if (!g) return;
  openModal('Edit goal', `
    <label class="small">Goal title</label>
    <input type="text" id="mGoalTitle" value="${escapeAttr(g.title)}">
    <label class="small">Target date</label>
    <input type="date" id="mGoalDate" value="${g.target_date||''}">
    <div class="form-actions" style="margin-top:14px;">
      <button class="btn danger" onclick="deleteGoal(${id}); closeModal();">Delete</button>
      <button class="btn ghost" onclick="closeModal()">Cancel</button>
      <button class="btn primary" onclick="saveGoalEditModal(${id})">Save</button>
    </div>`);
}
async function saveGoalEditModal(id){
  const title = document.getElementById('mGoalTitle').value.trim();
  const g = (DATA.goals||[]).find(x=>x.id==id);
  await api('edit_goal', { id, title: title||g.title, target_date: document.getElementById('mGoalDate').value, notes: g.notes||'' });
  closeModal(); loadData();
}
async function deleteGoal(id){ if(!confirm('Delete this goal? Its sub-goals will be deleted too.')) return; await api('delete_goal', {id}); loadData(); }

/* ===================== Eisenhower matrix ===================== */
function jumpToTaskGeneric(taskId){
  currentView = 'all';
  render();
  setTimeout(()=>jumpToTask(taskId), 60);
}
function renderMatrix(){
  const quads = {do:[], plan:[], delegate:[], drop:[]};
  DATA.domains.forEach(d=>d.tasks.forEach(t=>{ if(t.status!=='done') quads[t.quadrant.key].push(t); }));
  const labels = {do:'Do now', plan:'Plan it', delegate:'Delegate', drop:'Drop / later'};
  document.getElementById('matrixRoot').innerHTML = `<div class="matrix-grid">` +
    Object.keys(quads).map(k=>`
      <div class="matrix-quad ${k}">
        <h3>${labels[k]}</h3>
        ${quads[k].length? quads[k].map(t=>`<button type="button" class="matrix-item" onclick="jumpToTaskGeneric(${t.id})">${escapeHtml(t.name)}</button>`).join('') : `<div class="matrix-item matrix-empty" style="opacity:.5;">Nothing here</div>`}
      </div>`).join('') + `</div>`;
}

/* ===================== Calendar ===================== */
let calView = new Date(); calView.setDate(1);
let calViewSynced = false;
let selectedCalDate = null;

document.getElementById('calendarToggleBtn').addEventListener('click', ()=>{
  const panel = document.getElementById('calendarPanel');
  panel.classList.toggle('hidden');
  if (!panel.classList.contains('hidden')) renderCalendar();
});
document.getElementById('homeBtn').addEventListener('click', ()=>{
  document.getElementById('calendarPanel').classList.add('hidden');
  selectedCalDate = null;
  window.scrollTo({top:0, behavior:'smooth'});
});

function buildCalendarIndex(){
  const idx = {};
  DATA.domains.forEach(d=>d.tasks.forEach(t=>{
    if (t.status==='done') return;
    if (t.subtasks.length===0 && t.deadline){
      const day = idx[t.deadline] = idx[t.deadline] || {taskIds:new Set(), items:[]};
      day.taskIds.add(t.id);
      day.items.push({taskId:t.id, taskName:t.name, domainName:d.name, priority:t.priority, kind:'task'});
    }
    t.subtasks.forEach(s=>{
      if (s.done==1 || !s.deadline) return;
      const day = idx[s.deadline] = idx[s.deadline] || {taskIds:new Set(), items:[]};
      day.taskIds.add(t.id);
      day.items.push({taskId:t.id, taskName:t.name, domainName:d.name, subtaskId:s.id, subtaskName:s.name, priority:s.priority, kind:'subtask'});
    });
  }));
  return idx;
}

function templateFiresOnWeekday(tpl, weekday){
  if (tpl.active != 1) return false;
  if (tpl.frequency === 'daily') return true;
  const days = (tpl.weekday||'').split(',').map(x=>parseInt(x.trim(),10)).filter(n=>!isNaN(n));
  return days.includes(weekday);
}
function ghostsForDate(dateStr){
  // Only project onto days strictly after "today" -- today's real instance is
  // already generated server-side, so a ghost there would just be a duplicate.
  if (!SERVER_TODAY || dateStr <= SERVER_TODAY) return [];
  const [y,m,d] = dateStr.split('-').map(Number);
  const weekday = new Date(y, m-1, d).getDay();
  return (DATA.recurring||[]).filter(r=>templateFiresOnWeekday(r, weekday));
}

function calendarShift(delta){ calView.setMonth(calView.getMonth()+delta); renderCalendar(); }
function calendarGoToday(){
  const ref = SERVER_TODAY ? new Date(SERVER_TODAY+'T00:00:00') : new Date();
  calView = new Date(ref.getFullYear(), ref.getMonth(), 1);
  selectedCalDate = SERVER_TODAY || ref.toISOString().slice(0,10);
  renderCalendar();
}
function onCalendarDayClick(dateStr){ selectedCalDate = (selectedCalDate===dateStr) ? null : dateStr; renderCalendar(); }
function jumpToTaskFromCalendar(taskId){
  document.getElementById('calendarPanel').classList.add('hidden');
  jumpToTaskGeneric(taskId);
}

function renderCalDayDetail(dateStr, idx){
  const info = idx[dateStr];
  const ghosts = ghostsForDate(dateStr);
  const label = new Date(dateStr+'T00:00:00').toLocaleDateString(undefined,{weekday:'long', month:'long', day:'numeric'});
  if (!info && ghosts.length===0) return `<div class="cal-day-detail"><div class="cal-day-title">${label}</div><div class="empty" style="padding:10px 0;">Nothing due this day.</div></div>`;
  let html = `<div class="cal-day-detail"><div class="cal-day-title">${label}`;
  if (info) html += ` &middot; ${info.taskIds.size} task${info.taskIds.size===1?'':'s'}, ${info.items.length} item${info.items.length===1?'':'s'}`;
  html += `</div>`;
  if (info) html += info.items.map(it=>`
      <button class="cal-day-item" onclick="jumpToTaskFromCalendar(${it.taskId})">
        <span class="prio-dot ${it.priority}"></span>
        <span class="cal-day-item-name">${escapeHtml(it.kind==='subtask' ? it.subtaskName : it.taskName)}</span>
        <span class="cal-day-item-meta">${escapeHtml(it.domainName)}${it.kind==='subtask'?' &rsaquo; '+escapeHtml(it.taskName):''}</span>
      </button>`).join('');
  if (ghosts.length){
    html += `<div class="cal-ghost-heading">Projected from recurring &mdash; created automatically when this day arrives</div>`;
    html += ghosts.map(g=>`<div class="cal-ghost-item"><span class="prio-dot ${g.priority}"></span>${escapeHtml(g.name)}</div>`).join('');
  }
  html += `</div>`;
  return html;
}

function renderCalendar(){
  const panel = document.getElementById('calendarPanel');
  const year = calView.getFullYear(), month = calView.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const startWeekday = firstDay.getDay();
  const todayStr = SERVER_TODAY || new Date().toISOString().slice(0,10);
  const idx = buildCalendarIndex();

  let cells = '';
  const weekdayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  for (let i=0;i<startWeekday;i++) cells += `<div class="cal-cell empty-cell" style="visibility:hidden"></div>`;
  for (let day=1; day<=daysInMonth; day++){
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const info = idx[dateStr];
    const ghostCount = ghostsForDate(dateStr).length;
    const isToday = dateStr===todayStr;
    const isSelected = dateStr===selectedCalDate;
    const countLabel = info ? `<span class="cal-count">${info.taskIds.size}t&middot;${info.items.length}i</span>` : '';
    const ghostLabel = ghostCount ? `<span class="cal-ghost">+${ghostCount}</span>` : '';
    cells += `<button type="button" class="cal-cell ${isToday?'today-cell':''} ${isSelected?'selected-cell':''} ${(info||ghostCount)?'has-items':''}" onclick="onCalendarDayClick('${dateStr}')">
      <span class="cal-daynum">${day}</span>${countLabel}${ghostLabel}
    </button>`;
  }
  panel.innerHTML = `
    <div class="cal-nav">
      <button class="btn small ghost" onclick="calendarShift(-1)">&lsaquo; Prev</button>
      <h2 class="cal-month-title">${firstDay.toLocaleDateString(undefined,{month:'long',year:'numeric'})}</h2>
      <button class="btn small ghost" onclick="calendarGoToday()">Today</button>
      <button class="btn small ghost" onclick="calendarShift(1)">Next &rsaquo;</button>
    </div>
    <div class="cal-grid">${weekdayNames.map(w=>`<div class="cal-weekday">${w}</div>`).join('')}${cells}</div>
    <div class="cal-legend">Solid dot = real item &middot; <span class="cal-ghost-inline">+N</span> = projected from a recurring task, not created yet</div>
    <div id="calDayDetail">${selectedCalDate ? renderCalDayDetail(selectedCalDate, idx) : `<div class="empty" style="padding:10px 0;">Tap a day to see what's due (or projected).</div>`}</div>
  `;
}

/* ===================== Celebration: gold seal + restrained confetti ===================== */
function celebrateSmall(){ spawnConfetti(10); }
function celebrateBig(){
  spawnConfetti(36);
  const seal = document.createElement('div');
  seal.className = 'seal-stamp';
  seal.innerHTML = '<span>TASK<br>COMPLETE</span>';
  document.getElementById('celebrationLayer').appendChild(seal);
  setTimeout(()=>seal.remove(), 1700);
}
function spawnConfetti(n){
  const layer = document.getElementById('celebrationLayer');
  const colors = ['#D9531E','#D9A017','#4C8557','#2A6FA3','#7A4F82'];
  for (let i=0;i<n;i++){
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.left = Math.random()*100 + 'vw';
    p.style.top = '-10px';
    p.style.background = colors[Math.floor(Math.random()*colors.length)];
    p.style.animationDelay = (Math.random()*0.3)+'s';
    layer.appendChild(p);
    setTimeout(()=>p.remove(), 1900);
  }
}

/* ===================== Helpers ===================== */
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function escapeAttr(s){ return escapeHtml(s).replace(/'/g,'&#39;'); }

/* ===================== Boot ===================== */
loadData();
setInterval(()=>{ if(!anythingOpenRightNow()) loadData(); }, 60000);
