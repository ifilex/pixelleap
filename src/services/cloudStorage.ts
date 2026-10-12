// Cloud Save & Profile Storage Service for Pixel Leap 2D

import { Achievement, CloudSaveProfile, CosmeticItem, DailyChallengeData, DailyQuest, LeaderboardEntry, PushNotificationItem } from '../types';

const STORAGE_KEY = 'pixelleap_cloud_profile_v1';

export const COSMETIC_CATALOG: CosmeticItem[] = [
  {
    id: 'default_blue',
    name: 'Pixel Bob',
    type: 'skin',
    price: 0,
    description: 'El clásico héroe de 8 bits con gorra roja y overol azul.',
    primaryColor: '#3b82f6',
    secondaryColor: '#ef4444',
    rarity: 'common'
  },
  {
    id: 'retro_boy',
    name: 'Retro Boy 1989',
    type: 'skin',
    price: 350,
    description: 'Nostalgia pura en 4 tonos de verde estilo portátil clásica.',
    primaryColor: '#8bac0f',
    secondaryColor: '#306230',
    rarity: 'common'
  },
  {
    id: 'cyber_ronin',
    name: 'Cyber Ronin',
    type: 'skin',
    price: 650,
    description: 'Guerrero futurista con visor neón y katana cibernética.',
    primaryColor: '#00f0ff',
    secondaryColor: '#ff007f',
    rarity: 'rare',
    glow: true
  },
  {
    id: 'slime_suit',
    name: 'Traje de Slime',
    type: 'skin',
    price: 800,
    description: 'Biomasa gelatinosa ultrarrebotante con núcleo radioactivo.',
    primaryColor: '#22c55e',
    secondaryColor: '#86efac',
    rarity: 'rare'
  },
  {
    id: 'shadow_ninja',
    name: 'Ninja Umbrío',
    type: 'skin',
    price: 950,
    description: 'Asesino de las sombras que deja una estela de humo oscuro.',
    primaryColor: '#111827',
    secondaryColor: '#ef4444',
    rarity: 'epic',
    glow: true
  },
  {
    id: 'solar_valkyrie',
    name: 'Valquiria Solar',
    type: 'skin',
    price: 1300,
    description: 'Armadura dorada bendecida con el poder del sol naciente.',
    primaryColor: '#eab308',
    secondaryColor: '#fef08a',
    rarity: 'epic',
    glow: true
  },
  {
    id: 'chrono_glitcher',
    name: 'Chrono Glitcher',
    type: 'skin',
    price: 1600,
    description: 'Viajero interdimensional con aberración cromática en tiempo real.',
    primaryColor: '#06b6d4',
    secondaryColor: '#ec4899',
    rarity: 'legendary',
    glow: true
  },
  {
    id: 'void_phantasm',
    name: 'Espectro del Vacío',
    type: 'skin',
    price: 2000,
    description: 'Entidad cósmica incorpórea que flota desafiando la gravedad.',
    primaryColor: '#a855f7',
    secondaryColor: '#c084fc',
    rarity: 'legendary',
    glow: true
  }
];

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_jump',
    title: 'Primer Gran Salto',
    description: 'Realiza 20 saltos en el juego.',
    rewardPoints: 100,
    icon: '🦘',
    unlocked: false,
    progress: 0,
    maxProgress: 20
  },
  {
    id: 'wall_master',
    title: 'Acróbata Vertical',
    description: 'Ejecuta 15 saltos en la pared (Wall-Jumps).',
    rewardPoints: 200,
    icon: '🧗',
    unlocked: false,
    progress: 0,
    maxProgress: 15
  },
  {
    id: 'stomp_champ',
    title: 'Pisotón Letal',
    description: 'Aplasta a 10 enemigos desde el aire.',
    rewardPoints: 250,
    icon: '👞',
    unlocked: false,
    progress: 0,
    maxProgress: 10
  },
  {
    id: 'dash_blade',
    title: 'Ráfaga de Viento',
    description: 'Realiza 25 air-dashes.',
    rewardPoints: 150,
    icon: '💨',
    unlocked: false,
    progress: 0,
    maxProgress: 25
  },
  {
    id: 'coin_hoarder',
    title: 'Bolsillos Llenos',
    description: 'Recolecta 200 monedas en total.',
    rewardPoints: 300,
    icon: '🪙',
    unlocked: false,
    progress: 0,
    maxProgress: 200
  },
  {
    id: 'gem_hunter',
    title: 'Coleccionista Cósmico',
    description: 'Consigue 5 gemas secretas.',
    rewardPoints: 400,
    icon: '💎',
    unlocked: false,
    progress: 0,
    maxProgress: 5
  },
  {
    id: 'fashion_icon',
    title: 'Ícono del Estilo',
    description: 'Desbloquea al menos 2 aspectos cosméticos.',
    rewardPoints: 350,
    icon: '👑',
    unlocked: false,
    progress: 1,
    maxProgress: 2
  }
];

