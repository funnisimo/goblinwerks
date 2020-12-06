
let canvas = null;

GW.random.seed(12345);

GW.tiles.WALL.sprite.bg = GW.make.color(50,50,50,10);
GW.tiles.WALL.sprite.fg = GW.make.color(20,20,20,5);
// GW.tiles.WALL.sprite.ch = ' ';

var PLAYER = null;

async function showHelp() {
	const buf = GW.ui.startDialog();

	let y = 2;
	buf.drawText(20, y++, 'GoblinWerks Dungeon Dig Example', 'green');
	y++;
	y = buf.wrapText(15, y, 50, 'Explore the caves.');
	y++;
	buf.drawText(15, y, 'dir   ', 'yellow');
	y = buf.wrapText(21, y, 42, ': Pressing an arrow key moves the player in that direction.', 'white', null, 2);
	buf.drawText(15, y, 'space ', 'yellow');
	y = buf.wrapText(21, y, 42, ': Wait a short time.', 'white', null, 2);
	buf.drawText(15, y, '?', 'yellow');
	y = buf.wrapText(21, y, 42, ': Show this screen.', 'lighter_gray');

	buf.fillRect(14, 1, 52, y, null, null, 'black' );

	GW.ui.draw();
	await GW.io.nextKeyPress(-1);
	GW.ui.finishDialog();
}

GW.message.addKind('LEVEL_START', 'ΩtealΩAt start of dungeon.');
GW.message.addKind('LEVEL_ASCEND', '§you§ §ascend§ to level §level§.');
GW.message.addKind('LEVEL_DESCEND', '§you§ §descend§ to level §level§.');

async function forceStairs(ev) {
	const isUp = (ev.key == '<');

	const mapId = GW.data.map.id + (isUp ? 1 : -1);

	if (isUp && GW.data.map.id == 0) {
		GW.message.add('LEVEL_START', { actor: PLAYER, level: 0});
		return false;
	}
	else if (isUp) {
		GW.message.add('LEVEL_ASCEND', { actor: PLAYER, level: Math.abs(mapId) });
	}
	else {
		GW.message.add('LEVEL_DESCEND', { actor: PLAYER, level: Math.abs(mapId) });
	}

	const newMap = await GW.game.getMap(mapId);

  GW.game.startMap(newMap, isUp ? 'down' : 'up');

  GW.ui.requestUpdate();
  PLAYER.endTurn();
  return true;
}

GW.message.addKind('WELCOME', 'ΩyellowΩWelcome to Town!∆\nΩdark_purpleΩVisit our shops to equip yourself for a journey into the ΩgreenΩDungeons of Moria∆.  Once you are prepared, enter the dungeon and seek the Ωdark_redΩBalrog∆.  Destroy him to free us all!∆\nPress <?> for help.');

// start the environment
async function start() {
	const canvas = GW.ui.start({ width: 100, height: 38, sidebar: 20, div: 'game', messages: 5, wideMessages: false, cursor: true, flavor: true });
	GW.io.setKeymap({
		dir: 'movePlayer', space: 'rest',
    '@': showCharacter,
		'>': forceStairs, '<': forceStairs,
		'?': showHelp
	});

  let running = true;
  while(running) {
    const result = await titleMenu({ title: UMORIA_TITLE, version: UMORIA_VERSION });
    console.log('You chose:', result);

    if (result < 3) {
      if (result == 0) {
        PLAYER = GW.make.actor('HUMAN', { role: 'WARRIOR', name: 'Hero' });
      }
      else {
        PLAYER = await createPlayer();
      }

      if (PLAYER) {
        GW.message.add('WELCOME');
      	await GW.game.start({ player: PLAYER, buildMap: designNewLevel, fov: true });
      }
    }
    else if (result == 3) {
      await showStory();
    }
    else if (result == 4) {
      await showAbout();
    }
  }
}

window.onload = start;
