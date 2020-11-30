


// Prints the following information on the screen. -JWT-
function printCharacterInformation(buffer, actor, yOffset=0) {

  const x = 11;
  const y = 2 + yOffset;
  const width = 14;

  buffer.plotText(x, y,     "Name        :");
  buffer.plotText(x, y + 1, "Kind        :");
  buffer.plotText(x, y + 2, "Role        :");
  buffer.plotText(x, y + 3, "Title       :");

  buffer.plotText(x + width, y, actor.name);
  buffer.plotText(x + width, y + 1, actor.kind.name);
  buffer.plotText(x + width, y + 2, actor.role.name);
  buffer.plotText(x + width, y + 3, actor.role.titles[actor.current.level]);
}


const stat_headers = {
  str: "Strength     : ",
  int: "Intelligence : ",
  wis: "Wisdom       : ",
  dex: "Dexterity    : ",
  con: "Constitution : ",
  chr: "Charisma     : "
};

function statColor(v) {
  if (v < 9) return GW.colors.red;
  if (v < 15) return GW.colors.white;
  if (v < 19) return GW.colors.dark_green;
  if (v < 22) return GW.colors.green;
  return GW.colors.light_green;
}


// Prints the following information on the screen. -JWT-
function printCharacterStats(buffer, actor, yOffset=0) {

    const x = 65;
    let buf = '';
    let statBuf = '';
    const y = 2 + yOffset;

    const keys = Object.keys(stat_headers);
    for (let i = 0; i < keys.length; ++i) {
      const attr = keys[i];
      buffer.plotText(x, y + i, stat_headers[attr]);
      const c = statColor(actor.current[attr]);
      buffer.plotText(x + 15, y + i, c, actor.current[attr]);

      if (actor.max[attr] > actor.current[attr]) {
          buffer.plotText(x + 23, y + i, ` [${actor.max[attr]}]`, teal);
      }
    }
}

// Returns a rating of x depending on y -JWT-
function printStatRating(b, a, x, y, buffer) {
  let text = null;
  let color = GW.colors.white;
  switch ( Math.floor(a / b) ) {
      case -3:
      case -2:
      case -1:
          text = "Very Bad";
          color = GW.colors.red;
          break;
      case 0:
      case 1:
          text = "Bad";
          color = GW.colors.orange;
          break;
      case 2:
          text = "Poor";
          color = GW.colors.yellow;
          break;
      case 3:
      case 4:
          text = "Fair";
          break;
      case 5:
          text = "Good";
          color = GW.colors.dark_green;
          break;
      case 6:
          text = "Very Good";
          color = GW.colors.green;
          break;
      case 7:
      case 8:
          text = "Excellent";
          color = GW.colors.light_green;
          break;
      default:
          text = "Superb";
          color = GW.colors.lighter_green;
  }

  buffer.plotText(x, y, text, color);
}

function toHeightString(v) {
  const feet = Math.floor(v/12);
  const inches = v % 12;
  return `${feet}'${inches}"`;
}

function printCharacterVitalStatistics(buffer, actor, yOffset) {
    const x = 39;
    const y = 2 + yOffset;

    buffer.plotText(x, y,     "Age          : " + actor.data.age);
    buffer.plotText(x, y + 1, "Height       : " + toHeightString(actor.data.height));
    buffer.applyText(x, y + 2,"Weight       : §weight§ lbs", actor.data );
    buffer.plotText(x, y + 3, "Gender       : " + (actor.isFemale() ? 'Female' : 'Male'));
    buffer.plotText(x, y + 4, "Gold         : " + actor.current.gold);
}

function bonusColor(b) {
  if (b < 0) return 'ΩredΩ';
  if (b == 0) return 'ΩwhiteΩ';
  return 'ΩgreenΩ';
}

// Prints the following information on the screen. -JWT-
function printCharacterLevelExperience(buffer, actor, yOffset) {

    const y = 9 + yOffset;
    const x1 = 11;
    const x2 = 39;
    const x3 = 63;

    buffer.plotText(x1, y,     "+ To Hit    : " + bonusColor(actor.display.toHit) +    actor.display.toHit);
    buffer.plotText(x1, y + 1, "+ To Damage : " + bonusColor(actor.display.toDamage) + actor.display.toDamage);
    buffer.plotText(x1, y + 2, "+ To AC     : " + bonusColor(actor.display.toArmor) +  actor.display.toArmor);
    buffer.plotText(x1, y + 3, "  Total AC  : " + actor.display.armor);

    buffer.plotText(x2, y,     "Level       : " + actor.current.level);
    buffer.plotText(x2, y + 1, "Experience  : " + actor.current.xp);
    buffer.plotText(x2, y + 2, "Max Exp     : " + actor.max.xp);

    if (actor.current.level >= HERO_MAX_LEVEL) {
      buffer.plotText(x2, y + 3, "Exp to Adv. : *********");
    } else {
      const toAdvance = Math.floor(HERO_XP_TO_ADVANCE[actor.current.level - 1] * actor.data.xpFactor / 100);
      buffer.plotText(x2, y + 3, "Exp to Adv. : " + toAdvance);
    }

    buffer.plotText(x3, y,     "Max Health     : ΩgreenΩ" + actor.max.health);
    buffer.plotText(x3, y + 1, "Cur Health     : " + actor.current.health);
    buffer.plotText(x3, y + 2, "Max Mana       : " + (actor.max.mana ? 'ΩgreenΩ' : '') + actor.max.mana);
    buffer.plotText(x3, y + 3, "Cur Mana       : " + actor.current.mana);
}

