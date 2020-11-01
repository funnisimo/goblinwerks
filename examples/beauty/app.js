
GW.random.seed(12345);

GW.config.AI_RANGE = 7;
GW.config.AI_IDLE_CHANCE = 40;
GW.config.PC_SIGHT = 8;
GW.config.LAST_LEVEL = 8;

GW.config.POTION_HP = 10;
GW.config.POTION_MANA = 10;

GW.config.COMBAT_MODIFIER = 40;
GW.config.HOSTILE_CHANCE = 70;

GW.config.BRAMBLE_CHANCE = 50;
GW.config.LEVEL_HP = 4;

GW.config.REGEN_HP = 0.05;
GW.config.REGEN_MANA = 0.1;

GW.config.ATTACK_1 = "a1";
GW.config.ATTACK_2 = "a2";
GW.config.MAGIC_1 = "m1";
GW.config.MAGIC_2 = "m2";

GW.config.COMBAT_COLORS = {
	[GW.config.ATTACK_1]: "#0f0",
	[GW.config.ATTACK_2]: "#f00",
	[GW.config.MAGIC_1]: "#00f",
	[GW.config.MAGIC_2]: "#ff3"
};

const COMBAT_BONUS_DISPLAY = {
	[GW.config.ATTACK_1]: GW.text.format('%R+#%R', GW.config.COMBAT_COLORS[GW.config.ATTACK_1], null),
	[GW.config.ATTACK_2]: GW.text.format('%R+#%R', GW.config.COMBAT_COLORS[GW.config.ATTACK_2], null),
	[GW.config.MAGIC_1]: GW.text.format('%R+#%R', GW.config.COMBAT_COLORS[GW.config.MAGIC_1], null),
	[GW.config.MAGIC_2]: GW.text.format('%R+#%R', GW.config.COMBAT_COLORS[GW.config.MAGIC_2], null)
};


var PLAYER = null;

function resetPlayer() {
  const p = GW.make.player({
		sprite: GW.make.sprite('@', 'white'),
		name: 'you',
		speed: 120,
    stats: { health: 20, mana: 50, gold: 0 },

    sidebar(entry, y, dim, highlight, buf) {
      const player = entry.entity;
      y = GW.sidebar.addText(buf, y, 'Tower Level ' + GW.data.map.id);
      y = GW.sidebar.addText(buf, y, '==============================');

    	y = GW.sidebar.addName(entry, y, dim, highlight, buf);
      y = GW.sidebar.addHealthBar(entry, y, dim, highlight, buf);
      y = GW.sidebar.addManaBar(entry, y, dim, highlight, buf);

      const gold = player.current.gold || 0;
      y = GW.sidebar.addText(buf, y, 'Gold   : ' + gold, 'gold', null, { dim, highlight });

      let melee = 'Fists [1]';
      if (player.slots.melee) {
        melee = GW.text.capitalize(player.slots.melee.getName({ details: true, color: !dim }));
      }
      y = GW.sidebar.addText(buf, y, 'Weapon : ' + melee, null, null, { dim, highlight, indent: 9 });

      if (player.slots.helmet) {
        const helmet = GW.text.capitalize(player.slots.helmet.getName({ details: true, color: !dim }));
        y = GW.sidebar.addText(buf, y, 'Helmet : ' + helmet, null, null, { dim, highlight, indent: 9 });
      }
      if (player.slots.armor) {
        const armor = GW.text.capitalize(player.slots.armor.getName({ details: true, color: !dim }));
        y = GW.sidebar.addText(buf, y, 'Armor  : ' + armor, null, null, { dim, highlight, indent: 9 });
      }
      if (player.slots.shield) {
        const shield = GW.text.capitalize(player.slots.shield.getName({ details: true, color: !dim }));
        y = GW.sidebar.addText(buf, y, 'Shield : ' + shield, null, null, { dim, highlight, indent: 9 });
      }

      // let ranged = 'None';
      // if (player.ranged) {
      //   ranged = GW.text.capitalize(player.ranged.getName({ details: true, color: !dim }));
      // }
      // y = GW.sidebar.addText(buf, y, 'Ranged: ' + ranged, null, null, { dim, highlight, indent: 9 });
      return y;
    },
  });
  return p;
}

async function restartGame() {
  if (await GW.ui.confirm('Restart the game.  Are you sure?')) {
    GW.data.gameHasEnded = true;
    GW.data.running = false;
  }
}



async function start() {

  // TODO - Hmmmm... for some reason this makes it work, but should not be necessary
  const f = new FontFace('ted', 'url(Metrickal-Regular.otf)');
  await f.load();

  // setup the UI
	const canvas = GW.ui.start({
      div: 'game',  // use this canvas element ID
      width: 90,    // total width of canvas in cells
      height: 43,   // total height of canvas in cells
      messages: -8, // show 5 recent message lines (at the bottom)
      cursor: true, // highlight cursor in map view
      flavor: true, // show flavor for cells under cursor
      sidebar: -40, // right side, 40 wide
      wideMessages: true, // messages go full width of canvas, not just width of map
      followPlayer: true, // The player stays at the center of the map
      font: 'metrickal',
  });

  GW.io.setKeymap({
		dir: 'movePlayer', space: 'rest',
    'R': restartGame,
		// '>': forceStairs, '<': forceStairs,
		// '?': showHelp
	});

  while(true) {
    GW.ui.canvas.buffer.blackOut();
    GW.ui.canvas.draw();
    await showIntro();
    PLAYER = resetPlayer();
    await GW.game.start({ player: PLAYER, buildMap: generate, fov: true, inventory: false });
    await GW.ui.fadeTo('black', 500);
  }

  console.log('DONE!');
}

window.onload = start;
