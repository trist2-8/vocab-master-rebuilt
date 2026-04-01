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
    fxDensity: 'compact',
    fxAccent: 'blue',
    fxRadius: 'rounded'
  };

  const LANGUAGE_MODE_OPTIONS = [
    { value: 'en_focus', viLabel: 'Ưu tiên English', enLabel: 'English Focus', balancedLabel: 'English Focus • Ưu tiên English' },
    { value: 'balanced', viLabel: 'Cân bằng song ngữ', enLabel: 'Balanced Bilingual', balancedLabel: 'Balanced bilingual • Cân bằng song ngữ' },
    { value: 'vi_focus', viLabel: 'Tiếng Việt thuần', enLabel: 'Vietnamese Only', balancedLabel: 'Vietnamese only • Tiếng Việt thuần' }
  ];


  const EFFECT_PRESETS = [
    {
      key: 'study_focus',
      viLabel: 'Tập trung học',
      enLabel: 'Study Focus',
      noteVi: 'Gọn, tĩnh, ít nhiễu để ôn lâu hơn.',
      noteEn: 'Compact and calm for long study sessions.',
      settings: { fxGlass: 'depth', fxMotion: 'off', fxScene: 'midnight', fxDensity: 'micro', fxAccent: 'blue', fxRadius: 'soft' }
    },
    {
      key: 'glass_studio',
      viLabel: 'Glass Studio',
      enLabel: 'Glass Studio',
      noteVi: 'Cân bằng giữa đẹp mắt và dễ quan sát.',
      noteEn: 'Balanced clarity with a premium glass shell.',
      settings: { fxGlass: 'crystal', fxMotion: 'calm', fxScene: 'nebula', fxDensity: 'compact', fxAccent: 'violet', fxRadius: 'rounded' }
    },
    {
      key: 'calm_aurora',
      viLabel: 'Aurora êm',
      enLabel: 'Calm Aurora',
      noteVi: 'Ánh xanh nhẹ, dịu mắt khi học ban đêm.',
      noteEn: 'Soft aurora glow for night study.',
      settings: { fxGlass: 'mist', fxMotion: 'calm', fxScene: 'aurora', fxDensity: 'compact', fxAccent: 'mint', fxRadius: 'rounded' }
    },
    {
      key: 'sunset_pop',
      viLabel: 'Sunset Pop',
      enLabel: 'Sunset Pop',
      noteVi: 'Nền ấm hơn, hợp khi muốn giao diện sống động.',
      noteEn: 'Warmer, livelier glass for a fresh look.',
      settings: { fxGlass: 'pearl', fxMotion: 'flow', fxScene: 'sunset', fxDensity: 'cozy', fxAccent: 'sunset', fxRadius: 'capsule' }
    }
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
    setDoctorReport: null,
    hintLadder: { wordId: '', reason: 'recall', level: 0 },
    settings: { ...DEFAULT_SETTINGS },
    reviewRenderToken: 0,
    reviewDeferredTimer: 0
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
    if (document.body.classList.contains('nav-condensed')) {
      document.body.classList.remove('nav-condensed');
    }
    if (window.scrollY > 16) closeLanguageModeMenu();
  }

  window.addEventListener('scroll', syncCompactNav, { passive: true });
  window.addEventListener('resize', closeLanguageModeMenu, { passive: true });

  function normalizeSettings(settings = {}) {
    const languageMode = LANGUAGE_MODE_OPTIONS.some(option => option.value === settings?.languageMode)
      ? settings.languageMode
      : DEFAULT_SETTINGS.languageMode;
    const fxGlass = ['crystal', 'mist', 'depth', 'pearl', 'obsidian'].includes(settings?.fxGlass) ? settings.fxGlass : DEFAULT_SETTINGS.fxGlass;
    const fxMotion = ['off', 'calm', 'flow', 'pulse'].includes(settings?.fxMotion) ? settings.fxMotion : DEFAULT_SETTINGS.fxMotion;
    const fxScene = ['nebula', 'aurora', 'midnight', 'sunset', 'forest', 'rose'].includes(settings?.fxScene) ? settings.fxScene : DEFAULT_SETTINGS.fxScene;
    const fxDensity = ['micro', 'compact', 'cozy'].includes(settings?.fxDensity) ? settings.fxDensity : DEFAULT_SETTINGS.fxDensity;
    const fxAccent = ['blue', 'violet', 'mint', 'sunset'].includes(settings?.fxAccent) ? settings.fxAccent : DEFAULT_SETTINGS.fxAccent;
    const fxRadius = ['soft', 'rounded', 'capsule'].includes(settings?.fxRadius) ? settings.fxRadius : DEFAULT_SETTINGS.fxRadius;
    return { languageMode, fxGlass, fxMotion, fxScene, fxDensity, fxAccent, fxRadius };
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

  function getRequestedViewId() {
    const requested = new URLSearchParams(window.location.search).get('view');
    const map = {
      add: 'main-view',
      main: 'main-view',
      input: 'main-view',
      library: 'management-view',
      manage: 'management-view',
      management: 'management-view',
      review: 'review-dashboard-view',
      study: 'review-dashboard-view'
    };
    return map[(requested || '').toLowerCase()] || '';
  }

  function getPreferredInitialView() {
    const requestedView = getRequestedViewId();
    const hasVocab = state.vocab.length > 0;
    if (requestedView === 'review-dashboard-view' && !hasVocab) return 'main-view';
    if (requestedView) return requestedView;
    return 'main-view';
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
      en_focus: uiText('Ưu tiên English', 'English Focus', 'English Focus • Ưu tiên English'),
      balanced: uiText('Cân bằng song ngữ', 'Balanced Bilingual', 'Balanced bilingual • Cân bằng song ngữ'),
      vi_focus: uiText('Tiếng Việt thuần', 'Vietnamese Only', 'Vietnamese only • Tiếng Việt thuần')
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


  function syncReviewDeepDiveState() {
    const details = byId('reviewDeepDiveDetails');
    const toggleBtn = byId('reviewOpenDeepDiveBtn');
    if (!details) return;
    if (toggleBtn) {
      toggleBtn.textContent = details.open
        ? uiText('Ẩn bảng đầy đủ', 'Hide full dashboard', 'Hide full dashboard')
        : uiText('Mở toàn bộ mode', 'Open all modes', 'Open all modes');
    }
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
    document.body.dataset.fxAccent = settings.fxAccent || DEFAULT_SETTINGS.fxAccent;
    document.body.dataset.fxRadius = settings.fxRadius || DEFAULT_SETTINGS.fxRadius;
  }

  function getFxLabel(type, value) {
    const labels = {
      glass: {
        crystal: uiText('Pha lê trong', 'Crystal Clear', 'Crystal Clear'),
        mist: uiText('Sương mờ', 'Mist Glow', 'Mist Glow'),
        depth: uiText('Chiều sâu kính', 'Depth Glass', 'Depth Glass'),
        pearl: uiText('Ngọc trai', 'Pearl Layer', 'Pearl Layer'),
        obsidian: uiText('Obsidian', 'Obsidian Glass', 'Obsidian Glass')
      },
      motion: {
        off: uiText('Tĩnh', 'Still', 'Still'),
        calm: uiText('Êm', 'Calm', 'Calm'),
        flow: uiText('Dòng chảy', 'Flow', 'Flow'),
        pulse: uiText('Nhịp sáng', 'Pulse', 'Pulse')
      },
      scene: {
        nebula: uiText('Nebula', 'Nebula', 'Nebula'),
        aurora: uiText('Aurora', 'Aurora', 'Aurora'),
        midnight: uiText('Midnight', 'Midnight', 'Midnight'),
        sunset: uiText('Sunset', 'Sunset', 'Sunset'),
        forest: uiText('Forest', 'Forest', 'Forest'),
        rose: uiText('Rose', 'Rose', 'Rose')
      },
      density: {
        micro: uiText('Siêu gọn', 'Micro', 'Micro'),
        compact: uiText('Gọn', 'Compact', 'Compact'),
        cozy: uiText('Thoáng', 'Cozy', 'Cozy')
      },
      accent: {
        blue: uiText('Xanh dương', 'Blue', 'Blue'),
        violet: uiText('Tím', 'Violet', 'Violet'),
        mint: uiText('Mint', 'Mint', 'Mint'),
        sunset: uiText('Hoàng hôn', 'Sunset', 'Sunset')
      },
      radius: {
        soft: uiText('Mềm', 'Soft', 'Soft'),
        rounded: uiText('Bo tròn', 'Rounded', 'Rounded'),
        capsule: uiText('Viên nang', 'Capsule', 'Capsule')
      }
    };
    return labels[type]?.[value] || value;
  }

  function getEffectPresetLabel(preset) {
    return uiText(preset.viLabel, preset.enLabel, preset.enLabel);
  }

  function getEffectPresetNote(preset) {
    return uiText(preset.noteVi, preset.noteEn, preset.noteEn);
  }

  function applyEffectPreset(key) {
    const preset = EFFECT_PRESETS.find(item => item.key === key);
    if (!preset) return false;
    state.settings = normalizeSettings({ ...state.settings, ...preset.settings });
    return true;
  }

  function getActiveEffectPresetKey() {
    const active = EFFECT_PRESETS.find(preset => Object.entries(preset.settings).every(([key, value]) => state.settings?.[key] === value));
    return active?.key || '';
  }

  function buildEffectsLabSummary() {
    return uiText(
      `Preset: ${getEffectPresetLabel(EFFECT_PRESETS.find(preset => preset.key === getActiveEffectPresetKey()) || EFFECT_PRESETS[1])} • Glass: ${getFxLabel('glass', state.settings.fxGlass)} • Accent: ${getFxLabel('accent', state.settings.fxAccent)} • Mật độ: ${getFxLabel('density', state.settings.fxDensity)}`,
      `Preset: ${getEffectPresetLabel(EFFECT_PRESETS.find(preset => preset.key === getActiveEffectPresetKey()) || EFFECT_PRESETS[1])} • Glass: ${getFxLabel('glass', state.settings.fxGlass)} • Accent: ${getFxLabel('accent', state.settings.fxAccent)} • Density: ${getFxLabel('density', state.settings.fxDensity)}`,
      `Preset: ${getEffectPresetLabel(EFFECT_PRESETS.find(preset => preset.key === getActiveEffectPresetKey()) || EFFECT_PRESETS[1])} • Glass: ${getFxLabel('glass', state.settings.fxGlass)} • Accent: ${getFxLabel('accent', state.settings.fxAccent)} • Density: ${getFxLabel('density', state.settings.fxDensity)}`
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
    setTextValue('#effectsLabPanel .effects-lab-kicker', uiText('Studio giao diện', 'Appearance studio', 'Appearance studio'));

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
    setTextValue('.review-focus-kicker', uiText('Bước tiếp theo', 'Next step', 'Next step'));
    setTextValue('#reviewStartPrimaryBtn', uiText('▶ Học bước này', '▶ Start this step', '▶ Start this step'));
    setTextValue('#reviewDeepDiveTitle', uiText('Toàn bộ chế độ & insight', 'All modes and insights', 'All modes and insights'));
    setTextValue('#reviewDeepDiveLead', uiText('Mở dashboard đầy đủ khi bạn muốn xem tất cả mode, cluster mission và insight chi tiết.', 'Open the full dashboard when you want every mode, cluster mission, and deeper insight.', 'Open the full dashboard when you want every mode, cluster mission, and deeper insight.'));
    setTextValue('#review-dashboard-view .filter-box-wide label', uiText('Gợi ý hôm nay', "Today's guidance", "Today's guidance"));
    setTextValue('.recommended-study-label', uiText('Bắt đầu theo lộ trình gợi ý', 'Start with the suggested path', 'Start with the suggested path'));
    setTextValue('#startRecommendedBtn', uiText('▶ Học theo gợi ý', '▶ Start suggested path', '▶ Start suggested path'));
    setTextValue('#startDueFocusBtn', uiText('Ôn từ đến hạn', 'Review due words', 'Review due words'));
    setTextValue('#startWeakFocusBtn', uiText('Ôn từ yếu', 'Drill weak words', 'Drill weak words'));
    setTextValue('#startNewFocusBtn', uiText('Làm quen từ mới', 'Warm up new words', 'Warm up new words'));
    setTextValue('#reviewDueHeroCard .priority-label', uiText('Đến hạn', 'Due now', 'Due now'));
    setTextValue('#reviewWeakHeroCard .priority-label', uiText('Cần củng cố', 'Needs work', 'Needs work'));
    setTextValue('#reviewNewHeroCard .priority-label', uiText('Từ mới', 'New', 'New'));
    setTextValue('#reviewDueHeroCard .priority-note', uiText('Cứu trước', 'Rescue first', 'Rescue first'));
    setTextValue('#reviewWeakHeroCard .priority-note', uiText('Luyện chủ động', 'Active repair', 'Active repair'));
    setTextValue('#reviewNewHeroCard .priority-note', uiText('Làm quen nhẹ', 'Warm up gently', 'Warm up gently'));
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
    syncReviewDeepDiveState();

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
    if (byId('effectsLabLead')) setTextValue('#effectsLabLead', uiText('Thêm hiệu ứng mới nhưng vẫn giữ việc học là trung tâm: dùng preset nhanh trước, mở phần nâng cao khi thật sự cần.', 'Add richer effects without bloating the UI: start with quick presets, then open advanced controls only when needed.', 'Add richer effects without bloating the UI: start with quick presets, then open advanced controls only when needed.'));
    if (byId('effectsPresetLabel')) setTextValue('#effectsPresetLabel', uiText('Preset nhanh', 'Quick presets', 'Quick presets'));
    if (byId('effectsPresetHint')) setTextValue('#effectsPresetHint', uiText('Chọn một preset trước để giao diện đổi ngay mà không phải chỉnh quá nhiều.', 'Apply one preset first so the interface changes instantly without too many controls.', 'Apply one preset first so the interface changes instantly without too many controls.'));
    if (byId('effectsResetBtn')) setTextValue('#effectsResetBtn', uiText('Khôi phục mặc định', 'Reset defaults', 'Reset defaults'));
    if (byId('fxGlassLabel')) setTextValue('#fxGlassLabel', uiText('Chất kính', 'Glass style', 'Glass style'));
    if (byId('fxAccentLabel')) setTextValue('#fxAccentLabel', uiText('Tông nhấn', 'Accent', 'Accent'));
    if (byId('fxDensityLabel')) setTextValue('#fxDensityLabel', uiText('Độ gọn UI', 'UI density', 'UI density'));
    if (byId('fxMotionLabel')) setTextValue('#fxMotionLabel', uiText('Nhịp chuyển động', 'Motion', 'Motion'));
    if (byId('fxRadiusLabel')) setTextValue('#fxRadiusLabel', uiText('Độ bo góc', 'Corner radius', 'Corner radius'));
    if (byId('effectsAdvancedSummary')) setTextValue('#effectsAdvancedSummary', uiText('Mở thêm tuỳ chỉnh', 'More controls', 'More controls'));
    if (byId('effectsLabPreviewNote')) setTextValue('#effectsLabPreviewNote', buildEffectsLabSummary());
    document.querySelectorAll('[data-fx-scene-card]').forEach(node => {
      const value = node.dataset.fxSceneCard;
      const title = node.querySelector('.fx-scene-name');
      const note = node.querySelector('.fx-scene-note');
      if (title) title.textContent = getFxLabel('scene', value);
      if (note) {
        note.textContent = ({
          nebula: uiText('Nền tím sâu, hợp với học hằng ngày.', 'Deep purple ambient scene for daily study.', 'Deep purple ambient scene for daily study.'),
          aurora: uiText('Ánh xanh dịu và hiện đại hơn.', 'Cool aurora glow for a fresher interface.', 'Cool aurora glow for a fresher interface.'),
          midnight: uiText('Tối hơn, ít nhiễu hơn.', 'Darker and tighter for low-distraction sessions.', 'Darker and tighter for low-distraction sessions.'),
          sunset: uiText('Ấm hơn và nổi bật hơn.', 'Warmer sunset tones for a lively workspace.', 'Warmer sunset tones for a lively workspace.'),
          forest: uiText('Xanh dịu, thư giãn mắt.', 'Muted green scene for calmer studying.', 'Muted green scene for calmer studying.'),
          rose: uiText('Hồng tím nhẹ, mềm hơn.', 'Rose-violet scene with a softer feel.', 'Rose-violet scene with a softer feel.')
        })[value] || '';
      }
    });
    document.querySelectorAll('[data-fx-preset-button]').forEach(node => {
      const title = node.querySelector('.effects-preset-name');
      const note = node.querySelector('.effects-preset-note');
      const preset = EFFECT_PRESETS.find(item => item.key === node.dataset.fxPresetButton);
      if (preset) {
        if (title) title.textContent = getEffectPresetLabel(preset);
        if (note) note.textContent = getEffectPresetNote(preset);
      }
    });

    if (byId('clusterMissionTitle')) setTextValue('#clusterMissionTitle', uiText('Memory Constellation', 'Memory Constellation', 'Memory Constellation'));
    if (byId('clusterMissionLead')) setTextValue('#clusterMissionLead', uiText('Thay vì ôn từng từ rời rạc, hệ thống gom chúng thành cụm để bạn cứu cả một vùng nhớ trong một lượt.', 'Instead of drilling isolated entries, cluster missions let you rescue a whole memory zone in one session.', 'Instead of drilling isolated entries, cluster missions let you rescue a whole memory zone in one session.'));
  }

  async function init() {
    ensureSetDoctorPanel();
    ensureMemoryCoachDock();
    bindStaticEvents();
    setupModals();
    ensureAdvancedReviewPanels();
    await loadState();
    showView(getPreferredInitialView());
    renderAll();
  }

  function bindStaticEvents() {
    byId('navMainBtn').addEventListener('click', () => {
      showView('main-view');
    });
    byId('navManagementBtn').addEventListener('click', () => {
      showView('management-view');
    });
    byId('navReviewBtn').addEventListener('click', () => {
      showView('review-dashboard-view');
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
      const presetBtn = event.target.closest('[data-fx-preset]');
      if (presetBtn) {
        if (applyEffectPreset(presetBtn.dataset.fxPreset)) {
          applyEffectSettings();
          renderEffectsLabPanel();
          await persistState();
        }
        return;
      }
      if (event.target.closest('#effectsResetBtn')) {
        state.settings = normalizeSettings({ ...state.settings, ...DEFAULT_SETTINGS });
        applyEffectSettings();
        renderEffectsLabPanel();
        await persistState();
        return;
      }
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
      renderSetDoctor();
    });
    byId('refreshSuggestionsBtn')?.addEventListener('click', refreshSmartSuggestions);
    byId('smartSuggestionGrid')?.addEventListener('click', handleSuggestionAction);
    byId('setDoctorPanel')?.addEventListener('click', handleSetDoctorAction);
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
    byId('reviewStartPrimaryBtn')?.addEventListener('click', startRecommendedStudy);
    byId('reviewOpenDeepDiveBtn')?.addEventListener('click', () => {
      const details = byId('reviewDeepDiveDetails');
      if (!details) return;
      details.open = !details.open;
      syncReviewDeepDiveState();
    });
    byId('reviewDeepDiveDetails')?.addEventListener('toggle', syncReviewDeepDiveState);
    document.querySelectorAll('[data-focus-target]').forEach(button => {
      button.addEventListener('click', () => startTargetedFocus(button.dataset.focusTarget));
    });
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
    byId('fcHintBtn')?.addEventListener('click', () => advanceHintLadderForCurrent('recall'));
    byId('fcHintInlineBtn')?.addEventListener('click', () => advanceHintLadderForCurrent('meaning'));
    byId('fcTypingInput').addEventListener('keypress', (event) => {
      if (event.key === 'Enter') handleFlashcardMeaningCheck();
    });

    byId('typingHintBtn')?.addEventListener('click', () => advanceHintLadderForCurrent('spelling'));
    byId('typingSubmitBtn').addEventListener('click', handleTypingSubmit);
    byId('typingInput').addEventListener('keypress', (event) => {
      if (event.key === 'Enter') handleTypingSubmit();
    });
    byId('dictationHintBtn')?.addEventListener('click', () => advanceHintLadderForCurrent('listening'));
    byId('dictationSubmitBtn').addEventListener('click', handleDictationSubmit);
    byId('dictationInput').addEventListener('keypress', (event) => {
      if (event.key === 'Enter') handleDictationSubmit();
    });
    byId('playAudioBtn').addEventListener('click', () => {
      const card = state.studyQueue[state.currentCardIdx];
      if (card) playWordAudio(card.word);
    });
    byId('quizHintBtn')?.addEventListener('click', () => advanceHintLadderForCurrent(state.activeQuizMode === 'context' ? 'confusion' : state.activeQuizMode === 'meaning-word' ? 'recall' : 'meaning'));
    byId('studySupportCloseBtn')?.addEventListener('click', hideStudySupport);
    byId('memoryHintAdvanceBtn')?.addEventListener('click', handleMemoryCoachAdvance);
    byId('memoryHintRescueBtn')?.addEventListener('click', () => openStudySupportForCurrent(state.hintLadder?.reason || inferFailureReasonFromGame(state.currentGame), { autoQueue: false, manual: true }));
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

    const reviewViews = ['review-dashboard-view', 'study-mode-view', 'quiz-mode-view', 'matching-mode-view', 'typing-mode-view', 'dictation-mode-view'];
    const studyViews = ['study-mode-view', 'quiz-mode-view', 'typing-mode-view', 'dictation-mode-view', 'matching-mode-view'];

    document.body.dataset.currentView = viewIdToShow;
    document.body.classList.toggle('is-review-view', reviewViews.includes(viewIdToShow));
    document.body.classList.toggle('is-study-view', studyViews.includes(viewIdToShow));

    if (viewIdToShow === 'main-view') byId('navMainBtn').classList.add('active');
    if (viewIdToShow === 'management-view' || viewIdToShow === 'set-details-view') byId('navManagementBtn').classList.add('active');
    if (reviewViews.includes(viewIdToShow)) {
      byId('navReviewBtn').classList.add('active');
    }
    if (!studyViews.includes(viewIdToShow)) {
      hideStudySupport();
      hideMemoryCoach();
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
    const snapshot = {
      savedAt: new Date().toISOString(),
      source: 'auto-save',
      vocab: state.vocab,
      stats: state.stats,
      settings: state.settings
    };
    await storage.set({
      vocab: state.vocab,
      stats: state.stats,
      vm_settings: state.settings,
      recoveryVault: snapshot
    });
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
    const stageCounts = MEMORY_STAGES.map(stage => ({ ...stage, count: 0 }));
    let due = 0;
    let fresh = 0;
    let weak = 0;
    let mastered = 0;
    let progressUnits = 0;

    words.forEach(word => {
      if (isDueWord(word)) due += 1;
      if (isNewWord(word)) fresh += 1;
      if (isWeakWord(word)) weak += 1;
      if (isMasteredWord(word)) mastered += 1;
      const confidence = getConfidenceValue(word);
      const seenCount = Number(word?.review?.seenCount || 0);
      const hintPenalty = Number(word?.review?.hintPenalty || 0);
      const streakBoost = seenCount > 0 ? Math.min(0.35, Number(word?.review?.streak || 0) * 0.08) : 0;
      const hintDrag = hintPenalty > 0 ? Math.min(0.18, hintPenalty * 0.05) : 0;
      const progressScore = Math.max(0, Math.min(1, (confidence / 4) + streakBoost - hintDrag));
      progressUnits += progressScore;
      if (stageCounts[confidence]) stageCounts[confidence].count += 1;
    });

    const masteryProgress = words.length ? Math.round((mastered / words.length) * 100) : 0;
    return {
      total: words.length,
      due,
      fresh,
      weak,
      mastered,
      stageCounts,
      masteryProgress,
      progress: words.length ? Math.round((progressUnits / words.length) * 100) : 0
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
      <details class="effects-lab-shell" id="effectsLabShell">
        <summary class="effects-lab-summary">
          <div class="effects-lab-head">
            <div>
              <div class="effects-lab-kicker">${escapeHtml(uiText('Studio giao diện', 'Appearance studio', 'Appearance studio'))}</div>
              <h2 id="effectsLabTitle">Effects Lab</h2>
              <p id="effectsLabLead" class="muted-text"></p>
            </div>
            <div class="effects-lab-summary-meta">
              <div class="effects-lab-badge">${escapeHtml(uiText('Studio', 'Studio', 'Studio'))}</div>
              <span class="effects-lab-chevron" aria-hidden="true"></span>
            </div>
          </div>
        </summary>
        <div class="effects-lab-body">
          <div class="effects-preset-row">
            <div>
              <div id="effectsPresetLabel" class="effects-section-title">Quick presets</div>
              <p id="effectsPresetHint" class="muted-text effects-section-note"></p>
            </div>
            <button type="button" id="effectsResetBtn" class="secondary-btn effects-reset-btn">Reset defaults</button>
          </div>
          <div id="effectsPresetStrip" class="effects-preset-strip"></div>
          <div class="effects-lab-grid effects-lab-grid-main">
            <label class="effects-field">
              <span id="fxGlassLabel">Glass style</span>
              <select id="fxGlassSelect" class="modern-input" data-fx-setting="fxGlass"></select>
            </label>
            <label class="effects-field">
              <span id="fxAccentLabel">Accent</span>
              <select id="fxAccentSelect" class="modern-input" data-fx-setting="fxAccent"></select>
            </label>
            <label class="effects-field">
              <span id="fxDensityLabel">UI density</span>
              <select id="fxDensitySelect" class="modern-input" data-fx-setting="fxDensity"></select>
            </label>
          </div>
          <div id="fxSceneGrid" class="fx-scene-grid fx-scene-grid-compact"></div>
          <details class="effects-advanced" id="effectsAdvancedPanel">
            <summary id="effectsAdvancedSummary">More controls</summary>
            <div class="effects-lab-grid effects-lab-grid-advanced">
              <label class="effects-field">
                <span id="fxMotionLabel">Motion</span>
                <select id="fxMotionSelect" class="modern-input" data-fx-setting="fxMotion"></select>
              </label>
              <label class="effects-field">
                <span id="fxRadiusLabel">Corner radius</span>
                <select id="fxRadiusSelect" class="modern-input" data-fx-setting="fxRadius"></select>
              </label>
            </div>
          </details>
          <div id="effectsLabPreviewNote" class="effects-lab-preview muted-text"></div>
        </div>
      </details>
    `;
    const anchor = byId('upgradeHub') || byId('wordsetGrid') || byId('managementSummary');
    if (anchor?.parentNode) anchor.insertAdjacentElement('afterend', panel);
    else managementView.appendChild(panel);
  }

  function renderEffectsLabPanel() {
    ensureEffectsLabPanel();

    const presetsNode = byId('effectsPresetStrip');
    const activePresetKey = getActiveEffectPresetKey();
    if (presetsNode) {
      presetsNode.innerHTML = EFFECT_PRESETS.map(preset => `
        <button type="button" class="effects-preset-btn ${activePresetKey === preset.key ? 'active' : ''}" data-fx-preset="${preset.key}" data-fx-preset-button="${preset.key}">
          <span class="effects-preset-name">${escapeHtml(getEffectPresetLabel(preset))}</span>
          <span class="effects-preset-note">${escapeHtml(getEffectPresetNote(preset))}</span>
        </button>`).join('');
    }

    const selectConfigs = [
      ['fxGlassSelect', 'glass', ['crystal', 'mist', 'depth', 'pearl', 'obsidian']],
      ['fxAccentSelect', 'accent', ['blue', 'violet', 'mint', 'sunset']],
      ['fxDensitySelect', 'density', ['micro', 'compact', 'cozy']],
      ['fxMotionSelect', 'motion', ['off', 'calm', 'flow', 'pulse']],
      ['fxRadiusSelect', 'radius', ['soft', 'rounded', 'capsule']]
    ];

    selectConfigs.forEach(([id, type, values]) => {
      const node = byId(id);
      if (!node) return;
      const current = state.settings[node.dataset.fxSetting] || DEFAULT_SETTINGS[node.dataset.fxSetting];
      node.innerHTML = values.map(value => `<option value="${value}">${escapeHtml(getFxLabel(type, value))}</option>`).join('');
      node.value = current;
    });

    const sceneGrid = byId('fxSceneGrid');
    if (sceneGrid) {
      sceneGrid.innerHTML = ['nebula', 'aurora', 'midnight', 'sunset', 'forest', 'rose'].map(value => `
        <button type="button" class="fx-scene-card ${value === (state.settings.fxScene || DEFAULT_SETTINGS.fxScene) ? 'active' : ''}" data-fx-scene="${value}" data-fx-scene-card="${value}">
          <strong class="fx-scene-name">${escapeHtml(getFxLabel('scene', value))}</strong>
          <span class="fx-scene-note"></span>
        </button>`).join('');
    }

    if (byId('effectsLabPreviewNote')) byId('effectsLabPreviewNote').textContent = buildEffectsLabSummary();
    applyLanguageModeUI();
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
    ensureSetDoctorPanel();
    renderSmartSuggestions({ resetCycle: true });
    renderSetIntelligence();
    renderSetDoctor();
  }

  function initManagementView() {
    renderManagementSummary();
    renderWordsetsGrid();
    renderEffectsLabPanel();
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


  function cancelPendingReviewRender() {
    state.reviewRenderToken = (state.reviewRenderToken || 0) + 1;
    if (state.reviewDeferredTimer) {
      window.clearTimeout(state.reviewDeferredTimer);
      state.reviewDeferredTimer = 0;
    }
  }

  function scheduleReviewHeavyRender(task) {
    cancelPendingReviewRender();
    const token = state.reviewRenderToken;
    const run = () => {
      if (token !== state.reviewRenderToken) return;
      task();
    };
    const kickoff = () => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(run, { timeout: 180 });
      } else {
        state.reviewDeferredTimer = window.setTimeout(run, 24);
      }
    };
    if ('requestAnimationFrame' in window) {
      window.requestAnimationFrame(kickoff);
    } else {
      kickoff();
    }
  }

  function renderReviewDashboardShell(words, stats) {
    const setName = byId('reviewSetDropdown').value || 'all';
    const reviewSetLabel = setName === 'all'
      ? uiText('Tất cả bộ từ', 'All sets', 'All sets')
      : `${uiText('Bộ', 'Set', 'Set')}: ${setName}`;

    byId('reviewDueCount').textContent = stats.due;
    byId('reviewNewCount').textContent = stats.fresh;
    byId('reviewWeakCount').textContent = stats.weak;
    byId('reviewMasteredCount').textContent = stats.mastered;

    if (byId('reviewFocusSetChip')) byId('reviewFocusSetChip').textContent = reviewSetLabel;
    if (byId('reviewFocusSnapshotChip')) {
      byId('reviewFocusSnapshotChip').textContent = words.length
        ? uiText(`${stats.due} đến hạn • ${stats.weak} yếu • ${stats.fresh} mới`, `${stats.due} due • ${stats.weak} weak • ${stats.fresh} new`, `${stats.due} due • ${stats.weak} weak • ${stats.fresh} new`)
        : uiText('Chưa có dữ liệu ôn', 'No review data yet', 'No review data yet');
    }
    if (byId('reviewHeroDueCount')) byId('reviewHeroDueCount').textContent = stats.due;
    if (byId('reviewHeroWeakCount')) byId('reviewHeroWeakCount').textContent = stats.weak;
    if (byId('reviewHeroNewCount')) byId('reviewHeroNewCount').textContent = stats.fresh;
    if (byId('reviewDueHeroCard')) byId('reviewDueHeroCard').disabled = !stats.due;
    if (byId('reviewWeakHeroCard')) byId('reviewWeakHeroCard').disabled = !stats.weak;
    if (byId('reviewNewHeroCard')) byId('reviewNewHeroCard').disabled = !stats.fresh;

    const recommendation = byId('reviewRecommendation');
    const dashboardSubtext = byId('dashboardSubtext');
    const focusTitle = byId('reviewFocusTitle');
    const focusReason = byId('reviewFocusReason');
    if (!words.length) {
      recommendation.textContent = uiText('Bộ từ đang trống. Hãy thêm từ trước khi bắt đầu ôn tập.', 'This set is empty. Add some entries before starting review.', 'This set is empty. Add some entries before starting review.');
      dashboardSubtext.textContent = uiText('Khi có dữ liệu, mọi chế độ sẽ cùng cập nhật tiến độ học.', 'Once data is available, every mode will update the same learning progress.', 'Once data is available, every mode will update the same learning progress.');
      if (focusTitle) focusTitle.textContent = uiText('Chưa có dữ liệu để ôn', 'No data to review yet', 'No data to review yet');
      if (focusReason) focusReason.textContent = uiText('Hãy thêm vài từ trước khi bắt đầu một lộ trình học mới.', 'Add a few words before starting a new learning path.', 'Add a few words before starting a new learning path.');
      if (byId('reviewStartPrimaryBtn')) byId('reviewStartPrimaryBtn').disabled = true;
      if (byId('spotlightLaunchBtn')) byId('spotlightLaunchBtn').disabled = true;
    } else if (stats.due > 0) {
      recommendation.textContent = uiText(`Bạn có ${stats.due} mục đến hạn. Ưu tiên cứu các mục này trước.`, `You have ${stats.due} due item(s). Rescue them first.`, `You have ${stats.due} due item(s). Rescue them first.`);
      dashboardSubtext.textContent = uiText('Đang chuẩn bị dashboard chi tiết cho lượt ôn này…', 'Preparing the detailed dashboard for this review…', 'Preparing the detailed dashboard for this review…');
      if (focusTitle) focusTitle.textContent = uiText('Memory Rescue', 'Memory Rescue', 'Memory Rescue');
      if (focusReason) focusReason.textContent = uiText('Mở nhanh phần đến hạn trước, rồi các bảng chi tiết sẽ tải tiếp ở nền.', 'Jump into due items first; the deeper panels will finish loading in the background.', 'Jump into due items first; the deeper panels will finish loading in the background.');
      if (byId('reviewStartPrimaryBtn')) byId('reviewStartPrimaryBtn').disabled = false;
      if (byId('spotlightLaunchBtn')) byId('spotlightLaunchBtn').disabled = false;
    } else if (stats.weak > 0) {
      recommendation.textContent = uiText(`Có ${stats.weak} mục đang cần củng cố.`, `There are ${stats.weak} item(s) needing reinforcement.`, `There are ${stats.weak} item(s) needing reinforcement.`);
      dashboardSubtext.textContent = uiText('Đang chuẩn bị phân tích điểm yếu và gợi ý ôn tập…', 'Preparing weak-signal analysis and review guidance…', 'Preparing weak-signal analysis and review guidance…');
      if (focusTitle) focusTitle.textContent = uiText('Củng cố điểm yếu', 'Reinforce weak items', 'Reinforce weak items');
      if (focusReason) focusReason.textContent = uiText('Vào nhanh phần yếu trước để tránh cảm giác chờ lâu.', 'Open the weak lane first to avoid waiting on the full dashboard.', 'Open the weak lane first to avoid waiting on the full dashboard.');
      if (byId('reviewStartPrimaryBtn')) byId('reviewStartPrimaryBtn').disabled = false;
      if (byId('spotlightLaunchBtn')) byId('spotlightLaunchBtn').disabled = false;
    } else if (stats.fresh > 0) {
      recommendation.textContent = uiText(`Có ${stats.fresh} mục mới chưa ôn.`, `There are ${stats.fresh} fresh item(s).`, `There are ${stats.fresh} fresh item(s).`);
      dashboardSubtext.textContent = uiText('Đang chuẩn bị gợi ý làm quen nhanh…', 'Preparing a quick warm-up recommendation…', 'Preparing a quick warm-up recommendation…');
      if (focusTitle) focusTitle.textContent = uiText('Làm quen nhẹ', 'Light warm-up', 'Light warm-up');
      if (focusReason) focusReason.textContent = uiText('Bạn có thể bắt đầu ngay, còn phần insight sẽ tải tiếp ở nền.', 'You can start right away; the deeper insight panels will continue loading in the background.', 'You can start right away; the deeper insight panels will continue loading in the background.');
      if (byId('reviewStartPrimaryBtn')) byId('reviewStartPrimaryBtn').disabled = false;
      if (byId('spotlightLaunchBtn')) byId('spotlightLaunchBtn').disabled = false;
    } else {
      recommendation.textContent = uiText('Bộ từ đang khá ổn, đang chuẩn bị các gợi ý nâng cao.', 'The set is fairly stable; preparing advanced guidance.', 'The set is fairly stable; preparing advanced guidance.');
      dashboardSubtext.textContent = uiText('Các phần sâu hơn sẽ xuất hiện ngay khi sẵn sàng.', 'Deeper panels will appear as soon as they are ready.', 'Deeper panels will appear as soon as they are ready.');
      if (focusTitle) focusTitle.textContent = uiText('Tăng phản xạ', 'Build speed', 'Build speed');
      if (focusReason) focusReason.textContent = uiText('Mở chế độ nhanh trước, sau đó xem insight chi tiết.', 'Open a fast mode first, then check the deeper insights.', 'Open a fast mode first, then check the deeper insights.');
      if (byId('reviewStartPrimaryBtn')) byId('reviewStartPrimaryBtn').disabled = false;
      if (byId('spotlightLaunchBtn')) byId('spotlightLaunchBtn').disabled = false;
    }

    byId('modeBoardSummaryLine').textContent = words.length
      ? uiText(`${stats.total} mục • ${stats.mastered}/${stats.total} đã vững.`, `${stats.total} item(s) • ${stats.mastered}/${stats.total} strong.`, `${stats.total} item(s) • ${stats.mastered}/${stats.total} strong.`)
      : uiText('Thêm vài từ đầu tiên để Learning Lab bắt đầu gợi ý chính xác hơn.', 'Add the first few items so Learning Lab can guide you more accurately.', 'Add the first few items so Learning Lab can guide you more accurately.');
    byId('modeBoardTension').textContent = uiText('Đang làm mới phân tích risk…', 'Refreshing risk analysis…', 'Refreshing risk analysis…');
    byId('modeBoardCoverage').textContent = stats.weak
      ? uiText(`Điểm cần kéo lên: ${stats.weak} mục yếu`, `Need to lift: ${stats.weak} weak item(s)`, `Need to lift: ${stats.weak} weak item(s)`)
      : stats.fresh
        ? uiText(`Chưa phủ hết: ${stats.fresh} mục mới`, `Still uncovered: ${stats.fresh} fresh item(s)`, `Still uncovered: ${stats.fresh} fresh item(s)`)
        : uiText('Độ phủ đang khá ổn', 'Coverage is fairly stable', 'Coverage is fairly stable');
    byId('modeBoardGap').textContent = stats.due
      ? uiText(`${stats.due} mục cần cứu ngay`, `${stats.due} item(s) need rescue now`, `${stats.due} item(s) need rescue now`)
      : uiText('Đang chuẩn bị insight chi tiết…', 'Preparing deeper insights…', 'Preparing deeper insights…');

    const stageStrip = byId('memoryStageStrip');
    if (stageStrip) {
      stageStrip.innerHTML = '';
      stats.stageCounts.forEach(stage => {
        const chip = document.createElement('div');
        chip.className = 'memory-stage-chip';
        chip.innerHTML = `<span class="memory-stage-count">${stage.count}</span><div><strong>${stage.label}</strong><span>${stage.note}</span></div>`;
        stageStrip.appendChild(chip);
      });
    }
  }

  function renderReviewDashboard() {
    const setName = byId('reviewSetDropdown').value || 'all';
    const words = getWordsForSet(setName);
    const stats = getSetStats(words);

    renderReviewDashboardShell(words, stats);
    if (byId('reviewDeepDiveDetails') && !words.length) byId('reviewDeepDiveDetails').open = true;
    syncReviewDeepDiveState();

    scheduleReviewHeavyRender(() => {
      const smartQueueSize = getRecommendedQueue(words, 20).length;
      const recommendedPlan = getRecommendedStudyPlan(words, stats);
      const riskSummary = getAtRiskWords(words, 3);

      const recommendation = byId('reviewRecommendation');
      const dashboardSubtext = byId('dashboardSubtext');
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

      if (byId('reviewFocusTitle')) byId('reviewFocusTitle').textContent = recommendedPlan.title;
      if (byId('reviewFocusReason')) byId('reviewFocusReason').textContent = recommendedPlan.reason;
      if (byId('reviewStartPrimaryBtn')) byId('reviewStartPrimaryBtn').disabled = !recommendedPlan.gameType;
      byId('spotlightModeName').textContent = recommendedPlan.title;
      byId('spotlightModeReason').textContent = recommendedPlan.reason;
      byId('spotlightLaunchBtn').disabled = !recommendedPlan.gameType;

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

      document.querySelectorAll('.mode-lab-card').forEach(card => {
        card.classList.toggle('recommended-mode-card', card.dataset.game === recommendedPlan.gameType);
      });

      renderDailyFocus(words);
      renderClusterMissions(words);
      renderReviewInsights(words);
      renderAdvancedReviewPanels(words);
      renderIntegratedReviewSignals();

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
        contrast: uiText(`${Math.min(getContrastQueue(words, 10).length, 10)} cặp`, `${Math.min(getContrastQueue(words, 10).length, 10)} pairs`, `${Math.min(getContrastQueue(words, 10).length, 10)} pairs`),
        srs: uiText(`${smartQueueSize} từ ưu tiên`, `${smartQueueSize} priority words`, `${smartQueueSize} priority words`)
      };

      document.querySelectorAll('[data-badge]').forEach(node => {
        node.textContent = badgeText[node.dataset.badge] || '0';
      });
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
      const baseKey = getConceptFamilyKey(word);
      const scopedKey = baseKey.startsWith('tag:')
        ? `${baseKey}:${word.entryType || 'word'}`
        : baseKey;
      if (!families[scopedKey]) families[scopedKey] = {
        key: scopedKey,
        displayKey: baseKey,
        sample: word,
        words: [],
        risk: 0,
        due: 0,
        weak: 0,
        types: new Set()
      };
      const bucket = families[scopedKey];
      const risk = calculateForgettingRisk(word);
      bucket.words.push(word);
      bucket.types.add(word.entryType || 'word');
      bucket.risk += risk;
      if (isDueWord(word)) bucket.due += 1;
      if (isWeakWord(word)) bucket.weak += 1;
      if (risk > calculateForgettingRisk(bucket.sample)) bucket.sample = word;
    });

    return Object.values(families)
      .map(item => {
        const avgRisk = Math.round(item.risk / Math.max(1, item.words.length));
        const actionPool = item.words.filter(word => isDueWord(word) || isWeakWord(word) || calculateForgettingRisk(word) >= 62);
        const focusedPool = actionPool.length >= 3 ? actionPool : item.words;
        const queue = buildCoverageQueue(focusedPool, Math.min(8, focusedPool.length), item.due ? 'rescue' : 'drill');
        const previewWords = queue.length ? queue : focusedPool.slice(0, 6);
        const previewTokens = previewWords.slice(0, 4).map(word => word.word).filter(Boolean);
        const gameType = item.due >= 3 ? 'srs' : item.weak >= 2 ? 'typing' : (item.types.has('pattern') ? 'flashcard' : 'quiz');
        const actionable = queue.length;
        const qualifies = actionable >= 3 && (item.due >= 2 || item.weak >= 2 || avgRisk >= 60 || (item.displayKey || '').startsWith('conf:'));
        return qualifies ? {
          key: item.key,
          title: getConceptFamilyDisplay(item.displayKey, item.sample),
          sample: item.sample,
          avgRisk,
          queue,
          gameType,
          itemCount: actionable,
          sourceCount: item.words.length,
          due: item.due,
          weak: item.weak,
          previewTokens,
          reason: item.due >= 3
            ? uiText('Tập trung cứu các mục đến hạn trước để tránh rơi cả cụm.', 'Focus on the due items first so the whole cluster does not slip.', 'Focus on the due items first so the cluster does not slip.')
            : item.weak >= 2
              ? uiText('Cụm này đang yếu hoặc mới sai, hợp để drill ngắn theo nhóm.', 'This cluster is weak or recently missed, so a short grouped drill fits best.', 'This cluster is weak or recently missed, so a short grouped drill fits best.')
              : uiText('Đây là cụm dễ nhầm, nên ôn phân biệt thật gọn.', 'This is a confusion-prone cluster, so a short contrast drill is best.', 'This is a confusion-prone cluster, so a short contrast drill is best.')
        } : null;
      })
      .filter(Boolean)
      .sort((a, b) => (b.due + b.weak) - (a.due + a.weak) || b.avgRisk - a.avgRisk || b.itemCount - a.itemCount)
      .slice(0, 3);
  }

  function renderClusterMissions(words) {
    ensureClusterMissionPanel();
    const panel = byId('clusterMissionPanel');
    const grid = byId('clusterMissionGrid');
    if (!grid || !panel) return;
    const missions = buildClusterMissions(words);
    state.clusterMissions = missions;
    if (!missions.length) {
      panel.classList.add('hidden');
      grid.innerHTML = '';
      return;
    }
    panel.classList.remove('hidden');
    grid.innerHTML = missions.map(mission => `
      <article class="cluster-mission-card">
        <div class="cluster-mission-top">
          <span class="cluster-risk-pill">risk ${mission.avgRisk}%</span>
          <span class="cluster-count-pill">${mission.itemCount} ${escapeHtml(uiText('mục ưu tiên', 'priority items', 'priority items'))}</span>
          <span class="cluster-mode-pill">${escapeHtml(uiText(`Chế độ: ${mission.gameType}`, `Mode: ${mission.gameType}`, `Mode: ${mission.gameType}`))}</span>
        </div>
        <h3>${escapeHtml(mission.title)}</h3>
        <p class="cluster-mission-reason">${escapeHtml(mission.reason)}</p>
        <div class="cluster-mission-tags">
          ${mission.previewTokens.map(token => `<span class="cluster-token">${escapeHtml(token)}</span>`).join('')}
        </div>
        <div class="cluster-mission-meta">
          <span class="cluster-meta-pill">${escapeHtml(uiText(`Đến hạn ${mission.due}`, `Due ${mission.due}`, `Due ${mission.due}`))}</span>
          <span class="cluster-meta-pill">${escapeHtml(uiText(`Yếu ${mission.weak}`, `Weak ${mission.weak}`, `Weak ${mission.weak}`))}</span>
          <span class="cluster-meta-pill">${escapeHtml(uiText(`Nguồn ${mission.sourceCount}`, `Source ${mission.sourceCount}`, `Source ${mission.sourceCount}`))}</span>
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


  function ensureSetDoctorPanel() {
    const mainView = byId('main-view');
    if (!mainView || byId('setDoctorPanel')) return;
    const panel = document.createElement('section');
    panel.id = 'setDoctorPanel';
    panel.className = 'panel-card doctor-panel';
    const anchor = byId('setIntelligencePanel');
    if (anchor?.parentNode) anchor.insertAdjacentElement('afterend', panel);
    else mainView.appendChild(panel);
  }

  function collectNearOverlapPairs(words, limit = 3) {
    const pairs = [];
    const sample = words.slice(0, 80);
    for (let i = 0; i < sample.length; i += 1) {
      for (let j = i + 1; j < sample.length; j += 1) {
        const left = sample[i];
        const right = sample[j];
        const similarity = getWordSimilarityScore(left, right);
        const sameFamily = getConceptFamilyKey(left) === getConceptFamilyKey(right);
        if (similarity < 0.72 && !(sameFamily && isMeaningNear(left.meaning, right.meaning))) continue;
        pairs.push({
          left,
          right,
          similarity: Math.round(similarity * 100),
          reason: sameFamily
            ? uiText('Cùng vùng nhớ / cùng họ từ', 'Same memory family', 'Same memory family')
            : uiText('Nghĩa hoặc hình thức khá gần', 'Close in meaning or form', 'Close in meaning or form')
        });
        if (pairs.length >= limit) return pairs;
      }
    }
    return pairs;
  }

  function buildSetDoctorReport() {
    const setName = byId('wordsetDropdown')?.value || 'Chưa phân loại';
    const words = getWordsForSet(setName);
    if (!words.length) {
      return {
        setName,
        isEmpty: true,
        cards: [],
        alerts: [],
        queue: [],
        gameType: 'flashcard',
        reason: uiText('Bộ từ còn trống nên Set Doctor chưa thể chuẩn đoán.', 'The set is still empty, so Set Doctor cannot diagnose it yet.', 'The set is still empty, so Set Doctor cannot diagnose it yet.')
      };
    }

    const withExample = words.filter(word => word.example).length;
    const withNotes = words.filter(word => word.notes).length;
    const phraseCount = words.filter(word => ['phrase', 'pattern'].includes(word.entryType)).length;
    const patternCount = words.filter(word => word.entryType === 'pattern').length;
    const dueWords = words.filter(isDueWord);
    const weakWords = words.filter(isWeakWord);
    const riskWords = getAtRiskWords(words, Math.min(10, words.length));
    const examplesCoverage = Math.round((withExample / Math.max(1, words.length)) * 100);
    const notesCoverage = Math.round((withNotes / Math.max(1, words.length)) * 100);
    const overlapPairs = collectNearOverlapPairs(words, 3);
    const noExampleWords = words.filter(word => !word.example && !word.notes);
    const typeCounts = words.reduce((acc, word) => {
      const key = (word.wordType || word.entryType || 'other').toLowerCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const nounCount = Object.entries(typeCounts).filter(([key]) => key.includes('noun')).reduce((sum, [, count]) => sum + count, 0);
    const verbCount = Object.entries(typeCounts).filter(([key]) => key.includes('verb')).reduce((sum, [, count]) => sum + count, 0);
    const familyMap = {};
    words.forEach(word => {
      const key = getConceptFamilyKey(word);
      if (!familyMap[key]) familyMap[key] = { count: 0, sample: word, weak: 0 };
      familyMap[key].count += 1;
      if (isWeakWord(word) || calculateForgettingRisk(word) >= 65) familyMap[key].weak += 1;
      if (calculateForgettingRisk(word) > calculateForgettingRisk(familyMap[key].sample)) familyMap[key].sample = word;
    });
    const familyList = Object.values(familyMap).sort((a, b) => b.weak - a.weak || b.count - a.count);
    const weakestFamily = familyList.find(item => item.weak > 0) || familyList[0] || null;

    let structureGap = uiText('Bộ này đang khá cân bằng.', 'This set is structurally fairly balanced.', 'This set is structurally fairly balanced.');
    if (phraseCount < Math.max(1, Math.floor(words.length / 8))) {
      structureGap = uiText('Từ đơn đang nhiều hơn phrase/pattern. Nên thêm vài cụm nhớ để dùng từ tốt hơn.', 'Single words outweigh phrase/pattern anchors. Add a few chunks to make the set more usable.', 'Single words outweigh phrase/pattern anchors. Add a few chunks to make the set more usable.');
    } else if (nounCount >= Math.max(4, verbCount * 2)) {
      structureGap = uiText('Bộ này thiên về danh từ. Hãy bù thêm động từ hoặc pattern hành động để dùng từ tự nhiên hơn.', 'This set leans heavily toward nouns. Add verbs or action patterns for better usage.', 'This set leans heavily toward nouns. Add verbs or action patterns for better usage.');
    } else if (examplesCoverage < 45) {
      structureGap = uiText('Ví dụ và ngữ cảnh vẫn còn mỏng. Thêm ví dụ sẽ làm Context Replay mạnh hơn.', 'Example coverage is still thin. Adding examples will strengthen Context Replay.', 'Example coverage is still thin. Adding examples will strengthen Context Replay.');
    }

    const healthScore = Math.max(36, Math.min(96,
      92
      - Math.round(dueWords.length * 2.6)
      - Math.round(weakWords.length * 1.8)
      - Math.round(overlapPairs.length * 6)
      - Math.round(Math.max(0, 50 - examplesCoverage) * 0.28)
      + Math.round(phraseCount * 0.8)
      + Math.round(notesCoverage * 0.06)
    ));

    const repairSource = dueWords.length
      ? dueWords
      : weakWords.length
        ? weakWords
        : noExampleWords.length
          ? noExampleWords
          : riskWords.length
            ? riskWords
            : words;
    const gameType = dueWords.length
      ? 'srs'
      : weakWords.length
        ? 'typing'
        : phraseCount
          ? 'flashcard'
          : 'quiz';
    const queue = buildCoverageQueue(repairSource, Math.min(10, repairSource.length, words.length), dueWords.length ? 'rescue' : weakWords.length ? 'drill' : 'balanced');
    const reason = dueWords.length
      ? uiText(`Set Doctor phát hiện ${dueWords.length} mục đến hạn. Mở mission cứu trí nhớ trước sẽ an toàn hơn.`, `Set Doctor found ${dueWords.length} due item(s). Open a rescue mission first.`, `Set Doctor found ${dueWords.length} due item(s). Open a rescue mission first.`)
      : weakWords.length
        ? uiText(`Có ${weakWords.length} mục đang yếu. Nên drill chủ động trước khi mở rộng bộ từ.`, `There are ${weakWords.length} weak item(s). Repair them before expanding the set.`, `There are ${weakWords.length} weak item(s). Repair them before expanding the set.`)
        : uiText('Set này khá ổn. Doctor mission sẽ ưu tiên các mục thiếu ngữ cảnh hoặc thiếu neo nhớ.', 'This set is fairly stable. The doctor mission will target items that still lack context anchors.', 'This set is fairly stable. The doctor mission will target items that still lack context anchors.');

    return {
      setName,
      isEmpty: false,
      cards: [
        {
          label: uiText('Điểm sức khỏe', 'Health score', 'Health score'),
          value: `${healthScore}/100`,
          foot: dueWords.length
            ? uiText(`Còn ${dueWords.length} mục đến hạn và ${weakWords.length} mục yếu.`, `${dueWords.length} due item(s) and ${weakWords.length} weak item(s) remain.`, `${dueWords.length} due item(s) and ${weakWords.length} weak item(s) remain.`)
            : uiText('Bộ này chưa có áp lực đến hạn quá lớn.', 'No major due pressure in this set right now.', 'No major due pressure in this set right now.')
        },
        {
          label: uiText('Cụm cần cứu', 'Repair cluster', 'Repair cluster'),
          value: weakestFamily?.sample?.word || uiText('Chưa rõ', 'No clear cluster', 'No clear cluster'),
          foot: weakestFamily
            ? uiText(`Cụm này có ${weakestFamily.weak} mục risk/weak và ${weakestFamily.count} mục liên quan.`, `This cluster has ${weakestFamily.weak} risk/weak item(s) across ${weakestFamily.count} related entries.`, `This cluster has ${weakestFamily.weak} risk/weak item(s) across ${weakestFamily.count} related entries.`)
            : uiText('Chưa có cụm đủ dày để chẩn đoán.', 'No dense cluster yet.', 'No dense cluster yet.')
        },
        {
          label: uiText('Độ phủ ngữ cảnh', 'Context coverage', 'Context coverage'),
          value: `${examplesCoverage}%`,
          foot: uiText(`Ví dụ: ${withExample}/${words.length} • Ghi chú: ${withNotes}/${words.length}`, `Examples: ${withExample}/${words.length} • Notes: ${withNotes}/${words.length}`, `Examples: ${withExample}/${words.length} • Notes: ${withNotes}/${words.length}`)
        },
        {
          label: uiText('Tín hiệu cấu trúc', 'Structure signal', 'Structure signal'),
          value: phraseCount
            ? uiText(`${phraseCount} cụm / ${patternCount} pattern`, `${phraseCount} phrase(s) / ${patternCount} pattern(s)`, `${phraseCount} phrase(s) / ${patternCount} pattern(s)`)
            : uiText('Từ đơn chiếm ưu thế', 'Mostly single words', 'Mostly single words'),
          foot: structureGap
        }
      ],
      alerts: [
        overlapPairs.length
          ? uiText(`Vùng trùng gần: ${overlapPairs.map(pair => `${pair.left.word} ↔ ${pair.right.word}`).join(', ')}`, `Near-overlap zone: ${overlapPairs.map(pair => `${pair.left.word} ↔ ${pair.right.word}`).join(', ')}`, `Near-overlap zone: ${overlapPairs.map(pair => `${pair.left.word} ↔ ${pair.right.word}`).join(', ')}`)
          : uiText('Chưa thấy vùng trùng gần quá rõ trong bộ này.', 'No obvious near-overlap zone in this set.', 'No obvious near-overlap zone in this set.'),
        structureGap,
        reason
      ],
      queue,
      gameType,
      reason
    };
  }

  function renderSetDoctor() {
    ensureSetDoctorPanel();
    const panel = byId('setDoctorPanel');
    if (!panel) return;
    const report = buildSetDoctorReport();
    state.setDoctorReport = report;
    if (report.isEmpty) {
      panel.innerHTML = `
        <div class="suggestion-panel-head">
          <div>
            <h2>${escapeHtml(uiText('Set Doctor', 'Set Doctor', 'Set Doctor'))}</h2>
            <p class="muted-text">${escapeHtml(uiText('Bộ từ còn trống, nên chưa có dữ liệu để chẩn đoán.', 'The set is still empty, so there is not enough signal to diagnose it yet.', 'The set is still empty, so there is not enough signal to diagnose it yet.'))}</p>
          </div>
        </div>
        <div class="doctor-empty">${escapeHtml(report.reason)}</div>`;
      return;
    }
    panel.innerHTML = `
      <div class="suggestion-panel-head doctor-head">
        <div>
          <h2>${escapeHtml(uiText('Set Doctor', 'Set Doctor', 'Set Doctor'))}</h2>
          <p class="muted-text">${escapeHtml(uiText(`Chuẩn đoán nhanh cho bộ “${report.setName}” để giảm lặp, tăng ngữ cảnh và sửa vùng nhớ yếu trước.`, `Quick diagnosis for “${report.setName}” to reduce redundancy, strengthen context, and repair weak memory zones first.`, `Quick diagnosis for “${report.setName}” to reduce redundancy and repair weak memory zones first.`))}</p>
        </div>
        <div class="doctor-actions">
          <button type="button" class="primary-btn" data-doctor-action="mission">${escapeHtml(uiText('▶ Mở doctor mission', '▶ Launch doctor mission', '▶ Launch doctor mission'))}</button>
          <button type="button" class="secondary-btn" data-doctor-action="suggestions">${escapeHtml(uiText('Đổi làn gợi ý', 'Switch suggestion lane', 'Switch suggestion lane'))}</button>
        </div>
      </div>
      <div class="doctor-grid">
        ${report.cards.map(card => `
          <article class="doctor-card">
            <span class="doctor-label">${escapeHtml(card.label)}</span>
            <strong class="doctor-value">${escapeHtml(card.value)}</strong>
            <p class="doctor-foot">${escapeHtml(card.foot)}</p>
          </article>
        `).join('')}
      </div>
      <div class="doctor-alert-list">
        ${report.alerts.map(item => `<div class="doctor-alert-item">${escapeHtml(item)}</div>`).join('')}
      </div>`;
  }

  function handleSetDoctorAction(event) {
    const button = event.target.closest('[data-doctor-action]');
    if (!button) return;
    const action = button.dataset.doctorAction;
    const report = state.setDoctorReport || buildSetDoctorReport();
    if (action === 'mission') {
      if (!report.queue?.length) return showToast(uiText('Set Doctor chưa tìm thấy mission phù hợp.', 'Set Doctor could not build a mission yet.', 'Set Doctor could not build a mission yet.'));
      startCustomQueue(report.queue, report.gameType || 'flashcard', uiText('Set Doctor Mission', 'Set Doctor Mission', 'Set Doctor Mission'), report.reason);
      return;
    }
    if (action === 'suggestions') {
      refreshSmartSuggestions();
      showToast(uiText('Đã đổi làn gợi ý để tránh lặp cùng một vùng nhớ.', 'Suggestion lane switched to avoid repeating the same memory zone.', 'Suggestion lane switched to avoid repeating the same memory zone.'));
    }
  }

  function ensureMemoryCoachDock() {
    if (byId('memoryCoachDock')) return;
    const dock = document.createElement('section');
    dock.id = 'memoryCoachDock';
    dock.className = 'memory-coach-dock hidden';
    dock.innerHTML = `
      <div class="coach-head">
        <div>
          <span class="support-kicker">${escapeHtml(uiText('Gợi nhớ từng bước', 'Memory Coach', 'Memory Coach'))}</span>
          <h3 id="memoryCoachTitle">${escapeHtml(uiText('Bậc gợi nhớ', 'Retrieval Ladder', 'Retrieval Ladder'))}</h3>
          <p id="memoryCoachLead" class="muted-text">${escapeHtml(uiText('Mở từng gợi ý nhỏ trước, rồi mới dùng hỗ trợ sâu hơn nếu vẫn bí.', 'Reveal one small cue at a time before using heavier support.', 'Reveal one small cue at a time before using heavier support.'))}</p>
        </div>
        <div class="coach-head-actions">
          <button id="memoryHintAdvanceBtn" class="secondary-btn">${escapeHtml(uiText('Mở gợi ý kế', 'Reveal next cue', 'Reveal next cue'))}</button>
          <button id="memoryHintRescueBtn" class="primary-btn">${escapeHtml(uiText('Gợi ý từ liên quan', 'Related word help', 'Related word help'))}</button>
        </div>
      </div>
      <div class="memory-coach-grid">
        <article class="coach-card hint-card">
          <div class="coach-card-top">
            <span class="coach-label">${escapeHtml(uiText('Bậc gợi nhớ', 'Retrieval Ladder', 'Retrieval Ladder'))}</span>
            <span id="hintLadderProgress" class="coach-badge">0/0</span>
          </div>
          <div id="hintLadderIntro" class="coach-note"></div>
          <ol id="hintLadderList" class="hint-ladder-list"></ol>
        </article>
        <article class="coach-card context-card hidden">
          <div class="coach-card-top">
            <span class="coach-label">${escapeHtml(uiText('Ngữ cảnh', 'Context Replay', 'Context Replay'))}</span>
          </div>
          <div id="contextReplayGrid" class="context-replay-grid"></div>
        </article>
        <article class="coach-card active-use-card hidden">
          <div class="coach-card-top">
            <span class="coach-label">${escapeHtml(uiText('Dùng ngay', 'Use It Now', 'Use It Now'))}</span>
          </div>
          <div id="activeUsePrompt" class="active-use-prompt"></div>
          <p id="activeUseNote" class="coach-note"></p>
        </article>
      </div>`;
    const supportDock = byId('studySupportDock');
    if (supportDock?.parentNode) supportDock.insertAdjacentElement('beforebegin', dock);
  }

  function hideMemoryCoach() {
    byId('memoryCoachDock')?.classList.add('hidden');
    state.hintLadder = { wordId: '', reason: 'recall', level: 0 };
  }

  function getHintLadderState(card, reason = 'recall') {
    if (!card) return { wordId: '', reason, level: 0 };
    if (state.hintLadder.wordId !== card.id || state.hintLadder.reason !== reason) {
      state.hintLadder = { wordId: card.id, reason, level: 0 };
    }
    return state.hintLadder;
  }

  function buildHintSequence(card, reason = 'recall') {
    if (!card) return [];
    const hints = [];
    const pushHint = (label, value) => {
      const cleanValue = String(value || '').trim();
      if (!cleanValue) return;
      if (hints.some(item => item.value === cleanValue)) return;
      hints.push({ label, value: cleanValue });
    };
    const isFlashcardRecall = state.currentGame === 'flashcard' || state.currentGame === 'srs' || reason === 'meaning';
    if (isFlashcardRecall && card.meaning) {
      pushHint(uiText('Nghĩa tiếng Việt', 'Vietnamese meaning', 'Meaning cue'), card.meaning);
    }
    pushHint(uiText('Loại & vùng nhớ', 'Type & memory zone', 'Type & memory zone'), `${getEntryTypeLabel(card)} • ${card.wordType || card.wordset}`);
    if (!isFlashcardRecall && card.meaning) {
      pushHint(uiText('Neo nghĩa', 'Meaning anchor', 'Meaning anchor'), card.meaning);
    }
    if (card.example) {
      const regex = new RegExp(escapeRegExp(card.word), 'gi');
      pushHint(uiText('Ngữ cảnh', 'Context cue', 'Context cue'), card.example.replace(regex, '_____'));
    }
    if (card.word.length >= 4) pushHint(uiText('Khung chữ', 'Letter frame', 'Letter frame'), maskWord(card.word));
    if (card.word.length >= 2) pushHint(uiText('Chữ cái đầu/cuối', 'First & last letters', 'First & last letters'), `${card.word[0]} • ${card.word.slice(-1)}`);
    pushHint(uiText('Độ dài', 'Length', 'Length'), uiText(`${card.word.length} ký tự`, `${card.word.length} letters`, `${card.word.length} letters`));
    if (card.phonetic) pushHint(uiText('Neo âm thanh', 'Sound anchor', 'Sound anchor'), card.phonetic);
    if (card.notes) pushHint(uiText('Mẹo nhớ', 'Memory note', 'Memory note'), card.notes);
    pushHint(uiText('Đáp án', 'Answer', 'Answer'), card.word);
    return hints;
  }

  function buildUseItNowPrompt(card) {
    if (!card) return '';
    if (card.entryType === 'pattern') {
      return uiText(`Tự viết 1 câu ngắn với pattern “${card.word}” rồi đổi chủ ngữ một lần nữa.`, `Write one short sentence with the pattern “${card.word}”, then rewrite it with a different subject.`, `Write one short sentence with the pattern “${card.word}”, then rewrite it with a different subject.`);
    }
    if (card.entryType === 'phrase') {
      return uiText(`Viết 1 câu thật ngắn dùng cụm “${card.word}” trong đúng ngữ cảnh của bạn.`, `Write one short sentence using the phrase “${card.word}” in a situation that feels real to you.`, `Write one short sentence using the phrase “${card.word}” in a situation that feels real to you.`);
    }
    return uiText(`Dùng “${card.word}” trong 1 câu tiếng Anh thật ngắn, rồi tự giải thích câu đó bằng tiếng Việt.`, `Use “${card.word}” in one short English sentence, then explain that sentence in Vietnamese.`, `Use “${card.word}” in one short English sentence, then explain that sentence in Vietnamese.`);
  }

  function renderMemoryCoach(card, reason = state.hintLadder?.reason || inferFailureReasonFromGame(state.currentGame)) {
    ensureMemoryCoachDock();
    const dock = byId('memoryCoachDock');
    const ladderList = byId('hintLadderList');
    const progress = byId('hintLadderProgress');
    const intro = byId('hintLadderIntro');
    const contextGrid = byId('contextReplayGrid');
    const prompt = byId('activeUsePrompt');
    const note = byId('activeUseNote');
    const title = byId('memoryCoachTitle');
    const lead = byId('memoryCoachLead');
    const advanceBtn = byId('memoryHintAdvanceBtn');
    const rescueBtn = byId('memoryHintRescueBtn');
    const contextCard = dock?.querySelector('.context-card');
    const activeUseCard = dock?.querySelector('.active-use-card');
    if (!dock || !ladderList || !progress || !contextGrid || !prompt || !note || !title || !lead || !advanceBtn || !rescueBtn || !card) return;

    const ladder = getHintLadderState(card, reason);
    const hints = buildHintSequence(card, reason);
    const revealed = Math.min(ladder.level, hints.length);
    const visibleHints = hints.slice(0, revealed);
    const nextHint = revealed < hints.length ? hints[revealed] : null;
    const showContext = revealed >= 3;
    const showActiveUse = revealed >= hints.length;

    title.textContent = `${uiText('Bậc gợi nhớ', 'Retrieval Ladder', 'Retrieval Ladder')} • ${card.word}`;
    lead.textContent = getFailureReasonLead(reason, card);
    intro.textContent = uiText('Chỉ hiện những gợi ý bạn đã mở. Mỗi lần mở thêm phải giúp gọi lại tốt hơn, không làm bạn lười nhớ.', 'Only the cues you have actually opened are shown. Each extra cue should support recall, not replace it.', 'Only opened cues are shown so recall stays active.');
    progress.textContent = `${revealed}/${hints.length}`;
    ladderList.innerHTML = [
      ...visibleHints.map((hint, index) => `
        <li class="hint-step revealed">
          <span class="hint-step-index">${index + 1}</span>
          <div>
            <strong>${escapeHtml(hint.label)}</strong>
            <span>${escapeHtml(hint.value)}</span>
          </div>
        </li>
      `),
      nextHint ? `
        <li class="hint-step next-cue">
          <span class="hint-step-index">${revealed + 1}</span>
          <div>
            <strong>${escapeHtml(nextHint.label)}</strong>
            <span>${escapeHtml(uiText('Chưa mở', 'Locked', 'Locked'))}</span>
          </div>
        </li>
      ` : ''
    ].join('');

    const contextItems = [
      { label: uiText('Ví dụ', 'Example', 'Example'), value: card.example || uiText('Chưa có ví dụ', 'No example yet', 'No example yet') },
      { label: uiText('Ghi chú', 'Note', 'Note'), value: card.notes || uiText('Chưa có ghi chú', 'No note yet', 'No note yet') }
    ];
    contextGrid.innerHTML = contextItems.map(item => `
      <div class="context-chip">
        <span>${escapeHtml(item.label)}</span>
        <strong>${escapeHtml(item.value)}</strong>
      </div>
    `).join('');

    if (contextCard) contextCard.classList.toggle('hidden', !showContext);
    if (activeUseCard) activeUseCard.classList.toggle('hidden', !showActiveUse);
    prompt.textContent = showActiveUse ? buildUseItNowPrompt(card) : '';
    note.textContent = showActiveUse
      ? uiText('Mẹo: chỉ cần 1 câu ngắn để kéo từ sang dùng chủ động.', 'Tip: one short sentence is enough for active use.', 'Tip: one short sentence is enough for active use.')
      : '';
    advanceBtn.textContent = revealed >= hints.length
      ? uiText('Mở Rescue Lane', 'Open Rescue Lane', 'Open Rescue Lane')
      : uiText(`Mở gợi ý kế (${revealed + 1}/${hints.length})`, `Reveal next cue (${revealed + 1}/${hints.length})`, `Reveal next cue (${revealed + 1}/${hints.length})`);
    rescueBtn.textContent = uiText('Gợi ý từ liên quan', 'Related word help', 'Related word help');
    dock.classList.remove('hidden');
  }

  function handleMemoryCoachAdvance() {
    const card = state.studyQueue[state.currentCardIdx];
    if (!card) return;
    const reason = state.hintLadder?.reason || inferFailureReasonFromGame(state.currentGame);
    const ladder = getHintLadderState(card, reason);
    const hints = buildHintSequence(card, reason);
    if (ladder.level >= hints.length) {
      openStudySupportForCurrent(reason, { autoQueue: false, manual: true });
      return;
    }
    ladder.level += 1;
    state.hintLadder = ladder;
    renderMemoryCoach(card, reason);
    const hint = hints[ladder.level - 1];
    showToast(`${hint.label}: ${hint.value}`);
  }

  function advanceHintLadderForCurrent(reason = 'recall') {
    const card = state.studyQueue[state.currentCardIdx];
    if (!card) return;
    getHintLadderState(card, reason);
    renderMemoryCoach(card, reason);
    handleMemoryCoachAdvance();
  }

  function buildDedupKey(word, meaning) {
    return `${normalizeAnswer(word)}__${normalizeAnswer(meaning)}`;
  }

  function openStudySupportForCurrent(reason = 'recall', options = {}) {
    const card = state.studyQueue[state.currentCardIdx];
    if (!card) return;
    renderMemoryCoach(card, reason);
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

    const ladder = getHintLadderState(card, reason);
    ladder.level = Math.max(ladder.level, Math.min(3, buildHintSequence(card, reason).length));
    state.hintLadder = ladder;

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
    hideMemoryCoach();
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
    hideMemoryCoach();
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
    hideStudySupport();
    hideMemoryCoach();
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

  function getQuizDistractors(card, count = 3) {
    const basePool = (state.optionPool?.length ? state.optionPool : getWordsForSet(state.activeSet || 'all'))
      .concat(state.vocab)
      .filter((item, index, arr) => item?.id && item.id !== card.id && arr.findIndex(other => other.id === item.id) === index);
    if (!basePool.length) return [];

    const upgradeData = window.VMUpgradeData || {};
    const confusionBank = upgradeData.CONFUSION_BANK || {};
    const compareSet = new Set(extractCompareCandidates(confusionBank[normalizeAnswer(card.word)]?.compare || ''));
    compareSet.delete(normalizeAnswer(card.word));
    const cardTags = new Set((card.topicTags || []).map(tag => normalizeAnswer(tag)).filter(Boolean));
    const cardType = normalizeAnswer(card.wordType || '');
    const meaningTokens = tokenizeSuggestionText(card.meaning || '');
    const promptMode = state.activeQuizMode;

    const scored = basePool.map(item => {
      const normalizedWord = normalizeAnswer(item.word || '');
      const itemTags = (item.topicTags || []).map(tag => normalizeAnswer(tag));
      const sameTopic = itemTags.some(tag => cardTags.has(tag));
      const sameType = cardType && normalizeAnswer(item.wordType || '') === cardType;
      const sameEntryType = (item.entryType || 'word') === (card.entryType || 'word');
      const meaningOverlap = getTokenOverlap(meaningTokens, tokenizeSuggestionText(item.meaning || ''));
      let score = getWordSimilarityScore(card, item) * 46;
      if (compareSet.has(normalizedWord)) score += 110;
      if (sameTopic) score += 34;
      if (sameType) score += 24;
      if (sameEntryType) score += 12;
      if (meaningOverlap) score += meaningOverlap * 20;
      if (promptMode === 'context' && item.example) score += 6;
      return { item, score };
    }).sort((a, b) => b.score - a.score);

    const optionTextFor = (item) => {
      if (promptMode === 'meaning-word' || promptMode === 'context') return normalizeAnswer(item.word || '');
      return normalizeAnswer(item.meaning || '');
    };

    const selected = [];
    const usedOptionTexts = new Set([optionTextFor(card)]);

    for (const { item } of scored) {
      const optionText = optionTextFor(item);
      if (!optionText || usedOptionTexts.has(optionText)) continue;
      if (selected.some(existing => getWordSimilarityScore(existing, item) >= 0.94)) continue;
      selected.push(item);
      usedOptionTexts.add(optionText);
      if (selected.length >= count) break;
    }

    if (selected.length < count) {
      shuffle(basePool).forEach(item => {
        if (selected.length >= count) return;
        const optionText = optionTextFor(item);
        if (!optionText || usedOptionTexts.has(optionText)) return;
        selected.push(item);
        usedOptionTexts.add(optionText);
      });
    }

    return selected.slice(0, count);
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
    hideStudySupport();
    hideMemoryCoach();

    const wrongOptions = getQuizDistractors(card, 3);
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
    hideStudySupport();
    hideMemoryCoach();
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
    hideStudySupport();
    hideMemoryCoach();
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
    hideMemoryCoach();

    let persistPromise = Promise.resolve();
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
      persistPromise = persistState();
      renderSessionSummary(message);
      openModal('sessionSummaryModal');
    }

    showToast(message);
    showView('review-dashboard-view');
    initReviewView();
    await persistPromise;
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
  // Integrated upgrade block: multi-skill memory, sentence bank, contrast lane, quick rescue hooks.
  const INTEGRATED_SKILL_KEYS = ['recognition', 'production', 'spelling', 'listening', 'usage', 'confusion'];
  const INTEGRATED_SKILL_DEFAULTS = {
    recognition: 0,
    production: 0,
    spelling: 0,
    listening: 0,
    usage: 0,
    confusion: 0
  };
  const INTEGRATED_REVIEW_FIELDS = {
    hintCount: 0,
    hintPenalty: 0,
    lastHintAt: 0,
    lastHintReason: ''
  };
  const INTEGRATED_DEFAULT_SETTINGS = {
    languageMode: 'en_focus',
    fxGlass: 'depth',
    fxMotion: 'off',
    fxScene: 'midnight',
    fxDensity: 'micro',
    fxAccent: 'blue',
    fxRadius: 'soft'
  };

  function normalizeIntegratedReview(review = {}) {
    const next = {
      ...REVIEW_DEFAULTS,
      ...INTEGRATED_REVIEW_FIELDS,
      ...(review || {})
    };
    next.streak = Math.max(0, Number(next.streak) || 0);
    next.wrongCount = Math.max(0, Number(next.wrongCount) || 0);
    next.correctCount = Math.max(0, Number(next.correctCount) || 0);
    next.hardCount = Math.max(0, Number(next.hardCount) || 0);
    next.seenCount = Math.max(0, Number(next.seenCount) || 0);
    next.lapseCount = Math.max(0, Number(next.lapseCount) || 0);
    next.dueAt = Math.max(0, Number(next.dueAt) || 0);
    next.lastReviewedAt = Math.max(0, Number(next.lastReviewedAt) || 0);
    next.confidence = Number.isFinite(Number(next.confidence)) ? clampConfidence(Number(next.confidence)) : 0;
    next.lastFailureAt = Math.max(0, Number(next.lastFailureAt) || 0);
    next.lastFailureReason = String(next.lastFailureReason || '').trim();
    next.lastSeenGame = String(next.lastSeenGame || '').trim();
    next.hintCount = Math.max(0, Number(next.hintCount) || 0);
    next.hintPenalty = Math.max(0, Math.min(3, Number(next.hintPenalty) || 0));
    next.lastHintAt = Math.max(0, Number(next.lastHintAt) || 0);
    next.lastHintReason = String(next.lastHintReason || '').trim();
    return next;
  }

  function normalizeSkillMap(map = {}) {
    const source = map && typeof map === 'object' ? map : {};
    return INTEGRATED_SKILL_KEYS.reduce((acc, key) => {
      acc[key] = clampConfidence(Number(source[key]) || 0);
      return acc;
    }, {});
  }

  function mergeSkillMaps(left = {}, right = {}) {
    const a = normalizeSkillMap(left);
    const b = normalizeSkillMap(right);
    return INTEGRATED_SKILL_KEYS.reduce((acc, key) => {
      acc[key] = Math.max(a[key], b[key]);
      return acc;
    }, {});
  }

  function buildSentenceId(seed = 'sentence') {
    return `${seed}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function normalizeSentenceBank(list = []) {
    const raw = Array.isArray(list) ? list : [];
    const merged = [];
    raw.forEach((item, index) => {
      const entry = {
        id: String(item?.id || buildSentenceId(`s${index}`)),
        text: String(item?.text || item?.sentence || '').trim(),
        gloss: String(item?.gloss || item?.translation || '').trim(),
        source: String(item?.source || 'user').trim() || 'user',
        createdAt: Math.max(0, Number(item?.createdAt) || Date.now()),
        usedCount: Math.max(0, Number(item?.usedCount) || 0),
        lastUsedAt: Math.max(0, Number(item?.lastUsedAt) || 0)
      };
      if (!entry.text) return;
      const key = normalizeAnswer(entry.text);
      const existing = merged.find(candidate => normalizeAnswer(candidate.text) === key);
      if (!existing) {
        merged.push(entry);
        return;
      }
      existing.gloss = pickRicherText(existing.gloss, entry.gloss);
      existing.source = existing.source === 'user' || entry.source !== 'user' ? existing.source : 'user';
      existing.usedCount = Math.max(existing.usedCount, entry.usedCount);
      existing.lastUsedAt = Math.max(existing.lastUsedAt, entry.lastUsedAt);
      existing.createdAt = Math.min(existing.createdAt, entry.createdAt);
    });
    return merged.slice(0, 24);
  }

  function mergeSentenceBanks(...banks) {
    return normalizeSentenceBank(banks.flat());
  }

  function getWordSentenceBank(word, { includeExample = true } = {}) {
    const personal = normalizeSentenceBank(word?.personalSentences || []);
    const systemEntries = [];
    if (includeExample) {
      const example = String(word?.example || '').trim();
      if (example) {
        systemEntries.push({
          id: `${word?.id || 'word'}-example`,
          text: example,
          gloss: String(word?.meaning || '').trim(),
          source: 'system',
          createdAt: Number(word?.createdAt) || Date.now(),
          usedCount: 0,
          lastUsedAt: 0
        });
      }
    }
    return mergeSentenceBanks(personal, systemEntries);
  }

  function chooseStudySentence(word, { preferUser = true } = {}) {
    const bank = getWordSentenceBank(word);
    if (!bank.length) return null;
    const sorted = [...bank].sort((a, b) => {
      if (preferUser && a.source !== b.source) return a.source === 'user' ? -1 : 1;
      return (Number(b.usedCount) || 0) - (Number(a.usedCount) || 0)
        || (Number(a.createdAt) || 0) - (Number(b.createdAt) || 0);
    });
    return sorted[0] || null;
  }

  function rememberSentenceUsage(word, sentenceText) {
    if (!word || !sentenceText) return;
    const normalized = normalizeAnswer(sentenceText);
    if (!normalized) return;
    const existing = normalizeSentenceBank(word.personalSentences || []);
    const hit = existing.find(item => normalizeAnswer(item.text) === normalized);
    if (!hit) return;
    hit.usedCount = Math.max(0, Number(hit.usedCount) || 0) + 1;
    hit.lastUsedAt = Date.now();
    word.personalSentences = existing;
  }

  function getSkillLabel(key) {
    const labels = {
      recognition: uiText('Nhận diện', 'Recognition', 'Recognition'),
      production: uiText('Gọi ra', 'Production', 'Production'),
      spelling: uiText('Chính tả', 'Spelling', 'Spelling'),
      listening: uiText('Nghe', 'Listening', 'Listening'),
      usage: uiText('Dùng câu', 'Usage', 'Usage'),
      confusion: uiText('Phân biệt', 'Contrast', 'Contrast')
    };
    return labels[key] || key;
  }

  function deriveConfidenceFromSkillMap(skillMap = {}) {
    const normalized = normalizeSkillMap(skillMap);
    const activeKeys = INTEGRATED_SKILL_KEYS.filter(key => normalized[key] > 0);
    if (!activeKeys.length) return null;
    const weights = {
      recognition: 1.2,
      production: 1.15,
      spelling: 1,
      listening: 1,
      usage: 0.85,
      confusion: 0.9
    };
    const totalWeight = activeKeys.reduce((sum, key) => sum + (weights[key] || 1), 0);
    const weighted = activeKeys.reduce((sum, key) => sum + normalized[key] * (weights[key] || 1), 0);
    return clampConfidence(Math.round(weighted / Math.max(1, totalWeight)));
  }

  function getWeakestSkillKey(word) {
    const map = normalizeSkillMap(word?.skillMap || {});
    const active = INTEGRATED_SKILL_KEYS
      .map(key => ({ key, value: map[key] }))
      .filter(item => item.value > 0);
    if (!active.length) return '';
    active.sort((a, b) => a.value - b.value || a.key.localeCompare(b.key));
    return active[0]?.key || '';
  }

  function getSkillHeadline(word) {
    const weakest = getWeakestSkillKey(word);
    if (!weakest) return uiText('Chưa tách kênh kỹ năng', 'Skill lanes not split yet', 'Skill lanes not split yet');
    const map = normalizeSkillMap(word?.skillMap || {});
    return `${getSkillLabel(weakest)} ${map[weakest]}/4`;
  }

  function summarizeSkillCoverage(words = []) {
    const totals = INTEGRATED_SKILL_KEYS.reduce((acc, key) => {
      acc[key] = { total: 0, count: 0 };
      return acc;
    }, {});
    words.forEach(word => {
      const map = normalizeSkillMap(word?.skillMap || {});
      INTEGRATED_SKILL_KEYS.forEach(key => {
        if (map[key] > 0) {
          totals[key].total += map[key];
          totals[key].count += 1;
        }
      });
    });
    return INTEGRATED_SKILL_KEYS.map(key => ({
      key,
      average: totals[key].count ? Number((totals[key].total / totals[key].count).toFixed(1)) : 0,
      count: totals[key].count
    }));
  }

  function getWeakestSkillAcrossWords(words = []) {
    const summary = summarizeSkillCoverage(words).filter(item => item.count > 0);
    if (!summary.length) return null;
    summary.sort((a, b) => a.average - b.average || a.count - b.count);
    return summary[0];
  }

  function getSkillKeysForResult(detail = {}) {
    const gameType = detail.gameType || state.currentGame || '';
    if (Array.isArray(detail.skills) && detail.skills.length) return detail.skills.filter(key => INTEGRATED_SKILL_KEYS.includes(key));
    if (gameType === 'typing') return ['production', 'spelling'];
    if (gameType === 'dictation') {
      if (detail.promptType === 'sentence') return ['listening', 'spelling', 'usage'];
      if (detail.promptType === 'cloze') return ['listening', 'spelling', 'usage'];
      return ['listening', 'spelling'];
    }
    if (gameType === 'matching' || gameType === 'contrast') return ['confusion', 'recognition'];
    if (gameType === 'quiz') {
      if (state.activeQuizMode === 'contrast') return ['confusion', 'recognition'];
      if (state.activeQuizMode === 'context') return ['recognition', 'usage'];
      if (state.activeQuizMode === 'meaning-word') return ['recognition', 'production'];
      return ['recognition'];
    }
    return ['recognition'];
  }

  function mapFailureReasonToSkill(reason = '') {
    const mapping = {
      meaning: 'recognition',
      recall: 'production',
      spelling: 'spelling',
      listening: 'listening',
      confusion: 'confusion'
    };
    return mapping[reason] || '';
  }

  function updateSkillMapForResult(word, quality, detail = {}) {
    const next = normalizeSkillMap(word?.skillMap || {});
    const baseSkills = getSkillKeysForResult(detail);
    const fallbackSkill = mapFailureReasonToSkill(detail.failureReason || inferFailureReasonFromGame(detail.gameType || state.currentGame));
    const skillKeys = [...new Set([...baseSkills, ...(fallbackSkill ? [fallbackSkill] : [])])].filter(Boolean);
    if (!skillKeys.length) {
      word.skillMap = next;
      return next;
    }
    skillKeys.forEach(key => {
      if (quality === 'again') next[key] = clampConfidence(Math.max(0, next[key] - 1));
      else if (quality === 'hard') next[key] = clampConfidence(Math.max(1, next[key]));
      else next[key] = clampConfidence(next[key] + 1);
    });
    word.skillMap = next;
    return next;
  }

  function normalizeSettings(settings = {}) {
    const base = { ...INTEGRATED_DEFAULT_SETTINGS, ...(settings || {}) };
    const languageMode = LANGUAGE_MODE_OPTIONS.some(option => option.value === base.languageMode)
      ? base.languageMode
      : INTEGRATED_DEFAULT_SETTINGS.languageMode;
    const fxGlass = ['crystal', 'mist', 'depth', 'pearl', 'obsidian'].includes(base.fxGlass) ? base.fxGlass : INTEGRATED_DEFAULT_SETTINGS.fxGlass;
    const fxMotion = ['off', 'calm', 'flow', 'pulse'].includes(base.fxMotion) ? base.fxMotion : INTEGRATED_DEFAULT_SETTINGS.fxMotion;
    const fxScene = ['nebula', 'aurora', 'midnight', 'sunset', 'forest', 'rose'].includes(base.fxScene) ? base.fxScene : INTEGRATED_DEFAULT_SETTINGS.fxScene;
    const fxDensity = ['micro', 'compact', 'cozy'].includes(base.fxDensity) ? base.fxDensity : INTEGRATED_DEFAULT_SETTINGS.fxDensity;
    const fxAccent = ['blue', 'violet', 'mint', 'sunset'].includes(base.fxAccent) ? base.fxAccent : INTEGRATED_DEFAULT_SETTINGS.fxAccent;
    const fxRadius = ['soft', 'rounded', 'capsule'].includes(base.fxRadius) ? base.fxRadius : INTEGRATED_DEFAULT_SETTINGS.fxRadius;
    return { languageMode, fxGlass, fxMotion, fxScene, fxDensity, fxAccent, fxRadius };
  }

  function deriveConfidenceValue(review = {}, isLearned = false, skillMap = null) {
    const normalizedReview = normalizeIntegratedReview(review);
    let baseConfidence = Number.isFinite(Number(normalizedReview.confidence))
      ? clampConfidence(Number(normalizedReview.confidence))
      : 0;
    if (!Number.isFinite(Number(review?.confidence))) {
      if (!normalizedReview.lastReviewedAt) baseConfidence = 0;
      else if (isLearned || normalizedReview.streak >= 4 || normalizedReview.correctCount >= 6) baseConfidence = 4;
      else if (normalizedReview.streak >= 3 || normalizedReview.correctCount >= 4) baseConfidence = 3;
      else if (normalizedReview.streak >= 1 || normalizedReview.correctCount >= 2 || normalizedReview.seenCount >= 3) baseConfidence = 2;
      else baseConfidence = 1;
    }
    const skillDerived = deriveConfidenceFromSkillMap(skillMap || review?.skillMap || {});
    if (skillDerived === null) return baseConfidence;
    return clampConfidence(Math.round(baseConfidence * 0.65 + skillDerived * 0.35));
  }

  function getConfidenceValue(word) {
    return deriveConfidenceValue(word?.review || {}, Boolean(word?.isLearned), word?.skillMap || {});
  }

  function normalizeWord(item, index = 0) {
    const skillMap = normalizeSkillMap(item?.skillMap || item?.review?.skillMap || {});
    const review = normalizeIntegratedReview(item?.review || {});
    review.confidence = deriveConfidenceValue(review, Boolean(item?.isLearned), skillMap);

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
      review,
      skillMap,
      personalSentences: normalizeSentenceBank(item?.personalSentences || item?.review?.personalSentences || [])
    };

    return {
      ...base,
      entryType: String(item?.entryType || inferEntryType(base)).trim() || 'word',
      topicTags: normalizeTopicTags(item?.topicTags, base)
    };
  }

  function mergeReviewState(primaryReview = {}, incomingReview = {}) {
    const primary = normalizeIntegratedReview(primaryReview);
    const incoming = normalizeIntegratedReview(incomingReview);
    const latestFailureSource = (incoming.lastFailureAt || 0) >= (primary.lastFailureAt || 0) ? incoming : primary;
    const latestSeenSource = (incoming.lastReviewedAt || 0) >= (primary.lastReviewedAt || 0) ? incoming : primary;
    return {
      ...REVIEW_DEFAULTS,
      ...INTEGRATED_REVIEW_FIELDS,
      seenCount: primary.seenCount + incoming.seenCount,
      correctCount: primary.correctCount + incoming.correctCount,
      wrongCount: primary.wrongCount + incoming.wrongCount,
      hardCount: primary.hardCount + incoming.hardCount,
      lapseCount: primary.lapseCount + incoming.lapseCount,
      streak: Math.max(primary.streak, incoming.streak),
      confidence: clampConfidence(Math.max(
        deriveConfidenceValue(primary, false),
        deriveConfidenceValue(incoming, false),
        primary.confidence,
        incoming.confidence
      )),
      dueAt: [primary.dueAt, incoming.dueAt].filter(value => Number(value) > 0).sort((a, b) => a - b)[0] || 0,
      lastReviewedAt: Math.max(primary.lastReviewedAt, incoming.lastReviewedAt),
      lastFailureAt: Math.max(primary.lastFailureAt, incoming.lastFailureAt),
      lastFailureReason: latestFailureSource.lastFailureReason || '',
      lastSeenGame: latestSeenSource.lastSeenGame || '',
      hintCount: primary.hintCount + incoming.hintCount,
      hintPenalty: Math.max(primary.hintPenalty, incoming.hintPenalty),
      lastHintAt: Math.max(primary.lastHintAt, incoming.lastHintAt),
      lastHintReason: (incoming.lastHintAt || 0) >= (primary.lastHintAt || 0) ? (incoming.lastHintReason || '') : (primary.lastHintReason || '')
    };
  }

  function mergeWordRecords(primaryWord, incomingWord) {
    const mergedReview = mergeReviewState(primaryWord?.review, incomingWord?.review);
    const mergedSkillMap = mergeSkillMaps(primaryWord?.skillMap || primaryWord?.review?.skillMap || {}, incomingWord?.skillMap || incomingWord?.review?.skillMap || {});
    const mergedSentences = mergeSentenceBanks(primaryWord?.personalSentences || primaryWord?.review?.personalSentences || [], incomingWord?.personalSentences || incomingWord?.review?.personalSentences || []);
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
      review: mergedReview,
      skillMap: mergedSkillMap,
      personalSentences: mergedSentences
    });
  }

  async function loadState() {
    const result = await storage.get({ vocab: [], stats: { coins: 0 }, recoveryVault: null, vm_settings: INTEGRATED_DEFAULT_SETTINGS });
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
    state.settings = normalizeSettings(result.vm_settings || INTEGRATED_DEFAULT_SETTINGS);
    updateStreakStats();
    changed = changed || JSON.stringify(result.stats || {}) !== JSON.stringify(state.stats);
    changed = changed || JSON.stringify(result.vm_settings || {}) !== JSON.stringify(state.settings);

    if (changed) {
      await persistState();
    }
  }

  function getRequestedQuickLaunch() {
    const quick = new URLSearchParams(window.location.search).get('quick');
    return String(quick || '').trim().toLowerCase();
  }

  function maybeConsumeRequestedQuickLaunch() {
    const quick = getRequestedQuickLaunch();
    if (!quick || state._quickLaunchConsumed) return;
    state._quickLaunchConsumed = true;
    if (!state.vocab.length) return;
    showView('review-dashboard-view');
    initReviewView();
    if (quick === 'rescue') {
      if (getWordsForSet(byId('reviewSetDropdown')?.value || 'all').some(isDueWord)) startTargetedFocus('due');
      else startRecommendedStudy();
      return;
    }
    if (quick === 'weak') {
      if (getWordsForSet(byId('reviewSetDropdown')?.value || 'all').some(isWeakWord)) startTargetedFocus('weak');
      else startRecommendedStudy();
      return;
    }
    if (quick === 'new') {
      if (getWordsForSet(byId('reviewSetDropdown')?.value || 'all').some(isNewWord)) startTargetedFocus('new');
      else startRecommendedStudy();
      return;
    }
    if (quick === 'contrast') {
      startContrastLane(byId('reviewSetDropdown')?.value || 'all');
      return;
    }
    if (quick === 'cloze') {
      startSentenceBankClozeSession(byId('reviewSetDropdown')?.value || 'all');
    }
  }

  function ensureIntegratedUIChrome() {
    injectContrastModeCard();
    enhanceDictationModeView();
    ensureSentenceBankPanel();
  }

  function injectContrastModeCard() {
    const grid = document.querySelector('.learning-mode-grid');
    if (!grid || grid.querySelector('[data-game="contrast"]')) return;
    const card = document.createElement('button');
    card.className = 'vibrant-card mode-lab-card card-amber';
    card.dataset.game = 'contrast';
    card.innerHTML = `
      <div class="mode-card-head">
        <div class="v-icon">⇄</div>
        <div>
          <span class="mode-mini-label">${escapeHtml(uiText('Cặp dễ nhầm', 'Contrast lane', 'Contrast lane'))}</span>
          <h3>${escapeHtml(uiText('Phân biệt', 'Contrast', 'Contrast'))}</h3>
        </div>
      </div>
      <p class="mode-card-copy">${escapeHtml(uiText('Đẩy các từ dễ nhầm vào cùng một làn để tách rõ nghĩa, ngữ cảnh và mặt chữ.', 'Pull confusing words into one lane so meaning, context, and form separate more cleanly.', 'Pull confusing words into one lane so meaning, context, and form separate more cleanly.'))}</p>
      <div class="mode-card-metrics"><span>Confusion repair</span><span>Near pairs</span></div>
      <div class="mode-card-when">${escapeHtml(uiText('Dùng khi: bạn hay chọn sai giữa các từ gần nghĩa hoặc gần hình thức.', 'Use when near-meaning or near-form words blur together.', 'Use when near-meaning or near-form words blur together.'))}</div>
      <div class="mode-card-footer">
        <span class="mode-chip-neutral">${escapeHtml(uiText('Tách cặp', 'Pair split', 'Pair split'))}</span>
        <span class="v-badge" data-badge="contrast">0 lane</span>
      </div>
    `;
    grid.appendChild(card);
  }

  function enhanceDictationModeView() {
    const container = document.querySelector('#dictation-mode-view .typing-container');
    const audioBox = byId('playAudioBtn');
    if (!container || !audioBox || byId('dictationPromptPanel')) return;
    const row = document.createElement('div');
    row.className = 'dictation-audio-row';
    audioBox.parentNode?.insertBefore(row, audioBox);
    row.appendChild(audioBox);

    const extraButtons = document.createElement('div');
    extraButtons.className = 'dictation-audio-actions';
    extraButtons.innerHTML = `
      <button id="playAudioSlowBtn" class="secondary-btn" type="button">🐢 ${escapeHtml(uiText('Chậm hơn', 'Slow replay', 'Slow replay'))}</button>
      <button id="playContrastAudioBtn" class="secondary-btn hidden" type="button">⇄ ${escapeHtml(uiText('So âm gần', 'Contrast audio', 'Contrast audio'))}</button>
    `;
    row.appendChild(extraButtons);

    const panel = document.createElement('div');
    panel.id = 'dictationPromptPanel';
    panel.className = 'dictation-prompt-panel panel-card';
    panel.innerHTML = `
      <div class="dictation-prompt-top">
        <span id="dictationPromptModeChip" class="mode-info-chip">${escapeHtml(uiText('Word dictation', 'Word dictation', 'Word dictation'))}</span>
        <span id="dictationPromptSourceChip" class="mode-info-chip muted-chip">${escapeHtml(uiText('Từ hiện tại', 'Current word', 'Current word'))}</span>
      </div>
      <div id="dictationPromptHelp" class="dictation-prompt-help">${escapeHtml(uiText('Nghe và gõ lại thứ bạn vừa nghe.', 'Listen and type what you hear.', 'Listen and type what you hear.'))}</div>
      <div id="dictationPromptText" class="dictation-prompt-text">${escapeHtml(uiText('Khi có câu ví dụ hoặc câu tự viết, hệ thống sẽ đổi giữa word / cloze / sentence dictation.', 'When examples or saved sentences exist, the system rotates between word, cloze, and sentence dictation.', 'When examples or saved sentences exist, the system rotates between word, cloze, and sentence dictation.'))}</div>
    `;
    row.insertAdjacentElement('afterend', panel);
  }

  function ensureSentenceBankPanel() {
    const setDetails = byId('set-details-view');
    const anchor = byId('setDetailsTableContainer');
    if (!setDetails || !anchor || byId('sentenceBankPanel')) return;
    const panel = document.createElement('section');
    panel.id = 'sentenceBankPanel';
    panel.className = 'panel-card sentence-bank-panel';
    anchor.insertAdjacentElement('afterend', panel);
  }

  function bindIntegratedEvents() {
    if (document.body.dataset.vmIntegratedBound === 'true') return;
    document.body.dataset.vmIntegratedBound = 'true';

    document.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.closest('#activeUseSaveBtn')) {
        saveActiveUseSentence();
        return;
      }
      if (target.closest('#activeUseClearBtn')) {
        clearActiveUseDraft();
        return;
      }
      if (target.closest('#playAudioSlowBtn')) {
        const prompt = state.dictationPrompt;
        if (prompt?.spokenText) speakStudyText(prompt.spokenText, { rate: 0.72 });
        return;
      }
      if (target.closest('#playContrastAudioBtn')) {
        const prompt = state.dictationPrompt;
        if (prompt?.contrastWord) playContrastAudioSequence(state.studyQueue[state.currentCardIdx]?.word || '', prompt.contrastWord);
        return;
      }
      const sentenceAction = target.closest('[data-sentence-bank-action]');
      if (sentenceAction) {
        handleSentenceBankAction(sentenceAction.dataset.sentenceBankAction || '');
      }
    });
  }

  function renderIntegratedUITexts() {
    const contrastCard = document.querySelector('[data-game="contrast"]');
    if (contrastCard) {
      const label = contrastCard.querySelector('.mode-mini-label');
      const title = contrastCard.querySelector('h3');
      const copy = contrastCard.querySelector('.mode-card-copy');
      const when = contrastCard.querySelector('.mode-card-when');
      const chip = contrastCard.querySelector('.mode-chip-neutral');
      if (label) label.textContent = uiText('Cặp dễ nhầm', 'Contrast lane', 'Contrast lane');
      if (title) title.textContent = uiText('Phân biệt', 'Contrast', 'Contrast');
      if (copy) copy.textContent = uiText('Đẩy các từ dễ nhầm vào cùng một làn để tách rõ nghĩa, ngữ cảnh và mặt chữ.', 'Pull confusing words into one lane so meaning, context, and form separate more cleanly.', 'Pull confusing words into one lane so meaning, context, and form separate more cleanly.');
      if (when) when.textContent = uiText('Dùng khi: bạn hay chọn sai giữa các từ gần nghĩa hoặc gần hình thức.', 'Use when near-meaning or near-form words blur together.', 'Use when near-meaning or near-form words blur together.');
      if (chip) chip.textContent = uiText('Tách cặp', 'Pair split', 'Pair split');
    }
    const slowBtn = byId('playAudioSlowBtn');
    const contrastBtn = byId('playContrastAudioBtn');
    if (slowBtn) slowBtn.textContent = `🐢 ${uiText('Chậm hơn', 'Slow replay', 'Slow replay')}`;
    if (contrastBtn && contrastBtn.classList.contains('hidden')) contrastBtn.textContent = `⇄ ${uiText('So âm gần', 'Contrast audio', 'Contrast audio')}`;
  }

  async function init() {
    ensureIntegratedUIChrome();
    ensureSetDoctorPanel();
    ensureMemoryCoachDock();
    bindStaticEvents();
    setupModals();
    ensureAdvancedReviewPanels();
    bindIntegratedEvents();
    await loadState();
    showView(getPreferredInitialView());
    renderAll();
    maybeConsumeRequestedQuickLaunch();
  }

  function renderAll() {
    ensureIntegratedUIChrome();
    initMainView();
    initManagementView();
    initReviewView();
    applyEffectSettings();
    applyLanguageModeUI();
    renderIntegratedUITexts();
    if (state.currentDetailsSet && !byId('set-details-view')?.classList.contains('hidden')) {
      renderSentenceBankPanel(getWordsForSet(state.currentDetailsSet));
    }
  }

  function initReviewView() {
    populateSetDropdown(byId('reviewSetDropdown'), true);
    ensureClusterMissionPanel();
    renderReviewDashboard();
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
    renderSentenceBankPanel(words);
  }

  function renderIntegratedReviewSignals() {
    const setName = byId('reviewSetDropdown')?.value || 'all';
    const words = getWordsForSet(setName);
    const contrastQueue = getContrastQueue(words, 10);
    const contrastBadge = document.querySelector('[data-badge="contrast"]');
    if (contrastBadge) {
      contrastBadge.textContent = contrastQueue.length
        ? uiText(`${contrastQueue.length} cặp`, `${contrastQueue.length} pairs`, `${contrastQueue.length} pairs`)
        : uiText('0 cặp', '0 pairs', '0 pairs');
    }
  }

  function renderReviewInsights(words) {
    const panel = byId('reviewInsightPanel');
    if (!panel) return;
    const weakTypes = getWeakTypeStats(words).slice(0, 3);
    const logs = getRecentLogs(4);
    const dueSoon = [...words].filter(word => word.review?.dueAt && word.review.dueAt > Date.now())
      .sort((a, b) => a.review.dueAt - b.review.dueAt)
      .slice(0, 3);
    const weakestSkill = getWeakestSkillAcrossWords(words);
    const skillSummary = summarizeSkillCoverage(words).filter(item => item.count > 0).slice(0, 4);

    panel.innerHTML = '';

    const weakCard = document.createElement('div');
    weakCard.className = 'insight-card';
    weakCard.innerHTML = `<div class="insight-label">${escapeHtml(uiText('Điểm yếu nổi bật', 'Weak spots', 'Weak spots'))}</div><div class="insight-note">${escapeHtml(weakTypes.length ? uiText('Ưu tiên kéo các nhóm này lên bằng Flashcard hoặc Gõ từ.', 'Pull these groups up first with Flashcard or Typing.', 'Pull these groups up first with Flashcard or Typing.') : uiText('Chưa có nhóm yếu nổi bật, nhịp học đang ổn.', 'No dominant weak group right now.', 'No dominant weak group right now.'))}</div>`;
    const weakList = document.createElement('ul');
    (weakTypes.length ? weakTypes : [[uiText('Chưa có nhóm nào', 'No clear group', 'No clear group'), 0]]).forEach(([label, count]) => {
      const li = document.createElement('li');
      li.textContent = count ? `${label}: ${count} từ` : String(label);
      weakList.appendChild(li);
    });
    weakCard.appendChild(weakList);
    panel.appendChild(weakCard);

    const dueCard = document.createElement('div');
    dueCard.className = 'insight-card';
    dueCard.innerHTML = `<div class="insight-label">${escapeHtml(uiText('Sắp đến hạn', 'Due soon', 'Due soon'))}</div><div class="insight-note">${escapeHtml(uiText('Những từ này nên được ôn trước khi chuyển sang học mới.', 'Review these before opening new learning.', 'Review these before opening new learning.'))}</div>`;
    const dueList = document.createElement('ul');
    (dueSoon.length ? dueSoon : [{ word: '—', meaning: uiText('Chưa có từ nào sắp đến hạn', 'Nothing is due soon yet', 'Nothing is due soon yet'), review: { dueAt: 0 } }]).forEach(word => {
      const li = document.createElement('li');
      li.textContent = word.word === '—' ? word.meaning : `${word.word} • ${word.meaning} • ${formatRelativeDue(word.review.dueAt)}`;
      dueList.appendChild(li);
    });
    dueCard.appendChild(dueList);
    panel.appendChild(dueCard);

    const skillCard = document.createElement('div');
    skillCard.className = 'insight-card';
    skillCard.innerHTML = `<div class="insight-label">${escapeHtml(uiText('Kênh học đang yếu', 'Skill lanes', 'Skill lanes'))}</div><div class="insight-note">${escapeHtml(weakestSkill ? uiText(`Kênh yếu nhất hiện tại là ${getSkillLabel(weakestSkill.key)}.`, `The weakest learning lane right now is ${getSkillLabel(weakestSkill.key)}.`, `The weakest learning lane right now is ${getSkillLabel(weakestSkill.key)}.`) : uiText('Khi bạn bắt đầu học qua nhiều mode, app sẽ tách tín hiệu theo recognition / spelling / listening / usage.', 'As you use more modes, the app will split signals into recognition, spelling, listening, and usage.', 'As you use more modes, the app will split signals into recognition, spelling, listening, and usage.'))}</div>`;
    const skillList = document.createElement('ul');
    (skillSummary.length ? skillSummary : [{ key: 'recognition', average: 0, count: 0 }]).forEach(item => {
      const li = document.createElement('li');
      li.textContent = item.count
        ? `${getSkillLabel(item.key)} • ${item.average}/4`
        : uiText('Chưa có dữ liệu phân kênh', 'No skill-lane data yet', 'No skill-lane data yet');
      skillList.appendChild(li);
    });
    skillCard.appendChild(skillList);
    panel.appendChild(skillCard);

    const logCard = document.createElement('div');
    logCard.className = 'insight-card';
    logCard.innerHTML = `<div class="insight-label">${escapeHtml(uiText('Lượt học gần đây', 'Recent sessions', 'Recent sessions'))}</div><div class="insight-note">${escapeHtml(uiText('Xem nhanh nhịp ôn tập để giữ sự đều đặn.', 'A quick glance at cadence keeps your review consistent.', 'A quick glance at cadence keeps your review consistent.'))}</div>`;
    const logList = document.createElement('ul');
    (logs.length ? logs : [{ game: '', total: 0, dateLabel: uiText('Hãy bắt đầu bằng một vòng ôn ngắn', 'Start with a short review round', 'Start with a short review round') }]).forEach(entry => {
      const li = document.createElement('li');
      li.textContent = entry.total ? `${entry.game} • ${entry.total} lượt • ${entry.dateLabel}` : entry.dateLabel;
      logList.appendChild(li);
    });
    logCard.appendChild(logList);
    panel.appendChild(logCard);
  }

  function getContrastCandidatesForWord(card, pool = state.optionPool?.length ? state.optionPool : state.vocab, limit = 3) {
    const upgradeData = window.VMUpgradeData || {};
    const confusionBank = upgradeData.CONFUSION_BANK || {};
    const compareSet = new Set(extractCompareCandidates(confusionBank[normalizeAnswer(card?.word)]?.compare || '').map(item => normalizeAnswer(item)));
    compareSet.delete(normalizeAnswer(card?.word));
    const basePool = (Array.isArray(pool) ? pool : [])
      .filter(item => item?.id && item.id !== card?.id)
      .filter((item, index, arr) => arr.findIndex(other => other.id === item.id) === index);
    const scored = basePool.map(item => {
      const normalizedWord = normalizeAnswer(item.word || '');
      let score = getWordSimilarityScore(card, item) * 70;
      if (compareSet.has(normalizedWord)) score += 140;
      if (getConceptFamilyKey(item) === getConceptFamilyKey(card)) score += 26;
      if (normalizeAnswer(item.wordType || '') === normalizeAnswer(card.wordType || '')) score += 12;
      return { item, score };
    }).filter(entry => entry.score >= 18).sort((a, b) => b.score - a.score);
    return scored.slice(0, Math.max(1, limit)).map(entry => entry.item);
  }

  function getContrastQueue(words, limit = 10) {
    const candidates = words.filter(word => getContrastCandidatesForWord(word, words, 1).length > 0);
    const base = candidates.length ? candidates : words.filter(word => calculateForgettingRisk(word) >= 55 || isWeakWord(word));
    return diversifyStudyQueue(buildCoverageQueue(base, Math.min(base.length || words.length, Math.max(4, limit)), 'drill'), Math.max(4, limit));
  }

  function getSessionQueue(words, gameType) {
    const maxItems = gameType === 'matching' ? 18 : 20;
    if (gameType === 'srs') return getRecommendedQueue(words, 20);
    if (gameType === 'contrast') return getContrastQueue(words, Math.min(words.length, 10));
    if (gameType === 'typing' || gameType === 'dictation') return buildCoverageQueue(words, Math.min(words.length, 12), 'drill');
    if (gameType === 'flashcard') return buildCoverageQueue(words, Math.min(words.length, maxItems), 'warmup');
    return buildCoverageQueue(shuffle([...words]), Math.min(words.length, maxItems), 'balanced');
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

    const weakestSkill = getWeakestSkillAcrossWords(words);
    if (weakestSkill?.key === 'listening') {
      return {
        gameType: 'dictation',
        title: uiText(`Nghe viết • ${Math.min(words.length, 10)} lượt nghe`, `Dictation • ${Math.min(words.length, 10)} listening reps`, `Dictation • ${Math.min(words.length, 10)} listening reps`),
        reason: uiText('Kênh nghe đang là điểm yếu nhất, nên dictation sẽ sửa link âm → chữ nhanh nhất.', 'Listening is currently the weakest lane, so dictation is the fastest fix.', 'Listening is currently the weakest lane, so dictation is the fastest fix.')
      };
    }
    if (weakestSkill?.key === 'confusion' && getContrastQueue(words, 10).length >= 4) {
      return {
        gameType: 'contrast',
        title: uiText(`Contrast Lane • ${Math.min(getContrastQueue(words, 10).length, 10)} cặp`, `Contrast Lane • ${Math.min(getContrastQueue(words, 10).length, 10)} pairs`, `Contrast Lane • ${Math.min(getContrastQueue(words, 10).length, 10)} pairs`),
        reason: uiText('Nhầm lẫn giữa các từ gần nhau đang nổi bật, nên contrast lane nên mở trước.', 'Confusion between near words is becoming the main issue, so contrast lane should open first.', 'Confusion between near words is becoming the main issue, so contrast lane should open first.')
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
    const setName = byId('reviewSetDropdown')?.value || 'all';
    const words = getWordsForSet(setName);
    const plan = getRecommendedStudyPlan(words);
    if (!plan.gameType) return showToast(uiText('Hãy thêm vài từ trước khi bắt đầu học.', 'Add a few words before you start learning.', 'Add a few words before you start learning.'));
    if (plan.gameType === 'contrast') {
      startContrastLane(setName);
      return;
    }
    startGame(plan.gameType, setName, { planTitle: plan.title, planReason: plan.reason, queue: plan.gameType === 'srs' ? getRecommendedQueue(words, 20) : undefined });
  }

  function startContrastLane(setName = byId('reviewSetDropdown')?.value || 'all') {
    const words = getWordsForSet(setName);
    const queue = getContrastQueue(words, 10);
    if (queue.length < 4) return showToast(uiText('Contrast lane cần ít nhất 4 mục có vùng dễ nhầm.', 'Contrast lane needs at least 4 confusion-linked items.', 'Contrast lane needs at least 4 confusion-linked items.'));
    startGame('contrast', setName, {
      queue,
      planTitle: uiText('Contrast Lane', 'Contrast Lane', 'Contrast Lane'),
      planReason: uiText('Tách rõ các từ gần nghĩa hoặc gần hình thức trước khi chúng nhập làm một.', 'Separate near-meaning or near-form words before they merge together.', 'Separate near-meaning or near-form words before they merge together.')
    });
  }

  function startSentenceBankClozeSession(setName = state.currentDetailsSet || byId('reviewSetDropdown')?.value || 'all') {
    const words = getWordsForSet(setName).filter(word => getWordSentenceBank(word).length > 0);
    const queue = diversifyStudyQueue(words, Math.min(words.length, 12));
    if (!queue.length) return showToast(uiText('Hãy lưu vài câu của chính bạn trước khi mở cloze review.', 'Save a few of your own sentences before opening cloze review.', 'Save a few of your own sentences before opening cloze review.'));
    startGame('quiz', setName, {
      queue,
      forceQuizMode: 'context',
      planTitle: uiText('Cloze Review', 'Cloze Review', 'Cloze Review'),
      planReason: uiText('Dùng câu ví dụ và câu tự viết để kéo từ vào ngữ cảnh thật.', 'Use examples and your own sentences to pull the word into real context.', 'Use examples and your own sentences to pull the word into real context.')
    });
  }

  function startGame(gameType, setName, options = {}) {
    const words = getWordsForSet(setName);
    const queue = Array.isArray(options.queue) && options.queue.length ? options.queue : getSessionQueue(words, gameType);
    if (!queue.length) return showToast(uiText('Bộ từ này đang trống.', 'This set is empty.', 'This set is empty.'));

    state.activeSet = setName;
    state.currentGame = gameType;
    hideStudySupport();
    hideMemoryCoach();
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

    if ((gameType === 'quiz' || gameType === 'contrast') && queue.length < 4) return showToast(uiText('Chế độ này cần ít nhất 4 từ.', 'This mode needs at least 4 items.', 'This mode needs at least 4 items.'));
    if (gameType === 'matching' && queue.length < 4) return showToast(uiText('Nối cặp cần ít nhất 4 từ.', 'Matching needs at least 4 items.', 'Matching needs at least 4 items.'));

    state.studyQueue = queue;

    if (gameType === 'quiz') {
      if (options.forceQuizMode) {
        state.activeQuizMode = options.forceQuizMode;
        closeModal('quizModeModal');
        showView('quiz-mode-view');
        renderQuiz();
        return;
      }
      openModal('quizModeModal');
      return;
    }

    if (gameType === 'contrast') {
      state.activeQuizMode = 'contrast';
      showView('quiz-mode-view');
      renderQuiz();
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

  function getContrastPartnerWord(card) {
    return getContrastCandidatesForWord(card, state.optionPool?.length ? state.optionPool : state.vocab, 1)[0] || null;
  }

  function buildMaskedSentence(sentence = '', word = '') {
    const cleanSentence = String(sentence || '').trim();
    if (!cleanSentence) return '';
    const escaped = escapeRegExp(word || '');
    if (!escaped) return cleanSentence;
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    if (regex.test(cleanSentence)) return cleanSentence.replace(regex, '_____');
    return cleanSentence;
  }

  function getQuizPromptForCard(card) {
    let promptText = card.word;
    let optionTextFor = (item) => item.meaning;
    if (state.activeQuizMode === 'meaning-word') {
      promptText = card.meaning;
      optionTextFor = (item) => item.word;
    } else if (state.activeQuizMode === 'context') {
      const sentence = chooseStudySentence(card, { preferUser: true });
      promptText = sentence ? buildMaskedSentence(sentence.text, card.word) : card.meaning;
      optionTextFor = (item) => item.word;
    } else if (state.activeQuizMode === 'contrast') {
      const sentence = chooseStudySentence(card, { preferUser: true });
      promptText = sentence ? buildMaskedSentence(sentence.text, card.word) : `${card.meaning} • ${uiText('chọn từ đúng nhất', 'choose the best fit', 'choose the best fit')}`;
      optionTextFor = (item) => item.word;
    }
    return { promptText, optionTextFor };
  }

  function getQuizDistractors(card, count = 3) {
    if (state.activeQuizMode === 'contrast') {
      const contrastPool = getContrastCandidatesForWord(card, state.optionPool?.length ? state.optionPool : state.vocab, count + 1);
      if (contrastPool.length >= count) return contrastPool.slice(0, count);
    }
    const basePool = (state.optionPool?.length ? state.optionPool : getWordsForSet(state.activeSet || 'all'))
      .concat(state.vocab)
      .filter((item, index, arr) => item?.id && item.id !== card.id && arr.findIndex(other => other.id === item.id) === index);
    if (!basePool.length) return [];

    const upgradeData = window.VMUpgradeData || {};
    const confusionBank = upgradeData.CONFUSION_BANK || {};
    const compareSet = new Set(extractCompareCandidates(confusionBank[normalizeAnswer(card.word)]?.compare || ''));
    compareSet.delete(normalizeAnswer(card.word));
    const cardTags = new Set((card.topicTags || []).map(tag => normalizeAnswer(tag)).filter(Boolean));
    const cardType = normalizeAnswer(card.wordType || '');
    const meaningTokens = tokenizeSuggestionText(card.meaning || '');
    const promptMode = state.activeQuizMode;

    const scored = basePool.map(item => {
      const normalizedWord = normalizeAnswer(item.word || '');
      const itemTags = (item.topicTags || []).map(tag => normalizeAnswer(tag));
      const sameTopic = itemTags.some(tag => cardTags.has(tag));
      const sameType = cardType && normalizeAnswer(item.wordType || '') === cardType;
      const sameEntryType = (item.entryType || 'word') === (card.entryType || 'word');
      const meaningOverlap = getTokenOverlap(meaningTokens, tokenizeSuggestionText(item.meaning || ''));
      let score = getWordSimilarityScore(card, item) * 46;
      if (compareSet.has(normalizedWord)) score += 110;
      if (sameTopic) score += 34;
      if (sameType) score += 24;
      if (sameEntryType) score += 12;
      if (meaningOverlap) score += meaningOverlap * 20;
      if (promptMode === 'context' && chooseStudySentence(item, { preferUser: true })) score += 8;
      return { item, score };
    }).sort((a, b) => b.score - a.score);

    const optionTextFor = (item) => {
      if (promptMode === 'meaning-word' || promptMode === 'context' || promptMode === 'contrast') return normalizeAnswer(item.word || '');
      return normalizeAnswer(item.meaning || '');
    };

    const selected = [];
    const usedOptionTexts = new Set([optionTextFor(card)]);

    for (const { item } of scored) {
      const optionText = optionTextFor(item);
      if (!optionText || usedOptionTexts.has(optionText)) continue;
      if (selected.some(existing => getWordSimilarityScore(existing, item) >= 0.94)) continue;
      selected.push(item);
      usedOptionTexts.add(optionText);
      if (selected.length >= count) break;
    }

    if (selected.length < count) {
      shuffle(basePool).forEach(item => {
        if (selected.length >= count) return;
        const optionText = optionTextFor(item);
        if (!optionText || usedOptionTexts.has(optionText)) return;
        selected.push(item);
        usedOptionTexts.add(optionText);
      });
    }

    return selected.slice(0, count);
  }

  function renderQuiz() {
    const card = state.studyQueue[state.currentCardIdx];
    if (!card) return finishSession(uiText('Đã hoàn thành bài trắc nghiệm.', 'Quiz completed.', 'Quiz completed.'));

    state.answerLocked = false;
    byId('quizProgress').textContent = `${Math.min(state.currentCardIdx + 1, state.studyQueue.length)} / ${state.studyQueue.length}`;
    const { promptText, optionTextFor } = getQuizPromptForCard(card);
    byId('quizQuestionWord').textContent = promptText;
    hideStudySupport();
    hideMemoryCoach();

    const wrongOptions = getQuizDistractors(card, 3);
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
        Array.from(grid.querySelectorAll('button')).forEach(btn => { btn.disabled = true; });

        const correctButton = Array.from(grid.querySelectorAll('button')).find(btn => btn.textContent === optionTextFor(card));
        const failureReason = state.activeQuizMode === 'contrast'
          ? 'confusion'
          : state.activeQuizMode === 'context'
            ? 'confusion'
            : state.activeQuizMode === 'meaning-word'
              ? 'recall'
              : 'meaning';
        if (option.id === card.id) {
          button.classList.add('correct');
          rememberSentenceUsage(card, promptText);
          await recordWordResult(card.id, 'good', 10, true, { failureReason: '', promptType: state.activeQuizMode === 'context' ? 'cloze' : state.activeQuizMode });
          state.currentCardIdx += 1;
          setTimeout(renderQuiz, 650);
        } else {
          button.classList.add('wrong');
          correctButton?.classList.add('correct');
          renderStudySupportForWord(card, failureReason, { autoQueue: true, trigger: state.activeQuizMode === 'contrast' ? 'contrast-wrong' : 'quiz-wrong' });
          await recordWordResult(card.id, 'again', 0, true, { failureReason, promptType: state.activeQuizMode });
          requeueCurrentCard(2);
          setTimeout(renderQuiz, 900);
        }
      });
      grid.appendChild(button);
    });
  }

  function speakStudyText(text, { rate = 0.9, lang = 'en-US' } = {}) {
    if (!('speechSynthesis' in window)) {
      showToast(uiText('Trình duyệt hiện không hỗ trợ phát âm.', 'Speech is not supported in this browser.', 'Speech is not supported in this browser.'));
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    window.speechSynthesis.speak(utterance);
  }

  function playContrastAudioSequence(primaryWord, compareWord) {
    if (!primaryWord || !compareWord) return;
    speakStudyText(`${primaryWord}. ${compareWord}. ${primaryWord}.`, { rate: 0.88 });
  }

  function playWordAudio(wordText) {
    speakStudyText(wordText, { rate: 0.9, lang: 'en-US' });
  }

  function buildDictationPrompt(card) {
    const sentence = chooseStudySentence(card, { preferUser: true });
    const compareWord = getContrastPartnerWord(card)?.word || '';
    if (sentence?.text) {
      const tokenCount = tokenizeSuggestionText(sentence.text).length;
      if (tokenCount >= 5 && sentence.text.length <= 74) {
        return {
          mode: 'sentence',
          spokenText: sentence.text,
          answer: sentence.text,
          promptText: uiText('Nghe và gõ lại toàn bộ câu.', 'Listen and type the full sentence.', 'Listen and type the full sentence.'),
          displayText: sentence.text,
          placeholder: uiText('Gõ lại toàn bộ câu bạn nghe', 'Type the full sentence you hear', 'Type the full sentence you hear'),
          sourceLabel: sentence.source === 'user' ? uiText('Câu của bạn', 'Your sentence', 'Your sentence') : uiText('Ví dụ của bộ từ', 'Set example', 'Set example'),
          contrastWord: compareWord,
          sentenceId: sentence.id
        };
      }
      return {
        mode: 'cloze',
        spokenText: sentence.text,
        answer: card.word,
        promptText: uiText('Nghe câu và điền từ còn thiếu.', 'Listen to the sentence and type the missing word.', 'Listen to the sentence and type the missing word.'),
        displayText: buildMaskedSentence(sentence.text, card.word),
        placeholder: uiText('Gõ từ còn thiếu bạn nghe được', 'Type the missing word you hear', 'Type the missing word you hear'),
        sourceLabel: sentence.source === 'user' ? uiText('Câu của bạn', 'Your sentence', 'Your sentence') : uiText('Ví dụ của bộ từ', 'Set example', 'Set example'),
        contrastWord: compareWord,
        sentenceId: sentence.id
      };
    }
    return {
      mode: 'word',
      spokenText: card.word,
      answer: card.word,
      promptText: uiText('Nghe và gõ lại từ.', 'Listen and type the word.', 'Listen and type the word.'),
      displayText: card.meaning || uiText('Không có neo nghĩa', 'No meaning anchor', 'No meaning anchor'),
      placeholder: uiText('Gõ từ bạn nghe được', 'Type the word you hear', 'Type the word you hear'),
      sourceLabel: uiText('Từ hiện tại', 'Current word', 'Current word'),
      contrastWord: compareWord,
      sentenceId: ''
    };
  }

  function evaluateSentenceAttempt(input, answer) {
    const user = normalizeAnswer(input);
    const correct = normalizeAnswer(answer);
    if (!user || !correct) return 'again';
    if (user === correct) return 'good';
    const distance = levenshteinDistance(user, correct);
    const overlap = getTokenOverlap(tokenizeSuggestionText(user), tokenizeSuggestionText(correct));
    if (overlap >= 0.74 || distance <= Math.max(2, Math.round(correct.length * 0.12))) return 'hard';
    return 'again';
  }

  function renderDictation() {
    const card = state.studyQueue[state.currentCardIdx];
    if (!card) return finishSession(uiText('Đã hoàn thành phần nghe viết.', 'Dictation completed.', 'Dictation completed.'));

    state.answerLocked = false;
    state.dictationPrompt = buildDictationPrompt(card);
    byId('dictationProgress').textContent = `${Math.min(state.currentCardIdx + 1, state.studyQueue.length)} / ${state.studyQueue.length}`;
    byId('dictationInput').value = '';
    byId('dictationInput').placeholder = state.dictationPrompt.placeholder;
    byId('dictationInput').focus();
    const modeChip = byId('dictationPromptModeChip');
    const sourceChip = byId('dictationPromptSourceChip');
    const helpNode = byId('dictationPromptHelp');
    const textNode = byId('dictationPromptText');
    const contrastBtn = byId('playContrastAudioBtn');
    if (modeChip) {
      const labelMap = {
        word: uiText('Word dictation', 'Word dictation', 'Word dictation'),
        cloze: uiText('Cloze dictation', 'Cloze dictation', 'Cloze dictation'),
        sentence: uiText('Sentence dictation', 'Sentence dictation', 'Sentence dictation')
      };
      modeChip.textContent = labelMap[state.dictationPrompt.mode] || 'Word dictation';
    }
    if (sourceChip) sourceChip.textContent = state.dictationPrompt.sourceLabel;
    if (helpNode) helpNode.textContent = state.dictationPrompt.promptText;
    if (textNode) textNode.textContent = state.dictationPrompt.displayText;
    if (contrastBtn) {
      contrastBtn.textContent = `⇄ ${uiText('So âm gần', 'Contrast audio', 'Contrast audio')}`;
      contrastBtn.classList.toggle('hidden', !state.dictationPrompt.contrastWord);
    }
    speakStudyText(state.dictationPrompt.spokenText, { rate: 0.92 });
    hideStudySupport();
    hideMemoryCoach();
  }

  async function handleDictationSubmit() {
    const card = state.studyQueue[state.currentCardIdx];
    const prompt = state.dictationPrompt;
    if (!card || !prompt || state.answerLocked) return;

    const input = byId('dictationInput');
    const answer = input.value.trim();
    if (!answer) return;

    state.answerLocked = true;
    const verdict = prompt.mode === 'sentence'
      ? evaluateSentenceAttempt(answer, prompt.answer)
      : evaluateWordAttempt(answer, prompt.answer);
    if (verdict === 'good') {
      rememberSentenceUsage(card, prompt.spokenText);
      await recordWordResult(card.id, 'good', 15, true, { failureReason: '', promptType: prompt.mode, skills: prompt.mode === 'sentence' ? ['listening', 'spelling', 'usage'] : prompt.mode === 'cloze' ? ['listening', 'spelling', 'usage'] : ['listening', 'spelling'] });
      showToast(uiText('Nghe viết đúng!', 'Correct dictation!', 'Correct dictation!'));
      state.currentCardIdx += 1;
      setTimeout(renderDictation, 650);
    } else if (verdict === 'hard') {
      renderStudySupportForWord(card, 'listening', { autoQueue: false, trigger: 'dictation-hard' });
      await recordWordResult(card.id, 'hard', 6, true, { failureReason: 'listening', promptType: prompt.mode, skills: prompt.mode === 'sentence' ? ['listening', 'spelling', 'usage'] : ['listening', 'spelling'] });
      showToast(prompt.mode === 'sentence'
        ? uiText(`Gần đúng. Câu chuẩn là “${prompt.answer}”.`, `Close. The correct sentence is “${prompt.answer}”.`, `Close. The correct sentence is “${prompt.answer}”.`)
        : uiText(`Bạn gõ rất gần đúng. Từ chuẩn là “${prompt.answer}”.`, `Very close. The correct form is “${prompt.answer}”.`, `Very close. The correct form is “${prompt.answer}”.`));
      state.currentCardIdx += 1;
      setTimeout(renderDictation, 760);
    } else {
      renderStudySupportForWord(card, 'listening', { autoQueue: true, trigger: 'dictation-again' });
      await recordWordResult(card.id, 'again', 0, true, { failureReason: 'listening', promptType: prompt.mode, skills: prompt.mode === 'sentence' ? ['listening', 'spelling', 'usage'] : ['listening', 'spelling'] });
      requeueCurrentCard(2);
      input.classList.add('shake-error');
      showToast(prompt.mode === 'sentence'
        ? uiText(`Sai rồi. Câu đúng là “${prompt.answer}”.`, `Not quite. The correct sentence is “${prompt.answer}”.`, `Not quite. The correct sentence is “${prompt.answer}”.`)
        : uiText(`Sai rồi. Đáp án đúng là “${prompt.answer}”.`, `Not quite. The correct answer is “${prompt.answer}”.`, `Not quite. The correct answer is “${prompt.answer}”.`));
      setTimeout(() => {
        input.classList.remove('shake-error');
        renderDictation();
      }, 900);
    }
  }

  function getHintIntervalMultiplier(hintPenalty = 0) {
    const clamped = Math.max(0, Math.min(3, Number(hintPenalty) || 0));
    return [1, 0.86, 0.7, 0.56][clamped] || 1;
  }

  function recordHintUsage(card, reason = 'recall') {
    const word = state.vocab.find(item => item.id === card?.id);
    if (!word) return;
    word.review = normalizeIntegratedReview(word.review);
    word.review.hintCount += 1;
    word.review.hintPenalty = Math.min(3, word.review.hintPenalty + 1);
    word.review.lastHintAt = Date.now();
    word.review.lastHintReason = reason;
  }

  async function recordWordResult(wordId, quality, coinGain = 0, persistImmediately = true, detail = {}) {
    const word = state.vocab.find(item => item.id === wordId);
    if (!word) return;

    const now = Date.now();
    const previousConfidence = getConfidenceValue(word);
    word.review = normalizeIntegratedReview(word.review);
    word.skillMap = normalizeSkillMap(word.skillMap);
    word.personalSentences = normalizeSentenceBank(word.personalSentences);

    const effectiveHintPenalty = Math.max(0, Math.min(3, Number(word.review.hintPenalty) || 0));
    const effectiveQuality = quality === 'good' && effectiveHintPenalty >= 2 ? 'hard' : quality;
    word.review.seenCount += 1;
    word.review.lastReviewedAt = now;
    word.review.lastSeenGame = detail.gameType || state.currentGame || '';

    if (effectiveQuality === 'again') {
      word.review.streak = 0;
      word.review.wrongCount += 1;
      word.review.lapseCount += 1;
      word.review.confidence = clampConfidence(Math.max(0, word.review.confidence - 1));
      word.review.dueAt = now + (10 + effectiveHintPenalty * 5) * 60 * 1000;
      word.review.lastFailureAt = now;
      word.review.lastFailureReason = detail.failureReason || inferFailureReasonFromGame(detail.gameType || state.currentGame);
      word.review.hintPenalty = Math.min(3, effectiveHintPenalty + 1);
      recordFailureReason(word.review.lastFailureReason, word, detail.gameType || state.currentGame);
      word.isLearned = false;
    } else if (effectiveQuality === 'hard') {
      word.review.correctCount += 1;
      word.review.hardCount += 1;
      word.review.streak = Math.max(1, word.review.streak);
      word.review.confidence = clampConfidence(Math.max(1, word.review.confidence));
      if (detail.failureReason) word.review.lastFailureReason = detail.failureReason;
      const confidenceIntervals = [0.25, 0.5, 1, 2, 4];
      const intervalDays = confidenceIntervals[word.review.confidence] || 0.5;
      word.review.dueAt = now + intervalDays * getHintIntervalMultiplier(effectiveHintPenalty) * DAY_MS;
      word.review.hintPenalty = Math.max(0, effectiveHintPenalty - 1);
    } else {
      word.review.correctCount += 1;
      word.review.streak += 1;
      word.review.confidence = clampConfidence(word.review.confidence + 1);
      word.review.lastFailureReason = '';
      const confidenceIntervals = [0.5, 1, 3, 6, 10];
      const intervalDays = confidenceIntervals[word.review.confidence] || 1;
      word.review.dueAt = now + intervalDays * getHintIntervalMultiplier(effectiveHintPenalty) * DAY_MS;
      word.review.hintPenalty = Math.max(0, effectiveHintPenalty - 1);
    }

    updateSkillMapForResult(word, effectiveQuality, detail);
    word.review.confidence = deriveConfidenceValue(word.review, Boolean(word.isLearned), word.skillMap);
    word.isLearned = getConfidenceValue(word) >= 4;

    if (coinGain) state.stats.coins += coinGain;
    recordDailyOutcome(effectiveQuality);

    if (state.sessionStats) {
      state.sessionStats[effectiveQuality] += 1;
      if (getConfidenceValue(word) > previousConfidence) state.sessionStats.strengthened += 1;
    }

    if (persistImmediately) {
      await persistState();
      if (!byId('review-dashboard-view').classList.contains('hidden')) initReviewView();
      if (!byId('management-view').classList.contains('hidden')) initManagementView();
      if (!byId('set-details-view').classList.contains('hidden') && state.currentDetailsSet === word.wordset) {
        renderSentenceBankPanel(getWordsForSet(state.currentDetailsSet));
      }
    }
  }

  function ensureMemoryCoachDock() {
    if (byId('memoryCoachDock')) return;
    const dock = document.createElement('section');
    dock.id = 'memoryCoachDock';
    dock.className = 'memory-coach-dock hidden';
    dock.innerHTML = `
      <div class="coach-head">
        <div>
          <span class="support-kicker">${escapeHtml(uiText('Gợi nhớ từng bước', 'Memory Coach', 'Memory Coach'))}</span>
          <h3 id="memoryCoachTitle">${escapeHtml(uiText('Bậc gợi nhớ', 'Retrieval Ladder', 'Retrieval Ladder'))}</h3>
          <p id="memoryCoachLead" class="muted-text">${escapeHtml(uiText('Mở từng gợi ý nhỏ trước, rồi mới dùng hỗ trợ sâu hơn nếu vẫn bí.', 'Reveal one small cue at a time before using heavier support.', 'Reveal one small cue at a time before using heavier support.'))}</p>
        </div>
        <div class="coach-head-actions">
          <button id="memoryHintAdvanceBtn" class="secondary-btn">${escapeHtml(uiText('Mở gợi ý kế', 'Reveal next cue', 'Reveal next cue'))}</button>
          <button id="memoryHintRescueBtn" class="primary-btn">${escapeHtml(uiText('Gợi ý từ liên quan', 'Related word help', 'Related word help'))}</button>
        </div>
      </div>
      <div class="memory-coach-grid">
        <article class="coach-card hint-card">
          <div class="coach-card-top">
            <span class="coach-label">${escapeHtml(uiText('Bậc gợi nhớ', 'Retrieval Ladder', 'Retrieval Ladder'))}</span>
            <span id="hintLadderProgress" class="coach-badge">0/0</span>
          </div>
          <div id="hintLadderIntro" class="coach-note"></div>
          <ol id="hintLadderList" class="hint-ladder-list"></ol>
        </article>
        <article class="coach-card context-card hidden">
          <div class="coach-card-top">
            <span class="coach-label">${escapeHtml(uiText('Ngữ cảnh', 'Context Replay', 'Context Replay'))}</span>
          </div>
          <div id="contextReplayGrid" class="context-replay-grid"></div>
        </article>
        <article class="coach-card active-use-card hidden">
          <div class="coach-card-top">
            <span class="coach-label">${escapeHtml(uiText('Dùng ngay', 'Use It Now', 'Use It Now'))}</span>
          </div>
          <div id="activeUsePrompt" class="active-use-prompt"></div>
          <textarea id="activeUseSentenceInput" class="modern-input active-use-textarea" rows="3" placeholder="Write a short sentence with this word"></textarea>
          <input id="activeUseMeaningInput" class="modern-input active-use-gloss" type="text" placeholder="Optional gloss in Vietnamese">
          <div class="active-use-actions">
            <button id="activeUseSaveBtn" class="primary-btn" type="button">${escapeHtml(uiText('Lưu vào Sentence Bank', 'Save to Sentence Bank', 'Save to Sentence Bank'))}</button>
            <button id="activeUseClearBtn" class="secondary-btn" type="button">${escapeHtml(uiText('Xóa nháp', 'Clear draft', 'Clear draft'))}</button>
          </div>
          <div id="activeUseSavedPreview" class="active-use-preview hidden"></div>
          <p id="activeUseNote" class="coach-note"></p>
        </article>
      </div>`;
    const supportDock = byId('studySupportDock');
    if (supportDock?.parentNode) supportDock.insertAdjacentElement('beforebegin', dock);
  }

  function renderActiveUsePreview(card) {
    const preview = byId('activeUseSavedPreview');
    if (!preview) return;
    const sentences = normalizeSentenceBank(card?.personalSentences || []).slice(0, 2);
    if (!sentences.length) {
      preview.classList.add('hidden');
      preview.innerHTML = '';
      return;
    }
    preview.classList.remove('hidden');
    preview.innerHTML = sentences.map(sentence => `
      <div class="active-use-preview-item">
        <strong>${escapeHtml(sentence.text)}</strong>
        <span>${escapeHtml(sentence.gloss || uiText('Chưa có giải nghĩa', 'No gloss yet', 'No gloss yet'))}</span>
      </div>
    `).join('');
  }

  function renderMemoryCoach(card, reason = state.hintLadder?.reason || inferFailureReasonFromGame(state.currentGame)) {
    ensureMemoryCoachDock();
    const dock = byId('memoryCoachDock');
    const ladderList = byId('hintLadderList');
    const progress = byId('hintLadderProgress');
    const intro = byId('hintLadderIntro');
    const contextGrid = byId('contextReplayGrid');
    const prompt = byId('activeUsePrompt');
    const note = byId('activeUseNote');
    const title = byId('memoryCoachTitle');
    const lead = byId('memoryCoachLead');
    const advanceBtn = byId('memoryHintAdvanceBtn');
    const rescueBtn = byId('memoryHintRescueBtn');
    const sentenceInput = byId('activeUseSentenceInput');
    const glossInput = byId('activeUseMeaningInput');
    const contextCard = dock?.querySelector('.context-card');
    const activeUseCard = dock?.querySelector('.active-use-card');
    if (!dock || !ladderList || !progress || !contextGrid || !prompt || !note || !title || !lead || !advanceBtn || !rescueBtn || !card) return;

    const ladder = getHintLadderState(card, reason);
    const hints = buildHintSequence(card, reason);
    const revealed = Math.min(ladder.level, hints.length);
    const visibleHints = hints.slice(0, revealed);
    const nextHint = revealed < hints.length ? hints[revealed] : null;
    const showContext = revealed >= 3;
    const showActiveUse = revealed >= hints.length;

    title.textContent = `${uiText('Bậc gợi nhớ', 'Retrieval Ladder', 'Retrieval Ladder')} • ${card.word}`;
    lead.textContent = `${getFailureReasonLead(reason, card)} • ${getSkillHeadline(card)}`;
    intro.textContent = uiText('Chỉ hiện những gợi ý bạn đã mở. Mỗi lần mở thêm phải giúp gọi lại tốt hơn, không làm bạn lười nhớ.', 'Only the cues you have actually opened are shown. Each extra cue should support recall, not replace it.', 'Only opened cues are shown so recall stays active.');
    progress.textContent = `${revealed}/${hints.length}`;
    ladderList.innerHTML = [
      ...visibleHints.map((hint, index) => `
        <li class="hint-step revealed">
          <span class="hint-step-index">${index + 1}</span>
          <div>
            <strong>${escapeHtml(hint.label)}</strong>
            <span>${escapeHtml(hint.value)}</span>
          </div>
        </li>
      `),
      nextHint ? `
        <li class="hint-step next-cue">
          <span class="hint-step-index">${revealed + 1}</span>
          <div>
            <strong>${escapeHtml(nextHint.label)}</strong>
            <span>${escapeHtml(uiText('Chưa mở', 'Locked', 'Locked'))}</span>
          </div>
        </li>
      ` : ''
    ].join('');

    const contextItems = [
      { label: uiText('Ví dụ', 'Example', 'Example'), value: card.example || uiText('Chưa có ví dụ', 'No example yet', 'No example yet') },
      { label: uiText('Ghi chú', 'Note', 'Note'), value: card.notes || uiText('Chưa có ghi chú', 'No note yet', 'No note yet') },
      { label: uiText('Kênh đang yếu', 'Weakest lane', 'Weakest lane'), value: getSkillHeadline(card) }
    ];
    contextGrid.innerHTML = contextItems.map(item => `
      <div class="context-chip">
        <span>${escapeHtml(item.label)}</span>
        <strong>${escapeHtml(item.value)}</strong>
      </div>
    `).join('');

    if (contextCard) contextCard.classList.toggle('hidden', !showContext);
    if (activeUseCard) activeUseCard.classList.toggle('hidden', !showActiveUse);
    prompt.textContent = showActiveUse ? buildUseItNowPrompt(card) : '';
    if (sentenceInput) {
      sentenceInput.placeholder = uiText('Viết 1 câu thật ngắn của riêng bạn', 'Write one short sentence of your own', 'Write one short sentence of your own');
      sentenceInput.value = showActiveUse ? sentenceInput.value : '';
    }
    if (glossInput) {
      glossInput.placeholder = uiText('Giải thích nhanh bằng tiếng Việt (không bắt buộc)', 'Quick gloss in Vietnamese (optional)', 'Quick gloss in Vietnamese (optional)');
      if (!showActiveUse) glossInput.value = '';
    }
    renderActiveUsePreview(card);
    note.textContent = showActiveUse
      ? uiText('Gợi ý: câu của bạn sẽ được lưu vào Sentence Bank và dùng lại trong cloze / dictation.', 'Tip: your sentence will be saved to the Sentence Bank and reused in cloze and dictation.', 'Tip: your sentence will be saved to the Sentence Bank and reused in cloze and dictation.')
      : '';
    advanceBtn.textContent = revealed >= hints.length
      ? uiText('Mở Rescue Lane', 'Open Rescue Lane', 'Open Rescue Lane')
      : uiText(`Mở gợi ý kế (${revealed + 1}/${hints.length})`, `Reveal next cue (${revealed + 1}/${hints.length})`, `Reveal next cue (${revealed + 1}/${hints.length})`);
    rescueBtn.textContent = uiText('Gợi ý từ liên quan', 'Related word help', 'Related word help');
    dock.classList.remove('hidden');
  }

  function handleMemoryCoachAdvance() {
    const card = state.studyQueue[state.currentCardIdx];
    if (!card) return;
    const reason = state.hintLadder?.reason || inferFailureReasonFromGame(state.currentGame);
    const ladder = getHintLadderState(card, reason);
    const hints = buildHintSequence(card, reason);
    if (ladder.level >= hints.length) {
      openStudySupportForCurrent(reason, { autoQueue: false, manual: true });
      return;
    }
    ladder.level += 1;
    state.hintLadder = ladder;
    recordHintUsage(card, reason);
    renderMemoryCoach(card, reason);
    const hint = hints[ladder.level - 1];
    showToast(`${hint.label}: ${hint.value}`);
  }

  async function saveActiveUseSentence() {
    const card = state.studyQueue[state.currentCardIdx];
    if (!card) return;
    const sentenceInput = byId('activeUseSentenceInput');
    const glossInput = byId('activeUseMeaningInput');
    const text = String(sentenceInput?.value || '').trim();
    const gloss = String(glossInput?.value || '').trim();
    if (!text) return showToast(uiText('Hãy viết một câu ngắn trước khi lưu.', 'Write a short sentence before saving.', 'Write a short sentence before saving.'));
    const word = state.vocab.find(item => item.id === card.id);
    if (!word) return;
    word.personalSentences = mergeSentenceBanks(word.personalSentences || [], [{
      id: buildSentenceId('user'),
      text,
      gloss,
      source: 'user',
      createdAt: Date.now(),
      usedCount: 0,
      lastUsedAt: 0
    }]);
    word.skillMap = normalizeSkillMap(word.skillMap);
    word.skillMap.usage = clampConfidence(word.skillMap.usage + 1);
    word.review = normalizeIntegratedReview(word.review);
    word.review.confidence = deriveConfidenceValue(word.review, Boolean(word.isLearned), word.skillMap);
    word.isLearned = getConfidenceValue(word) >= 4;
    rememberSentenceUsage(word, text);
    await persistState();
    if (sentenceInput) sentenceInput.value = '';
    if (glossInput) glossInput.value = '';
    renderMemoryCoach(word, state.hintLadder?.reason || inferFailureReasonFromGame(state.currentGame));
    if (state.currentDetailsSet === word.wordset && !byId('set-details-view')?.classList.contains('hidden')) {
      renderSentenceBankPanel(getWordsForSet(state.currentDetailsSet));
    }
    showToast(uiText('Đã lưu câu vào Sentence Bank.', 'Sentence saved to the Sentence Bank.', 'Sentence saved to the Sentence Bank.'));
  }

  function clearActiveUseDraft() {
    const sentenceInput = byId('activeUseSentenceInput');
    const glossInput = byId('activeUseMeaningInput');
    if (sentenceInput) sentenceInput.value = '';
    if (glossInput) glossInput.value = '';
  }

  function renderSentenceBankPanel(words = []) {
    ensureSentenceBankPanel();
    const panel = byId('sentenceBankPanel');
    if (!panel) return;
    const entries = words.flatMap(word => normalizeSentenceBank(word.personalSentences || []).map(sentence => ({ word, sentence })));
    const totalWords = words.length;
    const coveredWords = words.filter(word => normalizeSentenceBank(word.personalSentences || []).length > 0).length;
    panel.innerHTML = `
      <div class="sentence-bank-head">
        <div>
          <h2>${escapeHtml(uiText('Personal Sentence Bank', 'Personal Sentence Bank', 'Personal Sentence Bank'))}</h2>
          <p class="muted-text">${escapeHtml(uiText('Những câu bạn tự viết sẽ được dùng lại trong cloze review và sentence dictation.', 'Your own sentences come back in cloze review and sentence dictation.', 'Your own sentences come back in cloze review and sentence dictation.'))}</p>
        </div>
        <div class="sentence-bank-actions">
          <button type="button" class="secondary-btn" data-sentence-bank-action="cloze">${escapeHtml(uiText('▶ Cloze từ Sentence Bank', '▶ Cloze from Sentence Bank', '▶ Cloze from Sentence Bank'))}</button>
          <span class="sentence-bank-chip">${escapeHtml(uiText(`Độ phủ: ${coveredWords}/${totalWords}`, `Coverage: ${coveredWords}/${totalWords}`, `Coverage: ${coveredWords}/${totalWords}`))}</span>
        </div>
      </div>
      <div class="sentence-bank-grid">
        ${entries.length ? entries.slice(0, 8).map(entry => `
          <article class="sentence-bank-card">
            <div class="sentence-bank-card-top">
              <strong>${escapeHtml(entry.word.word)}</strong>
              <span>${escapeHtml(getSkillHeadline(entry.word))}</span>
            </div>
            <p>${escapeHtml(entry.sentence.text)}</p>
            <small>${escapeHtml(entry.sentence.gloss || entry.word.meaning || uiText('Chưa có gloss', 'No gloss yet', 'No gloss yet'))}</small>
          </article>
        `).join('') : `<div class="sentence-bank-empty">${escapeHtml(uiText('Chưa có câu nào được lưu. Khi bạn dùng “Use It Now” trong Memory Coach, câu sẽ xuất hiện ở đây.', 'No sentence has been saved yet. When you use “Use It Now” in Memory Coach, it will appear here.', 'No sentence has been saved yet. When you use “Use It Now” in Memory Coach, it will appear here.'))}</div>`}
      </div>
    `;
  }

  function handleSentenceBankAction(action = '') {
    if (action === 'cloze') {
      startSentenceBankClozeSession(state.currentDetailsSet || byId('reviewSetDropdown')?.value || 'all');
    }
  }

  function collectPatternAnchorSuggestions(words, limit = 3) {
    const nounCandidates = words.filter(word => /noun/i.test(word.wordType || ''));
    const anchors = [];
    const baseTargets = (nounCandidates.length ? nounCandidates : words).slice(0, limit);
    const templates = [
      { head: 'talk about', gloss: uiText('nói về ...', 'talk about ...', 'talk about ...') },
      { head: 'deal with', gloss: uiText('xử lý / đối mặt với ...', 'deal with ...', 'deal with ...') },
      { head: 'be responsible for', gloss: uiText('chịu trách nhiệm về ...', 'be responsible for ...', 'be responsible for ...') }
    ];
    baseTargets.forEach((word, index) => {
      const template = templates[index % templates.length];
      anchors.push({
        word: `${template.head} ${word.word}`,
        phonetic: '',
        meaning: template.gloss,
        wordType: 'pattern scaffold',
        example: `${template.head[0].toUpperCase()}${template.head.slice(1)} ${word.word} every week.`,
        notes: uiText('Doctor scaffold — hãy chỉnh lại cho thật khớp bộ từ của bạn.', 'Doctor scaffold — edit it so it truly matches your set.', 'Doctor scaffold — edit it so it truly matches your set.'),
        entryType: 'pattern',
        topicTags: mergeUniqueTopicTags(word.topicTags || [], ['doctor-scaffold'])
      });
    });
    return anchors;
  }

  function buildSetDoctorReport() {
    const setName = byId('wordsetDropdown')?.value || 'Chưa phân loại';
    const words = getWordsForSet(setName);
    if (!words.length) {
      return {
        setName,
        isEmpty: true,
        cards: [],
        alerts: [],
        queue: [],
        gameType: 'flashcard',
        reason: uiText('Bộ từ còn trống nên Set Doctor chưa thể chuẩn đoán.', 'The set is still empty, so Set Doctor cannot diagnose it yet.', 'The set is still empty, so Set Doctor cannot diagnose it yet.'),
        repairs: []
      };
    }

    const withExample = words.filter(word => word.example).length;
    const withNotes = words.filter(word => word.notes).length;
    const phraseCount = words.filter(word => ['phrase', 'pattern'].includes(word.entryType)).length;
    const patternCount = words.filter(word => word.entryType === 'pattern').length;
    const dueWords = words.filter(isDueWord);
    const weakWords = words.filter(isWeakWord);
    const riskWords = getAtRiskWords(words, Math.min(10, words.length));
    const examplesCoverage = Math.round((withExample / Math.max(1, words.length)) * 100);
    const notesCoverage = Math.round((withNotes / Math.max(1, words.length)) * 100);
    const overlapPairs = collectNearOverlapPairs(words, 4);
    const noExampleWords = words.filter(word => !word.example && normalizeSentenceBank(word.personalSentences || []).length === 0);
    const typeCounts = words.reduce((acc, word) => {
      const key = (word.wordType || word.entryType || 'other').toLowerCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const nounCount = Object.entries(typeCounts).filter(([key]) => key.includes('noun')).reduce((sum, [, count]) => sum + count, 0);
    const verbCount = Object.entries(typeCounts).filter(([key]) => key.includes('verb')).reduce((sum, [, count]) => sum + count, 0);
    const familyMap = {};
    words.forEach(word => {
      const key = getConceptFamilyKey(word);
      if (!familyMap[key]) familyMap[key] = { count: 0, sample: word, weak: 0 };
      familyMap[key].count += 1;
      if (isWeakWord(word) || calculateForgettingRisk(word) >= 65) familyMap[key].weak += 1;
      if (calculateForgettingRisk(word) > calculateForgettingRisk(familyMap[key].sample)) familyMap[key].sample = word;
    });
    const familyList = Object.values(familyMap).sort((a, b) => b.weak - a.weak || b.count - a.count);
    const weakestFamily = familyList.find(item => item.weak > 0) || familyList[0] || null;
    const weakestSkill = getWeakestSkillAcrossWords(words);

    let structureGap = uiText('Bộ này đang khá cân bằng.', 'This set is structurally fairly balanced.', 'This set is structurally fairly balanced.');
    if (phraseCount < Math.max(1, Math.floor(words.length / 8))) {
      structureGap = uiText('Từ đơn đang nhiều hơn phrase/pattern. Nên thêm vài cụm nhớ để dùng từ tốt hơn.', 'Single words outweigh phrase/pattern anchors. Add a few chunks to make the set more usable.', 'Single words outweigh phrase/pattern anchors. Add a few chunks to make the set more usable.');
    } else if (nounCount >= Math.max(4, verbCount * 2)) {
      structureGap = uiText('Bộ này thiên về danh từ. Hãy bù thêm động từ hoặc pattern hành động để dùng từ tự nhiên hơn.', 'This set leans heavily toward nouns. Add verbs or action patterns for better usage.', 'This set leans heavily toward nouns. Add verbs or action patterns for better usage.');
    } else if (examplesCoverage < 45) {
      structureGap = uiText('Ví dụ và ngữ cảnh vẫn còn mỏng. Thêm ví dụ sẽ làm Context Replay mạnh hơn.', 'Example coverage is still thin. Adding examples will strengthen Context Replay.', 'Example coverage is still thin. Adding examples will strengthen Context Replay.');
    }

    const healthScore = Math.max(34, Math.min(97,
      92
      - Math.round(dueWords.length * 2.6)
      - Math.round(weakWords.length * 1.8)
      - Math.round(overlapPairs.length * 6)
      - Math.round(Math.max(0, 50 - examplesCoverage) * 0.28)
      + Math.round(phraseCount * 0.8)
      + Math.round(notesCoverage * 0.06)
    ));

    const repairSource = dueWords.length
      ? dueWords
      : weakWords.length
        ? weakWords
        : noExampleWords.length
          ? noExampleWords
          : riskWords.length
            ? riskWords
            : words;
    const gameType = dueWords.length
      ? 'srs'
      : weakWords.length
        ? 'typing'
        : phraseCount
          ? 'flashcard'
          : 'quiz';
    const queue = buildCoverageQueue(repairSource, Math.min(10, repairSource.length, words.length), dueWords.length ? 'rescue' : weakWords.length ? 'drill' : 'balanced');
    const reason = dueWords.length
      ? uiText(`Set Doctor phát hiện ${dueWords.length} mục đến hạn. Mở mission cứu trí nhớ trước sẽ an toàn hơn.`, `Set Doctor found ${dueWords.length} due item(s). Open a rescue mission first.`, `Set Doctor found ${dueWords.length} due item(s). Open a rescue mission first.`)
      : weakWords.length
        ? uiText(`Có ${weakWords.length} mục đang yếu. Nên drill chủ động trước khi mở rộng bộ từ.`, `There are ${weakWords.length} weak item(s). Repair them before expanding the set.`, `There are ${weakWords.length} weak item(s). Repair them before expanding the set.`)
        : uiText('Set này khá ổn. Doctor mission sẽ ưu tiên các mục thiếu ngữ cảnh hoặc thiếu neo nhớ.', 'This set is fairly stable. The doctor mission will target items that still lack context anchors.', 'This set is fairly stable. The doctor mission will target items that still lack context anchors.');

    const repairs = [];
    if (noExampleWords.length) {
      repairs.push({
        key: 'sentence-mission',
        label: uiText('Viết câu cứu ngữ cảnh', 'Sentence repair mission', 'Sentence repair mission'),
        note: uiText(`Có ${noExampleWords.length} mục chưa có câu ví dụ hoặc câu cá nhân.`, `There are ${noExampleWords.length} item(s) without an example or personal sentence.`, `There are ${noExampleWords.length} item(s) without an example or personal sentence.`),
        actionLabel: uiText('Mở sentence mission', 'Open sentence mission', 'Open sentence mission'),
        queue: diversifyStudyQueue(noExampleWords, Math.min(noExampleWords.length, 8)),
        gameType: 'flashcard'
      });
    }
    if (overlapPairs.length) {
      const contrastQueue = diversifyStudyQueue([...new Map(overlapPairs.flatMap(pair => [pair.left, pair.right]).map(item => [item.id, item])).values()], Math.min(8, words.length));
      repairs.push({
        key: 'contrast-mission',
        label: uiText('Tách cặp dễ nhầm', 'Contrast drill', 'Contrast drill'),
        note: uiText(`Có ${overlapPairs.length} vùng trùng gần cần tách ra trước khi học tiếp.`, `There are ${overlapPairs.length} near-overlap zones to separate before expanding.`, `There are ${overlapPairs.length} near-overlap zones to separate before expanding.`),
        actionLabel: uiText('Mở contrast lane', 'Open contrast lane', 'Open contrast lane'),
        queue: contrastQueue,
        gameType: 'contrast'
      });
    }
    if (phraseCount < Math.max(1, Math.floor(words.length / 8)) || nounCount >= Math.max(4, verbCount * 2)) {
      repairs.push({
        key: 'pattern-scaffold',
        label: uiText('Thêm phrase anchor nháp', 'Save phrase anchor drafts', 'Save phrase anchor drafts'),
        note: uiText('Tạo nhanh vài pattern scaffold để bộ từ đỡ toàn từ đơn.', 'Generate a few quick pattern scaffolds so the set is less single-word heavy.', 'Generate a few quick pattern scaffolds so the set is less single-word heavy.'),
        actionLabel: uiText('Lưu 3 scaffold', 'Save 3 scaffolds', 'Save 3 scaffolds'),
        suggestions: collectPatternAnchorSuggestions(words, 3)
      });
    }

    return {
      setName,
      isEmpty: false,
      cards: [
        {
          label: uiText('Điểm sức khỏe', 'Health score', 'Health score'),
          value: `${healthScore}/100`,
          foot: dueWords.length
            ? uiText(`Còn ${dueWords.length} mục đến hạn và ${weakWords.length} mục yếu.`, `${dueWords.length} due item(s) and ${weakWords.length} weak item(s) remain.`, `${dueWords.length} due item(s) and ${weakWords.length} weak item(s) remain.`)
            : uiText('Bộ này chưa có áp lực đến hạn quá lớn.', 'No major due pressure in this set right now.', 'No major due pressure in this set right now.')
        },
        {
          label: uiText('Cụm cần cứu', 'Repair cluster', 'Repair cluster'),
          value: weakestFamily?.sample?.word || uiText('Chưa rõ', 'No clear cluster', 'No clear cluster'),
          foot: weakestFamily
            ? uiText(`Cụm này có ${weakestFamily.weak} mục risk/weak và ${weakestFamily.count} mục liên quan.`, `This cluster has ${weakestFamily.weak} risk/weak item(s) across ${weakestFamily.count} related entries.`, `This cluster has ${weakestFamily.weak} risk/weak item(s) across ${weakestFamily.count} related entries.`)
            : uiText('Chưa có cụm đủ dày để chẩn đoán.', 'No dense cluster yet.', 'No dense cluster yet.')
        },
        {
          label: uiText('Độ phủ ngữ cảnh', 'Context coverage', 'Context coverage'),
          value: `${examplesCoverage}%`,
          foot: uiText(`Ví dụ: ${withExample}/${words.length} • Câu cá nhân: ${words.filter(word => normalizeSentenceBank(word.personalSentences || []).length > 0).length}/${words.length}`, `Examples: ${withExample}/${words.length} • Personal sentences: ${words.filter(word => normalizeSentenceBank(word.personalSentences || []).length > 0).length}/${words.length}`, `Examples: ${withExample}/${words.length} • Personal sentences: ${words.filter(word => normalizeSentenceBank(word.personalSentences || []).length > 0).length}/${words.length}`)
        },
        {
          label: uiText('Kênh yếu nhất', 'Weakest lane', 'Weakest lane'),
          value: weakestSkill ? getSkillLabel(weakestSkill.key) : uiText('Chưa tách lane', 'No split yet', 'No split yet'),
          foot: weakestSkill ? uiText(`Điểm trung bình hiện tại: ${weakestSkill.average}/4`, `Current average: ${weakestSkill.average}/4`, `Current average: ${weakestSkill.average}/4`) : structureGap
        }
      ],
      alerts: [
        overlapPairs.length
          ? uiText(`Vùng trùng gần: ${overlapPairs.map(pair => `${pair.left.word} ↔ ${pair.right.word}`).join(', ')}`, `Near-overlap zone: ${overlapPairs.map(pair => `${pair.left.word} ↔ ${pair.right.word}`).join(', ')}`, `Near-overlap zone: ${overlapPairs.map(pair => `${pair.left.word} ↔ ${pair.right.word}`).join(', ')}`)
          : uiText('Chưa thấy vùng trùng gần quá rõ trong bộ này.', 'No obvious near-overlap zone in this set.', 'No obvious near-overlap zone in this set.'),
        structureGap,
        reason
      ],
      queue,
      gameType,
      reason,
      repairs
    };
  }

  function renderSetDoctor() {
    ensureSetDoctorPanel();
    const panel = byId('setDoctorPanel');
    if (!panel) return;
    const report = buildSetDoctorReport();
    state.setDoctorReport = report;
    if (report.isEmpty) {
      panel.innerHTML = `
        <div class="suggestion-panel-head">
          <div>
            <h2>${escapeHtml(uiText('Set Doctor', 'Set Doctor', 'Set Doctor'))}</h2>
            <p class="muted-text">${escapeHtml(uiText('Bộ từ còn trống, nên chưa có dữ liệu để chẩn đoán.', 'The set is still empty, so there is not enough signal to diagnose it yet.', 'The set is still empty, so there is not enough signal to diagnose it yet.'))}</p>
          </div>
        </div>
        <div class="doctor-empty">${escapeHtml(report.reason)}</div>`;
      return;
    }
    panel.innerHTML = `
      <div class="suggestion-panel-head doctor-head">
        <div>
          <h2>${escapeHtml(uiText('Set Doctor', 'Set Doctor', 'Set Doctor'))}</h2>
          <p class="muted-text">${escapeHtml(uiText(`Chuẩn đoán nhanh cho bộ “${report.setName}” để giảm lặp, tăng ngữ cảnh và sửa vùng nhớ yếu trước.`, `Quick diagnosis for “${report.setName}” to reduce redundancy, strengthen context, and repair weak memory zones first.`, `Quick diagnosis for “${report.setName}” to reduce redundancy and repair weak memory zones first.`))}</p>
        </div>
        <div class="doctor-actions">
          <button type="button" class="primary-btn" data-doctor-action="mission">${escapeHtml(uiText('▶ Mở doctor mission', '▶ Launch doctor mission', '▶ Launch doctor mission'))}</button>
          <button type="button" class="secondary-btn" data-doctor-action="suggestions">${escapeHtml(uiText('Đổi làn gợi ý', 'Switch suggestion lane', 'Switch suggestion lane'))}</button>
        </div>
      </div>
      <div class="doctor-grid">
        ${report.cards.map(card => `
          <article class="doctor-card">
            <span class="doctor-label">${escapeHtml(card.label)}</span>
            <strong class="doctor-value">${escapeHtml(card.value)}</strong>
            <p class="doctor-foot">${escapeHtml(card.foot)}</p>
          </article>
        `).join('')}
      </div>
      <div class="doctor-alert-list">
        ${report.alerts.map(item => `<div class="doctor-alert-item">${escapeHtml(item)}</div>`).join('')}
      </div>
      ${report.repairs?.length ? `
        <div class="doctor-repair-grid">
          ${report.repairs.map(repair => `
            <article class="doctor-repair-card">
              <div>
                <strong>${escapeHtml(repair.label)}</strong>
                <p>${escapeHtml(repair.note)}</p>
              </div>
              <button type="button" class="secondary-btn" data-doctor-action="repair:${escapeHtml(repair.key)}">${escapeHtml(repair.actionLabel || uiText('Thực hiện', 'Run repair', 'Run repair'))}</button>
            </article>
          `).join('')}
        </div>
      ` : ''}`;
  }

  async function handleSetDoctorAction(event) {
    const button = event.target.closest('[data-doctor-action]');
    if (!button) return;
    const action = button.dataset.doctorAction || '';
    const report = state.setDoctorReport || buildSetDoctorReport();
    if (action === 'mission') {
      if (!report.queue?.length) return showToast(uiText('Set Doctor chưa tìm thấy mission phù hợp.', 'Set Doctor could not build a mission yet.', 'Set Doctor could not build a mission yet.'));
      startCustomQueue(report.queue, report.gameType || 'flashcard', uiText('Set Doctor Mission', 'Set Doctor Mission', 'Set Doctor Mission'), report.reason);
      return;
    }
    if (action === 'suggestions') {
      refreshSmartSuggestions();
      showToast(uiText('Đã đổi làn gợi ý để tránh lặp cùng một vùng nhớ.', 'Suggestion lane switched to avoid repeating the same memory zone.', 'Suggestion lane switched to avoid repeating the same memory zone.'));
      return;
    }
    if (!action.startsWith('repair:')) return;
    const repairKey = action.split(':')[1];
    const repair = (report.repairs || []).find(item => item.key === repairKey);
    if (!repair) return;
    if (repair.key === 'sentence-mission') {
      startGame(repair.gameType || 'flashcard', report.setName, {
        queue: repair.queue,
        planTitle: repair.label,
        planReason: repair.note
      });
      return;
    }
    if (repair.key === 'contrast-mission') {
      startGame('contrast', report.setName, {
        queue: repair.queue,
        planTitle: repair.label,
        planReason: repair.note
      });
      return;
    }
    if (repair.key === 'pattern-scaffold') {
      const suggestions = Array.isArray(repair.suggestions) ? repair.suggestions : [];
      if (!suggestions.length) return showToast(uiText('Chưa tạo được scaffold phù hợp.', 'No matching scaffold could be generated yet.', 'No matching scaffold could be generated yet.'));
      upsertWords(suggestions.map(item => ({ ...item, wordset: report.setName, createdAt: Date.now() })), report.setName);
      await saveAndRefresh({ showManagement: false, showReview: false });
      renderSetDoctor();
      showToast(uiText('Đã lưu 3 phrase scaffold nháp vào bộ từ.', 'Saved 3 draft phrase scaffolds into the set.', 'Saved 3 draft phrase scaffolds into the set.'));
    }
  }

  function renderFlashcard() {
    const card = state.studyQueue[state.currentCardIdx];
    if (!card) return finishSession(uiText('Đã hoàn thành lượt ôn tập này.', 'This review round is complete.', 'This review round is complete.'));

    byId('fcCoinCount').textContent = state.stats.coins;
    byId('studyProgress').textContent = `${Math.min(state.currentCardIdx + 1, state.studyQueue.length)} / ${state.studyQueue.length}`;
    byId('studyModeLabel').textContent = state.currentGame === 'srs' ? uiText('Ôn tập thông minh', 'Smart review', 'Smart review') : 'Flashcard';
    byId('fcStatusBadge').textContent = `${getWordStatusLabel(card)} • ${getSkillHeadline(card)}`;
    byId('fcMemoryBadge').textContent = `${uiText('Mức nhớ', 'Memory stage', 'Memory stage')}: ${getLocalizedMemoryStage(getMemoryStage(card), 'shortLabel')} • ${getEntryTypeLabel(card)}`;
    byId('fcWord').textContent = card.word;
    byId('fcType').textContent = card.wordType || getEntryTypeLabel(card);
    byId('fcPhonetic').textContent = card.phonetic || '—';
    byId('fcMeaning').textContent = card.meaning;
    byId('fcExample').textContent = chooseStudySentence(card, { preferUser: true })?.text || card.example || uiText('Không có ví dụ', 'No example yet', 'No example yet');
    byId('fcNotes').textContent = card.notes || '';
    byId('fcTypingInput').value = '';
    state.pendingFailureReason = '';
    byId('activeFlashcard').classList.remove('flipped');
    hideStudySupport();
    hideMemoryCoach();
  }

  function renderStudySupportForWord(card, reason = 'recall', options = {}) {
    const dock = byId('studySupportDock');
    const grid = byId('studySupportGrid');
    const pills = byId('studySupportPills');
    const title = byId('studySupportTitle');
    const lead = byId('studySupportLead');
    const primaryBtn = byId('studySupportQueueBtn');
    if (!dock || !grid || !pills || !title || !lead || !primaryBtn || !card) return;

    const ladder = getHintLadderState(card, reason);
    ladder.level = Math.max(ladder.level, Math.min(3, buildHintSequence(card, reason).length));
    state.hintLadder = ladder;

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
    lead.textContent = `${getFailureReasonLead(reason, card)} • ${getSkillHeadline(card)}`;
    pills.innerHTML = [
      `<span class="support-pill strong-pill">${escapeHtml(uiText('Đáp án', 'Answer', 'Answer'))}: ${escapeHtml(card.word)}</span>`,
      `<span class="support-pill">${escapeHtml(card.meaning || uiText('Chưa có nghĩa', 'No meaning yet', 'No meaning yet'))}</span>`,
      `<span class="support-pill">${escapeHtml(uiText('Lỗi', 'Issue', 'Issue'))}: ${escapeHtml(getMistakeReasonLabel(reason))}</span>`,
      `<span class="support-pill">${escapeHtml(uiText('Kênh yếu', 'Weak lane', 'Weak lane'))}: ${escapeHtml(getSkillHeadline(card))}</span>`
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
          <button class="secondary-btn support-card-btn" data-support-key="${escapeHtml(item.key)}">${item.actionType === 'queue' ? uiText('Đưa vào lượt kế tiếp', 'Queue next', 'Queue next') : uiText('Lưu vào bộ và ôn gần', 'Save and queue nearby', 'Save and queue nearby')}</button>
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


  // ===== v8.1.0 performance, clarity, and recovery patch =====
  state.backupHistory = [];
  state.dataRevision = Date.now();
  state.viewRenderCache = { main: '', management: '', review: '', details: '' };

  const VM_BACKUP_LIMIT = 10;
  const VM_EXTRA_EFFECT_PRESETS = [
    {
      key: 'ice_edge',
      viLabel: 'Ice Edge',
      enLabel: 'Ice Edge',
      noteVi: 'Rõ chữ hơn, ít blur hơn khi chỉnh thư viện và bảng.',
      noteEn: 'Sharper, lower-blur surfaces for library and editing work.',
      settings: { fxGlass: 'obsidian', fxMotion: 'calm', fxScene: 'aurora', fxDensity: 'micro', fxAccent: 'mint', fxRadius: 'soft' }
    },
    {
      key: 'night_signal',
      viLabel: 'Night Signal',
      enLabel: 'Night Signal',
      noteVi: 'Tối, gọn và tương phản mạnh hơn cho học đêm.',
      noteEn: 'Darker, tighter, higher-contrast glass for night study.',
      settings: { fxGlass: 'depth', fxMotion: 'off', fxScene: 'midnight', fxDensity: 'micro', fxAccent: 'violet', fxRadius: 'soft' }
    }
  ];
  VM_EXTRA_EFFECT_PRESETS.forEach(preset => {
    if (!EFFECT_PRESETS.some(item => item.key === preset.key)) {
      EFFECT_PRESETS.push(preset);
    }
  });

  function vmCloneJson(value, fallback = null) {
    try {
      return JSON.parse(JSON.stringify(value ?? fallback));
    } catch (error) {
      return fallback;
    }
  }

  function vmBuildSnapshot(reason = 'auto-save') {
    return {
      id: `snap-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      savedAt: new Date().toISOString(),
      reason: String(reason || 'auto-save'),
      vocab: vmCloneJson(state.vocab, []),
      stats: vmCloneJson(state.stats, {}),
      settings: vmCloneJson(state.settings, normalizeSettings()),
      meta: {
        vocabCount: Array.isArray(state.vocab) ? state.vocab.length : 0,
        setCount: getUniqueWordsets().length
      }
    };
  }

  function vmNormalizeBackupHistory(entries = []) {
    const raw = Array.isArray(entries) ? entries : [];
    return raw
      .filter(item => item && Array.isArray(item.vocab) && item.vocab.length)
      .map((item) => ({
        id: String(item.id || `snap-${item.savedAt || Date.now()}`),
        savedAt: String(item.savedAt || new Date().toISOString()),
        reason: String(item.reason || 'auto-save'),
        vocab: (Array.isArray(item.vocab) ? item.vocab : []).map((word, index) => normalizeWord(word, index)),
        stats: normalizeStats(item.stats || {}),
        settings: normalizeSettings(item.settings || {})
      }))
      .sort((left, right) => new Date(right.savedAt).getTime() - new Date(left.savedAt).getTime())
      .slice(0, VM_BACKUP_LIMIT);
  }

  function vmFormatBackupAge(isoText = '') {
    const stamp = new Date(isoText).getTime();
    if (!Number.isFinite(stamp) || stamp <= 0) {
      return uiText('thời gian không rõ', 'unknown time', 'unknown time');
    }
    const diffMin = Math.max(0, Math.round((Date.now() - stamp) / 60000));
    if (diffMin < 1) return uiText('vừa xong', 'just now', 'just now');
    if (diffMin < 60) return uiText(`${diffMin} phút trước`, `${diffMin}m ago`, `${diffMin}m ago`);
    const diffHr = Math.round(diffMin / 60);
    if (diffHr < 24) return uiText(`${diffHr} giờ trước`, `${diffHr}h ago`, `${diffHr}h ago`);
    const diffDay = Math.round(diffHr / 24);
    return uiText(`${diffDay} ngày trước`, `${diffDay}d ago`, `${diffDay}d ago`);
  }

  function vmResetViewRenderCache() {
    state.viewRenderCache = { main: '', management: '', review: '', details: '' };
  }

  function vmGetViewSignature(viewKey) {
    const locale = getLanguageMode();
    const settingsSig = [
      state.settings?.fxGlass,
      state.settings?.fxScene,
      state.settings?.fxAccent,
      state.settings?.fxDensity,
      state.settings?.fxMotion,
      state.settings?.fxRadius
    ].join(':');
    const base = `${locale}|${settingsSig}|${state.dataRevision}|${state.vocab.length}`;
    if (viewKey === 'main') return `${base}|${byId('wordsetDropdown')?.value || ''}`;
    if (viewKey === 'management') return `${base}|${byId('setSearchInput')?.value || ''}|${byId('setSortSelect')?.value || 'due'}`;
    if (viewKey === 'review') return `${base}|${byId('reviewSetDropdown')?.value || 'all'}`;
    if (viewKey === 'details') return `${base}|${state.currentDetailsSet || ''}|${byId('detailsSearchInput')?.value || ''}|${byId('detailsFilterSelect')?.value || 'all'}`;
    return base;
  }

  function ensureRecoveryPanel() {
    const managementView = byId('management-view');
    if (!managementView || byId('recoveryPanel')) return;
    const panel = document.createElement('section');
    panel.id = 'recoveryPanel';
    panel.className = 'panel-card recovery-panel';
    panel.dataset.open = 'false';
    panel.innerHTML = `
      <div class="recovery-compact-bar">
        <button id="recoveryToggleBtn" class="recovery-toggle-btn" type="button" data-recovery-action="toggle-panel" aria-expanded="false" aria-controls="recoveryPanelBody">
          <span class="recovery-toggle-pill">${escapeHtml(uiText('Bảo toàn dữ liệu', 'Data safety', 'Data safety'))}</span>
          <span class="recovery-toggle-copy">
            <strong id="recoveryPanelTitle">${escapeHtml(uiText('Recovery Center', 'Recovery Center', 'Recovery Center'))}</strong>
            <span id="recoveryCompactNote">${escapeHtml(uiText('Ẩn mặc định để đỡ chiếm chỗ.', 'Collapsed by default to save space.', 'Collapsed by default to save space.'))}</span>
          </span>
          <span class="recovery-toggle-chevron" aria-hidden="true"></span>
        </button>
        <div class="recovery-actions">
          <button id="restoreLatestBtn" class="secondary-btn" type="button" data-recovery-action="restore-latest"></button>
          <button id="downloadSafetyBackupBtn" class="secondary-btn" type="button" data-recovery-action="export-now"></button>
        </div>
      </div>
      <div id="recoveryPanelBody" class="recovery-panel-body hidden">
        <div class="recovery-panel-head">
          <div>
            <div id="recoveryPanelKicker" class="recovery-panel-kicker"></div>
            <p id="recoveryPanelLead" class="muted-text"></p>
          </div>
        </div>
        <div id="recoveryMetaStrip" class="recovery-meta-strip"></div>
        <div id="recoveryRestoreList" class="recovery-restore-list"></div>
      </div>
    `;
    const toolbar = document.querySelector('#management-view .toolbar-card');
    const anchor = toolbar || byId('managementSummary') || managementView.firstElementChild;
    if (anchor?.parentNode) {
      anchor.insertAdjacentElement('afterend', panel);
    } else {
      managementView.prepend(panel);
    }
  }

  function toggleRecoveryPanel(forceOpen) {
    const panel = byId('recoveryPanel');
    const body = byId('recoveryPanelBody');
    const trigger = byId('recoveryToggleBtn');
    if (!panel || !body || !trigger) return;
    const nextOpen = typeof forceOpen === 'boolean' ? forceOpen : panel.dataset.open !== 'true';
    panel.dataset.open = nextOpen ? 'true' : 'false';
    body.classList.toggle('hidden', !nextOpen);
    trigger.setAttribute('aria-expanded', String(nextOpen));
  }

  function renderRecoveryPanel() {

    const panel = byId('recoveryPanel');
    if (!panel) return;
    const history = vmNormalizeBackupHistory(state.backupHistory);
    const latest = history[0] || null;

    setTextValue('#recoveryPanelTitle', uiText('Recovery Center', 'Recovery Center', 'Recovery Center'));
    setTextValue('#recoveryPanelKicker', uiText('Bảo toàn dữ liệu', 'Data safety', 'Data safety'));
    setTextValue('#recoveryCompactNote', latest
      ? uiText(`${history.length} mốc gần đây • ${latest.vocab.length} từ • ${vmFormatBackupAge(latest.savedAt)}`, `${history.length} snapshot(s) • ${latest.vocab.length} words • ${vmFormatBackupAge(latest.savedAt)}`, `${history.length} snapshot(s) • ${latest.vocab.length} words • ${vmFormatBackupAge(latest.savedAt)}`)
      : uiText('Chưa có restore point', 'No restore point yet', 'No restore point yet'));
    setTextValue('#recoveryPanelLead', latest
      ? uiText(
          `Giữ ${history.length} mốc khôi phục gần nhất trong máy này. Vẫn nên tải JSON trước những lần nâng cấp lớn.`,
          `Keeps the latest ${history.length} restore point(s) on this device. You should still download a JSON backup before major upgrades.`,
          `Keeps the latest ${history.length} restore point(s) on this device. Download a JSON backup before major upgrades.`
        )
      : uiText(
          'Chưa có mốc khôi phục nào. Sau lần lưu đầu tiên, hệ thống sẽ bắt đầu giữ restore point tự động.',
          'No restore point yet. After the next save, the app will keep automatic restore points here.',
          'No restore point yet. After the next save, the app will keep automatic restore points here.'
        ));
    setTextValue('#restoreLatestBtn', uiText('Khôi phục mốc gần nhất', 'Restore latest snapshot', 'Restore latest snapshot'));
    setTextValue('#downloadSafetyBackupBtn', uiText('Tải backup ngay', 'Download backup now', 'Download backup now'));

    const metaStrip = byId('recoveryMetaStrip');
    if (metaStrip) {
      metaStrip.innerHTML = [
        {
          label: uiText('Từ hiện có', 'Current words', 'Current words'),
          value: String(state.vocab.length),
          note: uiText('Dữ liệu đang hiển thị', 'Words currently loaded', 'Words currently loaded')
        },
        {
          label: uiText('Mốc mới nhất', 'Latest restore point', 'Latest restore point'),
          value: latest ? vmFormatBackupAge(latest.savedAt) : '—',
          note: latest ? uiText(`${latest.vocab.length} từ`, `${latest.vocab.length} words`, `${latest.vocab.length} words`) : uiText('Chưa có dữ liệu', 'No backup yet', 'No backup yet')
        },
        {
          label: uiText('Cách an toàn nhất', 'Safest upgrade path', 'Safest upgrade path'),
          value: uiText('Giữ cùng thư mục', 'Keep the same folder', 'Keep the same folder'),
          note: uiText('Thay file trong đúng thư mục extension rồi bấm Reload.', 'Replace files inside the same extension folder, then click Reload.', 'Replace files inside the same extension folder, then click Reload.')
        }
      ].map(item => `
        <article class="recovery-meta-card">
          <span class="recovery-meta-label">${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(item.value)}</strong>
          <span class="recovery-meta-note">${escapeHtml(item.note)}</span>
        </article>
      `).join('');
    }

    const list = byId('recoveryRestoreList');
    if (!list) return;
    if (!history.length) {
      list.innerHTML = `
        <div class="inline-empty-state recovery-empty-state">
          <strong>${escapeHtml(uiText('Chưa có restore point nào', 'No restore points yet', 'No restore points yet'))}</strong>
          <div>${escapeHtml(uiText('Sau lần lưu tiếp theo, mục này sẽ hiện các mốc khôi phục gần đây để bạn phục hồi nhanh hơn.', 'After the next save, this area will show recent restore points for faster recovery.', 'After the next save, this area will show recent restore points for faster recovery.'))}</div>
        </div>
      `;
      return;
    }

    list.innerHTML = history.map((snapshot, index) => {
      const isLatest = index === 0;
      const reasonLabel = ({
        'auto-save': uiText('Tự lưu', 'Auto-save', 'Auto-save'),
        'save-and-refresh': uiText('Lưu thay đổi', 'Saved changes', 'Saved changes'),
        'restore': uiText('Sau khôi phục', 'Post-restore', 'Post-restore'),
        'import-backup': uiText('Nhập backup', 'Imported backup', 'Imported backup'),
        'bootstrap': uiText('Mốc nền ban đầu', 'Bootstrap snapshot', 'Bootstrap snapshot')
      })[snapshot.reason] || snapshot.reason;
      return `
        <button class="recovery-snapshot ${isLatest ? 'latest' : ''}" type="button" data-recovery-action="restore-snapshot" data-recovery-snapshot="${escapeHtml(snapshot.id)}">
          <div class="recovery-snapshot-head">
            <strong>${isLatest ? escapeHtml(uiText('Mốc mới nhất', 'Latest snapshot', 'Latest snapshot')) : escapeHtml(uiText('Mốc khôi phục', 'Restore point', 'Restore point'))}</strong>
            <span class="recovery-snapshot-time">${escapeHtml(vmFormatBackupAge(snapshot.savedAt))}</span>
          </div>
          <div class="recovery-snapshot-meta">${escapeHtml(reasonLabel)} • ${escapeHtml(uiText(`${snapshot.vocab.length} từ`, `${snapshot.vocab.length} words`, `${snapshot.vocab.length} words`))}</div>
          <div class="recovery-snapshot-note">${escapeHtml(uiText('Bấm để khôi phục toàn bộ từ, tiến độ và giao diện về thời điểm này.', 'Click to restore words, progress, and appearance back to this point.', 'Click to restore words, progress, and appearance back to this point.'))}</div>
        </button>
      `;
    }).join('');
  }

  async function restoreBackupSnapshot(snapshotId = '') {
    const history = vmNormalizeBackupHistory(state.backupHistory);
    const snapshot = history.find(item => item.id === snapshotId) || history[0] || null;
    if (!snapshot) {
      showToast(uiText('Chưa có mốc khôi phục phù hợp.', 'No matching restore point is available.', 'No matching restore point is available.'));
      return;
    }
    const confirmed = window.confirm(uiText(
      `Khôi phục ${snapshot.vocab.length} từ và tiến độ về mốc ${vmFormatBackupAge(snapshot.savedAt)}?`,
      `Restore ${snapshot.vocab.length} words and progress back to the snapshot from ${vmFormatBackupAge(snapshot.savedAt)}?`,
      `Restore ${snapshot.vocab.length} words and progress back to the snapshot from ${vmFormatBackupAge(snapshot.savedAt)}?`
    ));
    if (!confirmed) return;

    state.vocab = snapshot.vocab.map((word, index) => normalizeWord(word, index));
    state.stats = normalizeStats(snapshot.stats || {});
    state.settings = normalizeSettings(snapshot.settings || {});
    state.dataRevision = Date.now();
    vmResetViewRenderCache();
    await persistState('restore');
    showView('management-view');
    renderAll(true);
    showToast(uiText('Đã khôi phục mốc dữ liệu gần đây.', 'The selected restore point has been restored.', 'The selected restore point has been restored.'));
  }

  const originalBuildBackupPayload = buildBackupPayload;
  buildBackupPayload = function() {
    const payload = originalBuildBackupPayload();
    return {
      ...payload,
      version: '8.1.1',
      schema: 'vocab-master-backup-v2',
      settings: vmCloneJson(state.settings, {}),
      recoveryVault: vmCloneJson(state.backupHistory[0] || null, null),
      backupHistory: vmNormalizeBackupHistory(state.backupHistory).map(snapshot => ({
        id: snapshot.id,
        savedAt: snapshot.savedAt,
        reason: snapshot.reason,
        vocabCount: snapshot.vocab.length
      }))
    };
  };

  const originalLoadState = loadState;
  loadState = async function() {
    await originalLoadState();
    const extra = await storage.get({ backupHistory: [], recoveryVault: null });
    const seedHistory = [
      ...(Array.isArray(extra.backupHistory) ? extra.backupHistory : []),
      extra.recoveryVault
    ].filter(Boolean);
    state.backupHistory = vmNormalizeBackupHistory(seedHistory);
    if (!state.backupHistory.length && Array.isArray(state.vocab) && state.vocab.length) {
      const bootstrapSnapshot = vmBuildSnapshot('bootstrap');
      state.backupHistory = [bootstrapSnapshot];
      await storage.set({ recoveryVault: bootstrapSnapshot, backupHistory: state.backupHistory });
    }
    state.dataRevision = Date.now();
    vmResetViewRenderCache();
  };

  persistState = async function(reason = 'auto-save') {
    const snapshot = vmBuildSnapshot(typeof reason === 'string' ? reason : 'auto-save');
    const existing = await storage.get({ backupHistory: [] });
    let history = vmNormalizeBackupHistory(existing.backupHistory);
    const latest = history[0] || null;
    const latestSavedAt = latest?.savedAt ? new Date(latest.savedAt).getTime() : 0;
    const shouldAppend = !latest
      || latest.vocab.length !== snapshot.vocab.length
      || (Date.now() - latestSavedAt) > (15 * 60 * 1000)
      || snapshot.reason !== latest.reason;
    if (shouldAppend) {
      history = [snapshot, ...history].slice(0, VM_BACKUP_LIMIT);
    } else {
      history[0] = snapshot;
    }
    state.backupHistory = history;
    state.dataRevision = Date.now();
    vmResetViewRenderCache();
    await storage.set({
      vocab: state.vocab,
      stats: state.stats,
      vm_settings: state.settings,
      recoveryVault: snapshot,
      backupHistory: history
    });
    renderRecoveryPanel();
  };

  saveAndRefresh = async function({ showManagement = false, showReview = false } = {}) {
    await persistState('save-and-refresh');
    if (showManagement) {
      showView('management-view');
      initManagementView(true);
      return;
    }
    if (showReview) {
      showView('review-dashboard-view');
      initReviewView(true);
      return;
    }
    renderAll(true);
  };

  const originalRenderEffectsLabPanel = renderEffectsLabPanel;
  function getEffectPresetUse(preset) {
    const notes = {
      study_focus: uiText('ôn lâu, ít nhiễu', 'long review and low distraction', 'long review and low distraction'),
      glass_studio: uiText('cân bằng giữa đẹp và dễ đọc', 'balanced polish and readability', 'balanced polish and readability'),
      calm_aurora: uiText('học tối, ánh dịu', 'gentle night sessions', 'gentle night sessions'),
      sunset_pop: uiText('giao diện nổi bật hơn', 'a livelier workspace', 'a livelier workspace'),
      ice_edge: uiText('chỉnh library và bảng nhiều', 'editing tables and library work', 'editing tables and library work'),
      night_signal: uiText('học đêm, tương phản cao', 'night study with higher contrast', 'night study with higher contrast')
    };
    return notes[preset?.key] || uiText('học hằng ngày', 'daily study', 'daily study');
  }
  renderEffectsLabPanel = function() {
    originalRenderEffectsLabPanel();
    const activePreset = EFFECT_PRESETS.find(preset => preset.key === getActiveEffectPresetKey()) || EFFECT_PRESETS[0];
    const lead = byId('effectsLabLead');
    const label = byId('effectsPresetLabel');
    const hint = byId('effectsPresetHint');
    const preview = byId('effectsLabPreviewNote');
    const advancedSummary = byId('effectsAdvancedSummary');
    if (lead) {
      lead.textContent = uiText(
        'Chọn preset theo mục đích rõ ràng: học lâu, chỉnh thư viện hay làm giao diện nổi bật. Bản này đã giảm blur để chữ và bảng dễ nhìn hơn.',
        'Pick a preset by purpose: long study, library editing, or a brighter visual style. This build also cuts blur so text and tables stay clearer.',
        'Pick a preset by purpose: long study, library editing, or a brighter visual style. This build cuts blur so text stays clearer.'
      );
    }
    if (label) label.textContent = uiText('Chọn theo mục đích', 'Choose by purpose', 'Choose by purpose');
    if (hint) hint.textContent = uiText(
      'Study Focus và Ice Edge rõ nhất khi bạn nhập và sửa nhiều từ.',
      'Study Focus and Ice Edge are the clearest presets when you do a lot of importing and editing.',
      'Study Focus and Ice Edge are the clearest presets for importing and editing.'
    );
    if (advancedSummary) advancedSummary.textContent = uiText('Điều chỉnh nâng cao', 'Advanced controls', 'Advanced controls');
    if (preview) {
      preview.textContent = uiText(
        `Đang dùng ${getEffectPresetLabel(activePreset)} • Hợp với: ${getEffectPresetUse(activePreset)} • Mẹo: nếu bạn thấy mờ, ưu tiên mật độ Micro + kính Depth hoặc Obsidian.`,
        `Active: ${getEffectPresetLabel(activePreset)} • Best for: ${getEffectPresetUse(activePreset)} • Tip: if the UI still feels soft, switch to Micro density with Depth or Obsidian glass.`,
        `Active: ${getEffectPresetLabel(activePreset)} • Best for: ${getEffectPresetUse(activePreset)} • Tip: if the UI still feels soft, switch to Micro density with Depth or Obsidian glass.`
      );
    }

    const body = document.querySelector('#effectsLabPanel .effects-lab-body');
    if (!body) return;
    let purposeGrid = byId('effectsPurposeGrid');
    if (!purposeGrid) {
      purposeGrid = document.createElement('div');
      purposeGrid.id = 'effectsPurposeGrid';
      purposeGrid.className = 'effects-purpose-grid';
      const sceneGrid = byId('fxSceneGrid');
      if (sceneGrid) {
        sceneGrid.insertAdjacentElement('beforebegin', purposeGrid);
      } else {
        body.appendChild(purposeGrid);
      }
    }
    purposeGrid.innerHTML = [
      {
        title: uiText('Dễ nhìn nhất', 'Most readable', 'Most readable'),
        note: uiText('Study Focus hoặc Ice Edge để nhập, sửa và xem bảng lâu hơn.', 'Study Focus or Ice Edge when you import, edit, and scan tables for longer stretches.', 'Study Focus or Ice Edge when you import, edit, and scan tables for longer stretches.')
      },
      {
        title: uiText('Đang bật', 'Active right now', 'Active right now'),
        note: `${getEffectPresetLabel(activePreset)} • ${getEffectPresetUse(activePreset)}`
      },
      {
        title: uiText('Mẹo nhanh', 'Quick tip', 'Quick tip'),
        note: uiText('Blur cao hợp để trình diễn, blur thấp hợp để học thực sự.', 'Higher blur looks more dramatic, lower blur works better for real study.', 'Higher blur looks more dramatic, lower blur works better for real study.')
      }
    ].map(item => `
      <article class="effects-purpose-card">
        <strong class="effects-purpose-title">${escapeHtml(item.title)}</strong>
        <span class="effects-purpose-note">${escapeHtml(item.note)}</span>
      </article>
    `).join('');
  };

  const originalApplyLanguageModeUI = applyLanguageModeUI;
  applyLanguageModeUI = function() {
    originalApplyLanguageModeUI();
    renderRecoveryPanel();
  };

  renderWordsetsGrid = function() {
    const grid = byId('wordsetGrid');
    if (!grid) return;
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
            <span>${escapeHtml(uiText(`${words.length} từ`, `${words.length} words`, `${words.length} words`))}</span>
            <span>${escapeHtml(uiText(`${stats.due} đến hạn`, `${stats.due} due`, `${stats.due} due`))}</span>
            <span>${escapeHtml(uiText(`${stats.fresh} mới`, `${stats.fresh} new`, `${stats.fresh} new`))}</span>
            <span>${escapeHtml(uiText(`${stats.weak} cần ôn`, `${stats.weak} needs work`, `${stats.weak} needs work`))}</span>
          </div>
          <div class="progress-bar-container"><div class="progress-bar" style="width:${stats.progress}%"></div></div>
          <div class="card-metrics">
            <span>${escapeHtml(uiText(`${stats.mastered}/${stats.total || 0} đã vững`, `${stats.mastered}/${stats.total || 0} strong`, `${stats.mastered}/${stats.total || 0} strong`))}</span>
            <span>${escapeHtml(weakTypes[0] ? uiText(`Yếu nhất: ${weakTypes[0][0]}`, `Weakest: ${weakTypes[0][0]}`, `Weakest: ${weakTypes[0][0]}`) : uiText('Đang cân bằng', 'Balanced', 'Balanced'))}</span>
          </div>
          <div class="card-metrics compact-metrics">
            <span>${escapeHtml(typeSummary)}</span>
            <span>${escapeHtml(topRisk ? uiText(`Risk cao nhất: ${topRisk.word}`, `Highest risk: ${topRisk.word}`, `Highest risk: ${topRisk.word}`) : uiText('Risk ổn định', 'Risk is stable', 'Risk is stable'))}</span>
          </div>
        </div>
        <div class="card-action-bar">
          <button class="card-btn btn-view">${escapeHtml(uiText('Xem / sửa', 'View / edit', 'View / edit'))}</button>
          <button class="card-btn btn-study">${escapeHtml(uiText('Ôn ngay', 'Review now', 'Review now'))}</button>
          <button class="card-btn btn-delete">${escapeHtml(uiText('Xóa', 'Delete', 'Delete'))}</button>
        </div>
      `;

      card.querySelector('.btn-view')?.addEventListener('click', () => openSetDetails(setName));
      card.querySelector('.btn-study')?.addEventListener('click', () => {
        showView('review-dashboard-view');
        byId('reviewSetDropdown').value = setName;
        initReviewView(true);
      });
      card.querySelector('.btn-delete')?.addEventListener('click', async () => {
        const confirmed = window.confirm(uiText(
          `Bạn có chắc muốn xóa toàn bộ bộ từ "${setName}"?`,
          `Are you sure you want to delete the whole set "${setName}"?`,
          `Are you sure you want to delete the whole set "${setName}"?`
        ));
        if (!confirmed) return;
        state.vocab = state.vocab.filter(word => word.wordset !== setName);
        await saveAndRefresh({ showManagement: true });
        showToast(uiText(`Đã xóa bộ từ "${setName}".`, `Deleted the set "${setName}".`, `Deleted the set "${setName}".`));
      });
      grid.appendChild(card);
    });
  };

  const originalOpenSetDetails = openSetDetails;
  openSetDetails = function(setName) {
    originalOpenSetDetails(setName);
    const words = state.vocab.filter(word => word.wordset === setName);
    const stats = getSetStats(words);
    const topRisk = getAtRiskWords(words, 1)[0];
    byId('detailsSummaryText').textContent = uiText(
      `${words.length} mục • ${stats.due} đến hạn • ${stats.fresh} mới • ${stats.weak} cần củng cố • ${buildEntryTypeSummary(words)}${topRisk ? ` • Risk cao nhất: ${topRisk.word}` : ''} • ${buildMemoryStageSummary(words)}`,
      `${words.length} item(s) • ${stats.due} due • ${stats.fresh} new • ${stats.weak} need reinforcement • ${buildEntryTypeSummary(words)}${topRisk ? ` • Highest risk: ${topRisk.word}` : ''} • ${buildMemoryStageSummary(words)}`,
      `${words.length} item(s) • ${stats.due} due • ${stats.fresh} new • ${stats.weak} need reinforcement • ${buildEntryTypeSummary(words)}${topRisk ? ` • Highest risk: ${topRisk.word}` : ''} • ${buildMemoryStageSummary(words)}`
    );
    vm831RenderSetDetailsMeta(words, stats);
    state.viewRenderCache.details = vmGetViewSignature('details');
    applyLanguageModeUI();
  };


  function vm831RenderSetDetailsMeta(words = [], stats = getSetStats(words)) {
    const host = byId('setDetailsMetaBar');
    if (!host) return;
    const customCap = Math.max(0, Math.min(30, Number(state.vm830?.prefs?.customSessionCap) || 0));
    host.innerHTML = `
      <div class="set-details-meta-grid">
        <div class="set-details-meta-card emphasis">
          <span class="set-details-meta-label">${escapeHtml(uiText('Tiến độ học', 'Learning progress', 'Learning progress'))}</span>
          <strong>${stats.progress}%</strong>
          <small>${escapeHtml(uiText(`${stats.mastered}/${stats.total || 0} từ đã vững • ${stats.masteryProgress}% mastery`, `${stats.mastered}/${stats.total || 0} strong • ${stats.masteryProgress}% mastery`, `${stats.mastered}/${stats.total || 0} strong • ${stats.masteryProgress}% mastery`))}</small>
        </div>
        <div class="set-details-meta-card">
          <span class="set-details-meta-label">${escapeHtml(uiText('Nhịp học bộ này', 'Study pace for this set', 'Study pace for this set'))}</span>
          <div class="set-details-cap-row">
            <input id="detailsSessionCapInput" class="modern-input set-details-cap-input" type="number" min="4" max="30" step="1" placeholder="${escapeHtml(uiText('Tự động', 'Adaptive', 'Adaptive'))}" value="${customCap >= 4 ? customCap : ''}">
            <button type="button" id="detailsSessionCapSaveBtn" class="secondary-btn slim-btn">${escapeHtml(uiText('Lưu', 'Save', 'Save'))}</button>
            <button type="button" id="detailsSessionCapResetBtn" class="secondary-btn slim-btn">${escapeHtml(uiText('Tự động', 'Auto', 'Auto'))}</button>
          </div>
          <small>${escapeHtml(uiText('Điều chỉnh số từ cho mỗi phiên ôn khi học bộ này.', 'Tune how many words each review round should use.', 'Tune how many words each review round should use.'))}</small>
        </div>
      </div>
    `;
  }

  document.addEventListener('click', async (event) => {
    const saveBtn = event.target.closest('#detailsSessionCapSaveBtn');
    if (saveBtn) {
      const input = byId('detailsSessionCapInput');
      const nextCap = Math.max(4, Math.min(30, Number(input?.value) || 0));
      if (!nextCap) {
        showToast(uiText('Hãy nhập từ 4 đến 30 từ mỗi phiên.', 'Enter a session size from 4 to 30 words.', 'Enter a session size from 4 to 30 words.'));
        return;
      }
      state.vm830.prefs.customSessionCap = nextCap;
      await vm830SavePrefs();
      if (state.currentDetailsSet && document.body.dataset.currentView === 'set-details-view') {
        vm831RenderSetDetailsMeta(getWordsForSet(state.currentDetailsSet));
      }
      showToast(uiText(`Đã đặt ${nextCap} từ mỗi phiên.`, `Set ${nextCap} words per session.`, `Set ${nextCap} words per session.`));
      return;
    }
    const resetBtn = event.target.closest('#detailsSessionCapResetBtn');
    if (resetBtn) {
      state.vm830.prefs.customSessionCap = 0;
      await vm830SavePrefs();
      if (state.currentDetailsSet && document.body.dataset.currentView === 'set-details-view') {
        vm831RenderSetDetailsMeta(getWordsForSet(state.currentDetailsSet));
      }
      showToast(uiText('Đã trở về nhịp phiên tự động.', 'Returned to adaptive session sizing.', 'Returned to adaptive session sizing.'));
    }
  });

  const originalHandleBackupImport = handleBackupImport;
  handleBackupImport = async function(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const raw = JSON.parse(await file.text());
      const source = Array.isArray(raw.vocab)
        ? raw
        : (raw.recoveryVault && Array.isArray(raw.recoveryVault.vocab))
          ? raw.recoveryVault
          : null;
      const importedWords = Array.isArray(source?.vocab) ? source.vocab.map((item, index) => normalizeWord(item, index)) : [];
      if (!importedWords.length) throw new Error('EMPTY');
      const optimized = optimizeVocabularySystem(importedWords);
      state.vocab = optimized.vocab;
      state.optimizerReport = optimized.report;
      state.stats = normalizeStats(source?.stats || raw.stats || {});
      state.settings = normalizeSettings(source?.settings || raw.settings || state.settings);
      state.dataRevision = Date.now();
      vmResetViewRenderCache();
      await persistState('import-backup');
      showView('management-view');
      renderAll(true);
      showToast(uiText(`Đã nhập backup với ${importedWords.length} từ.`, `Imported a backup with ${importedWords.length} words.`, `Imported a backup with ${importedWords.length} words.`));
    } catch (error) {
      showToast(uiText('Không thể đọc file backup JSON này.', 'This JSON backup could not be read.', 'This JSON backup could not be read.'));
    } finally {
      event.target.value = '';
    }
  };

  const originalInitMainView = initMainView;
  initMainView = function(force = false) {
    const signature = vmGetViewSignature('main');
    if (!force && state.viewRenderCache.main === signature) return;
    state.viewRenderCache.main = signature;
    originalInitMainView();
    applyLanguageModeUI();
  };

  const originalInitManagementView = initManagementView;
  initManagementView = function(force = false) {
    const signature = vmGetViewSignature('management');
    if (!force && state.viewRenderCache.management === signature) {
      renderRecoveryPanel();
      return;
    }
    state.viewRenderCache.management = signature;
    originalInitManagementView();
    ensureRecoveryPanel();
    renderRecoveryPanel();
    applyLanguageModeUI();
  };

  const originalInitReviewView = initReviewView;
  initReviewView = function(force = false) {
    const signature = vmGetViewSignature('review');
    if (!force && state.viewRenderCache.review === signature) return;
    state.viewRenderCache.review = signature;
    originalInitReviewView();
    applyLanguageModeUI();
  };

  renderAll = function(force = false) {
    applyEffectSettings();
    applyLanguageModeUI();
    if (typeof renderIntegratedUITexts === 'function') renderIntegratedUITexts();
    ensureRecoveryPanel();
    const currentView = document.body.dataset.currentView || getPreferredInitialView();
    if (currentView === 'management-view') {
      initManagementView(force);
    } else if (currentView === 'review-dashboard-view') {
      initReviewView(force);
    } else if (currentView === 'set-details-view' && state.currentDetailsSet) {
      openSetDetails(state.currentDetailsSet);
    } else {
      initMainView(force);
    }
    renderRecoveryPanel();
  };

  const originalShowView = showView;
  showView = function(viewIdToShow) {
    const previousView = document.body.dataset.currentView || '';
    originalShowView(viewIdToShow);
    if (previousView === viewIdToShow) return;
    if (viewIdToShow === 'management-view') {
      window.requestAnimationFrame(() => initManagementView(false));
    } else if (viewIdToShow === 'review-dashboard-view') {
      window.requestAnimationFrame(() => initReviewView(false));
    } else if (viewIdToShow === 'main-view') {
      window.requestAnimationFrame(() => initMainView(false));
    }
  };

  if (document.body.dataset.vmRecoveryBound !== 'true') {
    document.body.dataset.vmRecoveryBound = 'true';
    document.addEventListener('click', async (event) => {
      const target = event.target.closest('[data-recovery-action]');
      if (!target) return;
      const action = target.dataset.recoveryAction;
      if (action === 'toggle-panel') {
        toggleRecoveryPanel();
        return;
      }
      if (action === 'export-now') {
        exportBackup();
        return;
      }
      if (action === 'restore-latest') {
        await restoreBackupSnapshot(state.backupHistory[0]?.id || '');
        return;
      }
      if (action === 'restore-snapshot') {
        await restoreBackupSnapshot(target.dataset.recoverySnapshot || '');
      }
    });
  }


  // ===== v8.2.0 turbo workbench, cached library, and quick actions =====
  state.vmSetIndexCache = { key: '', entries: [] };
  state.vmManagementPanel = 'library';
  state.vmCommandPalette = { open: false, activeIndex: 0 };

  const VM_TURBO_EFFECT_PRESETS = [
    {
      key: 'liquid_signal',
      viLabel: 'Liquid Signal',
      enLabel: 'Liquid Signal',
      noteVi: 'Kính rõ hơn, tín hiệu sáng hơn cho review tốc độ cao.',
      noteEn: 'Sharper glass and brighter accents for faster review.',
      settings: { fxGlass: 'obsidian', fxMotion: 'calm', fxScene: 'midnight', fxDensity: 'micro', fxAccent: 'blue', fxRadius: 'soft' }
    },
    {
      key: 'frostline',
      viLabel: 'Frostline',
      enLabel: 'Frostline',
      noteVi: 'Lạnh, sạch, hợp với chỉnh thư viện và đọc bảng lâu.',
      noteEn: 'Cold, clean, and built for library editing and longer reading.',
      settings: { fxGlass: 'mist', fxMotion: 'off', fxScene: 'aurora', fxDensity: 'micro', fxAccent: 'mint', fxRadius: 'soft' }
    }
  ];
  VM_TURBO_EFFECT_PRESETS.forEach((preset) => {
    if (!EFFECT_PRESETS.some((item) => item.key === preset.key)) EFFECT_PRESETS.push(preset);
  });

  function vm82GetSetIndex() {
    const cacheKey = `${state.dataRevision}|${state.vocab.length}`;
    if (state.vmSetIndexCache.key === cacheKey && Array.isArray(state.vmSetIndexCache.entries)) {
      return state.vmSetIndexCache.entries;
    }

    const grouped = new Map();
    state.vocab.forEach((word) => {
      const setName = word.wordset || uiText('Chưa phân loại', 'Uncategorized', 'Uncategorized');
      if (!grouped.has(setName)) grouped.set(setName, []);
      grouped.get(setName).push(word);
    });

    const entries = Array.from(grouped.entries()).map(([setName, words]) => {
      let latest = 0;
      let topRiskWord = '';
      let topRiskScore = -1;
      words.forEach((word) => {
        latest = Math.max(latest, word.createdAt || 0, word.updatedAt || 0);
        const risk = calculateForgettingRisk(word);
        if (risk > topRiskScore) {
          topRiskScore = risk;
          topRiskWord = word.word || '';
        }
      });
      return {
        setName,
        words,
        stats: getSetStats(words),
        weakTypes: getWeakTypeStats(words),
        latest,
        topRiskWord,
        searchBlob: normalizeAnswer(`${setName} ${words.map((word) => `${word.word || ''} ${word.meaning || ''} ${word.wordType || ''} ${word.entryType || ''}`).join(' ')}`)
      };
    });

    state.vmSetIndexCache = { key: cacheKey, entries };
    return entries;
  }

  function vm82GetManagementToolbar() {
    return document.querySelector('#management-view .toolbar-card');
  }

  function ensureManagementWorkbench() {
    const managementView = byId('management-view');
    if (!managementView || byId('managementWorkbenchBar')) return;
    const bar = document.createElement('section');
    bar.id = 'managementWorkbenchBar';
    bar.className = 'panel-card management-workbench-bar';
    bar.innerHTML = `
      <div class="management-workbench-head">
        <div>
          <div class="management-workbench-kicker">${escapeHtml(uiText('Điều hướng nhanh', 'Quick workspace', 'Quick workspace'))}</div>
          <strong id="managementWorkbenchTitle">${escapeHtml(uiText('Mở đúng phần bạn cần', 'Open only what you need', 'Open only what you need'))}</strong>
        </div>
        <button id="managementWorkbenchCommandBtn" class="secondary-btn slim-btn" type="button">${escapeHtml(uiText('⌘ Lệnh nhanh', '⌘ Quick actions', '⌘ Quick actions'))}</button>
      </div>
      <div class="management-workbench-nav" role="tablist" aria-label="Management workspace sections">
        <button class="management-workbench-btn active" type="button" data-management-panel="library">${escapeHtml(uiText('Bộ từ', 'Library', 'Library'))}</button>
        <button class="management-workbench-btn" type="button" data-management-panel="recovery">${escapeHtml(uiText('Khôi phục', 'Recovery', 'Recovery'))}</button>
        <button class="management-workbench-btn" type="button" data-management-panel="appearance">${escapeHtml(uiText('Giao diện', 'Appearance', 'Appearance'))}</button>
        <button class="management-workbench-btn" type="button" data-management-panel="studio">${escapeHtml(uiText('Studio', 'Studio', 'Studio'))}</button>
      </div>
      <div id="managementWorkbenchNote" class="management-workbench-note"></div>
    `;
    const summary = byId('managementSummary');
    if (summary?.parentNode) summary.insertAdjacentElement('afterend', bar);
    else managementView.prepend(bar);

    bar.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-management-panel]');
      if (trigger) {
        setManagementWorkbenchPanel(trigger.dataset.managementPanel || 'library');
        return;
      }
      const commandBtn = event.target.closest('#managementWorkbenchCommandBtn');
      if (commandBtn) openCommandPalette();
    });
  }

  function getManagementWorkbenchNote(panel = state.vmManagementPanel || 'library') {
    const notes = {
      library: uiText('Giữ màn hình gọn để lướt bộ từ, tìm kiếm và vào ôn tập nhanh hơn.', 'Keep the screen clean for set browsing, search, and faster review jumps.', 'Keep the screen clean for browsing, search, and faster review jumps.'),
      recovery: uiText('Chỉ mở vùng khôi phục khi cần, tránh chiếm chỗ ở màn thư viện chính.', 'Open the recovery zone only when needed so the library stays lighter.', 'Open recovery only when needed so the library stays lighter.'),
      appearance: uiText('Tinh chỉnh liquid glass ở một khu riêng, rõ hơn và ít blur hơn.', 'Tune liquid glass in a clearer, lower-blur workspace.', 'Tune liquid glass in a clearer, lower-blur workspace.'),
      studio: uiText('Mở Studio khi bạn muốn coin, theme packs hoặc focus tools.', 'Open Studio only when you want coins, packs, or focus tools.', 'Open Studio only when you want coins, packs, or focus tools.')
    };
    return notes[panel] || notes.library;
  }

  function setManagementWorkbenchPanel(panel = 'library') {
    const nextPanel = ['library', 'recovery', 'appearance', 'studio'].includes(panel) ? panel : 'library';
    state.vmManagementPanel = nextPanel;
    document.body.dataset.managementPanel = nextPanel;

    const toolbar = vm82GetManagementToolbar();
    const libraryGrid = byId('wordsetGrid');
    const recovery = byId('recoveryPanel');
    const appearance = byId('effectsLabPanel');
    const studio = byId('upgradeHub');

    [toolbar, libraryGrid, recovery, appearance, studio].forEach((node) => node?.classList.add('vm-dock-hidden'));
    if (nextPanel === 'library') {
      toolbar?.classList.remove('vm-dock-hidden');
      libraryGrid?.classList.remove('vm-dock-hidden');
    }
    if (nextPanel === 'recovery') recovery?.classList.remove('vm-dock-hidden');
    if (nextPanel === 'appearance') appearance?.classList.remove('vm-dock-hidden');
    if (nextPanel === 'studio') studio?.classList.remove('vm-dock-hidden');

    document.querySelectorAll('#managementWorkbenchBar [data-management-panel]').forEach((button) => {
      button.classList.toggle('active', button.dataset.managementPanel === nextPanel);
    });
    setTextValue('#managementWorkbenchTitle', uiText('Mở đúng phần bạn cần', 'Open only what you need', 'Open only what you need'));
    setTextValue('#managementWorkbenchNote', getManagementWorkbenchNote(nextPanel));
    setTextValue('#managementWorkbenchCommandBtn', uiText('⌘ Lệnh nhanh', '⌘ Quick actions', '⌘ Quick actions'));
  }

  function ensureCommandPalette() {
    if (byId('commandPaletteLauncher')) return;
    const navTools = document.querySelector('.nav-tools');
    if (navTools) {
      const launcher = document.createElement('button');
      launcher.id = 'commandPaletteLauncher';
      launcher.className = 'nav-command-btn';
      launcher.type = 'button';
      launcher.innerHTML = `
        <span class="nav-command-label">${escapeHtml(uiText('Lệnh nhanh', 'Quick actions', 'Quick actions'))}</span>
        <span class="nav-command-hint">Ctrl K</span>
      `;
      launcher.addEventListener('click', openCommandPalette);
      navTools.appendChild(launcher);
    }

    const overlay = document.createElement('div');
    overlay.id = 'commandPaletteOverlay';
    overlay.className = 'command-palette-overlay hidden';
    overlay.innerHTML = `
      <div class="command-palette-shell" role="dialog" aria-modal="true" aria-labelledby="commandPaletteTitle">
        <div class="command-palette-head">
          <div>
            <div class="command-palette-kicker">${escapeHtml(uiText('Điều hướng cực nhanh', 'Turbo navigation', 'Turbo navigation'))}</div>
            <strong id="commandPaletteTitle">${escapeHtml(uiText('Nhảy tới đúng hành động', 'Jump to the right action', 'Jump to the right action'))}</strong>
          </div>
          <button id="commandPaletteCloseBtn" class="secondary-btn slim-btn" type="button">${escapeHtml(uiText('Đóng', 'Close', 'Close'))}</button>
        </div>
        <div class="command-palette-input-wrap">
          <input id="commandPaletteInput" class="modern-input command-palette-input" type="text" autocomplete="off" spellcheck="false" placeholder="${escapeHtml(uiText('Gõ để tìm: review, library, backup, tên bộ từ...', 'Type to search: review, library, backup, set name...', 'Type to search: review, library, backup, set name...'))}">
        </div>
        <div id="commandPaletteMeta" class="command-palette-meta"></div>
        <div id="commandPaletteList" class="command-palette-list"></div>
      </div>
    `;
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) closeCommandPalette();
    });
    document.body.appendChild(overlay);

    byId('commandPaletteCloseBtn')?.addEventListener('click', closeCommandPalette);
    byId('commandPaletteInput')?.addEventListener('input', (event) => {
      state.vmCommandPalette.activeIndex = 0;
      renderCommandPalette(event.target.value || '');
    });
    byId('commandPaletteInput')?.addEventListener('keydown', async (event) => {
      const items = getCommandPaletteItems(byId('commandPaletteInput')?.value || '');
      if (!items.length && event.key !== 'Escape') return;
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        state.vmCommandPalette.activeIndex = (state.vmCommandPalette.activeIndex + 1) % items.length;
        renderCommandPalette(byId('commandPaletteInput')?.value || '');
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        state.vmCommandPalette.activeIndex = (state.vmCommandPalette.activeIndex - 1 + items.length) % items.length;
        renderCommandPalette(byId('commandPaletteInput')?.value || '');
      } else if (event.key === 'Enter') {
        event.preventDefault();
        await runCommandPaletteAction(items[state.vmCommandPalette.activeIndex] || items[0]);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        closeCommandPalette();
      }
    });
    byId('commandPaletteList')?.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-command-index]');
      if (!button) return;
      const items = getCommandPaletteItems(byId('commandPaletteInput')?.value || '');
      const item = items[Number(button.dataset.commandIndex) || 0];
      await runCommandPaletteAction(item);
    });
  }

  function getCommandPaletteItems(query = '') {
    const q = normalizeAnswer(query);
    const allSetEntries = [...vm82GetSetIndex()].sort((a, b) => b.stats.due - a.stats.due || b.stats.weak - a.stats.weak || a.setName.localeCompare(b.setName, 'vi'));
    const staticItems = [
      {
        icon: '✚',
        label: uiText('Mở phần thêm từ', 'Open Add words', 'Open Add words'),
        note: uiText('Dán từ từ Excel, nhập tay hoặc import CSV.', 'Paste from Excel, type manually, or import CSV.', 'Paste from Excel, type manually, or import CSV.'),
        tokens: 'add words input import csv quick add',
        run: () => { showView('main-view'); initMainView(false); }
      },
      {
        icon: '📚',
        label: uiText('Mở thư viện bộ từ', 'Open Library', 'Open Library'),
        note: uiText('Quay về thư viện chính với tìm kiếm và các bộ từ.', 'Return to the main library with search and set cards.', 'Return to the main library with search and set cards.'),
        tokens: 'library sets management my sets',
        run: () => { showView('management-view'); initManagementView(false); setManagementWorkbenchPanel('library'); }
      },
      {
        icon: '🛟',
        label: uiText('Mở Recovery Center', 'Open Recovery Center', 'Open Recovery Center'),
        note: uiText('Khôi phục nhanh, kiểm tra restore points và tải backup.', 'Quick restore, restore points, and backup download.', 'Quick restore, restore points, and backup download.'),
        tokens: 'recovery backup restore safety',
        run: () => { showView('management-view'); initManagementView(false); setManagementWorkbenchPanel('recovery'); }
      },
      {
        icon: '✨',
        label: uiText('Mở Appearance Studio', 'Open Appearance Studio', 'Open Appearance Studio'),
        note: uiText('Chỉnh liquid glass, density và preset giao diện.', 'Tune liquid glass, density, and visual presets.', 'Tune liquid glass, density, and visual presets.'),
        tokens: 'appearance effects studio glass theme ui',
        run: () => { showView('management-view'); initManagementView(false); setManagementWorkbenchPanel('appearance'); }
      },
      {
        icon: '⚙',
        label: uiText('Mở Studio tools', 'Open Studio tools', 'Open Studio tools'),
        note: uiText('Coin, Pomodoro, theme packs và các tiện ích mở rộng.', 'Coins, Pomodoro, theme packs, and expanded tools.', 'Coins, Pomodoro, theme packs, and expanded tools.'),
        tokens: 'studio focus pomodoro theme tools',
        run: () => { showView('management-view'); initManagementView(false); setManagementWorkbenchPanel('studio'); }
      },
      {
        icon: '▶',
        label: uiText('Bắt đầu review gợi ý', 'Start recommended review', 'Start recommended review'),
        note: uiText('Nhảy thẳng tới bước ôn tập mà hệ thống đang ưu tiên.', 'Jump straight into the next review step the system recommends.', 'Jump straight into the next recommended review step.'),
        tokens: 'review recommended start study rescue',
        run: () => { showView('review-dashboard-view'); initReviewView(false); startRecommendedStudy(); }
      },
      {
        icon: '⏱',
        label: uiText('Ôn từ đến hạn', 'Review due words', 'Review due words'),
        note: uiText('Mở nhanh một lượt cứu trí nhớ trước.', 'Open a fast rescue round first.', 'Open a fast rescue round first.'),
        tokens: 'due review rescue urgent',
        run: () => { showView('review-dashboard-view'); initReviewView(false); startTargetedFocus('due'); }
      },
      {
        icon: '🧠',
        label: uiText('Luyện cụm từ yếu', 'Drill weak words', 'Drill weak words'),
        note: uiText('Ưu tiên các mục dễ rơi trí nhớ hoặc hay sai.', 'Prioritize the items that slip or fail most often.', 'Prioritize the items that slip or fail most often.'),
        tokens: 'weak drill practice reinforcement',
        run: () => { showView('review-dashboard-view'); initReviewView(false); startTargetedFocus('weak'); }
      },
      {
        icon: '⬇',
        label: uiText('Xuất backup JSON', 'Export JSON backup', 'Export JSON backup'),
        note: uiText('Tạo một bản backup ngoài extension để giữ an toàn.', 'Create an external backup outside the extension.', 'Create an external backup outside the extension.'),
        tokens: 'export backup json save safety',
        run: () => exportBackup()
      },
      {
        icon: '↺',
        label: uiText('Khôi phục mốc gần nhất', 'Restore latest snapshot', 'Restore latest snapshot'),
        note: uiText('Dùng restore point gần nhất trong máy này.', 'Use the latest restore point on this device.', 'Use the latest restore point on this device.'),
        tokens: 'restore latest snapshot recovery',
        run: async () => restoreBackupSnapshot(state.backupHistory?.[0]?.id || '')
      }
    ];

    const setItems = allSetEntries.slice(0, 10).map((entry) => ({
      icon: '🏷',
      label: `${uiText('Mở bộ', 'Open set', 'Open set')}: ${entry.setName}`,
      note: uiText(`${entry.stats.due} đến hạn • ${entry.stats.weak} cần củng cố • ${entry.stats.total} mục`, `${entry.stats.due} due • ${entry.stats.weak} weak • ${entry.stats.total} items`, `${entry.stats.due} due • ${entry.stats.weak} weak • ${entry.stats.total} items`),
      tokens: `${entry.setName} set library review ${entry.searchBlob}`,
      run: () => { openSetDetails(entry.setName); }
    }));

    const merged = [...staticItems, ...setItems];
    const filtered = !q
      ? merged
      : merged.filter((item) => normalizeAnswer(`${item.label} ${item.note} ${item.tokens || ''}`).includes(q));
    return filtered.slice(0, q ? 14 : 10);
  }

  function renderCommandPalette(query = '') {
    ensureCommandPalette();
    const list = byId('commandPaletteList');
    const meta = byId('commandPaletteMeta');
    if (!list || !meta) return;
    const items = getCommandPaletteItems(query);
    state.vmCommandPalette.activeIndex = Math.max(0, Math.min(state.vmCommandPalette.activeIndex, Math.max(0, items.length - 1)));
    meta.textContent = items.length
      ? uiText(`${items.length} hành động sẵn sàng`, `${items.length} actions ready`, `${items.length} actions ready`)
      : uiText('Không thấy hành động phù hợp', 'No matching action found', 'No matching action found');

    if (!items.length) {
      list.innerHTML = `
        <div class="command-palette-empty">
          <strong>${escapeHtml(uiText('Không có kết quả', 'No result', 'No result'))}</strong>
          <span>${escapeHtml(uiText('Thử gõ review, backup, giao diện, hoặc tên bộ từ.', 'Try review, backup, appearance, or a set name.', 'Try review, backup, appearance, or a set name.'))}</span>
        </div>
      `;
      return;
    }

    list.innerHTML = items.map((item, index) => `
      <button class="command-palette-item ${index === state.vmCommandPalette.activeIndex ? 'active' : ''}" type="button" data-command-index="${index}">
        <span class="command-palette-icon">${escapeHtml(item.icon || '•')}</span>
        <span class="command-palette-copy">
          <strong>${escapeHtml(item.label)}</strong>
          <span>${escapeHtml(item.note)}</span>
        </span>
      </button>
    `).join('');
  }

  async function runCommandPaletteAction(item) {
    if (!item || typeof item.run !== 'function') return;
    closeCommandPalette();
    await Promise.resolve(item.run());
  }

  function openCommandPalette() {
    ensureCommandPalette();
    const overlay = byId('commandPaletteOverlay');
    const input = byId('commandPaletteInput');
    if (!overlay || !input) return;
    state.vmCommandPalette.open = true;
    state.vmCommandPalette.activeIndex = 0;
    overlay.classList.remove('hidden');
    renderCommandPalette('');
    input.value = '';
    window.requestAnimationFrame(() => input.focus());
  }

  function closeCommandPalette() {
    const overlay = byId('commandPaletteOverlay');
    if (!overlay) return;
    state.vmCommandPalette.open = false;
    overlay.classList.add('hidden');
  }

  const vm82OriginalRenderWordsetsGrid = renderWordsetsGrid;
  renderWordsetsGrid = function() {
    const grid = byId('wordsetGrid');
    if (!grid) return;

    if (!grid.dataset.vmDelegated) {
      grid.dataset.vmDelegated = 'true';
      grid.addEventListener('click', async (event) => {
        const createBtn = event.target.closest('[data-set-create]');
        if (createBtn) {
          showView('main-view');
          openModal('createSetModal');
          return;
        }
        const actionBtn = event.target.closest('[data-set-action]');
        if (!actionBtn) return;
        const setName = actionBtn.dataset.setName || '';
        const action = actionBtn.dataset.setAction || '';
        if (!setName) return;
        if (action === 'view') {
          openSetDetails(setName);
          return;
        }
        if (action === 'study') {
          showView('review-dashboard-view');
          byId('reviewSetDropdown').value = setName;
          initReviewView(true);
          return;
        }
        if (action === 'delete') {
          const confirmed = window.confirm(uiText(
            `Bạn có chắc muốn xóa toàn bộ bộ từ "${setName}"?`,
            `Are you sure you want to delete the whole set "${setName}"?`,
            `Are you sure you want to delete the whole set "${setName}"?`
          ));
          if (!confirmed) return;
          state.vocab = state.vocab.filter((word) => word.wordset !== setName);
          await saveAndRefresh({ showManagement: true });
          showToast(uiText(`Đã xóa bộ từ "${setName}".`, `Deleted the set "${setName}".`, `Deleted the set "${setName}".`));
        }
      });
    }

    const fragment = document.createDocumentFragment();

    const createCard = document.createElement('button');
    createCard.type = 'button';
    createCard.className = 'set-card create-new-card';
    createCard.dataset.setCreate = 'true';
    createCard.innerHTML = `<div class="create-new-content"><span class="create-icon">+</span><h2>${escapeHtml(uiText('Tạo bộ từ mới', 'Create a new set', 'Create a new set'))}</h2><p class="muted-text">${escapeHtml(uiText('Bắt đầu một nhóm từ mới và thêm dữ liệu ngay.', 'Start a fresh set and add data right away.', 'Start a fresh set and add data right away.'))}</p></div>`;
    fragment.appendChild(createCard);

    if (!state.vocab.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = `<strong>${escapeHtml(uiText('Chưa có từ vựng nào', 'No vocabulary yet', 'No vocabulary yet'))}</strong><div>${escapeHtml(uiText('Thêm vài từ đầu tiên để bắt đầu học và theo dõi tiến độ.', 'Add your first entries to start studying and tracking progress.', 'Add your first entries to start studying and tracking progress.'))}</div>`;
      fragment.appendChild(empty);
      grid.replaceChildren(fragment);
      return;
    }

    const query = normalizeAnswer(byId('setSearchInput')?.value || '');
    const sortBy = byId('setSortSelect')?.value || 'due';
    const entries = vm82GetSetIndex().filter((item) => !query || item.searchBlob.includes(query));

    const sorters = {
      due: (a, b) => b.stats.due - a.stats.due || b.stats.weak - a.stats.weak || a.setName.localeCompare(b.setName, 'vi'),
      recent: (a, b) => b.latest - a.latest || a.setName.localeCompare(b.setName, 'vi'),
      size: (a, b) => b.stats.total - a.stats.total || a.setName.localeCompare(b.setName, 'vi'),
      progress: (a, b) => b.stats.progress - a.stats.progress || a.setName.localeCompare(b.setName, 'vi'),
      name: (a, b) => a.setName.localeCompare(b.setName, 'vi')
    };
    entries.sort(sorters[sortBy] || sorters.due);

    if (!entries.length) {
      const emptySearch = document.createElement('div');
      emptySearch.className = 'set-card-search-empty';
      emptySearch.innerHTML = `<strong>${escapeHtml(uiText('Không tìm thấy bộ từ phù hợp', 'No matching set found', 'No matching set found'))}</strong><div>${escapeHtml(uiText('Thử đổi từ khóa hoặc thứ tự sắp xếp.', 'Try a different keyword or sorting order.', 'Try a different keyword or sorting order.'))}</div>`;
      fragment.appendChild(emptySearch);
      grid.replaceChildren(fragment);
      return;
    }

    entries.forEach((entry) => {
      const typeSummary = buildEntryTypeSummary(entry.words);
      const weakLabel = entry.weakTypes[0]?.[0];
      const card = document.createElement('article');
      card.className = 'set-card';
      card.innerHTML = `
        <div class="card-header">
          <div class="card-title-icon-wrapper">
            <span class="set-icon">🏷️</span>
            <span class="set-title">${escapeHtml(entry.setName)}</span>
          </div>
          <span class="summary-note">${entry.stats.progress}%</span>
        </div>
        <div class="card-details">
          <div class="card-metrics">
            <span>${escapeHtml(uiText(`${entry.words.length} từ`, `${entry.words.length} words`, `${entry.words.length} words`))}</span>
            <span>${escapeHtml(uiText(`${entry.stats.due} đến hạn`, `${entry.stats.due} due`, `${entry.stats.due} due`))}</span>
            <span>${escapeHtml(uiText(`${entry.stats.fresh} mới`, `${entry.stats.fresh} new`, `${entry.stats.fresh} new`))}</span>
            <span>${escapeHtml(uiText(`${entry.stats.weak} cần ôn`, `${entry.stats.weak} needs work`, `${entry.stats.weak} needs work`))}</span>
          </div>
          <div class="progress-bar-container"><div class="progress-bar" style="width:${entry.stats.progress}%"></div></div>
          <div class="card-metrics">
            <span>${escapeHtml(uiText(`${entry.stats.mastered}/${entry.stats.total || 0} đã vững`, `${entry.stats.mastered}/${entry.stats.total || 0} strong`, `${entry.stats.mastered}/${entry.stats.total || 0} strong`))}</span>
            <span>${escapeHtml(weakLabel ? uiText(`Yếu nhất: ${weakLabel}`, `Weakest: ${weakLabel}`, `Weakest: ${weakLabel}`) : uiText('Đang cân bằng', 'Balanced', 'Balanced'))}</span>
          </div>
          <div class="card-metrics compact-metrics">
            <span>${escapeHtml(typeSummary)}</span>
            <span>${escapeHtml(entry.topRiskWord ? uiText(`Risk cao nhất: ${entry.topRiskWord}`, `Highest risk: ${entry.topRiskWord}`, `Highest risk: ${entry.topRiskWord}`) : uiText('Risk ổn định', 'Risk is stable', 'Risk is stable'))}</span>
          </div>
        </div>
        <div class="card-action-bar">
          <button class="card-btn btn-view" data-set-action="view" data-set-name="${escapeHtml(entry.setName)}">${escapeHtml(uiText('Xem / sửa', 'View / edit', 'View / edit'))}</button>
          <button class="card-btn btn-study" data-set-action="study" data-set-name="${escapeHtml(entry.setName)}">${escapeHtml(uiText('Ôn ngay', 'Review now', 'Review now'))}</button>
          <button class="card-btn btn-delete" data-set-action="delete" data-set-name="${escapeHtml(entry.setName)}">${escapeHtml(uiText('Xóa', 'Delete', 'Delete'))}</button>
        </div>
      `;
      fragment.appendChild(card);
    });

    grid.replaceChildren(fragment);
  };

  const vm82OriginalInitManagementView = initManagementView;
  initManagementView = function(force = false) {
    vm82OriginalInitManagementView(force);
    ensureManagementWorkbench();
    setManagementWorkbenchPanel(state.vmManagementPanel || 'library');
  };

  const vm82OriginalApplyLanguageModeUI = applyLanguageModeUI;
  applyLanguageModeUI = function() {
    vm82OriginalApplyLanguageModeUI();
    ensureManagementWorkbench();
    setTextValue('#managementWorkbenchCommandBtn', uiText('⌘ Lệnh nhanh', '⌘ Quick actions', '⌘ Quick actions'));
    setTextValue('#managementWorkbenchTitle', uiText('Mở đúng phần bạn cần', 'Open only what you need', 'Open only what you need'));
    setTextValue('#managementWorkbenchNote', getManagementWorkbenchNote(state.vmManagementPanel || 'library'));
    const launcher = byId('commandPaletteLauncher');
    if (launcher) {
      const label = launcher.querySelector('.nav-command-label');
      const hint = launcher.querySelector('.nav-command-hint');
      if (label) label.textContent = uiText('Lệnh nhanh', 'Quick actions', 'Quick actions');
      if (hint) hint.textContent = 'Ctrl K';
    }
    if (state.vmCommandPalette.open) {
      renderCommandPalette(byId('commandPaletteInput')?.value || '');
    }
  };

  const vm82OriginalShowView = showView;
  showView = function(viewIdToShow) {
    vm82OriginalShowView(viewIdToShow);
    if (viewIdToShow === 'management-view') {
      window.requestAnimationFrame(() => {
        ensureManagementWorkbench();
        setManagementWorkbenchPanel(state.vmManagementPanel || 'library');
      });
    }
  };

  if (document.body.dataset.vm82PaletteBound !== 'true') {
    document.body.dataset.vm82PaletteBound = 'true';
    document.addEventListener('keydown', (event) => {
      const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
      const quickActionPressed = (isMac ? event.metaKey : event.ctrlKey) && event.key.toLowerCase() === 'k';
      if (quickActionPressed) {
        event.preventDefault();
        if (state.vmCommandPalette.open) closeCommandPalette();
        else openCommandPalette();
        return;
      }
      if (event.key === 'Escape' && state.vmCommandPalette.open) {
        event.preventDefault();
        closeCommandPalette();
      }
    });
  }

  ensureCommandPalette();
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => { try { vm82GetSetIndex(); } catch (error) {} }, { timeout: 180 });
  } else {
    window.setTimeout(() => { try { vm82GetSetIndex(); } catch (error) {} }, 120);
  }



  // v8.2.2 navigation hotfix: cancel hidden heavy renders and mount target views asynchronously.
  state.vmNavRuntime = state.vmNavRuntime || { rafId: 0, timerId: 0, token: 0 };
  state.vmReviewContextCache = state.vmReviewContextCache || { key: '', map: new Map() };

  function vmCancelScheduledViewMount() {
    if (state.vmNavRuntime?.rafId) {
      window.cancelAnimationFrame(state.vmNavRuntime.rafId);
      state.vmNavRuntime.rafId = 0;
    }
    if (state.vmNavRuntime?.timerId) {
      window.clearTimeout(state.vmNavRuntime.timerId);
      state.vmNavRuntime.timerId = 0;
    }
    if (state.vmNavRuntime) state.vmNavRuntime.token += 1;
  }

  function vmResetReviewContextCache() {
    state.vmReviewContextCache = { key: `${state.dataRevision}|${state.vocab.length}`, map: new Map() };
  }

  function vmGetReviewContext(setName = 'all') {
    const baseKey = `${state.dataRevision}|${state.vocab.length}`;
    if (!state.vmReviewContextCache || state.vmReviewContextCache.key !== baseKey) {
      vmResetReviewContextCache();
    }
    const cache = state.vmReviewContextCache.map;
    if (cache.has(setName)) return cache.get(setName);

    const words = setName === 'all'
      ? state.vocab
      : ((vm82GetSetIndex().find((entry) => entry.setName === setName)?.words) || []);
    const context = { words, stats: getSetStats(words) };
    cache.set(setName, context);
    return context;
  }

  const vmHotfixOriginalPersistState = persistState;
  persistState = async function(reason = 'auto-save') {
    const result = await vmHotfixOriginalPersistState(reason);
    vmResetReviewContextCache();
    return result;
  };

  const vmHotfixOriginalScheduleReviewHeavyRender = scheduleReviewHeavyRender;
  scheduleReviewHeavyRender = function(task) {
    vmHotfixOriginalScheduleReviewHeavyRender(() => {
      const reviewView = byId('review-dashboard-view');
      if (!reviewView || reviewView.classList.contains('hidden') || document.body.dataset.currentView !== 'review-dashboard-view') return;
      task();
    });
  };

  const vmHotfixOriginalRenderReviewDashboard = renderReviewDashboard;
  renderReviewDashboard = function() {
    const setName = byId('reviewSetDropdown')?.value || 'all';
    const context = vmGetReviewContext(setName);
    renderReviewDashboardShell(context.words, context.stats);
    if (byId('reviewDeepDiveDetails') && !context.words.length) byId('reviewDeepDiveDetails').open = true;
    syncReviewDeepDiveState();

    scheduleReviewHeavyRender(() => {
      if (document.body.dataset.currentView !== 'review-dashboard-view') return;
      vmHotfixOriginalRenderReviewDashboard();
    });
  };

  const vmHotfixOriginalShowView = showView;
  showView = function(viewIdToShow) {
    const previousView = document.body.dataset.currentView || '';
    if (previousView && previousView !== viewIdToShow) {
      vmCancelScheduledViewMount();
      if (typeof cancelPendingReviewRender === 'function') cancelPendingReviewRender();
      window.dispatchEvent(new CustomEvent('vm:cancel-heavy-render', { detail: { from: previousView, to: viewIdToShow } }));
    }

    vmHotfixOriginalShowView(viewIdToShow);
    if (previousView === viewIdToShow) return;

    const token = ++state.vmNavRuntime.token;
    const mount = () => {
      if (token !== state.vmNavRuntime.token) return;
      state.vmNavRuntime.timerId = 0;
      if (viewIdToShow === 'main-view') {
        initMainView(false);
        return;
      }
      if (viewIdToShow === 'management-view') {
        initManagementView(false);
        if (typeof ensureManagementWorkbench === 'function') ensureManagementWorkbench();
        if (typeof setManagementWorkbenchPanel === 'function') setManagementWorkbenchPanel(state.vmManagementPanel || 'library');
        return;
      }
      if (viewIdToShow === 'review-dashboard-view') {
        initReviewView(false);
      }
    };

    state.vmNavRuntime.rafId = window.requestAnimationFrame(() => {
      if (token !== state.vmNavRuntime.token) return;
      state.vmNavRuntime.rafId = 0;
      state.vmNavRuntime.timerId = window.setTimeout(mount, 0);
    });
  };

  const vmHotfixOriginalExitCurrentGame = exitCurrentGame;
  exitCurrentGame = function() {
    if (typeof cancelPendingReviewRender === 'function') cancelPendingReviewRender();
    vmHotfixOriginalExitCurrentGame();
  };

  const vmHotfixOriginalGetWordsForSet = getWordsForSet;
  getWordsForSet = function(setName) {
    const safeSetName = setName || 'all';
    if (safeSetName === 'all') return state.vocab;
    const entry = vm82GetSetIndex().find((item) => item.setName === safeSetName);
    return entry?.words || vmHotfixOriginalGetWordsForSet(safeSetName);
  };


  // v8.2.3 review speed patch: keep navigation instant and load deep review only on demand.
  state.vmPerf = state.vmPerf || {
    initGate: {
      review: { sig: '', at: 0 },
      management: { sig: '', at: 0 },
      main: { sig: '', at: 0 }
    },
    contrastQueueCache: { key: '', map: new Map() }
  };

  function vmPerfBaseKey() {
    return `${state.dataRevision}|${state.vocab.length}`;
  }

  function vmPerfNow() {
    return window.performance && typeof window.performance.now === 'function'
      ? window.performance.now()
      : Date.now();
  }

  function vmPerfShouldSkip(bucket, sig, windowMs = 120) {
    const gate = state.vmPerf.initGate[bucket] || (state.vmPerf.initGate[bucket] = { sig: '', at: 0 });
    const now = vmPerfNow();
    if (gate.sig === sig && (now - gate.at) < windowMs) return true;
    gate.sig = sig;
    gate.at = now;
    return false;
  }

  function vmResetPerfCaches() {
    state.vmPerf.contrastQueueCache = { key: vmPerfBaseKey(), map: new Map() };
  }

  vmResetPerfCaches();

  const vm823OriginalPersistState = persistState;
  persistState = async function(reason = 'auto-save') {
    const result = await vm823OriginalPersistState(reason);
    vmResetPerfCaches();
    return result;
  };

  const vm823OriginalGetContrastQueue = getContrastQueue;
  getContrastQueue = function(words, limit = 10) {
    if (!Array.isArray(words) || !words.length) return [];
    const baseKey = vmPerfBaseKey();
    if (!state.vmPerf.contrastQueueCache || state.vmPerf.contrastQueueCache.key !== baseKey) {
      vmResetPerfCaches();
    }
    const cache = state.vmPerf.contrastQueueCache.map;
    const cacheKey = words.length <= 24
      ? `${words.map(word => word.id).join('|')}|${limit}`
      : `${words.length}:${words[0]?.id || ''}:${words[words.length - 1]?.id || ''}:${words.reduce((sum, word) => sum + (Number(word.id) || 0), 0)}|${limit}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);
    const queue = vm823OriginalGetContrastQueue(words, limit);
    cache.set(cacheKey, queue);
    return queue;
  };

  scheduleReviewHeavyRender = function(task) {
    cancelPendingReviewRender();
    const token = state.reviewRenderToken;
    const run = () => {
      state.reviewDeferredTimer = 0;
      if (token !== state.reviewRenderToken) return;
      const reviewView = byId('review-dashboard-view');
      if (!reviewView || reviewView.classList.contains('hidden')) return;
      if (document.body.dataset.currentView !== 'review-dashboard-view') return;
      task();
    };
    state.reviewDeferredTimer = window.setTimeout(() => {
      if ('requestAnimationFrame' in window) {
        window.requestAnimationFrame(run);
      } else {
        run();
      }
    }, 12);
  };

  initReviewView = function(force = false) {
    const select = byId('reviewSetDropdown');
    const targetSet = state.vmPendingReviewSet || select?.value || 'all';
    const sig = `${vmPerfBaseKey()}|${targetSet}`;
    if (!force && vmPerfShouldSkip('review', sig, 120)) return;
    populateSetDropdown(select, true);
    if (select && Array.from(select.options).some(option => option.value === targetSet)) {
      select.value = targetSet;
    }
    state.vmPendingReviewSet = '';
    ensureClusterMissionPanel();
    renderReviewDashboard();
  };

  const vm823OriginalInitManagementView = initManagementView;
  initManagementView = function(force = false) {
    const sig = `${vmPerfBaseKey()}|${state.vmManagementPanel || 'library'}`;
    if (!force && vmPerfShouldSkip('management', sig, 90)) return;
    vm823OriginalInitManagementView(force);
  };

  const vm823OriginalShowView = showView;
  showView = function(viewIdToShow) {
    const previousView = document.body.dataset.currentView || '';
    if (viewIdToShow === 'review-dashboard-view' && previousView !== 'review-dashboard-view') {
      const details = byId('reviewDeepDiveDetails');
      if (details) details.open = false;
      syncReviewDeepDiveState();
    }
    vm823OriginalShowView(viewIdToShow);
  };

  const vm823OriginalRenderReviewDashboard = typeof vmHotfixOriginalRenderReviewDashboard === 'function'
    ? vmHotfixOriginalRenderReviewDashboard
    : renderReviewDashboard;

  renderReviewDashboard = function(forceDeepDive = false) {
    const setName = byId('reviewSetDropdown')?.value || state.vmPendingReviewSet || 'all';
    const context = vmGetReviewContext(setName);
    renderReviewDashboardShell(context.words, context.stats);

    const details = byId('reviewDeepDiveDetails');
    if (details && !context.words.length) details.open = true;
    syncReviewDeepDiveState();

    const shouldRenderDeepDive = forceDeepDive || Boolean(details?.open);
    if (!shouldRenderDeepDive) {
      cancelPendingReviewRender();
      return;
    }

    const previousScheduler = scheduleReviewHeavyRender;
    scheduleReviewHeavyRender = function(task) {
      cancelPendingReviewRender();
      const token = state.reviewRenderToken;
      state.reviewDeferredTimer = window.setTimeout(() => {
        state.reviewDeferredTimer = 0;
        if (token !== state.reviewRenderToken) return;
        const reviewView = byId('review-dashboard-view');
        if (!reviewView || reviewView.classList.contains('hidden')) return;
        if (document.body.dataset.currentView !== 'review-dashboard-view') return;
        task();
      }, 0);
    };
    try {
      vm823OriginalRenderReviewDashboard();
    } finally {
      scheduleReviewHeavyRender = previousScheduler;
    }
  };

  if (byId('reviewDeepDiveDetails') && byId('reviewDeepDiveDetails').dataset.vm823Bound !== 'true') {
    byId('reviewDeepDiveDetails').dataset.vm823Bound = 'true';
    byId('reviewDeepDiveDetails').addEventListener('toggle', () => {
      if (byId('reviewDeepDiveDetails').open && document.body.dataset.currentView === 'review-dashboard-view') {
        renderReviewDashboard(true);
      }
    });
  }

  document.addEventListener('click', (event) => {
    const studyBtn = event.target.closest('#wordsetGrid [data-set-action="study"]');
    if (!studyBtn) return;
    state.vmPendingReviewSet = studyBtn.dataset.setName || '';
  }, true);



  // ===== v8.3.0 momentum cockpit, adaptive session caps, and review cache prewarm =====
  state.vm830 = state.vm830 || {
    prefs: { sessionSize: 'flow', autoPrewarm: true, customSessionCap: 0 },
    warmTimer: 0,
    warmKey: '',
    mounted: false
  };

  const VM830_SESSION_SIZE_OPTIONS = ['sprint', 'flow', 'deep'];

  function vm830NormalizePrefs(raw = {}) {
    const sessionSize = VM830_SESSION_SIZE_OPTIONS.includes(raw?.sessionSize) ? raw.sessionSize : 'flow';
    const customSessionCap = Math.max(0, Math.min(30, Number(raw?.customSessionCap) || 0));
    return {
      sessionSize,
      autoPrewarm: raw?.autoPrewarm !== false,
      customSessionCap
    };
  }

  async function vm830LoadPrefs() {
    try {
      const result = await storage.get({ vm830_prefs: null });
      state.vm830.prefs = vm830NormalizePrefs(result?.vm830_prefs || {});
    } catch (error) {
      state.vm830.prefs = vm830NormalizePrefs({});
    }
  }

  async function vm830SavePrefs() {
    await storage.set({ vm830_prefs: state.vm830.prefs });
    if (document.body.dataset.currentView === 'review-dashboard-view') {
      const setName = byId('reviewSetDropdown')?.value || 'all';
      const context = typeof vmGetReviewContext === 'function'
        ? vmGetReviewContext(setName)
        : { words: getWordsForSet(setName), stats: getSetStats(getWordsForSet(setName)) };
      vm830RenderGrowthDock(context.words, context.stats);
    }
    vm830SchedulePrewarm('prefs-save');
  }

  function vm830GetSessionSize() {
    return VM830_SESSION_SIZE_OPTIONS.includes(state.vm830?.prefs?.sessionSize)
      ? state.vm830.prefs.sessionSize
      : 'flow';
  }

  function vm830GetSessionCap(gameType = 'flashcard') {
    const customCap = Math.max(0, Math.min(30, Number(state.vm830?.prefs?.customSessionCap) || 0));
    if (customCap >= 4) return customCap;
    const mode = vm830GetSessionSize();
    const caps = {
      sprint: { flashcard: 8, srs: 8, quiz: 6, typing: 6, dictation: 6, contrast: 6, matching: 4 },
      flow: { flashcard: 12, srs: 12, quiz: 8, typing: 8, dictation: 8, contrast: 8, matching: 6 },
      deep: { flashcard: 20, srs: 18, quiz: 10, typing: 10, dictation: 10, contrast: 10, matching: 8 }
    };
    return caps[mode]?.[gameType] || 12;
  }

  function vm830TrimQueue(queue, gameType = 'flashcard') {
    if (!Array.isArray(queue) || !queue.length) return [];
    const cap = Math.max(4, vm830GetSessionCap(gameType));
    if (queue.length <= cap) return queue;
    if (gameType === 'srs' || gameType === 'typing' || gameType === 'dictation' || gameType === 'contrast') {
      return queue.slice(0, cap);
    }
    return diversifyStudyQueue(queue, cap);
  }

  function vm830GetSessionSizeLabel() {
    const labels = {
      sprint: uiText('Sprint 5 phút', 'Sprint 5 min', 'Sprint 5 min'),
      flow: uiText('Flow cân bằng', 'Balanced flow', 'Balanced flow'),
      deep: uiText('Deep review', 'Deep review', 'Deep review')
    };
    return labels[vm830GetSessionSize()] || labels.flow;
  }

  function vm830GetGrowthTone(words, stats) {
    if (!words.length) {
      return {
        title: uiText('Chưa có dữ liệu học', 'No learning data yet', 'No learning data yet'),
        note: uiText('Thêm vài từ rồi hệ thống sẽ gợi ý nhịp học phù hợp nhất.', 'Add a few words and the system will guide the best learning rhythm.', 'Add a few words and the system will guide the best learning rhythm.')
      };
    }
    const today = getDailyProgressRecord();
    const remaining = Math.max(0, Number(state.stats?.dailyGoal || 12) - Number(today.studied || 0));
    if (stats.due > 0) {
      return {
        title: uiText('Giải cứu trí nhớ trước', 'Rescue memory first', 'Rescue memory first'),
        note: uiText(`Bạn còn ${stats.due} mục đến hạn. Dọn lane này trước để tốc độ nhớ tăng bền hơn.`, `You still have ${stats.due} due item(s). Clear this lane first for steadier retention.`, `You still have ${stats.due} due item(s). Clear this lane first for steadier retention.`)
      };
    }
    if (stats.weak > 0) {
      return {
        title: uiText('Đẩy sang nhớ chủ động', 'Push into active recall', 'Push into active recall'),
        note: uiText(`Có ${stats.weak} mục yếu. Một lượt typing hoặc context burst ngắn sẽ kéo tốc độ nhớ lên nhanh hơn.`, `There are ${stats.weak} weak item(s). A short typing or context burst should raise retention faster.`, `There are ${stats.weak} weak item(s). A short typing or context burst should raise retention faster.`)
      };
    }
    if (remaining > 0) {
      return {
        title: uiText('Giữ nhịp tăng trưởng hôm nay', 'Keep today\'s growth alive', 'Keep today\'s growth alive'),
        note: uiText(`Bạn chỉ còn ${remaining} lượt nữa là chạm mục tiêu hôm nay.`, `Only ${remaining} more rep(s) to hit today\'s goal.`, `Only ${remaining} more rep(s) to hit today\'s goal.`)
      };
    }
    return {
      title: uiText('Tăng phản xạ qua ngữ cảnh', 'Build speed through context', 'Build speed through context'),
      note: uiText('Mở một context burst hoặc contrast lane để chuyển từ nhớ sang dùng thật.', 'Open a context burst or contrast lane to shift from remembering to using.', 'Open a context burst or contrast lane to shift from remembering to using.')
    };
  }

  function vm830GetContextReadyCount(words = []) {
    return words.filter(word => (typeof getWordSentenceBank === 'function' && getWordSentenceBank(word).length > 0) || word.example).length;
  }

  function vm830StartContextBurst() {
    const setName = byId('reviewSetDropdown')?.value || 'all';
    const words = getWordsForSet(setName);
    const sentenceReady = words.filter(word => (typeof getWordSentenceBank === 'function' && getWordSentenceBank(word).length > 0));
    if (sentenceReady.length) {
      startSentenceBankClozeSession(setName);
      return;
    }
    const exampleReady = words.filter(word => String(word.example || '').trim());
    if (exampleReady.length >= 4) {
      startGame('quiz', setName, {
        queue: vm830TrimQueue(diversifyStudyQueue(exampleReady, Math.min(exampleReady.length, 12)), 'quiz'),
        forceQuizMode: 'context',
        planTitle: uiText('Context Burst', 'Context Burst', 'Context Burst'),
        planReason: uiText('Đi nhanh qua các ví dụ để kéo từ vào ngữ cảnh thật.', 'Run through examples quickly to pull the words into real context.', 'Run through examples quickly to pull the words into real context.')
      });
      return;
    }
    showToast(uiText('Hãy thêm ví dụ hoặc lưu vài câu của bạn để mở Context Burst.', 'Add examples or save a few of your own sentences to open Context Burst.', 'Add examples or save a few of your own sentences to open Context Burst.'));
  }

  function vm830EnsureGrowthDock() {
    const hero = byId('reviewFocusHero');
    if (!hero || byId('growthDockPanel')) return;
    const panel = document.createElement('section');
    panel.id = 'growthDockPanel';
    panel.className = 'growth-dock-panel';
    panel.innerHTML = `
      <div class="growth-dock-shell">
        <div class="growth-dock-copy">
          <div class="growth-dock-kicker">${escapeHtml(uiText('Growth cockpit', 'Growth cockpit', 'Growth cockpit'))}</div>
          <strong id="growthDockTitle">${escapeHtml(uiText('Giữ nhịp học đều hơn', 'Keep the learning rhythm steady', 'Keep the learning rhythm steady'))}</strong>
          <p id="growthDockNote" class="muted-text">${escapeHtml(uiText('Chọn nhịp phiên và mở đúng lane để nhớ nhanh nhưng không quá tải.', 'Pick the session tempo and launch the right lane so retention grows without overload.', 'Pick the session tempo and launch the right lane so retention grows without overload.'))}</p>
        </div>
        <div class="growth-dock-metrics">
          <div class="growth-chip-card">
            <span>${escapeHtml(uiText('Chuỗi học', 'Streak', 'Streak'))}</span>
            <strong id="growthDockStreak">0</strong>
            <small id="growthDockStreakNote">${escapeHtml(uiText('giữ nhiệt', 'keep momentum', 'keep momentum'))}</small>
          </div>
          <div class="growth-chip-card">
            <span>${escapeHtml(uiText('Mục tiêu hôm nay', 'Today\'s goal', 'Today\'s goal'))}</span>
            <strong id="growthDockGoal">0/12</strong>
            <small id="growthDockGoalNote">${escapeHtml(uiText('đang nạp', 'loading', 'loading'))}</small>
          </div>
          <div class="growth-chip-card">
            <span>${escapeHtml(uiText('Điểm yếu nhất', 'Weakest lane', 'Weakest lane'))}</span>
            <strong id="growthDockWeakSkill">—</strong>
            <small id="growthDockWeakSkillNote">${escapeHtml(uiText('chưa có', 'no signal yet', 'no signal yet'))}</small>
          </div>
        </div>
        <div class="growth-dock-controls">
          <div class="growth-session-size" role="group" aria-label="Session size">
            <button type="button" class="growth-size-btn" data-session-size="sprint">${escapeHtml(uiText('Sprint', 'Sprint', 'Sprint'))}</button>
            <button type="button" class="growth-size-btn" data-session-size="flow">${escapeHtml(uiText('Flow', 'Flow', 'Flow'))}</button>
            <button type="button" class="growth-size-btn" data-session-size="deep">${escapeHtml(uiText('Deep', 'Deep', 'Deep'))}</button>
          </div>
          <div class="growth-session-customizer">
            <label for="growthCustomCapInput">${escapeHtml(uiText('Số từ mỗi phiên', 'Words per session', 'Words per session'))}</label>
            <div class="growth-session-customizer-row">
              <input id="growthCustomCapInput" class="modern-input growth-cap-input" type="number" min="4" max="30" step="1" placeholder="${escapeHtml(uiText('Theo nhịp tự động', 'Use adaptive cap', 'Use adaptive cap'))}">
              <button type="button" class="secondary-btn slim-btn" data-growth-action="save-cap">${escapeHtml(uiText('Lưu', 'Save', 'Save'))}</button>
              <button type="button" class="secondary-btn slim-btn" data-growth-action="reset-cap">${escapeHtml(uiText('Tự động', 'Auto', 'Auto'))}</button>
            </div>
          </div>
          <div class="growth-quick-actions">
            <button type="button" class="secondary-btn slim-btn" data-growth-action="due">${escapeHtml(uiText('⚡ Rescue', '⚡ Rescue', '⚡ Rescue'))}</button>
            <button type="button" class="secondary-btn slim-btn" data-growth-action="weak">${escapeHtml(uiText('🧠 Recall', '🧠 Recall', '🧠 Recall'))}</button>
            <button type="button" class="secondary-btn slim-btn" data-growth-action="context">${escapeHtml(uiText('✍ Context', '✍ Context', '✍ Context'))}</button>
          </div>
          <div id="growthDockMeta" class="growth-dock-meta"></div>
        </div>
      </div>
    `;
    const strip = hero.querySelector('.review-priority-strip');
    if (strip) strip.insertAdjacentElement('afterend', panel);
    else hero.appendChild(panel);
  }

  function vm830RenderGrowthDock(words = [], stats = getSetStats(words)) {
    vm830EnsureGrowthDock();
    const titleNode = byId('growthDockTitle');
    const noteNode = byId('growthDockNote');
    const streakNode = byId('growthDockStreak');
    const streakNote = byId('growthDockStreakNote');
    const goalNode = byId('growthDockGoal');
    const goalNote = byId('growthDockGoalNote');
    const weakNode = byId('growthDockWeakSkill');
    const weakNote = byId('growthDockWeakSkillNote');
    const metaNode = byId('growthDockMeta');
    if (!titleNode || !noteNode || !streakNode || !goalNode || !weakNode || !metaNode) return;

    const tone = vm830GetGrowthTone(words, stats);
    const today = getDailyProgressRecord();
    const weakestSkill = typeof getWeakestSkillAcrossWords === 'function' ? getWeakestSkillAcrossWords(words) : null;
    const contextReady = vm830GetContextReadyCount(words);
    const cap = vm830GetSessionCap(stats.due > 0 ? 'srs' : stats.weak > 0 ? 'typing' : 'flashcard');

    titleNode.textContent = tone.title;
    noteNode.textContent = tone.note;
    streakNode.textContent = `${state.stats?.currentStreak || 0}`;
    streakNote.textContent = uiText(
      state.stats?.currentStreak ? `Best ${state.stats.bestStreak || state.stats.currentStreak}` : 'Bắt đầu lại nhẹ nhàng',
      state.stats?.currentStreak ? `Best ${state.stats.bestStreak || state.stats.currentStreak}` : 'Restart gently',
      state.stats?.currentStreak ? `Best ${state.stats.bestStreak || state.stats.currentStreak}` : 'Restart gently'
    );
    goalNode.textContent = `${Math.min(today.studied || 0, state.stats.dailyGoal || 12)}/${state.stats.dailyGoal || 12}`;
    goalNote.textContent = today.studied >= (state.stats.dailyGoal || 12)
      ? uiText('đã chạm mục tiêu', 'goal reached', 'goal reached')
      : uiText(`còn ${Math.max(0, (state.stats.dailyGoal || 12) - (today.studied || 0))} lượt`, `${Math.max(0, (state.stats.dailyGoal || 12) - (today.studied || 0))} rep(s) left`, `${Math.max(0, (state.stats.dailyGoal || 12) - (today.studied || 0))} rep(s) left`);
    weakNode.textContent = weakestSkill ? getSkillLabel(weakestSkill.key) : uiText('Ổn định', 'Stable', 'Stable');
    weakNote.textContent = weakestSkill
      ? uiText(`avg ${weakestSkill.average}`, `avg ${weakestSkill.average}`, `avg ${weakestSkill.average}`)
      : uiText('chưa có lane yếu', 'no weak lane yet', 'no weak lane yet');
    metaNode.textContent = uiText(
      `${vm830GetSessionSizeLabel()} • ${cap} mục / phiên • ${contextReady} mục sẵn context`,
      `${vm830GetSessionSizeLabel()} • ${cap} items / session • ${contextReady} context-ready`,
      `${vm830GetSessionSizeLabel()} • ${cap} items / session • ${contextReady} context-ready`
    );

    const customCapInput = byId('growthCustomCapInput');
    if (customCapInput && document.activeElement !== customCapInput) {
      customCapInput.value = state.vm830?.prefs?.customSessionCap >= 4 ? String(state.vm830.prefs.customSessionCap) : '';
    }

    document.querySelectorAll('#growthDockPanel [data-session-size]').forEach((button) => {
      button.classList.toggle('active', button.dataset.sessionSize === vm830GetSessionSize());
    });
    const dueBtn = document.querySelector('#growthDockPanel [data-growth-action="due"]');
    const weakBtn = document.querySelector('#growthDockPanel [data-growth-action="weak"]');
    const contextBtn = document.querySelector('#growthDockPanel [data-growth-action="context"]');
    if (dueBtn) dueBtn.disabled = !stats.due;
    if (weakBtn) weakBtn.disabled = !stats.weak;
    if (contextBtn) contextBtn.disabled = contextReady < 1 && words.filter(word => String(word.example || '').trim()).length < 4;
  }

  function vm830SchedulePrewarm(reason = 'idle') {
    if (!state.vm830?.prefs?.autoPrewarm) return;
    if (state.vm830.warmTimer) window.clearTimeout(state.vm830.warmTimer);
    const currentKey = `${state.dataRevision}|${state.vocab.length}|${document.body.dataset.currentView || ''}|${reason}`;
    if (state.vm830.warmKey === currentKey) return;
    state.vm830.warmKey = currentKey;
    state.vm830.warmTimer = window.setTimeout(() => {
      const run = () => {
        try {
          const index = typeof vm82GetSetIndex === 'function' ? vm82GetSetIndex() : [];
          const warmNames = ['all', ...index
            .slice()
            .sort((a, b) => (b.stats?.due || 0) - (a.stats?.due || 0) || (b.stats?.weak || 0) - (a.stats?.weak || 0) || (b.latest || 0) - (a.latest || 0))
            .slice(0, 4)
            .map((entry) => entry.setName)
          ];
          warmNames.forEach((setName) => {
            if (typeof vmGetReviewContext === 'function') {
              const context = vmGetReviewContext(setName);
              if (typeof getContrastQueue === 'function' && context?.words?.length) getContrastQueue(context.words, vm830GetSessionCap('contrast'));
            } else {
              const words = getWordsForSet(setName);
              getSetStats(words);
            }
          });
        } catch (error) {}
      };
      if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 220 });
      else run();
    }, 90);
  }

  const vm830OriginalInit = init;
  init = async function() {
    await vm830LoadPrefs();
    await vm830OriginalInit();
    vm830EnsureGrowthDock();
    const setName = byId('reviewSetDropdown')?.value || 'all';
    const context = typeof vmGetReviewContext === 'function'
      ? vmGetReviewContext(setName)
      : { words: getWordsForSet(setName), stats: getSetStats(getWordsForSet(setName)) };
    vm830RenderGrowthDock(context.words, context.stats);
    vm830SchedulePrewarm('init');
  };

  const vm830OriginalRenderReviewDashboardShell = renderReviewDashboardShell;
  renderReviewDashboardShell = function(words, stats) {
    vm830OriginalRenderReviewDashboardShell(words, stats);
    vm830RenderGrowthDock(words, stats);
  };

  const vm830OriginalGetSessionQueue = getSessionQueue;
  getSessionQueue = function(words, gameType) {
    return vm830TrimQueue(vm830OriginalGetSessionQueue(words, gameType), gameType);
  };

  startRecommendedStudy = function() {
    const setName = byId('reviewSetDropdown')?.value || 'all';
    const words = getWordsForSet(setName);
    const plan = getRecommendedStudyPlan(words);
    if (!plan.gameType) return showToast(uiText('Hãy thêm vài từ trước khi bắt đầu học.', 'Add a few words before you start learning.', 'Add a few words before you start learning.'));
    if (plan.gameType === 'contrast') {
      startContrastLane(setName);
      return;
    }
    const queue = plan.gameType === 'srs'
      ? vm830TrimQueue(getRecommendedQueue(words, 20), 'srs')
      : vm830TrimQueue(getSessionQueue(words, plan.gameType), plan.gameType);
    startGame(plan.gameType, setName, { planTitle: plan.title, planReason: plan.reason, queue });
  };

  startTargetedFocus = function(type) {
    const setName = byId('reviewSetDropdown')?.value || 'all';
    const words = getWordsForSet(setName);
    const filters = {
      due: words.filter(isDueWord),
      weak: words.filter(isWeakWord),
      new: words.filter(isNewWord)
    };
    const config = {
      due: { gameType: 'srs', title: uiText('Ôn từ đến hạn', 'Review due words', 'Review due words'), reason: uiText('Giữ nền tảng trí nhớ không bị tụt.', 'Keep the memory base from slipping.', 'Keep the memory base from slipping.') },
      weak: { gameType: 'typing', title: uiText('Ôn từ yếu', 'Drill weak words', 'Drill weak words'), reason: uiText('Kéo các từ còn yếu sang nhớ chủ động.', 'Pull weak items into active recall.', 'Pull weak items into active recall.') },
      new: { gameType: 'flashcard', title: uiText('Làm quen từ mới', 'Warm up new words', 'Warm up new words'), reason: uiText('Xây lớp ghi nhớ đầu tiên thật nhẹ nhàng.', 'Build the first memory layer gently.', 'Build the first memory layer gently.') }
    }[type];
    const queue = vm830TrimQueue(diversifyStudyQueue(filters[type] || [], type === 'weak' ? 12 : 20), config?.gameType || 'flashcard');
    if (!queue.length || !config) return showToast(uiText('Hiện chưa có nhóm từ phù hợp để mở nhanh.', 'There is no suitable group to launch right now.', 'There is no suitable group to launch right now.'));
    startGame(config.gameType, setName, { queue, planTitle: config.title, planReason: config.reason });
  };

  const vm830OriginalStartSentenceBankClozeSession = startSentenceBankClozeSession;
  startSentenceBankClozeSession = function(setName = state.currentDetailsSet || byId('reviewSetDropdown')?.value || 'all') {
    const words = getWordsForSet(setName).filter(word => getWordSentenceBank(word).length > 0);
    const queue = vm830TrimQueue(diversifyStudyQueue(words, Math.min(words.length, 12)), 'quiz');
    if (!queue.length) return showToast(uiText('Hãy lưu vài câu của chính bạn trước khi mở cloze review.', 'Save a few of your own sentences before opening cloze review.', 'Save a few of your own sentences before opening cloze review.'));
    startGame('quiz', setName, {
      queue,
      forceQuizMode: 'context',
      planTitle: uiText('Cloze Review', 'Cloze Review', 'Cloze Review'),
      planReason: uiText('Dùng câu ví dụ và câu tự viết để kéo từ vào ngữ cảnh thật.', 'Use examples and your own sentences to pull the word into real context.', 'Use examples and your own sentences to pull the word into real context.')
    });
  };

  const vm830OriginalStartContrastLane = startContrastLane;
  startContrastLane = function(setName = byId('reviewSetDropdown')?.value || 'all') {
    const words = getWordsForSet(setName);
    const queue = vm830TrimQueue(getContrastQueue(words, 10), 'contrast');
    if (queue.length < 4) return showToast(uiText('Contrast lane cần ít nhất 4 mục có vùng dễ nhầm.', 'Contrast lane needs at least 4 confusion-linked items.', 'Contrast lane needs at least 4 confusion-linked items.'));
    startGame('contrast', setName, {
      queue,
      planTitle: uiText('Contrast Lane', 'Contrast Lane', 'Contrast Lane'),
      planReason: uiText('Tách rõ các từ gần nghĩa hoặc gần hình thức trước khi chúng nhập làm một.', 'Separate near-meaning or near-form words before they merge together.', 'Separate near-meaning or near-form words before they merge together.')
    });
  };

  const vm830OriginalPersistState = persistState;
  persistState = async function(reason = 'auto-save') {
    const result = await vm830OriginalPersistState(reason);
    vm830SchedulePrewarm(reason);
    return result;
  };

  const vm830OriginalRenderSessionSummary = renderSessionSummary;
  renderSessionSummary = function(message) {
    vm830OriginalRenderSessionSummary(message);
    const textNode = byId('sessionSummaryText');
    if (!textNode || !state.sessionStats) return;
    const today = getDailyProgressRecord();
    const nextGoalLeft = Math.max(0, (state.stats.dailyGoal || 12) - (today.studied || 0));
    const extraLine = uiText(
      ` • Nhịp phiên: ${vm830GetSessionSizeLabel()} • Còn ${nextGoalLeft} lượt để chạm mục tiêu hôm nay.`,
      ` • Session tempo: ${vm830GetSessionSizeLabel()} • ${nextGoalLeft} rep(s) left to hit today\'s goal.`,
      ` • Session tempo: ${vm830GetSessionSizeLabel()} • ${nextGoalLeft} rep(s) left to hit today\'s goal.`
    );
    textNode.textContent = `${textNode.textContent}${extraLine}`;
  };

  document.addEventListener('click', async (event) => {
    const sizeBtn = event.target.closest('#growthDockPanel [data-session-size]');
    if (sizeBtn) {
      const nextSize = sizeBtn.dataset.sessionSize || 'flow';
      if (!VM830_SESSION_SIZE_OPTIONS.includes(nextSize)) return;
      state.vm830.prefs.sessionSize = nextSize;
      await vm830SavePrefs();
      return;
    }
    const actionBtn = event.target.closest('#growthDockPanel [data-growth-action]');
    if (actionBtn) {
      const action = actionBtn.dataset.growthAction || '';
      if (action === 'due') startTargetedFocus('due');
      else if (action === 'weak') startTargetedFocus('weak');
      else if (action === 'context') vm830StartContextBurst();
      else if (action === 'save-cap') {
        const input = byId('growthCustomCapInput');
        const nextCap = Math.max(4, Math.min(30, Number(input?.value) || 0));
        if (!nextCap) {
          showToast(uiText('Hãy nhập từ 4 đến 30 từ mỗi phiên.', 'Enter a session size from 4 to 30 words.', 'Enter a session size from 4 to 30 words.'));
          return;
        }
        state.vm830.prefs.customSessionCap = nextCap;
        await vm830SavePrefs();
        showToast(uiText(`Đã đặt ${nextCap} từ mỗi phiên.`, `Set ${nextCap} words per session.`, `Set ${nextCap} words per session.`));
      } else if (action === 'reset-cap') {
        state.vm830.prefs.customSessionCap = 0;
        await vm830SavePrefs();
        const input = byId('growthCustomCapInput');
        if (input) input.value = '';
        showToast(uiText('Đã trở về nhịp phiên tự động.', 'Returned to adaptive session sizing.', 'Returned to adaptive session sizing.'));
      }
    }
  });

  byId('reviewSetDropdown')?.addEventListener('change', () => {
    window.setTimeout(() => {
      const setName = byId('reviewSetDropdown')?.value || 'all';
      const context = typeof vmGetReviewContext === 'function'
        ? vmGetReviewContext(setName)
        : { words: getWordsForSet(setName), stats: getSetStats(getWordsForSet(setName)) };
      vm830RenderGrowthDock(context.words, context.stats);
      vm830SchedulePrewarm('review-set-change');
    }, 0);
  });

  const VM830_EFFECT_PRESETS = [
    {
      key: 'prism_frost',
      viLabel: 'Prism Frost',
      enLabel: 'Prism Frost',
      noteVi: 'Trong hơn, sáng cạnh hơn để vẫn glass nhưng đỡ mờ.',
      noteEn: 'Sharper edges and clearer glass without losing the liquid feel.',
      settings: { fxGlass: 'crystal', fxMotion: 'calm', fxScene: 'midnight', fxDensity: 'compact', fxAccent: 'mint', fxRadius: 'rounded' }
    },
    {
      key: 'ink_glass',
      viLabel: 'Ink Glass',
      enLabel: 'Ink Glass',
      noteVi: 'Nền tối rõ nét hơn cho library và studio nhiều thông tin.',
      noteEn: 'A cleaner dark shell for denser library and studio screens.',
      settings: { fxGlass: 'obsidian', fxMotion: 'off', fxScene: 'forest', fxDensity: 'compact', fxAccent: 'blue', fxRadius: 'soft' }
    }
  ];
  VM830_EFFECT_PRESETS.forEach((preset) => {
    if (!EFFECT_PRESETS.some((item) => item.key === preset.key)) EFFECT_PRESETS.push(preset);
  });
  vmResetReviewContextCache();


  // ===== v8.3.2 stability-first hotfix =====
  document.body.classList.add('vm-performance-lite');
  state.vm832 = state.vm832 || {
    navToken: 0,
    initSig: { main: '', management: '', review: '' },
    setSummaryCache: { key: '', entries: [] },
    lastReviewHeavyKey: ''
  };

  if (state.vm830?.prefs) state.vm830.prefs.autoPrewarm = false;
  if (typeof vm830SchedulePrewarm === 'function') {
    vm830SchedulePrewarm = function() {};
  }
  if (typeof vm830OriginalRenderReviewDashboardShell === 'function') {
    renderReviewDashboardShell = vm830OriginalRenderReviewDashboardShell;
  }

  function vm832Sig(bucket, extra = '') {
    return `${bucket}|${state.dataRevision}|${state.vocab.length}|${extra}`;
  }

  function vm832ShouldSkipInit(bucket, sig) {
    if (state.vm832.initSig[bucket] === sig) return true;
    state.vm832.initSig[bucket] = sig;
    return false;
  }

  function vm832BuildSetSummaries() {
    const cacheKey = `${state.dataRevision}|${state.vocab.length}`;
    if (state.vm832.setSummaryCache.key === cacheKey) return state.vm832.setSummaryCache.entries;
    const entries = vm82GetSetIndex().map((entry) => {
      const words = Array.isArray(entry.words) ? entry.words : [];
      const stats = getSetStats(words);
      const latest = words.reduce((best, word) => Math.max(best, Number(word?.updatedAt || word?.createdAt || 0)), 0);
      const searchBlob = normalizeAnswer(`${entry.setName} ${words.map(word => `${word.word || ''} ${word.meaning || ''} ${word.wordType || ''} ${word.entryType || ''}`).join(' ')}`);
      return {
        setName: entry.setName,
        words,
        stats,
        latest,
        searchBlob
      };
    });
    state.vm832.setSummaryCache = { key: cacheKey, entries };
    return entries;
  }

  const vm832OriginalPersistState = persistState;
  persistState = async function(reason = 'auto-save') {
    const result = await vm832OriginalPersistState(reason);
    state.vm832.setSummaryCache.key = '';
    state.vm832.lastReviewHeavyKey = '';
    return result;
  };

  renderWordsetsGrid = function() {
    const grid = byId('wordsetGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const frag = document.createDocumentFragment();
    const createCard = document.createElement('button');
    createCard.className = 'set-card create-new-card';
    createCard.type = 'button';
    createCard.innerHTML = `<div class="create-new-content"><span class="create-icon">+</span><h2>${escapeHtml(uiText('Tạo bộ từ mới', 'Create a new set', 'Create a new set'))}</h2><p class="muted-text">${escapeHtml(uiText('Bắt đầu một nhóm từ mới và thêm dữ liệu ngay.', 'Start a fresh set and add data right away.', 'Start a fresh set and add data right away.'))}</p></div>`;
    createCard.addEventListener('click', () => {
      showView('main-view');
      openModal('createSetModal');
    });
    frag.appendChild(createCard);

    if (!state.vocab.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = `<strong>${escapeHtml(uiText('Chưa có từ vựng nào', 'No vocabulary yet', 'No vocabulary yet'))}</strong><div>${escapeHtml(uiText('Thêm vài từ đầu tiên để bắt đầu học và theo dõi tiến độ.', 'Add your first entries to start studying and tracking progress.', 'Add your first entries to start studying and tracking progress.'))}</div>`;
      frag.appendChild(empty);
      grid.appendChild(frag);
      return;
    }

    const query = normalizeAnswer(byId('setSearchInput')?.value || '');
    const sortBy = byId('setSortSelect')?.value || 'due';
    const sets = vm832BuildSetSummaries().filter(item => !query || item.searchBlob.includes(query));

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
      frag.appendChild(emptySearch);
      grid.appendChild(frag);
      return;
    }

    sets.forEach(({ setName, words, stats }) => {
      const card = document.createElement('div');
      card.className = 'set-card set-card-lite';
      card.innerHTML = `
        <div class="card-header">
          <div class="card-title-icon-wrapper">
            <span class="set-icon">🏷️</span>
            <span class="set-title">${escapeHtml(setName)}</span>
          </div>
          <span class="summary-note">${stats.progress}%</span>
        </div>
        <div class="card-details">
          <div class="card-metrics compact-metrics">
            <span>${words.length} ${escapeHtml(uiText('từ', 'words', 'words'))}</span>
            <span>${stats.due} ${escapeHtml(uiText('đến hạn', 'due', 'due'))}</span>
            <span>${stats.weak} ${escapeHtml(uiText('yếu', 'weak', 'weak'))}</span>
          </div>
          <div class="progress-bar-container"><div class="progress-bar" style="width:${stats.progress}%"></div></div>
          <div class="card-metrics compact-metrics">
            <span>${stats.mastered}/${stats.total || 0} ${escapeHtml(uiText('đã vững', 'strong', 'strong'))}</span>
            <span>${stats.fresh} ${escapeHtml(uiText('mới', 'new', 'new'))}</span>
          </div>
        </div>
        <div class="card-action-bar">
          <button class="card-btn btn-view" type="button">${escapeHtml(uiText('Xem / sửa', 'View / edit', 'View / edit'))}</button>
          <button class="card-btn btn-study" type="button">${escapeHtml(uiText('Ôn ngay', 'Review now', 'Review now'))}</button>
          <button class="card-btn btn-delete" type="button">${escapeHtml(uiText('Xóa', 'Delete', 'Delete'))}</button>
        </div>
      `;
      card.querySelector('.btn-view')?.addEventListener('click', () => openSetDetails(setName));
      card.querySelector('.btn-study')?.addEventListener('click', () => {
        state.vmPendingReviewSet = setName;
        showView('review-dashboard-view');
      });
      card.querySelector('.btn-delete')?.addEventListener('click', async () => {
        if (!confirm(uiText(`Bạn có chắc muốn xóa toàn bộ bộ từ "${setName}"?`, `Delete the full set "${setName}"?`, `Delete the full set "${setName}"?`))) return;
        state.vocab = state.vocab.filter(word => word.wordset !== setName);
        await saveAndRefresh({ showManagement: true });
        showToast(uiText(`Đã xóa bộ từ "${setName}".`, `Deleted set "${setName}".`, `Deleted set "${setName}".`));
      });
      frag.appendChild(card);
    });

    grid.appendChild(frag);
  };

  const vm832OriginalInitMainView = initMainView;
  initMainView = function(force = false) {
    const sig = vm832Sig('main', `${byId('wordsetDropdown')?.value || ''}|${state.settings?.languageMode || ''}`);
    if (!force && vm832ShouldSkipInit('main', sig)) return;
    vm832OriginalInitMainView(force);
  };

  initManagementView = function(force = false) {
    const panel = state.vmManagementPanel || 'library';
    const sig = vm832Sig('management', `${panel}|${byId('setSortSelect')?.value || 'due'}|${normalizeAnswer(byId('setSearchInput')?.value || '')}`);
    if (!force && vm832ShouldSkipInit('management', sig)) return;
    renderManagementSummary();
    if (typeof ensureManagementWorkbench === 'function') ensureManagementWorkbench();
    renderWordsetsGrid();
    if (typeof setManagementWorkbenchPanel === 'function') setManagementWorkbenchPanel(panel);
    if (panel === 'appearance') renderEffectsLabPanel();
    if (panel === 'recovery') {
      if (typeof ensureRecoveryPanel === 'function') ensureRecoveryPanel();
      if (typeof renderRecoveryPanel === 'function') renderRecoveryPanel();
    }
    if (panel === 'studio') {
      window.dispatchEvent(new CustomEvent('vm:studio-visible'));
    }
  };

  function vm832RenderReviewShell(setName) {
    const safeSetName = setName || 'all';
    const words = typeof vmGetReviewContext === 'function'
      ? vmGetReviewContext(safeSetName).words
      : getWordsForSet(safeSetName);
    const stats = typeof vmGetReviewContext === 'function'
      ? vmGetReviewContext(safeSetName).stats
      : getSetStats(words);
    renderReviewDashboardShell(words, stats);

    const badgeText = {
      flashcard: uiText(`${Math.min(words.length, 12)} thẻ`, `${Math.min(words.length, 12)} cards`, `${Math.min(words.length, 12)} cards`),
      quiz: uiText(`${Math.min(words.length, 8)} câu`, `${Math.min(words.length, 8)} questions`, `${Math.min(words.length, 8)} questions`),
      matching: uiText(`${Math.min(words.length, 6)} cặp`, `${Math.min(words.length, 6)} pairs`, `${Math.min(words.length, 6)} pairs`),
      typing: uiText(`${Math.min(words.length, 8)} câu`, `${Math.min(words.length, 8)} prompts`, `${Math.min(words.length, 8)} prompts`),
      dictation: uiText(`${Math.min(words.length, 8)} câu`, `${Math.min(words.length, 8)} prompts`, `${Math.min(words.length, 8)} prompts`),
      contrast: uiText(`${Math.min(getContrastQueue(words, 8).length, 8)} cặp`, `${Math.min(getContrastQueue(words, 8).length, 8)} pairs`, `${Math.min(getContrastQueue(words, 8).length, 8)} pairs`),
      srs: uiText(`${Math.min(getRecommendedQueue(words, 12).length, 12)} từ`, `${Math.min(getRecommendedQueue(words, 12).length, 12)} words`, `${Math.min(getRecommendedQueue(words, 12).length, 12)} words`)
    };
    document.querySelectorAll('[data-badge]').forEach((node) => {
      node.textContent = badgeText[node.dataset.badge] || '0';
    });
    document.querySelectorAll('.mode-lab-card').forEach(card => card.classList.remove('recommended-mode-card'));
    const plan = getRecommendedStudyPlan(words, stats);
    document.querySelector(`[data-game="${plan.gameType || ''}"]`)?.classList.add('recommended-mode-card');
    if (byId('recommendedModeTitle')) byId('recommendedModeTitle').textContent = plan.title;
    if (byId('recommendedModeReason')) byId('recommendedModeReason').textContent = plan.reason;
    if (byId('startRecommendedBtn')) byId('startRecommendedBtn').disabled = !plan.gameType;
    if (byId('startDueFocusBtn')) byId('startDueFocusBtn').disabled = !stats.due;
    if (byId('startWeakFocusBtn')) byId('startWeakFocusBtn').disabled = !stats.weak;
    if (byId('startNewFocusBtn')) byId('startNewFocusBtn').disabled = !stats.fresh;
    if (byId('reviewOpenDeepDiveBtn')) {
      byId('reviewOpenDeepDiveBtn').textContent = uiText('Hiện phân tích sâu', 'Show deeper insights', 'Show deeper insights');
    }
    if (byId('reviewDeepDiveDetails') && !forceOpenReviewDetails) {
      byId('reviewDeepDiveDetails').open = false;
      syncReviewDeepDiveState();
    }
    return { words, stats };
  }

  let forceOpenReviewDetails = false;
  renderReviewDashboard = function(forceDeepDive = false) {
    const setName = state.vmPendingReviewSet || byId('reviewSetDropdown')?.value || 'all';
    const context = vm832RenderReviewShell(setName);
    const details = byId('reviewDeepDiveDetails');
    if (!details) return;
    if (!context.words.length) {
      details.open = true;
      syncReviewDeepDiveState();
      return;
    }
    const shouldOpen = Boolean(forceDeepDive || details.open || forceOpenReviewDetails);
    forceOpenReviewDetails = false;
    if (!shouldOpen) {
      cancelPendingReviewRender();
      return;
    }
    cancelPendingReviewRender();
    const reviewKey = `${setName}|${state.dataRevision}|${context.words.length}`;
    if (state.vm832.lastReviewHeavyKey === reviewKey && details.dataset.vm832Hydrated === 'true') return;
    const token = state.reviewRenderToken;
    state.reviewDeferredTimer = window.setTimeout(() => {
      state.reviewDeferredTimer = 0;
      if (token !== state.reviewRenderToken) return;
      if (document.body.dataset.currentView !== 'review-dashboard-view') return;
      details.dataset.vm832Hydrated = 'true';
      state.vm832.lastReviewHeavyKey = reviewKey;
      renderDailyFocus(context.words);
      renderClusterMissions(context.words);
      renderReviewInsights(context.words);
      renderAdvancedReviewPanels(context.words);
      renderIntegratedReviewSignals();
    }, 90);
  };

  initReviewView = function(force = false) {
    const select = byId('reviewSetDropdown');
    const targetSet = state.vmPendingReviewSet || select?.value || 'all';
    populateSetDropdown(select, true);
    if (select && Array.from(select.options).some(option => option.value === targetSet)) {
      select.value = targetSet;
    }
    const sig = vm832Sig('review', targetSet);
    if (!force && vm832ShouldSkipInit('review', sig)) return;
    state.vmPendingReviewSet = '';
    ensureClusterMissionPanel();
    if (byId('reviewDeepDiveDetails')) {
      byId('reviewDeepDiveDetails').dataset.vm832Hydrated = 'false';
      byId('reviewDeepDiveDetails').open = false;
      syncReviewDeepDiveState();
    }
    renderReviewDashboard(false);
  };

  showView = function(viewIdToShow) {
    cancelPendingReviewRender();
    state.vm832.navToken += 1;
    const token = state.vm832.navToken;

    views.forEach(view => view.classList.add('hidden'));
    navBtns.forEach(btn => btn.classList.remove('active'));
    byId(viewIdToShow)?.classList.remove('hidden');

    const reviewViews = ['review-dashboard-view', 'study-mode-view', 'quiz-mode-view', 'matching-mode-view', 'typing-mode-view', 'dictation-mode-view'];
    const studyViews = ['study-mode-view', 'quiz-mode-view', 'typing-mode-view', 'dictation-mode-view', 'matching-mode-view'];

    document.body.dataset.currentView = viewIdToShow;
    document.body.classList.toggle('is-review-view', reviewViews.includes(viewIdToShow));
    document.body.classList.toggle('is-study-view', studyViews.includes(viewIdToShow));

    if (viewIdToShow === 'main-view') byId('navMainBtn')?.classList.add('active');
    if (viewIdToShow === 'management-view' || viewIdToShow === 'set-details-view') byId('navManagementBtn')?.classList.add('active');
    if (reviewViews.includes(viewIdToShow)) byId('navReviewBtn')?.classList.add('active');
    if (!studyViews.includes(viewIdToShow)) {
      hideStudySupport();
      hideMemoryCoach();
    }
    window.dispatchEvent(new CustomEvent('vm:viewchange', { detail: { viewId: viewIdToShow } }));

    if (viewIdToShow === 'set-details-view') return;
    window.requestAnimationFrame(() => {
      if (token !== state.vm832.navToken) return;
      if (viewIdToShow === 'main-view') initMainView(false);
      else if (viewIdToShow === 'management-view') initManagementView(false);
      else if (viewIdToShow === 'review-dashboard-view') initReviewView(false);
    });
  };

  if (byId('reviewDeepDiveDetails') && byId('reviewDeepDiveDetails').dataset.vm832Bound !== 'true') {
    byId('reviewDeepDiveDetails').dataset.vm832Bound = 'true';
    byId('reviewDeepDiveDetails').addEventListener('toggle', () => {
      if (byId('reviewDeepDiveDetails').open && document.body.dataset.currentView === 'review-dashboard-view') {
        forceOpenReviewDetails = true;
        renderReviewDashboard(true);
      }
    });
  }

  if (typeof setManagementWorkbenchPanel === 'function') {
    const vm832OriginalSetManagementWorkbenchPanel = setManagementWorkbenchPanel;
    setManagementWorkbenchPanel = function(panel) {
      vm832OriginalSetManagementWorkbenchPanel(panel);
      state.vmManagementPanel = panel || 'library';
      if (state.vmManagementPanel === 'appearance') {
        renderEffectsLabPanel();
      } else if (state.vmManagementPanel === 'recovery') {
        if (typeof ensureRecoveryPanel === 'function') ensureRecoveryPanel();
        if (typeof renderRecoveryPanel === 'function') renderRecoveryPanel();
      } else if (state.vmManagementPanel === 'studio') {
        window.dispatchEvent(new CustomEvent('vm:studio-visible'));
      }
    };
  }



  // ===== v8.3.3 stable navigation + cached review shell =====
  state.vm833 = state.vm833 || {
    dirty: { main: true, management: true, review: true, details: true },
    mounted: { main: false, management: false, review: false, details: false },
    token: 0,
    rafId: 0,
    timerId: 0,
    statsCache: { key: '', map: new WeakMap() },
    queueCacheKey: '',
    queueCache: new Map(),
    reviewShellKey: ''
  };

  function vm833BaseKey() {
    return `${state.dataRevision}|${state.vocab.length}|${getLanguageMode()}|${state.settings?.languageMode || ''}`;
  }

  function vm833MarkDirty(keys = ['main', 'management', 'review', 'details']) {
    keys.forEach((key) => {
      if (state.vm833?.dirty) state.vm833.dirty[key] = true;
    });
  }

  function vm833ResetCaches() {
    state.vm833.statsCache = { key: vm833BaseKey(), map: new WeakMap() };
    state.vm833.queueCacheKey = vm833BaseKey();
    state.vm833.queueCache = new Map();
    state.vm833.reviewShellKey = '';
    vm833MarkDirty(['main', 'management', 'review', 'details']);
  }

  function vm833EnsureStatsCache() {
    const key = vm833BaseKey();
    if (!state.vm833.statsCache || state.vm833.statsCache.key !== key) {
      state.vm833.statsCache = { key, map: new WeakMap() };
    }
    return state.vm833.statsCache.map;
  }

  const vm833OriginalGetSetStats = getSetStats;
  getSetStats = function(words) {
    if (!Array.isArray(words)) return vm833OriginalGetSetStats(words || []);
    const cache = vm833EnsureStatsCache();
    if (cache.has(words)) return cache.get(words);
    const stats = vm833OriginalGetSetStats(words);
    cache.set(words, stats);
    return stats;
  };

  function vm833QueueCacheGet(words, limit, profile) {
    const key = vm833BaseKey();
    if (state.vm833.queueCacheKey !== key) {
      state.vm833.queueCacheKey = key;
      state.vm833.queueCache = new Map();
    }
    const queueKey = `${profile}|${limit}|${Array.isArray(words) ? words.length : 0}|${Array.isArray(words) && words.length ? `${words[0]?.id || ''}:${words[words.length - 1]?.id || ''}` : 'empty'}`;
    return state.vm833.queueCache.get(queueKey);
  }

  function vm833QueueCacheSet(words, limit, profile, value) {
    const queueKey = `${profile}|${limit}|${Array.isArray(words) ? words.length : 0}|${Array.isArray(words) && words.length ? `${words[0]?.id || ''}:${words[words.length - 1]?.id || ''}` : 'empty'}`;
    state.vm833.queueCache.set(queueKey, value);
  }

  const vm833OriginalBuildCoverageQueue = buildCoverageQueue;
  buildCoverageQueue = function(words, limit = 20, profile = 'balanced') {
    if (!Array.isArray(words) || !words.length) return [];
    const cached = vm833QueueCacheGet(words, limit, profile);
    if (cached) return cached;
    const queue = vm833OriginalBuildCoverageQueue(words, limit, profile);
    vm833QueueCacheSet(words, limit, profile, queue);
    return queue;
  };

  const vm833OriginalPersistState = persistState;
  persistState = async function(reason = 'auto-save') {
    const result = await vm833OriginalPersistState(reason);
    vm833ResetCaches();
    return result;
  };

  const vm833OriginalLoadState = loadState;
  loadState = async function() {
    await vm833OriginalLoadState();
    vm833ResetCaches();
  };

  function vm833GetBucketForView(viewId) {
    if (viewId === 'main-view') return 'main';
    if (viewId === 'management-view') return 'management';
    if (viewId === 'review-dashboard-view') return 'review';
    if (viewId === 'set-details-view') return 'details';
    return '';
  }

  function vm833CancelMount() {
    if (state.vm833.rafId) {
      window.cancelAnimationFrame(state.vm833.rafId);
      state.vm833.rafId = 0;
    }
    if (state.vm833.timerId) {
      window.clearTimeout(state.vm833.timerId);
      state.vm833.timerId = 0;
    }
  }

  const vm833FinalInitMainView = initMainView;
  const vm833FinalInitManagementView = initManagementView;
  const vm833FinalInitReviewView = initReviewView;

  function vm833MountView(viewId, force = false) {
    const bucket = vm833GetBucketForView(viewId);
    if (!bucket || viewId === 'set-details-view') return;
    if (!force && state.vm833.mounted[bucket] && !state.vm833.dirty[bucket]) return;
    if (viewId === 'main-view') vm833FinalInitMainView(true);
    else if (viewId === 'management-view') vm833FinalInitManagementView(true);
    else if (viewId === 'review-dashboard-view') vm833FinalInitReviewView(true);
    state.vm833.mounted[bucket] = true;
    state.vm833.dirty[bucket] = false;
  }

  const vm833OriginalSetManagementWorkbenchPanel = typeof setManagementWorkbenchPanel === 'function' ? setManagementWorkbenchPanel : null;
  if (vm833OriginalSetManagementWorkbenchPanel) {
    setManagementWorkbenchPanel = function(panel) {
      state.vmManagementPanel = panel || 'library';
      return vm833OriginalSetManagementWorkbenchPanel(panel);
    };
  }

  function vm833ShowView(viewIdToShow, options = {}) {
    vm833CancelMount();
    cancelPendingReviewRender();
    if (state.vm830?.warmTimer) {
      window.clearTimeout(state.vm830.warmTimer);
      state.vm830.warmTimer = 0;
    }

    views.forEach(view => view.classList.add('hidden'));
    navBtns.forEach(btn => btn.classList.remove('active'));
    byId(viewIdToShow)?.classList.remove('hidden');

    const reviewViews = ['review-dashboard-view', 'study-mode-view', 'quiz-mode-view', 'matching-mode-view', 'typing-mode-view', 'dictation-mode-view'];
    const studyViews = ['study-mode-view', 'quiz-mode-view', 'typing-mode-view', 'dictation-mode-view', 'matching-mode-view'];
    document.body.dataset.currentView = viewIdToShow;
    document.body.classList.toggle('is-review-view', reviewViews.includes(viewIdToShow));
    document.body.classList.toggle('is-study-view', studyViews.includes(viewIdToShow));

    if (viewIdToShow === 'main-view') byId('navMainBtn')?.classList.add('active');
    if (viewIdToShow === 'management-view' || viewIdToShow === 'set-details-view') byId('navManagementBtn')?.classList.add('active');
    if (reviewViews.includes(viewIdToShow)) byId('navReviewBtn')?.classList.add('active');
    if (!studyViews.includes(viewIdToShow)) {
      hideStudySupport();
      hideMemoryCoach();
    }
    window.dispatchEvent(new CustomEvent('vm:viewchange', { detail: { viewId: viewIdToShow } }));

    if (viewIdToShow === 'set-details-view' || studyViews.includes(viewIdToShow)) return;

    const force = Boolean(options.force);
    const token = ++state.vm833.token;
    state.vm833.rafId = window.requestAnimationFrame(() => {
      if (token !== state.vm833.token) return;
      state.vm833.rafId = 0;
      state.vm833.timerId = window.setTimeout(() => {
        if (token !== state.vm833.token) return;
        state.vm833.timerId = 0;
        vm833MountView(viewIdToShow, force);
      }, 0);
    });
  }

  showView = vm833ShowView;

  renderAll = function(force = false) {
    applyEffectSettings();
    applyLanguageModeUI();
    if (typeof renderIntegratedUITexts === 'function') renderIntegratedUITexts();
    if (typeof ensureRecoveryPanel === 'function') ensureRecoveryPanel();
    if (force) vm833MarkDirty(['main', 'management', 'review', 'details']);
    const currentView = document.body.dataset.currentView || getPreferredInitialView();
    if (currentView === 'set-details-view' && state.currentDetailsSet) {
      openSetDetails(state.currentDetailsSet);
      return;
    }
    vm833MountView(currentView, force || !state.vm833.mounted[vm833GetBucketForView(currentView)]);
  };

  saveAndRefresh = async function({ showManagement = false, showReview = false } = {}) {
    await persistState('save-and-refresh');
    if (showManagement) {
      showView('management-view', { force: true });
      return;
    }
    if (showReview) {
      showView('review-dashboard-view', { force: true });
      return;
    }
    renderAll(true);
  };

  exitCurrentGame = function() {
    stopMatchingTimer();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    state.currentGame = null;
    hideStudySupport();
    hideMemoryCoach();
    state.studyQueue = [];
    state.currentCardIdx = 0;
    state.answerLocked = false;
    vm833MarkDirty(['review']);
    showView('review-dashboard-view');
  };

  if (byId('backToManagementBtn') && byId('backToManagementBtn').dataset.vm833Patched !== 'true') {
    const replacement = byId('backToManagementBtn').cloneNode(true);
    replacement.dataset.vm833Patched = 'true';
    byId('backToManagementBtn').replaceWith(replacement);
    replacement.addEventListener('click', () => {
      showView('management-view');
    });
  }

  const vm833OriginalStartGame = startGame;
  startGame = function(gameType, setName, options = {}) {
    vm833MarkDirty(['review']);
    return vm833OriginalStartGame(gameType, setName, options);
  };

  const vm833OriginalOpenSetDetails = openSetDetails;
  openSetDetails = function(setName) {
    vm833MarkDirty(['management']);
    return vm833OriginalOpenSetDetails(setName);
  };

  if (typeof vm830SchedulePrewarm === 'function') {
    vm830SchedulePrewarm = function() {};
  }
  if (state.vm830?.prefs) state.vm830.prefs.autoPrewarm = false;

  function vm833BuildFastReviewPlan(words, stats) {
    if (!words.length) {
      return {
        gameType: null,
        title: uiText('Chưa có dữ liệu để ôn', 'No data to review yet', 'No data to review yet'),
        reason: uiText('Hãy thêm vài từ trước khi bắt đầu ôn tập.', 'Add a few words before starting review.', 'Add a few words before starting review.')
      };
    }
    if (stats.due > 0) {
      return {
        gameType: 'srs',
        title: uiText(`Memory Rescue • ${Math.min(stats.due, Math.max(4, Math.min(words.length, 12)))} mục ưu tiên`, `Memory Rescue • ${Math.min(stats.due, Math.max(4, Math.min(words.length, 12)))} priority item(s)`, `Memory Rescue • ${Math.min(stats.due, Math.max(4, Math.min(words.length, 12)))} priority item(s)`),
        reason: uiText('Ôn các mục đến hạn trước để giữ nhịp nhớ ổn định.', 'Review due items first to keep retention stable.', 'Review due items first to keep retention stable.')
      };
    }
    if (stats.weak > 0) {
      return {
        gameType: 'typing',
        title: uiText(`Recall Drill • ${Math.min(stats.weak, Math.min(words.length, 10))} mục yếu`, `Recall Drill • ${Math.min(stats.weak, Math.min(words.length, 10))} weak item(s)`, `Recall Drill • ${Math.min(stats.weak, Math.min(words.length, 10))} weak item(s)`),
        reason: uiText('Kéo các mục còn yếu sang nhớ chủ động để sửa lỗi nhanh hơn.', 'Move weak items into active recall to fix them faster.', 'Move weak items into active recall to fix them faster.')
      };
    }
    if (stats.fresh > 0) {
      return {
        gameType: 'flashcard',
        title: uiText(`Flashcard • ${Math.min(stats.fresh, Math.min(words.length, 12))} mục mới`, `Flashcard • ${Math.min(stats.fresh, Math.min(words.length, 12))} new item(s)`, `Flashcard • ${Math.min(stats.fresh, Math.min(words.length, 12))} new item(s)`),
        reason: uiText('Lướt qua các mục mới trước rồi mới tăng độ khó.', 'Glance through new items first before increasing difficulty.', 'Glance through new items first before increasing difficulty.')
      };
    }
    return {
      gameType: words.length >= 4 ? 'quiz' : 'flashcard',
      title: words.length >= 4
        ? uiText(`Quick Check • ${Math.min(words.length, 8)} câu`, `Quick Check • ${Math.min(words.length, 8)} checks`, `Quick Check • ${Math.min(words.length, 8)} checks`)
        : uiText(`Flashcard • ${Math.min(words.length, 8)} thẻ`, `Flashcard • ${Math.min(words.length, 8)} cards`, `Flashcard • ${Math.min(words.length, 8)} cards`),
      reason: uiText('Giữ phiên học ngắn và mượt để quay lại thường xuyên hơn.', 'Keep sessions short and smooth so you return more often.', 'Keep sessions short and smooth so you return more often.')
    };
  }

  function vm833RenderReviewShellFast(setName) {
    const safeSetName = setName || 'all';
    const context = typeof vmGetReviewContext === 'function'
      ? vmGetReviewContext(safeSetName)
      : { words: getWordsForSet(safeSetName), stats: getSetStats(getWordsForSet(safeSetName)) };
    const words = context.words || [];
    const stats = context.stats || getSetStats(words);
    const shellKey = `${safeSetName}|${vm833BaseKey()}|${words.length}|${stats.due}|${stats.weak}|${stats.fresh}|${stats.progress}`;
    const needsShell = state.vm833.reviewShellKey !== shellKey;
    if (needsShell) {
      renderReviewDashboardShell(words, stats);
      state.vm833.reviewShellKey = shellKey;
    }

    const badgeMap = {
      flashcard: Math.min(words.length, 12),
      quiz: Math.min(words.length, 8),
      matching: Math.min(words.length, 6),
      typing: Math.min(Math.max(stats.weak, 1), 8),
      dictation: Math.min(Math.max(stats.weak, Math.min(words.length, 1)), 8),
      contrast: Math.min(Math.max(stats.weak, 0), 8),
      srs: Math.min(Math.max(stats.due, words.length ? 1 : 0), 12)
    };
    document.querySelectorAll('[data-badge]').forEach((node) => {
      const count = badgeMap[node.dataset.badge] || 0;
      const suffix = node.dataset.badge === 'contrast'
        ? uiText(' cặp', ' pairs', ' pairs')
        : (node.dataset.badge === 'flashcard' ? uiText(' thẻ', ' cards', ' cards') : uiText(' mục', ' items', ' items'));
      node.textContent = `${count}${suffix}`;
    });

    document.querySelectorAll('.mode-lab-card').forEach(card => card.classList.remove('recommended-mode-card'));
    const plan = vm833BuildFastReviewPlan(words, stats);
    document.querySelector(`[data-game="${plan.gameType || ''}"]`)?.classList.add('recommended-mode-card');
    if (byId('recommendedModeTitle')) byId('recommendedModeTitle').textContent = plan.title;
    if (byId('recommendedModeReason')) byId('recommendedModeReason').textContent = plan.reason;
    if (byId('startRecommendedBtn')) byId('startRecommendedBtn').disabled = !plan.gameType;
    if (byId('startDueFocusBtn')) byId('startDueFocusBtn').disabled = !stats.due;
    if (byId('startWeakFocusBtn')) byId('startWeakFocusBtn').disabled = !stats.weak;
    if (byId('startNewFocusBtn')) byId('startNewFocusBtn').disabled = !stats.fresh;
    if (byId('reviewOpenDeepDiveBtn')) {
      byId('reviewOpenDeepDiveBtn').textContent = uiText('Hiện phân tích sâu', 'Show deeper insights', 'Show deeper insights');
    }
    if (typeof vm830RenderGrowthDock === 'function') vm830RenderGrowthDock(words, stats);
    return { words, stats };
  }

  renderReviewDashboard = function(forceDeepDive = false) {
    const setName = state.vmPendingReviewSet || byId('reviewSetDropdown')?.value || 'all';
    const context = vm833RenderReviewShellFast(setName);
    state.vmPendingReviewSet = '';
    const details = byId('reviewDeepDiveDetails');
    if (!details) return;
    if (!context.words.length) {
      details.open = true;
      syncReviewDeepDiveState();
      return;
    }
    const shouldOpen = Boolean(forceDeepDive || details.open);
    if (!shouldOpen) {
      details.open = false;
      syncReviewDeepDiveState();
      cancelPendingReviewRender();
      return;
    }
    cancelPendingReviewRender();
    const token = ++state.reviewRenderToken;
    state.reviewDeferredTimer = window.setTimeout(() => {
      if (token !== state.reviewRenderToken) return;
      if (document.body.dataset.currentView !== 'review-dashboard-view') return;
      renderDailyFocus(context.words);
      renderClusterMissions(context.words);
      renderReviewInsights(context.words);
      renderAdvancedReviewPanels(context.words);
      renderIntegratedReviewSignals();
    }, 80);
  };

  initReviewView = function(force = false) {
    const select = byId('reviewSetDropdown');
    const targetSet = state.vmPendingReviewSet || select?.value || 'all';
    populateSetDropdown(select, true);
    if (select && Array.from(select.options).some(option => option.value === targetSet)) {
      select.value = targetSet;
    }
    if (!force && state.vm833.mounted.review && !state.vm833.dirty.review && !state.vmPendingReviewSet) return;
    ensureClusterMissionPanel();
    if (byId('reviewDeepDiveDetails')) {
      byId('reviewDeepDiveDetails').open = false;
      byId('reviewDeepDiveDetails').dataset.vm832Hydrated = 'false';
      syncReviewDeepDiveState();
    }
    renderReviewDashboard(false);
    state.vm833.mounted.review = true;
    state.vm833.dirty.review = false;
  };

  initManagementView = function(force = false) {
    const panel = state.vmManagementPanel || 'library';
    if (!force && state.vm833.mounted.management && !state.vm833.dirty.management) return;
    renderManagementSummary();
    if (typeof ensureManagementWorkbench === 'function') ensureManagementWorkbench();
    renderWordsetsGrid();
    if (typeof setManagementWorkbenchPanel === 'function') setManagementWorkbenchPanel(panel);
    if (panel === 'appearance') renderEffectsLabPanel();
    if (panel === 'recovery') {
      if (typeof ensureRecoveryPanel === 'function') ensureRecoveryPanel();
      if (typeof renderRecoveryPanel === 'function') renderRecoveryPanel();
    }
    if (panel === 'studio') window.dispatchEvent(new CustomEvent('vm:studio-visible'));
    state.vm833.mounted.management = true;
    state.vm833.dirty.management = false;
  };

  initMainView = function(force = false) {
    if (!force && state.vm833.mounted.main && !state.vm833.dirty.main) return;
    populateSetDropdown(byId('wordsetDropdown'));
    ensureSetDoctorPanel();
    renderSmartSuggestions({ resetCycle: true });
    renderSetIntelligence();
    renderSetDoctor();
    state.vm833.mounted.main = true;
    state.vm833.dirty.main = false;
  };

  const vm833OriginalCreateSetFromModal = createSetFromModal;
  createSetFromModal = function(...args) {
    vm833MarkDirty(['main', 'management', 'review']);
    return vm833OriginalCreateSetFromModal.apply(this, args);
  };

  const vm833OriginalSavePreviewWords = savePreviewWords;
  savePreviewWords = function(...args) {
    vm833MarkDirty(['main', 'management', 'review']);
    return vm833OriginalSavePreviewWords.apply(this, args);
  };

  const vm833OriginalSaveQuickWord = saveQuickWord;
  saveQuickWord = function(...args) {
    vm833MarkDirty(['main', 'management', 'review']);
    return vm833OriginalSaveQuickWord.apply(this, args);
  };

  const vm833ReviewSetDropdown = byId('reviewSetDropdown');
  if (vm833ReviewSetDropdown && vm833ReviewSetDropdown.dataset.vm833Bound !== 'true') {
    vm833ReviewSetDropdown.dataset.vm833Bound = 'true';
    vm833ReviewSetDropdown.addEventListener('change', () => {
      state.vm833.reviewShellKey = '';
      vm833MarkDirty(['review']);
    }, true);
  }

  vm833ResetCaches();

  syncCompactNav();
  init().catch(error => {
    console.error('Vocab Master failed to initialize', error);
    try {
      showToast(uiText('Ứng dụng khởi động chưa thành công. Dữ liệu vẫn được giữ trong bộ nhớ cục bộ.', 'The app did not start cleanly. Your local data is still kept in storage.', 'The app did not start cleanly. Your local data is still kept in storage.'));
    } catch (toastError) {
      console.error('Toast render failed', toastError);
    }
  });

});
