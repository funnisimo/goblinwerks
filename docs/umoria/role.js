

const SPELL_TYPE_MAGE   = 'mage';
const SPELL_TYPE_PRIEST = 'priest';

const HERO_ROLES = {};

function addRole(id, name, attributes, skills, skillPerLevel, hitDie, xpFactor, maxLevel, magicType, firstSpellLevel, desc, opts) {
  const roll = {
    id,
    name,
    attributes,
    skills,
    skillPerLevel,
    hitDie,
    xpFactor,
    maxLevel,
    magicType,
    firstSpellLevel,
    description: desc,
  };

  if (opts) {
    Object.assign(roll, opts);
  }

  HERO_ROLES[id] = roll;
  return roll;
}


// Classes.
    // class   hp dis src stl fos bth btb sve  s   i   w   d  co  ch  spell             exp  spl
addRole('WARRIOR', "Warrior", [5, -2, -2,  2,  2, -1],
  { disarm: 25, search: 14, stealth: 1, perception: 38, toHit: 70, toHitBows: 55, magic: 18 },
  { toHit: 4, toHitBows: 4, devices: 2, disarm: 2, magic: 3 },
  9, 40, 0, null, 0,
  "Warriors are fighters who relish the energy of hand-to-hand combat.  They rely on their strength, dexterity, and sturdiness.  They cannot cast spells.",
  {
    titles: ["Rookie",      "Private",      "Soldier",      "Mercenary",    "Veteran(1st)",
            "Veteran(2nd)", "Veteran(3rd)", "Warrior(1st)", "Warrior(2nd)", "Warrior(3rd)",
            "Warrior(4th)", "Swordsman-1",  "Swordsman-2",  "Swordsman-3",  "Hero",
            "Swashbuckler", "Myrmidon",     "Champion-1",   "Champion-2",   "Champion-3",
            "Superhero",    "Knight",       "Superior Knt", "Gallant Knt",  "Knt Errant",
            "Guardian Knt", "Baron",        "Duke",         "Lord (1st)",   "Lord (2nd)",
            "Lord (3rd)",   "Lord (4th)",   "Lord (5th)",   "Lord (6th)",   "Lord (7th)",
            "Lord (8th)",   "Lord (9th)",   "Lord Gallant", "Lord Keeper",  "Lord Noble"],
  }
);

addRole('MAGE', "Mage",  [-5,  3,  0,  1, -2,  1],
  { disarm: 30, search: 16, stealth: 2, perception: 20, toHit: 34, toHitBows: 20, magic: 36 },
  { toHit: 2, toHitBows: 2, devices: 4, disarm: 3, magic: 3 },
  0, 40, 30, SPELL_TYPE_MAGE, 1,
  "Mages use magic spells and items to thwart any challenges.  They rely on their intelligence and wits.",
  {
    titles: ["Novice",      "Apprentice",   "Trickster-1",  "Trickster-2",  "Trickster-3",
            "Cabalist-1",   "Cabalist-2",   "Cabalist-3",   "Visionist",    "Phantasmist",
            "Shadowist",    "Spellbinder",  "Illusionist",  "Evoker (1st)", "Evoker (2nd)",
            "Evoker (3rd)", "Evoker (4th)", "Conjurer",     "Theurgist",    "Thaumaturge",
            "Magician",     "Enchanter",    "Warlock",      "Sorcerer",     "Necromancer",
            "Mage (1st)",   "Mage (2nd)",   "Mage (3rd)",   "Mage (4th)",   "Mage (5th)",
            "Wizard (1st)", "Wizard (2nd)", "Wizard (3rd)", "Wizard (4th)", "Wizard (5th)",
            "Wizard (6th)", "Wizard (7th)", "Wizard (8th)", "Wizard (9th)", "Wizard Lord"],
  }
);

addRole('PRIEST', "Priest",  [-3, -3,  3, -1,  0,  2],
  { disarm: 25, search: 16, stealth: 2, perception: 32, toHit: 48, toHitBows: 35, magic: 30},
  { toHit: 2, toHitBows: 2, devices: 4, disarm: 3, magic: 3 },
  2, 40, 20, SPELL_TYPE_PRIEST, 1,
  "Priests are students of the divine.  They use their wisdom to advance in the world.",
  {
    titles: ["Believer",    "Acolyte(1st)", "Acolyte(2nd)", "Acolyte(3rd)", "Adept (1st)",
            "Adept (2nd)",  "Adept (3rd)",  "Priest (1st)", "Priest (2nd)", "Priest (3rd)",
            "Priest (4th)", "Priest (5th)", "Priest (6th)", "Priest (7th)", "Priest (8th)",
            "Priest (9th)", "Curate (1st)", "Curate (2nd)", "Curate (3rd)", "Curate (4th)",
            "Curate (5th)", "Curate (6th)", "Curate (7th)", "Curate (8th)", "Curate (9th)",
            "Canon (1st)",  "Canon (2nd)",  "Canon (3rd)",  "Canon (4th)",  "Canon (5th)",
            "Low Lama",     "Lama-1",       "Lama-2",       "Lama-3",       "High Lama",
            "Great Lama",   "Patriarch",    "High Priest",  "Great Priest", "Noble Priest"],
  }
);

