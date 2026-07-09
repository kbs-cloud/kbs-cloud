import { useState, useEffect } from 'react';
import { X, ExternalLink, Download, Cpu, Award, Globe, AlertTriangle, Monitor, Laptop, Smartphone, Terminal } from 'lucide-react';
import type { Game, Achievement, UserProfile } from '../types';
import { resolveImageUrl } from '../shared/offlineDb';

const OS_PLATFORMS: Record<string, { name: string; icon: React.ReactNode }> = {
  windows: { name: 'Windows', icon: <Monitor size={16} /> },
  linux: { name: 'Linux', icon: <Terminal size={16} /> },
  macos: { name: 'macOS', icon: <Laptop size={16} /> },
  android: { name: 'Android', icon: <Smartphone size={16} /> },
  ios: { name: 'iOS', icon: <Smartphone size={16} /> }
};

const resolveDownloadUrl = (urlPath: string) => {
  if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) {
    return urlPath;
  }
  if (window.location.protocol === 'file:') {
    return `https://kbs-cloud.com${urlPath}`;
  }
  return urlPath;
};

export interface GameDetailModalProps {
  game: Game;
  onClose: () => void;
  user: UserProfile | null;
  getLaunchUrl: (game: Game) => string;
  isOffline: boolean;
  installed: boolean;
  onInstallToggle: (installed: boolean) => void;
}

