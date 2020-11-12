
GW.config.hunger = {
  STOMACH_SIZE:					2150,
  HUNGER_THRESHOLD:			300,
  WEAK_THRESHOLD:				150,
  FAINT_THRESHOLD:			50,
};



const HERO_MAX_LEVEL = 40;
const TURNS_FOR_FULL_MANA_REGEN = 100;
const BTH_PER_PLUS_TO_HIT_ADJUST = 3; // Adjust BTH per plus-to-hit

const HERO_XP_TO_ADVANCE = [
        10,      25,     45,      70,       100,      140,      200,       280,
        380,     500,    650,     850,      1100,     1400,     1800,      2300,
        2900,    3600,   4400,    5400,     6800,     8400,     10200,     12500,
        17500,   25000,  35000,   50000,    75000,    100000,   150000,    200000,
        300000,  400000, 500000,  750000,   1500000,  2500000,  5000000,   10000000,
];


// Generates character's stats -JWT-
function rollAttributes() {
    let total;
    let dice = []; // int[18];

    do {
        total = 0;
        for (let i = 0; i < 18; i++) {
            // Roll 3,4,5 sided dice once each
            dice[i] = GW.random.range(2, 4);
            total += dice[i];
        }
    } while (total <= 42 || total >= 54);

    let attributes = [];
    for (let i = 0; i < 6; i++) {
        attributes[i] = (5 + dice[3 * i] + dice[3 * i + 1] + dice[3 * i + 2]);
    }
    return attributes;
}


function attributesAsObject(base) {
  if (Array.isArray(base)) {
    base = {
      str: base[0],
      int: base[1],
      wis: base[2],
      dex: base[3],
      con: base[4],
      chr: base[5],
    };
  }
  ['str', 'int', 'wis', 'dex', 'con', 'chr'].forEach( (attr) => {
    base[attr] = base[attr] || 0;
  });
  return base;
}


class HeroKind extends GW.types.ActorKind {
  constructor(opts={}) {
    GW.utils.setDefaults(opts, {
      attributes: {},
      age: 18,
      height: 70,
      weight: 170,
      skills: {},
      hitDie: 8,
      abilities: {},
      xpFactor: 100,
      roles: [],
      history: 0,
      description: null,
      stats: {},

      // Electing not to do gender/sex just to simplify some things
      // You could easily add it later
      actorFlags: 'AF_MALE', // error prone if you send it in opts

      ch: '@',
      fg: 'white',
    });
    opts.stats.food = GW.config.hunger.STOMACH_SIZE;

    super(opts);

    this.age = GW.make.range(opts.age);
    this.height = GW.make.range(opts.height);
    this.weight = GW.make.range(opts.weight);

    this.hitDie = opts.hitDie;
    this.xpFactor = opts.xpFactor;

    this.skills = opts.skills;
    this.attributes = attributesAsObject(opts.attributes);
    this.abilities = opts.abilities;

    this.roles = opts.roles;
    this.description = opts.description;
    this.historyIndex = opts.historyIndex;  // starting index into the history table
  }

  make(actor, opts={}) {
    super.make(actor, opts);

    let role = opts.role || opts.roleId;
    if (!role) {
      GW.utils.WARN('Defaulting hero role to ', this.roles[0]);
      role = HERO_ROLES[this.roles[0]];
    }

    if (typeof role === 'string') {
      role = HERO_ROLES[role];
    }

    actor.role = role;
    actor.data = {
      age: this.age.value(),
      height: this.height.value(),
      weight: this.weight.value(),
      xpFactor: this.xpFactor + role.xpFactor,
      hitDie: this.hitDie + role.hitDie,
    };

    if (actor.isFemale()) {
      actor.data.height = Math.round(actor.data.height * 0.92);
      actor.data.weight = Math.round(actor.data.weight * 0.82);
    }
    actor.initStat('level', 1);
    actor.initStat('xp', 0);

    actor.display = {}; // for displayed versions of +toHit +toAC +toDmg AC

    const attributes = opts.attributes || rollAttributes();
    this.initAttributes(actor, attributes, role.attributes);

    this.initHealth(actor);
    this.initSkills(actor);
    this.initAbilities(actor);
    this.initCombatValues(actor);

    this.updateMana(actor);
    this.updateMemorizedSpellListSize(actor, true);
    actor.current.mana = actor.max.mana;

    this.initHistory(actor);
    this.initStartingGold(actor);
  }

