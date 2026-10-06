import {
  ArenaObstacle,
  BugPlayer,
  GameSnapshot,
  GiantSugarCrystal,
  MinionBug,
  Projectile,
  SpiderWeb,
  SugarDrop,
  ToxicCloud
} from '../types/game';
import { ARENA_HEIGHT, ARENA_WIDTH } from './GameEngine';

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cameraX = ARENA_WIDTH / 2;
  private cameraY = ARENA_HEIGHT / 2;
  private cameraZoom = 1.0;
  private shakeAmount = 0;
  private particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
    alpha: number;
    decay: number;
  }> = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D context');
    this.ctx = context;
  }

  public triggerScreenShake(amount: number = 8) {
    this.shakeAmount = Math.max(this.shakeAmount, amount);
  }

  public spawnParticles(x: number, y: number, color: string, count: number = 10, speed: number = 3) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = (0.5 + Math.random()) * speed;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        radius: 2 + Math.random() * 3,
        color,
        alpha: 1.0,
        decay: 0.02 + Math.random() * 0.03
      });
    }
  }

  public render(
    snapshot: GameSnapshot,
    selfId: string,
    obstacles: ArenaObstacle[],
    dt: number = 0.016,
    floatingTexts: { x: number; y: number; text: string; color: string; alpha: number; size: number }[] = []
  ) {
    const { ctx, canvas } = this;
    const width = canvas.width;
    const height = canvas.height;

    // Find self player
    const selfPlayer = snapshot.players.find(p => p.id === selfId);

    // Update Camera position smoothly
    if (selfPlayer) {
      this.cameraX += (selfPlayer.x - this.cameraX) * 0.15;
      this.cameraY += (selfPlayer.y - this.cameraY) * 0.15;
      // Dynamic Slither.io zoom: scales with mass/length and widens when boosting
      const massScale = Math.max(0.68, 1.08 - (selfPlayer.score / 3500) * 0.4);
      const targetZoom = (selfPlayer.isBoosting && selfPlayer.score > 15) ? massScale * 0.88 : massScale;
      this.cameraZoom += (targetZoom - this.cameraZoom) * 0.05;
    }

    // Decay screen shake
    let shakeOffsetX = 0;
    let shakeOffsetY = 0;
    if (this.shakeAmount > 0) {
      shakeOffsetX = (Math.random() - 0.5) * this.shakeAmount * 2;
      shakeOffsetY = (Math.random() - 0.5) * this.shakeAmount * 2;
      this.shakeAmount = Math.max(0, this.shakeAmount - dt * 25);
    }

    // Clear background
    ctx.fillStyle = '#0a100c';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    // Center camera on screen
    ctx.translate(width / 2 + shakeOffsetX, height / 2 + shakeOffsetY);
    ctx.scale(this.cameraZoom, this.cameraZoom);
    ctx.translate(-this.cameraX, -this.cameraY);

    // 1. Draw Backyard Ground Terrain
    this.renderBackyardGround(ctx);

    // 1.5. Draw Clover Grass Patches (Camouflage Ambush Zones)
    this.renderGrassPatches(ctx, snapshot.grassPatches || []);

    // 2. Draw Arena Obstacles (Pebbles, leaves, bottle caps)
    this.renderObstacles(ctx, obstacles);

    // 3. Draw Spider Webs
    this.renderWebs(ctx, snapshot.webs);

    // 4. Draw Toxic Spore Clouds
    this.renderToxicClouds(ctx, snapshot.toxicClouds);

    // 5. Draw Sugar Drops
    this.renderSugarDrops(ctx, snapshot.sugarDrops);

    // 5.5. Draw Roaming Queen Nectar Wisps (Fireflies)
    this.renderFireflies(ctx, snapshot.fireflies || []);

    // 6. Draw Giant Sugar Crystals & Beacons
    this.renderGiantCrystals(ctx, snapshot.giantCrystals);

    // 7. Draw Minions (Worker & Guardian ants)
    this.renderMinions(ctx, snapshot.minions);

    // 8. Draw Bugs (Centipedes, Ants, Spiders)
    this.renderPlayers(ctx, snapshot.players, selfId);

    // 9. Draw Projectiles
    this.renderProjectiles(ctx, snapshot.projectiles);

    // 10. Update and draw particles
    this.renderParticles(ctx, dt);

    // 11. Draw Floating Combat Text
    this.renderFloatingTexts(ctx, floatingTexts);

    ctx.restore();

    // 12. Screen Vignette
    this.renderVignette(ctx, width, height);

    // 13. Slither Speed Streaks on Boost
    if (selfPlayer?.isBoosting && selfPlayer.score > 15) {
      this.renderSpeedStreaks(ctx, width, height);
    }
  }

  private renderBackyardGround(ctx: CanvasRenderingContext2D) {
    // Rich garden loam dirt
    ctx.fillStyle = '#0f1711';
    ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

    // Soil grid / garden rows
    ctx.strokeStyle = 'rgba(34, 60, 40, 0.25)';
    ctx.lineWidth = 1;
    const gridSize = 100;
    const startX = Math.max(0, Math.floor((this.cameraX - 1200) / gridSize) * gridSize);
    const endX = Math.min(ARENA_WIDTH, Math.ceil((this.cameraX + 1200) / gridSize) * gridSize);
    const startY = Math.max(0, Math.floor((this.cameraY - 900) / gridSize) * gridSize);
    const endY = Math.min(ARENA_HEIGHT, Math.ceil((this.cameraY + 900) / gridSize) * gridSize);

    ctx.beginPath();
    for (let x = startX; x <= endX; x += gridSize) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += gridSize) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();

    // Mossy soil patches
    ctx.fillStyle = 'rgba(22, 60, 32, 0.35)';
    for (let x = 300; x < ARENA_WIDTH; x += 600) {
      for (let y = 300; y < ARENA_HEIGHT; y += 600) {
        ctx.beginPath();
        ctx.ellipse(x, y, 160, 110, (x + y) * 0.01, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Arena Perimeter Fence / Thorn border
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#27272a';
    ctx.strokeRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

    // Warning barrier hazard stripe
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.strokeRect(8, 8, ARENA_WIDTH - 16, ARENA_HEIGHT - 16);
  }

  private renderGrassPatches(ctx: CanvasRenderingContext2D, patches: { id: string; x: number; y: number; radius: number }[]) {
    for (const gp of patches) {
      ctx.save();
      // Soft clover canopy gradient
      const grad = ctx.createRadialGradient(gp.x, gp.y, gp.radius * 0.15, gp.x, gp.y, gp.radius);
      grad.addColorStop(0, 'rgba(21, 128, 61, 0.45)');
      grad.addColorStop(0.75, 'rgba(22, 101, 52, 0.25)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(gp.x, gp.y, gp.radius, 0, Math.PI * 2);
      ctx.fill();

      // Cluster of 4-leaf clover stems for rich backyard ground detail
      ctx.fillStyle = '#15803d';
      ctx.strokeStyle = '#166534';
      ctx.lineWidth = 1.5;
      const leafCount = 8;
      for (let i = 0; i < leafCount; i++) {
        const ang = (i * Math.PI * 2) / leafCount;
        const dist = gp.radius * 0.45;
        const lx = gp.x + Math.cos(ang) * dist;
        const ly = gp.y + Math.sin(ang) * dist;
        for (let c = 0; c < 4; c++) {
          const cloverAng = (c * Math.PI) / 2;
          ctx.beginPath();
          ctx.ellipse(
            lx + Math.cos(cloverAng) * 8,
            ly + Math.sin(cloverAng) * 8,
            8,
            5,
            cloverAng,
            0,
            Math.PI * 2
          );
          ctx.fill();
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }

  private renderObstacles(ctx: CanvasRenderingContext2D, obstacles: ArenaObstacle[]) {
    for (const obs of obstacles) {
      ctx.save();
      ctx.translate(obs.x, obs.y);
      ctx.rotate(obs.angle);

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(4, 5, obs.radius, obs.radius * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();

      if (obs.type === 'leaf') {
        // Rotting oak/garden leaf
        ctx.fillStyle = '#365314';
        ctx.beginPath();
        ctx.ellipse(0, 0, obs.radius, obs.radius * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#4d7c0f';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Leaf vein
        ctx.strokeStyle = 'rgba(101, 163, 13, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-obs.radius + 6, 0);
        ctx.lineTo(obs.radius - 6, 0);
        ctx.stroke();
      } else if (obs.type === 'bottle_cap') {
        // Discarded soda bottle cap
        ctx.fillStyle = '#991b1b';
        ctx.beginPath();
        ctx.arc(0, 0, obs.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 3;
        ctx.stroke();
        // Rim ridges
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * (obs.radius - 5), Math.sin(a) * (obs.radius - 5));
          ctx.lineTo(Math.cos(a) * obs.radius, Math.sin(a) * obs.radius);
          ctx.stroke();
        }
      } else if (obs.type === 'twig') {
        // Wood twig
        ctx.fillStyle = '#44403c';
        ctx.beginPath();
        ctx.roundRect(-obs.radius, -6, obs.radius * 2, 12, 4);
        ctx.fill();
        ctx.strokeStyle = '#57534e';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        // Smooth river pebble
        ctx.fillStyle = '#52525b';
        ctx.beginPath();
        ctx.ellipse(0, 0, obs.radius, obs.radius * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#71717a';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  private renderWebs(ctx: CanvasRenderingContext2D, webs: SpiderWeb[]) {
    for (const web of webs) {
      const alpha = Math.min(0.8, web.duration / 3);
      ctx.save();
      ctx.strokeStyle = `rgba(241, 245, 249, ${alpha * 0.45})`;
      ctx.lineWidth = 1.5;

      // Concentric rings
      const rings = 4;
      for (let r = 1; r <= rings; r++) {
        const rad = (web.radius / rings) * r;
        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 2; a += Math.PI / 4) {
          const px = web.x + Math.cos(a) * rad;
          const py = web.y + Math.sin(a) * rad;
          if (a === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }

      // Radial spoke lines
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        ctx.beginPath();
        ctx.moveTo(web.x, web.y);
        ctx.lineTo(web.x + Math.cos(a) * web.radius, web.y + Math.sin(a) * web.radius);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  private renderToxicClouds(ctx: CanvasRenderingContext2D, clouds: ToxicCloud[]) {
    for (const cloud of clouds) {
      const alpha = Math.min(0.65, (cloud.duration / cloud.maxDuration) * 0.7);
      ctx.save();
      const grad = ctx.createRadialGradient(cloud.x, cloud.y, 5, cloud.x, cloud.y, cloud.radius);
      grad.addColorStop(0, `rgba(132, 204, 22, ${alpha * 0.8})`);
      grad.addColorStop(0.6, `rgba(101, 163, 13, ${alpha * 0.4})`);
      grad.addColorStop(1, 'rgba(77, 124, 15, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private renderSugarDrops(ctx: CanvasRenderingContext2D, drops: SugarDrop[]) {
    const time = Date.now() * 0.005;

    for (const drop of drops) {
      const pulse = Math.sin(time + drop.pulseOffset) * 1.5;
      const r = Math.max(3, drop.radius + pulse);

      ctx.save();
      // Outer radial glow
      const glow = ctx.createRadialGradient(drop.x, drop.y, 1, drop.x, drop.y, r * 2.2);
      glow.addColorStop(0, drop.color);
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(drop.x, drop.y, r * 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Sharp sugar drop crystal core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      if (drop.type === 'severed_segment') {
        // Hexagonal jewel shape for severed centipede meat!
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          const px = drop.x + Math.cos(a) * r;
          const py = drop.y + Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
      } else {
        ctx.arc(drop.x, drop.y, r * 0.7, 0, Math.PI * 2);
      }
      ctx.fill();

      ctx.restore();
    }
  }

  private renderFireflies(ctx: CanvasRenderingContext2D, fireflies: { id: string; x: number; y: number; vx: number; vy: number; glow: number }[]) {
    const time = Date.now() * 0.005;
    for (const ff of fireflies) {
      ctx.save();
      const pulse = 0.8 + Math.sin(time * 3 + ff.glow) * 0.25;
      const r = 10 * pulse;

      // Soft glowing cyan-gold halo
      const halo = ctx.createRadialGradient(ff.x, ff.y, 1, ff.x, ff.y, r * 3.2);
      halo.addColorStop(0, 'rgba(56, 189, 248, 0.9)');
      halo.addColorStop(0.4, 'rgba(250, 204, 21, 0.4)');
      halo.addColorStop(1, 'transparent');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(ff.x, ff.y, r * 3.2, 0, Math.PI * 2);
      ctx.fill();

      // Golden core
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(ff.x, ff.y, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Gossamer fluttering wings
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 1.2;
      const wingFlap = Math.sin(time * 28 + ff.glow) * 7;
      ctx.beginPath();
      ctx.moveTo(ff.x, ff.y);
      ctx.lineTo(ff.x - 7, ff.y - wingFlap);
      ctx.moveTo(ff.x, ff.y);
      ctx.lineTo(ff.x - 7, ff.y + wingFlap);
      ctx.stroke();

      ctx.restore();
    }
  }

  private renderGiantCrystals(ctx: CanvasRenderingContext2D, crystals: GiantSugarCrystal[]) {
    const time = Date.now() * 0.003;

    for (const crystal of crystals) {
      ctx.save();

      // Vertical beacon column effect
      const beaconGrad = ctx.createRadialGradient(crystal.x, crystal.y, 10, crystal.x, crystal.y, 220);
      beaconGrad.addColorStop(0, 'rgba(251, 191, 36, 0.45)');
      beaconGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.15)');
      beaconGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = beaconGrad;
      ctx.beginPath();
      ctx.arc(crystal.x, crystal.y, 220, 0, Math.PI * 2);
      ctx.fill();

      // Rotating multifaceted crystal spikes
      ctx.translate(crystal.x, crystal.y);
      ctx.rotate(time * 0.2);

      const spikes = 6;
      for (let i = 0; i < spikes; i++) {
        const a = (i * Math.PI * 2) / spikes;
        const len = crystal.radius + Math.sin(time * 3 + i) * 6;
        ctx.fillStyle = i % 2 === 0 ? '#fbbf24' : '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a - 0.3) * (len * 0.6), Math.sin(a - 0.3) * (len * 0.6));
        ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
        ctx.lineTo(Math.cos(a + 0.3) * (len * 0.6), Math.sin(a + 0.3) * (len * 0.6));
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Core crystal sphere
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, crystal.radius * 0.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Health bar above crystal
      const barW = 70;
      const barH = 7;
      const barX = crystal.x - barW / 2;
      const barY = crystal.y - crystal.radius - 20;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
      const hpPct = Math.max(0, crystal.hp / crystal.maxHp);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(barX, barY, barW * hpPct, barH);
    }
  }

  private renderMinions(ctx: CanvasRenderingContext2D, minions: MinionBug[]) {
    for (const m of minions) {
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(m.angle);

      ctx.fillStyle = m.type === 'guardian' ? '#78350f' : '#b45309';
      // Worker/guardian body
      ctx.beginPath();
      ctx.ellipse(0, 0, m.radius, m.radius * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Little mandibles
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(m.radius * 0.6, -3);
      ctx.lineTo(m.radius + 3, -1);
      ctx.moveTo(m.radius * 0.6, 3);
      ctx.lineTo(m.radius + 3, 1);
      ctx.stroke();

      ctx.restore();
    }
  }

  private renderPlayers(ctx: CanvasRenderingContext2D, players: BugPlayer[], selfId: string) {
    for (const player of players) {
      if (player.hp <= 0 && player.id !== selfId) continue;

      ctx.save();

      // Burrowed state: only shadow / dirt mound visible
      if (player.isBurrowed) {
        ctx.fillStyle = 'rgba(68, 64, 60, 0.6)';
        ctx.beginPath();
        ctx.ellipse(player.x, player.y, player.bodyRadius * 1.3, player.bodyRadius * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        continue;
      }

      // Clover grass camouflage
      if (player.isInGrass) {
        ctx.globalAlpha = player.id === selfId ? 0.78 : 0.38;
      }

      // Sugar rush golden aura
      if (player.isSugarRushActive) {
        ctx.save();
        const aura = ctx.createRadialGradient(player.x, player.y, player.bodyRadius * 0.5, player.x, player.y, player.bodyRadius * 2.2);
        aura.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
        aura.addColorStop(0.7, 'rgba(251, 191, 36, 0.25)');
        aura.addColorStop(1, 'transparent');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.bodyRadius * 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw bug according to Faction
      if (player.faction === 'centipede') {
        this.renderCentipede(ctx, player);
      } else if (player.faction === 'ant') {
        this.renderAnt(ctx, player);
      } else {
        this.renderSpider(ctx, player);
      }

      // Draw Name, Faction indicator, and HP bar above bug
      this.renderPlayerHUD(ctx, player, player.id === selfId);

      ctx.restore();
    }
  }

  private renderCentipede(ctx: CanvasRenderingContext2D, p: BugPlayer) {
    const time = Date.now() * (p.isBoosting ? 0.016 : 0.008);
    const totalSegs = p.segments.length;

    // 1. Draw segments from tail to head with Slither-style smooth tapering
    for (let i = totalSegs - 1; i >= 0; i--) {
      const seg = p.segments[i];
      ctx.save();
      ctx.translate(seg.x, seg.y);
      ctx.rotate(seg.angle);

      // Smooth taper: body starts full, narrows towards the tail
      const taperRatio = Math.max(0.48, 1 - (i / Math.max(1, totalSegs)) * 0.52);
      const segR = p.bodyRadius * taperRatio;

      // Segment legs (step animation faster on boost)
      const legWave = Math.sin(time * 2.4 + i * 0.75) * (p.isBoosting ? 6 : 4);
      ctx.strokeStyle = p.isBoosting ? '#fbbf24' : '#ea580c';
      ctx.lineWidth = Math.max(1.5, 2.5 * taperRatio);

      // Left leg
      ctx.beginPath();
      ctx.moveTo(0, -segR * 0.7);
      ctx.lineTo(-segR * 0.4, -segR - 7 * taperRatio + legWave);
      ctx.stroke();

      // Right leg
      ctx.beginPath();
      ctx.moveTo(0, segR * 0.7);
      ctx.lineTo(-segR * 0.4, segR + 7 * taperRatio - legWave);
      ctx.stroke();

      // Plated segment chitin carapace
      const segGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, segR);
      segGrad.addColorStop(0, i % 2 === 0 ? '#ef4444' : '#dc2626');
      segGrad.addColorStop(0.8, '#b91c1c');
      segGrad.addColorStop(1, '#7f1d1d');
      ctx.fillStyle = segGrad;

      ctx.beginPath();
      ctx.ellipse(0, 0, segR * 1.15, segR * 0.9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Chitin carapace ridge & spine
      ctx.strokeStyle = p.isBoosting ? '#fef08a' : '#f87171';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Boost sparks at tail
      if (p.isBoosting && i > totalSegs - 4 && Math.random() < 0.3) {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // 2. Draw Centipede Head Capsule
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);

    const headR = p.bodyRadius;
    const headGrad = ctx.createRadialGradient(0, 0, 3, 0, 0, headR);
    headGrad.addColorStop(0, '#f87171');
    headGrad.addColorStop(0.7, '#dc2626');
    headGrad.addColorStop(1, '#991b1b');

    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, headR * 1.3, headR * 1.0, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = p.isBoosting ? '#fbbf24' : '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Antennae
    const antWave = Math.sin(time * 3.5) * 0.18;
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(headR * 0.8, -headR * 0.4);
    ctx.quadraticCurveTo(headR * 1.5, -headR * 1.3 + antWave * 12, headR * 2.1, -headR * 1.1);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(headR * 0.8, headR * 0.4);
    ctx.quadraticCurveTo(headR * 1.5, headR * 1.3 - antWave * 12, headR * 2.1, headR * 1.1);
    ctx.stroke();

    // Piercing Forcipules / Mandibles (Snapping visual on bite or auto-bite)
    const isSnapping = p.isBiting || ((p.biteAnimTimer || 0) > 0);
    const biteOffset = isSnapping ? 9 : 0;
    ctx.fillStyle = isSnapping ? '#fef08a' : '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(headR * 0.9, -headR * 0.65);
    ctx.lineTo(headR * 1.8 + biteOffset, -headR * 0.15);
    ctx.lineTo(headR * 0.85, 0);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(headR * 0.9, headR * 0.65);
    ctx.lineTo(headR * 1.8 + biteOffset, headR * 0.15);
    ctx.lineTo(headR * 0.85, 0);
    ctx.closePath();
    ctx.fill();

    // Bite crunch flash spark
    if (isSnapping) {
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(headR * 1.85, 0, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Slither.io Expressive Animated Eyes Tracking Mouse Angle
    const eyeOffsetX = headR * 0.4;
    const eyeOffsetY = headR * 0.45;
    const eyeRadius = headR * 0.32;
    const pupilRadius = eyeRadius * 0.55;
    const relAngle = p.targetAngle - p.angle;

    [-1, 1].forEach((dir) => {
      const ey = dir * eyeOffsetY;
      // White sclera
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(eyeOffsetX, ey, eyeRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Pupil looking towards target angle
      const pupilShift = eyeRadius * 0.4;
      const px = eyeOffsetX + Math.cos(relAngle) * pupilShift;
      const py = ey + Math.sin(relAngle) * pupilShift;

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(px, py, pupilRadius, 0, Math.PI * 2);
      ctx.fill();

      // Eye glint
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px - 1, py - 1, pupilRadius * 0.35, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  private renderAnt(ctx: CanvasRenderingContext2D, p: BugPlayer) {
    const time = Date.now() * (p.isBoosting ? 0.02 : 0.01);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);

    const r = p.bodyRadius;

    // 6 articulated ant legs (rapid crawl when boosting)
    ctx.strokeStyle = p.isBoosting ? '#fbbf24' : '#d97706';
    ctx.lineWidth = 3;
    const legSteps = [-0.4, 0, 0.4];
    legSteps.forEach((offset, idx) => {
      const step = Math.sin(time * 2.5 + idx * 1.3) * (p.isBoosting ? 8 : 5);
      // Left leg
      ctx.beginPath();
      ctx.moveTo(offset * r, -r * 0.6);
      ctx.lineTo((offset - 0.2) * r, -r * 1.5 + step);
      ctx.stroke();
      // Right leg
      ctx.beginPath();
      ctx.moveTo(offset * r, r * 0.6);
      ctx.lineTo((offset - 0.2) * r, r * 1.5 - step);
      ctx.stroke();
    });

    // 1. Abdomen (Gaster)
    ctx.fillStyle = p.isBoosting ? '#854d0e' : '#78350f';
    ctx.beginPath();
    ctx.ellipse(-r * 0.95, 0, r * 0.95, r * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = p.isBoosting ? '#fbbf24' : '#b45309';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 2. Thorax (Mesosoma)
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.65, r * 0.52, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Head & Guillotine Mandibles
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.ellipse(r * 0.85, 0, r * 0.72, r * 0.68, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Heavy razor mandibles with crushing snap
    const isAntBiting = p.isBiting || ((p.biteAnimTimer || 0) > 0);
    const biteSpread = isAntBiting ? 1.5 : 7;
    ctx.fillStyle = isAntBiting ? '#fef08a' : p.isBoosting ? '#fbbf24' : '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(r * 1.2, -biteSpread);
    ctx.lineTo(r * 2.05, -1);
    ctx.lineTo(r * 1.1, 0);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(r * 1.2, biteSpread);
    ctx.lineTo(r * 2.05, 1);
    ctx.lineTo(r * 1.1, 0);
    ctx.closePath();
    ctx.fill();

    if (isAntBiting) {
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(r * 2.1, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Slither.io Expressive Animated Eyes Tracking Mouse Angle
    const eyeRadius = r * 0.28;
    const pupilRadius = eyeRadius * 0.55;
    const relAngle = p.targetAngle - p.angle;

    [-1, 1].forEach((dir) => {
      const ey = dir * (r * 0.42);
      const ex = r * 0.85;

      // Sclera
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex, ey, eyeRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Pupil looking towards target angle
      const pupilShift = eyeRadius * 0.4;
      const px = ex + Math.cos(relAngle) * pupilShift;
      const py = ey + Math.sin(relAngle) * pupilShift;

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(px, py, pupilRadius, 0, Math.PI * 2);
      ctx.fill();

      // Glint
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px - 1, py - 1, pupilRadius * 0.35, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  private renderSpider(ctx: CanvasRenderingContext2D, p: BugPlayer) {
    const time = Date.now() * (p.isBoosting ? 0.018 : 0.009);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);

    const r = p.bodyRadius;

    // 8 long articulated spider legs (rapid stride on boost)
    ctx.strokeStyle = p.isBoosting ? '#c084fc' : '#6b21a8';
    ctx.lineWidth = 3;
    const angles = [-0.6, -0.2, 0.2, 0.6];
    angles.forEach((offset, idx) => {
      const step = Math.sin(time * 2.2 + idx * 1.4) * (p.isBoosting ? 9 : 6);
      // Left leg
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.5);
      ctx.lineTo(offset * r * 1.2, -r * 1.6 + step);
      ctx.lineTo(offset * r * 1.6, -r * 2.4 + step);
      ctx.stroke();

      // Right leg
      ctx.beginPath();
      ctx.moveTo(0, r * 0.5);
      ctx.lineTo(offset * r * 1.2, r * 1.6 - step);
      ctx.lineTo(offset * r * 1.6, r * 2.4 - step);
      ctx.stroke();
    });

    // Abdomen (large oval with pattern)
    ctx.fillStyle = '#3b0764';
    ctx.beginPath();
    ctx.ellipse(-r * 0.75, 0, r * 0.9, r * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = p.isBoosting ? '#e879f9' : '#9333ea';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Abdomen hourglass or predator diamond mark
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.moveTo(-r * 0.95, 0);
    ctx.lineTo(-r * 0.65, -5);
    ctx.lineTo(-r * 0.45, 0);
    ctx.lineTo(-r * 0.65, 5);
    ctx.closePath();
    ctx.fill();

    // Cephalothorax
    ctx.fillStyle = '#581c87';
    ctx.beginPath();
    ctx.ellipse(r * 0.45, 0, r * 0.65, r * 0.58, 0, 0, Math.PI * 2);
    ctx.fill();

    // Chelicerae / Fangs
    const isSpiderBiting = p.isBiting || ((p.biteAnimTimer || 0) > 0);
    const fangBite = isSpiderBiting ? 7 : 0;
    ctx.fillStyle = isSpiderBiting ? '#f0abfc' : '#c084fc';
    ctx.beginPath();
    ctx.moveTo(r * 0.85, -4);
    ctx.lineTo(r * 1.5 + fangBite, -2);
    ctx.lineTo(r * 0.75, 0);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(r * 0.85, 4);
    ctx.lineTo(r * 1.5 + fangBite, 2);
    ctx.lineTo(r * 0.75, 0);
    ctx.closePath();
    ctx.fill();

    if (isSpiderBiting) {
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(r * 1.55, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Slither.io Expressive Animated Eyes Tracking Mouse Angle
    const eyeRadius = r * 0.22;
    const pupilRadius = eyeRadius * 0.55;
    const relAngle = p.targetAngle - p.angle;

    [-1, 1].forEach((dir) => {
      const ey = dir * (r * 0.32);
      const ex = r * 0.55;

      // Outer ruby eye ring
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex, ey, eyeRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#581c87';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Pupil looking towards target angle
      const pupilShift = eyeRadius * 0.4;
      const px = ex + Math.cos(relAngle) * pupilShift;
      const py = ey + Math.sin(relAngle) * pupilShift;

      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.arc(px, py, pupilRadius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Secondary smaller eyes
    ctx.fillStyle = '#f43f5e';
    for (let e = -2; e <= 2; e += 4) {
      ctx.beginPath();
      ctx.arc(r * 0.75, e * 3, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private renderPlayerHUD(ctx: CanvasRenderingContext2D, p: BugPlayer, isSelf: boolean) {
    const hudY = p.y - p.bodyRadius - 22;

    // Name & Stage Tag
    ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = isSelf ? '#38bdf8' : '#f1f5f9';
    const factionIcon = p.faction === 'centipede' ? '🐛' : p.faction === 'ant' ? '🐜' : '🕷️';
    ctx.fillText(`${factionIcon} ${p.name} [S${p.stage}]`, p.x, hudY - 7);

    // HP Bar
    const barW = Math.max(36, p.bodyRadius * 2);
    const barH = 5;
    const barX = p.x - barW / 2;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(barX - 1, hudY - 1, barW + 2, barH + 2);

    const hpPct = Math.max(0, p.hp / p.maxHp);
    ctx.fillStyle = isSelf ? '#10b981' : hpPct > 0.4 ? '#f59e0b' : '#ef4444';
    ctx.fillRect(barX, hudY, barW * hpPct, barH);
  }

  private renderProjectiles(ctx: CanvasRenderingContext2D, projectiles: Projectile[]) {
    for (const p of projectiles) {
      ctx.save();
      ctx.translate(p.x, p.y);

      if (p.type === 'web_shot') {
        // Spinning web net
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * p.radius, Math.sin(a) * p.radius);
        }
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Venom dart
        ctx.fillStyle = '#84cc16';
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  private renderParticles(ctx: CanvasRenderingContext2D, dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.alpha -= pt.decay;

      if (pt.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = pt.alpha;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private renderFloatingTexts(ctx: CanvasRenderingContext2D, floatingTexts: { x: number; y: number; text: string; color: string; alpha: number; size: number }[]) {
    for (const ft of floatingTexts) {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.font = `bold ${ft.size || 14}px "Chakra Petch", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = ft.color;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }

  private renderVignette(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const vig = ctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.45,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.75
    );
    vig.addColorStop(0, 'transparent');
    vig.addColorStop(1, 'rgba(0, 5, 2, 0.65)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, width, height);
  }

  private renderSpeedStreaks(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 1.5;
    const cx = width / 2;
    const cy = height / 2;
    const time = Date.now() * 0.02;

    for (let i = 0; i < 20; i++) {
      const angle = (i * Math.PI) / 10 + Math.sin(time + i * 2) * 0.08;
      const startDist = Math.min(width, height) * 0.32 + ((i * 31) % 90);
      const len = 60 + ((i * 23) % 80);

      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * startDist, cy + Math.sin(angle) * startDist);
      ctx.lineTo(cx + Math.cos(angle) * (startDist + len), cy + Math.sin(angle) * (startDist + len));
      ctx.stroke();
    }
    ctx.restore();
  }
}
