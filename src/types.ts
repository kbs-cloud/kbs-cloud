export interface UserProfile {
  email: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  level: number;
  xp: number;
  isGoogleLinked: boolean;
  role?: 'admin' | 'developer' | 'pending' | null;
}

export interface Game {
  id: string;
  title: string;
  developer: string;
  publisher: string;
  release_date: string;
  description: string;
  full_description: string;
  tags: string[];
  features: string[];
  systemRequirements: {
    os: string;
    cpu: string;
    memory: string;
    graphics: string;
    storage: string;
  };
  prod_url: string;
  dev_url: string;
  github_url: string;
  download_url: string;
  website?: string;
  build_urls?: {
    [key: string]: {
      url: string;
      status: 'active' | 'inactive' | 'maintenance' | 'deprecated' | 'unsupported';
      error_message: string;
    };
  };
  cover_image: string;
  icon: string;
  isOnline: boolean;
  isMultiplayer: boolean;
  app_token?: string;
  userPermission?: 'admin' | 'write' | 'read';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpValue: number;
  hidden: boolean;
  unlocked: boolean;
}