  initAttributes(actor, base={}, role={}) {
    base = attributesAsObject(base);
    role = attributesAsObject(role);

    for(let attr in this.attributes) {
      const k = this.attributes[attr] || 0;
      const b = base[attr] || 0;
      const r = role[attr] || 0;
      actor.initStat(attr, k + b + r);
    }
  }

  initHealth(actor) {
    const hitDie = actor.data.hitDie || 8;
    actor.data.health = [];

    // Initialize hit_points array.
    // Put bounds on total possible hp, only succeed
    // if it is within 1/8 of average value.
    const min_value = Math.floor(HERO_MAX_LEVEL * 3 / 8 * (hitDie - 1)) + HERO_MAX_LEVEL;
    const max_value = Math.ceil(HERO_MAX_LEVEL * 5 / 8 * (hitDie - 1)) + HERO_MAX_LEVEL;
    actor.data.health[0] = hitDie;

    do {
        for (let i = 1; i < HERO_MAX_LEVEL; i++) {
            actor.data.health[i] = GW.random.number(hitDie) + 1;
            actor.data.health[i] += actor.data.health[i - 1];
        }
    } while (actor.data.health[HERO_MAX_LEVEL - 1] < min_value || actor.data.health[HERO_MAX_LEVEL - 1] > max_value);

    actor.initStat('health', this.healthBonus(actor) + actor.data.health[0]);
  }


  initStartingGold(actor) {

    // Given a stat value, return a monetary value,
    // which affects the amount of gold a player has.
    function goldFromStat(stat) {
        return 5 * (stat - 10);
    }

    let value = goldFromStat(actor.current.str);
    value += goldFromStat(actor.current.int);
    value += goldFromStat(actor.current.wis);
    value += goldFromStat(actor.current.con);
    value += goldFromStat(actor.current.dex);

    // Social Class adjustment
    let gold = actor.data.socialClass * 6 + GW.random.number(25) + 1 + 325;

    // Stat adjustment
    gold -= value;

    // Charisma adjustment
    gold += goldFromStat(actor.current.chr);

    // She charmed the banker into it! -CJS-
    if (actor.isFemale()) {
        gold += 50;
    }

    // Minimum
    if (gold < 80) {
        gold = 80;
    }

    actor.current.gold = gold;
  }

  initHistory(actor) {
    initHeroHistory(actor);
  }

  healthBonus(actor) {
    return this.conBonus(actor);
  }

  initSkills(actor) {
    const skills = ['disarm', 'search', 'toHit', 'toHitBows', 'perception', 'stealth', 'magic'];

    actor.skills = {};
    skills.forEach( (skill) => {
      const k = actor.kind.skills[skill] || 0;
      const r = actor.role.skills[skill] || 0;
      actor.skills[skill] = k + r;
    });

    actor.skills.disarm += this.disarmBonus(actor);
  }

  initAbilities(actor) {
    actor.abilities = Object.assign({}, this.abilities);  // copy so we can change it (with items, spells, xp, ...)
    actor.abilities.infravision = actor.abilities.infravision || 0;
  }

  initCombatValues(actor) {
    actor.current.toDamage = this.damageBonus(actor);
    actor.current.toHit = this.toHitBonus(actor);
    actor.current.toArmor = 0;
    actor.current.armor = this.armorBonus(actor);

    // Displayed values
    ['toDamage', 'toHit', 'toArmor', 'armor'].forEach( (v) => actor.display[v] = actor.current[v] );

  }

