
import { colors as COLORS, color as COLOR } from './color.js';
import { io as IO } from './io.js';
import { make, types, data as DATA, message, ui as UI } from './gw.js';


var SETUP = null;

// color escapes
const COLOR_ESCAPE =			25;
const COLOR_END    =      26;
const COLOR_VALUE_INTERCEPT =	0; // 25;
const TEMP_COLOR = make.color();

// messages
const ARCHIVE = [];
const DISPLAYED = [];
const CONFIRMED = [];
var ARCHIVE_LINES = 30;
var CURRENT_ARCHIVE_POS = 0;
var NEEDS_UPDATE = false;
var INTERFACE_OPACITY = 90;



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
  console.log('Blocked!');
}

message.moveBlocked = moveBlocked;


function add(...args) {
  if (args.length == 0) return;
  let msg = args[0];
  if (args.length > 1) {
    msg = message.format(...args);
  }
  addMessage(msg);
}

message.add = add;



///////////////////////////////////
// Message String



// class Message {
//   constructor(value) {
//     this.text = value || '';
//     this._textLength = -1;
//   }
//
//   get fullLength() { return this.text.length; }
//
//   get length() {
//     throw new Error('Convert to fullLength or textLength');
//   }
//
//   get textLength() {
//     if (this._textLength > -1) return this._textLength;
//
//     let length = 0;
//
//     for(let i = 0; i < this.text.length; ++i) {
//       const ch = this.text.charCodeAt(i);
//       if (ch === COLOR_ESCAPE) {
//           i += 3;	// skip color parts
//       }
//       else if (ch === COLOR_END) {
//           // skip
//       }
//       else {
//         ++length;
//       }
//     }
//
//     this._textLength = length;
//     return this._textLength;
//   }
//
//   eachChar(callback) {
//     let color = null;
//     const components = [100, 100, 100];
//     let index = 0;
//
//     for(let i = 0; i < this.text.length; ++i) {
//       const ch = this.text.charCodeAt(i);
//       if (ch === COLOR_ESCAPE) {
//           components[0] = this.text.charCodeAt(i + 1) - COLOR_VALUE_INTERCEPT;
//           components[1] = this.text.charCodeAt(i + 2) - COLOR_VALUE_INTERCEPT;
//           components[2] = this.text.charCodeAt(i + 3) - COLOR_VALUE_INTERCEPT;
//           color = TEMP_COLOR.copy(components);
//           i += 3;
//       }
//       else if (ch === COLOR_END) {
//         color = null;
//       }
//       else {
//         callback(this.text[i], color, index);
//         ++index;
//       }
//     }
//
//   }
//
//   encodeColor(color, i) {
//     let colorText;
//     if (!color) {
//       colorText = String.fromCharCode(COLOR_END);
//     }
//     else {
//       const copy = color.clone();
//       bakeColor(copy);
//       clampColor(copy);
//       colorText = String.fromCharCode(COLOR_ESCAPE, copy.red + COLOR_VALUE_INTERCEPT, copy.green + COLOR_VALUE_INTERCEPT, copy.blue + COLOR_VALUE_INTERCEPT);
//     }
//     if (i == 0) {
//       this.text = colorText;
//     }
//     else if (i < this.text.length) {
//       this.splice(i, 4, colorText);
//     }
//     else {
//       this.text += colorText;
//     }
//     return this;
//   }
//
//   setText(value) {
//     if (value instanceof BrogueString) {
//       this.text = value.text;
//       this._textLength = value._textLength;
//       return this;
//     }
//
//     this.text = value || '';
//     this._textLength = -1;
//     return this;
//   }
//
//   append(value) {
//     if (value instanceof BrogueString) {
//       this.text += value.text;
//       this._textLength = -1;
//       return this;
//     }
//
//     this.text += value;
//     this._textLength = -1;
//     return this;
//   }
//
//   clear() {
//     this.text = '';
//     this._textLength = 0;
//     return this;
//   }
//
//   capitalize() {
//     if (!this.text.length) return;
//
//     let index = 0;
//     let ch = this.text.charCodeAt(index);
//     while (ch === COLOR_ESCAPE) {
//       index += 4;
//       ch = this.text.charCodeAt(index);
//     }
//
//     const preText = index ? this.text.substring(0, index) : '';
//     this.text = preText + this.text[index].toUpperCase() + this.text.substring(index + 1);
//     return this;
//   }
//
//   padStart(finalLength) {
//     const diff = (finalLength - this.textLength);
//     if (diff <= 0) return this;
//     this.text = this.text.padStart(diff + this.text.length, ' ');
//     this._textLength += diff;
//     return this;
//   }
//
//   padEnd(finalLength) {
//     const diff = (finalLength - this.textLength);
//     if (diff <= 0) return this;
//     this.text = this.text.padEnd(diff + this.text.length, ' ');
//     this._textLength += diff;
//     return this;
//   }
//
//   toString() {
//     return this.text;
//   }
//
//   charAt(index) {
//     return this.text.charAt(index);
//   }
//
//   charCodeAt(index) {
//     return this.text.charCodeAt(index);
//   }
//
//   copy(other) {
//     this.text = other.text;
//     this._textLength = other._textLength;
//     return this;
//   }
//
//   splice(begin, length, add) {
//     const preText = this.text.substring(0, begin);
//     const postText = this.text.substring(begin + length);
//     add = (add && add.text) ? add.text : (add || '');
//
//     this.text = preText + add + postText;
//     this._textLength = -1;
//   }
//
//   toString() {
//     return this.text;
//   }
//
// }
//
//
// types.String = BrogueString;
//
//
// // return a new string object
// function STRING(text) {
//   if (text instanceof BrogueString) return text;
//   return new BrogueString(text);
// }
//
// make.string = STRING;

