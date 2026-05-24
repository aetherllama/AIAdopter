/* ============================================================
   playbook.js — Personalized Playbook Renderer
   Reads localStorage, renders from data/playbook.json + use-cases.json
   ============================================================ */

const STORAGE_KEY = 'ai_adopter_scores';
const PLAYBOOK_URL = 'data/playbook.json';
const USECASES_URL = 'data/use-cases.json';

const STAGE_META = {
  1: { label: 'Exploring',     cls: 'stage-1', color: '#64748b' },
  2: { label: 'Experimenting', cls: 'stage-2', color: '#f59e0b' },
  3: { label: 'Scaling',       cls: 'stage-3', color: '#10b981' },
  4: { label: 'Transforming',  cls: 'stage-4', color: '#3b82f6' },
};

const EFFORT_TAGS = {
  'Quick Win': 'tag-quickwin',
  'Medium':    'tag-medium',
  'Strategic': 'tag-strategic',
};

const IMPACT_TAGS = {
  'High':   'tag-high',
  'Medium': 'tag-medium-impact',
};

const BIZ_CLASSES = {
  'Lending':    'biz-lending',
  'Risk':       'biz-risk',
  'Fraud':      'biz-fraud',
  'Compliance': 'biz-compliance',
  'Trading':    'biz-trading',
  'Customer':   'biz-customer',
  'Operations': 'biz-operations',
};

const STATUS_CLASSES = {
  'live':     'status-live',
  'pilot':    'status-pilot',
  'emerging': 'status-emerging',
};

const STATUS_LABELS = { live: 'Live', pilot: 'Pilot', emerging: 'Emerging' };

async function init() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    document.getElementById('playbook-content').innerHTML = `
      <div class="empty-state">
        <div class="icon">◈</div>
        <p>No assessment results found. Complete the self-assessment to generate your playbook.</p>
        <a href="assessment.html" class="btn btn-primary">Start Assessment</a>
      </div>`;
    return;
  }

  const scores = JSON.parse(raw);
  const stage = scores.stage;
  const stageKey = getStageKey(stage);

  try {
    const [playbookData, useCasesData] = await Promise.all([
      fetch(PLAYBOOK_URL).then(r => r.json()),
      fetch(USECASES_URL).then(r => r.json()),
    ]);

    const pb = playbookData.stages[stageKey];
    const filteredCases = filterUseCases(useCasesData, pb.useCaseFilters);

    renderHeader(scores, pb);
    renderActions(pb.actions);
    renderUseCases(filteredCases);
    renderGovernance(pb.governance);
    renderDimDeepDives(scores, pb.dimDeepDives);

  } catch (e) {
    console.error(e);
    document.getElementById('playbook-content').innerHTML =
      `<div class="empty-state"><div class="icon">⚠</div><p>Failed to load playbook data. Please refresh.</p></div>`;
  }
}

function getStageKey(stage) {
  if (stage === 4) return '4_maintain';
  return `${stage}_to_${stage + 1}`;
}

function filterUseCases(cases, filters) {
  return cases.filter(c =>
    filters.stage.includes(c.stage) &&
    (filters.lines.length === 0 || filters.lines.includes(c.businessLine))
  ).slice(0, 8);
}

