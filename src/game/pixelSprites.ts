// Pixel Art Sprites & Canvas Renderer for Pixel Leap 2D

import { BiomeType, Enemy, Hazard, Platform, Collectible, LevelGoal, Particle, FloatingText } from '../types';

export class PixelRenderer {
  // Biome color palettes
  public static biomes: Record<BiomeType, {
    bgTop: string;
    bgBottom: string;
    groundTop: string;
    groundBody: string;
    groundAccent: string;
    hazardColor: string;
    name: string;
  }> = {
    neon_city: {
      bgTop: '#0b0f19',
      bgBottom: '#181b34',
      groundTop: '#00f0ff',
      groundBody: '#1e293b',
      groundAccent: '#ff007f',
      hazardColor: '#ff0055',
      name: 'Ciudad Neón'
    },
    crystal_caves: {
      bgTop: '#090d16',
      bgBottom: '#1a102f',
      groundTop: '#a855f7',
      groundBody: '#2e1065',
      groundAccent: '#c084fc',
      hazardColor: '#f43f5e',
      name: 'Cavernas de Cristal'
    },
    magma_ruins: {
      bgTop: '#180707',
      bgBottom: '#360e0e',
      groundTop: '#f97316',
      groundBody: '#451a03',
      groundAccent: '#fbbf24',
      hazardColor: '#ef4444',
      name: 'Ruinas de Magma'
    },
    cyber_spire: {
      bgTop: '#05131f',
      bgBottom: '#042f2e',
      groundTop: '#10b981',
      groundBody: '#064e3b',
      groundAccent: '#34d399',
      hazardColor: '#f59e0b',
      name: 'Ciber Espiral'
    }
  };

  // Draw Player with skin & animation state
  public static drawPlayer(
    ctx: CanvasRenderingContext2D,
    p: {
      x: number;
      y: number;
      width: number;
      height: number;
      facing: -1 | 1;
      state: string;
      animFrame: number;
      skinId: string;
      invulnerableTimer: number;
    }
  ) {
    // Flash if invulnerable
    if (p.invulnerableTimer > 0 && Math.floor(p.invulnerableTimer / 4) % 2 === 0) {
      return;
    }

    ctx.save();
    ctx.translate(Math.round(p.x + p.width / 2), Math.round(p.y + p.height / 2));
    ctx.scale(p.facing, 1);

    const w = p.width;
    const h = p.height;
    const skin = p.skinId;

    // Skin palettes: [body, secondary, accent, eyes, detail]
    let colors = {
      body: '#3b82f6',
      hat: '#ef4444',
      skin: '#fed7aa',
      eyes: '#0f172a',
      boots: '#1e293b'
    };

    if (skin === 'cyber_ronin') {
      colors = { body: '#0f172a', hat: '#00f0ff', skin: '#e2e8f0', eyes: '#ff007f', boots: '#ff007f' };
    } else if (skin === 'shadow_ninja') {
      colors = { body: '#111827', hat: '#1f2937', skin: '#9ca3af', eyes: '#ef4444', boots: '#000000' };
    } else if (skin === 'solar_valkyrie') {
      colors = { body: '#eab308', hat: '#fef08a', skin: '#fed7aa', eyes: '#38bdf8', boots: '#ca8a04' };
    } else if (skin === 'chrono_glitcher') {
      colors = { body: '#06b6d4', hat: '#ec4899', skin: '#f3e8ff', eyes: '#10b981', boots: '#8b5cf6' };
    } else if (skin === 'slime_suit') {
      colors = { body: '#22c55e', hat: '#86efac', skin: '#4ade80', eyes: '#052e16', boots: '#15803d' };
    } else if (skin === 'retro_boy') {
      colors = { body: '#8bac0f', hat: '#306230', skin: '#9bbc0f', eyes: '#0f380f', boots: '#306230' };
    } else if (skin === 'void_phantasm') {
      colors = { body: '#6b21a8', hat: '#a855f7', skin: '#c084fc', eyes: '#e879f9', boots: '#3b0764' };
    }

    // Squash & stretch based on animation state
    let scaleX = 1;
    let scaleY = 1;
    let yOffset = 0;

    if (p.state === 'jump') {
      scaleX = 0.85;
      scaleY = 1.15;
    } else if (p.state === 'fall') {
      scaleX = 0.92;
      scaleY = 1.08;
    } else if (p.state === 'stomp') {
      scaleX = 1.25;
      scaleY = 0.75;
      yOffset = 2;
    } else if (p.state === 'dash') {
      scaleX = 1.35;
      scaleY = 0.7;
    } else if (p.state === 'run') {
      yOffset = (p.animFrame % 2 === 0) ? -2 : 0;
    }

    ctx.scale(scaleX, scaleY);

    const bx = -w / 2;
    const by = -h / 2 + yOffset;

    // Body (Torso)
    ctx.fillStyle = colors.body;
    ctx.fillRect(bx + 4, by + 10, w - 8, h - 16);

    // Head
    ctx.fillStyle = colors.skin;
    ctx.fillRect(bx + 4, by + 2, w - 8, 9);

    // Hair / Hat / Helmet
    ctx.fillStyle = colors.hat;
    ctx.fillRect(bx + 3, by, w - 6, 4);
    ctx.fillRect(bx + 2, by + 2, 4, 3);

    // Eye(s)
    ctx.fillStyle = colors.eyes;
    if (skin === 'cyber_ronin' || skin === 'shadow_ninja') {
      // Visor / glow slits
      ctx.fillRect(bx + w - 8, by + 4, 6, 2);
    } else {
      ctx.fillRect(bx + w - 7, by + 4, 3, 3);
      // Eye reflection
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx + w - 6, by + 4, 1, 1);
    }