function eachChar(msg, fn) {
  let color = null;
  const components = [100, 100, 100];
  let index = 0;
  if (!msg || !msg.length) return;

  for(let i = 0; i < msg.length; ++i) {
    const ch = msg.charCodeAt(i);
    if (ch === COLOR_ESCAPE) {
        components[0] = msg.charCodeAt(i + 1) - COLOR_VALUE_INTERCEPT;
        components[1] = msg.charCodeAt(i + 2) - COLOR_VALUE_INTERCEPT;
        components[2] = msg.charCodeAt(i + 3) - COLOR_VALUE_INTERCEPT;
        color = TEMP_COLOR.copy(components);
        i += 3;
    }
    else if (ch === COLOR_END) {
      color = null;
    }
    else {
      fn(msg[i], color, index);
      ++index;
    }
  }
}

message.eachChar = eachChar;

//
// function strlen(bstring) {
//   if (!bstring) return 0;
//   if (typeof bstring === 'string') return bstring.length;
//   return bstring.fullLength;
// }
//
// message.strlen = strlen;
//

function textlen(msg) {
  let length = 0;

  if (!msg || !msg.length) return 0;

  for(let i = 0; i < msg.length; ++i) {
    const ch = msg.charCodeAt(i);
    if (ch === COLOR_ESCAPE) {
        i += 3;	// skip color parts
    }
    else if (ch === COLOR_END) {
        // skip
    }
    else {
      ++length;
    }
  }

  return length;
}

message.textlen = textlen;


function splice(msg, begin, length, add) {
  const preText = msg.substring(0, begin);
  const postText = msg.substring(begin + length);
  add = add || '';

  return preText + add + postText;
}

message.splice = splice;

// function strcat(bstring, txt) {
//   bstring.append(txt);
// }
//
// message.strcat = strcat;
//
// function strncat(bstring, txt, n) {
//   txt = STRING(txt);
//   bstring.append(txt.text.substring(0, n));
// }
//
// message.strncat = strncat;
//
// function strcpy(bstring, txt) {
//   bstring.setText(txt);
// }
//
// message.strcpy = strcpy;

