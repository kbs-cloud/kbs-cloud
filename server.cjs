const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const http = require('http');
const { initDatabase, dbRun, dbGet, dbAll } = require('./db.cjs');

// Helper function to promote the single user to global Admin
async function ensureSingleUserIsAdmin() {
  try {
    const users = await dbAll('SELECT email FROM user_profiles');
    if (users.length === 1) {
      const email = users[0].email;
      const roleRow = await dbGet('SELECT role FROM user_roles WHERE email = ?', [email]);
      if (!roleRow || roleRow.role !== 'admin') {
        const now = new Date().toISOString();
        await dbRun('INSERT OR REPLACE INTO user_roles (email, role, created_at, updated_at) VALUES (?, ?, ?, ?)', [email, 'admin', now, now]);
        console.log(`[Startup/IAM] Promoted single existing user (${email}) to Admin.`);
      }
    }
  } catch (err) {
    console.error('Error in ensureSingleUserIsAdmin:', err.message);
  }
}

// Initialize database schema and seeds
initDatabase().then(() => {
  ensureSingleUserIsAdmin();
});

// Load environment variables from .env if running locally
try {
  const fs = require('fs');
  const envPath = path.resolve(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    process.loadEnvFile(envPath);
  }
} catch (e) {
  console.warn('Could not load .env file via loadEnvFile:', e.message);
}

const app = express();
app.set('trust proxy', 1);

const PORT = process.env.BACKEND_PORT || process.env.PORT || 29000;
const AUTH_SERVER_URL = process.env.AUTH_SERVER_URL || 'http://localhost:29001';

// In-memory sessions store (Key: sessionId, Value: user info)
const sessions = new Map();

// Periodic cleanup of sessions older than 2 hours
setInterval(() => {
  const now = Date.now();
  for (const [sid, data] of sessions.entries()) {
    if (now - data.createdAt > 2 * 60 * 60 * 1000) {
      sessions.delete(sid);
    }
  }
}, 10 * 60 * 1000); // Clean up every 10 minutes

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// CORS configuration (allow local dev origins)
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    const allowed = [
      'http://localhost:19000', 'http://127.0.0.1:19000',
      'http://localhost:19001', 'http://127.0.0.1:19001',
      'http://localhost:19002', 'http://127.0.0.1:19002',
      'http://localhost:19003', 'http://127.0.0.1:19003',
      'https://kbs-cloud.com', 'http://kbs-cloud.com',
      'https://auth.kbs-cloud.com', 'http://auth.kbs-cloud.com',
      'https://star-swarm.kbs-cloud.com', 'http://star-swarm.kbs-cloud.com',
      'https://tickerclash.kbs-cloud.com', 'http://tickerclash.kbs-cloud.com'
    ];
    if (allowed.indexOf(origin) !== -1 || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      return callback(null, true);
    }
    callback(null, true);
  },
  credentials: true
}));

