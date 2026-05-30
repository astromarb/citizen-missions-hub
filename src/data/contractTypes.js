// Single source of truth for contract type styles
export const CONTRACT_TYPES = {
  'Hauling - Planetary':    { bg: '#2e7d32', color: '#fff' },
  'Hauling - Stellar':      { bg: '#e07028', color: '#fff' },
  'Hauling - Interstellar': { bg: '#0066cc', color: '#fff' },
  'Salvaging':              { bg: '#7c3aed', color: '#fff' },
  'Refueling':              { bg: '#0891b2', color: '#fff' },
  'Hand Mining':            { bg: '#16a34a', color: '#fff' },
  'Trading':                { bg: '#b45309', color: '#fff' },
  'Medical':                { bg: '#dc2626', color: '#fff' },
  'Ship Mining':            { bg: '#ca8a04', color: '#fff' },
};

export const typeBg    = (type) => CONTRACT_TYPES[type]?.bg    ?? '#555';
export const typeColor = (type) => CONTRACT_TYPES[type]?.color ?? '#fff';
