/* ============================================================
   results.js — Assessment Results Page
   Reads localStorage scores, renders radar chart + breakdown
   ============================================================ */

const STORAGE_KEY = 'ai_adopter_scores';

const STAGE_META = {
  1: { label: 'Exploring',     color: '#64748b', cls: 'stage-1' },
  2: { label: 'Experimenting', color: '#f59e0b', cls: 'stage-2' },
  3: { label: 'Scaling',       color: '#10b981', cls: 'stage-3' },
  4: { label: 'Transforming',  color: '#3b82f6', cls: 'stage-4' },
};

const DIM_META = [
  { key: 'strategy', label: 'Strategy & Governance', colorClass: 'blue' },
  { key: 'data',     label: 'Data & Infrastructure', colorClass: 'green' },
  { key: 'talent',   label: 'AI Talent & Culture',   colorClass: 'blue' },
  { key: 'usecases', label: 'Use Cases in Production', colorClass: 'amber' },
  { key: 'risk',     label: 'Risk, Compliance & IP', colorClass: 'blue' },
];

function init() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    // No data — redirect to assessment
    document.getElementById('results-area').innerHTML = `
      <div class="empty-state">
        <div class="icon">◎</div>
        <p>No assessment data found. Please complete the self-assessment first.</p>
        <a href="assessment.html" class="btn btn-primary">Start Assessment</a>
      </div>
    `;
    return;
  }

  const scores = JSON.parse(raw);
  const stage = STAGE_META[scores.stage];

  renderStageBadge(scores, stage);
  renderRadarChart(scores);
  renderDimensionBars(scores);
  renderGapAnalysis(scores);
  renderCTA(scores);
}

function renderStageBadge(scores, stage) {
  document.getElementById('results-hero').innerHTML = `
    <div class="hero-eyebrow">Your AI Maturity Result</div>
    <div class="results-score">
      ${scores.total}<span> / 100</span>
    </div>
    <div style="margin: 12px 0 8px">
      <span class="stage-badge stage-badge-lg ${stage.cls}">
        Stage ${scores.stage} — ${stage.label}
      </span>
    </div>
    <p style="color:var(--muted2);font-size:14px;margin-top:8px">
      ${stageDescription(scores.stage)}
    </p>
  `;
}

function stageDescription(stage) {
  const descs = {
    1: 'Your organization is in the early awareness phase — AI is on the radar but not yet systematically deployed.',
    2: 'You have active AI pilots and are building foundational capabilities, with some production deployments.',
    3: 'AI is scaling across multiple business lines with MLOps infrastructure and measurable business impact.',
    4: 'AI is central to your competitive strategy with autonomous systems, proprietary IP, and industry leadership.',
  };
  return descs[stage];
}

function renderRadarChart(scores) {
  const ctx = document.getElementById('radar-chart');
  if (!ctx) return;

  // Normalize scores to 0-100 scale for readability
  const data = DIM_META.map(d => Math.round((scores[d.key] / 20) * 100));

  new Chart(ctx, {
    type: 'radar',
    data: {
      labels: DIM_META.map(d => d.label),
      datasets: [{
        label: 'Your Score',
        data,
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        borderColor: '#3b82f6',
        borderWidth: 2,
        pointBackgroundColor: '#60a5fa',
        pointBorderColor: '#3b82f6',
        pointRadius: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: {
            stepSize: 25,
            color: '#64748b',
            font: { size: 10 },
            backdropColor: 'transparent',
          },
          grid: { color: '#1e2d44' },
          angleLines: { color: '#1e2d44' },
          pointLabels: {
            color: '#94a3b8',
            font: { size: 11, family: 'Inter, sans-serif' },
          },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#111827',
          borderColor: '#1e2d44',
          borderWidth: 1,
          titleColor: '#e2e8f0',
          bodyColor: '#94a3b8',
          callbacks: {
            label: ctx => ` ${ctx.raw}%`,
          },
        },
      },
    },
  });
}

function renderDimensionBars(scores) {
  const container = document.getElementById('dim-bars');
  if (!container) return;

  container.innerHTML = DIM_META.map(d => {
    const val = scores[d.key];
    const pct = Math.round((val / 20) * 100);
    const fillClass = pct >= 70 ? 'green' : pct >= 45 ? '' : 'amber';
    return `
      <div class="dim-item">
        <div class="dim-label">
          <span class="dim-name">${d.label}</span>
          <span class="dim-score">${val} / 20</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill ${fillClass}" style="width: ${pct}%"></div>
        </div>
      </div>
    `;
  }).join('');
}

function renderGapAnalysis(scores) {
  const container = document.getElementById('gap-analysis');
  if (!container) return;

  // Sort dims by score ascending → find gaps
  const sorted = [...DIM_META]
    .map(d => ({ ...d, score: scores[d.key] }))
    .sort((a, b) => a.score - b.score);

  const weakest = sorted.slice(0, 2);

  container.innerHTML = `
    <div class="gap-panel">
      <h3>⚠ Priority Focus Areas</h3>
      <p style="font-size:13px;color:var(--muted2);margin-bottom:12px">
        Your lowest-scoring dimensions — these are your biggest levers for advancing to the next stage.
      </p>
      ${weakest.map(d => `
        <div style="margin-bottom: 12px;">
          <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:4px">${d.label}</div>
          <div style="font-size:12px;color:var(--muted2)">Score: ${d.score}/20 (${Math.round((d.score/20)*100)}%) — Your playbook includes targeted actions for this dimension.</div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderCTA(scores) {
  const container = document.getElementById('results-cta');
  if (!container) return;

  const stage = STAGE_META[scores.stage];
  const nextStage = scores.stage < 4 ? STAGE_META[scores.stage + 1] : null;

  container.innerHTML = `
    <div style="text-align:center; padding: 32px 0;">
      <p style="color:var(--muted2);font-size:14px;margin-bottom:20px">
        ${nextStage
          ? `Ready to move from <strong style="color:${stage.color}">${stage.label}</strong> → <strong style="color:${nextStage.color}">${nextStage.label}</strong>?`
          : `You're at the top. Let's sustain your AI leadership.`}
      </p>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
        <a href="playbook.html" class="btn btn-primary btn-lg">View Your Playbook →</a>
        <a href="assessment.html" class="btn btn-ghost">Retake Assessment</a>
      </div>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', init);
