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
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';
import Downloads from './components/Downloads';
import TestCatalog from './components/TestCatalog';
import { Gamepad2, Layers, Settings, User as UserIcon, Download, FlaskConical } from 'lucide-react';
import { startSSOBackgroundCheck } from './shared/auth/sso-helper';
import { OfflineManager } from './shared/offlineDb';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [activeTab, setActiveTab] = useState<'store' | 'library' | 'profile' | 'developer' | 'downloads' | 'testing'>('store');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [showLegal, setShowLegal] = useState<'terms' | 'privacy' | 'none'>('none');

  // Network offline/online & Sync Queue States
  const [isOffline, setIsOffline] = useState(OfflineManager.isOffline());
  const [pendingSyncCount, setPendingSyncCount] = useState(OfflineManager.getSyncQueue().length);
  const [isSyncing, setIsSyncing] = useState(false);
  const [installedApps, setInstalledApps] = useState<string[]>(OfflineManager.getInstallsCache());

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (viewParam === 'privacy') {
      setShowLegal('privacy');
    } else if (viewParam === 'terms') {
      setShowLegal('terms');
    }
  }, []);
  
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

  const showToastMsg = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSession = () => {
    if (OfflineManager.isOffline()) {
      const cached = OfflineManager.getProfileCache();
      setUser(cached);
      setLoadingSession(false);
      return;
    }

    fetch('/api/auth/me')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Unauthorized');
      })
      .then(data => {
        if (data.success && data.user) {
          setUser(data.user);
          OfflineManager.saveProfileCache(data.user);
        } else {
          setUser(null);
          OfflineManager.saveProfileCache(null);
        }
      })
      .catch(() => {
        setUser(null);
        OfflineManager.saveProfileCache(null);
      })
      .finally(() => {
        setLoadingSession(false);
      });
  };

  const fetchAppsList = () => {
    setTimeout(() => setLoadingGames(true), 0);
    if (OfflineManager.isOffline()) {
      const cached = OfflineManager.getGamesCache();
      setGames(cached);
      setLoadingGames(false);
      return;
    }

    fetch('/api/apps')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setGames(data.apps);
          OfflineManager.saveGamesCache(data.apps);
        }
      })
      .catch(err => {
        console.error('Failed to fetch storefront applications:', err);
        const cached = OfflineManager.getGamesCache();
        setGames(cached);
      })
      .finally(() => {
        setLoadingGames(false);
      });
  };

  const fetchInstallsList = () => {
    if (OfflineManager.isOffline()) {
      setInstalledApps(OfflineManager.getInstallsCache());
      return;
    }

    fetch('/api/profile/installs')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.installs) {
          setInstalledApps(data.installs);
          OfflineManager.saveInstallsCache(data.installs);
        }
      })
      .catch(() => {
        setInstalledApps(OfflineManager.getInstallsCache());
      });
  };

  // Sync handler triggered manually or automatically
  const handleSync = async () => {
    if (OfflineManager.isOffline()) {
      showToastMsg('Cannot sync while offline.', 'error');
      return;
    }
    setIsSyncing(true);
    showToastMsg('Synchronizing offline updates with cloud server...', 'info');

    // Cool visual delay for premium sync spinner look
    await new Promise(r => setTimeout(r, 800));

    const result = await OfflineManager.syncDatabase();
    setIsSyncing(false);
    if (result.success) {
      showToastMsg(`Database synced successfully! ${result.syncedCount} changes pushed.`, 'success');
      fetchSession();
      fetchAppsList();
      fetchInstallsList();
    } else {
      showToastMsg(`Sync issues: ${result.errors.join(', ')}`, 'error');
    }
  };

  const toggleOfflineMode = () => {
    const nextForceOffline = !OfflineManager.isForceOffline();
    OfflineManager.setForceOffline(nextForceOffline);
    setIsOffline(nextForceOffline || !navigator.onLine);
    showToastMsg(
      nextForceOffline ? 'Offline mode forced active. Offline database loaded.' : 'Network mode restored. Reconnecting...',
      nextForceOffline ? 'info' : 'success'
    );
  };

  // Check login session & fetch games list & listen for sync events
  useEffect(() => {
    let active = true;
    let cleanupBackgroundCheck: (() => void) | null = null;

    const handleNetworkChange = () => {
      const offline = OfflineManager.isOffline();
      setIsOffline(offline);
      
      if (!offline) {
        OfflineManager.syncDatabase().then(result => {
          if (result.success && result.syncedCount > 0) {
            showToastMsg(`Reconnected! ${result.syncedCount} offline updates synced.`, 'success');
          }
          fetchSession();
          fetchAppsList();
          fetchInstallsList();
        });
      } else {
        fetchSession();
        fetchAppsList();
        fetchInstallsList();
      }
    };

    window.addEventListener('kbs_network_state_change', handleNetworkChange);
    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);

    const handleSyncQueueChange = () => {
      setPendingSyncCount(OfflineManager.getSyncQueue().length);
    };
    window.addEventListener('kbs_sync_queue_change', handleSyncQueueChange);

    const handleInstallsChange = () => {
      setInstalledApps(OfflineManager.getInstallsCache());
    };
    window.addEventListener('kbs_installs_change', handleInstallsChange);

    const checkSessionAndAuth = () => {
      if (OfflineManager.isOffline()) {
        const cached = OfflineManager.getProfileCache();
        setUser(cached);
        setLoadingSession(false);
        return;
      }

      fetch('/api/auth/me')
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Unauthorized');
        })
        .then(data => {
          if (!active) return;
          if (data.success && data.user) {
            setUser(data.user);
            OfflineManager.saveProfileCache(data.user);
          } else {
            setUser(null);
            OfflineManager.saveProfileCache(null);
            cleanupBackgroundCheck = startSSOBackgroundCheck({
              clientId: 'kbs-cloud',
              onSuccess: () => {
                fetch('/api/auth/me')
                  .then(res => res.json())
                  .then(data => {
                    if (data.success && data.user && active) {
                      setUser(data.user);
                      OfflineManager.saveProfileCache(data.user);
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
          OfflineManager.saveProfileCache(null);
          cleanupBackgroundCheck = startSSOBackgroundCheck({
            clientId: 'kbs-cloud',
            onSuccess: () => {
              fetch('/api/auth/me')
                .then(res => res.json())
                .then(data => {
                  if (data.success && data.user && active) {
                    setUser(data.user);
                    OfflineManager.saveProfileCache(data.user);
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
    fetchInstallsList();

    return () => {
      active = false;
      if (cleanupBackgroundCheck) {
        cleanupBackgroundCheck();
      }
      window.removeEventListener('kbs_network_state_change', handleNetworkChange);
      window.removeEventListener('online', handleNetworkChange);
      window.removeEventListener('offline', handleNetworkChange);
      window.removeEventListener('kbs_sync_queue_change', handleSyncQueueChange);
      window.removeEventListener('kbs_installs_change', handleInstallsChange);
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

  const handleSignIn = () => {
    const authUrl = getAuthServerUrl();
    const redirectUri = encodeURIComponent(`${window.location.origin}/api/auth/callback`);
    window.location.href = `${authUrl}/api/auth/authorize?client_id=kbs-cloud&redirect_uri=${redirectUri}`;
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      OfflineManager.saveProfileCache(null);
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
    const isLocalFileMode = window.location.protocol === 'file:';
    
    const getGameFolder = (gameId: string) => {
      switch (gameId) {
        case 'tickerclash': return 'ticker-clash';
        case 'sudoku': return 'sudoku-neon';
        case 'alchemist': return 'alchemists-crucible';
        default: return gameId; // 'starswarm', 'retrosweeper', 'gridlock-neon', 'sudoku-neon'
      }
    };

    if (isLocalFileMode && installedApps.includes(game.id)) {
      const folderName = getGameFolder(game.id);
      const pathname = window.location.pathname;
      const wsMarker = '/kbs-cloud/kbs-cloud/';
      const wsIndex = pathname.indexOf(wsMarker);
      
      if (wsIndex !== -1) {
        const workspaceRoot = pathname.substring(0, wsIndex);
        return `file://${workspaceRoot}/kbs-cloud/${folderName}/dist/index.html`;
      }
      
      return `../../../games/${folderName}/dist/index.html`;
    }

    if (activeTab === 'testing') {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return game.dev_url;
      }
      return `${window.location.origin}/test/${game.id}/`;
    }
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return game.dev_url;
    }
    return game.prod_url;
  };

  const handleInstallToggle = (gameId: string, installed: boolean) => {
    OfflineManager.setLocalInstallStatus(gameId, installed);
    
    if (!isOffline) {
      // If online, also fire API call immediately to SQLite server
      const method = installed ? 'POST' : 'DELETE';
      const endpoint = installed ? '/api/profile/installs' : `/api/profile/installs/${gameId}`;
      const body = installed ? JSON.stringify({ appId: gameId }) : undefined;
      
      fetch(endpoint, {
        method,
        headers: installed ? { 'Content-Type': 'application/json' } : undefined,
        body
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          fetchInstallsList();
        }
      })
      .catch(err => {
        console.error('Failed to sync install toggle with backend:', err);
      });
    } else {
      // Just update local state since hook is listening
      setInstalledApps(OfflineManager.getInstallsCache());
    }
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
        isOffline={isOffline}
        toggleOfflineMode={toggleOfflineMode}
        pendingSyncCount={pendingSyncCount}
        isSyncing={isSyncing}
        onSync={handleSync}
      />

      {/* MAIN CONTAINER */}
      <main className="content-container">
        {activeTab === 'store' && (
          <Storefront
            games={games.filter(g => g.prod_url && g.prod_url.trim() !== '')}
            loadingGames={loadingGames}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setSelectedGame={setSelectedGame}
            getLaunchUrl={getLaunchUrl}
            isOffline={isOffline}
            installedApps={installedApps}
            onInstallToggle={handleInstallToggle}
            showToastMsg={showToastMsg}
          />
        )}

        {activeTab === 'library' && (
          <Library
            user={user}
            games={games.filter(g => g.prod_url && g.prod_url.trim() !== '')}
            loadingGames={loadingGames}
            setSelectedGame={setSelectedGame}
            getLaunchUrl={getLaunchUrl}
            handleSignIn={handleSignIn}
            isOffline={isOffline}
            installedApps={installedApps}
            onInstallToggle={handleInstallToggle}
            showToastMsg={showToastMsg}
          />
        )}

        {activeTab === 'testing' && (
          <TestCatalog
            games={games}
            loadingGames={loadingGames}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setSelectedGame={setSelectedGame}
            isOffline={isOffline}
            installedApps={installedApps}
            onInstallToggle={handleInstallToggle}
            showToastMsg={showToastMsg}
          />
        )}

        {activeTab === 'downloads' && (
          <Downloads />
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
          isOffline={isOffline}
          installed={installedApps.includes(selectedGame.id)}
          onInstallToggle={(installed) => handleInstallToggle(selectedGame.id, installed)}
        />
      )}

      {/* FOOTER */}
      <Footer onNavigate={(page) => setShowLegal(page)} onNavigateTab={setActiveTab} />

      {/* LEGAL OVERLAYS */}
      {showLegal === 'terms' && (
        <TermsOfService onBack={() => setShowLegal('none')} />
      )}
      {showLegal === 'privacy' && (
        <PrivacyPolicy onBack={() => setShowLegal('none')} />
      )}

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
        <button 
          className={`mobile-nav-item ${activeTab === 'downloads' ? 'active' : ''}`}
          onClick={() => setActiveTab('downloads')}
        >
          <Download size={20} />
          <span>Client</span>
        </button>
        <button 
          className={`mobile-nav-item ${activeTab === 'testing' ? 'active' : ''}`}
          onClick={() => setActiveTab('testing')}
        >
          <FlaskConical size={20} />
          <span>Testing</span>
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
