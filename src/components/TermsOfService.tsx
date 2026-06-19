import React from 'react';

interface TermsOfServiceProps {
  onBack: () => void;
}

export default function TermsOfService({ onBack }: TermsOfServiceProps) {
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
          textShadow: '0 0 15px rgba(0, 255, 255, 0.3)',
          marginTop: '12px',
        }}>
          KBS CLOUD TERMS OF SERVICE
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

          <Section title="1. ACCEPTANCE OF TERMS">
            By accessing or using KBS Cloud ("the Hub" or "the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, please do not use the Hub. KBS Cloud is an open-source project licensed under the MIT License.
          </Section>

          <Section title="2. DESCRIPTION OF SERVICE">
            KBS Cloud is a game hub, storefront, and distribution platform. The Hub provides centralized profile management, developer portal tools to upload and edit applications, and integration with achievements modules. The Service is provided as-is, free of charge, and may be modified or discontinued at any time.
          </Section>

          <Section title="3. USER ACCOUNTS & SSO">
            <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
              <li>Access to the Hub and connected games is authenticated using KBS Identity (our central SSO provider).</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You must provide accurate and lawful information when creating accounts or uploading applications.</li>
              <li>Sharing account credentials is done at your own risk.</li>
            </ul>
          </Section>

          <Section title="4. DEVELOPER PORTAL & UPLOADS">
            If you use the Developer Portal to publish applications:
            <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
              <li>You represent and warrant that you own or have the necessary rights to all assets, code, and content in your uploaded applications.</li>
              <li>You agree not to upload malware, tracking scripts, malicious files, or illegal content.</li>
              <li>We reserve the right to review, suspend, or remove any application from the storefront at our sole discretion.</li>
            </ul>
          </Section>

          <Section title="5. ACCEPTABLE USE">
            You agree not to:
            <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
              <li>Use the Hub for any unlawful purpose.</li>
              <li>Attempt to gain unauthorized access to our authentication services, backend servers, databases, or other users' accounts.</li>
              <li>Interfere with or disrupt the Hub's infrastructure.</li>
              <li>Use automated scripts or bots to spam the developer upload portals or skew achievement metrics.</li>
            </ul>
          </Section>

          <Section title="6. INTELLECTUAL PROPERTY">
            KBS Cloud's source code is released under the MIT License. You are free to copy, modify, distribute, and/or sublicense the software, subject to the conditions of the license. Uploaded game assets, descriptions, and branding belong to their respective creators unless otherwise stated.
          </Section>

          <Section title="7. DISCLAIMER OF WARRANTIES">
            THE HUB AND ALL SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. THE DEVELOPERS DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS.
          </Section>

          <Section title="8. LIMITATION OF LIABILITY">
            IN NO EVENT SHALL THE KBS CLOUD CONTRIBUTORS OR OPERATORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF YOUR USE OF THE HUB.
          </Section>

          <Section title="9. MODIFICATIONS TO TERMS">
            We reserve the right to modify these Terms at any time. Continued use of the Hub after modifications constitutes acceptance of the updated Terms.
          </Section>

          <Section title="10. GOVERNING LAW">
            These Terms shall be governed by applicable laws. Any disputes shall be resolved through good-faith negotiation or arbitration.
          </Section>

          <Section title="11. CONTACT">
            For questions about these Terms, please open an issue on our{' '}
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
