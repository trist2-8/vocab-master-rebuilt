window.VMUpgradeEffects = (() => {
  let layer = null;
  let currentSignature = '';
  const SUPPORTED = ['off', 'rain', 'window-rain', 'snow', 'dust', 'mist', 'neon', 'petals'];

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
    ensureLayer().innerHTML = '';
  }

  function getEffectConfig(effect) {
    const map = {
      rain: { countFactor: 2.8, minCount: 12, baseDuration: 1.5, minSize: 14, sizeSpread: 34, driftSpread: 18 },
      'window-rain': { countFactor: 3.2, minCount: 10, baseDuration: 1.9, minSize: 28, sizeSpread: 46, driftSpread: 10 },
      snow: { countFactor: 4.2, minCount: 8, baseDuration: 5.8, minSize: 4, sizeSpread: 9, driftSpread: 16 },
      dust: { countFactor: 5.5, minCount: 10, baseDuration: 8.5, minSize: 3, sizeSpread: 8, driftSpread: 24 },
      mist: { countFactor: 14, minCount: 4, baseDuration: 12, minSize: 120, sizeSpread: 180, driftSpread: 40 },
      neon: { countFactor: 8, minCount: 6, baseDuration: 6.5, minSize: 10, sizeSpread: 20, driftSpread: 28 },
      petals: { countFactor: 6, minCount: 8, baseDuration: 7.4, minSize: 7, sizeSpread: 12, driftSpread: 40 }
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
    const count = Math.max(config.minCount, Math.round(intensity / config.countFactor));

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
      particle.style.setProperty('--vm-blur', `${(effect === 'mist' ? 10 + Math.random() * 12 : effect === 'neon' ? 2 + Math.random() * 4 : 0.2 + Math.random() * 1.8).toFixed(2)}px`);
      node.appendChild(particle);
    }
  }

  function apply({ effect = 'off', intensity = 55, speed = 100, reducedMotion = false } = {}) {
    const safeEffect = SUPPORTED.includes(effect) ? effect : 'off';
    const signature = [safeEffect, intensity, speed, reducedMotion ? 1 : 0].join(':');
    if (signature === currentSignature) return;
    currentSignature = signature;

    const node = ensureLayer();
    if (safeEffect === 'off') {
      node.className = 'vm-weather-layer hidden';
      clearLayer();
      return;
    }
    buildParticles(safeEffect, intensity, speed, reducedMotion);
  }

  return { apply, SUPPORTED };
})();