// ---- Header ----
function renderHeader(scores, pb) {
  const fromMeta = STAGE_META[pb.fromStage];
  const toMeta   = STAGE_META[pb.toStage];
  const date = scores.completedAt
    ? new Date(scores.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Today';

  document.getElementById('playbook-header').innerHTML = `
    <div class="playbook-header">
      <div>
        <div class="playbook-path">
          <span class="stage-badge ${fromMeta.cls}">Stage ${pb.fromStage}: ${pb.fromLabel}</span>
          <span class="playbook-path-arrow">→</span>
          ${pb.fromStage !== pb.toStage
            ? `<span class="stage-badge ${toMeta.cls}">Stage ${pb.toStage}: ${pb.toLabel}</span>`
            : `<span class="stage-badge ${toMeta.cls}">Sustain Leadership</span>`}
        </div>
        <p style="font-size:13px;color:var(--muted2);margin-top:12px;max-width:640px">${pb.summary}</p>
        <p style="font-size:11px;color:var(--muted);margin-top:8px">Assessment completed ${date} · Score: ${scores.total}/100</p>
      </div>
      <div class="no-print" style="display:flex;gap:10px;flex-shrink:0">
        <button class="btn btn-secondary btn-sm" onclick="window.print()">⬇ Export PDF</button>
        <a href="results.html" class="btn btn-ghost btn-sm">← View Results</a>
      </div>
    </div>
  `;
}

// ---- Actions ----
function renderActions(actions) {
  document.getElementById('actions-section').innerHTML = `
    <div class="section-header">
      <div>
        <div class="section-title">Priority Actions</div>
        <div class="section-sub">Ranked by impact for your current stage gap</div>
      </div>
    </div>
    <div class="grid-2">
      ${actions.map((a, i) => `
        <div class="action-card">
          <div class="action-card-header">
            <div class="action-number">${i + 1}</div>
            <div class="action-title">${a.title}</div>
          </div>
          <div class="action-tags">
            <span class="tag ${EFFORT_TAGS[a.effort] || 'tag-medium'}">${a.effort}</span>
            <span class="tag ${IMPACT_TAGS[a.impact] || 'tag-high'}">Impact: ${a.impact}</span>
          </div>
          <div class="action-desc">${a.description}</div>
        </div>
      `).join('')}
    </div>
  `;
}

// ---- Use Cases ----
function renderUseCases(cases) {
  document.getElementById('usecases-section').innerHTML = `
    <div class="section-header">
      <div>
        <div class="section-title">Recommended AI Use Cases</div>
        <div class="section-sub">Proven at peer financial institutions at your target maturity stage</div>
      </div>
    </div>
    <div class="grid-3">
      ${cases.map(c => `
        <div class="use-case-card">
          <div class="use-case-title">${c.title}</div>
          <div class="use-case-meta">
            <span class="biz-badge ${BIZ_CLASSES[c.businessLine] || ''}">${c.businessLine}</span>
            <span class="status-badge ${STATUS_CLASSES[c.status]}">${STATUS_LABELS[c.status]}</span>
            <span class="stage-badge stage-${c.stage}" style="font-size:10px;padding:2px 8px">Stage ${c.stage}</span>
          </div>
          <div class="use-case-desc">${c.description}</div>
          ${c.regNote ? `<div style="font-size:11px;color:var(--muted);border-top:1px solid var(--border);padding-top:8px;margin-top:4px">⚖ ${c.regNote}</div>` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

// ---- Governance Checklist ----
function renderGovernance(items) {
  const priorities = { High: '🔴', Medium: '🟡', Low: '🟢' };

  document.getElementById('governance-section').innerHTML = `
    <div class="section-header">
      <div>
        <div class="section-title">Governance & Risk Checklist</div>
        <div class="section-sub">Regulatory and model risk management steps for your stage transition</div>
      </div>
    </div>
    <div class="card" style="padding: 8px 20px">
      ${items.map((item, i) => `
        <div class="checklist-item" id="check-${i}" onclick="toggleCheck(${i})">
          <div class="checklist-box" id="box-${i}"></div>
          <div>
            <div class="checklist-text">
              <span style="margin-right:6px">${priorities[item.priority] || ''}</span>
              ${item.text}
            </div>
            <div class="checklist-reg">${item.detail} · <em>${item.reg}</em></div>
          </div>
        </div>
      `).join('')}
    </div>
    <p style="font-size:12px;color:var(--muted);margin-top:10px" class="no-print">
      Click items to mark as complete. Progress resets on page refresh.
    </p>
  `;
}

function toggleCheck(index) {
  const item = document.getElementById(`check-${index}`);
  item.classList.toggle('checked');
}

// ---- Dimension Deep-Dives ----
function renderDimDeepDives(scores, dimDeepDives) {
  if (!dimDeepDives) return;

  // Sort dims by score ascending → show the 2 weakest
  const DIM_KEYS = ['strategy', 'data', 'talent', 'usecases', 'risk'];
  const sorted = DIM_KEYS
    .filter(k => dimDeepDives[k])
    .map(k => ({ key: k, score: scores[k], ...dimDeepDives[k] }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  if (sorted.length === 0) return;

  document.getElementById('deepdives-section').innerHTML = `
    <div class="section-header">
      <div>
        <div class="section-title">Dimension Deep-Dives</div>
        <div class="section-sub">Detailed action plans for your lowest-scoring areas</div>
      </div>
    </div>
    ${sorted.map((d, i) => `
      <div class="accordion-panel ${i === 0 ? 'open' : ''}" id="acc-${i}">
        <div class="accordion-header" onclick="toggleAccordion(${i})">
          <div>
            <div class="accordion-title">${d.title}</div>
            <div style="font-size:12px;color:var(--muted);margin-top:2px">Score: ${d.score}/20</div>
          </div>
          <span class="accordion-arrow">▾</span>
        </div>
        <div class="accordion-body">
          <ul style="list-style:none;display:flex;flex-direction:column;gap:10px;padding-top:16px">
            ${d.actions.map(action => `
              <li style="display:flex;gap:10px;font-size:13px;color:var(--muted2)">
                <span style="color:var(--accent);flex-shrink:0">›</span>
                ${action}
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    `).join('')}
  `;
}

function toggleAccordion(i) {
  document.getElementById(`acc-${i}`).classList.toggle('open');
}

document.addEventListener('DOMContentLoaded', init);
