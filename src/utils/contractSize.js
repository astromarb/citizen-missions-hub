// Contract size classification based on total SCU
export const CONTRACT_SIZE_TIERS = [
  { label: 'XS', maxScu: 10,       bg: '#5c5c5c', tip: '1 SCU boxes · up to 10 SCU' },
  { label: 'S',  maxScu: 26,       bg: '#2e7d32', tip: '4 SCU max · up to 26 SCU' },
  { label: 'M',  maxScu: 126,      bg: '#0066cc', tip: '8 SCU max · up to 126 SCU' },
  { label: 'L',  maxScu: Infinity, bg: '#c41e3a', tip: '32 SCU containers · 600+ SCU' },
];

export const getContractSize = (scu) =>
  CONTRACT_SIZE_TIERS.find(t => scu <= t.maxScu) ?? CONTRACT_SIZE_TIERS[CONTRACT_SIZE_TIERS.length - 1];
