import { AbilityKey, MonsterData } from '@/types/dnd';

export const CLASSES = ['Artificer','Barbarian','Bard','Cleric','Druid','Fighter','Monk','Paladin','Ranger','Rogue','Sorcerer','Warlock','Wizard'];
export const RACES = ['Dragonborn','Dwarf','Elf','Gnome','Half-Elf','Halfling','Half-Orc','Human','Tiefling','Aasimar','Genasi','Goliath','Tabaxi'];
export const BACKGROUNDS = ['Acolyte','Charlatan','Criminal','Entertainer','Folk Hero','Guild Artisan','Hermit','Noble','Outlander','Sage','Sailor','Soldier','Urchin'];
export const ALIGNMENTS = ['Lawful Good','Neutral Good','Chaotic Good','Lawful Neutral','True Neutral','Chaotic Neutral','Lawful Evil','Neutral Evil','Chaotic Evil'];

export const ABILITIES: { key: AbilityKey; abbr: string; name: string }[] = [
  { key: 'strength', abbr: 'STR', name: 'Strength' },
  { key: 'dexterity', abbr: 'DEX', name: 'Dexterity' },
  { key: 'constitution', abbr: 'CON', name: 'Constitution' },
  { key: 'intelligence', abbr: 'INT', name: 'Intelligence' },
  { key: 'wisdom', abbr: 'WIS', name: 'Wisdom' },
  { key: 'charisma', abbr: 'CHA', name: 'Charisma' },
];

export const SKILLS: { name: string; ability: AbilityKey; abbr: string; key: string }[] = [
  { name: 'Acrobatics', ability: 'dexterity', abbr: 'DEX', key: 'acrobatics' },
  { name: 'Animal Handling', ability: 'wisdom', abbr: 'WIS', key: 'animalHandling' },
  { name: 'Arcana', ability: 'intelligence', abbr: 'INT', key: 'arcana' },
  { name: 'Athletics', ability: 'strength', abbr: 'STR', key: 'athletics' },
  { name: 'Deception', ability: 'charisma', abbr: 'CHA', key: 'deception' },
  { name: 'History', ability: 'intelligence', abbr: 'INT', key: 'history' },
  { name: 'Insight', ability: 'wisdom', abbr: 'WIS', key: 'insight' },
  { name: 'Intimidation', ability: 'charisma', abbr: 'CHA', key: 'intimidation' },
  { name: 'Investigation', ability: 'intelligence', abbr: 'INT', key: 'investigation' },
  { name: 'Medicine', ability: 'wisdom', abbr: 'WIS', key: 'medicine' },
  { name: 'Nature', ability: 'intelligence', abbr: 'INT', key: 'nature' },
  { name: 'Perception', ability: 'wisdom', abbr: 'WIS', key: 'perception' },
  { name: 'Performance', ability: 'charisma', abbr: 'CHA', key: 'performance' },
  { name: 'Persuasion', ability: 'charisma', abbr: 'CHA', key: 'persuasion' },
  { name: 'Religion', ability: 'intelligence', abbr: 'INT', key: 'religion' },
  { name: 'Sleight of Hand', ability: 'dexterity', abbr: 'DEX', key: 'sleightOfHand' },
  { name: 'Stealth', ability: 'dexterity', abbr: 'DEX', key: 'stealth' },
  { name: 'Survival', ability: 'wisdom', abbr: 'WIS', key: 'survival' },
];

export const HIT_DICE: Record<string, string> = {
  Artificer:'d8', Barbarian:'d12', Bard:'d8', Cleric:'d8', Druid:'d8',
  Fighter:'d10', Monk:'d8', Paladin:'d10', Ranger:'d10', Rogue:'d8',
  Sorcerer:'d6', Warlock:'d8', Wizard:'d6',
};

export const DICE_TYPES = ['d4','d6','d8','d10','d12','d20','d100'];
export const TOKEN_COLORS = ['#dc2626','#2563eb','#16a34a','#ca8a04','#9333ea','#0891b2','#ea580c','#db2777','#65a30d','#0f766e'];

export const profBonus = (level: number) => Math.floor((level - 1) / 4) + 2;
export const abilityMod = (score: number) => Math.floor((score - 10) / 2);
export const modStr = (mod: number) => (mod >= 0 ? `+${mod}` : `${mod}`);

