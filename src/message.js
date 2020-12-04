
import * as Color from './color.js';
import { io as IO } from './io.js';
import * as Text from './text.js';
import * as GW from './gw.js';


var MSG_BOUNDS = null;



function addKind(id, msg) {
  GW.messages[id] = msg;
}

GW.message.addKind = addKind;

function addKinds(config) {
  Object.entries(config).forEach( ([id, msg]) => GW.message.addKind(id, msg) );
}

GW.message.addKinds = addKinds;


// messages
const ARCHIVE = [];
const DISPLAYED = [];
const CONFIRMED = [];
var ARCHIVE_LINES = 30;
var CURRENT_ARCHIVE_POS = 0;
var NEEDS_UPDATE = false;
var INTERFACE_OPACITY = 90;
let COMBAT_MESSAGE = null;

export function needsRedraw() {
  NEEDS_UPDATE = true;
}

GW.message.needsRedraw = needsRedraw;


function setup(opts) {
  opts.height = opts.height || 1;
  for(let i = 0; i < opts.height; ++i) {
    CONFIRMED[i] = null;
    DISPLAYED[i] = null;
  }

  MSG_BOUNDS = GW.message.bounds = new GW.types.Bounds(opts.x, opts.y, opts.w || opts.width, opts.h || opts.height);
  ARCHIVE_LINES = opts.archive || 0;
  if (!ARCHIVE_LINES) {
    if (GW.ui.canvas) {
      ARCHIVE_LINES = GW.ui.canvas.height;
    }
    else {
      ARCHIVE_LINES = 30;
    }
  }
  for(let i = 0; i < ARCHIVE_LINES; ++i) {
    ARCHIVE[i] = null;
  }

  INTERFACE_OPACITY = opts.opacity || INTERFACE_OPACITY;
}

GW.message.setup = setup;


////////////////////////////////////
// Messages

function add(msg, args) {
  msg = GW.messages[msg] || msg;
  msg = Text.apply(msg, args);
  commitCombatMessage();
  addMessage(msg);
}

GW.message.add = add;


function forPlayer(actor, ...args) {
  if (!actor.isPlayer()) return;
  add(...args);
}

GW.message.forPlayer = forPlayer;

function addCombat(msg, args) {
  msg = GW.messages[msg] || msg;
  msg = Text.apply(msg, args);
  addCombatMessage(msg);
}

GW.message.addCombat = addCombat;

function forceRedraw() {
  NEEDS_UPDATE = true;
}

GW.message.forceRedraw = forceRedraw;


function drawMessages(buffer) {
	let i, j, m;
	const tempColor = GW.make.color();
	let messageColor;

  if (!NEEDS_UPDATE || !MSG_BOUNDS) return false;

  commitCombatMessage();

  const isOnTop = (MSG_BOUNDS.y < 10);

	for (i=0; i < MSG_BOUNDS.height; i++) {
		messageColor = tempColor;
		messageColor.copy(GW.colors.white);

		if (CONFIRMED[i]) {
			messageColor.mix(GW.colors.black, 50);
			messageColor.mix(GW.colors.black, 75 * i / (2*MSG_BOUNDS.height));
		}

    const localY = isOnTop ? (MSG_BOUNDS.height - i - 1) : i;
    const y = MSG_BOUNDS.toOuterY(localY);

		Text.eachChar( DISPLAYED[i], (c, color, bg, j) => {
			const x = MSG_BOUNDS.toOuterX(j);

			if (color && (messageColor !== color) && CONFIRMED[i]) {
				color.mix(GW.colors.black, 50);
				color.mix(GW.colors.black, 75 * i / (2*MSG_BOUNDS.height));
			}
			messageColor = color || tempColor;
			buffer.plotChar(x, y, c, messageColor, GW.colors.black);
		});

		for (let j = Text.length(DISPLAYED[i]); j < MSG_BOUNDS.width; j++) {
			const x = MSG_BOUNDS.toOuterX(j);
			buffer.plotChar(x, y, ' ', GW.colors.black, GW.colors.black);
		}
	}

  NEEDS_UPDATE = false;
  return true;
}

GW.message.draw = drawMessages;


// function messageWithoutCaps(msg, requireAcknowledgment) {
function addMessageLine(msg) {
	let i;

	if (!Text.length(msg)) {
      return;
  }

	for (i = CONFIRMED.length - 1; i >= 1; i--) {
		CONFIRMED[i] = CONFIRMED[i-1];
		DISPLAYED[i] = DISPLAYED[i-1];
	}
	CONFIRMED[0] = false;
	DISPLAYED[0] = msg;

	// Add the message to the archive.
	ARCHIVE[CURRENT_ARCHIVE_POS] = DISPLAYED[0];
	CURRENT_ARCHIVE_POS = (CURRENT_ARCHIVE_POS + 1) % ARCHIVE_LINES;
}