export default function GameDetailModal({
  game,
  onClose,
  user,
  getLaunchUrl,
  isOffline,
  installed,
  onInstallToggle
}: GameDetailModalProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loadingAchievements, setLoadingAchievements] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // If offline, fetch fails, fallback to cache/mock or show empty
    if (isOffline) {
      setAchievements([]);
      return;
    }
    setTimeout(() => setLoadingAchievements(true), 0);
    fetch(`/api/apps/${game.id}/achievements`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAchievements(data.achievements);
        }
      })
      .catch(err => console.error('Error fetching achievements:', err))
      .finally(() => setLoadingAchievements(false));
  }, [game, isOffline]);

  const handleInstallSim = () => {
    setIsInstalling(true);
    setTimeout(() => {
      setIsInstalling(false);
      onInstallToggle(true);
    }, 1500); // 1.5s simulated download/installation
  };

  const handleUninstall = () => {
    onInstallToggle(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <div className="game-detail-hero">
          <img src={resolveImageUrl(game.cover_image)} alt={game.title} className="game-detail-hero-img" />
          <div className="game-detail-hero-overlay">
            <h2 style={{ fontSize: '2.2rem', color: '#fff', marginBottom: '4px' }}>
              {game.icon} {game.title}
            </h2>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {game.tags && game.tags.map((tag, idx) => (
                <span key={idx} className="game-tag" style={{ background: 'rgba(0,255,255,0.15)', borderColor: 'var(--cyan)' }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="game-detail-body">
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
            {!game.prod_url || game.prod_url.trim() === '' ? (
              <>
                {/* Native Game Main Actions */}
                {game.website && (
                  <a href={game.website} target="_blank" rel="noreferrer" className="btn btn-primary">
                    <Globe size={16} /> Visit Website
                  </a>
                )}
                {game.download_url && (
                  <a href={game.download_url} target="_blank" rel="noreferrer" className="btn btn-secondary">
                    <Download size={16} /> Release Page
                  </a>
                )}
              </>
            ) : (
              <>
                {/* Web Game Main Actions */}
                {installed ? (
                  <>
                    {isOffline && game.isOnline ? (
                      <button className="btn btn-secondary" disabled title="Requires active internet connection to authenticate.">
                        Online Only (Locked Offline)
                      </button>
                    ) : (
                      <a href={getLaunchUrl(game)} target="_blank" rel="noreferrer" className="btn btn-primary">
                        Launch Game {isOffline ? '(Offline)' : ''} <ExternalLink size={16} />
                      </a>
                    )}
                    
                    <button className="btn btn-secondary text-danger" onClick={handleUninstall}>
                      Uninstall
                    </button>
                  </>
                ) : (
                  <button 
                    className="btn btn-primary" 
                    onClick={handleInstallSim} 
                    disabled={isInstalling || (isOffline && !game.download_url)}
                  >
                    {isInstalling ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid #fff', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                        Installing...
                      </span>
                    ) : (
                      <>
                        <Download size={16} /> Install Game
                      </>
                    )}
                  </button>
                )}
                {game.website && (
                  <a href={game.website} target="_blank" rel="noreferrer" className="btn btn-secondary">
                    <Globe size={16} /> Website
                  </a>
                )}
                {game.download_url && (
                  <a href={game.download_url} target="_blank" rel="noreferrer" className="btn btn-secondary">
                    <Download size={16} /> Standalone Package
                  </a>
                )}
              </>
            )}

            {/* External GitHub Link */}
            {game.github_url && (
              <a href={game.github_url} target="_blank" rel="noreferrer" className="btn btn-secondary">
                <ExternalLink size={16} /> GitHub Codebase
              </a>
            )}
          </div>

          <div className="game-detail-grid">
            <div className="game-detail-main">
              <h3>About the Game</h3>
              <p>{game.full_description || game.description}</p>

              {/* Dynamic OS client builds grid */}
              {(!game.prod_url || (game.build_urls && Object.values(game.build_urls).some(b => b && b.status !== 'inactive'))) && (
                <div style={{ marginBottom: '32px', marginTop: '24px' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Download size={20} style={{ color: 'var(--cyan)' }} />
                    Download Client Builds
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '16px'
                  }}>
                    {Object.entries(OS_PLATFORMS).map(([key, os]) => {
                      const build = game.build_urls?.[key];
                      if (!build || build.status === 'inactive') return null;

                      let statusBadge = null;
                      let borderStyle = '1px solid rgba(255,255,255,0.06)';
                      let bgStyle = 'rgba(255,255,255,0.01)';
                      
                      if (build.status === 'maintenance') {
                        statusBadge = <span style={{ fontSize: '0.65rem', background: 'rgba(234, 88, 12, 0.15)', border: '1px solid var(--orange)', color: 'var(--orange)', padding: '1px 5px', borderRadius: '4px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Maintenance</span>;
                        borderStyle = '1px solid rgba(234, 88, 12, 0.25)';
                        bgStyle = 'rgba(234, 88, 12, 0.02)';
                      } else if (build.status === 'deprecated') {
                        statusBadge = <span style={{ fontSize: '0.65rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--red)', color: 'var(--red)', padding: '1px 5px', borderRadius: '4px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Deprecated</span>;
                        borderStyle = '1px solid rgba(239, 68, 68, 0.25)';
                        bgStyle = 'rgba(239, 68, 68, 0.02)';
                      } else if (build.status === 'unsupported') {
                        statusBadge = <span style={{ fontSize: '0.65rem', background: 'rgba(156, 163, 175, 0.15)', border: '1px solid var(--text-muted)', color: 'var(--text-muted)', padding: '1px 5px', borderRadius: '4px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Unsupported</span>;
                        borderStyle = '1px solid rgba(156, 163, 175, 0.2)';
                        bgStyle = 'rgba(156, 163, 175, 0.02)';
                      } else if (build.status === 'active') {
                        statusBadge = <span style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--green)', color: 'var(--green)', padding: '1px 5px', borderRadius: '4px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Available</span>;
                        borderStyle = '1px solid rgba(16, 185, 129, 0.2)';
                        bgStyle = 'rgba(16, 185, 129, 0.02)';
                      }

                      return (
                        <div key={key} className="glass-panel" style={{
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          border: borderStyle,
                          background: bgStyle,
                          borderRadius: '8px',
                          gap: '12px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
                              <span style={{ color: 'var(--cyan)' }}>{os.icon}</span>
                              {os.name}
                            </div>
                            {statusBadge}
                          </div>

                          {build.status !== 'active' ? (
                            <div style={{
                              background: 'rgba(0, 0, 0, 0.2)',
                              border: '1px solid rgba(255,255,255,0.02)',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              color: 'var(--text-secondary)',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '6px'
                            }}>
                              <AlertTriangle size={12} style={{ color: build.status === 'deprecated' ? 'var(--red)' : 'var(--orange)', marginTop: '2px', flexShrink: 0 }} />
                              <div style={{ lineHeight: '1.2' }}>
                                {build.error_message || `${os.name} build is not currently supported.`}
                              </div>
                            </div>
                          ) : (
                            <a href={resolveDownloadUrl(build.url)} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ alignSelf: 'stretch', justifyContent: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 10px' }}>
                              <Download size={12} /> Download for {os.name}
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {game.features && game.features.length > 0 && (
                <>
                  <h3 style={{ marginBottom: '12px' }}>Key Features</h3>
                  <ul style={{
                    listStyleType: 'square',
                    paddingLeft: '20px',
                    color: 'var(--text-secondary)',
                    marginBottom: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    {game.features.map((feat, idx) => (
                      <li key={idx}>{feat}</li>
                    ))}
                  </ul>
                </>
              )}

              {game.systemRequirements && (
                <>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Cpu size={20} style={{ color: 'var(--purple)' }} /> 
                    System Requirements
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    padding: '16px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    marginBottom: '24px'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#fff' }}>OS:</div>
                      <div style={{ color: 'var(--text-secondary)' }}>{game.systemRequirements.os || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#fff' }}>Processor:</div>
                      <div style={{ color: 'var(--text-secondary)' }}>{game.systemRequirements.cpu || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#fff' }}>Memory:</div>
                      <div style={{ color: 'var(--text-secondary)' }}>{game.systemRequirements.memory || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#fff' }}>Graphics:</div>
                      <div style={{ color: 'var(--text-secondary)' }}>{game.systemRequirements.graphics || 'N/A'}</div>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <div style={{ fontWeight: 600, color: '#fff' }}>Storage:</div>
                      <div style={{ color: 'var(--text-secondary)' }}>{game.systemRequirements.storage || 'N/A'}</div>
                    </div>
                  </div>
                </>
              )}

              {/* Achievements inside Modal */}
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Award size={20} style={{ color: 'var(--orange)' }} />
                Game Achievements
                {user && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal', marginLeft: '6px' }}>
                    ({achievements.filter(a => a.unlocked).length} / {achievements.length} Unlocked)
                  </span>
                )}
              </h3>

              {loadingAchievements ? (
                <div style={{ color: 'var(--text-secondary)' }}>Loading achievements...</div>
              ) : achievements.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {achievements.map((ach) => (
                    <div key={ach.id} className="glass-panel" style={{
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      border: ach.unlocked ? '1px solid rgba(0, 255, 255, 0.2)' : '1px solid rgba(255,255,255,0.05)',
                      background: ach.unlocked ? 'rgba(0, 255, 255, 0.02)' : 'rgba(0,0,0,0.15)',
                      opacity: ach.unlocked ? 1 : 0.65
                    }}>
                      <div style={{
                        fontSize: '2rem',
                        filter: ach.unlocked ? 'none' : 'grayscale(100%) brightness(0.6)'
                      }}>
                        {ach.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h5 style={{ color: ach.unlocked ? '#fff' : 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 600 }}>
                          {ach.title}
                        </h5>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
                          {ach.description}
                        </p>
                      </div>
                      <div>
                        {ach.unlocked ? (
                          <span style={{
                            color: 'var(--green)',
                            fontSize: '0.75rem',
                            border: '1px solid var(--green)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            fontFamily: 'var(--font-mono)'
                          }}>
                            Unlocked
                          </span>
                        ) : (
                          <span style={{
                            color: 'var(--text-muted)',
                            fontSize: '0.75rem',
                            border: '1px solid rgba(255,255,255,0.1)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            fontFamily: 'var(--font-mono)'
                          }}>
                            Locked (+{ach.xpValue} XP)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  No achievements registered for this game yet.
                </p>
              )}
            </div>

            <div>
              <div className="game-detail-meta-panel">
                <div className="meta-item">
                  <span className="meta-label">Developer</span>
                  <span className="meta-val">{game.developer}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Publisher</span>
                  <span className="meta-val">{game.publisher}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Release Date</span>
                  <span className="meta-val">{game.release_date}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Platforms</span>
                  <span className="meta-val">Windows, Linux, macOS</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Online Play</span>
                  <span className="meta-val" style={{ color: game.isOnline ? 'var(--green)' : 'var(--text-muted)' }}>
                    {game.isOnline ? 'Online Servers Live' : 'Offline Mode Only'}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Game Faction</span>
                  <span className="meta-val" style={{ color: game.isMultiplayer ? 'var(--cyan)' : 'var(--text-muted)' }}>
                    {game.isMultiplayer ? 'Co-op & Multiplayer' : 'Single Player'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
