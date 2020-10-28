
GW.random.seed(12345);

GW.config.AI_RANGE = 7;
GW.config.AI_IDLE = 0.4;
GW.config.PC_SIGHT = 8;
GW.config.LAST_LEVEL = 8;

GW.config.POTION_HP = 10;
GW.config.POTION_MANA = 10;

GW.config.COMBAT_MODIFIER = 0.4;
GW.config.HOSTILE_CHANCE = 0.7;

GW.config.BRAMBLE_CHANCE = 0.5;
GW.config.LEVEL_HP = 4;

GW.config.REGEN_HP = 0.05;
GW.config.REGEN_MANA = 0.1;


const PLAYER = GW.make.player({
		sprite: GW.make.sprite('@', 'white'),
		name: 'you',
		speed: 120,
    stats: { health: 20, mana: 50 },

    sidebar(entry, y, dim, highlight, buf) {
      const player = entry.entity;
      y = GW.sidebar.addText(buf, y, 'Tower Level ' + GW.data.map.id, null, null, false, false);
      y = GW.sidebar.addText(buf, y, '==============================', null, null, false, false);

    	y = GW.sidebar.addName(entry, y, dim, highlight, buf);
      y = GW.sidebar.addHealthBar(entry, y, dim, highlight, buf);
      y = GW.sidebar.addManaBar(entry, y, dim, highlight, buf);

      let melee = 'Fists [1]';
      if (player.melee) {
        melee = GW.text.capitalize(player.melee.getName({ details: true, color: !dim }));
      }
      y = GW.sidebar.addText(buf, y, 'Weapon : ' + melee, null, null, dim, highlight);

      // let ranged = 'None';
      // if (player.ranged) {
      //   ranged = GW.text.capitalize(player.ranged.getName({ details: true, color: !dim }));
      // }
      // y = GW.sidebar.addText(buf, y, 'Ranged: ' + ranged, null, null, dim, highlight);
      return y;
    },
});




async function start() {

  // TODO - Hmmmm... for some reason this makes it work, but should not be necessary
  const f = new FontFace('ted', 'url(Metrickal-Regular.otf)');
  await f.load();

  // setup the UI
	const canvas = GW.ui.start({
      div: 'game',  // use this canvas element ID
      width: 90,    // total width of canvas in cells
      height: 40,   // total height of canvas in cells
      messages: -5, // show 5 recent message lines (at the bottom)
      cursor: true, // highlight cursor in map view
      flavor: true, // show flavor for cells under cursor
      sidebar: -40, // right side, 40 wide
      wideMessages: true, // messages go full width of canvas, not just width of map
      followPlayer: true, // The player stays at the center of the map
      font: 'metrickal',
  });

  await showIntro();

  GW.io.setKeymap({
		dir: 'movePlayer', space: 'rest',
		// '>': forceStairs, '<': forceStairs,
		// '?': showHelp
	});

  await GW.game.start({ player: PLAYER, buildMap: generate, fov: false });

  console.log('DONE!');
}

window.onload = start;
