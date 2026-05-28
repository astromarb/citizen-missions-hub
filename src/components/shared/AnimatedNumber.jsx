import { useState, useEffect, useRef } from 'react';

export default function AnimatedNumber({ value, format, duration = 900, style }) {
  const [display, setDisplay] = useState(0);
  const rafRef  = useRef(null);
  const fromRef = useRef(0);

  useEffect(() => {
    const from  = fromRef.current;
    const to    = value;
    if (from === to) return;
    const start = performance.now();

    const tick = (now) => {
      const t    = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      const cur  = Math.round(from + (to - from) * ease);
      setDisplay(cur);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return <span style={style}>{format ? format(display) : display.toLocaleString()}</span>;
}
