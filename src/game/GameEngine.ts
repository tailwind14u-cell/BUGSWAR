import {
  ArenaObstacle,
  BugPlayer,
  FACTION_DETAILS,
  Faction,
  FloatingText,
  GameSnapshot,
  GiantSugarCrystal,
  KillFeedItem,
  LeaderboardEntry,
  MinionBug,
  Projectile,
  Segment,
  SpiderWeb,
  StageIndex,
  SugarDrop,
  SugarType,
  ToxicCloud
} from '../types/game';

export const ARENA_WIDTH = 3400;
export const ARENA_HEIGHT = 3400;

export interface PlayerInput {
  targetAngle: number;
  isBiting: boolean;
  autoBite?: boolean;
  useAbility: boolean;
  useUltimate: boolean;
  boost: boolean;
}

export class GameEngine {
  public players: Map<string, BugPlayer> = new Map();
  public minions: MinionBug[] = [];
  public sugarDrops: SugarDrop[] = [];
  public giantCrystals: GiantSugarCrystal[] = [];
  public webs: SpiderWeb[] = [];
  public toxicClouds: ToxicCloud[] = [];
  public projectiles: Projectile[] = [];
  public obstacles: ArenaObstacle[] = [];
  public grassPatches: { id: string; x: number; y: number; radius: number }[] = [];
  public fireflies: { id: string; x: number; y: number; vx: number; vy: number; glow: number }[] = [];
  public floatingTexts: FloatingText[] = [];
  public killFeed: KillFeedItem[] = [];

  private nextId = 1;
  private crystalSpawnTimer = 0;
  private botSpawnTimer = 0;
  private worldChunkTimer = 0;
  private baseObstacles: ArenaObstacle[] = [];
  private baseGrassPatches: { id: string; x: number; y: number; radius: number }[] = [];
  private dynamicWorldChunks = new Map<string, {
    obstacles: ArenaObstacle[];
    grassPatches: { id: string; x: number; y: number; radius: number }[];
  }>();
  public onEvent?: (event: { type: string; payload?: unknown }) => void;

  constructor() {
    this.initArena();
  }

  private generateId(prefix: string = 'ent'): string {
    return `${prefix}_${Date.now()}_${this.nextId++}_${Math.floor(Math.random() * 1000)}`;
  }

  public initArena() {
    this.obstacles = [];
    this.grassPatches = [];
    this.fireflies = [];
    this.sugarDrops = [];
    this.giantCrystals = [];
    this.webs = [];
    this.toxicClouds = [];
    this.projectiles = [];
    this.floatingTexts = [];
    this.killFeed = [];
    this.dynamicWorldChunks.clear();
    this.worldChunkTimer = 0;

    // Seed obstacles (pebbles, twigs, leaves, bottle caps)
    for (let i = 0; i < 45; i++) {
      const type: ArenaObstacle['type'] = ['pebble', 'twig', 'leaf', 'bottle_cap'][Math.floor(Math.random() * 4)] as ArenaObstacle['type'];
      const radius = type === 'leaf' ? 55 : type === 'bottle_cap' ? 38 : type === 'twig' ? 28 : 22;
      this.obstacles.push({
        id: this.generateId('obs'),
        type,
        x: 150 + Math.random() * (ARENA_WIDTH - 300),
        y: 150 + Math.random() * (ARENA_HEIGHT - 300),
        radius,
        angle: Math.random() * Math.PI * 2,
        color: type === 'leaf' ? '#4d7c0f' : type === 'bottle_cap' ? '#b91c1c' : '#78716c'
      });
    }

    // Seed clover grass patches for tactical ambush camouflage
    for (let i = 0; i < 14; i++) {
      this.grassPatches.push({
        id: this.generateId('grass'),
        x: 250 + Math.random() * (ARENA_WIDTH - 500),
        y: 250 + Math.random() * (ARENA_HEIGHT - 500),
        radius: 95 + Math.random() * 55
      });
    }

    this.baseObstacles = this.obstacles.slice();
    this.baseGrassPatches = this.grassPatches.slice();

    // Seed roaming Queen Nectar Wisps (Fireflies)
    for (let i = 0; i < 8; i++) {
      this.spawnFirefly();
    }

    // Seed initial sugar drops (honeydew nectar)
    this.spawnSugarDrops(180);

    // Seed initial Giant Sugar Crystals
    this.spawnGiantCrystal(ARENA_WIDTH * 0.5, ARENA_HEIGHT * 0.5);
    this.spawnGiantCrystal(ARENA_WIDTH * 0.25, ARENA_HEIGHT * 0.75);
    this.spawnGiantCrystal(ARENA_WIDTH * 0.8, ARENA_HEIGHT * 0.3);

    // Seed AI bug population
    this.populateBots(14);
  }

  public spawnFirefly() {
    const center = this.getWorldSpawnCenter();
    this.fireflies.push({
      id: this.generateId('wisp'),
      x: center.x + (Math.random() - 0.5) * 1000,
      y: center.y + (Math.random() - 0.5) * 1000,
      vx: (Math.random() - 0.5) * 80,
      vy: (Math.random() - 0.5) * 80,
      glow: Math.random() * Math.PI * 2
    });
  }

  public spawnSugarDrops(count: number) {
    const center = this.getWorldSpawnCenter();
    for (let i = 0; i < count; i++) {
      const isCluster = Math.random() < 0.15;
      const type: SugarType = isCluster ? 'cluster' : 'standard';
      const value = isCluster ? 35 : 12;
      const radius = isCluster ? 9 : 6;
      const color = isCluster ? '#38bdf8' : '#34d399';

      this.sugarDrops.push({
        id: this.generateId('sugar'),
        x: center.x + (Math.random() - 0.5) * 1400,
        y: center.y + (Math.random() - 0.5) * 1400,
        value,
        type,
        radius,
        color,
        pulseOffset: Math.random() * Math.PI * 2
      });
    }
  }

  public spawnGiantCrystal(x?: number, y?: number) {
    const center = this.getWorldSpawnCenter();
    this.giantCrystals.push({
      id: this.generateId('crystal'),
      x: x ?? center.x + (Math.random() - 0.5) * 1200,
      y: y ?? center.y + (Math.random() - 0.5) * 1200,
      radius: 46,
      hp: 350,
      maxHp: 350,
      value: 300,
      pulseTimer: 0,
      beaconAlpha: 0.9
    });
  }

  private getWorldSpawnCenter(): { x: number; y: number } {
    const activePlayers = Array.from(this.players.values()).filter(player => player.hp > 0);
    const humanPlayers = activePlayers.filter(player => !player.isBot);
    const candidates = humanPlayers.length > 0 ? humanPlayers : activePlayers;
    if (candidates.length === 0) {
      return { x: ARENA_WIDTH / 2, y: ARENA_HEIGHT / 2 };
    }

    const player = candidates[Math.floor(Math.random() * candidates.length)];
    return { x: player.x, y: player.y };
  }