// function eachChar(bstring, callback) {
// 	bstring = STRING(bstring);
// 	return bstring.eachChar(callback);
// }



// Returns true if either string has a null terminator before they otherwise disagree.
function stringsMatch(str1, str2) {
  let i, j;

  // str1 = STRING(str1);
  // str2 = STRING(str2);

  const limit = Math.min( str1.length , str2.length );

  for (i=0, j=0; limit > 0; --limit) {

    // TODO - Handle COLOR_END also
    while (str1.charCodeAt(i) === COLOR_ESCAPE) {
      i += 4;
    }
    while(str2.charCodeAt(j) === COLOR_ESCAPE) {
      j += 4;
    }

    if (str1.charAt(i).toLowerCase() != str2.charAt(j).toLowerCase()) {
      return false;
    }
  }
  return true;
}

message.matches = stringsMatch;


function centerText(msg, len) {
  const textlen = message.textlen(msg);
  const totalPad = (len - textlen);
  const leftPad = Math.round(totalPad/2);
  return msg.padStart(leftPad + textlen, ' ').padEnd(len, ' ');
}

message.center = centerText;


function capitalize(msg) {
  if (!msg.length) return;

  let index = 0;
  let ch = msg.charCodeAt(index);
  while (ch === COLOR_ESCAPE || ch === COLOR_END) {
    index += (ch === COLOR_ESCAPE ? 4 : 1);
    ch = msg.charCodeAt(index);
  }

  const preText = index ? msg.substring(0, index) : '';
  msg = preText + msg[index].toUpperCase() + msg.substring(index + 1);
  return msg;
}

message.capitalize = capitalize;

// // Gets the length of a string without the color escape sequences, since those aren't displayed.
// function strLenWithoutEscapes(text) {
//   text = STRING(text);
//   return text.textLength;
// }
//
// message.textLength = strLenWithoutEscapes;
//
// function strcmp(a, b) {
//   a = STRING(a);
//   b = STRING(b);
//
//   if (a.text == b.text) return 0;
//   return (a.text < b.text) ? -1 : 1;
// }
//
// message.strcmp = strcmp;


// Inserts a four-character color escape sequence into a string at the insertion point.
// Does NOT check string lengths, so it could theoretically write over the null terminator.
// Returns the new insertion point.
function encodeColor(theColor) {
  if (!theColor) {
    return String.fromCharCode(COLOR_END);
  }

  const copy = COLOR.from(theColor);
  COLOR.bake(copy);
  COLOR.clamp(copy);
  return String.fromCharCode(COLOR_ESCAPE, copy.red + COLOR_VALUE_INTERCEPT, copy.green + COLOR_VALUE_INTERCEPT, copy.blue + COLOR_VALUE_INTERCEPT);
}
//
//
// // Call this when the i'th character of msg is COLOR_ESCAPE.
// // It will return the encoded color, and will advance i past the color escape sequence.
// function strDecodeColor(msg, i, /* color */ returnColor) {
//
//   msg = STRING(msg).text;
//
//   if (msg.charCodeAt(i) !== COLOR_ESCAPE) {
//     printf("\nAsked to decode a color escape that didn't exist!", msg, i);
//     returnColor.copy(white);
//   } else {
//     i++;
//     returnColor.copy(black);
//     returnColor.red	= (msg.charCodeAt(i++) - COLOR_VALUE_INTERCEPT);
//     returnColor.green	= (msg.charCodeAt(i++) - COLOR_VALUE_INTERCEPT);
//     returnColor.blue	= (msg.charCodeAt(i++) - COLOR_VALUE_INTERCEPT);
//
//     returnColor.red	= clamp(returnColor.red, 0, 100);
//     returnColor.green	= clamp(returnColor.green, 0, 100);
//     returnColor.blue	= clamp(returnColor.blue, 0, 100);
//   }
//   return i;
// }
//
//
// function isVowelish(str) {
//   str = STRING(str);
//
//   if (stringsMatch(str, "uni")) return false;  // Words that start with "uni" aren't treated like vowels; e.g., "a" unicorn.
//   if (stringsMatch(str, "eu"))  return false;  // Words that start with "eu" aren't treated like vowels; e.g., "a" eucalpytus staff.
//
//   let i = 0;
//   while( str.charCodeAt(i) == COLOR_ESCAPE ) {
//     i += 4;
//   }
//
//   // TODO - Get rid of 'charAt'
//   const ch = str.charAt(i).toLowerCase();
//   return ['a', 'e', 'i', 'o', 'u'].includes(ch);
// }
//
// message.isVowelish = isVowelish;
//
//
// function arrayToString(array, lastSeperator) {
//   lastSeperator = lastSeperator || 'and';
//
//   let index;
//   let out = '';
//   for(index in array) {
//     if (index > 0 && index == array.length - 1) {
//       out += lastSeperator;
//     }
//     else if (index > 0) {
//       out += ', ';
//     }
//     out += array[index];
//   }
//   return out;
// }
//
// GW.utils.arrayToString = arrayToString;
//

