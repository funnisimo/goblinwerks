




const GENDER_DESCRIPTIONS = [
  "Males are taller and heavier than females.  This helps when bashing down doors and such.",
  "Females are not as tall and are lighter.  They start with a heavier purse of gold.",
];

const CHAR_KIND_COL = 5;
const CHAR_ROLE_COL = 25;
const CHAR_INFO_COL = 45;

// // Gets the character's gender
async function getPlayerGender(buffer) {

  let x, y;
  let highlighted = 0;

	buffer.blackOut();

	let prompt = GW.text.format("%FSelect your avatar's gender:", 'yellow');
	x = Math.floor((buffer.width - GW.text.length(prompt)) / 2);
	y = 2;
	buffer.plotText(x, y, prompt);

	prompt = 'Press [Enter] to accept, [Escape] to cancel.';
	x = Math.floor((buffer.width - prompt.length) / 2);
	y = 24;
	buffer.plotText(x, y, prompt);

  while(true) {

    y = 4;
    buffer.plotText(CHAR_KIND_COL, y, '%FA) Male', (highlighted == 0) ? 'teal' : 'white');
    buffer.plotText(CHAR_ROLE_COL, y, '%FB) Female', (highlighted == 1) ? 'teal' : 'white');

    const desc = GENDER_DESCRIPTIONS[highlighted]; // getPlayerDescription(highlighted, -1);
    buffer.wrapText(CHAR_INFO_COL, 4, 50, desc);

    GW.ui.draw();

    const ev = await GW.io.nextEvent(-1);
    if (ev.type === GW.def.KEYPRESS) {
      const key = ev.key;
      if (key === 'Escape') {
        return -1;
      }
      else if (key === 'Enter' || key === 'Return' || key == 'ArrowDown') {
        return highlighted;
      }
      else if (key === 'ArrowLeft') {
        highlighted = Math.max(0, highlighted - 1);
      }
      else if (key === 'ArrowRight') {
        highlighted = Math.min(1, highlighted + 1);
      }
    }
    else if (ev.type === GW.def.MOUSEMOVE) {
      if (ev.y === y && ev.x < CHAR_INFO_COL) {
        highlighted = (ev.x < CHAR_ROLE_COL) ? 0 : 1;
      }
    }
    else if (ev.type === GW.def.CLICK) {
      if (ev.y === y && ev.x < CHAR_INFO_COL) {
        return highlighted;
      }
    }
  }

}

async function getPlayerKind(buffer, genderId) {

  let x, y;
  let highlighted = 0;
  let char, buf;

	buffer.blackOut();

	let prompt = GW.text.format("%FSelect your avatar's kind:", 'yellow');
	x = Math.floor((buffer.width - GW.text.length(prompt)) / 2);
	y = 2;
	buffer.plotText(x, y, prompt);

	prompt = 'Press [Enter] to accept, [Escape] to cancel.';
	x = Math.floor((buffer.width - prompt.length) / 2);
	y = 24;
	buffer.plotText(x, y, prompt);

  const heroKinds = Object.values(HERO_KINDS);

  while(true) {

    y = 4;
    buffer.plotText(CHAR_KIND_COL, y, '%FA) Male', (genderId == 0) ? 'teal' : 'white');
    buffer.plotText(CHAR_ROLE_COL, y, '%FB) Female', (genderId == 1) ? 'teal' : 'white');

    y = 6;
    heroKinds.forEach( (r, i) => {
      char = String.fromCharCode(65 + i);
      const fg = (highlighted === i) ? 'teal' : 'white';
      buf = GW.text.format("%F%c) %s", fg, char, r.name);
      buffer.plotText(CHAR_KIND_COL, y, buf);
      ++y;
    });

    buffer.blackOutRect(CHAR_INFO_COL, 4, 50, 10);

    const desc = heroKinds[highlighted].description; // getPlayerDescription(highlighted, -1);
    buffer.wrapText(CHAR_INFO_COL, 4, 50, desc, 'white', 'black');

    GW.ui.draw();

    const ev = await GW.io.nextEvent(-1);

    if (ev.type === GW.def.KEYPRESS) {
      const key = ev.key;
      if (key === 'Escape' || key === 'ArrowLeft') {
        return null;
      }
      else if (key === 'Enter' || key === 'Return' || key == 'ArrowRight') {
        return heroKinds[highlighted].id;
      }
      else if (key === 'ArrowUp') {
        highlighted = Math.max(0, highlighted - 1);
      }
      else if (key === 'ArrowDown') {
        highlighted = Math.min(heroKinds.length - 1, highlighted + 1);
      }
    }
    else if (ev.type === GW.def.MOUSEMOVE) {
      if (ev.y >= 6 && ev.y < 6 + heroKinds.length ) {
        highlighted = ev.y - 6;
      }
    }
    else if (ev.type === GW.def.CLICK) {
      if (ev.y < 5) return -1; // clicked gender
      if (ev.y >= 6 && ev.y < 6 + heroKinds.length ) {
        return heroKinds[highlighted].id;
      }
    }
  }

  return result;
}


