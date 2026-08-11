import { useState, useCallback } from 'react';
import { Character, AbilityKey, AbilityScores, SkillProf } from '@/types/dnd';
import { SKILLS, profBonus, abilityMod } from '@/constants/dnd5e';

const defaultSkills: Record<string, SkillProf> = Object.fromEntries(
  SKILLS.map(s => [s.key, { proficient: false, expertise: false }])
);

export const defaultCharacter: Character = {
  name: 'New Adventurer',
  race: 'Human', charClass: 'Fighter', subclass: '', level: 1,
  background: 'Soldier', alignment: 'True Neutral', xp: 0,
  abilityScores: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
  maxHp: 10, currentHp: 10, tempHp: 0,
  ac: 10, speed: 30, hitDice: 'd10', hitDiceUsed: 0,
  deathSuccesses: 0, deathFailures: 0, inspiration: false,
  saveProficiencies: {},
  skillProficiencies: defaultSkills,
  spellcastingAbility: 'intelligence',
  spellSlots: {},
  spells: [],
  equipment: [],
  cp: 0, sp: 0, ep: 0, gp: 0, pp: 0,
  personalityTraits: '', ideals: '', bonds: '', flaws: '', features: '', notes: '',
};

export function useCharacter() {
  const playerId = localStorage.getItem('dnd_player_id') || 'default_player';
  const key = `dnd_char_${playerId}`;

  const load = (): Character => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? { ...defaultCharacter, ...JSON.parse(stored) } : defaultCharacter;
    } catch { return defaultCharacter; }
  };

  const [char, setChar] = useState<Character>(load);

  const update = useCallback((partial: Partial<Character>) => {
    setChar(prev => {
      const updated = { ...prev, ...partial };
      localStorage.setItem(key, JSON.stringify(updated));
      return updated;
    });
  }, [key]);

  const profB = profBonus(char.level);
  const mod = (k: AbilityKey) => abilityMod(char.abilityScores[k]);

  const skillBonus = (skillKey: string, ability: AbilityKey): number => {
    const base = abilityMod(char.abilityScores[ability]);
    const prof = char.skillProficiencies[skillKey];
    if (!prof) return base;
    return base + (prof.proficient ? profB : 0) + (prof.expertise ? profB : 0);
  };

  const saveBonus = (ability: AbilityKey): number => {
    return abilityMod(char.abilityScores[ability]) + (char.saveProficiencies[ability] ? profB : 0);
  };

  const passivePerception = (): number => {
    return 10 + skillBonus('perception', 'wisdom');
  };

  const spellSaveDC = (): number => {
    return 8 + profB + abilityMod(char.abilityScores[char.spellcastingAbility]);
  };

  const spellAttackBonus = (): number => {
    return profB + abilityMod(char.abilityScores[char.spellcastingAbility]);
  };

  return { char, update, profB, mod, skillBonus, saveBonus, passivePerception, spellSaveDC, spellAttackBonus };
}
