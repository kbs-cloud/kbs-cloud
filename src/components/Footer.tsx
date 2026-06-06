import { Gamepad2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Gamepad2 size={20} style={{ color: 'var(--cyan)' }} />
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>KBS Cloud Games Store</span>
        </div>
        <span className="footer-text">
          &copy; 2026 KBS Cloud. All rights reserved. SSO powered by KBS Identity. Integrated profile & achievements module active.
        </span>
      </div>
    </footer>
  );
}
