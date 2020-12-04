
import * as Color from './color.js';
import * as TEXT from 'gw-text';


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

  return spliceRaw(noun, wordStart, place - wordStart + 1, newWord);
}


export function spliceRaw(msg, begin, length, add='') {
  const preText = msg.substring(0, begin);
  const postText = msg.substring(begin + length);
  return preText + add + postText;
}


// Returns the number of lines, including the newlines already in the text.
// Puts the output in "to" only if we receive a "to" -- can make it null and just get a line count.
export function splitIntoLines(sourceText, width, indent=0) {

  const CS = TEXT.options.colorStart;
  const output = [];
  let text = TEXT.wordWrap(sourceText, width, indent);

  let start = 0;
  let fg0 = null;
  let bg0 = null;
  TEXT.eachChar(text, (ch, fg, bg, i, n) => {
    if (ch == '\n') {
      let color = (fg0 || bg0) ? `${CS}${fg0 ? fg0 : ''}${bg0 ? '|' + bg0 : ''}${CS}` : '';
      output.push(color + text.substring(start, n));
      start = n + 1;
      fg0 = fg;
      bg0 = bg;
    }
  });

  let color = (fg0 || bg0) ? `${CS}${fg0 ? fg0 : ''}${bg0 ? '|' + bg0 : ''}${CS}` : '';
  output.push(color + text.substring(start));

  return output;
}

TEXT.addHelper('you', (name, args, value) => {
  const actor = value || args._last || args.actor;
  args._last = actor;
  if (!actor || !actor.getName) return name;
  return actor.getName('the');
});

function nameHelper(name, args, value) {
  const actor = value || args._last || args.actor;
  args._last = actor;
  if (!actor || !actor.getName) return name;
  return actor.getName(name);
}

TEXT.addHelper('the', nameHelper);
TEXT.addHelper('a', nameHelper);

function pronounHelper(name, args, value) {
  const actor = value || args._last || args.actor;
  args._last = actor;
  if (!actor || !actor.getPronoun) return name;
  return actor.getPronoun(name);
}

TEXT.addHelper('it', pronounHelper);
TEXT.addHelper('your', pronounHelper);

// lookup verb
TEXT.addHelper('verb', (name, args, value) => {
  const actor = value || args._last || args.actor;
  args._last = actor;
  if (!args.verb) return '!!args.verb!!';
  if (!actor || !actor.getVerb) return args.verb;
  return actor.getVerb(args.verb);
});

// default - verbs
TEXT.addHelper('default', (name, args, value) => {
  const actor = value || args._last || args.actor;
  args._last = actor;
  if (!actor || !actor.getVerb) return name;
  return actor.getVerb(name);
});

export function apply(template, args={}) {
  const fn = TEXT.compile(template);
  const result = fn(args);
  return result;
}

TEXT.addHelper('eachColor', (ctx) => {
  if (ctx.fg) { ctx.fg = Color.from(ctx.fg); }
  if (ctx.bg) { ctx.bg = Color.from(ctx.bg); }
});

export {
  firstChar,
  eachChar,
  length,
  center,
  capitalize,
  removeColors,
  wordWrap,
  compile,
} from 'gw-text';
