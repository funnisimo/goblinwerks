
let canvas = null;

GW.random.seed(12345);



async function showHelp() {
	const buf = GW.ui.startDialog();

	let y = 2;
	buf.plotText(20, y++, '%FGoblinWerks Dungeon Dig Example', 'green');
	y++;
	y = buf.wrapText(15, y, 50, 'Explore the caves.');
	y++;
	buf.plotText(15, y, '%Fdir   ', 'yellow');
	y = buf.wrapText(21, y, 42, ': Pressing an arrow key moves the player in that direction.', 'white', null, 2);
	buf.plotText(15, y, '%Fspace ', 'yellow');
	y = buf.wrapText(21, y, 42, ': Wait a short time.', 'white', null, 2);
	buf.plotText(15, y, '%F?', 'yellow');
	y = buf.wrapText(21, y, 42, ': Show this screen.', 'lighter_gray');

	buf.fillRect(14, 1, 52, y, null, null, 'black' );

	GW.ui.draw();
	await GW.io.nextKeyPress(-1);
	GW.ui.finishDialog();
}


async function forceStairs(ev) {
	const isUp = (ev.key == '<');

	const mapId = GW.data.map.id + (isUp ? 1 : -1);

	if (isUp && GW.data.map.id == 0) {
		GW.message.add(GW.colors.teal, 'At start of dungeon.');
		return false;
	}
	else if (isUp) {
		GW.message.add('You ascend to level %d.', Math.abs(mapId));
	}
	else {
		GW.message.add('You descend to level %d.', Math.abs(mapId));
	}

	const newMap = await GW.game.getMap(mapId);

  GW.game.startMap(newMap, isUp ? 'down' : 'up');

  GW.ui.requestUpdate();
  PLAYER.endTurn();
  return true;
}

// start the environment
function start() {
	const canvas = GW.ui.start({ width: 80, height: 36, div: 'game', messages: -5, cursor: true, flavor: true });
	GW.io.setKeymap({
		dir: 'movePlayer', space: 'rest',
		'>': forceStairs, '<': forceStairs,
		'?': showHelp
	});

	GW.message.add('%FWelcome to the Dungeon!\n%FSomewhere at the bottom of this labrynth is a portal that will take you back to your home town.  Find it or perish!\n%FPress <?> for help.', 'yellow', 'purple', null);
	GW.game.start({ player: PLAYER, buildMap: designNewLevel, fov: true });
}

window.onload = start;
