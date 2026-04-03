window.VMUpgradeAudio = (() => {
  let context = null;
  let status = 'idle';
  let statusMessage = 'Chọn folder .webm nếu bạn muốn phát playlist sau khi Pomodoro kết thúc.';
  let unlocked = false;
  const listeners = new Set();

  let playlistFiles = [];
  let playlistTrackNames = [];
  let playlistActive = false;
  let playlistIndex = 0;
  let playlistCurrentTrack = '';
  let playlistLabel = '';
  let currentPlaylistAudio = null;
  let currentPlaylistUrl = '';
  let playlistVolume = 0.7;

  const PACKS = {
    'soft-bell': { start: [[660, 0.08], [880, 0.12]], warning: [[587, 0.08], [698, 0.08], [784, 0.12]], end: [[784, 0.1], [988, 0.12], [1175, 0.18]], break: [[523, 0.1], [659, 0.14], [784, 0.16]] },
    'glass-chime': { start: [[740, 0.05], [1110, 0.14]], warning: [[620, 0.05], [930, 0.08], [1240, 0.12]], end: [[880, 0.06], [1320, 0.1], [1760, 0.18]], break: [[660, 0.06], [990, 0.1], [1480, 0.16]] },
    'cafe-timer': { start: [[520, 0.08], [640, 0.1]], warning: [[440, 0.08], [550, 0.08], [660, 0.12]], end: [[660, 0.08], [830, 0.1], [1040, 0.16]], break: [[392, 0.08], [523, 0.12], [659, 0.16]] },
    'night-tone': { start: [[480, 0.1], [720, 0.14]], warning: [[360, 0.08], [540, 0.1], [720, 0.12]], end: [[600, 0.1], [900, 0.14], [1200, 0.18]], break: [[430, 0.1], [645, 0.13], [860, 0.18]] }
  };

  function notifyStatus() {
    const snapshot = getStatus();
    listeners.forEach((listener) => {
      try { listener(snapshot); } catch (_) {}
    });
  }

  function setStatus(nextStatus, message) {
    status = nextStatus;
    statusMessage = message;
    notifyStatus();
  }

  function ensureContext() {
    if (context) return context;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    context = new Ctx();
    return context;
  }

  async function resumeContext() {
    const ctx = ensureContext();
    if (!ctx) return null;
    if (ctx.state === 'suspended') {
      try { await ctx.resume(); } catch (_) { return null; }
    }
    return ctx;
  }

  function scheduleTone(ctx, frequency, startAt, duration, volume) {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, startAt);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), startAt + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.02);
  }

  async function play({ pack = 'soft-bell', cue = 'end', volume = 65, enabled = true } = {}) {
    if (!enabled) return false;
    const ctx = await resumeContext();
    if (!ctx) {
      setStatus('blocked', 'Trình duyệt chưa cho phát âm thanh cue Pomodoro.');
      return false;
    }
    const safePack = PACKS[pack] ? pack : 'soft-bell';
    const sequence = PACKS[safePack][cue] || PACKS[safePack].end;
    const masterVolume = Math.max(0.02, Math.min(0.35, (Number(volume) || 65) / 250));
    let offset = 0;
    sequence.forEach(([frequency, duration], index) => {
      scheduleTone(ctx, frequency, ctx.currentTime + offset, duration, masterVolume * (1 - index * 0.08));
      offset += Math.max(0.06, duration * 0.65);
    });
    unlocked = true;
    setStatus('ready', 'Cue Pomodoro đang hoạt động bình thường.');
    return true;
  }

  function sortPlaylistFiles(files) {
    return [...files].sort((a, b) => {
      const pathA = a.webkitRelativePath || a.name;
      const pathB = b.webkitRelativePath || b.name;
      return pathA.localeCompare(pathB, undefined, { numeric: true, sensitivity: 'base' });
    });
  }

  function isPlaylistFile(file) {
    const name = String(file?.name || '').toLowerCase();
    const type = String(file?.type || '').toLowerCase();
    return name.endsWith('.webm') || type === 'audio/webm' || type === 'video/webm';
  }

  async function loadCompletionPlaylist(files) {
    const fileList = sortPlaylistFiles(Array.from(files || []).filter(isPlaylistFile));
    stopCompletionPlaylist(true);
    if (!fileList.length) {
      playlistFiles = [];
      playlistTrackNames = [];
      playlistLabel = '';
      setStatus('missing', 'Folder chưa có file .webm hợp lệ cho playlist sau Pomodoro.');
      return { ok: false, count: 0, names: [] };
    }
    playlistFiles = fileList;
    playlistTrackNames = fileList.map((file) => file.name);
    playlistLabel = playlistTrackNames.length === 1 ? playlistTrackNames[0] : `${playlistTrackNames.length} file .webm`;
    setStatus('ready', `Đã nạp playlist hoàn thành Pomodoro: ${playlistTrackNames.length} file. App sẽ phát từng file để giảm RAM.`);
    return { ok: true, count: playlistTrackNames.length, names: [...playlistTrackNames] };
  }

  function cleanupCurrentPlaylistAudio() {
    if (currentPlaylistAudio) {
      try {
        currentPlaylistAudio.onended = null;
        currentPlaylistAudio.onerror = null;
        currentPlaylistAudio.pause();
        currentPlaylistAudio.removeAttribute('src');
        currentPlaylistAudio.load();
      } catch (_) {}
    }
    if (currentPlaylistUrl) {
      try { URL.revokeObjectURL(currentPlaylistUrl); } catch (_) {}
    }
    currentPlaylistAudio = null;
    currentPlaylistUrl = '';
  }

  async function playPlaylistTrack(index) {
    if (!playlistActive || !playlistFiles.length) return false;
    const file = playlistFiles[index];
    if (!file) return false;
    cleanupCurrentPlaylistAudio();
    const audio = new Audio();
    currentPlaylistAudio = audio;
    currentPlaylistUrl = URL.createObjectURL(file);
    audio.preload = 'auto';
    audio.src = currentPlaylistUrl;
    audio.volume = playlistVolume;
    playlistCurrentTrack = playlistTrackNames[index] || `Track ${index + 1}`;
    playlistIndex = index;
    audio.onended = async () => {
      cleanupCurrentPlaylistAudio();
      if (!playlistActive || !playlistFiles.length) return;
      const nextIndex = (playlistIndex + 1) % playlistFiles.length;
      playlistIndex = nextIndex;
      await playPlaylistTrack(nextIndex);
    };
    audio.onerror = async () => {
      cleanupCurrentPlaylistAudio();
      if (!playlistActive || !playlistFiles.length) return;
      const nextIndex = (playlistIndex + 1) % playlistFiles.length;
      playlistIndex = nextIndex;
      setStatus('ready', `Bỏ qua file lỗi, chuyển sang ${playlistTrackNames[nextIndex] || 'file tiếp theo'}.`);
      await playPlaylistTrack(nextIndex);
    };
    try {
      await audio.play();
      setStatus('ready', `Playlist đang chạy • ${playlistCurrentTrack}.`);
      unlocked = true;
      return true;
    } catch (_) {
      cleanupCurrentPlaylistAudio();
      setStatus('blocked', 'Trình duyệt chưa cho phép phát playlist. Hãy bấm một nút rồi thử lại.');
      return false;
    }
  }

  async function startCompletionPlaylist({ volume = 70 } = {}) {
    if (!playlistFiles.length) {
      setStatus('missing', 'Bạn chưa chọn folder playlist .webm.');
      return false;
    }
    await resumeContext();
    playlistVolume = Math.max(0, Math.min(1, (Number(volume) || 70) / 100));
    playlistActive = true;
    playlistIndex = 0;
    return playPlaylistTrack(0);
  }

  function stopCompletionPlaylist(silent = false) {
    playlistActive = false;
    cleanupCurrentPlaylistAudio();
    playlistCurrentTrack = '';
    if (!silent) setStatus('ready', 'Đã dừng playlist hoàn thành Pomodoro.');
    return true;
  }

  function clearCompletionPlaylist() {
    stopCompletionPlaylist(true);
    playlistFiles = [];
    playlistTrackNames = [];
    playlistLabel = '';
    setStatus('ready', 'Đã xóa playlist hoàn thành Pomodoro.');
  }

  function isCompletionPlaylistPlaying() {
    return Boolean(playlistActive && currentPlaylistAudio && !currentPlaylistAudio.paused);
  }

  function getStatus() {
    return {
      status,
      message: statusMessage,
      unlocked,
      playlistPlaying: isCompletionPlaylistPlaying(),
      playlistLabel,
      playlistTrackCount: playlistFiles.length,
      playlistCurrentTrack
    };
  }

  async function unlock() {
    const ctx = await resumeContext();
    unlocked = Boolean(ctx || unlocked);
    if (unlocked) setStatus('ready', 'Âm thanh Pomodoro đã sẵn sàng. Bạn có thể nghe thử hoặc chạy playlist.');
    else setStatus('blocked', 'Trình duyệt vẫn chặn âm thanh. Hãy thử lại sau một thao tác trực tiếp.');
    return unlocked;
  }

  function onStatusChange(listener) {
    if (typeof listener !== 'function') return () => {};
    listeners.add(listener);
    try { listener(getStatus()); } catch (_) {}
    return () => listeners.delete(listener);
  }

  return { play, loadCompletionPlaylist, startCompletionPlaylist, stopCompletionPlaylist, clearCompletionPlaylist, isCompletionPlaylistPlaying, getStatus, unlock, onStatusChange, PACKS };
})();