addRole('ROGUE', "Rogue",   [ 2,  1, -2,  3,  1, -1],
  { disarm: 45, search: 32, stealth: 5, perception: 16, toHit: 60, toHitBows: 66, magic: 30},
  { toHit: 3, toHitBows: 4, devices: 3, disarm: 4, magic: 3 },
  6, 40, 0, SPELL_TYPE_MAGE, 5,
  "Rogues are adept fighters, but excel at finding and dealing with secrets and traps.  They are very athletic (both strong and agile) and are generally clever.  After the 5th level, Rogues can learn limited mage spells.",
  {
    titles: ["Vagabond",    "Footpad",      "Cutpurse",    "Robber",        "Burglar",
            "Filcher",      "Sharper",      "Magsman",     "Common Rogue",  "Rogue (1st)",
            "Rogue (2nd)",  "Rogue (3rd)",  "Rogue (4th)", "Rogue (5th)",   "Rogue (6th)",
            "Rogue (7th)",  "Rogue (8th)",  "Rogue (9th)", "Master Rogue",  "Expert Rogue",
            "Senior Rogue", "Chief Rogue",  "Prime Rogue", "Low Thief",     "Thief (1st)",
            "Thief (2nd)",  "Thief (3rd)",  "Thief (4th)", "Thief (5th)",   "Thief (6th)",
            "Thief (7th)",  "Thief (8th)",  "Thief (9th)", "High Thief",    "Master Thief",
            "Executioner",  "Low Assassin", "Assassin",    "High Assassin", "Guildsmaster"],
  }
);

addRole('RANGER', "Ranger",  [ 2,  2,  0,  1,  1,  1],
  { disarm: 30, search: 24, stealth: 3, perception: 24, toHit: 56, toHitBows: 72, magic: 30},
  { toHit: 3, toHitBows: 4, devices: 3, disarm: 3, magic: 3 },
  4, 40, 40, SPELL_TYPE_MAGE, 3,
  "Rangers are masters of the bow.  They are smart and strong.  Rangers learn limited mage spells starting at the 3rd level.",
  {
    titles: ["Runner (1st)",  "Runner (2nd)",  "Runner (3rd)",  "Strider (1st)", "Strider (2nd)",
            "Strider (3rd)",  "Scout (1st)",   "Scout (2nd)",   "Scout (3rd)",   "Scout (4th)",
            "Scout (5th)",    "Courser (1st)", "Courser (2nd)", "Courser (3rd)", "Courser (4th)",
            "Courser (5th)",  "Tracker (1st)", "Tracker (2nd)", "Tracker (3rd)", "Tracker (4th)",
            "Tracker (5th)",  "Tracker (6th)", "Tracker (7th)", "Tracker (8th)", "Tracker (9th)",
            "Guide (1st)",    "Guide (2nd)",   "Guide (3rd)",   "Guide (4th)",   "Guide (5th)",
            "Guide (6th)",    "Guide (7th)",   "Guide (8th)",   "Guide (9th)",   "Pathfinder-1",
            "Pathfinder-2",   "Pathfinder-3",  "Ranger",        "High Ranger",   "Ranger Lord"],
  }
);

addRole('PALADIN', "Paladin", [ 3, -3,  1,  0,  2,  2],
  { disarm: 20, search: 12, stealth: 1, perception: 38, toHit: 68, toHitBows: 40, magic: 24},
  { toHit: 3, toHitBows: 3, devices: 3, disarm: 2, magic: 3 }, // Paladin
  6, 40, 35, SPELL_TYPE_PRIEST, 1,
  "Paladins are the champions of the divine.  They follow the ways of Priests, but aren't afraid to bash a few heads if necessary.  They are strong and sturdy with just enough wisdom to stay out of a fight when appropriate.  They learn limited Priest spells.",
  {
    titles: ["Gallant",     "Keeper (1st)", "Keeper (2nd)", "Keeper (3rd)", "Keeper (4th)",
            "Keeper (5th)", "Keeper (6th)", "Keeper (7th)", "Keeper (8th)", "Keeper (9th)",
            "Protector-1",  "Protector-2",  "Protector-3",  "Protector-4",  "Protector-5",
            "Protector-6",  "Protector-7",  "Protector-8",  "Defender-1",   "Defender-2",
            "Defender-3",   "Defender-4",   "Defender-5",   "Defender-6",   "Defender-7",
            "Defender-8",   "Warder (1st)", "Warder (2nd)", "Warder (3rd)", "Warder (4th)",
            "Warder (5th)", "Warder (6th)", "Warder (7th)", "Warder (8th)", "Warder (9th)",
            "Guardian",     "Chevalier",    "Justiciar",    "Paladin",      "High Lord"],
  }
);