  private updateWorldChunks() {
    const chunkSize = 1200;
    const desiredChunks = new Set<string>();

    for (const player of this.players.values()) {
      if (player.hp <= 0 || player.isBot) continue;

      const centerX = Math.floor(player.x / chunkSize);
      const centerY = Math.floor(player.y / chunkSize);
      for (let offsetX = -1; offsetX <= 1; offsetX++) {
        for (let offsetY = -1; offsetY <= 1; offsetY++) {
          const chunkX = centerX + offsetX;
          const chunkY = centerY + offsetY;
          const fullyInsideStartingArea =
            chunkX >= 0 &&
            (chunkX + 1) * chunkSize <= ARENA_WIDTH &&
            chunkY >= 0 &&
            (chunkY + 1) * chunkSize <= ARENA_HEIGHT;
          if (fullyInsideStartingArea) continue;

          const key = `${chunkX},${chunkY}`;
          desiredChunks.add(key);
          if (this.dynamicWorldChunks.has(key)) continue;

          let seed = (chunkX * 73856093 ^ chunkY * 19349663) >>> 0;
          const random = () => {
            seed = (seed * 1664525 + 1013904223) >>> 0;
            return seed / 4294967296;
          };
          const obstacles: ArenaObstacle[] = [];
          const obstacleTypes: ArenaObstacle['type'][] = ['pebble', 'twig', 'leaf', 'bottle_cap'];

          for (let i = 0; i < 6; i++) {
            const type = obstacleTypes[Math.floor(random() * obstacleTypes.length)];
            obstacles.push({
              id: this.generateId('obs'),
              type,
              x: chunkX * chunkSize + random() * chunkSize,
              y: chunkY * chunkSize + random() * chunkSize,
              radius: type === 'leaf' ? 55 : type === 'bottle_cap' ? 38 : type === 'twig' ? 28 : 22,
              angle: random() * Math.PI * 2,
              color: type === 'leaf' ? '#4d7c0f' : type === 'bottle_cap' ? '#b91c1c' : '#78716c'
            });
          }

          const grassPatches = Array.from({ length: 2 }, () => ({
            id: this.generateId('grass'),
            x: chunkX * chunkSize + random() * chunkSize,
            y: chunkY * chunkSize + random() * chunkSize,
            radius: 95 + random() * 55
          }));
          this.dynamicWorldChunks.set(key, { obstacles, grassPatches });
        }
      }
    }

    for (const key of this.dynamicWorldChunks.keys()) {
      if (!desiredChunks.has(key)) this.dynamicWorldChunks.delete(key);
    }

    this.obstacles = [
      ...this.baseObstacles,
      ...Array.from(this.dynamicWorldChunks.values()).flatMap(chunk => chunk.obstacles)
    ];
    this.grassPatches = [
      ...this.baseGrassPatches,
      ...Array.from(this.dynamicWorldChunks.values()).flatMap(chunk => chunk.grassPatches)
    ];
  }

  public createPlayer(
    id: string,
    name: string,
    faction: Faction,
    isBot: boolean = false,
    x?: number,
    y?: number
  ): BugPlayer {
    const stageData = FACTION_DETAILS[faction].stages[1];
    const spawnCenter = this.getWorldSpawnCenter();
    const px = x ?? spawnCenter.x + (Math.random() - 0.5) * 900;
    const py = y ?? spawnCenter.y + (Math.random() - 0.5) * 900;
    const angle = Math.random() * Math.PI * 2;

    const segments: Segment[] = [];
    if (faction === 'centipede') {
      const initialSegCount = 7;
      const segSpacing = 18;
      for (let i = 0; i < initialSegCount; i++) {
        segments.push({
          x: px - Math.cos(angle) * (i + 1) * segSpacing,
          y: py - Math.sin(angle) * (i + 1) * segSpacing,
          angle,
          radius: 12,
          health: 50
        });
      }
    }

    const player: BugPlayer = {
      id,
      name,
      faction,
      stage: 1,
      x: px,
      y: py,
      vx: 0,
      vy: 0,
      angle,
      targetAngle: angle,
      speed: stageData.stats.speed,
      maxSpeed: stageData.stats.speed,
      hp: stageData.stats.health,
      maxHp: stageData.stats.health,
      xp: 0,
      nextStageXp: FACTION_DETAILS[faction].stages[2].xpRequired,
      score: 0,
      kills: 0,
      segmentsSevered: 0,
      sugarRush: 0,
      isSugarRushActive: false,
      sugarRushTimer: 0,
      bodyRadius: faction === 'spider' ? 18 : faction === 'ant' ? 20 : 16,
      segments,
      isBurrowed: false,
      burrowTimer: 0,
      isStunned: false,
      stunTimer: 0,
      isPoisoned: false,
      poisonTimer: 0,
      isWebbed: false,
      webbedTimer: 0,
      abilityCooldownTimer: 0,
      abilityMaxCooldown: stageData.abilityCooldown,
      ultimateCooldownTimer: 0,
      ultimateMaxCooldown: stageData.ultimateCooldown || 12,
      isBiting: false,
      autoBite: true,
      isBoosting: false,
      boostDropTimer: 0,
      biteCooldownTimer: 0,
      biteAnimTimer: 0,
      killStreak: 0,
      isInGrass: false,
      isBot,
      color: FACTION_DETAILS[faction].primaryColor,
      secondaryColor: FACTION_DETAILS[faction].secondaryColor
    };

    this.players.set(id, player);
    return player;
  }

  public populateBots(targetCount: number) {
    const botNames = [
      'Gnasher', 'Stalker99', 'SilkQueen', 'MandibleRex', 'ViperPede',
      'PheromoneX', 'CrawlerJoe', 'ThoraxBane', 'WebSlinger', 'ToxicSpike',
      'ChitinTitan', 'ColonyGuard', 'ShadowWidow', 'RazorJaw', 'Scolopendra'
    ];

    const factions: Faction[] = ['centipede', 'ant', 'spider'];
    let currentBots = Array.from(this.players.values()).filter(p => p.isBot).length;

    while (currentBots < targetCount) {
      const faction = factions[Math.floor(Math.random() * factions.length)];
      const name = botNames[Math.floor(Math.random() * botNames.length)] + ` #${Math.floor(10 + Math.random() * 89)}`;
      const bot = this.createPlayer(`bot_${Date.now()}_${Math.random()}`, name, faction, true);
      // Give some bots initial XP so there are higher stage bugs wandering the yard
      if (Math.random() < 0.4) {
        this.addXp(bot, Math.floor(Math.random() * 500));
      }
      currentBots++;
    }
  }

  public addXp(player: BugPlayer, amount: number) {
    player.xp += amount;
    player.score += amount;
    player.sugarRush = Math.min(100, player.sugarRush + amount * 0.25);

    // Auto-trigger sugar rush if 100% filled
    if (player.sugarRush >= 100 && !player.isSugarRushActive) {
      this.activateSugarRush(player);
    }

    // Check Evolution
    const currentFaction = FACTION_DETAILS[player.faction];
    if (player.stage === 1 && player.xp >= currentFaction.stages[2].xpRequired) {
      this.evolvePlayer(player, 2);
    } else if (player.stage === 2 && player.xp >= currentFaction.stages[3].xpRequired) {
      this.evolvePlayer(player, 3);
    } else if (player.stage === 3 && player.xp >= currentFaction.stages[4].xpRequired) {
      this.evolvePlayer(player, 4);
    }

    // Centipedes grow new segments as they eat
    if (player.faction === 'centipede') {
      const targetSegCount = Math.min(38, 7 + Math.floor(player.xp / 35));
      while (player.segments.length < targetSegCount) {
        const lastSeg = player.segments[player.segments.length - 1];
        player.segments.push({
          x: lastSeg ? lastSeg.x : player.x - 20,
          y: lastSeg ? lastSeg.y : player.y,
          angle: lastSeg ? lastSeg.angle : player.angle,
          radius: Math.min(16, 12 + player.stage * 1.2),
          health: 50 + player.stage * 20
        });
      }
    }
  }

