// Types for Pixel Leap 2D

export type BiomeType = 'neon_city' | 'crystal_caves' | 'magma_ruins' | 'cyber_spire';

export interface PlayerControls {
  left: string;
  right: string;
  jump: string;
  dash: string;
  stomp: string;
  pause: string;
}

export interface TouchSettings {
  enabled: boolean;
  opacity: number; // 0.1 to 1.0 (default 0.35 transparent)
  controlType: 'joystick' | 'dpad';
  haptics: boolean;
  swapSides: boolean;
  buttonScale: number; // 0.8 to 1.3
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  grounded: boolean;
  jumping: boolean;
  coyoteTime: number; // frames left where jump is allowed after falling
  jumpBuffer: number; // frames left where pre-pressed jump is remembered
  wallSliding: -1 | 0 | 1; // -1 left wall, 1 right wall, 0 none
  wallJumpCooldown: number;
  doubleJumpAvailable: boolean;
  dashTimer: number; // active dash frames
  dashCooldown: number;
  dashDirection: -1 | 1;
  stomping: boolean;
  facing: -1 | 1;
  health: number;
  maxHealth: number;
  invulnerableTimer: number;
  animFrame: number;
  animTimer: number;
  state: 'idle' | 'run' | 'jump' | 'fall' | 'wall' | 'dash' | 'stomp' | 'hit';
  skinId: string;
  trailId: string;
}

export type EnemyType = 'crawler' | 'bat' | 'beetle' | 'shooter' | 'phantasm';

export interface Enemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  startX: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  facing: -1 | 1;
  health: number;
  maxHealth: number;
  patrolMinX: number;
  patrolMaxX: number;
  actionTimer: number;
  state: string;
  isStompable: boolean;
  points: number;
  coinsDrop: number;
  color: string;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  life: number;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'solid' | 'crumble' | 'moving' | 'spring' | 'one_way';
  movingVx?: number;
  movingVy?: number;
  minX?: number;
  maxX?: number;
  crumbleTimer?: number;
  crumbleMax?: number;
  crumbleActive?: boolean;
}

export interface Hazard {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'spikes_up' | 'spikes_down' | 'spikes_left' | 'spikes_right' | 'laser' | 'lava';
  timer?: number;
}

export interface Collectible {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'coin' | 'gem' | 'heart' | 'power_star';
  value: number;
  collected: boolean;
  bobOffset: number;
}

export interface LevelGoal {
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  alpha: number;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  life: number;
}

export interface CosmeticItem {
  id: string;
  name: string;
  type: 'skin' | 'trail';
  price: number;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  glow?: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  rewardPoints: number;
  icon: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  rewardCoins: number;
  completed: boolean;
  claimed: boolean;
}

export interface DailyModifier {
  id: string;
  name: string;
  desc: string;
  gravityFactor: number;
  jumpFactor: number;
  speedFactor: number;
  rewardCoins: number;
}

export interface DailyChallengeData {
  date: string;
  seed: number;
  modifier: DailyModifier;
  targetScore: number;
  dailyBonusPoints: number;
}

export interface PushNotificationItem {
  id: string;
  title: string;
  body: string;
  tag: string;
  date: string;
  read: boolean;
  discountSkinId?: string;
  discountPercent?: number;
}

export interface LeaderboardEntry {
  id: string;
  userId: string;
  username: string;
  score: number;
  level: number;
  skinId: string;
  date: string;
}

export interface CloudSaveProfile {
  userId: string;
  username: string;
  coins: number;
  gems: number;
  totalScore: number;
  highScore: number;
  dailyHighScore: number;
  levelReached: number;
  unlockedSkins: string[];
  selectedSkin: string;
  unlockedTrails: string[];
  selectedTrail: string;
  achievements: Record<string, { unlocked: boolean; progress: number }>;
  quests: DailyQuest[];
  stats: {
    runsPlayed: number;
    enemiesStomped: number;
    totalJumps: number;
    wallJumps: number;
    dashesUsed: number;
    coinsCollected: number;
    gemsCollected: number;
    dailyChallengesCompleted: number;
  };
  controls: PlayerControls;
  touchSettings: TouchSettings;
  soundEnabled: boolean;
  musicEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
  lastDailyDate: string;
  lastSyncedAt?: string;
}
