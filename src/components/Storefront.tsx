import { Gamepad2, Search, ExternalLink, Info } from 'lucide-react';
import type { Game } from '../types';
import { resolveImageUrl } from '../shared/offlineDb';

export interface StorefrontProps {
  games: Game[];
  loadingGames: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setSelectedGame: (game: Game | null) => void;
  getLaunchUrl: (game: Game) => string;
  isOffline: boolean;
  installedApps: string[];
  onInstallToggle: (gameId: string, installed: boolean) => void;
  showToastMsg: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function Storefront({
  games,
  loadingGames,
  searchQuery,
  setSearchQuery,
  setSelectedGame,
  getLaunchUrl,
  isOffline,
  installedApps,
  onInstallToggle,
  showToastMsg
}: StorefrontProps) {
  const filteredGames = games.filter(game => {
    const matchesQuery = game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (game.tags && game.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesQuery;
  });

  const featuredGame = games.length > 0 ? games[0] : null;

  return (
    <>
      {/* HERO BANNER */}
      {featuredGame && (
        <div className="hero-banner">
          <img src={resolveImageUrl(featuredGame.cover_image)} alt={featuredGame.title} className="hero-image" />
          <div className="hero-overlay">
            <span className="hero-badge">Featured Game</span>
            <h1 className="hero-title">{featuredGame.title} Out Now</h1>
            <p className="hero-description">
              {featuredGame.description}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <a href={getLaunchUrl(featuredGame)} target="_blank" rel="noreferrer" className="btn btn-primary">
                Play Now <ExternalLink size={16} />
              </a>
              <button className="btn btn-secondary" onClick={() => setSelectedGame(featuredGame)}>
                <Info size={16} /> Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STOREFRONT GRID */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 className="section-title">
          <Gamepad2 size={24} style={{ color: 'var(--cyan)' }} /> 
          Explore Games
        </h2>

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
            placeholder="Search game catalog..." 
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
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--cyan)' }}>
          Loading game catalogue database...
        </div>
      ) : (
        <div className="game-grid">
          {filteredGames.length > 0 ? (
            filteredGames.map(game => (
              <div key={game.id} className="game-card glass-panel glass-panel-interactive">
                <div className="game-card-img-wrapper">
                  <img src={resolveImageUrl(game.cover_image)} alt={game.title} className="game-card-img" />
                  <span className="game-card-status-badge">
                    {game.icon} Available
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
                          <a href={getLaunchUrl(game)} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
                            Play
                          </a>
                        )
                      ) : (
                        <button 
                          className="btn btn-primary btn-sm" 
                          onClick={() => {
                            showToastMsg(`Downloading cached client for ${game.title}...`, 'info');
                            setTimeout(() => {
                              onInstallToggle(game.id, true);
                              showToastMsg(`${game.title} ready to launch!`, 'success');
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
              No games found matching your search.
            </div>
          )}
        </div>
      )}
    </>
  );
}
