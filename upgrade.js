
document.addEventListener('DOMContentLoaded', () => {
  const THEMES = [
    { id: 'midnight', name: 'Midnight Core', price: 0, tag: 'Mặc định ổn định', companion: '📘', previewClass: 'theme-midnight' },
    { id: 'aurora', name: 'Aurora Glass', price: 90, tag: 'Xu hướng glass hiện đại', companion: '✨', previewClass: 'theme-aurora' },
    { id: 'latte', name: 'Cozy Latte', price: 80, tag: 'Tông ấm, học lâu dễ chịu', companion: '☕', previewClass: 'theme-latte' },
    { id: 'paper', name: 'Paper Minimal', price: 70, tag: 'Sạch, sáng, tập trung', companion: '📝', previewClass: 'theme-paper' },
    { id: 'neon', name: 'Neon Focus', price: 130, tag: 'Đậm tương phản, cá tính', companion: '⚡', previewClass: 'theme-neon' },
    { id: 'forest', name: 'Forest Focus', price: 95, tag: 'Xanh rêu dịu, hợp học dài', companion: '🌿', previewClass: 'theme-forest' },
    { id: 'rose', name: 'Rose Glow', price: 105, tag: 'Mềm, hiện đại, nổi bật nhẹ', companion: '🌸', previewClass: 'theme-rose' },
    { id: 'mono', name: 'Mono Studio', price: 75, tag: 'Xám tối tối giản, cực gọn', companion: '🖤', previewClass: 'theme-mono' }
  ];

  const CARD_STYLES = [
    { id: 'classic', name: 'Classic', price: 0, tag: 'Giữ nguyên cảm giác gốc', previewClass: 'style-classic' },
    { id: 'rounded', name: 'Soft Rounded', price: 60, tag: 'Bo tròn hiện đại', previewClass: 'style-rounded' },
    { id: 'notebook', name: 'Notebook', price: 85, tag: 'Cảm giác sổ tay học tập', previewClass: 'style-notebook' },
    { id: 'glass', name: 'Glass Card', price: 110, tag: 'Trong mờ kiểu app mới', previewClass: 'style-glass' },
    { id: 'focusboard', name: 'Focus Board', price: 95, tag: 'Khung gọn kiểu dashboard mới', previewClass: 'style-focusboard' }
  ];

  const LAYOUT_PACKS = [
    { id: 'classic', name: 'Classic Layout', price: 0, tag: 'Giữ nguyên bố cục gốc', previewClass: 'layout-classic' },
    { id: 'split', name: 'Split Dashboard', price: 80, tag: 'Khối gợi ý nổi bật hơn', previewClass: 'layout-split' },
    { id: 'stacked', name: 'Stacked Focus', price: 75, tag: 'Dọc, gọn, nhẹ áp lực', previewClass: 'layout-stacked' },
    { id: 'spotlight', name: 'Spotlight Hero', price: 120, tag: 'Nhấn mạnh khu vực trọng tâm', previewClass: 'layout-spotlight' },
    { id: 'compact', name: 'Compact Flow', price: 65, tag: 'Tối ưu popup nhỏ', previewClass: 'layout-compact' }
  ];

  const FONT_TONES = [
    { id: 'system', name: 'System Sans', price: 0, tag: 'Đọc nhanh, ổn định', previewClass: 'font-system' },
    { id: 'editorial', name: 'Editorial', price: 55, tag: 'Tinh tế như tạp chí', previewClass: 'font-editorial' },
    { id: 'rounded', name: 'Friendly Rounded', price: 60, tag: 'Thân thiện, mềm hơn', previewClass: 'font-rounded' },
    { id: 'mono', name: 'Mono Study', price: 50, tag: 'Gọn, thẳng hàng, kỹ thuật', previewClass: 'font-mono' }
  ];

  const QUOTE_STYLES = [
    { id: 'soft', name: 'Soft Rescue', price: 0, tag: 'Ấm, dịu, gần ảnh mẫu', previewClass: 'quote-soft' },
    { id: 'glass', name: 'Glass Whisper', price: 70, tag: 'Trong mờ, hiện đại', previewClass: 'quote-glass' },
    { id: 'letter', name: 'Letter Note', price: 75, tag: 'Giống tờ note cảm xúc', previewClass: 'quote-letter' },
    { id: 'spotlight', name: 'Spotlight Scene', price: 95, tag: 'Điện ảnh, nổi bật', previewClass: 'quote-spotlight' }
  ];

  const PRESET_DISCOUNT = 0.85;

  const PRESETS = [
    {
      id: 'classic-plus',
      name: 'Classic Plus',
      tag: 'Nâng cấp nhẹ, vẫn rất gốc',
      note: 'Giữ học là trung tâm, chỉ làm mọi thứ gọn và đẹp hơn.',
      theme: 'midnight',
      cardStyle: 'rounded',
      layoutPack: 'classic',
      fontTone: 'system',
      quoteStyle: 'soft'
    },
    {
      id: 'focus-studio',
      name: 'Focus Studio',
      tag: 'Premium tối, tập trung',
      note: 'Hợp người muốn nhìn hiện đại nhưng ít rối.',
      theme: 'mono',
      cardStyle: 'focusboard',
      layoutPack: 'split',
      fontTone: 'system',
      quoteStyle: 'glass'
    },
    {
      id: 'cozy-notes',
      name: 'Cozy Notes',
      tag: 'Ấm, mềm, học lâu',
      note: 'Hợp phong cách note, nhật ký, học dịu mắt.',
      theme: 'latte',
      cardStyle: 'notebook',
      layoutPack: 'stacked',
      fontTone: 'editorial',
      quoteStyle: 'letter'
    },
    {
      id: 'future-pop',
      name: 'Future Pop',
      tag: 'Khác biệt, hiện đại hơn',
      note: 'Dành cho người muốn popup trông mới lạ hơn hẳn.',
      theme: 'aurora',
      cardStyle: 'glass',
      layoutPack: 'spotlight',
      fontTone: 'rounded',
      quoteStyle: 'spotlight'
    }
  ];


const DAILY_QUOTES = [
  { id: 'q1', mood: 'gentle', badge: 'Câu nói mỗi ngày', title: 'You do not have to carry everything alone.', translation: 'Bạn không cần phải gánh mọi thứ một mình.', note: 'Một câu dịu để nhắc rằng chậm lại cũng không sao.' },
  { id: 'q2', mood: 'healing', badge: 'Daily rescue line', title: 'Resting is not falling behind.', translation: 'Nghỉ ngơi không có nghĩa là bạn đang tụt lại phía sau.', note: 'Hợp cho những ngày học nhiều và dễ tự trách bản thân.' },
  { id: 'q3', mood: 'romantic', badge: 'Saved phrase', title: "I pretend to look around, but I'm actually looking for you.", translation: 'Tôi giả vờ nhìn xung quanh, nhưng thật ra là đang tìm bạn.', note: 'Kiểu câu gợi cảm giác muốn lưu lại như ảnh bạn gửi.' },
  { id: 'q4', mood: 'calm', badge: 'Micro comfort', title: 'A kind word can change the whole evening.', translation: 'Một lời dịu dàng có thể thay đổi cả buổi tối.', note: 'Ngắn, dễ nhớ, tạo cảm giác được cứu vãn.' },
  { id: 'q5', mood: 'hope', badge: 'Small hope', title: 'You are allowed to begin again today.', translation: 'Hôm nay bạn được phép bắt đầu lại.', note: 'Một câu mạnh nhưng vẫn nhẹ.' },
  { id: 'q6', mood: 'focus', badge: 'Study reminder', title: 'One review now saves effort later.', translation: 'Một lần ôn lúc này sẽ tiết kiệm công sức về sau.', note: 'Giữ đúng tinh thần học tập của extension.' },
  { id: 'q7', mood: 'warm', badge: 'Gentle note', title: 'Your heart deserves softer words.', translation: 'Trái tim bạn xứng đáng với những lời nhẹ nhàng hơn.', note: 'Hợp giao diện note, letter hoặc rescue.' },
  { id: 'q8', mood: 'steady', badge: 'Study calm', title: 'Even slow learning still becomes fluency.', translation: 'Ngay cả việc học chậm cũng vẫn có thể trở thành sự trôi chảy.', note: 'Nhắc người học nhớ lâu quan trọng hơn học gấp.' },
  { id: 'q9', mood: 'quiet', badge: 'Quiet support', title: 'You can be tired and still be trying.', translation: 'Bạn có thể mệt mà vẫn đang cố gắng.', note: 'Dành cho những ngày muốn buông nhưng chưa bỏ cuộc.' },
  { id: 'q10', mood: 'soft', badge: 'Soft focus', title: 'A calm mind remembers better.', translation: 'Một tâm trí bình tĩnh sẽ nhớ tốt hơn.', note: 'Rất hợp màn hình ôn tập và nhịp học bền.' },
  { id: 'q11', mood: 'gentle', badge: 'Tiny rescue', title: 'You do not have to rush to be real.', translation: 'Bạn không cần phải vội mới trở nên đủ thật.', note: 'Nhẹ, lạ, và có chiều sâu hơn câu động lực thường thấy.' },
  { id: 'q12', mood: 'focus', badge: 'Study line', title: 'Small progress is still progress.', translation: 'Tiến bộ nhỏ vẫn là tiến bộ.', note: 'Một câu rất hợp cho phần học lâu dài.' },
  { id: 'q13', mood: 'healing', badge: 'Rescue note', title: 'Be kind to yourself while you are learning.', translation: 'Hãy dịu dàng với chính mình trong lúc học.', note: 'Giữ app đẹp nhưng vẫn bám mục tiêu học.' },
  { id: 'q14', mood: 'romantic', badge: 'Letter line', title: 'I kept the quiet part of the day for you.', translation: 'Mình giữ lại phần yên tĩnh của ngày cho bạn.', note: 'Lãng mạn nhưng không quá sến, hợp quote card.' },
  { id: 'q15', mood: 'steady', badge: 'Long-term memory', title: 'What you repeat with care will stay with you.', translation: 'Điều bạn lặp lại bằng sự chăm chút sẽ ở lại với bạn.', note: 'Nhấn mạnh sự ghi nhớ lâu dài.' },
  { id: 'q16', mood: 'night', badge: 'Late-night note', title: 'Tonight can still end gently.', translation: 'Tối nay vẫn có thể kết thúc một cách dịu dàng.', note: 'Hợp giao diện tối và mood yên.' },
  { id: 'q17', mood: 'hope', badge: 'New page', title: 'A new page can start with one sentence.', translation: 'Một trang mới có thể bắt đầu chỉ với một câu.', note: 'Nhỏ nhưng có cảm giác mở ra.' },
  { id: 'q18', mood: 'warm', badge: 'Daily warmth', title: 'Some words feel like a hand on your shoulder.', translation: 'Có những lời giống như một bàn tay đặt nhẹ lên vai bạn.', note: 'Đúng tinh thần “being saved”.' },
  { id: 'q19', mood: 'focus', badge: 'Review cue', title: 'Review with patience, not panic.', translation: 'Hãy ôn với sự kiên nhẫn, không phải hoảng hốt.', note: 'Rất hợp người dễ áp lực khi học.' },
  { id: 'q20', mood: 'gentle', badge: 'Soft reminder', title: 'You are still doing enough for today.', translation: 'Bạn vẫn đang làm đủ cho hôm nay rồi.', note: 'Một câu dịu giúp giảm áp lực.' },
  { id: 'q21', mood: 'romantic', badge: 'Quiet confession', title: 'I looked away first, but not because I wanted to.', translation: 'Mình là người nhìn đi chỗ khác trước, nhưng không phải vì muốn thế.', note: 'Dành cho các quote card thiên cảm xúc.' },
  { id: 'q22', mood: 'calm', badge: 'Breathing space', title: 'Take a breath. Then one more step.', translation: 'Hít một hơi. Rồi thêm một bước nữa thôi.', note: 'Đơn giản và rất dễ nhớ.' },
  { id: 'q23', mood: 'healing', badge: 'Kind rescue', title: 'Not every day has to be impressive to be meaningful.', translation: 'Không phải ngày nào cũng cần ấn tượng mới trở nên có ý nghĩa.', note: 'Một câu có chiều sâu mà vẫn gần gũi.' },
  { id: 'q24', mood: 'study', badge: 'Memory note', title: 'Slow review builds strong memory.', translation: 'Ôn chậm tạo nên trí nhớ vững.', note: 'Rất hợp mục tiêu học bền và nhớ lâu.' },
  { id: 'q25', mood: 'soft', badge: 'Quiet comfort', title: 'Let today be gentle with you.', translation: 'Hãy để hôm nay dịu dàng với bạn.', note: 'Ngắn, nhẹ, rất hợp ảnh quote.' },
  { id: 'q26', mood: 'hope', badge: 'Tomorrow line', title: 'You can meet tomorrow with a softer heart.', translation: 'Bạn có thể gặp ngày mai với một trái tim mềm hơn.', note: 'Tạo cảm giác khép lại một ngày đẹp.' },
  { id: 'q27', mood: 'focus', badge: 'Study patience', title: 'Learning stays longer when you stop fighting yourself.', translation: 'Việc học sẽ ở lại lâu hơn khi bạn ngừng chống lại chính mình.', note: 'Hợp người học dài hạn và dễ tự ép bản thân.' },
  { id: 'q28', mood: 'romantic', badge: 'Film line', title: 'Some people arrive like a sentence you keep rereading.', translation: 'Có những người đến như một câu mà bạn cứ muốn đọc lại.', note: 'Rất hợp quote card có hình.' },
  { id: 'q29', mood: 'steady', badge: 'Small habit', title: 'A little every day can change everything later.', translation: 'Mỗi ngày một chút có thể thay đổi mọi thứ về sau.', note: 'Một câu nền rất ổn cho app học.' },
  { id: 'q30', mood: 'night', badge: 'Midnight glass', title: 'Quiet does not mean empty.', translation: 'Yên lặng không có nghĩa là trống rỗng.', note: 'Hợp theme glass, dark, midnight.' },
  { id: 'q31', mood: 'warm', badge: 'Safe line', title: 'You deserve a place where your mind can soften.', translation: 'Bạn xứng đáng có một nơi để tâm trí mình mềm lại.', note: 'Cảm giác như app là nơi trú nhẹ.' },
  { id: 'q32', mood: 'study', badge: 'Retention cue', title: 'Memory grows in calm repetition.', translation: 'Trí nhớ lớn lên trong sự lặp lại bình tĩnh.', note: 'Rất đúng mục tiêu long-term memory.' },
  { id: 'q33', mood: 'gentle', badge: 'Soft page', title: 'Maybe this sentence is enough for today.', translation: 'Có lẽ câu này là đủ cho hôm nay rồi.', note: 'Câu kết nhẹ và đáng lưu.' },
  { id: 'q34', mood: 'hope', badge: 'Keep going', title: 'You are closer than your doubts say.', translation: 'Bạn gần hơn những gì nỗi nghi ngờ nói với bạn.', note: 'Một câu động viên nhưng không ồn.' },
  { id: 'q35', mood: 'romantic', badge: 'Saved scene', title: 'I was not searching for a sign until you felt like one.', translation: 'Mình vốn không tìm một dấu hiệu nào, cho đến khi bạn giống như một dấu hiệu.', note: 'Câu có chất điện ảnh hơn.' },
  { id: 'q36', mood: 'calm', badge: 'Ease note', title: 'You can learn deeply without being harsh.', translation: 'Bạn vẫn có thể học sâu mà không cần quá khắt khe.', note: 'Giữ app đẹp nhưng không làm người học mệt.' },
  { id: 'q37', mood: 'focus', badge: 'Focus cue', title: 'A clear minute is better than a noisy hour.', translation: 'Một phút rõ ràng vẫn tốt hơn một giờ ồn ào.', note: 'Hợp phần Pomodoro và focus mode.' },
  { id: 'q38', mood: 'warm', badge: 'Gentle saving', title: 'Sometimes one sentence is enough to keep going.', translation: 'Đôi khi chỉ một câu thôi cũng đủ để đi tiếp.', note: 'Rất đúng cảm giác user muốn lưu lại.' },
  { id: 'q39', mood: 'night', badge: 'Late calm', title: 'The night is softer when you stop proving yourself to it.', translation: 'Đêm sẽ dịu hơn khi bạn ngừng cố chứng minh bản thân với nó.', note: 'Mood tối, trầm, hợp glass.' },
  { id: 'q40', mood: 'study', badge: 'Smart review', title: 'Understanding once is good. Returning is better.', translation: 'Hiểu một lần là tốt. Quay lại ôn còn tốt hơn.', note: 'Giúp kéo người dùng về đúng mục tiêu học.' }
];

  const SHOP_CONFIG = {
    theme: { items: THEMES, activeKey: 'theme', unlockedKey: 'unlockedThemes', label: 'theme' },
    card: { items: CARD_STYLES, activeKey: 'cardStyle', unlockedKey: 'unlockedCardStyles', label: 'card style' },
    layout: { items: LAYOUT_PACKS, activeKey: 'layoutPack', unlockedKey: 'unlockedLayoutPacks', label: 'layout' },
    font: { items: FONT_TONES, activeKey: 'fontTone', unlockedKey: 'unlockedFontTones', label: 'font tone' },
    quote: { items: QUOTE_STYLES, activeKey: 'quoteStyle', unlockedKey: 'unlockedQuoteStyles', label: 'quote style' }
  };

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
    spentCoins: 0,
    bonusCoins: 0,
    quotes: null,
    runtime: {
      remainingSec: 25 * 60,
      intervalId: null,
      isRunning: false,
      quoteIndex: null
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
    if (reviewView && !byId('upgradeHub')) {
      const anchor = byId('dailyFocusGrid') || reviewView.firstElementChild;
      const wrapper = document.createElement('div');
      wrapper.id = 'upgradeHub';
      wrapper.innerHTML = `
        <div id="upgradeRewardBar" class="upgrade-reward-bar panel-card">
          <div class="reward-summary-row">
            <div class="reward-pill"><span>🟡</span><strong id="walletAvailableCoins">0</strong><small>xu giao diện khả dụng</small></div>
            <div class="reward-pill"><span>🎨</span><strong id="walletThemeName">Midnight Core</strong><small>giao diện đang dùng</small></div>
            <div class="reward-pill"><span>🍅</span><strong id="walletPomodoroToday">0</strong><small>pomodoro hôm nay</small></div>
            <div class="reward-pill"><span>🪄</span><strong id="walletLayoutName">Classic Layout</strong><small>bố cục đang dùng</small></div>
          </div>
          <div class="reward-action-row">
            <button id="openCustomizationBtn" class="secondary-btn">🎨 Tùy biến UI</button>
            <button id="openPomodoroBtn" class="secondary-btn">🍅 Pomodoro</button>
            <button id="openProgressBoosterBtn" class="secondary-btn">🎯 Nhiệm vụ hôm nay</button>
            <button id="openDailySayingBtn" class="secondary-btn">💬 Câu nói mỗi ngày</button>
          </div>
          <div class="reward-mini-note" id="rewardMiniNote">Hoàn thành phiên học, Pomodoro và chuỗi ngày để mở khóa giao diện mới mà không đổi mục tiêu học từ.</div>
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
              <div class="wallet-stat"><span>Xu đang có</span><strong id="modalAvailableCoins">0</strong></div>
              <div class="wallet-stat"><span>Đã kiếm từ học</span><strong id="modalEarnedCoins">0</strong></div>
              <div class="wallet-stat"><span>Thưởng tập trung</span><strong id="modalBonusCoins">0</strong></div>
              <div class="wallet-stat"><span>Đã tiêu cho giao diện</span><strong id="modalSpentCoins">0</strong></div>
            </div>

            <div class="classic-safe-note">
              <strong>Classic mode luôn được giữ lại.</strong>
              <span>Bạn chỉ mở thêm style packs, layout packs, font packs và quote packs để giao diện đa dạng hơn mà không ảnh hưởng tính năng học cũ.</span>
            </div>

            <div class="customizer-section">
              <div class="section-title-row">
                <h3>Preset 1 chạm</h3>
                <span class="muted-text">Bấm vào preset để mở đủ các phần còn thiếu và áp dụng ngay trong một lần.</span>
              </div>
              <div id="presetGrid" class="theme-shop-grid preset-grid"></div>
            </div>

            <div class="customizer-section">
              <div class="section-title-row">
                <h3>Theme shop</h3>
                <span class="muted-text">Thay đổi bầu không khí tổng thể.</span>
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
                <p class="muted-text">Mỗi ngày hệ thống tự xoay sang một câu mới trong bộ quote lớn để hạn chế lặp lại. Ở màn hình ôn tập nó chỉ hiện như một nút nhỏ, bấm vào mới mở card lớn.</p>
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
    byId('openDailySayingBtn')?.addEventListener('click', openDailySayingModal);
    byId('dailySayingLauncher')?.addEventListener('click', openDailySayingModal);
    byId('dailyQuotePrevBtn')?.addEventListener('click', () => shiftQuote(-1));
    byId('dailyQuoteNextBtn')?.addEventListener('click', () => shiftQuote(1));
    byId('saveDailyQuoteBtn')?.addEventListener('click', toggleCurrentQuoteSaved);

    document.querySelectorAll('[data-close-modal]').forEach((btn) => {
      btn.addEventListener('click', () => closeModal(btn.getAttribute('data-close-modal')));
    });

    ['customizationModal', 'pomodoroModal', 'dailySayingModal'].forEach((modalId) => {
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
    byId('layoutPackGrid')?.addEventListener('click', handleCustomizerClick);
    byId('fontPackGrid')?.addEventListener('click', handleCustomizerClick);
    byId('quoteStyleGrid')?.addEventListener('click', handleCustomizerClick);
    byId('presetGrid')?.addEventListener('click', handlePresetClick);

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

    document.querySelectorAll('.nav-btn').forEach((btn) => btn.addEventListener('click', () => {
      window.setTimeout(renderUpgradeLayer, 60);
    }));
    byId('reviewSetDropdown')?.addEventListener('change', () => window.setTimeout(renderUpgradeLayer, 60));

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'local') return;
      if (changes.stats) state.stats = normalizeStats(changes.stats.newValue || {});
      if (changes.vocab) state.vocab = Array.isArray(changes.vocab.newValue) ? changes.vocab.newValue : [];
      if (changes.vm_ui) state.ui = normalizeUiState(changes.vm_ui.newValue || {});
      if (changes.vm_quotes) state.quotes = normalizeQuotesState(changes.vm_quotes.newValue || {});
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
      vm_quotes: {},
      vm_spentCoins: 0,
      vm_bonusCoins: 0
    });

    state.stats = normalizeStats(result.stats || {});
    state.vocab = Array.isArray(result.vocab) ? result.vocab : [];
    state.ui = normalizeUiState(result.vm_ui || {});
    state.focus = normalizeFocusState(result.vm_focus || {});
    state.quotes = normalizeQuotesState(result.vm_quotes || {});
    state.spentCoins = Math.max(0, Number(result.vm_spentCoins) || 0);
    state.bonusCoins = Math.max(0, Number(result.vm_bonusCoins) || 0);
    await ensureDailyQuoteFreshness();
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
      density: ['compact', 'balanced', 'comfortable'].includes(raw.density) ? raw.density : 'balanced'
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
    return state.ui[SHOP_CONFIG[kind].unlockedKey];
  }

  function getActive(kind) {
    return state.ui[SHOP_CONFIG[kind].activeKey];
  }

  function openModal(id) {
    byId(id)?.classList.remove('hidden');
  }

  function closeModal(id) {
    byId(id)?.classList.add('hidden');
  }

  function openDailySayingModal() {
    state.runtime.quoteIndex = getTodayQuoteIndex();
    renderDailySayingModal();
    openModal('dailySayingModal');
  }

  function getAvailableCoins() {
    return Math.max(0, (Number(state.stats.coins) || 0) + state.bonusCoins - state.spentCoins);
  }

  function applyUiPreferences() {
    document.body.dataset.uiTheme = state.ui.theme;
    document.body.dataset.uiCardStyle = state.ui.cardStyle;
    document.body.dataset.uiLayout = state.ui.layoutPack;
    document.body.dataset.uiFontTone = state.ui.fontTone;
    document.body.dataset.uiQuoteStyle = state.ui.quoteStyle;
    document.body.dataset.uiDensity = state.ui.density;
    document.body.classList.toggle('reduced-motion', !state.ui.motionEnabled);

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
    renderPomodoroWidgets();
  }

  function renderWalletBar() {
    const available = getAvailableCoins();
    const counts = computeStudyCounts(state.vocab);
    setText('walletAvailableCoins', String(available));
    setText('walletThemeName', getMeta('theme', state.ui.theme).name);
    setText('walletPomodoroToday', String(state.focus.completedToday));
    setText('walletLayoutName', getMeta('layout', state.ui.layoutPack).name);
    setText('modalAvailableCoins', String(available));
    setText('modalEarnedCoins', String(Number(state.stats.coins) || 0));
    setText('modalBonusCoins', String(state.bonusCoins));
    setText('modalSpentCoins', String(state.spentCoins));

    const note = byId('rewardMiniNote');
    if (note) {
      if (counts.weak) {
        note.textContent = `Bạn còn ${counts.weak} từ yếu. Có thể giữ classic mode để học như cũ, hoặc mở thêm layout/style mới mà không ảnh hưởng logic ôn tập.`;
      } else {
        note.textContent = `Classic mode vẫn còn nguyên. Hiện tại bạn đang dùng ${getMeta('theme', state.ui.theme).name} + ${getMeta('layout', state.ui.layoutPack).name}.`;
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

  function renderCustomizer() {
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
  const available = getAvailableCoins();

  PRESETS.forEach((preset) => {
    const ready = isPresetReady(preset);
    const active = isPresetActive(preset);
    const missingItems = getPresetMissingItems(preset);
    const bundlePrice = getPresetBundlePrice(preset);
    const canUnlock = ready || bundlePrice <= available;
    const statusLabel = active
      ? 'Đang dùng'
      : ready
        ? 'Sẵn sàng'
        : `Thiếu ${missingItems.length} pack • ${bundlePrice} xu`;
    const buttonLabel = active
      ? 'Đang dùng'
      : ready
        ? 'Áp dụng preset'
        : `Mở đủ + áp dụng (${bundlePrice} xu)`;
    const helperNote = ready
      ? 'Bạn đã có đủ các phần của preset này.'
      : `Preset 1 chạm sẽ tự mở ${missingItems.map((item) => item.meta.name).join(', ')} rồi áp dụng ngay.`;

    const card = document.createElement('div');
    card.className = `shop-card preset-card ${active ? 'active' : ''}`;
    card.innerHTML = `
      <div class="shop-card-preview preset-preview ${escapeHtml(getMeta('theme', preset.theme).previewClass)}">
        <div class="preset-preview-note">${escapeHtml(preset.tag)}</div>
        <div class="preset-preview-title">${escapeHtml(preset.name)}</div>
        <div class="preset-preview-stack">
          <span>${escapeHtml(getMeta('layout', preset.layoutPack).name)}</span>
          <span>${escapeHtml(getMeta('quote', preset.quoteStyle).name)}</span>
        </div>
      </div>
      <div class="shop-card-head">
        <div>
          <strong>${escapeHtml(preset.name)}</strong>
          <div class="shop-tag">${escapeHtml(preset.note)}</div>
        </div>
        <span class="shop-price">${escapeHtml(statusLabel)}</span>
      </div>
      <div class="shop-tag preset-helper-note">${escapeHtml(helperNote)}</div>
      <div class="shop-actions">
        <button class="${ready || active ? 'primary-btn' : 'secondary-btn'}" data-preset-id="${preset.id}" ${!canUnlock && !active ? 'disabled' : ''}>${escapeHtml(buttonLabel)}</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function isPresetReady(preset) {
  return getPresetMissingItems(preset).length === 0;
}

function getPresetMissingItems(preset) {
  const checks = [
    ['theme', preset.theme],
    ['card', preset.cardStyle],
    ['layout', preset.layoutPack],
    ['font', preset.fontTone],
    ['quote', preset.quoteStyle]
  ];

  return checks
    .filter(([kind, id]) => !getUnlocked(kind).includes(id))
    .map(([kind, id]) => ({ kind, id, meta: getMeta(kind, id) }));
}

function getPresetBundlePrice(preset) {
  const total = getPresetMissingItems(preset).reduce((sum, item) => sum + (Number(item.meta?.price) || 0), 0);
  return total > 0 ? Math.max(0, Math.round(total * PRESET_DISCOUNT)) : 0;
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
    if (!isPresetReady(preset)) {
      showToast('Preset này cần mở đủ các packs trước khi áp dụng.');
      return;
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

  async function saveFocusState() {
    renderUpgradeLayer();
    await storage.set({ vm_focus: state.focus });
  }

  async function saveQuotesState() {
    renderUpgradeLayer();
    await storage.set({ vm_quotes: state.quotes });
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
    state.runtime.isRunning = true;
    renderPomodoroWidgets();
    state.runtime.intervalId = window.setInterval(async () => {
      state.runtime.remainingSec -= 1;
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
    const total = state.focus.preferredMinutes * 60;
    const remaining = Math.max(0, state.runtime.remainingSec);
    const formatted = formatClock(remaining);

    setText('pomodoroClock', formatted);
    setText('pomodoroMiniClock', formatted);
    setText('pomodoroTodayKpi', String(state.focus.completedToday));
    setText('pomodoroTotalKpi', String(state.focus.totalCompleted));
    setText('pomodoroRewardKpi', String(state.focus.rewardPerSession));

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

    const miniToggle = byId('pomodoroMiniToggleBtn');
    if (miniToggle) miniToggle.textContent = state.runtime.isRunning ? '❚❚' : '▶';
    byId('pomodoroMiniWidget')?.classList.toggle('running', state.runtime.isRunning);

    if (byId('pomodoroMinutesSelect')) byId('pomodoroMinutesSelect').value = String(state.focus.preferredMinutes);
    if (byId('pomodoroAutoLaunch')) byId('pomodoroAutoLaunch').checked = state.focus.autoLaunchRecommended;
  }

  function renderDailySayingLauncher() {
    const quote = getTodayQuote();
    setText('dailyLauncherTitle', quote.title);
    setText('dailyLauncherNote', quote.translation);
    setText('dailyLauncherMood', quote.mood);
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
    setText('savedQuotesCount', String(state.quotes.savedIds.length));
    setText('currentQuoteStyleName', getMeta('quote', state.ui.quoteStyle).name);

    const saveBtn = byId('saveDailyQuoteBtn');
    if (saveBtn) {
      saveBtn.textContent = saved ? '♥ Đã lưu' : '♡ Lưu';
      saveBtn.classList.toggle('saved', saved);
    }
  }

  function shiftQuote(delta) {
    const length = DAILY_QUOTES.length;
    const nextIndex = (getCurrentQuoteIndex() + delta + length) % length;
    state.runtime.quoteIndex = nextIndex;
    renderDailySayingLauncher();
    renderDailySayingModal();
  }

  async function toggleCurrentQuoteSaved() {
    const currentId = getCurrentQuote().id;
    if (state.quotes.savedIds.includes(currentId)) {
      state.quotes.savedIds = state.quotes.savedIds.filter((id) => id !== currentId);
      await saveQuotesState();
      showToast('Đã bỏ lưu câu nói.');
      return;
    }
    state.quotes.savedIds = [currentId, ...state.quotes.savedIds.filter((id) => id !== currentId)];
    await saveQuotesState();
    maybeCelebrate('Đã lưu câu nói này vào bộ sưu tập nhỏ của bạn.');
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
