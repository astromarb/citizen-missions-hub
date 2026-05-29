// Single source of truth for contract type styles
export const CONTRACT_TYPES = {
  'Hauling - Planetary':    { bg: '#2e7d32', color: '#fff' },
  'Hauling - Stellar':      { bg: '#e07028', color: '#fff' },
  'Hauling - Interstellar': { bg: '#0066cc', color: '#fff' },
  'Salvaging':              { bg: '#7c3aed', color: '#fff' },
};

export const typeBg    = (type) => CONTRACT_TYPES[type]?.bg    ?? '#555';
export const typeColor = (type) => CONTRACT_TYPES[type]?.color ?? '#fff';
