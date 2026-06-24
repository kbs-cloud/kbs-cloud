import { ChevronDown, User, Settings, Layers, LogOut, Zap, ZapOff, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import type { UserProfile } from '../types';

export interface HeaderProps {
  user: UserProfile | null;
  loadingSession: boolean;
  activeTab: 'store' | 'library' | 'profile' | 'developer' | 'downloads' | 'testing';
  setActiveTab: (tab: 'store' | 'library' | 'profile' | 'developer' | 'downloads' | 'testing') => void;
  showDropdown: boolean;
  setShowDropdown: (show: boolean) => void;
  handleSignIn: () => void;
  handleSignOut: () => void;
  performanceMode: boolean;
  setPerformanceMode: (mode: boolean) => void;
  isOffline: boolean;
  toggleOfflineMode: () => void;
  pendingSyncCount: number;
  isSyncing: boolean;
  onSync: () => void;
}

export default function Header({
  user,
  loadingSession,
  activeTab,
  setActiveTab,
  showDropdown,
  setShowDropdown,
  handleSignIn,
  handleSignOut,
  performanceMode,
  setPerformanceMode,
  isOffline,
  toggleOfflineMode,
  pendingSyncCount,
  isSyncing,
  onSync
}: HeaderProps) {
  return (
    <header className="navbar">
      <a href="/" className="navbar-brand" onClick={(e) => { e.preventDefault(); setActiveTab('store'); }}>
        <img src="/logo.png" className="logo-glow" style={{ height: '32px', width: '32px', borderRadius: '4px', objectFit: 'cover' }} alt="KBS Cloud" />
        <span className="navbar-brand-text" style={{ letterSpacing: '1px' }}>
          <span style={{ fontWeight: 800 }}>KBS</span>
          <span className="brand-cloud" style={{ color: 'var(--cyan)', fontWeight: 400 }}>CLOUD</span>
          <span className="brand-hub" style={{ color: 'var(--purple)', fontWeight: 600, fontSize: '0.8rem', marginLeft: '6px', fontFamily: 'var(--font-mono)' }}>HUB</span>
        </span>
      </a>

      <nav>
        <ul className="navbar-nav">
          <li>
            <button 
              className={`nav-link ${activeTab === 'store' ? 'active' : ''}`}
              onClick={() => setActiveTab('store')}
              style={{ background: 'none', border: 'none' }}
            >
              Storefront
            </button>
          </li>
          <li>
            <button 
              className={`nav-link ${activeTab === 'library' ? 'active' : ''}`}
              onClick={() => setActiveTab('library')}
              style={{ background: 'none', border: 'none' }}
            >
              My Library
            </button>
          </li>
          <li>
            <button 
              className={`nav-link ${activeTab === 'downloads' ? 'active' : ''}`}
              onClick={() => setActiveTab('downloads')}
              style={{ background: 'none', border: 'none' }}
            >
              Downloads
            </button>
          </li>
          <li>
            <button 
              className={`nav-link ${activeTab === 'testing' ? 'active' : ''}`}
              onClick={() => setActiveTab('testing')}
              style={{ background: 'none', border: 'none' }}
            >
              Test Builds
            </button>
          </li>
          {user && (
            <li>
              <button 
                className={`nav-link ${activeTab === 'developer' ? 'active' : ''}`}
                onClick={() => setActiveTab('developer')}
                style={{ background: 'none', border: 'none' }}
              >
                {user.role === 'pending' ? 'Access Pending' : 'Developer Portal'}
              </button>
            </li>
          )}
        </ul>
      </nav>

      <div className="navbar-actions">
        {/* Offline / Online Status Badge */}
        <button
          onClick={toggleOfflineMode}
          className={`btn btn-sm ${isOffline ? 'btn-outline-orange' : 'btn-outline-green'}`}
          title={isOffline ? "Forced Offline: Click to reconnect" : "Online: Click to simulate offline mode"}
          style={{
            borderColor: isOffline ? 'var(--orange)' : 'var(--green)',
            color: isOffline ? 'var(--orange)' : 'var(--green)',
            background: 'rgba(0, 0, 0, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {isOffline ? <WifiOff size={14} /> : <Wifi size={14} />}
          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
            {isOffline ? 'OFFLINE' : 'ONLINE'}
          </span>
        </button>

        {/* Sync queue indicator */}
        {pendingSyncCount > 0 && (
          <button
            onClick={onSync}
            disabled={isSyncing || isOffline}
            className="btn btn-secondary btn-sm"
            title={isOffline ? "Sync pending: Cannot sync while offline" : `Sync pending: ${pendingSyncCount} changes. Click to sync.`}
            style={{
              borderColor: 'var(--cyan)',
              color: 'var(--cyan)',
              background: 'rgba(0, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: isOffline ? 'not-allowed' : 'pointer',
              opacity: isOffline ? 0.5 : 1
            }}
          >
            <RefreshCw 
              size={12} 
              className={isSyncing ? 'anim-spin' : ''} 
              style={{ 
                animation: isSyncing ? 'spin 1s linear infinite' : 'none',
                marginRight: '2px'
              }} 
            />
            <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>
              SYNC ({pendingSyncCount})
            </span>
          </button>
        )}

        <button
          onClick={() => setPerformanceMode(!performanceMode)}
          className={`btn btn-secondary btn-sm btn-perf-toggle ${performanceMode ? 'perf-active' : ''}`}
          title={performanceMode ? "Eco Mode Active: Click to restore visuals" : "Visual Mode Active: Click to reduce CPU usage"}
        >
          {performanceMode ? <ZapOff size={16} /> : <Zap size={16} />}
          <span className="perf-toggle-text" style={{ fontSize: '0.8rem', fontWeight: 600, fontFamily: 'var(--font-sans)' }}>
            {performanceMode ? 'ECO ACTIVE' : 'VISUALS'}
          </span>
        </button>

        {loadingSession ? (
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.1)',
            borderTopColor: 'var(--cyan)',
            animation: 'spin 1s linear infinite'
          }} />
        ) : user ? (
          <div className="user-menu-container">
            <button 
              className="user-profile-badge" 
              onClick={() => setShowDropdown(!showDropdown)}
              style={{ border: 'none', color: '#fff', font: 'inherit' }}
            >
              <div className="avatar">
                {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
              </div>
              <span className="username">{user.displayName}</span>
              <ChevronDown className="user-menu-chevron" size={14} style={{ opacity: 0.6 }} />
            </button>

            {showDropdown && (
              <div className="dropdown-menu glass-panel">
                <div className="dropdown-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="avatar" style={{ width: '18px', height: '18px', fontSize: '0.6rem' }}>
                      {user.avatarUrl.length === 1 ? user.avatarUrl : user.avatarUrl[0]}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>{user.displayName}</span>
                  </div>
                  <div className="dropdown-email" style={{ marginTop: '4px' }}>{user.email}</div>
                  <div style={{
                    fontSize: '0.7rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--cyan)',
                    marginTop: '4px'
                  }}>
                    Level {user.level} ({user.xp % 500} / 500 XP)
                  </div>
                </div>
                <button className="dropdown-item" onClick={() => { setActiveTab('profile'); setShowDropdown(false); }}>
                  <User size={16} /> My KBS Profile
                </button>
                <button className="dropdown-item" onClick={() => { setActiveTab('developer'); setShowDropdown(false); }}>
                  <Settings size={16} /> {user.role === 'pending' ? 'Access Pending' : 'Developer Portal'}
                </button>
                <button className="dropdown-item" onClick={() => { setActiveTab('library'); setShowDropdown(false); }}>
                  <Layers size={16} /> My Library
                </button>
                <button className="dropdown-item dropdown-item-danger" onClick={handleSignOut}>
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button className="btn btn-outline-cyan btn-sm sign-in-btn" onClick={handleSignIn}>
            <User size={16} />
            <span className="sign-in-text">Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
}
