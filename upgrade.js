
document.addEventListener('DOMContentLoaded', () => {

  const { THEMES, CARD_STYLES, LAYOUT_PACKS, FONT_TONES, QUOTE_STYLES, PRESET_DISCOUNT, PRESETS, DAILY_QUOTES, QUOTE_WORD_BANK, QUOTE_STOPWORDS, WORD_LESSON_BANK, CONFUSION_BANK, PATTERN_TEMPLATES, SHOP_CONFIG } = window.VMUpgradeData || {};

  const storage = {
    get(defaults) {
      return new Promise((resolve) => chrome.storage.local.get(defaults, resolve));
    },
    set(values) {
      return new Promise((resolve) => chrome.storage.local.set(values, resolve));
    }
  };


  const state = {
    stats: { coins: 0, dailyGoal: 12, dailyProgress: {}, studyLog: [], currentStreak: 0 },
    vocab: [],
    ui: null,
    focus: null,
    quotes: null,
    collections: null,
    admin: null,
    spentCoins: 0,
    bonusCoins: 0,
    runtime: {
      remainingSec: 25 * 60,
      intervalId: null,
      isRunning: false,
      quoteIndex: null,
      selectedQuoteWordKey: '',
      selectedRescueWordId: '',
      selectedPatternId: '',
      focusRoomSeed: 0,
      pomodoroWarningPlayed: false
    }
  };

  const byId = (id) => document.getElementById(id);

  let walletWriteInFlight = false;
  let upgradeRenderTimer = null;
  let upgradeRenderRaf = 0;

  function isModalOpen(id) {
    const modal = byId(id);
    return Boolean(modal && !modal.classList.contains('hidden'));
  }

  function renderVisibleUpgradePanels() {
    renderWalletBar();
    renderMissionStrip();
    renderDailySayingLauncher();
    renderPomodoroWidgets();
    renderUpgradeHubState();

    if (isModalOpen('customizationModal')) renderCustomizer();
    if (isModalOpen('effectsLabModal')) renderEffectsLabModal();
    if (isModalOpen('dailySayingModal')) renderDailySayingModal();
    if (isModalOpen('collectionsModal')) renderCollectionsModal();
    if (isModalOpen('weeklyRecapModal')) renderWeeklyRecapModal();
    if (isModalOpen('patternVaultModal')) renderPatternVaultModal();
    if (isModalOpen('memoryPathModal')) renderMemoryPathModal();
    if (isModalOpen('weakRescueModal')) renderWeakRescueModal();
    if (isModalOpen('focusRoomModal')) renderFocusRoomModal();
    if (isModalOpen('adminModal')) renderAdminModal();
  }

  function scheduleUpgradeRender(delay = 0) {
    const safeDelay = Math.max(0, Number(delay) || 0);
    if (upgradeRenderTimer) {
      window.clearTimeout(upgradeRenderTimer);
      upgradeRenderTimer = null;
    }
    if (upgradeRenderRaf) {
      window.cancelAnimationFrame(upgradeRenderRaf);
      upgradeRenderRaf = 0;
    }

    const run = () => {
      upgradeRenderTimer = null;
      upgradeRenderRaf = window.requestAnimationFrame(() => {
        upgradeRenderRaf = 0;
        try {
          renderVisibleUpgradePanels();
        } catch (_) {
          renderUpgradeLayer();
        }
      });
    };

    if (safeDelay === 0) run();
    else upgradeRenderTimer = window.setTimeout(run, safeDelay);
  }


  state.ui = normalizeUiState({});
  state.focus = normalizeFocusState({});
  state.quotes = normalizeQuotesState({});
  state.collections = normalizeCollectionsState({});
  state.admin = normalizeAdminState({});

  const EFFECTS_LAB_PRESETS = [
    { id: 'study-focus', name: 'Study Focus', note: 'Compact and calm for long study sessions.', theme: 'midnight', cardStyle: 'focusboard', density: 'compact', effect: 'off' },
    { id: 'glass-studio', name: 'Glass Studio', note: 'Balanced clarity with a premium glass shell.', theme: 'liquidglass', cardStyle: 'glass', density: 'balanced', effect: 'prism' },
    { id: 'calm-aurora', name: 'Calm Aurora', note: 'Soft aurora glow for night study.', theme: 'aurora', cardStyle: 'glass', density: 'comfortable', effect: 'aurora' },
    { id: 'sunset-pop', name: 'Sunset Pop', note: 'Warmer, livelier glass for a fresh look.', theme: 'latte', cardStyle: 'rounded', density: 'comfortable', effect: 'stardust' }
  ];

  const EFFECTS_SCENES = [
    { id: 'nebula', label: 'Nebula', note: 'Deep purple ambient scene for daily study.', theme: 'liquidglass' },
    { id: 'aurora', label: 'Aurora', note: 'Cool aurora glow for a fresher interface.', theme: 'aurora' },
    { id: 'midnight', label: 'Midnight', note: 'Darker and tighter for low-distraction sessions.', theme: 'midnight' },
    { id: 'sunset', label: 'Sunset', note: 'Warmer sunset tones for a lively workspace.', theme: 'latte' },
    { id: 'forest', label: 'Forest', note: 'Muted green scene for calmer studying.', theme: 'forest' },
    { id: 'rose', label: 'Rose', note: 'Rose-violet scene with a softer feel.', theme: 'rose' }
  ];

  init().catch((error) => {
    console.error('Vocab Master upgrade layer failed to initialize', error);
  });

  async function init() {
    injectUpgradeUi();
    bindEvents();
    await loadState();
    await ensureWalletConsistency({ persist: true });
    applyUiPreferences();
    syncPomodoroRuntime();
    renderUpgradeLayer();
  }


  function injectUpgradeUi() {
    const studioView = byId('interface-view') || byId('management-view');
    if (studioView && !byId('upgradeHub')) {
      const anchor = byId('interfaceHubAnchor') || byId('managementSummary') || studioView.firstElementChild;
      const wrapper = document.createElement('div');
      wrapper.id = 'upgradeHub';
      wrapper.innerHTML = `
        <div id="interfaceQuickDeck" class="panel-card interface-quick-deck">
          <div class="section-title-row interface-quick-head">
            <div>
              <h3>Control center</h3>
              <span class="muted-text">Một chạm để mở nhanh hiệu ứng, admin, pomodoro và các tiện ích giao diện.</span>
            </div>
          </div>
          <div class="interface-quick-grid">
            <article class="interface-quick-card interface-quick-card-effects">
              <div class="interface-quick-card-top">
                <span class="interface-quick-icon">✨</span>
                <div>
                  <strong>Effects Lab</strong>
                  <p class="muted-text">Hiệu ứng động mới cho nền liquid glass.</p>
                </div>
              </div>
              <div class="interface-quick-meta">
                <span id="effectsQuickLabel" class="interface-quick-chip">Đang tắt</span>
                <span id="effectsQuickDetail" class="muted-text">Thử Aurora, Fireflies, Stardust hoặc Prism.</span>
              </div>
              <div class="interface-quick-actions">
                <button id="openEffectsLabBtn" class="secondary-btn" type="button">Mở Effects Lab</button>
              </div>
            </article>
            <article class="interface-quick-card interface-quick-card-admin">
              <div class="interface-quick-card-top">
                <span class="interface-quick-icon">🛠</span>
                <div>
                  <strong>Admin wallet tools</strong>
                  <p class="muted-text">Bật, sửa số dư hoặc đồng bộ lại ví UI.</p>
                </div>
              </div>
              <div class="interface-quick-meta interface-quick-meta-stack">
                <span id="adminDeckStatus" class="interface-quick-chip">Admin OFF</span>
                <span id="adminDeckWallet" class="muted-text">Số dư khả dụng: 0</span>
              </div>
              <div class="interface-quick-actions">
                <button id="openAdminDeckBtn" class="secondary-btn" type="button">Mở Admin</button>
                <button id="toggleAdminDeckBtn" class="primary-btn" type="button">Bật nhanh</button>
                <button id="repairAdminDeckBtn" class="ghost-btn" type="button">Sửa ví</button>
              </div>
            </article>
            <article class="interface-quick-card interface-quick-card-focus">
              <div class="interface-quick-card-top">
                <span class="interface-quick-icon">🍅</span>
                <div>
                  <strong>Pomodoro + Focus</strong>
                  <p class="muted-text">Giữ nhịp học, âm báo và mini widget gọn hơn.</p>
                </div>
              </div>
              <div class="interface-quick-meta">
                <span id="focusQuickStatus" class="interface-quick-chip">25 phút</span>
                <span id="focusQuickDetail" class="muted-text">0 pomodoro hôm nay</span>
              </div>
              <div class="interface-quick-actions">
                <button id="openFocusDeckBtn" class="secondary-btn" type="button">Mở Pomodoro</button>
                <button id="openFocusRoomDeckBtn" class="ghost-btn" type="button">Focus Room</button>
              </div>
            </article>
            <article class="interface-quick-card interface-quick-card-quote">
              <div class="interface-quick-card-top">
                <span class="interface-quick-icon">🌌</span>
                <div>
                  <strong>Daily mood</strong>
                  <p class="muted-text">Quote, collections và preset để giao diện bớt nhàm chán.</p>
                </div>
              </div>
              <div class="interface-quick-meta">
                <span id="quoteQuickStyle" class="interface-quick-chip">Soft quote</span>
                <span id="quoteQuickDetail" class="muted-text">Preset + collections + câu nói mỗi ngày.</span>
              </div>
              <div class="interface-quick-actions">
                <button id="openDailyDeckBtn" class="secondary-btn" type="button">Mở quote</button>
                <button id="openCollectionsDeckBtn" class="ghost-btn" type="button">Collections</button>
              </div>
            </article>
          </div>
        </div>
        <div id="upgradeRewardBar" class="upgrade-reward-bar panel-card">
          <div class="reward-bar-head">
            <strong>Studio & Rewards</strong>
            <button id="toggleUpgradeHubBtn" class="secondary-btn slim-btn" type="button">Thu gọn</button>
          </div>
          <div class="reward-summary-row">
            <div class="reward-pill"><span>🟡</span><strong id="walletAvailableCoins">0</strong><small>số dư UI khả dụng</small></div>
            <div class="reward-pill"><span>🎨</span><strong id="walletThemeName">Midnight Core</strong><small>giao diện đang dùng</small></div>
            <div class="reward-pill"><span>🍅</span><strong id="walletPomodoroToday">0</strong><small>pomodoro hôm nay</small></div>
            <div class="reward-pill"><span>🪄</span><strong id="walletLayoutName">Classic Layout</strong><small>bố cục đang dùng</small></div>
          </div>
          <div class="reward-action-row">
            <button id="openCustomizationBtn" class="secondary-btn">🎨 Tùy biến UI</button>
            <button id="openAdminPanelBtn" class="secondary-btn">🛠 Admin</button>
            <button id="openPomodoroBtn" class="secondary-btn">🍅 Pomodoro</button>
            <button id="openProgressBoosterBtn" class="secondary-btn">🎯 Nhiệm vụ hôm nay</button>
            <button id="openDailySayingBtn" class="secondary-btn">💬 Câu nói mỗi ngày</button>
            <button id="openFocusRoomBtn" class="secondary-btn">🫧 Focus Room</button>
            <button id="openCollectionsBtn" class="secondary-btn">📚 Bộ sưu tập</button>
            <button id="openMemoryPathBtn" class="secondary-btn">🪜 Memory Path</button>
            <button id="openWeakRescueBtn" class="secondary-btn">🛟 Cứu từ yếu</button>
            <button id="openPatternVaultBtn" class="secondary-btn">🧩 Pattern Vault</button>
            <button id="openWeeklyRecapBtn" class="secondary-btn">🗓 Tóm tắt tuần</button>
          </div>
          <div class="reward-mini-note" id="rewardMiniNote">Khu này dành cho UI, coin và focus tools. Phần ôn tập giờ được giữ riêng để màn học sạch hơn và ít bị phân tâm hơn.</div>
        </div>
        <button id="dailySayingLauncher" class="daily-saying-launcher" type="button" aria-haspopup="dialog" aria-controls="dailySayingModal">
          <span class="daily-launcher-copy">
            <span class="daily-launcher-label">Câu nói mỗi ngày</span>
            <strong id="dailyLauncherTitle">Nhấn để mở câu nói hôm nay</strong>
            <small id="dailyLauncherNote">Một câu tiếng Anh ngắn để tạo cảm giác muốn lưu lại.</small>
          </span>
          <span class="daily-launcher-meta">
            <span id="dailyLauncherMood" class="daily-launcher-chip">gentle</span>
            <span class="daily-launcher-arrow">→</span>
          </span>
        </button>
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
          <div class="modal-content tutorial-modal-content wide-modal vm-customization-modal">
            <button class="close-modal" data-close-modal="customizationModal" aria-label="Đóng">×</button>
            <h2>🎨 Tùy biến giao diện ngay trong extension</h2>
            <p class="muted-text">Bản nâng cấp này giữ nguyên luồng học cũ. Mọi thay đổi mới đều nằm trong lớp tùy biến, nên người dùng vẫn có thể giữ mode cổ điển nếu muốn.</p>
            <div class="wallet-board">
              <div class="wallet-stat"><span>Số dư UI khả dụng</span><strong id="modalAvailableCoins">0</strong></div>
              <div class="wallet-stat"><span>Coin học hiện tại</span><strong id="modalEarnedCoins">0</strong></div>
              <div class="wallet-stat"><span>Thưởng focus</span><strong id="modalBonusCoins">0</strong></div>
              <div class="wallet-stat"><span>Đã tiêu cho UI</span><strong id="modalSpentCoins">0</strong></div>
            </div>

            <div class="classic-safe-note">
              <strong>Classic mode luôn được giữ lại.</strong>
              <span>Bạn chỉ mở thêm style packs, layout packs, font packs và quote packs để giao diện đa dạng hơn mà không ảnh hưởng tính năng học cũ.</span>
            </div>

            <div class="admin-quick-note">
              <div>
                <strong id="adminQuickStatus">Admin mode: tắt</strong>
                <span class="muted-text">Dùng khi bạn cần tự điều chỉnh coin hoặc sửa số dư để thử giao diện. Có thể bật/tắt bất cứ lúc nào.</span>
              </div>
              <button id="openAdminFromCustomizationBtn" class="secondary-btn" type="button">🛠 Mở Admin</button>
            </div>

            <div class="customizer-section">
              <div class="section-title-row">
                <h3>Preset 1 chạm</h3>
                <span class="muted-text">Nếu còn thiếu pack, preset có thể mở đủ phần còn thiếu và áp dụng ngay trong một lần bấm.</span>
              </div>
              <div id="presetGrid" class="theme-shop-grid preset-grid"></div>
            </div>

            <div class="customizer-section">
              <div class="section-title-row">
                <h3>Theme shop</h3>
                <span class="muted-text">Không chỉ đổi màu: có thêm wallpaper-style packs như Anime Study Room, Rainy Window và Cafe Notes.</span>
              </div>
              <div id="themeShopGrid" class="theme-shop-grid"></div>
            </div>

            <div class="customizer-section">
              <div class="section-title-row">
                <h3>Card style</h3>
                <span class="muted-text">Thay cách panel và card xuất hiện, không chạm logic học.</span>
              </div>
              <div id="cardStyleGrid" class="theme-shop-grid"></div>
            </div>

            <div class="customizer-section">
              <div class="section-title-row">
                <h3>Layout packs</h3>
                <span class="muted-text">Đây là phần làm giao diện bớt đơn điệu hơn đổi màu đơn thuần.</span>
              </div>
              <div id="layoutPackGrid" class="theme-shop-grid"></div>
            </div>

            <div class="customizer-section">
              <div class="section-title-row">
                <h3>Font tones</h3>
                <span class="muted-text">Đổi sắc thái chữ để giao diện có cảm giác khác hơn.</span>
              </div>
              <div id="fontPackGrid" class="theme-shop-grid"></div>
            </div>

            <div class="customizer-section">
              <div class="section-title-row">
                <h3>Daily saying styles</h3>
                <span class="muted-text">Nút “câu nói mỗi ngày” vẫn là nút nhỏ ở home, nhưng có thể đổi cách mở card.</span>
              </div>
              <div id="quoteStyleGrid" class="theme-shop-grid"></div>
            </div>

            <div class="customizer-section">
              <div class="section-title-row">
                <h3>Atmosphere effects</h3>
                <span class="muted-text">Thêm mưa hoặc tuyết rất nhẹ phía sau giao diện để tạo mood mà vẫn giữ chữ rõ.</span>
              </div>
              <div class="toggle-grid atmosphere-control-grid">
                <label class="toggle-card select-card"><span>Hiệu ứng</span><select id="weatherEffectSelect" class="modern-input"><option value="off">Tắt</option><option value="aurora">Aurora ribbon</option><option value="fireflies">Fireflies</option><option value="stardust">Stardust</option><option value="prism">Prism wave</option><option value="comets">Comet trails</option><option value="orbs">Glass orbs</option><option value="bubbles">Floating bubbles</option><option value="rain">Mưa mềm</option><option value="window-rain">Mưa kính</option><option value="snow">Tuyết</option><option value="dust">Bụi sáng</option><option value="mist">Sương mờ</option><option value="neon">Phản chiếu neon</option><option value="petals">Cánh hoa</option></select></label>
                <label class="toggle-card range-card"><span>Mật độ hiệu ứng</span><input id="weatherIntensityRange" type="range" min="20" max="100" step="5"></label>
                <label class="toggle-card range-card"><span>Tốc độ hiệu ứng</span><input id="weatherSpeedRange" type="range" min="40" max="140" step="5"></label>
              </div>
            </div>

            <div class="customizer-section">
              <div class="section-title-row">
                <h3>Nhịp hiển thị</h3>
                <span class="muted-text">Giữ app hiện đại nhưng không áp lực thị giác.</span>
              </div>
              <div class="toggle-grid">
                <label class="toggle-card"><span>Hiệu ứng chuyển động nhẹ</span><input id="motionToggle" type="checkbox"></label>
                <label class="toggle-card"><span>Hiện study companion động</span><input id="companionToggle" type="checkbox"></label>
                <label class="toggle-card"><span>Tự hiệu ứng mừng khi đạt mốc</span><input id="celebrateToggle" type="checkbox"></label>
                <label class="toggle-card select-card"><span>Mật độ giao diện</span><select id="densitySelect" class="modern-input"><option value="balanced">Cân bằng</option><option value="compact">Gọn hơn</option><option value="comfortable">Thoáng hơn</option></select></label>
              </div>
            </div>
          </div>
        </div>

                <div id="effectsLabModal" class="modal hidden">
          <div class="modal-content tutorial-modal-content wide-modal vm-effects-modal vm-effects-modal-rich">
            <button class="close-modal" data-close-modal="effectsLabModal" aria-label="Đóng">×</button>
            <div class="effects-lab-head">
              <div>
                <h2 id="effectsLabTitle">Effects Lab</h2>
                <p id="effectsLabLead" class="muted-text">Add richer effects without bloating the UI: start with quick presets, then open advanced controls only when needed.</p>
              </div>
              <button id="openStudioFromEffectsBtn" class="secondary-btn slim-btn" type="button">Studio</button>
            </div>
            <div class="effects-preset-row">
              <div>
                <div id="effectsPresetLabel" class="effects-section-title">Quick presets</div>
                <p id="effectsPresetHint" class="muted-text effects-section-note">Apply one preset first so the interface changes instantly without too many controls.</p>
              </div>
              <button type="button" id="effectsResetBtn" class="secondary-btn effects-reset-btn">Reset defaults</button>
            </div>
            <div id="effectsPresetStrip" class="effects-preset-strip"></div>
            <div class="effects-lab-grid effects-lab-grid-main">
              <label class="effects-field">
                <span id="fxGlassLabel">Glass style</span>
                <select id="fxGlassSelect" class="modern-input"></select>
              </label>
              <label class="effects-field">
                <span id="fxAccentLabel">Accent</span>
                <select id="fxAccentSelect" class="modern-input"></select>
              </label>
              <label class="effects-field">
                <span id="fxDensityLabel">UI density</span>
                <select id="fxDensitySelect" class="modern-input"></select>
              </label>
            </div>
            <div id="fxSceneGrid" class="fx-scene-grid fx-scene-grid-compact"></div>
            <details class="effects-advanced" id="effectsAdvancedPanel">
              <summary id="effectsAdvancedSummary">More controls</summary>
              <div class="effects-lab-grid effects-lab-grid-advanced">
                <label class="effects-field">
                  <span>Atmosphere effect</span>
                  <select id="effectsLabSelect" class="modern-input">
                    <option value="off">Tắt</option><option value="aurora">Aurora ribbon</option><option value="fireflies">Fireflies</option><option value="stardust">Stardust</option><option value="prism">Prism wave</option><option value="comets">Comet trails</option><option value="orbs">Glass orbs</option><option value="bubbles">Floating bubbles</option><option value="rain">Mưa mềm</option><option value="window-rain">Mưa kính</option><option value="snow">Tuyết</option><option value="dust">Bụi sáng</option><option value="mist">Sương mờ</option><option value="neon">Phản chiếu neon</option><option value="petals">Cánh hoa</option>
                  </select>
                </label>
                <label class="effects-field range-card">
                  <span>Mật độ hiệu ứng <strong id="effectsLabIntensityText">55%</strong></span>
                  <input id="effectsLabIntensityRange" type="range" min="20" max="100" step="5">
                </label>
                <label class="effects-field range-card">
                  <span>Tốc độ hiệu ứng <strong id="effectsLabSpeedText">100%</strong></span>
                  <input id="effectsLabSpeedRange" type="range" min="40" max="140" step="5">
                </label>
              </div>
            </details>
            <div id="effectsOptionGrid" class="effects-option-grid"></div>
            <div id="effectsLabPreviewNote" class="effects-lab-preview muted-text"></div>
          </div>
        </div>


        <div id="pomodoroModal" class="modal hidden">
          <div class="modal-content tutorial-modal-content wide-modal pomodoro-modal-content">
            <button class="close-modal" data-close-modal="pomodoroModal" aria-label="Đóng">×</button>
            <h2>🍅 Pomodoro tập trung</h2>
            <p class="muted-text">Giữ nhịp học theo chặng ngắn, nhận thêm xu giao diện khi hoàn thành mà không làm rối luồng học chính.</p>
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
                <div class="pomodoro-audio-grid">
                  <label class="toggle-card inline-toggle"><span>Bật âm thanh Pomodoro</span><input id="pomodoroAudioToggle" type="checkbox"></label>
                  <label class="toggle-card select-card"><span>Gói âm thanh</span><select id="pomodoroAudioPackSelect" class="modern-input"><option value="soft-bell">Soft Bell</option><option value="glass-chime">Glass Chime</option><option value="cafe-timer">Cafe Timer</option><option value="night-tone">Night Tone</option></select></label>
                  <label class="toggle-card select-card"><span>Kiểu cue</span><select id="pomodoroAudioCueModeSelect" class="modern-input"><option value="end-only">Chỉ báo khi hết giờ</option><option value="full">Bắt đầu + cảnh báo + hết giờ</option></select></label>
                  <label class="toggle-card range-card"><span>Âm lượng cue <strong id="pomodoroAudioVolumeText">65%</strong></span><input id="pomodoroAudioVolumeRange" type="range" min="0" max="100" step="5"></label>
                </div>
                <div class="pomodoro-audio-grid pomodoro-playlist-grid">
                  <label class="toggle-card inline-toggle"><span>Playlist khi hết Pomodoro</span><input id="pomodoroPlaylistToggle" type="checkbox"></label>
                  <label class="toggle-card range-card"><span>Âm lượng playlist <strong id="pomodoroPlaylistVolumeText">70%</strong></span><input id="pomodoroPlaylistVolumeRange" type="range" min="0" max="100" step="5"></label>
                </div>
                <div class="pomodoro-custom-audio-row pomodoro-playlist-row">
                  <input id="pomodoroPlaylistFolderInput" type="file" accept=".webm,audio/webm,video/webm" webkitdirectory multiple class="hidden">
                  <div class="pomodoro-custom-audio-meta">
                    <strong id="pomodoroPlaylistFolderName">Chưa có folder playlist</strong>
                    <span id="pomodoroPlaylistFolderMeta">Chọn một folder chứa nhiều file .webm. Khi một file kết thúc, extension sẽ tự chuyển file tiếp theo không ngắt quãng.</span>
                  </div>
                  <button id="pomodoroPlaylistFolderPickBtn" class="secondary-btn" type="button">📁 Chọn folder .webm</button>
                  <button id="pomodoroPlaylistFolderClearBtn" class="secondary-btn" type="button">🗑 Xóa folder</button>
                </div>
                <div class="pomodoro-audio-actions">
                  <button id="pomodoroAudioUnlockBtn" class="secondary-btn" type="button">🔓 Kích hoạt âm thanh</button>
                  <button id="pomodoroAudioTestBtn" class="secondary-btn" type="button">🔔 Nghe thử cue</button>
                  <button id="pomodoroPlaylistTestBtn" class="secondary-btn" type="button">▶ Nghe thử playlist</button>
                  <button id="pomodoroPlaylistStopBtn" class="secondary-btn" type="button">⏹ Dừng playlist</button>
                </div>
                <div id="pomodoroAudioStatus" class="pomodoro-audio-status">Cue Pomodoro đang tắt.</div>
                <div id="pomodoroPlaylistStatus" class="pomodoro-audio-status">Playlist sau khi hết Pomodoro đang tắt.</div>
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

        <div id="dailySayingModal" class="modal hidden">
          <div class="modal-content tutorial-modal-content wide-modal daily-saying-modal-content">
            <button class="close-modal" data-close-modal="dailySayingModal" aria-label="Đóng">×</button>
            <div class="daily-saying-modal-head">
              <div>
                <h2>💬 Câu nói mỗi ngày</h2>
                <p class="muted-text">Mỗi ngày hệ thống tự xoay sang một câu mới trong bộ quote lớn để hạn chế lặp lại. Từ câu này bạn có thể lưu quote, lưu mẫu câu và kéo từ nổi bật sang ôn tập.</p>
              </div>
              <div class="daily-saying-head-actions">
                <button id="dailyQuotePrevBtn" class="secondary-btn" type="button">← Trước</button>
                <button id="dailyQuoteNextBtn" class="secondary-btn" type="button">Sau →</button>
              </div>
            </div>
            <div id="dailySayingCard" class="daily-saying-card">
              <div class="daily-saying-hero">
                <div class="daily-saying-badge" id="dailyQuoteBadge">Câu nói mỗi ngày</div>
                <button id="saveDailyQuoteBtn" class="daily-save-btn" type="button">♡ Lưu</button>
              </div>
              <div class="daily-saying-body">
                <div class="daily-saying-image">
                  <div class="daily-saying-image-chip" id="dailyQuoteMood">gentle</div>
                  <div class="daily-saying-image-copy">
                    <strong id="dailyQuoteHeroTitle">A small sentence can feel like being saved.</strong>
                    <span id="dailyQuoteHeroNote">Nhẹ, dễ lưu, dễ nhớ.</span>
                  </div>
                </div>
                <div class="daily-saying-text-panel">
                  <div class="daily-saying-title" id="dailyQuoteTitle">You do not have to carry everything alone.</div>
                  <div class="daily-saying-translation" id="dailyQuoteTranslation">Bạn không cần phải gánh mọi thứ một mình.</div>
                  <div class="daily-saying-note" id="dailyQuoteNote">Một câu ngắn để nhắc người học rằng chậm lại cũng không sao.</div>
                </div>
              </div>
            </div>
            <div class="daily-saying-footer">
              <div class="wallet-stat"><span>Đã lưu</span><strong id="savedQuotesCount">0</strong></div>
              <div class="wallet-stat"><span>Style quote</span><strong id="currentQuoteStyleName">Soft Rescue</strong></div>
            </div>
            <div class="daily-quote-tools">
              <label class="toggle-card select-card"><span>Lưu quote vào</span><select id="dailyQuoteFolderSelect" class="modern-input"></select></label>
              <label class="toggle-card select-card"><span>Lưu từ vào</span><select id="dailyWordFolderSelect" class="modern-input"></select></label>
              <label class="toggle-card select-card"><span>Lưu pattern vào</span><select id="dailyPatternFolderSelect" class="modern-input"></select></label>
              <button id="openCollectionsFromQuoteBtn" class="secondary-btn">📚 Mở bộ sưu tập</button>
            </div>
            <div class="daily-quote-vocab-box panel-card compact-panel">
              <div class="section-title-row">
                <h3>Quote → Vocabulary mode</h3>
                <span class="muted-text">Nhấn vào từ nổi bật để xem nghĩa nhanh, phát âm và lưu vào ôn tập.</span>
              </div>
              <div id="dailyQuoteWordChips" class="daily-quote-chip-row"></div>
              <div id="dailyQuoteWordPanel" class="daily-quote-word-panel">
                <strong id="dailyWordSelected">Chọn một từ để xem nhanh</strong>
                <div id="dailyWordMeaning" class="daily-word-meaning">Hệ thống sẽ lấy các từ trọng tâm từ câu quote này.</div>
                <div id="dailyWordNote" class="daily-word-note">Bạn có thể lưu từ vào bộ “Quote Vocabulary” để ôn sau.</div>
                <div class="footer-actions">
                  <button id="dailyWordSpeakBtn" class="secondary-btn" type="button">🔊 Phát âm</button>
                  <button id="dailyWordSaveBtn" class="primary-btn" type="button">➕ Lưu vào bộ từ</button>
                  <button id="dailyPatternSaveBtn" class="secondary-btn" type="button">🧩 Lưu mẫu câu</button>
                  <button id="dailyOpenMemoryPathBtn" class="secondary-btn" type="button">🪜 Memory Path</button>
                </div>
              </div>
            </div>
            <div class="daily-lesson-box panel-card compact-panel">
              <div class="section-title-row">
                <h3>Quote-to-Lesson Card 2.0</h3>
                <span class="muted-text">Biến câu đẹp thành 1 vi bài học: collocation, pattern, grammar, speaking, recall.</span>
              </div>
              <div class="daily-lesson-grid">
                <div class="daily-lesson-card"><span>Collocation</span><strong id="lessonCollocation">quiet room</strong><small id="lessonCollocationMeaning">căn phòng yên tĩnh</small></div>
                <div class="daily-lesson-card"><span>Sentence pattern</span><strong id="lessonPattern">You do not have to + verb phrase</strong><small id="lessonPatternGrammar">have to + động từ nguyên mẫu</small></div>
                <div class="daily-lesson-card"><span>Speaking prompt</span><strong id="lessonSpeaking">What helps your mind stay calm while studying?</strong><small id="lessonRecall">Recall tomorrow: Fill the blank...</small></div>
              </div>
              <div class="daily-lesson-example" id="lessonSentence">The quiet room helped me focus for twenty minutes.</div>
            </div>
          </div>
        </div>

        <div id="memoryPathModal" class="modal hidden">
          <div class="modal-content tutorial-modal-content wide-modal memory-path-modal-content">
            <button class="close-modal" data-close-modal="memoryPathModal" aria-label="Đóng">×</button>
            <div class="section-title-row">
              <div>
                <h2>🪜 Memory Path Mode</h2>
                <p class="muted-text">Từ → collocation → câu ngắn → delayed recall. Mục tiêu là nhớ sâu hơn mà vẫn rất gọn.</p>
              </div>
              <button id="memoryPathRefreshBtn" class="secondary-btn" type="button">Đổi path</button>
            </div>
            <div class="memory-path-shell">
              <div class="memory-path-step"><span>B1 · Word</span><strong id="memoryPathWord">quiet</strong><small id="memoryPathMeaning">yên tĩnh</small></div>
              <div class="memory-path-step"><span>B2 · Collocation</span><strong id="memoryPathCollocation">quiet room</strong><small id="memoryPathCollocationMeaning">căn phòng yên tĩnh</small></div>
              <div class="memory-path-step"><span>B3 · Sentence</span><strong id="memoryPathSentence">The quiet room helped me focus for twenty minutes.</strong><small id="memoryPathGrammar">quiet đứng trước room.</small></div>
              <div class="memory-path-step memory-path-recall"><span>B4 · Delayed recall</span><strong id="memoryPathRecall">Fill the blank later: The ___ room helped me focus.</strong><small id="memoryPathSpeaking">Speaking: Describe a quiet place where you study best.</small></div>
            </div>
            <div class="footer-actions">
              <button id="memoryPathSpeakBtn" class="secondary-btn" type="button">🔊 Đọc từ</button>
              <button id="memoryPathSaveWordBtn" class="primary-btn" type="button">➕ Lưu từ path</button>
              <button id="memoryPathSavePatternBtn" class="secondary-btn" type="button">🧩 Lưu pattern path</button>
              <button id="memoryPathStudyBtn" class="secondary-btn" type="button">▶ Ôn nhóm liên quan</button>
            </div>
          </div>
        </div>

        <div id="weakRescueModal" class="modal hidden">
          <div class="modal-content tutorial-modal-content wide-modal weak-rescue-modal-content">
            <button class="close-modal" data-close-modal="weakRescueModal" aria-label="Đóng">×</button>
            <div class="section-title-row">
              <div>
                <h2>🛟 Weak-Word Rescue Engine</h2>
                <p class="muted-text">Khi từ yếu lặp lại nhiều lần, app sẽ giải thích lại theo kiểu dễ nhớ hơn thay vì chỉ bắt làm lại như cũ.</p>
              </div>
              <button id="weakRescueRefreshBtn" class="secondary-btn" type="button">Đổi từ khác</button>
            </div>
            <div id="weakRescueChips" class="daily-quote-chip-row"></div>
            <div class="weak-rescue-grid">
              <div class="panel-card compact-panel">
                <div class="weak-rescue-label">Từ đang cứu</div>
                <div id="weakRescueWord" class="weak-rescue-word">review</div>
                <div id="weakRescueMeaning" class="weak-rescue-meaning">ôn lại</div>
                <div id="weakRescueReason" class="weak-rescue-note">Lý do đang yếu sẽ hiện ở đây.</div>
              </div>
              <div class="panel-card compact-panel">
                <div class="weak-rescue-label">Giải thích dễ nhớ hơn</div>
                <div id="weakRescueSimple" class="weak-rescue-note">Giải thích rút gọn để giảm áp lực khi nhớ lại.</div>
                <div id="weakRescueCompare" class="weak-rescue-note">Compare pair</div>
                <div id="weakRescuePhrase" class="weak-rescue-example">Rescue phrase</div>
              </div>
            </div>
            <div class="footer-actions">
              <button id="weakRescueSpeakBtn" class="secondary-btn" type="button">🔊 Phát âm</button>
              <button id="weakRescueSaveBtn" class="primary-btn" type="button">⭐ Lưu vào Từ khó</button>
              <button id="weakRescueStudyBtn" class="secondary-btn" type="button">▶ Ôn từ yếu</button>
            </div>
          </div>
        </div>

        <div id="patternVaultModal" class="modal hidden">
          <div class="modal-content tutorial-modal-content wide-modal pattern-vault-modal-content">
            <button class="close-modal" data-close-modal="patternVaultModal" aria-label="Đóng">×</button>
            <div class="section-title-row">
              <div>
                <h2>🧩 Sentence Pattern Vault</h2>
                <p class="muted-text">Lưu cấu trúc tiếng Anh để nhớ cách nói, không chỉ nhớ từng từ riêng lẻ.</p>
              </div>
              <button id="patternVaultSaveCurrentBtn" class="secondary-btn" type="button">Lưu pattern hiện tại</button>
            </div>
            <div id="patternVaultGrid" class="pattern-vault-grid"></div>
          </div>
        </div>

        <div id="focusRoomModal" class="modal hidden">
          <div class="modal-content tutorial-modal-content wide-modal focus-room-modal-content">
            <button class="close-modal" data-close-modal="focusRoomModal" aria-label="Đóng">×</button>
            <div class="section-title-row">
              <div>
                <h2>🫧 Focus Room</h2>
                <p class="muted-text">Một góc học tĩnh hơn: 1 từ ưu tiên, 1 quote, 1 mini Pomodoro. Không thay logic học cũ, chỉ giúp tập trung hơn.</p>
              </div>
              <button id="focusRoomNextBtn" class="secondary-btn" type="button">Đổi từ khác</button>
            </div>
            <div class="focus-room-shell">
              <div class="focus-room-card panel-card">
                <div class="focus-room-top-row">
                  <span id="focusRoomWordStatus" class="daily-launcher-chip">Ưu tiên hôm nay</span>
                  <span id="focusRoomWordSet" class="shop-tag">Quote Vocabulary</span>
                </div>
                <div id="focusRoomWord" class="focus-room-word">word</div>
                <div id="focusRoomPhonetic" class="focus-room-phonetic">/fəˈnɛtɪk/</div>
                <div id="focusRoomMeaning" class="focus-room-meaning">nghĩa tiếng Việt</div>
                <div id="focusRoomNote" class="focus-room-note">Mở một không gian nhẹ hơn cho việc học mà vẫn bám vào các từ cần ưu tiên.</div>
                <div class="footer-actions">
                  <button id="focusRoomRevealBtn" class="secondary-btn" type="button">👁 Hiện / ẩn nghĩa</button>
                  <button id="focusRoomSpeakBtn" class="secondary-btn" type="button">🔊 Phát âm</button>
                  <button id="focusRoomSaveBtn" class="secondary-btn" type="button">⭐ Lưu vào bộ sưu tập</button>
                  <button id="focusRoomStudyBtn" class="primary-btn" type="button">▶ Học từ này</button>
                </div>
              </div>
              <div class="focus-room-side">
                <div class="panel-card focus-room-quote-card">
                  <div class="focus-room-mini-label">Daily saying hiện tại</div>
                  <strong id="focusRoomQuoteTitle">You do not have to carry everything alone.</strong>
                  <span id="focusRoomQuoteTranslation">Bạn không cần phải gánh mọi thứ một mình.</span>
                </div>
                <div class="panel-card focus-room-pomodoro-card">
                  <div class="focus-room-mini-label">Mini Pomodoro</div>
                  <strong id="focusRoomPomodoro">25:00</strong>
                  <span id="focusRoomPomodoroNote">Mở Pomodoro để giữ nhịp tập trung.</span>
                  <div class="footer-actions"><button id="focusRoomPomodoroBtn" class="secondary-btn" type="button">🍅 Mở Pomodoro</button></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="collectionsModal" class="modal hidden">
          <div class="modal-content tutorial-modal-content wide-modal collections-modal-content">
            <button class="close-modal" data-close-modal="collectionsModal" aria-label="Đóng">×</button>
            <h2>📚 Bộ sưu tập đã lưu</h2>
            <p class="muted-text">Tập hợp quote, từ và sentence patterns để phần đẹp của app cũng quay lại phục vụ việc học.</p>
            <div class="collections-toolbar">
              <label class="toggle-card select-card"><span>Folder quote</span><select id="collectionQuoteFolderSelect" class="modern-input"></select></label>
              <label class="toggle-card select-card"><span>Folder từ</span><select id="collectionWordFolderSelect" class="modern-input"></select></label>
              <label class="toggle-card select-card"><span>Folder pattern</span><select id="collectionPatternFolderSelect" class="modern-input"></select></label>
            </div>
            <div class="footer-actions collections-folder-actions">
              <button id="addQuoteFolderBtn" class="secondary-btn" type="button">＋ Folder quote</button>
              <button id="addWordFolderBtn" class="secondary-btn" type="button">＋ Folder từ</button>
              <button id="addPatternFolderBtn" class="secondary-btn" type="button">＋ Folder pattern</button>
            </div>
            <div class="collections-grid">
              <section class="collection-section panel-card compact-panel">
                <div class="section-title-row"><h3>Quotes đã lưu</h3><span id="collectionQuoteCount" class="muted-text">0 mục</span></div>
                <div id="collectionQuoteGrid" class="saved-item-grid"></div>
              </section>
              <section class="collection-section panel-card compact-panel">
                <div class="section-title-row"><h3>Từ đã lưu</h3><span id="collectionWordCount" class="muted-text">0 mục</span></div>
                <div id="collectionWordGrid" class="saved-item-grid"></div>
              </section>
              <section class="collection-section panel-card compact-panel">
                <div class="section-title-row"><h3>Sentence patterns</h3><span id="collectionPatternCount" class="muted-text">0 mục</span></div>
                <div id="collectionPatternGrid" class="saved-item-grid"></div>
              </section>
            </div>
          </div>
        </div>

        <div id="weeklyRecapModal" class="modal hidden">
          <div class="modal-content tutorial-modal-content wide-modal weekly-recap-modal-content">
            <button class="close-modal" data-close-modal="weeklyRecapModal" aria-label="Đóng">×</button>
            <h2>🗓 Tóm tắt 7 ngày gần đây</h2>
            <p class="muted-text">Một recap nhẹ để thấy app vẫn phục vụ việc học thật, không chỉ đẹp hơn.</p>
            <div id="weeklyRecapGrid" class="summary-strip"></div>
            <div id="weeklyRecapNarrative" class="classic-safe-note"></div>
          </div>
        </div>

        <div id="adminModal" class="modal hidden">
          <div class="modal-content tutorial-modal-content wide-modal admin-modal-content">
            <button class="close-modal" data-close-modal="adminModal" aria-label="Đóng">×</button>
            <div class="section-title-row">
              <div>
                <h2>🛠 Admin wallet tools</h2>
                <p class="muted-text">Công cụ này chỉ để bạn tự điều chỉnh coin và test giao diện. Khi tắt admin mode, app quay về trải nghiệm bình thường.</p>
              </div>
              <span id="adminModeBadge" class="admin-badge">Admin OFF</span>
            </div>
            <div class="admin-toggle-row">
              <div class="classic-safe-note">
                <strong>Chế độ quản trị là lớp tùy chọn.</strong>
                <span>Không thay đổi logic học cũ. Chỉ mở quyền chỉnh coin để test hoặc tự cấp lại xu khi bạn đã tiêu hết.</span>
              </div>
              <button id="adminModeToggleBtn" class="primary-btn" type="button">Bật admin mode</button>
            </div>
            <div class="admin-grid">
              <section class="panel-card compact-panel">
                <div class="section-title-row"><h3>Snapshot hiện tại</h3><span class="muted-text">Tự đồng bộ theo ví UI</span></div>
                <div class="wallet-board">
                  <div class="wallet-stat"><span>Coin học</span><strong id="adminStudyCoinsValue">0</strong></div>
                  <div class="wallet-stat"><span>Thưởng focus</span><strong id="adminBonusCoinsValue">0</strong></div>
                  <div class="wallet-stat"><span>Đã tiêu UI</span><strong id="adminSpentCoinsValue">0</strong></div>
                  <div class="wallet-stat"><span>Số dư khả dụng</span><strong id="adminAvailableCoinsValue">0</strong></div>
                </div>
              </section>
              <section class="panel-card compact-panel">
                <div class="section-title-row"><h3>Chỉnh trực tiếp</h3><span class="muted-text">Bị khóa khi admin tắt</span></div>
                <div class="admin-control-grid">
                  <label>Coin học
                    <input id="adminStudyCoinsInput" class="modern-input" type="number" min="0" step="1">
                  </label>
                  <label>Thưởng focus
                    <input id="adminBonusCoinsInput" class="modern-input" type="number" min="0" step="1">
                  </label>
                  <label>Đã tiêu UI
                    <input id="adminSpentCoinsInput" class="modern-input" type="number" min="0" step="1">
                  </label>
                  <label>Số dư mong muốn
                    <input id="adminTargetAvailableInput" class="modern-input" type="number" min="0" step="1">
                  </label>
                </div>
                <div class="admin-button-grid">
                  <button id="adminApplyDirectBtn" class="primary-btn" type="button">Lưu số đã nhập</button>
                  <button id="adminApplyTargetBtn" class="secondary-btn" type="button">Đặt theo số dư mong muốn</button>
                  <button id="adminResetSpentBtn" class="secondary-btn" type="button">Reset đã tiêu UI</button>
                  <button id="adminRepairWalletBtn" class="secondary-btn" type="button">Sửa đồng bộ ví</button>
                </div>
              </section>
            </div>
            <section class="panel-card compact-panel">
              <div class="section-title-row"><h3>Tác vụ nhanh</h3><span class="muted-text">Dùng để nạp/xả nhanh khi test theme</span></div>
              <div class="admin-button-grid admin-button-grid-quick">
                <button class="secondary-btn" data-admin-add="100" type="button">+100</button>
                <button class="secondary-btn" data-admin-add="500" type="button">+500</button>
                <button class="secondary-btn" data-admin-add="1000" type="button">+1000</button>
                <button class="secondary-btn" data-admin-add="5000" type="button">+5000</button>
                <button class="secondary-btn" data-admin-add="-100" type="button">-100</button>
                <button class="secondary-btn" data-admin-add="-500" type="button">-500</button>
              </div>
              <div id="adminHelperNote" class="reward-mini-note">Khi bật admin mode, bạn có thể chuyển qua lại giữa chế độ bình thường và chế độ chỉnh coin mà không mất các tính năng học hiện có.</div>
            </section>
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
    const openAdminSafely = () => { void syncWalletStateFromStorage().then(() => { renderAdminModal(); renderUpgradeLayer(); openModal('adminModal'); }); };
    const openEffectsLabSafely = () => { renderEffectsLabModal(); openModal('effectsLabModal'); };
    byId('openCustomizationBtn')?.addEventListener('click', () => openModal('customizationModal'));
    byId('openEffectsLabBtn')?.addEventListener('click', openEffectsLabSafely);
    byId('openStudioFromEffectsBtn')?.addEventListener('click', () => { closeModal('effectsLabModal'); openModal('customizationModal'); });
    byId('openAdminPanelBtn')?.addEventListener('click', openAdminSafely);
    byId('openAdminFromCustomizationBtn')?.addEventListener('click', openAdminSafely);
    byId('openAdminDeckBtn')?.addEventListener('click', openAdminSafely);
    byId('toggleAdminDeckBtn')?.addEventListener('click', toggleAdminMode);
    byId('repairAdminDeckBtn')?.addEventListener('click', repairAdminWallet);
    byId('openPomodoroBtn')?.addEventListener('click', () => openModal('pomodoroModal'));
    byId('openFocusDeckBtn')?.addEventListener('click', () => openModal('pomodoroModal'));
    byId('openFocusRoomDeckBtn')?.addEventListener('click', () => { renderFocusRoomModal(); openModal('focusRoomModal'); });
    byId('openDailyDeckBtn')?.addEventListener('click', openDailySayingModal);
    byId('openCollectionsDeckBtn')?.addEventListener('click', () => { renderCollectionsModal(); openModal('collectionsModal'); });
    byId('openProgressBoosterBtn')?.addEventListener('click', () => openModal('pomodoroModal'));
    byId('openDailySayingBtn')?.addEventListener('click', openDailySayingModal);
    byId('dailySayingLauncher')?.addEventListener('click', openDailySayingModal);
    byId('openFocusRoomBtn')?.addEventListener('click', () => {
      renderFocusRoomModal();
      openModal('focusRoomModal');
    });
    byId('openCollectionsBtn')?.addEventListener('click', () => {
      renderCollectionsModal();
      openModal('collectionsModal');
    });
    byId('openMemoryPathBtn')?.addEventListener('click', () => {
      renderMemoryPathModal();
      openModal('memoryPathModal');
    });
    byId('openWeakRescueBtn')?.addEventListener('click', () => {
      renderWeakRescueModal();
      openModal('weakRescueModal');
    });
    byId('openPatternVaultBtn')?.addEventListener('click', () => {
      renderPatternVaultModal();
      openModal('patternVaultModal');
    });
    byId('openWeeklyRecapBtn')?.addEventListener('click', () => {
      renderWeeklyRecapModal();
      openModal('weeklyRecapModal');
    });
    byId('toggleUpgradeHubBtn')?.addEventListener('click', async () => {
      state.ui.upgradeHubCollapsed = !state.ui.upgradeHubCollapsed;
      renderUpgradeHubState();
      await saveUiState();
    });
    byId('dailyQuotePrevBtn')?.addEventListener('click', () => shiftQuote(-1));
    byId('dailyQuoteNextBtn')?.addEventListener('click', () => shiftQuote(1));
    byId('saveDailyQuoteBtn')?.addEventListener('click', toggleCurrentQuoteSaved);
    byId('openCollectionsFromQuoteBtn')?.addEventListener('click', () => {
      renderCollectionsModal();
      openModal('collectionsModal');
    });
    byId('dailyWordSpeakBtn')?.addEventListener('click', speakSelectedQuoteWord);
    byId('dailyWordSaveBtn')?.addEventListener('click', saveSelectedQuoteWordToVocabulary);
    byId('dailyPatternSaveBtn')?.addEventListener('click', saveCurrentQuotePattern);
    byId('dailyOpenMemoryPathBtn')?.addEventListener('click', () => {
      renderMemoryPathModal();
      openModal('memoryPathModal');
    });
    byId('memoryPathRefreshBtn')?.addEventListener('click', nextMemoryPathSource);
    byId('memoryPathSpeakBtn')?.addEventListener('click', speakMemoryPathWord);
    byId('memoryPathSaveWordBtn')?.addEventListener('click', saveMemoryPathWord);
    byId('memoryPathSavePatternBtn')?.addEventListener('click', saveMemoryPathPattern);
    byId('memoryPathStudyBtn')?.addEventListener('click', startMemoryPathStudy);
    byId('weakRescueRefreshBtn')?.addEventListener('click', nextWeakRescueWord);
    byId('weakRescueChips')?.addEventListener('click', handleWeakRescueChipClick);
    byId('weakRescueSpeakBtn')?.addEventListener('click', speakWeakRescueWord);
    byId('weakRescueSaveBtn')?.addEventListener('click', saveWeakRescueWord);
    byId('weakRescueStudyBtn')?.addEventListener('click', startWeakRescueStudy);
    byId('patternVaultGrid')?.addEventListener('click', handlePatternVaultClick);
    byId('patternVaultSaveCurrentBtn')?.addEventListener('click', saveCurrentQuotePattern);
    byId('focusRoomNextBtn')?.addEventListener('click', nextFocusRoomWord);
    byId('focusRoomRevealBtn')?.addEventListener('click', toggleFocusRoomMeaning);
    byId('focusRoomSpeakBtn')?.addEventListener('click', speakCurrentFocusWord);
    byId('focusRoomSaveBtn')?.addEventListener('click', saveCurrentFocusWordToCollection);
    byId('focusRoomStudyBtn')?.addEventListener('click', startFocusRoomStudy);
    byId('focusRoomPomodoroBtn')?.addEventListener('click', () => openModal('pomodoroModal'));

    byId('adminModeToggleBtn')?.addEventListener('click', toggleAdminMode);
    byId('adminApplyDirectBtn')?.addEventListener('click', applyAdminDirectValues);
    byId('adminApplyTargetBtn')?.addEventListener('click', applyAdminTargetAvailable);
    byId('adminResetSpentBtn')?.addEventListener('click', resetAdminSpentCoins);
    byId('adminRepairWalletBtn')?.addEventListener('click', repairAdminWallet);
    byId('adminModal')?.addEventListener('click', async (event) => {
      const addButton = event.target.closest('[data-admin-add]');
      if (addButton) {
        await adjustAdminAvailableBy(Number(addButton.dataset.adminAdd) || 0);
      }
    });

    byId('dailyQuoteWordChips')?.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-word-key]');
      if (!button) return;
      state.runtime.selectedQuoteWordKey = button.dataset.wordKey || '';
      renderQuoteWordPanel();
    });

    document.querySelectorAll('[data-close-modal]').forEach((btn) => {
      btn.addEventListener('click', () => closeModal(btn.getAttribute('data-close-modal')));
    });

    ['customizationModal', 'effectsLabModal', 'pomodoroModal', 'dailySayingModal', 'memoryPathModal', 'weakRescueModal', 'patternVaultModal', 'focusRoomModal', 'collectionsModal', 'weeklyRecapModal', 'adminModal'].forEach((modalId) => {
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
    byId('effectsResetBtn')?.addEventListener('click', resetEffectsLabDefaults);
    byId('effectsPresetStrip')?.addEventListener('click', handleEffectsLabPresetClick);
    byId('fxSceneGrid')?.addEventListener('click', handleEffectsLabSceneClick);
    byId('effectsOptionGrid')?.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-effect-card]');
      if (!button) return;
      state.ui.weatherEffect = getSupportedWeatherEffect(button.dataset.effectCard || 'off');
      applyUiPreferences();
      renderEffectsLabModal();
      await saveUiState();
    });
    byId('fxGlassSelect')?.addEventListener('change', async (event) => {
      state.ui.cardStyle = event.target.value;
      await saveUiState();
    });
    byId('fxAccentSelect')?.addEventListener('change', async (event) => {
      state.ui.theme = event.target.value;
      await saveUiState();
    });
    byId('fxDensitySelect')?.addEventListener('change', async (event) => {
      state.ui.density = event.target.value;
      await saveUiState();
    });

    const handleEffectChange = async (rawValue) => {
      state.ui.weatherEffect = getSupportedWeatherEffect(rawValue);
      applyUiPreferences();
      renderEffectsLabModal();
      await saveUiState();
    };
    const handleEffectIntensity = async (rawValue) => {
      state.ui.weatherIntensity = clampRange(rawValue, 20, 100, 55);
      applyUiPreferences();
      renderEffectsLabModal();
      await saveUiState();
    };
    const handleEffectSpeed = async (rawValue) => {
      state.ui.weatherSpeed = clampRange(rawValue, 40, 140, 100);
      applyUiPreferences();
      renderEffectsLabModal();
      await saveUiState();
    };
    byId('weatherEffectSelect')?.addEventListener('change', async (event) => {
      await handleEffectChange(event.target.value);
    });
    byId('effectsLabSelect')?.addEventListener('change', async (event) => {
      await handleEffectChange(event.target.value);
    });
    byId('weatherIntensityRange')?.addEventListener('input', async (event) => {
      await handleEffectIntensity(event.target.value);
    });
    byId('effectsLabIntensityRange')?.addEventListener('input', async (event) => {
      await handleEffectIntensity(event.target.value);
    });
    byId('weatherSpeedRange')?.addEventListener('input', async (event) => {
      await handleEffectSpeed(event.target.value);
    });
    byId('effectsLabSpeedRange')?.addEventListener('input', async (event) => {
      await handleEffectSpeed(event.target.value);
    });
    byId('pomodoroAudioToggle')?.addEventListener('change', async (event) => {
      state.ui.pomodoroAudioEnabled = event.target.checked;
      await saveUiState();
    });
    byId('pomodoroAudioPackSelect')?.addEventListener('change', async (event) => {
      state.ui.pomodoroAudioPack = event.target.value || 'soft-bell';
      await saveUiState();
    });
    byId('pomodoroAudioCueModeSelect')?.addEventListener('change', async (event) => {
      state.ui.pomodoroAudioCueMode = ['end-only', 'full'].includes(event.target.value) ? event.target.value : 'end-only';
      await saveUiState();
    });
    byId('pomodoroAudioVolumeRange')?.addEventListener('input', async (event) => {
      state.ui.pomodoroAudioVolume = clampRange(event.target.value, 0, 100, 65);
      await saveUiState();
    });
    byId('pomodoroPlaylistToggle')?.addEventListener('change', async (event) => {
      state.ui.pomodoroCompletionPlaylistEnabled = event.target.checked;
      if (!state.ui.pomodoroCompletionPlaylistEnabled) window.VMUpgradeAudio?.stopCompletionPlaylist?.(true);
      await saveUiState();
    });
    byId('pomodoroPlaylistVolumeRange')?.addEventListener('input', async (event) => {
      state.ui.pomodoroCompletionPlaylistVolume = clampRange(event.target.value, 0, 100, 70);
      await saveUiState();
    });
    byId('pomodoroPlaylistFolderPickBtn')?.addEventListener('click', () => byId('pomodoroPlaylistFolderInput')?.click());
    byId('pomodoroPlaylistFolderInput')?.addEventListener('change', handlePomodoroPlaylistFolderPick);
    byId('pomodoroPlaylistFolderClearBtn')?.addEventListener('click', clearPomodoroCompletionPlaylist);
    byId('pomodoroAudioUnlockBtn')?.addEventListener('click', unlockPomodoroAudio);
    byId('pomodoroAudioTestBtn')?.addEventListener('click', testPomodoroAudio);
    byId('pomodoroPlaylistTestBtn')?.addEventListener('click', previewPomodoroCompletionPlaylist);
    byId('pomodoroPlaylistStopBtn')?.addEventListener('click', stopPomodoroCompletionPlaylistPreview);

    ['dailyQuoteFolderSelect', 'collectionQuoteFolderSelect'].forEach((id) => {
      byId(id)?.addEventListener('change', async (event) => {
        state.collections.activeQuoteFolder = event.target.value;
        await saveCollectionsState();
      });
    });
    ['dailyWordFolderSelect', 'collectionWordFolderSelect'].forEach((id) => {
      byId(id)?.addEventListener('change', async (event) => {
        state.collections.activeWordFolder = event.target.value;
        await saveCollectionsState();
      });
    });
    ['dailyPatternFolderSelect', 'collectionPatternFolderSelect'].forEach((id) => {
      byId(id)?.addEventListener('change', async (event) => {
        state.collections.activePatternFolder = event.target.value;
        await saveCollectionsState();
      });
    });

    byId('addQuoteFolderBtn')?.addEventListener('click', () => createCollectionFolder('quote'));
    byId('addWordFolderBtn')?.addEventListener('click', () => createCollectionFolder('word'));
    byId('addPatternFolderBtn')?.addEventListener('click', () => createCollectionFolder('pattern'));

    byId('collectionQuoteGrid')?.addEventListener('click', handleCollectionGridClick);
    byId('collectionWordGrid')?.addEventListener('click', handleCollectionGridClick);
    byId('collectionPatternGrid')?.addEventListener('click', handleCollectionGridClick);

    byId('themeShopGrid')?.addEventListener('click', handleCustomizerClick);
    byId('cardStyleGrid')?.addEventListener('click', handleCustomizerClick);
    byId('layoutPackGrid')?.addEventListener('click', handleCustomizerClick);
    byId('fontPackGrid')?.addEventListener('click', handleCustomizerClick);
    byId('quoteStyleGrid')?.addEventListener('click', handleCustomizerClick);
    byId('presetGrid')?.addEventListener('click', handlePresetClick);

    byId('pomodoroMinutesSelect')?.addEventListener('change', async (event) => {
      state.focus.preferredMinutes = Number(event.target.value) || 25;
      syncPomodoroRuntime(true);
      await saveFocusState();
      renderPomodoroWidgets();
      renderFocusRoomModal();
    });
    byId('pomodoroAutoLaunch')?.addEventListener('change', async (event) => {
      state.focus.autoLaunchRecommended = event.target.checked;
      await saveFocusState();
    });
    byId('pomodoroStartBtn')?.addEventListener('click', startPomodoro);
    byId('pomodoroPauseBtn')?.addEventListener('click', () => pausePomodoro());
    byId('pomodoroResetBtn')?.addEventListener('click', resetPomodoro);
    byId('pomodoroMiniOpenBtn')?.addEventListener('click', () => openModal('pomodoroModal'));
    byId('pomodoroMiniToggleBtn')?.addEventListener('click', () => {
      if (state.runtime.isRunning) pausePomodoro(false);
      else startPomodoro();
    });

    document.querySelectorAll('.nav-btn').forEach((btn) => btn.addEventListener('click', () => {
      scheduleUpgradeRender(80);
    }));
    byId('reviewSetDropdown')?.addEventListener('change', () => scheduleUpgradeRender(80));
    window.addEventListener('vm:viewchange', () => scheduleUpgradeRender(0));

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'local') return;
      let walletTouched = false;
      if (changes.stats) {
        state.stats = normalizeStats(changes.stats.newValue || {});
        walletTouched = true;
      }
      if (changes.vocab) state.vocab = Array.isArray(changes.vocab.newValue) ? changes.vocab.newValue : [];
      if (changes.vm_ui) state.ui = normalizeUiState(changes.vm_ui.newValue || {});
      if (changes.vm_quotes) state.quotes = normalizeQuotesState(changes.vm_quotes.newValue || {});
      if (changes.vm_focus) {
        state.focus = normalizeFocusState(changes.vm_focus.newValue || {});
        syncPomodoroRuntime();
      }
      if (changes.vm_collections) state.collections = normalizeCollectionsState(changes.vm_collections.newValue || {});
      if (changes.vm_admin) state.admin = normalizeAdminState(changes.vm_admin.newValue || {});
      if (changes.vm_spentCoins) {
        state.spentCoins = Math.max(0, Number(changes.vm_spentCoins.newValue) || 0);
        walletTouched = true;
      }
      if (changes.vm_bonusCoins) {
        state.bonusCoins = Math.max(0, Number(changes.vm_bonusCoins.newValue) || 0);
        walletTouched = true;
      }
      syncSavedQuoteIdsFromCollections();
      applyUiPreferences();
      scheduleUpgradeRender(walletTouched ? 0 : 60);
      if (walletTouched) void ensureWalletConsistency();
    });

    window.setInterval(() => {
      if (!state.runtime.isRunning) return;
      renderPomodoroWidgets();
      if (isModalOpen('focusRoomModal')) renderFocusRoomModal();
    }, 1000);
  }


  async function loadState() {
    const result = await storage.get({
      stats: { coins: 0 },
      vocab: [],
      vm_ui: {},
      vm_focus: {},
      vm_quotes: {},
      vm_collections: {},
      vm_admin: {},
      vm_spentCoins: 0,
      vm_bonusCoins: 0
    });

    state.stats = normalizeStats(result.stats || {});
    state.vocab = Array.isArray(result.vocab) ? result.vocab : [];
    state.ui = normalizeUiState(result.vm_ui || {});
    state.focus = normalizeFocusState(result.vm_focus || {});
    state.quotes = normalizeQuotesState(result.vm_quotes || {});
    state.collections = normalizeCollectionsState(result.vm_collections || {});
    state.admin = normalizeAdminState(result.vm_admin || {});
    state.spentCoins = Math.max(0, Number(result.vm_spentCoins) || 0);
    state.bonusCoins = Math.max(0, Number(result.vm_bonusCoins) || 0);
    syncSavedQuoteIdsFromCollections();
    await ensureDailyQuoteFreshness();
    await ensureWalletConsistency({ persist: true });
  }


  function normalizeStats(stats = {}) {
    const dailyProgress = stats.dailyProgress && typeof stats.dailyProgress === 'object' ? { ...stats.dailyProgress } : {};
    const studyLog = Array.isArray(stats.studyLog) ? stats.studyLog.slice(0, 40) : [];
    const sessionHistory = Array.isArray(stats.sessionHistory)
      ? stats.sessionHistory
          .filter((entry) => entry && (typeof entry.dateKey === 'string' || Number(entry.finishedAt) > 0))
          .map((entry) => ({
            dateKey: typeof entry.dateKey === 'string' && entry.dateKey ? entry.dateKey : toDateKey(entry.finishedAt || Date.now()),
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
      studyLog,
      sessionHistory,
      currentStreak: Math.max(0, Number(stats.currentStreak) || 0),
      bestStreak: Math.max(0, Number(stats.bestStreak) || 0),
      totalSessions: Math.max(0, Number(stats.totalSessions) || sessionHistory.length || 0)
    };
  }

  function toDateKey(value) {
    const date = new Date(Number(value) || Date.now());
    return date.toISOString().slice(0, 10);
  }

  function clampRange(value, min, max, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.max(min, Math.min(max, number));
  }

  function getSupportedWeatherEffect(value) {
    return ['off', 'aurora', 'fireflies', 'stardust', 'prism', 'comets', 'orbs', 'bubbles', 'rain', 'window-rain', 'snow', 'dust', 'mist', 'neon', 'petals'].includes(value) ? value : 'off';
  }

  function ensureUpgradeState() {
    if (!state.ui) state.ui = normalizeUiState({});
    if (!state.focus) state.focus = normalizeFocusState({});
    if (!state.quotes) state.quotes = normalizeQuotesState({});
    if (!state.collections) state.collections = normalizeCollectionsState({});
    if (!state.admin) state.admin = normalizeAdminState({});
  }

  function normalizeUiState(raw = {}) {
    const ui = {
      theme: THEMES.some((item) => item.id === raw.theme) ? raw.theme : 'midnight',
      unlockedThemes: filterUnlocked(raw.unlockedThemes, THEMES, ['midnight']),
      cardStyle: CARD_STYLES.some((item) => item.id === raw.cardStyle) ? raw.cardStyle : 'classic',
      unlockedCardStyles: filterUnlocked(raw.unlockedCardStyles, CARD_STYLES, ['classic']),
      layoutPack: LAYOUT_PACKS.some((item) => item.id === raw.layoutPack) ? raw.layoutPack : 'classic',
      unlockedLayoutPacks: filterUnlocked(raw.unlockedLayoutPacks, LAYOUT_PACKS, ['classic']),
      fontTone: FONT_TONES.some((item) => item.id === raw.fontTone) ? raw.fontTone : 'system',
      unlockedFontTones: filterUnlocked(raw.unlockedFontTones, FONT_TONES, ['system']),
      quoteStyle: QUOTE_STYLES.some((item) => item.id === raw.quoteStyle) ? raw.quoteStyle : 'soft',
      unlockedQuoteStyles: filterUnlocked(raw.unlockedQuoteStyles, QUOTE_STYLES, ['soft']),
      motionEnabled: raw.motionEnabled !== false,
      companionEnabled: raw.companionEnabled !== false,
      autoCelebrate: raw.autoCelebrate !== false,
      density: ['compact', 'balanced', 'comfortable'].includes(raw.density) ? raw.density : 'balanced',
      weatherEffect: getSupportedWeatherEffect(raw.weatherEffect),
      weatherIntensity: clampRange(raw.weatherIntensity, 20, 100, 55),
      weatherSpeed: clampRange(raw.weatherSpeed, 40, 140, 100),
      pomodoroAudioEnabled: raw.pomodoroAudioEnabled === true,
      pomodoroAudioPack: ['soft-bell', 'glass-chime', 'cafe-timer', 'night-tone'].includes(raw.pomodoroAudioPack) ? raw.pomodoroAudioPack : 'soft-bell',
      pomodoroAudioCueMode: ['end-only', 'full'].includes(raw.pomodoroAudioCueMode) ? raw.pomodoroAudioCueMode : 'end-only',
      pomodoroAudioVolume: clampRange(raw.pomodoroAudioVolume, 0, 100, 65),
      pomodoroCompletionPlaylistEnabled: raw.pomodoroCompletionPlaylistEnabled === true,
      pomodoroCompletionPlaylistVolume: clampRange(raw.pomodoroCompletionPlaylistVolume, 0, 100, 70),
      pomodoroCompletionPlaylistFolderName: typeof raw.pomodoroCompletionPlaylistFolderName === 'string' ? raw.pomodoroCompletionPlaylistFolderName : '',
      pomodoroCompletionPlaylistTrackCount: Math.max(0, Number(raw.pomodoroCompletionPlaylistTrackCount) || 0),
      upgradeHubCollapsed: raw.upgradeHubCollapsed !== false
    };

    ensureActiveUnlocked(ui, 'theme', 'unlockedThemes', 'midnight');
    ensureActiveUnlocked(ui, 'cardStyle', 'unlockedCardStyles', 'classic');
    ensureActiveUnlocked(ui, 'layoutPack', 'unlockedLayoutPacks', 'classic');
    ensureActiveUnlocked(ui, 'fontTone', 'unlockedFontTones', 'system');
    ensureActiveUnlocked(ui, 'quoteStyle', 'unlockedQuoteStyles', 'soft');
    return ui;
  }

  function filterUnlocked(rawIds, items, fallbackIds) {
    const validIds = Array.isArray(rawIds)
      ? rawIds.filter((id) => items.some((item) => item.id === id))
      : [];
    const merged = [...fallbackIds];
    validIds.forEach((id) => {
      if (!merged.includes(id)) merged.push(id);
    });
    return merged;
  }

  function ensureActiveUnlocked(ui, activeKey, unlockedKey, fallbackId) {
    if (!ui[unlockedKey].includes(fallbackId)) ui[unlockedKey].unshift(fallbackId);
    if (!ui[unlockedKey].includes(ui[activeKey])) ui[activeKey] = fallbackId;
  }

  function normalizeFocusState(raw = {}) {
    const todayKey = getTodayKey();
    const normalizedHistory = Array.isArray(raw.history)
      ? raw.history
          .filter((entry) => entry && Number(entry.minutes) > 0)
          .map((entry) => ({
            dateKey: typeof entry.dateKey === 'string' && entry.dateKey ? entry.dateKey : toDateKey(entry.completedAt || Date.now()),
            minutes: Math.max(1, Number(entry.minutes) || 0),
            completedAt: Number(entry.completedAt) || 0
          }))
          .slice(-180)
      : [];
    const inferredLastDate = typeof raw.lastCompletedDate === 'string' && raw.lastCompletedDate
      ? raw.lastCompletedDate
      : (normalizedHistory.at(-1)?.dateKey || '');
    const sameDay = inferredLastDate === todayKey;
    return {
      preferredMinutes: [15, 25, 40].includes(Number(raw.preferredMinutes)) ? Number(raw.preferredMinutes) : 25,
      autoLaunchRecommended: Boolean(raw.autoLaunchRecommended),
      completedToday: sameDay ? Math.max(0, Number(raw.completedToday) || 0) : 0,
      totalCompleted: Math.max(0, Number(raw.totalCompleted) || normalizedHistory.length || 0),
      rewardPerSession: Math.max(5, Number(raw.rewardPerSession) || 12),
      lastCompletedDate: sameDay ? todayKey : inferredLastDate,
      lastFinishedAt: Number(raw.lastFinishedAt) || normalizedHistory.at(-1)?.completedAt || 0,
      history: normalizedHistory
    };
  }

  function normalizeQuotesState(raw = {}) {
    const validIds = DAILY_QUOTES.map((quote) => quote.id);
    const savedIds = Array.isArray(raw.savedIds)
      ? raw.savedIds.filter((id) => validIds.includes(id))
      : [];

    const storedCycle = Array.isArray(raw.cycleOrder)
      ? raw.cycleOrder.filter((id) => validIds.includes(id))
      : [];
    const needsFreshCycle = storedCycle.length !== validIds.length || new Set(storedCycle).size !== validIds.length;
    const shuffleSeed = Number.isInteger(raw.shuffleSeed) ? raw.shuffleSeed : 11;
    const cycleOrder = needsFreshCycle ? buildQuoteCycle(shuffleSeed, raw.currentQuoteId || '') : storedCycle;
    const safeCursor = Math.max(0, Math.min(Number(raw.cycleCursor) || 0, Math.max(0, cycleOrder.length - 1)));
    const currentQuoteId = validIds.includes(raw.currentQuoteId) ? raw.currentQuoteId : (cycleOrder[safeCursor] || validIds[0]);

    return {
      savedIds,
      cycleOrder,
      cycleCursor: safeCursor,
      currentQuoteId,
      lastServedDate: typeof raw.lastServedDate === 'string' ? raw.lastServedDate : '',
      shuffleSeed
    };
  }

  function normalizeCollectionsState(raw = {}) {
    const defaultQuoteFolders = [
      { id: 'favorites', name: 'Quote yêu thích' },
      { id: 'comfort', name: 'Comfort' },
      { id: 'study', name: 'Study' },
      { id: 'romantic', name: 'Romantic' }
    ];
    const defaultWordFolders = [
      { id: 'quote-words', name: 'Quote Words' },
      { id: 'difficult', name: 'Từ khó' },
      { id: 'later-review', name: 'Ôn sau' }
    ];
    const defaultPatternFolders = [
      { id: 'daily-patterns', name: 'Daily Patterns' },
      { id: 'healing-lines', name: 'Healing Lines' },
      { id: 'study-lines', name: 'Study Lines' }
    ];

    const quoteFolders = normalizeFolders(raw.quoteFolders, defaultQuoteFolders);
    const wordFolders = normalizeFolders(raw.wordFolders, defaultWordFolders);
    const patternFolders = normalizeFolders(raw.patternFolders, defaultPatternFolders);
    const validQuoteIds = new Set(DAILY_QUOTES.map((quote) => quote.id));

    return {
      quoteFolders,
      wordFolders,
      patternFolders,
      activeQuoteFolder: ensureFolderId(raw.activeQuoteFolder, quoteFolders, 'favorites'),
      activeWordFolder: ensureFolderId(raw.activeWordFolder, wordFolders, 'quote-words'),
      activePatternFolder: ensureFolderId(raw.activePatternFolder, patternFolders, 'daily-patterns'),
      savedQuotes: normalizeSavedItems(raw.savedQuotes, (item) => validQuoteIds.has(item.quoteId), 'quoteId'),
      savedWords: normalizeSavedItems(raw.savedWords, (item) => Boolean(item.wordKey), 'wordKey'),
      savedPatterns: normalizeSavedItems(raw.savedPatterns, (item) => Boolean(item.patternId), 'patternId')
    };
  }

  function normalizeAdminState(raw = {}) {
    return {
      enabled: Boolean(raw.enabled),
      lastUpdatedAt: Number(raw.lastUpdatedAt) || 0
    };
  }

  function normalizeFolders(rawFolders, defaults) {
    const merged = [...defaults];
    if (Array.isArray(rawFolders)) {
      rawFolders.forEach((folder) => {
        if (!folder || !folder.id || !folder.name) return;
        if (!merged.some((item) => item.id === folder.id)) merged.push({ id: folder.id, name: folder.name });
      });
    }
    return merged;
  }

  function normalizeSavedItems(rawItems, validator, keyName) {
    if (!Array.isArray(rawItems)) return [];
    const seen = new Set();
    return rawItems.filter((item) => item && validator(item)).map((item) => ({ ...item, savedAt: Number(item.savedAt) || Date.now() })).filter((item) => {
      const uniqueKey = `${item.folderId || ''}:${item[keyName]}`;
      if (seen.has(uniqueKey)) return false;
      seen.add(uniqueKey);
      return true;
    });
  }

  function ensureFolderId(rawId, folders, fallbackId) {
    return folders.some((folder) => folder.id === rawId) ? rawId : fallbackId;
  }

  function syncSavedQuoteIdsFromCollections() {
    ensureUpgradeState();
    const fromCollections = state.collections?.savedQuotes?.map((item) => item.quoteId) || [];
    const currentSaved = Array.isArray(state.quotes?.savedIds) ? state.quotes.savedIds : [];
    state.quotes.savedIds = Array.from(new Set([...currentSaved, ...fromCollections]));
  }

  function getTodayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function createSeededRandom(seed) {
    let value = Math.abs(Number(seed) || 1) % 2147483647;
    if (value === 0) value = 1;
    return () => {
      value = (value * 48271) % 2147483647;
      return (value - 1) / 2147483646;
    };
  }

  function buildQuoteCycle(seed, avoidFirstId = '') {
    const ids = DAILY_QUOTES.map((quote) => quote.id);
    const random = createSeededRandom(seed);
    for (let i = ids.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    if (avoidFirstId && ids.length > 1 && ids[0] === avoidFirstId) {
      [ids[0], ids[1]] = [ids[1], ids[0]];
    }
    return ids;
  }

  async function ensureDailyQuoteFreshness() {
    const today = getTodayKey();
    let changed = false;

    if (!Array.isArray(state.quotes.cycleOrder) || state.quotes.cycleOrder.length !== DAILY_QUOTES.length) {
      state.quotes.shuffleSeed = (Number(state.quotes.shuffleSeed) || 11) + 17;
      state.quotes.cycleOrder = buildQuoteCycle(state.quotes.shuffleSeed, state.quotes.currentQuoteId || '');
      state.quotes.cycleCursor = 0;
      state.quotes.currentQuoteId = state.quotes.cycleOrder[0] || DAILY_QUOTES[0].id;
      changed = true;
    }

    if (!state.quotes.currentQuoteId) {
      state.quotes.currentQuoteId = state.quotes.cycleOrder[state.quotes.cycleCursor] || DAILY_QUOTES[0].id;
      changed = true;
    }

    if (!state.quotes.lastServedDate) {
      state.quotes.lastServedDate = today;
      changed = true;
    } else if (state.quotes.lastServedDate !== today) {
      let nextCursor = state.quotes.cycleCursor + 1;
      if (nextCursor >= state.quotes.cycleOrder.length) {
        state.quotes.shuffleSeed += 17;
        state.quotes.cycleOrder = buildQuoteCycle(state.quotes.shuffleSeed, state.quotes.currentQuoteId);
        nextCursor = 0;
      }
      state.quotes.cycleCursor = nextCursor;
      state.quotes.currentQuoteId = state.quotes.cycleOrder[nextCursor] || DAILY_QUOTES[0].id;
      state.quotes.lastServedDate = today;
      changed = true;
    }

    state.runtime.quoteIndex = getQuoteIndexById(state.quotes.currentQuoteId);
    if (changed) await storage.set({ vm_quotes: state.quotes });
  }

  function getQuoteIndexById(id) {
    const index = DAILY_QUOTES.findIndex((quote) => quote.id === id);
    return index >= 0 ? index : 0;
  }

  function getTodayQuoteIndex() {
    return getQuoteIndexById(state.quotes?.currentQuoteId);
  }

  function getCurrentQuoteIndex() {
    return Number.isInteger(state.runtime.quoteIndex) ? state.runtime.quoteIndex : getTodayQuoteIndex();
  }

  function getTodayQuote() {
    return DAILY_QUOTES[getTodayQuoteIndex()] || DAILY_QUOTES[0];
  }

  function getCurrentQuote() {
    return DAILY_QUOTES[getCurrentQuoteIndex()] || getTodayQuote();
  }

  function getMeta(kind, id) {

    const config = SHOP_CONFIG[kind];
    return config?.items.find((item) => item.id === id) || config?.items[0] || null;
  }

  function getUnlocked(kind) {
    ensureUpgradeState();
    return state.ui[SHOP_CONFIG[kind].unlockedKey];
  }

  function getActive(kind) {
    ensureUpgradeState();
    return state.ui[SHOP_CONFIG[kind].activeKey];
  }

  function openModal(id) {
    byId(id)?.classList.remove('hidden');
  }

  function closeModal(id) {
    byId(id)?.classList.add('hidden');
  }
  function getWalletSnapshot() {
    const studyCoins = Math.max(0, Number(state.stats.coins) || 0);
    const bonusCoins = Math.max(0, Number(state.bonusCoins) || 0);
    const totalEarned = studyCoins + bonusCoins;
    const spentCoins = Math.max(0, Math.min(Number(state.spentCoins) || 0, totalEarned));
    const availableCoins = Math.max(0, totalEarned - spentCoins);
    return { studyCoins, bonusCoins, totalEarned, spentCoins, availableCoins };
  }

  function getAvailableCoins() {
    return getWalletSnapshot().availableCoins;
  }

  function sanitizeWalletStateInMemory() {
    state.stats = normalizeStats(state.stats || {});
    state.stats.coins = Math.max(0, Number(state.stats?.coins) || 0);
    state.bonusCoins = Math.max(0, Number(state.bonusCoins) || 0);
    state.spentCoins = Math.max(0, Math.min(Number(state.spentCoins) || 0, state.stats.coins + state.bonusCoins));
    state.admin = normalizeAdminState(state.admin || {});
  }

  async function syncWalletStateFromStorage() {
    const result = await storage.get({
      stats: state.stats,
      vm_spentCoins: state.spentCoins,
      vm_bonusCoins: state.bonusCoins,
      vm_admin: state.admin
    });
    state.stats = normalizeStats(result.stats || state.stats || {});
    state.spentCoins = Math.max(0, Number(result.vm_spentCoins) || 0);
    state.bonusCoins = Math.max(0, Number(result.vm_bonusCoins) || 0);
    state.admin = normalizeAdminState(result.vm_admin || state.admin || {});
    sanitizeWalletStateInMemory();
  }

  async function ensureWalletConsistency({ persist = false } = {}) {
    const beforeSpent = Number(state.spentCoins) || 0;
    const beforeBonus = Number(state.bonusCoins) || 0;
    sanitizeWalletStateInMemory();
    const changed = beforeSpent !== state.spentCoins || beforeBonus !== state.bonusCoins;
    if (persist && changed) {
      await storage.set({ vm_spentCoins: state.spentCoins, vm_bonusCoins: state.bonusCoins });
    }
  }

  function refreshWalletUi(message = '') {
    renderAdminModal();
    renderWalletBar();
    renderUpgradeHubState();
    const wallet = applyWalletSnapshotToUi();
    setText('adminDeckStatus', state.admin?.enabled ? 'Admin ON' : 'Admin OFF');
    if (message) showToast(message);
    return wallet;
  }

  function applyUiPreferences() {
    ensureUpgradeState();
    document.body.dataset.uiTheme = state.ui.theme;
    document.body.dataset.uiCardStyle = state.ui.cardStyle;
    document.body.dataset.uiLayout = state.ui.layoutPack;
    document.body.dataset.uiFontTone = state.ui.fontTone;
    document.body.dataset.uiQuoteStyle = state.ui.quoteStyle;
    document.body.dataset.uiDensity = state.ui.density;
    document.body.classList.toggle('reduced-motion', !state.ui.motionEnabled);

    const effectsApi = window.VMUpgradeEffects;
    if (effectsApi?.apply) {
      effectsApi.apply({
        effect: state.ui.weatherEffect || 'off',
        intensity: state.ui.weatherIntensity || 55,
        speed: state.ui.weatherSpeed || 100,
        reducedMotion: !state.ui.motionEnabled
      });
    }

    const companion = byId('ambientCompanion');
    const emoji = byId('ambientEmoji');
    const theme = getMeta('theme', state.ui.theme);
    if (emoji) emoji.textContent = theme?.companion || '📘';
    companion?.classList.toggle('hidden', !state.ui.companionEnabled);
  }

  function renderUpgradeLayer() {
    renderWalletBar();
    renderMissionStrip();
    renderCustomizer();
    renderDailySayingLauncher();
    renderDailySayingModal();
    renderCollectionsModal();
    renderWeeklyRecapModal();
    renderPatternVaultModal();
    renderMemoryPathModal();
    renderWeakRescueModal();
    renderFocusRoomModal();
    renderAdminModal();
    renderEffectsLabModal();
    renderPomodoroWidgets();
    renderUpgradeHubState();
  }

  function renderUpgradeHubState() {
    const hub = byId('upgradeHub');
    const launcher = byId('toggleUpgradeHubBtn');
    if (!hub) return;
    const collapsed = Boolean(state.ui?.upgradeHubCollapsed);
    hub.classList.toggle('hub-collapsed', collapsed);
    if (launcher) launcher.textContent = collapsed ? 'Mở rộng' : 'Thu gọn';
  }

  function renderWalletBar() {
    ensureUpgradeState();
    const wallet = getWalletSnapshot();
    const counts = computeStudyCounts(state.vocab);
    setText('walletAvailableCoins', String(wallet.availableCoins));
    setText('walletThemeName', getMeta('theme', state.ui.theme)?.name || 'Midnight Core');
    setText('walletPomodoroToday', String(state.focus?.completedToday || 0));
    setText('walletLayoutName', getMeta('layout', state.ui.layoutPack)?.name || 'Classic Layout');
    setText('modalAvailableCoins', String(wallet.availableCoins));
    setText('modalEarnedCoins', String(wallet.studyCoins));
    setText('modalBonusCoins', String(wallet.bonusCoins));
    setText('modalSpentCoins', String(wallet.spentCoins));

    const note = byId('rewardMiniNote');
    if (note) {
      const walletNote = `Coin học hiện tại: ${wallet.studyCoins} • thưởng focus: ${wallet.bonusCoins} • đã tiêu cho UI: ${wallet.spentCoins}.`;
      const adminNote = state.admin?.enabled ? ' Admin mode đang bật.' : '';
      if (counts.weak) {
        note.textContent = `Bạn còn ${counts.weak} từ yếu. ${walletNote} Classic mode vẫn được giữ nguyên để học như cũ.${adminNote}`;
      } else {
        note.textContent = `${walletNote} Hiện tại bạn đang dùng ${getMeta('theme', state.ui.theme)?.name || 'Midnight Core'} + ${getMeta('layout', state.ui.layoutPack)?.name || 'Classic Layout'}.${adminNote}`;
      }
    }
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
    missions.forEach((mission) => {
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

  function getEffectsPresetSummary(preset) {
    return `${preset.name} • ${getMeta('card', preset.cardStyle)?.name || preset.cardStyle} • ${getMeta('theme', preset.theme)?.name || preset.theme}`;
  }

  function getActiveEffectsPresetId() {
    const active = EFFECTS_LAB_PRESETS.find((preset) => (
      state.ui.theme === preset.theme &&
      state.ui.cardStyle === preset.cardStyle &&
      state.ui.density === preset.density &&
      (state.ui.weatherEffect || 'off') === preset.effect
    ));
    return active?.id || '';
  }

  async function applyEffectsLabPreset(presetId) {
    const preset = EFFECTS_LAB_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;
    state.ui.theme = preset.theme;
    state.ui.cardStyle = preset.cardStyle;
    state.ui.density = preset.density;
    state.ui.weatherEffect = preset.effect;
    await saveUiState();
  }

  async function resetEffectsLabDefaults() {
    state.ui.theme = 'midnight';
    state.ui.cardStyle = 'classic';
    state.ui.density = 'balanced';
    state.ui.weatherEffect = 'off';
    state.ui.weatherIntensity = 55;
    state.ui.weatherSpeed = 100;
    await saveUiState();
    showToast('Đã đưa Effects Lab về mặc định.');
  }

  async function handleEffectsLabPresetClick(event) {
    const button = event.target.closest('[data-effects-preset]');
    if (!button) return;
    await applyEffectsLabPreset(button.dataset.effectsPreset || '');
  }

  async function handleEffectsLabSceneClick(event) {
    const button = event.target.closest('[data-effects-scene]');
    if (!button) return;
    const scene = EFFECTS_SCENES.find((item) => item.id === button.dataset.effectsScene);
    if (!scene) return;
    state.ui.theme = scene.theme;
    await saveUiState();
  }

  function renderEffectsLabModal() {
    ensureUpgradeState();
    const activePresetId = getActiveEffectsPresetId();
    const presetStrip = byId('effectsPresetStrip');
    if (presetStrip) {
      presetStrip.innerHTML = EFFECTS_LAB_PRESETS.map((preset) => `
        <button type="button" class="effects-preset-btn ${preset.id === activePresetId ? 'active' : ''}" data-effects-preset="${preset.id}">
          <span class="effects-preset-name">${escapeHtml(preset.name)}</span>
          <span class="effects-preset-note">${escapeHtml(preset.note)}</span>
        </button>
      `).join('');
    }

    const glassOptions = [
      ['classic', 'Classic'],
      ['glass', 'Pearl Layer'],
      ['liquid', 'Liquid Layer'],
      ['focusboard', 'Focus Board'],
      ['rounded', 'Soft Rounded']
    ];
    const accentOptions = EFFECTS_SCENES.map((scene) => [scene.theme, scene.label]);
    const densityOptions = [
      ['compact', 'Compact'],
      ['balanced', 'Balanced'],
      ['comfortable', 'Cozy']
    ];

    const fillSelect = (id, options, value) => {
      const node = byId(id);
      if (!node) return;
      node.innerHTML = options.map(([key, label]) => `<option value="${key}">${escapeHtml(label)}</option>`).join('');
      node.value = value;
    };
    fillSelect('fxGlassSelect', glassOptions, state.ui.cardStyle || 'classic');
    fillSelect('fxAccentSelect', accentOptions, state.ui.theme || 'midnight');
    fillSelect('fxDensitySelect', densityOptions, state.ui.density || 'balanced');

    const sceneGrid = byId('fxSceneGrid');
    if (sceneGrid) {
      sceneGrid.innerHTML = EFFECTS_SCENES.map((scene) => `
        <button type="button" class="fx-scene-card ${scene.theme === state.ui.theme ? 'active' : ''}" data-fx-scene="${scene.id}" data-effects-scene="${scene.id}">
          <strong class="fx-scene-name">${escapeHtml(scene.label)}</strong>
          <span class="fx-scene-note">${escapeHtml(scene.note)}</span>
        </button>
      `).join('');
    }

    if (byId('effectsLabSelect')) byId('effectsLabSelect').value = state.ui.weatherEffect || 'off';
    if (byId('effectsLabIntensityRange')) byId('effectsLabIntensityRange').value = String(state.ui.weatherIntensity || 55);
    if (byId('effectsLabSpeedRange')) byId('effectsLabSpeedRange').value = String(state.ui.weatherSpeed || 100);
    setText('effectsLabIntensityText', `${state.ui.weatherIntensity || 55}%`);
    setText('effectsLabSpeedText', `${state.ui.weatherSpeed || 100}%`);

    const effectCards = byId('effectsOptionGrid');
    if (effectCards) {
      const effectCatalog = [
        ['off', 'Off', 'Không thêm hiệu ứng nền.'],
        ['aurora', 'Aurora', 'Ribbon mềm, phù hợp học đêm.'],
        ['fireflies', 'Fireflies', 'Đốm sáng nhỏ và linh hoạt.'],
        ['stardust', 'Stardust', 'Hạt sao li ti, trong và gọn.'],
        ['prism', 'Prism', 'Vệt sáng gradient hiện đại.'],
        ['comets', 'Comets', 'Vệt sao băng chéo rõ hơn.'],
        ['orbs', 'Glass Orbs', 'Quầng cầu thủy tinh mờ.'],
        ['bubbles', 'Bubbles', 'Bong bóng kính nhẹ.'],
        ['rain', 'Rain', 'Mưa mảnh, nhẹ.'],
        ['window-rain', 'Window Rain', 'Giọt mưa kính sâu hơn.'],
        ['snow', 'Snow', 'Tuyết chậm và dịu.'],
        ['mist', 'Mist', 'Sương mờ nền tĩnh.'],
        ['neon', 'Neon', 'Vệt neon studio.'],
        ['petals', 'Petals', 'Cánh hoa mềm.']
      ];
      effectCards.innerHTML = effectCatalog.map(([id, name, note]) => `
        <button type="button" class="effects-option-card ${(state.ui.weatherEffect || 'off') === id ? 'active' : ''}" data-effect-card="${id}">
          <span class="effects-mini-swatch" data-effect="${id}"></span>
          <strong>${escapeHtml(name)}</strong>
          <span>${escapeHtml(note)}</span>
        </button>
      `).join('');
    }

    const activePreset = EFFECTS_LAB_PRESETS.find((preset) => preset.id === activePresetId);
    const summary = activePreset
      ? `Preset: ${getEffectsPresetSummary(activePreset)} • Density: ${state.ui.density || 'balanced'} • Effect: ${state.ui.weatherEffect || 'off'}`
      : `Glass: ${getMeta('card', state.ui.cardStyle)?.name || state.ui.cardStyle} • Accent: ${getMeta('theme', state.ui.theme)?.name || state.ui.theme} • Density: ${state.ui.density || 'balanced'} • Effect: ${state.ui.weatherEffect || 'off'}`;
    setText('effectsLabPreviewNote', summary);
  }

  function renderCustomizer() {
    ensureUpgradeState();
    renderShopCards('themeShopGrid', 'theme');
    renderShopCards('cardStyleGrid', 'card');
    renderShopCards('layoutPackGrid', 'layout');
    renderShopCards('fontPackGrid', 'font');
    renderShopCards('quoteStyleGrid', 'quote');
    renderPresetCards();

    if (byId('motionToggle')) byId('motionToggle').checked = state.ui.motionEnabled;
    if (byId('companionToggle')) byId('companionToggle').checked = state.ui.companionEnabled;
    if (byId('celebrateToggle')) byId('celebrateToggle').checked = state.ui.autoCelebrate;
    if (byId('densitySelect')) byId('densitySelect').value = state.ui.density;
    if (byId('weatherEffectSelect')) byId('weatherEffectSelect').value = state.ui.weatherEffect || 'off';
    if (byId('weatherIntensityRange')) byId('weatherIntensityRange').value = String(state.ui.weatherIntensity || 55);
    if (byId('weatherSpeedRange')) byId('weatherSpeedRange').value = String(state.ui.weatherSpeed || 100);
    setText('effectsLabIntensityText', `${state.ui.weatherIntensity || 55}%`);
    setText('effectsLabSpeedText', `${state.ui.weatherSpeed || 100}%`);
    if (byId('pomodoroAudioToggle')) byId('pomodoroAudioToggle').checked = Boolean(state.ui.pomodoroAudioEnabled);
    if (byId('pomodoroAudioPackSelect')) byId('pomodoroAudioPackSelect').value = state.ui.pomodoroAudioPack || 'soft-bell';
    if (byId('pomodoroAudioCueModeSelect')) byId('pomodoroAudioCueModeSelect').value = state.ui.pomodoroAudioCueMode || 'end-only';
    if (byId('pomodoroAudioVolumeRange')) byId('pomodoroAudioVolumeRange').value = String(state.ui.pomodoroAudioVolume ?? 65);
    const quick = byId('adminQuickStatus');
    if (quick) quick.textContent = state.admin?.enabled ? 'Admin mode: đang bật' : 'Admin mode: đang tắt';

    const effectMeta = {
      off: ['Đang tắt', 'Chọn Aurora, Fireflies, Stardust hoặc Prism.'],
      aurora: ['Aurora ribbon', 'Dải sáng mềm, hợp với liquid glass tối.'],
      fireflies: ['Fireflies', 'Đốm sáng nhẹ, vui mắt nhưng vẫn êm.'],
      stardust: ['Stardust', 'Hạt sao nhỏ cho cảm giác trong hơn.'],
      prism: ['Prism wave', 'Sóng màu mảnh, hiện đại hơn neon cũ.'],
      rain: ['Mưa mềm', 'Hiệu ứng mưa mảnh rất nhẹ phía sau.'],
      'window-rain': ['Mưa kính', 'Lớp mưa kính blur hơn để tạo chiều sâu.'],
      snow: ['Tuyết', 'Rơi chậm và yên hơn cho nền sáng lạnh.'],
      dust: ['Bụi sáng', 'Hạt sáng nhỏ kiểu bụi điện ảnh.'],
      mist: ['Sương mờ', 'Lớp sương mềm cho nền tĩnh hơn.'],
      neon: ['Neon', 'Vệt sáng nổi bật hơn cho theme city.'],
      petals: ['Cánh hoa', 'Chuyển động mềm kiểu sakura.']
    };
    const [effectLabel, effectDetail] = effectMeta[state.ui.weatherEffect || 'off'] || effectMeta.off;
    setText('effectsQuickLabel', effectLabel);
    setText('effectsQuickDetail', effectDetail);
    setText('adminDeckStatus', state.admin?.enabled ? 'Admin ON' : 'Admin OFF');
    setText('adminDeckWallet', `Số dư khả dụng: ${getWalletSnapshot().availableCoins}`);
    const adminToggle = byId('toggleAdminDeckBtn');
    if (adminToggle) adminToggle.textContent = state.admin?.enabled ? 'Tắt nhanh' : 'Bật nhanh';
    setText('focusQuickStatus', `${state.focus?.preferredMinutes || 25} phút`);
    setText('focusQuickDetail', `${state.focus?.completedToday || 0} pomodoro hôm nay`);
    setText('quoteQuickStyle', getMeta('quote', state.ui.quoteStyle)?.name || 'Soft quote');
  }

  function renderShopCards(containerId, kind) {
    const grid = byId(containerId);
    if (!grid) return;
    const config = SHOP_CONFIG[kind];
    const unlockedIds = getUnlocked(kind);
    const activeId = getActive(kind);
    const available = getAvailableCoins();

    grid.innerHTML = '';
    config.items.forEach((item) => {
      const unlocked = unlockedIds.includes(item.id) || item.price === 0;
      const active = item.id === activeId;
      const card = document.createElement('div');
      card.className = `shop-card ${active ? 'active' : ''}`;
      card.innerHTML = `
        <div class="shop-card-preview ${escapeHtml(item.previewClass || '')}">
          ${getPreviewMarkup(kind, item)}
        </div>
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

  function getPreviewMarkup(kind, item) {
    if (kind === 'theme') {
      return `
        <div class="preview-mini-window">
          <span></span><span></span><span></span>
          <div class="preview-mini-card"></div>
        </div>
      `;
    }
    if (kind === 'card') {
      return `
        <div class="preview-card-stack">
          <div class="preview-stack-card top"></div>
          <div class="preview-stack-card bottom"></div>
        </div>
      `;
    }
    if (kind === 'layout') {
      return `
        <div class="preview-layout ${escapeHtml(item.previewClass || '')}">
          <div class="preview-layout-a"></div>
          <div class="preview-layout-b"></div>
          <div class="preview-layout-c"></div>
        </div>
      `;
    }
    if (kind === 'font') {
      return `
        <div class="preview-font-block ${escapeHtml(item.previewClass || '')}">
          <strong>Abandon</strong>
          <span>/əˈbæn.dən/ • từ bỏ</span>
        </div>
      `;
    }
    if (kind === 'quote') {
      return `
        <div class="preview-quote ${escapeHtml(item.previewClass || '')}">
          <small>Câu nói mỗi ngày</small>
          <strong>You are allowed to begin again.</strong>
        </div>
      `;
    }
    return '';
  }


  function renderPresetCards() {
    const grid = byId('presetGrid');
    if (!grid) return;
    grid.innerHTML = '';
    PRESETS.forEach((preset) => {
      const active = isPresetActive(preset);
      const missing = getPresetMissingItems(preset);
      const ready = missing.length === 0;
      const bundlePrice = getPresetBundlePrice(preset);
      const helperNote = ready
        ? 'Đã có đủ pack. Bấm là áp dụng ngay.'
        : `Thiếu ${missing.length} pack • mở trọn gói ${bundlePrice} xu`;
      const card = document.createElement('div');
      card.className = `shop-card preset-card ${active ? 'active' : ''}`;
      card.innerHTML = `
        <div class="shop-card-preview preset-preview ${escapeHtml(getMeta('theme', preset.theme).previewClass)}">
          <div class="preset-preview-note">${escapeHtml(preset.tag)}</div>
          <div class="preset-preview-title">${escapeHtml(preset.name)}</div>
          <div class="preset-preview-stack">
            <span>${escapeHtml(getMeta('layout', preset.layoutPack).name)}</span>
            <span>${escapeHtml(getMeta('quote', preset.quoteStyle).name)}</span>
            <span>${escapeHtml(getMeta('card', preset.cardStyle).name)}</span>
          </div>
        </div>
        <div class="shop-card-head">
          <div>
            <strong>${escapeHtml(preset.name)}</strong>
            <div class="shop-tag">${escapeHtml(preset.note)}</div>
          </div>
          <span class="shop-price">${ready ? 'Sẵn sàng' : `${bundlePrice} xu`}</span>
        </div>
        <div class="preset-helper-note muted-text">${escapeHtml(helperNote)}</div>
        <div class="shop-actions">
          <button class="${active ? 'primary-btn' : ready ? 'primary-btn' : 'secondary-btn'}" data-preset-id="${preset.id}" ${(!ready && getAvailableCoins() < bundlePrice) ? 'disabled' : ''}>${active ? 'Đang dùng' : ready ? 'Áp dụng preset' : `Mở & áp dụng (${bundlePrice})`}</button>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  function getPresetMissingItems(preset) {
    const missing = [];
    [['theme', preset.theme], ['card', preset.cardStyle], ['layout', preset.layoutPack], ['font', preset.fontTone], ['quote', preset.quoteStyle]].forEach(([kind, id]) => {
      if (!getUnlocked(kind).includes(id)) missing.push({ kind, id, meta: getMeta(kind, id) });
    });
    return missing;
  }

  function getPresetBundlePrice(preset) {
    const total = getPresetMissingItems(preset).reduce((sum, item) => sum + (Number(item.meta?.price) || 0), 0);
    return Math.max(0, Math.round(total * PRESET_DISCOUNT));
  }

  function isPresetReady(preset) {
    return getPresetMissingItems(preset).length === 0;
  }

  function isPresetActive(preset) {
    return (
      state.ui.theme === preset.theme &&
      state.ui.cardStyle === preset.cardStyle &&
      state.ui.layoutPack === preset.layoutPack &&
      state.ui.fontTone === preset.fontTone &&
      state.ui.quoteStyle === preset.quoteStyle
    );
  }

  async function handlePresetClick(event) {
    const button = event.target.closest('button[data-preset-id]');
    if (!button) return;
    const preset = PRESETS.find((item) => item.id === button.dataset.presetId);
    if (!preset) return;
    const missing = getPresetMissingItems(preset);
    const bundlePrice = getPresetBundlePrice(preset);

    if (missing.length) {
      if (getAvailableCoins() < bundlePrice) {
        showToast('Xu giao diện chưa đủ để mở preset này trong một lần.');
        return;
      }
      state.spentCoins += bundlePrice;
      missing.forEach((item) => {
        const unlockedKey = SHOP_CONFIG[item.kind].unlockedKey;
        if (!state.ui[unlockedKey].includes(item.id)) state.ui[unlockedKey].push(item.id);
      });
      await saveWalletState();
    }

    state.ui.theme = preset.theme;
    state.ui.cardStyle = preset.cardStyle;
    state.ui.layoutPack = preset.layoutPack;
    state.ui.fontTone = preset.fontTone;
    state.ui.quoteStyle = preset.quoteStyle;
    await saveUiState();
    maybeCelebrate(`Đã áp dụng preset ${preset.name}.`);
  }

  async function handleCustomizerClick(event) {

    const button = event.target.closest('button[data-kind]');
    if (!button) return;
    const { kind, id, action } = button.dataset;
    if (!SHOP_CONFIG[kind]) return;
    if (action === 'unlock') await unlockShopItem(kind, id);
    else await applyShopItem(kind, id);
  }

  async function unlockShopItem(kind, id) {
    const config = SHOP_CONFIG[kind];
    const meta = getMeta(kind, id);
    if (!meta || !config) return;
    if (getAvailableCoins() < meta.price) {
      showToast('Xu giao diện chưa đủ để mở pack này.');
      return;
    }
    state.spentCoins += meta.price;
    if (!state.ui[config.unlockedKey].includes(id)) state.ui[config.unlockedKey].push(id);
    state.ui[config.activeKey] = id;
    await Promise.all([saveUiState(), saveWalletState()]);
    maybeCelebrate(`Đã mở khóa ${config.label} ${meta.name}!`);
  }

  async function applyShopItem(kind, id) {
    const config = SHOP_CONFIG[kind];
    if (!config) return;
    if (!state.ui[config.unlockedKey].includes(id)) return;
    state.ui[config.activeKey] = id;
    await saveUiState();
    showToast(`Đã áp dụng ${config.label} ${getMeta(kind, id).name}.`);
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

  async function commitWalletState(message = '') {
    state.stats = normalizeStats(state.stats || {});
    await ensureWalletConsistency();
    renderUpgradeLayer();
    applyWalletSnapshotToUi();
    await storage.set({
      stats: state.stats,
      vm_spentCoins: state.spentCoins,
      vm_bonusCoins: state.bonusCoins,
      vm_admin: state.admin
    });
    await syncWalletStateFromStorage();
    renderUpgradeLayer();
    refreshWalletUi(message);
  }

  async function saveFocusState() {
    renderUpgradeLayer();
    await storage.set({ vm_focus: state.focus });
  }

  async function saveQuotesState() {
    renderUpgradeLayer();
    await storage.set({ vm_quotes: state.quotes });
  }

  async function saveCollectionsState() {
    renderUpgradeLayer();
    await storage.set({ vm_collections: state.collections });
  }

  function applyWalletSnapshotToUi() {
    const wallet = getWalletSnapshot();
    setText('adminDeckWallet', `Số dư khả dụng: ${wallet.availableCoins}`);
    setText('modalAvailableCoins', String(wallet.availableCoins));
    setText('modalEarnedCoins', String(wallet.studyCoins));
    setText('modalBonusCoins', String(wallet.bonusCoins));
    setText('modalSpentCoins', String(wallet.spentCoins));
    setText('adminStudyCoinsValue', String(wallet.studyCoins));
    setText('adminBonusCoinsValue', String(wallet.bonusCoins));
    setText('adminSpentCoinsValue', String(wallet.spentCoins));
    setText('adminAvailableCoinsValue', String(wallet.availableCoins));
    const targetInput = byId('adminTargetAvailableInput');
    if (targetInput && document.activeElement !== targetInput) targetInput.value = String(wallet.availableCoins);
    return wallet;
  }

  async function saveAdminState() {
    state.admin = normalizeAdminState(state.admin || {});
    renderUpgradeLayer();
    applyWalletSnapshotToUi();
    await storage.set({ vm_admin: state.admin });
    refreshWalletUi();
  }

  function renderAdminModal() {
    if (!state.admin) return;
    const wallet = getWalletSnapshot();
    setText('adminModeBadge', state.admin.enabled ? 'Admin ON' : 'Admin OFF');
    setText('adminStudyCoinsValue', String(wallet.studyCoins));
    setText('adminBonusCoinsValue', String(wallet.bonusCoins));
    setText('adminSpentCoinsValue', String(wallet.spentCoins));
    setText('adminAvailableCoinsValue', String(wallet.availableCoins));
    const toggleBtn = byId('adminModeToggleBtn');
    if (toggleBtn) toggleBtn.textContent = state.admin.enabled ? 'Tắt admin mode' : 'Bật admin mode';
    const helper = byId('adminHelperNote');
    if (helper) helper.textContent = state.admin.enabled
      ? 'Admin mode đang bật. Bạn có thể chỉnh coin trực tiếp rồi quay về chế độ bình thường bất cứ lúc nào.'
      : 'Admin mode đang tắt. Bật lên khi bạn cần tự điều chỉnh coin để test hoặc khôi phục số dư UI.';

    const disabled = !state.admin.enabled;
    ['adminStudyCoinsInput', 'adminBonusCoinsInput', 'adminSpentCoinsInput', 'adminTargetAvailableInput', 'adminApplyDirectBtn', 'adminApplyTargetBtn', 'adminResetSpentBtn'].forEach((id) => {
      const el = byId(id);
      if (el) el.disabled = disabled;
    });
    document.querySelectorAll('[data-admin-add]').forEach((el) => { el.disabled = disabled; });

    const studyInput = byId('adminStudyCoinsInput');
    const bonusInput = byId('adminBonusCoinsInput');
    const spentInput = byId('adminSpentCoinsInput');
    const targetInput = byId('adminTargetAvailableInput');
    if (studyInput && document.activeElement !== studyInput) studyInput.value = String(wallet.studyCoins);
    if (bonusInput && document.activeElement !== bonusInput) bonusInput.value = String(wallet.bonusCoins);
    if (spentInput && document.activeElement !== spentInput) spentInput.value = String(wallet.spentCoins);
    if (targetInput && document.activeElement !== targetInput) targetInput.value = String(wallet.availableCoins);
  }

  async function toggleAdminMode() {
    await syncWalletStateFromStorage();
    state.admin.enabled = !state.admin.enabled;
    state.admin.lastUpdatedAt = Date.now();
    await saveAdminState();
    renderUpgradeLayer();
    refreshWalletUi(state.admin.enabled ? 'Đã bật admin mode.' : 'Đã quay về chế độ bình thường.');
  }

  async function applyAdminDirectValues() {
    if (!state.admin?.enabled) return showToast('Hãy bật admin mode trước.');
    const studyCoins = Math.max(0, Number(byId('adminStudyCoinsInput')?.value) || 0);
    const bonusCoins = Math.max(0, Number(byId('adminBonusCoinsInput')?.value) || 0);
    const spentCoins = Math.max(0, Number(byId('adminSpentCoinsInput')?.value) || 0);
    state.stats.coins = studyCoins;
    state.bonusCoins = bonusCoins;
    state.spentCoins = spentCoins;
    await commitWalletState('Đã lưu số coin theo chế độ admin.');
  }

  async function applyAdminTargetAvailable() {
    if (!state.admin?.enabled) return showToast('Hãy bật admin mode trước.');
    const target = Math.max(0, Number(byId('adminTargetAvailableInput')?.value) || 0);
    state.stats.coins = Math.max(0, target + state.spentCoins - state.bonusCoins);
    await commitWalletState(`Đã đặt số dư khả dụng thành ${target}.`);
  }

  async function adjustAdminAvailableBy(delta) {
    if (!state.admin?.enabled) return showToast('Hãy bật admin mode trước.');
    const wallet = getWalletSnapshot();
    const target = Math.max(0, wallet.availableCoins + delta);
    state.stats.coins = Math.max(0, target + state.spentCoins - state.bonusCoins);
    applyWalletSnapshotToUi();
    await commitWalletState(`Đã chỉnh số dư khả dụng ${delta >= 0 ? '+' : ''}${delta}.`);
  }

  async function resetAdminSpentCoins() {
    if (!state.admin?.enabled) return showToast('Hãy bật admin mode trước.');
    state.spentCoins = 0;
    await commitWalletState('Đã reset số coin đã tiêu cho UI.');
  }

  async function repairAdminWallet() {
    await syncWalletStateFromStorage();
    await ensureWalletConsistency();
    state.stats = normalizeStats(state.stats || {});
    state.spentCoins = Math.max(0, Math.min(Number(state.spentCoins) || 0, (Number(state.stats.coins) || 0) + (Number(state.bonusCoins) || 0)));
    await commitWalletState('Đã sửa và đồng bộ lại ví UI.');
  }

  function playPomodoroCue(cue) {
    if (!state.ui?.pomodoroAudioEnabled) return;
    window.VMUpgradeAudio?.play?.({
      pack: state.ui.pomodoroAudioPack || 'soft-bell',
      cue,
      volume: state.ui.pomodoroAudioVolume ?? 65,
      enabled: true
    });
  }

  async function unlockPomodoroAudio() {
    const ok = await window.VMUpgradeAudio?.unlock?.();
    renderPomodoroWidgets();
    if (!ok) showToast('Trình duyệt chưa cho phát âm thanh. Hãy bấm lại sau một thao tác trực tiếp.');
  }

  async function testPomodoroAudio() {
    const ok = await window.VMUpgradeAudio?.play?.({ pack: state.ui?.pomodoroAudioPack || 'soft-bell', cue: 'end', volume: state.ui?.pomodoroAudioVolume ?? 65, enabled: true });
    renderPomodoroWidgets();
    if (!ok) showToast('Cue Pomodoro chưa phát được.');
  }

  async function handlePomodoroPlaylistFolderPick(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const result = await window.VMUpgradeAudio?.loadCompletionPlaylist?.(files);
    if (result?.ok) {
      const folderName = String(files[0]?.webkitRelativePath || '').split('/')[0] || 'Playlist .webm';
      state.ui.pomodoroCompletionPlaylistFolderName = folderName;
      state.ui.pomodoroCompletionPlaylistTrackCount = result.count || 0;
      await saveUiState();
      showToast(`Đã nạp folder playlist: ${folderName} • ${result.count} file .webm.`);
    } else {
      showToast('Không đọc được folder .webm. Hãy kiểm tra file trong folder.');
    }
    event.target.value = '';
    renderPomodoroWidgets();
  }

  async function clearPomodoroCompletionPlaylist() {
    window.VMUpgradeAudio?.clearCompletionPlaylist?.();
    state.ui.pomodoroCompletionPlaylistFolderName = '';
    state.ui.pomodoroCompletionPlaylistTrackCount = 0;
    await saveUiState();
    showToast('Đã xóa playlist hoàn thành Pomodoro.');
  }

  async function previewPomodoroCompletionPlaylist() {
    const ok = await window.VMUpgradeAudio?.startCompletionPlaylist?.({ volume: state.ui?.pomodoroCompletionPlaylistVolume ?? 70 });
    renderPomodoroWidgets();
    if (!ok) showToast('Playlist chưa phát được. Hãy chọn lại folder .webm.');
  }

  function stopPomodoroCompletionPlaylistPreview() {
    window.VMUpgradeAudio?.stopCompletionPlaylist?.();
    renderPomodoroWidgets();
  }

  function syncPomodoroRuntime(forceReset = false) {
    if (state.runtime.isRunning && !forceReset) return;
    if (forceReset) pausePomodoro(false);
    state.runtime.remainingSec = state.focus.preferredMinutes * 60;
    renderPomodoroWidgets();
  }

  function startPomodoro() {
    if (state.runtime.isRunning) return;
    if (state.runtime.remainingSec <= 0) state.runtime.remainingSec = state.focus.preferredMinutes * 60;
    state.runtime.pomodoroWarningPlayed = false;
    state.runtime.isRunning = true;
    window.VMUpgradeAudio?.stopCompletionPlaylist?.(true);
    if ((state.ui?.pomodoroAudioCueMode || 'end-only') === 'full') playPomodoroCue('start');
    renderPomodoroWidgets();
    state.runtime.intervalId = window.setInterval(async () => {
      state.runtime.remainingSec -= 1;
      if ((state.ui?.pomodoroAudioCueMode || 'end-only') === 'full' && !state.runtime.pomodoroWarningPlayed && state.runtime.remainingSec === 5 * 60) {
        state.runtime.pomodoroWarningPlayed = true;
        playPomodoroCue('warning');
      }
      renderPomodoroWidgets();
      if (state.runtime.remainingSec <= 0) await completePomodoroSession();
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
    state.runtime.pomodoroWarningPlayed = false;
    state.runtime.remainingSec = state.focus.preferredMinutes * 60;
    renderPomodoroWidgets();
    showToast('Đã đặt lại Pomodoro.');
  }

  async function completePomodoroSession() {
    pausePomodoro(false);
    state.runtime.pomodoroWarningPlayed = false;
    playPomodoroCue('end');
    if (state.ui?.pomodoroCompletionPlaylistEnabled && Number(state.ui?.pomodoroCompletionPlaylistTrackCount || 0) > 0) {
      window.VMUpgradeAudio?.startCompletionPlaylist?.({ volume: state.ui?.pomodoroCompletionPlaylistVolume ?? 70 });
    }
    state.focus.completedToday += 1;
    state.focus.totalCompleted += 1;
    state.focus.lastCompletedDate = getTodayKey();
    state.focus.lastFinishedAt = Date.now();
    state.focus.history = [...(state.focus.history || []), { dateKey: getTodayKey(), minutes: state.focus.preferredMinutes, completedAt: Date.now() }].slice(-180);
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


  function isStudyLikeViewActive() {
    return ['study-mode-view', 'quiz-mode-view', 'matching-mode-view', 'typing-mode-view', 'dictation-mode-view']
      .some((id) => {
        const node = byId(id);
        return node && !node.classList.contains('hidden');
      });
  }

  function renderPomodoroWidgets() {
    const total = state.focus.preferredMinutes * 60;
    const remaining = Math.max(0, state.runtime.remainingSec);
    const formatted = formatClock(remaining);

    setText('pomodoroClock', formatted);
    setText('pomodoroMiniClock', formatted);
    setText('pomodoroTodayKpi', String(state.focus.completedToday));
    setText('pomodoroTotalKpi', String(state.focus.totalCompleted));
    setText('pomodoroRewardKpi', String(state.focus.rewardPerSession));
    setText('focusRoomPomodoro', formatted);

    const statusText = byId('pomodoroStatusText');
    if (statusText) {
      statusText.textContent = state.runtime.isRunning
        ? `Đang focus. Còn ${formatted} trước khi nhận thưởng giao diện.`
        : remaining === total
          ? 'Sẵn sàng cho một phiên tập trung ngắn.'
          : `Đã tạm dừng ở ${formatted}.`;
    }

    const miniStatus = byId('pomodoroMiniStatus');
    if (miniStatus) {
      miniStatus.textContent = state.runtime.isRunning
        ? 'Đang focus'
        : remaining === total
          ? 'Sẵn sàng focus'
          : 'Đang tạm dừng';
    }

    setText('focusRoomPomodoroNote', state.runtime.isRunning ? 'Đang chạy — giữ góc học yên tĩnh.' : 'Mở Pomodoro để giữ nhịp tập trung.');

    const miniToggle = byId('pomodoroMiniToggleBtn');
    if (miniToggle) miniToggle.textContent = state.runtime.isRunning ? '❚❚' : '▶';
    const studyLikeView = isStudyLikeViewActive();
    byId('pomodoroMiniWidget')?.classList.toggle('running', state.runtime.isRunning);
    byId('pomodoroMiniWidget')?.classList.toggle('study-dock', studyLikeView);
    byId('ambientCompanion')?.classList.toggle('study-hidden', studyLikeView);

    if (byId('pomodoroMinutesSelect')) byId('pomodoroMinutesSelect').value = String(state.focus.preferredMinutes);
    if (byId('pomodoroAutoLaunch')) byId('pomodoroAutoLaunch').checked = state.focus.autoLaunchRecommended;
    if (byId('pomodoroAudioToggle')) byId('pomodoroAudioToggle').checked = Boolean(state.ui?.pomodoroAudioEnabled);
    if (byId('pomodoroAudioPackSelect')) byId('pomodoroAudioPackSelect').value = state.ui?.pomodoroAudioPack || 'soft-bell';
    if (byId('pomodoroAudioCueModeSelect')) byId('pomodoroAudioCueModeSelect').value = state.ui?.pomodoroAudioCueMode || 'end-only';
    if (byId('pomodoroAudioVolumeRange')) byId('pomodoroAudioVolumeRange').value = String(state.ui?.pomodoroAudioVolume ?? 65);
    if (byId('pomodoroPlaylistToggle')) byId('pomodoroPlaylistToggle').checked = Boolean(state.ui?.pomodoroCompletionPlaylistEnabled);
    if (byId('pomodoroPlaylistVolumeRange')) byId('pomodoroPlaylistVolumeRange').value = String(state.ui?.pomodoroCompletionPlaylistVolume ?? 70);
    setText('pomodoroAudioVolumeText', `${state.ui?.pomodoroAudioVolume ?? 65}%`);
    setText('pomodoroPlaylistVolumeText', `${state.ui?.pomodoroCompletionPlaylistVolume ?? 70}%`);
    setText('pomodoroPlaylistFolderName', state.ui?.pomodoroCompletionPlaylistFolderName || 'Chưa có folder playlist');
    const trackCount = Number(state.ui?.pomodoroCompletionPlaylistTrackCount || 0);
    setText('pomodoroPlaylistFolderMeta', trackCount > 0 ? `${trackCount} file .webm đã sẵn sàng. Folder cần chọn lại sau khi reload extension.` : 'Chọn một folder chứa nhiều file .webm. Khi một file kết thúc, extension sẽ tự chuyển file tiếp theo không ngắt quãng.');
    const audioStatus = window.VMUpgradeAudio?.getStatus?.() || {};
    setText('pomodoroAudioStatus', state.ui?.pomodoroAudioEnabled ? (audioStatus.message || 'Cue Pomodoro đã sẵn sàng.') : 'Cue Pomodoro đang tắt.');
    setText('pomodoroPlaylistStatus', state.ui?.pomodoroCompletionPlaylistEnabled ? (trackCount > 0 ? (audioStatus.playlistPlaying ? `Playlist đang chạy • ${audioStatus.playlistCurrentTrack || state.ui?.pomodoroCompletionPlaylistFolderName}.` : `Playlist sẵn sàng • ${state.ui?.pomodoroCompletionPlaylistFolderName || 'Playlist .webm'} • ${trackCount} file.`) : 'Hãy chọn một folder .webm cho playlist sau Pomodoro.') : 'Playlist sau khi hết Pomodoro đang tắt.');
    const pickBtn = byId('pomodoroPlaylistFolderPickBtn');
    if (pickBtn) pickBtn.disabled = !state.ui?.pomodoroCompletionPlaylistEnabled;
    const clearBtn = byId('pomodoroPlaylistFolderClearBtn');
    if (clearBtn) clearBtn.disabled = trackCount <= 0;
    const playBtn = byId('pomodoroPlaylistTestBtn');
    if (playBtn) playBtn.disabled = !state.ui?.pomodoroCompletionPlaylistEnabled || trackCount <= 0;
    const stopBtn = byId('pomodoroPlaylistStopBtn');
    if (stopBtn) stopBtn.disabled = !window.VMUpgradeAudio?.isCompletionPlaylistPlaying?.();
  }

  function renderDailySayingLauncher() {
    const quote = getCurrentQuote();
    setText('dailyLauncherTitle', quote.title);
    setText('dailyLauncherNote', quote.translation);
    setText('dailyLauncherMood', quote.mood);
  }

  function openDailySayingModal() {
    state.runtime.quoteIndex = getTodayQuoteIndex();
    renderDailySayingModal();
    openModal('dailySayingModal');
  }

  function getQuoteFocusWords(quote = getCurrentQuote()) {
    const tokens = (quote.title.match(/[A-Za-z']+/g) || []).map((token) => token.toLowerCase().replace(/^'+|'+$/g, ''));
    const seen = new Set();
    const results = [];
    tokens.forEach((token) => {
      if (!token || QUOTE_STOPWORDS.has(token) || seen.has(token) || !QUOTE_WORD_BANK[token]) return;
      seen.add(token);
      results.push({ wordKey: token, word: token, ...QUOTE_WORD_BANK[token] });
    });
    return results.slice(0, 4);
  }


  function getLessonWordData(rawWord) {
    if (!rawWord) return null;
    const wordKey = rawWord.wordKey || normalizeWordKey(rawWord.word || '');
    const base = WORD_LESSON_BANK[wordKey] || {};
    const word = rawWord.word || wordKey;
    const meaning = rawWord.meaning || base.meaning || 'nghĩa nhanh';
    const collocation = base.collocation || `${word} phrase`;
    const collocationMeaning = base.collocationMeaning || `cụm với ${word}`;
    const sentence = base.sentence || `${capitalize(word)} appears in this sentence: ${getCurrentQuote().title}`;
    const patternData = getBestPatternForQuote(getCurrentQuote(), rawWord);
    return {
      wordKey,
      word,
      meaning,
      wordType: rawWord.wordType || 'word',
      collocation,
      collocationMeaning,
      sentence,
      pattern: base.pattern || patternData.pattern,
      grammar: base.grammar || patternData.grammar,
      speaking: base.speaking || `Make one short sentence with “${word}”.`,
      recall: base.recall || `Recall later: write one sentence with “${word}”.`
    };
  }

  function getBestPatternForQuote(quote = getCurrentQuote(), selected = getSelectedQuoteWord()) {
    const title = String(quote?.title || '');
    const lower = title.toLowerCase();
    if (lower.startsWith('you do not have to')) return PATTERN_TEMPLATES.find((item) => item.id === 'need-not-carry');
    if (lower.startsWith('i pretend to')) return PATTERN_TEMPLATES.find((item) => item.id === 'pretend-actually');
    if (lower.startsWith('a ') && lower.includes(' can ')) return PATTERN_TEMPLATES.find((item) => item.id === 'small-can');
    if (lower.startsWith('even ') && lower.includes(' still ')) return PATTERN_TEMPLATES.find((item) => item.id === 'even-still');
    if (lower.startsWith('what you ')) return PATTERN_TEMPLATES.find((item) => item.id === 'what-you-repeat');
    if (lower.startsWith('take a breath')) return PATTERN_TEMPLATES.find((item) => item.id === 'take-a-breath');
    const selectedWord = selected?.word || 'word';
    return {
      id: `generated-${normalizeWordKey(title).slice(0, 16) || 'pattern'}`,
      label: 'Pattern from current quote',
      pattern: title.replace(new RegExp(selectedWord, 'i'), '___'),
      grammar: 'Dùng chính câu quote này làm mẫu câu để lặp lại vào hôm sau.',
      example: title
    };
  }

  function capitalize(text) {
    const value = String(text || '');
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
  }

  function getMemoryPathSourceWord() {
    const selected = getSelectedQuoteWord();
    if (selected) return selected;
    const focusWord = pickFocusRoomWord();
    if (focusWord) return { wordKey: normalizeWordKey(focusWord.word), word: focusWord.word, meaning: focusWord.meaning, wordType: focusWord.wordType || 'word' };
    const weak = getWeakWordsLocal(state.vocab)[0];
    if (weak) return { wordKey: normalizeWordKey(weak.word), word: weak.word, meaning: weak.meaning, wordType: weak.wordType || 'word' };
    return getQuoteFocusWords()[0] || null;
  }

  function getSelectedRescueWord() {
    const weakWords = getWeakWordsLocal(state.vocab)
      .sort((a, b) => (Number(b?.review?.wrongCount) || 0) - (Number(a?.review?.wrongCount) || 0) || (Number(a?.review?.confidence) || 0) - (Number(b?.review?.confidence) || 0));
    return weakWords.find((item) => item.id === state.runtime.selectedRescueWordId) || weakWords[0] || null;
  }

  function getWeakRescueReason(word) {
    if (!word) return 'Chưa có từ yếu nổi bật để cứu.';
    const review = word.review || {};
    const wrong = Number(review.wrongCount) || 0;
    const seen = Number(review.seenCount) || 0;
    const confidence = Number(review.confidence) || 0;
    if (wrong >= 3) return `Từ này đã sai ${wrong} lần nên cần rescue note nhẹ hơn thay vì chỉ lặp máy móc.`;
    if (confidence <= 1 && seen >= 2) return 'Bạn đã gặp từ này vài lần nhưng mức nhớ vẫn còn thấp.';
    return 'Từ này vẫn chưa đủ chắc để đi qua spaced repetition một cách yên tâm.';
  }

  function getWeakRescueSimple(word) {
    if (!word) return 'Mở thêm một phiên ôn ngắn sẽ giúp rõ hơn.';
    const simpleMeaning = String(word.meaning || '').split(/[;,]/)[0] || 'nghĩa đơn giản hơn';
    return `Hiểu nhanh: “${simpleMeaning}”. Hãy nhớ theo kiểu cụm và câu ngắn trước, đừng ép phải nhớ hoàn hảo ngay.`;
  }

  function renderFolderOptions(selectId, folders, activeId) {
    const select = byId(selectId);
    if (!select) return;
    select.innerHTML = folders.map((folder) => `<option value="${escapeHtml(folder.id)}">${escapeHtml(folder.name)}</option>`).join('');
    select.value = activeId;
  }

  function renderDailySayingModal() {
    const quote = getCurrentQuote();
    const saved = state.quotes.savedIds.includes(quote.id);

    setText('dailyQuoteBadge', quote.badge);
    setText('dailyQuoteMood', quote.mood);
    setText('dailyQuoteHeroTitle', quote.title);
    setText('dailyQuoteHeroNote', quote.note);
    setText('dailyQuoteTitle', quote.title);
    setText('dailyQuoteTranslation', quote.translation);
    setText('dailyQuoteNote', quote.note);
    setText('savedQuotesCount', String(state.collections.savedQuotes.length));
    setText('currentQuoteStyleName', getMeta('quote', state.ui.quoteStyle)?.name || 'Soft Rescue');

    renderFolderOptions('dailyQuoteFolderSelect', state.collections.quoteFolders, state.collections.activeQuoteFolder);
    renderFolderOptions('dailyWordFolderSelect', state.collections.wordFolders, state.collections.activeWordFolder);
    renderFolderOptions('dailyPatternFolderSelect', state.collections.patternFolders, state.collections.activePatternFolder);

    const saveBtn = byId('saveDailyQuoteBtn');
    if (saveBtn) {
      saveBtn.textContent = saved ? '♥ Đã lưu' : '♡ Lưu';
      saveBtn.classList.toggle('saved', saved);
    }

    const words = getQuoteFocusWords(quote);
    const chipRow = byId('dailyQuoteWordChips');
    if (chipRow) {
      chipRow.innerHTML = words.length
        ? words.map((item) => `<button type="button" class="daily-quote-chip ${state.runtime.selectedQuoteWordKey === item.wordKey ? 'active' : ''}" data-word-key="${escapeHtml(item.wordKey)}">${escapeHtml(item.word)}</button>`).join('')
        : '<div class="muted-text">Quote này hiện chưa có từ nổi bật trong bộ từ gợi ý.</div>';
    }
    if ((!state.runtime.selectedQuoteWordKey || !words.some((item) => item.wordKey === state.runtime.selectedQuoteWordKey)) && words[0]) {
      state.runtime.selectedQuoteWordKey = words[0].wordKey;
    }
    renderQuoteWordPanel();
    renderQuoteLessonCard();
  }

  function renderQuoteWordPanel() {
    const words = getQuoteFocusWords();
    const selected = words.find((item) => item.wordKey === state.runtime.selectedQuoteWordKey) || words[0];
    const selectedTitle = byId('dailyWordSelected');
    const meaning = byId('dailyWordMeaning');
    const note = byId('dailyWordNote');
    if (!selected) {
      if (selectedTitle) selectedTitle.textContent = 'Không có từ nổi bật';
      if (meaning) meaning.textContent = 'Quote này hiện chưa có chip từ để khai thác.';
      if (note) note.textContent = 'Bạn vẫn có thể lưu cả câu vào collections.';
      return;
    }
    state.runtime.selectedQuoteWordKey = selected.wordKey;
    if (selectedTitle) selectedTitle.textContent = `${selected.word} • ${selected.wordType || 'word'}`;
    if (meaning) meaning.textContent = selected.meaning || 'Chưa có nghĩa nhanh cho từ này.';
    if (note) note.textContent = `${selected.note || 'Từ nổi bật lấy từ câu quote hiện tại.'} • Ví dụ: ${getCurrentQuote().title}`;

    const chipRow = byId('dailyQuoteWordChips');
    chipRow?.querySelectorAll('button[data-word-key]').forEach((button) => {
      button.classList.toggle('active', button.dataset.wordKey === selected.wordKey);
    });
  }


  function renderQuoteLessonCard() {
    const lesson = getLessonWordData(getSelectedQuoteWord() || getMemoryPathSourceWord());
    if (!lesson) return;
    setText('lessonCollocation', lesson.collocation);
    setText('lessonCollocationMeaning', lesson.collocationMeaning);
    setText('lessonPattern', lesson.pattern);
    setText('lessonPatternGrammar', lesson.grammar);
    setText('lessonSpeaking', lesson.speaking);
    setText('lessonRecall', lesson.recall);
    setText('lessonSentence', lesson.sentence);
  }

  function renderMemoryPathModal() {
    const source = getMemoryPathSourceWord();
    const lesson = getLessonWordData(source);
    if (!lesson) return;
    state.runtime.selectedQuoteWordKey = lesson.wordKey;
    setText('memoryPathWord', lesson.word);
    setText('memoryPathMeaning', lesson.meaning);
    setText('memoryPathCollocation', lesson.collocation);
    setText('memoryPathCollocationMeaning', lesson.collocationMeaning);
    setText('memoryPathSentence', lesson.sentence);
    setText('memoryPathGrammar', lesson.grammar);
    setText('memoryPathRecall', lesson.recall);
    setText('memoryPathSpeaking', lesson.speaking);
  }

  function nextMemoryPathSource() {
    const words = getQuoteFocusWords();
    if (words.length > 1) {
      const currentIndex = words.findIndex((item) => item.wordKey === state.runtime.selectedQuoteWordKey);
      const next = words[(currentIndex + 1 + words.length) % words.length] || words[0];
      state.runtime.selectedQuoteWordKey = next.wordKey;
    } else {
      state.runtime.focusRoomSeed += 1;
    }
    renderMemoryPathModal();
    renderQuoteWordPanel();
    renderQuoteLessonCard();
  }

  function speakMemoryPathWord() {
    const source = getMemoryPathSourceWord();
    if (!source) return showToast('Chưa có từ cho memory path.');
    speakText(source.word);
  }

  async function saveMemoryPathWord() {
    const source = getMemoryPathSourceWord();
    if (!source) return showToast('Chưa có từ để lưu.');
    await saveSelectedQuoteWordToVocabulary();
  }

  async function saveMemoryPathPattern() {
    const lesson = getLessonWordData(getMemoryPathSourceWord());
    if (!lesson) return showToast('Chưa có pattern để lưu.');
    const patternId = `memory-path-${lesson.wordKey}`;
    if (!state.collections.savedPatterns.some((item) => item.patternId === patternId && item.folderId === state.collections.activePatternFolder)) {
      state.collections.savedPatterns = [
        { patternId, folderId: state.collections.activePatternFolder, text: lesson.pattern, translation: lesson.sentence, savedAt: Date.now() },
        ...state.collections.savedPatterns
      ];
      await saveCollectionsState();
    }
    maybeCelebrate('Đã lưu Memory Path pattern để ôn lại sau.');
  }

  function startMemoryPathStudy() {
    closeModal('memoryPathModal');
    byId('startRecommendedBtn')?.click();
  }

  function renderWeakRescueModal() {
    const chips = byId('weakRescueChips');
    const weakWords = getWeakWordsLocal(state.vocab)
      .sort((a, b) => (Number(b?.review?.wrongCount) || 0) - (Number(a?.review?.wrongCount) || 0) || (Number(a?.review?.confidence) || 0) - (Number(b?.review?.confidence) || 0))
      .slice(0, 6);
    if (chips) {
      chips.innerHTML = weakWords.length
        ? weakWords.map((word) => `<button type="button" class="daily-quote-chip ${state.runtime.selectedRescueWordId === word.id ? 'active' : ''}" data-rescue-word-id="${escapeHtml(word.id)}">${escapeHtml(word.word)}</button>`).join('')
        : '<div class="muted-text">Hiện chưa có từ yếu nổi bật. Đây là tín hiệu tốt cho trí nhớ dài hạn.</div>';
    }
    if (!state.runtime.selectedRescueWordId && weakWords[0]) state.runtime.selectedRescueWordId = weakWords[0].id;
    const selected = getSelectedRescueWord();
    if (!selected) {
      setText('weakRescueWord', 'Ổn định');
      setText('weakRescueMeaning', 'Chưa có từ yếu nổi bật');
      setText('weakRescueReason', 'Bạn có thể tiếp tục bằng các vòng ôn ngắn và đều.');
      setText('weakRescueSimple', 'Hiện chưa cần rescue note riêng.');
      setText('weakRescueCompare', 'Không có cặp dễ nhầm nào cần nhắc ngay.');
      setText('weakRescuePhrase', 'Hãy giữ nhịp review chậm và đều.');
      return;
    }
    const key = normalizeWordKey(selected.word);
    const compare = CONFUSION_BANK[key];
    const lesson = getLessonWordData({ wordKey: key, word: selected.word, meaning: selected.meaning, wordType: selected.wordType || 'word' });
    setText('weakRescueWord', selected.word);
    setText('weakRescueMeaning', selected.meaning);
    setText('weakRescueReason', getWeakRescueReason(selected));
    setText('weakRescueSimple', getWeakRescueSimple(selected));
    setText('weakRescueCompare', compare ? `${compare.compare} • ${compare.note}` : `Gợi ý cụm dễ nhớ hơn: ${lesson.collocation} • ${lesson.collocationMeaning}`);
    setText('weakRescuePhrase', selected.example || lesson.sentence);
    chips?.querySelectorAll('button[data-rescue-word-id]').forEach((button) => {
      button.classList.toggle('active', button.dataset.rescueWordId === selected.id);
    });
  }

  function handleWeakRescueChipClick(event) {
    const button = event.target.closest('button[data-rescue-word-id]');
    if (!button) return;
    state.runtime.selectedRescueWordId = button.dataset.rescueWordId || '';
    renderWeakRescueModal();
  }

  function nextWeakRescueWord() {
    const weakWords = getWeakWordsLocal(state.vocab)
      .sort((a, b) => (Number(b?.review?.wrongCount) || 0) - (Number(a?.review?.wrongCount) || 0) || (Number(a?.review?.confidence) || 0) - (Number(b?.review?.confidence) || 0))
      .slice(0, 6);
    if (!weakWords.length) return;
    const currentIndex = weakWords.findIndex((item) => item.id === state.runtime.selectedRescueWordId);
    state.runtime.selectedRescueWordId = (weakWords[(currentIndex + 1 + weakWords.length) % weakWords.length] || weakWords[0]).id;
    renderWeakRescueModal();
  }

  function speakWeakRescueWord() {
    const selected = getSelectedRescueWord();
    if (!selected) return showToast('Chưa có từ yếu để phát âm.');
    speakText(selected.word);
  }

  async function saveWeakRescueWord() {
    const selected = getSelectedRescueWord();
    if (!selected) return showToast('Chưa có từ yếu để lưu.');
    const wordKey = normalizeWordKey(selected.word);
    if (!state.collections.savedWords.some((item) => item.wordKey === wordKey && item.folderId === 'difficult')) {
      state.collections.savedWords = [
        { wordKey, folderId: 'difficult', word: selected.word, meaning: selected.meaning, example: selected.example || '', savedAt: Date.now() },
        ...state.collections.savedWords
      ];
      await saveCollectionsState();
    }
    maybeCelebrate('Đã đưa từ này vào folder Từ khó để rescue sau.');
  }

  function startWeakRescueStudy() {
    closeModal('weakRescueModal');
    byId('startWeakFocusBtn')?.click();
  }

  function getPatternVaultItems() {
    const currentPattern = getBestPatternForQuote();
    const saved = state.collections.savedPatterns.slice(0, 6).map((item) => ({
      id: item.patternId,
      source: 'Đã lưu',
      pattern: item.text,
      grammar: 'Pattern bạn đã lưu trước đó.',
      example: item.translation || ''
    }));
    const suggested = PATTERN_TEMPLATES.map((item) => ({
      id: item.id,
      source: 'Gợi ý',
      pattern: item.pattern,
      grammar: item.grammar,
      example: item.example
    }));
    const generated = [{
      id: currentPattern.id,
      source: 'Từ quote hôm nay',
      pattern: currentPattern.pattern,
      grammar: currentPattern.grammar,
      example: currentPattern.example
    }];
    const merged = [...generated, ...saved, ...suggested];
    const seen = new Set();
    return merged.filter((item) => {
      const key = `${item.pattern}__${item.example}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 24);
  }

  function renderPatternVaultModal() {
    const grid = byId('patternVaultGrid');
    if (!grid) return;
    const items = getPatternVaultItems();
    grid.innerHTML = items.map((item) => `
      <div class="pattern-vault-card">
        <span>${escapeHtml(item.source)}</span>
        <strong>${escapeHtml(item.pattern)}</strong>
        <small>${escapeHtml(item.grammar)}</small>
        <div class="pattern-vault-example">${escapeHtml(item.example)}</div>
        <button class="secondary-btn" type="button" data-pattern-text="${escapeHtml(item.pattern)}" data-pattern-example="${escapeHtml(item.example)}">Lưu pattern này</button>
      </div>
    `).join('');
  }

  async function handlePatternVaultClick(event) {
    const button = event.target.closest('button[data-pattern-text]');
    if (!button) return;
    const text = button.dataset.patternText || '';
    const example = button.dataset.patternExample || '';
    const patternId = `vault-${normalizeWordKey(text).slice(0, 30)}-${normalizeWordKey(example).slice(0, 12)}`;
    if (!state.collections.savedPatterns.some((item) => item.patternId === patternId && item.folderId === state.collections.activePatternFolder)) {
      state.collections.savedPatterns = [
        { patternId, folderId: state.collections.activePatternFolder, text, translation: example, savedAt: Date.now() },
        ...state.collections.savedPatterns
      ];
      await saveCollectionsState();
    }
    maybeCelebrate('Đã lưu sentence pattern vào vault của bạn.');
  }

  function shiftQuote(delta) {
    const length = DAILY_QUOTES.length;
    const nextIndex = (getCurrentQuoteIndex() + delta + length) % length;
    state.runtime.quoteIndex = nextIndex;
    state.runtime.selectedQuoteWordKey = '';
    renderDailySayingLauncher();
    renderDailySayingModal();
    renderFocusRoomModal();
  }

  async function toggleCurrentQuoteSaved() {
    const current = getCurrentQuote();
    const currentId = current.id;
    if (state.quotes.savedIds.includes(currentId)) {
      state.quotes.savedIds = state.quotes.savedIds.filter((id) => id !== currentId);
      state.collections.savedQuotes = state.collections.savedQuotes.filter((item) => item.quoteId !== currentId);
      await Promise.all([saveQuotesState(), saveCollectionsState()]);
      showToast('Đã bỏ lưu câu nói.');
      return;
    }
    state.quotes.savedIds = [currentId, ...state.quotes.savedIds.filter((id) => id !== currentId)];
    state.collections.savedQuotes = [
      { quoteId: currentId, folderId: state.collections.activeQuoteFolder, title: current.title, translation: current.translation, savedAt: Date.now() },
      ...state.collections.savedQuotes.filter((item) => item.quoteId !== currentId)
    ];
    await Promise.all([saveQuotesState(), saveCollectionsState()]);
    maybeCelebrate('Đã lưu câu nói này vào bộ sưu tập của bạn.');
  }

  function getSelectedQuoteWord() {
    return getQuoteFocusWords().find((item) => item.wordKey === state.runtime.selectedQuoteWordKey) || null;
  }

  function speakText(text) {
    if (!('speechSynthesis' in window) || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }

  function speakSelectedQuoteWord() {
    const selected = getSelectedQuoteWord();
    if (!selected) return showToast('Chọn một từ trước.');
    speakText(selected.word);
  }

  function buildQuoteVocabEntry(selected) {
    return {
      id: `quote-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      word: selected.word,
      phonetic: '',
      meaning: selected.meaning || 'Chưa có nghĩa',
      wordType: selected.wordType || 'quote word',
      example: getCurrentQuote().title,
      notes: `Lưu từ Quote → Vocabulary mode. ${selected.note || ''}`.trim(),
      wordset: 'Quote Vocabulary',
      createdAt: Date.now(),
      isLearned: false,
      review: {
        streak: 0,
        wrongCount: 0,
        correctCount: 0,
        hardCount: 0,
        seenCount: 0,
        lapseCount: 0,
        dueAt: 0,
        lastReviewedAt: 0,
        confidence: 0
      }
    };
  }

  async function saveSelectedQuoteWordToVocabulary() {
    const selected = getSelectedQuoteWord();
    if (!selected) return showToast('Chọn một từ trước.');
    const wordKey = normalizeWordKey(selected.word);
    const exists = state.vocab.some((item) => normalizeWordKey(item.word) === wordKey);
    if (!exists) {
      const nextVocab = [buildQuoteVocabEntry(selected), ...state.vocab];
      state.vocab = nextVocab;
      await storage.set({ vocab: nextVocab });
    }
    const alreadySaved = state.collections.savedWords.some((item) => item.wordKey === wordKey && item.folderId === state.collections.activeWordFolder);
    if (!alreadySaved) {
      state.collections.savedWords = [
        { wordKey, folderId: state.collections.activeWordFolder, word: selected.word, meaning: selected.meaning, example: getCurrentQuote().title, savedAt: Date.now() },
        ...state.collections.savedWords
      ];
      await saveCollectionsState();
    }
    byId('reviewSetDropdown')?.dispatchEvent(new Event('change'));
    maybeCelebrate(exists ? 'Từ này đã có trong bộ từ, đã thêm vào bộ sưu tập.' : 'Đã thêm từ vào Quote Vocabulary để ôn sau.');
  }

  async function saveCurrentQuotePattern() {
    const quote = getCurrentQuote();
    const pattern = getBestPatternForQuote(quote);
    const patternId = `pattern-${quote.id}`;
    if (!state.collections.savedPatterns.some((item) => item.patternId === patternId && item.folderId === state.collections.activePatternFolder)) {
      state.collections.savedPatterns = [
        { patternId, folderId: state.collections.activePatternFolder, text: pattern.pattern, translation: pattern.example || quote.translation, savedAt: Date.now() },
        ...state.collections.savedPatterns
      ];
      await saveCollectionsState();
    }
    maybeCelebrate('Đã lưu sentence pattern từ câu nói hôm nay.');
  }

  function getWeakWordsLocal(words) {
    return words.filter((word) => {
      const review = word?.review || {};
      const confidence = Number.isFinite(review.confidence) ? review.confidence : (word?.isLearned ? 4 : review.correctCount >= 2 ? 2 : 0);
      return confidence <= 1 || Number(review.wrongCount) > Number(review.correctCount);
    });
  }

  function getDueWordsLocal(words) {
    const now = Date.now();
    return words.filter((word) => Number(word?.review?.dueAt) && Number(word.review.dueAt) <= now);
  }

  function getNewWordsLocal(words) {
    return words.filter((word) => !(Number(word?.review?.seenCount) || 0) && !(Number(word?.review?.dueAt) || 0));
  }

  function getStageLabel(word) {
    const review = word?.review || {};
    const confidence = Number.isFinite(review.confidence) ? review.confidence : (word?.isLearned ? 4 : review.correctCount >= 2 ? 2 : 0);
    return ['Mới', 'Làm quen', 'Đang nhớ', 'Khá chắc', 'Rất vững'][Math.max(0, Math.min(4, confidence))] || 'Mới';
  }

  function pickFocusRoomWord() {
    const setName = byId('reviewSetDropdown')?.value || 'all';
    const words = setName === 'all' ? state.vocab : state.vocab.filter((item) => item.wordset === setName);
    if (!words.length) return null;
    const buckets = [getDueWordsLocal(words), getWeakWordsLocal(words), getNewWordsLocal(words), words];
    const pool = buckets.find((bucket) => bucket.length) || words;
    const index = Math.abs(Number(state.runtime.focusRoomSeed) || 0) % pool.length;
    return pool[index];
  }

  function renderFocusRoomModal() {
    const word = pickFocusRoomWord();
    const quote = getCurrentQuote();
    setText('focusRoomQuoteTitle', quote.title);
    setText('focusRoomQuoteTranslation', quote.translation);
    setText('focusRoomPomodoro', formatClock(Math.max(0, state.runtime.remainingSec)));
    if (!word) {
      setText('focusRoomWord', 'Chưa có từ');
      setText('focusRoomPhonetic', '');
      setText('focusRoomMeaning', 'Hãy thêm vài từ để mở Focus Room.');
      setText('focusRoomNote', 'Khi có dữ liệu, Focus Room sẽ chọn 1 từ ưu tiên từ bộ đang ôn.');
      setText('focusRoomWordStatus', 'Đang chờ dữ liệu');
      setText('focusRoomWordSet', '');
      return;
    }
    setText('focusRoomWord', word.word || 'word');
    setText('focusRoomPhonetic', word.phonetic || '/—/');
    setText('focusRoomMeaning', word.meaning || 'Chưa có nghĩa');
    setText('focusRoomNote', word.notes || 'Từ ưu tiên từ bộ đang học hiện tại.');
    setText('focusRoomWordStatus', getStageLabel(word));
    setText('focusRoomWordSet', word.wordset || 'Quote Vocabulary');
    byId('focusRoomMeaning')?.classList.add('focus-room-meaning-hidden');
  }

  function nextFocusRoomWord() {
    state.runtime.focusRoomSeed += 1;
    renderFocusRoomModal();
  }

  function toggleFocusRoomMeaning() {
    byId('focusRoomMeaning')?.classList.toggle('focus-room-meaning-hidden');
  }

  function speakCurrentFocusWord() {
    const word = pickFocusRoomWord();
    if (!word) return;
    speakText(word.word);
  }

  async function saveCurrentFocusWordToCollection() {
    const word = pickFocusRoomWord();
    if (!word) return showToast('Chưa có từ để lưu.');
    const wordKey = normalizeWordKey(word.word);
    if (!state.collections.savedWords.some((item) => item.wordKey === wordKey && item.folderId === state.collections.activeWordFolder)) {
      state.collections.savedWords = [
        { wordKey, folderId: state.collections.activeWordFolder, word: word.word, meaning: word.meaning, example: word.example || '', savedAt: Date.now() },
        ...state.collections.savedWords
      ];
      await saveCollectionsState();
    }
    maybeCelebrate('Đã lưu từ này vào bộ sưu tập.');
  }

  function startFocusRoomStudy() {
    const word = pickFocusRoomWord();
    if (!word) return showToast('Chưa có từ để bắt đầu.');
    closeModal('focusRoomModal');
    const dueSet = new Set(getDueWordsLocal(state.vocab).map((item) => item.id));
    const weakSet = new Set(getWeakWordsLocal(state.vocab).map((item) => item.id));
    const newSet = new Set(getNewWordsLocal(state.vocab).map((item) => item.id));
    if (dueSet.has(word.id)) byId('startDueFocusBtn')?.click();
    else if (weakSet.has(word.id)) byId('startWeakFocusBtn')?.click();
    else if (newSet.has(word.id)) byId('startNewFocusBtn')?.click();
    else byId('startRecommendedBtn')?.click();
  }

  function filterSavedByFolder(items, folderId) {
    return items.filter((item) => item.folderId === folderId);
  }

  function renderCollectionsModal() {
    if (!state.collections) return;
    renderFolderOptions('collectionQuoteFolderSelect', state.collections.quoteFolders, state.collections.activeQuoteFolder);
    renderFolderOptions('collectionWordFolderSelect', state.collections.wordFolders, state.collections.activeWordFolder);
    renderFolderOptions('collectionPatternFolderSelect', state.collections.patternFolders, state.collections.activePatternFolder);
    renderFolderOptions('dailyQuoteFolderSelect', state.collections.quoteFolders, state.collections.activeQuoteFolder);
    renderFolderOptions('dailyWordFolderSelect', state.collections.wordFolders, state.collections.activeWordFolder);
    renderFolderOptions('dailyPatternFolderSelect', state.collections.patternFolders, state.collections.activePatternFolder);

    const quoteItems = filterSavedByFolder(state.collections.savedQuotes, state.collections.activeQuoteFolder);
    const wordItems = filterSavedByFolder(state.collections.savedWords, state.collections.activeWordFolder);
    const patternItems = filterSavedByFolder(state.collections.savedPatterns, state.collections.activePatternFolder);

    setText('collectionQuoteCount', `${quoteItems.length} mục`);
    setText('collectionWordCount', `${wordItems.length} mục`);
    setText('collectionPatternCount', `${patternItems.length} mục`);

    renderSavedGrid('collectionQuoteGrid', quoteItems, 'quote');
    renderSavedGrid('collectionWordGrid', wordItems, 'word');
    renderSavedGrid('collectionPatternGrid', patternItems, 'pattern');
  }

  function renderSavedGrid(id, items, type) {
    const grid = byId(id);
    if (!grid) return;
    if (!items.length) {
      grid.innerHTML = '<div class="muted-text">Chưa có mục nào trong folder này.</div>';
      return;
    }
    grid.innerHTML = items.map((item) => {
      if (type === 'quote') {
        return `<div class="saved-item-card"><strong>${escapeHtml(item.title || '')}</strong><span>${escapeHtml(item.translation || '')}</span><button class="secondary-btn" data-remove-type="quote" data-remove-id="${escapeHtml(item.quoteId)}">Xóa</button></div>`;
      }
      if (type === 'word') {
        return `<div class="saved-item-card"><strong>${escapeHtml(item.word || '')}</strong><span>${escapeHtml(item.meaning || '')}</span><button class="secondary-btn" data-remove-type="word" data-remove-id="${escapeHtml(item.wordKey)}">Xóa</button></div>`;
      }
      return `<div class="saved-item-card"><strong>${escapeHtml(item.text || '')}</strong><span>${escapeHtml(item.translation || '')}</span><button class="secondary-btn" data-remove-type="pattern" data-remove-id="${escapeHtml(item.patternId)}">Xóa</button></div>`;
    }).join('');
  }

  async function handleCollectionGridClick(event) {
    const button = event.target.closest('button[data-remove-type]');
    if (!button) return;
    const type = button.dataset.removeType;
    const removeId = button.dataset.removeId;
    if (type === 'quote') {
      state.collections.savedQuotes = state.collections.savedQuotes.filter((item) => item.quoteId !== removeId || item.folderId !== state.collections.activeQuoteFolder);
      state.quotes.savedIds = state.quotes.savedIds.filter((id) => id !== removeId);
      await Promise.all([saveCollectionsState(), saveQuotesState()]);
    }
    if (type === 'word') {
      state.collections.savedWords = state.collections.savedWords.filter((item) => !(item.wordKey === removeId && item.folderId === state.collections.activeWordFolder));
      await saveCollectionsState();
    }
    if (type === 'pattern') {
      state.collections.savedPatterns = state.collections.savedPatterns.filter((item) => !(item.patternId === removeId && item.folderId === state.collections.activePatternFolder));
      await saveCollectionsState();
    }
  }

  async function createCollectionFolder(type) {
    const label = type === 'quote' ? 'folder quote' : type === 'word' ? 'folder từ' : 'folder pattern';
    const name = window.prompt(`Tên ${label} mới:`)?.trim();
    if (!name) return;
    const id = `${type}-${Date.now()}`;
    if (type === 'quote') {
      state.collections.quoteFolders.push({ id, name });
      state.collections.activeQuoteFolder = id;
    }
    if (type === 'word') {
      state.collections.wordFolders.push({ id, name });
      state.collections.activeWordFolder = id;
    }
    if (type === 'pattern') {
      state.collections.patternFolders.push({ id, name });
      state.collections.activePatternFolder = id;
    }
    await saveCollectionsState();
    showToast(`Đã tạo ${label} mới.`);
  }

  function getRecentDateKeys(days = 7) {
    const keys = [];
    const today = new Date();
    for (let i = 0; i < days; i += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      keys.push(date.toISOString().slice(0, 10));
    }
    return keys;
  }

  function summarizeSessionHistory(dateKeys) {
    const allowed = new Set(dateKeys);
    const sessions = Array.isArray(state.stats.sessionHistory)
      ? state.stats.sessionHistory.filter((entry) => allowed.has(entry.dateKey))
      : [];
    return sessions.reduce((acc, entry) => {
      acc.count += 1;
      acc.totalCards += Math.max(0, Number(entry.total) || 0);
      acc.durationSeconds += Math.max(0, Number(entry.durationSeconds) || 0);
      acc.good += Math.max(0, Number(entry.good) || 0);
      acc.hard += Math.max(0, Number(entry.hard) || 0);
      acc.again += Math.max(0, Number(entry.again) || 0);
      acc.strengthened += Math.max(0, Number(entry.strengthened) || 0);
      return acc;
    }, { count: 0, totalCards: 0, durationSeconds: 0, good: 0, hard: 0, again: 0, strengthened: 0 });
  }

  function renderWeeklyRecapModal() {
    const grid = byId('weeklyRecapGrid');
    const narrative = byId('weeklyRecapNarrative');
    if (!grid || !narrative) return;
    const last7 = getRecentDateKeys(7);
    const weeklyProgress = last7.reduce((acc, key) => {
      const item = state.stats.dailyProgress[key] || { studied: 0, correct: 0, hard: 0, again: 0 };
      acc.studied += Number(item.studied) || 0;
      acc.correct += Number(item.correct) || 0;
      acc.hard += Number(item.hard) || 0;
      acc.again += Number(item.again) || 0;
      return acc;
    }, { studied: 0, correct: 0, hard: 0, again: 0 });
    const weeklyFocus = (state.focus.history || []).filter((entry) => last7.includes(entry.dateKey));
    const focusMinutes = weeklyFocus.reduce((sum, entry) => sum + Number(entry.minutes || 0), 0);
    const sessionSummary = summarizeSessionHistory(last7);
    const reviewedWords = state.vocab.filter((word) => Number(word?.review?.lastReviewedAt) >= Date.now() - (7 * 24 * 60 * 60 * 1000)).length;
    const quotesSavedWeek = state.collections.savedQuotes.filter((item) => Number(item.savedAt) >= Date.now() - (7 * 24 * 60 * 60 * 1000)).length;
    const wordsSavedWeek = state.collections.savedWords.filter((item) => Number(item.savedAt) >= Date.now() - (7 * 24 * 60 * 60 * 1000)).length;
    const weakNow = computeStudyCounts(state.vocab).weak;
    const accuracyBase = weeklyProgress.correct + weeklyProgress.hard + weeklyProgress.again;
    const weeklyAccuracy = accuracyBase ? Math.round((weeklyProgress.correct / accuracyBase) * 100) : 0;
    const averageSessionMinutes = sessionSummary.count ? Math.round((sessionSummary.durationSeconds / sessionSummary.count) / 60) : 0;

    const cards = [
      { label: 'Lượt học', value: weeklyProgress.studied, note: 'tổng review trong 7 ngày' },
      { label: 'Phiên học', value: sessionSummary.count, note: `${averageSessionMinutes} phút / phiên trung bình` },
      { label: 'Pomodoro', value: weeklyFocus.length, note: `${focusMinutes} phút tập trung` },
      { label: 'Độ chính xác', value: `${weeklyAccuracy}%`, note: 'tỉ lệ trả lời đúng trong tuần' },
      { label: 'Từ đã đụng lại', value: reviewedWords, note: 'số từ được review trong tuần' },
      { label: 'Quote / từ đã lưu', value: `${quotesSavedWeek}/${wordsSavedWeek}`, note: 'quote / word saved trong tuần' },
      { label: 'Chuỗi hiện tại', value: state.stats.currentStreak, note: 'ngày giữ nhịp học' },
      { label: 'Từ yếu hiện tại', value: weakNow, note: 'để biết nên ưu tiên củng cố gì tiếp' }
    ];
    grid.innerHTML = cards.map((card) => `<div class="summary-card"><span class="summary-label">${escapeHtml(card.label)}</span><strong>${escapeHtml(String(card.value))}</strong><span class="summary-note">${escapeHtml(card.note)}</span></div>`).join('');
    narrative.innerHTML = `<strong>Tổng kết nhẹ:</strong><span>Bạn đã có ${weeklyProgress.studied} lượt học, ${sessionSummary.count} phiên học và ${focusMinutes} phút tập trung trong 7 ngày gần đây. ${sessionSummary.strengthened ? `Có ${sessionSummary.strengthened} lượt kéo mức nhớ lên.` : 'Tuần này vẫn nên tiếp tục ưu tiên các lượt ôn ngắn và đều.'} ${weakNow ? `Hiện còn ${weakNow} từ yếu cần kéo lên.` : 'Hiện chưa có cụm từ yếu nổi bật.'}</span>`;
  }

  function normalizeWordKey(word) {
    return String(word || '').toLowerCase().replace(/[^a-z]+/g, '');
  }

  function computeStudyCounts(vocab) {

    const now = Date.now();
    const counts = { total: vocab.length, due: 0, weak: 0, fresh: 0 };
    vocab.forEach((word) => {
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
