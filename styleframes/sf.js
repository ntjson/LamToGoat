// Shared helpers for the gate-1 style frames.

// Crop a real screenshot into `el`: source rect (sx, sy, sw, sh) in image pixels, shown at `scale`.
export function uiCrop(el, src, { sx, sy, sw, sh, scale, radius = 0 }) {
  el.classList.add('ui');
  el.style.width = `${sw * scale}px`;
  el.style.height = `${sh * scale}px`;
  el.style.borderRadius = `${radius * scale}px`;
  const img = new Image();
  img.src = src;
  img.style.transform = `scale(${scale}) translate(${-sx}px, ${-sy}px)`;
  el.appendChild(img);
  return img;
}

// Resolves once every declared font face and every <img> is decoded.
// (No requestAnimationFrame: the screenshot call itself waits for the next paint.)
export function ready() {
  const fonts = Promise.all([...document.fonts].map((f) => f.load())).then(() => document.fonts.ready);
  const imgs = Promise.all([...document.images].map((i) => i.decode()));
  return Promise.all([fonts, imgs]);
}
