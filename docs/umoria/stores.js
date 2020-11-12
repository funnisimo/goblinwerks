

var STORES = {};

const storeFG = GW.colors.green;
const storeBG = GW.tiles.DOOR.sprite.bg;


function makeOwner(opts={}) {
  if (arguments.length > 1 || (typeof arguments[0] === 'string')) {
    opts = [].slice.call(arguments);
  }
  return {
    name:       opts.name       || opts[0] || 'The Merchant',
    maxCost:    opts.maxCost    || opts[1] || 100,
    maxInflate: opts.maxInflate || opts[2] || 200,
    minInflate: opts.minInflate || opts[3] || 100,
    hagglesPer: opts.hagglesPer || opts[4] || 5,
    race:       opts.race       || opts[5] || 'HUMAN',
    maxInsults: opts.maxInsults || opts[6] || 10,
  };
}

function makeStore(opts={}) {
  const store = {};

  store.id = opts.id || 'STORE';
  store.name = opts.name || 'The General Store';

  if (Array.isArray(opts.owner)) {
    store.owner = GW.random.item(opts.owner);
  }
  else {
    store.owner = opts.owner || makeOwner();
  }

  store.ch = opts.ch || GW.tiles.DOOR.sprite.ch;
  store.fg = storeFG;
  store.bg = storeBG;

  store.items = null;
  store.gold = 100;
  store.turnsLeftBeforeClosing = 0;
  store.insultsCounter = 0;
  store.uniqueItemsCounter = 0;
  store.goodPurchases = 0;
  store.badPurchases = 0;

  store.welcome = store.owner.name + ' welcomes you to ' + store.name + '!';

  return store;
}



const STORE_SALE_ACCEPTED = [    // char *[14] = {
    "Done!",
    "Accepted!",
    "Fine.",
    "Agreed!",
    "Ok.",
    "Taken!",
    "You drive a hard bargain, but taken.",
    "You'll force me bankrupt, but it's a deal.",
    "Sigh.  I'll take it.",
    "My poor sick children may starve, but done!",
    "Finally!  I accept.",
    "Robbed again.",
    "A pleasure to do business with you!",
    "My spouse will skin me, but accepted.",
];

const STORE_SELLING_HAGGLE_FINAL = [ // char *[3] = {
    "$OFFER is my final offer; take it or leave it.",
    "I'll give you no more than $OFFER.",
    "My patience grows thin.  $OFFER is final.",
];

const STORE_SELLING_HAGGLE = [   // char *[16] = {
    "$BID for such a fine item?  HA!  No less than $OFFER.",
    "$BID is an insult!  Try $OFFER gold pieces.",
    "$BID?!?  You would rob my poor starving children?",
    "Why, I'll take no less than $OFFER gold pieces.",
    "Ha!  No less than $OFFER gold pieces.",
    "Thou knave!  No less than $OFFER gold pieces.",
    "$BID is far too little, how about $OFFER?",
    "I paid more than $BID for it myself, try $OFFER.",
    "$BID?  Are you mad?!?  How about $OFFER gold pieces?",
    "As scrap this would bring $BID.  Try $OFFER in gold.",
    "May the fleas of 1000 Orcs molest you.  I want $OFFER.",
    "My mother you can get for $BID, this costs $OFFER.",
    "May your chickens grow lips.  I want $OFFER in gold!",
    "Sell this for such a pittance?  Give me $OFFER gold.",
    "May the Balrog find you tasty!  $OFFER gold pieces?",
    "Your mother was a Troll!  $OFFER or I'll tell.",
];

const STORE_BUYING_HAGGLE_FINAL = [  // char *[3] = {
    "I'll pay no more than $BID; take it or leave it.",
    "You'll get no more than $BID from me.",
    "$BID and that's final.",
];

const STORE_BUYING_HAGGLE = [ // char *[15] = {
    "$OFFER for that piece of junk?  No more than $BID.",
    "For $OFFER I could own ten of those.  Try $BID.",
    "$OFFER?  NEVER!  $BID is more like it.",
    "Let's be reasonable. How about $BID gold pieces?",
    "$BID gold for that junk, no more.",
    "$BID gold pieces and be thankful for it!",
    "$BID gold pieces and not a copper more.",
    "$OFFER gold?  HA!  $BID is more like it.",
    "Try about $BID gold.",
    "I wouldn't pay $OFFER for your children, try $BID.",
    "*CHOKE* For that!?  Let's say $BID.",
    "How about $BID?",
    "That looks war surplus!  Say $BID gold.",
    "I'll buy it as scrap for $BID.",
    "$OFFER is too much, let us say $BID gold.",
];

const STORE_INSULTED_HAGGLING_DONE = [ // char *[5] = {
    "ENOUGH!  You have abused me once too often!",
    "THAT DOES IT!  You shall waste my time no more!",
    "This is getting nowhere.  I'm going home!",
    "BAH!  No more shall you insult me!",
    "Begone!  I have had enough abuse for one day.",
];