async function getPlayerRole(buffer, kindId, genderId) {
	kindId = kindId || 0;	// Default is human

	let x, y;
  let highlighted = 0;

  const heroKinds = Object.values(HERO_KINDS);
  const roles = Object.values(HERO_ROLES);

	buffer.blackOut();

	let prompt = GW.text.format("%FSelect your avatar's role:", 'yellow');
	x = Math.floor((buffer.width - GW.text.length(prompt)) / 2);
	y = 2;
	buffer.plotText(x, y, prompt);

	prompt = 'Press [Enter] to accept, [Escape] to cancel.';
	x = Math.floor((buffer.width - prompt.length) / 2);
	y = 24;
	buffer.plotText(x, y, prompt);

  while(true) {

    y = 4;
    buffer.plotText(CHAR_KIND_COL, y, '%FA) Male', (genderId == 0) ? 'teal' : 'white');
    buffer.plotText(CHAR_ROLE_COL, y, '%FB) Female', (genderId == 1) ? 'teal' : 'white');

    y = 6;
    heroKinds.forEach( (kind, i) => {
      char = String.fromCharCode(65 + i);
      const fg = (kind.id === kindId) ? 'green' : 'white';
      buf = GW.text.format("%F%c) %s", fg, char, kind.name);
      buffer.plotText(CHAR_KIND_COL, y, buf);
      ++y;
    });

		y = 6;
		roles.forEach( (role, i) => {
			char = String.fromCharCode(65 + i);
      const fg = (highlighted === i) ? 'teal' : 'white';
      buf = GW.text.format("%F%c) %s", fg, char, role.name);
      buffer.plotText(CHAR_ROLE_COL, y, buf);
      ++y;
		})

    buffer.blackOutRect(CHAR_INFO_COL, 4, 50, 10);

    const desc = roles[highlighted].description; // getPlayerDescription(kindId, highlighted);
    buffer.wrapText(CHAR_INFO_COL, 4, 50, desc, 'white', 'black');

    GW.ui.draw();

    const ev = await GW.io.nextEvent(-1);

    if (ev.type === GW.def.KEYPRESS) {
      const key = ev.key;
      if (key === 'Escape' || key == 'ArrowLeft') {
        return null;
      }
      else if (key === 'Enter' || key === 'Return' || key == 'ArrowRight') {
        return roles[highlighted].id;
      }
      else if (key === 'ArrowUp') {
        highlighted = Math.max(0, highlighted - 1);
      }
      else if (key === 'ArrowDown') {
        highlighted = Math.min(roles.length - 1, highlighted + 1);
      }
    }
    else if (ev.type === GW.def.MOUSEMOVE) {
      if (ev.x >= CHAR_ROLE_COL && ev.x <= CHAR_INFO_COL) {
        if (ev.y >= 6 && ev.y < 6 + roles.length) {
          highlighted = ev.y - 6;
        }
      }
    }
    else if (ev.type === GW.def.CLICK) {
      if (ev.y < 5) return null;
      if (ev.x < CHAR_ROLE_COL) return null;

      if (ev.x >= CHAR_ROLE_COL && ev.x <= CHAR_INFO_COL) {
        if (ev.y >= 6 && ev.y < 6 + roles.length) {
          return roles[highlighted].id;
        }
      }
    }

  }
}




async function rollPlayerStats(buffer, kindId, roleId, genderId) {

  while(true) {

    const player = GW.make.actor(kindId, { role: roleId, female: (genderId == 1), male: (genderId == 0) });

    buffer.blackOut();

    const lastY = printCharacter(buffer, player, 3);

    let prompt = GW.text.format("%FReview your character", 'yellow');
    let x = Math.round((buffer.width - GW.text.length(prompt)) / 2);
    buffer.plotText(x, 2, prompt);

    prompt = 'Press [Space] to reroll, [Enter] to accept, [Escape] to go back.';
    x = Math.round((buffer.width - prompt.length) / 2);
    buffer.plotText(x, lastY + 2, prompt);

    GW.ui.draw();

    let reroll = false;
    do {
      const ev = await GW.io.nextKeyOrClick(-1);
      if (ev.type === GW.def.KEYPRESS) {
        const key = ev.key;
        if (key === 'Escape' || key == 'ArrowLeft') {
          return false;
        }
        else if (key === 'Enter' || key === 'Return' || key == 'ArrowRight') {
          return player;
        }
        // else regenerate...
        reroll = player;
      }
      else if (ev.type === GW.def.CLICK) {
        // regenerate...
        reroll = true;
      }
    }
    while(!reroll)
  }

}


