import { useState, useCallback, createContext, useContext } from 'react';

const ToastCtx = createContext(null);

export function useToast() {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration);
  }, []);

  const colors = { success: '#2d8659', error: '#c41e3a', info: '#000', message: '#1e40af' };

  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div style={{
        position: 'fixed', bottom: 20, right: 20, zIndex: 2000,
        display: 'flex', flexDirection: 'column', gap: 10,
        pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: colors[t.type] ?? '#000',
            color: '#fff',
            padding: '12px 16px',
            border: '2px solid rgba(255,255,255,0.3)',
            fontFamily: 'var(--font-display)',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            minWidth: 260,
            animation: 'slideInToast 0.25s ease-out',
          }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
