export type AbilityKey = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';
export type AbilityScores = Record<AbilityKey, number>;

export interface Token {
  id: string;
  name: string;
  x: number;   // % of container width
  y: number;   // % of container height
  color: string;
  size: number; // px diameter
  hp: number;
  maxHp: number;
  ac: number;
  isPC: boolean;
  ownerId: string;
  imageUrl?: string;
  notes?: string;
}

export interface InitiativeEntry {
  id: string;
  name: string;
  initiative: number;
  hp: number;
  maxHp: number;
  ac: number;
  color: string;
  isMonster: boolean;
}

export interface LootItem {
  id: string;
  name: string;
  quantity: number;
  value: string;
  description: string;
  given: boolean;
}

export interface SceneNote {
  id: string;
  title: string;
  content: string;
  type: 'note' | 'handout' | 'secret';
}

export interface DiceRollBroadcast {
  id: string;
  sessionId: string;
  playerName: string;
  playerId: string;
  die: string;
  result: number;
  createdAt: string;
}

export interface GameSession {
  id: string;
  name: string;
  dmName: string;
  mapImage: string | null;
  tokens: Token[];
  fogRevealed: string[];
  initiative: InitiativeEntry[];
  initiativeIndex: number;
  notes: SceneNote[];
  loot: LootItem[];
  mapOffsetX?: number;
  mapOffsetY?: number;
  mapScale?: number;
  mapBrightness?: number;
  mapContrast?: number;
  gridEnabled?: boolean;
  gridSize?: number;
  gridOffsetX?: number;
  gridOffsetY?: number;
}

export interface SkillProf {
  proficient: boolean;
  expertise: boolean;
}

export interface SpellSlot {
  total: number;
  used: number;
}

export interface EquipItem {
  id: string;
  name: string;
  qty: number;
  weight: number;
  equipped: boolean;
}

export interface Spell {
  id: string;
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  description: string;
  prepared: boolean;
}

export interface Character {
  name: string;
  race: string;
  charClass: string;
  subclass: string;
  level: number;
  background: string;
  alignment: string;
  xp: number;
  avatarUrl?: string;
  abilityScores: AbilityScores;
  maxHp: number;
  currentHp: number;
  tempHp: number;
  ac: number;
  speed: number;
  hitDice: string;
  hitDiceUsed: number;
  deathSuccesses: number;
  deathFailures: number;
  inspiration: boolean;
  saveProficiencies: Partial<Record<AbilityKey, boolean>>;
  skillProficiencies: Record<string, SkillProf>;
  spellcastingAbility: AbilityKey;
  spellSlots: Record<number, SpellSlot>;
  spells: Spell[];
  equipment: EquipItem[];
  cp: number; sp: number; ep: number; gp: number; pp: number;
  personalityTraits: string;
  ideals: string;
  bonds: string;
  flaws: string;
  features: string;
  notes: string;
}

export interface MonsterData {
  name: string;
  type: string;
  size: string;
  alignment: string;
  ac: number;
  acNote: string;
  hp: string;
  avgHp: number;
  speed: string;
  str: number; dex: number; con: number;
  int: number; wis: number; cha: number;
  cr: string;
  xp: number;
  profBonus: number;
  saves?: string;
  skills?: string;
  immunities?: string;
  resistances?: string;
  conditionImmunities?: string;
  senses: string;
  languages: string;
  traits?: { name: string; desc: string }[];
  actions: { name: string; desc: string }[];
  legendaryActions?: { name: string; desc: string }[];
  imageUrl?: string;
  isCustom?: boolean;
}
