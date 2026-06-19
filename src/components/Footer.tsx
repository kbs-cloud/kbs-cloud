import { Gamepad2 } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: 'terms' | 'privacy') => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const linkStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontFamily: 'var(--font-sans)',
    textDecoration: 'none',
    transition: 'color 0.2s ease',
    padding: '0 4px',
  };

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a
            href="/?view=terms"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('terms');
            }}
            style={linkStyle}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--cyan)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            Terms of Service
          </a>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', opacity: 0.5 }}>|</span>
          <a
            href="/?view=privacy"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('privacy');
            }}
            style={linkStyle}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--cyan)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            Privacy Policy
          </a>
        </div>
        <span className="footer-text">
          &copy; 2026 KBS Cloud. All rights reserved. SSO powered by KBS Identity. Integrated profile & achievements module active.
        </span>
      </div>
    </footer>
  );
}
