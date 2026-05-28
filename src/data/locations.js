export const SYSTEMS = {
  Stanton: [
    "Area 18 (ArcCorp)", "Lorville (Hurston)", "New Babbage (MicroTech)", "Orison (Crusader)",
    "ARC-L1 Wide Forest Station", "ARC-L2 Lively Pathway Station", "ARC-L3 Modern Express Station",
    "ARC-L4 Faint Glen Station", "ARC-L5 Yellow Core Station",
    "CRU-L1 Ambitious Dream Station", "CRU-L4 Shallow Fields Station", "CRU-L5 Beautiful Glen Station",
    "HUR-L1 Green Glade Station", "HUR-L2 Faithful Dream Station", "HUR-L3 Thundering Express Station",
    "HUR-L4 Melodic Fields Station", "HUR-L5 High Course Station",
    "MIC-L1 Shallow Frontier Station", "MIC-L2 Long Forest Station", "MIC-L3 Endless Odyssey Station",
    "MIC-L4 Red Crossroads Station", "MIC-L5 Modern Icarus Station",
    "Baijini Point", "Port Tressler", "Seraphim Station", "Covalex Hub Gundo",
    "Magnus Gateway", "Pyro Gateway (Stanton)", "Grim HEX", "Everus Harbor",
    "Attritus OLP", "Vivere OLP", "Lamina OLP", "Ruptura OLP",
    "ArcCorp Mining Area 045", "ArcCorp Mining Area 056", "ArcCorp Mining Area 061",
    "Shubin Mining SM0-22", "Brio's Breaker Yard", "Reclamation & Disposal Orinth",
    "RAYARI Cantwell Research Outpost", "RAYARI McGrath Research Outpost",
    "RAYARI Deltana Research Outpost", "RAYARI Anvik Research Outpost",
    "Security Post Kareah", "INS Jericho", "ICC ScanHub Stanton",
    "New Babbage Interstellar Spaceport", "Teasa Spaceport", "Riker Memorial Spaceport",
    "Shubin Mining Facility SAL-2", "Shubin Mining Facility SAL-5",
    "Loveridge Mineral Reserve", "ArcCorp Mining Area 157",
    "Kudre Ore", "Samson & Sons Salvage Center",
    "Devlin Scrap & Salvage", "Nuen Waste Management",
  ],
  Pyro: [
    "Ruin Station", "Checkmate", "Orbituary",
    "Pyro Gateway (Pyro)", "Stanton Gateway (Pyro)",
    "Gaslight", "Patch City",
    "Thistlewood", "Limestone Outlook", "Shack Cracker",
  ],
  Nyx: [
    "Levski (Delamar)",
  ],
};

export const ALL_LOCATIONS = Object.entries(SYSTEMS).flatMap(([system, locs]) =>
  locs.map((label) => ({ label, system }))
);