function addMessage(msg) {

	GW.data.disturbed = true;

	msg = Text.capitalize(msg);

  if (!MSG_BOUNDS) {
    console.log(msg);
    return;
  }

  // // Implement the American quotation mark/period/comma ordering rule.
  // for (i=0; text.text[i] && text.text[i+1]; i++) {
  //     if (text.charCodeAt(i) === COLOR_ESCAPE) {
  //         i += 4;
  //     } else if (text.text[i] === '"'
  //                && (text.text[i+1] === '.' || text.text[i+1] === ','))
	// 		{
	// 			const replace = text.text[i+1] + '"';
	// 			text.spliceRaw(i, 2, replace);
  //     }
  // }

	const lines = Text.splitIntoLines(msg, MSG_BOUNDS.width);

  if (MSG_BOUNDS.y < 10) {  // On top of UI
    lines.forEach( (l) => addMessageLine(l) );
  }
  else {  // On bottom of UI (add in reverse)
    for(let i = lines.length - 1; i >= 0; --i) {
      addMessageLine( lines[i] );
    }
  }

  // display the message:
  NEEDS_UPDATE = true;
  GW.ui.requestUpdate();

  // if (GAME.playbackMode) {
	// 	GAME.playbackDelayThisTurn += GAME.playbackDelayPerTurn * 5;
	// }
}

function addCombatMessage(msg) {
	if (!COMBAT_MESSAGE) {
		COMBAT_MESSAGE = msg;
	}
	else {
		COMBAT_MESSAGE += ', ' + Text.capitalize(msg);;
	}
  NEEDS_UPDATE = true;
  GW.ui.requestUpdate();
}



function commitCombatMessage() {
	if (!COMBAT_MESSAGE) return false;
	addMessage(COMBAT_MESSAGE + '.');
	COMBAT_MESSAGE = null;
	return true;
}


function confirmAll() {
	for (let i=0; i<CONFIRMED.length; i++) {
		CONFIRMED[i] = true;
	}
  NEEDS_UPDATE = true;
  GW.ui.requestUpdate();
}

GW.message.confirmAll = confirmAll;


async function showArchive() {
	let i, j, k, reverse, fadePercent, totalMessageCount, currentMessageCount;
	let fastForward;

  if (!MSG_BOUNDS) return;

	// Count the number of lines in the archive.
	for (totalMessageCount=0;
		 totalMessageCount < ARCHIVE_LINES && ARCHIVE[totalMessageCount];
		 totalMessageCount++);

	if (totalMessageCount <= MSG_BOUNDS.height) return;

  const isOnTop = (MSG_BOUNDS.y < 10);
	const dbuf = GW.ui.startDialog();

	// Pull-down/pull-up animation:
	for (reverse = 0; reverse <= 1; reverse++) {
		fastForward = false;
		for (currentMessageCount = (reverse ? totalMessageCount : MSG_BOUNDS.height);
			 (reverse ? currentMessageCount >= MSG_BOUNDS.height : currentMessageCount <= totalMessageCount);
			 currentMessageCount += (reverse ? -1 : 1))
	  {
			GW.ui.resetDialog();

			// Print the message archive text to the dbuf.
			for (j=0; j < currentMessageCount && j < dbuf.height; j++) {
				const pos = (CURRENT_ARCHIVE_POS - currentMessageCount + ARCHIVE_LINES + j) % ARCHIVE_LINES;
        const y = isOnTop ? j : dbuf.height - j - 1;

				dbuf.plotLine(MSG_BOUNDS.toOuterX(0), y, MSG_BOUNDS.width, ARCHIVE[pos], GW.colors.white, GW.colors.black);
			}

			// Set the dbuf opacity, and do a fade from bottom to top to make it clear that the bottom messages are the most recent.
			for (j=0; j < currentMessageCount && j < dbuf.height; j++) {
				fadePercent = 40 * (j + totalMessageCount - currentMessageCount) / totalMessageCount + 60;
				for (i=0; i<MSG_BOUNDS.width; i++) {
					const x = MSG_BOUNDS.toOuterX(i);

          const y = isOnTop ? j : dbuf.height - j - 1;
					dbuf._data[x][y].opacity = INTERFACE_OPACITY;
					if (dbuf._data[x][y].char != ' ') {
						for (k=0; k<3; k++) {
							dbuf._data[x][y].fg[k] = dbuf._data[x][y].fg[k] * fadePercent / 100;
						}
					}
				}
			}

			GW.ui.draw();

			if (!fastForward && await IO.pause(reverse ? 15 : 45)) {
				fastForward = true;
				// dequeueEvent();
				currentMessageCount = (reverse ? MSG_BOUNDS.height + 1 : totalMessageCount - 1); // skip to the end
			}
		}

		if (!reverse) {
    	if (!GW.data.autoPlayingLevel) {
        const y = isOnTop ? 0 : dbuf.height - 1;
        dbuf.plotLine(MSG_BOUNDS.toOuterX(-8), y, 8, "--DONE--", GW.colors.black, GW.colors.white);
      	GW.ui.draw();
      	await IO.waitForAck();
    	}

		}
	}
	GW.ui.finishDialog();

	GW.message.confirmAll();
  NEEDS_UPDATE = true;
  GW.ui.requestUpdate();
}

GW.message.showArchive = showArchive;
