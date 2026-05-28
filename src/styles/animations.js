const CSS = `
@keyframes cmh-fade-up {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes cmh-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes cmh-pop {
  from { opacity: 0; transform: scale(0.88); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes cmh-slide-down {
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes cmh-row-out {
  from { opacity: 0; transform: translateY(-42px); }
  to   { opacity: 1; transform: translateY(0); }
}
`;

let _injected = false;
export function injectAnimations() {
  if (_injected) return;
  _injected = true;
  const el = document.createElement('style');
  el.id = 'cmh-animations';
  el.textContent = CSS;
  document.head.appendChild(el);
}

export const A = {
  fadeUp:    (delay = 0) => `cmh-fade-up 0.40s cubic-bezier(0.22,1,0.36,1) ${delay}ms both`,
  fadeIn:    (delay = 0) => `cmh-fade-in 0.28s ease ${delay}ms both`,
  pop:       (delay = 0) => `cmh-pop 0.22s cubic-bezier(0.34,1.56,0.64,1) ${delay}ms both`,
  slideDown: (delay = 0) => `cmh-slide-down 0.22s ease ${delay}ms both`,
  stagger:   (i, base = 0, step = 48) => `cmh-fade-up 0.40s cubic-bezier(0.22,1,0.36,1) ${base + i * step}ms both`,
  rowOut:    (i, step = 160) => `cmh-row-out 0.34s cubic-bezier(0.22,1,0.36,1) ${i * step}ms both`,
};
