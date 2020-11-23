
import * as Utils from './utils.js';
import * as Color from './color.js';
import * as GW from './gw.js';


///////////////////////////////////
// Message String

// color escapes
const COLOR_ESCAPE = GW.def.COLOR_ESCAPE =	25;
const COLOR_END    = GW.def.COLOR_END    = 26;
const COLOR_VALUE_INTERCEPT =	0; // 25;


export const playerPronoun = {
  it: 'you',
  its: 'your',
  you: 'you',
  your: 'your',
  he: 'you',
  she: 'you',
  his: 'your',
  hers: 'your',
};

export const singularPronoun = {
  it: 'it',
  its: 'its',
  he: 'he',
  she: 'she',
  his: 'his',
  hers: 'hers',
};

export const pluralPronoun = {
  it: 'them',
  its: 'their',
  he: 'them',
  she: 'them',
  his: 'their',
  hers: 'their',
};


export function firstChar(text) {
  let i = 0;
  while( i < text.length ) {
    const code = text.charCodeAt(i);
    if (code === COLOR_ESCAPE) {
      i += 4;
    }
    else if (code === COLOR_END) {
      i += 1;
    }
    else {
      return text[i];
    }
  }
  return null;
}


export function isVowel(ch) {
  return 'aeiouAEIOU'.includes(ch);
}



export function toSingularVerb(verb) {
  if (verb === 'pickup') return 'picks up';
  if (verb === 'have') return 'has';
  if (verb.endsWith('y')) {
    if (!verb.endsWith('ay')) {
      return verb.substring(0, verb.length - 1) + 'ies';
    }
  }
  if (verb.endsWith('sh') || verb.endsWith('ch') || verb.endsWith('o') || verb.endsWith('s')) {
    return verb + 'es';
  }
  return verb + 's';
}


export function toPluralVerb(verb) {
  if (verb === 'is') return 'are';
  if (verb === 'has') return 'have';
  if (verb.endsWith('ies')) {
    return verb.substring(0, verb.length - 3) + 'y';
  }
  if (verb.endsWith('es')) {
    return verb.substring(0, verb.length - 2);
  }
  return verb;
}


export function toPluralNoun(noun, isPlural=true) {
  if (!isPlural) return noun.replace('~','');
  const place = noun.indexOf('~');
  if (place < 0) return toSingularVerb(noun);

  let wordStart = noun.lastIndexOf(' ', place);
  if (wordStart < 0) wordStart = 0;
  const word = noun.substring(wordStart, place);
  const newWord = toSingularVerb(word);

  return splice(noun, wordStart, place - wordStart + 1, newWord);
}


export function eachChar(msg, fn) {
  let color = null;
  const components = [100, 100, 100];
  let index = 0;
  if (!msg || !msg.length) return;

  const colors = [];

  for(let i = 0; i < msg.length; ++i) {
    const ch = msg.charCodeAt(i);
    if (ch === COLOR_ESCAPE) {
        if (color) colors.push(color);

        components[0] = msg.charCodeAt(i + 1) - COLOR_VALUE_INTERCEPT;
        components[1] = msg.charCodeAt(i + 2) - COLOR_VALUE_INTERCEPT;
        components[2] = msg.charCodeAt(i + 3) - COLOR_VALUE_INTERCEPT;
        color = Color.make(components);
        i += 3;
    }
    else if (ch === COLOR_END) {
      color = colors.pop() || null;
    }
    else {
      fn(msg[i], color, index);
      ++index;
    }
  }
}


//
// function strlen(bstring) {
//   if (!bstring) return 0;
//   if (typeof bstring === 'string') return bstring.length;
//   return bstring.fullLength;
// }
//
// text.strlen = strlen;
//

