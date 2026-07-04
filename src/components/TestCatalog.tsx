import { FlaskConical, Search } from 'lucide-react';
import type { Game } from '../types';
import { resolveImageUrl } from '../shared/offlineDb';

export interface TestCatalogProps {
  games: Game[];
  loadingGames: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setSelectedGame: (game: Game | null) => void;
  isOffline: boolean;
  installedApps: string[];
  onInstallToggle: (gameId: string, installed: boolean) => void;
  showToastMsg: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function TestCatalog({
  games,
  loadingGames,
  searchQuery,
  setSearchQuery,
  setSelectedGame,
  isOffline,
  installedApps,
  onInstallToggle,
  showToastMsg
}: TestCatalogProps) {
  // Filter games: Must have a dev_url to be testable
  const testableGames = games.filter(game => game.dev_url && game.dev_url.trim() !== '');

  const filteredGames = testableGames.filter(game => {
    const matchesQuery = game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (game.tags && game.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesQuery;
  });

  const getTestLaunchUrl = (game: Game) => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return game.dev_url;
    }
    return `${window.location.origin}/test/${game.id}/`;
  };

  return (
    <div style={{ marginTop: '20px' }}>
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <FlaskConical size={24} style={{ color: 'var(--orange)' }} /> 
            Test Builds Portal
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '6px', maxWidth: '600px' }}>
            Access experimental sandboxes, staging versions, and active developer branches deployed from the staging servers.
          </p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid var(--border-glass)',
          borderRadius: '20px',
          width: '280px'
        }}>
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search test builds..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              outline: 'none',
              fontFamily: 'inherit',
              fontSize: '0.85rem',
              width: '100%'
            }}
          />
        </div>
      </div>

      {loadingGames ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--orange)' }}>
          Loading staging environment catalog...
        </div>
      ) : (
        <div className="game-grid">
          {filteredGames.length > 0 ? (
            filteredGames.map(game => (
              <div key={game.id} className="game-card glass-panel glass-panel-interactive" style={{ borderTop: '2px solid rgba(249, 115, 22, 0.4)' }}>
                <div className="game-card-img-wrapper">
                  <img src={resolveImageUrl(game.cover_image)} alt={game.title} className="game-card-img" />
                  <span className="game-card-status-badge" style={{ background: 'rgba(249, 115, 22, 0.2)', border: '1px solid rgba(249, 115, 22, 0.4)', color: 'var(--orange)' }}>
                    🧪 Testing Build
                  </span>
                </div>

                <div className="game-card-content">
                  <div className="game-card-tags">
                    {game.tags && game.tags.slice(0, 3).map((t, idx) => (
                      <span key={idx} className="game-tag">{t}</span>
                    ))}
                  </div>
                  <div className="game-card-info-block">
                    <h3 className="game-card-title">{game.title}</h3>
                    <span className="game-card-developer-mobile">{game.developer}</span>
                  </div>
                  <p className="game-card-desc">{game.description}</p>

                  <div className="game-card-footer">
                    <span className="game-developer">{game.developer}</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setSelectedGame(game)}>
                        Info
                      </button>
                      
                      {installedApps.includes(game.id) ? (
                        isOffline && game.isOnline ? (
                          <button className="btn btn-secondary btn-sm" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} title="Requires active internet connection.">
                            Locked
                          </button>
                        ) : (
                          <a href={getTestLaunchUrl(game)} target="_blank" rel="noreferrer" className="btn btn-sm" style={{ background: 'linear-gradient(135deg, var(--orange) 0%, #ea580c 100%)', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '0.85rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            Play Staging
                          </a>
                        )
                      ) : (
                        <button 
                          className="btn btn-sm" 
                          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border-glass)', color: '#fff' }}
                          onClick={() => {
                            showToastMsg(`Downloading cached client for ${game.title} (Test Build)...`, 'info');
                            setTimeout(() => {
                              onInstallToggle(game.id, true);
                              showToastMsg(`${game.title} ready for testing!`, 'success');
                            }, 1000);
                          }}
                          disabled={isOffline && !game.download_url}
                        >
                          Install
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '60px 20px',
              color: 'var(--text-muted)'
            }}>
              No test builds found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
