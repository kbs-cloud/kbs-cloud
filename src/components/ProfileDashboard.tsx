import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { User, Award } from 'lucide-react';
import type { UserProfile } from '../types';

export interface ProfileDashboardProps {
  user: UserProfile;
  onProfileUpdated: () => void;
  showToastMsg: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export default function ProfileDashboard({
  user,
  onProfileUpdated,
  showToastMsg
}: ProfileDashboardProps) {
  const [editName, setEditName] = useState(user.displayName);
  const [editAvatar, setEditAvatar] = useState(user.avatarUrl);
  const [editBio, setEditBio] = useState(user.bio);
  interface UnlockedAchievement {
    achievement_icon: string;
    achievement_title: string;
    app_title: string;
    achievement_desc: string;
    xp_value: number;
    unlocked_at: string;
  }

  const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievement[]>([]);
  const [loadingAchievements, setLoadingAchievements] = useState(true);

  // Fetch achievements on mount
  useEffect(() => {
    fetch('/api/profile/achievements')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUnlockedAchievements(data.achievements);
        }
      })
      .catch(err => console.error('Error fetching unlocked achievements:', err))
      .finally(() => setLoadingAchievements(false));
  }, []);

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: editName, avatarUrl: editAvatar, bio: editBio })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToastMsg('Profile details successfully updated!', 'success');
        onProfileUpdated(); // reload profile session state in App.tsx
      } else {
        showToastMsg(data.error || 'Failed to update profile details.', 'error');
      }
    } catch {
      showToastMsg('Server connection error.', 'error');
    }
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <h2 className="section-title">
        <User size={24} style={{ color: 'var(--cyan)' }} />
        Gamer Profile Dashboard
      </h2>

      <div className="profile-dashboard glass-panel" style={{ padding: '32px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div className="profile-hero" style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="profile-avatar-large" style={{
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--cyan), var(--purple))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '3.5rem',
            color: '#fff',
            boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)'
          }}>
            {user.avatarUrl.length === 1 ? user.avatarUrl : user.avatarUrl[0]}
          </div>
          <div className="profile-info-main" style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '2.2rem', color: '#fff' }}>{user.displayName}</h2>
              <span className="profile-badge-sso" style={{
                fontSize: '0.7rem',
                fontFamily: 'var(--font-mono)',
                background: 'rgba(57, 255, 20, 0.15)',
                border: '1px solid var(--green)',
                color: 'var(--green)',
                padding: '2px 8px',
                borderRadius: '4px',
                textTransform: 'uppercase'
              }}>
                SSO Sync Activated
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '1.05rem', fontStyle: 'italic', maxWidth: '600px' }}>
              "{user.bio || 'Ready to clash!'}"
            </p>
            <div className="profile-level-badge" style={{
              display: 'inline-block',
              background: 'var(--purple)',
              color: '#fff',
              fontFamily: 'var(--font-mono)',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              marginTop: '12px'
            }}>
              Level {user.level}
            </div>
          </div>
        </div>

        {/* XP LEVEL BAR */}
        <div className="profile-xp-section" style={{
          background: 'rgba(255,255,255,0.01)',
          border: '1px solid rgba(255,255,255,0.04)',
          padding: '20px',
          borderRadius: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
              Level Progress ({user.xp % 500} / 500 XP to next level)
            </span>
            <span style={{ color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
              Total Accumulated: {user.xp} XP
            </span>
          </div>
          <div className="xp-bar-bg" style={{
            height: '12px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '6px',
            overflow: 'hidden'
          }}>
            <div className="xp-bar-fill" style={{
              height: '100%',
              background: 'linear-gradient(90deg, var(--cyan), var(--purple))',
              width: `${((user.xp % 500) / 500) * 100}%`,
              boxShadow: '0 0 8px var(--cyan)',
              transition: 'width 0.5s ease-in-out'
            }} />
          </div>
        </div>

        {/* EDIT PROFILE */}
        <div className="profile-edit-section" style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: '24px'
        }}>
          <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '16px' }}>Customize Hub Identity</h3>
          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '240px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Custom Display Name
                </label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#fff',
                    outline: 'none'
                  }}
                  required
                />
              </div>
              <div style={{ flex: 1, minWidth: '240px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Avatar Character / Emoji (1-2 chars)
                </label>
                <input 
                  type="text" 
                  maxLength={2}
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#fff',
                    outline: 'none',
                    textAlign: 'center'
                  }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Gamer Bio / Status
              </label>
              <textarea 
                rows={2}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#fff',
                  outline: 'none',
                  resize: 'none',
                  fontFamily: 'inherit'
                }}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }}>
              Save Customizations
            </button>
          </form>
        </div>

        {/* UNLOCKED ACHIEVEMENTS */}
        <div className="profile-achievements-section" style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: '24px'
        }}>
          <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={20} style={{ color: 'var(--cyan)' }} />
            Unlocked Achievements ({unlockedAchievements.length})
          </h3>

          {loadingAchievements ? (
            <div style={{ padding: '10px', color: 'var(--text-secondary)' }}>Loading your achievements...</div>
          ) : unlockedAchievements.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '16px',
              marginTop: '16px'
            }}>
              {unlockedAchievements.map((ach, idx) => (
                <div key={idx} className="glass-panel" style={{
                  padding: '16px',
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'center'
                }}>
                  <div style={{
                    fontSize: '2.5rem',
                    background: 'rgba(255,255,255,0.02)',
                    width: '60px',
                    height: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    {ach.achievement_icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 600 }}>{ach.achievement_title}</h4>
                      <span style={{
                        fontSize: '0.65rem',
                        color: 'var(--cyan)',
                        background: 'rgba(0, 255, 255, 0.1)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: '1px solid rgba(0, 255, 255, 0.2)'
                      }}>
                        {ach.app_title}
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px', lineHeight: '1.3' }}>
                      {ach.achievement_desc}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                      <span>+{ach.xp_value} XP</span>
                      <span>Unlocked {new Date(ach.unlocked_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '30px 10px', color: 'var(--text-secondary)' }}>
              No achievements unlocked yet. Fulfill simulation objectives in Ticker Clash or command space battles in Star-Swarm to unlock achievements!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
