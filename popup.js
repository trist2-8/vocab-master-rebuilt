const REVIEW_DEFAULTS = {
  streak: 0,
  wrongCount: 0,
  correctCount: 0,
  hardCount: 0,
  seenCount: 0,
  lapseCount: 0,
  dueAt: 0,
  lastReviewedAt: 0,
  confidence: 0,
  lastFailureAt: 0,
  lastFailureReason: '',
  lastSeenGame: ''
};

const SKILL_KEYS = ['recognition', 'production', 'spelling', 'listening'];

const byId = (id) => document.getElementById(id);

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getStorage(defaults) {
  return new Promise(resolve => chrome.storage.local.get(defaults, resolve));
}

function openUrl(path) {
  chrome.tabs.create({ url: chrome.runtime.getURL(path) });
  window.close();
}

function normalizeSkillMap(skillMap = {}, fallback = 0) {
  const base = Number.isFinite(Number(fallback)) ? Number(fallback) : 0;
  return SKILL_KEYS.reduce((acc, key) => {
    const value = Number(skillMap?.[key]);
    acc[key] = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : base;
    return acc;
  }, {});
}

function deriveConfidenceFromSkillMap(skillMap = {}, fallback = 0) {
  const normalized = normalizeSkillMap(skillMap, fallback);
  const values = SKILL_KEYS.map(key => normalized[key]);
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getReview(word) {
  return { ...REVIEW_DEFAULTS, ...(word?.review || {}) };
}

function getConfidence(word) {
  const review = getReview(word);
  if (review.skillMap && typeof review.skillMap === 'object') {
    return deriveConfidenceFromSkillMap(review.skillMap, review.confidence);
  }
  const value = Number(review.confidence);
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

function getWeakestSkill(word) {
  const review = getReview(word);
  const skillMap = normalizeSkillMap(review.skillMap, review.confidence);
  return SKILL_KEYS.reduce((weakest, key) => {
    if (!weakest || skillMap[key] < weakest.value) {
      return { key, value: skillMap[key] };
    }
    return weakest;
  }, null);
}

function skillLabel(key) {
  return ({
    recognition: 'recognition',
    production: 'production',
    spelling: 'spelling',
    listening: 'listening'
  })[key] || 'memory';
}

function getSentenceCount(word) {
  return Array.isArray(word?.sentenceBank)
    ? word.sentenceBank.filter(entry => entry && String(entry.text || '').trim()).length
    : 0;
}

function isDueWord(word, now = Date.now()) {
  const review = getReview(word);
  return review.seenCount > 0 && review.dueAt > 0 && review.dueAt <= now;
}

function isNewWord(word) {
  return getReview(word).seenCount === 0;
}

function isWeakWord(word) {
  return getConfidence(word) < 0.45;
}

function getPriority(word, now = Date.now()) {
  const review = getReview(word);
  const weakest = getWeakestSkill(word);
  const dueScore = isDueWord(word, now) ? 4 : 0;
  const weakScore = isWeakWord(word) ? 2 : 0;
  const newScore = isNewWord(word) ? 1 : 0;
  const overdueMinutes = isDueWord(word, now) ? Math.min(360, (now - review.dueAt) / 60000) / 60 : 0;
  const skillPenalty = weakest ? 1 - weakest.value : 0;
  return dueScore + weakScore + newScore + overdueMinutes + skillPenalty;
}

function summarizeWord(word, now = Date.now()) {
  const review = getReview(word);
  const weakest = getWeakestSkill(word);
  const badges = [];
  if (isDueWord(word, now)) badges.push({ label: 'Due', className: 'due' });
  if (isWeakWord(word)) badges.push({ label: 'Weak', className: 'weak' });
  if (isNewWord(word)) badges.push({ label: 'New', className: 'new' });
  if (weakest && weakest.value < 0.58) badges.push({ label: skillLabel(weakest.key), className: 'skill' });

  let note = 'Ready for a focused review.';
  if (isDueWord(word, now)) {
    const overdueMinutes = Math.max(1, Math.round((now - review.dueAt) / 60000));
    note = overdueMinutes >= 60
      ? `Overdue by ${Math.round(overdueMinutes / 60)}h.`
      : `Overdue by ${overdueMinutes}m.`;
  } else if (isNewWord(word)) {
    note = 'Not reviewed yet.';
  } else if (weakest) {
    note = `Weakest channel: ${skillLabel(weakest.key)}.`;
  }

  const meaning = String(word?.meaning || word?.translation || word?.definition || '').trim();
  return {
    word: String(word?.word || '').trim(),
    meaning,
    note,
    badges,
    confidence: getConfidence(word),
    sentences: getSentenceCount(word)
  };
}

function getCounts(vocab, now = Date.now()) {
  return vocab.reduce((acc, word) => {
    if (isDueWord(word, now)) acc.due += 1;
    if (isWeakWord(word)) acc.weak += 1;
    if (isNewWord(word)) acc.new += 1;
    if (Array.isArray(word?.confusionPartners) && word.confusionPartners.length) acc.contrast += 1;
    acc.sentences += getSentenceCount(word);
    return acc;
  }, { due: 0, weak: 0, new: 0, contrast: 0, sentences: 0 });
}

function choosePrimaryLane(counts) {
  if (counts.due > 0) return { quick: 'rescue', label: 'Rescue overdue cards', status: `${counts.due} due now` };
  if (counts.weak > 0) return { quick: 'weak', label: 'Drill weak skills', status: `${counts.weak} weak cards` };
  if (counts.new > 0) return { quick: 'new', label: 'Warm up new words', status: `${counts.new} new cards` };
  if (counts.contrast > 0) return { quick: 'contrast', label: 'Run contrast mode', status: 'Confusion pairs ready' };
  return { quick: '', label: 'Open full dashboard', status: 'All caught up' };
}

function renderQueue(words) {
  const queueList = byId('queueList');
  if (!words.length) {
    queueList.innerHTML = '<div class="queue-empty">No urgent cards right now. Use the buttons above for a short warm-up or open the full dashboard.</div>';
    return;
  }
  queueList.innerHTML = words.map(item => `
    <article class="queue-item">
      <div class="queue-item-top">
        <div>
          <div class="queue-word">${escapeHtml(item.word)}</div>
          <div class="queue-meta">${escapeHtml(item.meaning || 'Meaning not added yet')}</div>
        </div>
        <div class="queue-badges">
          ${item.badges.map(badge => `<span class="badge ${escapeHtml(badge.className)}">${escapeHtml(badge.label)}</span>`).join('')}
        </div>
      </div>
      <div class="queue-meta">${escapeHtml(item.note)}${item.sentences ? ` • ${item.sentences} saved sentence${item.sentences > 1 ? 's' : ''}` : ''}</div>
    </article>
  `).join('');
}

async function init() {
  const result = await getStorage({ vocab: [], stats: {} });
  const vocab = Array.isArray(result.vocab) ? result.vocab : [];
  const stats = result.stats && typeof result.stats === 'object' ? result.stats : {};
  const now = Date.now();
  const counts = getCounts(vocab, now);
  const primary = choosePrimaryLane(counts);

  byId('dueCount').textContent = String(counts.due);
  byId('weakCount').textContent = String(counts.weak);
  byId('newCount').textContent = String(counts.new);
  byId('dueHint').textContent = counts.due ? 'Most urgent memory risk' : 'Nothing overdue yet';
  byId('weakHint').textContent = counts.weak ? 'Lowest confidence channels' : 'No weak spots detected';
  byId('newHint').textContent = counts.new ? 'Ready for first contact' : 'No new cards queued';
  byId('totalWords').textContent = String(vocab.length);
  byId('streakValue').textContent = String(Math.max(0, Number(stats.currentStreak || 0)));
  byId('sentenceCount').textContent = String(counts.sentences);
  byId('heroStatus').textContent = primary.status;

  if (!vocab.length) {
    byId('heroCopy').textContent = 'Your library is empty. Open the extension to add a first set, then Quick Rescue will keep future reviews one click away.';
    byId('launchPrimary').textContent = 'Open library';
    byId('launchPrimary').onclick = () => openUrl('vocab.html?view=main');
    renderQueue([]);
  } else {
    byId('heroCopy').textContent = counts.due
      ? 'Start with overdue cards first. That gives you the biggest retention payoff in the smallest amount of time.'
      : counts.weak
        ? 'Nothing is overdue, so the next best move is shoring up the weakest skill channel before it slips.'
        : counts.new
          ? 'You are caught up on overdue items. This is a good moment to seed a few new words.'
          : counts.contrast
            ? 'Your review queue is stable. This is a good time to untangle similar words in contrast mode.'
            : 'You are caught up. Open the full dashboard for sentence cloze, library work, or a calm maintenance session.';
    byId('launchPrimary').textContent = primary.label;
    byId('launchPrimary').onclick = () => openUrl(primary.quick ? `vocab.html?view=review&quick=${primary.quick}` : 'vocab.html?view=review');

    const queue = vocab
      .map(word => ({ source: word, priority: getPriority(word, now), summary: summarizeWord(word, now) }))
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5)
      .map(entry => entry.summary)
      .filter(entry => entry.word);
    renderQueue(queue);
  }

  document.querySelectorAll('[data-open]').forEach(node => {
    node.addEventListener('click', () => openUrl(node.getAttribute('data-open')));
  });
}

document.addEventListener('DOMContentLoaded', init);
