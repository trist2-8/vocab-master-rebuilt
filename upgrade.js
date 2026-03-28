
document.addEventListener('DOMContentLoaded', () => {

  const THEMES = [
    { id: 'midnight', name: 'Midnight Core', price: 0, tag: 'Mặc định ổn định', companion: '📘', previewClass: 'theme-midnight' },
    { id: 'aurora', name: 'Aurora Glass', price: 90, tag: 'Xu hướng glass hiện đại', companion: '✨', previewClass: 'theme-aurora' },
    { id: 'liquidglass', name: 'Liquid Glass', price: 140, tag: 'Liquid glass trong mờ cao cấp', companion: '🫧', previewClass: 'theme-liquidglass' },
    { id: 'anime-room', name: 'Anime Study Room', price: 165, tag: 'Wallpaper bàn học anime, ấm và mềm', companion: '🌙', previewClass: 'theme-anime-room' },
    { id: 'rainy-window', name: 'Rainy Window Night', price: 175, tag: 'Cửa sổ mưa đêm, hợp focus room', companion: '🌧️', previewClass: 'theme-rainy-window' },
    { id: 'cafe-notes', name: 'Cafe Notes', price: 155, tag: 'Quán cà phê anime, hợp note và pattern', companion: '☕', previewClass: 'theme-cafe-notes' },
    { id: 'dream-sky', name: 'Dream Sky Minimal', price: 150, tag: 'Bầu trời anime nhẹ, ít áp lực thị giác', companion: '☁️', previewClass: 'theme-dream-sky' },
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
    { id: 'need-not-carry', category: 'daily', label: 'You do not have to...', pattern: 'You do not have to + verb phrase', grammar: 'have to + động từ nguyên mẫu', example: 'You do not have to carry everything alone.' },
    { id: 'pretend-actually', category: 'emotion', label: "I pretend to..., but I'm actually...", pattern: "I pretend to + action, but I'm actually + action", grammar: 'Dùng để đối lập bề ngoài và ý thật.', example: "I pretend to look around, but I'm actually looking for you." },
    { id: 'small-can', category: 'daily', label: 'A small ... can ...', pattern: 'A small + noun + can + verb phrase', grammar: 'Dùng để diễn tả tác động lớn từ điều nhỏ.', example: 'A small talk can actually fix a lot.' },
    { id: 'even-still', category: 'study', label: 'Even ..., still ...', pattern: 'Even + situation, still + result', grammar: 'Nhấn mạnh kết quả vẫn đúng dù điều kiện khó hơn.', example: 'Even slow learning still becomes fluency.' },
    { id: 'what-you-repeat', category: 'study', label: 'What you ..., will ...', pattern: 'What you + verb + will + result', grammar: 'Mệnh đề What you ... làm chủ ngữ cho cả ý.', example: 'What you repeat with care will stay with you.' },
    { id: 'take-a-breath', category: 'emotion', label: 'Take a breath. Then ...', pattern: 'Take a breath. Then + next step', grammar: 'Hai mệnh lệnh ngắn tạo nhịp rất tự nhiên.', example: 'Take a breath. Then one more step.' },

    { id: 'trying-to', category: 'speaking', label: "I'm trying to...", pattern: "I'm trying to + verb phrase", grammar: 'Dùng để nói về nỗ lực hiện tại.', example: "I'm trying to build a steady study habit." },
    { id: 'tend-to', category: 'speaking', label: 'I tend to...', pattern: 'I tend to + verb phrase', grammar: 'Diễn tả xu hướng thường xuyên.', example: 'I tend to remember examples better than definitions.' },
    { id: 'turns-out', category: 'speaking', label: 'It turns out that...', pattern: 'It turns out that + clause', grammar: 'Dùng khi kết quả khác với điều bạn nghĩ lúc đầu.', example: 'It turns out that short review sessions work best for me.' },
    { id: 'ended-up', category: 'daily', label: 'I ended up...', pattern: 'I ended up + V-ing / noun', grammar: 'Dùng khi kết quả cuối cùng khác kế hoạch ban đầu.', example: 'I ended up reviewing the difficult words twice.' },
    { id: 'used-to', category: 'daily', label: "I'm used to...", pattern: "I'm used to + noun / V-ing", grammar: 'used to ở đây mang nghĩa quen với.', example: "I'm used to studying with a timer now." },
    { id: 'not-ready', category: 'emotion', label: "I'm not ready to...", pattern: "I'm not ready to + verb phrase", grammar: 'Dùng để diễn tả chưa sẵn sàng.', example: "I'm not ready to give up on this word yet." },
    { id: 'dont-feel-like', category: 'daily', label: "I don't feel like...", pattern: "I don't feel like + V-ing", grammar: 'feel like + V-ing.', example: "I don't feel like rushing through the review today." },

    { id: 'it-feels-like', category: 'emotion', label: 'It feels like...', pattern: 'It feels like + noun / clause', grammar: 'Dùng để mô tả cảm giác rất tự nhiên.', example: 'It feels like this quote was written for tonight.' },
    { id: 'did-not-expect', category: 'emotion', label: 'I did not expect..., but...', pattern: 'I did not expect + noun/clause, but + clause', grammar: 'Tạo thế đối lập cảm xúc.', example: 'I did not expect this sentence to stay with me, but it did.' },
    { id: 'some-people', category: 'emotion', label: 'Some people...', pattern: 'Some people + verb / clause', grammar: 'Mở câu giàu hình ảnh hoặc cảm xúc.', example: 'Some people arrive like a sentence you keep rereading.' },
    { id: 'there-are-days', category: 'emotion', label: 'There are days when...', pattern: 'There are days when + clause', grammar: 'Dùng để diễn tả trạng thái lặp lại theo ngày.', example: 'There are days when one gentle line is enough.' },
    { id: 'still-remember-how', category: 'emotion', label: 'I still remember how...', pattern: 'I still remember how + clause', grammar: 'Cấu trúc gợi ký ức rất tự nhiên.', example: 'I still remember how that word first started making sense.' },
    { id: 'maybe-this-is', category: 'emotion', label: 'Maybe this is what ... feels like', pattern: 'Maybe this is what + noun + feels like', grammar: 'Dùng để diễn tả cảm giác đang dần hiểu ra.', example: 'Maybe this is what calm progress feels like.' },

    { id: 'main-reason', category: 'speaking', label: 'The main reason is...', pattern: 'The main reason is + noun / clause', grammar: 'Cấu trúc rất hữu ích cho speaking.', example: 'The main reason is that repetition helps my memory.' },
    { id: 'what-i-mean', category: 'speaking', label: 'What I mean is...', pattern: 'What I mean is + clause', grammar: 'Dùng để làm rõ ý.', example: 'What I mean is that I need slower review, not less review.' },
    { id: 'it-depends', category: 'speaking', label: 'It depends on...', pattern: 'It depends on + noun / wh-clause', grammar: 'Câu nền cho speaking linh hoạt.', example: 'It depends on how tired I am after work.' },
    { id: 'one-thing-noticed', category: 'speaking', label: "One thing I've noticed is...", pattern: "One thing I've noticed is + clause", grammar: 'Rất tự nhiên cho reflective speaking.', example: "One thing I've noticed is that I remember phrases better than isolated words." },
    { id: 'would-rather', category: 'speaking', label: "I'd rather...", pattern: "I'd rather + verb", grammar: 'would rather + động từ nguyên mẫu.', example: "I'd rather do one careful session than three rushed ones." },
    { id: 'looking-forward', category: 'speaking', label: "I'm looking forward to...", pattern: "I'm looking forward to + V-ing / noun", grammar: 'to ở đây là giới từ.', example: "I'm looking forward to seeing this word again tomorrow." },
    { id: 'hard-but', category: 'speaking', label: "It's hard to..., but...", pattern: "It's hard to + verb, but + clause", grammar: 'Dùng để thừa nhận khó khăn nhưng vẫn tiến lên.', example: "It's hard to stay calm, but I can still review one more card." },

    { id: 'little-goes-long-way', category: 'study', label: 'A little ... goes a long way.', pattern: 'A little + noun + goes a long way', grammar: 'Nói về hiệu quả lớn của điều nhỏ.', example: 'A little daily review goes a long way.' },
    { id: 'more-easier', category: 'study', label: 'The more ..., the easier ...', pattern: 'The more + clause, the easier + clause', grammar: 'Mẫu so sánh kép.', example: 'The more examples you see, the easier recall becomes.' },
    { id: 'takes-time', category: 'study', label: 'It takes time to...', pattern: 'It takes time to + verb', grammar: 'Câu rất nền cho tự nhắc nhở học lâu dài.', example: 'It takes time to build a strong memory.' },
    { id: 'progress-not-always', category: 'study', label: 'Progress does not always...', pattern: 'Progress does not always + verb phrase', grammar: 'Cách nói nhẹ nhưng sâu.', example: 'Progress does not always look dramatic.' },
    { id: 'one-step-better', category: 'study', label: 'One step today is better than...', pattern: 'One step today is better than + noun/gerund', grammar: 'Động viên học từng chút.', example: 'One step today is better than waiting for perfect motivation.' },
    { id: 'review-with', category: 'study', label: 'Review with..., not...', pattern: 'Review with + noun, not + noun', grammar: 'Cấu trúc ngắn, nhớ lâu.', example: 'Review with patience, not panic.' },

    { id: 'in-many-cases', category: 'writing', label: 'In many cases,...', pattern: 'In many cases, + clause', grammar: 'Mở đoạn writing tự nhiên.', example: 'In many cases, repeated exposure matters more than speed.' },
    { id: 'one-explanation', category: 'writing', label: 'One possible explanation is...', pattern: 'One possible explanation is + noun / clause', grammar: 'Hữu ích cho essays và explanations.', example: 'One possible explanation is that emotional language is easier to retain.' },
    { id: 'this-can-be-seen', category: 'writing', label: 'This can be seen in...', pattern: 'This can be seen in + noun / clause', grammar: 'Mở dẫn chứng.', example: 'This can be seen in the way learners remember collocations from quotes.' },
    { id: 'on-one-hand', category: 'writing', label: 'On the one hand..., on the other hand...', pattern: 'On the one hand, + clause. On the other hand, + clause.', grammar: 'Mẫu đối chiếu kinh điển.', example: 'On the one hand, themes make study pleasant. On the other hand, clarity must stay first.' },
    { id: 'key-advantage', category: 'writing', label: 'A key advantage is...', pattern: 'A key advantage is + noun / clause', grammar: 'Hữu ích cho task 2 / writing ngắn.', example: 'A key advantage is that the app stays simple while adding motivation.' },
    { id: 'this-suggests', category: 'writing', label: 'This suggests that...', pattern: 'This suggests that + clause', grammar: 'Dùng để rút ra kết luận nhẹ.', example: 'This suggests that small daily exposure supports retention.' },
    { id: 'as-a-result', category: 'writing', label: 'As a result,...', pattern: 'As a result, + clause', grammar: 'Mẫu chỉ kết quả.', example: 'As a result, learners return to the app more consistently.' },

    { id: 'there-is-no-need', category: 'daily', label: 'There is no need to...', pattern: 'There is no need to + verb', grammar: 'Câu nhẹ nhàng để giảm áp lực.', example: 'There is no need to finish everything tonight.' },
    { id: 'i-want-to-keep', category: 'daily', label: 'I want to keep...', pattern: 'I want to keep + noun / V-ing', grammar: 'keep + noun hoặc V-ing.', example: 'I want to keep this sentence in my pattern vault.' },
    { id: 'this-helps-me', category: 'daily', label: 'This helps me...', pattern: 'This helps me + verb', grammar: 'help + object + verb nguyên mẫu.', example: 'This helps me review without feeling overwhelmed.' },
    { id: 'what-matters-most', category: 'study', label: 'What matters most is...', pattern: 'What matters most is + noun / clause', grammar: 'Dùng để nhấn trọng tâm.', example: 'What matters most is returning to the words again.' },
    { id: 'i-would-like-to', category: 'speaking', label: 'I would like to...', pattern: 'I would like to + verb', grammar: 'Mẫu speaking cơ bản nhưng lịch sự.', example: 'I would like to build a stronger daily routine.' },
    { id: 'it-is-worth', category: 'study', label: 'It is worth...', pattern: 'It is worth + V-ing / noun', grammar: 'worth + V-ing.', example: 'It is worth saving useful patterns for later review.' }
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
      focusRoomSeed: 0
    }
  };

  const byId = (id) => document.getElementById(id);
  const UPGRADE_MODAL_IDS = ['customizationModal', 'pomodoroModal', 'dailySayingModal', 'memoryPathModal', 'weakRescueModal', 'patternVaultModal', 'focusRoomModal', 'collectionsModal', 'weeklyRecapModal', 'adminModal'];

  init().catch((error) => {
    console.error('Vocab Master upgrade layer failed to initialize', error);
  });

  async function init() {
    injectUpgradeUi();
    bindEvents();
    setupUpgradeModalUtilities();
    await loadState();
    await ensureWalletConsistency();
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
                <h3>Wallpaper mood controls</h3>
                <span class="muted-text">Giúp các wallpaper-style packs đẹp hơn nhưng vẫn giữ chữ dễ đọc.</span>
              </div>
              <div class="toggle-grid wallpaper-control-grid">
                <label class="toggle-card"><span>Bật lớp wallpaper</span><input id="wallpaperToggle" type="checkbox"></label>
                <label class="toggle-card range-card"><span>Độ đậm wallpaper</span><input id="wallpaperIntensityRange" type="range" min="35" max="100" step="5"></label>
                <label class="toggle-card range-card"><span>Blur wallpaper</span><input id="wallpaperBlurRange" type="range" min="0" max="22" step="1"></label>
                <label class="toggle-card range-card"><span>Lớp phủ bảo vệ chữ</span><input id="wallpaperOverlayRange" type="range" min="20" max="85" step="5"></label>
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
            <div class="pattern-vault-toolbar">
              <input id="patternVaultSearchInput" class="modern-input" type="text" placeholder="Tìm mẫu câu, ví dụ, grammar...">
              <select id="patternVaultCategorySelect" class="modern-input">
                <option value="all">Tất cả nhóm pattern</option>
                <option value="daily">Daily</option>
                <option value="emotion">Emotion</option>
                <option value="study">Study</option>
                <option value="speaking">Speaking</option>
                <option value="writing">Writing</option>
                <option value="saved">Đã lưu</option>
                <option value="quote">Từ quote hôm nay</option>
              </select>
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
              <div class="admin-dev-grid">
                <button id="adminUnlockAllUiBtn" class="secondary-btn" type="button">🔓 Mở toàn bộ pack UI</button>
                <button id="adminRestoreClassicBtn" class="secondary-btn" type="button">🪶 Về classic mode</button>
                <button id="adminResetCosmeticBtn" class="secondary-btn" type="button">♻ Reset lớp cosmetic</button>
                <button id="adminStarterWalletBtn" class="secondary-btn" type="button">🟡 Nạp ví test 3000</button>
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
    byId('openCustomizationBtn')?.addEventListener('click', () => openExclusiveModal('customizationModal'));
    byId('openAdminPanelBtn')?.addEventListener('click', () => { renderAdminModal(); openExclusiveModal('adminModal'); });
    byId('openAdminFromCustomizationBtn')?.addEventListener('click', () => { renderAdminModal(); openExclusiveModal('adminModal'); });
    byId('openPomodoroBtn')?.addEventListener('click', () => openExclusiveModal('pomodoroModal'));
    byId('openProgressBoosterBtn')?.addEventListener('click', () => openExclusiveModal('pomodoroModal'));
    byId('openDailySayingBtn')?.addEventListener('click', openDailySayingModal);
    byId('dailySayingLauncher')?.addEventListener('click', openDailySayingModal);
    byId('openFocusRoomBtn')?.addEventListener('click', () => {
      renderFocusRoomModal();
      openExclusiveModal('focusRoomModal');
    });
    byId('openCollectionsBtn')?.addEventListener('click', () => {
      renderCollectionsModal();
      openExclusiveModal('collectionsModal');
    });
    byId('openMemoryPathBtn')?.addEventListener('click', () => {
      renderMemoryPathModal();
      openExclusiveModal('memoryPathModal');
    });
    byId('openWeakRescueBtn')?.addEventListener('click', () => {
      renderWeakRescueModal();
      openExclusiveModal('weakRescueModal');
    });
    byId('openPatternVaultBtn')?.addEventListener('click', () => {
      renderPatternVaultModal();
      openExclusiveModal('patternVaultModal');
    });
    byId('openWeeklyRecapBtn')?.addEventListener('click', () => {
      renderWeeklyRecapModal();
      openExclusiveModal('weeklyRecapModal');
    });
    byId('dailyQuotePrevBtn')?.addEventListener('click', () => shiftQuote(-1));
    byId('dailyQuoteNextBtn')?.addEventListener('click', () => shiftQuote(1));
    byId('saveDailyQuoteBtn')?.addEventListener('click', toggleCurrentQuoteSaved);
    byId('openCollectionsFromQuoteBtn')?.addEventListener('click', () => {
      renderCollectionsModal();
      openExclusiveModal('collectionsModal');
    });
    byId('dailyWordSpeakBtn')?.addEventListener('click', speakSelectedQuoteWord);
    byId('dailyWordSaveBtn')?.addEventListener('click', saveSelectedQuoteWordToVocabulary);
    byId('dailyPatternSaveBtn')?.addEventListener('click', saveCurrentQuotePattern);
    byId('dailyOpenMemoryPathBtn')?.addEventListener('click', () => {
      renderMemoryPathModal();
      openExclusiveModal('memoryPathModal');
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
    byId('patternVaultSearchInput')?.addEventListener('input', renderPatternVaultModal);
    byId('patternVaultCategorySelect')?.addEventListener('change', renderPatternVaultModal);
    byId('focusRoomNextBtn')?.addEventListener('click', nextFocusRoomWord);
    byId('focusRoomRevealBtn')?.addEventListener('click', toggleFocusRoomMeaning);
    byId('focusRoomSpeakBtn')?.addEventListener('click', speakCurrentFocusWord);
    byId('focusRoomSaveBtn')?.addEventListener('click', saveCurrentFocusWordToCollection);
    byId('focusRoomStudyBtn')?.addEventListener('click', startFocusRoomStudy);
    byId('focusRoomPomodoroBtn')?.addEventListener('click', () => openExclusiveModal('pomodoroModal'));

    byId('adminModeToggleBtn')?.addEventListener('click', toggleAdminMode);
    byId('adminApplyDirectBtn')?.addEventListener('click', applyAdminDirectValues);
    byId('adminApplyTargetBtn')?.addEventListener('click', applyAdminTargetAvailable);
    byId('adminResetSpentBtn')?.addEventListener('click', resetAdminSpentCoins);
    byId('adminRepairWalletBtn')?.addEventListener('click', repairAdminWallet);
    byId('adminUnlockAllUiBtn')?.addEventListener('click', unlockAllUiPacks);
    byId('adminRestoreClassicBtn')?.addEventListener('click', restoreClassicUiMode);
    byId('adminResetCosmeticBtn')?.addEventListener('click', resetCosmeticLayer);
    byId('adminStarterWalletBtn')?.addEventListener('click', grantStarterWallet);
    byId('adminModal')?.addEventListener('click', (event) => {
      const addButton = event.target.closest('[data-admin-add]');
      if (addButton) {
        adjustAdminAvailableBy(Number(addButton.dataset.adminAdd) || 0);
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

    UPGRADE_MODAL_IDS.forEach((modalId) => {
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
    byId('wallpaperToggle')?.addEventListener('change', async (event) => {
      state.ui.wallpaperEnabled = event.target.checked;
      await saveUiState();
    });
    byId('wallpaperIntensityRange')?.addEventListener('input', async (event) => {
      state.ui.wallpaperIntensity = clampRange(event.target.value, 35, 100, 90);
      applyUiPreferences();
      await saveUiState();
    });
    byId('wallpaperBlurRange')?.addEventListener('input', async (event) => {
      state.ui.wallpaperBlur = clampRange(event.target.value, 0, 22, 6);
      applyUiPreferences();
      await saveUiState();
    });
    byId('wallpaperOverlayRange')?.addEventListener('input', async (event) => {
      state.ui.wallpaperOverlay = clampRange(event.target.value, 20, 85, 58);
      applyUiPreferences();
      await saveUiState();
    });

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
    byId('pomodoroMiniOpenBtn')?.addEventListener('click', () => openExclusiveModal('pomodoroModal'));
    byId('pomodoroMiniToggleBtn')?.addEventListener('click', () => {
      if (state.runtime.isRunning) pausePomodoro(false);
      else startPomodoro();
    });

    document.querySelectorAll('.nav-btn').forEach((btn) => btn.addEventListener('click', () => {
      window.setTimeout(renderUpgradeLayer, 80);
    }));
    byId('reviewSetDropdown')?.addEventListener('change', () => window.setTimeout(renderUpgradeLayer, 80));

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
      renderUpgradeLayer();
      if (walletTouched) void ensureWalletConsistency();
    });

    window.setInterval(() => {
      if (!state.runtime.isRunning) return;
      renderPomodoroWidgets();
      renderFocusRoomModal();
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
    await ensureWalletConsistency();
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
      wallpaperEnabled: raw.wallpaperEnabled !== false,
      wallpaperIntensity: clampRange(raw.wallpaperIntensity, 35, 100, 90),
      wallpaperBlur: clampRange(raw.wallpaperBlur, 0, 22, 6),
      wallpaperOverlay: clampRange(raw.wallpaperOverlay, 20, 85, 58)
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

  function clampRange(value, min, max, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, number));
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
    const fromCollections = state.collections?.savedQuotes?.map((item) => item.quoteId) || [];
    state.quotes.savedIds = Array.from(new Set([...(state.quotes.savedIds || []), ...fromCollections]));
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

  function closeAllUpgradeModals(exceptId = '') {
    UPGRADE_MODAL_IDS.forEach((modalId) => {
      if (exceptId && modalId === exceptId) return;
      closeModal(modalId);
    });
  }

  function openExclusiveModal(id) {
    closeAllUpgradeModals(id);
    openModal(id);
  }

  function setupUpgradeModalUtilities() {
    UPGRADE_MODAL_IDS.forEach((modalId) => {
      const modal = byId(modalId);
      const content = modal?.querySelector('.modal-content');
      if (content) {
        content.addEventListener('click', (event) => event.stopPropagation());
      }
      if (!modal || modal.dataset.enhanced === 'true') return;
      modal.dataset.enhanced = 'true';
      const footer = modal.querySelector('.footer-actions');
      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'secondary-btn upgrade-close-footer-btn';
      closeBtn.textContent = 'Đóng';
      closeBtn.addEventListener('click', () => closeModal(modalId));
      if (footer) footer.appendChild(closeBtn);
      else if (content) {
        const footerWrap = document.createElement('div');
        footerWrap.className = 'footer-actions upgrade-modal-footer';
        footerWrap.appendChild(closeBtn);
        content.appendChild(footerWrap);
      }
    });

    if (!document.body.dataset.upgradeEscBound) {
      document.body.dataset.upgradeEscBound = 'true';
      document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        const openId = UPGRADE_MODAL_IDS.find((modalId) => !byId(modalId)?.classList.contains('hidden'));
        if (openId) closeModal(openId);
      });
    }
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

  async function ensureWalletConsistency() {
    const wallet = getWalletSnapshot();
    const spentChanged = wallet.spentCoins !== state.spentCoins;
    const bonusChanged = wallet.bonusCoins !== state.bonusCoins;
    if (!spentChanged && !bonusChanged) return;
    state.spentCoins = wallet.spentCoins;
    state.bonusCoins = wallet.bonusCoins;
    await storage.set({ vm_spentCoins: state.spentCoins, vm_bonusCoins: state.bonusCoins });
  }

  function applyUiPreferences() {
    document.body.dataset.uiTheme = state.ui.theme;
    document.body.dataset.uiCardStyle = state.ui.cardStyle;
    document.body.dataset.uiLayout = state.ui.layoutPack;
    document.body.dataset.uiFontTone = state.ui.fontTone;
    document.body.dataset.uiQuoteStyle = state.ui.quoteStyle;
    document.body.dataset.uiDensity = state.ui.density;
    document.body.dataset.uiWallpaperEnabled = state.ui.wallpaperEnabled ? 'on' : 'off';
    document.body.style.setProperty('--vm-wallpaper-opacity', String((state.ui.wallpaperIntensity || 90) / 100));
    document.body.style.setProperty('--vm-wallpaper-blur', `${state.ui.wallpaperBlur || 0}px`);
    document.body.style.setProperty('--vm-wallpaper-overlay', String((state.ui.wallpaperOverlay || 58) / 100));
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
    renderCollectionsModal();
    renderWeeklyRecapModal();
    renderPatternVaultModal();
    renderMemoryPathModal();
    renderWeakRescueModal();
    renderFocusRoomModal();
    renderAdminModal();
    renderPomodoroWidgets();
  }

  function renderWalletBar() {
    const wallet = getWalletSnapshot();
    const counts = computeStudyCounts(state.vocab);
    setText('walletAvailableCoins', String(wallet.availableCoins));
    setText('walletThemeName', getMeta('theme', state.ui.theme).name);
    setText('walletPomodoroToday', String(state.focus.completedToday));
    setText('walletLayoutName', getMeta('layout', state.ui.layoutPack).name);
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
        note.textContent = `${walletNote} Hiện tại bạn đang dùng ${getMeta('theme', state.ui.theme).name} + ${getMeta('layout', state.ui.layoutPack).name}.${adminNote}`;
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
    if (byId('wallpaperToggle')) byId('wallpaperToggle').checked = state.ui.wallpaperEnabled;
    if (byId('wallpaperIntensityRange')) byId('wallpaperIntensityRange').value = String(state.ui.wallpaperIntensity);
    if (byId('wallpaperBlurRange')) byId('wallpaperBlurRange').value = String(state.ui.wallpaperBlur);
    if (byId('wallpaperOverlayRange')) byId('wallpaperOverlayRange').value = String(state.ui.wallpaperOverlay);
    const quick = byId('adminQuickStatus');
    if (quick) quick.textContent = state.admin?.enabled ? 'Admin mode: đang bật' : 'Admin mode: đang tắt';
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

  async function saveAdminState() {
    renderUpgradeLayer();
    await storage.set({ vm_admin: state.admin });
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
    ['adminStudyCoinsInput', 'adminBonusCoinsInput', 'adminSpentCoinsInput', 'adminTargetAvailableInput', 'adminApplyDirectBtn', 'adminApplyTargetBtn', 'adminResetSpentBtn', 'adminUnlockAllUiBtn', 'adminRestoreClassicBtn', 'adminResetCosmeticBtn', 'adminStarterWalletBtn'].forEach((id) => {
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
    state.admin.enabled = !state.admin.enabled;
    state.admin.lastUpdatedAt = Date.now();
    renderAdminModal();
    await saveAdminState();
    if (!state.admin.enabled) closeModal('adminModal');
    showToast(state.admin.enabled ? 'Đã bật admin mode.' : 'Đã tắt admin mode và quay về chế độ bình thường.');
  }

  async function applyAdminDirectValues() {
    if (!state.admin?.enabled) return showToast('Hãy bật admin mode trước.');
    const studyCoins = Math.max(0, Number(byId('adminStudyCoinsInput')?.value) || 0);
    const bonusCoins = Math.max(0, Number(byId('adminBonusCoinsInput')?.value) || 0);
    const spentCoins = Math.max(0, Number(byId('adminSpentCoinsInput')?.value) || 0);
    state.stats.coins = studyCoins;
    state.bonusCoins = bonusCoins;
    state.spentCoins = spentCoins;
    await ensureWalletConsistency();
    await Promise.all([storage.set({ stats: state.stats }), saveWalletState()]);
    showToast('Đã lưu số coin theo chế độ admin.');
  }

  async function applyAdminTargetAvailable() {
    if (!state.admin?.enabled) return showToast('Hãy bật admin mode trước.');
    const target = Math.max(0, Number(byId('adminTargetAvailableInput')?.value) || 0);
    state.stats.coins = Math.max(0, target + state.spentCoins - state.bonusCoins);
    await ensureWalletConsistency();
    await Promise.all([storage.set({ stats: state.stats }), saveWalletState()]);
    showToast(`Đã đặt số dư khả dụng thành ${target}.`);
  }

  async function adjustAdminAvailableBy(delta) {
    if (!state.admin?.enabled) return showToast('Hãy bật admin mode trước.');
    const wallet = getWalletSnapshot();
    const target = Math.max(0, wallet.availableCoins + delta);
    state.stats.coins = Math.max(0, target + state.spentCoins - state.bonusCoins);
    await ensureWalletConsistency();
    await Promise.all([storage.set({ stats: state.stats }), saveWalletState()]);
    showToast(`Đã chỉnh số dư khả dụng ${delta >= 0 ? '+' : ''}${delta}.`);
  }

  async function resetAdminSpentCoins() {
    if (!state.admin?.enabled) return showToast('Hãy bật admin mode trước.');
    state.spentCoins = 0;
    await saveWalletState();
    showToast('Đã reset số coin đã tiêu cho UI.');
  }

  async function repairAdminWallet() {
    await ensureWalletConsistency();
    await saveWalletState();
    showToast('Đã sửa và đồng bộ lại ví UI.');
  }

  async function unlockAllUiPacks() {
    if (!state.admin?.enabled) return showToast('Hãy bật admin mode trước.');
    state.ui.unlockedThemes = THEMES.map((item) => item.id);
    state.ui.unlockedCardStyles = CARD_STYLES.map((item) => item.id);
    state.ui.unlockedLayoutPacks = LAYOUT_PACKS.map((item) => item.id);
    state.ui.unlockedFontTones = FONT_TONES.map((item) => item.id);
    state.ui.unlockedQuoteStyles = QUOTE_STYLES.map((item) => item.id);
    state.ui = normalizeUiState(state.ui);
    await saveUiState();
    showToast('Đã mở toàn bộ pack UI cho chế độ admin.');
  }

  async function restoreClassicUiMode() {
    if (!state.admin?.enabled) return showToast('Hãy bật admin mode trước.');
    state.ui.theme = 'midnight';
    state.ui.cardStyle = 'classic';
    state.ui.layoutPack = 'classic';
    state.ui.fontTone = 'system';
    state.ui.quoteStyle = 'soft';
    state.ui.wallpaperEnabled = false;
    state.ui = normalizeUiState(state.ui);
    await saveUiState();
    showToast('Đã quay về classic mode.');
  }

  async function resetCosmeticLayer() {
    if (!state.admin?.enabled) return showToast('Hãy bật admin mode trước.');
    const currentBonus = Math.max(0, Number(state.bonusCoins) || 0);
    state.ui = normalizeUiState({});
    state.spentCoins = 0;
    state.bonusCoins = currentBonus;
    await Promise.all([saveUiState(), saveWalletState()]);
    showToast('Đã reset lớp cosmetic mà không ảnh hưởng dữ liệu học.');
  }

  async function grantStarterWallet() {
    if (!state.admin?.enabled) return showToast('Hãy bật admin mode trước.');
    const targetAvailable = 3000;
    state.stats.coins = Math.max(0, targetAvailable + state.spentCoins - state.bonusCoins);
    await ensureWalletConsistency();
    await Promise.all([storage.set({ stats: state.stats }), saveWalletState()]);
    showToast('Đã nạp ví test 3000 xu khả dụng.');
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
    byId('pomodoroMiniWidget')?.classList.toggle('running', state.runtime.isRunning);

    if (byId('pomodoroMinutesSelect')) byId('pomodoroMinutesSelect').value = String(state.focus.preferredMinutes);
    if (byId('pomodoroAutoLaunch')) byId('pomodoroAutoLaunch').checked = state.focus.autoLaunchRecommended;
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
    openExclusiveModal('dailySayingModal');
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
    setText('currentQuoteStyleName', getMeta('quote', state.ui.quoteStyle).name);

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
    const saved = state.collections.savedPatterns.slice(0, 10).map((item) => ({
      id: item.patternId,
      category: 'saved',
      source: 'Đã lưu',
      pattern: item.text,
      grammar: 'Pattern bạn đã lưu trước đó.',
      example: item.translation || ''
    }));
    const suggested = PATTERN_TEMPLATES.map((item) => ({
      id: item.id,
      category: item.category || 'daily',
      source: 'Gợi ý',
      pattern: item.pattern,
      grammar: item.grammar,
      example: item.example
    }));
    const generated = [{
      id: currentPattern.id,
      category: 'quote',
      source: 'Từ quote hôm nay',
      pattern: currentPattern.pattern,
      grammar: currentPattern.grammar,
      example: currentPattern.example
    }];
    const merged = [...generated, ...saved, ...suggested];
    const seen = new Set();
    const deduped = merged.filter((item) => {
      const key = `${item.pattern}__${item.example}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const query = normalizeWordKey(byId('patternVaultSearchInput')?.value || '');
    const category = byId('patternVaultCategorySelect')?.value || 'all';
    return deduped.filter((item) => {
      const categoryMatch = category === 'all' || item.category === category;
      if (!categoryMatch) return false;
      if (!query) return true;
      return normalizeWordKey(`${item.pattern} ${item.grammar} ${item.example} ${item.source}`).includes(query);
    }).slice(0, 48);
  }

  function renderPatternVaultModal() {
    const grid = byId('patternVaultGrid');
    if (!grid) return;
    const items = getPatternVaultItems();
    grid.innerHTML = items.map((item) => `
      <div class="pattern-vault-card">
        <span>${escapeHtml(item.source)} • ${escapeHtml(item.category || 'daily')}</span>
        <strong>${escapeHtml(item.pattern)}</strong>
        <small>${escapeHtml(item.grammar)}</small>
        <div class="pattern-vault-example">${escapeHtml(item.example)}</div>
        <button class="secondary-btn" type="button" data-pattern-text="${escapeHtml(item.pattern)}" data-pattern-example="${escapeHtml(item.example)}">Lưu pattern này</button>
      </div>
    `).join('');
    if (!items.length) {
      grid.innerHTML = '<div class="classic-safe-note"><strong>Không tìm thấy pattern phù hợp.</strong><span>Thử đổi từ khóa hoặc nhóm pattern.</span></div>';
    }
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