export const INITIAL_QUESTS: DailyQuest[] = [
  {
    id: 'q_coins',
    title: 'Recolector Experto',
    description: 'Recoge 60 monedas durante tus partidas.',
    target: 60,
    current: 0,
    rewardCoins: 120,
    completed: false,
    claimed: false
  },
  {
    id: 'q_stomps',
    title: 'Castigo Aéreo',
    description: 'Elimina 4 enemigos usando el pisotón hacia abajo.',
    target: 4,
    current: 0,
    rewardCoins: 150,
    completed: false,
    claimed: false
  },
  {
    id: 'q_dashes',
    title: 'Maniobra Evasiva',
    description: 'Utiliza el Dash 12 veces.',
    target: 12,
    current: 0,
    rewardCoins: 100,
    completed: false,
    claimed: false
  }
];

export class CloudStorageService {
  private static instance: CloudStorageService;
  private profile: CloudSaveProfile;
  public isCloudSynced: boolean = false;
  public syncMessage: string = 'Local';

  private constructor() {
    this.profile = this.loadLocalProfile();
    // Attempt auto-sync with server
    this.syncWithCloud();
  }

  public static getInstance(): CloudStorageService {
    if (!CloudStorageService.instance) {
      CloudStorageService.instance = new CloudStorageService();
    }
    return CloudStorageService.instance;
  }

  private generateUserId(): string {
    return 'px_' + Math.random().toString(36).substring(2, 8) + Math.random().toString(36).substring(2, 6);
  }

