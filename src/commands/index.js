

import * as Utils from '../utils.js';
import { data as DATA, commands } from '../gw.js';
import './grab.js';
import './movePlayer.js';
import './bash.js';
import './open.js';
import './close.js';
import './fire.js';
import './attack.js';
import './push.js';

commands.debug = Utils.NOOP;

async function rest(e) {
	DATA.player.endTurn();
	return true;
}

commands.rest = rest;
