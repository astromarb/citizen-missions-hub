# UEE Cargo Ops — SC Mission Board

A calendar-based mission tracking dashboard for Star Citizen org groups. Log group sessions, record hauling contracts, and track cargo manifests across sessions.

## Features

- **Calendar view** — Sessions displayed by date; click any day to view or create a session
- **Group sessions** — Select which crew members are flying each day
- **Contract logging** — Supports *Hauling - Stellar* (same system) and *Hauling - Interstellar* (cross-system jump routes)
- **Autocomplete** — Pre-loaded locations for Stanton, Pyro, and Nyx systems; full commodity list sourced from UEX
- **Cargo manifest** — Log multiple commodities with SCU amounts per contract

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Project Structure

```
src/
├── components/
│   ├── Calendar/        # Monthly calendar grid
│   ├── Session/         # Session detail view and contract list
│   ├── Contract/        # Add-contract multi-step modal
│   ├── Autocomplete/    # Location and commodity autocomplete inputs
│   └── shared/          # PlayerBadge, TypeBadge, etc.
├── data/
│   ├── commodities.js   # Full commodity list (sourced from UEX)
│   ├── locations.js     # Stanton / Pyro / Nyx locations
│   └── players.js       # Player roster and color map
├── styles/
│   └── index.css        # Global styles and CSS variables
├── utils/
│   └── dateUtils.js     # Date formatting helpers
├── App.jsx              # Root component and routing
└── main.jsx             # Entry point
```

## Roadmap

- [ ] Persistent storage (Firebase / Supabase)
- [ ] Real-time multi-user sync
- [ ] aUEC earnings tracking per contract
- [ ] Mining and bounty contract types
- [ ] Crew stats and leaderboard
- [ ] Export session report (PDF / CSV)

## Data Sources

- Locations: [Star Citizen Wiki](https://starcitizen.tools/Locations)
- Commodities: [UEX Corp](https://uexcorp.space/commodities)
