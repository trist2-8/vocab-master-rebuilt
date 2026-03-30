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
    confidence: 0,
    lastFailureAt: 0,
    lastFailureReason: '',
    lastSeenGame: ''
  };

  const MEMORY_STAGES = [
    { level: 0, label: 'Mới', shortLabel: 'Mới', note: 'Chưa ôn lần nào' },
    { level: 1, label: 'Làm quen', shortLabel: 'Làm quen', note: 'Đã thấy nhưng còn rất dễ quên' },
    { level: 2, label: 'Đang nhớ', shortLabel: 'Đang nhớ', note: 'Đã nhớ được một phần, cần nhắc lại' },
    { level: 3, label: 'Khá chắc', shortLabel: 'Khá chắc', note: 'Nhớ tương đối ổn, nên tiếp tục củng cố' },
    { level: 4, label: 'Rất vững', shortLabel: 'Rất vững', note: 'Đã qua nhiều lượt ôn tốt' }
  ];


  const DEFAULT_SETTINGS = {
    languageMode: 'en_focus',
    fxGlass: 'crystal',
    fxMotion: 'calm',
    fxScene: 'nebula',
    fxDensity: 'compact'
  };

  const LANGUAGE_MODE_OPTIONS = [
    { value: 'en_focus', viLabel: 'English Focus', enLabel: 'English Focus', balancedLabel: 'English Focus' },
    { value: 'balanced', viLabel: 'Cân bằng song ngữ', enLabel: 'Balanced Bilingual', balancedLabel: 'Balanced Bilingual' },
    { value: 'vi_focus', viLabel: 'Tiếng Việt thuần', enLabel: 'Pure Vietnamese', balancedLabel: 'Pure Vietnamese' }
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
    pendingFailureReason: '',
    smartSuggestions: [],
    smartSuggestionMeta: { byScope: {}, currentScope: 'all' },
    studySupport: null,
    optimizerReport: null,
    clusterMissions: [],
    settings: { ...DEFAULT_SETTINGS }
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

  function syncCompactNav() {
    document.body.classList.toggle('nav-condensed', window.scrollY > 56);
    if (window.scrollY > 16) closeLanguageModeMenu();
  }

  window.addEventListener('scroll', syncCompactNav, { passive: true });
  window.addEventListener('resize', closeLanguageModeMenu, { passive: true });

  function normalizeSettings(settings = {}) {
    const languageMode = LANGUAGE_MODE_OPTIONS.some(option => option.value === settings?.languageMode)
      ? settings.languageMode
      : DEFAULT_SETTINGS.languageMode;
    const fxGlass = ['crystal', 'mist', 'depth'].includes(settings?.fxGlass) ? settings.fxGlass : DEFAULT_SETTINGS.fxGlass;
    const fxMotion = ['off', 'calm', 'flow'].includes(settings?.fxMotion) ? settings.fxMotion : DEFAULT_SETTINGS.fxMotion;
    const fxScene = ['nebula', 'aurora', 'midnight'].includes(settings?.fxScene) ? settings.fxScene : DEFAULT_SETTINGS.fxScene;
    const fxDensity = ['compact', 'cozy'].includes(settings?.fxDensity) ? settings.fxDensity : DEFAULT_SETTINGS.fxDensity;
    return { languageMode, fxGlass, fxMotion, fxScene, fxDensity };
  }

  function getLanguageMode() {
    return LANGUAGE_MODE_OPTIONS.some(option => option.value === state.settings?.languageMode)
      ? state.settings.languageMode
      : DEFAULT_SETTINGS.languageMode;
  }

  function getLanguageLaneOptionLabel(option, lane = getLanguageMode()) {
    if (!option) return '';
    if (lane === 'vi_focus') return option.viLabel || option.enLabel || option.value;
    if (lane === 'balanced') return option.balancedLabel || option.enLabel || option.viLabel || option.value;
    return option.enLabel || option.viLabel || option.value;
  }

  function uiText(viText, enText, balancedText = '') {
    const mode = getLanguageMode();
    if (mode === 'vi_focus') return viText;
    if (mode === 'balanced') return balancedText || `${enText} • ${viText}`;
    return enText;
  }

  function setTextValue(target, value) {
    const node = typeof target === 'string' ? document.querySelector(target) : target;
    if (node) node.textContent = value;
  }

  function setInputPlaceholder(target, value) {
    const node = typeof target === 'string' ? document.querySelector(target) : target;
    if (node) node.placeholder = value;
  }

  function setHtmlValue(target, value) {
    const node = typeof target === 'string' ? document.querySelector(target) : target;
    if (node) node.innerHTML = value;
  }

  function getLanguageModeLabel(mode = getLanguageMode()) {
    return ({
      en_focus: uiText('English Focus', 'English Focus', 'English Focus'),
      balanced: uiText('Cân bằng song ngữ', 'Balanced Bilingual', 'Balanced Bilingual'),
      vi_focus: uiText('Tiếng Việt thuần', 'Pure Vietnamese', 'Pure Vietnamese')
    })[mode] || 'English Focus';
  }

  function getLanguageModeOptionNote(value, mode = getLanguageMode()) {
    if (value === 'vi_focus') {
      return uiText('Toàn bộ lời nhắc ưu tiên tiếng Việt để học nhẹ đầu hơn.', 'Vietnamese-first prompts for a lighter review flow.', 'Vietnamese-first prompts with English study content.');
    }
    if (value === 'balanced') {
      return uiText('Giữ song song cả hai ngôn ngữ để chuyển ý dễ hơn.', 'Shows both languages where they improve clarity.', 'Keeps both languages visible for easier switching.');
    }
    return uiText('Ưu tiên English, vẫn giữ hỗ trợ tiếng Việt khi cần nhớ lại.', 'English-led study with Vietnamese support when needed.', 'English-led study with light Vietnamese support.');
  }

  function renderLanguageModeMenu(mode = getLanguageMode()) {
    const select = byId('languageModeSelect');
    const trigger = byId('languageModeTrigger');
    const currentNode = byId('languageModeCurrent');
    const menu = byId('languageModeMenu');
    const shell = byId('languageModeShell');
    if (!select || !trigger || !currentNode || !menu || !shell) return;

    const current = LANGUAGE_MODE_OPTIONS.some(option => option.value === select.value) ? select.value : mode;
    currentNode.textContent = getLanguageModeLabel(current);
    trigger.setAttribute('aria-expanded', String(!menu.classList.contains('hidden')));

    menu.innerHTML = LANGUAGE_MODE_OPTIONS.map(option => {
      const isActive = option.value === current;
      return `
        <button type="button" class="nav-select-option ${isActive ? 'active' : ''}" data-language-mode-value="${option.value}" role="option" aria-selected="${isActive}">
          <span class="nav-option-copy">
            <span class="nav-option-title">${getLanguageLaneOptionLabel(option, mode)}</span>
            <span class="nav-option-note">${getLanguageModeOptionNote(option.value, mode)}</span>
          </span>
          <span class="nav-option-check" aria-hidden="true">${isActive ? '✓' : ''}</span>
        </button>`;
    }).join('');
  }

  function closeLanguageModeMenu() {
    const menu = byId('languageModeMenu');
    const trigger = byId('languageModeTrigger');
    const shell = byId('languageModeShell');
    const tools = document.querySelector('.nav-tools');
    if (menu) menu.classList.add('hidden');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    if (shell) shell.classList.remove('is-open');
    if (tools) tools.classList.remove('language-open');
  }

  function toggleLanguageModeMenu(forceOpen) {
    const menu = byId('languageModeMenu');
    const trigger = byId('languageModeTrigger');
    const shell = byId('languageModeShell');
    const tools = document.querySelector('.nav-tools');
    if (!menu || !trigger || !shell) return;
    const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : menu.classList.contains('hidden');
    menu.classList.toggle('hidden', !shouldOpen);
    shell.classList.toggle('is-open', shouldOpen);
    if (tools) tools.classList.toggle('language-open', shouldOpen);
    trigger.setAttribute('aria-expanded', String(shouldOpen));
  }

  function getLanguageModeHint(mode = getLanguageMode()) {
    if (mode === 'vi_focus') {
      return 'Toàn bộ hướng dẫn, lời nhắc học và gợi ý được ưu tiên bằng tiếng Việt để giảm tải nhận thức khi ôn.';
    }
    if (mode === 'balanced') {
      return 'English learning prompts stay visible, while Vietnamese helper text appears where it improves understanding and retention.';
    }
    return 'Most labels and study prompts turn English, while meanings and rescue hints can still keep Vietnamese support for easier recall.';
  }

  function applyEffectSettings() {
    const settings = state.settings || DEFAULT_SETTINGS;
    document.body.dataset.fxGlass = settings.fxGlass || DEFAULT_SETTINGS.fxGlass;
    document.body.dataset.fxMotion = settings.fxMotion || DEFAULT_SETTINGS.fxMotion;
    document.body.dataset.fxScene = settings.fxScene || DEFAULT_SETTINGS.fxScene;
    document.body.dataset.fxDensity = settings.fxDensity || DEFAULT_SETTINGS.fxDensity;
  }

  function getFxLabel(type, value) {
    const labels = {
      glass: {
        crystal: uiText('Pha lê trong', 'Crystal Clear', 'Crystal Clear'),
        mist: uiText('Sương mờ', 'Mist Glow', 'Mist Glow'),
        depth: uiText('Chiều sâu kính', 'Depth Glass', 'Depth Glass')
      },
      motion: {
        off: uiText('Tĩnh', 'Still', 'Still'),
        calm: uiText('Êm', 'Calm', 'Calm'),
        flow: uiText('Chuyển động', 'Flow', 'Flow')
      },
      scene: {
        nebula: uiText('Nebula', 'Nebula', 'Nebula'),
        aurora: uiText('Aurora', 'Aurora', 'Aurora'),
        midnight: uiText('Midnight', 'Midnight', 'Midnight')
      },
      density: {
        compact: uiText('Gọn', 'Compact', 'Compact'),
        cozy: uiText('Thoáng', 'Cozy', 'Cozy')
      }
    };
    return labels[type]?.[value] || value;
  }

  function buildEffectsLabSummary() {
    return uiText(
      `Glass: ${getFxLabel('glass', state.settings.fxGlass)} • Cảnh: ${getFxLabel('scene', state.settings.fxScene)} • Chuyển động: ${getFxLabel('motion', state.settings.fxMotion)}`,
      `Glass: ${getFxLabel('glass', state.settings.fxGlass)} • Scene: ${getFxLabel('scene', state.settings.fxScene)} • Motion: ${getFxLabel('motion', state.settings.fxMotion)}`,
      `Glass: ${getFxLabel('glass', state.settings.fxGlass)} • Scene: ${getFxLabel('scene', state.settings.fxScene)} • Motion: ${getFxLabel('motion', state.settings.fxMotion)}`
    );
  }

  function applyLanguageModeUI() {
    const mode = getLanguageMode();
    document.documentElement.lang = mode === 'vi_focus' ? 'vi' : 'en';
    document.body.dataset.languageMode = mode;

    const select = byId('languageModeSelect');
    if (select) {
      select.innerHTML = LANGUAGE_MODE_OPTIONS.map(option => `
        <option value="${option.value}">${getLanguageLaneOptionLabel(option, mode)}</option>`).join('');
      select.value = mode;
      renderLanguageModeMenu(mode);
    }

    setTextValue('#languageModeLabel', uiText('Chế độ ngôn ngữ', 'Learning language lane', 'Language lane'));
    setTextValue('#languageModeHint', getLanguageModeHint(mode));
    setTextValue('.nav-subtitle', uiText('Học từ vựng gọn gàng, nhớ lâu hơn.', 'Build vocabulary cleanly and remember it longer.', 'English-led learning with lighter Vietnamese support.'));
    setTextValue('#navMainBtn', uiText('Thêm từ', 'Add words', 'Add words'));
    setTextValue('#navManagementBtn', uiText('Bộ từ của tôi', 'Library', 'Library'));
    setTextValue('#navReviewBtn', uiText('Ôn tập', 'Review', 'Review'));

    setTextValue('#main-view .header-section h1', uiText('Thêm vào bộ từ', 'Add into your sets', 'Add into your sets'));
    setTextValue('#main-view .header-subtext', uiText('Dán nhanh từ Excel, nhập tay, hoặc tải CSV rồi kiểm tra trước khi lưu.', 'Paste from Excel, type manually, or import CSV before saving.', 'Paste quickly, type manually, or import CSV before saving.'));
    setTextValue('#addSetBtn', uiText('＋ Bộ mới', '＋ New set', '＋ New set'));
    setTextValue('#input-view .help-box h2', uiText('Định dạng đề xuất', 'Suggested format', 'Suggested format'));
    setTextValue('#input-view .quick-add-hint', uiText('Mẹo: bạn có thể copy nhiều cột từ Excel hoặc Google Sheets và dán thẳng vào đây.', 'Tip: copy multiple columns from Excel or Google Sheets and paste them here directly.', 'Tip: copy multiple columns from Excel or Google Sheets and paste here.'));
    setTextValue('.dropdown-toggle', uiText('Nhập dữ liệu ▼', 'Import data ▼', 'Import data ▼'));
    setTextValue('#importCsvBtn', uiText('Chọn file CSV', 'Choose CSV file', 'Choose CSV file'));
    setTextValue('#tutorialBtn', uiText('Hướng dẫn', 'Guide', 'Guide'));
    setTextValue('#promptHelperBtn', uiText('🤖 Prompt chủ đề', '🤖 Topic prompt', '🤖 Topic prompt'));
    setTextValue('#quickAddBtn', uiText('⚡ Thêm nhanh', '⚡ Quick add', '⚡ Quick add'));
    setTextValue('#previewBtn', uiText('Kiểm tra & sửa', 'Review & clean', 'Review & clean'));
    setTextValue('#preview-view h2', uiText('Kiểm tra trước khi lưu', 'Review before saving', 'Review before saving'));
    setTextValue('#cancelPreviewBtn', uiText('Quay lại', 'Back', 'Back'));
    setTextValue('#smartSuggestionPanel h2', uiText('Gợi ý thông minh', 'Smart Suggestions', 'Smart Suggestions'));
    setTextValue('#smartSuggestionPanel .muted-text', uiText('Hệ thống đề xuất từ nên thêm tiếp, tránh học trùng và bù khoảng trống trong bộ nhớ.', 'The system suggests what to add next, avoids redundancy, and fills memory gaps.', 'The system suggests the next words, avoids redundancy, and fills memory gaps.'));
    setTextValue('#setIntelligenceTitle', uiText('Set Intelligence', 'Set Intelligence', 'Set Intelligence'));
    setTextValue('#setIntelligenceLead', uiText('Phân tích bộ từ hiện tại để phát hiện vùng trùng lặp, cụm yếu và cụm nên thêm tiếp theo.', 'Analyze the current set to detect overlap, weak clusters, and the next best cluster to add.', 'Analyze the current set for overlap, weak clusters, and the next cluster to add.'));

    setTextValue('#management-view .header-section h1', uiText('Bộ từ của tôi', 'My library', 'My library'));
    setTextValue('#management-view .header-subtext', uiText('Quản lý từng bộ từ, theo dõi tiến độ và sửa nội dung ngay trong bảng.', 'Manage sets, track progress, and edit entries directly inside the table.', 'Manage sets, track progress, and edit entries directly in the table.'));
    setInputPlaceholder('#setSearchInput', uiText('Tìm bộ từ, chủ đề, loại từ...', 'Search sets, topics, or entry types...', 'Search sets, topics, or entry types...'));
    setTextValue('#exportBackupBtn', uiText('Xuất backup JSON', 'Export JSON backup', 'Export JSON backup'));
    setTextValue('#importBackupBtn', uiText('Nhập backup JSON', 'Import JSON backup', 'Import JSON backup'));
    setTextValue('#backToManagementBtn', uiText('← Quay lại', '← Back', '← Back'));
    setTextValue('#deleteSetBtn', uiText('Xóa bộ từ', 'Delete set', 'Delete set'));
    setTextValue('#saveSetChangesBtn', uiText('Lưu thay đổi', 'Save changes', 'Save changes'));
    setInputPlaceholder('#detailsSearchInput', uiText('Tìm trong bộ từ này...', 'Search inside this set...', 'Search inside this set...'));
    if (byId('setSortSelect')) {
      const currentSort = byId('setSortSelect').value || 'due';
      byId('setSortSelect').innerHTML = `
        <option value="due">${uiText('Ưu tiên đến hạn', 'Due first', 'Due first')}</option>
        <option value="recent">${uiText('Mới cập nhật', 'Recently updated', 'Recently updated')}</option>
        <option value="size">${uiText('Nhiều từ nhất', 'Largest sets', 'Largest sets')}</option>
        <option value="progress">${uiText('Tiến độ cao nhất', 'Highest progress', 'Highest progress')}</option>
        <option value="name">${uiText('Tên A → Z', 'Name A → Z', 'Name A → Z')}</option>`;
      byId('setSortSelect').value = currentSort;
    }
    if (byId('detailsFilterSelect')) {
      const currentFilter = byId('detailsFilterSelect').value || 'all';
      byId('detailsFilterSelect').innerHTML = `
        <option value="all">${uiText('Tất cả mức nhớ', 'All memory stages', 'All memory stages')}</option>
        <option value="due">${uiText('Chỉ từ đến hạn', 'Due only', 'Due only')}</option>
        <option value="weak">${uiText('Chỉ từ cần củng cố', 'Needs work only', 'Needs work only')}</option>
        <option value="new">${uiText('Chỉ từ mới', 'New only', 'New only')}</option>
        <option value="strong">${uiText('Chỉ từ khá chắc / rất vững', 'Solid / strong only', 'Solid / strong only')}</option>`;
      byId('detailsFilterSelect').value = currentFilter;
    }

    setTextValue('label[for="reviewSetDropdown"]', uiText('Bộ từ vựng', 'Word set', 'Word set'));
    setTextValue('#review-dashboard-view .filter-box-wide label', uiText('Gợi ý hôm nay', "Today's guidance", "Today's guidance"));
    setTextValue('.recommended-study-label', uiText('Bắt đầu theo lộ trình gợi ý', 'Start with the suggested path', 'Start with the suggested path'));
    setTextValue('#startRecommendedBtn', uiText('▶ Học theo gợi ý', '▶ Start suggested path', '▶ Start suggested path'));
    setTextValue('#startDueFocusBtn', uiText('Ôn từ đến hạn', 'Review due words', 'Review due words'));
    setTextValue('#startWeakFocusBtn', uiText('Ôn từ yếu', 'Drill weak words', 'Drill weak words'));
    setTextValue('#startNewFocusBtn', uiText('Làm quen từ mới', 'Warm up new words', 'Warm up new words'));
    document.querySelectorAll('.stat-card .stat-label').forEach((node, index) => {
      const labels = [
        uiText('Đến hạn', 'Due now', 'Due now'),
        uiText('Từ mới', 'New', 'New'),
        uiText('Cần củng cố', 'Needs work', 'Needs work'),
        uiText('Đã vững', 'Strong', 'Strong')
      ];
      if (labels[index]) node.textContent = labels[index];
    });
    document.querySelectorAll('.stat-card .stat-note').forEach((node, index) => {
      const notes = [
        uiText('Nên ôn ngay hôm nay', 'Best reviewed today', 'Best reviewed today'),
        uiText('Chưa ôn lần nào', 'Never reviewed yet', 'Never reviewed yet'),
        uiText('Sai nhiều hoặc mức nhớ còn thấp', 'Wrong often or still low-confidence', 'Wrong often or still low-confidence'),
        uiText('Qua nhiều lượt nhớ tốt', 'Passed several strong recalls', 'Passed several strong recalls')
      ];
      if (notes[index]) node.textContent = notes[index];
    });
    setTextValue('.mode-board-kicker', 'Learning Lab');
    setTextValue('#review-dashboard-view .mode-board-copy h2', uiText('Chọn chế độ học theo trạng thái trí nhớ hiện tại', 'Choose the best learning lane for the current memory state', 'Choose the best learning lane for the current memory state'));
    document.querySelectorAll('.mode-lab-card').forEach(card => {
      const game = card.dataset.game;
      const titleNode = card.querySelector('h3');
      const labelNode = card.querySelector('.mode-mini-label');
      const descNode = card.querySelector('.v-description');
      const map = {
        srs: [uiText('Ưu tiên số 1', 'Top priority', 'Top priority'), 'Memory Rescue', uiText('Ưu tiên từ đến hạn, từ risk cao và từ bạn vừa sắp quên.', 'Prioritize due words, high-risk items, and anything about to slip.', 'Prioritize due words, high-risk items, and anything about to slip.')],
        flashcard: [uiText('Khởi động', 'Warm-up', 'Warm-up'), 'Flashcard', uiText('Lật thẻ và gọi lại nghĩa trước khi xem đáp án.', 'Flip cards and recall meaning before checking the answer.', 'Flip cards and recall meaning before checking the answer.')],
        typing: [uiText('Chữa lỗi chủ động', 'Active repair', 'Active repair'), uiText('Gõ từ', 'Typing', 'Typing'), uiText('Nhìn gợi ý rồi tự gõ để kéo từ sang nhớ chủ động.', 'Type from a cue to pull the word into active recall.', 'Type from a cue to pull the word into active recall.')],
        quiz: [uiText('Kiểm tra tốc độ', 'Speed check', 'Speed check'), uiText('Trắc nghiệm', 'Quiz', 'Quiz'), uiText('Kiểm tra nhanh khả năng nhận biết từ, nghĩa và ngữ cảnh.', 'Check how quickly you recognize meaning, word form, and context.', 'Check how quickly you recognize meaning, word form, and context.')],
        dictation: [uiText('Âm → chữ', 'Sound to text', 'Sound to text'), uiText('Nghe viết', 'Dictation', 'Dictation'), uiText('Nối âm thanh với mặt chữ để sửa lỗi nghe và spelling.', 'Link sound to spelling to fix listening and spelling errors.', 'Link sound to spelling to fix listening and spelling errors.')],
        matching: [uiText('Tăng phản xạ', 'Speed pairing', 'Speed pairing'), uiText('Nối cặp', 'Matching', 'Matching'), uiText('Ghép nhanh để tăng phản xạ truy xuất nghĩa và mặt chữ.', 'Pair fast to speed up meaning and word-form retrieval.', 'Pair fast to speed up meaning and word-form retrieval.')]
      };
      const payload = map[game];
      if (!payload) return;
      if (labelNode) labelNode.textContent = payload[0];
      if (titleNode) titleNode.textContent = payload[1];
      if (descNode) descNode.textContent = payload[2];
    });

    setTextValue('#study-mode-view .header-row h1', uiText('Flashcard', 'Flashcard', 'Flashcard'));
    setTextValue('#typing-mode-view .header-row h1', uiText('Gõ từ vựng', 'Typing drill', 'Typing drill'));
    setTextValue('#dictation-mode-view .header-row h1', uiText('Nghe viết', 'Dictation', 'Dictation'));
    setTextValue('#quizModeModal h2', uiText('Chọn chế độ Quiz', 'Choose quiz mode', 'Choose quiz mode'));
    setTextValue('#studySupportCloseBtn', uiText('Ẩn', 'Hide', 'Hide'));
    setInputPlaceholder('#typingInput', uiText('Gõ từ vựng tiếng Anh vào đây', 'Type the English word here', 'Type the English word here'));
    setInputPlaceholder('#dictationInput', uiText('Gõ từ bạn nghe được', 'Type the word you hear', 'Type the word you hear'));
    setInputPlaceholder('#quickWord', uiText('Từ vựng (ví dụ: hello)', 'Word (example: hello)', 'Word (example: hello)'));
    setInputPlaceholder('#quickPhonetic', uiText('Phiên âm (ví dụ: /həˈləʊ/)', 'Phonetic (example: /həˈləʊ/)', 'Phonetic (example: /həˈləʊ/)'));
    setInputPlaceholder('#quickType', uiText('Loại từ / nhóm (ví dụ: verb, noun)', 'Type / group (example: verb, noun)', 'Type / group (example: verb, noun)'));
    setInputPlaceholder('#quickMeaning', uiText('Nghĩa (ví dụ: xin chào)', 'Meaning (example: hello)', 'Meaning (example: hello)'));
    setInputPlaceholder('#quickExample', uiText('Ví dụ ngắn (không bắt buộc)', 'Short example (optional)', 'Short example (optional)'));
    setInputPlaceholder('#quickNotes', uiText('Ghi chú / mẹo nhớ (không bắt buộc)', 'Notes / memory tip (optional)', 'Notes / memory tip (optional)'));
    setTextValue('#saveQuickWordBtn', uiText('Lưu từ này', 'Save this entry', 'Save this entry'));
    setTextValue('#createSetModal h2', uiText('📚 Tạo bộ từ mới', '📚 Create a new set', '📚 Create a new set'));
    setInputPlaceholder('#newSetNameInput', uiText('Ví dụ: IELTS Reading - Unit 1', 'Example: IELTS Reading - Unit 1', 'Example: IELTS Reading - Unit 1'));
    setTextValue('#saveSetNameBtn', uiText('Tạo bộ từ', 'Create set', 'Create set'));

    if (byId('effectsLabTitle')) setTextValue('#effectsLabTitle', uiText('Effects Lab', 'Effects Lab', 'Effects Lab'));
    if (byId('effectsLabLead')) setTextValue('#effectsLabLead', uiText('Tinh chỉnh chất kính, cảnh nền và chuyển động để không gian học có chiều sâu nhưng vẫn tập trung.', 'Tune glass depth, scene, and motion so the interface feels alive without hurting focus.', 'Tune glass depth, scene, and motion so the interface feels alive without hurting focus.'));
    if (byId('fxGlassLabel')) setTextValue('#fxGlassLabel', uiText('Chất kính', 'Glass style', 'Glass style'));
    if (byId('fxMotionLabel')) setTextValue('#fxMotionLabel', uiText('Nhịp chuyển động', 'Motion', 'Motion'));
    if (byId('fxDensityLabel')) setTextValue('#fxDensityLabel', uiText('Mật độ shell', 'Shell density', 'Shell density'));
    if (byId('effectsLabPreviewNote')) setTextValue('#effectsLabPreviewNote', buildEffectsLabSummary());
    document.querySelectorAll('[data-fx-scene-card]').forEach(node => {
      const value = node.dataset.fxSceneCard;
      const title = node.querySelector('.fx-scene-name');
      const note = node.querySelector('.fx-scene-note');
      if (title) title.textContent = getFxLabel('scene', value);
      if (note) {
        note.textContent = ({
          nebula: uiText('Nền tím sâu, hợp với glass sáng và layout học hằng ngày.', 'Deep purple ambient scene for daily study.', 'Deep purple ambient scene for daily study.'),
          aurora: uiText('Ánh xanh chuyển nhẹ, tạo cảm giác mới hơn cho giao diện.', 'Cool moving aurora glow for a fresher interface.', 'Cool moving aurora glow for a fresher interface.'),
          midnight: uiText('Tối hơn, gọn hơn, hợp khi muốn giảm nhiễu thị giác.', 'Darker and tighter for low-distraction sessions.', 'Darker and tighter for low-distraction sessions.')
        })[value] || '';
      }
    });

    if (byId('clusterMissionTitle')) setTextValue('#clusterMissionTitle', uiText('Memory Constellation', 'Memory Constellation', 'Memory Constellation'));
    if (byId('clusterMissionLead')) setTextValue('#clusterMissionLead', uiText('Thay vì ôn từng từ rời rạc, hệ thống gom chúng thành cụm để bạn cứu cả một vùng nhớ trong một lượt.', 'Instead of drilling isolated entries, cluster missions let you rescue a whole memory zone in one session.', 'Instead of drilling isolated entries, cluster missions let you rescue a whole memory zone in one session.'));
  }

  init();

  syncCompactNav();

  async function init() {
    bindStaticEvents();
    setupModals();
    ensureAdvancedReviewPanels();
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
    byId('languageModeSelect')?.addEventListener('change', async (event) => {
      state.settings.languageMode = event.target.value;
      closeLanguageModeMenu();
      await persistState();
      renderAll();
    });
    byId('languageModeTrigger')?.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleLanguageModeMenu();
    });
    byId('languageModeMenu')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-language-mode-value]');
      if (!button) return;
      const value = button.dataset.languageModeValue;
      const select = byId('languageModeSelect');
      if (!select || !value || select.value === value) {
        closeLanguageModeMenu();
        return;
      }
      select.value = value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });

    document.addEventListener('change', async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.matches('[data-fx-setting]')) {
        state.settings[target.dataset.fxSetting] = target.value;
        applyEffectSettings();
        renderEffectsLabPanel();
        await persistState();
      }
    });
    document.addEventListener('click', async (event) => {
      const sceneBtn = event.target.closest('[data-fx-scene]');
      if (sceneBtn) {
        state.settings.fxScene = sceneBtn.dataset.fxScene;
        applyEffectSettings();
        renderEffectsLabPanel();
        await persistState();
        return;
      }
      const missionBtn = event.target.closest('[data-cluster-mission]');
      if (missionBtn) {
        launchClusterMission(missionBtn.dataset.clusterMission);
      }
    });

    byId('addSetBtn').addEventListener('click', () => openModal('createSetModal'));
    byId('saveSetNameBtn').addEventListener('click', createSetFromModal);

    document.querySelector('.dropdown-toggle').addEventListener('click', (event) => {
      event.stopPropagation();
      document.querySelector('.dropdown-menu').classList.toggle('hidden');
    });
    document.addEventListener('click', () => {
      document.querySelector('.dropdown-menu').classList.add('hidden');
      closeLanguageModeMenu();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeLanguageModeMenu();
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
    byId('wordsetDropdown')?.addEventListener('change', () => {
      renderSmartSuggestions({ resetCycle: true });
      renderSetIntelligence();
    });
    byId('refreshSuggestionsBtn')?.addEventListener('click', refreshSmartSuggestions);
    byId('smartSuggestionGrid')?.addEventListener('click', handleSuggestionAction);
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
    byId('review-dashboard-view')?.addEventListener('click', (event) => {
      const card = event.target.closest('[data-game]');
      if (!card || !byId('review-dashboard-view').contains(card)) return;
      const gameType = card.dataset.game;
      if (!gameType) return;
      startGame(gameType, byId('reviewSetDropdown').value);
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
    byId('fcHintBtn')?.addEventListener('click', () => openStudySupportForCurrent('recall', { autoQueue: false, manual: true }));
    byId('fcHintInlineBtn')?.addEventListener('click', () => openStudySupportForCurrent('meaning', { autoQueue: false, manual: true }));
    byId('fcTypingInput').addEventListener('keypress', (event) => {
      if (event.key === 'Enter') handleFlashcardMeaningCheck();
    });

    byId('typingHintBtn')?.addEventListener('click', () => openStudySupportForCurrent('spelling', { autoQueue: false, manual: true }));
    byId('typingSubmitBtn').addEventListener('click', handleTypingSubmit);
    byId('typingInput').addEventListener('keypress', (event) => {
      if (event.key === 'Enter') handleTypingSubmit();
    });
    byId('dictationHintBtn')?.addEventListener('click', () => openStudySupportForCurrent('listening', { autoQueue: false, manual: true }));
    byId('dictationSubmitBtn').addEventListener('click', handleDictationSubmit);
    byId('dictationInput').addEventListener('keypress', (event) => {
      if (event.key === 'Enter') handleDictationSubmit();
    });
    byId('playAudioBtn').addEventListener('click', () => {
      const card = state.studyQueue[state.currentCardIdx];
      if (card) playWordAudio(card.word);
    });
    byId('quizHintBtn')?.addEventListener('click', () => openStudySupportForCurrent(state.activeQuizMode === 'context' ? 'confusion' : state.activeQuizMode === 'meaning-word' ? 'recall' : 'meaning', { autoQueue: false, manual: true }));
    byId('studySupportCloseBtn')?.addEventListener('click', hideStudySupport);
    byId('studySupportQueueBtn')?.addEventListener('click', handleStudySupportPrimaryAction);
    byId('studySupportGrid')?.addEventListener('click', handleStudySupportAction);

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
    byId('spotlightLaunchBtn')?.addEventListener('click', startRecommendedStudy);
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
    const cleanTopic = topic.trim() || (getLanguageMode() === 'vi_focus' ? '[CHỦ ĐỀ]' : '[TOPIC]');
    if (getLanguageMode() === 'vi_focus') {
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
    if (getLanguageMode() === 'balanced') {
      return `Create an English vocabulary list for the topic ${cleanTopic}. Put one item on each line and separate the columns with |.
` +
        `Please keep the Vietnamese meaning column because this app is using bilingual learning mode.

` +
        `word | /phonetic/ | part of speech | Vietnamese meaning | English example | note

` +
        `Example:
` +
        `abandon | /əˈbæn.dən/ | verb | từ bỏ, bỏ rơi | She abandoned her old car | often used in writing

` +
        `Create 20 entries for ${cleanTopic}.`;
    }
    return `Create an English vocabulary list for the topic ${cleanTopic}. Put one item on each line and separate the columns with |.

` +
      `word | /phonetic/ | part of speech | Vietnamese meaning | English example | note

` +
      `Example:
` +
      `abandon | /əˈbæn.dən/ | verb | từ bỏ, bỏ rơi | She abandoned her old car | often used in writing
` +
      `ability | /əˈbɪl.ə.ti/ | noun | khả năng, năng lực | He has the ability to learn fast |

` +
      `Create 20 entries for ${cleanTopic}.`;
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
    const result = await storage.get({ vocab: [], stats: { coins: 0 }, recoveryVault: null, vm_settings: DEFAULT_SETTINGS });
    let changed = false;

    if (Array.isArray(result.vocab) && result.vocab.length) {
      await storage.set({
        recoveryVault: {
          savedAt: new Date().toISOString(),
          source: 'pre-normalize-load',
          vocab: result.vocab,
          stats: result.stats || {}
        }
      });
    }

    const primaryVocab = Array.isArray(result.vocab) ? result.vocab : [];
    const recoveryVocab = Array.isArray(result.recoveryVault?.vocab) ? result.recoveryVault.vocab : [];
    const rawVocab = primaryVocab.length ? primaryVocab : recoveryVocab;
    changed = changed || (!primaryVocab.length && recoveryVocab.length);

    state.vocab = rawVocab.map((item, index) => {
      const normalized = normalizeWord(item, index);
      changed = changed || JSON.stringify(item || {}) !== JSON.stringify(normalized);
      return normalized;
    });

    const optimization = optimizeVocabularySystem(state.vocab);
    state.vocab = optimization.vocab;
    state.optimizerReport = optimization.report;
    changed = changed || optimization.changed;

    state.stats = normalizeStats(result.stats || {});
    state.settings = normalizeSettings(result.vm_settings || {});
    updateStreakStats();
    changed = changed || JSON.stringify(result.stats || {}) !== JSON.stringify(state.stats);
    changed = changed || JSON.stringify(result.vm_settings || {}) !== JSON.stringify(state.settings);

    if (changed) {
      await persistState();
    }
  }

  function normalizeStats(stats = {}) {
    const studyLog = Array.isArray(stats.studyLog) ? stats.studyLog.slice(0, 40) : [];
    const dailyProgress = stats.dailyProgress && typeof stats.dailyProgress === 'object' ? { ...stats.dailyProgress } : {};
    const baseMistakeJournal = { meaning: 0, spelling: 0, listening: 0, recall: 0, confusion: 0 };
    const mistakeJournal = stats.mistakeJournal && typeof stats.mistakeJournal === 'object'
      ? { ...baseMistakeJournal, ...stats.mistakeJournal }
      : baseMistakeJournal;
    const recentFailures = Array.isArray(stats.recentFailures) ? stats.recentFailures.slice(0, 24) : [];

    return {
      coins: Number(stats.coins) || 0,
      dailyGoal: Math.max(5, Number(stats.dailyGoal) || 12),
      dailyProgress,
      currentStreak: Math.max(0, Number(stats.currentStreak) || 0),
      bestStreak: Math.max(0, Number(stats.bestStreak) || 0),
      totalSessions: Math.max(0, Number(stats.totalSessions) || 0),
      studyLog,
      mistakeJournal,
      recentFailures
    };
  }

  function normalizeWord(item, index = 0) {
    const review = {
      ...REVIEW_DEFAULTS,
      ...(item?.review || {})
    };
    review.confidence = deriveConfidenceValue(review, Boolean(item?.isLearned));

    const base = {
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

    return {
      ...base,
      entryType: String(item?.entryType || inferEntryType(base)).trim() || 'word',
      topicTags: normalizeTopicTags(item?.topicTags, base)
    };
  }

  function getTextRichnessScore(text = '') {
    return String(text || '').trim().replace(/\s+/g, ' ').length;
  }

  function pickRicherText(...values) {
    return values
      .map(value => String(value || '').trim())
      .filter(Boolean)
      .sort((a, b) => getTextRichnessScore(b) - getTextRichnessScore(a))[0] || '';
  }

  function mergeUniqueTopicTags(...groups) {
    const merged = [];
    groups.flat().forEach(tag => {
      const clean = String(tag || '').trim();
      if (!clean) return;
      const exists = merged.some(item => normalizeAnswer(item) === normalizeAnswer(clean));
      if (!exists) merged.push(clean);
    });
    return merged.slice(0, 8);
  }

  function buildSetWordKey(wordset, word) {
    return `${normalizeAnswer(wordset || 'chua phan loai')}__${normalizeAnswer(word)}`;
  }

  function isMeaningNear(a, b) {
    const left = normalizeAnswer(a || '');
    const right = normalizeAnswer(b || '');
    if (!left || !right) return !left || !right;
    if (left === right || left.includes(right) || right.includes(left)) return true;
    return getTokenOverlap(tokenizeSuggestionText(left), tokenizeSuggestionText(right)) >= 0.72;
  }

  function mergeReviewState(primaryReview = {}, incomingReview = {}) {
    const primary = { ...REVIEW_DEFAULTS, ...(primaryReview || {}) };
    const incoming = { ...REVIEW_DEFAULTS, ...(incomingReview || {}) };
    const latestFailureSource = (incoming.lastFailureAt || 0) >= (primary.lastFailureAt || 0) ? incoming : primary;
    const latestSeenSource = (incoming.lastReviewedAt || 0) >= (primary.lastReviewedAt || 0) ? incoming : primary;
    const next = {
      ...REVIEW_DEFAULTS,
      seenCount: Math.max(0, Number(primary.seenCount) || 0) + Math.max(0, Number(incoming.seenCount) || 0),
      correctCount: Math.max(0, Number(primary.correctCount) || 0) + Math.max(0, Number(incoming.correctCount) || 0),
      wrongCount: Math.max(0, Number(primary.wrongCount) || 0) + Math.max(0, Number(incoming.wrongCount) || 0),
      hardCount: Math.max(0, Number(primary.hardCount) || 0) + Math.max(0, Number(incoming.hardCount) || 0),
      lapseCount: Math.max(0, Number(primary.lapseCount) || 0) + Math.max(0, Number(incoming.lapseCount) || 0),
      streak: Math.max(Math.max(0, Number(primary.streak) || 0), Math.max(0, Number(incoming.streak) || 0)),
      confidence: clampConfidence(Math.max(
        deriveConfidenceValue(primary, false),
        deriveConfidenceValue(incoming, false),
        Math.max(0, Number(primary.confidence) || 0),
        Math.max(0, Number(incoming.confidence) || 0)
      )),
      dueAt: [primary.dueAt, incoming.dueAt].filter(value => Number(value) > 0).sort((a, b) => a - b)[0] || 0,
      lastReviewedAt: Math.max(0, Number(primary.lastReviewedAt) || 0, Number(incoming.lastReviewedAt) || 0),
      lastFailureAt: Math.max(0, Number(primary.lastFailureAt) || 0, Number(incoming.lastFailureAt) || 0),
      lastFailureReason: latestFailureSource.lastFailureReason || '',
      lastSeenGame: latestSeenSource.lastSeenGame || ''
    };
    return next;
  }

  function mergeWordRecords(primaryWord, incomingWord) {
    const mergedReview = mergeReviewState(primaryWord?.review, incomingWord?.review);
    const entryTypeCandidates = [primaryWord?.entryType, incomingWord?.entryType].filter(Boolean);
    const strongerEntryType = entryTypeCandidates.find(type => type && type !== 'word') || entryTypeCandidates[0] || 'word';
    return normalizeWord({
      ...(primaryWord || {}),
      ...(incomingWord || {}),
      id: primaryWord?.id || incomingWord?.id,
      word: pickRicherText(primaryWord?.word, incomingWord?.word),
      phonetic: pickRicherText(primaryWord?.phonetic, incomingWord?.phonetic),
      meaning: pickRicherText(primaryWord?.meaning, incomingWord?.meaning),
      wordType: pickRicherText(primaryWord?.wordType, incomingWord?.wordType),
      example: pickRicherText(primaryWord?.example, incomingWord?.example),
      notes: pickRicherText(primaryWord?.notes, incomingWord?.notes),
      wordset: pickRicherText(primaryWord?.wordset, incomingWord?.wordset) || 'Chưa phân loại',
      entryType: strongerEntryType,
      topicTags: mergeUniqueTopicTags(primaryWord?.topicTags || [], incomingWord?.topicTags || []),
      createdAt: Math.min(Number(primaryWord?.createdAt) || Date.now(), Number(incomingWord?.createdAt) || Date.now()),
      isLearned: Boolean(primaryWord?.isLearned || incomingWord?.isLearned || mergedReview.confidence >= 4),
      review: mergedReview
    });
  }

  function optimizeVocabularySystem(vocab = []) {
    const buckets = new Map();
    let removedInvalid = 0;
    let mergedDuplicates = 0;
    let changed = false;

    vocab.forEach((rawWord, index) => {
      const word = normalizeWord(rawWord, index);
      if (!word.word || !word.meaning) {
        removedInvalid += 1;
        changed = true;
        return;
      }

      const bucketKey = buildSetWordKey(word.wordset, word.word);
      const bucket = buckets.get(bucketKey) || [];
      const duplicateIndex = bucket.findIndex(existing => isMeaningNear(existing.meaning, word.meaning));
      if (duplicateIndex === -1) {
        bucket.push(word);
      } else {
        bucket[duplicateIndex] = mergeWordRecords(bucket[duplicateIndex], word);
        mergedDuplicates += 1;
        changed = true;
      }
      buckets.set(bucketKey, bucket);
    });

    const optimized = Array.from(buckets.values())
      .flat()
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return {
      vocab: optimized,
      changed: changed || optimized.length !== vocab.length,
      report: {
        totalBefore: Array.isArray(vocab) ? vocab.length : 0,
        totalAfter: optimized.length,
        removedInvalid,
        mergedDuplicates
      }
    };
  }

  function upsertWords(entries, fallbackWordset = '') {
    const working = [...state.vocab];
    let added = 0;
    let merged = 0;
    let skipped = 0;

    entries.forEach((entry, index) => {
      const normalized = normalizeWord({
        ...entry,
        wordset: entry?.wordset || fallbackWordset || 'Chưa phân loại',
        createdAt: Number(entry?.createdAt) || Date.now()
      }, index);
      if (!normalized.word || !normalized.meaning) {
        skipped += 1;
        return;
      }

      const duplicateIndex = working.findIndex(existing => (
        buildSetWordKey(existing.wordset, existing.word) === buildSetWordKey(normalized.wordset, normalized.word)
        && isMeaningNear(existing.meaning, normalized.meaning)
      ));

      if (duplicateIndex === -1) {
        working.unshift(normalized);
        added += 1;
      } else {
        const before = JSON.stringify(working[duplicateIndex]);
        working[duplicateIndex] = mergeWordRecords(working[duplicateIndex], normalized);
        if (JSON.stringify(working[duplicateIndex]) === before) skipped += 1;
        else merged += 1;
      }
    });

    const optimization = optimizeVocabularySystem(working);
    state.vocab = optimization.vocab;
    state.optimizerReport = optimization.report;

    return {
      added,
      merged: merged + optimization.report.mergedDuplicates,
      skipped: skipped + optimization.report.removedInvalid
    };
  }

  function renderAll() {
    initMainView();
    initManagementView();
    initReviewView();
    applyEffectSettings();
    applyLanguageModeUI();
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
    if (!['study-mode-view', 'quiz-mode-view', 'typing-mode-view', 'dictation-mode-view'].includes(viewIdToShow)) {
      hideStudySupport();
    }
    window.dispatchEvent(new CustomEvent('vm:viewchange', { detail: { viewId: viewIdToShow } }));
  }

  function openModal(modalId) {
    byId(modalId)?.classList.remove('hidden');
  }

  function closeModal(modalId) {
    byId(modalId)?.classList.add('hidden');
  }

  async function persistState() {
    await storage.set({ vocab: state.vocab, stats: state.stats, vm_settings: state.settings });
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

  function getLocalizedMemoryStage(stage, variant = 'label') {
    const level = Number(stage?.level ?? stage ?? 0);
    const labels = {
      0: { label: uiText('Mới', 'New', 'New'), shortLabel: uiText('Mới', 'New', 'New'), note: uiText('Chưa ôn lần nào', 'Not reviewed yet', 'Not reviewed yet') },
      1: { label: uiText('Làm quen', 'Warm-up', 'Warm-up'), shortLabel: uiText('Làm quen', 'Warm-up', 'Warm-up'), note: uiText('Đã thấy nhưng còn rất dễ quên', 'Seen once but still fragile', 'Seen once but still fragile') },
      2: { label: uiText('Đang nhớ', 'Building recall', 'Building recall'), shortLabel: uiText('Đang nhớ', 'Recall', 'Recall'), note: uiText('Đã nhớ được một phần, cần nhắc lại', 'Partly remembered and needs another pass', 'Partly remembered and needs another pass') },
      3: { label: uiText('Khá chắc', 'Pretty solid', 'Pretty solid'), shortLabel: uiText('Khá chắc', 'Solid', 'Solid'), note: uiText('Nhớ tương đối ổn, nên tiếp tục củng cố', 'Mostly stable, worth reinforcing', 'Mostly stable, worth reinforcing') },
      4: { label: uiText('Rất vững', 'Very strong', 'Very strong'), shortLabel: uiText('Rất vững', 'Strong', 'Strong'), note: uiText('Đã qua nhiều lượt ôn tốt', 'Survived multiple strong recalls', 'Survived multiple strong recalls') }
    };
    return labels[level]?.[variant] || labels[0][variant] || '';
  }

  function buildMemoryStageSummary(words) {
    const counts = getMemoryStageCounts(words).filter(stage => stage.count > 0);
    if (!counts.length) return uiText('Chưa có tiến độ ghi nhớ để hiển thị.', 'No memory progress to show yet.', 'No memory progress to show yet.');
    return counts.map(stage => `${getLocalizedMemoryStage(stage, 'label')}: ${stage.count}`).join(' • ');
  }

  function getDateKeyFromTimestamp(timestamp) {
    if (!timestamp) return '';
    return new Date(timestamp).toISOString().slice(0, 10);
  }

  function inferEntryType(item = {}) {
    const word = String(item.word || '').trim();
    const type = normalizeAnswer(item.wordType || '');
    const notes = normalizeAnswer(item.notes || '');
    if (type.includes('tip') || notes.startsWith('tip ') || notes.startsWith('meo ') || notes.includes('ghi nho')) return 'tip';
    if (type.includes('pattern') || type.includes('structure') || notes.includes('pattern') || notes.includes('cau truc')) return 'pattern';
    if (type.includes('phrase') || type.includes('idiom') || type.includes('phrasal') || word.split(/\s+/).length >= 2) return 'phrase';
    return 'word';
  }

  function normalizeTopicTags(rawTags, item = {}) {
    if (Array.isArray(rawTags)) {
      return rawTags.map(tag => String(tag || '').trim()).filter(Boolean).slice(0, 8);
    }
    const notes = String(item.notes || '');
    const noteTags = Array.from(notes.matchAll(/#([\p{L}\p{N}\-_]+)/gu)).map(match => match[1]);
    const setTags = String(item.wordset || '').split(/[\/,&]/).map(part => part.trim()).filter(Boolean);
    return Array.from(new Set([...noteTags, ...setTags])).slice(0, 8);
  }

  function getEntryTypeLabel(word) {
    const labels = {
      word: uiText('Từ', 'Word', 'Word'),
      phrase: uiText('Cụm', 'Phrase', 'Phrase'),
      pattern: uiText('Mẫu câu', 'Pattern', 'Pattern'),
      tip: uiText('Ghi chú', 'Tip', 'Tip')
    };
    return labels[word?.entryType] || labels.word;
  }

  function getEntryTypeStats(words) {
    const counts = { word: 0, phrase: 0, pattern: 0, tip: 0 };
    words.forEach(word => {
      const key = word.entryType || inferEntryType(word);
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }

  function buildEntryTypeSummary(words) {
    const counts = getEntryTypeStats(words);
    return [
      counts.word ? `${counts.word} ${uiText('từ', 'words', 'words')}` : '',
      counts.phrase ? `${counts.phrase} ${uiText('cụm', 'phrases', 'phrases')}` : '',
      counts.pattern ? `${counts.pattern} ${uiText('mẫu', 'patterns', 'patterns')}` : '',
      counts.tip ? `${counts.tip} ${uiText('ghi chú', 'tips', 'tips')}` : ''
    ].filter(Boolean).join(' • ') || uiText('Chưa có phân loại học liệu', 'No learning material types yet', 'No learning material types yet');
  }

  function calculateForgettingRisk(word) {
    const confidence = getConfidenceValue(word);
    let risk = Math.max(0, 52 - confidence * 10);
    if (isNewWord(word)) risk += 18;
    if (isWeakWord(word)) risk += 20;
    if (isDueWord(word)) risk += 26;
    risk += Math.min(18, (word.review?.wrongCount || 0) * 3);
    risk += Math.min(14, (word.review?.lapseCount || 0) * 4);
    if (word.review?.lastFailureAt && getDateKeyFromTimestamp(word.review.lastFailureAt) === getTodayKey()) risk += 14;
    if (word.review?.dueAt) {
      const overdueDays = Math.max(0, (Date.now() - word.review.dueAt) / DAY_MS);
      risk += Math.min(24, overdueDays * 8);
      const dueInHours = (word.review.dueAt - Date.now()) / (60 * 60 * 1000);
      if (dueInHours > 0 && dueInHours <= 24) risk += Math.max(0, 12 - dueInHours / 2);
    }
    return Math.max(0, Math.min(100, Math.round(risk)));
  }

  function getRiskLabel(risk) {
    if (risk >= 80) return uiText('Rất dễ rơi', 'Critical risk', 'Critical risk');
    if (risk >= 65) return uiText('Cần cứu sớm', 'Rescue soon', 'Rescue soon');
    if (risk >= 45) return uiText('Nên nhắc lại', 'Review soon', 'Review soon');
    return uiText('Khá ổn', 'Stable', 'Stable');
  }

  function getAtRiskWords(words, limit = 8) {
    return [...words]
      .map(word => {
        word._riskScore = calculateForgettingRisk(word);
        return word;
      })
      .sort((a, b) => b._riskScore - a._riskScore || (a.review?.dueAt || Number.MAX_SAFE_INTEGER) - (b.review?.dueAt || Number.MAX_SAFE_INTEGER))
      .slice(0, Math.max(1, limit));
  }

  function getTonightReviewQueue(words, limit = 6) {
    const todayKey = getTodayKey();
    const todayNew = words.filter(word => getDateKeyFromTimestamp(word.createdAt) === todayKey);
    const todayFailed = words.filter(word => getDateKeyFromTimestamp(word.review?.lastFailureAt) === todayKey);
    const dueTonight = words.filter(word => isDueWord(word) || calculateForgettingRisk(word) >= 65);
    const combined = [];
    const seen = new Set();
    [todayFailed, dueTonight, todayNew].forEach(group => {
      group.forEach(word => {
        if (seen.has(word.id)) return;
        seen.add(word.id);
        combined.push(word);
      });
    });
    return combined.slice(0, Math.max(1, limit));
  }

  function getTomorrowRescueQueue(words, limit = 6) {
    const tomorrowEnd = new Date();
    tomorrowEnd.setHours(23, 59, 59, 999);
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
    return getAtRiskWords(words, limit * 2)
      .filter(word => !word.review?.dueAt || word.review.dueAt <= tomorrowEnd.getTime() || word._riskScore >= 70)
      .slice(0, Math.max(1, limit));
  }

  function summarizeMistakeJournal() {
    const journal = state.stats.mistakeJournal || {};
    return Object.entries(journal)
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count)
      .filter(item => item.count > 0);
  }

  function getMistakeReasonLabel(reason) {
    const labels = {
      meaning: uiText('Sai nghĩa', 'Meaning miss', 'Meaning miss'),
      spelling: uiText('Sai chính tả', 'Spelling miss', 'Spelling miss'),
      listening: uiText('Nghe chưa chắc', 'Listening miss', 'Listening miss'),
      recall: uiText('Gọi lại chưa ra', 'Recall miss', 'Recall miss'),
      confusion: uiText('Dễ nhầm lẫn', 'Confusion pair', 'Confusion pair')
    };
    return labels[reason] || uiText('Lỗi khác', 'Other issue', 'Other issue');
  }

  function inferFailureReasonFromGame(gameType) {
    if (gameType === 'dictation') return 'listening';
    if (gameType === 'typing') return 'spelling';
    if (gameType === 'matching') return 'confusion';
    if (gameType === 'quiz') return state.activeQuizMode === 'context' ? 'confusion' : state.activeQuizMode === 'meaning-word' ? 'recall' : 'meaning';
    return 'recall';
  }

  function recordFailureReason(reason, word, gameType = state.currentGame) {
    const safeReason = reason || inferFailureReasonFromGame(gameType);
    state.stats.mistakeJournal[safeReason] = (state.stats.mistakeJournal[safeReason] || 0) + 1;
    state.stats.recentFailures = [
      {
        wordId: word.id,
        word: word.word,
        meaning: word.meaning,
        reason: safeReason,
        gameType,
        at: Date.now()
      },
      ...(state.stats.recentFailures || [])
    ].slice(0, 24);
  }

  function startCustomQueue(queue, gameType, planTitle, planReason) {
    if (!queue.length) return showToast('Nhóm này hiện chưa có mục phù hợp để mở nhanh.');
    startGame(gameType, byId('reviewSetDropdown').value || 'all', { queue, planTitle, planReason });
  }

  function ensureAdvancedReviewPanels() {
    const reviewView = byId('review-dashboard-view');
    if (!reviewView || byId('advancedReviewGrid')) return;
    const wrapper = document.createElement('div');
    wrapper.id = 'advancedReviewGrid';
    wrapper.className = 'advanced-review-grid';
    wrapper.innerHTML = `
      <div id="tonightReviewCard" class="panel-card review-queue-card"></div>
      <div id="tomorrowRescueCard" class="panel-card review-queue-card"></div>
      <div id="mistakeJournalCard" class="panel-card review-queue-card"></div>
    `;
    const insightPanel = byId('reviewInsightPanel');
    if (insightPanel?.parentNode) insightPanel.insertAdjacentElement('afterend', wrapper);
    else reviewView.appendChild(wrapper);
  }

  function renderAdvancedReviewPanels(words) {
    ensureAdvancedReviewPanels();
    const tonightCard = byId('tonightReviewCard');
    const tomorrowCard = byId('tomorrowRescueCard');
    const mistakesCard = byId('mistakeJournalCard');
    if (!tonightCard || !tomorrowCard || !mistakesCard) return;

    const tonight = getTonightReviewQueue(words, 6);
    const tomorrow = getTomorrowRescueQueue(words, 6);
    const mistakes = summarizeMistakeJournal();
    const recentFailures = (state.stats.recentFailures || []).slice(0, 4);

    tonightCard.innerHTML = `
      <div class="queue-card-top">
        <div>
          <div class="insight-label">Tonight Review</div>
          <div class="insight-note">${escapeHtml(uiText('Ôn ngắn trước khi nghỉ để khóa lại từ mới, từ vừa sai và từ có nguy cơ rơi.', 'A short pre-sleep review to lock new items, fresh mistakes, and high-risk words.', 'A short pre-sleep review to lock new items, fresh mistakes, and high-risk words.'))}</div>
        </div>
        <span class="queue-badge">${tonight.length}</span>
      </div>
      <ul class="queue-list">
        ${tonight.length ? tonight.map(word => `<li><strong>${escapeHtml(word.word)}</strong><span>${escapeHtml(getEntryTypeLabel(word))} • ${escapeHtml(getWordStatusLabel(word))}</span></li>`).join('') : `<li>${escapeHtml(uiText('Chưa có mục nào thật sự cần ôn tối nay.', 'Nothing urgently needs a Tonight Review right now.', 'Nothing urgently needs a Tonight Review right now.'))}</li>`}
      </ul>
      <div class="queue-actions">
        <button type="button" class="secondary-btn queue-action-btn" data-queue-action="tonight">${escapeHtml(uiText('Ôn tối nay', 'Start Tonight Review', 'Start Tonight Review'))}</button>
      </div>
    `;

    tomorrowCard.innerHTML = `
      <div class="queue-card-top">
        <div>
          <div class="insight-label">Tomorrow Rescue</div>
          <div class="insight-note">${escapeHtml(uiText('Những mục nên cứu trong vòng 24 giờ tới để tránh tụt trí nhớ dài hạn.', 'Items to rescue within the next 24 hours before long-term memory drops.', 'Items to rescue within the next 24 hours before long-term memory drops.'))}</div>
        </div>
        <span class="queue-badge risk-badge">${tomorrow.length}</span>
      </div>
      <ul class="queue-list">
        ${tomorrow.length ? tomorrow.map(word => `<li><strong>${escapeHtml(word.word)}</strong><span>${escapeHtml(getRiskLabel(word._riskScore || calculateForgettingRisk(word)))} • risk ${(word._riskScore || calculateForgettingRisk(word))}%</span></li>`).join('') : `<li>${escapeHtml(uiText('Ngày mai hiện khá nhẹ, chưa có mục cần cứu gấp.', 'Tomorrow looks fairly light. No urgent rescue item yet.', 'Tomorrow looks fairly light. No urgent rescue item yet.'))}</li>`}
      </ul>
      <div class="queue-actions">
        <button type="button" class="secondary-btn queue-action-btn" data-queue-action="rescue">${escapeHtml(uiText('Mở Memory Rescue', 'Open Memory Rescue', 'Open Memory Rescue'))}</button>
      </div>
    `;

    mistakesCard.innerHTML = `
      <div class="queue-card-top">
        <div>
          <div class="insight-label">${escapeHtml(uiText('Nhật ký lỗi', 'Mistake Journal', 'Mistake Journal'))}</div>
          <div class="insight-note">${escapeHtml(uiText('Theo dõi kiểu sai nổi bật để chuyển từ xem lại sang chữa đúng điểm yếu.', 'Track standout error types so review turns into focused repair.', 'Track standout error types so review turns into focused repair.'))}</div>
        </div>
        <span class="queue-badge">${recentFailures.length}</span>
      </div>
      <div class="mistake-summary-row">
        ${(mistakes.length ? mistakes.slice(0, 3) : [{ key: 'recall', count: 0 }]).map(item => `<span class="mistake-chip">${escapeHtml(getMistakeReasonLabel(item.key))}: <strong>${item.count}</strong></span>`).join('')}
      </div>
      <ul class="queue-list compact-list">
        ${recentFailures.length ? recentFailures.map(item => `<li><strong>${escapeHtml(item.word)}</strong><span>${escapeHtml(getMistakeReasonLabel(item.reason))} • ${escapeHtml(item.gameType || 'study')}</span></li>`).join('') : `<li>${escapeHtml(uiText('Chưa có lỗi gần đây để ghi vào journal.', 'No recent mistake has been logged yet.', 'No recent mistake has been logged yet.'))}</li>`}
      </ul>
      <div class="queue-actions">
        <button type="button" class="secondary-btn queue-action-btn" data-queue-action="mistakes">${escapeHtml(uiText('Luyện theo lỗi', 'Drill by mistake type', 'Drill by mistake type'))}</button>
      </div>
    `;

    document.querySelectorAll('.queue-action-btn').forEach(button => {
      button.addEventListener('click', () => {
        const action = button.dataset.queueAction;
        if (action === 'tonight') {
          startCustomQueue(tonight, 'flashcard', uiText('Tonight Review', 'Tonight Review', 'Tonight Review'), uiText('Khóa lại từ mới và lỗi vừa xảy ra trước khi kết thúc ngày học.', 'Lock in new items and fresh mistakes before the study day ends.', 'Lock in new items and fresh mistakes before the study day ends.'));
        } else if (action === 'rescue') {
          startCustomQueue(tomorrow, 'srs', 'Memory Rescue', uiText('Ưu tiên các mục có nguy cơ rơi trí nhớ trong 24 giờ tới.', 'Prioritize items likely to slip within the next 24 hours.', 'Prioritize items likely to slip within the next 24 hours.'));
        } else if (action === 'mistakes') {
          const wordIds = new Set((state.stats.recentFailures || []).slice(0, 10).map(item => item.wordId));
          const queue = words.filter(word => wordIds.has(word.id));
          startCustomQueue(queue, 'typing', uiText('Mistake Journal Drill', 'Mistake Journal Drill', 'Mistake Journal Drill'), uiText('Đưa các lỗi gần đây sang luyện chủ động để sửa thẳng điểm yếu.', 'Turn recent mistakes into active repair drills.', 'Turn recent mistakes into active repair drills.'));
        }
      });
    });
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
    if (isDueWord(word)) return uiText('Đến hạn', 'Due now', 'Due now');
    if (isWeakWord(word)) return uiText('Cần ôn lại', 'Needs reinforcement', 'Needs reinforcement');
    return getLocalizedMemoryStage(getMemoryStage(word), 'label');
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

  function getConceptFamilyKey(word) {
    if (!word) return 'family:none';
    const upgradeData = window.VMUpgradeData || {};
    const confusionBank = upgradeData.CONFUSION_BANK || {};
    const normalizedWord = normalizeAnswer(word.word || '');
    const compareCandidates = extractCompareCandidates(confusionBank[normalizedWord]?.compare || '');
    const tag = (word.topicTags || []).map(item => normalizeAnswer(item)).find(Boolean);
    if (compareCandidates.length) {
      return `conf:${[normalizedWord, ...compareCandidates].filter(Boolean).sort().join('|')}`;
    }
    if (tag) return `tag:${tag}`;
    const root = normalizedWord.split(' ').slice(0, 2).join(' ');
    if (root) return `root:${root}`;
    const meaningAnchor = tokenizeSuggestionText(word.meaning || '').find(token => token.length > 3);
    return `meaning:${meaningAnchor || 'general'}`;
  }

  function getQueuePriorityScore(word, profile = 'balanced') {
    const risk = calculateForgettingRisk(word);
    let score = risk;
    if (isDueWord(word)) score += profile === 'rescue' ? 38 : 28;
    if (isWeakWord(word)) score += profile === 'drill' ? 32 : 18;
    if (isNewWord(word)) score += profile === 'warmup' ? 18 : 10;
    if (word.entryType === 'pattern') score += 6;
    if (word.review?.lastFailureAt && Date.now() - word.review.lastFailureAt < DAY_MS * 2) score += 8;
    return score;
  }

  function buildCoverageQueue(words, limit = 20, profile = 'balanced') {
    const pool = [...words].filter(Boolean);
    const target = Math.max(1, Math.min(limit, pool.length));
    const selected = [];
    const used = new Set();
    const recentFamilies = [];
    const recentTypes = [];

    while (selected.length < target) {
      let best = null;
      let bestAdjusted = -Infinity;

      pool.forEach(word => {
        if (!word?.id || used.has(word.id)) return;
        let adjusted = getQueuePriorityScore(word, profile);
        const familyKey = getConceptFamilyKey(word);
        const entryType = word.entryType || 'word';
        if (recentFamilies.includes(familyKey)) adjusted -= 22;
        if (recentTypes.filter(type => type === entryType).length >= 2) adjusted -= 10;
        if (selected.slice(-2).some(existing => getWordSimilarityScore(existing, word) >= 0.7)) adjusted -= 14;
        if (selected.some(existing => existing.id === word.id)) adjusted -= 100;
        if (best === null || adjusted > bestAdjusted) {
          best = word;
          bestAdjusted = adjusted;
        }
      });

      if (!best) break;
      used.add(best.id);
      selected.push(best);
      recentFamilies.push(getConceptFamilyKey(best));
      recentTypes.push(best.entryType || 'word');
      if (recentFamilies.length > 2) recentFamilies.shift();
      if (recentTypes.length > 3) recentTypes.shift();
    }

    return selected;
  }

  function getRecommendedQueue(words, limit = 20) {
    return buildCoverageQueue(words, Math.max(1, limit), 'rescue');
  }

  function getSessionQueue(words, gameType) {
    const maxItems = gameType === 'matching' ? 18 : 20;
    if (gameType === 'srs') return getRecommendedQueue(words, 20);
    if (gameType === 'typing' || gameType === 'dictation') return buildCoverageQueue(words, Math.min(words.length, 12), 'drill');
    if (gameType === 'flashcard') return buildCoverageQueue(words, Math.min(words.length, maxItems), 'warmup');
    return buildCoverageQueue(shuffle([...words]), Math.min(words.length, maxItems), 'balanced');
  }

  function diversifyStudyQueue(words, limit = 20) {
    const selected = [];
    const deferred = [];
    const target = Math.max(1, limit);
    for (const word of words) {
      const isTooClose = selected.slice(-3).some(existing => getWordSimilarityScore(existing, word) >= 0.72);
      if (isTooClose) deferred.push(word);
      else selected.push(word);
      if (selected.length >= target) break;
    }
    if (selected.length < target) {
      for (const word of deferred) {
        selected.push(word);
        if (selected.length >= target) break;
      }
    }
    return selected.slice(0, target);
  }

  function getWordSimilarityScore(a, b) {
    if (!a || !b) return 0;
    const sameWord = normalizeAnswer(a.word) && normalizeAnswer(a.word) === normalizeAnswer(b.word);
    if (sameWord) return 1;

    const wordTokensA = tokenizeSuggestionText(a.word);
    const wordTokensB = tokenizeSuggestionText(b.word);
    const meaningTokensA = tokenizeSuggestionText(a.meaning);
    const meaningTokensB = tokenizeSuggestionText(b.meaning);

    const wordOverlap = getTokenOverlap(wordTokensA, wordTokensB);
    const meaningOverlap = getTokenOverlap(meaningTokensA, meaningTokensB);
    const entryBonus = a.entryType && a.entryType === b.entryType ? 0.08 : 0;
    return Math.min(1, wordOverlap * 0.55 + meaningOverlap * 0.45 + entryBonus);
  }

  function tokenizeSuggestionText(text = '') {
    return normalizeAnswer(text)
      .split(' ')
      .filter(token => token && token.length > 1);
  }

  function getTokenOverlap(tokensA = [], tokensB = []) {
    if (!tokensA.length || !tokensB.length) return 0;
    const setA = new Set(tokensA);
    const setB = new Set(tokensB);
    let matches = 0;
    setA.forEach(token => {
      if (setB.has(token)) matches += 1;
    });
    return matches / Math.max(setA.size, setB.size, 1);
  }

  function getRecommendedStudyPlan(words, stats = getSetStats(words)) {
    if (!words.length) {
      return {
        gameType: null,
        title: uiText('Chưa có dữ liệu để ôn', 'No data to review yet', 'No data to review yet'),
        reason: uiText('Hãy thêm vài từ trước khi bắt đầu một lộ trình học mới.', 'Add a few words before starting a new learning path.', 'Add a few words before starting a new learning path.')
      };
    }

    if (stats.due > 0) {
      return {
        gameType: 'srs',
        title: uiText(`Memory Rescue • ${Math.min(getRecommendedQueue(words, 20).length, 20)} mục ưu tiên`, `Memory Rescue • ${Math.min(getRecommendedQueue(words, 20).length, 20)} priority item(s)`, `Memory Rescue • ${Math.min(getRecommendedQueue(words, 20).length, 20)} priority item(s)`),
        reason: uiText('Ưu tiên các mục có nguy cơ rơi trí nhớ và các mục đến hạn trước để giữ nền tảng dài hạn ổn định.', 'Prioritize due and high-risk items first to stabilize long-term memory.', 'Prioritize due and high-risk items first to stabilize long-term memory.')
      };
    }

    if (stats.weak > 0) {
      return {
        gameType: 'typing',
        title: uiText(`Mistake Journal Drill • ${Math.min(words.length, 10)} lượt luyện`, `Mistake Journal Drill • ${Math.min(words.length, 10)} reps`, `Mistake Journal Drill • ${Math.min(words.length, 10)} reps`),
        reason: uiText('Các mục còn yếu nên được kéo sang nhớ chủ động để sửa thẳng lỗi gọi lại, chính tả hoặc nhầm nghĩa.', 'Weak items should move into active recall to fix recall, spelling, and meaning errors directly.', 'Weak items should move into active recall to fix recall, spelling, and meaning errors directly.')
      };
    }

    if (stats.fresh > 0) {
      return {
        gameType: 'flashcard',
        title: uiText(`Flashcard + Tonight Review • ${Math.min(words.length, 20)} thẻ`, `Flashcard + Tonight Review • ${Math.min(words.length, 20)} cards`, `Flashcard + Tonight Review • ${Math.min(words.length, 20)} cards`),
        reason: uiText('Mục mới nên đi qua một vòng nhận diện nhẹ trước rồi khóa lại bằng một lượt ôn ngắn cuối ngày.', 'New items should get a light recognition pass first, then a short lock-in review later.', 'New items should get a light recognition pass first, then a short lock-in review later.')
      };
    }

    if (words.length >= 4) {
      return {
        gameType: 'quiz',
        title: uiText(`Trắc nghiệm • ${Math.min(words.length, 10)} câu tăng phản xạ`, `Quiz • ${Math.min(words.length, 10)} fast checks`, `Quiz • ${Math.min(words.length, 10)} fast checks`),
        reason: uiText('Khi bộ từ đã khá ổn định, trắc nghiệm là cách an toàn để kiểm tra tốc độ nhận biết.', 'Once the set is fairly stable, quiz mode safely tests recognition speed.', 'Once the set is fairly stable, quiz mode safely tests recognition speed.')
      };
    }

    return {
      gameType: 'flashcard',
      title: uiText(`Flashcard • ${Math.min(words.length, 20)} thẻ ôn nhẹ`, `Flashcard • ${Math.min(words.length, 20)} light cards`, `Flashcard • ${Math.min(words.length, 20)} light cards`),
      reason: uiText('Với bộ từ nhỏ, flashcard vẫn là bước ôn ổn định và ít rủi ro nhất.', 'For a small set, flashcard is still the safest stable review step.', 'For a small set, flashcard is still the safest stable review step.')
    };
  }

  function startRecommendedStudy() {
    const setName = byId('reviewSetDropdown').value || 'all';
    const words = getWordsForSet(setName);
    const plan = getRecommendedStudyPlan(words);
    if (!plan.gameType) return showToast(uiText('Hãy thêm vài từ trước khi bắt đầu học.', 'Add a few words before you start learning.', 'Add a few words before you start learning.'));
    startGame(plan.gameType, setName, { planTitle: plan.title, planReason: plan.reason, queue: plan.gameType === 'srs' ? getRecommendedQueue(words, 20) : undefined });
  }

  function startTargetedFocus(type) {
    const setName = byId('reviewSetDropdown').value || 'all';
    const words = getWordsForSet(setName);
    const filters = {
      due: words.filter(isDueWord),
      weak: words.filter(isWeakWord),
      new: words.filter(isNewWord)
    };
    const queue = diversifyStudyQueue(filters[type] || [], type === 'weak' ? 12 : 20);
    if (!queue.length) return showToast(uiText('Hiện chưa có nhóm từ phù hợp để mở nhanh.', 'There is no suitable group to launch right now.', 'There is no suitable group to launch right now.'));
    const config = {
      due: { gameType: 'srs', title: uiText('Ôn từ đến hạn', 'Review due words', 'Review due words'), reason: uiText('Giữ nền tảng trí nhớ không bị tụt.', 'Keep the memory base from slipping.', 'Keep the memory base from slipping.') },
      weak: { gameType: 'typing', title: uiText('Ôn từ yếu', 'Drill weak words', 'Drill weak words'), reason: uiText('Kéo các từ còn yếu sang nhớ chủ động.', 'Pull weak items into active recall.', 'Pull weak items into active recall.') },
      new: { gameType: 'flashcard', title: uiText('Làm quen từ mới', 'Warm up new words', 'Warm up new words'), reason: uiText('Xây lớp ghi nhớ đầu tiên thật nhẹ nhàng.', 'Build the first memory layer gently.', 'Build the first memory layer gently.') }
    }[type];
    startGame(config.gameType, setName, { queue, planTitle: config.title, planReason: config.reason });
  }


  function getSuggestionScopeKey() {
    const selected = byId('wordsetDropdown')?.value || 'all';
    return selected || 'all';
  }

  function refreshSmartSuggestions() {
    renderSmartSuggestions({ forceRotate: true });
  }

  function getSuggestionGroupLabel(category = 'bridge') {
    const labels = {
      contrast: uiText('Cặp phân biệt', 'Contrast lane', 'Contrast lane'),
      bridge: uiText('Từ nối vùng nhớ', 'Bridge lane', 'Bridge lane'),
      topic: uiText('Theo chủ đề bộ từ', 'Topic lane', 'Topic lane'),
      pattern: uiText('Mẫu nối câu', 'Pattern lane', 'Pattern lane')
    };
    return labels[category] || uiText('Gợi ý hệ thống', 'System lane', 'System lane');
  }

  function buildSuggestionGroups(candidates = []) {
    const grouped = {};
    candidates.forEach(item => {
      const key = item.category || 'bridge';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });
    const groupOrder = ['contrast', 'bridge', 'topic', 'pattern'].filter(key => grouped[key]?.length);
    Object.keys(grouped).forEach(key => {
      if (!groupOrder.includes(key) && grouped[key]?.length) groupOrder.push(key);
    });
    return { grouped, groupOrder };
  }

  function refreshSuggestionBucket(scopeKey = 'all') {
    const candidates = buildSmartSuggestionPool(scopeKey);
    const { grouped, groupOrder } = buildSuggestionGroups(candidates);
    const bucket = {
      candidates,
      grouped,
      groupOrder,
      activeGroupIndex: 0,
      cursorByGroup: {},
      pageSize: 6,
      cycle: 1
    };
    state.smartSuggestionMeta.byScope[scopeKey] = bucket;
    return bucket;
  }

  function getActiveSuggestionGroup(bucket) {
    const key = bucket?.groupOrder?.[bucket.activeGroupIndex || 0] || '';
    return {
      key,
      items: key ? (bucket.grouped?.[key] || []) : (bucket?.candidates || [])
    };
  }

  function renderSmartSuggestions({ resetCycle = false, forceRotate = false } = {}) {
    const grid = byId('smartSuggestionGrid');
    const contextNote = byId('suggestionContextNote');
    const refreshBtn = byId('refreshSuggestionsBtn');
    if (!grid) return;

    const scopeKey = getSuggestionScopeKey();
    state.smartSuggestionMeta.currentScope = scopeKey;
    let bucket = state.smartSuggestionMeta.byScope[scopeKey];

    if (!bucket || resetCycle) {
      bucket = refreshSuggestionBucket(scopeKey);
    } else if (forceRotate) {
      const active = getActiveSuggestionGroup(bucket);
      const pageSize = bucket.pageSize || 6;
      if (bucket.groupOrder.length > 1) {
        bucket.activeGroupIndex = (bucket.activeGroupIndex + 1) % bucket.groupOrder.length;
        if (bucket.activeGroupIndex === 0) bucket.cycle = (bucket.cycle || 1) + 1;
      } else if (active.items.length > pageSize) {
        const currentCursor = bucket.cursorByGroup[active.key] || 0;
        bucket.cursorByGroup[active.key] = (currentCursor + pageSize) % active.items.length;
        if ((bucket.cursorByGroup[active.key] || 0) === 0) bucket.cycle = (bucket.cycle || 1) + 1;
      } else {
        bucket = refreshSuggestionBucket(scopeKey);
        if (bucket.candidates.length === (state.smartSuggestionMeta.byScope[scopeKey]?.candidates || []).length) {
          bucket.cycle = (bucket.cycle || 1) + 1;
        }
      }
    }

    const active = getActiveSuggestionGroup(bucket);
    const cursor = bucket.cursorByGroup[active.key] || 0;
    const suggestions = sliceSuggestionDeck(active.items, cursor, bucket.pageSize || 6);
    const scopeLabel = scopeKey === 'all' ? uiText('toàn bộ thư viện', 'the whole library', 'the whole library') : `“${scopeKey}”`;
    const laneLabel = active.key ? getSuggestionGroupLabel(active.key) : uiText('Gợi ý chính', 'Primary lane', 'Primary lane');

    if (contextNote) {
      if (bucket.candidates.length) {
        const hiddenCount = Math.max(0, active.items.length - suggestions.length);
        contextNote.textContent = uiText(
          `Gợi ý đang bám theo ${scopeLabel}. Làn hiện tại: ${laneLabel}. ${hiddenCount ? `Còn ${hiddenCount} mục trong làn này.` : 'Đây là nhóm tốt nhất hiện tại.'}`,
          `Suggestions are following ${scopeLabel}. Active lane: ${laneLabel}. ${hiddenCount ? `${hiddenCount} more item(s) are waiting in this lane.` : 'This is the strongest lane right now.'}`,
          `Suggestions follow ${scopeLabel}. Active lane: ${laneLabel}. ${hiddenCount ? `${hiddenCount} more item(s) remain in this lane.` : 'This is the strongest lane right now.'}`
        );
      } else {
        contextNote.textContent = uiText(
          `Chưa có đủ tín hiệu từ ${scopeLabel} để đề xuất thêm. Hãy thêm vài từ hoặc đổi bộ từ khác.`,
          `There is not enough signal from ${scopeLabel} yet. Add a few words or switch to another set.`,
          `There is not enough signal from ${scopeLabel} yet. Add a few words or switch sets.`
        );
      }
    }

    if (refreshBtn) {
      refreshBtn.disabled = !bucket.candidates.length;
      refreshBtn.textContent = bucket.groupOrder.length > 1
        ? uiText('Đổi làn gợi ý', 'Switch suggestion lane', 'Switch suggestion lane')
        : active.items.length > (bucket.pageSize || 6)
          ? uiText('Xem nhóm tiếp theo', 'Next page in lane', 'Next page in lane')
          : uiText('Làm mới gợi ý', 'Refresh suggestions', 'Refresh suggestions');
    }

    if (!suggestions.length) {
      grid.innerHTML = `<div class="suggestion-empty">${escapeHtml(uiText(
        'Hãy thêm vài từ trước. Khi đã có dữ liệu, hệ thống sẽ đề xuất từ tiếp theo theo bộ đang chọn, ưu tiên từ bù khoảng trống và tránh lặp quá gần.',
        'Add a few words first. Then the system can suggest what comes next for the selected set, fill real gaps, and avoid near-duplicate learning.',
        'Add a few words first. Then the system can suggest what comes next for the selected set and avoid near-duplicate learning.'
      ))}</div>`;
      state.smartSuggestions = [];
      renderSetIntelligence(scopeKey, []);
      return;
    }

    grid.innerHTML = suggestions.map(item => `
      <article class="suggestion-card">
        <div class="suggestion-card-head">
          <div class="suggestion-word-block">
            <strong>${escapeHtml(item.word)}</strong>
            <small>${escapeHtml(item.wordType || item.entryTypeLabel || 'word')}</small>
          </div>
          <span class="suggestion-chip suggestion-chip-group">${escapeHtml(getSuggestionGroupLabel(item.category || 'bridge'))}</span>
        </div>
        <p class="suggestion-meaning">${escapeHtml(item.meaning || uiText('Bổ sung nền nghĩa mới', 'Adds a new meaning anchor', 'Adds a new meaning anchor'))}</p>
        <p class="suggestion-reason">${escapeHtml(item.reason)}</p>
        <div class="suggestion-note">${escapeHtml(item.note || uiText('Giúp bù khoảng trống trong bộ từ mà không nhồi lại cùng một khái niệm.', 'Fills a real gap without forcing the same concept too often.', 'Fills a real gap without forcing the same concept too often.'))}</div>
        <div class="suggestion-actions">
          <button class="secondary-btn" data-suggestion-action="append" data-suggestion-key="${escapeHtml(item.key)}">${escapeHtml(uiText('Dán vào ô nhập', 'Append to input', 'Append to input'))}</button>
          <button class="primary-btn" data-suggestion-action="save" data-suggestion-key="${escapeHtml(item.key)}">${escapeHtml(uiText('Lưu ngay', 'Save now', 'Save now'))}</button>
        </div>
      </article>
    `).join('');

    state.smartSuggestions = suggestions;
    renderSetIntelligence(scopeKey, bucket.candidates);
  }

  function rotateSuggestionPool(candidates = [], scopeKey = 'all', cycle = 1) {
    const pool = [...(candidates || [])];
    if (pool.length <= 1) return pool;
    const offset = Math.max(1, (String(scopeKey).length + cycle) % pool.length);
    return pool.slice(offset).concat(pool.slice(0, offset));
  }

  function sliceSuggestionDeck(candidates = [], cursor = 0, pageSize = 6) {
    const limit = Math.max(1, pageSize);
    if (!candidates.length) return [];
    if (candidates.length <= limit) return candidates.slice(0, limit);
    const deck = [];
    for (let i = 0; i < limit; i += 1) {
      deck.push(candidates[(cursor + i) % candidates.length]);
    }
    return deck;
  }

  function renderSetIntelligence(scopeKey = getSuggestionScopeKey(), suggestionPool = null) {
    const grid = byId('setIntelligenceGrid');
    if (!grid) return;
    const words = getWordsForSet(scopeKey);
    const pool = Array.isArray(suggestionPool) ? suggestionPool : buildSmartSuggestionPool(scopeKey);
    if (!words.length) {
      grid.innerHTML = `<div class="intelligence-empty">${escapeHtml(uiText(
        'Bộ này còn trống. Khi có vài từ đầu tiên, Set Intelligence sẽ chỉ ra cụm yếu, vùng trùng lặp và cụm nên bổ sung tiếp theo.',
        'This set is still empty. After a few entries are added, Set Intelligence will show weak clusters, overlap zones, and the next cluster to add.',
        'This set is still empty. After a few entries are added, Set Intelligence will show weak clusters and the next cluster to add.'
      ))}</div>`;
      return;
    }
    const stats = getSetStats(words);
    const atRisk = getAtRiskWords(words, 4);
    const familyStats = {};
    atRisk.forEach(word => {
      const key = getConceptFamilyKey(word);
      if (!familyStats[key]) {
        familyStats[key] = { count: 0, sample: word };
      }
      familyStats[key].count += 1;
      if ((word._riskScore || 0) > (familyStats[key].sample?._riskScore || 0)) familyStats[key].sample = word;
    });
    const weakestFamily = Object.values(familyStats).sort((a, b) => b.count - a.count || (b.sample?._riskScore || 0) - (a.sample?._riskScore || 0))[0];
    const categories = {};
    pool.forEach(item => {
      const key = item.category || 'bridge';
      categories[key] = (categories[key] || 0) + 1;
    });
    const nextCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    const topWords = pool.filter(item => !nextCategory || item.category === nextCategory).slice(0, 3).map(item => item.word).filter(Boolean);
    const patternCount = words.filter(word => word.entryType === 'pattern').length;
    const phraseCount = words.filter(word => word.entryType === 'phrase').length;
    const coverageNote = patternCount || phraseCount
      ? uiText(`Bộ này đã có ${phraseCount} cụm và ${patternCount} mẫu câu, khá tốt để học theo cụm nhớ.`, `This set already has ${phraseCount} phrase(s) and ${patternCount} pattern(s), which is good for cluster memory.`, `This set already has ${phraseCount} phrase(s) and ${patternCount} pattern(s).`)
      : uiText('Bộ này vẫn nghiêng nhiều về từ đơn. Thêm cụm hoặc mẫu sẽ giúp gọi nhớ thực tế hơn.', 'This set still leans on single words. Add phrases or patterns for stronger usable recall.', 'This set still leans on single words. Add phrases or patterns for stronger recall.');

    const cards = [
      {
        label: uiText('Độ phủ hiện tại', 'Coverage now', 'Coverage now'),
        value: `${stats.total}`,
        note: `${buildEntryTypeSummary(words)} • ${buildMemoryStageSummary(words)}`,
        foot: coverageNote
      },
      {
        label: uiText('Cụm cần kéo lên', 'Weak cluster', 'Weak cluster'),
        value: weakestFamily?.sample?.word || uiText('Chưa rõ cụm yếu', 'No dominant weak cluster', 'No dominant weak cluster'),
        note: weakestFamily
          ? uiText(`Cụm này đang có ${weakestFamily.count} mục risk cao. Nên cứu ${weakestFamily.sample.word} trước.`, `This cluster has ${weakestFamily.count} high-risk item(s). Rescue ${weakestFamily.sample.word} first.`, `This cluster has ${weakestFamily.count} high-risk item(s). Rescue ${weakestFamily.sample.word} first.`)
          : uiText('Hiện chưa có cụm rơi nổi bật.', 'No dominant falling cluster right now.', 'No dominant falling cluster right now.'),
        foot: atRisk[0] ? `${uiText('Risk cao nhất', 'Highest risk', 'Highest risk')}: ${atRisk[0].word} (${atRisk[0]._riskScore}%)` : ''
      },
      {
        label: uiText('Cụm nên thêm tiếp', 'Next best cluster', 'Next best cluster'),
        value: nextCategory ? getSuggestionGroupLabel(nextCategory) : uiText('Chưa có', 'No lane yet', 'No lane yet'),
        note: topWords.length
          ? uiText(`Từ gợi ý nổi bật: ${topWords.join(', ')}.`, `Top candidates: ${topWords.join(', ')}.`, `Top candidates: ${topWords.join(', ')}.`)
          : uiText('Chưa có gợi ý nổi bật. Hãy thêm thêm dữ liệu nền cho bộ này.', 'No strong candidate yet. Add a little more foundation data for this set.', 'No strong candidate yet. Add more foundation data for this set.'),
        foot: nextCategory ? uiText('Nhấn Đổi làn gợi ý để chuyển sang nhóm kế tiếp thay vì lặp cùng một vùng nhớ.', 'Use Switch suggestion lane to move to another cluster instead of repeating the same zone.', 'Use Switch suggestion lane to move to another cluster instead of repeating the same zone.') : ''
      },
      {
        label: uiText('Làn ngôn ngữ', 'Language lane', 'Language lane'),
        value: getLanguageModeLabel(),
        note: getLanguageModeHint(),
        foot: uiText('Bạn có thể đổi nhanh ở thanh trên cùng để chuyển từ ôn tiếng Việt sang ôn ưu tiên tiếng Anh.', 'Switch it from the top bar whenever you want a more English-led or more Vietnamese-led study experience.', 'Switch it from the top bar whenever you want a more English-led or more Vietnamese-led study experience.')
      }
    ];

    grid.innerHTML = cards.map(card => `
      <article class="intelligence-card">
        <span class="intelligence-label">${escapeHtml(card.label)}</span>
        <strong class="intelligence-value">${escapeHtml(card.value)}</strong>
        <div class="intelligence-note">${escapeHtml(card.note || '')}</div>
        <div class="intelligence-foot">${escapeHtml(card.foot || '')}</div>
      </article>
    `).join('');
  }

  function buildSmartSuggestionPool(scopeKey = 'all') {
    const scopedWords = getWordsForSet(scopeKey).filter(Boolean);
    const fullLibrary = (state.vocab || []).filter(Boolean);
    const baseWords = scopedWords.length ? scopedWords : fullLibrary;
    const scopeLabel = scopeKey === 'all' ? 'toàn bộ thư viện' : `bộ “${scopeKey}”`;
    const existingKeys = new Set(fullLibrary.map(word => normalizeAnswer(word?.word || '')).filter(Boolean));
    const scopeKeys = new Set(scopedWords.map(word => normalizeAnswer(word?.word || '')).filter(Boolean));
    const upgradeData = window.VMUpgradeData || {};
    const lessonBank = upgradeData.WORD_LESSON_BANK || {};
    const confusionBank = upgradeData.CONFUSION_BANK || {};
    const patternBank = upgradeData.PATTERN_TEMPLATES || [];
    const candidates = [];
    const seenCandidateKeys = new Set();
    const focusWords = getAtRiskWords(baseWords, Math.min(10, Math.max(4, baseWords.length)));
    const topicPool = getSuggestionTopicPool(baseWords, scopeKey);

    const pushCandidate = (item) => {
      if (!item?.word) return;
      const normalizedWord = normalizeAnswer(item.word);
      if (!normalizedWord || existingKeys.has(normalizedWord) || scopeKeys.has(normalizedWord) || seenCandidateKeys.has(normalizedWord)) return;
      const prepared = {
        key: `${scopeKey}__${normalizedWord}__${candidates.length}`,
        word: String(item.word || '').trim(),
        entryType: item.entryType || 'word',
        sourceLabel: item.sourceLabel || uiText('Gợi ý hệ thống', 'System suggestion', 'System suggestion'),
        category: item.category || 'bridge',
        meaning: item.meaning || uiText('Bổ sung nền nghĩa mới', 'Adds a new meaning anchor', 'Adds a new meaning anchor'),
        note: item.note || '',
        reason: item.reason || `Từ này giúp mở rộng ${scopeLabel} mà không đè lặp cùng một vùng nhớ.`,
        wordType: item.wordType || (item.entryType === 'pattern' ? 'pattern' : 'core word'),
        example: item.example || '',
        phonetic: item.phonetic || '',
        topicTags: Array.isArray(item.topicTags) ? item.topicTags : [],
        score: Number(item.score) || 0,
        linkedWord: item.linkedWord || ''
      };
      seenCandidateKeys.add(normalizedWord);
      candidates.push(prepared);
    };

    focusWords.forEach(word => {
      const confusion = confusionBank[normalizeAnswer(word.word)];
      if (!confusion?.compare) return;
      extractCompareCandidates(confusion.compare).forEach((candidateWord, index) => {
        const normalizedCandidate = normalizeAnswer(candidateWord);
        if (!normalizedCandidate || normalizedCandidate === normalizeAnswer(word.word)) return;
        pushCandidate({
          word: candidateWord,
          meaning: `Bổ sung để phân biệt với ${word.word}`,
          wordType: uiText('cặp dễ nhầm', 'confusion pair', 'confusion pair'),
          sourceLabel: uiText('Cặp dễ nhầm', 'Contrast pair', 'Contrast pair'),
          category: 'contrast',
          reason: `Bạn đang ôn ${word.word} trong ${scopeLabel}. Thêm ${candidateWord} sẽ giúp sửa lỗi nhầm lẫn ngay trong cùng vùng học.`,
          note: confusion.note,
          topicTags: mergeUniqueTopicTags(word.topicTags || [], [scopeKey]),
          linkedWord: word.word,
          score: 92 - index * 4 + Math.round((word._riskScore || calculateForgettingRisk(word)) / 4)
        });
      });
    });

    Object.entries(lessonBank).forEach(([key, lesson]) => {
      const normalizedKey = normalizeAnswer(key);
      if (existingKeys.has(normalizedKey) || scopeKeys.has(normalizedKey)) return;
      const lexicalMatch = focusWords.reduce((best, word) => Math.max(best, getWordSimilarityScore(word, { word: key, meaning: lesson.collocationMeaning || lesson.sentence || '', entryType: 'word' })), 0);
      const topicHit = topicPool.some(token => tokenizeSuggestionText(`${key} ${lesson.collocation || ''} ${lesson.collocationMeaning || ''} ${lesson.sentence || ''} ${lesson.pattern || ''}`).includes(token));
      const tagHit = focusWords.some(word => (word.topicTags || []).some(tag => normalizeAnswer(`${lesson.sentence || ''} ${lesson.collocationMeaning || ''}`).includes(normalizeAnswer(tag))));
      if (!topicHit && !tagHit && lexicalMatch < 0.16 && candidates.length >= 10) return;
      const linkedWord = focusWords
        .map(word => ({ word, sim: getWordSimilarityScore(word, { word: key, meaning: lesson.collocationMeaning || lesson.sentence || '', entryType: 'word' }) }))
        .sort((a, b) => b.sim - a.sim)[0]?.word;
      pushCandidate({
        word: key,
        meaning: lesson.collocationMeaning || lesson.sentence || 'Bổ sung nền nghĩa quan trọng',
        wordType: uiText('từ nối nền', 'core bridge', 'core bridge'),
        sourceLabel: topicHit || tagHit ? uiText('Theo chủ đề bộ từ', 'Topic-aligned', 'Topic-aligned') : uiText('Lấp khoảng trống', 'Gap filler', 'Gap filler'),
        category: topicHit || tagHit ? 'topic' : 'bridge',
        reason: topicHit || tagHit
          ? `Từ này bám sát chủ đề hiện có trong ${scopeLabel}, giúp bộ từ liền mạch hơn thay vì dàn trải.`
          : `Từ này nằm gần vùng bạn đang học và phù hợp để nối các mục riêng lẻ thành một cụm nhớ rõ ràng hơn.`,
        note: lesson.grammar || lesson.recall || '',
        example: lesson.sentence || '',
        topicTags: mergeUniqueTopicTags(linkedWord?.topicTags || [], [scopeKey, 'smart-bridge']),
        linkedWord: linkedWord?.word || '',
        score: 58 + Math.round(lexicalMatch * 100) + (topicHit ? 20 : 0) + (tagHit ? 12 : 0)
      });
    });

    if (baseWords.some(word => word.entryType === 'pattern' || word.entryType === 'phrase')) {
      patternBank.forEach((pattern, index) => {
        const normalizedLabel = normalizeAnswer(pattern.label || pattern.pattern || '');
        if (!normalizedLabel || seenCandidateKeys.has(normalizedLabel) || candidates.length >= 18) return;
        const topicHit = topicPool.some(token => tokenizeSuggestionText(`${pattern.label || ''} ${pattern.pattern || ''} ${pattern.example || ''}`).includes(token));
        const anchorWord = focusWords.find(word => tokenizeSuggestionText(`${pattern.example || ''} ${pattern.pattern || ''}`).some(token => tokenizeSuggestionText(`${word.word} ${word.meaning}`).includes(token)));
        if (!topicHit && !anchorWord && index > 6) return;
        pushCandidate({
          word: pattern.label || pattern.pattern,
          entryType: 'pattern',
          meaning: pattern.pattern || 'Mẫu câu gợi ý để tái sử dụng từ vựng',
          wordType: uiText('mẫu câu', 'pattern', 'pattern'),
          sourceLabel: uiText('Mẫu nối câu', 'Pattern bridge', 'Pattern bridge'),
          category: 'pattern',
          reason: `Bộ ${scopeLabel} đã có dấu hiệu học qua cụm và mẫu câu. Thêm mẫu này sẽ giúp dùng lại từ thay vì chỉ nhớ nghĩa đơn lẻ.`,
          note: pattern.grammar || '',
          example: pattern.example || '',
          topicTags: mergeUniqueTopicTags(anchorWord?.topicTags || [], [scopeKey, 'pattern-bridge']),
          linkedWord: anchorWord?.word || '',
          score: 44 + (topicHit ? 16 : 0) + (anchorWord ? 12 : 0)
        });
      });
    }

    return candidates
      .filter(item => item && typeof item === 'object' && String(item.word || '').trim())
      .sort((a, b) => {
        const scoreDiff = (Number(b?.score) || 0) - (Number(a?.score) || 0);
        if (scoreDiff) return scoreDiff;
        return String(a?.word || '').localeCompare(String(b?.word || ''));
      })
      .slice(0, 24);
  }

  function getSuggestionTopicPool(words, scopeKey = 'all') {
    const tokens = new Set();
    const addTokens = (text) => {
      tokenizeSuggestionText(text).forEach(token => {
        if (token.length >= 3) tokens.add(token);
      });
    };
    addTokens(scopeKey === 'all' ? '' : scopeKey);
    words.filter(Boolean).slice(0, 18).forEach(word => {
      addTokens(word.word || '');
      addTokens(word.wordType || '');
      addTokens(word.meaning || '');
      (Array.isArray(word.topicTags) ? word.topicTags : []).forEach(addTokens);
    });
    return Array.from(tokens).slice(0, 28);
  }

  function extractCompareCandidates(text = '') {
    return String(text || '')
      .split(/\s+vs\s+|,/i)
      .map(part => part.trim())
      .filter(Boolean)
      .reduce((list, part) => {
        const candidate = part.replace(/^compare\s+/i, '').trim();
        if (!candidate) return list;
        if (!list.some(item => normalizeAnswer(item) === normalizeAnswer(candidate))) list.push(candidate);
        return list;
      }, []);
  }

  function getSmartSuggestions(limit = 6) {
    const scopeKey = getSuggestionScopeKey();
    const bucket = state.smartSuggestionMeta.byScope[scopeKey] || { candidates: buildSmartSuggestionPool(scopeKey), cursor: 0, pageSize: limit };
    return sliceSuggestionDeck(bucket.candidates || [], bucket.cursor || 0, limit);
  }

  function findSmartSuggestionByKey(key) {
    if (!key) return null;
    const currentMatch = (state.smartSuggestions || []).find(item => item?.key === key);
    if (currentMatch) return currentMatch;
    const scopeKey = state.smartSuggestionMeta.currentScope || getSuggestionScopeKey();
    const bucket = state.smartSuggestionMeta.byScope[scopeKey];
    return (bucket?.candidates || []).find(item => item?.key === key) || null;
  }

  function removeSmartSuggestion(key, scopeKey = null) {
    const targetScope = scopeKey || state.smartSuggestionMeta.currentScope || getSuggestionScopeKey();
    const bucket = state.smartSuggestionMeta.byScope[targetScope];
    if (bucket?.candidates?.length) {
      bucket.candidates = bucket.candidates.filter(item => item?.key !== key);
      Object.keys(bucket.grouped || {}).forEach(groupKey => {
        bucket.grouped[groupKey] = (bucket.grouped[groupKey] || []).filter(item => item?.key !== key);
      });
      bucket.groupOrder = (bucket.groupOrder || []).filter(groupKey => (bucket.grouped?.[groupKey] || []).length);
      if (bucket.activeGroupIndex >= bucket.groupOrder.length) bucket.activeGroupIndex = 0;
    }
    state.smartSuggestions = (state.smartSuggestions || []).filter(item => item?.key !== key);
  }

  function appendSuggestionToInput(item) {
    const bulkInput = byId('bulkInput');
    if (!bulkInput || !item?.word) return false;
    const line = [
      item.word,
      item.phonetic || '',
      item.wordType || '',
      item.meaning || '',
      item.example || '',
      item.note || ''
    ].join(' | ');
    const normalizedLine = normalizeAnswer(line);
    const existingLines = String(bulkInput.value || '').split(/\r?\n/).map(part => normalizeAnswer(part));
    if (existingLines.includes(normalizedLine)) {
      bulkInput.focus();
      return false;
    }
    bulkInput.value = bulkInput.value.trim() ? `${bulkInput.value.trim()}\n${line}` : line;
    bulkInput.focus();
    bulkInput.setSelectionRange(bulkInput.value.length, bulkInput.value.length);
    return true;
  }

  async function saveSmartSuggestion(item) {
    if (!item?.word) return false;
    const scopeKey = state.smartSuggestionMeta.currentScope || getSuggestionScopeKey();
    const linkedWord = state.vocab.find(word => normalizeAnswer(word?.word) === normalizeAnswer(item.linkedWord || ''));
    const targetSet = scopeKey !== 'all'
      ? scopeKey
      : linkedWord?.wordset || byId('wordsetDropdown')?.value || 'Chưa phân loại';

    const result = upsertWords([{
      word: item.word,
      phonetic: item.phonetic || '',
      meaning: item.meaning || '',
      wordType: item.wordType || '',
      example: item.example || '',
      notes: item.note || '',
      wordset: targetSet,
      entryType: item.entryType || 'word',
      topicTags: item.topicTags || [],
      createdAt: Date.now()
    }], targetSet);

    removeSmartSuggestion(item.key, scopeKey);
    await saveAndRefresh();
    renderSmartSuggestions({ resetCycle: true });
    showToast(result.added ? `Đã lưu ${item.word} vào bộ “${targetSet}”.` : result.merged ? `Đã gộp ${item.word} với dữ liệu cũ trong bộ “${targetSet}”.` : `${item.word} đã có sẵn trong bộ “${targetSet}”.`);
    return result.added > 0 || result.merged > 0;
  }

  async function handleSuggestionAction(event) {
    const button = event.target.closest('[data-suggestion-action]');
    if (!button) return;
    const item = findSmartSuggestionByKey(button.dataset.suggestionKey || '');
    if (!item) {
      showToast('Không tìm thấy gợi ý này nữa. Hãy làm mới danh sách gợi ý.');
      return;
    }

    const action = button.dataset.suggestionAction;
    if (action === 'append') {
      const appended = appendSuggestionToInput(item);
      showToast(appended ? `Đã dán ${item.word} vào ô nhập.` : `${item.word} đã có trong ô nhập rồi.`);
      return;
    }

    if (action === 'save') {
      button.disabled = true;
      try {
        await saveSmartSuggestion(item);
      } finally {
        button.disabled = false;
      }
    }
  }


  function ensureEffectsLabPanel() {
    const managementView = byId('management-view');
    if (!managementView || byId('effectsLabPanel')) return;
    const panel = document.createElement('section');
    panel.id = 'effectsLabPanel';
    panel.className = 'panel-card effects-lab-panel';
    panel.innerHTML = `
      <div class="effects-lab-head">
        <div>
          <h2 id="effectsLabTitle">Effects Lab</h2>
          <p id="effectsLabLead" class="muted-text"></p>
        </div>
        <div class="effects-lab-badge">${escapeHtml(uiText('Update lớn', 'Big update', 'Big update'))}</div>
      </div>
      <div class="effects-lab-grid">
        <label class="effects-field">
          <span id="fxGlassLabel">Glass style</span>
          <select id="fxGlassSelect" class="modern-input" data-fx-setting="fxGlass">
            <option value="crystal">Crystal Clear</option>
            <option value="mist">Mist Glow</option>
            <option value="depth">Depth Glass</option>
          </select>
        </label>
        <label class="effects-field">
          <span id="fxMotionLabel">Motion</span>
          <select id="fxMotionSelect" class="modern-input" data-fx-setting="fxMotion">
            <option value="off">Still</option>
            <option value="calm">Calm</option>
            <option value="flow">Flow</option>
          </select>
        </label>
        <label class="effects-field">
          <span id="fxDensityLabel">Shell density</span>
          <select id="fxDensitySelect" class="modern-input" data-fx-setting="fxDensity">
            <option value="compact">Compact</option>
            <option value="cozy">Cozy</option>
          </select>
        </label>
      </div>
      <div id="fxSceneGrid" class="fx-scene-grid">
        <button type="button" class="fx-scene-card" data-fx-scene="nebula" data-fx-scene-card="nebula"><strong class="fx-scene-name">Nebula</strong><span class="fx-scene-note"></span></button>
        <button type="button" class="fx-scene-card" data-fx-scene="aurora" data-fx-scene-card="aurora"><strong class="fx-scene-name">Aurora</strong><span class="fx-scene-note"></span></button>
        <button type="button" class="fx-scene-card" data-fx-scene="midnight" data-fx-scene-card="midnight"><strong class="fx-scene-name">Midnight</strong><span class="fx-scene-note"></span></button>
      </div>
      <div id="effectsLabPreviewNote" class="effects-lab-preview muted-text"></div>
    `;
    const summary = byId('managementSummary');
    if (summary?.parentNode) summary.insertAdjacentElement('afterend', panel);
    else managementView.prepend(panel);
  }

  function renderEffectsLabPanel() {
    ensureEffectsLabPanel();
    const glass = byId('fxGlassSelect');
    const motion = byId('fxMotionSelect');
    const density = byId('fxDensitySelect');
    if (glass) glass.value = state.settings.fxGlass || DEFAULT_SETTINGS.fxGlass;
    if (motion) motion.value = state.settings.fxMotion || DEFAULT_SETTINGS.fxMotion;
    if (density) density.value = state.settings.fxDensity || DEFAULT_SETTINGS.fxDensity;
    document.querySelectorAll('[data-fx-scene]').forEach(button => {
      button.classList.toggle('active', button.dataset.fxScene === (state.settings.fxScene || DEFAULT_SETTINGS.fxScene));
    });
    if (byId('effectsLabPreviewNote')) byId('effectsLabPreviewNote').textContent = buildEffectsLabSummary();
  }

  function ensureClusterMissionPanel() {
    const reviewView = byId('review-dashboard-view');
    if (!reviewView || byId('clusterMissionPanel')) return;
    const panel = document.createElement('section');
    panel.id = 'clusterMissionPanel';
    panel.className = 'panel-card cluster-mission-panel';
    panel.innerHTML = `
      <div class="cluster-panel-head">
        <div>
          <h2 id="clusterMissionTitle">Memory Constellation</h2>
          <p id="clusterMissionLead" class="muted-text"></p>
        </div>
      </div>
      <div id="clusterMissionGrid" class="cluster-mission-grid"></div>
    `;
    const anchor = byId('dailyFocusGrid');
    if (anchor?.parentNode) anchor.insertAdjacentElement('afterend', panel);
    else reviewView.appendChild(panel);
  }

  function initMainView() {
    populateSetDropdown(byId('wordsetDropdown'));
    renderSmartSuggestions({ resetCycle: true });
    renderSetIntelligence();
  }

  function initManagementView() {
    renderManagementSummary();
    renderEffectsLabPanel();
    renderWordsetsGrid();
  }

  function initReviewView() {
    populateSetDropdown(byId('reviewSetDropdown'), true);
    ensureClusterMissionPanel();
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
      allOption.textContent = uiText('Tất cả bộ từ', 'All sets', 'All sets');
      selectEl.appendChild(allOption);
    }

    if (sets.length === 0) {
      const fallback = document.createElement('option');
      fallback.value = 'Chưa phân loại';
      fallback.textContent = uiText('Chưa phân loại', 'Uncategorized', 'Uncategorized');
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
      { label: uiText('Tổng số mục', 'Total entries', 'Total entries'), value: stats.total, note: state.optimizerReport?.mergedDuplicates ? `${buildEntryTypeSummary(state.vocab)} • ${uiText('đã gộp', 'merged', 'merged')} ${state.optimizerReport.mergedDuplicates} ${uiText('mục trùng', 'duplicates', 'duplicates')}` : buildEntryTypeSummary(state.vocab) },
      { label: uiText('Bộ từ', 'Sets', 'Sets'), value: sets.length, note: uiText('Dễ chia theo chủ đề hoặc bối cảnh học', 'Easy to split by topic or context', 'Easy to split by topic or context') },
      { label: uiText('Đến hạn hôm nay', 'Due today', 'Due today'), value: stats.due, note: uiText('Nên ôn sớm để không quên', 'Best reviewed early before they slip', 'Best reviewed early before they slip') },
      { label: uiText('Tiến độ hôm nay', "Today's progress", "Today's progress"), value: `${today.studied}/${state.stats.dailyGoal}`, note: uiText(`Chuỗi học ${state.stats.currentStreak} ngày`, `${state.stats.currentStreak}-day streak`, `${state.stats.currentStreak}-day streak`) }
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
    createCard.innerHTML = `<div class="create-new-content"><span class="create-icon">+</span><h2>${escapeHtml(uiText('Tạo bộ từ mới', 'Create a new set', 'Create a new set'))}</h2><p class="muted-text">${escapeHtml(uiText('Bắt đầu một nhóm từ mới và thêm dữ liệu ngay.', 'Start a fresh set and add data right away.', 'Start a fresh set and add data right away.'))}</p></div>`;
    createCard.addEventListener('click', () => {
      showView('main-view');
      openModal('createSetModal');
    });
    grid.appendChild(createCard);

    const allSets = getUniqueWordsets();
    if (!state.vocab.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = `<strong>${escapeHtml(uiText('Chưa có từ vựng nào', 'No vocabulary yet', 'No vocabulary yet'))}</strong><div>${escapeHtml(uiText('Thêm vài từ đầu tiên để bắt đầu học và theo dõi tiến độ.', 'Add your first entries to start studying and tracking progress.', 'Add your first entries to start studying and tracking progress.'))}</div>`;
      grid.appendChild(empty);
      return;
    }

    const query = normalizeAnswer(byId('setSearchInput')?.value || '');
    const sortBy = byId('setSortSelect')?.value || 'due';

    const sets = allSets
      .map(setName => {
        const words = state.vocab.filter(word => word.wordset === setName);
        const stats = getSetStats(words);
        const searchBlob = normalizeAnswer(`${setName} ${words.map(word => `${word.word} ${word.meaning} ${word.wordType} ${word.entryType || ''}`).join(' ')}`);
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
      emptySearch.innerHTML = `<strong>${escapeHtml(uiText('Không tìm thấy bộ từ phù hợp', 'No matching set found', 'No matching set found'))}</strong><div>${escapeHtml(uiText('Thử đổi từ khóa hoặc thứ tự sắp xếp.', 'Try a different keyword or sorting order.', 'Try a different keyword or sorting order.'))}</div>`;
      grid.appendChild(emptySearch);
      return;
    }

    sets.forEach(({ setName, words, stats }) => {
      const weakTypes = getWeakTypeStats(words);
      const typeSummary = buildEntryTypeSummary(words);
      const topRisk = getAtRiskWords(words, 1)[0];
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
          <div class="card-metrics compact-metrics">
            <span>${typeSummary}</span>
            <span>${topRisk ? `Risk cao nhất: ${topRisk.word}` : 'Risk ổn định'}</span>
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
    const topRisk = getAtRiskWords(words, 1)[0];
    byId('detailsSummaryText').textContent = `${words.length} mục • ${stats.due} đến hạn • ${stats.fresh} mới • ${stats.weak} cần củng cố • ${buildEntryTypeSummary(words)}${topRisk ? ` • Risk cao nhất: ${topRisk.word}` : ''} • ${buildMemoryStageSummary(words)}`;
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
    const optimized = optimizeVocabularySystem([...otherWords, ...updatedWords].map((word, index) => normalizeWord(word, index)));
    state.vocab = optimized.vocab;
    state.optimizerReport = optimized.report;
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
    const riskSummary = getAtRiskWords(words, 3);

    if (!words.length) {
      recommendation.textContent = uiText('Bộ từ đang trống. Hãy thêm từ trước khi bắt đầu ôn tập.', 'This set is empty. Add some entries before starting review.', 'This set is empty. Add some entries before starting review.');
      dashboardSubtext.textContent = uiText('Khi có dữ liệu, mọi chế độ sẽ cùng cập nhật tiến độ học.', 'Once data is available, every mode will update the same learning progress.', 'Once data is available, every mode will update the same learning progress.');
    } else if (stats.due > 0) {
      recommendation.textContent = uiText(`Bạn có ${stats.due} mục đến hạn. “Memory Rescue” hoặc “Ôn tập thông minh” nên được mở trước.`, `You have ${stats.due} due item(s). Start with Memory Rescue or the smart review lane first.`, `You have ${stats.due} due item(s). Start with Memory Rescue or the smart review lane first.`);
      dashboardSubtext.textContent = uiText(`Thang nhớ hiện tại: ${buildMemoryStageSummary(words)}. Risk cao nhất: ${riskSummary[0] ? `${riskSummary[0].word} (${riskSummary[0]._riskScore}%)` : 'ổn định'}.`, `Current memory ladder: ${buildMemoryStageSummary(words)}. Highest risk: ${riskSummary[0] ? `${riskSummary[0].word} (${riskSummary[0]._riskScore}%)` : 'stable'}.`, `Current memory ladder: ${buildMemoryStageSummary(words)}. Highest risk: ${riskSummary[0] ? `${riskSummary[0].word} (${riskSummary[0]._riskScore}%)` : 'stable'}.`);
    } else if (stats.weak > 0) {
      recommendation.textContent = uiText(`Có ${stats.weak} mục đang cần củng cố. Flashcard hoặc Gõ từ sẽ hiệu quả nhất lúc này.`, `There are ${stats.weak} item(s) needing reinforcement. Flashcard or Typing will help most right now.`, `There are ${stats.weak} item(s) needing reinforcement. Flashcard or Typing will help most right now.`);
      dashboardSubtext.textContent = uiText(`Thang nhớ hiện tại: ${buildMemoryStageSummary(words)} • ${buildEntryTypeSummary(words)}.`, `Current memory ladder: ${buildMemoryStageSummary(words)} • ${buildEntryTypeSummary(words)}.`, `Current memory ladder: ${buildMemoryStageSummary(words)} • ${buildEntryTypeSummary(words)}.`);
    } else if (stats.fresh > 0) {
      recommendation.textContent = uiText(`Có ${stats.fresh} mục mới chưa ôn. Bắt đầu bằng Flashcard trước rồi chốt lại bằng Tonight Review.`, `There are ${stats.fresh} fresh item(s). Start with Flashcard, then lock them in with Tonight Review.`, `There are ${stats.fresh} fresh item(s). Start with Flashcard, then lock them in with Tonight Review.`);
      dashboardSubtext.textContent = uiText(`Thang nhớ hiện tại: ${buildMemoryStageSummary(words)} • ${buildEntryTypeSummary(words)}.`, `Current memory ladder: ${buildMemoryStageSummary(words)} • ${buildEntryTypeSummary(words)}.`, `Current memory ladder: ${buildMemoryStageSummary(words)} • ${buildEntryTypeSummary(words)}.`);
    } else {
      recommendation.textContent = uiText('Bạn đang khá ổn. Có thể chơi Quiz hoặc Nghe viết để tăng phản xạ, rồi nhìn qua Tomorrow Rescue để tránh rơi nhịp.', 'You are in a fairly stable zone. Use Quiz or Dictation for speed, then glance at Tomorrow Rescue to avoid slipping.', 'You are in a fairly stable zone. Use Quiz or Dictation for speed, then glance at Tomorrow Rescue to avoid slipping.');
      dashboardSubtext.textContent = uiText(`Thang nhớ hiện tại: ${buildMemoryStageSummary(words)} • ${buildEntryTypeSummary(words)}.`, `Current memory ladder: ${buildMemoryStageSummary(words)} • ${buildEntryTypeSummary(words)}.`, `Current memory ladder: ${buildMemoryStageSummary(words)} • ${buildEntryTypeSummary(words)}.`);
    }

    byId('modeBoardSummaryLine').textContent = words.length
      ? uiText(`${stats.total} mục • ${buildEntryTypeSummary(words)} • ${stats.mastered}/${stats.total} đã vững.`, `${stats.total} item(s) • ${buildEntryTypeSummary(words)} • ${stats.mastered}/${stats.total} strong.`, `${stats.total} item(s) • ${buildEntryTypeSummary(words)} • ${stats.mastered}/${stats.total} strong.`)
      : uiText('Thêm vài từ đầu tiên để Learning Lab bắt đầu gợi ý chính xác hơn.', 'Add the first few items so Learning Lab can guide you more accurately.', 'Add the first few items so Learning Lab can guide you more accurately.');
    byId('modeBoardTension').textContent = riskSummary[0]
      ? uiText(`Risk cao nhất: ${riskSummary[0].word} (${riskSummary[0]._riskScore}%)`, `Highest risk: ${riskSummary[0].word} (${riskSummary[0]._riskScore}%)`, `Highest risk: ${riskSummary[0].word} (${riskSummary[0]._riskScore}%)`)
      : uiText('Risk hiện đang nhẹ', 'Risk is currently light', 'Risk is currently light');
    byId('modeBoardCoverage').textContent = stats.weak
      ? uiText(`Điểm cần kéo lên: ${stats.weak} mục yếu`, `Need to lift: ${stats.weak} weak item(s)`, `Need to lift: ${stats.weak} weak item(s)`)
      : stats.fresh
        ? uiText(`Chưa phủ hết: ${stats.fresh} mục mới`, `Still uncovered: ${stats.fresh} fresh item(s)`, `Still uncovered: ${stats.fresh} fresh item(s)`)
        : uiText('Độ phủ đang khá ổn', 'Coverage is fairly stable', 'Coverage is fairly stable');
    byId('modeBoardGap').textContent = stats.due
      ? uiText(`${stats.due} mục cần cứu ngay`, `${stats.due} item(s) need rescue now`, `${stats.due} item(s) need rescue now`)
      : summarizeMistakeJournal()[0]
        ? uiText(`Lỗi nổi bật: ${getMistakeReasonLabel(summarizeMistakeJournal()[0].key)}`, `Top issue: ${getMistakeReasonLabel(summarizeMistakeJournal()[0].key)}`, `Top issue: ${getMistakeReasonLabel(summarizeMistakeJournal()[0].key)}`)
        : uiText('Chưa có lỗi nổi bật', 'No standout mistake yet', 'No standout mistake yet');
    byId('spotlightModeName').textContent = recommendedPlan.title;
    byId('spotlightModeReason').textContent = recommendedPlan.reason;
    byId('spotlightLaunchBtn').disabled = !recommendedPlan.gameType;

    document.querySelectorAll('.mode-lab-card').forEach(card => {
      card.classList.toggle('recommended-mode-card', card.dataset.game === recommendedPlan.gameType);
    });

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
    renderClusterMissions(words);
    renderReviewInsights(words);
    renderAdvancedReviewPanels(words);

    byId('recommendedModeTitle').textContent = recommendedPlan.title;
    byId('recommendedModeReason').textContent = recommendedPlan.reason;
    byId('startRecommendedBtn').disabled = !recommendedPlan.gameType;
    byId('startDueFocusBtn').disabled = !stats.due;
    byId('startWeakFocusBtn').disabled = !stats.weak;
    byId('startNewFocusBtn').disabled = !stats.fresh;

    const badgeText = {
      flashcard: uiText(`${Math.min(words.length, 20)} thẻ`, `${Math.min(words.length, 20)} cards`, `${Math.min(words.length, 20)} cards`),
      quiz: uiText(`${Math.min(words.length, 10)} câu`, `${Math.min(words.length, 10)} questions`, `${Math.min(words.length, 10)} questions`),
      matching: uiText(`${Math.min(words.length, 6)} cặp`, `${Math.min(words.length, 6)} pairs`, `${Math.min(words.length, 6)} pairs`),
      typing: uiText(`${Math.min(words.length, 10)} câu`, `${Math.min(words.length, 10)} prompts`, `${Math.min(words.length, 10)} prompts`),
      dictation: uiText(`${Math.min(words.length, 10)} câu`, `${Math.min(words.length, 10)} prompts`, `${Math.min(words.length, 10)} prompts`),
      srs: uiText(`${smartQueueSize} từ ưu tiên`, `${smartQueueSize} priority words`, `${smartQueueSize} priority words`)
    };

    document.querySelectorAll('[data-badge]').forEach(node => {
      node.textContent = badgeText[node.dataset.badge] || '0';
    });
  }

  function getConceptFamilyDisplay(familyKey, sample) {
    if ((familyKey || '').startsWith('conf:')) {
      return uiText(`Nhóm phân biệt: ${sample.word}`, `Contrast family: ${sample.word}`, `Contrast family: ${sample.word}`);
    }
    if ((familyKey || '').startsWith('tag:')) {
      const tag = sample.topicTags?.[0] || sample.wordset || sample.word;
      return uiText(`Cụm chủ đề: ${tag}`, `Topic cluster: ${tag}`, `Topic cluster: ${tag}`);
    }
    if ((familyKey || '').startsWith('root:')) {
      return uiText(`Nhóm gốc: ${sample.word}`, `Root family: ${sample.word}`, `Root family: ${sample.word}`);
    }
    return uiText(`Cụm nghĩa: ${sample.word}`, `Meaning cluster: ${sample.word}`, `Meaning cluster: ${sample.word}`);
  }

  function buildClusterMissions(words) {
    const families = {};
    words.forEach(word => {
      const key = getConceptFamilyKey(word);
      if (!families[key]) families[key] = { key, sample: word, words: [], risk: 0, due: 0, weak: 0, types: new Set() };
      const bucket = families[key];
      const risk = calculateForgettingRisk(word);
      bucket.words.push(word);
      bucket.types.add(word.entryType || 'word');
      bucket.risk += risk;
      if (isDueWord(word)) bucket.due += 1;
      if (isWeakWord(word)) bucket.weak += 1;
      if (risk > calculateForgettingRisk(bucket.sample)) bucket.sample = word;
    });
    return Object.values(families)
      .filter(item => item.words.length >= 2 || item.risk / Math.max(1, item.words.length) >= 54)
      .map(item => {
        const avgRisk = Math.round(item.risk / Math.max(1, item.words.length));
        const queue = buildCoverageQueue(item.words, Math.min(10, item.words.length), item.due ? 'rescue' : item.weak ? 'drill' : 'balanced');
        const gameType = item.due ? 'srs' : item.weak ? 'typing' : (item.types.has('pattern') ? 'flashcard' : 'quiz');
        return {
          key: item.key,
          title: getConceptFamilyDisplay(item.key, item.sample),
          sample: item.sample,
          avgRisk,
          queue,
          gameType,
          itemCount: item.words.length,
          due: item.due,
          weak: item.weak,
          preview: item.words.slice(0, 4).map(word => word.word).join(', '),
          reason: item.due
            ? uiText('Cụm này có nhiều mục đến hạn và đang cần cứu theo nhóm.', 'This cluster has multiple due items and should be rescued as one memory zone.', 'This cluster has multiple due items and should be rescued as one memory zone.')
            : item.weak
              ? uiText('Cụm này đang sai hoặc nhớ yếu, hợp để drill theo nhóm liên quan.', 'This cluster is weak or error-prone, so a grouped drill works better than isolated review.', 'This cluster is weak or error-prone, so a grouped drill works better than isolated review.')
              : uiText('Cụm này giúp mở rộng độ phủ mà không lặp lại đúng một từ duy nhất.', 'This cluster expands coverage without repeating one isolated item.', 'This cluster expands coverage without repeating one isolated item.')
        };
      })
      .sort((a, b) => b.avgRisk - a.avgRisk || b.itemCount - a.itemCount)
      .slice(0, 4);
  }

  function renderClusterMissions(words) {
    ensureClusterMissionPanel();
    const grid = byId('clusterMissionGrid');
    if (!grid) return;
    const missions = buildClusterMissions(words);
    state.clusterMissions = missions;
    if (!missions.length) {
      grid.innerHTML = `<div class="cluster-mission-empty">${escapeHtml(uiText('Khi bộ từ đủ dày hơn, Memory Constellation sẽ tự tạo các mission theo cụm nhầm lẫn, cụm chủ đề hoặc cụm risk cao.', 'Once the set gets denser, Memory Constellation will auto-build missions from confusion pairs, topic families, or high-risk clusters.', 'Once the set gets denser, Memory Constellation will auto-build missions from confusion pairs, topic families, or high-risk clusters.'))}</div>`;
      return;
    }
    grid.innerHTML = missions.map(mission => `
      <article class="cluster-mission-card">
        <div class="cluster-mission-top">
          <span class="cluster-risk-pill">risk ${mission.avgRisk}%</span>
          <span class="cluster-count-pill">${mission.itemCount} ${escapeHtml(uiText('mục', 'items', 'items'))}</span>
        </div>
        <h3>${escapeHtml(mission.title)}</h3>
        <p class="cluster-mission-reason">${escapeHtml(mission.reason)}</p>
        <div class="cluster-preview">${escapeHtml(mission.preview)}</div>
        <div class="cluster-mission-meta">
          <span>${escapeHtml(uiText(`Đến hạn: ${mission.due}`, `Due: ${mission.due}`, `Due: ${mission.due}`))}</span>
          <span>${escapeHtml(uiText(`Yếu: ${mission.weak}`, `Weak: ${mission.weak}`, `Weak: ${mission.weak}`))}</span>
          <span>${escapeHtml(uiText(`Chế độ: ${mission.gameType}`, `Mode: ${mission.gameType}`, `Mode: ${mission.gameType}`))}</span>
        </div>
        <button type="button" class="primary-btn cluster-launch-btn" data-cluster-mission="${escapeHtml(mission.key)}">${escapeHtml(uiText('▶ Mở mission cụm này', '▶ Launch this cluster mission', '▶ Launch this cluster mission'))}</button>
      </article>
    `).join('');
  }

  function launchClusterMission(key) {
    const mission = (state.clusterMissions || []).find(item => item.key === key);
    if (!mission || !mission.queue?.length) return showToast(uiText('Mission này chưa đủ dữ liệu để mở.', 'This mission does not have enough data to launch yet.', 'This mission does not have enough data to launch yet.'));
    startCustomQueue(mission.queue, mission.gameType, mission.title, mission.reason);
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
    const result = upsertWords([{ word, phonetic, wordType, meaning, example, notes, wordset, createdAt: Date.now() }], wordset);
    await saveAndRefresh();
    closeModal('quickAddModal');
    ['quickWord', 'quickPhonetic', 'quickType', 'quickMeaning', 'quickExample', 'quickNotes'].forEach(id => { byId(id).value = ''; });
    byId('wordsetDropdown').value = wordset;
    showToast(result.added ? 'Đã thêm từ mới.' : result.merged ? 'Đã gộp với mục trùng và giữ bản giàu thông tin hơn.' : 'Mục này đã có sẵn, không cần lưu lại.');
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
      const optimized = optimizeVocabularySystem(importedWords);
      state.vocab = optimized.vocab;
      state.optimizerReport = optimized.report;
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
    const result = upsertWords(editedWords.map(word => ({ ...word, wordset, createdAt: Date.now() })), wordset);

    if (!result.added && !result.merged) {
      return showToast('Không có dòng mới hợp lệ để lưu.');
    }

    await saveAndRefresh();
    byId('bulkInput').value = '';
    byId('preview-view').classList.add('hidden');
    byId('input-view').classList.remove('hidden');
    state.parsedWords = [];
    state.parseMeta = null;
    const parts = [];
    if (result.added) parts.push(`thêm ${result.added} mục`);
    if (result.merged) parts.push(`gộp ${result.merged} mục trùng`);
    if (result.skipped) parts.push(`bỏ qua ${result.skipped} dòng không cần thiết`);
    showToast(`Đã lưu xong: ${parts.join(' • ')}.`);
  }

  function buildDedupKey(word, meaning) {
    return `${normalizeAnswer(word)}__${normalizeAnswer(meaning)}`;
  }

  function openStudySupportForCurrent(reason = 'recall', options = {}) {
    const card = state.studyQueue[state.currentCardIdx];
    if (!card) return;
    renderStudySupportForWord(card, reason, options);
    showToast('Đã mở Rescue Lane cho từ hiện tại.');
  }

  function hideStudySupport() {
    state.studySupport = null;
    byId('studySupportDock')?.classList.add('hidden');
    const primaryBtn = byId('studySupportQueueBtn');
    if (primaryBtn) {
      primaryBtn.disabled = true;
      delete primaryBtn.dataset.supportKey;
      primaryBtn.textContent = uiText('Ôn từ liên quan kế tiếp', 'Queue the next related word', 'Queue the next related word');
    }
    if (byId('studySupportPills')) byId('studySupportPills').innerHTML = '';
    if (byId('studySupportGrid')) byId('studySupportGrid').innerHTML = '';
  }

  function getFailureReasonLead(reason, card) {
    const map = {
      meaning: uiText(`Bạn đang biết mặt chữ của “${card.word}” nhưng phần nghĩa vẫn chưa bật ra ổn định.`, `You recognize “${card.word}”, but the meaning is not surfacing reliably yet.`, `You recognize “${card.word}”, but the meaning is not surfacing reliably yet.`),
      spelling: uiText(`Bạn đã chạm gần đúng “${card.word}”, nhưng đường gọi lại phần mặt chữ vẫn còn yếu.`, `You were close to “${card.word}”, but the spelling path is still fragile.`, `You were close to “${card.word}”, but the spelling path is still fragile.`),
      listening: uiText(`Âm của “${card.word}” chưa nối chắc với mặt chữ, nên hệ thống gợi ý thêm các từ gần vùng âm/nghĩa này.`, `The sound of “${card.word}” is not firmly linked to its spelling yet, so nearby sound/meaning words are suggested.`, `The sound of “${card.word}” is not firmly linked to its spelling yet, so nearby words are suggested.`),
      confusion: uiText(`Bạn vừa rơi vào vùng dễ nhầm của “${card.word}”, nên mình đẩy ra vài từ đối chiếu để phân biệt rõ hơn.`, `You just hit a confusion zone around “${card.word}”, so a few contrast words are pushed next.`, `You just hit a confusion zone around “${card.word}”, so a few contrast words are pushed next.`),
      recall: uiText(`Bạn vừa bí khi gọi lại “${card.word}”, nên mình mở một lối nhớ gần nhất thay vì lặp lại mù mờ.`, `You got stuck recalling “${card.word}”, so the system is opening the nearest memory bridge instead of repeating blindly.`, `You got stuck recalling “${card.word}”, so the system is opening the nearest memory bridge instead of repeating blindly.`)
    };
    return map[reason] || map.recall;
  }


  function getRelatedWordsFromVocab(card, reason = 'recall', limit = 3) {
    const basePool = (state.optionPool?.length ? state.optionPool : getWordsForSet(state.activeSet || 'all'))
      .concat(state.vocab)
      .filter((item, index, arr) => item?.id && arr.findIndex(other => other.id === item.id) === index && item.id !== card.id);
    const upgradeData = window.VMUpgradeData || {};
    const confusionBank = upgradeData.CONFUSION_BANK || {};
    const compareSet = new Set(extractCompareCandidates(confusionBank[normalizeAnswer(card.word)]?.compare || ''));
    compareSet.delete(normalizeAnswer(card.word));
    const cardTags = new Set((card.topicTags || []).map(tag => normalizeAnswer(tag)));
    const scored = basePool.map(item => {
      let score = getWordSimilarityScore(card, item) * 60;
      const normalizedWord = normalizeAnswer(item.word);
      if (compareSet.has(normalizedWord)) score += 55;
      if ((item.topicTags || []).some(tag => cardTags.has(normalizeAnswer(tag)))) score += 18;
      if (normalizeAnswer(item.wordType) && normalizeAnswer(item.wordType) === normalizeAnswer(card.wordType)) score += 8;
      if (item.entryType && item.entryType === card.entryType) score += 6;
      if (reason === 'spelling' && item.word[0] && card.word[0] && item.word[0].toLowerCase() === card.word[0].toLowerCase()) score += 4;
      if (normalizeAnswer(item.meaning).includes(normalizeAnswer(card.word)) || normalizeAnswer(card.meaning).includes(normalizedWord)) score += 10;
      if (score < 14) return null;
      const relationLabel = compareSet.has(normalizedWord)
        ? 'Từ đối chiếu để bớt nhầm'
        : (item.topicTags || []).some(tag => cardTags.has(normalizeAnswer(tag)))
          ? 'Cùng chủ đề đang học'
          : 'Từ gần vùng nhớ này';
      return {
        key: `${item.id}__support`,
        actionType: 'queue',
        wordId: item.id,
        word: item.word,
        meaning: item.meaning,
        detail: `${getEntryTypeLabel(item)} • ${getWordStatusLabel(item)}`,
        note: relationLabel,
        score
      };
    }).filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.max(1, limit));
    return scored;
  }

  function getExternalSupportSuggestions(card, reason = 'recall', limit = 2) {
    const existingWords = new Set(state.vocab.map(item => normalizeAnswer(item.word)));
    const upgradeData = window.VMUpgradeData || {};
    const confusionBank = upgradeData.CONFUSION_BANK || {};
    const lessonBank = upgradeData.WORD_LESSON_BANK || {};
    const suggestions = [];
    const pushSuggestion = (item) => {
      if (!item?.word) return;
      const normalized = normalizeAnswer(item.word);
      if (!normalized || existingWords.has(normalized) || suggestions.some(entry => normalizeAnswer(entry.word) === normalized)) return;
      suggestions.push({
        key: `${normalized}__ext_${suggestions.length}`,
        actionType: 'save',
        ...item
      });
    };

    const compareCandidates = extractCompareCandidates(confusionBank[normalizeAnswer(card.word)]?.compare || '');
    compareCandidates.forEach(candidate => {
      if (candidate && candidate !== normalizeAnswer(card.word)) {
        const source = confusionBank[normalizeAnswer(card.word)];
        pushSuggestion({
          word: candidate,
          meaning: `Bổ sung để phân biệt với ${card.word}`,
          detail: 'Gợi ý hệ thống',
          note: source?.note || 'Thêm cặp đối chiếu để giảm nhầm lẫn ở lần sau.',
          topicTags: card.topicTags || [],
          entryType: 'word',
          wordType: 'contrast pair'
        });
      }
    });

    Object.entries(lessonBank).forEach(([word, lesson]) => {
      const similarity = getWordSimilarityScore(card, { word, meaning: lesson.collocationMeaning || lesson.sentence || '', entryType: 'word' });
      if (similarity >= 0.18 || suggestions.length < 1) {
        pushSuggestion({
          word,
          meaning: lesson.collocationMeaning || lesson.sentence || 'Bổ sung vùng nhớ gần đó',
          detail: 'Lấp khoảng trống',
          note: lesson.grammar || lesson.recall || 'Thêm một trục từ nền để nhớ vùng này tốt hơn.',
          example: lesson.sentence || '',
          topicTags: ['rescue-lane'],
          entryType: 'word',
          wordType: 'core word'
        });
      }
    });

    return suggestions.slice(0, Math.max(0, limit));
  }

  function queueRelatedWordNearCurrent(wordId, gap = 1) {
    if (!wordId) return false;
    const targetWord = state.optionPool.find(item => item.id === wordId) || state.vocab.find(item => item.id === wordId);
    if (!targetWord) return false;

    const nearIndex = state.studyQueue.findIndex((item, idx) => idx > state.currentCardIdx && idx <= state.currentCardIdx + gap + 2 && item.id === wordId);
    if (nearIndex !== -1) return true;

    const familyKey = getConceptFamilyKey(targetWord);
    const findSafeInsertIndex = () => {
      let insertAt = Math.min(state.currentCardIdx + gap, state.studyQueue.length);
      while (insertAt < state.studyQueue.length) {
        const neighbors = state.studyQueue.slice(Math.max(0, insertAt - 1), Math.min(state.studyQueue.length, insertAt + 2));
        const crowded = neighbors.some(item => item?.id !== targetWord.id && (getConceptFamilyKey(item) === familyKey || getWordSimilarityScore(item, targetWord) >= 0.72));
        if (!crowded) break;
        insertAt += 1;
      }
      return insertAt;
    };

    const laterIndex = state.studyQueue.findIndex((item, idx) => idx > state.currentCardIdx + gap + 1 && item.id === wordId);
    const insertAt = findSafeInsertIndex();
    if (laterIndex !== -1) {
      const [existing] = state.studyQueue.splice(laterIndex, 1);
      state.studyQueue.splice(Math.min(insertAt, state.studyQueue.length), 0, existing);
      return true;
    }

    state.studyQueue.splice(Math.min(insertAt, state.studyQueue.length), 0, targetWord);
    return true;
  }

  async function saveSupportSuggestion(item) {
    if (!item?.word) return false;
    const targetSet = state.activeSet === 'all' ? (state.studyQueue[state.currentCardIdx]?.wordset || byId('wordsetDropdown')?.value || 'Chưa phân loại') : (state.activeSet || 'Chưa phân loại');
    const result = upsertWords([{
      word: item.word,
      phonetic: item.phonetic || '',
      meaning: item.meaning || '',
      wordType: item.wordType || '',
      example: item.example || '',
      notes: item.note || '',
      wordset: targetSet,
      entryType: item.entryType || 'word',
      topicTags: item.topicTags || [],
      createdAt: Date.now()
    }], targetSet);
    const savedWord = state.vocab.find(word => buildSetWordKey(word.wordset, word.word) === buildSetWordKey(targetSet, item.word) && isMeaningNear(word.meaning, item.meaning || ''));
    if (savedWord) {
      state.optionPool = [savedWord, ...state.optionPool.filter(entry => entry.id !== savedWord.id)];
      queueRelatedWordNearCurrent(savedWord.id, 1);
    }
    await persistState();
    showToast(result.added ? `Đã lưu và đưa ${item.word} vào làn ôn gần tiếp theo.` : result.merged ? `Đã gộp ${item.word} với mục cũ rồi kéo nó vào hàng ôn.` : `Từ ${item.word} đã có trong bộ từ.`);
    return result.added > 0 || result.merged > 0;
  }

  function handleStudySupportPrimaryAction() {
    const button = byId('studySupportQueueBtn');
    const key = button?.dataset.supportKey;
    if (!key) return;
    const item = (state.studySupport?.items || []).find(entry => entry.key === key);
    if (!item) return;
    if (item.actionType === 'queue') {
      const moved = queueRelatedWordNearCurrent(item.wordId, 1);
      showToast(moved ? `Đã đưa ${item.word} vào lượt kế tiếp.` : `Chưa thể chèn ${item.word} vào queue lúc này.`);
    } else if (item.actionType === 'save') {
      saveSupportSuggestion(item);
    }
  }

  function handleStudySupportAction(event) {
    const button = event.target.closest('[data-support-key]');
    if (!button) return;
    const key = button.dataset.supportKey;
    const item = (state.studySupport?.items || []).find(entry => entry.key === key);
    if (!item) return;
    if (item.actionType === 'queue') {
      const moved = queueRelatedWordNearCurrent(item.wordId, 1);
      showToast(moved ? `Đã đưa ${item.word} vào gần ngay sau lượt này.` : `Không thể đưa ${item.word} vào queue ngay.`);
    } else if (item.actionType === 'save') {
      saveSupportSuggestion(item);
    }
  }

  function renderStudySupportForWord(card, reason = 'recall', options = {}) {
    const dock = byId('studySupportDock');
    const grid = byId('studySupportGrid');
    const pills = byId('studySupportPills');
    const title = byId('studySupportTitle');
    const lead = byId('studySupportLead');
    const primaryBtn = byId('studySupportQueueBtn');
    if (!dock || !grid || !pills || !title || !lead || !primaryBtn || !card) return;

    const related = getRelatedWordsFromVocab(card, reason, 3);
    const external = getExternalSupportSuggestions(card, reason, 2);
    const items = [...related, ...external];
    const primaryItem = items.find(item => item.actionType === 'queue') || items[0] || null;

    if (options.autoQueue && primaryItem?.actionType === 'queue') {
      queueRelatedWordNearCurrent(primaryItem.wordId, 1);
    }

    state.studySupport = {
      focusWordId: card.id,
      reason,
      items,
      primaryKey: primaryItem?.key || ''
    };

    title.textContent = `Rescue Lane • ${card.word}`;
    lead.textContent = getFailureReasonLead(reason, card);
    pills.innerHTML = [
      `<span class="support-pill strong-pill">${escapeHtml(uiText('Đáp án', 'Answer', 'Answer'))}: ${escapeHtml(card.word)}</span>`,
      `<span class="support-pill">${escapeHtml(card.meaning || uiText('Chưa có nghĩa', 'No meaning yet', 'No meaning yet'))}</span>`,
      `<span class="support-pill">${escapeHtml(uiText('Lỗi', 'Issue', 'Issue'))}: ${escapeHtml(getMistakeReasonLabel(reason))}</span>`,
      `<span class="support-pill">${escapeHtml(uiText('Mức nhớ', 'Memory stage', 'Memory stage'))}: ${escapeHtml(getLocalizedMemoryStage(getMemoryStage(card), 'shortLabel'))}</span>`
    ].join('');

    if (!items.length) {
      grid.innerHTML = `<div class="support-empty">${escapeHtml(uiText('Chưa tìm thấy từ liên quan đủ mạnh. Bạn có thể bấm “Chưa nhớ” để hệ thống lặp lại từ này sớm hơn.', 'No related word is strong enough yet. You can still mark this as not remembered so it returns sooner.', 'No related word is strong enough yet. You can still mark this as not remembered so it returns sooner.'))}</div>`;
      primaryBtn.disabled = true;
      delete primaryBtn.dataset.supportKey;
      primaryBtn.textContent = uiText('Ôn từ liên quan kế tiếp', 'Queue the next related word', 'Queue the next related word');
    } else {
      grid.innerHTML = items.map(item => `
        <article class="support-card ${item.actionType === 'queue' ? 'queue-card' : 'save-card'}">
          <div class="support-card-head">
            <div>
              <strong>${escapeHtml(item.word)}</strong>
              <span>${escapeHtml(item.detail || (item.actionType === 'queue' ? uiText('Từ liên quan', 'Related word', 'Related word') : uiText('Gợi ý hệ thống', 'System suggestion', 'System suggestion')))}</span>
            </div>
            <span class="support-action-tag">${item.actionType === 'queue' ? uiText('Học tiếp', 'Study next', 'Study next') : uiText('Lưu nhanh', 'Quick save', 'Quick save')}</span>
          </div>
          <p class="support-meaning">${escapeHtml(item.meaning || uiText('Bổ sung vùng nhớ liên quan', 'Add a nearby memory anchor', 'Add a nearby memory anchor'))}</p>
          <p class="support-note">${escapeHtml(item.note || uiText('Thêm một neo nhớ gần đó để đỡ bí ở vòng sau.', 'Add a nearby anchor so the next round is less blank.', 'Add a nearby anchor so the next round is less blank.'))}</p>
          <button class="secondary-btn support-card-btn" data-support-key="${escapeHtml(item.key)}">${item.actionType === 'queue' ? uiText('Đưa vào lượt kế tiếp', 'Queue next', 'Queue next') : uiText('Lưu vào bộ và ôn gần', 'Save and queue nearby', 'Save and queue nearby')} </button>
        </article>
      `).join('');
      primaryBtn.disabled = !primaryItem;
      if (primaryItem) {
        primaryBtn.dataset.supportKey = primaryItem.key;
        primaryBtn.textContent = primaryItem.actionType === 'queue'
          ? uiText(`Ôn ${primaryItem.word} kế tiếp`, `Queue ${primaryItem.word} next`, `Queue ${primaryItem.word} next`)
          : uiText(`Lưu ${primaryItem.word} và ôn gần`, `Save ${primaryItem.word} and queue nearby`, `Save ${primaryItem.word} and queue nearby`);
      }
    }

    dock.classList.remove('hidden');
  }


  async function startGame(gameType, setName, options = {}) {
    const words = getWordsForSet(setName);
    const queue = Array.isArray(options.queue) && options.queue.length ? options.queue : getSessionQueue(words, gameType);
    if (!queue.length) return showToast('Bộ từ này đang trống.');

    state.activeSet = setName;
    state.currentGame = gameType;
    hideStudySupport();
    state.optionPool = [...words];
    state.currentCardIdx = 0;
    state.answerLocked = false;
    state.pendingFailureReason = '';
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
    hideStudySupport();
    state.studyQueue = [];
    state.currentCardIdx = 0;
    state.answerLocked = false;
    showView('review-dashboard-view');
    initReviewView();
  }

  function renderFlashcard() {
    const card = state.studyQueue[state.currentCardIdx];
    if (!card) return finishSession('Đã hoàn thành lượt ôn tập này.');

    byId('fcCoinCount').textContent = state.stats.coins;
    byId('studyProgress').textContent = `${Math.min(state.currentCardIdx + 1, state.studyQueue.length)} / ${state.studyQueue.length}`;
    byId('studyModeLabel').textContent = state.currentGame === 'srs' ? uiText('Ôn tập thông minh', 'Smart review', 'Smart review') : 'Flashcard';
    byId('fcStatusBadge').textContent = getWordStatusLabel(card);
    byId('fcMemoryBadge').textContent = `${uiText('Mức nhớ', 'Memory stage', 'Memory stage')}: ${getLocalizedMemoryStage(getMemoryStage(card), 'shortLabel')} • ${getEntryTypeLabel(card)}`;
    byId('fcWord').textContent = card.word;
    byId('fcType').textContent = card.wordType || getEntryTypeLabel(card);
    byId('fcPhonetic').textContent = card.phonetic || '—';
    byId('fcMeaning').textContent = card.meaning;
    byId('fcExample').textContent = card.example || uiText('Không có ví dụ', 'No example yet', 'No example yet');
    byId('fcNotes').textContent = card.notes || '';
    byId('fcTypingInput').value = '';
    state.pendingFailureReason = '';
    byId('activeFlashcard').classList.remove('flipped');
  }

  async function handleFlashcardOutcome(quality) {
    const card = state.studyQueue[state.currentCardIdx];
    if (!card) return;

    const coinGain = quality === 'good' ? 5 : quality === 'hard' ? 2 : 0;
    const failureReason = quality === 'again' ? (state.pendingFailureReason || 'recall') : '';
    await recordWordResult(card.id, quality, coinGain, true, { failureReason });

    if (quality === 'again') {
      renderStudySupportForWord(card, failureReason || 'recall', { autoQueue: true, trigger: 'again' });
      requeueCurrentCard(2);
      showToast(`Đã đánh dấu cần ôn lại: ${card.word}`);
    } else {
      if (quality === 'hard') {
        renderStudySupportForWord(card, 'recall', { autoQueue: false, trigger: 'hard' });
      }
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
      state.pendingFailureReason = '';
      byId('activeFlashcard').classList.add('flipped');
      showToast('Khớp nghĩa. Bấm “Nhớ rồi” để ghi nhận tiến độ.');
    } else {
      state.pendingFailureReason = 'meaning';
      renderStudySupportForWord(card, 'meaning', { autoQueue: false, trigger: 'meaning-check' });
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
          await recordWordResult(card.id, 'good', 10, true, { failureReason: '' });
          state.currentCardIdx += 1;
          setTimeout(renderQuiz, 650);
        } else {
          const failureReason = state.activeQuizMode === 'context' ? 'confusion' : state.activeQuizMode === 'meaning-word' ? 'recall' : 'meaning';
          button.classList.add('wrong');
          correctButton?.classList.add('correct');
          renderStudySupportForWord(card, failureReason, { autoQueue: true, trigger: 'quiz-wrong' });
          await recordWordResult(card.id, 'again', 0, true, { failureReason });
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
      byId('typingPromptHint').textContent = uiText('Phiên âm', 'Phonetic cue', 'Phonetic cue');
      byId('typingQuestionText').textContent = card.phonetic;
      byId('typingSpeakBtn').classList.remove('hidden');
      byId('typingSpeakBtn').onclick = () => playWordAudio(card.word);
    } else if (promptType === 1 && card.word.length > 3) {
      byId('typingPromptHint').textContent = uiText(`Nghĩa: ${card.meaning}`, `Meaning: ${card.meaning}`, `Meaning: ${card.meaning}`);
      byId('typingQuestionText').textContent = maskWord(card.word);
    } else {
      byId('typingPromptHint').textContent = uiText('Nghĩa của từ', 'Meaning cue', 'Meaning cue');
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
      await recordWordResult(card.id, 'good', 10, true, { failureReason: '' });
      showToast('Chính xác!');
      state.currentCardIdx += 1;
      setTimeout(renderTyping, 500);
    } else if (verdict === 'hard') {
      renderStudySupportForWord(card, 'spelling', { autoQueue: false, trigger: 'typing-hard' });
      await recordWordResult(card.id, 'hard', 5, true, { failureReason: 'spelling' });
      showToast(`Gần đúng. Đáp án chuẩn là “${card.word}”.`);
      state.currentCardIdx += 1;
      setTimeout(renderTyping, 700);
    } else {
      renderStudySupportForWord(card, 'spelling', { autoQueue: true, trigger: 'typing-again' });
      await recordWordResult(card.id, 'again', 0, true, { failureReason: 'spelling' });
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
      await recordWordResult(card.id, 'good', 15, true, { failureReason: '' });
      showToast('Nghe viết đúng!');
      state.currentCardIdx += 1;
      setTimeout(renderDictation, 650);
    } else if (verdict === 'hard') {
      renderStudySupportForWord(card, 'listening', { autoQueue: false, trigger: 'dictation-hard' });
      await recordWordResult(card.id, 'hard', 6, true, { failureReason: 'listening' });
      showToast(`Bạn gõ rất gần đúng. Từ chuẩn là “${card.word}”.`);
      state.currentCardIdx += 1;
      setTimeout(renderDictation, 750);
    } else {
      renderStudySupportForWord(card, 'listening', { autoQueue: true, trigger: 'dictation-again' });
      await recordWordResult(card.id, 'again', 0, true, { failureReason: 'listening' });
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
          await Promise.all(state.matchingBatch.map(item => recordWordResult(item.id, 'good', 2, false, { failureReason: '' })));
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
            await Promise.all(state.matchingBatch.map(item => recordWordResult(item.id, 'again', 0, false, { failureReason: 'confusion' })));
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

  async function recordWordResult(wordId, quality, coinGain = 0, persistImmediately = true, detail = {}) {
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
    word.review.lastSeenGame = detail.gameType || state.currentGame || '';

    if (quality === 'again') {
      word.review.streak = 0;
      word.review.wrongCount += 1;
      word.review.lapseCount += 1;
      word.review.confidence = clampConfidence(Math.max(0, word.review.confidence - 1));
      word.review.dueAt = now + 10 * 60 * 1000;
      word.review.lastFailureAt = now;
      word.review.lastFailureReason = detail.failureReason || inferFailureReasonFromGame(detail.gameType || state.currentGame);
      recordFailureReason(word.review.lastFailureReason, word, detail.gameType || state.currentGame);
      word.isLearned = false;
    } else if (quality === 'hard') {
      word.review.correctCount += 1;
      word.review.hardCount += 1;
      word.review.streak = Math.max(1, word.review.streak);
      word.review.confidence = clampConfidence(Math.max(1, word.review.confidence));
      if (detail.failureReason) word.review.lastFailureReason = detail.failureReason;
      const confidenceIntervals = [0.25, 0.5, 1, 2, 4];
      const intervalDays = confidenceIntervals[word.review.confidence] || 0.5;
      word.review.dueAt = now + intervalDays * DAY_MS;
      word.isLearned = word.review.confidence >= 4;
    } else {
      word.review.correctCount += 1;
      word.review.streak += 1;
      word.review.confidence = clampConfidence(word.review.confidence + 1);
      word.review.lastFailureReason = '';
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
    hideStudySupport();

    if (state.sessionStats) {
      state.sessionStats.durationSeconds = Math.max(1, Math.round((Date.now() - state.sessionStats.startAt) / 1000));
      state.stats.totalSessions += 1;
      state.stats.studyLog = [
        {
          game: state.currentPlanTitle || state.sessionStats.planTitle || state.sessionStats.gameType,
          total: state.sessionStats.total,
          good: state.sessionStats.good,
          hard: state.sessionStats.hard,
          again: state.sessionStats.again,
          strengthened: state.sessionStats.strengthened,
          durationSeconds: state.sessionStats.durationSeconds,
          dateLabel: new Date().toLocaleString('vi-VN'),
          rescued: getAtRiskWords(state.studyQueue, 99).filter(word => calculateForgettingRisk(word) >= 65).length
        },
        ...(state.stats.studyLog || [])
      ].slice(0, 20);
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
      { label: 'Cần ôn lại', value: state.sessionStats.again, note: 'Sẽ được ưu tiên sớm hơn' },
      { label: 'Lỗi nổi bật', value: summarizeMistakeJournal()[0] ? getMistakeReasonLabel(summarizeMistakeJournal()[0].key) : 'Chưa có', note: 'Nhật ký lỗi đang ghi nhận kiểu sai nổi bật nhất' }
    ].forEach(item => {
      const card = document.createElement('div');
      card.className = 'summary-card';
      card.innerHTML = `<span class="summary-label">${item.label}</span><strong>${item.value}</strong><span class="summary-note">${item.note}</span>`;
      grid.appendChild(card);
    });
    const topMistake = summarizeMistakeJournal()[0];
    textNode.textContent = `${message} • Củng cố tăng cho ${state.sessionStats.strengthened} lượt • Thời gian ${state.sessionStats.durationSeconds}s • Lỗi nổi bật: ${topMistake ? getMistakeReasonLabel(topMistake.key) : 'chưa có'}. ${state.currentPlanReason || ''}`.trim();
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