  updateMemorizedSpellListSize(actor, forceReset) {
    let count = 0;
    const role = actor.role;

    if (!role.magicType) {
      actor.memorized = [];
      return;
    }

    count = 2;

    const add = GW.utils.clamp(actor.current.int - 10, 0, 24);
    const percent = (actor.current.level - role.firstSpellLevel) / (HERO_MAX_LEVEL - role.firstSpellLevel);

    count = count + Math.floor(add*percent);

    const memorized = actor.memorized = actor.memorized || [];
    if (!forceReset) {
      if (memorized.length > count) {
        GW.message.add('%FYou are having trouble remembering some spells.', 'badMessageColor');
        // TODO - We could probably be smart about compacting the list, but not yet...
      }
      else if (memorized.length < count) {
        GW.message.add('%FYou feel a thirst for more knowledge.', 'goodMessageColor');
      }
    }

    for(let i = 0; i < count; ++i) {
      if (forceReset) {
        memorized[i] = null;
      }
      else {
        memorized[i] = memorized[i] || null;
      }
    }
    memorized.length = count;
  }

  calcMana(actor) {
    const role = actor.role;
    if (!role.magicType) return 0;

    let mana = 0;
    const levels = this.spellCastingLevel(actor);
    const attr = (role.magicType === SPELL_TYPE_MAGE) ? 'int' : 'wis';
    switch (this.manaBonus(actor, attr)) {
        case 1:
        case 2:
            mana = 1 * levels;
            break;
        case 3:
            mana = 3 * levels / 2;
            break;
        case 4:
            mana = 2 * levels;
            break;
        case 5:
            mana = 5 * levels / 2;
            break;
        case 6:
            mana = 3 * levels;
            break;
        case 7:
            mana = 4 * levels;
            break;
        default:
            mana = 0;
    }

    return Math.floor(mana + 1);  // everybody gets a bonus mana
  }

  spellCastingLevel(actor) {
    const role = actor.role;
    if (!role.magicType) return 0;
    return actor.current.level - role.firstSpellLevel + 1;
  }

  // Gain some mana if you know at least one spell -RAK-
  updateMana(actor) {
    const newMana = this.calcMana(actor);

    if (newMana <= 0) {
      actor.current.mana = actor.max.mana = 0;
      actor.regen.mana = 0;
      return;
    }

    const delta = Math.floor(100 * newMana / actor.max.mana) || 100;
    actor.max.mana = newMana;
    actor.current.mana = actor.current.mana || 0;
    actor.current.mana = Math.floor( delta * actor.current.mana / 100);

    actor.regen.mana  = Math.ceil(TURNS_FOR_FULL_MANA_REGEN / newMana);
  }

  // ATTRIBUTE BONUSES

  intBonus(actor) {
    return this.manaBonus(actor, 'int');
  }

  wisBonus(actor) {
    return this.manaBonus(actor, 'wis');
  }

  conBonus(actor) {
    const con = actor.current.con;
    if (con <   7) { return (con - 7); }
    if (con <  17) { return 0; }
    if (con == 17) { return 1; }
    if (con <  21) { return 2; }
    if (con <  25) { return 3; }
    return 4;
  }

  // STAT BONUSES

  manaBonus(actor, attr='int') {
    // Adjustment for wisdom/intelligence -JWT-
    const value = actor.current[attr];
    if (value > 27) return adjustment = 7;
    if (value > 25) return 6;
    if (value > 23) return 5;
    if (value > 20) return 4;
    if (value > 17) return 3;
    if (value > 14) return 2;
    if (value >  7) return 1;
    return 0;
  }

  // SKILL BONUSES

  disarmBonus(actor) {
    const dex = actor.current.dex;
    if (dex <  4) return -8;
    if (dex == 4) return -6;
    if (dex == 5) return -4;
    if (dex == 6) return -2;
    if (dex == 7) return -1;
    if (dex < 13) return 0;
    if (dex < 16) return 1;
    if (dex < 18) return 2;
    if (dex < 22) return 4;
    if (dex < 26) return 5;
    if (dex < 28) return 6;
    return 8;
  }

  // COMBAT BONUSES

