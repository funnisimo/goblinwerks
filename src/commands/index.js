

import { utils as Utils } from 'gw-core';
import { data as DATA, commands } from '../gw.js';
import './grab.js';
import './movePlayer.js';
import './bash.js';
import './open.js';
import './close.js';
import './fire.js';
import './attack.js';
import './push.js';
import './talk.js';
import './travel.js';

commands.debug = Utils.NOOP;

async function rest(e) {
	DATA.player.endTurn();
	return true;
}

commands.rest = rest;