    // Feet / Boots with run cycle
    ctx.fillStyle = colors.boots;
    if (p.state === 'run') {
      if (p.animFrame % 4 < 2) {
        ctx.fillRect(bx + 3, by + h - 6, 5, 6);
        ctx.fillRect(bx + w - 7, by + h - 8, 5, 4);
      } else {
        ctx.fillRect(bx + 3, by + h - 8, 5, 4);
        ctx.fillRect(bx + w - 7, by + h - 6, 5, 6);
      }
    } else if (p.state === 'wall') {
      ctx.fillRect(bx + 2, by + h - 7, 5, 6);
      ctx.fillRect(bx + w - 6, by + h - 9, 4, 5);
    } else {
      ctx.fillRect(bx + 3, by + h - 6, 5, 6);
      ctx.fillRect(bx + w - 8, by + h - 6, 5, 6);
    }

    // Special skin flourishes
    if (skin === 'solar_valkyrie') {
      ctx.fillStyle = '#fef08a';
      // Little winged horns
      ctx.fillRect(bx + 1, by - 2, 2, 3);
      ctx.fillRect(bx + w - 3, by - 2, 2, 3);
    } else if (skin === 'cyber_ronin') {
      // Cyber blade on back
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(bx - 2, by + 3, 2, 14);
    }

