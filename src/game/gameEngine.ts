// Physics, Collisions, Mechanics & State Engine for Pixel Leap 2D

import { sound } from '../audio/soundEngine';
import { DailyModifier, Enemy, FloatingText, LevelGoal, Particle, PlayerState, Projectile } from '../types';
import { GeneratedLevel } from './levelGenerator';

export interface GameEngineEvents {
  onScoreGained: (amount: number, reason: string) => void;
  onCoinCollected: (amount: number) => void;
  onGemCollected: (amount: number) => void;
  onHeartCollected: () => void;
  onEnemyDefeated: (enemy: Enemy) => void;
  onPlayerDamaged: (currentHealth: number) => void;
  onPlayerDied: () => void;
  onLevelComplete: () => void;
  onAchievementProgress: (type: string, value: number) => void;
}

export class GameEngine {
  public player: PlayerState;
  public level: GeneratedLevel;
  public projectiles: Projectile[] = [];
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];
  public score: number = 0;
  public coins: number = 0;
  public gems: number = 0;
  public combo: number = 0;
  public comboTimer: number = 0;
  public screenShake: number = 0;
  public cameraX: number = 0;
  public cameraY: number = 0;
  public isGameOver: boolean = false;
  public isLevelFinished: boolean = false;
  
  // Custom modifiers (e.g. from Daily Challenge)
  public modifier?: DailyModifier;

  // Physics constants
  private readonly GRAVITY = 0.48;
  private readonly MAX_FALL = 11;
  private readonly RUN_ACCEL = 0.9;
  private readonly RUN_MAX_SPEED = 4.2;
  private readonly FRICTION = 0.82;
  private readonly JUMP_FORCE = -9.2;
  private readonly DOUBLE_JUMP_FORCE = -8.2;
  private readonly WALL_SLIDE_SPEED = 1.8;
  private readonly DASH_SPEED = 10.5;
  private readonly DASH_FRAMES = 11;
  private readonly DASH_COOLDOWN_FRAMES = 42;
  private readonly COYOTE_FRAMES = 6;
  private readonly JUMP_BUFFER_FRAMES = 7;

  private events: GameEngineEvents;

  constructor(level: GeneratedLevel, skinId: string, trailId: string, events: GameEngineEvents, modifier?: DailyModifier) {
    this.level = level;
    this.events = events;
    this.modifier = modifier;

    const initialHealth = modifier?.id === 'one_hit' ? 1 : 3;

    this.player = {
      x: level.spawnX,
      y: level.spawnY,
      vx: 0,
      vy: 0,
      width: 18,
      height: 26,
      grounded: false,
      jumping: false,
      coyoteTime: 0,
      jumpBuffer: 0,
      wallSliding: 0,
      wallJumpCooldown: 0,
      doubleJumpAvailable: true,
      dashTimer: 0,
      dashCooldown: 0,
      dashDirection: 1,
      stomping: false,
      facing: 1,
      health: initialHealth,
      maxHealth: initialHealth,
      invulnerableTimer: 0,
      animFrame: 0,
      animTimer: 0,
      state: 'idle',
      skinId,
      trailId
    };

    this.cameraX = this.player.x - 200;
  }

  public update(inputs: {
    left: boolean;
    right: boolean;
    jumpDown: boolean;
    jumpPressed: boolean;
    dashPressed: boolean;
    stompPressed: boolean;
  }) {
    if (this.isGameOver || this.isLevelFinished) return;

    const p = this.player;

    // Apply modifier multipliers
    const gravityMult = this.modifier?.gravityFactor ?? 1.0;
    const jumpMult = this.modifier?.jumpFactor ?? 1.0;
    const speedMult = this.modifier?.speedFactor ?? 1.0;

    // 1. Timers & Buffers
    if (p.invulnerableTimer > 0) p.invulnerableTimer--;
    if (p.dashCooldown > 0) p.dashCooldown--;
    if (p.wallJumpCooldown > 0) p.wallJumpCooldown--;
    if (p.coyoteTime > 0) p.coyoteTime--;
    if (p.jumpBuffer > 0) p.jumpBuffer--;

    if (inputs.jumpPressed) {
      p.jumpBuffer = this.JUMP_BUFFER_FRAMES;
    }

    // 2. Combo Timer
    if (this.comboTimer > 0) {
      this.comboTimer--;
      if (this.comboTimer === 0) {
        this.combo = 0;
      }
    }

    // 3. Screen shake decay
    if (this.screenShake > 0) {
      this.screenShake *= 0.88;
      if (this.screenShake < 0.2) this.screenShake = 0;
    }

    // 4. Dash Mechanic
    if (inputs.dashPressed && p.dashCooldown === 0 && p.dashTimer === 0) {
      p.dashTimer = this.DASH_FRAMES;
      p.dashCooldown = this.DASH_COOLDOWN_FRAMES;
      p.dashDirection = p.facing;
      p.vy = 0;
      p.stomping = false;
      sound.playDash();
      this.events.onAchievementProgress('dash', 1);

      // Dash trail burst
      this.addDashParticles(p.x + p.width / 2, p.y + p.height / 2, p.dashDirection);
    }

    if (p.dashTimer > 0) {
      p.dashTimer--;
      p.vx = p.dashDirection * this.DASH_SPEED * speedMult;
      p.vy = 0;
      p.state = 'dash';
      this.spawnTrailGhost();
    } else {
      // 5. Stomp Mechanic (Ground Pound)
      if (inputs.stompPressed && !p.grounded && !p.stomping) {
        p.stomping = true;
        p.vx = 0;
        p.vy = 12; // Fast plunge
        sound.playStomp();
      }

      // 6. Horizontal Movement
      if (p.wallJumpCooldown === 0 && !p.stomping) {
        if (inputs.left) {
          p.vx -= this.RUN_ACCEL * speedMult;
          p.facing = -1;
        } else if (inputs.right) {
          p.vx += this.RUN_ACCEL * speedMult;
          p.facing = 1;
        } else {
          p.vx *= this.FRICTION;
          if (Math.abs(p.vx) < 0.1) p.vx = 0;
        }

        const maxSpd = this.RUN_MAX_SPEED * speedMult;
        p.vx = Math.max(-maxSpd, Math.min(maxSpd, p.vx));
      }

      // 7. Wall Sliding & Wall Jumping
      if (p.wallSliding !== 0 && !p.grounded) {
        if (p.vy > this.WALL_SLIDE_SPEED) {
          p.vy = this.WALL_SLIDE_SPEED;
        }
        // Wall sparks
        if (Math.random() < 0.3) {
          this.particles.push({
            x: p.wallSliding === 1 ? p.x + p.width : p.x,
            y: p.y + p.height - 4,
            vx: -p.wallSliding * (Math.random() * 2),
            vy: -Math.random() * 2,
            size: 2,
            color: '#fef08a',
            life: 12,
            maxLife: 12,
            alpha: 1
          });
        }
      }

      // 8. Jump Execution (Buffered + Coyote + Wall Jump + Double Jump)
      if (p.jumpBuffer > 0) {
        if (p.grounded || p.coyoteTime > 0) {
          // Ground Jump
          p.vy = this.JUMP_FORCE * jumpMult;
          p.grounded = false;
          p.coyoteTime = 0;
          p.jumpBuffer = 0;
          p.jumping = true;
          sound.playJump();
          this.addJumpDust(p.x + p.width / 2, p.y + p.height);
          this.events.onAchievementProgress('jump', 1);
        } else if (p.wallSliding !== 0) {
          // Wall Jump: Kick off diagonally
          p.vy = this.JUMP_FORCE * 0.95 * jumpMult;
          p.vx = -p.wallSliding * (this.RUN_MAX_SPEED * 1.35 * speedMult);
          p.facing = (-p.wallSliding as -1 | 1);
          p.wallJumpCooldown = 12;
          p.wallSliding = 0;
          p.jumpBuffer = 0;
          p.doubleJumpAvailable = true;
          sound.playJump();
          this.addJumpDust(p.x + (p.facing === 1 ? 0 : p.width), p.y + p.height / 2);
          this.events.onAchievementProgress('wallJump', 1);
        } else if (p.doubleJumpAvailable && !p.stomping) {
          // Double Jump (Air jump)
          p.vy = this.DOUBLE_JUMP_FORCE * jumpMult;
          p.doubleJumpAvailable = false;
          p.jumpBuffer = 0;
          p.jumping = true;
          sound.playDoubleJump();
          this.addDoubleJumpSparkle(p.x + p.width / 2, p.y + p.height);
          this.events.onAchievementProgress('jump', 1);
        }
      }

      // Variable Jump Height: cut velocity if jump released while rising
      if (!inputs.jumpDown && p.vy < -2.5 && p.jumping) {
        p.vy *= 0.52;
      }

      // 9. Gravity
      if (!p.grounded && p.dashTimer === 0) {
        p.vy += this.GRAVITY * gravityMult;
        if (p.vy > this.MAX_FALL) p.vy = this.MAX_FALL;
      }
    }

    // 10. Move & Resolve Platform Collisions
    this.moveAndCollide();

    // 11. Update Animation State
    this.updateAnimation();

    // 12. Update Moving & Crumble Platforms
    this.updatePlatforms();

    // 13. Update Enemies & Projectiles
    this.updateEnemies();
    this.updateProjectiles();

    // 14. Collectibles collision
    this.checkCollectibles();

    // 15. Hazard collisions
    this.checkHazards();

    // 16. Goal collision
    this.checkGoal();

    // 17. Fall off world boundary death
    if (p.y > this.level.height + 60) {
      this.damagePlayer(p.maxHealth);
    }

    // 18. Update Particles & Floating Text
    this.updateParticles();

    // 19. Smooth Camera Tracking
    const targetCamX = p.x - 220 + p.vx * 15;
    this.cameraX += (targetCamX - this.cameraX) * 0.12;
    this.cameraX = Math.max(0, Math.min(this.level.width - 480, this.cameraX));

    // 20. Update Dynamic Tension for Music
    this.updateDynamicTension();
  }

  private moveAndCollide() {
    const p = this.player;

    // Reset wall slide check before collision
    p.wallSliding = 0;

    // Horizontal Move
    p.x += p.vx;
    for (const plat of this.level.platforms) {
      if (this.checkAABB(p.x, p.y, p.width, p.height, plat.x, plat.y, plat.width, plat.height)) {
        if (p.vx > 0) {
          p.x = plat.x - p.width;
          p.wallSliding = 1;
        } else if (p.vx < 0) {
          p.x = plat.x + plat.width;
          p.wallSliding = -1;
        }
        p.vx = 0;
      }
    }

    // Vertical Move
    p.y += p.vy;
    let onGround = false;

    for (const plat of this.level.platforms) {
      if (this.checkAABB(p.x, p.y, p.width, p.height, plat.x, plat.y, plat.width, plat.height)) {
        if (p.vy > 0) {
          // Landing on platform top
          p.y = plat.y - p.height;
          p.vy = 0;
          onGround = true;
          p.grounded = true;
          p.doubleJumpAvailable = true;
          p.jumping = false;

          // If stomped down
          if (p.stomping) {
            p.stomping = false;
            this.screenShake = 6;
            this.addStompShockwave(p.x + p.width / 2, p.y + p.height);
          }

          // Spring bounce
          if (plat.type === 'spring') {
            p.vy = -13.5;
            p.grounded = false;
            sound.playSpring();
            this.screenShake = 3;
            this.addDoubleJumpSparkle(p.x + p.width / 2, p.y + p.height);
          }

          // Crumble platform trigger
          if (plat.type === 'crumble' && !plat.crumbleActive) {
            plat.crumbleActive = true;
          }
        } else if (p.vy < 0) {
          // Hit ceiling
          p.y = plat.y + plat.height;
          p.vy = 0;
        }
      }
    }

    if (onGround) {
      p.grounded = true;
      p.coyoteTime = this.COYOTE_FRAMES;
    } else {
      p.grounded = false;
    }
  }

  private updatePlatforms() {
    for (let i = this.level.platforms.length - 1; i >= 0; i--) {
      const plat = this.level.platforms[i];

      // Moving platform
      if (plat.type === 'moving' && plat.movingVx !== undefined && plat.minX !== undefined && plat.maxX !== undefined) {
        plat.x += plat.movingVx;
        if (plat.x < plat.minX) {
          plat.x = plat.minX;
          plat.movingVx *= -1;
        } else if (plat.x + plat.width > plat.maxX) {
          plat.x = plat.maxX - plat.width;
          plat.movingVx *= -1;
        }

        // If player is on top of moving platform, carry player
        if (
          this.player.grounded &&
          this.player.x + this.player.width > plat.x &&
          this.player.x < plat.x + plat.width &&
          Math.abs(this.player.y + this.player.height - plat.y) < 4
        ) {
          this.player.x += plat.movingVx;
        }
      }

      // Crumbling platform
      if (plat.type === 'crumble' && plat.crumbleActive && plat.crumbleTimer !== undefined) {
        plat.crumbleTimer--;
        if (plat.crumbleTimer <= 0) {
          // Collapse platform with debris
          for (let d = 0; d < 8; d++) {
            this.particles.push({
              x: plat.x + Math.random() * plat.width,
              y: plat.y + Math.random() * plat.height,
              vx: (Math.random() * 2 - 1) * 2,
              vy: Math.random() * 3 + 1,
              size: 3,
              color: '#64748b',
              life: 25,
              maxLife: 25,
              alpha: 1
            });
          }
          this.level.platforms.splice(i, 1);
        }
      }
    }
  }

  private updateEnemies() {
    const p = this.player;

    for (let i = this.level.enemies.length - 1; i >= 0; i--) {
      const enemy = this.level.enemies[i];
      enemy.actionTimer++;

      switch (enemy.type) {
        case 'crawler': {
          enemy.x += enemy.vx * enemy.facing;
          if (enemy.x <= enemy.patrolMinX) {
            enemy.x = enemy.patrolMinX;
            enemy.facing = 1;
          } else if (enemy.x + enemy.width >= enemy.patrolMaxX) {
            enemy.x = enemy.patrolMaxX - enemy.width;
            enemy.facing = -1;
          }
          break;
        }

        case 'bat': {
          // Swoop vertically when player is near
          const dist = Math.abs(p.x - enemy.x);
          if (dist < 180) {
            enemy.y += Math.sin(enemy.actionTimer * 0.12) * 2.2;
            enemy.x += (p.x < enemy.x ? -1.2 : 1.2);
            enemy.facing = p.x < enemy.x ? -1 : 1;
          } else {
            enemy.y += Math.sin(enemy.actionTimer * 0.05) * 0.8;
          }
          break;
        }

        case 'beetle': {
          // Charges when on same vertical level
          const sameHeight = Math.abs(p.y - enemy.y) < 30;
          const dist = Math.abs(p.x - enemy.x);
          if (sameHeight && dist < 160) {
            enemy.facing = p.x < enemy.x ? -1 : 1;
            enemy.x += enemy.facing * 2.4; // Charge speed
          } else {
            enemy.x += enemy.vx * enemy.facing;
            if (enemy.x <= enemy.patrolMinX || enemy.x + enemy.width >= enemy.patrolMaxX) {
              enemy.facing = (-enemy.facing as -1 | 1);
            }
          }
          break;
        }

        case 'shooter': {
          // Periodic projectile shot
          if (enemy.actionTimer % 90 === 0) {
            const angle = Math.atan2(p.y - enemy.y, p.x - enemy.x);
            this.projectiles.push({
              id: 'p_' + Date.now() + Math.random(),
              x: enemy.x + enemy.width / 2,
              y: enemy.y + enemy.height / 2,
              vx: Math.cos(angle) * 3.2,
              vy: Math.sin(angle) * 3.2,
              radius: 4,
              color: '#ef4444',
              life: 140
            });
          }
          break;
        }

        case 'phantasm': {
          // Freezes when player looks directly at it!
          const playerLookingAtEnemy = (p.facing === 1 && p.x < enemy.x) || (p.facing === -1 && p.x > enemy.x);
          if (playerLookingAtEnemy && Math.abs(p.x - enemy.x) < 260) {
            enemy.state = 'frozen';
          } else {
            enemy.state = 'stalk';
            const dx = p.x - enemy.x;
            const dy = p.y - enemy.y;
            const dist = Math.hypot(dx, dy) || 1;
            enemy.x += (dx / dist) * 0.9;
            enemy.y += (dy / dist) * 0.7;
            enemy.facing = dx < 0 ? -1 : 1;
          }
          break;
        }
      }

      // Check collision with player
      if (this.checkAABB(p.x, p.y, p.width, p.height, enemy.x, enemy.y, enemy.width, enemy.height)) {
        // Player stomping or falling on enemy top
        const hitFromAbove = (p.vy > 0 && p.y + p.height - p.vy <= enemy.y + 10) || p.stomping;

        if (hitFromAbove && enemy.isStompable) {
          // Stomp kill!
          p.vy = -7.5; // Bounce off enemy
          sound.playEnemyDefeat();
          this.events.onEnemyDefeated(enemy);
          this.addScore(enemy.points, '¡Pisotón!');
          this.events.onAchievementProgress('stomp', 1);

          // Coin drops
          for (let c = 0; c < enemy.coinsDrop; c++) {
            this.level.collectibles.push({
              id: 'drop_' + Date.now() + c,
              x: enemy.x + (Math.random() * 20 - 10),
              y: enemy.y - 10,
              width: 12,
              height: 12,
              type: 'coin',
              value: 10,
              collected: false,
              bobOffset: c
            });
          }

          // Enemy death poof
          this.addEnemyPoof(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color);
          this.level.enemies.splice(i, 1);
        } else if (p.dashTimer > 0) {
          // Air dash cuts through enemies!
          sound.playEnemyDefeat();
          this.events.onEnemyDefeated(enemy);
          this.addScore(enemy.points * 1.5, '¡Corte de Dash!');
          this.addEnemyPoof(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color);
          this.level.enemies.splice(i, 1);
        } else {
          // Player damaged by enemy
          this.damagePlayer(1);
        }
      }
    }
  }

  private updateProjectiles() {
    const p = this.player;

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.x += proj.vx;
      proj.y += proj.vy;
      proj.life--;

      if (proj.life <= 0) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check collision with player
      if (
        this.checkCircleBox(
          proj.x,
          proj.y,
          proj.radius,
          p.x,
          p.y,
          p.width,
          p.height
        )
      ) {
        if (p.dashTimer > 0) {
          // Dash destroys projectile with sparkle
          this.projectiles.splice(i, 1);
          sound.playCoin();
          continue;
        }
        this.projectiles.splice(i, 1);
        this.damagePlayer(1);
      }
    }
  }

  private checkCollectibles() {
    const p = this.player;
    for (const item of this.level.collectibles) {
      if (!item.collected && this.checkAABB(p.x, p.y, p.width, p.height, item.x, item.y, item.width, item.height)) {
        item.collected = true;

        if (item.type === 'coin') {
          this.coins += item.value;
          this.addScore(item.value * 2, `+${item.value} Monedas`);
          sound.playCoin();
          this.events.onCoinCollected(item.value);
          this.events.onAchievementProgress('coins', item.value);
          this.addCoinSparkle(item.x + item.width / 2, item.y + item.height / 2, '#fde047');
        } else if (item.type === 'gem') {
          this.gems += 1;
          this.coins += 50; // Gems also give generous shop currency
          this.addScore(300, '+GEMA CÓSMICA');
          sound.playGem();
          this.events.onGemCollected(1);
          this.events.onAchievementProgress('gems', 1);
          this.addCoinSparkle(item.x + item.width / 2, item.y + item.height / 2, '#38bdf8');
        } else if (item.type === 'heart') {
          if (p.health < p.maxHealth) {
            p.health = Math.min(p.maxHealth, p.health + 1);
            sound.playGem();
            this.events.onHeartCollected();
            this.addFloatingText(p.x, p.y - 10, '+1 SALUD', '#ef4444');
          }
        }
      }
    }
  }

  private checkHazards() {
    const p = this.player;
    for (const haz of this.level.hazards) {
      if (this.checkAABB(p.x, p.y, p.width, p.height, haz.x, haz.y, haz.width, haz.height)) {
        // Spikes or lava: instant heavy damage
        this.damagePlayer(1);
        // Bounce player out of hazard
        p.vy = -6.5;
        p.vx = -p.facing * 3;
      }
    }
  }

  private checkGoal() {
    const p = this.player;
    const goal = this.level.goal;
    if (goal.active && this.checkAABB(p.x, p.y, p.width, p.height, goal.x, goal.y, goal.width, goal.height)) {
      this.isLevelFinished = true;
      sound.playLevelClear();
      this.addScore(1000 + this.level.levelNumber * 200, '¡NIVEL COMPLETADO!');
      this.events.onLevelComplete();
    }
  }

  public damagePlayer(amount: number) {
    const p = this.player;
    if (p.invulnerableTimer > 0 || this.isGameOver) return;

    p.health -= amount;
    p.invulnerableTimer = 45; // Invulnerable grace frames
    this.screenShake = 8;
    sound.playHurt();
    this.events.onPlayerDamaged(p.health);

    this.addFloatingText(p.x, p.y - 10, `-${amount} CORAZÓN`, '#f43f5e');

    // Bloodless spark burst
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x: p.x + p.width / 2,
        y: p.y + p.height / 2,
        vx: (Math.random() * 2 - 1) * 3,
        vy: (Math.random() * 2 - 1) * 3,
        size: 3,
        color: '#f43f5e',
        life: 18,
        maxLife: 18,
        alpha: 1
      });
    }

    if (p.health <= 0) {
      this.isGameOver = true;
      sound.playHurt();
      this.events.onPlayerDied();
    }
  }

  public addScore(amount: number, reason?: string) {
    this.combo++;
    this.comboTimer = 110; // combo window
    const multiplier = 1 + Math.min(4, Math.floor(this.combo / 3) * 0.5);
    const totalGained = Math.round(amount * multiplier);

    this.score += totalGained;
    this.events.onScoreGained(totalGained, reason || '');

    if (reason) {
      const txt = multiplier > 1 ? `${reason} (${multiplier}x)` : reason;
      this.addFloatingText(this.player.x, this.player.y - 14, txt, '#38bdf8');
    }
  }

  private updateDynamicTension() {
    const p = this.player;
    let maxTension = 0;

    // 1. Health factor (1 heart left = high tension)
    if (p.health === 1) {
      maxTension = Math.max(maxTension, 0.7);
    }

    // 2. Hazard / Enemy proximity
    for (const enemy of this.level.enemies) {
      const dist = Math.hypot(p.x - enemy.x, p.y - enemy.y);
      if (dist < 140) {
        const factor = (140 - dist) / 140;
        maxTension = Math.max(maxTension, factor * 0.85);
      }
    }

    // 3. Stomping or high combo
    if (this.combo >= 4) {
      maxTension = Math.max(maxTension, Math.min(1.0, 0.4 + this.combo * 0.1));
    }

    sound.setTension(maxTension);
  }

  private updateAnimation() {
    const p = this.player;
    p.animTimer++;
    if (p.animTimer >= 6) {
      p.animTimer = 0;
      p.animFrame = (p.animFrame + 1) % 8;
    }

    if (p.dashTimer > 0) {
      p.state = 'dash';
    } else if (p.stomping) {
      p.state = 'stomp';
    } else if (p.wallSliding !== 0) {
      p.state = 'wall';
    } else if (!p.grounded) {
      p.state = p.vy < 0 ? 'jump' : 'fall';
    } else if (Math.abs(p.vx) > 0.4) {
      p.state = 'run';
    } else {
      p.state = 'idle';
    }
  }

  // -------------------------------------------------------------
  // Particle Emitters
  // -------------------------------------------------------------
  private spawnTrailGhost() {
    const p = this.player;
    this.particles.push({
      x: p.x,
      y: p.y,
      vx: 0,
      vy: 0,
      size: p.width,
      color: p.skinId === 'cyber_ronin' ? '#00f0ff' : (p.skinId === 'shadow_ninja' ? '#64748b' : '#38bdf8'),
      life: 8,
      maxLife: 8,
      alpha: 0.55
    });
  }

  private addDashParticles(x: number, y: number, dir: number) {
    for (let i = 0; i < 14; i++) {
      this.particles.push({
        x,
        y: y + (Math.random() * 20 - 10),
        vx: -dir * (Math.random() * 4 + 2),
        vy: (Math.random() * 2 - 1) * 2,
        size: 3,
        color: '#00f0ff',
        life: 14,
        maxLife: 14,
        alpha: 0.9
      });
    }
  }

  private addJumpDust(x: number, y: number) {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: x + (Math.random() * 12 - 6),
        y,
        vx: (Math.random() * 2 - 1) * 1.5,
        vy: -Math.random() * 1.5,
        size: 2,
        color: '#cbd5e1',
        life: 12,
        maxLife: 12,
        alpha: 0.8
      });
    }
  }

  private addDoubleJumpSparkle(x: number, y: number) {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() * 2 - 1) * 2.5,
        vy: (Math.random() * 2 - 1) * 2.5,
        size: 3,
        color: '#38bdf8',
        life: 15,
        maxLife: 15,
        alpha: 1
      });
    }
  }

  private addStompShockwave(x: number, y: number) {
    for (let i = 0; i < 12; i++) {
      this.particles.push({
        x,
        y,
        vx: (i < 6 ? -1 : 1) * (Math.random() * 4 + 1.5),
        vy: -Math.random() * 1.5,
        size: 3,
        color: '#f59e0b',
        life: 14,
        maxLife: 14,
        alpha: 1
      });
    }
  }

  private addCoinSparkle(x: number, y: number, color: string) {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() * 2 - 1) * 2,
        vy: (Math.random() * 2 - 1) * 2,
        size: 2,
        color,
        life: 12,
        maxLife: 12,
        alpha: 1
      });
    }
  }

  private addEnemyPoof(x: number, y: number, color: string) {
    for (let i = 0; i < 14; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() * 2 - 1) * 3,
        vy: (Math.random() * 2 - 1) * 3,
        size: 4,
        color,
        life: 20,
        maxLife: 20,
        alpha: 1
      });
    }
  }

  private addFloatingText(x: number, y: number, text: string, color: string) {
    this.floatingTexts.push({
      id: 'txt_' + Date.now() + Math.random(),
      x,
      y,
      text,
      color,
      alpha: 1,
      life: 30
    });
  }

  private updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      p.alpha = Math.max(0, p.life / p.maxLife);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y -= 0.6;
      t.life--;
      t.alpha = Math.max(0, t.life / 30);
      if (t.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  // -------------------------------------------------------------
  // Collision Utilities
  // -------------------------------------------------------------
  private checkAABB(
    x1: number,
    y1: number,
    w1: number,
    h1: number,
    x2: number,
    y2: number,
    w2: number,
    h2: number
  ): boolean {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
  }

  private checkCircleBox(
    cx: number,
    cy: number,
    r: number,
    bx: number,
    by: number,
    bw: number,
    bh: number
  ): boolean {
    const closestX = Math.max(bx, Math.min(cx, bx + bw));
    const closestY = Math.max(by, Math.min(cy, by + bh));
    const distanceX = cx - closestX;
    const distanceY = cy - closestY;
    return distanceX * distanceX + distanceY * distanceY < r * r;
  }
}