  damageBonus(actor) {
    const str = actor.current.str;
    if (str <  4) return -2;
    if (str <  5) return -1;
    if (str < 16) return 0;
    if (str < 17) return 1;
    if (str < 18) return 2;
    if (str < 26) return 3;
    if (str < 27) return 4;
    if (str < 28) return 5;
    return 6;
  }

  toHitBonus(actor) {
    let total = 0;
    const dex = actor.current.dex;
    if (dex < 4)       { total = -3; }
    else if (dex <  6) { total = -2; }
    else if (dex <  8) { total = -1; }
    else if (dex < 16) { total = 0; }
    else if (dex < 17) { total = 1; }
    else if (dex < 18) { total = 2; }
    else if (dex < 23) { total = 3; }
    else if (dex < 28) { total = 4; }
    else { total = 5; }

    const str = actor.current.str;
    if (str < 4)       { total -= 3; }
    else if (str <  5) { total -= 2; }
    else if (str <  7) { total -= 1; }
    else if (str < 18) { total -= 0; }
    else if (str < 25) { total += 1; }
    else if (str < 27) { total += 2; }
    else if (str < 28) { total += 3; }
    else { total += 4; }

    return total;
  }

  armorBonus(actor) {
    const dex = actor.current.dex;
    if (dex <  4) return -4;
    if (dex == 4) return -3;
    if (dex == 5) return -2;
    if (dex == 6) return -1;
    if (dex < 15) return 0;
    if (dex < 18) return 1;
    if (dex < 22) return 2;
    if (dex < 26) return 3;
    if (dex < 28) return 4;
    return 5;
  }


}

var HERO_KINDS = {};

function addHeroKind(id, name, attributes, age, height, weight, skills, hitDie, abilities, xpFactor, roles, description, opts={}) {
  opts.name = name;
  opts.attributes = attributes;
  opts.age = age;
  opts.height = height;
  opts.weight = weight;
  opts.skills = skills;
  opts.hitDie = hitDie;
  opts.abilities = abilities;
  opts.xpFactor = xpFactor;
  opts.roles = roles;
  opts.description = description;

  const kind = GW.actor.addKind(id, new HeroKind(opts));
  HERO_KINDS[id] = kind;
  return kind;
}



// Race, STR, INT, WIS, DEX, CON, CHR,
//   ages, heights, and weights (male then female)
// Racial Bases for:
//   dis, chance_in_search, stealth_factor, fos, bth, bth_with_bows, saving_throw_base,
//   hit_die, infra, exp base, choice-roles
addHeroKind('HUMAN', "Human", [0,  0,  0,  0,  0,  0],
  '1d6+14', '72~6', '180~25', // ], ['66~4', '150~20'],
  { disarm: 0,  search: 0,  stealth: 0,  perception: 0,  toHit: 0,  toHitBows: 0,  magic: 0, },
  10,  { infravision: 0 }, 100, ['WARRIOR', 'MAGE', 'PRIEST', 'ROGUE', 'PALADIN', 'RANGER'],
  "Humans are the most common race.  They do not excel at anything and have few drawbacks.  They are the only race that cannot see in the dark.  Humans may be any class.",
  { historyIndex: 1 },
);

addHeroKind('HALF_ELF', "Half-Elf", [-1,  1,  0,  1, -1,  1],
    '1d16+24', '66~6', '130~15', // ], ['62~6', '100~10'],
    { disarm: 2,  search: 6,  stealth: 1, perception: -1, toHit: -1,  toHitBows: 5,  magic: 3 },
    9,  { infravision: 2 }, 110, ['WARRIOR', 'MAGE', 'PRIEST', 'ROGUE', 'RANGER', 'PALADIN'],
    "Half-Elves are not very common these days.  They share most of the traits of their Elven ancestors: They are slightly weaker and more delicate than humans, but are smart, adroit, and likeable.  Half-Elves may be Warrior, Mage, Priest, Rogue, Ranger, or Paladin roles.",
    { historyIndex: 4 },
);