// Prints ratings on certain abilities -RAK-
function printCharacterAbilities(buffer, actor, yOffset) {

    const kind = actor.kind;
    const role = actor.role;
    const skillPerLevel = role.skillPerLevel;

    const xbth = actor.skills.toHit + actor.current.toHit * BTH_PER_PLUS_TO_HIT_ADJUST + (skillPerLevel.toHit * actor.current.level);
    const xbthb = actor.skills.toHitBows + actor.current.toHit * BTH_PER_PLUS_TO_HIT_ADJUST + (skillPerLevel.toHitBows * actor.current.level);

    // this results in a range from 0 to 29
    let xfos = 40 - (actor.skills.perception || 0);
    if (xfos < 0) {
        xfos = 0;
    }

    let xsrh = actor.skills.search;

    // this results in a range from 0 to 9
    let xstl = actor.skills.stealth + 1;
    let xdis = actor.skills.disarm + 2 * kind.disarmBonus(actor) + kind.intBonus(actor) + Math.floor(skillPerLevel.disarm * actor.current.level / 3);
    let xsave = actor.skills.magic + kind.wisBonus(actor) + Math.floor(skillPerLevel.magic * actor.current.level / 3);
    let xdev = actor.skills.magic + kind.intBonus(actor) + Math.floor(skillPerLevel.devices * actor.current.level / 3);

    const y = 14 + yOffset;
    const x1 = 11;
    const x2 = 39;
    const x3 = 66;

    buffer.plotText(x1, y, "Fighting    :");
    printStatRating(12, xbth,  x1 + 14, y, buffer);
    buffer.plotText(x1, y + 1, "Bows/Throw  :");
    printStatRating(12, xbthb,  x1 + 14, y + 1, buffer);
    buffer.plotText(x1, y + 2, "Saving Throw:");
    printStatRating(6, xsave,  x1 + 14, y + 2, buffer);

    buffer.plotText(x2, y, "Stealth     :");
    printStatRating(1, xstl,  x2 + 14, y, buffer);
    buffer.plotText(x2, y + 1, "Disarming   :");
    printStatRating(8, xdis,  x2 + 14, y + 1, buffer);
    buffer.plotText(x2, y + 2, "Magic Device:");
    printStatRating(6, xdev,  x2 + 14, y + 2, buffer);

    buffer.plotText(x3, y, "Perception  :");
    printStatRating(3, xfos,  x3 + 14, y, buffer);
    buffer.plotText(x3, y + 1, "Searching   :");
    printStatRating(6, xsrh,  x3 + 14, y + 1, buffer);
    buffer.plotText(x3, y + 2, "Infra-Vision:");
    const fg = (actor.abilities.infravision > 0) ? 'green' : 'white';
    const xinfra = GW.text.apply("§v%d§ feet", { v: actor.abilities.infravision * 10 });
    buffer.plotText(x3 + 14, y + 2, xinfra, fg);
}

function printCharacterBackground(buffer, actor, yOffset) {
  const y = 18 + yOffset;
  buffer.wrapText(11, y, 78, actor.history, GW.colors.amber);
}


// Used to display the character on the screen. -RAK-
function printCharacter(buffer, actor, yOffset) {
  yOffset = yOffset || 0;
  // buffer.blackOut();

  printCharacterInformation(buffer, actor, yOffset);
  printCharacterStats(buffer, actor, yOffset);
  printCharacterVitalStatistics(buffer, actor, yOffset);
  printCharacterLevelExperience(buffer, actor, yOffset);
  printCharacterAbilities(buffer, actor, yOffset);
  printCharacterBackground(buffer, actor, yOffset);

  return 22 + yOffset;
}

async function showCharacter(ev) {
  const buffer = GW.ui.startDialog();

  buffer.blackOut();

  const lastY = printCharacter(buffer, PLAYER, 3);

  let prompt = "ΩyellowΩYour character";
  let x = Math.round((buffer.width - GW.text.length(prompt)) / 2);
  buffer.plotText(x, 2, prompt);

  prompt = 'Press [Escape] to go back.';
  x = Math.round((buffer.width - prompt.length) / 2);
  buffer.plotText(x, lastY + 2, prompt);

  GW.ui.draw();

  await GW.io.nextKeyPress(-1, (ev) => ev.key === 'Escape');

  GW.ui.finishDialog();
  return true;
}
