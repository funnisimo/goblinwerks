

import { data as DATA, commands, utils as UTILS } from '../gw.js';
import './grab.js';
import './moveDir.js';
import './bash.js';
import './open.js';
import './close.js';

commands.debug = UTILS.NOOP;

async function rest(e) {
	DATA.player.endTurn();
	return true;
}

commands.rest = rest;