  private loadLocalProfile(): CloudSaveProfile {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure missing fields are preserved
        return {
          ...this.getDefaultProfile(),
          ...parsed,
          achievements: parsed.achievements || {},
          quests: parsed.quests || INITIAL_QUESTS,
        };
      }
    } catch (e) {
      console.warn('Could not read localStorage', e);
    }
    const def = this.getDefaultProfile();
    this.saveLocalProfile(def);
    return def;
  }

  public getDefaultProfile(): CloudSaveProfile {
    return {
      userId: this.generateUserId(),
      username: 'Saltador_' + Math.floor(Math.random() * 900 + 100),
      coins: 200, // Initial balance to help start
      gems: 2,
      totalScore: 0,
      highScore: 0,
      dailyHighScore: 0,
      levelReached: 1,
      unlockedSkins: ['default_blue'],
      selectedSkin: 'default_blue',
      unlockedTrails: ['default'],
      selectedTrail: 'default',
      achievements: {},
      quests: [...INITIAL_QUESTS],
      stats: {
        runsPlayed: 0,
        enemiesStomped: 0,
        totalJumps: 0,
        wallJumps: 0,
        dashesUsed: 0,
        coinsCollected: 0,
        gemsCollected: 0,
        dailyChallengesCompleted: 0
      },
      controls: {
        left: 'ArrowLeft',
        right: 'ArrowRight',
        jump: 'Space',
        dash: 'KeyZ',
        stomp: 'ArrowDown',
        pause: 'Escape'
      },
      touchSettings: {
        enabled: true,
        opacity: 0.35, // Transparent by default
        controlType: 'joystick',
        haptics: true,
        swapSides: false,
        buttonScale: 1.0
      },
      soundEnabled: true,
      musicEnabled: true,
      musicVolume: 0.6,
      sfxVolume: 0.7,
      lastDailyDate: new Date().toISOString().split('T')[0]
    };
  }

  public getProfile(): CloudSaveProfile {
    return this.profile;
  }

  public saveLocalProfile(profile: CloudSaveProfile) {
    this.profile = profile;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.warn('Failed saving to localStorage', e);
    }
  }

  // -------------------------------------------------------------
  // Cloud Sync
  // -------------------------------------------------------------
  public async syncWithCloud(): Promise<boolean> {
    try {
      const res = await fetch('/api/cloud-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.profile.userId,
          profileData: this.profile
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          this.isCloudSynced = true;
          this.syncMessage = 'Nube Sincronizada';
          this.profile.lastSyncedAt = json.lastSyncedAt;
          this.saveLocalProfile(this.profile);
          return true;
        }
      }
    } catch {
      // Server down or offline
    }
    this.isCloudSynced = false;
    this.syncMessage = 'Guardado Local';
    return false;
  }

  public async restoreFromCloud(userId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/cloud-save/${userId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.save) {
          this.profile = {
            ...this.getDefaultProfile(),
            ...json.save,
            userId // keep restored ID
          };
          this.saveLocalProfile(this.profile);
          this.isCloudSynced = true;
          this.syncMessage = 'Restaurado de Nube';
          return true;
        }
      }
    } catch (e) {
      console.error('Failed to restore from cloud', e);
    }
    return false;
  }

  // -------------------------------------------------------------
  // Leaderboards
  // -------------------------------------------------------------
  public async getLeaderboard(mode: 'global' | 'daily' = 'global', date?: string): Promise<LeaderboardEntry[]> {
    try {
      const url = `/api/leaderboard?mode=${mode}${date ? `&date=${date}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.leaderboard)) {
          return json.leaderboard;
        }
      }
    } catch (e) {
      console.warn('Leaderboard fetch failed, using fallback', e);
    }

    // Fallback if offline
    return [
      { id: '1', userId: 'usr1', username: 'NeonMaster', score: 9800, level: 8, skinId: 'cyber_ronin', date: '2026-09-20' },
      { id: '2', userId: 'usr2', username: 'PixelNinja', score: 7600, level: 6, skinId: 'shadow_ninja', date: '2026-09-20' },
      { id: '3', userId: this.profile.userId, username: this.profile.username, score: this.profile.highScore, level: this.profile.levelReached, skinId: this.profile.selectedSkin, date: '2026-09-20' }
    ];
  }

  public async submitScore(score: number, level: number, mode: 'global' | 'daily' = 'global'): Promise<boolean> {
    try {
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.profile.userId,
          username: this.profile.username,
          score,
          level,
          skinId: this.profile.selectedSkin,
          mode,
          date: new Date().toISOString().split('T')[0]
        })
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  // -------------------------------------------------------------
  // Daily Challenge
  // -------------------------------------------------------------
  public async getDailyChallenge(): Promise<DailyChallengeData> {
    const today = new Date().toISOString().split('T')[0];
    try {
      const res = await fetch('/api/daily-challenge');
      if (res.ok) {
        const json = await res.json();
        return json;
      }
    } catch (e) {
      console.warn('Using local daily challenge generator', e);
    }

    // Local deterministic fallback
    return {
      date: today,
      seed: 847291,
      modifier: {
        id: 'low_gravity',
        name: 'Gravedad Lunar',
        desc: 'Tus saltos son un 30% más altos y flotas suavemente.',
        gravityFactor: 0.65,
        jumpFactor: 1.15,
        speedFactor: 1.0,
        rewardCoins: 350
      },
      targetScore: 3000,
      dailyBonusPoints: 250
    };
  }

  // -------------------------------------------------------------
  // Push Notifications & Events
  // -------------------------------------------------------------
  public async getPushEvents(): Promise<PushNotificationItem[]> {
    try {
      const res = await fetch('/api/push-events');
      if (res.ok) {
        const json = await res.json();
        if (json.events) {
          return json.events.map((e: any) => ({ ...e, read: false }));
        }
      }
    } catch {}

    return [
      {
        id: 'ev1',
        title: '🔥 ¡Oferta Relámpago en Aspecto!',
        body: 'El aspecto Cyber Ronin tiene 30% de descuento por tiempo limitado.',
        tag: 'OFERTA LIMITADA',
        date: new Date().toISOString(),
        read: false,
        discountSkinId: 'cyber_ronin',
        discountPercent: 30
      },
      {
        id: 'ev2',
        title: '🏆 Desafío Diario Disponible',
        body: 'Compite en el circuito global de hoy y llévate gemas cósmicas extra.',
        tag: 'DESAFÍO',
        date: new Date().toISOString(),
        read: false
      }
    ];
  }

  public async requestPushPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }
    if (Notification.permission === 'granted') {
      return true;
    }
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  public triggerNativeNotification(title: string, body: string) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
        });
      } catch {}
    }
  }

  // -------------------------------------------------------------
  // Quests & Achievements Tracker
  // -------------------------------------------------------------
  public recordStat(statKey: keyof CloudSaveProfile['stats'], amount: number) {
    this.profile.stats[statKey] += amount;

    // Update Quests
    for (const q of this.profile.quests) {
      if (!q.completed) {
        if (statKey === 'coinsCollected' && q.id === 'q_coins') {
          q.current = Math.min(q.target, q.current + amount);
        } else if (statKey === 'enemiesStomped' && q.id === 'q_stomps') {
          q.current = Math.min(q.target, q.current + amount);
        } else if (statKey === 'dashesUsed' && q.id === 'q_dashes') {
          q.current = Math.min(q.target, q.current + amount);
        }
        if (q.current >= q.target) {
          q.completed = true;
          this.triggerNativeNotification('¡Misión Completada!', `Has completado "${q.title}". Reclama tus monedas en el menú.`);
        }
      }
    }

    this.saveLocalProfile(this.profile);
  }

  public claimQuestReward(questId: string): number {
    const q = this.profile.quests.find((x) => x.id === questId);
    if (q && q.completed && !q.claimed) {
      q.claimed = true;
      this.profile.coins += q.rewardCoins;
      this.saveLocalProfile(this.profile);
      this.syncWithCloud();
      return q.rewardCoins;
    }
    return 0;
  }

  public buyCosmetic(cosmeticId: string): boolean {
    const item = COSMETIC_CATALOG.find((c) => c.id === cosmeticId);
    if (!item) return false;

    if (this.profile.unlockedSkins.includes(cosmeticId)) {
      this.profile.selectedSkin = cosmeticId;
      this.saveLocalProfile(this.profile);
      return true;
    }

    if (this.profile.coins >= item.price) {
      this.profile.coins -= item.price;
      this.profile.unlockedSkins.push(cosmeticId);
      this.profile.selectedSkin = cosmeticId;
      this.saveLocalProfile(this.profile);
      this.syncWithCloud();
      return true;
    }
    return false;
  }
}

export const cloudService = CloudStorageService.getInstance();
