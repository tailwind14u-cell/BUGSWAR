export type Faction = 'centipede' | 'ant' | 'spider';
export type StageIndex = 1 | 2 | 3 | 4;

export interface Segment {
  x: number;
  y: number;
  angle: number;
  radius: number;
  health: number;
}

export interface BugPlayer {
  id: string;
  name: string;
  faction: Faction;
  stage: StageIndex;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  targetAngle: number;
  speed: number;
  maxSpeed: number;
  hp: number;
  maxHp: number;
  xp: number;
  nextStageXp: number;
  score: number;
  kills: number;
  segmentsSevered: number;
  sugarRush: number; // 0 to 100
  isSugarRushActive: boolean;
  sugarRushTimer: number;
  bodyRadius: number;
  segments: Segment[]; // Especially for centipede
  isBurrowed: boolean;
  burrowTimer: number;
  isStunned: boolean;
  stunTimer: number;
  isPoisoned: boolean;
  poisonTimer: number;
  isWebbed: boolean;
  webbedTimer: number;
  abilityCooldownTimer: number;
  abilityMaxCooldown: number;
  ultimateCooldownTimer: number;
  ultimateMaxCooldown: number;
  isBiting: boolean;
  autoBite: boolean;
  isBoosting: boolean;
  boostDropTimer: number;
  biteCooldownTimer: number;
  biteAnimTimer?: number;
  isBot: boolean;
  killStreak: number;
  isInGrass: boolean;
  color: string;
  secondaryColor: string;
  lastDamagedBy?: string;
  lastDamagedByName?: string;
}

export interface MinionBug {
  id: string;
  ownerId: string;
  type: 'worker' | 'guardian';
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  hp: number;
  maxHp: number;
  damage: number;
  radius: number;
  targetId?: string;
  duration: number;
}

export type SugarType = 'standard' | 'cluster' | 'crystal' | 'severed_segment' | 'queen_nectar';

export interface SugarDrop {
  id: string;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  value: number;
  type: SugarType;
  radius: number;
  color: string;
  pulseOffset: number;
}

export interface GrassPatch {
  id: string;
  x: number;
  y: number;
  radius: number;
}

export interface Firefly {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  glow: number;
}

export interface GiantSugarCrystal {
  id: string;
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  value: number;
  pulseTimer: number;
  beaconAlpha: number;
}

export interface SpiderWeb {
  id: string;
  ownerId: string;
  x: number;
  y: number;
  radius: number;
  duration: number;
  maxDuration: number;
  points: { x: number; y: number }[];
}

export interface ToxicCloud {
  id: string;
  ownerId: string;
  x: number;
  y: number;
  radius: number;
  duration: number;
  maxDuration: number;
  damagePerSec: number;
}

export interface Projectile {
  id: string;
  ownerId: string;
  type: 'web_shot' | 'venom_dart';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rangeRemaining: number;
  damage: number;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  size: number;
  alpha: number;
  duration: number;
  vy: number;
}

export interface ArenaObstacle {
  id: string;
  type: 'pebble' | 'twig' | 'leaf' | 'bottle_cap';
  x: number;
  y: number;
  radius: number;
  angle: number;
  color: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  faction: Faction;
  stage: StageIndex;
  score: number;
  kills: number;
  isSelf: boolean;
  isBot: boolean;
}

export interface KillFeedItem {
  id: string;
  killerName: string;
  killerFaction: Faction;
  victimName: string;
  victimFaction: Faction;
  wasCentipedeSplit: boolean;
  timestamp: number;
}

export interface GameSnapshot {
  timestamp: number;
  players: BugPlayer[];
  minions: MinionBug[];
  sugarDrops: SugarDrop[];
  giantCrystals: GiantSugarCrystal[];
  webs: SpiderWeb[];
  toxicClouds: ToxicCloud[];
  projectiles: Projectile[];
  grassPatches: GrassPatch[];
  fireflies: Firefly[];
  leaderboard: LeaderboardEntry[];
  killFeed: KillFeedItem[];
}

export interface EvolutionStageData {
  stage: StageIndex;
  speciesName: string;
  subtitle: string;
  coreFeature: string;
  abilityName: string;
  abilityKey: string;
  abilityDesc: string;
  abilityCooldown: number;
  ultimateName?: string;
  ultimateKey?: string;
  ultimateDesc?: string;
  ultimateCooldown?: number;
  xpRequired: number;
  stats: {
    speed: number;
    health: number;
    damage: number;
    armor: number;
  };
}

export interface FactionData {
  id: Faction;
  name: string;
  tagline: string;
  description: string;
  archetype: 'Mobility / Offense' | 'Defense / Swarm' | 'Map Control / Stealth';
  growthStyle: string;
  mapStrategy: string;
  counterAdvantage: string;
  counterWeakness: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  stages: Record<StageIndex, EvolutionStageData>;
}

