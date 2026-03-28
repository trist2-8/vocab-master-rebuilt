document.addEventListener('DOMContentLoaded', () => {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const REVIEW_DEFAULTS = {
    streak: 0,
    wrongCount: 0,
    correctCount: 0,
    hardCount: 0,
    seenCount: 0,
    lapseCount: 0,
    dueAt: 0,
    lastReviewedAt: 0,
    confidence: 0
  };

  const MEMORY_STAGES = [
    { level: 0, label: 'Mới', shortLabel: 'Mới', note: 'Chưa ôn lần nào' },
    { level: 1, label: 'Làm quen', shortLabel: 'Làm quen', note: 'Đã thấy nhưng còn rất dễ quên' },
    { level: 2, label: 'Đang nhớ', shortLabel: 'Đang nhớ', note: 'Đã nhớ được một phần, cần nhắc lại' },
    { level: 3, label: 'Khá chắc', shortLabel: 'Khá chắc', note: 'Nhớ tương đối ổn, nên tiếp tục củng cố' },
    { level: 4, label: 'Rất vững', shortLabel: 'Rất vững', note: 'Đã qua nhiều lượt ôn tốt' }
  ];

  const state = {
    vocab: [],
    stats: { coins: 0, dailyGoal: 12, dailyProgress: {}, currentStreak: 0, bestStreak: 0, totalSessions: 0, studyLog: [] },
    parsedWords: [],
    parseMeta: null,
    studyQueue: [],
    currentCardIdx: 0,
    activeQuizMode: 'word-meaning',
    currentGame: null,
    activeSet: 'all',
    optionPool: [],
    matchingBatch: [],
    matchingSelection: null,
    matchingPairsSolved: 0,
    matchingLives: 5,
    matchingTimer: 0,
    matchingInterval: null,
    answerLocked: false,
    currentDetailsSet: null,
    currentPlanTitle: '',
    currentPlanReason: '',
    sessionStats: null,
    wallet: { bonusCoins: 0, spentCoins: 0 }
  };

  const storage = {
    get(defaults) {
      return new Promise(resolve => chrome.storage.local.get(defaults, resolve));
    },
    set(values) {
      return new Promise(resolve => chrome.storage.local.set(values, resolve));
    }
  };

  const byId = (id) => document.getElementById(id);
  const views = Array.from(document.querySelectorAll('.view'));
  const navBtns = Array.from(document.querySelectorAll('.nav-btn'));

  init();

  async function init() {
    bindStaticEvents();
    setupModals();
    bindStorageSync();
    await loadState();
    showView('main-view');
    renderAll();
  }

  function bindStaticEvents() {
    byId('navMainBtn').addEventListener('click', () => {
      showView('main-view');
      initMainView();
    });
    byId('navManagementBtn').addEventListener('click', () => {
      showView('management-view');
      initManagementView();
    });
    byId('navReviewBtn').addEventListener('click', () => {
      showView('review-dashboard-view');
      initReviewView();
    });

    byId('addSetBtn').addEventListener('click', () => openModal('createSetModal'));
    byId('saveSetNameBtn').addEventListener('click', createSetFromModal);

    document.querySelector('.dropdown-toggle').addEventListener('click', (event) => {
      event.stopPropagation();
      document.querySelector('.dropdown-menu').classList.toggle('hidden');
    });
    document.addEventListener('click', () => {
      document.querySelector('.dropdown-menu').classList.add('hidden');
    });

    byId('importCsvBtn').addEventListener('click', () => byId('fileInputCsv').click());
    byId('fileInputCsv').addEventListener('change', handleCsvImport);

    byId('previewBtn').addEventListener('click', handleBulkPreview);
    byId('cancelPreviewBtn').addEventListener('click', () => {
      byId('preview-view').classList.add('hidden');
      byId('input-view').classList.remove('hidden');
    });
    byId('saveWordsBtn').addEventListener('click', savePreviewWords);
    byId('saveQuickWordBtn').addEventListener('click', saveQuickWord);
    byId('exportBackupBtn')?.addEventListener('click', exportBackup);
    byId('importBackupBtn')?.addEventListener('click', () => byId('fileInputBackup').click());
    byId('fileInputBackup')?.addEventListener('change', handleBackupImport);
    byId('setSearchInput')?.addEventListener('input', renderWordsetsGrid);
    byId('setSortSelect')?.addEventListener('change', renderWordsetsGrid);

    byId('backToManagementBtn').addEventListener('click', () => {
      showView('management-view');
      initManagementView();
    });
    byId('saveSetChangesBtn').addEventListener('click', saveSetDetailsChanges);
    byId('deleteSetBtn').addEventListener('click', deleteCurrentSet);
    byId('detailsSearchInput')?.addEventListener('input', applySetDetailsFilters);
    byId('detailsFilterSelect')?.addEventListener('change', applySetDetailsFilters);

    byId('reviewSetDropdown').addEventListener('change', initReviewView);
    byId('startDueFocusBtn')?.addEventListener('click', () => startTargetedFocus('due'));
    byId('startWeakFocusBtn')?.addEventListener('click', () => startTargetedFocus('weak'));
    byId('startNewFocusBtn')?.addEventListener('click', () => startTargetedFocus('new'));
    document.querySelectorAll('.vibrant-card').forEach(card => {
      card.addEventListener('click', () => {
        const gameType = card.dataset.game;
        startGame(gameType, byId('reviewSetDropdown').value);
      });
    });

    document.querySelectorAll('.exit-game-btn').forEach(btn => {
      btn.addEventListener('click', exitCurrentGame);
    });

    byId('activeFlashcard').addEventListener('click', () => {
      byId('activeFlashcard').classList.toggle('flipped');
    });
    byId('restartStudyBtn').addEventListener('click', () => startGame(state.currentGame || 'flashcard', state.activeSet));
    byId('btnPrev').addEventListener('click', () => {
      if (state.currentCardIdx > 0) {
        state.currentCardIdx -= 1;
        renderFlashcard();
      }
    });
    byId('btnNext').addEventListener('click', () => {
      state.currentCardIdx += 1;
      renderFlashcard();
    });
    byId('btnAudio').addEventListener('click', () => {
      const card = state.studyQueue[state.currentCardIdx];
      if (card) playWordAudio(card.word);
    });
    byId('btnNotLearned').addEventListener('click', () => handleFlashcardOutcome('again'));
    byId('btnAlmostLearned')?.addEventListener('click', () => handleFlashcardOutcome('hard'));
    byId('btnLearned').addEventListener('click', () => handleFlashcardOutcome('good'));
    byId('fcCheckBtn').addEventListener('click', handleFlashcardMeaningCheck);
    byId('fcTypingInput').addEventListener('keypress', (event) => {
      if (event.key === 'Enter') handleFlashcardMeaningCheck();
    });

    byId('typingSubmitBtn').addEventListener('click', handleTypingSubmit);
    byId('typingInput').addEventListener('keypress', (event) => {
      if (event.key === 'Enter') handleTypingSubmit();
    });
    byId('dictationSubmitBtn').addEventListener('click', handleDictationSubmit);
    byId('dictationInput').addEventListener('keypress', (event) => {
      if (event.key === 'Enter') handleDictationSubmit();
    });
    byId('playAudioBtn').addEventListener('click', () => {
      const card = state.studyQueue[state.currentCardIdx];
      if (card) playWordAudio(card.word);
    });

    document.addEventListener('keydown', flashcardKeyHandler);
  }

  function setupModals() {
    ['quickAddModal', 'createSetModal', 'tutorialModal', 'promptHelperModal', 'strategyModal', 'quizModeModal', 'sessionSummaryModal'].forEach(modalId => {
      const modal = byId(modalId);
      if (!modal) return;
      const closeBtn = modal.querySelector('.close-modal');
      closeBtn?.addEventListener('click', () => closeModal(modalId));
      modal.addEventListener('click', (event) => {
        if (event.target === modal) closeModal(modalId);
      });
    });

    byId('quickAddBtn').addEventListener('click', () => openModal('quickAddModal'));
    byId('tutorialBtn').addEventListener('click', () => openModal('tutorialModal'));
    byId('promptHelperBtn')?.addEventListener('click', () => {
      refreshPromptOutput();
      openModal('promptHelperModal');
      byId('promptTopicInput')?.focus();
    });
    byId('promptTopicInput')?.addEventListener('input', refreshPromptOutput);
    byId('resetPromptBtn')?.addEventListener('click', () => {
      byId('promptTopicInput').value = '';
      refreshPromptOutput();
      byId('promptTopicInput').focus();
    });
    byId('copyPromptBtn')?.addEventListener('click', copyPromptToClipboard);
    refreshPromptOutput();
    byId('openStrategyBtn').addEventListener('click', () => openModal('strategyModal'));
    byId('startRecommendedBtn').addEventListener('click', startRecommendedStudy);
    byId('closeSessionSummaryBtn')?.addEventListener('click', () => closeModal('sessionSummaryModal'));
    byId('repeatRecommendedBtn')?.addEventListener('click', () => {
      closeModal('sessionSummaryModal');
      startRecommendedStudy();
    });

    document.querySelectorAll('.quiz-mode-selector').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeQuizMode = btn.dataset.mode;
        closeModal('quizModeModal');
        showView('quiz-mode-view');
        renderQuiz();
      });
    });
  }

  function buildTopicPrompt(topic = '') {
    const cleanTopic = topic.trim() || '[CHỦ ĐỀ]';
    return `Hãy tạo danh sách từ vựng tiếng Anh theo chủ đề ${cleanTopic} với định dạng sau, mỗi dòng một từ, các cột cách nhau bằng dấu |:

` +
      `từ vựng | /phiên âm/ | loại từ | nghĩa tiếng Việt | ví dụ tiếng Anh | ghi chú

` +
      `Ví dụ:
` +
      `abandon | /əˈbæn.dən/ | verb | từ bỏ, bỏ rơi | She abandoned her old car | thường dùng trong văn viết
` +
      `ability | /əˈbɪl.ə.ti/ | noun | khả năng, năng lực | He has the ability to learn fast |

` +
      `Hãy tạo 20 từ vựng theo chủ đề ${cleanTopic}.`;
  }

  function refreshPromptOutput() {
    const output = byId('promptOutput');
    if (!output) return;
    output.value = buildTopicPrompt(byId('promptTopicInput')?.value || '');
  }

  async function copyPromptToClipboard() {
    const text = byId('promptOutput')?.value || buildTopicPrompt('');
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const temp = document.createElement('textarea');
        temp.value = text;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        temp.remove();
      }
      showToast('Đã sao chép prompt chủ đề.');
    } catch (error) {
      showToast('Không thể sao chép tự động. Bạn hãy copy thủ công trong ô prompt.');
    }
  }

  async function loadState() {
    const result = await storage.get({ vocab: [], stats: { coins: 0 }, vm_bonusCoins: 0, vm_spentCoins: 0 });
    let changed = false;

    state.vocab = result.vocab.map((item, index) => {
      const normalized = normalizeWord(item, index);
      changed = changed || JSON.stringify(item || {}) !== JSON.stringify(normalized);
      return normalized;
    });

    state.stats = normalizeStats(result.stats || {});
    state.wallet = normalizeWalletState(result);
    updateStreakStats();
    changed = changed || JSON.stringify(result.stats || {}) !== JSON.stringify(state.stats);

    if (changed) {
      await persistState();
    }
  }

  function normalizeStats(stats = {}) {
    const studyLog = Array.isArray(stats.studyLog) ? stats.studyLog.slice(0, 40) : [];
    const dailyProgress = stats.dailyProgress && typeof stats.dailyProgress === 'object' ? { ...stats.dailyProgress } : {};
    const sessionHistory = Array.isArray(stats.sessionHistory)
      ? stats.sessionHistory
          .filter(entry => entry && (typeof entry.dateKey === 'string' || Number(entry.finishedAt) > 0))
          .map(entry => ({
            dateKey: typeof entry.dateKey === 'string' && entry.dateKey ? entry.dateKey : getDateKeyFromTimestamp(entry.finishedAt || Date.now()),
            finishedAt: Number(entry.finishedAt) || 0,
            game: String(entry.game || entry.gameType || 'Study session'),
            total: Math.max(0, Number(entry.total) || 0),
            good: Math.max(0, Number(entry.good) || 0),
            hard: Math.max(0, Number(entry.hard) || 0),
            again: Math.max(0, Number(entry.again) || 0),
            strengthened: Math.max(0, Number(entry.strengthened) || 0),
            durationSeconds: Math.max(0, Number(entry.durationSeconds) || 0)
          }))
          .slice(-180)
      : [];
    return {
      coins: Math.max(0, Number(stats.coins) || 0),
      dailyGoal: Math.max(5, Number(stats.dailyGoal) || 12),
      dailyProgress,
      currentStreak: Math.max(0, Number(stats.currentStreak) || 0),
      bestStreak: Math.max(0, Number(stats.bestStreak) || 0),
      totalSessions: Math.max(0, Number(stats.totalSessions) || sessionHistory.length || 0),
      studyLog,
      sessionHistory
    };
  }


  function normalizeWalletState(raw = {}) {
    return {
      bonusCoins: Math.max(0, Number(raw.vm_bonusCoins) || 0),
      spentCoins: Math.max(0, Number(raw.vm_spentCoins) || 0)
    };
  }

  function getWalletSnapshot() {
    const studyCoins = Math.max(0, Number(state.stats.coins) || 0);
    const bonusCoins = Math.max(0, Number(state.wallet?.bonusCoins) || 0);
    const totalEarned = studyCoins + bonusCoins;
    const spentCoins = Math.max(0, Math.min(Number(state.wallet?.spentCoins) || 0, totalEarned));
    const availableCoins = Math.max(0, totalEarned - spentCoins);
    return { studyCoins, bonusCoins, totalEarned, spentCoins, availableCoins };
  }

  function getVisibleCoinCount() {
    return getWalletSnapshot().availableCoins;
  }

  function bindStorageSync() {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'local') return;
      let shouldRender = false;
      if (changes.stats) {
        state.stats = normalizeStats(changes.stats.newValue || {});
        updateStreakStats();
        shouldRender = true;
      }
      if (changes.vocab) {
        state.vocab = Array.isArray(changes.vocab.newValue)
          ? changes.vocab.newValue.map((item, index) => normalizeWord(item, index))
          : [];
        shouldRender = true;
      }
      if (changes.vm_bonusCoins) {
        state.wallet.bonusCoins = Math.max(0, Number(changes.vm_bonusCoins.newValue) || 0);
        shouldRender = true;
      }
      if (changes.vm_spentCoins) {
        state.wallet.spentCoins = Math.max(0, Number(changes.vm_spentCoins.newValue) || 0);
        shouldRender = true;
      }
      if (shouldRender) renderAll();
    });
  }

  function getDateKeyFromTimestamp(timestamp) {
    return new Date(Number(timestamp) || Date.now()).toISOString().slice(0, 10);
  }

  function normalizeWord(item, index = 0) {
    const review = {
      ...REVIEW_DEFAULTS,
      ...(item?.review || {})
    };
    review.confidence = deriveConfidenceValue(review, Boolean(item?.isLearned));

    return {
      id: item?.id || `${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
      word: String(item?.word || '').trim(),
      phonetic: String(item?.phonetic || '').trim(),
      meaning: String(item?.meaning || '').trim(),
      wordType: String(item?.wordType || '').trim(),
      example: String(item?.example || '').trim(),
      notes: String(item?.notes || '').trim(),
      wordset: String(item?.wordset || 'Chưa phân loại').trim() || 'Chưa phân loại',
      createdAt: Number(item?.createdAt) || Date.now(),
      isLearned: Boolean(item?.isLearned) || review.confidence >= 4,
      review
    };
  }

  function renderAll() {
    initMainView();
    initManagementView();
    initReviewView();
  }

  function showView(viewIdToShow) {
    views.forEach(view => view.classList.add('hidden'));
    navBtns.forEach(btn => btn.classList.remove('active'));
    byId(viewIdToShow).classList.remove('hidden');

    if (viewIdToShow === 'main-view') byId('navMainBtn').classList.add('active');
    if (viewIdToShow === 'management-view' || viewIdToShow === 'set-details-view') byId('navManagementBtn').classList.add('active');
    if (['review-dashboard-view', 'study-mode-view', 'quiz-mode-view', 'matching-mode-view', 'typing-mode-view', 'dictation-mode-view'].includes(viewIdToShow)) {
      byId('navReviewBtn').classList.add('active');
    }
  }

  function openModal(modalId) {
    byId(modalId)?.classList.remove('hidden');
  }

  function closeModal(modalId) {
    byId(modalId)?.classList.add('hidden');
  }

  async function persistState() {
    await storage.set({ vocab: state.vocab, stats: state.stats });
  }

  async function saveAndRefresh({ showManagement = false, showReview = false } = {}) {
    await persistState();
    renderAll();
    if (showManagement) {
      showView('management-view');
      initManagementView();
    }
    if (showReview) {
      showView('review-dashboard-view');
      initReviewView();
    }
  }

  function showToast(message) {
    const toast = byId('toastNotification');
    toast.textContent = message;
    toast.classList.remove('hidden', 'show');
    requestAnimationFrame(() => toast.classList.add('show'));
    window.clearTimeout(toast._timer);
    toast._timer = window.setTimeout(() => {
      toast.classList.remove('show');
      window.setTimeout(() => toast.classList.add('hidden'), 250);
    }, 2600);
  }


  function getTodayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function shiftDateKey(dateKey, dayOffset) {
    const date = new Date(`${dateKey}T00:00:00`);
    date.setDate(date.getDate() + dayOffset);
    return date.toISOString().slice(0, 10);
  }

  function getDailyProgressRecord(dateKey = getTodayKey()) {
    return state.stats.dailyProgress[dateKey] || { studied: 0, correct: 0, hard: 0, again: 0 };
  }

  function recordDailyOutcome(quality) {
    const key = getTodayKey();
    const current = getDailyProgressRecord(key);
    const next = { ...current, studied: current.studied + 1 };
    if (quality === 'good') next.correct += 1;
    else if (quality === 'hard') next.hard += 1;
    else next.again += 1;
    state.stats.dailyProgress[key] = next;
    updateStreakStats();
  }

  function updateStreakStats() {
    const entries = Object.entries(state.stats.dailyProgress)
      .filter(([, value]) => value && value.studied > 0)
      .sort((a, b) => a[0].localeCompare(b[0]));
    if (!entries.length) {
      state.stats.currentStreak = 0;
      state.stats.bestStreak = Math.max(state.stats.bestStreak, 0);
      return;
    }

    let best = 0;
    let streak = 0;
    let previousKey = null;
    entries.forEach(([dateKey]) => {
      if (!previousKey) {
        streak = 1;
      } else if (shiftDateKey(previousKey, 1) === dateKey) {
        streak += 1;
      } else {
        streak = 1;
      }
      best = Math.max(best, streak);
      previousKey = dateKey;
    });

    const todayKey = getTodayKey();
    const yesterdayKey = shiftDateKey(todayKey, -1);
    const hasToday = Boolean(state.stats.dailyProgress[todayKey]?.studied);
    const hasYesterday = Boolean(state.stats.dailyProgress[yesterdayKey]?.studied);
    if (!hasToday && !hasYesterday) state.stats.currentStreak = 0;
    else {
      let rolling = hasToday ? 1 : 0;
      let cursor = hasToday ? todayKey : yesterdayKey;
      if (!rolling) rolling = 1;
      while (true) {
        const prev = shiftDateKey(cursor, -1);
        if (!state.stats.dailyProgress[prev]?.studied) break;
        rolling += 1;
        cursor = prev;
      }
      state.stats.currentStreak = rolling;
    }
    state.stats.bestStreak = Math.max(state.stats.bestStreak, best, state.stats.currentStreak);
  }

  function getWeakTypeStats(words) {
    const map = new Map();
    words.filter(isWeakWord).forEach(word => {
      const key = word.wordType || 'Chưa phân loại';
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }

  function getRecentLogs(limit = 6) {
    return (state.stats.studyLog || []).slice(0, limit);
  }

  function formatRelativeDue(timestamp) {
    if (!timestamp) return 'Ôn bất cứ lúc nào';
    const diff = timestamp - Date.now();
    if (diff <= 0) return 'Đến hạn ngay';
    const hours = Math.round(diff / (60 * 60 * 1000));
    if (hours < 24) return `Còn ${hours} giờ`;
    const days = Math.round(diff / DAY_MS);
    return `Còn ${days} ngày`;
  }

  function renderDailyFocus(words) {
    const container = byId('dailyFocusGrid');
    if (!container) return;
    const today = getDailyProgressRecord();
    const weakTypes = getWeakTypeStats(words);
    const nextDueWord = [...words].filter(word => word.review?.dueAt && word.review.dueAt > Date.now())
      .sort((a, b) => a.review.dueAt - b.review.dueAt)[0];
    const goalProgress = Math.min(100, Math.round((today.studied / state.stats.dailyGoal) * 100));

    const cards = [
      {
        label: 'Mục tiêu hôm nay',
        value: `${today.studied}/${state.stats.dailyGoal}`,
        note: today.studied >= state.stats.dailyGoal ? 'Bạn đã đạt mục tiêu hôm nay.' : `Còn ${Math.max(0, state.stats.dailyGoal - today.studied)} lượt ôn nữa để chạm mục tiêu.`,
        meter: goalProgress
      },
      {
        label: 'Chuỗi học',
        value: `${state.stats.currentStreak} ngày`,
        note: `Kỷ lục: ${state.stats.bestStreak} ngày liên tiếp`,
        meter: Math.min(100, state.stats.currentStreak * 10)
      },
      {
        label: 'Nhóm cần cứu trước',
        value: weakTypes[0] ? weakTypes[0][0] : 'Chưa có',
        note: weakTypes[0] ? `${weakTypes[0][1]} từ đang yếu trong nhóm này.` : 'Chưa có nhóm từ yếu nổi bật.',
        meter: weakTypes[0] ? Math.min(100, weakTypes[0][1] * 15) : 0
      },
      {
        label: 'Lượt ôn tiếp theo',
        value: nextDueWord ? nextDueWord.word : 'Ổn định',
        note: nextDueWord ? `${nextDueWord.meaning} • ${formatRelativeDue(nextDueWord.review.dueAt)}` : 'Hiện chưa có từ nào sắp đến hạn.',
        meter: nextDueWord ? 55 : 100
      }
    ];

    container.innerHTML = '';
    cards.forEach(card => {
      const item = document.createElement('div');
      item.className = 'focus-card';
      item.innerHTML = `
        <span class="focus-label">${escapeHtml(card.label)}</span>
        <strong>${escapeHtml(card.value)}</strong>
        <div class="focus-note">${escapeHtml(card.note)}</div>
        <div class="progress-meter"><span style="width:${card.meter}%"></span></div>
      `;
      container.appendChild(item);
    });
  }

  function renderReviewInsights(words) {
    const panel = byId('reviewInsightPanel');
    if (!panel) return;
    const weakTypes = getWeakTypeStats(words).slice(0, 3);
    const logs = getRecentLogs(4);
    const dueSoon = [...words].filter(word => word.review?.dueAt && word.review.dueAt > Date.now())
      .sort((a, b) => a.review.dueAt - b.review.dueAt)
      .slice(0, 3);

    panel.innerHTML = '';

    const weakCard = document.createElement('div');
    weakCard.className = 'insight-card';
    weakCard.innerHTML = `<div class="insight-label">Điểm yếu nổi bật</div><div class="insight-note">${weakTypes.length ? 'Ưu tiên kéo các nhóm này lên bằng Flashcard hoặc Gõ từ.' : 'Chưa có nhóm yếu nổi bật, nhịp học đang ổn.'}</div>`;
    const weakList = document.createElement('ul');
    (weakTypes.length ? weakTypes : [['Chưa có nhóm nào', 0]]).forEach(([label, count]) => {
      const li = document.createElement('li');
      li.textContent = count ? `${label}: ${count} từ` : String(label);
      weakList.appendChild(li);
    });
    weakCard.appendChild(weakList);
    panel.appendChild(weakCard);

    const dueCard = document.createElement('div');
    dueCard.className = 'insight-card';
    dueCard.innerHTML = `<div class="insight-label">Sắp đến hạn</div><div class="insight-note">Những từ này nên được ôn trước khi chuyển sang học mới.</div>`;
    const dueList = document.createElement('ul');
    (dueSoon.length ? dueSoon : [{ word: 'Chưa có', meaning: 'Chưa có từ nào sắp đến hạn', review: { dueAt: 0 } }]).forEach(word => {
      const li = document.createElement('li');
      li.textContent = word.word === 'Chưa có' ? word.meaning : `${word.word} • ${word.meaning} • ${formatRelativeDue(word.review.dueAt)}`;
      dueList.appendChild(li);
    });
    dueCard.appendChild(dueList);
    panel.appendChild(dueCard);

    const logCard = document.createElement('div');
    logCard.className = 'insight-card';
    logCard.innerHTML = `<div class="insight-label">Lượt học gần đây</div><div class="insight-note">Xem nhanh nhịp ôn tập để giữ sự đều đặn.</div>`;
    const logList = document.createElement('ul');
    (logs.length ? logs : [{ game: 'Chưa có lượt học nào', total: 0, dateLabel: 'Hãy bắt đầu bằng một vòng ôn ngắn' }]).forEach(entry => {
      const li = document.createElement('li');
      li.textContent = entry.total ? `${entry.game} • ${entry.total} lượt • ${entry.dateLabel}` : entry.dateLabel;
      logList.appendChild(li);
    });
    logCard.appendChild(logList);
    panel.appendChild(logCard);
  }

  function getUniqueWordsets(vocab = state.vocab) {
    return Array.from(new Set(vocab.map(word => word.wordset).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'vi'));
  }

  function getWordsForSet(setName) {
    return setName === 'all' ? [...state.vocab] : state.vocab.filter(word => word.wordset === setName);
  }

  function clampConfidence(value) {
    return Math.max(0, Math.min(4, Number.isFinite(value) ? Math.round(value) : 0));
  }

  function deriveConfidenceValue(review = {}, isLearned = false) {
    if (Number.isFinite(review?.confidence)) return clampConfidence(review.confidence);
    if (!review?.lastReviewedAt) return 0;
    if (isLearned || review.streak >= 4 || review.correctCount >= 6) return 4;
    if (review.streak >= 3 || review.correctCount >= 4) return 3;
    if (review.streak >= 1 || review.correctCount >= 2 || review.seenCount >= 3) return 2;
    return 1;
  }

  function getConfidenceValue(word) {
    return deriveConfidenceValue(word?.review || {}, Boolean(word?.isLearned));
  }

  function getMemoryStage(word) {
    return MEMORY_STAGES[getConfidenceValue(word)] || MEMORY_STAGES[0];
  }

  function getMemoryStageCounts(words) {
    return MEMORY_STAGES.map(stage => ({
      ...stage,
      count: words.filter(word => getConfidenceValue(word) === stage.level).length
    }));
  }

  function buildMemoryStageSummary(words) {
    const counts = getMemoryStageCounts(words).filter(stage => stage.count > 0);
    if (!counts.length) return 'Chưa có tiến độ ghi nhớ để hiển thị.';
    return counts.map(stage => `${stage.label}: ${stage.count}`).join(' • ');
  }

  function isNewWord(word) {
    return getConfidenceValue(word) === 0;
  }

  function isDueWord(word) {
    if (!word.review.lastReviewedAt) return false;
    return !word.review.dueAt || word.review.dueAt <= Date.now();
  }

  function isWeakWord(word) {
    const confidence = getConfidenceValue(word);
    return confidence <= 1 && word.review.seenCount > 0
      || word.review.wrongCount > word.review.correctCount
      || (word.review.seenCount > 0 && word.review.streak < 2 && !isDueWord(word));
  }

  function isMasteredWord(word) {
    return getConfidenceValue(word) >= 4 || word.isLearned;
  }

  function getWordStatusLabel(word) {
    if (isDueWord(word)) return 'Đến hạn';
    if (isWeakWord(word)) return 'Cần ôn lại';
    return getMemoryStage(word).label;
  }

  function getSetStats(words) {
    const due = words.filter(isDueWord).length;
    const fresh = words.filter(isNewWord).length;
    const weak = words.filter(isWeakWord).length;
    const mastered = words.filter(isMasteredWord).length;
    const stageCounts = getMemoryStageCounts(words);
    return {
      total: words.length,
      due,
      fresh,
      weak,
      mastered,
      stageCounts,
      progress: words.length ? Math.round((mastered / words.length) * 100) : 0
    };
  }

  function getRecommendedQueue(words, limit = 20) {
    const due = words.filter(isDueWord).sort((a, b) => (a.review.dueAt || 0) - (b.review.dueAt || 0) || getConfidenceValue(a) - getConfidenceValue(b));
    const weak = words.filter(word => isWeakWord(word) && !due.some(item => item.id === word.id))
      .sort((a, b) => getConfidenceValue(a) - getConfidenceValue(b) || b.review.wrongCount - a.review.wrongCount || a.review.streak - b.review.streak);
    const fresh = words.filter(word => isNewWord(word) && !due.some(item => item.id === word.id) && !weak.some(item => item.id === word.id));
    const building = words.filter(word => !due.some(item => item.id === word.id) && !weak.some(item => item.id === word.id) && !fresh.some(item => item.id === word.id) && getConfidenceValue(word) < 4)
      .sort((a, b) => getConfidenceValue(a) - getConfidenceValue(b) || (a.review.dueAt || Number.MAX_SAFE_INTEGER) - (b.review.dueAt || Number.MAX_SAFE_INTEGER));
    const mastered = shuffle(words.filter(word => !due.some(item => item.id === word.id) && !weak.some(item => item.id === word.id) && !fresh.some(item => item.id === word.id) && !building.some(item => item.id === word.id)));
    return [...due, ...weak, ...fresh, ...building, ...mastered].slice(0, Math.max(1, limit));
  }

  function getSessionQueue(words, gameType) {
    if (gameType === 'srs') return getRecommendedQueue(words, 20);
    const maxItems = gameType === 'matching' ? 18 : 20;
    return shuffle([...words]).slice(0, Math.min(words.length, maxItems));
  }

  function getRecommendedStudyPlan(words, stats = getSetStats(words)) {
    if (!words.length) {
      return {
        gameType: null,
        title: 'Chưa có dữ liệu để ôn',
        reason: 'Hãy thêm vài từ trước khi bắt đầu một lộ trình học mới.'
      };
    }

    if (stats.due > 0) {
      return {
        gameType: 'srs',
        title: `Ôn tập thông minh • ${Math.min(getRecommendedQueue(words, 20).length, 20)} từ ưu tiên`,
        reason: 'Ưu tiên từ đến hạn trước để giữ nền tảng ghi nhớ dài hạn ổn định và không làm rơi mức nhớ hiện tại.'
      };
    }

    if (stats.weak > 0) {
      return {
        gameType: 'typing',
        title: `Gõ từ • ${Math.min(words.length, 10)} câu luyện nhớ chủ động`,
        reason: 'Những từ còn yếu nên được kéo sang hình thức nhớ chủ động để tăng dần mức nhớ thay vì chỉ xem lại thụ động.'
      };
    }

    if (stats.fresh > 0) {
      return {
        gameType: 'flashcard',
        title: `Flashcard • ${Math.min(words.length, 20)} thẻ khởi động`,
        reason: 'Từ mới nên đi qua một vòng nhận diện nhẹ trước khi chuyển sang các bài tập khó hơn.'
      };
    }

    if (words.length >= 4) {
      return {
        gameType: 'quiz',
        title: `Trắc nghiệm • ${Math.min(words.length, 10)} câu tăng phản xạ`,
        reason: 'Khi bộ từ đã khá ổn định, trắc nghiệm là cách an toàn để kiểm tra tốc độ nhận biết.'
      };
    }

    return {
      gameType: 'flashcard',
      title: `Flashcard • ${Math.min(words.length, 20)} thẻ ôn nhẹ`,
      reason: 'Với bộ từ nhỏ, flashcard vẫn là bước ôn ổn định và ít rủi ro nhất.'
    };
  }

  function startRecommendedStudy() {
    const setName = byId('reviewSetDropdown').value || 'all';
    const words = getWordsForSet(setName);
    const plan = getRecommendedStudyPlan(words);
    if (!plan.gameType) return showToast('Hãy thêm vài từ trước khi bắt đầu học.');
    startGame(plan.gameType, setName, { planTitle: plan.title, planReason: plan.reason });
  }

  function startTargetedFocus(type) {
    const setName = byId('reviewSetDropdown').value || 'all';
    const words = getWordsForSet(setName);
    const filters = {
      due: words.filter(isDueWord),
      weak: words.filter(isWeakWord),
      new: words.filter(isNewWord)
    };
    const queue = filters[type] || [];
    if (!queue.length) return showToast('Hiện chưa có nhóm từ phù hợp để mở nhanh.');
    const config = {
      due: { gameType: 'srs', title: 'Ôn từ đến hạn', reason: 'Giữ nền tảng trí nhớ không bị tụt.' },
      weak: { gameType: 'typing', title: 'Ôn từ yếu', reason: 'Kéo các từ còn yếu sang nhớ chủ động.' },
      new: { gameType: 'flashcard', title: 'Làm quen từ mới', reason: 'Xây lớp ghi nhớ đầu tiên thật nhẹ nhàng.' }
    }[type];
    startGame(config.gameType, setName, { queue, planTitle: config.title, planReason: config.reason });
  }

  function initMainView() {
    populateSetDropdown(byId('wordsetDropdown'));
  }

  function initManagementView() {
    renderManagementSummary();
    renderWordsetsGrid();
  }

  function initReviewView() {
    populateSetDropdown(byId('reviewSetDropdown'), true);
    renderReviewDashboard();
  }

  function populateSetDropdown(selectEl, includeAll = false) {
    if (!selectEl) return;
    const currentValue = selectEl.value;
    const sets = getUniqueWordsets();
    selectEl.innerHTML = '';

    if (includeAll) {
      const allOption = document.createElement('option');
      allOption.value = 'all';
      allOption.textContent = 'Tất cả bộ từ';
      selectEl.appendChild(allOption);
    }

    if (sets.length === 0) {
      const fallback = document.createElement('option');
      fallback.value = 'Chưa phân loại';
      fallback.textContent = 'Chưa phân loại';
      selectEl.appendChild(fallback);
    } else {
      sets.forEach(setName => {
        const option = document.createElement('option');
        option.value = setName;
        option.textContent = setName;
        selectEl.appendChild(option);
      });
    }

    if (Array.from(selectEl.options).some(option => option.value === currentValue)) {
      selectEl.value = currentValue;
    } else if (includeAll) {
      selectEl.value = 'all';
    }
  }

  function renderManagementSummary() {
    const sets = getUniqueWordsets();
    const stats = getSetStats(state.vocab);
    const today = getDailyProgressRecord();
    const summary = byId('managementSummary');
    summary.innerHTML = '';

    [
      { label: 'Tổng số từ', value: stats.total, note: 'Tất cả bộ từ hiện có' },
      { label: 'Bộ từ', value: sets.length, note: 'Dễ chia theo chủ đề' },
      { label: 'Đến hạn hôm nay', value: stats.due, note: 'Nên ôn sớm để không quên' },
      { label: 'Tiến độ hôm nay', value: `${today.studied}/${state.stats.dailyGoal}`, note: `Chuỗi học ${state.stats.currentStreak} ngày` }
    ].forEach(item => {
      const card = document.createElement('div');
      card.className = 'summary-card';
      card.innerHTML = `<span class="summary-label">${item.label}</span><strong>${item.value}</strong><span class="summary-note">${item.note}</span>`;
      summary.appendChild(card);
    });
  }

  function renderWordsetsGrid() {
    const grid = byId('wordsetGrid');
    grid.innerHTML = '';

    const createCard = document.createElement('button');
    createCard.className = 'set-card create-new-card';
    createCard.innerHTML = '<div class="create-new-content"><span class="create-icon">+</span><h2>Tạo bộ từ mới</h2><p class="muted-text">Bắt đầu một nhóm từ mới và thêm dữ liệu ngay.</p></div>';
    createCard.addEventListener('click', () => {
      showView('main-view');
      openModal('createSetModal');
    });
    grid.appendChild(createCard);

    const allSets = getUniqueWordsets();
    if (!state.vocab.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = '<strong>Chưa có từ vựng nào</strong><div>Thêm vài từ đầu tiên để bắt đầu học và theo dõi tiến độ.</div>';
      grid.appendChild(empty);
      return;
    }

    const query = normalizeAnswer(byId('setSearchInput')?.value || '');
    const sortBy = byId('setSortSelect')?.value || 'due';

    const sets = allSets
      .map(setName => {
        const words = state.vocab.filter(word => word.wordset === setName);
        const stats = getSetStats(words);
        const searchBlob = normalizeAnswer(`${setName} ${words.map(word => `${word.word} ${word.meaning} ${word.wordType}`).join(' ')}`);
        return { setName, words, stats, searchBlob, latest: Math.max(...words.map(word => word.createdAt || 0), 0) };
      })
      .filter(item => !query || item.searchBlob.includes(query));

    const sorters = {
      due: (a, b) => b.stats.due - a.stats.due || b.stats.weak - a.stats.weak || a.setName.localeCompare(b.setName, 'vi'),
      recent: (a, b) => b.latest - a.latest || a.setName.localeCompare(b.setName, 'vi'),
      size: (a, b) => b.stats.total - a.stats.total || a.setName.localeCompare(b.setName, 'vi'),
      progress: (a, b) => b.stats.progress - a.stats.progress || a.setName.localeCompare(b.setName, 'vi'),
      name: (a, b) => a.setName.localeCompare(b.setName, 'vi')
    };
    sets.sort(sorters[sortBy] || sorters.due);

    if (!sets.length) {
      const emptySearch = document.createElement('div');
      emptySearch.className = 'set-card-search-empty';
      emptySearch.innerHTML = '<strong>Không tìm thấy bộ từ phù hợp</strong><div>Thử đổi từ khóa hoặc thứ tự sắp xếp.</div>';
      grid.appendChild(emptySearch);
      return;
    }

    sets.forEach(({ setName, words, stats }) => {
      const weakTypes = getWeakTypeStats(words);
      const card = document.createElement('div');
      card.className = 'set-card';
      card.innerHTML = `
        <div class="card-header">
          <div class="card-title-icon-wrapper">
            <span class="set-icon">🏷️</span>
            <span class="set-title">${escapeHtml(setName)}</span>
          </div>
          <span class="summary-note">${stats.progress}%</span>
        </div>
        <div class="card-details">
          <div class="card-metrics">
            <span>${words.length} từ</span>
            <span>${stats.due} đến hạn</span>
            <span>${stats.fresh} mới</span>
            <span>${stats.weak} cần ôn</span>
          </div>
          <div class="progress-bar-container"><div class="progress-bar" style="width:${stats.progress}%"></div></div>
          <div class="card-metrics">
            <span>${stats.mastered}/${stats.total || 0} đã vững</span>
            <span>${weakTypes[0] ? `Yếu nhất: ${weakTypes[0][0]}` : 'Đang cân bằng'}</span>
          </div>
        </div>
        <div class="card-action-bar">
          <button class="card-btn btn-view">Xem / sửa</button>
          <button class="card-btn btn-study">Ôn ngay</button>
          <button class="card-btn btn-delete">Xóa</button>
        </div>
      `;

      card.querySelector('.btn-view').addEventListener('click', () => openSetDetails(setName));
      card.querySelector('.btn-study').addEventListener('click', () => {
        showView('review-dashboard-view');
        byId('reviewSetDropdown').value = setName;
        initReviewView();
      });
      card.querySelector('.btn-delete').addEventListener('click', async () => {
        if (!confirm(`Bạn có chắc muốn xóa toàn bộ bộ từ "${setName}"?`)) return;
        state.vocab = state.vocab.filter(word => word.wordset !== setName);
        await saveAndRefresh({ showManagement: true });
        showToast(`Đã xóa bộ từ "${setName}".`);
      });
      grid.appendChild(card);
    });
  }

  function openSetDetails(setName) {
    state.currentDetailsSet = setName;
    showView('set-details-view');
    const words = state.vocab.filter(word => word.wordset === setName);
    const stats = getSetStats(words);
    byId('detailsSetName').textContent = setName;
    byId('detailsSummaryText').textContent = `${words.length} từ • ${stats.due} từ đến hạn • ${stats.fresh} từ mới • ${stats.weak} từ cần củng cố • ${buildMemoryStageSummary(words)}`;
    byId('detailsSearchInput').value = '';
    byId('detailsFilterSelect').value = 'all';
    renderEditableTable(words, 'setDetailsTableContainer', { preserveMeta: true });
    applySetDetailsFilters();
  }

  async function saveSetDetailsChanges() {
    if (!state.currentDetailsSet) return;
    const updatedWords = collectEditedWordsFromTable('setDetailsTableContainer', { preserveMeta: true })
      .map(word => ({ ...word, wordset: state.currentDetailsSet }));

    const otherWords = state.vocab.filter(word => word.wordset !== state.currentDetailsSet);
    state.vocab = [...otherWords, ...updatedWords].map((word, index) => normalizeWord(word, index));
    await saveAndRefresh({ showManagement: true });
    showToast('Đã lưu thay đổi của bộ từ.');
  }

  async function deleteCurrentSet() {
    if (!state.currentDetailsSet) return;
    if (!confirm(`Bạn có chắc muốn xóa bộ từ "${state.currentDetailsSet}"?`)) return;
    state.vocab = state.vocab.filter(word => word.wordset !== state.currentDetailsSet);
    state.currentDetailsSet = null;
    await saveAndRefresh({ showManagement: true });
    showToast('Đã xóa bộ từ.');
  }

  function renderReviewDashboard() {
    const setName = byId('reviewSetDropdown').value || 'all';
    const words = getWordsForSet(setName);
    const stats = getSetStats(words);

    byId('reviewDueCount').textContent = stats.due;
    byId('reviewNewCount').textContent = stats.fresh;
    byId('reviewWeakCount').textContent = stats.weak;
    byId('reviewMasteredCount').textContent = stats.mastered;

    const recommendation = byId('reviewRecommendation');
    const dashboardSubtext = byId('dashboardSubtext');
    const stageStrip = byId('memoryStageStrip');
    const smartQueueSize = getRecommendedQueue(words, 20).length;
    const recommendedPlan = getRecommendedStudyPlan(words, stats);

    if (!words.length) {
      recommendation.textContent = 'Bộ từ đang trống. Hãy thêm từ trước khi bắt đầu ôn tập.';
      dashboardSubtext.textContent = 'Khi có dữ liệu, mọi chế độ sẽ cùng cập nhật tiến độ học.';
    } else if (stats.due > 0) {
      recommendation.textContent = `Bạn có ${stats.due} từ đến hạn. “Ôn tập thông minh” là lựa chọn nên bắt đầu trước.`;
      dashboardSubtext.textContent = `Thang nhớ hiện tại: ${buildMemoryStageSummary(words)}.`;
    } else if (stats.weak > 0) {
      recommendation.textContent = `Có ${stats.weak} từ đang cần củng cố. Flashcard hoặc Gõ từ sẽ hiệu quả nhất lúc này.`;
      dashboardSubtext.textContent = `Thang nhớ hiện tại: ${buildMemoryStageSummary(words)}.`;
    } else if (stats.fresh > 0) {
      recommendation.textContent = `Có ${stats.fresh} từ mới chưa ôn. Bắt đầu bằng Flashcard hoặc Quiz.`;
      dashboardSubtext.textContent = `Thang nhớ hiện tại: ${buildMemoryStageSummary(words)}.`;
    } else {
      recommendation.textContent = 'Bạn đang khá ổn. Có thể chơi Quiz hoặc Nghe viết để tăng phản xạ.';
      dashboardSubtext.textContent = `Thang nhớ hiện tại: ${buildMemoryStageSummary(words)}.`;
    }

    if (stageStrip) {
      stageStrip.innerHTML = '';
      stats.stageCounts.forEach(stage => {
        const chip = document.createElement('div');
        chip.className = 'memory-stage-chip';
        chip.innerHTML = `<span class="memory-stage-count">${stage.count}</span><div><strong>${stage.label}</strong><span>${stage.note}</span></div>`;
        stageStrip.appendChild(chip);
      });
    }

    renderDailyFocus(words);
    renderReviewInsights(words);

    byId('recommendedModeTitle').textContent = recommendedPlan.title;
    byId('recommendedModeReason').textContent = recommendedPlan.reason;
    byId('startRecommendedBtn').disabled = !recommendedPlan.gameType;
    byId('startDueFocusBtn').disabled = !stats.due;
    byId('startWeakFocusBtn').disabled = !stats.weak;
    byId('startNewFocusBtn').disabled = !stats.fresh;

    const badgeText = {
      flashcard: `${Math.min(words.length, 20)} thẻ`,
      quiz: `${Math.min(words.length, 10)} câu`,
      matching: `${Math.min(words.length, 6)} cặp`,
      typing: `${Math.min(words.length, 10)} câu`,
      dictation: `${Math.min(words.length, 10)} câu`,
      srs: `${smartQueueSize} từ ưu tiên`
    };

    document.querySelectorAll('[data-badge]').forEach(node => {
      node.textContent = badgeText[node.dataset.badge] || '0';
    });
  }

  function createSetFromModal() {
    const input = byId('newSetNameInput');
    const setName = input.value.trim();
    if (!setName) {
      input.classList.add('shake-error');
      setTimeout(() => input.classList.remove('shake-error'), 350);
      return showToast('Vui lòng nhập tên bộ từ.');
    }
    populateSetDropdown(byId('wordsetDropdown'));

    if (!getUniqueWordsets().includes(setName)) {
      const option = document.createElement('option');
      option.value = setName;
      option.textContent = setName;
      byId('wordsetDropdown').appendChild(option);
    }
    byId('wordsetDropdown').value = setName;
    input.value = '';
    closeModal('createSetModal');
    showView('main-view');
    showToast(`Đã tạo bộ từ “${setName}”.`);
  }

  async function saveQuickWord() {
    const word = byId('quickWord').value.trim();
    const phonetic = byId('quickPhonetic').value.trim();
    const wordType = byId('quickType').value.trim();
    const meaning = byId('quickMeaning').value.trim();
    const example = byId('quickExample').value.trim();
    const notes = byId('quickNotes').value.trim();
    if (!word || !meaning) {
      showToast('Vui lòng nhập đủ từ và nghĩa.');
      return;
    }

    const wordset = byId('wordsetDropdown').value || 'Chưa phân loại';
    const newWord = normalizeWord({ word, phonetic, wordType, meaning, example, notes, wordset, createdAt: Date.now() });
    state.vocab.unshift(newWord);
    await saveAndRefresh();
    closeModal('quickAddModal');
    ['quickWord', 'quickPhonetic', 'quickType', 'quickMeaning', 'quickExample', 'quickNotes'].forEach(id => { byId(id).value = ''; });
    byId('wordsetDropdown').value = wordset;
    showToast('Đã thêm từ mới.');
  }

  async function handleCsvImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = parseCsvText(text);
    state.parsedWords = parsed.words;
    state.parseMeta = parsed.meta;
    renderParsedPreview();
    event.target.value = '';
  }

  function handleBulkPreview() {
    const text = byId('bulkInput').value.trim();
    if (!text) return showToast('Hãy nhập hoặc dán dữ liệu trước.');
    const separator = text.includes('\t') ? '\t' : '|';
    const parsed = parseBulkText(text, separator);
    state.parsedWords = parsed.words;
    state.parseMeta = parsed.meta;
    renderParsedPreview();
  }

  function renderParsedPreview() {
    if (!state.parsedWords.length) return showToast('Không tìm thấy dòng hợp lệ để nhập.');
    renderEditableTable(state.parsedWords, 'previewTableContainer', { preserveMeta: false });
    byId('importSummaryText').textContent = buildImportSummary(state.parseMeta);
    byId('saveWordsBtn').textContent = `Lưu ${state.parsedWords.length} từ`;
    byId('input-view').classList.add('hidden');
    byId('preview-view').classList.remove('hidden');
  }

  function parseBulkText(text, separator) {
    const lines = text.split(/\r?\n/);
    let skipped = 0;
    const words = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      if (!trimmed.includes(separator)) {
        skipped += 1;
        return;
      }
      const columns = trimmed.split(separator).map(part => part.trim());
      const word = mapColumnsToWord(columns);
      if (word.word && word.meaning) words.push(word);
      else skipped += 1;
    });

    return {
      words,
      meta: {
        source: separator === '\t' ? 'tab' : 'pipe',
        totalRows: lines.filter(Boolean).length,
        importedRows: words.length,
        skippedRows: skipped
      }
    };
  }

  function parseCsvText(text) {
    const rows = text.split(/\r?\n/).filter(row => row.trim());
    let skipped = 0;
    const words = [];

    rows.forEach((row, index) => {
      const columns = splitCsvRow(row).map(cell => cell.trim());
      if (!columns.length || columns.every(cell => !cell)) return;
      if (index === 0 && looksLikeHeader(columns)) return;
      const word = mapColumnsToWord(columns);
      if (word.word && word.meaning) words.push(word);
      else skipped += 1;
    });

    return {
      words,
      meta: {
        source: 'csv',
        totalRows: rows.length,
        importedRows: words.length,
        skippedRows: skipped
      }
    };
  }

  function splitCsvRow(row) {
    const cells = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i += 1) {
      const char = row[i];
      const next = row[i + 1];
      if (char === '"') {
        if (inQuotes && next === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        cells.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    cells.push(current);
    return cells;
  }

  function looksLikeHeader(columns) {
    const first = normalizeAnswer(columns[0] || '');
    const second = normalizeAnswer(columns[1] || '');
    return ['word', 'tu', 'tu vung', 'vocabulary'].includes(first) || ['meaning', 'nghia'].includes(second);
  }

  function looksLikeWordType(value) {
    const normalized = normalizeAnswer(value || '');
    if (!normalized) return false;
    const knownTypes = new Set([
      'noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'interjection',
      'article', 'determiner', 'auxiliary', 'modal verb', 'phrasal verb', 'phrase', 'idiom',
      'countable noun', 'uncountable noun', 'transitive verb', 'intransitive verb',
      'n', 'v', 'adj', 'adv', 'phr', 'expr',
      'danh tu', 'dong tu', 'tinh tu', 'trang tu', 'dai tu', 'gioi tu', 'lien tu', 'thot tu',
      'cum tu', 'thanh ngu'
    ]);
    return knownTypes.has(normalized);
  }

  function mapColumnsToWord(columns) {
    if (columns.length <= 2) {
      return {
        word: columns[0] || '',
        phonetic: '',
        wordType: '',
        meaning: columns[1] || '',
        example: '',
        notes: ''
      };
    }

    const third = columns[2] || '';
    const fourth = columns[3] || '';
    const thirdIsType = looksLikeWordType(third);
    const fourthIsType = looksLikeWordType(fourth);

    const preferNewOrder = thirdIsType && !fourthIsType;
    const useLegacyOrder = !thirdIsType && fourthIsType;

    return {
      word: columns[0] || '',
      phonetic: columns[1] || '',
      wordType: preferNewOrder ? third : useLegacyOrder ? fourth : third,
      meaning: preferNewOrder ? fourth : useLegacyOrder ? third : fourth,
      example: columns[4] || '',
      notes: columns[5] || ''
    };
  }

  function buildImportSummary(meta) {
    if (!meta) return 'Kiểm tra dữ liệu trước khi lưu.';
    const sourceLabel = meta.source === 'csv' ? 'CSV' : meta.source === 'tab' ? 'bảng tab' : 'dấu |';
    return `Nguồn: ${sourceLabel} • Hợp lệ: ${meta.importedRows} dòng • Bỏ qua: ${meta.skippedRows} dòng`;
  }

  function renderEditableTable(words, containerId, { preserveMeta = false } = {}) {
    const container = byId(containerId);
    container.innerHTML = '';

    if (!words.length) {
      container.innerHTML = '<div class="empty-state"><strong>Không có dữ liệu</strong><div>Hãy thêm hoặc nhập từ mới để tiếp tục.</div></div>';
      return;
    }

    const table = document.createElement('table');
    table.className = 'data-table';
    table.id = `wordsTable_${containerId}`;
    table.innerHTML = '<thead><tr><th>#</th><th>Từ vựng</th><th>Phiên âm</th><th>Loại từ / Nhóm</th><th>Nghĩa</th><th>Ví dụ</th><th>Ghi chú</th><th>Xóa</th></tr></thead>';
    const tbody = document.createElement('tbody');

    words.forEach((item, index) => {
      const row = document.createElement('tr');
      const rowWord = item.review ? item : normalizeWord(item, index);
      row.dataset.word = normalizeAnswer(item.word || '');
      row.dataset.meaning = normalizeAnswer(item.meaning || '');
      row.dataset.type = normalizeAnswer(item.wordType || '');
      row.dataset.status = isDueWord(rowWord) ? 'due' : isWeakWord(rowWord) ? 'weak' : isNewWord(rowWord) ? 'new' : isMasteredWord(rowWord) ? 'strong' : 'all';
      if (preserveMeta) row._meta = { ...item };
      appendCell(row, String(index + 1));
      appendInputCell(row, item.word || '');
      appendInputCell(row, item.phonetic || '');
      appendInputCell(row, item.wordType || '');
      appendInputCell(row, item.meaning || '');
      appendInputCell(row, item.example || '');
      appendInputCell(row, item.notes || '');

      const deleteCell = document.createElement('td');
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'delete-row-btn';
      deleteBtn.textContent = '🗑';
      deleteBtn.addEventListener('click', () => {
        row.remove();
        renumberTableRows(table);
        if (containerId === 'previewTableContainer') {
          byId('saveWordsBtn').textContent = `Lưu ${table.querySelectorAll('tbody tr').length} từ`;
        }
      });
      deleteCell.appendChild(deleteBtn);
      row.appendChild(deleteCell);
      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    container.appendChild(table);
  }

  function appendCell(row, text) {
    const cell = document.createElement('td');
    cell.textContent = text;
    row.appendChild(cell);
  }

  function appendInputCell(row, value) {
    const cell = document.createElement('td');
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'table-input';
    input.value = value;
    cell.appendChild(input);
    row.appendChild(cell);
  }

  function renumberTableRows(table) {
    table.querySelectorAll('tbody tr').forEach((row, index) => {
      row.firstChild.textContent = String(index + 1);
    });
  }

  function collectEditedWordsFromTable(containerId, { preserveMeta = false } = {}) {
    const rows = byId(containerId).querySelectorAll('tbody tr');
    return Array.from(rows).map(row => {
      const inputs = row.querySelectorAll('input');
      const edited = {
        word: inputs[0]?.value.trim() || '',
        phonetic: inputs[1]?.value.trim() || '',
        wordType: inputs[2]?.value.trim() || '',
        meaning: inputs[3]?.value.trim() || '',
        example: inputs[4]?.value.trim() || '',
        notes: inputs[5]?.value.trim() || ''
      };
      if (preserveMeta && row._meta) {
        return {
          ...row._meta,
          ...edited
        };
      }
      return edited;
    }).filter(word => word.word && word.meaning);
  }


  function applySetDetailsFilters() {
    const container = byId('setDetailsTableContainer');
    if (!container) return;
    const rows = container.querySelectorAll('tbody tr');
    const query = normalizeAnswer(byId('detailsSearchInput')?.value || '');
    const filter = byId('detailsFilterSelect')?.value || 'all';
    let visibleCount = 0;

    rows.forEach(row => {
      const matchesQuery = !query || row.dataset.word.includes(query) || row.dataset.meaning.includes(query) || row.dataset.type.includes(query);
      const matchesFilter = filter === 'all' || row.dataset.status === filter || (filter === 'strong' && row.dataset.status === 'strong');
      const visible = matchesQuery && matchesFilter;
      row.classList.toggle('hidden-row', !visible);
      if (visible) visibleCount += 1;
    });

    const emptyId = 'setDetailsInlineEmpty';
    let empty = byId(emptyId);
    if (!visibleCount) {
      if (!empty) {
        empty = document.createElement('div');
        empty.id = emptyId;
        empty.className = 'inline-empty-state';
        empty.innerHTML = '<strong>Không có từ nào khớp bộ lọc</strong><div>Thử đổi từ khóa hoặc mức nhớ để xem thêm.</div>';
        container.appendChild(empty);
      }
    } else if (empty) {
      empty.remove();
    }
  }

  function buildBackupPayload() {
    return {
      exportedAt: new Date().toISOString(),
      version: '3.0.0',
      app: 'Vocab Master',
      vocab: state.vocab,
      stats: state.stats
    };
  }

  function downloadTextFile(filename, textContent) {
    const blob = new Blob([textContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function exportBackup() {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadTextFile(`vocab-master-backup-${stamp}.json`, JSON.stringify(buildBackupPayload(), null, 2));
    showToast('Đã xuất backup JSON.');
  }

  async function handleBackupImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const raw = JSON.parse(await file.text());
      const importedWords = Array.isArray(raw.vocab) ? raw.vocab.map((item, index) => normalizeWord(item, index)) : [];
      if (!importedWords.length) throw new Error('EMPTY');
      state.vocab = importedWords;
      state.stats = normalizeStats(raw.stats || {});
      await saveAndRefresh();
      showToast(`Đã nhập backup với ${importedWords.length} từ.`);
    } catch (error) {
      showToast('Không thể đọc file backup JSON này.');
    } finally {
      event.target.value = '';
    }
  }

  async function savePreviewWords() {
    const editedWords = collectEditedWordsFromTable('previewTableContainer');
    const wordset = byId('wordsetDropdown').value || 'Chưa phân loại';
    const existingKeys = new Set(
      state.vocab
        .filter(word => word.wordset === wordset)
        .map(word => buildDedupKey(word.word, word.meaning))
    );

    let duplicates = 0;
    const newWords = [];
    editedWords.forEach(word => {
      const dedupKey = buildDedupKey(word.word, word.meaning);
      if (existingKeys.has(dedupKey)) {
        duplicates += 1;
        return;
      }
      existingKeys.add(dedupKey);
      newWords.push(normalizeWord({ ...word, wordset, createdAt: Date.now() }));
    });

    if (!newWords.length) {
      return showToast(duplicates ? 'Tất cả dòng đều trùng với dữ liệu hiện có.' : 'Không có dòng hợp lệ để lưu.');
    }

    state.vocab = [...newWords, ...state.vocab];
    await saveAndRefresh();
    byId('bulkInput').value = '';
    byId('preview-view').classList.add('hidden');
    byId('input-view').classList.remove('hidden');
    state.parsedWords = [];
    state.parseMeta = null;
    showToast(`Đã lưu ${newWords.length} từ${duplicates ? ` • bỏ qua ${duplicates} dòng trùng` : ''}.`);
  }

  function buildDedupKey(word, meaning) {
    return `${normalizeAnswer(word)}__${normalizeAnswer(meaning)}`;
  }

  async function startGame(gameType, setName, options = {}) {
    const words = getWordsForSet(setName);
    const queue = Array.isArray(options.queue) && options.queue.length ? options.queue : getSessionQueue(words, gameType);
    if (!queue.length) return showToast('Bộ từ này đang trống.');

    state.activeSet = setName;
    state.currentGame = gameType;
    state.optionPool = [...words];
    state.currentCardIdx = 0;
    state.answerLocked = false;
    state.currentPlanTitle = options.planTitle || '';
    state.currentPlanReason = options.planReason || '';
    state.sessionStats = {
      gameType,
      planTitle: state.currentPlanTitle,
      total: queue.length,
      good: 0,
      hard: 0,
      again: 0,
      strengthened: 0,
      startAt: Date.now(),
      dateLabel: new Date().toLocaleString('vi-VN')
    };

    if (gameType === 'quiz' && queue.length < 4) return showToast('Trắc nghiệm cần ít nhất 4 từ.');
    if (gameType === 'matching' && queue.length < 4) return showToast('Nối cặp cần ít nhất 4 từ.');

    state.studyQueue = queue;

    if (gameType === 'quiz') {
      openModal('quizModeModal');
      return;
    }

    if (gameType === 'flashcard' || gameType === 'srs') {
      showView('study-mode-view');
      renderFlashcard();
      return;
    }
    if (gameType === 'typing') {
      showView('typing-mode-view');
      renderTyping();
      return;
    }
    if (gameType === 'dictation') {
      showView('dictation-mode-view');
      renderDictation();
      return;
    }
    if (gameType === 'matching') {
      showView('matching-mode-view');
      renderMatching();
    }
  }

  function exitCurrentGame() {
    stopMatchingTimer();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    state.currentGame = null;
    state.studyQueue = [];
    state.currentCardIdx = 0;
    state.answerLocked = false;
    showView('review-dashboard-view');
    initReviewView();
  }

  function renderFlashcard() {
    const card = state.studyQueue[state.currentCardIdx];
    if (!card) return finishSession('Đã hoàn thành lượt ôn tập này.');

    byId('fcCoinCount').textContent = getVisibleCoinCount();
    byId('studyProgress').textContent = `${Math.min(state.currentCardIdx + 1, state.studyQueue.length)} / ${state.studyQueue.length}`;
    byId('studyModeLabel').textContent = state.currentGame === 'srs' ? 'Ôn tập thông minh' : 'Flashcard';
    byId('fcStatusBadge').textContent = getWordStatusLabel(card);
    byId('fcMemoryBadge').textContent = `Mức nhớ: ${getMemoryStage(card).shortLabel}`;
    byId('fcWord').textContent = card.word;
    byId('fcType').textContent = card.wordType || 'Từ vựng';
    byId('fcPhonetic').textContent = card.phonetic || '—';
    byId('fcMeaning').textContent = card.meaning;
    byId('fcExample').textContent = card.example || 'Không có ví dụ';
    byId('fcNotes').textContent = card.notes || '';
    byId('fcTypingInput').value = '';
    byId('activeFlashcard').classList.remove('flipped');
  }

  async function handleFlashcardOutcome(quality) {
    const card = state.studyQueue[state.currentCardIdx];
    if (!card) return;

    const coinGain = quality === 'good' ? 5 : quality === 'hard' ? 2 : 0;
    await recordWordResult(card.id, quality, coinGain);

    if (quality === 'again') {
      requeueCurrentCard(2);
      showToast(`Đã đánh dấu cần ôn lại: ${card.word}`);
    } else {
      state.currentCardIdx += 1;
      if (quality === 'hard') showToast(`Đã ghi nhận “gần nhớ” cho ${card.word}.`);
    }

    renderFlashcard();
  }

  function handleFlashcardMeaningCheck() {
    const card = state.studyQueue[state.currentCardIdx];
    if (!card) return;
    const input = byId('fcTypingInput').value.trim();
    if (!input) return;

    if (isMeaningMatch(input, card.meaning)) {
      byId('activeFlashcard').classList.add('flipped');
      showToast('Khớp nghĩa. Bấm “Nhớ rồi” để ghi nhận tiến độ.');
    } else {
      showToast(`Chưa khớp. Gợi ý đúng: ${card.meaning}`);
      byId('fcTypingInput').classList.add('shake-error');
      setTimeout(() => byId('fcTypingInput').classList.remove('shake-error'), 350);
    }
  }

  function flashcardKeyHandler(event) {
    if (byId('study-mode-view').classList.contains('hidden')) return;
    if (document.activeElement === byId('fcTypingInput')) return;
    if (event.code === 'Space') {
      event.preventDefault();
      byId('activeFlashcard').classList.toggle('flipped');
    }
    if (event.code === 'ArrowRight') byId('btnNext').click();
    if (event.code === 'ArrowLeft') byId('btnPrev').click();
    if (event.key === '1' || event.key.toLowerCase() === 'x') byId('btnNotLearned').click();
    if (event.key === '2' || event.key.toLowerCase() === 'z') byId('btnAlmostLearned').click();
    if (event.key === '3' || event.key.toLowerCase() === 'c') byId('btnLearned').click();
    if (event.key.toLowerCase() === 's') byId('btnAudio').click();
  }

  function renderQuiz() {
    const card = state.studyQueue[state.currentCardIdx];
    if (!card) return finishSession('Đã hoàn thành bài trắc nghiệm.');

    state.answerLocked = false;
    byId('quizProgress').textContent = `${Math.min(state.currentCardIdx + 1, state.studyQueue.length)} / ${state.studyQueue.length}`;

    let promptText = card.word;
    let optionTextFor = (item) => item.meaning;

    if (state.activeQuizMode === 'meaning-word') {
      promptText = card.meaning;
      optionTextFor = (item) => item.word;
    } else if (state.activeQuizMode === 'context') {
      if (card.example) {
        const regex = new RegExp(escapeRegExp(card.word), 'gi');
        promptText = card.example.replace(regex, '_____');
      } else {
        promptText = card.meaning;
      }
      optionTextFor = (item) => item.word;
    }

    byId('quizQuestionWord').textContent = promptText;

    const wrongOptions = shuffle(state.optionPool.filter(item => item.id !== card.id)).slice(0, 3);
    const options = shuffle([card, ...wrongOptions]);
    const grid = byId('quizOptionsGrid');
    grid.innerHTML = '';

    options.forEach(option => {
      const button = document.createElement('button');
      button.className = 'quiz-option-btn';
      button.textContent = optionTextFor(option);
      button.addEventListener('click', async () => {
        if (state.answerLocked) return;
        state.answerLocked = true;
        Array.from(grid.querySelectorAll('button')).forEach(btn => btn.disabled = true);

        const correctButton = Array.from(grid.querySelectorAll('button')).find(btn => btn.textContent === optionTextFor(card));
        if (option.id === card.id) {
          button.classList.add('correct');
          await recordWordResult(card.id, 'good', 10);
          state.currentCardIdx += 1;
          setTimeout(renderQuiz, 650);
        } else {
          button.classList.add('wrong');
          correctButton?.classList.add('correct');
          await recordWordResult(card.id, 'again', 0);
          requeueCurrentCard(2);
          setTimeout(renderQuiz, 900);
        }
      });
      grid.appendChild(button);
    });
  }

  function renderTyping() {
    const card = state.studyQueue[state.currentCardIdx];
    if (!card) return finishSession('Đã hoàn thành phần gõ từ.');

    state.answerLocked = false;
    byId('typingProgress').textContent = `${Math.min(state.currentCardIdx + 1, state.studyQueue.length)} / ${state.studyQueue.length}`;
    byId('typingInput').value = '';
    byId('typingSpeakBtn').classList.add('hidden');

    const promptType = card.phonetic ? Math.floor(Math.random() * 3) : Math.floor(Math.random() * 2) + 1;

    if (promptType === 0 && card.phonetic) {
      byId('typingPromptHint').textContent = 'Phiên âm';
      byId('typingQuestionText').textContent = card.phonetic;
      byId('typingSpeakBtn').classList.remove('hidden');
      byId('typingSpeakBtn').onclick = () => playWordAudio(card.word);
    } else if (promptType === 1 && card.word.length > 3) {
      byId('typingPromptHint').textContent = `Nghĩa: ${card.meaning}`;
      byId('typingQuestionText').textContent = maskWord(card.word);
    } else {
      byId('typingPromptHint').textContent = 'Nghĩa của từ';
      byId('typingQuestionText').textContent = card.meaning;
    }

    byId('typingInput').focus();
  }

  async function handleTypingSubmit() {
    const card = state.studyQueue[state.currentCardIdx];
    if (!card || state.answerLocked) return;

    const input = byId('typingInput');
    const answer = input.value.trim();
    if (!answer) return;

    state.answerLocked = true;
    const verdict = evaluateWordAttempt(answer, card.word);
    if (verdict === 'good') {
      await recordWordResult(card.id, 'good', 10);
      showToast('Chính xác!');
      state.currentCardIdx += 1;
      setTimeout(renderTyping, 500);
    } else if (verdict === 'hard') {
      await recordWordResult(card.id, 'hard', 5);
      showToast(`Gần đúng. Đáp án chuẩn là “${card.word}”.`);
      state.currentCardIdx += 1;
      setTimeout(renderTyping, 700);
    } else {
      await recordWordResult(card.id, 'again', 0);
      requeueCurrentCard(2);
      input.classList.add('shake-error');
      showToast(`Chưa đúng. Đáp án là “${card.word}”.`);
      setTimeout(() => {
        input.classList.remove('shake-error');
        renderTyping();
      }, 800);
    }
  }

  function renderDictation() {
    const card = state.studyQueue[state.currentCardIdx];
    if (!card) return finishSession('Đã hoàn thành phần nghe viết.');

    state.answerLocked = false;
    byId('dictationProgress').textContent = `${Math.min(state.currentCardIdx + 1, state.studyQueue.length)} / ${state.studyQueue.length}`;
    byId('dictationInput').value = '';
    byId('dictationInput').focus();
    playWordAudio(card.word);
  }

  async function handleDictationSubmit() {
    const card = state.studyQueue[state.currentCardIdx];
    if (!card || state.answerLocked) return;

    const input = byId('dictationInput');
    const answer = input.value.trim();
    if (!answer) return;

    state.answerLocked = true;
    const verdict = evaluateWordAttempt(answer, card.word);
    if (verdict === 'good') {
      await recordWordResult(card.id, 'good', 15);
      showToast('Nghe viết đúng!');
      state.currentCardIdx += 1;
      setTimeout(renderDictation, 650);
    } else if (verdict === 'hard') {
      await recordWordResult(card.id, 'hard', 6);
      showToast(`Bạn gõ rất gần đúng. Từ chuẩn là “${card.word}”.`);
      state.currentCardIdx += 1;
      setTimeout(renderDictation, 750);
    } else {
      await recordWordResult(card.id, 'again', 0);
      requeueCurrentCard(2);
      input.classList.add('shake-error');
      showToast(`Sai rồi. Từ đúng là “${card.word}”.`);
      setTimeout(() => {
        input.classList.remove('shake-error');
        renderDictation();
      }, 900);
    }
  }

  function renderMatching() {
    stopMatchingTimer();

    const remaining = state.studyQueue.slice(state.currentCardIdx);
    if (!remaining.length) return finishSession('Đã hoàn thành phần nối cặp.');

    state.matchingBatch = remaining.slice(0, Math.min(6, remaining.length));
    state.matchingSelection = null;
    state.matchingPairsSolved = 0;
    state.matchingLives = 5;
    state.matchingTimer = 0;
    byId('matchingLives').textContent = '❤️'.repeat(state.matchingLives);
    byId('matchingTimerTxt').textContent = '0s';
    state.matchingInterval = window.setInterval(() => {
      state.matchingTimer += 1;
      byId('matchingTimerTxt').textContent = `${state.matchingTimer}s`;
    }, 1000);

    const leftCol = byId('matchColLeft');
    const rightCol = byId('matchColRight');
    leftCol.innerHTML = '';
    rightCol.innerHTML = '';

    const leftCards = shuffle(state.matchingBatch.map(item => ({ id: item.id, text: item.word, type: 'word' })));
    const rightCards = shuffle(state.matchingBatch.map(item => ({ id: item.id, text: item.meaning, type: 'meaning' })));

    leftCards.forEach(card => leftCol.appendChild(createMatchButton(card)));
    rightCards.forEach(card => rightCol.appendChild(createMatchButton(card)));
  }

  function createMatchButton(cardData) {
    const button = document.createElement('button');
    button.className = 'match-card';
    button.textContent = cardData.text;
    button.dataset.id = cardData.id;
    button.dataset.type = cardData.type;

    button.addEventListener('click', async () => {
      if (button.classList.contains('solved') || state.answerLocked) return;

      if (!state.matchingSelection) {
        button.classList.add('selected');
        state.matchingSelection = button;
        return;
      }

      if (state.matchingSelection === button) return;
      if (state.matchingSelection.dataset.type === button.dataset.type) {
        state.matchingSelection.classList.remove('selected');
        button.classList.add('selected');
        state.matchingSelection = button;
        return;
      }

      if (state.matchingSelection.dataset.id === button.dataset.id) {
        state.matchingSelection.classList.remove('selected');
        state.matchingSelection.classList.add('solved');
        button.classList.add('solved');
        state.matchingSelection = null;
        state.matchingPairsSolved += 1;

        if (state.matchingPairsSolved === state.matchingBatch.length) {
          stopMatchingTimer();
          await Promise.all(state.matchingBatch.map(item => recordWordResult(item.id, 'good', 2, false)));
          await persistState();
          state.currentCardIdx += state.matchingBatch.length;
          showToast(`Hoàn thành ${state.matchingBatch.length} cặp trong ${state.matchingTimer}s!`);
          setTimeout(renderMatching, 900);
        }
      } else {
        state.answerLocked = true;
        button.classList.add('wrong');
        state.matchingSelection.classList.add('wrong');
        state.matchingLives -= 1;
        byId('matchingLives').textContent = '❤️'.repeat(Math.max(0, state.matchingLives)) + '🤍'.repeat(5 - Math.max(0, state.matchingLives));
        const first = state.matchingSelection;
        state.matchingSelection = null;

        setTimeout(async () => {
          button.classList.remove('wrong', 'selected');
          first.classList.remove('wrong', 'selected');
          state.answerLocked = false;
          if (state.matchingLives <= 0) {
            stopMatchingTimer();
            await Promise.all(state.matchingBatch.map(item => recordWordResult(item.id, 'again', 0, false)));
            await persistState();
            state.currentCardIdx += state.matchingBatch.length;
            showToast('Hết lượt ở vòng này. Chuyển sang nhóm tiếp theo.');
            setTimeout(renderMatching, 900);
          }
        }, 550);
      }
    });

    return button;
  }

  function stopMatchingTimer() {
    window.clearInterval(state.matchingInterval);
    state.matchingInterval = null;
  }

  async function recordWordResult(wordId, quality, coinGain = 0, persistImmediately = true) {
    const word = state.vocab.find(item => item.id === wordId);
    if (!word) return;

    const now = Date.now();
    const previousConfidence = getConfidenceValue(word);
    word.review = {
      ...REVIEW_DEFAULTS,
      ...(word.review || {})
    };
    word.review.confidence = deriveConfidenceValue(word.review, Boolean(word.isLearned));
    word.review.seenCount += 1;
    word.review.lastReviewedAt = now;

    if (quality === 'again') {
      word.review.streak = 0;
      word.review.wrongCount += 1;
      word.review.lapseCount += 1;
      word.review.confidence = clampConfidence(Math.max(0, word.review.confidence - 1));
      word.review.dueAt = now + 10 * 60 * 1000;
      word.isLearned = false;
    } else if (quality === 'hard') {
      word.review.correctCount += 1;
      word.review.hardCount += 1;
      word.review.streak = Math.max(1, word.review.streak);
      word.review.confidence = clampConfidence(Math.max(1, word.review.confidence));
      const confidenceIntervals = [0.25, 0.5, 1, 2, 4];
      const intervalDays = confidenceIntervals[word.review.confidence] || 0.5;
      word.review.dueAt = now + intervalDays * DAY_MS;
      word.isLearned = word.review.confidence >= 4;
    } else {
      word.review.correctCount += 1;
      word.review.streak += 1;
      word.review.confidence = clampConfidence(word.review.confidence + 1);
      const confidenceIntervals = [0.5, 1, 3, 6, 10];
      const intervalDays = confidenceIntervals[word.review.confidence] || 1;
      word.review.dueAt = now + intervalDays * DAY_MS;
      word.isLearned = word.review.confidence >= 4;
    }

    if (coinGain) state.stats.coins += coinGain;
    recordDailyOutcome(quality);

    if (state.sessionStats) {
      state.sessionStats[quality] += 1;
      if (getConfidenceValue(word) > previousConfidence) state.sessionStats.strengthened += 1;
    }

    if (persistImmediately) {
      await persistState();
      if (!byId('review-dashboard-view').classList.contains('hidden')) initReviewView();
      if (!byId('management-view').classList.contains('hidden')) initManagementView();
    }
  }

  function requeueCurrentCard(offset = 2) {
    if (state.currentCardIdx >= state.studyQueue.length) return;
    const [card] = state.studyQueue.splice(state.currentCardIdx, 1);
    const insertAt = Math.min(state.currentCardIdx + offset, state.studyQueue.length);
    state.studyQueue.splice(insertAt, 0, card);
  }

  async function finishSession(message) {
    stopMatchingTimer();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    state.currentGame = null;

    if (state.sessionStats) {
      state.sessionStats.durationSeconds = Math.max(1, Math.round((Date.now() - state.sessionStats.startAt) / 1000));
      state.stats.totalSessions += 1;
      const finishedAt = Date.now();
      const sessionRecord = {
        dateKey: getDateKeyFromTimestamp(finishedAt),
        finishedAt,
        game: state.currentPlanTitle || state.sessionStats.planTitle || state.sessionStats.gameType,
        total: state.sessionStats.total,
        good: state.sessionStats.good,
        hard: state.sessionStats.hard,
        again: state.sessionStats.again,
        strengthened: state.sessionStats.strengthened,
        durationSeconds: state.sessionStats.durationSeconds,
        dateLabel: new Date(finishedAt).toLocaleString('vi-VN')
      };
      state.stats.studyLog = [
        sessionRecord,
        ...(state.stats.studyLog || [])
      ].slice(0, 20);
      state.stats.sessionHistory = [
        sessionRecord,
        ...(state.stats.sessionHistory || [])
      ].slice(0, 180);
      await persistState();
      renderSessionSummary(message);
      openModal('sessionSummaryModal');
    }

    showToast(message);
    showView('review-dashboard-view');
    initReviewView();
  }

  function playWordAudio(wordText) {
    if (!('speechSynthesis' in window)) {
      showToast('Trình duyệt hiện không hỗ trợ phát âm.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(wordText);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }

  function normalizeAnswer(text = '') {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function levenshteinDistance(a, b) {
    const source = normalizeAnswer(a);
    const target = normalizeAnswer(b);
    if (!source || !target) return Math.max(source.length, target.length);
    const matrix = Array.from({ length: source.length + 1 }, () => Array(target.length + 1).fill(0));
    for (let i = 0; i <= source.length; i += 1) matrix[i][0] = i;
    for (let j = 0; j <= target.length; j += 1) matrix[0][j] = j;
    for (let i = 1; i <= source.length; i += 1) {
      for (let j = 1; j <= target.length; j += 1) {
        const cost = source[i - 1] === target[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    return matrix[source.length][target.length];
  }

  function evaluateWordAttempt(input, answer) {
    const user = normalizeAnswer(input);
    const correct = normalizeAnswer(answer);
    if (!user || !correct) return 'again';
    if (user === correct) return 'good';
    const distance = levenshteinDistance(user, correct);
    if ((correct.length >= 5 && distance === 1) || (correct.length >= 8 && distance === 2)) return 'hard';
    return 'again';
  }

  function isMeaningMatch(input, meaning) {
    const user = normalizeAnswer(input);
    if (!user) return false;
    const accepted = String(meaning)
      .split(/[;,/]|\bor\b|\bhoac\b/)
      .map(part => normalizeAnswer(part))
      .filter(Boolean);

    return accepted.some(answer => answer === user || answer.includes(user) || user.includes(answer) || levenshteinDistance(answer, user) <= 1);
  }

  function renderSessionSummary(message) {
    const grid = byId('sessionSummaryGrid');
    const textNode = byId('sessionSummaryText');
    if (!grid || !state.sessionStats) return;
    grid.innerHTML = '';
    [
      { label: 'Đã xử lý', value: state.sessionStats.total, note: 'Tổng lượt trong phiên này' },
      { label: 'Nhớ tốt', value: state.sessionStats.good, note: 'Trả lời chắc và đúng' },
      { label: 'Gần nhớ', value: state.sessionStats.hard, note: 'Đúng gần chuẩn hoặc còn lưỡng lự' },
      { label: 'Cần ôn lại', value: state.sessionStats.again, note: 'Sẽ được ưu tiên sớm hơn' }
    ].forEach(item => {
      const card = document.createElement('div');
      card.className = 'summary-card';
      card.innerHTML = `<span class="summary-label">${item.label}</span><strong>${item.value}</strong><span class="summary-note">${item.note}</span>`;
      grid.appendChild(card);
    });
    textNode.textContent = `${message} • Củng cố tăng cho ${state.sessionStats.strengthened} lượt • Thời gian ${state.sessionStats.durationSeconds}s. ${state.currentPlanReason || ''}`.trim();
  }

  function maskWord(word) {
    return word.split('').map((char, index) => {
      if (char === ' ') return ' ';
      return index % 2 === 1 ? '_' : char;
    }).join(' ');
  }

  function shuffle(list) {
    const cloned = [...list];
    for (let i = cloned.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
    }
    return cloned;
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escapeRegExp(text) {
    return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
});
