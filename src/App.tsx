/**
 * Pixel Leap 2D - Procedural Pixel Platformer
 * Main Game Controller and Application Viewport
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { sound } from './audio/soundEngine';
import { AchievementsModal } from './components/AchievementsModal';
import { ControlsModal } from './components/ControlsModal';
import { DailyChallengeBanner } from './components/DailyChallengeBanner';
import { GameOverlayModal } from './components/GameOverlayModal';
import { HUD } from './components/HUD';
import { LeaderboardModal } from './components/LeaderboardModal';
import { NotificationsDrawer } from './components/NotificationsDrawer';
import { ShopModal } from './components/ShopModal';
import { TouchControls } from './components/TouchControls';
import { GameEngine } from './game/gameEngine';
import { generateLevel, GeneratedLevel } from './game/levelGenerator';
import { PixelRenderer } from './game/pixelSprites';
import { cloudService } from './services/cloudStorage';
import {
  Achievement,
  CloudSaveProfile,
  DailyChallengeData,
  DailyModifier,
  DailyQuest,
  PlayerControls,
  PushNotificationItem,
  TouchSettings
} from './types';

export default function App() {
  const [profile, setProfile] = useState<CloudSaveProfile>(() => cloudService.getProfile());
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'game_over' | 'level_complete'>('menu');
  const [levelNumber, setLevelNumber] = useState(1);
  const [isDailyChallenge, setIsDailyChallenge] = useState(false);
  const [dailyData, setDailyData] = useState<DailyChallengeData | null>(null);
  const [notifications, setNotifications] = useState<PushNotificationItem[]>([]);
  const [isTouchDetected, setIsTouchDetected] = useState(false);

  // Active Modals
  const [showShop, setShowShop] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Canvas & Game Loop Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const levelRef = useRef<GeneratedLevel | null>(null);
  const reqAnimRef = useRef<number>(0);

  // Inputs state
  const inputsRef = useRef({
    left: false,
    right: false,
    jumpDown: false,
    jumpPressed: false,
    dashPressed: false,
    stompPressed: false,
  });

  // Touch device detection on mount
  useEffect(() => {
    const hasTouch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches;
    setIsTouchDetected(hasTouch);

    // Fetch daily challenge & push events
    cloudService.getDailyChallenge().then(setDailyData);
    cloudService.getPushEvents().then(setNotifications);

    // Restore sound preferences
    sound.toggleMusic(profile.musicEnabled);
    sound.toggleSfx(profile.soundEnabled);
    sound.setMusicVolume(profile.musicVolume);
    sound.setSfxVolume(profile.sfxVolume);
  }, []);

  // Sync profile updates to state and localStorage
  const updateProfile = useCallback((updater: (prev: CloudSaveProfile) => CloudSaveProfile) => {
    setProfile((prev) => {
      const next = updater(prev);
      cloudService.saveLocalProfile(next);
      return next;
    });
  }, []);

  // -------------------------------------------------------------
  // Keyboard Event Handlers
  // -------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if inside an input field
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      const c = profile.controls;

      if (e.code === c.left) {
        inputsRef.current.left = true;
      } else if (e.code === c.right) {
        inputsRef.current.right = true;
      } else if (e.code === c.jump) {
        if (!inputsRef.current.jumpDown) {
          inputsRef.current.jumpPressed = true;
        }
        inputsRef.current.jumpDown = true;
      } else if (e.code === c.dash) {
        inputsRef.current.dashPressed = true;
      } else if (e.code === c.stomp) {
        inputsRef.current.stompPressed = true;
      } else if (e.code === c.pause) {
        if (gameState === 'playing') {
          pauseGame();
        } else if (gameState === 'paused') {
          resumeGame();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const c = profile.controls;
      if (e.code === c.left) inputsRef.current.left = false;
      if (e.code === c.right) inputsRef.current.right = false;
      if (e.code === c.jump) inputsRef.current.jumpDown = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [profile.controls, gameState]);

  // -------------------------------------------------------------
  // Game Initialization & Lifecycle
  // -------------------------------------------------------------
  const startGame = (daily: boolean = false, startLvl: number = 1) => {
    setIsDailyChallenge(daily);
    setLevelNumber(startLvl);

    const modifier: DailyModifier | undefined = daily && dailyData ? dailyData.modifier : undefined;
    const customSeed = daily && dailyData ? dailyData.seed : undefined;
    const lvl = generateLevel(startLvl, customSeed);
    levelRef.current = lvl;

    const engine = new GameEngine(
      lvl,
      profile.selectedSkin,
      profile.selectedTrail,
      {
        onScoreGained: (_amt, _reason) => {},
        onCoinCollected: (amt) => {
          updateProfile((p) => ({
            ...p,
            coins: p.coins + amt,
            stats: { ...p.stats, coinsCollected: p.stats.coinsCollected + amt }
          }));
          cloudService.recordStat('coinsCollected', amt);
        },
        onGemCollected: (amt) => {
          updateProfile((p) => ({
            ...p,
            gems: p.gems + amt,
            stats: { ...p.stats, gemsCollected: p.stats.gemsCollected + amt }
          }));
          cloudService.recordStat('gemsCollected', amt);
        },
        onHeartCollected: () => {},
        onEnemyDefeated: (_enemy) => {
          updateProfile((p) => ({
            ...p,
            stats: { ...p.stats, enemiesStomped: p.stats.enemiesStomped + 1 }
          }));
          cloudService.recordStat('enemiesStomped', 1);
        },
        onPlayerDamaged: () => {},
        onPlayerDied: () => {
          setGameState('game_over');
          sound.setTension(0);

          // Handle High Scores & Cloud Leaderboards
          if (engineRef.current) {
            const finalScore = engineRef.current.score;
            const finalLvl = levelRef.current?.levelNumber || 1;

            updateProfile((p) => ({
              ...p,
              highScore: Math.max(p.highScore, finalScore),
              dailyHighScore: daily ? Math.max(p.dailyHighScore, finalScore) : p.dailyHighScore,
              totalScore: p.totalScore + finalScore,
              stats: { ...p.stats, runsPlayed: p.stats.runsPlayed + 1 }
            }));

            // Submit to cloud leaderboard
            cloudService.submitScore(finalScore, finalLvl, daily ? 'daily' : 'global');
            cloudService.syncWithCloud();
          }
        },
        onLevelComplete: () => {
          setGameState('level_complete');
          sound.setTension(0);

          if (engineRef.current) {
            const finalScore = engineRef.current.score;
            const lvlNum = levelRef.current?.levelNumber || 1;
            updateProfile((p) => ({
              ...p,
              levelReached: Math.max(p.levelReached, lvlNum + 1),
              highScore: Math.max(p.highScore, finalScore),
              coins: p.coins + (lvlNum * 50)
            }));
            cloudService.syncWithCloud();
          }
        },
        onAchievementProgress: (type, val) => {
          if (type === 'jump') cloudService.recordStat('totalJumps', val);
          if (type === 'wallJump') cloudService.recordStat('wallJumps', val);
          if (type === 'dash') cloudService.recordStat('dashesUsed', val);
          if (type === 'stomp') cloudService.recordStat('enemiesStomped', val);
        }
      },
      modifier
    );

    engineRef.current = engine;
    setGameState('playing');
    sound.startDynamicMusic();
  };

  const nextLevel = () => {
    const nextLvl = levelNumber + 1;
    setLevelNumber(nextLvl);
    const lvl = generateLevel(nextLvl);
    levelRef.current = lvl;

    if (engineRef.current) {
      // Carry over score, coins, gems & health
      const prevScore = engineRef.current.score;
      const prevCoins = engineRef.current.coins;
      const prevGems = engineRef.current.gems;
      const prevHealth = engineRef.current.player.health;

      engineRef.current = new GameEngine(
        lvl,
        profile.selectedSkin,
        profile.selectedTrail,
        engineRef.current['events'],
        isDailyChallenge && dailyData ? dailyData.modifier : undefined
      );

      engineRef.current.score = prevScore;
      engineRef.current.coins = prevCoins;
      engineRef.current.gems = prevGems;
      engineRef.current.player.health = prevHealth;
    }

    setGameState('playing');
    sound.startDynamicMusic();
  };

  const pauseGame = () => {
    setGameState('paused');
    sound.stopDynamicMusic();
  };

  const resumeGame = () => {
    setGameState('playing');
    sound.startDynamicMusic();
  };

  // -------------------------------------------------------------
  // Main Canvas Render & Physics Loop
  // -------------------------------------------------------------
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (time: number) => {
      reqAnimRef.current = requestAnimationFrame(loop);
      const dt = Math.min(50, time - lastTime);
      lastTime = time;

      const engine = engineRef.current;
      const canvas = canvasRef.current;
      if (!engine || !canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Update Game Physics if playing
      if (gameState === 'playing') {
        engine.update(inputsRef.current);
        // Clear momentary pressed flags
        inputsRef.current.jumpPressed = false;
        inputsRef.current.dashPressed = false;
        inputsRef.current.stompPressed = false;
      }

      // 2. Render Scene
      const width = canvas.width;
      const height = canvas.height;
      const camX = engine.cameraX;
      const shake = engine.screenShake;
      const shakeX = shake > 0 ? (Math.random() * 2 - 1) * shake : 0;
      const shakeY = shake > 0 ? (Math.random() * 2 - 1) * shake : 0;

      ctx.save();
      ctx.clearRect(0, 0, width, height);

      // Background Gradient
      const biomeInfo = PixelRenderer.biomes[engine.level.biome];
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, biomeInfo.bgTop);
      bgGrad.addColorStop(1, biomeInfo.bgBottom);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Parallax Grid / Pixel Stars in background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      const starSpacing = 48;
      const starOffset = (camX * 0.2) % starSpacing;
      for (let sx = -starOffset; sx < width; sx += starSpacing) {
        for (let sy = 20; sy < height - 120; sy += 42) {
          ctx.fillRect(Math.round(sx), sy, 2, 2);
        }
      }

      // Translate Camera
      ctx.translate(Math.round(-camX + shakeX), Math.round(shakeY));

      // Draw Platforms
      for (const plat of engine.level.platforms) {
        PixelRenderer.drawPlatform(ctx, plat, engine.level.biome);
      }

      // Draw Hazards
      for (const haz of engine.level.hazards) {
        PixelRenderer.drawHazard(ctx, haz);
      }

      // Draw Collectibles
      for (const item of engine.level.collectibles) {
        item.bobOffset += 0.06;
        PixelRenderer.drawCollectible(ctx, item);
      }

      // Draw Goal Portal
      PixelRenderer.drawGoal(ctx, engine.level.goal, time);

      // Draw Enemies
      for (const enemy of engine.level.enemies) {
        PixelRenderer.drawEnemy(ctx, enemy);
      }

      // Draw Projectiles
      for (const proj of engine.projectiles) {
        PixelRenderer.drawProjectile(ctx, proj);
      }

      // Draw Particles & Floating Text
      PixelRenderer.drawParticles(ctx, engine.particles);
      PixelRenderer.drawFloatingTexts(ctx, engine.floatingTexts);

      // Draw Player
      PixelRenderer.drawPlayer(ctx, engine.player);

      ctx.restore();
    };

    reqAnimRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(reqAnimRef.current);
  }, [gameState]);

  // -------------------------------------------------------------
  // Touch Inputs Receiver
  // -------------------------------------------------------------
  const handleTouchInput = (touchInputs: {
    left: boolean;
    right: boolean;
    jumpDown: boolean;
    jumpPressed: boolean;
    dashPressed: boolean;
    stompPressed: boolean;
  }) => {
    inputsRef.current.left = touchInputs.left;
    inputsRef.current.right = touchInputs.right;
    inputsRef.current.jumpDown = touchInputs.jumpDown;
    if (touchInputs.jumpPressed) inputsRef.current.jumpPressed = true;
    if (touchInputs.dashPressed) inputsRef.current.dashPressed = true;
    if (touchInputs.stompPressed) inputsRef.current.stompPressed = true;
  };

  // Helper for Sound toggles
  const handleToggleSound = () => {
    const next = !profile.soundEnabled;
    sound.toggleSfx(next);
    updateProfile((p) => ({ ...p, soundEnabled: next }));
  };

  const handleToggleMusic = () => {
    const next = !profile.musicEnabled;
    sound.toggleMusic(next);
    updateProfile((p) => ({ ...p, musicEnabled: next }));
  };

  const currentLevelBiome = levelRef.current
    ? PixelRenderer.biomes[levelRef.current.biome].name
    : 'Ciudad Neón';

  return (
    <div className="relative w-full h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center overflow-hidden font-pixel">
      
      {/* Retro scanline overlay for genuine arcade feel */}
      <div className="arcade-scanlines absolute inset-0 z-10 pointer-events-none" />

      {/* Main Game Screen Canvas Container */}
      <div className="relative w-full max-w-5xl h-full max-h-[700px] flex items-center justify-center overflow-hidden border-y sm:border-2 border-slate-800 bg-slate-950 sm:rounded-2xl shadow-2xl">
        
        {/* HTML5 Game Canvas */}
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          className="w-full h-full object-contain pixel-art bg-slate-950"
        />

        {/* HUD Overlay (visible when playing or paused) */}
        {(gameState === 'playing' || gameState === 'paused') && engineRef.current && (
          <HUD
            health={engineRef.current.player.health}
            maxHealth={engineRef.current.player.maxHealth}
            score={engineRef.current.score}
            coins={profile.coins}
            gems={profile.gems}
            level={levelNumber}
            biomeName={currentLevelBiome}
            combo={engineRef.current.combo}
            isDailyChallenge={isDailyChallenge}
            dailyModifier={isDailyChallenge && dailyData ? dailyData.modifier : undefined}
            isTouchDetected={isTouchDetected}
            touchEnabled={profile.touchSettings.enabled}
            cloudSynced={cloudService.isCloudSynced}
            unreadNotificationsCount={notifications.filter((n) => !n.read).length}
            onToggleTouch={() => {
              updateProfile((p) => ({
                ...p,
                touchSettings: {
                  ...p.touchSettings,
                  enabled: !p.touchSettings.enabled
                }
              }));
            }}
            onTogglePause={() => {
              if (gameState === 'playing') pauseGame();
              else resumeGame();
            }}
            onOpenNotifications={() => setShowNotifications(true)}
            onOpenShop={() => setShowShop(true)}
          />
        )}

        {/* Transparent Touch & Joystick Controls (Only active when touch device is detected & enabled) */}
        {gameState === 'playing' && (
          <TouchControls
            settings={profile.touchSettings}
            onInputState={handleTouchInput}
          />
        )}

        {/* Main Title Menu (when gameState === 'menu') */}
        {gameState === 'menu' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xs select-none">
            <div className="text-center space-y-3 max-w-xl">
              <div className="inline-block px-3 py-1 bg-cyan-950/80 border border-cyan-500/60 rounded-full text-[8px] text-cyan-300 font-bold mb-1">
                ⭐ PLATAFORMAS 2D PROCEDURAL CON ARTE PIXEL
              </div>

              <h1 className="text-2xl sm:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-300 font-bold tracking-tight drop-shadow-md">
                PIXEL LEAP 2D
              </h1>

              <p className="text-[9px] sm:text-[10px] text-slate-300 max-w-md mx-auto leading-relaxed">
                Niveles infinitos, saltos de pared acrobáticos, dash aéreo, banda sonora dinámica de tensión y enemigos únicos.
              </p>

              {/* Action Buttons */}
              <div className="pt-3 flex flex-col sm:flex-row gap-3 justify-center items-center">
                <button
                  id="menu-play-button"
                  onClick={() => {
                    sound.playClick();
                    startGame(false, 1);
                  }}
                  className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg hover:scale-102 active:scale-98 transition cursor-pointer"
                >
                  ▶ JUGAR MODO AVENTURA
                </button>

                <button
                  id="menu-shop-button"
                  onClick={() => {
                    sound.playClick();
                    setShowShop(true);
                  }}
                  className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 border border-amber-500/50 text-amber-300 font-bold text-xs rounded-xl shadow hover:border-amber-400 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  🛍️ TIENDA ({profile.coins} 🪙)
                </button>
              </div>

              {/* Daily Challenge Banner */}
              <div className="pt-2 w-full">
                <DailyChallengeBanner
                  data={dailyData}
                  dailyHighScore={profile.dailyHighScore}
                  onPlayDaily={() => startGame(true, 1)}
                />
              </div>

              {/* Secondary Navigation Row */}
              <div className="flex flex-wrap justify-center gap-2 pt-2 text-[8px]">
                <button
                  onClick={() => {
                    sound.playClick();
                    setShowLeaderboard(true);
                  }}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
                >
                  🏆 Clasificación Global
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    setShowAchievements(true);
                  }}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
                >
                  🎯 Misiones y Logros
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    setShowControls(true);
                  }}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
                >
                  ⚙️ Controles y Nube
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    setShowNotifications(true);
                  }}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
                >
                  🔔 Ofertas Push
                </button>
              </div>

              {/* Cloud Sync Footer Badge */}
              <div className="text-[7px] text-slate-500 pt-1 flex items-center justify-center gap-2">
                <span>{cloudService.isCloudSynced ? '☁️ Guardado en la nube sincronizado' : '💾 Guardado localmente'}</span>
                <span>•</span>
                <span>ID: {profile.userId}</span>
              </div>
            </div>
          </div>
        )}

        {/* Game Over, Paused, or Level Complete Modal */}
        {(gameState === 'game_over' || gameState === 'paused' || gameState === 'level_complete') && (
          <GameOverlayModal
            type={gameState}
            score={engineRef.current?.score || 0}
            coins={engineRef.current?.coins || 0}
            level={levelNumber}
            isDaily={isDailyChallenge}
            soundEnabled={profile.soundEnabled}
            musicEnabled={profile.musicEnabled}
            onToggleSound={handleToggleSound}
            onToggleMusic={handleToggleMusic}
            onResume={gameState === 'paused' ? resumeGame : undefined}
            onRestart={() => startGame(isDailyChallenge, isDailyChallenge ? 1 : levelNumber)}
            onNextLevel={gameState === 'level_complete' ? nextLevel : undefined}
            onOpenShop={() => setShowShop(true)}
            onOpenLeaderboard={() => setShowLeaderboard(true)}
            onOpenControls={() => setShowControls(true)}
          />
        )}

      </div>

      {/* Global Modals */}
      {showShop && (
        <ShopModal
          coins={profile.coins}
          gems={profile.gems}
          unlockedSkins={profile.unlockedSkins}
          selectedSkin={profile.selectedSkin}
          discountSkinId={notifications.find((n) => n.discountSkinId)?.discountSkinId}
          discountPercent={notifications.find((n) => n.discountPercent)?.discountPercent}
          onBuySkin={(skinId) => {
            const ok = cloudService.buyCosmetic(skinId);
            if (ok) {
              setProfile(cloudService.getProfile());
            }
            return ok;
          }}
          onEquipSkin={(skinId) => {
            cloudService.buyCosmetic(skinId);
            setProfile(cloudService.getProfile());
            if (engineRef.current) {
              engineRef.current.player.skinId = skinId;
            }
          }}
          onClose={() => setShowShop(false)}
        />
      )}

      {showLeaderboard && (
        <LeaderboardModal
          currentUserId={profile.userId}
          currentScore={engineRef.current?.score || profile.highScore}
          onClose={() => setShowLeaderboard(false)}
        />
      )}

      {showAchievements && (
        <AchievementsModal
          achievements={Object.keys(profile.achievements).length > 0 ? (profile.achievements as any) : [
            { id: 'first_jump', title: 'Primer Gran Salto', description: 'Realiza 20 saltos en el juego.', rewardPoints: 100, icon: '🦘', unlocked: profile.stats.totalJumps >= 20, progress: Math.min(20, profile.stats.totalJumps), maxProgress: 20 },
            { id: 'wall_master', title: 'Acróbata Vertical', description: 'Ejecuta 15 saltos en la pared.', rewardPoints: 200, icon: '🧗', unlocked: profile.stats.wallJumps >= 15, progress: Math.min(15, profile.stats.wallJumps), maxProgress: 15 },
            { id: 'stomp_champ', title: 'Pisotón Letal', description: 'Aplasta a 10 enemigos desde el aire.', rewardPoints: 250, icon: '👞', unlocked: profile.stats.enemiesStomped >= 10, progress: Math.min(10, profile.stats.enemiesStomped), maxProgress: 10 },
            { id: 'dash_blade', title: 'Ráfaga de Viento', description: 'Realiza 25 air-dashes.', rewardPoints: 150, icon: '💨', unlocked: profile.stats.dashesUsed >= 25, progress: Math.min(25, profile.stats.dashesUsed), maxProgress: 25 },
            { id: 'coin_hoarder', title: 'Bolsillos Llenos', description: 'Recolecta 200 monedas en total.', rewardPoints: 300, icon: '🪙', unlocked: profile.stats.coinsCollected >= 200, progress: Math.min(200, profile.stats.coinsCollected), maxProgress: 200 },
          ]}
          quests={profile.quests}
          onClaimQuest={(qId) => {
            const reward = cloudService.claimQuestReward(qId);
            if (reward > 0) {
              setProfile(cloudService.getProfile());
            }
          }}
          onClose={() => setShowAchievements(false)}
        />
      )}

      {showControls && (
        <ControlsModal
          controls={profile.controls}
          touchSettings={profile.touchSettings}
          isTouchDetected={isTouchDetected}
          userId={profile.userId}
          onSaveControls={(newControls: PlayerControls) => {
            updateProfile((p) => ({ ...p, controls: newControls }));
          }}
          onSaveTouchSettings={(newTouch: TouchSettings) => {
            updateProfile((p) => ({ ...p, touchSettings: newTouch }));
          }}
          onRestoreCloudSave={async (code: string) => {
            const ok = await cloudService.restoreFromCloud(code);
            if (ok) {
              setProfile(cloudService.getProfile());
            }
            return ok;
          }}
          onClose={() => setShowControls(false)}
        />
      )}

      {showNotifications && (
        <NotificationsDrawer
          notifications={notifications}
          onOpenShopWithDiscount={(_skinId) => {
            setShowNotifications(false);
            setShowShop(true);
          }}
          onClose={() => setShowNotifications(false)}
        />
      )}

    </div>
  );
}
