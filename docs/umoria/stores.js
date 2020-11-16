

var STORES = {};

const storeFG = GW.colors.green;
const storeBG = GW.tiles.DOOR.sprite.bg;

GW.config.store = {
    MAX_AUTO_BUY_ITEMS: 18,  // Max diff objects in stock for auto buy
    MIN_AUTO_SELL_ITEMS: 10, // Min diff objects in stock for auto sell
    STOCK_TURN_AROUND: 9,    // Amount of buying and selling normally
    MAINTENANCE_SPEED: 1000 * 100,  // update stock every 1000 turns
};


function makeOwner(opts={}) {
  if (arguments.length > 1 || (typeof arguments[0] === 'string')) {
    opts = [].slice.call(arguments);
  }
  return {
    name:       opts.name       || opts[0] || 'The Merchant',
    maxCost:    opts.maxCost    || opts[1] || 1000000,
    maxInflate: opts.maxInflate || opts[2] || 100,
    minInflate: opts.minInflate || opts[3] || 100,
    hagglesPer: opts.hagglesPer || opts[4] || 0,
    kind:       opts.kind       || opts[5] || 'HUMAN',
    maxInsults: opts.maxInsults || opts[6] || 1000,
  };
}

class Store {
  constructor(opts={}) {
    this.id = opts.id || 'STORE';
    this.name = opts.name || 'The General Store';

    if (Array.isArray(opts.owner)) {
      this.owner = GW.random.item(opts.owner);
    }
    else {
      this.owner = opts.owner || makeOwner();
    }

    this.ch = opts.ch || GW.tiles.DOOR.sprite.ch;
    this.fg = storeFG;
    this.bg = storeBG;

    this.items = null;
    this.gold = 100;
    this.turnsLeftBeforeClosing = 0;
    this.insultsCounter = 0;
    this.uniqueItemsCounter = 0;
    this.goodPurchases = 0;
    this.badPurchases = 0;

    this.welcome = this.owner.name + ' welcomes you to ' + this.name + '!';
    this.updateTime = opts.turns || GW.config.store.MAINTENANCE_SPEED;
  }

  getName() {
    return this.name;
  }

  itemCost(item) {
    const base = item.stats.cost || 1;
    const qty = item.quantity || 1;
    return base * qty;
  }

  update() {
    console.log('Update Store', this.id);
    const count = GW.utils.chainLength(this.items);
    if (count >= GW.config.store.MIN_AUTO_SELL_ITEMS) {
        let turnaround = GW.random.number(GW.config.store.STOCK_TURN_AROUND);
        if (count >= GW.config.store.MAX_AUTO_BUY_ITEMS) {
            turnaround += 1 + count - GW.config.store.MAX_AUTO_BUY_ITEMS;
        }
        while (--turnaround >= 0) {
            this.deleteStockItem();
        }
    }

    if (count <= GW.config.store.MAX_AUTO_BUY_ITEMS) {
        let turnaround = GW.random.number(GW.config.store.STOCK_TURN_AROUND);
        if (count < GW.config.store.MIN_AUTO_SELL_ITEMS) {
            turnaround += GW.config.store.MIN_AUTO_SELL_ITEMS - count;
        }

        while (--turnaround >= 0) {
            this.stockNewItem();
        }
    }

    return this.updateTime;
  }

  deleteStockItem() {
    let count = GW.utils.chainLength(this.items);
    if (!count) return;
    let index = GW.random.number(count);
    let item = this.items;
    while(index && item) {
      index--;
      item = item.next;
    }
    count = 1;
    if (item.kind.flags & GW.flags.itemKind.IK_STACKABLE) {
      count += GW.random.number(item.quantity);
    }
    item.quantity -= count;

    if (item.quantity < 1) {
      GW.utils.removeFromChain(this, 'items', item);
    }
  }

  stockNewItem() {
    let maxCost = this.owner.maxCost;
    const choices = Object.values(GW.itemKinds).filter((k) => k.store == this.id);
    if (!choices.length) return false;

    const level = GW.data.player ? (GW.data.player.data.maxDepth || 0) : 0;

    for(let tries = 0; tries < 5; ++tries) {
      const kind = GW.random.item(choices);
      const item = GW.make.item(kind, { level });
      const cost = this.itemCost(item);
      if (cost > 0 && cost < maxCost) {
        this.addToItems(item);
        return true;
      }
    }
    return false;
  }