export const FACTION_DETAILS: Record<Faction, FactionData> = {
  centipede: {
    id: 'centipede',
    name: 'Centipedes',
    tagline: 'High-Speed Predatory Chains',
    description: 'Relentless stalkers that grow longer as they feed. Unaffected by spider webs, centipedes use coiling and piercing head bites to overwhelm foes.',
    archetype: 'Mobility / Offense',
    growthStyle: 'Adds body segments, legs, and length',
    mapStrategy: 'Solitary rogue stalker circling prey',
    counterAdvantage: 'Pierces cleanly through Spider webs without slowing down',
    counterWeakness: 'Vulnerable to Ant crushing jaws cutting segments',
    primaryColor: '#ef4444',
    secondaryColor: '#f97316',
    accentColor: '#fbbf24',
    stages: {
      1: {
        stage: 1,
        speciesName: 'Garden Millipede',
        subtitle: 'High Agility Scout',
        coreFeature: 'Lightweight agile chassis with rapid turning and sharp venom claws',
        abilityName: 'Sprint Burst',
        abilityKey: 'R-Click / Shift',
        abilityDesc: 'Surges forward with +80% speed for 2.2 seconds to dodge predators or hunt sugar.',
        abilityCooldown: 4.5,
        xpRequired: 0,
        stats: { speed: 9.8, health: 190, damage: 82, armor: 6 }
      },
      2: {
        stage: 2,
        speciesName: 'Feather Millipede',
        subtitle: 'Toxic Trail Stalker',
        coreFeature: 'Generates camouflage spores, toxic bite, and extra body segments',
        abilityName: 'Toxic Spores',
        abilityKey: 'R-Click / Shift',
        abilityDesc: 'Discharges a continuous trail of noxious fungal spores that slow and poison pursuers.',
        abilityCooldown: 6,
        xpRequired: 180,
        stats: { speed: 9.2, health: 310, damage: 140, armor: 18 }
      },
      3: {
        stage: 3,
        speciesName: 'Red-Legged Centipede',
        subtitle: 'Venomous Striker',
        coreFeature: 'Lethal neurotoxic forcipules inflicting heavy damage and armor piercing',
        abilityName: 'Venom Pounce',
        abilityKey: 'R-Click / Shift',
        abilityDesc: 'Lunges forward at lightning speed to latch onto prey and inject agonizing venom.',
        abilityCooldown: 5.5,
        xpRequired: 450,
        stats: { speed: 8.6, health: 460, damage: 225, armor: 28 }
      },
      4: {
        stage: 4,
        speciesName: 'Giant Amazonian Centipede',
        subtitle: 'Apex Coiling Titan',
        coreFeature: 'Colossal armored predator with devastating crushing bites and 30+ body segments',
        abilityName: 'Venom Pounce',
        abilityKey: 'R-Click / Shift',
        abilityDesc: 'High velocity predatory leap across short distances.',
        abilityCooldown: 4.5,
        ultimateName: 'Constrict',
        ultimateKey: 'Space / Q',
        ultimateDesc: 'Rapidly curls into a devastating crushing spiral, pulling in nearby bugs and shredding them.',
        ultimateCooldown: 11,
        xpRequired: 900,
        stats: { speed: 8.4, health: 720, damage: 340, armor: 45 }
      }
    }
  },
  ant: {
    id: 'ant',
    name: 'Ants',
    tagline: 'Heavily Armored Swarm Commanders',
    description: 'Indomitable fortified tanks possessing razor-sharp mandibles designed to sever enemy limbs and command obedient worker colonies.',
    archetype: 'Defense / Swarm',
    growthStyle: 'Adds carapace bulk, jaw width, and colony size',
    mapStrategy: 'Swarm commander claiming sugar zones',
    counterAdvantage: 'Crushing jaws snap Centipede segments with +50% bonus severance',
    counterWeakness: 'Vulnerable to Spider web slowing traps',
    primaryColor: '#f59e0b',
    secondaryColor: '#d97706',
    accentColor: '#fbbf24',
    stages: {
      1: {
        stage: 1,
        speciesName: 'Sugar Ant',
        subtitle: 'Agile Forager',
        coreFeature: 'Tiny nimble hitbox that slips through narrow terrain gaps',
        abilityName: 'Sugar Rush Surge',
        abilityKey: 'R-Click / Shift',
        abilityDesc: 'Senses sugar drops nearby and sprints with +50% boosted harvest speed.',
        abilityCooldown: 4,
        xpRequired: 0,
        stats: { speed: 9.0, health: 220, damage: 22, armor: 15 }
      },
      2: {
        stage: 2,
        speciesName: 'Fire Ant',
        subtitle: 'Colony Harvester',
        coreFeature: 'Inflicts burning bites and commands autonomous worker drones',
        abilityName: 'Pheromone Trail',
        abilityKey: 'R-Click / Shift',
        abilityDesc: 'Summons 2 loyal worker ants to gather sugar drops and harass nearby enemies.',
        abilityCooldown: 8,
        xpRequired: 180,
        stats: { speed: 8.2, health: 340, damage: 34, armor: 30 }
      },
      3: {
        stage: 3,
        speciesName: 'Bullet Ant',
        subtitle: 'Agony Sting Brawler',
        coreFeature: 'Most painful sting in the backyard, staggering opponents with shock',
        abilityName: 'Agony Sting',
        abilityKey: 'R-Click / Shift',
        abilityDesc: 'A vicious crushing strike that stuns the target for 1.8s and fractures armor.',
        abilityCooldown: 6,
        xpRequired: 450,
        stats: { speed: 7.8, health: 480, damage: 54, armor: 45 }
      },
      4: {
        stage: 4,
        speciesName: 'Giant Soldier Ant',
        subtitle: 'Colony Dreadnought',
        coreFeature: 'Impenetrable chitin exoskeleton with guillotine mandibles',
        abilityName: 'Agony Sting',
        abilityKey: 'R-Click / Shift',
        abilityDesc: 'Brutal jaw clamp that instantly cracks segments and stuns.',
        abilityCooldown: 5,
        ultimateName: 'Colony Guardians',
        ultimateKey: 'Space / Q',
        ultimateDesc: 'Summons a protective phalanx of 3 heavily armored guard ants that circle and defend.',
        ultimateCooldown: 14,
        xpRequired: 900,
        stats: { speed: 7.4, health: 750, damage: 68, armor: 60 }
      }
    }
  },
  spider: {
    id: 'spider',
    name: 'Spiders',
    tagline: 'Territorial Trap-Weaving Ambushers',
    description: 'Patient apex architects who control space using sticky web matrices, sudden burrow ambushes, and paralyzing neurotoxin venom.',
    archetype: 'Map Control / Stealth',
    growthStyle: 'Expands eight-legged span, vision radius, and fangs',
    mapStrategy: 'Web weaver anchoring fortified ambush nests',
    counterAdvantage: 'Webs severely slow Ants and isolate swarms for execution',
    counterWeakness: 'Centipedes glide through webs without penalty',
    primaryColor: '#a855f7',
    secondaryColor: '#7c3aed',
    accentColor: '#c084fc',
    stages: {
      1: {
        stage: 1,
        speciesName: 'Jumping Spider',
        subtitle: 'High-Sight Pouncer',
        coreFeature: 'Extended visual awareness radius (+50%) and rapid jumps',
        abilityName: 'Apex Pounce',
        abilityKey: 'R-Click / Shift',
        abilityDesc: 'Leaps cleanly over terrain, rocks, and obstacles to ambush or escape.',
        abilityCooldown: 4.5,
        xpRequired: 0,
        stats: { speed: 9.2, health: 190, damage: 26, armor: 10 }
      },
      2: {
        stage: 2,
        speciesName: 'Trapdoor Spider',
        subtitle: 'Subterranean Ambusher',
        coreFeature: 'Hides beneath garden soil completely invisible to radar and sight',
        abilityName: 'Burrow & Ambush',
        abilityKey: 'R-Click / Shift',
        abilityDesc: 'Burrows beneath the dirt for up to 4s. Erupts with surprise critical damage.',
        abilityCooldown: 8,
        xpRequired: 180,
        stats: { speed: 8.4, health: 310, damage: 38, armor: 20 }
      },
      3: {
        stage: 3,
        speciesName: 'Black Widow',
        subtitle: 'Neurotoxic Huntress',
        coreFeature: 'Spins durable sticky web nodes and fires ranged restraining threads',
        abilityName: 'Web Shot',
        abilityKey: 'R-Click / Shift',
        abilityDesc: 'Fires a high-speed sticky web projectile that roots and damages the target.',
        abilityCooldown: 6,
        xpRequired: 450,
        stats: { speed: 8.0, health: 430, damage: 50, armor: 25 }
      },
      4: {
        stage: 4,
        speciesName: 'Goliath Birdeater',
        subtitle: 'Apex Web Sovereign',
        coreFeature: 'Immense hairy body with colossal leg span and paralyzing bite',
        abilityName: 'Web Shot',
        abilityKey: 'R-Click / Shift',
        abilityDesc: 'Ranged silk projectile that ensnares and poisons.',
        abilityCooldown: 5,
        ultimateName: 'Web Fortress',
        ultimateKey: 'Space / Q',
        ultimateDesc: 'Spins a massive active web domain that permanently traps, slows, and leeches foes.',
        ultimateCooldown: 13,
        xpRequired: 900,
        stats: { speed: 7.6, health: 680, damage: 72, armor: 35 }
      }
    }
  }
};