  public evolvePlayer(player: BugPlayer, nextStage: StageIndex) {
    player.stage = nextStage;
    const stageData = FACTION_DETAILS[player.faction].stages[nextStage];
    player.maxHp = stageData.stats.health;
    player.hp = player.maxHp; // Full heal on evolution
    player.speed = stageData.stats.speed;
    player.maxSpeed = stageData.stats.speed;
    player.abilityMaxCooldown = stageData.abilityCooldown;
    player.abilityCooldownTimer = 0;
    player.bodyRadius = (player.faction === 'spider' ? 18 : player.faction === 'ant' ? 20 : 16) + (nextStage - 1) * 3;

    if (nextStage < 4) {
      player.nextStageXp = FACTION_DETAILS[player.faction].stages[(nextStage + 1) as StageIndex].xpRequired;
    } else {
      player.nextStageXp = 99999;
    }

    this.addFloatingText(`★ MUTATED: ${stageData.speciesName.toUpperCase()}!`, player.x, player.y - 30, '#facc15', 18);

    if (this.onEvent) {
      this.onEvent({
        type: 'evolved',
        payload: {
          playerId: player.id,
          stage: nextStage,
          speciesName: stageData.speciesName,
          isSelf: !player.isBot
        }
      });
    }
  }

  public activateSugarRush(player: BugPlayer) {
    player.isSugarRushActive = true;
    player.sugarRushTimer = 6.5; // 6.5 seconds of adrenaline
    player.sugarRush = 100;
    this.addFloatingText('⚡ SUGAR RUSH!', player.x, player.y - 40, '#38bdf8', 20);

    if (this.onEvent) {
      this.onEvent({ type: 'sugar_rush', payload: { playerId: player.id } });
    }
  }

  public addFloatingText(text: string, x: number, y: number, color: string = '#f1f5f9', size: number = 14) {
    this.floatingTexts.push({
      id: this.generateId('float'),
      text,
      x: x + (Math.random() - 0.5) * 16,
      y,
      color,
      size,
      alpha: 1.0,
      duration: 1.3,
      vy: -1.2
    });
  }

  public update(dt: number) {
    this.worldChunkTimer += dt;
    if (this.worldChunkTimer >= 1) {
      this.worldChunkTimer = 0;
      this.updateWorldChunks();
    }

    // 1. Replenish sugar drops if too few
    if (this.sugarDrops.length < 160) {
      this.spawnSugarDrops(30);
    }

    // 2. Giant Sugar Crystal respawn timer
    this.crystalSpawnTimer += dt;
    if (this.giantCrystals.length < 2 && this.crystalSpawnTimer > 18) {
      this.crystalSpawnTimer = 0;
      this.spawnGiantCrystal();
      const crystal = this.giantCrystals[this.giantCrystals.length - 1];
      this.addFloatingText('💎 GIANT SUGAR CRYSTAL SPAWNED!', crystal.x, crystal.y, '#fbbf24', 22);
    }

    // 3. Keep bot population populated
    this.botSpawnTimer += dt;
    if (this.botSpawnTimer > 3) {
      this.botSpawnTimer = 0;
      const botCount = Array.from(this.players.values()).filter(p => p.isBot).length;
      if (botCount < 14) {
        this.populateBots(14);
      }
    }

    // 4. Update Giant Crystals
    for (let i = this.giantCrystals.length - 1; i >= 0; i--) {
      const crystal = this.giantCrystals[i];
      crystal.pulseTimer += dt * 3;
      if (crystal.hp <= 0) {
        // Explode into shower of sugar drops!
        for (let s = 0; s < 25; s++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 30 + Math.random() * 120;
          this.sugarDrops.push({
            id: this.generateId('sugar_shatter'),
            x: crystal.x + Math.cos(angle) * dist,
            y: crystal.y + Math.sin(angle) * dist,
            value: 40,
            type: 'crystal',
            radius: 8,
            color: '#fbbf24',
            pulseOffset: Math.random() * Math.PI * 2
          });
        }
        this.addFloatingText('💥 CRYSTAL SHATTERED!', crystal.x, crystal.y, '#f59e0b', 20);
        this.giantCrystals.splice(i, 1);
      }
    }

    // 5. Update Spider Webs
    for (let i = this.webs.length - 1; i >= 0; i--) {
      const web = this.webs[i];
      web.duration -= dt;
      if (web.duration <= 0) {
        this.webs.splice(i, 1);
      }
    }

    // 6. Update Toxic Clouds
    for (let i = this.toxicClouds.length - 1; i >= 0; i--) {
      const cloud = this.toxicClouds[i];
      cloud.duration -= dt;
      if (cloud.duration <= 0) {
        this.toxicClouds.splice(i, 1);
      }
    }

    // 7. Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      p.rangeRemaining -= Math.hypot(p.vx, p.vy) * dt * 60;

      // Hit checks against players
      let hit = false;
      for (const target of this.players.values()) {
        if (target.id === p.ownerId || target.hp <= 0 || target.isBurrowed) continue;
        const dist = Math.hypot(target.x - p.x, target.y - p.y);
        if (dist < target.bodyRadius + p.radius) {
          hit = true;
          // Apply effect
          if (p.type === 'web_shot') {
            target.isWebbed = true;
            target.webbedTimer = 2.5;
            this.damagePlayer(target, p.damage, p.ownerId);
            this.addFloatingText('🕸️ ENTRAINED!', target.x, target.y - 20, '#c084fc');
          } else if (p.type === 'venom_dart') {
            target.isPoisoned = true;
            target.poisonTimer = 3.5;
            this.damagePlayer(target, p.damage, p.ownerId);
          }
          break;
        }
      }

      if (hit || p.rangeRemaining <= 0) {
        this.projectiles.splice(i, 1);
      }
    }

    // 8. Update Minions
    for (let i = this.minions.length - 1; i >= 0; i--) {
      const minion = this.minions[i];
      minion.duration -= dt;
      if (minion.duration <= 0 || minion.hp <= 0) {
        this.minions.splice(i, 1);
        continue;
      }

      const owner = this.players.get(minion.ownerId);
      if (!owner) {
        this.minions.splice(i, 1);
        continue;
      }

      if (minion.type === 'guardian') {
        // Orbit owner defensively
        const orbitAngle = Date.now() * 0.003 + (i * Math.PI * 0.66);
        const targetX = owner.x + Math.cos(orbitAngle) * 60;
        const targetY = owner.y + Math.sin(orbitAngle) * 60;
        minion.x += (targetX - minion.x) * dt * 8;
        minion.y += (targetY - minion.y) * dt * 8;
        minion.angle = orbitAngle + Math.PI / 2;

        // Attack nearby foes
        for (const foe of this.players.values()) {
          if (foe.id === owner.id || foe.isBurrowed) continue;
          const dist = Math.hypot(foe.x - minion.x, foe.y - minion.y);
          if (dist < minion.radius + foe.bodyRadius) {
            this.damagePlayer(foe, minion.damage * dt * 5, owner.id);
          }
        }
      } else {
        // Worker ant: harvest sugar or swarm nearest enemy
        let nearestSugar: SugarDrop | null = null;
        let minDist = 300;
        for (const drop of this.sugarDrops) {
          const d = Math.hypot(drop.x - minion.x, drop.y - minion.y);
          if (d < minDist) {
            minDist = d;
            nearestSugar = drop;
          }
        }

        if (nearestSugar) {
          const angle = Math.atan2(nearestSugar.y - minion.y, nearestSugar.x - minion.x);
          minion.x += Math.cos(angle) * 140 * dt;
          minion.y += Math.sin(angle) * 140 * dt;
          minion.angle = angle;
          if (minDist < 15) {
            this.addXp(owner, nearestSugar.value);
            const dropIdx = this.sugarDrops.indexOf(nearestSugar);
            if (dropIdx !== -1) this.sugarDrops.splice(dropIdx, 1);
          }
        } else {
          // Wander near owner
          const angle = Math.atan2(owner.y - minion.y, owner.x - minion.x);
          minion.x += Math.cos(angle) * 110 * dt;
          minion.y += Math.sin(angle) * 110 * dt;
          minion.angle = angle;
        }
      }
    }

