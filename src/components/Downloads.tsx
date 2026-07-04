import { useState } from 'react';
import { Monitor, Apple, Terminal, Smartphone, Download, ShieldCheck, ExternalLink, HelpCircle } from 'lucide-react';
import pkg from '../../package.json';

export default function Downloads() {
  const [activeInstruction, setActiveInstruction] = useState<string | null>('windows');

  const version = pkg.version;
  const tag = `v${version}`;

  const getDownloadUrl = (urlPath: string) => {
    if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) {
      return urlPath;
    }
    if (window.location.protocol === 'file:') {
      return `https://kbs-cloud.com${urlPath}`;
    }
    return urlPath;
  };

  const platforms = [
    {
      id: 'windows',
      name: 'Windows Client',
      icon: <Monitor size={36} className="platform-icon windows" />,
      tag: 'Windows 10 / 11 (64-bit)',
      size: '93.2 MB',
      version: tag,
      fileName: 'kbs-cloud-hub-setup.exe',
      downloadUrl: '/downloads/kbs-cloud-hub-setup.exe',
      instructions: [
        'Download the setup executable.',
        'Double-click kbs-cloud-hub-setup.exe to run the installer.',
        'If Windows SmartScreen prompts, click "More Info" and then "Run Anyway".',
        'Once installation completes, launch the Hub from your desktop or start menu.'
      ]
    },
    {
      id: 'macos',
      name: 'macOS Client',
      icon: <Apple size={36} className="platform-icon macos" />,
      tag: 'macOS 12+ (Universal)',
      size: '115.9 MB',
      version: tag,
      fileName: 'kbs-cloud-hub.zip',
      downloadUrl: '/downloads/kbs-cloud-hub.zip',
      instructions: [
        'Download the macOS application archive (.zip).',
        'Double-click kbs-cloud-hub.zip to extract the application.',
        'Drag the extracted KBS Cloud Hub application into your Applications folder.',
        'On first launch, if prompted with an unidentified developer error: Open System Settings > Privacy & Security, scroll down, and click "Open Anyway".'
      ]
    },
    {
      id: 'linux',
      name: 'Linux Executable',
      icon: <Terminal size={36} className="platform-icon linux" />,
      tag: 'Ubuntu / Debian / Fedora',
      size: '125.2 MB',
      version: tag,
      fileName: 'kbs-cloud-hub.AppImage',
      downloadUrl: '/downloads/kbs-cloud-hub.AppImage',
      instructions: [
        'Download the .AppImage package.',
        'Open terminal, navigate to download directory, and execute: chmod +x kbs-cloud-hub.AppImage',
        'Double-click the AppImage file or run it via terminal to launch instantly.',
        'Compatible with most major modern Linux distributions.'
      ]
    },
    {
      id: 'android',
      name: 'Android Mobile',
      icon: <Smartphone size={36} className="platform-icon android" />,
      tag: 'Android 9.0+',
      size: '9.9 MB',
      version: tag,
      fileName: 'kbs-cloud-hub.apk',
      downloadUrl: '/downloads/kbs-cloud-hub.apk',
      instructions: [
        'Download the android package (.apk) directly to your device.',
        'If prompted by your browser, enable "Install from Unknown Sources".',
        'Tap the downloaded APK file to begin installation.',
        'Tap "Install Anyway" if warned by Google Play Protect (beta builds are unsigned).'
      ]
    },
    {
      id: 'ios',
      name: 'iOS Mobile App',
      icon: <Smartphone size={36} className="platform-icon ios" />,
      tag: 'iOS 15.0+ / iPadOS',
      size: '12.8 MB',
      version: `${tag} (TestFlight)`,
      fileName: 'Install via Apple TestFlight',
      downloadUrl: 'https://github.com/kbs-cloud/kbs-cloud/releases',
      instructions: [
        'Install the "TestFlight" app from the official iOS App Store.',
        'Tap the TestFlight invitation link on our GitHub releases page.',
        'Accept the invitation and click install to download the Hub.',
        'Alternatively, download the IPA file from GitHub releases and side-load via AltStore.'
      ]
    }
  ];

  return (
    <div style={{ marginTop: '20px' }} className="downloads-page">
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>KBS Cloud Client Downloads</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
          Take your games offline. Download the native KBS Cloud Hub wrappers for desktop and mobile environments. Packaged with Electron and Capacitor.
        </p>
      </div>

      {/* PLATFORM CARDS */}
      <div className="downloads-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        {platforms.map(platform => (
          <div 
            key={platform.id} 
            className={`downloads-card glass-panel glass-panel-interactive ${activeInstruction === platform.id ? 'active-card' : ''}`}
            onClick={() => setActiveInstruction(platform.id)}
            style={{
              padding: '24px',
              cursor: 'pointer',
              border: activeInstruction === platform.id ? '1px solid var(--cyan)' : '1px solid var(--border-glass)',
              boxShadow: activeInstruction === platform.id ? 'var(--shadow-neon-cyan), var(--shadow-card)' : 'var(--shadow-card)',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              {platform.icon}
              <span style={{ 
                fontFamily: 'var(--font-mono)', 
                fontSize: '0.75rem', 
                color: 'var(--cyan)', 
                background: 'rgba(0, 255, 255, 0.05)', 
                padding: '2px 6px', 
                borderRadius: '4px' 
              }}>
                {platform.version}
              </span>
            </div>

            <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '4px' }}>{platform.name}</h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>{platform.tag}</div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              <span>Size: {platform.size}</span>
              <span className="file-name" style={{ color: 'var(--text-muted)', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {platform.fileName}
              </span>
            </div>

            <a 
              href={getDownloadUrl(platform.downloadUrl)} 
              target="_blank" 
              rel="noreferrer" 
              className="btn btn-primary btn-sm"
              style={{ width: '100%', gap: '6px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <Download size={14} /> Download Client
            </a>
          </div>
        ))}
      </div>

      {/* INSTALLATION INSTRUCTIONS */}
      {activeInstruction && (
        <div className="glass-panel" style={{ padding: '32px', marginBottom: '40px', border: '1px solid rgba(157, 78, 221, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
            <HelpCircle size={20} style={{ color: 'var(--purple)' }} />
            <h2 style={{ fontSize: '1.35rem', color: '#fff' }}>
              Installation Guide: {platforms.find(p => p.id === activeInstruction)?.name}
            </h2>
          </div>

          <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {platforms.find(p => p.id === activeInstruction)?.instructions.map((step, idx) => (
              <li key={idx} style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                <span style={{ color: '#fff', fontWeight: 500 }}>{step}</span>
              </li>
            ))}
          </ol>

          <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--green)', fontSize: '0.85rem' }}>
            <ShieldCheck size={16} />
            <span>All binary client installers are cryptographically compiled and verified secure.</span>
          </div>
        </div>
      )}

      {/* CENTRAL GITHUB RELEASES LINK */}
      <div className="glass-panel" style={{
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        background: 'rgba(157, 78, 221, 0.05)',
        border: '1px solid rgba(157, 78, 221, 0.15)'
      }}>
        <div>
          <h4 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '4px' }}>Looking for older builds or source code?</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Visit our public repository release dashboard to view full changelogs, build signatures, and download archive binaries.
          </p>
        </div>
        <a 
          href="https://github.com/kbs-cloud/kbs-cloud/releases" 
          target="_blank" 
          rel="noreferrer" 
          className="btn btn-secondary"
          style={{ gap: '6px' }}
        >
          View GitHub Releases <ExternalLink size={16} />
        </a>
      </div>
    </div>
  );
}