export const MONSTERS: MonsterData[] = [
  {
    name:'Goblin', type:'Humanoid (goblinoid)', size:'Small', alignment:'Neutral Evil',
    ac:15, acNote:'leather armor, shield', hp:'2d6', avgHp:7, speed:'30 ft.',
    str:8, dex:14, con:10, int:10, wis:8, cha:8, cr:'1/4', xp:50, profBonus:2,
    skills:'Stealth +6', senses:'Darkvision 60 ft., Passive Perception 9', languages:'Common, Goblin',
    traits:[{name:'Nimble Escape',desc:"The goblin can take the Disengage or Hide action as a bonus action on each of its turns."}],
    actions:[{name:'Scimitar',desc:'Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6+2) slashing damage.'},{name:'Shortbow',desc:'Ranged Weapon Attack: +4 to hit, range 80/320 ft., one target. Hit: 5 (1d6+2) piercing damage.'}]
  },
  {
    name:'Orc', type:'Humanoid (orc)', size:'Medium', alignment:'Chaotic Evil',
    ac:13, acNote:'hide armor', hp:'2d8+6', avgHp:15, speed:'30 ft.',
    str:16, dex:12, con:16, int:7, wis:11, cha:10, cr:'1/2', xp:100, profBonus:2,
    skills:'Intimidation +2', senses:'Darkvision 60 ft., Passive Perception 10', languages:'Common, Orc',
    traits:[{name:'Aggressive',desc:"As a bonus action, the orc can move up to its speed toward a hostile creature that it can see."}],
    actions:[{name:'Greataxe',desc:'Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 9 (1d12+3) slashing damage.'},{name:'Javelin',desc:'Melee or Ranged Weapon Attack: +5 to hit, reach 5 ft. or range 30/120 ft. Hit: 6 (1d6+3) piercing damage.'}]
  },
  {
    name:'Skeleton', type:'Undead', size:'Medium', alignment:'Lawful Evil',
    ac:13, acNote:'remnants of armor', hp:'2d8+4', avgHp:13, speed:'30 ft.',
    str:10, dex:14, con:15, int:6, wis:8, cha:5, cr:'1/4', xp:50, profBonus:2,
    resistances:'Bludgeoning (nonmagical)', immunities:'Poison; exhaustion, poisoned',
    senses:'Darkvision 60 ft., Passive Perception 9', languages:"understands languages it knew in life",
    actions:[{name:'Shortsword',desc:'Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6+2) piercing damage.'},{name:'Shortbow',desc:'Ranged Weapon Attack: +4 to hit, range 80/320 ft., one target. Hit: 5 (1d6+2) piercing damage.'}]
  },
  {
    name:'Zombie', type:'Undead', size:'Medium', alignment:'Neutral Evil',
    ac:8, acNote:'', hp:'3d8+9', avgHp:22, speed:'20 ft.',
    str:13, dex:6, con:16, int:3, wis:6, cha:5, cr:'1/4', xp:50, profBonus:2,
    saves:'WIS +0', immunities:'Poison; poisoned',
    senses:'Darkvision 60 ft., Passive Perception 8', languages:"understands languages it knew in life",
    traits:[{name:'Undead Fortitude',desc:'If damage reduces the zombie to 0 hit points, it must make a Constitution saving throw DC 5 + damage taken, unless damage is radiant or a critical hit. On success, the zombie drops to 1 hit point instead.'}],
    actions:[{name:'Slam',desc:'Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 4 (1d6+1) bludgeoning damage.'}]
  },
  {
    name:'Wolf', type:'Beast', size:'Medium', alignment:'Unaligned',
    ac:13, acNote:'natural armor', hp:'2d8+2', avgHp:11, speed:'40 ft.',
    str:12, dex:15, con:12, int:3, wis:12, cha:6, cr:'1/4', xp:50, profBonus:2,
    skills:'Perception +3, Stealth +4', senses:'Passive Perception 13', languages:'—',
    traits:[{name:'Keen Hearing and Smell',desc:'The wolf has advantage on Wisdom (Perception) checks that rely on hearing or smell.'},{name:'Pack Tactics',desc:"The wolf has advantage on an attack roll against a creature if at least one ally is adjacent to the creature and the ally isn't incapacitated."}],
    actions:[{name:'Bite',desc:'Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 7 (2d4+2) piercing damage. DC 11 STR save or be knocked prone.'}]
  },
  {
    name:'Troll', type:'Giant', size:'Large', alignment:'Chaotic Evil',
    ac:15, acNote:'natural armor', hp:'8d10+40', avgHp:84, speed:'30 ft.',
    str:18, dex:13, con:20, int:7, wis:9, cha:7, cr:'5', xp:1800, profBonus:3,
    skills:'Perception +2', senses:'Darkvision 60 ft., Passive Perception 12', languages:'Giant',
    traits:[{name:'Keen Smell',desc:'The troll has advantage on Wisdom (Perception) checks that rely on smell.'},{name:'Regeneration',desc:"The troll regains 10 hit points at the start of its turn unless it took acid or fire damage. The troll dies only if it starts its turn with 0 HP and doesn't regenerate."}],
    actions:[{name:'Multiattack',desc:'The troll makes three attacks: one with its bite and two with its claws.'},{name:'Bite',desc:'Melee Weapon Attack: +7 to hit, reach 5 ft. Hit: 7 (1d6+4) piercing damage.'},{name:'Claw',desc:'Melee Weapon Attack: +7 to hit, reach 5 ft. Hit: 11 (2d6+4) slashing damage.'}]
  },
  {
    name:'Bandit', type:'Humanoid (any race)', size:'Medium', alignment:'Any Non-Lawful',
    ac:12, acNote:'leather armor', hp:'2d8+2', avgHp:11, speed:'30 ft.',
    str:11, dex:12, con:12, int:10, wis:10, cha:10, cr:'1/8', xp:25, profBonus:2,
    senses:'Passive Perception 10', languages:'Any one language (usually Common)',
    actions:[{name:'Scimitar',desc:'Melee Weapon Attack: +3 to hit, reach 5 ft. Hit: 4 (1d6+1) slashing damage.'},{name:'Light Crossbow',desc:'Ranged Weapon Attack: +3 to hit, range 80/320 ft. Hit: 5 (1d8+1) piercing damage.'}]
  },
  {
    name:'Owlbear', type:'Monstrosity', size:'Large', alignment:'Unaligned',
    ac:13, acNote:'natural armor', hp:'7d10+21', avgHp:59, speed:'40 ft.',
    str:20, dex:12, con:17, int:3, wis:12, cha:7, cr:'3', xp:700, profBonus:2,
    skills:'Perception +3', senses:'Darkvision 60 ft., Passive Perception 13', languages:'—',
    traits:[{name:'Keen Sight and Smell',desc:'The owlbear has advantage on Wisdom (Perception) checks that rely on sight or smell.'}],
    actions:[{name:'Multiattack',desc:'The owlbear makes two attacks: one with its beak and one with its claws.'},{name:'Beak',desc:'Melee Weapon Attack: +7 to hit, reach 5 ft. Hit: 10 (1d10+5) piercing damage.'},{name:'Claws',desc:'Melee Weapon Attack: +7 to hit, reach 5 ft. Hit: 14 (2d8+5) slashing damage.'}]
  },
  {
    name:'Adult Red Dragon', type:'Dragon', size:'Huge', alignment:'Chaotic Evil',
    ac:19, acNote:'natural armor', hp:'19d12+133', avgHp:256, speed:'40 ft., climb 40 ft., fly 80 ft.',
    str:27, dex:10, con:25, int:16, wis:13, cha:21, cr:'17', xp:18000, profBonus:6,
    saves:'DEX +6, CON +13, WIS +7, CHA +11', skills:'Perception +13, Stealth +6',
    immunities:'Fire', senses:'Blindsight 60 ft., Darkvision 120 ft., Passive Perception 23', languages:'Common, Draconic',
    traits:[{name:'Legendary Resistance (3/Day)',desc:'If the dragon fails a saving throw, it can choose to succeed instead.'}],
    actions:[{name:'Multiattack',desc:"The dragon uses Frightful Presence then makes three attacks: one bite and two claws."},{name:'Bite',desc:'Melee Weapon Attack: +14 to hit, reach 10 ft. Hit: 19 (2d10+8) piercing + 7 (2d6) fire damage.'},{name:'Claw',desc:'Melee Weapon Attack: +14 to hit, reach 5 ft. Hit: 15 (2d6+8) slashing damage.'},{name:'Fire Breath (Recharge 5-6)',desc:'60-foot cone. DC 21 DEX save, 63 (18d6) fire damage on fail, half on success.'}],
    legendaryActions:[{name:'Detect',desc:'The dragon makes a Perception check.'},{name:'Tail Attack',desc:'The dragon makes a tail attack.'},{name:'Wing Attack (2 Actions)',desc:'Creatures within 10 ft. DC 22 DEX save or 15 (2d6+8) bludgeoning and knocked prone.'}]
  },
  {
    name:'Lich', type:'Undead', size:'Medium', alignment:'Any Evil',
    ac:17, acNote:'natural armor', hp:'18d8+90', avgHp:135, speed:'30 ft.',
    str:11, dex:16, con:16, int:20, wis:14, cha:16, cr:'21', xp:33000, profBonus:7,
    saves:'CON +10, INT +12, WIS +9', skills:'Arcana +19, History +12, Insight +9, Perception +9',
    immunities:'Cold, Lightning, Necrotic, Poison; charmed, exhaustion, frightened, paralyzed, poisoned',
    resistances:'Bludgeoning, Piercing, Slashing from Nonmagical Attacks',
    senses:'Truesight 120 ft., Passive Perception 19', languages:'Common plus up to five other languages',
    traits:[{name:'Legendary Resistance (3/Day)',desc:'If the lich fails a saving throw, it can choose to succeed instead.'},{name:'Rejuvenation',desc:'If it has a phylactery, a destroyed lich gains a new body in 1d10 days.'},{name:'Spellcasting',desc:'18th-level spellcaster. Spell save DC 20, +12 to hit with spell attacks.'}],
    actions:[{name:'Paralyzing Touch',desc:'Melee Spell Attack: +12 to hit. Hit: 10 (3d6) cold damage. DC 18 CON save or paralyzed for 1 minute.'}],
    legendaryActions:[{name:'Cantrip',desc:'The lich casts a cantrip.'},{name:'Paralyzing Touch (2 Actions)',desc:'The lich uses Paralyzing Touch.'},{name:'Disrupt Life (3 Actions)',desc:'Creatures within 20 ft. make DC 18 CON save or take 21 (6d6) necrotic damage.'}]
  },
];
