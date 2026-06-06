import { Gamepad2, ChevronDown, User, Settings, Layers, LogOut, Zap, ZapOff } from 'lucide-react';
import type { UserProfile } from '../types';

export interface HeaderProps {
  user: UserProfile | null;
  loadingSession: boolean;
  activeTab: 'store' | 'library' | 'profile' | 'developer';
  setActiveTab: (tab: 'store' | 'library' | 'profile' | 'developer') => void;
  showDropdown: boolean;
  setShowDropdown: (show: boolean) => void;
  handleSignIn: () => void;
  handleSignOut: () => void;
  performanceMode: boolean;
  setPerformanceMode: (mode: boolean) => void;
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
  setPerformanceMode
}: HeaderProps) {
  return (
    <header className="navbar">
      <a href="/" className="navbar-brand" onClick={(e) => { e.preventDefault(); setActiveTab('store'); }}>
        <Gamepad2 className="logo-glow" size={32} />
        <span style={{ letterSpacing: '1px' }}>
          <span style={{ fontWeight: 800 }}>KBS</span>
          <span style={{ color: 'var(--cyan)', fontWeight: 400 }}>CLOUD</span>
          <span style={{ color: 'var(--purple)', fontWeight: 600, fontSize: '0.8rem', marginLeft: '6px', fontFamily: 'var(--font-mono)' }}>HUB</span>
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
        <button
          onClick={() => setPerformanceMode(!performanceMode)}
          className="btn btn-secondary btn-sm"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            borderColor: performanceMode ? 'rgba(255, 123, 0, 0.4)' : 'var(--border-glass)',
            color: performanceMode ? 'var(--orange)' : 'var(--text-secondary)',
            background: performanceMode ? 'rgba(255, 123, 0, 0.08)' : 'rgba(255, 255, 255, 0.03)',
            padding: '6px 12px',
            height: '36px',
            borderRadius: '18px'
          }}
          title={performanceMode ? "Eco Mode Active: Click to restore visuals" : "Visual Mode Active: Click to reduce CPU usage"}
        >
          {performanceMode ? <ZapOff size={16} /> : <Zap size={16} />}
          <span style={{ fontSize: '0.8rem', fontWeight: 600, fontFamily: 'var(--font-sans)' }}>
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
              <ChevronDown size={14} style={{ opacity: 0.6 }} />
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
          <button className="btn btn-outline-cyan btn-sm" onClick={handleSignIn}>
            <User size={16} /> Sign In
          </button>
        )}
      </div>
    </header>
  );
}
