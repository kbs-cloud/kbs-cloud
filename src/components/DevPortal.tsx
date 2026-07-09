import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Key, Plus, ArrowLeft, Check, Copy, Shield, Users, Trash, UserPlus, Award, Monitor, Laptop, Smartphone, Terminal } from 'lucide-react';
import type { Game, Achievement, UserProfile } from '../types';
import { resolveImageUrl } from '../shared/offlineDb';

export interface DevPortalProps {
  user: UserProfile;
  onRefreshStorefront: () => void;
  showToastMsg: (message: string, type?: 'success' | 'info' | 'error') => void;
  onProfileUpdated?: () => void;
}

export default function DevPortal({
  user,
  onRefreshStorefront,
  showToastMsg,
  onProfileUpdated
}: DevPortalProps) {
  // Global Tab for Admins: 'apps' or 'iam'
  const [portalTab, setPortalTab] = useState<'apps' | 'iam'>('apps');

  // Portal Navigation Views
  const [devApps, setDevApps] = useState<Game[]>([]);
  const [isAddingApp, setIsAddingApp] = useState(false);
  const [editingApp, setEditingApp] = useState<Game | null>(null);
  const [managingApp, setManagingApp] = useState<Game | null>(null);

  // App & Achievement local database states for managed app
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loadingAchievements, setLoadingAchievements] = useState(false);

  // App sub-tab: 'achievements' or 'collaborators'
  const [manageSubTab, setManageSubTab] = useState<'achievements' | 'collaborators'>('achievements');

  // Collaborators States
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [loadingCollaborators, setLoadingCollaborators] = useState(false);
  const [newCollabEmail, setNewCollabEmail] = useState('');
  const [newCollabPermission, setNewCollabPermission] = useState<'admin' | 'write' | 'read'>('read');

  // IAM Panel States
  const [iamUsers, setIamUsers] = useState<any[]>([]);
  const [loadingIam, setLoadingIam] = useState(false);
  const [preAuthEmail, setPreAuthEmail] = useState('');
  const [preAuthRole, setPreAuthRole] = useState<'admin' | 'developer'>('developer');

  // App Tokens visibility state
  const [visibleTokens, setVisibleTokens] = useState<Record<string, boolean>>({});
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // App Form States
  const [formId, setFormId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDev, setFormDev] = useState('');
  const [formPub, setFormPub] = useState('');
  const [formRelease, setFormRelease] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formFullDesc, setFormFullDesc] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formFeatures, setFormFeatures] = useState('');
  const [formOs, setFormOs] = useState('');
  const [formCpu, setFormCpu] = useState('');
  const [formMemory, setFormMemory] = useState('');
  const [formGraphics, setFormGraphics] = useState('');
  const [formStorage, setFormStorage] = useState('');
  const [formProdUrl, setFormProdUrl] = useState('');
  const [formDevUrl, setFormDevUrl] = useState('');
  const [formGithubUrl, setFormGithubUrl] = useState('');
  const [formDownloadUrl, setFormDownloadUrl] = useState('');
  const [formCoverImage, setFormCoverImage] = useState('');
  const [formIcon, setFormIcon] = useState('');
  const [formIsOnline, setFormIsOnline] = useState(true);
  const [formIsMultiplayer, setFormIsMultiplayer] = useState(true);
  const [formWebsite, setFormWebsite] = useState('');
  const [formIsWebGame, setFormIsWebGame] = useState(true);

  const [formBuildWindowsUrl, setFormBuildWindowsUrl] = useState('');
  const [formBuildWindowsStatus, setFormBuildWindowsStatus] = useState('inactive');
  const [formBuildWindowsError, setFormBuildWindowsError] = useState('');

  const [formBuildLinuxUrl, setFormBuildLinuxUrl] = useState('');
  const [formBuildLinuxStatus, setFormBuildLinuxStatus] = useState('inactive');
  const [formBuildLinuxError, setFormBuildLinuxError] = useState('');

  const [formBuildMacosUrl, setFormBuildMacosUrl] = useState('');
  const [formBuildMacosStatus, setFormBuildMacosStatus] = useState('inactive');
  const [formBuildMacosError, setFormBuildMacosError] = useState('');

  const [formBuildAndroidUrl, setFormBuildAndroidUrl] = useState('');
  const [formBuildAndroidStatus, setFormBuildAndroidStatus] = useState('inactive');
  const [formBuildAndroidError, setFormBuildAndroidError] = useState('');

  const [formBuildIosUrl, setFormBuildIosUrl] = useState('');
  const [formBuildIosStatus, setFormBuildIosStatus] = useState('inactive');
  const [formBuildIosError, setFormBuildIosError] = useState('');

  const [isDragging, setIsDragging] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Achievement Form States
  const [achId, setAchId] = useState('');
  const [achTitle, setAchTitle] = useState('');
  const [achDesc, setAchDesc] = useState('');
  const [achIcon, setAchIcon] = useState('🏆');
  const [achXpValue, setAchXpValue] = useState(100);

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToastMsg('Only image files are supported.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToastMsg('Image size must be less than 5MB.', 'error');
      return;
    }

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      try {
        const res = await fetch('/api/developer/upload-cover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileData: base64Data
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setFormCoverImage(data.url);
          showToastMsg('Cover image uploaded successfully!', 'success');
        } else {
          showToastMsg(data.error || 'Failed to upload cover image.', 'error');
        }
      } catch (err) {
        showToastMsg('Error uploading image.', 'error');
      } finally {
        setUploadingImage(false);
      }
    };
    reader.onerror = () => {
      showToastMsg('Failed to read file.', 'error');
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFile(e.target.files[0]);
    }
  };

  const fetchDevAppsList = () => {
    fetch('/api/developer/apps')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDevApps(data.apps);
        }
      })
      .catch(err => console.error('Error fetching developer apps:', err));
  };

  // Fetch developer apps list on mount/user change if authorized
  useEffect(() => {
    if (user.role === 'admin' || user.role === 'developer') {
      fetchDevAppsList();
    }
  }, [user]);

  // Fetch achievements when managing game changes
  useEffect(() => {
    if (managingApp && manageSubTab === 'achievements') {
      setTimeout(() => setLoadingAchievements(true), 0);
      fetch(`/api/apps/${managingApp.id}/achievements`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setAchievements(data.achievements);
          }
        })
        .catch(err => console.error('Error fetching achievements:', err))
        .finally(() => setLoadingAchievements(false));
    } else {
      setTimeout(() => setAchievements([]), 0);
    }
  }, [managingApp, manageSubTab]);

  // Fetch collaborators when managing app collaborator tab is active
  useEffect(() => {
    if (managingApp && manageSubTab === 'collaborators') {
      fetchCollaborators();
    }
  }, [managingApp, manageSubTab]);

  // Fetch IAM users list when IAM tab is selected
  useEffect(() => {
    if (portalTab === 'iam') {
      fetchIamUsers();
    }
  }, [portalTab]);

  // Collaborator API functions
  const fetchCollaborators = () => {
    if (!managingApp) return;
    setLoadingCollaborators(true);
    fetch(`/api/developer/apps/${managingApp.id}/collaborators`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCollaborators(data.collaborators);
        }
      })
      .catch(err => console.error('Error fetching collaborators:', err))
      .finally(() => setLoadingCollaborators(false));
  };

  const handleAddCollaborator = async (e: FormEvent) => {
    e.preventDefault();
    if (!managingApp || !newCollabEmail) return;
    try {
      const res = await fetch(`/api/developer/apps/${managingApp.id}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newCollabEmail.trim(), permission: newCollabPermission })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToastMsg(`Collaborator ${newCollabEmail} added successfully!`, 'success');
        setNewCollabEmail('');
        fetchCollaborators();
      } else {
        showToastMsg(data.error || 'Failed to add collaborator.', 'error');
      }
    } catch {
      showToastMsg('Network connection error.', 'error');
    }
  };

  const handleUpdateCollaborator = async (email: string, permission: string) => {
    if (!managingApp) return;
    try {
      const res = await fetch(`/api/developer/apps/${managingApp.id}/collaborators/${encodeURIComponent(email)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permission })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToastMsg(`Collaborator permission updated.`, 'success');
        fetchCollaborators();
      } else {
        showToastMsg(data.error || 'Failed to update collaborator.', 'error');
      }
    } catch {
      showToastMsg('Network connection error.', 'error');
    }
  };

  const handleDeleteCollaborator = async (email: string) => {
    if (!managingApp) return;
    if (!confirm(`Are you sure you want to remove collaborator ${email}?`)) return;
    try {
      const res = await fetch(`/api/developer/apps/${managingApp.id}/collaborators/${encodeURIComponent(email)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToastMsg(`Collaborator removed.`, 'success');
        fetchCollaborators();
      } else {
        showToastMsg(data.error || 'Failed to remove collaborator.', 'error');
      }
    } catch {
      showToastMsg('Network connection error.', 'error');
    }
  };

  // IAM API functions
  const fetchIamUsers = () => {
    if (user.role !== 'admin') return;
    setLoadingIam(true);
    fetch('/api/admin/users')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setIamUsers(data.users);
        }
      })
      .catch(err => console.error('Error fetching IAM users:', err))
      .finally(() => setLoadingIam(false));
  };

  const handleUpdateUserRole = async (email: string, role: string | null) => {
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(email)}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToastMsg(`Role updated for ${email}`, 'success');
        fetchIamUsers();
        if (email === user.email && onProfileUpdated) {
          onProfileUpdated();
        }
      } else {
        showToastMsg(data.error || 'Failed to update user role.', 'error');
      }
    } catch {
      showToastMsg('Network connection error.', 'error');
    }
  };

  const handlePreAuthorize = async (e: FormEvent) => {
    e.preventDefault();
    if (!preAuthEmail) return;
    try {
      const res = await fetch('/api/admin/users/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: preAuthEmail, role: preAuthRole })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToastMsg(`Pre-authorized ${preAuthEmail} successfully.`, 'success');
        setPreAuthEmail('');
        fetchIamUsers();
      } else {
        showToastMsg(data.error || 'Failed to pre-authorize user.', 'error');
      }
    } catch {
      showToastMsg('Network connection error.', 'error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(text);
    showToastMsg('App Token copied to clipboard.', 'success');
    setTimeout(() => setCopiedToken(null), 3000);
  };

  const toggleTokenVisibility = (id: string) => {
    setVisibleTokens(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const resetAppForm = () => {
    setFormId('');
    setFormTitle('');
    setFormDev('');
    setFormPub('');
    setFormRelease('');
    setFormDesc('');
    setFormFullDesc('');
    setFormTags('');
    setFormFeatures('');
    setFormOs('');
    setFormCpu('');
    setFormMemory('');
    setFormGraphics('');
    setFormStorage('');
    setFormProdUrl('');
    setFormDevUrl('');
    setFormGithubUrl('');
    setFormDownloadUrl('');
    setFormCoverImage('');
    setFormIcon('');
    setFormIsOnline(true);
    setFormIsMultiplayer(true);
    setFormWebsite('');
    setFormIsWebGame(true);
    setFormBuildWindowsUrl('');
    setFormBuildWindowsStatus('inactive');
    setFormBuildWindowsError('');
    setFormBuildLinuxUrl('');
    setFormBuildLinuxStatus('inactive');
    setFormBuildLinuxError('');
    setFormBuildMacosUrl('');
    setFormBuildMacosStatus('inactive');
    setFormBuildMacosError('');
    setFormBuildAndroidUrl('');
    setFormBuildAndroidStatus('inactive');
    setFormBuildAndroidError('');
    setFormBuildIosUrl('');
    setFormBuildIosStatus('inactive');
    setFormBuildIosError('');
  };

  const loadAppFormForEdit = (game: Game) => {
    setEditingApp(game);
    setFormId(game.id);
    setFormTitle(game.title);
    setFormDev(game.developer || '');
    setFormPub(game.publisher || '');
    setFormRelease(game.release_date || '');
    setFormDesc(game.description || '');
    setFormFullDesc(game.full_description || '');
    setFormTags(game.tags ? game.tags.join(', ') : '');
    setFormFeatures(game.features ? game.features.join(', ') : '');
    setFormOs(game.systemRequirements?.os || '');
    setFormCpu(game.systemRequirements?.cpu || '');
    setFormMemory(game.systemRequirements?.memory || '');
    setFormGraphics(game.systemRequirements?.graphics || '');
    setFormStorage(game.systemRequirements?.storage || '');
    setFormProdUrl(game.prod_url || '');
    setFormDevUrl(game.dev_url || '');
    setFormGithubUrl(game.github_url || '');
    setFormDownloadUrl(game.download_url || '');
    setFormCoverImage(game.cover_image || '');
    setFormIcon(game.icon || '');
    setFormIsOnline(game.isOnline);
    setFormIsMultiplayer(game.isMultiplayer);
    setFormWebsite(game.website || '');
    const isWeb = !!(game.prod_url && game.prod_url.trim() !== '');
    setFormIsWebGame(isWeb);

    const bWindows = game.build_urls?.windows || { url: '', status: 'inactive', error_message: '' };
    setFormBuildWindowsUrl(bWindows.url || '');
    setFormBuildWindowsStatus(bWindows.status || 'inactive');
    setFormBuildWindowsError(bWindows.error_message || '');

    const bLinux = game.build_urls?.linux || { url: '', status: 'inactive', error_message: '' };
    setFormBuildLinuxUrl(bLinux.url || '');
    setFormBuildLinuxStatus(bLinux.status || 'inactive');
    setFormBuildLinuxError(bLinux.error_message || '');

    const bMacos = game.build_urls?.macos || { url: '', status: 'inactive', error_message: '' };
    setFormBuildMacosUrl(bMacos.url || '');
    setFormBuildMacosStatus(bMacos.status || 'inactive');
    setFormBuildMacosError(bMacos.error_message || '');

    const bAndroid = game.build_urls?.android || { url: '', status: 'inactive', error_message: '' };
    setFormBuildAndroidUrl(bAndroid.url || '');
    setFormBuildAndroidStatus(bAndroid.status || 'inactive');
    setFormBuildAndroidError(bAndroid.error_message || '');

    const bIos = game.build_urls?.ios || { url: '', status: 'inactive', error_message: '' };
    setFormBuildIosUrl(bIos.url || '');
    setFormBuildIosStatus(bIos.status || 'inactive');
    setFormBuildIosError(bIos.error_message || '');

    setIsAddingApp(false);
  };

  const handleRegisterApp = async (e: FormEvent) => {
    e.preventDefault();
    const tags = formTags.split(',').map(t => t.trim()).filter(Boolean);
    const features = formFeatures.split(',').map(f => f.trim()).filter(Boolean);
    const systemRequirements = {
      os: formOs,
      cpu: formCpu,
      memory: formMemory,
      graphics: formGraphics,
      storage: formStorage
    };

    const prodUrl = formIsWebGame ? formProdUrl.trim() : '';
    const devUrl = formIsWebGame ? formDevUrl.trim() : '';
    const website = formWebsite.trim();
    const buildUrls = {
      windows: { url: formBuildWindowsUrl.trim(), status: formBuildWindowsStatus, error_message: formBuildWindowsError.trim() },
      linux: { url: formBuildLinuxUrl.trim(), status: formBuildLinuxStatus, error_message: formBuildLinuxError.trim() },
      macos: { url: formBuildMacosUrl.trim(), status: formBuildMacosStatus, error_message: formBuildMacosError.trim() },
      android: { url: formBuildAndroidUrl.trim(), status: formBuildAndroidStatus, error_message: formBuildAndroidError.trim() },
      ios: { url: formBuildIosUrl.trim(), status: formBuildIosStatus, error_message: formBuildIosError.trim() }
    };

    try {
      const res = await fetch('/api/developer/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: formId.trim().toLowerCase(),
          title: formTitle,
          developer: formDev,
          publisher: formPub,
          releaseDate: formRelease,
          description: formDesc,
          fullDescription: formFullDesc,
          tags,
          features,
          systemRequirements,
          prodUrl,
          devUrl,
          githubUrl: formGithubUrl,
          downloadUrl: formDownloadUrl,
          coverImage: formCoverImage,
          icon: formIcon,
          isOnline: formIsOnline,
          isMultiplayer: formIsMultiplayer,
          website,
          buildUrls
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToastMsg('Game successfully registered!', 'success');
        setIsAddingApp(false);
        resetAppForm();
        fetchDevAppsList();
        onRefreshStorefront();
      } else {
        showToastMsg(data.error || 'Failed to register game.', 'error');
      }
    } catch {
      showToastMsg('Network connection error.', 'error');
    }
  };

  const handleUpdateApp = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingApp) return;

    const tags = formTags.split(',').map(t => t.trim()).filter(Boolean);
    const features = formFeatures.split(',').map(f => f.trim()).filter(Boolean);
    const systemRequirements = {
      os: formOs,
      cpu: formCpu,
      memory: formMemory,
      graphics: formGraphics,
      storage: formStorage
    };

    const prodUrl = formIsWebGame ? formProdUrl.trim() : '';
    const devUrl = formIsWebGame ? formDevUrl.trim() : '';
    const website = formWebsite.trim();
    const buildUrls = {
      windows: { url: formBuildWindowsUrl.trim(), status: formBuildWindowsStatus, error_message: formBuildWindowsError.trim() },
      linux: { url: formBuildLinuxUrl.trim(), status: formBuildLinuxStatus, error_message: formBuildLinuxError.trim() },
      macos: { url: formBuildMacosUrl.trim(), status: formBuildMacosStatus, error_message: formBuildMacosError.trim() },
      android: { url: formBuildAndroidUrl.trim(), status: formBuildAndroidStatus, error_message: formBuildAndroidError.trim() },
      ios: { url: formBuildIosUrl.trim(), status: formBuildIosStatus, error_message: formBuildIosError.trim() }
    };

    try {
      const res = await fetch(`/api/developer/apps/${editingApp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          developer: formDev,
          publisher: formPub,
          releaseDate: formRelease,
          description: formDesc,
          fullDescription: formFullDesc,
          tags,
          features,
          systemRequirements,
          prodUrl,
          devUrl,
          githubUrl: formGithubUrl,
          downloadUrl: formDownloadUrl,
          coverImage: formCoverImage,
          icon: formIcon,
          isOnline: formIsOnline,
          isMultiplayer: formIsMultiplayer,
          website,
          buildUrls
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToastMsg('Game metadata updated successfully.', 'success');
        setEditingApp(null);
        resetAppForm();
        fetchDevAppsList();
        onRefreshStorefront();
      } else {
        showToastMsg(data.error || 'Failed to update app details.', 'error');
      }
    } catch {
      showToastMsg('Network connection error.', 'error');
    }
  };

  const handleAddAchievement = async (e: FormEvent) => {
    e.preventDefault();
    if (!managingApp) return;

    try {
      const res = await fetch(`/api/developer/apps/${managingApp.id}/achievements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: achId.trim().toLowerCase(),
          title: achTitle,
          description: achDesc,
          icon: achIcon,
          xpValue: Number(achXpValue)
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToastMsg('Achievement added successfully!', 'success');
        setAchId('');
        setAchTitle('');
        setAchDesc('');
        setAchIcon('🏆');
        setAchXpValue(100);

        // Refresh achievement lists
        const appRes = await fetch(`/api/apps/${managingApp.id}/achievements`);
        const appData = await appRes.json();
        if (appData.success) {
          setAchievements(appData.achievements);
        }
      } else {
        showToastMsg(data.error || 'Failed to create achievement.', 'error');
      }
    } catch {
      showToastMsg('Network connection error.', 'error');
    }
  };

  // --- ACCESS REQUEST SCREEN (UNAUTHORIZED / PENDING) ---
  if (user.role !== 'admin' && user.role !== 'developer') {
    const isPending = user.role === 'pending';

    const handleRequestAccess = async () => {
      try {
        const res = await fetch('/api/developer/request-access', { method: 'POST' });
        const data = await res.json();
        if (res.ok && data.success) {
          showToastMsg('Developer access request submitted successfully!', 'success');
          if (onProfileUpdated) onProfileUpdated();
        } else {
          showToastMsg(data.error || 'Failed to request access.', 'error');
        }
      } catch {
        showToastMsg('Network connection error.', 'error');
      }
    };

    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', padding: '20px' }}>
        <div className="glass-panel" style={{ maxWidth: '600px', width: '100%', padding: '40px', textAlign: 'center', background: 'rgba(10, 10, 20, 0.65)' }}>
          <Shield size={48} style={{ color: 'var(--cyan)', marginBottom: '20px' }} />
          <h2 style={{ fontSize: '2rem', fontWeight: 800, background: 'linear-gradient(135deg, var(--cyan), var(--purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '16px', fontFamily: 'var(--font-sans)' }}>
            Developer Portal
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '32px' }}>
            {isPending
              ? "Your developer access request has been submitted and is currently pending review by an administrator. You will gain access to the Developer Command Center once approved."
              : "Register and manage applications, construct achievements, and integrate SSO telemetry for your games. Access to the Developer Command Center is restricted to authorized creators."}
          </p>

          {isPending ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: '3px solid rgba(255,255,255,0.05)',
                borderTopColor: 'var(--cyan)',
                animation: 'spin 1s linear infinite'
              }} />
              <span style={{ fontSize: '0.85rem', color: 'var(--cyan)', fontWeight: 700, letterSpacing: '1px' }}>REQUEST PENDING REVIEW</span>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={handleRequestAccess} style={{ padding: '12px 32px', fontSize: '1rem', fontWeight: 600 }}>
              Request Developer Access
            </button>
          )}
        </div>
      </div>
    );
  }

  // --- AUTHORIZED DEVELOPER / ADMIN PORTAL VIEW ---
  return (
    <div style={{ marginTop: '20px' }}>
      {/* Top Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 className="section-title" style={{ marginBottom: 0 }}>
          <Key size={24} style={{ color: 'var(--cyan)' }} />
          Developer Command Center
        </h2>

        {!isAddingApp && !editingApp && !managingApp && portalTab === 'apps' && (
          <button className="btn btn-primary btn-sm" onClick={() => { resetAppForm(); setIsAddingApp(true); }}>
            <Plus size={16} /> Register New Game
          </button>
        )}
      </div>

      {/* Global Tabs for Admin role */}
      {user.role === 'admin' && !isAddingApp && !editingApp && !managingApp && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
          <button 
            className={`btn ${portalTab === 'apps' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setPortalTab('apps')}
            style={{ borderRadius: '18px', padding: '6px 16px' }}
          >
            Applications Console
          </button>
          <button 
            className={`btn ${portalTab === 'iam' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setPortalTab('iam')}
            style={{ borderRadius: '18px', padding: '6px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Shield size={14} /> Global Access Management (IAM)
          </button>
        </div>
      )}

      {portalTab === 'iam' ? (
        /* GLOBAL IAM ADMIN MANAGEMENT VIEW */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Pre-Authorize User Form */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus size={18} style={{ color: 'var(--cyan)' }} />
              Pre-Authorize Creator Account
            </h3>
            <form onSubmit={handlePreAuthorize} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
              <div style={{ flex: 2, minWidth: '240px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  User Email Address
                </label>
                <input 
                  type="email" 
                  placeholder="developer@example.com" 
                  value={preAuthEmail}
                  onChange={(e) => setPreAuthEmail(e.target.value)}
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
              <div style={{ flex: 1, minWidth: '160px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Assign Initial Global Role
                </label>
                <select 
                  value={preAuthRole}
                  onChange={(e: any) => setPreAuthRole(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#fff',
                    outline: 'none'
                  }}
                >
                  <option value="developer">Developer</option>
                  <option value="admin">Global Admin</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px', height: '42px' }}>
                Authorize Access
              </button>
            </form>
          </div>

          {/* Active Users Directory & Pending Requests */}
          <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} style={{ color: 'var(--purple)' }} />
              Creator Directory & Access Requests
            </h3>

            {loadingIam ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading directory details...</div>
            ) : iamUsers.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px' }}>User Details</th>
                    <th style={{ padding: '12px' }}>Email</th>
                    <th style={{ padding: '12px' }}>Current Role</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {iamUsers.map((u) => {
                    const isSelf = u.email === user.email;
                    const isPending = u.role === 'pending';
                    return (
                      <tr key={u.email} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="avatar" style={{ width: '28px', height: '28px', fontSize: '0.8rem' }}>
                            {u.avatar_url && u.avatar_url.length === 1 ? u.avatar_url : (u.display_name ? u.display_name[0].toUpperCase() : 'U')}
                          </div>
                          <div>
                            <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>{u.display_name}</div>
                          </div>
                        </td>
                        <td style={{ padding: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {u.email}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: u.role === 'admin' 
                              ? 'rgba(168, 85, 247, 0.15)' 
                              : u.role === 'developer' 
                                ? 'rgba(6, 182, 212, 0.15)' 
                                : u.role === 'pending' 
                                  ? 'rgba(234, 179, 8, 0.15)' 
                                  : 'rgba(255,255,255,0.05)',
                            color: u.role === 'admin' 
                              ? 'var(--purple)' 
                              : u.role === 'developer' 
                                ? 'var(--cyan)' 
                                : u.role === 'pending' 
                                  ? 'var(--orange)' 
                                  : 'var(--text-muted)',
                            border: '1px solid currentColor'
                          }}>
                            {u.role ? u.role.toUpperCase() : 'NO ROLE'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          {isSelf ? (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Your Account (Self)</span>
                          ) : isPending ? (
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button className="btn btn-primary btn-sm" onClick={() => handleUpdateUserRole(u.email, 'developer')} style={{ padding: '2px 10px', fontSize: '0.75rem' }}>
                                Approve Developer
                              </button>
                              <button className="btn btn-outline-cyan btn-sm" onClick={() => handleUpdateUserRole(u.email, 'admin')} style={{ padding: '2px 10px', fontSize: '0.75rem' }}>
                                Approve Admin
                              </button>
                              <button className="btn btn-secondary btn-sm" onClick={() => handleUpdateUserRole(u.email, null)} style={{ padding: '2px 10px', fontSize: '0.75rem' }}>
                                Decline
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                              <select 
                                value={u.role || ''} 
                                onChange={(e) => handleUpdateUserRole(u.email, e.target.value || null)}
                                style={{
                                  background: 'rgba(0,0,0,0.3)',
                                  border: '1px solid var(--border-glass)',
                                  borderRadius: '4px',
                                  color: '#fff',
                                  padding: '4px 8px',
                                  fontSize: '0.8rem',
                                  outline: 'none'
                                }}
                              >
                                <option value="developer">Developer</option>
                                <option value="admin">Global Admin</option>
                              </select>
                              <button className="btn btn-secondary btn-sm" onClick={() => handleUpdateUserRole(u.email, null)} style={{ padding: '4px 8px', color: '#ff4a4a' }} title="Revoke access completely">
                                Revoke Access
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No creators present in database.
              </div>
            )}
          </div>
        </div>
      ) : managingApp ? (
        /* MANAGING ACHIEVEMENTS OR COLLABORATORS VIEW */
        <div className="glass-panel" style={{ padding: '32px' }}>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => { setManagingApp(null); fetchDevAppsList(); }}
            style={{ marginBottom: '24px' }}
          >
            <ArrowLeft size={16} /> Back to Developer Portal
          </button>

          <h3 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '8px' }}>
            Manage Application: {managingApp.title}
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Configure game integrations. App Token can be used by servers to synchronize telemetry.
          </p>

          {/* Sub tabs inside Manage App view */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
            <button 
              className={`btn ${manageSubTab === 'achievements' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setManageSubTab('achievements')}
              style={{ borderRadius: '18px', padding: '4px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Award size={14} /> Achievements
            </button>
            <button 
              className={`btn ${manageSubTab === 'collaborators' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setManageSubTab('collaborators')}
              style={{ borderRadius: '18px', padding: '4px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Users size={14} /> Collaborators
            </button>
          </div>

          {manageSubTab === 'achievements' ? (
            /* Achievements Sub-tab */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>
              {/* List Achievements */}
              <div>
                <h4 style={{ color: '#fff', marginBottom: '16px' }}>Current Achievements</h4>
                {loadingAchievements ? (
                  <div style={{ color: 'var(--text-secondary)' }}>Loading achievements...</div>
                ) : achievements.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {achievements.map((ach) => (
                      <div key={ach.id} className="glass-panel" style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span style={{ fontSize: '2rem' }}>{ach.icon}</span>
                        <div style={{ flex: 1 }}>
                          <h5 style={{ color: '#fff', fontSize: '0.95rem' }}>
                            {ach.title} <span style={{ color: 'var(--cyan)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>({ach.id})</span>
                          </h5>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>{ach.description}</p>
                          <span style={{ fontSize: '0.7rem', color: 'var(--purple)', fontWeight: 'bold' }}>+{ach.xpValue} XP</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-secondary)' }}>No achievements defined for this game yet. Add one below.</div>
                )}
              </div>

              {/* Add Achievement Form (Allowed for Write/Admin permission) */}
              <div className="glass-panel" style={{ padding: '24px', background: 'rgba(0,0,0,0.2)' }}>
                <h4 style={{ color: '#fff', marginBottom: '16px' }}>Create Achievement</h4>
                {user.role === 'admin' || managingApp.userPermission === 'admin' || managingApp.userPermission === 'write' ? (
                  <form onSubmit={handleAddAchievement} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Unique Achievement ID (lowercase alphanumeric)
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. starswarm_speedrun" 
                        value={achId}
                        onChange={(e) => setAchId(e.target.value)}
                        style={{
                          width: '100%',
                          background: 'rgba(0,0,0,0.4)',
                          border: '1px solid var(--border-glass)',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          color: '#fff',
                          outline: 'none'
                        }}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Achievement Title
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. Sound Barrier" 
                        value={achTitle}
                        onChange={(e) => setAchTitle(e.target.value)}
                        style={{
                          width: '100%',
                          background: 'rgba(0,0,0,0.4)',
                          border: '1px solid var(--border-glass)',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          color: '#fff',
                          outline: 'none'
                        }}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Unlock Description
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. Finish the game in under 15 minutes." 
                        value={achDesc}
                        onChange={(e) => setAchDesc(e.target.value)}
                        style={{
                          width: '100%',
                          background: 'rgba(0,0,0,0.4)',
                          border: '1px solid var(--border-glass)',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          color: '#fff',
                          outline: 'none'
                        }}
                        required
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          Icon Emoji
                        </label>
                        <input 
                          type="text" 
                          placeholder="🏆" 
                          maxLength={2}
                          value={achIcon}
                          onChange={(e) => setAchIcon(e.target.value)}
                          style={{
                            width: '100%',
                            background: 'rgba(0,0,0,0.4)',
                            border: '1px solid var(--border-glass)',
                            borderRadius: '6px',
                            padding: '8px 12px',
                            color: '#fff',
                            outline: 'none',
                            textAlign: 'center'
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          XP Value Awarded
                        </label>
                        <input 
                          type="number" 
                          value={achXpValue}
                          onChange={(e) => setAchXpValue(Number(e.target.value))}
                          style={{
                            width: '100%',
                            background: 'rgba(0,0,0,0.4)',
                            border: '1px solid var(--border-glass)',
                            borderRadius: '6px',
                            padding: '8px 12px',
                            color: '#fff',
                            outline: 'none'
                          }}
                          required
                        />
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary btn-sm" style={{ marginTop: '8px' }}>
                      Create Achievement
                    </button>
                  </form>
                ) : (
                  <div style={{ color: 'var(--text-muted)', padding: '20px 0', fontStyle: 'italic', fontSize: '0.85rem' }}>
                    You have Read-Only permissions on this app and cannot add achievements.
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Collaborators Sub-tab */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>
              {/* List Collaborators */}
              <div>
                <h4 style={{ color: '#fff', marginBottom: '16px' }}>App Collaborators</h4>
                {loadingCollaborators ? (
                  <div style={{ color: 'var(--text-secondary)' }}>Loading collaborators...</div>
                ) : collaborators.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {collaborators.map((c) => {
                      const isOwnerSelf = c.email === user.email;
                      const hasAdminPrivilege = user.role === 'admin' || managingApp.userPermission === 'admin';
                      return (
                        <div key={c.email} className="glass-panel" style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                          <div style={{ flex: 1 }}>
                            <h5 style={{ color: '#fff', fontSize: '0.95rem' }}>
                              {c.email} {isOwnerSelf && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>(You)</span>}
                            </h5>
                            <span style={{
                              display: 'inline-block',
                              fontSize: '0.7rem',
                              color: c.permission === 'admin' ? 'var(--purple)' : c.permission === 'write' ? 'var(--cyan)' : 'var(--text-secondary)',
                              fontWeight: 'bold',
                              marginTop: '4px'
                            }}>
                              PERMISSION: {c.permission.toUpperCase()}
                            </span>
                          </div>
                          
                          {/* Admin management actions */}
                          {hasAdminPrivilege && !isOwnerSelf ? (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <select
                                value={c.permission}
                                onChange={(e) => handleUpdateCollaborator(c.email, e.target.value)}
                                style={{
                                  background: 'rgba(0,0,0,0.3)',
                                  border: '1px solid var(--border-glass)',
                                  borderRadius: '4px',
                                  color: '#fff',
                                  padding: '4px 6px',
                                  fontSize: '0.75rem',
                                  outline: 'none'
                                }}
                              >
                                <option value="read">Viewer (Read)</option>
                                <option value="write">Developer (Write)</option>
                                <option value="admin">Owner (Admin)</option>
                              </select>
                              <button 
                                className="btn btn-secondary btn-sm" 
                                onClick={() => handleDeleteCollaborator(c.email)}
                                style={{ padding: '4px 8px', display: 'inline-flex', alignItems: 'center', color: '#ff4a4a' }}
                                title="Remove Collaborator"
                              >
                                <Trash size={12} />
                              </button>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-secondary)' }}>No collaborators defined.</div>
                )}
              </div>

              {/* Add Collaborator Form (Only visible to app/global admins) */}
              <div className="glass-panel" style={{ padding: '24px', background: 'rgba(0,0,0,0.2)' }}>
                <h4 style={{ color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserPlus size={18} style={{ color: 'var(--cyan)' }} />
                  Invite Collaborator
                </h4>
                {user.role === 'admin' || managingApp.userPermission === 'admin' ? (
                  <form onSubmit={handleAddCollaborator} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Collaborator Email Address
                      </label>
                      <input 
                        type="email" 
                        placeholder="developer@example.com" 
                        value={newCollabEmail}
                        onChange={(e) => setNewCollabEmail(e.target.value)}
                        style={{
                          width: '100%',
                          background: 'rgba(0,0,0,0.4)',
                          border: '1px solid var(--border-glass)',
                          borderRadius: '6px',
                          padding: '10px 12px',
                          color: '#fff',
                          outline: 'none'
                        }}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        App Permission Level
                      </label>
                      <select 
                        value={newCollabPermission}
                        onChange={(e: any) => setNewCollabPermission(e.target.value)}
                        style={{
                          width: '100%',
                          background: 'rgba(0,0,0,0.4)',
                          border: '1px solid var(--border-glass)',
                          borderRadius: '6px',
                          padding: '10px 12px',
                          color: '#fff',
                          outline: 'none'
                        }}
                      >
                        <option value="read">Viewer (Read-Only access)</option>
                        <option value="write">Developer (Write/Edit details)</option>
                        <option value="admin">Owner (Full Admin permissions)</option>
                      </select>
                    </div>
                    <button type="submit" className="btn btn-primary btn-sm" style={{ marginTop: '8px' }}>
                      Grant App Access
                    </button>
                  </form>
                ) : (
                  <div style={{ color: 'var(--text-muted)', padding: '20px 0', fontStyle: 'italic', fontSize: '0.85rem' }}>
                    Only application Admins or global Administrators can add or modify collaborators.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : isAddingApp || editingApp ? (
        /* REGISTER / EDIT GAME FORM VIEW */
        <div className="glass-panel" style={{ padding: '32px' }}>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => { setIsAddingApp(false); setEditingApp(null); resetAppForm(); }}
            style={{ marginBottom: '24px' }}
          >
            <ArrowLeft size={16} /> Cancel
          </button>

          <h3 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '24px' }}>
            {editingApp ? `Edit Application Metadata: ${editingApp.title}` : 'Register New Application Listing'}
          </h3>

          <form onSubmit={editingApp ? handleUpdateApp : handleRegisterApp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Basic Info */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  App ID / Identifier (Immutable lowercase slug)
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. starswarm" 
                  value={formId}
                  onChange={(e) => setFormId(e.target.value)}
                  disabled={!!editingApp}
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#fff',
                    outline: 'none',
                    opacity: editingApp ? 0.5 : 1
                  }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Title
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Star-Swarm" 
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
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
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Developer
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. KBS Cloud Games" 
                  value={formDev}
                  onChange={(e) => setFormDev(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#fff',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Publisher
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. KBS Cloud" 
                  value={formPub}
                  onChange={(e) => setFormPub(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#fff',
                    outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Release Date
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. June 2026" 
                  value={formRelease}
                  onChange={(e) => setFormRelease(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#fff',
                    outline: 'none'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Icon Emoji
                  </label>
                  <input 
                    type="text" 
                    placeholder="🌌" 
                    maxLength={2}
                    value={formIcon}
                    onChange={(e) => setFormIcon(e.target.value)}
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
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Cover Image
                  </label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {/* Preview box */}
                    <div style={{
                      width: '64px',
                      height: '42px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-glass)',
                      background: 'rgba(0,0,0,0.4)',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {formCoverImage ? (
                        <img 
                          src={resolveImageUrl(formCoverImage)} 
                          alt="Preview" 
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                        />
                      ) : (
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>None</span>
                      )}
                    </div>
                    {/* Drag-and-drop file upload zone */}
                    <div 
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById('cover-file-input')?.click()}
                      style={{
                        flex: 1,
                        height: '42px',
                        border: isDragging ? '1.5px dashed var(--cyan)' : '1px dashed var(--border-glass)',
                        borderRadius: '6px',
                        background: isDragging ? 'rgba(0, 255, 255, 0.05)' : 'rgba(255,255,255,0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'var(--transition-smooth)',
                        padding: '4px 8px'
                      }}
                    >
                      {uploadingImage ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--cyan)' }}>Uploading...</span>
                      ) : (
                        <>
                          <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 500 }}>
                            Drag & drop or click to upload cover image
                          </span>
                        </>
                      )}
                      <input 
                        id="cover-file-input" 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                        style={{ display: 'none' }} 
                      />
                    </div>
                  </div>
                  {/* Text input for manual URL */}
                  <input 
                    type="text" 
                    placeholder="/starswarm_cover.png or upload above" 
                    value={formCoverImage}
                    onChange={(e) => setFormCoverImage(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#fff',
                      outline: 'none',
                      marginTop: '6px',
                      fontSize: '0.8rem'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Descriptions */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Short Storefront Description (displays on catalog card)
              </label>
              <input 
                type="text" 
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
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

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Full Extended Description (displays in modal detail view)
              </label>
              <textarea 
                rows={4}
                value={formFullDesc}
                onChange={(e) => setFormFullDesc(e.target.value)}
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

            {/* Tags & Features */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Store Tags (comma-separated list)
                </label>
                <input 
                  type="text" 
                  placeholder="Sci-Fi, Strategy, Space" 
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#fff',
                    outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Key Game Features (comma-separated list)
                </label>
                <input 
                  type="text" 
                  placeholder="Real-time trading, Dynamic market indices" 
                  value={formFeatures}
                  onChange={(e) => setFormFeatures(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#fff',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Game Type, Website & Links */}
            <div style={{
              background: 'rgba(255,255,255,0.01)',
              border: '1px solid var(--border-glass)',
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              marginTop: '8px'
            }}>
              <h4 style={{ color: '#fff', fontSize: '0.95rem', margin: 0, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                Game Deployment & Links
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Game Type / Platform Type
                  </label>
                  <select
                    value={formIsWebGame ? 'web' : 'native'}
                    onChange={(e) => setFormIsWebGame(e.target.value === 'web')}
                    style={{
                      width: '100%',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#fff',
                      outline: 'none'
                    }}
                  >
                    <option value="web">Web Playable (Runs inside browser frame)</option>
                    <option value="native">Native / Downloadable (Runs as native binary build)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Website URL
                  </label>
                  <input 
                    type="url" 
                    placeholder="https://mygame.com" 
                    value={formWebsite}
                    onChange={(e) => setFormWebsite(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#fff',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: formIsWebGame ? 'var(--text-muted)' : 'rgba(255,255,255,0.15)', marginBottom: '4px' }}>
                    Production URL {!formIsWebGame && '(Not applicable for Native)'}
                  </label>
                  <input 
                    type="url" 
                    placeholder="https://game.kbs-cloud.com" 
                    value={formProdUrl}
                    onChange={(e) => setFormProdUrl(e.target.value)}
                    disabled={!formIsWebGame}
                    style={{
                      width: '100%',
                      background: formIsWebGame ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.15)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: formIsWebGame ? '#fff' : 'rgba(255,255,255,0.3)',
                      outline: 'none',
                      cursor: formIsWebGame ? 'text' : 'not-allowed'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: formIsWebGame ? 'var(--text-muted)' : 'rgba(255,255,255,0.15)', marginBottom: '4px' }}>
                    Development / Local URL {!formIsWebGame && '(Not applicable for Native)'}
                  </label>
                  <input 
                    type="text" 
                    placeholder="http://localhost:3001" 
                    value={formDevUrl}
                    onChange={(e) => setFormDevUrl(e.target.value)}
                    disabled={!formIsWebGame}
                    style={{
                      width: '100%',
                      background: formIsWebGame ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.15)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: formIsWebGame ? '#fff' : 'rgba(255,255,255,0.3)',
                      outline: 'none',
                      cursor: formIsWebGame ? 'text' : 'not-allowed'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    GitHub Link
                  </label>
                  <input 
                    type="url" 
                    placeholder="https://github.com/..." 
                    value={formGithubUrl}
                    onChange={(e) => setFormGithubUrl(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#fff',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Release Page / Download Page
                  </label>
                  <input 
                    type="url" 
                    placeholder="https://..." 
                    value={formDownloadUrl}
                    onChange={(e) => setFormDownloadUrl(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#fff',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* OS Build Downloads Configuration */}
            <div style={{
              background: 'rgba(255,255,255,0.01)',
              border: '1px solid var(--border-glass)',
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <h4 style={{ color: '#fff', fontSize: '0.95rem', margin: 0, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                Operating System Build Downloads
              </h4>
              
              {[
                { id: 'windows', name: 'Windows Build', icon: <Monitor size={14} />, url: formBuildWindowsUrl, setUrl: setFormBuildWindowsUrl, status: formBuildWindowsStatus, setStatus: setFormBuildWindowsStatus, err: formBuildWindowsError, setErr: setFormBuildWindowsError },
                { id: 'linux', name: 'Linux Build', icon: <Terminal size={14} />, url: formBuildLinuxUrl, setUrl: setFormBuildLinuxUrl, status: formBuildLinuxStatus, setStatus: setFormBuildLinuxStatus, err: formBuildLinuxError, setErr: setFormBuildLinuxError },
                { id: 'macos', name: 'macOS Build', icon: <Laptop size={14} />, url: formBuildMacosUrl, setUrl: setFormBuildMacosUrl, status: formBuildMacosStatus, setStatus: setFormBuildMacosStatus, err: formBuildMacosError, setErr: setFormBuildMacosError },
                { id: 'android', name: 'Android Build', icon: <Smartphone size={14} />, url: formBuildAndroidUrl, setUrl: setFormBuildAndroidUrl, status: formBuildAndroidStatus, setStatus: setFormBuildAndroidStatus, err: formBuildAndroidError, setErr: setFormBuildAndroidError },
                { id: 'ios', name: 'iOS Build', icon: <Smartphone size={14} />, url: formBuildIosUrl, setUrl: setFormBuildIosUrl, status: formBuildIosStatus, setStatus: setFormBuildIosStatus, err: formBuildIosError, setErr: setFormBuildIosError },
              ].map(plat => (
                <div key={plat.id} style={{
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.03)',
                  borderRadius: '6px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#fff', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--cyan)' }}>{plat.icon}</span>
                      {plat.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status:</span>
                      <select
                        value={plat.status}
                        onChange={(e) => plat.setStatus(e.target.value)}
                        style={{
                          background: 'rgba(0,0,0,0.5)',
                          border: '1px solid var(--border-glass)',
                          borderRadius: '4px',
                          color: '#fff',
                          padding: '4px 8px',
                          fontSize: '0.75rem',
                          outline: 'none'
                        }}
                      >
                        <option value="inactive">Inactive / None</option>
                        <option value="active">Active / Available</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="deprecated">Deprecated</option>
                        <option value="unsupported">Unsupported</option>
                      </select>
                    </div>
                  </div>

                  {plat.status === 'active' && (
                    <div>
                      <input 
                        type="text" 
                        placeholder="Download URL (e.g. /downloads/game-win.zip or https://...)" 
                        value={plat.url}
                        onChange={(e) => plat.setUrl(e.target.value)}
                        style={{
                          width: '100%',
                          background: 'rgba(0,0,0,0.4)',
                          border: '1px solid var(--border-glass)',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          color: '#fff',
                          outline: 'none',
                          fontSize: '0.8rem'
                        }}
                      />
                    </div>
                  )}

                  {plat.status !== 'active' && plat.status !== 'inactive' && (
                    <div>
                      <input 
                        type="text" 
                        placeholder="Custom warning/error message displayed to users (optional)" 
                        value={plat.err}
                        onChange={(e) => plat.setErr(e.target.value)}
                        style={{
                          width: '100%',
                          background: 'rgba(0,0,0,0.4)',
                          border: '1px solid var(--border-glass)',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          color: '#fff',
                          outline: 'none',
                          fontSize: '0.8rem'
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* System Requirements */}
            <div>
              <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '10px' }}>System Requirements</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                <div>
                  <input type="text" placeholder="OS: Windows 10/11, Ubuntu 22.04" value={formOs} onChange={(e) => setFormOs(e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-glass)', borderRadius: '6px', padding: '8px 12px', color: '#fff', outline: 'none' }} />
                </div>
                <div>
                  <input type="text" placeholder="Processor: Dual-core 2.0 GHz" value={formCpu} onChange={(e) => setFormCpu(e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-glass)', borderRadius: '6px', padding: '8px 12px', color: '#fff', outline: 'none' }} />
                </div>
                <div>
                  <input type="text" placeholder="Memory: 2 GB RAM" value={formMemory} onChange={(e) => setFormMemory(e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-glass)', borderRadius: '6px', padding: '8px 12px', color: '#fff', outline: 'none' }} />
                </div>
                <div>
                  <input type="text" placeholder="Graphics: WebGL compliant GPU" value={formGraphics} onChange={(e) => setFormGraphics(e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-glass)', borderRadius: '6px', padding: '8px 12px', color: '#fff', outline: 'none' }} />
                </div>
                <div>
                  <input type="text" placeholder="Storage: 200 MB available space" value={formStorage} onChange={(e) => setFormStorage(e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-glass)', borderRadius: '6px', padding: '8px 12px', color: '#fff', outline: 'none' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={formIsOnline} onChange={(e) => setFormIsOnline(e.target.checked)} />
                <span>Has Online Servers</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={formIsMultiplayer} onChange={(e) => setFormIsMultiplayer(e.target.checked)} />
                <span>Has Multiplayer Support</span>
              </label>
            </div>

            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '12px' }}>
              {editingApp ? 'Update Game Listing' : 'Register Game'}
            </button>
          </form>
        </div>
      ) : (
        /* APPLICATIONS LIST VIEW */
        <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px' }}>Game</th>
                <th style={{ padding: '12px' }}>ID / Code</th>
                <th style={{ padding: '12px' }}>Development Address</th>
                <th style={{ padding: '12px' }}>Secret App Token</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {devApps.length > 0 ? (
                devApps.map((app: any) => {
                  const isReadOnly = app.userPermission === 'read';
                  return (
                    <tr key={app.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '16px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.5rem' }}>{app.icon}</span>
                        <div>
                          <div style={{ color: '#fff', fontWeight: 600 }}>{app.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {app.developer}
                            <span style={{
                              marginLeft: '8px',
                              fontSize: '0.65rem',
                              color: app.userPermission === 'admin' ? 'var(--purple)' : app.userPermission === 'write' ? 'var(--cyan)' : 'var(--text-muted)',
                              fontWeight: 'bold',
                              border: '1px solid currentColor',
                              borderRadius: '4px',
                              padding: '1px 4px'
                            }}>
                              {app.userPermission?.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                        {app.id}
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {app.dev_url}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {app.app_token ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <code style={{
                              background: 'rgba(0,0,0,0.5)',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.8rem',
                              color: visibleTokens[app.id] ? 'var(--cyan)' : 'var(--text-muted)'
                            }}>
                              {visibleTokens[app.id] ? app.app_token : '••••••••••••••••••••••••••••••••'}
                            </code>
                            <button 
                              className="btn btn-secondary btn-sm" 
                              onClick={() => toggleTokenVisibility(app.id)}
                              style={{ padding: '4px 8px' }}
                            >
                              {visibleTokens[app.id] ? 'Hide' : 'Show'}
                            </button>
                            <button 
                              className="btn btn-secondary btn-sm" 
                              onClick={() => copyToClipboard(app.app_token || '')}
                              style={{ padding: '4px 8px' }}
                              disabled={!app.app_token}
                            >
                              {copiedToken === app.app_token ? <Check size={12} style={{ color: 'var(--green)' }} /> : <Copy size={12} />}
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Unavailable</span>
                        )}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn btn-secondary btn-sm" 
                            onClick={() => loadAppFormForEdit(app)}
                            disabled={isReadOnly}
                            style={{ opacity: isReadOnly ? 0.5 : 1 }}
                            title={isReadOnly ? "You do not have write access on this app" : "Edit details"}
                          >
                            Edit
                          </button>
                          <button className="btn btn-outline-cyan btn-sm" onClick={() => { setManagingApp(app); setManageSubTab('achievements'); }}>
                            Manage
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No applications registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