async function getPlayerName(buffer, player) {

  let x, y;
  let highlighted = 0;

  buffer.blackOut();
  const lastY = printCharacter(buffer, player, 3);

  prompt = GW.text.format("%FWhat is your character's name?", 'yellow');
  x = Math.round((buffer.width - GW.text.length(prompt)) / 2);
  buffer.plotText(x, 2, prompt);

  buffer.fillRect(25, 5, 13, 1, ' ', 'gray', 'gray');

  prompt = "Press [Enter] to accept, [Escape] to go back.";
  x = Math.round((buffer.width - prompt.length) / 2);
  buffer.plotText(x, lastY + 2, prompt);

  GW.ui.draw();

  const name = await GW.ui.getInputAt(25, 5, 13);

  if (name && name.length) {
    player.name = name;
    return true;
  }
  return false;
}


async function createPlayer() {

	let done = false;
	let kindId = null;
	let roleId = null;
  let player = null;
  let genderId = -1;

  const buffer = GW.ui.startDialog();

	while(!done) {

    if (genderId < 0) {
      genderId = await getPlayerGender(buffer);
      if (genderId < 0) {
        done = true;
      }
    }
    else if (!kindId) {
			kindId = await getPlayerKind(buffer, genderId);
			if (!kindId) {
        genderId = -1;
			}
      console.log('You chose:', kindId);
		}
		else if (!roleId) {
			roleId = await getPlayerRole(buffer, kindId, genderId);
			if (!roleId) {
				kindId = null;
			}
      console.log('You chose:', roleId);
		}
		else if (!player) {	// Roll
			player = await rollPlayerStats(buffer, kindId, roleId, genderId);
			if (!player) {
				roleId = null;	// go back
			}
		}
		else {
			done = await getPlayerName(buffer, player);
			if (!done) {
				player = null;
			}
		}
	}

  GW.ui.finishDialog();

  // theItem = GW.make.item('RATION');
  // theItem = addItemToPack(theItem);
  //
  // theItem = GW.make.item('DAGGER');
  // theItem.enchant1 = theItem.enchant2 = 0;
  // theItem.flags &= ~(ITEM_CURSED | ITEM_RUNIC);
  // identify(theItem);
  // theItem = addItemToPack(theItem);
  // equipItem(theItem, false);
  //
  // theItem = GW.make.item('DART');
  // theItem.enchant1 = theItem.enchant2 = 0;
  // theItem.quantity = 15;
  // theItem.flags &= ~(ITEM_CURSED | ITEM_RUNIC);
  // identify(theItem);
  // theItem = addItemToPack(theItem);
  //
  // theItem = GW.make.item('LEATHER_ARMOR');
  // theItem.enchant1 = 0;
  // theItem.flags &= ~(ITEM_CURSED | ITEM_RUNIC);
  // identify(theItem);
  // theItem = addItemToPack(theItem);
  // equipItem(theItem, false);
  // PLAYER.status[STATUS_DONNING] = 0;
  //
  // theItem = GW.make.item('BOOK_MAGE_I');
  // theItem = addItemToPack(theItem);
  //
  // theItem = GW.make.item('BOOK_MAGE_II');
  // theItem = addItemToPack(theItem);
  //
  // theItem = GW.make.item('BOOK_MAGE_III');
  // theItem = addItemToPack(theItem);
  //
  // theItem = GW.make.item('BOOK_MAGE_IV');
  // theItem = addItemToPack(theItem);
  //
  // theItem = GW.make.item('BOOK_PRAYER_I');
  // theItem = addItemToPack(theItem);
  //
  // theItem = GW.make.item('BOOK_PRAYER_II');
  // theItem = addItemToPack(theItem);
  //
  // theItem = GW.make.item('BOOK_PRAYER_III');
  // theItem = addItemToPack(theItem);
  //
  // theItem = GW.make.item('BOOK_PRAYER_IV');
  // theItem = addItemToPack(theItem);

	console.log('HERE IS YOUR PLAYER:', player);
  return player;
}
