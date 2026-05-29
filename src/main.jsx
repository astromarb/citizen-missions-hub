import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css';
import { injectAnimations } from './styles/animations.js';

injectAnimations();

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(err) {
    return { error: err };
  }
  componentDidCatch(err, info) {
    console.error('[CMH] Render crash:', err, info?.componentStack);
  }
  render() {
    if (this.state.error) {
      const msg = this.state.error?.message || String(this.state.error);
      return (
        <div style={{
          minHeight: '100vh', background: '#0d0d0d', color: '#e0e0e0',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: 32, fontFamily: 'monospace',
        }}>
          <div style={{ fontSize: 13, color: '#c41e3a', marginBottom: 12, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Application Error
          </div>
          <div style={{ fontSize: 12, color: '#888', maxWidth: 520, textAlign: 'center', lineHeight: 1.7, marginBottom: 20 }}>
            {msg}
          </div>
          <div style={{ fontSize: 11, color: '#555', maxWidth: 520, textAlign: 'center', lineHeight: 1.7 }}>
            Open the browser console (F12 → Console) for the full error trace, then share it in the chat.
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: 24, padding: '10px 24px', background: '#c41e3a', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase' }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