// Inserts line breaks into really long words. Optionally adds a hyphen, but doesn't do anything
// clever regarding hyphen placement. Plays nicely with color escapes.
function hyphenate(sourceText, width, useHyphens) {
  let buf = ''; // char[COLS * ROWS * 2] = "";
  let i, m, nextChar, wordWidth;
  //const short maxLength = useHyphens ? width - 1 : width;

  const text = sourceText;

  // i iterates over characters in sourceText; m keeps track of the length of buf.
  wordWidth = 0;
  for (i=0; text[i]; ) {
    if (text.charCodeAt(i) === COLOR_ESCAPE) {
      buf += text.substring(i, i + 4);
      i += 4;
    }
    else if (text.charCodeAt(i) === COLOR_END) {
      buf += text.substring(i, i + 1);
      i += 1;
    } else if (text[i] === ' ' || text[i] === '\n') {
      wordWidth = 0;
      buf += text[i++];
    } else {
      if (!useHyphens && wordWidth >= width) {
        buf += '\n';
        wordWidth = 0;
      } else if (useHyphens && wordWidth >= width - 1) {
        nextChar = i+1;
        while (text[nextChar] === COLOR_ESCAPE || text[nextChar] === COLOR_END) {
          nextChar += (text[nextChar] === COLOR_ESCAPE ? 4 : 1);
        }
        if (text[nextChar] && text[nextChar] !== ' ' && text[nextChar] !== '\n') {
          buf += '-\n';
          wordWidth = 0;
        }
      }
      buf += text[i++];
      wordWidth++;
    }
  }
  return buf;
}

message.hyphenate = hyphenate;


// Returns the number of lines, including the newlines already in the text.
// Puts the output in "to" only if we receive a "to" -- can make it null and just get a line count.
function splitIntoLines(sourceText, width) {
  let i, w, textLength, lineCount;
  let spaceLeftOnLine, wordWidth;

  if (!width) GW.utils.ERROR('Need string and width');

  let printString = message.hyphenate(sourceText, width, true); // break up any words that are wider than the width.
  textLength = message.textlen(printString); // do NOT discount escape sequences
  lineCount = 1;

  // Now go through and replace spaces with newlines as needed.

  // Fast foward until i points to the first character that is not a color escape.
  for (i=0; printString.charCodeAt(i) == COLOR_ESCAPE; i+= 4);
  spaceLeftOnLine = width;

  while (i < textLength) {
    // wordWidth counts the word width of the next word without color escapes.
    // w indicates the position of the space or newline or null terminator that terminates the word.
    wordWidth = 0;
    for (w = i + 1; w < textLength && printString[w] !== ' ' && printString[w] !== '\n';) {
      if (printString.charCodeAt(w) === COLOR_ESCAPE) {
        w += 4;
      }
      else if (printString.charCodeAt(w) === COLOR_END) {
        w += 1;
      }
      else {
        w++;
        wordWidth++;
      }
    }

    if (1 + wordWidth > spaceLeftOnLine || printString[i] === '\n') {
      printString = message.splice(printString, i, 1, '\n');	// [i] = '\n';
      lineCount++;
      spaceLeftOnLine = width - wordWidth; // line width minus the width of the word we just wrapped
      //printf("\n\n%s", printString);
    } else {
      spaceLeftOnLine -= 1 + wordWidth;
    }
    i = w; // Advance to the terminator that follows the word.
  }

  return printString.split('\n');;
}

