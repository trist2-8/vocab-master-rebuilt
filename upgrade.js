document.addEventListener('DOMContentLoaded', () => {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const THEMES = [
    { id: 'midnight', name: 'Midnight Core', price: 0, tag: 'Mặc định ổn định', companion: '📘' },
    { id: 'aurora', name: 'Aurora Glass', price: 90, tag: 'Xu hướng glass hiện đại', companion: '✨' },
    { id: 'latte', name: 'Cozy Latte', price: 80, tag: 'Tông ấm, học lâu dễ chịu', companion: '☕' },
    { id: 'paper', name: 'Paper Minimal', price: 70, tag: 'Sạch, sáng, tập trung', companion: '📝' },
    { id: 'neon', name: 'Neon Focus', price: 130, tag: 'Đậm tương phản, cá tính', companion: '⚡' },
    { id: 'forest', name: 'Forest Focus', price: 95, tag: 'Xanh rêu dịu, hợp học dài', companion: '🌿' },
    { id: 'rose', name: 'Rose Glow', price: 105, tag: 'Mềm, hiện đại, nổi bật nhẹ', companion: '🌸' },
    { id: 'mono', name: 'Mono Studio', price: 75, tag: 'Xám tối tối giản, cực gọn', companion: '🖤' }
  ];
  const CARD_STYLES = [
    { id: 'classic', name: 'Classic', price: 0, tag: 'Giữ nguyên cảm giác gốc' },
    { id: 'rounded', name: 'Soft Rounded', price: 60, tag: 'Bo tròn hiện đại' },
    { id: 'notebook', name: 'Notebook', price: 85, tag: 'Cảm giác sổ tay học tập' },
    { id: 'glass', name: 'Glass Card', price: 110, tag: 'Trong mờ kiểu app mới' },
    { id: 'focusboard', name: 'Focus Board', price: 95, tag: 'Khung gọn kiểu dashboard mới' }
  ];

  const storage = {
    get(defaults) {
      return new Promise(resolve => chrome.storage.local.get(defaults, resolve));
    },
    set(values) {
      return new Promise(resolve => chrome.storage.local.set(values, resolve));
    }
  };

  const state = {
    stats: { coins: 0, dailyGoal: 12, dailyProgress: {}, studyLog: [], currentStreak: 0 },
    vocab: [],
    ui: null,
    focus: null,
    spentCoins: 0,
    bonusCoins: 0,
    runtime: {
      remainingSec: 25 * 60,
      intervalId: null,
      isRunning: false
    }
  };

  const byId = (id) => document.getElementById(id);

  init().catch((error) => {
    console.error('Vocab Master upgrade layer failed to initialize', error);
  });

  async function init() {
    injectUpgradeUi();
    bindEvents();
    await loadState();
    applyUiPreferences();
    syncPomodoroRuntime();
    renderUpgradeLayer();
  }

  function injectUpgradeUi() {
    const reviewView = byId('review-dashboard-view');
    if (reviewView && !byId('upgradeRewardBar')) {
      const anchor = byId('dailyFocusGrid') || reviewView.firstElementChild;
      const wrapper = document.createElement('div');
      wrapper.innerHTML = `
        <div id="upgradeRewardBar" class="upgrade-reward-bar panel-card">
          <div class="reward-summary-row">
            <div class="reward-pill"><span>🟡</span><strong id="walletAvailableCoins">0</strong><small>xu giao diện khả dụng</small></div>
            <div class="reward-pill"><span>🎨</span><strong id="walletThemeName">Midnight Core</strong><small>giao diện đang dùng</small></div>
            <div class="reward-pill"><span>🍅</span><strong id="walletPomodoroToday">0</strong><small>pomodoro hôm nay</small></div>
          </div>
          <div class="reward-action-row">
            <button id="openCustomizationBtn" class="secondary-btn">🎨 Tùy biến UI</button>
            <button id="openPomodoroBtn" class="secondary-btn">🍅 Pomodoro</button>
            <button id="openProgressBoosterBtn" class="secondary-btn">🎯 Nhiệm vụ hôm nay</button>
          </div>
          <div class="reward-mini-note" id="rewardMiniNote">Hoàn thành phiên học, Pomodoro và chuỗi ngày để mở khóa giao diện mới mà không đổi mục tiêu học từ.</div>
        </div>
        <div id="missionStrip" class="mission-strip"></div>
      `;
      anchor.insertAdjacentElement('afterend', wrapper);
    }

    if (!byId('customizationModal')) {
      const host = document.createElement('div');
      host.innerHTML = `
        <div id="ambientCompanion" class="ambient-companion" aria-hidden="true">
          <div class="ambient-orb"></div>
          <div class="ambient-avatar"><span id="ambientEmoji">📘</span></div>
        </div>
        <div id="pomodoroMiniWidget" class="pomodoro-mini-widget">
          <button id="pomodoroMiniOpenBtn" class="pomodoro-mini-main" title="Mở Pomodoro">
            <span class="pomodoro-mini-emoji">🍅</span>
            <span class="pomodoro-mini-text">
              <strong id="pomodoroMiniClock">25:00</strong>
              <small id="pomodoroMiniStatus">Sẵn sàng focus</small>
            </span>
          </button>
          <button id="pomodoroMiniToggleBtn" class="pomodoro-mini-action" title="Bắt đầu hoặc tạm dừng">▶</button>
        </div>
        <div id="customizationModal" class="modal hidden">
          <div class="modal-content tutorial-modal-content wide-modal">
            <button class="close-modal" data-close-modal="customizationModal" aria-label="Đóng">×</button>
            <h2>🎨 Tùy biến giao diện ngay trong extension</h2>
            <p class="muted-text">Bạn có thể cuộn để xem thêm theme, card style và gói giao diện mới ngay trong cửa sổ này.</p>
            <p class="muted-text">Mở khóa giao diện mới bằng xu kiếm được từ học tập. Tất cả chỉ thay đổi cảm giác sử dụng, không làm lệch mục tiêu học từ vựng.</p>
            <div class="wallet-board">
              <div class="wallet-stat"><span>Xu đang có</span><strong id="modalAvailableCoins">0</strong></div>
              <div class="wallet-stat"><span>Đã kiếm từ học</span><strong id="modalEarnedCoins">0</strong></div>
              <div class="wallet-stat"><span>Thưởng tập trung</span><strong id="modalBonusCoins">0</strong></div>
              <div class="wallet-stat"><span>Đã tiêu cho giao diện</span><strong id="modalSpentCoins">0</strong></div>
            </div>
            <div class="customizer-section">
              <div class="section-title-row"><h3>Theme shop</h3><span class="muted-text">Lấy cảm hứng từ các phong cách UI online hiện nay nhưng giữ độ đọc cao.</span></div>
              <div id="themeShopGrid" class="theme-shop-grid"></div>
            </div>
            <div class="customizer-section">
              <div class="section-title-row"><h3>Card style</h3><span class="muted-text">Tinh chỉnh cách thẻ, panel và flashcard hiện ra mà không chạm vào logic học.</span></div>
              <div id="cardStyleGrid" class="theme-shop-grid"></div>
            </div>
            <div class="customizer-section">
              <div class="section-title-row"><h3>Nhịp hiển thị</h3><span class="muted-text">Giữ app hiện đại nhưng không áp lực thị giác.</span></div>
              <div class="toggle-grid">
                <label class="toggle-card"><span>Hiệu ứng chuyển động nhẹ</span><input id="motionToggle" type="checkbox"></label>
                <label class="toggle-card"><span>Hiện study companion động</span><input id="companionToggle" type="checkbox"></label>
                <label class="toggle-card"><span>Tự hiệu ứng mừng khi đạt mốc</span><input id="celebrateToggle" type="checkbox"></label>
                <label class="toggle-card select-card"><span>Mật độ giao diện</span><select id="densitySelect" class="modern-input"><option value="balanced">Cân bằng</option><option value="compact">Gọn hơn</option><option value="comfortable">Thoáng hơn</option></select></label>
              </div>
            </div>
          </div>
        </div>
        <div id="pomodoroModal" class="modal hidden">
          <div class="modal-content tutorial-modal-content wide-modal pomodoro-modal-content">
            <button class="close-modal" data-close-modal="pomodoroModal" aria-label="Đóng">×</button>
            <h2>🍅 Pomodoro tập trung</h2>
            <p class="muted-text">Giữ nhịp học tập trung theo chặng ngắn, nhận thêm xu giao diện khi hoàn thành mà không làm rối luồng học chính.</p>
            <p class="muted-text">Đồng hồ mini sẽ luôn hiện riêng ở góc màn hình để người dùng dễ quan sát mà không cần mở lại modal.</p>
            <div class="pomodoro-shell">
              <div class="pomodoro-clock-wrap">
                <div class="pomodoro-clock" id="pomodoroClock">25:00</div>
                <div class="pomodoro-note" id="pomodoroStatusText">Sẵn sàng cho một phiên tập trung ngắn.</div>
              </div>
              <div class="pomodoro-controls-panel">
                <label>Thời lượng focus
                  <select id="pomodoroMinutesSelect" class="modern-input">
                    <option value="15">15 phút</option>
                    <option value="25">25 phút</option>
                    <option value="40">40 phút</option>
                  </select>
                </label>
                <label class="toggle-card inline-toggle"><span>Tự mở lượt học gợi ý sau khi xong</span><input id="pomodoroAutoLaunch" type="checkbox"></label>
                <div class="pomodoro-kpi-row">
                  <div class="pomodoro-kpi"><span>Hôm nay</span><strong id="pomodoroTodayKpi">0</strong></div>
                  <div class="pomodoro-kpi"><span>Tổng phiên</span><strong id="pomodoroTotalKpi">0</strong></div>
                  <div class="pomodoro-kpi"><span>Thưởng mỗi phiên</span><strong id="pomodoroRewardKpi">12</strong></div>
                </div>
                <div class="footer-actions">
                  <button id="pomodoroStartBtn" class="primary-btn">Bắt đầu</button>
                  <button id="pomodoroPauseBtn" class="secondary-btn">Tạm dừng</button>
                  <button id="pomodoroResetBtn" class="secondary-btn">Đặt lại</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div id="celebrationBurst" class="celebration-burst hidden" aria-hidden="true">
          <span>✨</span><span>🎉</span><span>📘</span><span>🍅</span><span>🟡</span>
        </div>
      `;
      document.body.appendChild(host);
    }
  }

  function bindEvents() {
    byId('openCustomizationBtn')?.addEventListener('click', () => openModal('customizationModal'));
    byId('openPomodoroBtn')?.addEventListener('click', () => openModal('pomodoroModal'));
    byId('openProgressBoosterBtn')?.addEventListener('click', () => openModal('pomodoroModal'));

    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => closeModal(btn.getAttribute('data-close-modal')));
    });

    ['customizationModal', 'pomodoroModal'].forEach(modalId => {
      const modal = byId(modalId);
      modal?.addEventListener('click', (event) => {
        if (event.target === modal) closeModal(modalId);
      });
    });

    byId('motionToggle')?.addEventListener('change', async (event) => {
      state.ui.motionEnabled = event.target.checked;
      await saveUiState();
    });
    byId('companionToggle')?.addEventListener('change', async (event) => {
      state.ui.companionEnabled = event.target.checked;
      await saveUiState();
    });
    byId('celebrateToggle')?.addEventListener('change', async (event) => {
      state.ui.autoCelebrate = event.target.checked;
      await saveUiState();
    });
    byId('densitySelect')?.addEventListener('change', async (event) => {
      state.ui.density = event.target.value;
      await saveUiState();
    });

    byId('themeShopGrid')?.addEventListener('click', handleCustomizerClick);
    byId('cardStyleGrid')?.addEventListener('click', handleCustomizerClick);

    byId('pomodoroMinutesSelect')?.addEventListener('change', async (event) => {
      state.focus.preferredMinutes = Number(event.target.value) || 25;
      syncPomodoroRuntime(true);
      await saveFocusState();
      renderPomodoroWidgets();
    });
    byId('pomodoroAutoLaunch')?.addEventListener('change', async (event) => {
      state.focus.autoLaunchRecommended = event.target.checked;
      await saveFocusState();
    });
    byId('pomodoroStartBtn')?.addEventListener('click', startPomodoro);
    byId('pomodoroPauseBtn')?.addEventListener('click', pausePomodoro);
    byId('pomodoroResetBtn')?.addEventListener('click', resetPomodoro);
    byId('pomodoroMiniOpenBtn')?.addEventListener('click', () => openModal('pomodoroModal'));
    byId('pomodoroMiniToggleBtn')?.addEventListener('click', () => {
      if (state.runtime.isRunning) pausePomodoro(false);
      else startPomodoro();
    });

    document.querySelectorAll('.nav-btn').forEach(btn => btn.addEventListener('click', () => {
      window.setTimeout(renderUpgradeLayer, 60);
    }));
    byId('reviewSetDropdown')?.addEventListener('change', () => window.setTimeout(renderUpgradeLayer, 60));

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'local') return;
      if (changes.stats) state.stats = normalizeStats(changes.stats.newValue || {});
      if (changes.vocab) state.vocab = Array.isArray(changes.vocab.newValue) ? changes.vocab.newValue : [];
      if (changes.vm_ui) state.ui = normalizeUiState(changes.vm_ui.newValue || {});
      if (changes.vm_focus) {
        state.focus = normalizeFocusState(changes.vm_focus.newValue || {});
        syncPomodoroRuntime();
      }
      if (changes.vm_spentCoins) state.spentCoins = Math.max(0, Number(changes.vm_spentCoins.newValue) || 0);
      if (changes.vm_bonusCoins) state.bonusCoins = Math.max(0, Number(changes.vm_bonusCoins.newValue) || 0);
      applyUiPreferences();
      renderUpgradeLayer();
    });

    window.setInterval(() => {
      if (!state.runtime.isRunning) return;
      renderPomodoroWidgets();
    }, 1000);
  }

  async function loadState() {
    const result = await storage.get({
      stats: { coins: 0 },
      vocab: [],
      vm_ui: {},
      vm_focus: {},
      vm_spentCoins: 0,
      vm_bonusCoins: 0
    });

    state.stats = normalizeStats(result.stats || {});
    state.vocab = Array.isArray(result.vocab) ? result.vocab : [];
    state.ui = normalizeUiState(result.vm_ui || {});
    state.focus = normalizeFocusState(result.vm_focus || {});
    state.spentCoins = Math.max(0, Number(result.vm_spentCoins) || 0);
    state.bonusCoins = Math.max(0, Number(result.vm_bonusCoins) || 0);
  }

  function normalizeStats(stats = {}) {
    return {
      coins: Number(stats.coins) || 0,
      dailyGoal: Math.max(5, Number(stats.dailyGoal) || 12),
      dailyProgress: stats.dailyProgress && typeof stats.dailyProgress === 'object' ? { ...stats.dailyProgress } : {},
      studyLog: Array.isArray(stats.studyLog) ? stats.studyLog.slice(0, 20) : [],
      currentStreak: Math.max(0, Number(stats.currentStreak) || 0)
    };
  }

  function normalizeUiState(raw = {}) {
    const ui = {
      theme: THEMES.some(item => item.id === raw.theme) ? raw.theme : 'midnight',
      unlockedThemes: Array.isArray(raw.unlockedThemes) ? raw.unlockedThemes.filter(id => THEMES.some(item => item.id === id)) : ['midnight'],
      cardStyle: CARD_STYLES.some(item => item.id === raw.cardStyle) ? raw.cardStyle : 'classic',
      unlockedCardStyles: Array.isArray(raw.unlockedCardStyles) ? raw.unlockedCardStyles.filter(id => CARD_STYLES.some(item => item.id === id)) : ['classic'],
      motionEnabled: raw.motionEnabled !== false,
      companionEnabled: raw.companionEnabled !== false,
      autoCelebrate: raw.autoCelebrate !== false,
      density: ['compact', 'balanced', 'comfortable'].includes(raw.density) ? raw.density : 'balanced'
    };
    if (!ui.unlockedThemes.includes('midnight')) ui.unlockedThemes.unshift('midnight');
    if (!ui.unlockedThemes.includes(ui.theme)) ui.theme = 'midnight';
    if (!ui.unlockedCardStyles.includes('classic')) ui.unlockedCardStyles.unshift('classic');
    if (!ui.unlockedCardStyles.includes(ui.cardStyle)) ui.cardStyle = 'classic';
    return ui;
  }

  function normalizeFocusState(raw = {}) {
    const todayKey = getTodayKey();
    const sameDay = raw.lastCompletedDate === todayKey;
    return {
      preferredMinutes: [15, 25, 40].includes(Number(raw.preferredMinutes)) ? Number(raw.preferredMinutes) : 25,
      autoLaunchRecommended: Boolean(raw.autoLaunchRecommended),
      completedToday: sameDay ? Math.max(0, Number(raw.completedToday) || 0) : 0,
      totalCompleted: Math.max(0, Number(raw.totalCompleted) || 0),
      rewardPerSession: Math.max(5, Number(raw.rewardPerSession) || 12),
      lastCompletedDate: sameDay ? todayKey : '',
      lastFinishedAt: Number(raw.lastFinishedAt) || 0
    };
  }

  function getTodayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function getThemeMeta(id) {
    return THEMES.find(item => item.id === id) || THEMES[0];
  }

  function getCardStyleMeta(id) {
    return CARD_STYLES.find(item => item.id === id) || CARD_STYLES[0];
  }

  function openModal(id) {
    byId(id)?.classList.remove('hidden');
  }

  function closeModal(id) {
    byId(id)?.classList.add('hidden');
  }

  function getAvailableCoins() {
    return Math.max(0, (Number(state.stats.coins) || 0) + state.bonusCoins - state.spentCoins);
  }

  function applyUiPreferences() {
    document.body.dataset.uiTheme = state.ui.theme;
    document.body.datasetCardStyle = state.ui.cardStyle;
    document.body.dataset.uiCardStyle = state.ui.cardStyle;
    document.body.dataset.uiDensity = state.ui.density;
    document.body.classList.toggle('reduced-motion', !state.ui.motionEnabled);
    const companion = byId('ambientCompanion');
    const emoji = byId('ambientEmoji');
    if (emoji) emoji.textContent = getThemeMeta(state.ui.theme).companion || '📘';
    companion?.classList.toggle('hidden', !state.ui.companionEnabled);
  }

  function renderUpgradeLayer() {
    renderWalletBar();
    renderMissionStrip();
    renderCustomizer();
    renderPomodoroWidgets();
  }

  function renderWalletBar() {
    const theme = getThemeMeta(state.ui.theme);
    const available = getAvailableCoins();
    const note = byId('rewardMiniNote');
    const counts = computeStudyCounts(state.vocab);
    setText('walletAvailableCoins', String(available));
    setText('walletThemeName', theme.name);
    setText('walletPomodoroToday', String(state.focus.completedToday));
    if (note) {
      note.textContent = counts.weak
        ? `Bạn còn ${counts.weak} từ yếu. Một Pomodoro + Gõ từ sẽ vừa tăng tập trung vừa kiếm thêm xu giao diện.`
        : `Giao diện đang dùng: ${theme.name}. Giữ nhịp học đều để mở thêm phong cách mới mà không làm app rối đi.`;
    }
    setText('modalAvailableCoins', String(available));
    setText('modalEarnedCoins', String(Number(state.stats.coins) || 0));
    setText('modalBonusCoins', String(state.bonusCoins));
    setText('modalSpentCoins', String(state.spentCoins));
  }

  function renderMissionStrip() {
    const strip = byId('missionStrip');
    if (!strip) return;
    const today = getTodayProgress();
    const counts = computeStudyCounts(state.vocab);
    const missions = [
      {
        icon: '🍅',
        title: 'Khởi động tập trung',
        progress: `${Math.min(state.focus.completedToday, 1)}/1`,
        note: state.focus.completedToday >= 1 ? 'Đã hoàn thành ít nhất 1 Pomodoro hôm nay.' : 'Hoàn thành 1 Pomodoro để nhận thêm xu giao diện.',
        done: state.focus.completedToday >= 1
      },
      {
        icon: '📘',
        title: 'Giữ nhịp học',
        progress: `${Math.min(today.studied, state.stats.dailyGoal)}/${state.stats.dailyGoal}`,
        note: today.studied >= state.stats.dailyGoal ? 'Mục tiêu học hôm nay đã đạt.' : `Còn ${Math.max(0, state.stats.dailyGoal - today.studied)} lượt để chạm mục tiêu.`,
        done: today.studied >= state.stats.dailyGoal
      },
      {
        icon: '🛟',
        title: 'Cứu từ yếu',
        progress: counts.weak ? `${Math.min(today.correct, 5)}/5` : 'Ổn định',
        note: counts.weak ? 'Hoàn thành 5 lượt đúng hôm nay để kéo các từ yếu lên.' : 'Hiện chưa có cụm từ yếu nổi bật, nhịp nhớ đang ổn.',
        done: !counts.weak || today.correct >= 5
      }
    ];

    strip.innerHTML = '';
    missions.forEach(mission => {
      const card = document.createElement('div');
      card.className = `mission-card ${mission.done ? 'done' : ''}`;
      card.innerHTML = `
        <div class="mission-head"><span class="mission-icon">${mission.icon}</span><strong>${escapeHtml(mission.title)}</strong></div>
        <div class="mission-progress">${escapeHtml(mission.progress)}</div>
        <div class="mission-note">${escapeHtml(mission.note)}</div>
      `;
      strip.appendChild(card);
    });
  }

  function renderCustomizer() {
    renderThemeCards('themeShopGrid', THEMES, state.ui.unlockedThemes, state.ui.theme, 'theme');
    renderThemeCards('cardStyleGrid', CARD_STYLES, state.ui.unlockedCardStyles, state.ui.cardStyle, 'card');
    if (byId('motionToggle')) byId('motionToggle').checked = state.ui.motionEnabled;
    if (byId('companionToggle')) byId('companionToggle').checked = state.ui.companionEnabled;
    if (byId('celebrateToggle')) byId('celebrateToggle').checked = state.ui.autoCelebrate;
    if (byId('densitySelect')) byId('densitySelect').value = state.ui.density;
  }

  function renderThemeCards(containerId, items, unlockedIds, activeId, kind) {
    const grid = byId(containerId);
    if (!grid) return;
    const available = getAvailableCoins();
    grid.innerHTML = '';
    items.forEach(item => {
      const unlocked = unlockedIds.includes(item.id) || item.price === 0;
      const active = item.id === activeId;
      const card = document.createElement('div');
      card.className = `shop-card ${active ? 'active' : ''}`;
      card.innerHTML = `
        <div class="shop-card-head">
          <div>
            <strong>${escapeHtml(item.name)}</strong>
            <div class="shop-tag">${escapeHtml(item.tag)}</div>
          </div>
          <span class="shop-price">${item.price ? `${item.price} xu` : 'Miễn phí'}</span>
        </div>
        <div class="shop-actions">
          <button class="${unlocked ? 'primary-btn' : 'secondary-btn'}" data-kind="${kind}" data-id="${item.id}" data-action="${unlocked ? 'apply' : 'unlock'}" ${!unlocked && available < item.price ? 'disabled' : ''}>
            ${active ? 'Đang dùng' : unlocked ? 'Áp dụng' : `Mở khóa (${item.price})`}
          </button>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  async function handleCustomizerClick(event) {
    const button = event.target.closest('button[data-kind]');
    if (!button) return;
    const { kind, id, action } = button.dataset;
    if (kind === 'theme') {
      if (action === 'unlock') await unlockTheme(id);
      else await applyTheme(id);
    }
    if (kind === 'card') {
      if (action === 'unlock') await unlockCardStyle(id);
      else await applyCardStyle(id);
    }
  }

  async function unlockTheme(id) {
    const meta = getThemeMeta(id);
    if (getAvailableCoins() < meta.price) return showToast('Xu giao diện chưa đủ để mở theme này.');
    state.spentCoins += meta.price;
    if (!state.ui.unlockedThemes.includes(id)) state.ui.unlockedThemes.push(id);
    state.ui.theme = id;
    await Promise.all([saveUiState(), saveWalletState()]);
    maybeCelebrate(`Đã mở khóa theme ${meta.name}!`);
  }

  async function applyTheme(id) {
    if (!state.ui.unlockedThemes.includes(id)) return;
    state.ui.theme = id;
    await saveUiState();
    showToast(`Đã áp dụng theme ${getThemeMeta(id).name}.`);
  }

  async function unlockCardStyle(id) {
    const meta = getCardStyleMeta(id);
    if (getAvailableCoins() < meta.price) return showToast('Xu giao diện chưa đủ để mở card style này.');
    state.spentCoins += meta.price;
    if (!state.ui.unlockedCardStyles.includes(id)) state.ui.unlockedCardStyles.push(id);
    state.ui.cardStyle = id;
    await Promise.all([saveUiState(), saveWalletState()]);
    maybeCelebrate(`Đã mở khóa card style ${meta.name}!`);
  }

  async function applyCardStyle(id) {
    if (!state.ui.unlockedCardStyles.includes(id)) return;
    state.ui.cardStyle = id;
    await saveUiState();
    showToast(`Đã áp dụng card style ${getCardStyleMeta(id).name}.`);
  }

  async function saveUiState() {
    applyUiPreferences();
    renderUpgradeLayer();
    await storage.set({ vm_ui: state.ui });
  }

  async function saveWalletState() {
    renderUpgradeLayer();
    await storage.set({ vm_spentCoins: state.spentCoins, vm_bonusCoins: state.bonusCoins });
  }

  async function saveFocusState() {
    renderUpgradeLayer();
    await storage.set({ vm_focus: state.focus });
  }

  function syncPomodoroRuntime(forceReset = false) {
    if (state.runtime.isRunning && !forceReset) return;
    if (forceReset) {
      pausePomodoro(false);
    }
    state.runtime.remainingSec = state.focus.preferredMinutes * 60;
    renderPomodoroWidgets();
  }

  function startPomodoro() {
    if (state.runtime.isRunning) return;
    if (state.runtime.remainingSec <= 0) state.runtime.remainingSec = state.focus.preferredMinutes * 60;
    state.runtime.isRunning = true;
    renderPomodoroWidgets();
    state.runtime.intervalId = window.setInterval(async () => {
      state.runtime.remainingSec -= 1;
      renderPomodoroWidgets();
      if (state.runtime.remainingSec <= 0) {
        await completePomodoroSession();
      }
    }, 1000);
  }

  function pausePomodoro(showNotice = true) {
    window.clearInterval(state.runtime.intervalId);
    state.runtime.intervalId = null;
    const wasRunning = state.runtime.isRunning;
    state.runtime.isRunning = false;
    renderPomodoroWidgets();
    if (showNotice && wasRunning) showToast('Đã tạm dừng Pomodoro.');
  }

  function resetPomodoro() {
    pausePomodoro(false);
    state.runtime.remainingSec = state.focus.preferredMinutes * 60;
    renderPomodoroWidgets();
    showToast('Đã đặt lại Pomodoro.');
  }

  async function completePomodoroSession() {
    pausePomodoro(false);
    state.focus.completedToday += 1;
    state.focus.totalCompleted += 1;
    state.focus.lastCompletedDate = getTodayKey();
    state.focus.lastFinishedAt = Date.now();
    state.bonusCoins += state.focus.rewardPerSession;
    await Promise.all([saveFocusState(), saveWalletState()]);
    state.runtime.remainingSec = state.focus.preferredMinutes * 60;
    renderPomodoroWidgets();
    maybeCelebrate(`Hoàn thành ${state.focus.preferredMinutes} phút tập trung • +${state.focus.rewardPerSession} xu giao diện!`);
    if (state.focus.autoLaunchRecommended) {
      window.setTimeout(() => {
        closeModal('pomodoroModal');
        byId('startRecommendedBtn')?.click();
      }, 1000);
    }
  }

  function renderPomodoroWidgets() {
    const clock = byId('pomodoroClock');
    const statusText = byId('pomodoroStatusText');
    const miniClock = byId('pomodoroMiniClock');
    const miniStatus = byId('pomodoroMiniStatus');
    const miniToggle = byId('pomodoroMiniToggleBtn');
    const miniWidget = byId('pomodoroMiniWidget');
    const total = state.focus.preferredMinutes * 60;
    const remaining = Math.max(0, state.runtime.remainingSec);
    const formatted = formatClock(remaining);
    if (clock) clock.textContent = formatted;
    if (miniClock) miniClock.textContent = formatted;
    if (statusText) {
      statusText.textContent = state.runtime.isRunning
        ? `Đang focus. Còn ${formatted} trước khi nhận thưởng giao diện.`
        : remaining === total
          ? 'Sẵn sàng cho một phiên tập trung ngắn.'
          : `Đã tạm dừng ở ${formatted}.`;
    }
    if (miniStatus) {
      miniStatus.textContent = state.runtime.isRunning
        ? 'Đang focus'
        : remaining === total
          ? 'Sẵn sàng focus'
          : 'Đang tạm dừng';
    }
    if (miniToggle) miniToggle.textContent = state.runtime.isRunning ? '❚❚' : '▶';
    miniWidget?.classList.toggle('running', state.runtime.isRunning);
    if (byId('pomodoroMinutesSelect')) byId('pomodoroMinutesSelect').value = String(state.focus.preferredMinutes);
    if (byId('pomodoroAutoLaunch')) byId('pomodoroAutoLaunch').checked = state.focus.autoLaunchRecommended;
    setText('pomodoroTodayKpi', String(state.focus.completedToday));
    setText('pomodoroTotalKpi', String(state.focus.totalCompleted));
    setText('pomodoroRewardKpi', String(state.focus.rewardPerSession));
  }

  function computeStudyCounts(vocab) {
    const now = Date.now();
    const counts = { total: vocab.length, due: 0, weak: 0, fresh: 0 };
    vocab.forEach(word => {
      const review = word?.review || {};
      const confidence = Number.isFinite(review.confidence) ? review.confidence : (word?.isLearned ? 4 : review.correctCount >= 2 ? 2 : 0);
      const seenCount = Number(review.seenCount) || 0;
      const dueAt = Number(review.dueAt) || 0;
      const wrongCount = Number(review.wrongCount) || 0;
      const correctCount = Number(review.correctCount) || 0;
      if (!seenCount && !dueAt) counts.fresh += 1;
      if (dueAt && dueAt <= now) counts.due += 1;
      if (confidence <= 1 || wrongCount > correctCount) counts.weak += 1;
    });
    return counts;
  }

  function getTodayProgress() {
    return state.stats.dailyProgress[getTodayKey()] || { studied: 0, correct: 0, hard: 0, again: 0 };
  }

  function formatClock(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  function maybeCelebrate(message) {
    if (message) showToast(message);
    if (!state.ui.autoCelebrate || !state.ui.motionEnabled) return;
    const burst = byId('celebrationBurst');
    if (!burst) return;
    burst.classList.remove('hidden', 'show');
    requestAnimationFrame(() => burst.classList.add('show'));
    window.setTimeout(() => {
      burst.classList.remove('show');
      window.setTimeout(() => burst.classList.add('hidden'), 250);
    }, 1200);
  }

  function showToast(message) {
    const toast = byId('toastNotification');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('hidden', 'show');
    requestAnimationFrame(() => toast.classList.add('show'));
    window.clearTimeout(toast._upgradeTimer);
    toast._upgradeTimer = window.setTimeout(() => {
      toast.classList.remove('show');
      window.setTimeout(() => toast.classList.add('hidden'), 250);
    }, 2600);
  }

  function setText(id, value) {
    const node = byId(id);
    if (node) node.textContent = value;
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
