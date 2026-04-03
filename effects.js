window.VMUpgradeEffects = (() => {
  let layer = null;
  let currentSignature = '';
  let lastOptions = { effect: 'off', intensity: 55, speed: 100, reducedMotion: false };
  const SUPPORTED = ['off', 'aurora', 'fireflies', 'stardust', 'prism', 'comets', 'orbs', 'bubbles', 'rain', 'window-rain', 'snow', 'dust', 'mist', 'neon', 'petals'];
  const MAX_PARTICLES = 32;

  function ensureLayer() {
    if (layer && document.body.contains(layer)) return layer;
    layer = document.createElement('div');
    layer.id = 'vmWeatherLayer';
    layer.className = 'vm-weather-layer hidden';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);
    return layer;
  }

  function clearLayer() {
    ensureLayer().replaceChildren();
  }

  function getEffectConfig(effect) {
    const map = {
      aurora: { countFactor: 22, minCount: 2, baseDuration: 14, minSize: 180, sizeSpread: 160, driftSpread: 56 },
      fireflies: { countFactor: 7.5, minCount: 8, baseDuration: 9.2, minSize: 4, sizeSpread: 10, driftSpread: 34 },
      stardust: { countFactor: 8.8, minCount: 8, baseDuration: 8.4, minSize: 2, sizeSpread: 5, driftSpread: 16 },
      prism: { countFactor: 13, minCount: 4, baseDuration: 7.2, minSize: 24, sizeSpread: 32, driftSpread: 36 },
      comets: { countFactor: 10.5, minCount: 4, baseDuration: 4.6, minSize: 18, sizeSpread: 28, driftSpread: 22 },
      orbs: { countFactor: 12, minCount: 4, baseDuration: 10.2, minSize: 18, sizeSpread: 34, driftSpread: 26 },
      bubbles: { countFactor: 11, minCount: 5, baseDuration: 9.4, minSize: 12, sizeSpread: 24, driftSpread: 20 },
      rain: { countFactor: 4.2, minCount: 10, baseDuration: 1.5, minSize: 14, sizeSpread: 34, driftSpread: 18 },
      'window-rain': { countFactor: 4.6, minCount: 8, baseDuration: 1.9, minSize: 28, sizeSpread: 46, driftSpread: 10 },
      snow: { countFactor: 6.4, minCount: 6, baseDuration: 5.8, minSize: 4, sizeSpread: 9, driftSpread: 16 },
      dust: { countFactor: 8.5, minCount: 8, baseDuration: 8.5, minSize: 3, sizeSpread: 8, driftSpread: 24 },
      mist: { countFactor: 18, minCount: 3, baseDuration: 12, minSize: 120, sizeSpread: 180, driftSpread: 40 },
      neon: { countFactor: 12, minCount: 4, baseDuration: 6.5, minSize: 10, sizeSpread: 20, driftSpread: 28 },
      petals: { countFactor: 8.5, minCount: 6, baseDuration: 7.4, minSize: 7, sizeSpread: 12, driftSpread: 40 }
    };
    return map[effect] || map.rain;
  }

  function buildParticles(effect, intensity, speed, reducedMotion) {
    const node = ensureLayer();
    clearLayer();
    node.className = 'vm-weather-layer';
    node.classList.add(`is-${effect}`);
    node.classList.toggle('is-reduced-motion', Boolean(reducedMotion));

    const config = getEffectConfig(effect);
    const count = Math.min(MAX_PARTICLES, Math.max(config.minCount, Math.round(intensity / config.countFactor)));
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < count; i += 1) {
      const particle = document.createElement('span');
      particle.className = `vm-weather-particle ${effect}`;
      particle.style.setProperty('--vm-left', `${Math.random() * 100}%`);
      particle.style.setProperty('--vm-delay', `${(Math.random() * -10).toFixed(2)}s`);
      particle.style.setProperty('--vm-duration', `${((config.baseDuration * (170 / Math.max(40, speed)))).toFixed(2)}s`);
      particle.style.setProperty('--vm-opacity', `${(0.12 + Math.random() * (effect === 'mist' ? 0.16 : 0.38)).toFixed(2)}`);
      particle.style.setProperty('--vm-drift', `${(Math.random() * config.driftSpread * 2 - config.driftSpread).toFixed(2)}px`);
      particle.style.setProperty('--vm-size', `${(config.minSize + Math.random() * config.sizeSpread).toFixed(2)}px`);
      particle.style.setProperty('--vm-rotate', `${(Math.random() * 28 - 14).toFixed(2)}deg`);
      particle.style.setProperty('--vm-blur', `${(effect === 'mist' ? 10 + Math.random() * 12 : effect === 'orbs' ? 5 + Math.random() * 10 : effect === 'bubbles' ? 1 + Math.random() * 2.6 : effect === 'neon' ? 2 + Math.random() * 4 : effect === 'aurora' ? 8 + Math.random() * 14 : effect === 'prism' || effect === 'comets' ? 1.4 + Math.random() * 3.2 : 0.2 + Math.random() * 1.8).toFixed(2)}px`);
      fragment.appendChild(particle);
    }
    node.appendChild(fragment);
  }

  function hideLayer() {
    const node = ensureLayer();
    node.className = 'vm-weather-layer hidden';
    clearLayer();
  }

  function apply({ effect = 'off', intensity = 55, speed = 100, reducedMotion = false } = {}) {
    const safeEffect = SUPPORTED.includes(effect) ? effect : 'off';
    lastOptions = { effect: safeEffect, intensity, speed, reducedMotion };
    const signature = [safeEffect, intensity, speed, reducedMotion ? 1 : 0, document.hidden ? 1 : 0].join(':');
    if (signature === currentSignature) return;
    currentSignature = signature;

    if (safeEffect === 'off' || document.hidden) {
      hideLayer();
      return;
    }
    buildParticles(safeEffect, intensity, speed, reducedMotion);
  }

  document.addEventListener('visibilitychange', () => {
    currentSignature = '';
    apply(lastOptions);
  });

  return { apply, SUPPORTED };
})();