  addToItems(item) {
    if (item.kind.flags & GW.flags.itemKind.IK_STACKABLE) {
      let current = this.items;
      while(current) {
        if (current.kind === item.kind) {
          current.quantity += item.quantity;
          item.quantity = 0;
          item.destroy();
          return true;
        }
        current = current.next;
      }
    }

    // Limits to inventory length?
    // if too many items - return false

    if (GW.utils.addToChain(this, 'items', item)) {
      return true;
    }
    return false;
  }
}

GW.types.Store = Store;

function makeStore(opts={}) {
  return new Store(opts);
}

GW.make.store = makeStore;


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


GW.message.addKind('STORE_WELCOME', '#green#Welcome to $store$!');

async function enterStore(id, ctx) {
  GW.message.add('STORE_WELCOME', { store: this, actor: ctx.actor });

  let mode = 0;
  while(mode >=0) {
    if (mode == 0) {
      mode = await showStoreInventory(this, ctx.actor);
    }
    else if (mode == 1) {
      mode = await showPlayerInventory(this, ctx.actor);
    }
  }
  return true;
}


async function showStoreInventory(store, actor) {

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
  store.update();

  STORES[id] = store;
  return store;
}

function registerStores() {
  for(let id in STORES) {
    const store = STORES[id];
    GW.scheduler.push(store.update.bind(store), GW.random.number(store.updateTime));
  }
}

GW.on('START_MAP', registerStores);


// Store owners have different characteristics for pricing and haggling
// Note: Store owners should be added in groups, one for each store
const GENERAL_STORE_OWNERS = [
    ["Erick the Honest",          250, 175, 108, 4, 'HUMAN', 12],
    ["Andy the Friendly",         200, 170, 108, 5, 'HALFLING', 15],
    ["Lyar-el the Comely",        300, 165, 107, 6, 'ELF', 18],
].map( (d) => makeOwner(...d) );

const ARMOR_STORE_OWNERS = [
    ["Mauglin the Grumpy",      32000, 200, 112, 4, 'DWARF',  5],
    ["Darg-Low the Grim",       10000, 190, 111, 4, 'HUMAN',  9],
    ["Mauglim the Horrible",     3000, 200, 113, 5, 'HALF_ORC',  9],
].map( (d) => makeOwner(...d) );

const WEAPON_STORE_OWNERS = [
    ["Arndal Beast-Slayer",     10000, 185, 110, 5, 'HALF_ELF',  8],
    ["Oglign Dragon-Slayer",    32000, 195, 112, 4, 'DWARF',  8],
    ["Ithyl-Mak the Beastly",    3000, 210, 115, 6, 'HALF_TROLL',  8],
].map( (d) => makeOwner(...d) );

const ALCHEMY_STORE_OWNERS = [
    ["Hardblow the Humble",      3500, 175, 109, 6, 'HUMAN', 15],
    ["Gunnar the Paladin",       5000, 185, 110, 5, 'HUMAN', 23],
    ["Delilah the Pure",        25000, 180, 107, 6, 'HALF_ELF', 20],
].map( (d) => makeOwner(...d) );

const MAGIC_STORE_OWNERS = [
    ["Ga-nat the Greedy",       12000, 220, 115, 4, 'GNOME',  9],
    ["Mauser the Chemist",      10000, 190, 111, 5, 'HALF_ELF',  8],
    ["Wizzle the Chaotic",      10000, 190, 110, 6, 'HALFLING',  8],
].map( (d) => makeOwner(...d) );

const JEWELRY_STORE_OWNERS = [
    ["Valeria Starshine",       32000, 175, 110, 5, 'ELF', 11],
    ["Gopher the Great!",       20000, 215, 113, 6, 'GNOME', 10],
    ["Inglorian the Mage",      32000, 200, 110, 7, 'HUMAN', 10],
].map( (d) => makeOwner(...d) );



addStore('STORE_GENERAL', { owner: GENERAL_STORE_OWNERS, name: 'The General', ch: '1' });
addStore('STORE_ARMOR',   { owner: ARMOR_STORE_OWNERS, name: 'The Armoury', ch: '2' });
addStore('STORE_WEAPONS', { owner: WEAPON_STORE_OWNERS, name: 'Weaponsmith', ch: '3' });
addStore('STORE_JEWELRY', { owner: JEWELRY_STORE_OWNERS, name: 'The Gemmist', ch: '4' });
addStore('STORE_ALCHEMY', { owner: ALCHEMY_STORE_OWNERS, name: 'The Alchemist', ch: '5' });
addStore('STORE_MAGIC',   { owner: MAGIC_STORE_OWNERS, name: 'The Magician', ch: '6' });
