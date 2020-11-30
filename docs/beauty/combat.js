
let SEEN_INTRO = false;

const AMOUNTS = ["slightly", "moderately", "severely", "critically"].reverse();


// returns whether or not the defender died
async function doAttack(attacker, defender, power, isMagic, ctx) {
	if (isMagic) { // check mana
		if (!attacker.current.mana) {
			GW.message.addCombat("§attacker§ §do§ not have enough mana to attack with magic.", { attacker });
			return;
		}
    else if (attacker.current.mana < power) {
      power = attacker.current.mana;
    }
		attacker.adjustStat("mana", -power);
	}

	let attack = attacker.current.attack;
	let defense = defender.current.defense;
	let damage = attack + power - defense;
	damage = Math.max(1, damage);

  let msg;
  if (isMagic) {
    ctx.msg = GW.text.apply('§the attacker§ §cast§ a spell at §the defender§ for ΩredΩ§damage§∆ damage', { attacker, defender, damage: Math.round(damage) });
  }
  else {
    ctx.msg = GW.text.apply('§the attacker§ §hit§ §the defender§ for ΩredΩ§damage§∆ damage', { attacker, defender, damage: Math.round(damage) });
  }

  await GW.combat.applyDamage(attacker, defender, { damage, msg }, ctx);

  return defender.isDead();
}


GW.config.ATTACK_1 = 1;
GW.config.ATTACK_2 = 2;
GW.config.MAGIC_1 = 3;
GW.config.MAGIC_2 = 4;

GW.config.COMBAT_COLORS = [
  GW.colors.black,
	GW.make.color("#0f0"),
	GW.make.color("#f00"),
	GW.make.color("#00f"),
	GW.make.color("orange")
];

const COMBAT_BONUS_DISPLAY = [
  '',
	`+Ω${GW.config.COMBAT_COLORS[GW.config.ATTACK_1]}Ω#∆`,
	`+Ω${GW.config.COMBAT_COLORS[GW.config.ATTACK_2]}Ω#∆`,
	`+Ω${GW.config.COMBAT_COLORS[GW.config.MAGIC_1]}Ω#∆`,
	`+Ω${GW.config.COMBAT_COLORS[GW.config.MAGIC_2]}Ω#∆`,
];


const COMBAT_BOARD = GW.make.grid(6,6); // , () => GW.random.number(4) + 1 );
const COMBAT_SELECTED = GW.make.grid(6,6);
const COMBAT_CURSOR = [0,0];
let COMBAT_COUNT = 0;

function drawBoard(buffer, x, y, highlight=true) {

  COMBAT_SELECTED.copy(COMBAT_BOARD);
  let selected = 0;
  COMBAT_COUNT = 0;
  if (COMBAT_CURSOR[0] >= 0) {
    selected = COMBAT_BOARD[COMBAT_CURSOR[0]][COMBAT_CURSOR[1]];
    if (selected) {
      GW.grid.floodFill(COMBAT_SELECTED, COMBAT_CURSOR[0], COMBAT_CURSOR[1], (v, i, j) => (v === selected), (v, i, j) => {
        ++COMBAT_COUNT;
        return 0;
      });
    }
  }

  for(let i = 0; i < 6; ++i) {
    for(let j = 0; j < 6; ++j) {
      const v = COMBAT_BOARD[i][j];
      let fg = GW.config.COMBAT_COLORS[v];
      let bg = GW.colors.darkest_gray;

      if (highlight) {
        if (COMBAT_SELECTED[i][j] == 0) {
          bg = fg;
          fg = GW.colors.black;
        }
        if (COMBAT_CURSOR[0] == i && COMBAT_CURSOR[1] == j && v) {
          fg = GW.colors.white;
        }
      }
      buffer.plotChar(x + 5 + i*2, y + j, '#', fg, bg);
    }
    // buffer.plotText(x+5, y + i, '# # # # # #', fy == i ? 'light_blue' : 'dark_blue');
  }

  if (COMBAT_COUNT < 3) {
    GW.flavor.setText('Not enough connected squares for attack.  Find a larger block.');
    selected = 0;
  }

  if (selected == 1) {
    buffer.plotText(x, y+7,  'ΩgreenΩ#ΩgoldΩ You - Melee Attack');
    GW.flavor.setText('Perform a melee attack.');
  }
  else {
    buffer.plotText(x, y+7,  'Ωdark_greenΩ#ΩgrayΩ You - Melee Attack');
  }

  if (selected == 3) {
    buffer.plotText(x, y+8,  'ΩblueΩ#ΩgoldΩ You - Magic Attack');
    GW.flavor.setText('Perform a magic attack.');
  }
  else {
    buffer.plotText(x, y+8,  'Ωdark_blueΩ#ΩgrayΩ You - Magic Attack');
  }

  if (selected == 2) {
    buffer.plotText(x, y+10, 'ΩredΩ#ΩgoldΩ Enemy - Melee Attack');
    GW.flavor.setText('The enemy performs a melee attack.');
  }
  else {
    buffer.plotText(x, y+10, 'Ωdark_redΩ#ΩgrayΩ Enemy - Melee Attack');
  }

  if (selected == 4) {
    buffer.plotText(x, y+11, 'ΩorangeΩ#ΩgoldΩ Enemy - Magic Attack');
    GW.flavor.setText('The enemy performs a magic attack.');
  }
  else {
    buffer.plotText(x, y+11, 'Ωdark_orangeΩ#ΩgrayΩ Enemy - Magic Attack');
  }

}

