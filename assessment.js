/* ============================================================
   assessment.js — Self-Assessment Quiz Logic
   ============================================================ */

const STORAGE_KEY = 'ai_adopter_scores';
const QUESTIONS_URL = 'data/questions.json';

let questions = [];
let answers = {};   // { questionId: value }
let currentIndex = 0;

const DIMENSION_CLASSES = {
  strategy: 'dim-strategy',
  data:     'dim-data',
  talent:   'dim-talent',
  usecases: 'dim-usecases',
  risk:     'dim-risk',
};

// ---- Bootstrap ----
async function init() {
  try {
    const res = await fetch(QUESTIONS_URL);
    questions = await res.json();
    renderQuestion(0);
  } catch (e) {
    document.getElementById('question-area').innerHTML =
      `<div class="empty-state"><div class="icon">⚠</div><p>Could not load questions. Please refresh.</p></div>`;
  }
}

// ---- Render question ----
function renderQuestion(index) {
  currentIndex = index;
  const q = questions[index];
  const total = questions.length;
  const pct = Math.round((index / total) * 100);

  // Progress bar
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-label').textContent = `Question ${index + 1} of ${total}`;

  const saved = answers[q.id];

  const html = `
    <div class="question-card">
      <span class="question-dimension ${DIMENSION_CLASSES[q.dimension]}">
        ${q.dimensionIcon} ${q.dimensionLabel}
      </span>
      <p class="question-text">${q.text}</p>

      <div class="likert-scale" role="radiogroup" aria-label="Agreement scale">
        ${[1,2,3,4,5].map(v => `
          <label class="likert-option">
            <input type="radio" name="q${q.id}" value="${v}" ${saved == v ? 'checked' : ''}>
            <span class="likert-circle">${v}</span>
            <span class="likert-label">${likertLabel(v)}</span>
          </label>
        `).join('')}
      </div>

      <div class="question-nav">
        <button class="btn btn-ghost btn-sm" id="btn-prev" ${index === 0 ? 'disabled style="opacity:0.4;cursor:default"' : ''} onclick="navigate(-1)">
          ← Previous
        </button>
        <span style="font-size:13px;color:var(--muted)">${index + 1} / ${total}</span>
        ${index < total - 1
          ? `<button class="btn btn-primary btn-sm" onclick="navigate(1)">Next →</button>`
          : `<button class="btn btn-primary" onclick="finishAssessment()">Calculate My Stage →</button>`
        }
      </div>
    </div>
  `;

  document.getElementById('question-area').innerHTML = html;

  // Attach change listener to capture selection
  document.querySelectorAll(`input[name="q${q.id}"]`).forEach(el => {
    el.addEventListener('change', e => {
      answers[q.id] = parseInt(e.target.value);
    });
  });
}

function likertLabel(v) {
  return ['', 'Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'][v];
}

// ---- Navigation ----
function navigate(dir) {
  const newIndex = currentIndex + dir;
  if (newIndex < 0 || newIndex >= questions.length) return;
  renderQuestion(newIndex);
}

// ---- Finish & Score ----
function finishAssessment() {
  // Check for unanswered
  const unanswered = questions.filter(q => !answers[q.id]);
  if (unanswered.length > 0) {
    showMessage(`Please answer all questions. ${unanswered.length} remaining.`, 'amber');
    return;
  }

  const scores = calculateScores();
  saveToStorage(scores);
  window.location.href = 'results.html';
}

function calculateScores() {
  const dims = { strategy: 0, data: 0, talent: 0, usecases: 0, risk: 0 };
  const counts = { strategy: 0, data: 0, talent: 0, usecases: 0, risk: 0 };

  questions.forEach(q => {
    const val = answers[q.id] || 0;
    dims[q.dimension] += val;
    counts[q.dimension]++;
  });

  // Scale each dimension to 0-20
  const scaled = {};
  let total = 0;
  Object.keys(dims).forEach(dim => {
    const max = counts[dim] * 5; // max if all answered 5
    const raw = dims[dim];
    scaled[dim] = Math.round((raw / max) * 20);
    total += scaled[dim];
  });

  const stage = total >= 80 ? 4 : total >= 60 ? 3 : total >= 40 ? 2 : 1;

  return {
    strategy: scaled.strategy,
    data:     scaled.data,
    talent:   scaled.talent,
    usecases: scaled.usecases,
    risk:     scaled.risk,
    total,
    stage,
    completedAt: new Date().toISOString(),
  };
}

function saveToStorage(scores) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
}

function showMessage(text, color = 'amber') {
  let msg = document.getElementById('form-message');
  if (!msg) {
    msg = document.createElement('div');
    msg.id = 'form-message';
    msg.style.cssText = `
      position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
      background:var(--surface); border:1px solid var(--${color});
      color:var(--${color}); padding:12px 24px; border-radius:8px;
      font-size:14px; font-weight:500; z-index:200; white-space:nowrap;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
    `;
    document.body.appendChild(msg);
  }
  msg.textContent = text;
  setTimeout(() => msg?.remove(), 3500);
}

document.addEventListener('DOMContentLoaded', init);