    // 8.5. Update Roaming Fireflies / Queen Nectar Wisps
    for (let i = this.fireflies.length - 1; i >= 0; i--) {
      const ff = this.fireflies[i];
      ff.glow += dt * 3.5;

      // Flee from nearby bugs
      for (const player of this.players.values()) {
        if (player.hp <= 0 || player.isBurrowed) continue;
        const dist = Math.hypot(player.x - ff.x, player.y - ff.y);
        if (dist < 180 && dist > 0) {
          const fleeAngle = Math.atan2(ff.y - player.y, ff.x - player.x);
          ff.vx += Math.cos(fleeAngle) * 260 * dt;
          ff.vy += Math.sin(fleeAngle) * 260 * dt;
        }

        // Catch Queen Nectar Wisp!
        if (dist < player.bodyRadius + 15) {
          this.addXp(player, 180);
          this.activateSugarRush(player);
          this.addFloatingText('✨ QUEEN WISP CAUGHT! +180 XP', player.x, player.y - 35, '#38bdf8', 19);
          this.fireflies.splice(i, 1);
          if (this.onEvent) {
            this.onEvent({ type: 'wisp_eaten', payload: { isSelf: !player.isBot } });
          }
          break;
        }
      }

      ff.vx *= 0.98;
      ff.vy *= 0.98;
      ff.x += ff.vx * dt;
      ff.y += ff.vy * dt;

    }

    if (this.fireflies.length < 6 && Math.random() < 0.04) {
      this.spawnFirefly();
    }

    // 9. Update Players
    for (const player of this.players.values()) {
      this.updatePlayerTimers(player, dt);

      // AI Bot Decision Making
      if (player.isBot) {
        this.updateBotAI(player, dt);
      }

      // Physics & Movement
      this.updatePlayerMovement(player, dt);

      // Clover Grass Camouflage
      player.isInGrass = this.grassPatches.some(gp => Math.hypot(player.x - gp.x, player.y - gp.y) < gp.radius);

      // Centipede Segment Follow Physics
      if (player.faction === 'centipede' && player.segments.length > 0) {
        this.updateCentipedeSegments(player);
      }

      // Slither.io Head-to-Body Cut-off & Collision Mechanics
      this.checkSlitherCollisions(player, dt);

      // Environment Interactions (Webs, Toxic Clouds)
      this.updateEnvironmentInteractions(player, dt);

      // Sugar drop consumption
      this.checkSugarDropCollisions(player);

      // Primary bite check: manual bite OR auto-bite when a target is within reach
      const isAutoBiting = player.autoBite && this.isTargetInBiteRange(player);
      if ((player.isBiting || isAutoBiting) && player.biteCooldownTimer <= 0 && !player.isBurrowed && !player.isStunned) {
        this.performBite(player);
      }
    }

    // 10. Update Floating Combat Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.duration -= dt;
      ft.y += ft.vy;
      ft.alpha = Math.max(0, ft.duration / 1.3);
      if (ft.duration <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  private updatePlayerTimers(player: BugPlayer, dt: number) {
    if (player.biteCooldownTimer > 0) player.biteCooldownTimer -= dt;
    if (player.biteAnimTimer && player.biteAnimTimer > 0) player.biteAnimTimer -= dt;
    if (player.abilityCooldownTimer > 0) player.abilityCooldownTimer -= dt;
    if (player.ultimateCooldownTimer > 0) player.ultimateCooldownTimer -= dt;

    if (player.stunTimer > 0) {
      player.stunTimer -= dt;
      if (player.stunTimer <= 0) player.isStunned = false;
    }

    if (player.burrowTimer > 0) {
      player.burrowTimer -= dt;
      if (player.burrowTimer <= 0) {
        player.isBurrowed = false;
        this.addFloatingText('⚔ SURPRISE AMBUSH!', player.x, player.y - 20, '#c084fc', 16);
      }
    }

    if (player.webbedTimer > 0) {
      player.webbedTimer -= dt;
      if (player.webbedTimer <= 0) player.isWebbed = false;
    }

    if (player.poisonTimer > 0) {
      player.poisonTimer -= dt;
      this.damagePlayer(player, 16 * dt, player.lastDamagedBy);
      if (player.poisonTimer <= 0) player.isPoisoned = false;
    }

    if (player.isSugarRushActive) {
      player.sugarRushTimer -= dt;
      player.sugarRush = (player.sugarRushTimer / 6.5) * 100;
      if (player.sugarRushTimer <= 0) {
        player.isSugarRushActive = false;
        player.sugarRush = 0;
      }
    }
  }

  /**
   * Slither.io Head-to-Body Cut-off & Impact Mechanics:
   * Cutting in front of an opponent forces head-on collisions that deal massive crash damage,
   * trigger segment severing, or reward cut-off kills.
   */
  private checkSlitherCollisions(player: BugPlayer, dt: number) {
    if (player.hp <= 0 || player.isBurrowed) return;

    for (const other of this.players.values()) {
      if (other.id === player.id || other.hp <= 0 || other.isBurrowed) continue;

      // 1. Centipede Body Hazard: Ramming head-first into a Centipede's body
      if (other.faction === 'centipede' && other.segments.length > 1) {
        for (let i = 1; i < other.segments.length; i++) {
          const seg = other.segments[i];
          const dist = Math.hypot(player.x - seg.x, player.y - seg.y);
          const hitDist = player.bodyRadius + seg.radius;
          if (dist < hitDist) {
            // Push player back
            const nx = (player.x - seg.x) / (dist || 1);
            const ny = (player.y - seg.y) / (dist || 1);
            player.x += nx * (hitDist - dist + 4);
            player.y += ny * (hitDist - dist + 4);

            // If player was actively biting or auto-biting, it may sever this segment
            if ((player.isBiting || player.autoBite) && player.biteCooldownTimer <= 0) {
              this.performBite(player);
            } else {
              // Violent body crash impact into centipede's spiny venomous body
              const crashDamage = 85 + other.stage * 30 + (player.isBoosting ? 35 : 0);
              player.isStunned = true;
              player.stunTimer = 0.35;
              this.damagePlayer(player, crashDamage, other.id);
              this.addFloatingText(`💥 BODY CRASH! -${Math.round(crashDamage)}`, player.x, player.y - 20, '#ef4444', 16);

              if (this.onEvent) {
                this.onEvent({
                  type: 'body_crash',
                  payload: {
                    rammerId: player.id,
                    targetId: other.id,
                    isSelfRammer: !player.isBot,
                    isSelfTarget: !other.isBot
                  }
                });
              }
            }
            return;
          }
        }
      }

      // 2. Ant Heavy Carapace: Hitting the armored back/abdomen of an Ant
      if (other.faction === 'ant') {
        const dist = Math.hypot(player.x - other.x, player.y - other.y);
        const hitDist = player.bodyRadius + other.bodyRadius;
        if (dist < hitDist) {
          const angleToOther = Math.atan2(player.y - other.y, player.x - other.x);
          const antFacingDiff = Math.abs((angleToOther - other.angle + Math.PI * 3) % (Math.PI * 2) - Math.PI);

          // If hitting Ant's back/flank
          if (antFacingDiff > 1.1) {
            const nx = (player.x - other.x) / (dist || 1);
            const ny = (player.y - other.y) / (dist || 1);
            player.x += nx * (hitDist - dist + 6);
            player.y += ny * (hitDist - dist + 6);

            const deflectDamage = 50 + other.stage * 18;
            this.damagePlayer(player, deflectDamage, other.id);
            this.addFloatingText(`🛡 SHELL DEFLECT! -${Math.round(deflectDamage)}`, player.x, player.y - 20, '#f59e0b', 15);

            if (this.onEvent) {
              this.onEvent({
                type: 'shell_deflect',
                payload: { isSelf: !player.isBot }
              });
            }
            return;
          }
        }
      }

      // 3. Head-to-Head Clash
      const headDist = Math.hypot(player.x - other.x, player.y - other.y);
      const minHeadDist = player.bodyRadius + other.bodyRadius - 4;
      if (headDist < minHeadDist) {
        const nx = (player.x - other.x) / (headDist || 1);
        const ny = (player.y - other.y) / (headDist || 1);
        const push = (minHeadDist - headDist) * 0.5;
        player.x += nx * push;
        player.y += ny * push;
        other.x -= nx * push;
        other.y -= ny * push;

        if (player.autoBite && player.biteCooldownTimer <= 0) {
          this.performBite(player);
        }
        if (other.autoBite && other.biteCooldownTimer <= 0) {
          this.performBite(other);
        }
      }
    }
  }

  private updatePlayerMovement(player: BugPlayer, dt: number) {
    if (player.isStunned) return;

    // Fluid angular interpolation like Slither.io
    const diff = (player.targetAngle - player.angle + Math.PI * 3) % (Math.PI * 2) - Math.PI;
    const baseTurn = player.faction === 'centipede' ? 8.5 : 9.5;
    const turnRate = player.isBoosting ? baseTurn * 1.2 : baseTurn;
    player.angle += diff * Math.min(1, turnRate * dt);

    // Speed calculation & Slither boost mechanics
    let currentSpeed = player.speed * 30;
    const isBoostActive = player.isBoosting && player.score > 15;

    if (isBoostActive) {
      currentSpeed *= 1.85;
      // Shed glowing mass trail while boosting (costs mass over time)
      player.boostDropTimer += dt;
      if (player.boostDropTimer >= 0.12) {
        player.boostDropTimer = 0;
        player.score = Math.max(10, player.score - 1.2);
        player.xp = Math.max(10, player.xp - 1.2);

        // Spawn shed glowing drop behind tail
        const tailX = player.faction === 'centipede' && player.segments.length > 0
          ? player.segments[player.segments.length - 1].x
          : player.x - Math.cos(player.angle) * (player.bodyRadius + 10);
        const tailY = player.faction === 'centipede' && player.segments.length > 0
          ? player.segments[player.segments.length - 1].y
          : player.y - Math.sin(player.angle) * (player.bodyRadius + 10);

        this.sugarDrops.push({
          id: this.generateId('boost_sugar'),
          x: tailX + (Math.random() - 0.5) * 6,
          y: tailY + (Math.random() - 0.5) * 6,
          value: 6,
          type: 'standard',
          radius: 5,
          color: player.color,
          pulseOffset: Math.random() * Math.PI * 2
        });

        // Spiders spin faint sticky silk trails when boosting
        if (player.faction === 'spider' && Math.random() < 0.2) {
          this.webs.push({
            id: this.generateId('silk_trail'),
            ownerId: player.id,
            x: tailX,
            y: tailY,
            radius: 35,
            duration: 3.5,
            maxDuration: 3.5,
            points: []
          });
        }
      }
    }

    if (player.isSugarRushActive) currentSpeed *= 1.45;
    if (player.isWebbed) currentSpeed *= 0.38; // Extreme web drag
    if (player.isBurrowed) currentSpeed *= 0.5;

    player.vx = Math.cos(player.angle) * currentSpeed;
    player.vy = Math.sin(player.angle) * currentSpeed;

    player.x += player.vx * dt;
    player.y += player.vy * dt;

    // Obstacle soft collision
    for (const obs of this.obstacles) {
      const dist = Math.hypot(player.x - obs.x, player.y - obs.y);
      const minD = player.bodyRadius + obs.radius;
      if (dist < minD && dist > 0) {
        const push = (minD - dist);
        const nx = (player.x - obs.x) / dist;
        const ny = (player.y - obs.y) / dist;
        player.x += nx * push;
        player.y += ny * push;
      }
    }
  }

  private updateCentipedeSegments(player: BugPlayer) {
    const spacing = 16;
    let prevX = player.x;
    let prevY = player.y;
    const time = Date.now() * (player.isBoosting ? 0.014 : 0.008);

    for (let i = 0; i < player.segments.length; i++) {
      const seg = player.segments[i];
      const dx = prevX - seg.x;
      const dy = prevY - seg.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 0) {
        seg.angle = Math.atan2(dy, dx);
        if (dist > spacing) {
          // Organic sinusoidal snake undulation perpendicular to movement
          const wave = Math.sin(time + i * 0.45) * (player.isBoosting ? 2.8 : 1.6);
          const perpAngle = seg.angle + Math.PI / 2;
          seg.x = prevX - Math.cos(seg.angle) * spacing + Math.cos(perpAngle) * wave;
          seg.y = prevY - Math.sin(seg.angle) * spacing + Math.sin(perpAngle) * wave;
        }
      }

      prevX = seg.x;
      prevY = seg.y;
    }
  }

