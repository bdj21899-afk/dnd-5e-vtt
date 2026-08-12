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
  avatarUrl: '',
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
      if (!stored) return defaultCharacter;
      const parsed = JSON.parse(stored);
      const merged: Character = { ...defaultCharacter, ...parsed };

      // Sanitize spellcastingAbility — must be a plain AbilityKey string
      const validAbilities: AbilityKey[] = ['strength','dexterity','constitution','intelligence','wisdom','charisma'];
      if (typeof merged.spellcastingAbility !== 'string' || !validAbilities.includes(merged.spellcastingAbility as AbilityKey)) {
        merged.spellcastingAbility = 'intelligence';
      }

      // Sanitize saveProficiencies — values must be booleans, not objects
      const rawSave = merged.saveProficiencies as Record<string, unknown>;
      const cleanSave: Partial<Record<AbilityKey, boolean>> = {};
      for (const k of validAbilities) {
        const v = rawSave[k];
        cleanSave[k] = typeof v === 'boolean' ? v : (typeof v === 'object' && v !== null ? false : Boolean(v));
      }
      merged.saveProficiencies = cleanSave;

      // Sanitize skillProficiencies — values must be {proficient, expertise} not raw SKILLS objects
      const rawSkills = merged.skillProficiencies as Record<string, unknown>;
      const cleanSkills: Record<string, SkillProf> = { ...defaultSkills };
      for (const [sk, sv] of Object.entries(rawSkills)) {
        if (sv && typeof sv === 'object' && !Array.isArray(sv)) {
          const obj = sv as Record<string, unknown>;
          // Only accept if it has proficient/expertise booleans; reject old SKILLS-item shape
          if (typeof obj.proficient === 'boolean' || typeof obj.expertise === 'boolean') {
            cleanSkills[sk] = { proficient: Boolean(obj.proficient), expertise: Boolean(obj.expertise) };
          }
          // else leave as default (false/false)
        }
      }
      merged.skillProficiencies = cleanSkills;

      // Sanitize primitive string fields — coerce any accidentally stored objects to empty string
      const stringFields: (keyof Character)[] = ['name','race','charClass','subclass','background','alignment','hitDice','personalityTraits','ideals','bonds','flaws','features','notes','avatarUrl'];
      for (const f of stringFields) {
        if (typeof (merged as Record<string, unknown>)[f as string] !== 'string') {
          (merged as Record<string, unknown>)[f as string] = typeof defaultCharacter[f] === 'string' ? defaultCharacter[f] : '';
        }
      }

      return merged;
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