    ctx.restore();
  }

  // Draw unique enemies
  public static drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy) {
    ctx.save();
    ctx.translate(Math.round(enemy.x + enemy.width / 2), Math.round(enemy.y + enemy.height / 2));
    ctx.scale(enemy.facing, 1);

    const w = enemy.width;
    const h = enemy.height;
    const bx = -w / 2;
    const by = -h / 2;

    switch (enemy.type) {
      case 'crawler': {
        // Scuttling caterpillar / slime bug
        const step = Math.floor(enemy.actionTimer / 6) % 2;
        ctx.fillStyle = enemy.color;
        // Main rounded carapace
        ctx.fillRect(bx + 2, by + 4, w - 4, h - 8);
        ctx.fillRect(bx + 4, by + 2, w - 8, 3);
        // Scuttling feet
        ctx.fillStyle = '#0f172a';
        if (step === 0) {
          ctx.fillRect(bx + 3, by + h - 4, 3, 4);
          ctx.fillRect(bx + w - 6, by + h - 4, 3, 4);
        } else {
          ctx.fillRect(bx + 6, by + h - 4, 3, 4);
          ctx.fillRect(bx + w - 9, by + h - 4, 3, 4);
        }
        // Animated antenna
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(bx + w - 5, by - (step === 0 ? 3 : 1), 2, 4);
        // Eye
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bx + w - 6, by + 5, 3, 3);
        ctx.fillStyle = '#000000';
        ctx.fillRect(bx + w - 5, by + 6, 2, 2);
        break;
      }

      case 'bat': {
        // Flying crimson gargoyle bat with flapping wings
        const flap = Math.floor(enemy.actionTimer / 5) % 3;
        ctx.fillStyle = '#be123c'; // Dark crimson body
        ctx.fillRect(bx + w / 2 - 4, by + 4, 8, 12);
        // Ears
        ctx.fillRect(bx + w / 2 - 4, by + 1, 2, 4);
        ctx.fillRect(bx + w / 2 + 2, by + 1, 2, 4);
        // Glowing red eyes
        ctx.fillStyle = '#fde047';
        ctx.fillRect(bx + w / 2 + 1, by + 6, 2, 2);

        // Wings
        ctx.fillStyle = '#e11d48';
        if (flap === 0) { // Wing up
          ctx.fillRect(bx + 1, by, w / 2 - 3, 6);
          ctx.fillRect(bx + w / 2 + 2, by, w / 2 - 3, 6);
        } else if (flap === 1) { // Wing middle
          ctx.fillRect(bx, by + 5, w / 2 - 2, 5);
          ctx.fillRect(bx + w / 2 + 2, by + 5, w / 2 - 2, 5);
        } else { // Wing down
          ctx.fillRect(bx + 1, by + 9, w / 2 - 3, 6);
          ctx.fillRect(bx + w / 2 + 2, by + 9, w / 2 - 3, 6);
        }
        break;
      }

      case 'beetle': {
        // Armored spiky beetle (CANNOT BE STOMPED from above!)
        ctx.fillStyle = '#d97706'; // Spiked golden/bronze carapace
        ctx.fillRect(bx + 2, by + 6, w - 4, h - 8);
        // Spikes on top (visual warning that it's unstompable)
        ctx.fillStyle = '#78350f';
        ctx.fillRect(bx + 4, by + 1, 3, 5);
        ctx.fillRect(bx + 10, by, 4, 6);
        ctx.fillRect(bx + 16, by + 1, 3, 5);
        // Glowing warning light
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(bx + 11, by + 4, 2, 2);
        // Metallic legs
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(bx + 3, by + h - 3, 3, 3);
        ctx.fillRect(bx + 9, by + h - 3, 3, 3);
        ctx.fillRect(bx + 15, by + h - 3, 3, 3);
        // Mandibles
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bx + w - 3, by + 8, 3, 2);
        ctx.fillRect(bx + w - 3, by + 11, 3, 2);
        break;
      }

      case 'shooter': {
        // Floating cyber robotic turret eye
        const pulse = Math.sin(enemy.actionTimer * 0.1) * 2;
        ctx.fillStyle = '#475569';
        ctx.fillRect(bx + 2, by + 2 + pulse, w - 4, h - 4);
        // Outer cyan ring
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(bx + 4, by + 4 + pulse, w - 8, h - 8);
        // Tracking red pupil
        ctx.fillStyle = '#ef4444';
        const eyeOffset = Math.sin(enemy.actionTimer * 0.05) * 2;
        ctx.fillRect(bx + w - 9, by + 7 + pulse + eyeOffset, 4, 4);
        // Charge glow when about to shoot
        if (enemy.actionTimer % 90 > 70) {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.6)';
          ctx.beginPath();
          ctx.arc(bx + w - 7, by + 9 + pulse, 7, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }

      case 'phantasm': {
        // Ghost specter that floats and fades
        const floatY = Math.sin(enemy.actionTimer * 0.08) * 3;
        ctx.fillStyle = enemy.state === 'frozen' ? 'rgba(147, 51, 234, 0.4)' : 'rgba(168, 85, 247, 0.85)';
        // Cloak
        ctx.fillRect(bx + 3, by + 2 + floatY, w - 6, h - 6);
        // Ghostly ragged bottom
        const step = Math.floor(enemy.actionTimer / 8) % 2;
        if (step === 0) {
          ctx.fillRect(bx + 4, by + h - 4 + floatY, 3, 4);
          ctx.fillRect(bx + 12, by + h - 4 + floatY, 3, 4);
        } else {
          ctx.fillRect(bx + 8, by + h - 4 + floatY, 3, 4);
          ctx.fillRect(bx + 16, by + h - 4 + floatY, 3, 4);
        }
        // Glowing cyan eye holes
        ctx.fillStyle = '#22d3ee';
        ctx.fillRect(bx + w - 7, by + 5 + floatY, 2, 2);
        ctx.fillRect(bx + w - 12, by + 5 + floatY, 2, 2);
        break;
      }
    }

    ctx.restore();
  }

  // Draw projectile
  public static drawProjectile(ctx: CanvasRenderingContext2D, proj: { x: number; y: number; radius: number; color: string }) {
    ctx.save();
    ctx.fillStyle = proj.color;
    ctx.shadowColor = proj.color;
    ctx.shadowBlur = 6;
    ctx.fillRect(
      Math.round(proj.x - proj.radius),
      Math.round(proj.y - proj.radius),
      proj.radius * 2,
      proj.radius * 2
    );
    ctx.restore();
  }

  // Draw platforms with crisp pixel texture
  public static drawPlatform(ctx: CanvasRenderingContext2D, plat: Platform, biome: BiomeType) {
    const palette = PixelRenderer.biomes[biome];
    const x = Math.round(plat.x);
    const y = Math.round(plat.y);
    const w = Math.round(plat.width);
    const h = Math.round(plat.height);

    ctx.save();

    if (plat.type === 'spring') {
      // Bounce spring pad
      ctx.fillStyle = '#334155';
      ctx.fillRect(x, y + h - 4, w, 4);
      // Yellow/orange coil
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(x + 4, y + 2, w - 8, h - 6);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(x + 2, y, w - 4, 3);
      ctx.restore();
      return;
    }

    if (plat.type === 'crumble') {
      // Crumbling platform (fissured stone)
      const shake = plat.crumbleActive ? (Math.random() * 2 - 1) : 0;
      ctx.fillStyle = '#475569';
      ctx.fillRect(x + shake, y, w, h);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(x + shake + 2, y + 1, w - 4, 3);
      // Cracks
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x + shake + w / 3, y + 3, 2, h - 4);
      ctx.fillRect(x + shake + (w * 2) / 3, y + 2, 2, h - 3);
      ctx.restore();
      return;
    }

    if (plat.type === 'moving') {
      // Moving neon tech platform
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(x, y, w, h);
      // Glowing neon edge
      ctx.fillStyle = palette.groundAccent;
      ctx.fillRect(x, y, w, 3);
      // Underneath thruster / gear light
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(x + 4, y + h - 2, 6, 2);
      ctx.fillRect(x + w - 10, y + h - 2, 6, 2);
      ctx.restore();
      return;
    }

    // Default solid ground / platform
    ctx.fillStyle = palette.groundBody;
    ctx.fillRect(x, y, w, h);

    // Top trim grass/neon edge
    ctx.fillStyle = palette.groundTop;
    ctx.fillRect(x, y, w, 3);

    // Subtle pixel grid / bricks
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for (let px = x; px < x + w; px += 16) {
      ctx.fillRect(px, y + 4, 1, h - 4);
    }
    for (let py = y + 8; py < y + h; py += 8) {
      ctx.fillRect(x, py, w, 1);
    }

    ctx.restore();
  }

  // Draw Hazards (Spikes, Lava)
  public static drawHazard(ctx: CanvasRenderingContext2D, haz: Hazard) {
    const x = Math.round(haz.x);
    const y = Math.round(haz.y);
    const w = Math.round(haz.width);
    const h = Math.round(haz.height);

    ctx.save();
    if (haz.type === 'spikes_up') {
      const spikeW = 8;
      const count = Math.floor(w / spikeW);
      for (let i = 0; i < count; i++) {
        const sx = x + i * spikeW;
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.moveTo(sx, y + h);
        ctx.lineTo(sx + spikeW / 2, y);
        ctx.lineTo(sx + spikeW, y + h);
        ctx.closePath();
        ctx.fill();

        // Tip highlight
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(sx + spikeW / 2 - 1, y, 2, 3);
      }
    } else if (haz.type === 'lava') {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(x, y, w, 4);
      // Bubbles
      const bubbleX = x + (Math.sin(Date.now() * 0.005) * 0.5 + 0.5) * (w - 6);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(bubbleX, y - 2, 4, 3);
    }
    ctx.restore();
  }

  // Draw Collectibles
  public static drawCollectible(ctx: CanvasRenderingContext2D, item: Collectible) {
    if (item.collected) return;
    const x = Math.round(item.x);
    const y = Math.round(item.y + Math.sin(item.bobOffset) * 3);
    const w = item.width;
    const h = item.height;

    ctx.save();
    if (item.type === 'coin') {
      // Spinning gold coin
      const spin = Math.abs(Math.cos(item.bobOffset * 1.5));
      const cw = Math.max(3, w * spin);
      const cx = x + (w - cw) / 2;

      ctx.fillStyle = '#eab308';
      ctx.fillRect(cx, y, cw, h);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(cx + 1, y + 1, Math.max(1, cw - 2), h - 2);
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(cx + Math.floor(cw / 2), y + 2, 1, h - 4);
    } else if (item.type === 'gem') {
      // Glowing amethyst / emerald gem
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.moveTo(x + w / 2, y);
      ctx.lineTo(x + w, y + h / 2);
      ctx.lineTo(x + w / 2, y + h);
      ctx.lineTo(x, y + h / 2);
      ctx.closePath();
      ctx.fill();

      // Shimmer reflection
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + w / 2 - 2, y + 3, 3, 3);
    } else if (item.type === 'heart') {
      // Extra life heart
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(x + 2, y + 1, 4, 3);
      ctx.fillRect(x + w - 6, y + 1, 4, 3);
      ctx.fillRect(x + 1, y + 4, w - 2, 4);
      ctx.fillRect(x + 3, y + 8, w - 6, 3);
      ctx.fillRect(x + 5, y + 11, w - 10, 2);
    }
    ctx.restore();
  }

  // Draw Level Goal / Portal
  public static drawGoal(ctx: CanvasRenderingContext2D, goal: LevelGoal, time: number) {
    const x = Math.round(goal.x);
    const y = Math.round(goal.y);
    const w = goal.width;
    const h = goal.height;

    ctx.save();
    // Portal arch
    ctx.fillStyle = '#475569';
    ctx.fillRect(x - 2, y, 4, h);
    ctx.fillRect(x + w - 2, y, 4, h);
    ctx.fillRect(x - 2, y - 2, w + 4, 4);

    // Swirling cosmic center
    const pulse = Math.sin(time * 0.006) * 0.15 + 0.85;
    const gradient = ctx.createLinearGradient(x, y, x, y + h);
    gradient.addColorStop(0, '#a855f7');
    gradient.addColorStop(0.5, '#06b6d4');
    gradient.addColorStop(1, '#ec4899');

    ctx.fillStyle = gradient;
    ctx.globalAlpha = pulse;
    ctx.fillRect(x + 2, y + 2, w - 4, h - 2);

    // Spinning star
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + w / 2 - 2, y + h / 2 - 2, 4, 4);

    ctx.restore();
  }

  // Draw Particles & Floating Text
  public static drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
      ctx.restore();
    }
  }

  public static drawFloatingTexts(ctx: CanvasRenderingContext2D, texts: FloatingText[]) {
    for (const t of texts) {
      ctx.save();
      ctx.globalAlpha = t.alpha;
      ctx.fillStyle = t.color;
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillText(t.text, Math.round(t.x), Math.round(t.y));
      ctx.restore();
    }
  }
}