  private updateEnvironmentInteractions(player: BugPlayer, dt: number) {
    if (player.isBurrowed) return;

    // Spider webs: Centipede ignores webs! Ant & others get webbed
    if (player.faction !== 'centipede') {
      for (const web of this.webs) {
        if (web.ownerId === player.id) continue;
        const dist = Math.hypot(player.x - web.x, player.y - web.y);
        if (dist < web.radius) {
          player.isWebbed = true;
          player.webbedTimer = Math.max(player.webbedTimer, 1.2);
          // Ants take slight web drag damage
          if (player.faction === 'ant') {
            this.damagePlayer(player, 10 * dt, web.ownerId);
          }
        }
      }
    }

    // Toxic clouds
    for (const cloud of this.toxicClouds) {
      if (cloud.ownerId === player.id) continue;
      const dist = Math.hypot(player.x - cloud.x, player.y - cloud.y);
      if (dist < cloud.radius) {
        player.isPoisoned = true;
        player.poisonTimer = Math.max(player.poisonTimer, 2.0);
        this.damagePlayer(player, cloud.damagePerSec * dt, cloud.ownerId);
      }
    }
  }

  private checkSugarDropCollisions(player: BugPlayer) {
    if (player.isBurrowed) return;

    // Slither.io magnetic vacuum suction!
    const magnetRadius = player.bodyRadius * 2.8 + (player.isBoosting ? 50 : 32);
    const eatRadius = player.bodyRadius + 14;

    for (let i = this.sugarDrops.length - 1; i >= 0; i--) {
      const drop = this.sugarDrops[i];
      const dist = Math.hypot(player.x - drop.x, player.y - drop.y);

      if (dist < magnetRadius) {
        // Gravitational suction directly towards bug head
        const angle = Math.atan2(player.y - drop.y, player.x - drop.x);
        const pullSpeed = Math.min(24, 10 + (magnetRadius - dist) * 0.35);
        drop.x += Math.cos(angle) * pullSpeed;
        drop.y += Math.sin(angle) * pullSpeed;

        if (dist < eatRadius) {
          this.addXp(player, drop.value);
          this.sugarDrops.splice(i, 1);

          if (!player.isBot && this.onEvent) {
            this.onEvent({ type: 'sugar_eaten', payload: { type: drop.type } });
          }
        }
      }
    }
  }

