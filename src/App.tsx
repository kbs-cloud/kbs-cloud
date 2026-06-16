import { useEffect, useState } from 'react';
import type { UserProfile, Game } from './types';
import Header from './components/Header';
import Footer from './components/Footer';
import Toast from './components/Toast';
import Storefront from './components/Storefront';
import Library from './components/Library';
import ProfileDashboard from './components/ProfileDashboard';
import DevPortal from './components/DevPortal';
import GameDetailModal from './components/GameDetailModal';
import { Gamepad2, Layers, Settings, User as UserIcon } from 'lucide-react';
import { startSSOBackgroundCheck } from './shared/auth/sso-helper';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [activeTab, setActiveTab] = useState<'store' | 'library' | 'profile' | 'developer'>('store');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  
  // Performance mode state & effect
  const [performanceMode, setPerformanceMode] = useState<boolean>(() => {
    return localStorage.getItem('perf-mode') === 'true';
  });

  useEffect(() => {
    if (performanceMode) {
      document.body.classList.add('perf-mode');
    } else {
      document.body.classList.remove('perf-mode');
    }
    localStorage.setItem('perf-mode', String(performanceMode));
  }, [performanceMode]);

  // Hub data states
  const [games, setGames] = useState<Game[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);

  const fetchSession = () => {
    fetch('/api/auth/me')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Unauthorized');
      })
      .then(data => {
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoadingSession(false);
      });
  };

  const fetchAppsList = () => {
    setTimeout(() => setLoadingGames(true), 0);
    fetch('/api/apps')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setGames(data.apps);
        }
      })
      .catch(err => {
        console.error('Failed to fetch storefront applications:', err);
      })
      .finally(() => {
        setLoadingGames(false);
      });
  };

  // Check login session & fetch games list
  useEffect(() => {
    let active = true;
    let cleanupBackgroundCheck: (() => void) | null = null;

    const checkSessionAndAuth = () => {
      fetch('/api/auth/me')
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Unauthorized');
        })
        .then(data => {
          if (!active) return;
          if (data.success && data.user) {
            setUser(data.user);
          } else {
            setUser(null);
            cleanupBackgroundCheck = startSSOBackgroundCheck({
              clientId: 'kbs-cloud',
              onSuccess: () => {
                fetch('/api/auth/me')
                  .then(res => res.json())
                  .then(data => {
                    if (data.success && data.user && active) {
                      setUser(data.user);
                    }
                  })
                  .catch(() => {});
              }
            });
          }
        })
        .catch(() => {
          if (!active) return;
          setUser(null);
          cleanupBackgroundCheck = startSSOBackgroundCheck({
            clientId: 'kbs-cloud',
            onSuccess: () => {
              fetch('/api/auth/me')
                .then(res => res.json())
                .then(data => {
                  if (data.success && data.user && active) {
                    setUser(data.user);
                  }
                })
                .catch(() => {});
            }
          });
        })
        .finally(() => {
          if (active) {
            setLoadingSession(false);
          }
        });
    };

    checkSessionAndAuth();
    fetchAppsList();

    return () => {
      active = false;
      if (cleanupBackgroundCheck) {
        cleanupBackgroundCheck();
      }
    };
  }, []);

  const getAuthServerUrl = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      const port = window.location.port;
      if (port === '28000' || port === '29000') {
        return 'http://localhost:28001';
      }
      return 'http://localhost:19001';
    }
    return 'https://auth.kbs-cloud.com';
  };

  const showToastMsg = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSignIn = () => {
    const authUrl = getAuthServerUrl();
    const redirectUri = encodeURIComponent(`${window.location.origin}/api/auth/callback`);
    window.location.href = `${authUrl}/api/auth/authorize?client_id=kbs-cloud&redirect_uri=${redirectUri}`;
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setShowDropdown(false);
      setActiveTab('store');
      showToastMsg('Logged out from hub successfully.', 'success');
      
      const authUrl = getAuthServerUrl();
      window.location.href = `${authUrl}/api/auth/logout?redirect_uri=${encodeURIComponent(window.location.origin)}`;
    } catch {
      showToastMsg('Failed to log out cleanly.', 'error');
    }
  };

  const getLaunchUrl = (game: Game) => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return game.dev_url;
    }
    return game.prod_url;
  };

  return (
    <div className="app-container">
      <div className="space-background" />

      {/* TOAST SYSTEM */}
      <Toast toast={toast} />

      {/* HEADER NAVBAR */}
      <Header
        user={user}
        loadingSession={loadingSession}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        showDropdown={showDropdown}
        setShowDropdown={setShowDropdown}
        handleSignIn={handleSignIn}
        handleSignOut={handleSignOut}
        performanceMode={performanceMode}
        setPerformanceMode={setPerformanceMode}
      />

      {/* MAIN CONTAINER */}
      <main className="content-container">
        {activeTab === 'store' && (
          <Storefront
            games={games}
            loadingGames={loadingGames}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setSelectedGame={setSelectedGame}
            getLaunchUrl={getLaunchUrl}
          />
        )}

        {activeTab === 'library' && (
          <Library
            user={user}
            games={games}
            loadingGames={loadingGames}
            setSelectedGame={setSelectedGame}
            getLaunchUrl={getLaunchUrl}
            handleSignIn={handleSignIn}
          />
        )}

        {activeTab === 'profile' && user && (
          <ProfileDashboard
            key={user.email}
            user={user}
            onProfileUpdated={fetchSession}
            showToastMsg={showToastMsg}
          />
        )}

        {activeTab === 'developer' && user && (
          <DevPortal
            key={user.email}
            user={user}
            onRefreshStorefront={fetchAppsList}
            showToastMsg={showToastMsg}
            onProfileUpdated={fetchSession}
          />
        )}
      </main>

      {/* GAME DETAIL MODAL */}
      {selectedGame && (
        <GameDetailModal
          game={selectedGame}
          onClose={() => setSelectedGame(null)}
          user={user}
          getLaunchUrl={getLaunchUrl}
        />
      )}

      {/* FOOTER */}
      <Footer />

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="mobile-nav">
        <button 
          className={`mobile-nav-item ${activeTab === 'store' ? 'active' : ''}`}
          onClick={() => setActiveTab('store')}
        >
          <Gamepad2 size={20} />
          <span>Store</span>
        </button>
        <button 
          className={`mobile-nav-item ${activeTab === 'library' ? 'active' : ''}`}
          onClick={() => setActiveTab('library')}
        >
          <Layers size={20} />
          <span>Library</span>
        </button>
        {user && (
          <button 
            className={`mobile-nav-item ${activeTab === 'developer' ? 'active' : ''}`}
            onClick={() => setActiveTab('developer')}
          >
            <Settings size={20} />
            <span>Dev Portal</span>
          </button>
        )}
        {user && (
          <button 
            className={`mobile-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <UserIcon size={20} />
            <span>Profile</span>
          </button>
        )}
      </nav>
    </div>
  );
}
