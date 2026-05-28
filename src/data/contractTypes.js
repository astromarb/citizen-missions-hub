// Single source of truth for hauling contract type styles
export const CONTRACT_TYPES = {
  'Hauling - Direct':        { bg: '#6750a4', color: '#fff' },
  'Hauling - Interstellar':  { bg: '#0066cc', color: '#fff' },
  'Hauling - Solar':         { bg: '#e07028', color: '#fff' },
  'Hauling - Planetary':     { bg: '#2e7d32', color: '#fff' },
  // Legacy alias — maps old saved contracts
  'Hauling - Stellar':       { bg: '#0066cc', color: '#fff' },
  'Hauling - Local':         { bg: '#2e7d32', color: '#fff' },
};

export const typeBg = (type) => CONTRACT_TYPES[type]?.bg ?? '#555';
export const typeColor = (type) => CONTRACT_TYPES[type]?.color ?? '#fff';
