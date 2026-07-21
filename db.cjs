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
        website TEXT DEFAULT '',
        build_urls TEXT DEFAULT '{}',
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

    // Ensure columns exist (for migration)
    try {
      await dbRun('ALTER TABLE apps ADD COLUMN website TEXT DEFAULT ""');
    } catch (err) {
      // column already exists, ignore
    }
    try {
      await dbRun('ALTER TABLE apps ADD COLUMN build_urls TEXT DEFAULT "{}"');
    } catch (err) {
      // column already exists, ignore
    }

    // Seed default applications
    await seedDefaultApps();

    // Ensure dev_url entries are updated to new target ports for testing
    await dbRun("UPDATE apps SET dev_url = 'http://localhost:28002' WHERE id = 'starswarm' AND dev_url != 'http://localhost:28002'");
    await dbRun("UPDATE apps SET dev_url = 'http://localhost:28003' WHERE id = 'tickerclash' AND dev_url != 'http://localhost:28003'");
    await dbRun("UPDATE apps SET prod_url = 'https://alchemy.kbs-cloud.com' WHERE id = 'alchemists-crucible' AND prod_url != 'https://alchemy.kbs-cloud.com'");
    await dbRun("UPDATE apps SET cover_image = '/glimmerwood_cover.png' WHERE id = 'glimmerwood' AND cover_image != '/glimmerwood_cover.png'");
    await dbRun("UPDATE apps SET github_url = 'https://github.com/kbs-cloud/glimmerwood' WHERE id = 'glimmerwood' AND github_url != 'https://github.com/kbs-cloud/glimmerwood'");
    await dbRun("UPDATE apps SET download_url = 'https://github.com/kbs-cloud/glimmerwood/releases' WHERE id = 'glimmerwood' AND download_url != 'https://github.com/kbs-cloud/glimmerwood/releases'");
    
    // Set Glimmerwood to a native game with website and OS build config
    const defaultBuilds = {
      windows: { url: '/downloads/glimmerwood-client-win-x64.zip', status: 'active', error_message: '' },
      linux: { url: '/downloads/glimmerwood-client-linux-x64.zip', status: 'active', error_message: '' },
      macos: { url: '', status: 'unsupported', error_message: 'macOS build not currently supported.' },
      android: { url: '', status: 'maintenance', error_message: 'Android build coming soon.' },
      ios: { url: '', status: 'inactive', error_message: '' }
    };
    await dbRun("UPDATE apps SET prod_url = '', website = ?, build_urls = ? WHERE id = 'glimmerwood'", [
      'https://glimmerwood.kbs-cloud.com',
      JSON.stringify(defaultBuilds)
    ]);
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}

