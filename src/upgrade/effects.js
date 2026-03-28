window.VMUpgradeEffects = (() => {
  let layer = null;
  let currentSignature = '';

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

  function buildParticles(effect, intensity, speed, reducedMotion) {
    const node = ensureLayer();
    clearLayer();
    node.classList.remove('hidden', 'is-rain', 'is-snow', 'is-reduced-motion');
    node.classList.add(`is-${effect}`);
    node.classList.toggle('is-reduced-motion', Boolean(reducedMotion));

    const count = effect === 'rain'
      ? Math.max(10, Math.round(intensity / 2.8))
      : Math.max(8, Math.round(intensity / 4));

    for (let i = 0; i < count; i += 1) {
      const particle = document.createElement('span');
      particle.className = `vm-weather-particle ${effect}`;
      particle.style.setProperty('--vm-left', `${Math.random() * 100}%`);
      particle.style.setProperty('--vm-delay', `${(Math.random() * -6).toFixed(2)}s`);
      particle.style.setProperty('--vm-duration', `${(((effect === 'rain' ? 1.4 : 5.8) * (160 / Math.max(40, speed)))).toFixed(2)}s`);
      particle.style.setProperty('--vm-opacity', (effect === 'rain' ? 0.15 + Math.random() * 0.35 : 0.25 + Math.random() * 0.45).toFixed(2));
      particle.style.setProperty('--vm-drift', `${(Math.random() * 30 - 15).toFixed(2)}px`);
      particle.style.setProperty('--vm-size', `${(effect === 'rain' ? 14 + Math.random() * 32 : 4 + Math.random() * 9).toFixed(2)}px`);
      node.appendChild(particle);
    }
  }

  function apply({ effect = 'off', intensity = 55, speed = 100, reducedMotion = false } = {}) {
    const safeEffect = ['off', 'rain', 'snow'].includes(effect) ? effect : 'off';
    const signature = [safeEffect, intensity, speed, reducedMotion ? 1 : 0].join(':');
    if (signature === currentSignature) return;
    currentSignature = signature;

    const node = ensureLayer();
    if (safeEffect === 'off') {
      node.classList.add('hidden');
      clearLayer();
      return;
    }
    buildParticles(safeEffect, intensity, speed, reducedMotion);
  }

  return { apply };
})();
