// Procedural Level Generator for Pixel Leap 2D

import { BiomeType, Collectible, Enemy, Hazard, LevelGoal, Platform } from '../types';

// Deterministic PRNG
export class SeededRNG {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }

  public next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  public range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  public int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  public choice<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
}

export interface GeneratedLevel {
  levelNumber: number;
  biome: BiomeType;
  width: number;
  height: number;
  spawnX: number;
  spawnY: number;
  platforms: Platform[];
  hazards: Hazard[];
  enemies: Enemy[];
  collectibles: Collectible[];
  goal: LevelGoal;
}

export function generateLevel(levelNumber: number, customSeed?: number): GeneratedLevel {
  // Determine seed
  const seed = customSeed !== undefined ? customSeed : (levelNumber * 104729 + 7919);
  const rng = new SeededRNG(seed);

  // Biomes cycle
  const biomes: BiomeType[] = ['neon_city', 'crystal_caves', 'magma_ruins', 'cyber_spire'];
  const biome = biomes[(levelNumber - 1) % biomes.length];

  const platforms: Platform[] = [];
  const hazards: Hazard[] = [];
  const enemies: Enemy[] = [];
  const collectibles: Collectible[] = [];

  // Difficulty scale
  const difficulty = Math.min(10, 1 + (levelNumber - 1) * 0.7);
  const segmentsCount = 10 + Math.min(15, levelNumber * 2);

  // World dimensions
  const worldHeight = 600;
  let curX = 0;
  let curY = 440;

  // 1. Initial Safe Spawn Platform
  platforms.push({
    x: 0,
    y: 440,
    width: 220,
    height: 160,
    type: 'solid'
  });

  const spawnX = 60;
  const spawnY = 380;
  curX = 220;

  // 2. Generate Challenging Segments
  for (let s = 0; s < segmentsCount; s++) {
    const segmentType = rng.int(1, 6);

    switch (segmentType) {
      case 1: {
        // Flat gap with patrolling crawler or beetle
        const gap = rng.range(50, 90 + Math.min(40, difficulty * 4));
        curX += gap;
        const platWidth = rng.range(120, 200);
        platforms.push({
          x: curX,
          y: curY,
          width: platWidth,
          height: 160,
          type: 'solid'
        });

        // Add enemy on platform
        const isBeetle = difficulty >= 3 && rng.next() > 0.6;
        enemies.push({
          id: `e_${s}_1`,
          type: isBeetle ? 'beetle' : 'crawler',
          x: curX + 40,
          y: curY - 20,
          startX: curX + 40,
          width: 20,
          height: 16,
          vx: isBeetle ? 1.5 : 1.0,
          vy: 0,
          facing: 1,
          health: 1,
          maxHealth: 1,
          patrolMinX: curX + 10,
          patrolMaxX: curX + platWidth - 10,
          actionTimer: 0,
          state: 'patrol',
          isStompable: !isBeetle, // Beetles can't be stomped!
          points: isBeetle ? 250 : 100,
          coinsDrop: isBeetle ? 4 : 2,
          color: isBeetle ? '#d97706' : '#10b981'
        });

        // Coins over gap
        for (let c = 0; c < 3; c++) {
          collectibles.push({
            id: `c_${s}_${c}`,
            x: curX - gap + (gap / 4) * (c + 1),
            y: curY - 30 - Math.sin((c / 2) * Math.PI) * 25,
            width: 12,
            height: 12,
            type: 'coin',
            value: 10,
            collected: false,
            bobOffset: c
          });
        }

        curX += platWidth;
        break;
      }

      case 2: {
        // Vertical step with wall-jump opportunity
        const heightDelta = rng.choice([-70, -90, -110]);
        const gap = rng.range(40, 70);
        curX += gap;
        const nextY = Math.max(160, curY + heightDelta);
        const platWidth = rng.range(90, 150);

        // Wall platform
        platforms.push({
          x: curX,
          y: nextY,
          width: platWidth,
          height: worldHeight - nextY,
          type: 'solid'
        });

        // Flying bat enemy guarding the height
        if (rng.next() > 0.4) {
          enemies.push({
            id: `e_${s}_bat`,
            type: 'bat',
            x: curX - 30,
            y: nextY - 40,
            startX: curX - 30,
            width: 22,
            height: 16,
            vx: 1.2,
            vy: 0,
            facing: -1,
            health: 1,
            maxHealth: 1,
            patrolMinX: curX - 100,
            patrolMaxX: curX + 50,
            actionTimer: rng.int(0, 50),
            state: 'swoop',
            isStompable: true,
            points: 200,
            coinsDrop: 3,
            color: '#be123c'
          });
        }

        curY = nextY;
        curX += platWidth;
        break;
      }

      case 3: {
        // Crumbling bridges & precision jumps
        const numCrumble = rng.int(2, 3 + Math.min(2, Math.floor(difficulty / 3)));
        for (let i = 0; i < numCrumble; i++) {
          curX += rng.range(45, 65);
          const cWidth = rng.range(45, 65);
          const cY = curY + rng.range(-30, 20);
          platforms.push({
            x: curX,
            y: cY,
            width: cWidth,
            height: 16,
            type: 'crumble',
            crumbleTimer: 35,
            crumbleMax: 35,
            crumbleActive: false
          });

          // Single coin on each crumble block
          collectibles.push({
            id: `c_cr_${s}_${i}`,
            x: curX + cWidth / 2 - 6,
            y: cY - 22,
            width: 12,
            height: 12,
            type: 'coin',
            value: 15,
            collected: false,
            bobOffset: i
          });

          curX += cWidth;
          curY = cY;
        }

        // Spikes pit below crumbling platforms
        hazards.push({
          x: curX - numCrumble * 80,
          y: worldHeight - 30,
          width: numCrumble * 80 + 100,
          height: 30,
          type: biome === 'magma_ruins' ? 'lava' : 'spikes_up'
        });
        break;
      }

      case 4: {
        // Moving platform over hazard chasm
        const gap = rng.range(160, 240);
        const movingPlatWidth = rng.range(70, 95);
        const startMoveX = curX + 30;

        platforms.push({
          x: startMoveX,
          y: curY - 10,
          width: movingPlatWidth,
          height: 18,
          type: 'moving',
          movingVx: rng.choice([-1.5, 1.5]),
          minX: curX + 20,
          maxX: curX + gap - 20
        });

        // Hazard below
        hazards.push({
          x: curX,
          y: worldHeight - 35,
          width: gap + 80,
          height: 35,
          type: 'spikes_up'
        });

        // Floating eye shooter turret
        if (difficulty >= 2) {
          enemies.push({
            id: `e_${s}_shooter`,
            type: 'shooter',
            x: curX + gap / 2,
            y: curY - 90,
            startX: curX + gap / 2,
            width: 22,
            height: 22,
            vx: 0,
            vy: 0,
            facing: -1,
            health: 1,
            maxHealth: 1,
            patrolMinX: curX,
            patrolMaxX: curX + gap,
            actionTimer: 0,
            state: 'aim',
            isStompable: true,
            points: 300,
            coinsDrop: 4,
            color: '#475569'
          });
        }

        curX += gap;
        // Landing platform
        const landWidth = 120;
        platforms.push({
          x: curX,
          y: curY,
          width: landWidth,
          height: 160,
          type: 'solid'
        });
        curX += landWidth;
        break;
      }

      case 5: {
        // Trampoline bounce pad with secret diamond gem high in the sky
        const springX = curX + 30;
        platforms.push({
          x: curX,
          y: curY,
          width: 80,
          height: 140,
          type: 'solid'
        });

        platforms.push({
          x: springX + 20,
          y: curY - 12,
          width: 32,
          height: 14,
          type: 'spring'
        });

        // Secret High Gem
        collectibles.push({
          id: `gem_${s}`,
          x: springX + 30,
          y: curY - 180,
          width: 16,
          height: 16,
          type: 'gem',
          value: 100,
          collected: false,
          bobOffset: 0
        });

        curX += 130;
        // Upper or lower route
        curY = Math.min(460, Math.max(220, curY + rng.range(-60, 60)));
        platforms.push({
          x: curX,
          y: curY,
          width: 140,
          height: 160,
          type: 'solid'
        });
        curX += 140;
        break;
      }

      case 6: {
        // Ghost phantasm encounter in claustrophobic corridor
        const platWidth = 180;
        platforms.push({
          x: curX + 30,
          y: curY,
          width: platWidth,
          height: 160,
          type: 'solid'
        });

        // Overhead ceiling platform to force ground navigation
        platforms.push({
          x: curX + 50,
          y: curY - 80,
          width: platWidth - 40,
          height: 20,
          type: 'solid'
        });

        if (difficulty >= 3) {
          enemies.push({
            id: `e_${s}_ghost`,
            type: 'phantasm',
            x: curX + platWidth - 20,
            y: curY - 45,
            startX: curX + platWidth - 20,
            width: 22,
            height: 24,
            vx: -0.8,
            vy: 0,
            facing: -1,
            health: 1,
            maxHealth: 1,
            patrolMinX: curX + 20,
            patrolMaxX: curX + platWidth + 40,
            actionTimer: 0,
            state: 'stalk',
            isStompable: true,
            points: 350,
            coinsDrop: 5,
            color: '#9333ea'
          });
        }

        // Heart recovery pickup
        if (rng.next() > 0.7) {
          collectibles.push({
            id: `heart_${s}`,
            x: curX + platWidth / 2,
            y: curY - 24,
            width: 14,
            height: 14,
            type: 'heart',
            value: 1,
            collected: false,
            bobOffset: 0
          });
        }

        curX += platWidth + 30;
        break;
      }
    }
  }

  // 3. Final Goal Platform & Portal
  curX += 60;
  const goalPlatWidth = 220;
  platforms.push({
    x: curX,
    y: curY,
    width: goalPlatWidth,
    height: 160,
    type: 'solid'
  });

  const goal: LevelGoal = {
    x: curX + goalPlatWidth / 2 - 16,
    y: curY - 50,
    width: 32,
    height: 50,
    active: true
  };

  const totalWidth = curX + goalPlatWidth + 100;

  return {
    levelNumber,
    biome,
    width: totalWidth,
    height: worldHeight,
    spawnX,
    spawnY,
    platforms,
    hazards,
    enemies,
    collectibles,
    goal
  };
}
