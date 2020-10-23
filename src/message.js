
import { colors as COLORS, color as COLOR } from './color.js';
import { io as IO } from './io.js';
import { text as TEXT } from './text.js';
import { make, types, data as DATA, message, ui as UI } from './gw.js';


var SETUP = null;

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

message.needsRedraw = needsRedraw;


function setup(opts) {
  opts.height = opts.height || 1;
  for(let i = 0; i < opts.height; ++i) {
    CONFIRMED[i] = null;
    DISPLAYED[i] = null;
  }

  SETUP = message.bounds = new types.Bounds(opts.x, opts.y, opts.w || opts.width, opts.h || opts.height);
  ARCHIVE_LINES = opts.archive || 0;
  if (!ARCHIVE_LINES) {
    if (UI.canvas) {
      ARCHIVE_LINES = UI.canvas.height;
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

message.setup = setup;


////////////////////////////////////
// Messages

function moveBlocked(ctx) {
  if (ctx.item) {
    message.add('Blocked by %s!', ctx.item.getFlavor());
  }
  else {
    message.add('Blocked!');
  }
}

message.moveBlocked = moveBlocked;


function add(...args) {
  if (args.length == 0) return;
  let msg = args[0];
  if (args.length > 1) {
    msg = TEXT.format(...args);
  }
  commitCombatMessage();
  addMessage(msg);
}

message.add = add;


function forPlayer(actor, ...args) {
  if (!actor.isPlayer()) return;
  add(...args);
}

message.forPlayer = forPlayer;

function addCombat(...args) {
  if (args.length == 0) return;
  let msg = args[0];
  if (args.length > 1) {
    msg = TEXT.format(...args);
  }
  addCombatMessage(msg);
}

message.addCombat = addCombat;


function drawMessages(buffer) {
	let i, j, m;
	const tempColor = make.color();
	let messageColor;

  if (!NEEDS_UPDATE || !SETUP) return false;

  commitCombatMessage();

  const isOnTop = (SETUP.y < 10);

	for (i=0; i < SETUP.height; i++) {
		messageColor = tempColor;
		messageColor.copy(COLORS.white);

		if (CONFIRMED[i]) {
			COLOR.applyMix(messageColor, COLORS.black, 50);
			COLOR.applyMix(messageColor, COLORS.black, 75 * i / (2*SETUP.height));
		}

    const localY = isOnTop ? (SETUP.height - i - 1) : i;
    const y = SETUP.toOuterY(localY);

		TEXT.eachChar( DISPLAYED[i], (c, color, j) => {
			const x = SETUP.toOuterX(j);

			if (color && (messageColor !== color) && CONFIRMED[i]) {
				COLOR.applyMix(color, COLORS.black, 50);
				COLOR.applyMix(color, COLORS.black, 75 * i / (2*SETUP.height));
			}
			messageColor = color || tempColor;
			buffer.plotChar(x, y, c, messageColor, COLORS.black);
		});

		for (let j = TEXT.length(DISPLAYED[i]); j < SETUP.width; j++) {
			const x = SETUP.toOuterX(j);
			buffer.plotChar(x, y, ' ', COLORS.black, COLORS.black);
		}
	}

  NEEDS_UPDATE = false;
  return true;
}

message.draw = drawMessages;


// function messageWithoutCaps(msg, requireAcknowledgment) {
function addMessageLine(msg) {
	let i;

	if (!TEXT.length(msg)) {
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

	DATA.disturbed = true;

	msg = TEXT.capitalize(msg);

  if (!SETUP) {
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
	// 			text.splice(i, 2, replace);
  //     }
  // }

	const lines = TEXT.splitIntoLines(msg, SETUP.width);

  if (SETUP.y < 10) {  // On top of UI
    lines.forEach( (l) => addMessageLine(l) );
  }
  else {  // On bottom of UI (add in reverse)
    for(let i = lines.length - 1; i >= 0; --i) {
      addMessageLine( lines[i] );
    }
  }

  // display the message:
  NEEDS_UPDATE = true;
  UI.requestUpdate();

  // if (GAME.playbackMode) {
	// 	GAME.playbackDelayThisTurn += GAME.playbackDelayPerTurn * 5;
	// }
}

function addCombatMessage(msg) {
	if (!COMBAT_MESSAGE) {
		COMBAT_MESSAGE = msg;
	}
	else {
		COMBAT_MESSAGE += ', ' + TEXT.capitalize(msg);;
	}
  NEEDS_UPDATE = true;
  UI.requestUpdate();
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
  UI.requestUpdate();
}

message.confirmAll = confirmAll;


async function showArchive() {
	let i, j, k, reverse, fadePercent, totalMessageCount, currentMessageCount;
	let fastForward;

  if (!SETUP) return;

	// Count the number of lines in the archive.
	for (totalMessageCount=0;
		 totalMessageCount < ARCHIVE_LINES && ARCHIVE[totalMessageCount];
		 totalMessageCount++);

	if (totalMessageCount <= SETUP.height) return;

  const isOnTop = (SETUP.y < 10);
	const dbuf = UI.startDialog();

	// Pull-down/pull-up animation:
	for (reverse = 0; reverse <= 1; reverse++) {
		fastForward = false;
		for (currentMessageCount = (reverse ? totalMessageCount : SETUP.height);
			 (reverse ? currentMessageCount >= SETUP.height : currentMessageCount <= totalMessageCount);
			 currentMessageCount += (reverse ? -1 : 1))
	  {
			UI.clearDialog();

			// Print the message archive text to the dbuf.
			for (j=0; j < currentMessageCount && j < dbuf.height; j++) {
				const pos = (CURRENT_ARCHIVE_POS - currentMessageCount + ARCHIVE_LINES + j) % ARCHIVE_LINES;
        const y = isOnTop ? j : dbuf.height - j - 1;

				dbuf.plotLine(SETUP.toOuterX(0), y, SETUP.width, ARCHIVE[pos], COLORS.white, COLORS.black);
			}

			// Set the dbuf opacity, and do a fade from bottom to top to make it clear that the bottom messages are the most recent.
			for (j=0; j < currentMessageCount && j < dbuf.height; j++) {
				fadePercent = 40 * (j + totalMessageCount - currentMessageCount) / totalMessageCount + 60;
				for (i=0; i<SETUP.width; i++) {
					const x = SETUP.toOuterX(i);

          const y = isOnTop ? j : dbuf.height - j - 1;
					dbuf[x][y].opacity = INTERFACE_OPACITY;
					if (dbuf[x][y].char != ' ') {
						for (k=0; k<3; k++) {
							dbuf[x][y].fg[k] = dbuf[x][y].fg[k] * fadePercent / 100;
						}
					}
				}
			}

			UI.draw();

			if (!fastForward && await IO.pause(reverse ? 15 : 45)) {
				fastForward = true;
				// dequeueEvent();
				currentMessageCount = (reverse ? SETUP.height + 1 : totalMessageCount - 1); // skip to the end
			}
		}

		if (!reverse) {
    	if (!DATA.autoPlayingLevel) {
        const y = isOnTop ? 0 : dbuf.height - 1;
        dbuf.plotText(SETUP.toOuterX(-8), y, "--DONE--", COLORS.black, COLORS.white);
      	UI.draw();
      	await IO.waitForAck();
    	}

		}
	}
	UI.finishDialog();

	message.confirmAll();
  NEEDS_UPDATE = true;
  UI.requestUpdate();
}

message.showArchive = showArchive;
