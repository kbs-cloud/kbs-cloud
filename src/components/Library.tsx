import { Layers, User } from 'lucide-react';
import type { UserProfile, Game } from '../types';
import { resolveImageUrl } from '../shared/offlineDb';

export interface LibraryProps {
  user: UserProfile | null;
  games: Game[];
  loadingGames: boolean;
  setSelectedGame: (game: Game | null) => void;
  getLaunchUrl: (game: Game) => string;
  handleSignIn: () => void;
  isOffline: boolean;
  installedApps: string[];
  onInstallToggle: (gameId: string, installed: boolean) => void;
  showToastMsg: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function Library({
  user,
  games,
  loadingGames,
  setSelectedGame,
  getLaunchUrl,
  handleSignIn,
  isOffline,
  installedApps,
  onInstallToggle,
  showToastMsg
}: LibraryProps) {
  return (
    <div style={{ marginTop: '20px' }}>
      <h2 className="section-title">
        <Layers size={24} style={{ color: 'var(--purple)' }} />
        My Game Library
      </h2>

      {user ? (
        loadingGames ? (
          <div style={{ color: 'var(--text-secondary)' }}>Loading library catalog...</div>
        ) : (
          <div className="library-grid">
            {games.map(game => (
              <div key={game.id} className="library-card glass-panel">
                <img 
                  src={resolveImageUrl(game.cover_image)} 
                  alt={game.title} 
                  className="library-card-bg"
                />
                
                <div className="library-card-content">
                  <div className="library-card-info">
                    <h3 className="library-card-title">
                      {game.icon} {game.title}
                    </h3>
                    <span className="library-card-badge">
                      SSO Active
                    </span>
                  </div>

                  <div className="library-card-actions">
                    {installedApps.includes(game.id) ? (
                      isOffline && game.isOnline ? (
                        <button className="btn btn-secondary btn-sm launch-btn" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} title="Requires active internet connection.">
                          Locked Offline
                        </button>
                      ) : (
                        <a href={getLaunchUrl(game)} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm launch-btn">
                          Launch Game
                        </a>
                      )
                    ) : (
                      <button 
                        className="btn btn-primary btn-sm launch-btn"
                        onClick={() => {
                          showToastMsg(`Downloading cached client files for ${game.title}...`, 'info');
                          setTimeout(() => {
                            onInstallToggle(game.id, true);
                            showToastMsg(`${game.title} successfully installed!`, 'success');
                          }, 1000);
                        }}
                        disabled={isOffline && !game.download_url}
                      >
                        Install Game
                      </button>
                    )}
                    <button className="btn btn-secondary btn-sm details-btn" onClick={() => setSelectedGame(game)}>
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="glass-panel" style={{
          textAlign: 'center',
          padding: '64px 32px',
          marginTop: '16px',
          border: '1px dashed rgba(255,255,255,0.1)'
        }}>
          <User size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3 style={{ marginBottom: '8px', color: '#fff' }}>Please Sign In to Access Your Library</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 24px' }}>
            Connecting your KBS account allows sync of game states, match leaderboards, and developer stats.
          </p>
          <button className="btn btn-primary" onClick={handleSignIn}>
            Sign In via SSO
          </button>
        </div>
      )}
    </div>
  );
}
