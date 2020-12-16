

import { io as IO } from 'gw-utils';
import { data as DATA } from '../gw.js';
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

async function rest(e) {
	DATA.player.endTurn();
	return true;
}

IO.addCommand('rest', rest);