const STORE_GET_OUT_OF_MY_STORE = [ // char *[5] = {
    "Out of my place!", "out... Out... OUT!!!",
    "Come back tomorrow.", "Leave my place.  Begone!",
    "Come back when thou art richer.",
];

const STORE_HAGGLING_TRY_AGAIN = [ // char *[10] = {
    "You will have to do better than that!",
    "That's an insult!",
    "Do you wish to do business or not?",
    "Hah!  Try again.",
    "Ridiculous!",
    "You've got to be kidding!",
    "You'd better be kidding!",
    "You try my patience.",
    "I don't hear you.",
    "Hmmm, nice weather we're having.",
];

const STORE_SORRY = [  // char *[5] = {
    "I must have heard you wrong.", "What was that?",
    "I'm sorry, say that again.", "What did you say?",
    "Sorry, what was that again?",
];



async function enterStore(id, ...args) {
  GW.message.add(GW.colors.green, 'Welcome to the %s!', this.name);
}



function addStore(id, opts={}) {

  opts.id = id;
  const store = makeStore(opts);

  store.tile = id;
  store.event = 'ENTER_' + id;
  GW.tile.addKind(id, {
    sprite: store,
    name: store.name, article: false,
    flags: 'T_IS_DOOR, T_OBSTRUCTS_TILE_EFFECTS, T_OBSTRUCTS_ITEMS, T_OBSTRUCTS_VISION, TM_VISUALLY_DISTINCT, TM_LIST_IN_SIDEBAR',
    events: {
      playerEnter: { emit: store.event }
    }
  });

  GW.on(store.event, enterStore, store);

  STORES[id] = store;
  return store;
}



// Store owners have different characteristics for pricing and haggling
// Note: Store owners should be added in groups, one for each store
const GENERAL_STORE_OWNERS = [  // Owner_t[MAX_OWNERS] = {
    ["Erick the Honest",          250, 175, 108, 4, 0, 12],
    ["Andy the Friendly",         200, 170, 108, 5, 3, 15],
    ["Lyar-el the Comely",        300, 165, 107, 6, 2, 18],
].map( (d) => makeOwner(...d) );

const ARMOR_STORE_OWNERS = [
    ["Mauglin the Grumpy",      32000, 200, 112, 4, 5,  5],
    ["Darg-Low the Grim",       10000, 190, 111, 4, 0,  9],
    ["Mauglim the Horrible",     3000, 200, 113, 5, 6,  9],
].map( (d) => makeOwner(...d) );

const WEAPON_STORE_OWNERS = [
    ["Arndal Beast-Slayer",     10000, 185, 110, 5, 1,  8],
    ["Oglign Dragon-Slayer",    32000, 195, 112, 4, 5,  8],
    ["Ithyl-Mak the Beastly",    3000, 210, 115, 6, 7,  8],
].map( (d) => makeOwner(...d) );

const ALCHEMY_STORE_OWNERS = [
    ["Hardblow the Humble",      3500, 175, 109, 6, 0, 15],
    ["Gunnar the Paladin",       5000, 185, 110, 5, 0, 23],
    ["Delilah the Pure",        25000, 180, 107, 6, 1, 20],
].map( (d) => makeOwner(...d) );

const MAGIC_STORE_OWNERS = [
    ["Ga-nat the Greedy",       12000, 220, 115, 4, 4,  9],
    ["Mauser the Chemist",      10000, 190, 111, 5, 1,  8],
    ["Wizzle the Chaotic",      10000, 190, 110, 6, 3,  8],
].map( (d) => makeOwner(...d) );

const JEWELRY_STORE_OWNERS = [
    ["Valeria Starshine",       32000, 175, 110, 5, 2, 11],
    ["Gopher the Great!",       20000, 215, 113, 6, 4, 10],
    ["Inglorian the Mage",      32000, 200, 110, 7, 0, 10],
].map( (d) => makeOwner(...d) );



addStore('STORE_GENERAL', { owner: GENERAL_STORE_OWNERS, name: 'The General', ch: '1' });
addStore('STORE_ARMOR',   { owner: ARMOR_STORE_OWNERS, name: 'The Armoury', ch: '2' });
addStore('STORE_WEAPONS', { owner: WEAPON_STORE_OWNERS, name: 'Weaponsmith', ch: '3' });
addStore('STORE_JEWELRY', { owner: JEWELRY_STORE_OWNERS, name: 'The Gemmist', ch: '4' });
addStore('STORE_ALCHEMY', { owner: ALCHEMY_STORE_OWNERS, name: 'The Alchemist', ch: '5' });
addStore('STORE_MAGIC',   { owner: MAGIC_STORE_OWNERS, name: 'The Magician', ch: '6' });