  public isTargetInBiteRange(player: BugPlayer): boolean {
    const biteReach = player.bodyRadius + (player.isBoosting ? 38 : 28);
    const biteX = player.x + Math.cos(player.angle) * biteReach;
    const biteY = player.y + Math.sin(player.angle) * biteReach;

    // Check Giant Sugar Crystals
    for (const crystal of this.giantCrystals) {
      const dist = Math.hypot(biteX - crystal.x, biteY - crystal.y);
      if (dist < crystal.radius + 24) {
        return true;
      }
    }

    // Check other players & centipede segments with forward cone validation
    for (const target of this.players.values()) {
      if (target.id === player.id || target.isBurrowed || target.hp <= 0) continue;

      // Forward direction check (within ~85 degrees)
      const angleToTarget = Math.atan2(target.y - player.y, target.x - player.x);
      const angleDiff = Math.abs((angleToTarget - player.angle + Math.PI * 3) % (Math.PI * 2) - Math.PI);
      if (angleDiff > Math.PI * 0.48) continue;

      // Centipede body segments
      if (target.faction === 'centipede' && target.segments.length > 1) {
        for (let i = 1; i < target.segments.length; i++) {
          const seg = target.segments[i];
          const dist = Math.hypot(biteX - seg.x, biteY - seg.y);
          if (dist < seg.radius + 22) {
            return true;
          }
        }
      }

      // Bug head / body
      const dist = Math.hypot(biteX - target.x, biteY - target.y);
      if (dist < target.bodyRadius + 26) {
        return true;
      }
    }

    return false;
  }

  public applyInput(playerId: string, input: PlayerInput) {
    const player = this.players.get(playerId);
    if (!player || player.hp <= 0) return;

    player.targetAngle = input.targetAngle;
    player.isBiting = input.isBiting;
    player.isBoosting = !!input.boost;
    if (input.autoBite !== undefined) {
      player.autoBite = input.autoBite;
    }

    if (input.useAbility && player.abilityCooldownTimer <= 0) {
      this.triggerAbility(player);
    }

    if (input.useUltimate && player.ultimateCooldownTimer <= 0 && player.stage >= 4) {
      this.triggerUltimate(player);
    }
  }

  public triggerAbility(player: BugPlayer) {
    const stageData = FACTION_DETAILS[player.faction].stages[player.stage];
    player.abilityCooldownTimer = stageData.abilityCooldown;

    if (player.faction === 'centipede') {
      if (player.stage === 1) {
        // Sprint Burst
        player.speed = player.maxSpeed * 1.8;
        this.addFloatingText('💨 SPRINT BURST', player.x, player.y - 20, '#ef4444');
        setTimeout(() => {
          player.speed = player.maxSpeed;
        }, 2200);
      } else if (player.stage === 2) {
        // Toxic Spores
        for (let i = 0; i < 4; i++) {
          const offsetDist = i * 25;
          this.toxicClouds.push({
            id: this.generateId('spore'),
            ownerId: player.id,
            x: player.x - Math.cos(player.angle) * offsetDist,
            y: player.y - Math.sin(player.angle) * offsetDist,
            radius: 45,
            duration: 5.5,
            maxDuration: 5.5,
            damagePerSec: 50
          });
        }
        this.addFloatingText('☣ TOXIC SPORES', player.x, player.y - 20, '#84cc16');
      } else {
        // Venom Pounce (deals 2.5x critical bite damage)
        player.x += Math.cos(player.angle) * 160;
        player.y += Math.sin(player.angle) * 160;
        this.performBite(player, 2.5);
        this.addFloatingText('⚡ VENOM POUNCE', player.x, player.y - 20, '#ef4444');
      }
    } else if (player.faction === 'ant') {
      if (player.stage === 1) {
        // Sugar Rush Surge
        player.speed = player.maxSpeed * 1.5;
        this.addFloatingText('⚡ SUGAR SURGE', player.x, player.y - 20, '#f59e0b');
        setTimeout(() => {
          player.speed = player.maxSpeed;
        }, 3000);
      } else if (player.stage === 2) {
        // Pheromone Trail - summon 2 worker ants
        for (let i = 0; i < 2; i++) {
          this.minions.push({
            id: this.generateId('worker'),
            ownerId: player.id,
            type: 'worker',
            x: player.x + (Math.random() - 0.5) * 40,
            y: player.y + (Math.random() - 0.5) * 40,
            vx: 0,
            vy: 0,
            angle: player.angle,
            hp: 60,
            maxHp: 60,
            damage: 15,
            radius: 10,
            duration: 18
          });
        }
        this.addFloatingText('🐜 COLONY SUMMONED', player.x, player.y - 20, '#f59e0b');
      } else {
        // Agony Sting
        this.performBite(player, 2.0, true);
        this.addFloatingText('💥 AGONY STING', player.x, player.y - 20, '#d97706');
      }
    } else if (player.faction === 'spider') {
      if (player.stage === 1) {
        // Apex Pounce
        player.x += Math.cos(player.angle) * 190;
        player.y += Math.sin(player.angle) * 190;
        this.addFloatingText('🕷 APEX POUNCE', player.x, player.y - 20, '#a855f7');
      } else if (player.stage === 2) {
        // Burrow & Ambush
        player.isBurrowed = true;
        player.burrowTimer = 4.0;
        this.addFloatingText('🕳 BURROWED', player.x, player.y - 20, '#a855f7');
      } else {
        // Web Shot
        const projSpeed = 16;
        this.projectiles.push({
          id: this.generateId('web_proj'),
          ownerId: player.id,
          type: 'web_shot',
          x: player.x + Math.cos(player.angle) * 25,
          y: player.y + Math.sin(player.angle) * 25,
          vx: Math.cos(player.angle) * projSpeed,
          vy: Math.sin(player.angle) * projSpeed,
          radius: 12,
          rangeRemaining: 480,
          damage: 42
        });
        this.addFloatingText('🕸 WEB SHOT', player.x, player.y - 20, '#a855f7');
      }
    }

    if (!player.isBot && this.onEvent) {
      this.onEvent({ type: 'ability_used', payload: { faction: player.faction, stage: player.stage } });
    }
  }

  public triggerUltimate(player: BugPlayer) {
    player.ultimateCooldownTimer = 14;

    if (player.faction === 'centipede') {
      // Constrict: coiling vortex
      this.addFloatingText('🌀 CONSTRICT SPIRAL!', player.x, player.y - 30, '#ef4444', 22);
      for (const foe of this.players.values()) {
        if (foe.id === player.id || foe.isBurrowed) continue;
        const dist = Math.hypot(foe.x - player.x, foe.y - player.y);
        if (dist < 260) {
          // Pull into center and shred
          const angle = Math.atan2(player.y - foe.y, player.x - foe.x);
          foe.x += Math.cos(angle) * 100;
          foe.y += Math.sin(angle) * 100;
          this.damagePlayer(foe, 220, player.id);
        }
      }
    } else if (player.faction === 'ant') {
      // Colony Guardians Phalanx
      this.addFloatingText('🛡 GUARDIAN PHALANX!', player.x, player.y - 30, '#f59e0b', 22);
      for (let i = 0; i < 3; i++) {
        this.minions.push({
          id: this.generateId('guardian'),
          ownerId: player.id,
          type: 'guardian',
          x: player.x + (Math.random() - 0.5) * 50,
          y: player.y + (Math.random() - 0.5) * 50,
          vx: 0,
          vy: 0,
          angle: player.angle,
          hp: 180,
          maxHp: 180,
          damage: 28,
          radius: 14,
          duration: 25
        });
      }
    } else if (player.faction === 'spider') {
      // Web Fortress
      this.addFloatingText('🕸 WEB FORTRESS!', player.x, player.y - 30, '#a855f7', 22);
      this.webs.push({
        id: this.generateId('fortress'),
        ownerId: player.id,
        x: player.x,
        y: player.y,
        radius: 240,
        duration: 22,
        maxDuration: 22,
        points: Array.from({ length: 8 }).map((_, idx) => ({
          x: player.x + Math.cos(idx * Math.PI / 4) * 220,
          y: player.y + Math.sin(idx * Math.PI / 4) * 220
        }))
      });
    }

    if (!player.isBot && this.onEvent) {
      this.onEvent({ type: 'ultimate_used', payload: { faction: player.faction } });
    }
  }

