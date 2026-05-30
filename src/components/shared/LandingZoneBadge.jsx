import { useState } from 'react';

const BADGES = {
  'Area 18': {
    bg: '#0b1f0b', accent: '#5dd65d', label: 'AREA18',
    Icon: ({ c, s }) => (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none">
        <polygon points="12,3 21,20 3,20" fill={c} opacity="0.85" />
        <line x1="12" y1="3" x2="12" y2="21" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  'Lorville': {
    bg: '#060d1c', accent: '#4d8fd4', label: 'LORVILLE',
    Icon: ({ c, s }) => (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none">
        <rect x="3" y="8" width="18" height="9" rx="1" stroke={c} strokeWidth="1.6" />
        <circle cx="12" cy="12.5" r="2.5" fill={c} />
        <line x1="12" y1="2" x2="12" y2="8" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
        <line x1="8"  y1="5" x2="16" y2="5" stroke={c} strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  'Orison': {
    bg: '#040f14', accent: '#2ec9d4', label: 'ORISON',
    Icon: ({ c, s }) => (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none">
        <circle cx="12" cy="5.5" r="2" stroke={c} strokeWidth="1.6" />
        <line x1="12" y1="7.5" x2="12" y2="19" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
        <line x1="7"  y1="7.5" x2="17" y2="7.5" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
        <path d="M5 15 Q12 22 19 15" stroke={c} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </svg>
    ),
  },
  'New Babbage': {
    bg: '#060b1f', accent: '#55aaff', label: 'NEW\nBABBAGE',
    Icon: ({ c, s }) => (
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none">
        <line x1="12" y1="2"  x2="12" y2="22" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="2"  y1="12" x2="22" y2="12" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="5"  y1="5"  x2="19" y2="19" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="19" y1="5"  x2="5"  y2="19" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="12" cy="12" r="2.5" fill={c} />
      </svg>
    ),
  },
};

// dim, iconSz, cityTextSz, alphaTextSz, pad, gap
const SIZES = {
  xs: { dim: 36, iconSz: 10, cityTextSz: 4.5, alphaTextSz: 8,  pad: '4px 3px 3px',  gap: 2 },
  sm: { dim: 44, iconSz: 14, cityTextSz: 6,   alphaTextSz: 10, pad: '5px 4px 4px',  gap: 2 },
  md: { dim: 54, iconSz: 18, cityTextSz: 7,   alphaTextSz: 12, pad: '8px 6px 6px',  gap: 4 },
  lg: { dim: 68, iconSz: 22, cityTextSz: 9,   alphaTextSz: 15, pad: '10px 8px 8px', gap: 4 },
};

const ALPHA_ACCENT = '#e8c030';
const AlphaIcon = ({ c, s }) => (
  <svg viewBox="0 0 24 24" width={s} height={s} fill="none">
    <circle cx="11.5" cy="9.5" r="5.5" stroke={c} strokeWidth="1.6" />
    <path d="M17 9.5 C17 14 16 17 14 20" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

function BadgeTooltip({ text, children }) {
  const [pos, setPos] = useState(null);
  return (
    <div
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={(e) => setPos({ x: e.clientX, y: e.clientY })}
      onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}
      onMouseLeave={() => setPos(null)}
    >
      {children}
      {pos && (
        <div style={{
          position: 'fixed',
          left: pos.x,
          top: pos.y - 44,
          transform: 'translateX(-50%)',
          background: '#1a1a1a',
          color: '#f0f0f0',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          padding: '6px 10px',
          whiteSpace: 'nowrap',
          zIndex: 99999,
          pointerEvents: 'none',
          border: '1px solid #444',
          lineHeight: 1.4,
        }}>
          {text}
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: '5px solid #1a1a1a',
          }} />
        </div>
      )}
    </div>
  );
}

export function AlphaBadge({ size = 'md' }) {
  const { dim, iconSz, alphaTextSz, pad, gap } = SIZES[size] || SIZES.md;
  return (
    <BadgeTooltip text="Been around since the very beginning.">
      <div style={{
        width: dim, height: dim, background: '#100d00',
        border: `1.5px solid ${ALPHA_ACCENT}44`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: pad, gap,
        boxShadow: `0 0 10px ${ALPHA_ACCENT}1a`,
        boxSizing: 'border-box', flexShrink: 0,
      }}>
        <AlphaIcon c={ALPHA_ACCENT} s={iconSz} />
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: alphaTextSz, color: ALPHA_ACCENT,
          letterSpacing: '0.04em', textAlign: 'center', lineHeight: 1, fontWeight: 700,
        }}>α</span>
      </div>
    </BadgeTooltip>
  );
}

export default function LandingZoneBadge({ region, size = 'md' }) {
  const cfg = BADGES[region];
  if (!cfg) return null;

  const { dim, iconSz, cityTextSz, pad, gap } = SIZES[size] || SIZES.md;
  const { Icon } = cfg;

  return (
    <BadgeTooltip text={`This user's primary residence is ${region}.`}>
      <div style={{
        width: dim, height: dim,
        background: cfg.bg,
        border: `1.5px solid ${cfg.accent}44`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: pad, gap,
        boxShadow: `0 0 10px ${cfg.accent}1a`,
        boxSizing: 'border-box', flexShrink: 0,
      }}>
        <Icon c={cfg.accent} s={iconSz} />
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: cityTextSz,
          color: cfg.accent,
          letterSpacing: '0.08em',
          textAlign: 'center',
          lineHeight: 1.15,
          textTransform: 'uppercase',
          fontWeight: 700,
          whiteSpace: 'pre-line',
        }}>
          {cfg.label}
        </span>
      </div>
    </BadgeTooltip>
  );
}
