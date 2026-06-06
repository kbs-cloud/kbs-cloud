import { Layers, User } from 'lucide-react';
import type { UserProfile, Game } from '../types';

export interface LibraryProps {
  user: UserProfile | null;
  games: Game[];
  loadingGames: boolean;
  setSelectedGame: (game: Game | null) => void;
  getLaunchUrl: (game: Game) => string;
  handleSignIn: () => void;
}

export default function Library({
  user,
  games,
  loadingGames,
  setSelectedGame,
  getLaunchUrl,
  handleSignIn
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
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '24px',
            marginTop: '16px'
          }}>
            {games.map(game => (
              <div key={game.id} className="glass-panel" style={{
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                height: '240px',
                position: 'relative'
              }}>
                <img 
                  src={game.cover_image || '/starswarm_cover.png'} 
                  alt={game.title} 
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: 'brightness(0.3) blur(2px)',
                    zIndex: -1
                  }} 
                />
                
                <div style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  justifyContent: 'space-between',
                  background: 'linear-gradient(180deg, rgba(5,3,14,0.4) 0%, rgba(5,3,14,0.9) 100%)'
                }}>
                  <div>
                    <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '4px' }}>
                      {game.icon} {game.title}
                    </h3>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.7rem',
                      color: 'var(--cyan)',
                      border: '1px solid rgba(0, 255, 255, 0.3)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      textTransform: 'uppercase'
                    }}>
                      SSO Active
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <a href={getLaunchUrl(game)} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                      Launch Game
                    </a>
                    <button className="btn btn-secondary btn-sm" onClick={() => setSelectedGame(game)}>
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