  public performBite(attacker: BugPlayer, damageMultiplier: number = 1.0, causesStun: boolean = false) {
    attacker.biteCooldownTimer = 0.22;
    attacker.biteAnimTimer = 0.16;
    const stageData = FACTION_DETAILS[attacker.faction].stages[attacker.stage];
    let baseDamage = stageData.stats.damage * damageMultiplier;
    if (attacker.isSugarRushActive) baseDamage *= 1.8;

    // Bite cone coordinates
    const biteReach = attacker.bodyRadius + (attacker.isBoosting ? 32 : 24);
    const biteX = attacker.x + Math.cos(attacker.angle) * biteReach;
    const biteY = attacker.y + Math.sin(attacker.angle) * biteReach;

    // Check hit against Giant Crystals
    for (const crystal of this.giantCrystals) {
      const dist = Math.hypot(biteX - crystal.x, biteY - crystal.y);
      if (dist < crystal.radius + 18) {
        crystal.hp -= baseDamage;
        this.addFloatingText(`-${Math.round(baseDamage)}`, crystal.x, crystal.y - 15, '#fbbf24');
        // Drop small sugar shards
        this.sugarDrops.push({
          id: this.generateId('shard'),
          x: biteX + (Math.random() - 0.5) * 20,
          y: biteY + (Math.random() - 0.5) * 20,
          value: 15,
          type: 'standard',
          radius: 5,
          color: '#fbbf24',
          pulseOffset: 0
        });
      }
    }

    // Check hit against other players
    for (const target of this.players.values()) {
      if (target.id === attacker.id || target.hp <= 0 || target.isBurrowed) continue;

      // === AUTHORITATIVE CENTIPEDE SEGMENT SEVERING MECHANIC ===
      if (target.faction === 'centipede' && target.segments.length > 2) {
        let severedIndex = -1;
        for (let i = 1; i < target.segments.length; i++) {
          const seg = target.segments[i];
          const distToBite = Math.hypot(biteX - seg.x, biteY - seg.y);
          if (distToBite < seg.radius + 16) {
            severedIndex = i;
            break;
          }
        }

        if (severedIndex !== -1) {
          // If attacker is an Ant, bonus severance crushes deeper!
          if (attacker.faction === 'ant') {
            severedIndex = Math.max(1, severedIndex - 1);
          }

          const severedSegments = target.segments.splice(severedIndex);
          attacker.segmentsSevered += severedSegments.length;

          // Severed segments explode into glowing sugar nodes
          for (const seg of severedSegments) {
            this.sugarDrops.push({
              id: this.generateId('severed_sugar'),
              x: seg.x + (Math.random() - 0.5) * 15,
              y: seg.y + (Math.random() - 0.5) * 15,
              value: 35,
              type: 'severed_segment',
              radius: 9,
              color: '#f97316',
              pulseOffset: Math.random() * Math.PI * 2
            });
          }

          // Centipede takes damage & gets emergency escape burst
          const segmentDamage = severedSegments.length * (attacker.faction === 'centipede' ? 45 : 25);
          this.damagePlayer(target, segmentDamage, attacker.id);
          this.addFloatingText(`✂ CUT! -${severedSegments.length} SEGMENTS`, target.x, target.y - 25, '#ef4444', 18);
          this.addFloatingText(`+${severedSegments.length * 35} XP SHED`, attacker.x, attacker.y - 25, '#f59e0b', 16);

          if (this.onEvent) {
            this.onEvent({
              type: 'segment_severed',
              payload: {
                victimId: target.id,
                attackerId: attacker.id,
                segmentsCut: severedSegments.length,
                isAttackerSelf: !attacker.isBot,
                isVictimSelf: !target.isBot
              }
            });
          }
          return;
        }
      }

      // Standard head/body hit
      const dist = Math.hypot(biteX - target.x, biteY - target.y);
      if (dist < target.bodyRadius + 22) {
        // Rock-Paper-Scissors & Faction multipliers
        let finalDamage = baseDamage;

        // Centipedes have venomous forcipules that deal lethal puncture and poison
        if (attacker.faction === 'centipede') {
          finalDamage *= 1.45;
          target.isPoisoned = true;
          target.poisonTimer = Math.max(target.poisonTimer, 3.2);
        }

        if (attacker.faction === 'ant' && target.faction === 'centipede') {
          finalDamage *= 1.4; // Ants crush centipedes
        } else if (attacker.faction === 'centipede' && target.faction === 'spider') {
          finalDamage *= 1.75; // Centipedes hunt spiders with high lethality
        } else if (attacker.faction === 'spider' && target.faction === 'ant') {
          finalDamage *= 1.35; // Spider venom melts ants
        }

        if (causesStun) {
          target.isStunned = true;
          target.stunTimer = 1.8;
          this.addFloatingText('⚡ STUNNED!', target.x, target.y - 20, '#f59e0b');
        }

        this.damagePlayer(target, finalDamage, attacker.id);
        this.addFloatingText(`-${Math.round(finalDamage)}`, target.x, target.y - 12, '#ef4444');

        if (!attacker.isBot && this.onEvent) {
          this.onEvent({ type: 'bite_hit' });
        }
        break;
      }
    }
  }

  public damagePlayer(victim: BugPlayer, damage: number, attackerId?: string) {
    if (victim.hp <= 0) return;

    const stageData = FACTION_DETAILS[victim.faction].stages[victim.stage];
    const armorReduction = stageData.stats.armor / (stageData.stats.armor + 100);
    const effectiveDamage = Math.max(4, damage * (1 - armorReduction));

    victim.hp -= effectiveDamage;
    if (attackerId) {
      victim.lastDamagedBy = attackerId;
      const att = this.players.get(attackerId);
      if (att) victim.lastDamagedByName = att.name;
    }

    if (victim.hp <= 0) {
      this.eliminatePlayer(victim, attackerId);
    }
  }

  public eliminatePlayer(victim: BugPlayer, killerId?: string) {
    const killer = killerId ? this.players.get(killerId) : undefined;
    if (killer) {
      killer.kills += 1;
      killer.killStreak = (killer.killStreak || 0) + 1;
      const rewardXp = Math.max(140, victim.score * 0.5);
      this.addXp(killer, rewardXp);
      this.addFloatingText(`💀 SLAYED ${victim.name.toUpperCase()}! +${Math.round(rewardXp)} XP`, killer.x, killer.y - 30, '#10b981', 18);

      // Killstreak milestone banner
      if (killer.killStreak === 2) {
        this.addFloatingText('🔥 DOUBLE SLAY!', killer.x, killer.y - 48, '#fbbf24', 22);
      } else if (killer.killStreak === 3) {
        this.addFloatingText('⚡ TRIPLE CRUNCH!', killer.x, killer.y - 48, '#f59e0b', 24);
      } else if (killer.killStreak === 4) {
        this.addFloatingText('👑 QUAD SPREE!', killer.x, killer.y - 48, '#ef4444', 25);
      } else if (killer.killStreak >= 5) {
        this.addFloatingText('☠ BACKYARD DOMINATOR!', killer.x, killer.y - 48, '#ec4899', 26);
      }
    }

    // Slither.io massive death explosion: drops glowing honeydew mass orbs across the body!
    const totalMassToDrop = Math.max(80, victim.score * 0.6);
    const dropCount = Math.min(45, 12 + victim.stage * 6 + Math.floor(victim.score / 35));
    const valuePerDrop = Math.max(15, Math.floor(totalMassToDrop / dropCount));

    for (let i = 0; i < dropCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 15 + Math.random() * (victim.bodyRadius * 2.5);
      this.sugarDrops.push({
        id: this.generateId('death_sugar'),
        x: victim.x + Math.cos(angle) * dist,
        y: victim.y + Math.sin(angle) * dist,
        value: valuePerDrop,
        type: 'cluster',
        radius: Math.min(12, 6 + Math.floor(valuePerDrop / 10)),
        color: victim.color,
        pulseOffset: Math.random() * Math.PI * 2
      });
    }

    // Centipedes drop glowing honeydew orbs along every single body segment
    if (victim.faction === 'centipede' && victim.segments.length > 0) {
      for (const seg of victim.segments) {
        for (let s = 0; s < 2; s++) {
          this.sugarDrops.push({
            id: this.generateId('tail_sugar'),
            x: seg.x + (Math.random() - 0.5) * 10,
            y: seg.y + (Math.random() - 0.5) * 10,
            value: 28,
            type: 'severed_segment',
            radius: 8,
            color: '#fbbf24',
            pulseOffset: Math.random() * Math.PI * 2
          });
        }
      }
    }

    // Killfeed entry
    const feedItem: KillFeedItem = {
      id: this.generateId('kill'),
      killerName: killer ? killer.name : 'Backyard Hazard',
      killerFaction: killer ? killer.faction : 'ant',
      victimName: victim.name,
      victimFaction: victim.faction,
      wasCentipedeSplit: victim.faction === 'centipede' && victim.segments.length > 5,
      timestamp: Date.now()
    };
    this.killFeed.unshift(feedItem);
    if (this.killFeed.length > 6) this.killFeed.pop();

    if (this.onEvent) {
      this.onEvent({
        type: 'player_eliminated',
        payload: {
          victimId: victim.id,
          killerId: killer ? killer.id : null,
          killerName: killer ? killer.name : 'Backyard Hazard',
          victimName: victim.name,
          isSelfVictim: !victim.isBot,
          isSelfKiller: killer ? !killer.isBot : false
        }
      });
    }

    // Remove or respawn bot
    if (victim.isBot) {
      this.players.delete(victim.id);
    } else {
      // Keep player dead until respawn requested
      victim.hp = 0;
    }
  }