export function length(msg) {
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



export function splice(msg, begin, length, add='') {
  const preText = msg.substring(0, begin);
  const postText = msg.substring(begin + length);
  return preText + add + postText;
}


// function strcat(bstring, txt) {
//   bstring.append(txt);
// }
//
// text.strcat = strcat;
//
// function strncat(bstring, txt, n) {
//   txt = STRING(txt);
//   bstring.append(txt.text.substring(0, n));
// }
//
// text.strncat = strncat;
//
// function strcpy(bstring, txt) {
//   bstring.setText(txt);
// }
//
// text.strcpy = strcpy;

// function eachChar(bstring, callback) {
// 	bstring = STRING(bstring);
// 	return bstring.eachChar(callback);
// }



// Returns true if strings have the same text (ignoring colors and case).
export function matches(str1, str2) {
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



export function center(msg, len) {
  const textlen = length(msg);
  const totalPad = (len - textlen);
  const leftPad = Math.round(totalPad/2);
  return msg.padStart(leftPad + textlen, ' ').padEnd(len, ' ');
}


export function capitalize(msg) {
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


// // Gets the length of a string without the color escape sequences, since those aren't displayed.
// function strLenWithoutEscapes(text) {
//   text = STRING(text);
//   return text.textLength;
// }
//
// text.textLength = strLenWithoutEscapes;
//
// function strcmp(a, b) {
//   a = STRING(a);
//   b = STRING(b);
//
//   if (a.text == b.text) return 0;
//   return (a.text < b.text) ? -1 : 1;
// }
//
// text.strcmp = strcmp;


// Inserts a four-character color escape sequence into a string at the insertion point.
// Does NOT check string lengths, so it could theoretically write over the null terminator.
// Returns the new insertion point.
export function encodeColor(theColor) {
  if ((!theColor) || theColor == '') {
    return String.fromCharCode(COLOR_END);
  }

  const copy = Color.from(theColor);
  if (!copy) Utils.ERROR('Invalid color - [' + theColor + ']');
  copy.bake();
  copy.clamp();
  return String.fromCharCode(COLOR_ESCAPE, copy.red + COLOR_VALUE_INTERCEPT, copy.green + COLOR_VALUE_INTERCEPT, copy.blue + COLOR_VALUE_INTERCEPT);
}

export function removeColors(text) {
  let out = '';
  let start = 0;
  for(let i = 0; i < text.length; ++i) {
    const k = text.charCodeAt(i);
    if (k === COLOR_ESCAPE) {
      out += text.substring(start, i);
      start = i + 4;
    }
    else if (k === COLOR_END) {
      out += text.substring(start, i);
      start = i + 1;
    }
  }
  if (start == 0) return text;
  out += text.substring(start);
  return out;
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
// text.isVowelish = isVowelish;
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
// Utils.arrayToString = arrayToString;
//

// Inserts line breaks into really long words. Optionally adds a hyphen, but doesn't do anything
// clever regarding hyphen placement. Plays nicely with color escapes.
export function hyphenate(msg, width, useHyphens) {
  let buf = ''; // char[COLS * ROWS * 2] = "";
  let i, m, nextChar, wordWidth;
  //const short maxLength = useHyphens ? width - 1 : width;

  // i iterates over characters in sourceText; m keeps track of the length of buf.
  wordWidth = 0;
  for (i=0; msg[i]; ) {
    if (msg.charCodeAt(i) === COLOR_ESCAPE) {
      buf += msg.substring(i, i + 4);
      i += 4;
    }
    else if (msg.charCodeAt(i) === COLOR_END) {
      buf += msg.substring(i, i + 1);
      i += 1;
    } else if (msg[i] === ' ' || msg[i] === '\n') {
      wordWidth = 0;
      buf += msg[i++];
    } else {
      if (!useHyphens && wordWidth >= width) {
        buf += '\n';
        wordWidth = 0;
      } else if (useHyphens && wordWidth >= width - 1) {
        nextChar = i+1;
        while (msg[nextChar] === COLOR_ESCAPE || msg[nextChar] === COLOR_END) {
          nextChar += (msg[nextChar] === COLOR_ESCAPE ? 4 : 1);
        }
        if (msg[nextChar] && msg[nextChar] !== ' ' && msg[nextChar] !== '\n') {
          buf += '-\n';
          wordWidth = 0;
        }
      }
      buf += msg[i++];
      wordWidth++;
    }
  }
  return buf;
}



// Returns the number of lines, including the newlines already in the text.
// Puts the output in "to" only if we receive a "to" -- can make it null and just get a line count.
export function splitIntoLines(sourceText, width, indent=0) {
  let w, textLength, lineCount;
  let spaceLeftOnLine, wordWidth;

  if (!width) Utils.ERROR('Need string and width');
  const firstWidth = width;
  width = width - indent;

  let printString = hyphenate(sourceText, Math.min(width, firstWidth), true); // break up any words that are wider than the width.
  textLength = printString.length; // do NOT remove escape sequences
  lineCount = 1;

  // Now go through and replace spaces with newlines as needed.

  // Fast foward until i points to the first character that is not a color escape.
  // for (i=0; printString.charCodeAt(i) == COLOR_ESCAPE; i+= 4);
  spaceLeftOnLine = firstWidth;

  const colors = [];

  let i = -1;
  let lastColor = '';
  let nextColor = null;
  let clearColor = false;
  let lineStart = 0;
  while (i < textLength) {
    // wordWidth counts the word width of the next word without color escapes.
    // w indicates the position of the space or newline or null terminator that terminates the word.
    wordWidth = 0;
    for (w = i + 1; w < textLength && printString[w] !== ' ' && printString[w] !== '\n';) {
      if (printString.charCodeAt(w) === COLOR_ESCAPE) {
        // colors.push(lastColor);
        // lastColor = printString.substring(w, w + 4);
        // nextColor = printString.substring(w, w + 4);
        // clearColor = false;
        w += 4;
      }
      else if (printString.charCodeAt(w) === COLOR_END) {
        // clearColor = true;
        // nextColor = null;
        // lastColor = colors.pop() || '';
        w += 1;
      }
      else {
        w++;
        wordWidth++;
      }
    }

    if (1 + wordWidth > spaceLeftOnLine || printString[i] === '\n') {

      for(let k = lineStart; k <= i; ++k) {
        if (printString.charCodeAt(k) === COLOR_ESCAPE) {
          colors.push(lastColor);
          lastColor = printString.substring(k, k + 4);
          k += 3;
        }
        else if (printString.charCodeAt(k) === COLOR_END) {
          lastColor = colors.pop() || '';
        }
      }

      // console.log('Add line - ', printString.substring(lineStart, i));
      // console.log(lastColor, colors);

      printString = splice(printString, i, 1, '\n' + lastColor);	// [i] = '\n';
      w += lastColor.length;
      textLength += lastColor.length;
      lineCount++;
      lineStart = i + lastColor.length;
      spaceLeftOnLine = width - wordWidth; // line width minus the width of the word we just wrapped
      //printf("\n\n%s", printString);
    } else {
      spaceLeftOnLine -= 1 + wordWidth;
    }

    // if (nextColor) {
    //   colors.push(lastColor);
    //   lastColor = nextColor;
    //   nextColor = null;
    // }
    // if (clearColor) {
    //   clearColor = false;
    //   lastColor = colors.pop() || '';
    // }

    i = w; // Advance to the terminator that follows the word.
  }

  return printString.split('\n');;
}



export function format(fmt, ...args) {

  const RE = /%([\-\+0\ \#]+)?(\d+|\*)?(\.\*|\.\d+)?([hLIw]|l{1,2}|I32|I64)?([cCdiouxXeEfgGaAnpsFBSZ%])/g;

  if (fmt instanceof GW.types.Color) {
    const buf = encodeColor(fmt) + args.shift();
    fmt = buf;
  }
  if (typeof fmt !== 'string') {
    fmt = '' + fmt;
  }

  let result = fmt.replace(RE, (m, p1, p2, p3, p4, p5, offset) => {

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
    else if (p5 == 'F') {
      let color = args.shift() || null;
      if (color && !(color instanceof GW.types.Color)) {
        color = Color.from(color);
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
    if (result.length) {
      result += ' ';
    }
    result = result + args.join(' ');
  }

  return result;
}



export function apply(template, args={}) {

  const RE = /#(\w+)#|##(?!#)|\$(\w+)\.?(\w+)?\$/g;

  let source = 'actor';
  let result = template.replace(RE, (match, color, first, second, offset) => {
    // console.log(m, p1, p2, p3, p4, offset);
    if (match === '##') {
      return encodeColor(null);
    }
    else if (color !== undefined) {
      if (GW.colors[color]) {
        color = GW.colors[color];
      }
      else if (args[color] !== undefined) {
        color = args[color];
      }
      return encodeColor(color);
    }
    else if (first) {
      if (first !== 'verb' && (args[first] !== undefined)) {
        // TODO - allow formatting e.g. $cost.2f$, $total.4d$
        const obj = args[first];
        if (obj.getName) {
          source = first;
          return obj.getName(false);  // no article
        }
        return '' + obj;
      }

      if (first == 'you') {
        first = 'the';
        second = second || 'actor';
      }
      source = second || source;
      const sourceObj = args[source] || GW.data[source] || {};
      if (first == 'the') {
        if (sourceObj.getName) return sourceObj.getName('the');
      }
      else if (first == 'a' || first == 'an') {
        if (sourceObj.getName) return sourceObj.getName('a');
      }
      else if (first == 'verb') {
        first = args.verb || first;
      }
      else if (['him', 'her', 'he', 'she', 'it', 'his', 'hers', 'its', 'your'].includes(first) ) {
        if (sourceObj.getPronoun) return sourceObj.getPronoun(first);
      }

      if (sourceObj.getVerb) return sourceObj.getVerb(first);
    }
    return match;
  });

  return result;
}