addHeroKind('ELF', "Elf", [-1,  2,  1,  1, -2,  1],
    '1d75+75', '60~4', '100~6', // ], ['54~4', '80~6'],
    { disarm: 5,  search: 8,  stealth: 1, perception: -2, toHit: -5,  toHitBows: 15,  magic: 6 },
    8,  { infravision: 3 }, 120, ['WARRIOR', 'MAGE', 'PRIEST', 'ROGUE', 'RANGER'],
    "Elves are magical beings from the forests.  They are weaker and more delicate than humans, but are very smart.  They may be Warrior, Mage, Priest, Rogue, or Ranger roles.",
    { historyIndex: 7 },
);

addHeroKind('HALFLING', "Halfling", [-2,  2,  1,  3,  1,  1],
    '1d12+21', '36~3', '60~3', // ], ['33~3', '50~3'],
    { disarm: 15,  search: 12,  stealth: 4, perception: -5, toHit: -10,  toHitBows: 20,  magic: 18 },
    6,  { infravision: 4 }, 110, ['WARRIOR', 'MAGE', 'ROGUE'],
    "Halflings quite small, but make up for it with lots of joy for life.  They are weaker than other races, but make up for it by being smart and very nimble.  Halflings may be Warriors, Mages, or Rogues.",
    { historyIndex: 10 },
);

addHeroKind('GNOME', "Gnome", [-1,  2,  0,  2,  1, -2],
    '1d40+50', '42~3', '90~6', // ], ['39~3', '75~3'],
    { disarm: 10,  search: 6,  stealth: 3, perception: -3, toHit: -8,  toHitBows: 12,  magic: 12 },
    7,  { infravision: 4 }, 125, ['WARRIOR', 'MAGE', 'ROGUE', 'PRIEST'],
    "Gnomes come from the forest where their small size allows them to hide from foes.  They are smart, nimble, and sturdy.  They are also slightly weak and tend to offend others.  Gnomes may be Warriors, Mages, Priests, or Rogues.",
    { historyIndex: 13 },
);

addHeroKind('DWARF', "Dwarf", [2, -3,  1, -2,  2, -3],
    '1d15+35', '48~3', '150~10', // ], ['46~3', '120~10'],
    { disarm: 2,  search: 7,  stealth: -1, perception: 0, toHit: 15,  toHitBows: 0,  magic: 9 },
    9,  { infravision: 5 }, 120, ['WARRIOR', 'PRIEST'],
    "Dwarves come from the mountains and have small, stout physiques.  They are strong, sturdy, and wise, but are not very clever, agile, or persuasive.  Dwarves can be either Warriors or Priests.",
    { historyIndex: 16 },
);

addHeroKind('HALF_ORC', "Half-Orc", [2, -1,  0,  0,  1, -4],
    '1d4+11', '66~1', '150~5', // ], ['62~1', '120~5'],
    { disarm: -3,  search: 0,  stealth: -1, perception: 3, toHit: 12,  toHitBows: -5,  magic: -3 },
    10,  { infravision: 3 }, 110, ['WARRIOR', 'PRIEST', 'ROGUE'],
    "Half-Orcs arise from the hills where human and orc tribes sometimes allow marriages.  They are strong, but lack social skills.  Half-Orcs may be Warriors, Priests, or Rogues.",
    { historyIndex: 19 },
);

addHeroKind('HALF_TROLL', "Half-Troll", [4, -4, -2, -4,  3, -6],
    '1d10+20', '96~10', '255~50', // ], ['84~8', '225~40'],
    { disarm: -5,  search: -1,  stealth: -2, perception: 5, toHit: 20,  toHitBows: -10,  magic: -8 },
    12,  { infravision: 3 }, 120, ['WARRIOR', 'PRIEST'],
    "Half-Trolls are a rare occurrance in the world.  They are very strong and study, but are dim-witted, clumsy and have a very offensive demeanor.  Half-Trolls do not have access to the academies available in towns and are limited to being Warriors or Priests.",
    { historyIndex: 22 },
);
