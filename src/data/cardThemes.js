// colors[0]=Sun, [1]=Mon, [2]=Tue, [3]=Wed, [4]=Thu, [5]=Fri, [6]=Sat
export const CARD_THEMES = {
  'None': {
    label: 'None',
    desc: 'Status colors only (default)',
    colors: [null, null, null, null, null, null, null],
  },
  'Alpha Color Set': {
    label: 'Alpha Color Set',
    desc: 'The original day-of-week palette',
    colors: ['#e8db7d', '#19535f', '#0b7a75', '#d7c9aa', '#7b2d26', '#f0f3f5', '#c0d684'],
  },
  'Spectrum': {
    label: 'Spectrum',
    desc: 'A different hue for every day',
    colors: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'],
  },
  'Navy Ops': {
    label: 'Navy Ops',
    desc: 'Deep blues across the week',
    colors: ['#1e3a8a', '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#1d4ed8', '#1e3a8a'],
  },
  'Ember': {
    label: 'Ember',
    desc: 'Warm reds and oranges',
    colors: ['#7f1d1d', '#b91c1c', '#c2410c', '#ea580c', '#f97316', '#c2410c', '#b91c1c'],
  },
  'Forest': {
    label: 'Forest',
    desc: 'Greens and teals',
    colors: ['#14532d', '#16a34a', '#15803d', '#059669', '#0891b2', '#15803d', '#14532d'],
  },
  'Dusk': {
    label: 'Dusk',
    desc: 'Purples fading to violet',
    colors: ['#4c1d95', '#6d28d9', '#7c3aed', '#8b5cf6', '#7c3aed', '#6d28d9', '#4c1d95'],
  },
  'Steel': {
    label: 'Steel',
    desc: 'Neutral slate grays',
    colors: ['#334155', '#475569', '#64748b', '#94a3b8', '#64748b', '#475569', '#334155'],
  },
};

export const getTheme = (name) => CARD_THEMES[name] ?? CARD_THEMES['None'];

export const isLightColor = (hex) => {
  if (!hex) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55;
};