function boardIsComplete() {
  const count = COMBAT_BOARD.count(0);
  return count == 0;
}

function boardHasMove() {
  for(let x = 0; x < 6; ++x) {
    for(let y = 0; y < 6; ++y) {
      COMBAT_SELECTED.copy(COMBAT_BOARD);
      let selected = COMBAT_SELECTED[x][y];
      if (selected) {
        let count = GW.grid.floodFill(COMBAT_SELECTED, x, y, selected, 0);
        if (count > 2) return true;
      }
    }
  }
  return false;
}

function fillBoard() {
  const player = GW.data.player;

  for(let x = 0; x < 6; ++x) {
    for(let y = 5; y > 0; --y) {
      if (COMBAT_BOARD[x][y] == 0) {
        COMBAT_BOARD[x][y] = COMBAT_BOARD[x][y-1];
        COMBAT_BOARD[x][y-1] = 0;
      }
    }
    if (COMBAT_BOARD[x][0] == 0) {
      const index = GW.random.index(player.current.combatBonus);
      COMBAT_BOARD[x][0] = index;
    }
  }
}


async function updateBoard(buffer, x, y) {

  while(!boardIsComplete()) {
    fillBoard();
    drawBoard(buffer, x, y, false);
    GW.ui.draw();
    await GW.io.pause(250);
    if (!boardHasMove()) {
      const i = GW.random.number(6);
      const j = GW.random.number(6);
      COMBAT_BOARD[i][j] = 0;
      console.log('- Board has no moves.  Removing 1 piece: ', i, j);
    }
  }

  drawBoard(buffer, x, y, true);
  GW.ui.draw();
}

function drawPlayer(buffer, x, y, width) {
  const player = GW.data.player;

  buffer.plotText(x, y, GW.text.capitalize(player.getName()));
  GW.ui.plotProgressBar(buffer, x, y + 1, width, 'Health', 'white', player.current.health / player.max.health, 'redBar');
  GW.ui.plotProgressBar(buffer, x, y + 2, width, 'Mana', 'white', player.current.mana / player.max.mana, 'blueBar');
  buffer.plotText(x, y + 4, 'Damage : ' + player.current.attack);
  buffer.plotText(x, y + 5, 'Defense: ' + player.current.defense);
  buffer.plotText(x, y + 6, 'Bonus  : ');

}


function drawOpponent(buffer, x, y, width, opponent) {
  buffer.plotText(x, y, GW.text.capitalize(opponent.getName()));

  const healthText = (opponent.current.health) ? 'Health' : 'Dead';
  GW.ui.plotProgressBar(buffer, x, y + 1, width, healthText, 'white', opponent.current.health / opponent.max.health, 'redBar');

  const manaText = (opponent.current.mana) ? 'Mana' : 'Cannot cast';
  GW.ui.plotProgressBar(buffer, x, y + 2, width, manaText, 'white', opponent.current.mana / opponent.max.mana, 'blueBar');

  buffer.plotText(x, y + 4, 'Damage : ' + opponent.current.attack);
  buffer.plotText(x, y + 5, 'Defense: ' + opponent.current.defense);
  buffer.plotText(x, y + 6, 'Danger : ' + opponent.current.danger);

}

GW.message.addKind('COMBAT_START', '$you$ $attack$ $a.target$.');

