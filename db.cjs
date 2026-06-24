const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'hub.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to hub.db SQLite database:', err.message);
  } else {
    console.log('Connected to hub.db SQLite database.');
  }
});

// Helper functions for database operations wrapped in Promises
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Initialize database schema and seeds
async function initDatabase() {
  try {
    // Enable Write-Ahead Logging for concurrency
    await dbRun('PRAGMA journal_mode=WAL');

    // 1. Create APPS table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS apps (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        developer TEXT,
        publisher TEXT,
        release_date TEXT,
        description TEXT,
        full_description TEXT,
        tags TEXT,
        features TEXT,
        system_requirements TEXT,
        prod_url TEXT,
        dev_url TEXT,
        github_url TEXT,
        download_url TEXT,
        cover_image TEXT,
        icon TEXT,
        is_online INTEGER DEFAULT 1,
        is_multiplayer INTEGER DEFAULT 1,
        app_token TEXT UNIQUE,
        created_at TEXT,
        updated_at TEXT
      )
    `);

    // 2. Create USER_PROFILES table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        email TEXT PRIMARY KEY,
        display_name TEXT,
        avatar_url TEXT,
        bio TEXT,
        level INTEGER DEFAULT 1,
        xp INTEGER DEFAULT 0,
        created_at TEXT,
        updated_at TEXT
      )
    `);

    // 3. Create ACHIEVEMENTS table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS achievements (
        id TEXT PRIMARY KEY,
        app_id TEXT REFERENCES apps(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        icon TEXT,
        xp_value INTEGER DEFAULT 100,
        hidden INTEGER DEFAULT 0,
        created_at TEXT
      )
    `);

    // 4. Create USER_ACHIEVEMENTS table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS user_achievements (
        email TEXT REFERENCES user_profiles(email) ON DELETE CASCADE,
        achievement_id TEXT REFERENCES achievements(id) ON DELETE CASCADE,
        unlocked_at TEXT,
        PRIMARY KEY (email, achievement_id)
      )
    `);

    // 5. Create USER_ROLES table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS user_roles (
        email TEXT PRIMARY KEY,
        role TEXT NOT NULL,
        created_at TEXT,
        updated_at TEXT
      )
    `);

    // 6. Create APP_COLLABORATORS table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS app_collaborators (
        app_id TEXT REFERENCES apps(id) ON DELETE CASCADE,
        email TEXT,
        permission TEXT NOT NULL,
        created_at TEXT,
        updated_at TEXT,
        PRIMARY KEY (app_id, email)
      )
    `);

    // 7. Create USER_INSTALLS table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS user_installs (
        email TEXT REFERENCES user_profiles(email) ON DELETE CASCADE,
        app_id TEXT REFERENCES apps(id) ON DELETE CASCADE,
        installed_at TEXT,
        PRIMARY KEY (email, app_id)
      )
    `);

    console.log('Database schema verified/created successfully.');

    // Seed default applications
    await seedDefaultApps();

    // Ensure dev_url entries are updated to new target ports for testing
    await dbRun("UPDATE apps SET dev_url = 'http://localhost:28002' WHERE id = 'starswarm' AND dev_url != 'http://localhost:28002'");
    await dbRun("UPDATE apps SET dev_url = 'http://localhost:28003' WHERE id = 'tickerclash' AND dev_url != 'http://localhost:28003'");
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}

async function seedDefaultApps() {
  const now = new Date().toISOString();

  // 1. Seed Star-Swarm
  const starSwarmExists = await dbGet('SELECT id FROM apps WHERE id = ?', ['starswarm']);
  if (!starSwarmExists) {
    const tags = JSON.stringify(['Sci-Fi', 'Strategy', 'Space', 'Multiplayer']);
    const features = JSON.stringify([
      'Procedurally generated star systems',
      'Simultaneous online turns & local hotseat support',
      'Deep custom rules engine & editor',
      'Advanced tactical fleet dispatching',
      'SSO Authentication with telemetry tracking'
    ]);
    const sysReqs = JSON.stringify({
      os: 'Ubuntu 22.04+, Windows 10/11, macOS 12+',
      cpu: 'Intel Core i5 / AMD Ryzen 5 or better',
      memory: '4 GB RAM',
      graphics: 'Integrated Graphics (Vulkan/DirectX 12 support)',
      storage: '500 MB available space'
    });

    await dbRun(
      `INSERT INTO apps (id, title, developer, publisher, release_date, description, full_description, tags, features, system_requirements, prod_url, dev_url, github_url, download_url, cover_image, icon, is_online, is_multiplayer, app_token, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'starswarm',
        'Star-Swarm',
        'KBS Cloud Games',
        'KBS Cloud',
        'June 2026',
        'Establish your space empire, manage star systems, queue fleet production, and command battles in this epic sci-fi strategy game.',
        'Command a cosmic space faction in an expansive procedural universe. Construct spaceports, manage resource collection, design custom rules, and lead your fleet to ultimate victory. Star-Swarm supports both simultaneous multi-commander battles online and classic local hotseat turn-based skirmishes. Harness the full capabilities of your starships to defend your home worlds and conquer the galaxy!',
        tags,
        features,
        sysReqs,
        'https://star-swarm.kbs-cloud.com',
        'http://localhost:28002',
        'https://github.com/kbs-cloud/star-swarm',
        'https://github.com/kbs-cloud/star-swarm/releases',
        '/starswarm_cover.png',
        '🌌',
        1,
        1,
        'starswarm_token_dev_999',
        now,
        now
      ]
    );
    console.log('Seeded Star-Swarm application into database.');
  }

  // 2. Seed Ticker Clash
  const tickerClashExists = await dbGet('SELECT id FROM apps WHERE id = ?', ['tickerclash']);
  if (!tickerClashExists) {
    const tags = JSON.stringify(['Finance', 'Simulation', 'Strategy', 'Real-Time']);
    const features = JSON.stringify([
      'Live exchange index simulation',
      'Real-time portfolio clashing systems',
      'Interactive financial dashboard visualizations',
      'Leaderboards and trading history telemetry',
      'SSO validation integration'
    ]);
    const sysReqs = JSON.stringify({
      os: 'Ubuntu 20.04+, Windows 10/11, macOS 11+',
      cpu: 'Dual-core 2.0 GHz or better',
      memory: '2 GB RAM',
      graphics: 'Standard WebGL compatible GPU',
      storage: '200 MB available space'
    });

    await dbRun(
      `INSERT INTO apps (id, title, developer, publisher, release_date, description, full_description, tags, features, system_requirements, prod_url, dev_url, github_url, download_url, cover_image, icon, is_online, is_multiplayer, app_token, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'tickerclash',
        'Ticker Clash',
        'KBS Cloud Games',
        'KBS Cloud',
        'May 2026',
        'Battle on the live stock exchanges in a fast-paced market simulator. Pick tickers, execute trades, and clash against other portfolios to dominate the trading floor.',
        'Step onto the chaotic trading floor of Ticker Clash! Select your trading portfolio, analyze real-time market indices, execute buying or selling strategies, and compete in intense trading sessions. Clash head-to-head with portfolios created by rival players or test your instincts against the computer. Perfect your market timing and rise to become a legendary investor!',
        tags,
        features,
        sysReqs,
        'https://tickerclash.kbs-cloud.com',
        'http://localhost:28003', // Local backend/frontend port for Ticker Clash
        'https://github.com/kbs-cloud/ticker-clash',
        'https://github.com/kbs-cloud/ticker-clash/releases',
        '/tickerclash_cover.png',
        '📈',
        1,
        1,
        'tickerclash_token_dev_888',
        now,
        now
      ]
    );
    console.log('Seeded Ticker Clash application into database.');
  }

  // 3. Seed Achievements
  const achievementsList = [
    // Star-Swarm
    {
      id: 'starswarm_first_victory',
      app_id: 'starswarm',
      title: 'Void Conqueror',
      description: 'Establish command and win your first space skirmish.',
      icon: '🌌',
      xp_value: 100
    },
    {
      id: 'starswarm_fleet_admiral',
      app_id: 'starswarm',
      title: 'Fleet Admiral',
      description: 'Construct and command a fleet of over 50 starships.',
      icon: '🚀',
      xp_value: 100
    },
    {
      id: 'starswarm_diplomat',
      app_id: 'starswarm',
      title: 'Galactic Diplomat',
      description: 'Win a game without directly initiating any hostile actions.',
      icon: '🤝',
      xp_value: 100
    },
    // Ticker Clash
    {
      id: 'tickerclash_first_victory',
      app_id: 'tickerclash',
      title: 'Market Bull',
      description: 'Accumulate more portfolio value than your rival and win a match.',
      icon: '📈',
      xp_value: 100
    },
    {
      id: 'tickerclash_millionaire',
      app_id: 'tickerclash',
      title: 'Self-Made Millionaire',
      description: 'Surpass $1,000,000 in cash reserves during a single game.',
      icon: '💰',
      xp_value: 100
    },
    {
      id: 'tickerclash_veteran',
      app_id: 'tickerclash',
      title: 'Trading Floor Veteran',
      description: 'Complete 5 full trading simulator matches.',
      icon: '🏆',
      xp_value: 100
    }
  ];

  for (const ach of achievementsList) {
    const achExists = await dbGet('SELECT id FROM achievements WHERE id = ?', [ach.id]);
    if (!achExists) {
      await dbRun(
        'INSERT INTO achievements (id, app_id, title, description, icon, xp_value, hidden, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [ach.id, ach.app_id, ach.title, ach.description, ach.icon, ach.xp_value, 0, now]
      );
      console.log(`Seeded achievement "${ach.title}" for app "${ach.app_id}".`);
    }
  }
}

module.exports = {
  db,
  dbRun,
  dbGet,
  dbAll,
  initDatabase
};
