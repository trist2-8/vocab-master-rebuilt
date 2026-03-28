window.VMUpgradeAudio = (() => {
  let status = 'idle';
  let statusMessage = 'Bấm kích hoạt âm thanh để chuẩn bị cue Pomodoro.';
  let unlocked = false;
  const listeners = new Set();
  const cueCache = new Map();
  const ambientCache = new Map();
  let ambientAudio = null;
  let ambientLabel = '';

  const PACKS = {
    'soft-bell': {
      start: [[660, 0.08], [880, 0.12]],
      warning: [[587, 0.08], [698, 0.08], [784, 0.12]],
      end: [[784, 0.1], [988, 0.12], [1175, 0.18]],
      break: [[523, 0.1], [659, 0.14], [784, 0.16]]
    },
    'glass-chime': {
      start: [[740, 0.05], [1110, 0.14]],
      warning: [[620, 0.05], [930, 0.08], [1240, 0.12]],
      end: [[880, 0.06], [1320, 0.1], [1760, 0.18]],
      break: [[660, 0.06], [990, 0.1], [1480, 0.16]]
    },
    'cafe-timer': {
      start: [[520, 0.08], [640, 0.1]],
      warning: [[440, 0.08], [550, 0.08], [660, 0.12]],
      end: [[660, 0.08], [830, 0.1], [1040, 0.16]],
      break: [[392, 0.08], [523, 0.12], [659, 0.16]]
    },
    'night-tone': {
      start: [[480, 0.1], [720, 0.14]],
      warning: [[360, 0.08], [540, 0.1], [720, 0.12]],
      end: [[600, 0.1], [900, 0.14], [1200, 0.18]],
      break: [[430, 0.1], [645, 0.13], [860, 0.18]]
    }
  };

  const AMBIENT_PACKS = {
    'rain-soft': { label: 'Mưa nhẹ', kind: 'rain' },
    'cafe-soft': { label: 'Cafe nhẹ', kind: 'cafe' },
    'library-air': { label: 'Thư viện yên', kind: 'library' },
    'night-lofi': { label: 'Đêm êm', kind: 'night' }
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

  function createSeededRandom(seed) {
    let value = Math.abs(Number(seed) || 1) % 2147483647;
    if (value === 0) value = 1;
    return () => {
      value = (value * 48271) % 2147483647;
      return (value - 1) / 2147483646;
    };
  }

  function floatTo16BitPCM(output, offset, input) {
    for (let i = 0; i < input.length; i += 1, offset += 2) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
  }

  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i += 1) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  function buildWavDataUrl(samples, sampleRate = 22050) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);
    floatTo16BitPCM(view, 44, samples);
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
    return `data:audio/wav;base64,${btoa(binary)}`;
  }

  function buildToneSequenceDataUrl(sequence) {
    const sampleRate = 22050;
    const pieces = [];
    sequence.forEach(([frequency, duration], index) => {
      const length = Math.max(1, Math.floor(duration * sampleRate));
      const tone = new Float32Array(length);
      const fadeIn = Math.floor(sampleRate * 0.01);
      const fadeOut = Math.floor(sampleRate * 0.04);
      for (let i = 0; i < length; i += 1) {
        const t = i / sampleRate;
        const wave = Math.sin(2 * Math.PI * frequency * t) * 0.55;
        let env = 1;
        if (i < fadeIn) env = i / Math.max(1, fadeIn);
        else if (i > length - fadeOut) env = Math.max(0, (length - i) / Math.max(1, fadeOut));
        tone[i] = wave * env;
      }
      pieces.push(tone);
      if (index < sequence.length - 1) pieces.push(new Float32Array(Math.floor(sampleRate * 0.035)));
    });
    const totalLength = pieces.reduce((sum, part) => sum + part.length, 0);
    const merged = new Float32Array(totalLength);
    let offset = 0;
    pieces.forEach((part) => {
      merged.set(part, offset);
      offset += part.length;
    });
    return buildWavDataUrl(merged, sampleRate);
  }

  function smoothNoise(random, previous, amount = 0.86) {
    const target = (random() * 2) - 1;
    return previous * amount + target * (1 - amount);
  }

  function buildAmbientSamples(kind) {
    const sampleRate = 16000;
    const seconds = 8;
    const total = sampleRate * seconds;
    const out = new Float32Array(total);
    const random = createSeededRandom(kind.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0) + 17);
    let n1 = 0;
    let n2 = 0;
    let n3 = 0;
    let clickEnvelope = 0;

    for (let i = 0; i < total; i += 1) {
      const t = i / sampleRate;
      n1 = smoothNoise(random, n1, 0.97);
      n2 = smoothNoise(random, n2, 0.90);
      n3 = smoothNoise(random, n3, 0.75);
      let sample = 0;

      if (kind === 'rain') {
        if (random() > 0.9975) clickEnvelope = 0.9;
        clickEnvelope *= 0.965;
        const patter = (n3 * 0.20) + clickEnvelope * ((random() * 2) - 1) * 0.16;
        const wash = n1 * 0.10;
        sample = patter + wash + Math.sin(2 * Math.PI * 210 * t) * 0.005;
      } else if (kind === 'cafe') {
        if (random() > 0.9992) clickEnvelope = 0.7;
        clickEnvelope *= 0.975;
        const hum = Math.sin(2 * Math.PI * 140 * t) * 0.035 + Math.sin(2 * Math.PI * 220 * t) * 0.015;
        const murmur = n2 * 0.09;
        const clink = clickEnvelope * Math.sin(2 * Math.PI * 1100 * t) * 0.08;
        sample = hum + murmur + clink;
      } else if (kind === 'library') {
        if (random() > 0.9994) clickEnvelope = 0.55;
        clickEnvelope *= 0.982;
        const air = n1 * 0.06;
        const rustle = n2 * 0.045 + clickEnvelope * n3 * 0.08;
        const room = Math.sin(2 * Math.PI * 90 * t) * 0.012;
        sample = air + rustle + room;
      } else {
        const breeze = n1 * 0.05 + n2 * 0.03;
        const cricket = (Math.sin(2 * Math.PI * 6 * t) > 0.88 ? Math.sin(2 * Math.PI * 4200 * t) * 0.03 : 0);
        const hum = Math.sin(2 * Math.PI * 180 * t) * 0.012;
        sample = breeze + cricket + hum;
      }

      // gentle fade edges for smoother looping
      const edge = Math.min(i / (sampleRate * 0.3), (total - i) / (sampleRate * 0.3), 1);
      out[i] = sample * edge * 0.85;
    }

    return { samples: out, sampleRate };
  }

  function getBuiltInDataUrl(pack, cue) {
    const safePack = PACKS[pack] ? pack : 'soft-bell';
    const safeCue = PACKS[safePack][cue] ? cue : 'end';
    const key = `${safePack}:${safeCue}`;
    if (!cueCache.has(key)) cueCache.set(key, buildToneSequenceDataUrl(PACKS[safePack][safeCue]));
    return cueCache.get(key);
  }

  function getAmbientDataUrl(pack) {
    const safePack = AMBIENT_PACKS[pack] ? pack : 'rain-soft';
    if (!ambientCache.has(safePack)) {
      const built = buildAmbientSamples(AMBIENT_PACKS[safePack].kind);
      ambientCache.set(safePack, buildWavDataUrl(built.samples, built.sampleRate));
    }
    return ambientCache.get(safePack);
  }

  function createAudio(sourceUrl, volume = 65, loop = false) {
    const audio = new Audio(sourceUrl);
    audio.preload = 'auto';
    audio.loop = loop;
    audio.volume = Math.max(0, Math.min(1, (Number(volume) || 65) / 100));
    return audio;
  }

  async function playAudioElement(audio) {
    try {
      audio.currentTime = 0;
      const playResult = audio.play();
      if (playResult?.catch) await playResult;
      return true;
    } catch (_) {
      return false;
    }
  }

  async function unlock(options = {}) {
    const sourceUrl = options.source === 'custom' && options.customDataUrl
      ? options.customDataUrl
      : getBuiltInDataUrl('soft-bell', 'start');
    const audio = createAudio(sourceUrl, 0, false);
    const ok = await playAudioElement(audio);
    audio.pause();
    unlocked = ok;
    if (ok) setStatus('ready', 'Âm thanh Pomodoro đã sẵn sàng. Bạn có thể nghe thử hoặc bắt đầu phiên focus.');
    else setStatus('blocked', 'Trình duyệt vẫn chặn âm thanh. Hãy thử bấm Nghe thử hoặc dùng loop riêng.');
    return ok;
  }

  async function play({ pack = 'soft-bell', cue = 'end', volume = 65, enabled = true, source = 'built-in', customDataUrl = '' } = {}) {
    if (!enabled) return false;
    const sourceUrl = source === 'custom'
      ? customDataUrl
      : getBuiltInDataUrl(pack, cue);
    if (!sourceUrl) {
      setStatus('missing', source === 'custom' ? 'Bạn chưa chọn file âm thanh riêng.' : 'Không tìm thấy cue âm thanh tích hợp.');
      return false;
    }
    const audio = createAudio(sourceUrl, volume, false);
    const ok = await playAudioElement(audio);
    unlocked = unlocked || ok;
    if (ok) {
      setStatus('ready', source === 'custom' ? 'Đã phát file âm thanh riêng cho Pomodoro.' : 'Cue Pomodoro đang hoạt động bình thường.');
      return true;
    }
    setStatus('blocked', source === 'custom'
      ? 'File âm thanh chưa phát được. Hãy thử file khác hoặc kiểm tra trình duyệt.'
      : 'Cue âm thanh tích hợp chưa phát được. Hãy bấm Kích hoạt âm thanh hoặc dùng loop nền.');
    return false;
  }

  async function startAmbient({ pack = 'rain-soft', volume = 35, enabled = true, source = 'built-in', customDataUrl = '' } = {}) {
    if (!enabled) return false;
    const sourceUrl = source === 'custom-loop' ? customDataUrl : getAmbientDataUrl(pack);
    if (!sourceUrl) {
      setStatus('missing', source === 'custom-loop' ? 'Bạn chưa chọn file loop riêng cho ambient.' : 'Không tìm thấy ambient tích hợp.');
      return false;
    }
    stopAmbient(true);
    ambientAudio = createAudio(sourceUrl, volume, true);
    ambientLabel = source === 'custom-loop' ? 'Loop riêng' : (AMBIENT_PACKS[pack]?.label || 'Ambient');
    const ok = await playAudioElement(ambientAudio);
    unlocked = unlocked || ok;
    if (ok) {
      setStatus('ready', `Ambient đang chạy: ${ambientLabel}.`);
      return true;
    }
    ambientAudio = null;
    setStatus('blocked', source === 'custom-loop'
      ? 'Loop riêng chưa phát được. Hãy thử file khác.'
      : 'Ambient tích hợp chưa phát được. Hãy bấm Kích hoạt âm thanh rồi thử lại.');
    return false;
  }

  function stopAmbient(silent = false) {
    if (ambientAudio) {
      try {
        ambientAudio.pause();
        ambientAudio.currentTime = 0;
      } catch (_) {}
      ambientAudio = null;
    }
    ambientLabel = '';
    if (!silent) setStatus('ready', 'Đã dừng ambient nền.');
    return true;
  }

  function isAmbientPlaying() {
    return Boolean(ambientAudio && !ambientAudio.paused);
  }

  function getStatus() {
    return {
      status,
      message: statusMessage,
      unlocked,
      supported: true,
      ambientPlaying: isAmbientPlaying(),
      ambientLabel
    };
  }

  function onStatusChange(listener) {
    if (typeof listener !== 'function') return () => {};
    listeners.add(listener);
    try { listener(getStatus()); } catch (_) {}
    return () => listeners.delete(listener);
  }

  return {
    play,
    unlock,
    startAmbient,
    stopAmbient,
    isAmbientPlaying,
    getStatus,
    onStatusChange,
    PACKS,
    AMBIENT_PACKS
  };
})();
