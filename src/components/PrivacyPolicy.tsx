import React from 'react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export default function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  return (
    <div style={{
      position: 'fixed',
      background: 'rgba(5, 3, 13, 0.9)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      height: '100dvh',
      width: '100vw',
      top: 0,
      left: 0,
      paddingBottom: '24px',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        width: '100%',
        padding: '24px 40px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flexShrink: 0,
        maxWidth: '800px',
        flexDirection: 'column'
      }}>
        <button
          onClick={onBack}
          style={{
            padding: '8px 18px',
            fontSize: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-glass)',
            color: 'var(--text-primary)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '1px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.borderColor = 'var(--border-glass)';
          }}
        >
          ← BACK TO STORE
        </button>
        <h1 style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '24px',
          fontWeight: 700,
          letterSpacing: '3px',
          color: 'var(--cyan)',
          textShadow: '0 0 15px rgba(0, 240, 255, 0.3)',
          marginTop: '12px',
        }}>
          KBS CLOUD PRIVACY POLICY
        </h1>
      </div>

      {/* Scrollable Content */}
      <div style={{
        flex: 1,
        minHeight: 0,
        width: '100%',
        maxWidth: '800px',
        overflowY: 'auto',
        padding: '0 40px 40px'
      }}>
        <div className="glass-panel" style={{
          padding: '32px',
          lineHeight: '1.7',
          fontSize: '14px',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-glass)',
          borderRadius: '12px',
          background: 'var(--bg-glass)',
        }}>
          <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '12px', marginBottom: '24px' }}>
            Last Updated: June 18, 2026
          </p>

          <Section title="1. OVERVIEW">
            This Privacy Policy describes how KBS Cloud ("the Hub") collects, uses, processes, and shares your information. KBS Cloud is a self-hostable open-source game storefront and achievement tracking service.
          </Section>

          <Section title="2. INFORMATION WE COLLECT">
            <SubSection title="SSO Profile Information">
              When signing in via KBS Identity, we receive:
              <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
                <li>Your email address.</li>
                <li>Your display name / custom callsign.</li>
                <li>Profile custom theme styles or preferences.</li>
              </ul>
            </SubSection>
            <SubSection title="Developer Portal Data">
              For users uploading games or applications:
              <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
                <li>Developer name and configuration.</li>
                <li>Application code bundles, descriptions, screenshots, and URLs.</li>
              </ul>
            </SubSection>
            <SubSection title="Gameplay and Sync Data">
              To support shared achievement tracking:
              <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
                <li>Game session logs, scores, wins/losses, and achievement unlock states.</li>
                <li>Synchronization queues for games communicating progress back to the Hub.</li>
              </ul>
            </SubSection>
            <SubSection title="Cookies & Local Storage">
              We collect session tokens and client configuration preferences:
              <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
                <li>Authentication state cookies.</li>
                <li>Local storage properties such as `perf-mode` (to control animated star background rendering).</li>
              </ul>
            </SubSection>
          </Section>

          <Section title="3. HOW WE USE YOUR INFORMATION">
            We use your data to:
            <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
              <li>Provide game launcher and storefront features.</li>
              <li>Track and display profile levels, achievements, and leaderboard rankings.</li>
              <li>Render game details and facilitate game launches.</li>
              <li>Validate developer credentials and secure the application distribution workflow.</li>
            </ul>
          </Section>

          <Section title="4. DATA SECURITY & SHARING">
            <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
              <li>Data is saved securely in a local database (SQLite/PostgreSQL) managed by the host operator.</li>
              <li>We do not sell, trade, or rent personal information.</li>
              <li>Achievements and usernames are visible publicly on leaderboard and profile views.</li>
            </ul>
          </Section>

          <Section title="5. COOKIES & LOCAL STORAGE USE">
            The Hub uses:
            <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
              <li><strong>SSO cookies</strong> — to preserve active login tokens.</li>
              <li><strong>Local Storage values</strong> — to persist preferences like performance flags or search filter defaults.</li>
            </ul>
          </Section>

          <Section title="6. THIRD-PARTY SERVICES">
            <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
              <li><strong>KBS Identity SSO</strong> — Central login is managed by kbs-auth. They handle your password securely.</li>
              <li><strong>Google Fonts</strong> — Used to display modern typefaces (Outfit, Share Tech Mono).</li>
            </ul>
          </Section>

          <Section title="7. DATA RETENTION">
            Your records are stored as long as your account exists on this KBS Cloud instance.
          </Section>

          <Section title="8. YOUR RIGHTS">
            You can request access, correction, or deletion of your profile history or developer uploads by opening an issue on our project repository or contacting the administrator of your instance.
          </Section>

          <Section title="9. CONTACT">
            If you have questions about privacy, please open an issue on our{' '}
            <a
              href="https://github.com/kbs-cloud/kbs-cloud"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--cyan)', textDecoration: 'underline' }}
            >
              GitHub repository
            </a>.
          </Section>
        </div>
      </div>
    </div>
  );
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: '24px' }}>
    <h3 style={{
      fontFamily: 'var(--font-mono)',
      fontSize: '13px',
      fontWeight: 600,
      letterSpacing: '1.5px',
      color: 'var(--cyan)',
      marginBottom: '10px',
      textShadow: '0 0 8px rgba(0, 255, 255, 0.2)'
    }}>
      {title}
    </h3>
    <div>{children}</div>
  </div>
);

const SubSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: '12px' }}>
    <h4 style={{
      fontSize: '12px',
      fontWeight: 600,
      letterSpacing: '0.5px',
      color: 'var(--text-primary)',
      marginBottom: '6px'
    }}>
      {title}
    </h4>
    <div>{children}</div>
  </div>
);
