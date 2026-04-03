window.VMUpgradeData = (() => {
const THEMES = [
  { id: 'midnight', name: 'Midnight Core', price: 0, tag: 'Mặc định ổn định', companion: '📘', previewClass: 'theme-midnight' },
  { id: 'aurora', name: 'Aurora Glass', price: 90, tag: 'Xu hướng glass hiện đại', companion: '✨', previewClass: 'theme-aurora' },
  { id: 'liquidglass', name: 'Liquid Glass', price: 140, tag: 'Liquid glass trong mờ cao cấp', companion: '🫧', previewClass: 'theme-liquidglass' },
  { id: 'anime-room', name: 'Anime Study Room', price: 165, tag: 'Wallpaper bàn học anime, ấm và mềm', companion: '🌙', previewClass: 'theme-anime-room' },
  { id: 'rainy-window', name: 'Rainy Window Night', price: 175, tag: 'Cửa sổ mưa đêm, hợp focus room', companion: '🌧️', previewClass: 'theme-rainy-window' },
  { id: 'rainy-library', name: 'Rainy Library', price: 185, tag: 'Thư viện mưa, rất hợp học dài', companion: '📚', previewClass: 'theme-rainy-library' },
  { id: 'snowy-night', name: 'Snowy Quiet Night', price: 185, tag: 'Đêm tuyết yên, dịu và ít áp lực', companion: '❄️', previewClass: 'theme-snowy-night' },
  { id: 'moonlight-window', name: 'Moonlight Window', price: 190, tag: 'Khung cửa trăng, êm và cinematic', companion: '🌕', previewClass: 'theme-moonlight-window' },
  { id: 'cafe-notes', name: 'Cafe Notes', price: 155, tag: 'Quán cà phê anime, hợp note và pattern', companion: '☕', previewClass: 'theme-cafe-notes' },
  { id: 'dream-sky', name: 'Dream Sky Minimal', price: 150, tag: 'Bầu trời anime nhẹ, ít áp lực thị giác', companion: '☁️', previewClass: 'theme-dream-sky' },
  { id: 'sakura-notes', name: 'Sakura Notes', price: 175, tag: 'Cánh hoa nhẹ, dịu và giàu cảm xúc', companion: '🌸', previewClass: 'theme-sakura-notes' },
  { id: 'film-diary', name: 'Film Diary', price: 190, tag: 'Khung nhật ký điện ảnh, sâu và khác', companion: '🎞️', previewClass: 'theme-film-diary' },
  { id: 'neon-city', name: 'Neon City Memory', price: 180, tag: 'Phố đêm anime, mạnh và khác biệt', companion: '🌆', previewClass: 'theme-neon-city' },
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
  { id: 'liquid', name: 'Liquid Glass Card', price: 135, tag: 'Lớp kính sâu, blur mạnh hơn', previewClass: 'style-liquid' },
  { id: 'postcard', name: 'Postcard', price: 95, tag: 'Khung bưu thiếp, mềm và lạ', previewClass: 'style-postcard' },
  { id: 'film', name: 'Film Frame', price: 110, tag: 'Điện ảnh, viền frame nổi bật', previewClass: 'style-film' },
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
  { id: 'liquid', name: 'Liquid Glow', price: 90, tag: 'Kính lỏng, sáng và sâu', previewClass: 'quote-liquid' },
  { id: 'letter', name: 'Letter Note', price: 75, tag: 'Giống tờ note cảm xúc', previewClass: 'quote-letter' },
  { id: 'postcard', name: 'Postcard Memory', price: 85, tag: 'Kiểu bưu thiếp dễ lưu', previewClass: 'quote-postcard' },
  { id: 'film', name: 'Film Scene', price: 95, tag: 'Điện ảnh, nổi bật', previewClass: 'quote-film' },
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
    id: 'liquid-glass-pack',
    name: 'Liquid Glass Pack',
    tag: 'Kính lỏng cao cấp',
    note: 'Cho người muốn cảm giác app mới, sâu, trong mờ nhưng vẫn đọc được.',
    theme: 'liquidglass',
    cardStyle: 'liquid',
    layoutPack: 'spotlight',
    fontTone: 'rounded',
    quoteStyle: 'liquid'
  },
  {
    id: 'postcard-memory',
    name: 'Postcard Memory',
    tag: 'Bưu thiếp, dễ lưu',
    note: 'Rất hợp daily saying, collections và các câu muốn giữ lại.',
    theme: 'paper',
    cardStyle: 'postcard',
    layoutPack: 'stacked',
    fontTone: 'editorial',
    quoteStyle: 'postcard'
  },
  {
    id: 'film-night',
    name: 'Film Night',
    tag: 'Điện ảnh, trầm, khác biệt',
    note: 'Làm câu quote và khu học trông nổi bật hơn mà không đổi logic học.',
    theme: 'aurora',
    cardStyle: 'film',
    layoutPack: 'split',
    fontTone: 'system',
    quoteStyle: 'film'
  },
  {
    id: 'anime-study-pack',
    name: 'Anime Study Pack',
    tag: 'Wallpaper bàn học anime',
    note: 'Giữ góc học ấm và dễ thương, nhưng chữ chính vẫn rõ để học thật.',
    theme: 'anime-room',
    cardStyle: 'postcard',
    layoutPack: 'stacked',
    fontTone: 'rounded',
    quoteStyle: 'letter'
  },
  {
    id: 'rainy-window-pack',
    name: 'Rainy Window Pack',
    tag: 'Mưa đêm, yên và rất focus',
    note: 'Rất hợp Focus Room, Pomodoro và daily sayings dịu.',
    theme: 'rainy-window',
    cardStyle: 'liquid',
    layoutPack: 'spotlight',
    fontTone: 'system',
    quoteStyle: 'liquid'
  },
  {
    id: 'rainy-library-pack',
    name: 'Rainy Library Pack',
    tag: 'Thư viện mưa rất học',
    note: 'Giữ cảm giác thư viện và chiều sâu đọc, hợp Pattern Vault và review dài hơn.',
    theme: 'rainy-library',
    cardStyle: 'liquid',
    layoutPack: 'split',
    fontTone: 'editorial',
    quoteStyle: 'glass'
  },
  {
    id: 'snowy-night-pack',
    name: 'Snowy Quiet Night Pack',
    tag: 'Đêm tuyết yên',
    note: 'Cho người thích không khí mùa đông chậm, sạch và dễ tập trung.',
    theme: 'snowy-night',
    cardStyle: 'rounded',
    layoutPack: 'classic',
    fontTone: 'rounded',
    quoteStyle: 'soft'
  },
  {
    id: 'moonlight-window-pack',
    name: 'Moonlight Window Pack',
    tag: 'Cửa sổ trăng cinematic',
    note: 'Rất hợp quote cards, Focus Room và các câu muốn lưu lại.',
    theme: 'moonlight-window',
    cardStyle: 'film',
    layoutPack: 'spotlight',
    fontTone: 'system',
    quoteStyle: 'film'
  },
  {
    id: 'cafe-notes-pack',
    name: 'Cafe Notes Pack',
    tag: 'Quán cà phê + pattern vault',
    note: 'Hợp người muốn học qua cấu trúc và các câu ngắn đáng lưu.',
    theme: 'cafe-notes',
    cardStyle: 'notebook',
    layoutPack: 'split',
    fontTone: 'editorial',
    quoteStyle: 'postcard'
  },
  {
    id: 'dream-sky-pack',
    name: 'Dream Sky Pack',
    tag: 'Bầu trời anime, ít áp lực',
    note: 'Cho người muốn cảm giác nhẹ đầu nhưng vẫn giữ được tập trung lâu.',
    theme: 'dream-sky',
    cardStyle: 'rounded',
    layoutPack: 'classic',
    fontTone: 'rounded',
    quoteStyle: 'soft'
  },
  {
    id: 'sakura-notes-pack',
    name: 'Sakura Notes Pack',
    tag: 'Cánh hoa dịu và mềm',
    note: 'Hợp Daily Saying, saved patterns và các câu giàu cảm xúc.',
    theme: 'sakura-notes',
    cardStyle: 'postcard',
    layoutPack: 'stacked',
    fontTone: 'editorial',
    quoteStyle: 'letter'
  },
  {
    id: 'film-diary-pack',
    name: 'Film Diary Pack',
    tag: 'Nhật ký điện ảnh',
    note: 'Một pack sâu, điện ảnh và nổi bật cho quote + pattern review.',
    theme: 'film-diary',
    cardStyle: 'film',
    layoutPack: 'split',
    fontTone: 'editorial',
    quoteStyle: 'film'
  },
  {
    id: 'neon-city-pack',
    name: 'Neon City Pack',
    tag: 'Phố đêm anime, mạnh và mới',
    note: 'Dành cho người thích giao diện khác biệt hẳn nhưng vẫn học rõ ràng.',
    theme: 'neon-city',
    cardStyle: 'film',
    layoutPack: 'spotlight',
    fontTone: 'system',
    quoteStyle: 'film'
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

const QUOTE_WORD_BANK = {
  alone: { meaning: 'một mình', wordType: 'adverb/adjective', note: 'Thường diễn tả trạng thái cô độc hoặc tự làm mọi thứ một mình.' },
  carry: { meaning: 'mang, gánh', wordType: 'verb', note: 'Trong quote thường mang nghĩa gánh áp lực hoặc cảm xúc.' },
  resting: { meaning: 'nghỉ ngơi', wordType: 'verb', note: 'Dạng V-ing của rest.' },
  falling: { meaning: 'tụt lại, rơi xuống', wordType: 'verb', note: 'Trong cụm fall behind = tụt lại phía sau.' },
  behind: { meaning: 'phía sau, chậm hơn', wordType: 'adverb/preposition', note: 'Thường gặp trong “fall behind”.' },
  pretend: { meaning: 'giả vờ', wordType: 'verb', note: 'Diễn tả hành động làm như thật dù không phải vậy.' },
  looking: { meaning: 'đang nhìn, tìm kiếm', wordType: 'verb', note: 'Trong quote có thể là looking for = tìm kiếm.' },
  around: { meaning: 'xung quanh', wordType: 'adverb', note: 'Thường đi với look around.' },
  kind: { meaning: 'tử tế, dịu dàng', wordType: 'adjective', note: 'Cũng có thể là “loại” trong ngữ cảnh khác.' },
  change: { meaning: 'thay đổi', wordType: 'verb', note: 'Một động từ nền rất hay gặp.' },
  evening: { meaning: 'buổi tối', wordType: 'noun', note: 'Thường dùng khi nói về không khí, tâm trạng.' },
  allowed: { meaning: 'được phép', wordType: 'adjective/verb', note: 'Từ allow ở dạng bị động.' },
  begin: { meaning: 'bắt đầu', wordType: 'verb', note: 'Hay dùng trong văn viết lẫn văn nói.' },
  review: { meaning: 'ôn tập, xem lại', wordType: 'verb/noun', note: 'Từ khóa rất hợp với extension học từ.' },
  saves: { meaning: 'tiết kiệm, cứu', wordType: 'verb', note: 'save effort = tiết kiệm công sức.' },
  effort: { meaning: 'nỗ lực, công sức', wordType: 'noun', note: 'Hay đi với make an effort.' },
  heart: { meaning: 'trái tim', wordType: 'noun', note: 'Thường dùng cả nghĩa đen lẫn nghĩa cảm xúc.' },
  deserves: { meaning: 'xứng đáng', wordType: 'verb', note: 'Dạng ngôi thứ ba số ít của deserve.' },
  softer: { meaning: 'mềm hơn, dịu hơn', wordType: 'adjective', note: 'So sánh hơn của soft.' },
  slow: { meaning: 'chậm', wordType: 'adjective', note: 'Hay dùng khi nói nhịp học hoặc tiến độ.' },
  learning: { meaning: 'việc học', wordType: 'noun/verb', note: 'Từ trung tâm của app.' },
  fluency: { meaning: 'sự trôi chảy', wordType: 'noun', note: 'Thường dùng với ngoại ngữ.' },
  tired: { meaning: 'mệt', wordType: 'adjective', note: 'Miêu tả trạng thái thể chất hoặc tinh thần.' },
  trying: { meaning: 'đang cố gắng', wordType: 'verb', note: 'Dạng V-ing của try.' },
  calm: { meaning: 'bình tĩnh', wordType: 'adjective', note: 'Rất hợp văn cảnh học bền, nhớ lâu.' },
  mind: { meaning: 'tâm trí', wordType: 'noun', note: 'Có thể là “để ý” khi làm động từ.' },
  remembers: { meaning: 'nhớ', wordType: 'verb', note: 'Ngôi thứ ba số ít của remember.' },
  rush: { meaning: 'vội vàng', wordType: 'verb/noun', note: 'Học gấp thường khiến nhớ kém hơn.' },
  real: { meaning: 'thật, thực', wordType: 'adjective', note: 'Dùng để nhấn cảm giác chân thật.' },
  progress: { meaning: 'tiến bộ', wordType: 'noun', note: 'Một từ rất hay dùng trong học tập.' },
  yourself: { meaning: 'chính mình', wordType: 'pronoun', note: 'Phản thân người nói hoặc người nghe.' },
  quiet: { meaning: 'yên tĩnh', wordType: 'adjective', note: 'Thường dùng trong các quote dịu nhẹ.' },
  repeat: { meaning: 'lặp lại', wordType: 'verb', note: 'Một chìa khóa của ghi nhớ dài hạn.' },
  care: { meaning: 'sự chăm chút, quan tâm', wordType: 'noun/verb', note: 'with care = một cách cẩn thận.' },
  gently: { meaning: 'một cách dịu dàng', wordType: 'adverb', note: 'Thường làm câu mềm hơn.' },
  page: { meaning: 'trang', wordType: 'noun', note: 'Hay dùng ẩn dụ cho khởi đầu mới.' },
  sentence: { meaning: 'câu', wordType: 'noun', note: 'Rất hợp với daily saying và sentence patterns.' },
  words: { meaning: 'những từ, lời', wordType: 'noun', note: 'words cũng có thể là lời nói.' },
  shoulder: { meaning: 'vai', wordType: 'noun', note: 'Gợi cảm giác được nâng đỡ.' },
  patience: { meaning: 'sự kiên nhẫn', wordType: 'noun', note: 'Rất hợp khi nói về ôn tập.' },
  panic: { meaning: 'hoảng hốt', wordType: 'noun/verb', note: 'panic làm học kém hiệu quả hơn.' },
  enough: { meaning: 'đủ', wordType: 'adjective/adverb', note: 'Một từ ngắn nhưng rất hay gặp.' },
  breath: { meaning: 'hơi thở', wordType: 'noun', note: 'take a breath = hít một hơi.' },
  meaningful: { meaning: 'có ý nghĩa', wordType: 'adjective', note: 'Thường gặp trong writing và speaking.' },
  builds: { meaning: 'xây dựng, tạo nên', wordType: 'verb', note: 'build strong memory = xây trí nhớ vững.' },
  tomorrow: { meaning: 'ngày mai', wordType: 'noun/adverb', note: 'Một từ nền rất phổ biến.' },
  fighting: { meaning: 'chống lại, chiến đấu', wordType: 'verb', note: 'stop fighting yourself = ngừng tự chống lại mình.' },
  arrive: { meaning: 'đến', wordType: 'verb', note: 'Một động từ phổ biến trong everyday English.' },
  rereading: { meaning: 'đọc lại', wordType: 'verb', note: 're- = lại lần nữa.' },
  little: { meaning: 'một chút, nhỏ', wordType: 'adjective/adverb', note: 'a little every day = mỗi ngày một chút.' },
  empty: { meaning: 'trống rỗng', wordType: 'adjective', note: 'quiet does not mean empty.' },
  deserve: { meaning: 'xứng đáng', wordType: 'verb', note: 'Một từ cảm xúc hay gặp.' },
  place: { meaning: 'nơi chốn', wordType: 'noun', note: 'a place where... = một nơi mà...' },
  soften: { meaning: 'mềm lại, dịu đi', wordType: 'verb', note: 'Làm cảm xúc hoặc góc nhìn bớt gắt.' },
  memory: { meaning: 'trí nhớ', wordType: 'noun', note: 'Từ khóa cốt lõi của app.' },
  repetition: { meaning: 'sự lặp lại', wordType: 'noun', note: 'Dùng nhiều trong phương pháp học.' },
  closer: { meaning: 'gần hơn', wordType: 'adjective/adverb', note: 'So sánh hơn của close.' },
  doubts: { meaning: 'những nghi ngờ', wordType: 'noun', note: 'doubt có thể là danh từ hoặc động từ.' },
  searching: { meaning: 'đang tìm kiếm', wordType: 'verb', note: 'search for a sign = tìm một dấu hiệu.' },
  sign: { meaning: 'dấu hiệu', wordType: 'noun', note: 'Một từ hay gặp trong câu giàu hình ảnh.' },
  deeply: { meaning: 'một cách sâu sắc', wordType: 'adverb', note: 'learn deeply = học sâu.' },
  harsh: { meaning: 'khắt khe, gay gắt', wordType: 'adjective', note: 'Trái nghĩa gần với gentle/soft.' },
  clear: { meaning: 'rõ ràng', wordType: 'adjective', note: 'clear minute = một phút tập trung thật sự.' },
  minute: { meaning: 'phút', wordType: 'noun', note: 'Cũng có thể đọc /maɪˈnjuːt/ khi nghĩa là nhỏ bé, nhưng ở đây là phút.' },
  noisy: { meaning: 'ồn ào', wordType: 'adjective', note: 'Trái với quiet/calm.' },
  hour: { meaning: 'giờ', wordType: 'noun', note: 'Một đơn vị thời gian rất cơ bản.' },
  understanding: { meaning: 'sự hiểu', wordType: 'noun', note: 'understanding once is good.' },
  returning: { meaning: 'quay lại', wordType: 'verb', note: 'returning to review = quay lại để ôn.' }
};

const QUOTE_STOPWORDS = new Set(['a', 'an', 'the', 'to', 'is', 'are', 'am', 'be', 'been', 'being', 'do', 'does', 'did', 'and', 'or', 'but', 'if', 'then', 'that', 'this', 'these', 'those', 'with', 'of', 'for', 'at', 'in', 'on', 'by', 'from', 'as', 'it', 'its', 'your', 'you', 'i', 'im', 'me', 'my', 'we', 'our', 'they', 'their', 'he', 'she', 'his', 'her', 'them', 'one', 'can', 'still', 'not', 'have', 'has', 'had', 'while', 'like', 'some', 'what', 'when', 'where', 'will', 'would', 'today', 'tonight']);

const WORD_LESSON_BANK = {
  quiet: { collocation: 'quiet room', collocationMeaning: 'căn phòng yên tĩnh', sentence: 'The quiet room helped me focus for twenty minutes.', pattern: 'The ___ room helped me ___.', grammar: 'quiet thường đứng trước danh từ như room, night, place.', speaking: 'Describe a quiet place where you study best.', recall: 'Fill the blank later: The ___ room helped me focus.' },
  calm: { collocation: 'calm mind', collocationMeaning: 'một tâm trí bình tĩnh', sentence: 'A calm mind remembers difficult words better.', pattern: 'A ___ mind remembers ___ better.', grammar: 'calm thường đi với mind, voice, sea, feeling.', speaking: 'What helps your mind stay calm while studying?', recall: 'Complete: A calm ___ remembers better.' },
  review: { collocation: 'daily review', collocationMeaning: 'một lượt ôn hằng ngày', sentence: 'A short daily review protects long-term memory.', pattern: 'A short daily ___ protects ___.', grammar: 'review có thể là noun hoặc verb.', speaking: 'How long is your best daily review session?', recall: 'Fill in the missing word: daily ___.' },
  focus: { collocation: 'focus session', collocationMeaning: 'một phiên tập trung', sentence: 'One focus session can rescue a slow day.', pattern: 'One ___ session can ___.', grammar: 'focus thường đi với on khi là động từ: focus on a task.', speaking: 'What helps you enter a real focus session?', recall: 'Complete: One focus ___ can rescue a slow day.' },
  progress: { collocation: 'small progress', collocationMeaning: 'tiến bộ nhỏ', sentence: 'Small progress still changes your memory over time.', pattern: 'Small ___ still changes ___.', grammar: 'progress hầu như không dùng ở dạng số nhiều trong ngữ cảnh chung.', speaking: 'What small progress would make you proud this week?', recall: 'Fill the blank: Small ___ still changes your memory.' },
  memory: { collocation: 'long-term memory', collocationMeaning: 'trí nhớ dài hạn', sentence: 'Long-term memory grows from calm repetition.', pattern: 'Long-term ___ grows from ___.', grammar: 'memory thường đi với long-term, short-term, visual.', speaking: 'What helps your long-term memory most?', recall: 'Complete: long-term ___.' },
  sentence: { collocation: 'sentence pattern', collocationMeaning: 'mẫu câu', sentence: 'A useful sentence pattern makes vocabulary easier to reuse.', pattern: 'A useful ___ pattern makes ___ easier.', grammar: 'sentence pattern là cụm rất hợp để lưu cấu trúc tiếng Anh.', speaking: 'What sentence pattern do you want to remember this week?', recall: 'Fill in: sentence ___.' },
  rescue: { collocation: 'rescue line', collocationMeaning: 'một câu cứu mood', sentence: 'Sometimes one rescue line is enough to keep going.', pattern: 'Sometimes one ___ line is enough to ___.', grammar: 'rescue có thể là noun hoặc verb.', speaking: 'What kind of rescue line helps you most?', recall: 'Complete: one rescue ___ is enough.' },
  gentle: { collocation: 'gentle reminder', collocationMeaning: 'một lời nhắc nhẹ nhàng', sentence: 'A gentle reminder is more useful than harsh pressure.', pattern: 'A gentle ___ is more useful than ___.', grammar: 'gentle thường đi với reminder, voice, smile, touch.', speaking: 'What gentle reminder do you need today?', recall: 'Fill in: gentle ___.' },
  carry: { collocation: 'carry everything', collocationMeaning: 'gánh tất cả mọi thứ', sentence: 'You do not have to carry everything alone.', pattern: 'You do not have to ___ everything alone.', grammar: 'have to + verb nguyên mẫu.', speaking: 'What are you trying to carry alone right now?', recall: 'Complete: carry ___ alone.' },
  patience: { collocation: 'with patience', collocationMeaning: 'với sự kiên nhẫn', sentence: 'Review with patience, not panic.', pattern: 'Review with ___, not ___.', grammar: 'with + noun diễn tả cách thức.', speaking: 'How can you study with more patience?', recall: 'Fill the gap: with ___, not panic.' },
  repeat: { collocation: 'repeat with care', collocationMeaning: 'lặp lại một cách chăm chút', sentence: 'What you repeat with care will stay with you.', pattern: 'What you ___ with care will ___.', grammar: 'mệnh đề What you ... có thể đứng làm chủ ngữ.', speaking: 'What should you repeat with more care?', recall: 'Complete: What you ___ with care...' },
  breathe: { collocation: 'take a breath', collocationMeaning: 'hít một hơi', sentence: 'Take a breath, then one more step.', pattern: 'Take a ____, then one more ____.', grammar: 'mệnh lệnh ngắn rất hay dùng trong microcopy.', speaking: 'When should you take a breath while studying?', recall: 'Complete: Take a ___.' },
  room: { collocation: 'study room', collocationMeaning: 'phòng học', sentence: 'A clear study room can reduce noisy thinking.', pattern: 'A clear ___ room can ___.', grammar: 'room thường làm danh từ đếm được.', speaking: 'What kind of room helps you study well?', recall: 'Fill in: study ___.' }
};

const CONFUSION_BANK = {
  quiet: { compare: 'quiet vs silent', note: 'quiet = yên tĩnh, vẫn có thể còn chút âm thanh; silent = hoàn toàn im lặng.' },
  calm: { compare: 'calm vs quiet', note: 'calm nói về trạng thái bình tĩnh; quiet nói về ít tiếng ồn.' },
  review: { compare: 'review vs revise', note: 'review thường là ôn lại/chơi lại nội dung; revise còn có nghĩa sửa đổi.' },
  memory: { compare: 'memory vs memorize', note: 'memory là danh từ; memorize là động từ ghi nhớ.' },
  sentence: { compare: 'sentence vs phrase', note: 'sentence có ý hoàn chỉnh; phrase chỉ là cụm từ.' },
  progress: { compare: 'progress vs process', note: 'progress = tiến bộ/tiến trình đi lên; process = quy trình/xử lý.' },
  focus: { compare: 'focus vs attention', note: 'focus là sự tập trung có chủ ý vào một điểm; attention rộng hơn.' },
  gentle: { compare: 'gentle vs soft', note: 'gentle thiên về cách cư xử/giọng điệu nhẹ nhàng; soft thiên về cảm giác mềm.' }
};

const PATTERN_TEMPLATES = [
  { id: 'need-not-carry', label: 'You do not have to...', pattern: 'You do not have to + verb phrase', grammar: 'have to + động từ nguyên mẫu', example: 'You do not have to carry everything alone.' },
  { id: 'pretend-actually', label: "I pretend to..., but I'm actually...", pattern: "I pretend to + action, but I'm actually + action", grammar: 'Dùng để đối lập bề ngoài và ý thật.', example: "I pretend to look around, but I'm actually looking for you." },
  { id: 'small-can', label: 'A small ... can ...', pattern: 'A small + noun + can + verb phrase', grammar: 'Dùng để diễn tả tác động lớn từ điều nhỏ.', example: 'A small talk can actually fix a lot.' },
  { id: 'even-still', label: 'Even ..., still ...', pattern: 'Even + situation, still + result', grammar: 'Nhấn mạnh kết quả vẫn đúng dù điều kiện khó hơn.', example: 'Even slow learning still becomes fluency.' },
  { id: 'what-you-repeat', label: 'What you ..., will ...', pattern: 'What you + verb + will + result', grammar: 'Mệnh đề What you ... làm chủ ngữ cho cả ý.', example: 'What you repeat with care will stay with you.' },
  { id: 'take-a-breath', label: 'Take a breath. Then ...', pattern: 'Take a breath. Then + next step', grammar: 'Hai mệnh lệnh ngắn tạo nhịp rất tự nhiên.', example: 'Take a breath. Then one more step.' },
  { id: 'trying-to', label: "I'm trying to...", pattern: "I'm trying to + verb phrase", grammar: 'trying to diễn tả nỗ lực đang diễn ra.', example: "I'm trying to build a calmer study routine." },
  { id: 'tend-to', label: 'I tend to...', pattern: 'I tend to + verb phrase', grammar: 'tend to diễn tả xu hướng thường xảy ra.', example: 'I tend to remember words better at night.' },
  { id: 'turns-out', label: 'It turns out that...', pattern: 'It turns out that + clause', grammar: 'Dùng khi kết quả thực tế khác kỳ vọng ban đầu.', example: 'It turns out that short reviews work best for me.' },
  { id: 'ended-up', label: 'I ended up...', pattern: 'I ended up + V-ing / noun', grammar: 'Diễn tả kết quả cuối cùng sau một quá trình.', example: 'I ended up saving the whole sentence pattern.' },
  { id: 'used-to', label: "I'm used to...", pattern: "I'm used to + noun / V-ing", grammar: 'used to ở đây là quen với việc gì.', example: "I'm used to reviewing five words before bed." },
  { id: 'feel-like', label: "I don't feel like...", pattern: "I don't feel like + V-ing", grammar: 'feel like + V-ing diễn tả không có hứng làm gì.', example: "I don't feel like rushing through this list." },
  { id: 'feels-like', label: 'It feels like...', pattern: 'It feels like + noun / clause', grammar: 'Dùng để mô tả cảm giác chủ quan, giàu cảm xúc.', example: 'It feels like this room was made for quiet study.' },
  { id: 'did-not-expect', label: "I did not expect..., but...", pattern: "I did not expect + noun/clause, but + clause", grammar: 'Tạo tương phản giữa dự đoán và thực tế.', example: "I did not expect this quote, but it stayed with me." },
  { id: 'there-are-days', label: 'There are days when...', pattern: 'There are days when + clause', grammar: 'Cấu trúc tự nhiên để nói về những ngày đặc biệt.', example: 'There are days when one sentence is enough.' },
  { id: 'still-remember', label: 'I still remember how...', pattern: 'I still remember how + clause', grammar: 'Dùng để nói về ký ức còn rõ.', example: 'I still remember how that pattern first clicked.' },
  { id: 'what-i-mean', label: 'What I mean is...', pattern: 'What I mean is + clause', grammar: 'Cách nói rất tự nhiên khi làm rõ ý.', example: 'What I mean is that slow review is still progress.' },
  { id: 'depends-on', label: 'It depends on...', pattern: 'It depends on + noun / wh-clause', grammar: 'Dùng để nói kết quả thay đổi theo điều kiện.', example: 'It depends on how calm your mind is.' },
  { id: 'noticed', label: "One thing I've noticed is...", pattern: "One thing I've noticed is + clause", grammar: 'Rất hợp speaking và reflective writing.', example: "One thing I've noticed is that patterns stay longer than isolated words." },
  { id: 'would-rather', label: "I'd rather...", pattern: "I'd rather + verb", grammar: 'would rather dùng để nói sở thích ưu tiên.', example: "I'd rather review deeply than rush through fifty words." },
  { id: 'looking-forward', label: "I'm looking forward to...", pattern: "I'm looking forward to + noun / V-ing", grammar: 'to ở đây là giới từ, sau nó dùng danh từ hoặc V-ing.', example: "I'm looking forward to using this sentence in real conversation." },
  { id: 'hard-but', label: "It's hard to..., but...", pattern: "It's hard to + verb, but + clause", grammar: 'Dùng để cân bằng khó khăn và hy vọng.', example: "It's hard to slow down, but slowing down helps memory." },
  { id: 'little-goes-long-way', label: 'A little ... goes a long way', pattern: 'A little + noun + goes a long way', grammar: 'Nhấn mạnh một lượng nhỏ nhưng hiệu quả cao.', example: 'A little daily review goes a long way.' },
  { id: 'the-more-the-easier', label: 'The more..., the easier...', pattern: 'The more + clause, the easier + clause', grammar: 'Cấu trúc so sánh kép rất hữu ích cho writing.', example: 'The more you repeat calmly, the easier recall becomes.' },
  { id: 'it-takes-time', label: 'It takes time to...', pattern: 'It takes time to + verb', grammar: 'Câu nền rất phổ biến trong khuyên nhủ và tự trấn an.', example: 'It takes time to build long-term memory.' },
  { id: 'progress-not-always', label: 'Progress does not always...', pattern: 'Progress does not always + verb', grammar: 'Hợp để nói về tiến trình học không tuyến tính.', example: 'Progress does not always look dramatic at first.' },
  { id: 'one-step-better', label: 'One step today is better than...', pattern: 'One step today is better than + noun phrase', grammar: 'So sánh để khuyến khích hành động nhỏ.', example: 'One step today is better than waiting for a perfect mood.' },
  { id: 'in-many-cases', label: 'In many cases,...', pattern: 'In many cases, + clause', grammar: 'Mở bài gọn, hợp writing và speaking học thuật.', example: 'In many cases, short repetition works better than cramming.' },
  { id: 'one-explanation', label: 'One possible explanation is...', pattern: 'One possible explanation is + noun/clause', grammar: 'Dùng để đưa ra lý giải trung tính.', example: 'One possible explanation is that the word lacked context.' },
  { id: 'this-can-be-seen', label: 'This can be seen in...', pattern: 'This can be seen in + noun phrase', grammar: 'Cấu trúc viết học thuật nhẹ.', example: 'This can be seen in your weekly review patterns.' },
  { id: 'on-one-hand', label: 'On the one hand..., on the other hand...', pattern: 'On the one hand + clause, on the other hand + clause', grammar: 'Cấu trúc đối chiếu rất quan trọng.', example: 'On the one hand, the UI is richer; on the other hand, the flow stays simple.' },
  { id: 'key-advantage', label: 'A key advantage is...', pattern: 'A key advantage is + noun phrase', grammar: 'Hợp cho writing, thuyết trình, giải thích lợi ích.', example: 'A key advantage is that patterns help words stay longer.' },
  { id: 'this-suggests', label: 'This suggests that...', pattern: 'This suggests that + clause', grammar: 'Dùng để rút ra nhận định từ dữ liệu hoặc trải nghiệm.', example: 'This suggests that calm repetition improves recall.' },
  { id: 'as-a-result', label: 'As a result,...', pattern: 'As a result, + clause', grammar: 'Cấu trúc nối kết quả rất nền.', example: 'As a result, the same weak words appear less often.' }
];

const SHOP_CONFIG = {
  theme: { items: THEMES, activeKey: 'theme', unlockedKey: 'unlockedThemes', label: 'theme' },
  card: { items: CARD_STYLES, activeKey: 'cardStyle', unlockedKey: 'unlockedCardStyles', label: 'card style' },
  layout: { items: LAYOUT_PACKS, activeKey: 'layoutPack', unlockedKey: 'unlockedLayoutPacks', label: 'layout' },
  font: { items: FONT_TONES, activeKey: 'fontTone', unlockedKey: 'unlockedFontTones', label: 'font tone' },
  quote: { items: QUOTE_STYLES, activeKey: 'quoteStyle', unlockedKey: 'unlockedQuoteStyles', label: 'quote style' }
};

  return { THEMES, CARD_STYLES, LAYOUT_PACKS, FONT_TONES, QUOTE_STYLES, PRESET_DISCOUNT, PRESETS, DAILY_QUOTES, QUOTE_WORD_BANK, QUOTE_STOPWORDS, WORD_LESSON_BANK, CONFUSION_BANK, PATTERN_TEMPLATES, SHOP_CONFIG };
})();