// 1. SSO Auth Callback handler
app.get('/api/auth/callback', async (req, res) => {
  const { code } = req.query;
  const isIframe = req.query.source === 'iframe';

  if (!code) {
    return res.status(400).send('Missing authorization code.');
  }

  try {
    // Exchange authorization code for a token with the central kbs-auth server
    // Note: Since this runs server-side, it will fetch from the central auth server
    const tokenRes = await fetch(`${AUTH_SERVER_URL}/api/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, client_id: 'kbs-cloud' })
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.success) {
      throw new Error(tokenData.error || 'Failed to exchange authorization token.');
    }

    const { email, displayName, isGoogleLinked } = tokenData.user;
    
    // Ensure user profile exists in database
    const profileExists = await dbGet('SELECT email FROM user_profiles WHERE email = ?', [email]);
    if (!profileExists) {
      const now = new Date().toISOString();
      const defaultAvatar = displayName ? displayName[0].toUpperCase() : email[0].toUpperCase();
      await dbRun(
        'INSERT INTO user_profiles (email, display_name, avatar_url, bio, level, xp, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [email, displayName || email.split('@')[0], defaultAvatar, 'Ready to play!', 1, 0, now, now]
      );
    }

    // Ensure single existing profile is admin
    await ensureSingleUserIsAdmin();

    // Create local session ID
    const sessionId = crypto.randomBytes(32).toString('hex');
    sessions.set(sessionId, {
      email,
      displayName: displayName || email.split('@')[0],
      isGoogleLinked,
      createdAt: Date.now()
    });

    // Set HttpOnly session cookie
    res.cookie('hub_session_id', sessionId, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
      maxAge: 2 * 60 * 60 * 1000 // 2 hours
    });

    if (isIframe) {
      return res.send(`
        <!DOCTYPE html>
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'SSO_LOGIN_SUCCESS' }, '*');
              } else {
                window.parent.postMessage({ type: 'SSO_LOGIN_SUCCESS' }, window.location.origin);
              }
            </script>
          </body>
        </html>
      `);
    }

    // Redirect user back to frontend home page
    res.redirect('/');
  } catch (error) {
    console.error('SSO token exchange failed:', error);
    if (isIframe) {
      return res.status(500).send('SSO exchange failed.');
    }
    res.redirect('/?error=sso_failed');
  }
});

// 2. Get current session details
app.get('/api/auth/me', async (req, res) => {
  const sessionId = req.cookies['hub_session_id'];
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({ error: 'Unauthorized. No active hub session.' });
  }

  const session = sessions.get(sessionId);
  try {
    const profile = await dbGet('SELECT * FROM user_profiles WHERE email = ?', [session.email]);
    const roleRow = await dbGet('SELECT role FROM user_roles WHERE email = ?', [session.email]);
    res.status(200).json({
      success: true,
      user: {
        email: session.email,
        displayName: profile ? profile.display_name : session.displayName,
        avatarUrl: profile ? profile.avatar_url : (session.displayName ? session.displayName[0].toUpperCase() : 'U'),
        bio: profile ? profile.bio : '',
        level: profile ? profile.level : 1,
        xp: profile ? profile.xp : 0,
        isGoogleLinked: session.isGoogleLinked,
        role: roleRow ? roleRow.role : null
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Database error fetching profile.' });
  }
});

// Mock login endpoint for testing
app.post('/api/auth/mock-login', async (req, res) => {
  const { email, displayName, role } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const now = new Date().toISOString();
    const defaultAvatar = displayName ? displayName[0].toUpperCase() : email[0].toUpperCase();

    // Ensure user profile exists in database
    const profileExists = await dbGet('SELECT email FROM user_profiles WHERE email = ?', [email]);
    if (!profileExists) {
      await dbRun(
        'INSERT INTO user_profiles (email, display_name, avatar_url, bio, level, xp, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [email, displayName || email.split('@')[0], defaultAvatar, 'Ready to play!', 1, 0, now, now]
      );
    }

    // Set role
    if (role) {
      await dbRun('INSERT OR REPLACE INTO user_roles (email, role, created_at, updated_at) VALUES (?, ?, ?, ?)', [
        email, role, now, now
      ]);
    }

    // Create session
    const sessionId = crypto.randomBytes(32).toString('hex');
    sessions.set(sessionId, {
      email,
      displayName: displayName || email.split('@')[0],
      isGoogleLinked: false,
      createdAt: Date.now()
    });

    res.cookie('hub_session_id', sessionId, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: false,
      maxAge: 2 * 60 * 60 * 1000
    });

    res.json({ success: true, user: { email, displayName, role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  const sessionId = req.cookies['hub_session_id'];
  if (sessionId) {
    sessions.delete(sessionId);
  }
  res.clearCookie('hub_session_id', {
    path: '/',
    sameSite: 'lax',
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
  });
  res.status(200).json({ success: true, message: 'Logged out from hub successfully.' });
});

// Helper to verify JWT signature using pure Node crypto module (offline verification)
function verifyJWT(token, publicKeyPem) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const data = headerB64 + '.' + payloadB64;
    const signature = Buffer.from(signatureB64, 'base64url');

    const verify = crypto.createVerify('SHA256');
    verify.update(data);
    const isValid = verify.verify(publicKeyPem, signature);

    if (!isValid) return null;

    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8');
    return JSON.parse(payloadJson);
  } catch (e) {
    return null;
  }
}

// 3.1 Back-channel logout endpoint for SLO (Asymmetric JWT verification)
app.post('/api/auth/backchannel-logout', async (req, res) => {
  const { logout_token } = req.body;
  if (!logout_token) {
    return res.status(400).json({ error: 'Missing logout_token.' });
  }

  try {
    // 1. Fetch public key from auth server
    const certsRes = await fetch(`${AUTH_SERVER_URL}/api/auth/certs`);
    if (!certsRes.ok) {
      throw new Error(`Failed to fetch certs from auth server: ${certsRes.status}`);
    }
    const { keys } = await certsRes.json();
    const activeKey = keys?.find(k => k.kid === 'sso-key-1');
    if (!activeKey || !activeKey.pem) {
      throw new Error('Active public key not found in auth certs.');
    }

    // 2. Verify JWT signature
    const payload = verifyJWT(logout_token, activeKey.pem);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid logout token signature.' });
    }

    // 3. Validate claims
    const now = Math.floor(Date.now() / 1000);
    if (payload.iss !== 'kbs-auth') {
      return res.status(401).json({ error: 'Invalid issuer.' });
    }
    if (payload.aud !== 'kbs-cloud') {
      return res.status(401).json({ error: 'Invalid audience.' });
    }
    if (payload.exp < now) {
      return res.status(401).json({ error: 'Logout token expired.' });
    }

    const email = payload.sub;
    if (!email) {
      return res.status(400).json({ error: 'Missing subject (email).' });
    }

    // 4. Invalidate sessions
    let deletedCount = 0;
    for (const [sid, data] of sessions.entries()) {
      if (data.email === email) {
        sessions.delete(sid);
        deletedCount++;
      }
    }

    console.log(`[Back-Channel Logout] Cleared ${deletedCount} local hub sessions for ${email}`);
    res.status(200).json({ success: true, message: 'Sessions cleared successfully.' });
  } catch (error) {
    console.error('[Back-Channel Logout] Verification failed:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// --- HUB STOREFRONT & APP CATALOG ENDPOINTS ---

app.get('/api/apps', async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM apps ORDER BY title ASC');
    const parsed = rows.map(r => ({
      ...r,
      tags: r.tags ? JSON.parse(r.tags) : [],
      features: r.features ? JSON.parse(r.features) : [],
      systemRequirements: r.system_requirements ? JSON.parse(r.system_requirements) : {},
      isOnline: !!r.is_online,
      isMultiplayer: !!r.is_multiplayer,
      website: r.website || '',
      build_urls: r.build_urls ? JSON.parse(r.build_urls) : {}
    }));
    res.json({ success: true, apps: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/apps/:id', async (req, res) => {
  try {
    const r = await dbGet('SELECT * FROM apps WHERE id = ?', [req.params.id]);
    if (!r) return res.status(404).json({ error: 'App not found' });
    const parsed = {
      ...r,
      tags: r.tags ? JSON.parse(r.tags) : [],
      features: r.features ? JSON.parse(r.features) : [],
      systemRequirements: r.system_requirements ? JSON.parse(r.system_requirements) : {},
      isOnline: !!r.is_online,
      isMultiplayer: !!r.is_multiplayer,
      website: r.website || '',
      build_urls: r.build_urls ? JSON.parse(r.build_urls) : {}
    };
    res.json({ success: true, app: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PROFILE & USER ACHIEVEMENTS ENDPOINTS ---

app.put('/api/profile', async (req, res) => {
  const sessionId = req.cookies['hub_session_id'];
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const session = sessions.get(sessionId);
  const { displayName, avatarUrl, bio } = req.body;
  if (!displayName || !displayName.trim()) {
    return res.status(400).json({ error: 'Display name is required' });
  }
  try {
    const now = new Date().toISOString();
    await dbRun(
      'UPDATE user_profiles SET display_name = ?, avatar_url = ?, bio = ?, updated_at = ? WHERE email = ?',
      [displayName.trim(), avatarUrl || '', bio || '', now, session.email]
    );
    session.displayName = displayName.trim();
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/apps/:id/achievements', async (req, res) => {
  const sessionId = req.cookies['hub_session_id'];
  const email = sessionId && sessions.has(sessionId) ? sessions.get(sessionId).email : null;
  const appId = req.params.id;

  try {
    const achievements = await dbAll('SELECT * FROM achievements WHERE app_id = ?', [appId]);
    const unlocked = email 
      ? await dbAll('SELECT achievement_id FROM user_achievements WHERE email = ?', [email])
      : [];
    const unlockedIds = new Set(unlocked.map(u => u.achievement_id));

    const result = achievements.map(a => ({
      id: a.id,
      title: a.title,
      description: a.description,
      icon: a.icon,
      xpValue: a.xp_value,
      hidden: !!a.hidden,
      unlocked: unlockedIds.has(a.id)
    }));

    res.json({ success: true, achievements: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/profile/achievements', async (req, res) => {
  const sessionId = req.cookies['hub_session_id'];
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const session = sessions.get(sessionId);

  try {
    const sql = `
      SELECT ua.unlocked_at, a.title as achievement_title, a.description as achievement_desc, 
             a.icon as achievement_icon, a.xp_value, app.title as app_title, app.id as app_id
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.id
      JOIN apps app ON a.app_id = app.id
      WHERE ua.email = ?
      ORDER BY ua.unlocked_at DESC
    `;
    const rows = await dbAll(sql, [session.email]);
    res.json({ success: true, achievements: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// App installation endpoints
app.get('/api/profile/installs', async (req, res) => {
  const sessionId = req.cookies['hub_session_id'];
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const session = sessions.get(sessionId);

  try {
    const rows = await dbAll('SELECT app_id FROM user_installs WHERE email = ?', [session.email]);
    const installs = rows.map(r => r.app_id);
    res.json({ success: true, installs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/profile/installs', async (req, res) => {
  const sessionId = req.cookies['hub_session_id'];
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const session = sessions.get(sessionId);
  const { appId } = req.body;

  if (!appId) {
    return res.status(400).json({ error: 'Missing appId' });
  }

  try {
    const now = new Date().toISOString();
    await dbRun(
      'INSERT OR REPLACE INTO user_installs (email, app_id, installed_at) VALUES (?, ?, ?)',
      [session.email, appId, now]
    );
    res.json({ success: true, message: `App ${appId} install recorded.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/profile/installs/:appId', async (req, res) => {
  const sessionId = req.cookies['hub_session_id'];
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const session = sessions.get(sessionId);
  const { appId } = req.params;

  try {
    await dbRun(
      'DELETE FROM user_installs WHERE email = ? AND app_id = ?',
      [session.email, appId]
    );
    res.json({ success: true, message: `App ${appId} uninstall recorded.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/profile/achievements/unlock', async (req, res) => {
  const sessionId = req.cookies['hub_session_id'];
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const session = sessions.get(sessionId);
  const { achievementId } = req.body;

  if (!achievementId) {
    return res.status(400).json({ error: 'Missing achievementId' });
  }

  try {
    const ach = await dbGet('SELECT * FROM achievements WHERE id = ?', [achievementId]);
    if (!ach) {
      return res.status(404).json({ error: 'Achievement not found' });
    }

    const alreadyUnlocked = await dbGet(
      'SELECT * FROM user_achievements WHERE email = ? AND achievement_id = ?',
      [session.email, achievementId]
    );
    if (alreadyUnlocked) {
      return res.json({ success: true, unlocked: false, message: 'Already unlocked' });
    }

    const now = new Date().toISOString();
    await dbRun(
      'INSERT INTO user_achievements (email, achievement_id, unlocked_at) VALUES (?, ?, ?)',
      [session.email, achievementId, now]
    );

    const profile = await dbGet('SELECT * FROM user_profiles WHERE email = ?', [session.email]);
    if (profile) {
      const xpGained = ach.xp_value || 100;
      const newXpTotal = profile.xp + xpGained;
      const newLevel = Math.floor(newXpTotal / 500) + 1;
      await dbRun(
        'UPDATE user_profiles SET xp = ?, level = ?, updated_at = ? WHERE email = ?',
        [newXpTotal, newLevel, now, session.email]
      );
    }

    res.json({ success: true, unlocked: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Middleware: Ensure user is logged in
function requireAuth(req, res, next) {
  const sessionId = req.cookies['hub_session_id'];
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({ error: 'Unauthorized. Please sign in.' });
  }
  req.user = sessions.get(sessionId);
  next();
}

// Middleware: Ensure user has a specific global role
function requireGlobalRole(allowedRoles) {
  return async (req, res, next) => {
    const sessionId = req.cookies['hub_session_id'];
    if (!sessionId || !sessions.has(sessionId)) {
      return res.status(401).json({ error: 'Unauthorized. Please sign in.' });
    }
    const session = sessions.get(sessionId);
    try {
      const roleRow = await dbGet('SELECT role FROM user_roles WHERE email = ?', [session.email]);
      const role = roleRow ? roleRow.role : null;
      if (!role || !allowedRoles.includes(role)) {
        return res.status(403).json({ error: 'Forbidden. Insufficient permissions.' });
      }
      req.user = { ...session, role };
      next();
    } catch (err) {
      res.status(500).json({ error: 'Database error checking role.' });
    }
  };
}

// Middleware: Check permission on a specific app
function requireAppPermission(requiredPermission) {
  return async (req, res, next) => {
    const sessionId = req.cookies['hub_session_id'];
    if (!sessionId || !sessions.has(sessionId)) {
      return res.status(401).json({ error: 'Unauthorized. Please sign in.' });
    }
    const session = sessions.get(sessionId);
    const appId = req.params.id;
    if (!appId) {
      return res.status(400).json({ error: 'Missing application ID.' });
    }
    try {
      const roleRow = await dbGet('SELECT role FROM user_roles WHERE email = ?', [session.email]);
      const globalRole = roleRow ? roleRow.role : null;
      
      // Global admin has full access bypass
      if (globalRole === 'admin') {
        req.user = { ...session, role: globalRole };
        req.appPermission = 'admin';
        return next();
      }

      // Check app collaborators table
      const collaborator = await dbGet(
        'SELECT permission FROM app_collaborators WHERE app_id = ? AND email = ?',
        [appId, session.email]
      );

      if (!collaborator) {
        return res.status(403).json({ error: 'Forbidden. You are not a collaborator on this app.' });
      }

      // Permissions hierarchy check: admin > write > read
      const permissionsOrder = { 'admin': 3, 'write': 2, 'read': 1 };
      const userLevel = permissionsOrder[collaborator.permission] || 0;
      const requiredLevel = permissionsOrder[requiredPermission] || 0;

      if (userLevel < requiredLevel) {
        return res.status(403).json({ error: 'Forbidden. Insufficient collaborator permission.' });
      }

      req.user = { ...session, role: globalRole };
      req.appPermission = collaborator.permission;
      next();
    } catch (err) {
      res.status(500).json({ error: 'Database error checking app collaborator status.' });
    }
  };
}

// --- DEVELOPER PORTAL ENDPOINTS ---

app.get('/api/developer/apps', requireGlobalRole(['admin', 'developer']), async (req, res) => {
  try {
    let rows;
    if (req.user.role === 'admin') {
      rows = await dbAll('SELECT * FROM apps ORDER BY created_at DESC');
    } else {
      const sql = `
        SELECT a.* FROM apps a
        JOIN app_collaborators c ON a.id = c.app_id
        WHERE c.email = ?
        ORDER BY a.created_at DESC
      `;
      rows = await dbAll(sql, [req.user.email]);
    }

    const parsed = [];
    for (const r of rows) {
      let permission = 'read';
      if (req.user.role === 'admin') {
        permission = 'admin';
      } else {
        const collab = await dbGet('SELECT permission FROM app_collaborators WHERE app_id = ? AND email = ?', [r.id, req.user.email]);
        if (collab) permission = collab.permission;
      }
      parsed.push({
        ...r,
        tags: r.tags ? JSON.parse(r.tags) : [],
        features: r.features ? JSON.parse(r.features) : [],
        systemRequirements: r.system_requirements ? JSON.parse(r.system_requirements) : {},
        website: r.website || '',
        build_urls: r.build_urls ? JSON.parse(r.build_urls) : {},
        userPermission: permission
      });
    }

    res.json({ success: true, apps: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/developer/upload-cover', requireGlobalRole(['admin', 'developer']), async (req, res) => {
  const { fileName, fileData } = req.body;
  if (!fileName || !fileData) {
    return res.status(400).json({ error: 'Filename and base64 data are required.' });
  }

  try {
    const matches = fileData.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid base64 image data.' });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    if (!mimeType.startsWith('image/')) {
      return res.status(400).json({ error: 'Only image files are allowed.' });
    }

    let extension = 'png';
    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
      extension = 'jpg';
    } else if (mimeType === 'image/gif') {
      extension = 'gif';
    } else if (mimeType === 'image/webp') {
      extension = 'webp';
    } else if (mimeType === 'image/svg+xml') {
      extension = 'svg';
    }

    const buffer = Buffer.from(base64Data, 'base64');
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image size exceeds the 5MB limit.' });
    }

    const uploadsDir = path.join(__dirname, 'public', 'uploads');
    const fs = require('fs');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const uniqueFileName = `${crypto.randomUUID()}.${extension}`;
    const filePath = path.join(uploadsDir, uniqueFileName);

    await fs.promises.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${uniqueFileName}`;
    res.json({ success: true, url: publicUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/developer/apps', requireGlobalRole(['admin', 'developer']), async (req, res) => {
  const { id, title, developer, publisher, releaseDate, description, fullDescription, tags, features, systemRequirements, prodUrl, devUrl, githubUrl, downloadUrl, coverImage, icon, isOnline, isMultiplayer, website, buildUrls } = req.body;

  if (!id || !title) {
    return res.status(400).json({ error: 'App ID and Title are required' });
  }

  if (!/^[a-z0-9-_]+$/.test(id)) {
    return res.status(400).json({ error: 'App ID must be lowercase alphanumeric, dashes, or underscores only' });
  }

  try {
    const exists = await dbGet('SELECT id FROM apps WHERE id = ?', [id]);
    if (exists) {
      return res.status(400).json({ error: 'App ID already exists' });
    }

    const appToken = 'kbs_token_' + crypto.randomBytes(16).toString('hex');
    const now = new Date().toISOString();

    await dbRun(
      `INSERT INTO apps (id, title, developer, publisher, release_date, description, full_description, tags, features, system_requirements, prod_url, dev_url, github_url, download_url, cover_image, icon, is_online, is_multiplayer, app_token, website, build_urls, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, title, developer || '', publisher || '', releaseDate || 'TBD',
        description || '', fullDescription || '',
        JSON.stringify(tags || []), JSON.stringify(features || []), JSON.stringify(systemRequirements || {}),
        prodUrl || '', devUrl || '', githubUrl || '', downloadUrl || '', coverImage || '', icon || '🎮',
        isOnline ? 1 : 0, isMultiplayer ? 1 : 0, appToken, website || '', JSON.stringify(buildUrls || {}), now, now
      ]
    );

    // Automatically make creator the admin collaborator
    await dbRun(
      'INSERT INTO app_collaborators (app_id, email, permission, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [id, req.user.email, 'admin', now, now]
    );

    res.status(201).json({ success: true, appToken, message: 'App registered successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/developer/apps/:id', requireAppPermission('write'), async (req, res) => {
  const appId = req.params.id;
  const { title, developer, publisher, releaseDate, description, fullDescription, tags, features, systemRequirements, prodUrl, devUrl, githubUrl, downloadUrl, coverImage, icon, isOnline, isMultiplayer, website, buildUrls } = req.body;

  try {
    const exists = await dbGet('SELECT id FROM apps WHERE id = ?', [appId]);
    if (!exists) {
      return res.status(404).json({ error: 'App not found' });
    }

    const now = new Date().toISOString();
    await dbRun(
      `UPDATE apps 
       SET title = ?, developer = ?, publisher = ?, release_date = ?, description = ?, full_description = ?, tags = ?, features = ?, system_requirements = ?, prod_url = ?, dev_url = ?, github_url = ?, download_url = ?, cover_image = ?, icon = ?, is_online = ?, is_multiplayer = ?, website = ?, build_urls = ?, updated_at = ?
       WHERE id = ?`,
      [
        title, developer || '', publisher || '', releaseDate || '',
        description || '', fullDescription || '',
        JSON.stringify(tags || []), JSON.stringify(features || []), JSON.stringify(systemRequirements || {}),
        prodUrl || '', devUrl || '', githubUrl || '', downloadUrl || '', coverImage || '', icon || '🎮',
        isOnline ? 1 : 0, isMultiplayer ? 1 : 0, website || '', JSON.stringify(buildUrls || {}), now, appId
      ]
    );

    res.json({ success: true, message: 'App updated successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/developer/apps/:id/achievements', requireAppPermission('write'), async (req, res) => {
  const appId = req.params.id;
  const { id, title, description, icon, xpValue } = req.body;

  if (!id || !title || !description) {
    return res.status(400).json({ error: 'ID, Title, and Description are required' });
  }

  try {
    const appExists = await dbGet('SELECT id FROM apps WHERE id = ?', [appId]);
    if (!appExists) {
      return res.status(404).json({ error: 'App not found' });
    }

    const achExists = await dbGet('SELECT id FROM achievements WHERE id = ?', [id]);
    if (achExists) {
      return res.status(400).json({ error: 'Achievement ID already exists' });
    }

    const now = new Date().toISOString();
    await dbRun(
      'INSERT INTO achievements (id, app_id, title, description, icon, xp_value, hidden, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, appId, title, description, icon || '🏆', xpValue || 100, 0, now]
    );

    res.status(201).json({ success: true, message: 'Achievement created successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Access Request Endpoint
app.post('/api/developer/request-access', requireAuth, async (req, res) => {
  const email = req.user.email;
  try {
    const roleRow = await dbGet('SELECT role FROM user_roles WHERE email = ?', [email]);
    if (roleRow) {
      return res.status(400).json({ error: `Access request already has status: ${roleRow.role}` });
    }
    const now = new Date().toISOString();
    await dbRun('INSERT INTO user_roles (email, role, created_at, updated_at) VALUES (?, ?, ?, ?)', [email, 'pending', now, now]);
    res.json({ success: true, message: 'Developer access request submitted successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// App-level collaborator management endpoints
app.get('/api/developer/apps/:id/collaborators', requireAppPermission('read'), async (req, res) => {
  const appId = req.params.id;
  try {
    const collaborators = await dbAll('SELECT email, permission, created_at FROM app_collaborators WHERE app_id = ? ORDER BY email ASC', [appId]);
    res.json({ success: true, collaborators });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/developer/apps/:id/collaborators', requireAppPermission('admin'), async (req, res) => {
  const appId = req.params.id;
  const { email, permission } = req.body;
  if (!email || !permission) {
    return res.status(400).json({ error: 'Email and permission level are required.' });
  }
  if (!['admin', 'write', 'read'].includes(permission)) {
    return res.status(400).json({ error: 'Invalid permission level.' });
  }
  try {
    const exists = await dbGet('SELECT permission FROM app_collaborators WHERE app_id = ? AND email = ?', [appId, email]);
    if (exists) {
      return res.status(400).json({ error: 'User is already a collaborator on this application.' });
    }
    const now = new Date().toISOString();
    await dbRun(
      'INSERT INTO app_collaborators (app_id, email, permission, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [appId, email.trim().toLowerCase(), permission, now, now]
    );
    res.json({ success: true, message: 'Collaborator added successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/developer/apps/:id/collaborators/:email', requireAppPermission('admin'), async (req, res) => {
  const appId = req.params.id;
  const email = req.params.email;
  const { permission } = req.body;
  if (!permission || !['admin', 'write', 'read'].includes(permission)) {
    return res.status(400).json({ error: 'Invalid permission level.' });
  }
  try {
    const exists = await dbGet('SELECT permission FROM app_collaborators WHERE app_id = ? AND email = ?', [appId, email]);
    if (!exists) {
      return res.status(404).json({ error: 'Collaborator not found.' });
    }
    const now = new Date().toISOString();
    await dbRun(
      'UPDATE app_collaborators SET permission = ?, updated_at = ? WHERE app_id = ? AND email = ?',
      [permission, now, appId, email]
    );
    res.json({ success: true, message: 'Collaborator updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/developer/apps/:id/collaborators/:email', requireAppPermission('admin'), async (req, res) => {
  const appId = req.params.id;
  const email = req.params.email;
  try {
    const admins = await dbAll("SELECT email FROM app_collaborators WHERE app_id = ? AND permission = 'admin'", [appId]);
    if (admins.length === 1 && admins[0].email === email) {
      return res.status(400).json({ error: 'Cannot remove the last Admin collaborator from this application.' });
    }
    
    await dbRun('DELETE FROM app_collaborators WHERE app_id = ? AND email = ?', [appId, email]);
    res.json({ success: true, message: 'Collaborator removed successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Global IAM Admin endpoints
app.get('/api/admin/users', requireGlobalRole(['admin']), async (req, res) => {
  try {
    const profiles = await dbAll('SELECT email, display_name, avatar_url, created_at FROM user_profiles ORDER BY email ASC');
    const roles = await dbAll('SELECT email, role FROM user_roles');
    const rolesMap = new Map(roles.map(r => [r.email, r.role]));
    
    const result = profiles.map(p => ({
      ...p,
      role: rolesMap.get(p.email) || null
    }));

    const profileEmails = new Set(profiles.map(p => p.email));
    for (const r of roles) {
      if (!profileEmails.has(r.email)) {
        result.push({
          email: r.email,
          display_name: '(Pending Sign In)',
          avatar_url: '?',
          created_at: r.created_at || new Date().toISOString(),
          role: r.role
        });
      }
    }

    res.json({ success: true, users: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/users/:email/role', requireGlobalRole(['admin']), async (req, res) => {
  const email = req.params.email;
  const { role } = req.body;
  
  if (role !== null && !['admin', 'developer', 'pending'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role.' });
  }

  if (req.user.email === email && role !== 'admin') {
    return res.status(400).json({ error: 'Cannot downgrade your own Admin role.' });
  }

  try {
    const now = new Date().toISOString();
    const exists = await dbGet('SELECT email FROM user_roles WHERE email = ?', [email]);
    if (role === null) {
      await dbRun('DELETE FROM user_roles WHERE email = ?', [email]);
    } else if (exists) {
      await dbRun('UPDATE user_roles SET role = ?, updated_at = ? WHERE email = ?', [role, now, email]);
    } else {
      await dbRun('INSERT INTO user_roles (email, role, created_at, updated_at) VALUES (?, ?, ?, ?)', [email, role, now, now]);
    }
    res.json({ success: true, message: 'User role updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/users/authorize', requireGlobalRole(['admin']), async (req, res) => {
  const { email, role } = req.body;
  if (!email || !role) {
    return res.status(400).json({ error: 'Email and role are required.' });
  }
  if (!['admin', 'developer'].includes(role)) {
    return res.status(400).json({ error: 'Role must be admin or developer.' });
  }
  try {
    const formattedEmail = email.trim().toLowerCase();
    const exists = await dbGet('SELECT role FROM user_roles WHERE email = ?', [formattedEmail]);
    const now = new Date().toISOString();
    if (exists) {
      await dbRun('UPDATE user_roles SET role = ?, updated_at = ? WHERE email = ?', [role, now, formattedEmail]);
    } else {
      await dbRun('INSERT INTO user_roles (email, role, created_at, updated_at) VALUES (?, ?, ?, ?)', [formattedEmail, role, now, now]);
    }
    res.json({ success: true, message: 'Creator pre-authorized successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- GAME SERVER TELEMETRY / STEAM-LIKE WEB API (TOKEN AUTHENTICATED) ---

async function authenticateGameToken(req, res, next) {
  const token = req.headers['x-app-token'] || req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized. Missing App Token.' });
  }
  try {
    const app = await dbGet('SELECT id FROM apps WHERE app_token = ?', [token]);
    if (!app) {
      return res.status(401).json({ error: 'Unauthorized. Invalid App Token.' });
    }
    req.appId = app.id;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database error in game authentication.' });
  }
}

app.post('/api/games-api/achievements/unlock', authenticateGameToken, async (req, res) => {
  const { email, achievementId } = req.body;
  if (!email || !achievementId) {
    return res.status(400).json({ error: 'Missing email or achievementId' });
  }

  try {
    const ach = await dbGet('SELECT * FROM achievements WHERE id = ?', [achievementId]);
    if (!ach) {
      return res.status(404).json({ error: 'Achievement not found' });
    }
    if (ach.app_id !== req.appId) {
      return res.status(403).json({ error: 'Achievement does not belong to this application' });
    }

    let profile = await dbGet('SELECT * FROM user_profiles WHERE email = ?', [email]);
    if (!profile) {
      const now = new Date().toISOString();
      const defaultName = email.split('@')[0];
      await dbRun(
        'INSERT INTO user_profiles (email, display_name, avatar_url, bio, level, xp, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [email, defaultName, defaultName[0].toUpperCase(), 'New Player!', 1, 0, now, now]
      );
      await ensureSingleUserIsAdmin();
      profile = await dbGet('SELECT * FROM user_profiles WHERE email = ?', [email]);
    }

    const alreadyUnlocked = await dbGet(
      'SELECT * FROM user_achievements WHERE email = ? AND achievement_id = ?',
      [email, achievementId]
    );
    if (alreadyUnlocked) {
      return res.json({ success: true, unlocked: false, message: 'Already unlocked' });
    }

    const now = new Date().toISOString();
    await dbRun(
      'INSERT INTO user_achievements (email, achievement_id, unlocked_at) VALUES (?, ?, ?)',
      [email, achievementId, now]
    );

    const xpGained = ach.xp_value || 100;
    const newXpTotal = profile.xp + xpGained;
    const newLevel = Math.floor(newXpTotal / 500) + 1;
    const levelUp = newLevel > profile.level;

    await dbRun(
      'UPDATE user_profiles SET xp = ?, level = ?, updated_at = ? WHERE email = ?',
      [newXpTotal, newLevel, now, email]
    );

    res.json({
      success: true,
      unlocked: true,
      achievementTitle: ach.title,
      xpGained,
      newXp: newXpTotal,
      newLevel,
      levelUp
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/games-api/profile/xp', authenticateGameToken, async (req, res) => {
  const { email, xp } = req.body;
  if (!email || xp === undefined) {
    return res.status(400).json({ error: 'Missing email or xp value' });
  }

  try {
    let profile = await dbGet('SELECT * FROM user_profiles WHERE email = ?', [email]);
    if (!profile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const now = new Date().toISOString();
    const newXpTotal = Math.max(0, profile.xp + xp);
    const newLevel = Math.floor(newXpTotal / 500) + 1;
    const levelUp = newLevel > profile.level;

    await dbRun(
      'UPDATE user_profiles SET xp = ?, level = ?, updated_at = ? WHERE email = ?',
      [newXpTotal, newLevel, now, email]
    );

    res.json({
      success: true,
      newXp: newXpTotal,
      newLevel,
      levelUp
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/games-api/user/:email', authenticateGameToken, async (req, res) => {
  try {
    const profile = await dbGet('SELECT * FROM user_profiles WHERE email = ?', [req.params.email]);
    if (!profile) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    
    const sql = `
      SELECT a.id, a.title, a.icon, ua.unlocked_at
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.id
      WHERE ua.email = ? AND a.app_id = ?
    `;
    const unlocked = await dbAll(sql, [req.params.email, req.appId]);

    res.json({
      success: true,
      user: {
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url,
        level: profile.level,
        xp: profile.xp
      },
      unlockedAchievements: unlocked
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/games-api/achievements', authenticateGameToken, async (req, res) => {
  const { email } = req.query;
  const appId = req.appId;
  if (!email) {
    return res.status(400).json({ error: 'Missing email query parameter' });
  }

  try {
    const achievements = await dbAll('SELECT * FROM achievements WHERE app_id = ?', [appId]);
    const unlocked = await dbAll('SELECT achievement_id, unlocked_at FROM user_achievements WHERE email = ?', [email]);
    
    const unlockedMap = new Map();
    for (const u of unlocked) {
      unlockedMap.set(u.achievement_id, u.unlocked_at);
    }

    const result = achievements.map(a => ({
      id: a.id,
      title: a.title,
      description: a.description,
      icon: a.icon,
      xpValue: a.xp_value,
      hidden: !!a.hidden,
      unlocked: unlockedMap.has(a.id),
      unlockedAt: unlockedMap.get(a.id) || null
    }));

    res.json({ success: true, achievements: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Helper function to reverse proxy requests to dev/testing versions of apps
async function handleTestProxy(req, res) {
  const appId = req.params.appId;
  try {
    const appRecord = await dbGet('SELECT dev_url FROM apps WHERE id = ?', [appId]);
    let targetUrl = null;
    
    if (appRecord && appRecord.dev_url) {
      targetUrl = appRecord.dev_url;
    } else if (appId === 'kbs-cloud' || appId === 'hub') {
      targetUrl = 'http://localhost:28000';
    } else if (appId === 'kbs-auth' || appId === 'auth') {
      targetUrl = 'http://localhost:28001';
    } else {
      return res.status(404).send(`App "${appId}" test version not found or not registered.`);
    }

    const urlObj = new URL(targetUrl);
    const targetHost = urlObj.hostname;
    const targetPort = urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80);

    // Rewrite path: extract everything after '/test/:appId/' using path-to-regexp v8 splat wildcard
    // Note: req.params.splat might be parsed as an array of path segments in some Express versions
    let pathSuffix = '';
    if (req.params.splat) {
      pathSuffix = Array.isArray(req.params.splat) ? req.params.splat.join('/') : req.params.splat;
    }
    let targetPath = '/' + pathSuffix;

    const connector = http.request({
      host: targetHost,
      port: targetPort,
      path: targetPath,
      method: req.method,
      headers: req.headers
    }, (connectorRes) => {
      res.writeHead(connectorRes.statusCode, connectorRes.headers);
      connectorRes.pipe(res);
    });

    req.pipe(connector);

    connector.on('error', (err) => {
      console.error(`[Test Proxy] Error for ${appId}:`, err.message);
      if (!res.headersSent) {
        res.status(502).send('Bad Gateway');
      }
    });
  } catch (err) {
    console.error(`[Test Proxy] Exception for ${appId}:`, err.message);
    if (!res.headersSent) {
      res.status(500).send('Internal Server Error');
    }
  }
}

// Redirect /test/:appId to /test/:appId/ to ensure proper relative asset resolution
app.get('/test/:appId', (req, res, next) => {
  if (!req.path.endsWith('/')) {
    return res.redirect(301, req.path + '/');
  }
  next();
});

// Proxy test versions
app.all('/test/:appId/{*splat}', handleTestProxy);

// Proxy coordinator API requests to the game coordinator
app.all('/api/coordinator/{*splat}', (req, res) => {
  let pathSuffix = '';
  if (req.params.splat) {
    pathSuffix = Array.isArray(req.params.splat) ? req.params.splat.join('/') : req.params.splat;
  }
  let targetPath = '/api/' + pathSuffix;
  
  // Keep query parameters
  const query = req.url.split('?')[1];
  if (query) {
    targetPath += '?' + query;
  }

  const connector = http.request({
    host: 'localhost',
    port: 29009,
    path: targetPath,
    method: req.method,
    headers: req.headers
  }, (connectorRes) => {
    res.writeHead(connectorRes.statusCode, connectorRes.headers);
    connectorRes.pipe(res);
  });

  req.pipe(connector);

  connector.on('error', (err) => {
    console.error('[Coordinator Proxy] Error:', err.message);
    if (!res.headersSent) {
      res.status(502).send('Bad Gateway');
    }
  });
});

// Serves dynamic uploader files
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Serves the client SPA files in production
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*splat', (req, res) => {
  // If request is not for an API route, serve front-end index.html
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    res.status(404).json({ error: 'Not Found' });
  }
});

app.listen(PORT, () => {
  console.log(`KBS Cloud Hub service running on port ${PORT}`);
});

if (process.env.FRONTEND_PORT && String(process.env.FRONTEND_PORT) !== String(PORT)) {
  const frontendApp = express();
  frontendApp.use(cors({
    origin: true,
    credentials: true
  }));

  // Redirect /test/:appId to /test/:appId/
  frontendApp.get('/test/:appId', (req, res, next) => {
    if (!req.path.endsWith('/')) {
      return res.redirect(301, req.path + '/');
    }
    next();
  });

  // Proxy test versions
  frontendApp.all('/test/:appId/{*splat}', handleTestProxy);

  // Proxy API requests to the backend server
  frontendApp.all('/api/*splat', (req, res) => {
    const connector = http.request({
      host: 'localhost',
      port: PORT,
      path: req.originalUrl,
      method: req.method,
      headers: req.headers
    }, (connectorRes) => {
      res.writeHead(connectorRes.statusCode, connectorRes.headers);
      connectorRes.pipe(res);
    });

    req.pipe(connector);

    connector.on('error', (err) => {
      console.error('Hub frontend proxy error:', err);
      res.status(502).send('Bad Gateway');
    });
  });

  frontendApp.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
  frontendApp.use(express.static(path.join(__dirname, 'dist')));
  frontendApp.get('*splat', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
  frontendApp.listen(process.env.FRONTEND_PORT, () => {
    console.log(`KBS Cloud Hub static frontend server running on port ${process.env.FRONTEND_PORT}`);
  });
}
