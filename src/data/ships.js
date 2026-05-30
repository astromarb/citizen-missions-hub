export const SHIPS = [
  // Aurora series
  { name: 'Aurora ES',                 manufacturer: 'RSI',       value: 172400 },
  { name: 'Aurora MR',                 manufacturer: 'RSI',       value: 182350 },
  { name: 'Aurora CL',                 manufacturer: 'RSI',       value: 200000 },
  { name: 'Aurora LN',                 manufacturer: 'RSI',       value: 206200 },
  // Mustang series
  { name: 'Mustang Alpha',             manufacturer: 'Consolidated Outland', value: 195000 },
  { name: 'Mustang Beta',              manufacturer: 'Consolidated Outland', value: 285000 },
  { name: 'Mustang Delta',             manufacturer: 'Consolidated Outland', value: 340000 },
  { name: 'Mustang Gamma',             manufacturer: 'Consolidated Outland', value: 320000 },
  { name: 'Mustang Omega',             manufacturer: 'Consolidated Outland', value: 390000 },
  // 300 series
  { name: '300i',                      manufacturer: 'Origin',    value: 820000 },
  { name: '315p',                      manufacturer: 'Origin',    value: 965000 },
  { name: '325a',                      manufacturer: 'Origin',    value: 1055600 },
  { name: '350r',                      manufacturer: 'Origin',    value: 1276000 },
  // 600 series
  { name: '600i Touring',              manufacturer: 'Origin',    value: 17038400 },
  { name: '600i Explorer',             manufacturer: 'Origin',    value: 19308200 },
  // Avenger series
  { name: 'Avenger Titan',             manufacturer: 'Aegis',     value: 739000 },
  { name: 'Avenger Titan Renegade',    manufacturer: 'Aegis',     value: 775000 },
  { name: 'Avenger Stalker',           manufacturer: 'Aegis',     value: 756000 },
  { name: 'Avenger Warlock',           manufacturer: 'Aegis',     value: 819800 },
  // Cutlass series
  { name: 'Cutlass Black',             manufacturer: 'Drake',     value: 1553200 },
  { name: 'Cutlass Blue',              manufacturer: 'Drake',     value: 1749600 },
  { name: 'Cutlass Red',               manufacturer: 'Drake',     value: 1499600 },
  { name: 'Cutlass Steel',             manufacturer: 'Drake',     value: 1850000 },
  // Freelancer series
  { name: 'Freelancer',                manufacturer: 'MISC',      value: 2012000 },
  { name: 'Freelancer DUR',            manufacturer: 'MISC',      value: 2172000 },
  { name: 'Freelancer MAX',            manufacturer: 'MISC',      value: 2247000 },
  { name: 'Freelancer MIS',            manufacturer: 'MISC',      value: 2562000 },
  // Constellation series
  { name: 'Constellation Taurus',      manufacturer: 'RSI',       value: 4277500 },
  { name: 'Constellation Andromeda',   manufacturer: 'RSI',       value: 4874500 },
  { name: 'Constellation Aquila',      manufacturer: 'RSI',       value: 5529900 },
  { name: 'Constellation Phoenix',     manufacturer: 'RSI',       value: 6831200 },
  // Vanguard series
  { name: 'Vanguard Warden',           manufacturer: 'Aegis',     value: 3741400 },
  { name: 'Vanguard Harbinger',        manufacturer: 'Aegis',     value: 4206600 },
  { name: 'Vanguard Sentinel',         manufacturer: 'Aegis',     value: 4097200 },
  { name: 'Vanguard Void',             manufacturer: 'Aegis',     value: 3987800 },
  // Caterpillar
  { name: 'Caterpillar',               manufacturer: 'Drake',     value: 5938600 },
  // Hercules
  { name: 'Hercules Starlifter C2',    manufacturer: 'Crusader',  value: 6855700 },
  { name: 'Hercules Starlifter M2',    manufacturer: 'Crusader',  value: 8238400 },
  { name: 'Hercules Starlifter A2',    manufacturer: 'Crusader',  value: 11041600 },
  // Carrack
  { name: 'Carrack',                   manufacturer: 'Anvil',     value: 19618600 },
  // Hammerhead
  { name: 'Hammerhead',                manufacturer: 'Aegis',     value: 22612900 },
  // Idris-M / P (no aUEC price normally, rough estimate)
  // Hull series
  { name: 'Hull A',                    manufacturer: 'MISC',      value: 989900 },
  { name: 'Hull B',                    manufacturer: 'MISC',      value: 1998700 },
  { name: 'Hull C',                    manufacturer: 'MISC',      value: 5912300 },
  // Hornet series
  { name: 'F7C Hornet',                manufacturer: 'Anvil',     value: 1175500 },
  { name: 'F7C Hornet Wildfire',       manufacturer: 'Anvil',     value: 1453000 },
  { name: 'F7C-M Super Hornet',        manufacturer: 'Anvil',     value: 1762700 },
  { name: 'F7C-M Super Hornet Heartseeker', manufacturer: 'Anvil', value: 1850000 },
  { name: 'F7C-R Hornet Tracker',      manufacturer: 'Anvil',     value: 1350000 },
  { name: 'F7C-S Hornet Ghost',        manufacturer: 'Anvil',     value: 1262400 },
  { name: 'F7A Hornet Mk II',          manufacturer: 'Anvil',     value: 2000000 },
  // Arrow
  { name: 'Arrow',                     manufacturer: 'Anvil',     value: 1023300 },
  // Gladius
  { name: 'Gladius',                   manufacturer: 'Anvil',     value: 1149800 },
  { name: 'Gladius Valiant',           manufacturer: 'Anvil',     value: 1250000 },
  // Sabre
  { name: 'Sabre',                     manufacturer: 'Aegis',     value: 2173100 },
  { name: 'Sabre Comet',               manufacturer: 'Aegis',     value: 2350000 },
  // Eclipse
  { name: 'Eclipse',                   manufacturer: 'Aegis',     value: 3997500 },
  // Buccaneer
  { name: 'Buccaneer',                 manufacturer: 'Drake',     value: 1080600 },
  // Cutter
  { name: 'Cutter',                    manufacturer: 'Drake',     value: 530000 },
  { name: 'Cutter Rambler',            manufacturer: 'Drake',     value: 590000 },
  { name: 'Cutter Scout',              manufacturer: 'Drake',     value: 645000 },
  // Expanse
  { name: 'Expanse',                   manufacturer: 'Drake',     value: 1250000 },
  // Mole
  { name: 'Mole',                      manufacturer: 'Argo',      value: 4490000 },
  { name: 'Mole Carbon Edition',       manufacturer: 'Argo',      value: 4600000 },
  // Prospector
  { name: 'Prospector',                manufacturer: 'MISC',      value: 2059600 },
  // Pioneer
  { name: 'Pioneer',                   manufacturer: 'MISC',      value: 25000000 },
  // Reclaimer
  { name: 'Reclaimer',                 manufacturer: 'Aegis',     value: 14280000 },
  // Vulture
  { name: 'Vulture',                   manufacturer: 'Drake',     value: 1421100 },
  // Ironclad
  { name: 'Ironclad',                  manufacturer: 'Aegis',     value: 8900000 },
  { name: 'Ironclad Assault',          manufacturer: 'Aegis',     value: 10200000 },
  // Raft
  { name: 'Raft',                      manufacturer: 'MISC',      value: 1971900 },
  // Taurus
  { name: 'Taurus',                    manufacturer: 'Crusader',  value: 2000000 },
  // Zeus
  { name: 'Zeus Mk II MR',             manufacturer: 'RSI',       value: 1855600 },
  { name: 'Zeus Mk II ES',             manufacturer: 'RSI',       value: 1655600 },
  { name: 'Zeus Mk II CL',             manufacturer: 'RSI',       value: 2055600 },
  // Starfarer
  { name: 'Starfarer',                 manufacturer: 'MISC',      value: 7413400 },
  { name: 'Starfarer Gemini',          manufacturer: 'MISC',      value: 8278800 },
  // Defender
  { name: 'Defender',                  manufacturer: 'Banu',      value: 3022700 },
  // Merchantman
  { name: 'Merchantman',               manufacturer: 'Banu',      value: 25000000 },
  // Glaive / Blade
  { name: 'Glaive',                    manufacturer: 'Vanduul',   value: 5000000 },
  { name: 'Scythe',                    manufacturer: 'Vanduul',   value: 3500000 },
  // Mercury Star Runner
  { name: 'Mercury Star Runner',       manufacturer: 'MISC',      value: 4588800 },
  // Reliant series
  { name: 'Reliant Kore',              manufacturer: 'MISC',      value: 640000 },
  { name: 'Reliant Tana',              manufacturer: 'MISC',      value: 750000 },
  { name: 'Reliant Mako',              manufacturer: 'MISC',      value: 850000 },
  { name: 'Reliant Sen',               manufacturer: 'MISC',      value: 790000 },
  // P-52/P-72
  { name: 'P-52 Merlin',               manufacturer: 'Kruger',    value: 200000 },
  { name: 'P-72 Archimedes',           manufacturer: 'Kruger',    value: 350000 },
];

export const shipsByName = Object.fromEntries(SHIPS.map(s => [s.name, s]));

export const searchShips = (query) => {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return SHIPS.filter(s => s.name.toLowerCase().includes(q) || s.manufacturer.toLowerCase().includes(q)).slice(0, 10);
};

// `byName` lets callers pass a live (DB-sourced) ship map; falls back to static.
export const calcFleetValue = (ownedShipNames, byName = shipsByName) => {
  if (!ownedShipNames?.length) return 0;
  return ownedShipNames.reduce((sum, name) => sum + (byName[name]?.value || 0), 0);
};