message.splitIntoLines = splitIntoLines;


function format(fmt, ...args) {

  const RE = /%([\-\+0\ \#]+)?(\d+|\*)?(\.\*|\.\d+)?([hLIw]|l{1,2}|I32|I64)?([cCdiouxXeEfgGaAnpsRSZ%])/g;

  if (fmt instanceof types.Color) {
    const buf = encodeColor(fmt) + args.shift();
    fmt = buf;
  }
  if (typeof fmt !== 'string') {
    fmt = '' + fmt;
  }

  let text = fmt.replace(RE, (m, p1, p2, p3, p4, p5, offset) => {
    // GW.debug.log(m, p1, p2, p3, p4, p5, offset);

    p1 = p1 || '';
    p2 = p2 || '';
    p3 = p3 || '';

    let r;
    let sign = '';

    let pad = Number.parseInt(p2) || 0;
    const wantSign = p1.includes('+');
    if (p1.includes(' ')) {
      sign = ' ';
    }

    if (p5 == 's') {
      if (p1.includes(' ')) return m;
      r = args.shift() || '';
      r = r.text || r;	// BrogueString
    }
    else if (p5 == 'c') {
      if (m !== '%c') return m;
      r = (args.shift() || '');
      r = r.text || r;	// BrogueString
      r = r[0] || '';
    }
    else if (p5 == 'd' || p5 == 'i' || p5 == 'u') {
      let n = args.shift() || 0;
      if (n < 0) {
        sign = '-';
      }
      else if (wantSign) {
        sign = '+';
      }
      r = '' + Math.abs(n);
    }
    else if (p5 == 'f') {
      let n = args.shift() || 0;
      const fixed = p3.substring(1) || 0;
      if (fixed) {
        r = Math.abs(n).toFixed(fixed);
      }
      else {
        r = '' + Math.abs(n);
      }

      if (n < 0) {
        sign = '-';
      }
      else if (wantSign) {
        sign = '+';
      }
    }
    else if (p5 == 'R') {
      let color = args.shift() || null;
      if (color && !(color instanceof types.Color)) {
        color = COLOR.from(color);
      }
      r = encodeColor(color);
    }
    else if (p5 == '%') {
      return '%';
    }
    else {
      return m;
    }

    if (p1.includes('-')) {
      r = sign + r.padEnd(pad - sign.length, ' ');
    }
    else {
      if (p1.includes('0')) {
        r = sign + r.padStart(pad - sign.length, '0');
      }
      else {
        r = (sign + r).padStart(pad, ' ');
      }
    }

    return r;
  });

  if (args.length) {
    if (text.length) {
      text += ' ';
    }
    text = text + args.join(' ');
  }

  return text;
}

message.format = format;

// function sprintf(dest, fmt, ...args) {
//   dest = STRING(dest);
//   dest._textLength = -1;
//   dest.text = message.format(fmt, ...args);
//   return dest;
// }
//
// message.sprintf = sprintf;




function drawMessages(buffer) {
	let i, j, m;
	const tempColor = make.color();
	let messageColor;

  if (!NEEDS_UPDATE || !SETUP) return false;

  const isOnTop = (SETUP.y < 10);

	for (i=0; i < SETUP.height; i++) {
		messageColor = tempColor;
		messageColor.copy(COLORS.white);

		if (CONFIRMED[i]) {
			COLOR.applyMix(messageColor, COLORS.black, 50);
			COLOR.applyMix(messageColor, COLORS.black, 75 * i / (2*SETUP.height));
		}

    const localY = isOnTop ? (SETUP.height - i - 1) : i;
    const y = SETUP.toCanvasY(localY);

		message.eachChar( DISPLAYED[i], (c, color, j) => {
			const x = SETUP.toCanvasX(j);

			if (color && (messageColor !== color) && CONFIRMED[i]) {
				COLOR.applyMix(color, COLORS.black, 50);
				COLOR.applyMix(color, COLORS.black, 75 * i / (2*SETUP.height));
			}
			messageColor = color || messageColor;
			buffer.plotChar(x, y, c, messageColor, COLORS.black);
		});

		for (let j = message.textlen(DISPLAYED[i]); j < SETUP.width; j++) {
			const x = SETUP.toCanvasX(j);
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

	if (!message.textlen(msg)) {
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
	// displayCombatText();

	msg = message.capitalize(msg);

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

	const lines = message.splitIntoLines(msg, SETUP.width);

  if (SETUP.y < 10) {  // On top of UI
    lines.forEach( (l) => addMessageLine(l) );
  }
  else {  // On bottom of UI (add in reverse)
    for(let i = lines.length - 1; i >= 0; --i) {
      addMessageLine( lines[i] );
    }
  }

  // display the message:
	// updateMessageDisplay();
  NEEDS_UPDATE = true;
  UI.requestUpdate();

  // if (GAME.playbackMode) {
	// 	GAME.playbackDelayThisTurn += GAME.playbackDelayPerTurn * 5;
	// }
}


// let COMBAT_MESSAGE = null;
//
// function combatMessage(...args) {
// 	const msg = message.format(...args);
// 	if (!COMBAT_MESSAGE) {
// 		COMBAT_MESSAGE = msg;
// 	}
// 	else {
// 		COMBAT_MESSAGE += ' ' + message.capitalize(msg);;
// 	}
// 	// updateMessageDisplay();
// }
//
// UI.combatMessage = combatMessage;
//
//
// function commitCombatMessage() {
// 	if (!COMBAT_MESSAGE) return false;
// 	addMessage(COMBAT_MESSAGE);
// 	COMBAT_MESSAGE = null;
// 	return true;
// }
//
//
function confirmAll() {
	for (let i=0; i<CONFIRMED.length; i++) {
		CONFIRMED[i] = true;
	}
	// updateMessageDisplay();
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
			dbuf.clear();

			// Print the message archive text to the dbuf.
			for (j=0; j < currentMessageCount && j < dbuf.height; j++) {
				const pos = (CURRENT_ARCHIVE_POS - currentMessageCount + ARCHIVE_LINES + j) % ARCHIVE_LINES;
        const y = isOnTop ? j : dbuf.height - j - 1;

				dbuf.plotLine(SETUP.toCanvasX(0), y, SETUP.width, ARCHIVE[pos], COLORS.white, COLORS.black);
			}

			// Set the dbuf opacity, and do a fade from bottom to top to make it clear that the bottom messages are the most recent.
			for (j=0; j < currentMessageCount && j < dbuf.height; j++) {
				fadePercent = 40 * (j + totalMessageCount - currentMessageCount) / totalMessageCount + 60;
				for (i=0; i<SETUP.width; i++) {
					const x = SETUP.toCanvasX(i);

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
        dbuf.plotText(SETUP.toCanvasX(-8), y, "--DONE--", COLORS.black, COLORS.white);
      	UI.draw();
      	await IO.waitForAck();
    	}

		}
	}
	UI.finishDialog();

	message.confirmAll();
	// updateMessageDisplay();
  NEEDS_UPDATE = true;
  UI.requestUpdate();
}

message.showArchive = showArchive;