async function combat(actor, target, ctx) {
  const map = ctx.map || GW.data.map;
  const actors = actor.isPlayer() ? [target, actor] : [actor, target];

  // console.log('CUSTOM ATTACK!', actor.getName({ color: false }), target.getName({ color: false }));

  GW.message.add('COMBAT_START', { actor, target });

  const buffer = GW.ui.startDialog();

  const width = buffer.width;
  const height = GW.viewport.bounds.height;
  const x = 0;
  const y = GW.viewport.bounds.y;

  buffer.blackOutRect(x, y, width, height, 'darkest_gray');
  buffer.plotText(x + 36, y + 1, 'BATTLE OF THORNS', 'yellow');
  // buffer.plotText(x + 2, y + 3, 'Press <Enter> to exit');

  drawBoard(buffer, x + 34, y + 4);
  drawPlayer(buffer, x + 4, y + 4, 20);
  drawOpponent(buffer, x + 66, y + 4, 20, actor.isPlayer() ? target : actor);

  if (!SEEN_INTRO) {
    const help = "Combat in Sleeping Beauty happens by fighting the ΩgoldΩBattle of Thorns∆. Match sequences of 3 or more colored blocks to perform individual actions. This includes both your attacks as well as your enemy's. The larger the block, the more damage done.\n\nUse the ΩyellowΩarrow keys∆ and ΩyellowΩEnter∆ to select.\n\nNote: Certain items in your inventory can modify the frequency of colors on the game board.";

    let nextY = buffer.wrapText(x + 4, y + 21, width - 8, help);
    SEEN_INTRO = true;
  }

  function draw() {
    GW.message.draw(buffer);
    GW.flavor.draw(buffer);
    GW.ui.draw();
  }

  GW.flavor.clear();
  draw();

  let running = true;
  while(running) {

    await updateBoard(buffer, x + 34, y + 4);

    const ev = await GW.io.nextEvent(1000);
    await GW.io.dispatchEvent(ev, {
      escape() {
        running = false;  // Temporary
      },
      async enter() {
        if (COMBAT_COUNT > 2) {
          const selected = COMBAT_BOARD[COMBAT_CURSOR[0]][COMBAT_CURSOR[1]];
          const count = GW.grid.floodFill(COMBAT_BOARD, COMBAT_CURSOR[0], COMBAT_CURSOR[1], selected, 0);
          const attacker = actors[selected % 2];
          const defender = actors[(selected + 1) % 2];

          await doAttack(attacker, defender, count, selected > 2, ctx);
          drawPlayer(buffer, x + 4, y + 4, 20);
          drawOpponent(buffer, x + 66, y + 4, 20, actor.isPlayer() ? target : actor);
          draw();

          if (defender.isDead()) {
            GW.ui.prompt('Press any key to continue');
            draw();
            await GW.io.nextKeyOrClick();
            running = false;
          }
        }
      },
      dir(e) {
        if (e.dir) {
          COMBAT_CURSOR[0] = GW.utils.clamp(COMBAT_CURSOR[0] + e.dir[0], 0, 5);
          COMBAT_CURSOR[1] = GW.utils.clamp(COMBAT_CURSOR[1] + e.dir[1], 0, 5);
          drawBoard(buffer, x + 34, y + 4);
          draw();
        }
      },
      mousemove(e) {
        let fx = Math.floor(((buffer.width * e.clientX / GW.ui.canvas.pxWidth) - 38.5) / 2);
        let fy = Math.floor(buffer.height * e.clientY / GW.ui.canvas.pxHeight) - 4;
        fx = GW.utils.clamp(fx, 0, 5);
        fy = GW.utils.clamp(fy, 0, 5);
        COMBAT_CURSOR[0] = fx;
        COMBAT_CURSOR[1] = fy;
        drawBoard(buffer, x + 34, y + 4);
        draw();
      },
      async click() {
        if (COMBAT_COUNT > 2) {
          const selected = COMBAT_BOARD[COMBAT_CURSOR[0]][COMBAT_CURSOR[1]];
          const count = GW.grid.floodFill(COMBAT_BOARD, COMBAT_CURSOR[0], COMBAT_CURSOR[1], selected, 0);
          const attacker = actors[selected % 2];
          const defender = actors[(selected + 1) % 2];

          await doAttack(attacker, defender, count, selected > 2, ctx);
          drawPlayer(buffer, x + 4, y + 4, 20);
          drawOpponent(buffer, x + 66, y + 4, 20, actor.isPlayer() ? target : actor);
          draw();

          if (defender.isDead()) {
            GW.ui.prompt('Press any key to continue');
            draw();
            await GW.io.nextKeyOrClick();
            running = false;
          }

        }
      }
    });
  }

  GW.ui.finishDialog();

  GW.message.forceRedraw();
  GW.flavor.clear();
  GW.ui.draw();

  if (actors[1].isDead()) { // player
    await GW.game.gameOver(false, 'Killed by §attacker§.', { attacker: actors[0] });
  }

  actor.endTurn();
  return true;
}