  public respawnPlayer(playerId: string): BugPlayer | null {
    const existing = this.players.get(playerId);
    if (!existing) return null;

    const respawned = this.createPlayer(
      existing.id,
      existing.name,
      existing.faction,
      false
    );
    return respawned;
  }

  private updateBotAI(bot: BugPlayer, dt: number) {
    if (bot.isStunned) return;

    // 1. Survival Check: low health bots boost away to heal or hide in grass
    if (bot.hp < bot.maxHp * 0.35) {
      // Find nearest clover grass or distant sugar
      let safeAngle = bot.angle;
      let nearestGrass = this.grassPatches.find(gp => Math.hypot(gp.x - bot.x, gp.y - bot.y) < 500);
      if (nearestGrass) {
        safeAngle = Math.atan2(nearestGrass.y - bot.y, nearestGrass.x - bot.x);
      } else {
        // Run opposite of closest enemy
        let closestFoe: BugPlayer | null = null;
        let minFoeDist = 350;
        for (const foe of this.players.values()) {
          if (foe.id === bot.id || foe.hp <= 0) continue;
          const d = Math.hypot(foe.x - bot.x, foe.y - bot.y);
          if (d < minFoeDist) { minFoeDist = d; closestFoe = foe; }
        }
        if (closestFoe) {
          safeAngle = Math.atan2(bot.y - closestFoe.y, bot.x - closestFoe.x);
        }
      }
      bot.targetAngle = safeAngle;
      bot.isBoosting = bot.score > 25;
      bot.isBiting = false;
      return;
    }

    // 2. Scan for nearby Queen Wisps (high reward!)
    let closestWisp = this.fireflies.find(ff => Math.hypot(ff.x - bot.x, ff.y - bot.y) < 240);
    if (closestWisp) {
      bot.targetAngle = Math.atan2(closestWisp.y - bot.y, closestWisp.x - bot.x);
      bot.isBoosting = true;
      bot.isBiting = false;
      return;
    }

    // 3. Scan for nearby enemies
    let closestEnemy: BugPlayer | null = null;
    let minEnemyDist = 340;
    for (const other of this.players.values()) {
      if (other.id === bot.id || other.isBurrowed || other.hp <= 0) continue;
      const d = Math.hypot(other.x - bot.x, other.y - bot.y);
      if (d < minEnemyDist) {
        minEnemyDist = d;
        closestEnemy = other;
      }
    }

    if (closestEnemy) {
      // Slither tactic: Centipedes attempt a speed boost cut-off curve in front of prey!
      if (bot.faction === 'centipede' && bot.segments.length > 5 && minEnemyDist < 260) {
        // Lead the target: aim ahead of where the enemy is going
        const leadDist = 90;
        const targetX = closestEnemy.x + Math.cos(closestEnemy.angle) * leadDist;
        const targetY = closestEnemy.y + Math.sin(closestEnemy.angle) * leadDist;
        bot.targetAngle = Math.atan2(targetY - bot.y, targetX - bot.x);
        bot.isBoosting = bot.score > 30; // Boost to cut off!
      } else {
        bot.targetAngle = Math.atan2(closestEnemy.y - bot.y, closestEnemy.x - bot.x);
        bot.isBoosting = (minEnemyDist < 160 && bot.score > 35) || bot.isSugarRushActive;
      }

      // Close combat bite
      if (minEnemyDist < bot.bodyRadius + closestEnemy.bodyRadius + 30) {
        bot.isBiting = true;
      } else {
        bot.isBiting = false;
      }

      // Use ability tactically
      if (bot.abilityCooldownTimer <= 0) {
        if (bot.faction === 'spider' && minEnemyDist > 120 && minEnemyDist < 300) {
          this.triggerAbility(bot); // Web shot / ambush
        } else if (bot.faction === 'centipede' && minEnemyDist < 180) {
          this.triggerAbility(bot); // Pounce or spores
        } else if (bot.faction === 'ant' && minEnemyDist < 150) {
          this.triggerAbility(bot); // Colony or sting
        }
      }

      // Use ultimate if Stage 4
      if (bot.stage >= 4 && bot.ultimateCooldownTimer <= 0 && minEnemyDist < 200) {
        this.triggerUltimate(bot);
      }
      return;
    }

    bot.isBoosting = false;

    // 4. Scan for Sugar Drops (feeding & growth)
    let closestSugar: SugarDrop | null = null;
    let minSugarDist = 450;
    for (const drop of this.sugarDrops) {
      const d = Math.hypot(drop.x - bot.x, drop.y - bot.y);
      if (d < minSugarDist) {
        minSugarDist = d;
        closestSugar = drop;
      }
    }

    if (closestSugar) {
      bot.targetAngle = Math.atan2(closestSugar.y - bot.y, closestSugar.x - bot.x);
      bot.isBiting = false;
    } else {
      if (Math.random() < 0.04) {
        bot.targetAngle += (Math.random() - 0.5) * 1.6;
      }
      bot.isBiting = false;
    }
  }

  public getSnapshot(selfId?: string): GameSnapshot {
    const playerList = Array.from(this.players.values()).filter(p => p.hp > 0 || p.id === selfId);

    const leaderboard: LeaderboardEntry[] = Array.from(this.players.values())
      .filter(p => p.hp > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(p => ({
        id: p.id,
        name: p.name,
        faction: p.faction,
        stage: p.stage,
        score: p.score,
        kills: p.kills,
        isSelf: p.id === selfId,
        isBot: p.isBot
      }));

    return {
      timestamp: Date.now(),
      players: playerList,
      minions: this.minions,
      sugarDrops: this.sugarDrops,
      giantCrystals: this.giantCrystals,
      webs: this.webs,
      toxicClouds: this.toxicClouds,
      projectiles: this.projectiles,
      grassPatches: this.grassPatches,
      fireflies: this.fireflies,
      leaderboard,
      killFeed: this.killFeed
    };
  }
}