async function seedDefaultApps() {
  const now = new Date().toISOString();

  // Helper to insert an app if it doesn't exist
  const insertAppIfMissing = async (appData) => {
    const exists = await dbGet('SELECT id FROM apps WHERE id = ?', [appData.id]);
    if (!exists) {
      await dbRun(
        `INSERT INTO apps (id, title, developer, publisher, release_date, description, full_description, tags, features, system_requirements, prod_url, dev_url, github_url, download_url, cover_image, icon, is_online, is_multiplayer, app_token, website, build_urls, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          appData.id,
          appData.title,
          appData.developer,
          appData.publisher,
          appData.release_date,
          appData.description,
          appData.full_description,
          JSON.stringify(appData.tags),
          JSON.stringify(appData.features),
          JSON.stringify(appData.systemRequirements),
          appData.prod_url,
          appData.dev_url,
          appData.github_url,
          appData.download_url,
          appData.cover_image,
          appData.icon,
          appData.isOnline ? 1 : 0,
          appData.isMultiplayer ? 1 : 0,
          appData.app_token,
          appData.website || '',
          JSON.stringify(appData.build_urls || {}),
          now,
          now
        ]
      );
      console.log(`Seeded ${appData.title} application into database.`);
    }
  };

  // Seed all 6 apps
  await insertAppIfMissing({
    id: 'starswarm',
    title: 'Star-Swarm',
    developer: 'KBS Cloud Games',
    publisher: 'KBS Cloud',
    release_date: 'June 2026',
    description: 'Establish your space empire, manage star systems, queue fleet production, and command battles in this epic sci-fi strategy game.',
    full_description: 'Command a cosmic space faction in an expansive procedural universe. Construct spaceports, manage resource collection, design custom rules, and lead your fleet to ultimate victory. Star-Swarm supports both simultaneous multi-commander battles online and classic local hotseat turn-based skirmishes. Harness the full capabilities of your starships to defend your home worlds and conquer the galaxy!',
    tags: ['Sci-Fi', 'Strategy', 'Space', 'Multiplayer'],
    features: [
      'Procedurally generated star systems',
      'Simultaneous online turns & local hotseat support',
      'Deep custom rules engine & editor',
      'Advanced tactical fleet dispatching',
      'SSO Authentication with telemetry tracking'
    ],
    systemRequirements: {
      os: 'Ubuntu 22.04+, Windows 10/11, macOS 12+',
      cpu: 'Intel Core i5 / AMD Ryzen 5 or better',
      memory: '4 GB RAM',
      graphics: 'Integrated Graphics (Vulkan/DirectX 12 support)',
      storage: '500 MB available space'
    },
    prod_url: 'https://star-swarm.kbs-cloud.com',
    dev_url: 'http://localhost:28002',
    github_url: 'https://github.com/kbs-cloud/star-swarm',
    download_url: 'https://github.com/kbs-cloud/star-swarm/releases',
    cover_image: '/starswarm_cover.png',
    icon: '🌌',
    isOnline: true,
    isMultiplayer: true,
    app_token: 'starswarm_token_dev_999'
  });

  await insertAppIfMissing({
    id: 'tickerclash',
    title: 'Ticker Clash',
    developer: 'KBS Cloud Games',
    publisher: 'KBS Cloud',
    release_date: 'May 2026',
    description: 'Battle on the live stock exchanges in a fast-paced market simulator. Pick tickers, execute trades, and clash against other portfolios to dominate the trading floor.',
    full_description: 'Step onto the chaotic trading floor of Ticker Clash! Select your trading portfolio, analyze real-time market indices, execute buying or selling strategies, and compete in intense trading sessions. Clash head-to-head with portfolios created by rival players or test your instincts against the computer. Perfect your market timing and rise to become a legendary investor!',
    tags: ['Finance', 'Simulation', 'Strategy', 'Real-Time'],
    features: [
      'Live exchange index simulation',
      'Real-time portfolio clashing systems',
      'Interactive financial dashboard visualizations',
      'Leaderboards and trading history telemetry',
      'SSO validation integration'
    ],
    systemRequirements: {
      os: 'Ubuntu 20.04+, Windows 10/11, macOS 11+',
      cpu: 'Dual-core 2.0 GHz or better',
      memory: '2 GB RAM',
      graphics: 'Standard WebGL compatible GPU',
      storage: '200 MB available space'
    },
    prod_url: 'https://tickerclash.kbs-cloud.com',
    dev_url: 'http://localhost:28003',
    github_url: 'https://github.com/kbs-cloud/ticker-clash',
    download_url: 'https://github.com/kbs-cloud/ticker-clash/releases',
    cover_image: '/tickerclash_cover.png',
    icon: '📈',
    isOnline: true,
    isMultiplayer: true,
    app_token: 'tickerclash_token_dev_888'
  });

  await insertAppIfMissing({
    id: 'alchemists-crucible',
    title: "Alchemist's Crucible",
    developer: 'KBS Cloud Games',
    publisher: 'KBS Cloud',
    release_date: 'June 2026',
    description: 'Synthesize elements, transmute substances, and achieve the ultimate formula in this alchemical crafting game.',
    full_description: "Welcome to the Alchemist's Crucible, a game of magical crafting and state mutation. Synthesize rare elements, queue transmutations, and race against other apprentices to create the Philosopher's Stone.",
    tags: ['Crafting', 'Strategy', 'Multiplayer', 'Alchemical'],
    features: [
      'Interactive element synthesis',
      'Local and online multiplayer support',
      'Apprentice presence tracking',
      'Achievements integration'
    ],
    systemRequirements: {
      os: 'Ubuntu 22.04+, Windows 10/11, macOS 12+',
      cpu: 'Intel Core i5 / AMD Ryzen 5 or better',
      memory: '4 GB RAM',
      graphics: 'Integrated Graphics',
      storage: '100 MB available space'
    },
    prod_url: 'https://alchemy.kbs-cloud.com',
    dev_url: 'http://localhost:28004',
    github_url: 'https://github.com/kbs-cloud/alchemists-crucible',
    download_url: 'https://github.com/kbs-cloud/alchemists-crucible/releases',
    cover_image: '/alchemists_crucible_cover.png',
    icon: '🧪',
    isOnline: true,
    isMultiplayer: true,
    app_token: 'alchemist_token_dev_777'
  });

  await insertAppIfMissing({
    id: 'gridlock-neon',
    title: 'Gridlock Neon',
    developer: 'KBS Cloud Games',
    publisher: 'KBS Cloud',
    release_date: 'June 2026',
    description: 'Dodge shifting obstacles and collect memory shards in sync with the beat on an infinite synthwave perspective grid.',
    full_description: 'Welcome to Gridlock Neon, a rhythm-based cyberpunk runner. Slide between lanes, jump over laser barriers, and slide under high obstructions. Sync your actions with the arpeggiator synth beats to boost your score, and deploy real-time sabotages to glitch your opponents off the track.',
    tags: ['Rhythm', 'Runner', 'Multiplayer', 'Synthwave'],
    features: [
      'Real-time procedural audio synthesizer',
      'Perspective visualizer grid and retro slicing sun',
      'SSO multiplayer presence tracking',
      'Real-time sabotage versus mechanics'
    ],
    systemRequirements: {
      os: 'Ubuntu 22.04+, Windows 10/11, macOS 12+',
      cpu: 'Intel Core i5 / AMD Ryzen 5 or better',
      memory: '4 GB RAM',
      graphics: 'Integrated Graphics',
      storage: '100 MB available space'
    },
    prod_url: 'https://gridlock.kbs-cloud.com',
    dev_url: 'http://localhost:28005',
    github_url: 'https://github.com/kbs-cloud/gridlock-neon',
    download_url: 'https://github.com/kbs-cloud/gridlock-neon/releases',
    cover_image: '/gridlock_neon_cover.png',
    icon: '🏍️',
    isOnline: true,
    isMultiplayer: true,
    app_token: 'gridlock_neon_token_dev_777'
  });

  await insertAppIfMissing({
    id: 'retrosweeper',
    title: 'RetroSweeper',
    developer: 'KBS Cloud Games',
    publisher: 'KBS Cloud',
    release_date: 'June 2026',
    description: 'Clear cyberpunk hazard fields, avoid glitch detonations, and compete with other sweepers in this retro-logic puzzle game.',
    full_description: 'Welcome to RetroSweeper, a cyberpunk logic puzzle of hazard sweep and grid clearance. Decode neon indicators, set holographic warning beacons, and race your fellow sweepers to identify all active cyber-mines before they detonate.',
    tags: ['Puzzle', 'Logic', 'Multiplayer', 'Cyberpunk', 'Retro'],
    features: [
      'Real-time multi-sweeper presence tracking',
      'Co-op and Speed-Sweep Versus logic',
      'CRT glitch screen detonation simulation',
      'KBS Cloud achievements integration'
    ],
    systemRequirements: {
      os: 'Ubuntu 22.04+, Windows 10/11, macOS 12+',
      cpu: 'Intel Core i5 / AMD Ryzen 5 or better',
      memory: '4 GB RAM',
      graphics: 'Integrated Graphics',
      storage: '100 MB available space'
    },
    prod_url: 'https://retrosweeper.kbs-cloud.com',
    dev_url: 'http://localhost:28006',
    github_url: 'https://github.com/kbs-cloud/retrosweeper',
    download_url: 'https://github.com/kbs-cloud/retrosweeper/releases',
    cover_image: '/retrosweeper_cover.png',
    icon: '🎛️',
    isOnline: true,
    isMultiplayer: true,
    app_token: 'retrosweeper_token_dev_777'
  });

  await insertAppIfMissing({
    id: 'sudoku-neon',
    title: 'Sudoku Neon',
    developer: 'KBS Cloud Games',
    publisher: 'KBS Cloud',
    release_date: 'June 2026',
    description: 'Solve matrix logic puzzles, decipher synthwave neon nodes, and sync your decryptions across device nodes.',
    full_description: 'Welcome to Sudoku Neon, a Zen Cyberpunk logical decryption grid. Decipher the matrix values in standard easy, medium, hard, or expert difficulty modules. Features local offline play and secure backup syncing via the KBS Cloud SSO framework.',
    tags: ['Puzzle', 'Logic', 'Singleplayer', 'Synthwave', 'Cyberpunk'],
    features: [
      'Canvas-rendered neon-aesthetic interactive grid',
      'Multiple difficulty levels: Easy, Medium, Hard, Expert',
      'Seamless local storage backup and cloud sync integration',
      'Google Chrome, desktop Electron, and Android Capacitor build configurations'
    ],
    systemRequirements: {
      os: 'Ubuntu 22.04+, Windows 10/11, Android 10+, macOS 12+',
      cpu: 'Intel Core i3 / AMD Ryzen 3 or better',
      memory: '2 GB RAM',
      graphics: 'Integrated Graphics',
      storage: '50 MB available space'
    },
    prod_url: 'https://mysudoku.org',
    dev_url: 'http://localhost:28007',
    github_url: 'https://github.com/kbs-cloud/sudoku-neon',
    download_url: 'https://github.com/kbs-cloud/sudoku-neon/releases',
    cover_image: '/sudoku_neon_cover.png',
    icon: '🧩',
    isOnline: true,
    isMultiplayer: false,
    app_token: 'sudoku_neon_token_dev_777'
  });

  await insertAppIfMissing({
    id: 'glimmerwood',
    title: 'Glimmerwood',
    developer: 'Glimmerwood Team',
    publisher: 'KBS Cloud',
    release_date: 'July 2026',
    description: 'A 3D pixel-art Action RPG built in C11 and raylib, featuring dynamic day/night lighting and real-time combat.',
    full_description: 'Explore a beautiful 3D procedural world textured with chunky pixel-art graphics. Slay aggressive foxes, equip magical torches that light up the night, collect loot piles, open chests, and progress your level. Built entirely from scratch in C with raylib graphics.',
    tags: ['RPG', '3D', 'Action', 'Pixel-Art', 'Singleplayer'],
    features: [
      '3D procedural terrain chunks',
      'Skeletal animations using glTF models',
      'Dynamic day/night cycle with custom carry light shader',
      'Authoritative local server-client physics and collision loop',
      'Binary save/load serialization state persistence'
    ],
    systemRequirements: {
      os: 'Ubuntu 22.04+, Windows 10/11, macOS 12+',
      cpu: 'Intel Core i5 / AMD Ryzen 5 or better',
      memory: '4 GB RAM',
      graphics: 'OpenGL 3.3 compatible GPU',
      storage: '200 MB available space'
    },
    prod_url: '',
    dev_url: 'http://localhost:28008',
    github_url: 'https://github.com/kbs-cloud/glimmerwood',
    download_url: 'https://github.com/kbs-cloud/glimmerwood/releases',
    cover_image: '/glimmerwood_cover.png',
    icon: '⚔️',
    isOnline: true,
    isMultiplayer: false,
    app_token: 'glimmerwood_token_dev_555',
    website: 'https://glimmerwood.kbs-cloud.com',
    build_urls: {
      windows: { url: '/downloads/glimmerwood-client-win-x64.zip', status: 'active', error_message: '' },
      linux: { url: '/downloads/glimmerwood-client-linux-x64.zip', status: 'active', error_message: '' },
      macos: { url: '', status: 'unsupported', error_message: 'macOS build not currently supported.' },
      android: { url: '', status: 'maintenance', error_message: 'Android build coming soon.' },
      ios: { url: '', status: 'inactive', error_message: '' }
    }
  });

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
    },
    // Alchemist's Crucible
    {
      id: 'alchemist_philosophers_stone',
      app_id: 'alchemists-crucible',
      title: "Philosopher's Stone",
      description: "Achieved victory in a game of Alchemist's Crucible.",
      icon: '🧪',
      xp_value: 100
    },
    {
      id: 'alchemist_ultimate_transmutation',
      app_id: 'alchemists-crucible',
      title: 'Ultimate Transmutation',
      description: 'Synthesized the ultimate alchemical element.',
      icon: '☀️',
      xp_value: 250
    },
    // Gridlock Neon
    {
      id: 'gridlock_neon_survivor',
      app_id: 'gridlock-neon',
      title: 'Neon Survivor',
      description: 'Completed a run of 1000m or more on the grid.',
      icon: '🏁',
      xp_value: 100
    },
    {
      id: 'gridlock_neon_perfect',
      app_id: 'gridlock-neon',
      title: 'Perfect Rhythm',
      description: 'Completed a run with full shields and no collisions.',
      icon: '💎',
      xp_value: 250
    },
    {
      id: 'gridlock_neon_collector',
      app_id: 'gridlock-neon',
      title: 'Shard Collector',
      description: 'Collected 50 or more memory shards in a single run.',
      icon: '⚡',
      xp_value: 150
    },
    // RetroSweeper
    {
      id: 'retrosweeper_flawless_sweep',
      app_id: 'retrosweeper',
      title: 'Flawless Sweep',
      description: 'Cleared a RetroSweeper grid with zero incorrect flags.',
      icon: '🚩',
      xp_value: 100
    },
    {
      id: 'retrosweeper_glitch_survivor',
      app_id: 'retrosweeper',
      title: 'Glitch Survivor',
      description: 'Successfully cleared a hazard field after surviving a cyber-mine CRT detonation.',
      icon: '💥',
      xp_value: 200
    },
    // Sudoku Neon
    {
      id: 'sudoku_first_victory',
      app_id: 'sudoku-neon',
      title: 'First Matrix Decoded',
      description: 'Successfully cleared your first Sudoku Neon matrix.',
      icon: '🧩',
      xp_value: 100
    },
    {
      id: 'sudoku_expert_solver',
      app_id: 'sudoku-neon',
      title: 'Expert Decryptor',
      description: 'Successfully solved an Expert difficulty Sudoku Neon matrix.',
      icon: '⚡',
      xp_value: 300
    },
    {
      id: 'sudoku_speed_demon',
      app_id: 'sudoku-neon',
      title: 'Speed Decryption',
      description: 'Cleared any Sudoku Neon matrix in under 5 minutes.',
      icon: '⏳',
      xp_value: 200
    },
    {
      id: 'sudoku_sync_master',
      app_id: 'sudoku-neon',
      title: 'Cloud Decryption Node Link',
      description: 'Synchronized your decryption matrix status online for the first time.',
      icon: '📡',
      xp_value: 100
    },
    // glimmerwood
    {
      id: 'glimmerwood_first_login',
      app_id: 'glimmerwood',
      title: 'Welcome to the World',
      description: 'Log into your KBS account within the Glimmerwood game client.',
      icon: '🔐',
      xp_value: 100
    },
    {
      id: 'glimmerwood_light_torch',
      app_id: 'glimmerwood',
      title: 'Let There Be Light',
      description: 'Equip a torch to illuminate the dark night.',
      icon: '🔥',
      xp_value: 100
    },
    {
      id: 'glimmerwood_kill_fox',
      app_id: 'glimmerwood',
      title: 'Fox Hunter',
      description: 'Defeat an aggressive fox in close melee combat.',
      icon: '🦊',
      xp_value: 250
    },
    {
      id: 'glimmerwood_gold_hoarder',
      app_id: 'glimmerwood',
      title: 'Gold Hoarder',
      description: 'Acquire 500 gold coins.',
      icon: '💰',
      xp_value: 150
    },
    {
      id: 'glimmerwood_craft_item',
      app_id: 'glimmerwood',
      title: 'Apprentice Craftsman',
      description: 'Craft your first item.',
      icon: '🔨',
      xp_value: 100
    },
    {
      id: 'glimmerwood_explore_world',
      app_id: 'glimmerwood',
      title: 'World Explorer',
      description: 'Explore the outer lands of Glimmerwood.',
      icon: '🗺️',
      xp_value: 200
    },
    {
      id: 'glimmerwood_full_gear',
      app_id: 'glimmerwood',
      title: 'Fully Prepared',
      description: 'Equip armor/weapons in all gear slots.',
      icon: '🛡️',
      xp_value: 250
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
