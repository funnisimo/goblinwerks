

var STORES = {};

const storeFG = GW.colors.green;
const storeBG = GW.tiles.DOOR.sprite.bg;

GW.config.store = {
    MAX_AUTO_BUY_ITEMS: 18,  // Max diff objects in stock for auto buy
    MIN_AUTO_SELL_ITEMS: 10, // Min diff objects in stock for auto sell
    STOCK_TURN_AROUND: 9,    // Amount of buying and selling normally
    MAINTENANCE_SPEED: 1000 * 100,  // update stock every 1000 turns
    MAX_ITEMS: 26,
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
    return base;
  }

  itemSellInfo(item, actor) {
    let price = this.itemCost(item);

    // check `item.cost` in case it is cursed, check `price` in case it is damaged
    // don't let the item get into the store inventory
    if (price < 1) {
        return 0;
    }

    const owner = this.owner;
    // const basePrice = price;
    //
    // price = Math.round(price * race_gold_adjustments[owner.race][PLAYER.misc.race_id] / 100);
    // if (price < 1) {
    //     price = 1;
    // }

    price = Math.floor(price * actor.kind.chrBonus(actor) / 100);

    let max_price = Math.round(price * owner.maxInflate / 100);
    let min_price = Math.round(price * owner.minInflate / 100);

    if (min_price > max_price) {
        min_price = max_price;
    }

    price = max_price;

    // const buf = STRING();
    // itemName(item, buf, false, false, NULL);
    // GW.debug.log('Store Sell Price', buf, 'base = ', basePrice, 'min = ', min_price, 'max = ', max_price, 'price = ', price);

    return {
      price,
      max: max_price,
      min: min_price,
    };
  }

  itemBuyInfo(item, actor) {
    let price = this.itemCost(item);

    // check `item.cost` in case it is cursed, check `price` in case it is damaged
    // don't let the item get into the store inventory
    if (price < 1) {
        return { price: 0, min: 0, max: 0 };
    }

    const owner = this.owner;
    // const basePrice = price;
    //
    // price = Math.round(price * race_gold_adjustments[owner.race][PLAYER.misc.race_id] / 100);
    // if (price < 1) {
    //     price = 1;
    // }

    price = Math.floor(price * 50 / actor.kind.chrBonus(actor));

    let max_price = Math.round(price * owner.maxInflate / 100);
    let min_price = Math.round(price * owner.minInflate / 100);

    if (min_price > max_price) {
        min_price = max_price;
    }

    price = min_price;

    // const buf = STRING();
    // itemName(item, buf, false, false, NULL);
    // GW.debug.log('Store Sell Price', buf, 'base = ', basePrice, 'min = ', min_price, 'max = ', max_price, 'price = ', price);

    return {
      price,
      max: max_price,
      min: min_price,
    };
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
    if (item.quantity > 1) {
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
      if (cost > 0 && cost < maxCost && this.itemWillFit(item)) {
        this.addToItems(item);
        return true;
      }
    }
    return false;
  }

  addToItems(item) {
    if (item.isStackable()) {
      let current = this.items;
      while(current) {
        if (item.willStackInto(current)) {
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

  itemWillFit(item, quantity) {
    quantity = quantity || item.quantity || 1;
    let count = 0;
    GW.utils.eachChain(this.items, (inventory) => {
      count += inventory.inventoryCount();
    });

    if (count < GW.config.store.MAX_ITEMS) return true;

    if (item.isStackable()) {
      let current = this.items;
      while(current) {
        if (item.willStackInto(current, quantity)) {
          return true;
        }
        current = current.next;
      }
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


GW.message.addKind('STORE_WELCOME', 'Ωdark_greenΩYou shopped at §the store§.');

async function enterStore(event, ctx) {
  GW.message.add('STORE_WELCOME', { store: this, actor: ctx.actor });

  const buffer = GW.ui.startDialog();

  let mode = 0;
  while(mode >= 0) {
    if (mode == 0) {
      mode = await showStoreInventory(buffer, this, ctx.actor);
    }
    else if (mode == 1) {
      mode = await showPlayerInventory(buffer, this, ctx.actor);
    }
  }

  GW.ui.finishDialog();

  return true;
}


async function showStoreInventory(buffer, store, actor) {

  const x = 5;

  const table = GW.make.table({
    letters: true,  // start row with letter for the row
    headers: true,  // show a header on top of each column
    selectedColor: 'teal',
    disabledColor: 'black',
    color: 'white',
    selected: 0,
  })
  .column('Qty', '§count%3d§')
  .column('Item', '§name%-30s§')
  .column(' Each', '§price%5d§ GP');

  const data = [];
  GW.utils.eachChain(store.items, (item) => {
    const priceInfo = store.itemSellInfo(item, actor);
    const disabled = (actor.current.gold < priceInfo.price);
    data.push({ count: item.quantity, name: item.getName({ color: false, article: false }), price: priceInfo.price, disabled, item });
  });


  let y = 0;
  let running = true;
  let result = -1; // done with store
  let canBuy;
  while(running) {
    buffer.blackOut();

    const text = GW.text.apply('ΩyellowΩWelcome to §store§!', { store });
    const len = GW.text.length(text);
    const tx = Math.floor((buffer.width - len)/2);
    buffer.drawText(tx, 1, text);

    // buffer.drawText(x, 3, 'Items For Sale');

    const hc = ['green', 'teal'];
    buffer.drawText(x, 32, 'Press ΩgreenΩ<a-z, UP, DOWN>∆ to select a good.');
    buffer.drawText(x, 33, `Press Ω${hc[+(y==33)]}Ω<Enter>∆ to buy 1.`);
    buffer.drawText(x, 34, `Press Ω${hc[+(y==34)]}Ω<ENTER>∆ to buy max of the good.`);
    buffer.drawText(x, 35, `Press Ω${hc[+(y==35)]}Ω<S>∆ to see your pack.`);
    buffer.drawText(x, 36, `Press Ω${hc[+(y==36)]}Ω<Escape>∆ to leave the store.`);

    canBuy = false;
    if (!store.items) {
      buffer.drawText(x, 4, 'The store is empty.', GW.colors.yellow);
    }
    else {
      table.draw(buffer, x, 4, data);

      const selectedData = data[table.active];
      if (selectedData) {
        // Need to do details
        const startX = x + table.width + 5;
        const width = buffer.width - startX - 5;

        buffer.drawText(startX, 5, `You have ΩgoldΩ${actor.current.gold}∆ gold.`);
        let nextY = buffer.wrapText(startX, 7, width, selectedData.item.kind.description, [100,100,30]);

        if (selectedData.price > actor.current.gold) {
          nextY = buffer.wrapText(startX, nextY + 1, width, 'You do not have enough gold to buy this item.', GW.colors.red);
        }
        else if (!actor.itemWillFitInPack(selectedData.item)) {
          nextY = buffer.wrapText(startX, nextY + 1, width, 'You do not have enough room in your pack to buy this item.', GW.colors.red);
        }
        else {
          nextY = buffer.wrapText(startX, nextY + 1, width, GW.text.apply('Press ΩgreenΩ<Enter>∆ to buy.'));
          canBuy = true;
        }

      }
    }

    buffer.render();

    await table.loop({
      Escape() {
        running = false;
        result = -1;
        return true;  // stop io.loop
      },
      async Enter() {
        if (!canBuy) return false;
        // DO A BUY!
        const item = data[table.active].item;
        console.log('BUY!', item.getName('a'));
        if (await sellItemToPlayer(buffer, store, item, actor)) {
          running = false;
          result = 0; // come back to this screen
        }
        return true;
      },
      S() {
        running = false;
        result = 1;
        return true;
      },
    });

  }

  return result;
}


GW.message.addKind('STORE_BUY', '§you§ §bought§ §quantity§ §item§ for §cost§ gold.');
GW.message.addKind('STORE_BUY_THANKS', 'Thank you for purchasing §quantity§ §item§ for §cost§ gold.');
GW.message.addKind('STORE_PROMPT_QTY', 'Buy how many? (1-§quantity§)');
GW.message.addKind('STORE_NO_FIT', 'That many will not fit in your pack.');


async function sellItemToPlayer(buffer, store, item, actor) {

  const priceInfo = store.itemSellInfo(item, actor);

  let quantity = 1;
  if (item.quantity > 1 && item.isStackable()) {
    const canAfford = Math.floor(actor.current.gold/priceInfo.price);
    quantity = Math.min(item.quantity, canAfford);
    if (quantity < 1) {
      return false;
    }
  }

  if (quantity > 1) {
    // Get how many...
    quantity = await GW.ui.inputNumberBox({ min: 1, max: quantity, bg: 'darker_gray' }, 'STORE_PROMPT_QTY', { quantity, actor, item });
    if (quantity <= 0 || isNaN(quantity)) return false; // canceled, none
  }

  // TODO - Make this obsolete by getting # that will fit ahead of time when we figure out canAfford
  if (!actor.itemWillFitInPack(item, quantity)) {
    await GW.ui.confirm({ allowCancel: false }, 'STORE_NO_FIT', { actor, item });
    return false;
  }

  let packItem = item;
  if (quantity < item.quantity) {
    packItem = item.split(quantity);
  }
  else {
    GW.utils.removeFromChain(store, 'items', item);
  }

  actor.addToPack(packItem);
  actor.current.gold -= (quantity * priceInfo.price);
  const ctx = { actor, item: packItem, cost: (quantity * priceInfo.price), quantity };
  GW.message.add('STORE_BUY', ctx);
  await GW.ui.confirm({ allowCancel: false, bg: 'darker_gray' }, 'STORE_BUY_THANKS', ctx);

  return true;
}




async function showPlayerInventory(buffer, store, actor) {

  const x = 5;

  const table = GW.make.table({
    letters: true,  // start row with letter for the row
    headers: true,  // show a header on top of each column
    selectedColor: 'teal',
    disabledColor: 'black',
    color: 'white',
    selected: 0,
  })
  .column('Qty', '§count%3d§')
  .column('Item', '§name%-30s§')
  .column(' Each', '§price%5d§ GP');

  const data = [];
  GW.utils.eachChain(actor.pack, (item) => {
    const priceInfo = store.itemBuyInfo(item, actor);
    const disabled = (store.gold < priceInfo.price);
    data.push({ count: item.quantity, name: item.getName({ color: false, article: false }), price: priceInfo.price, disabled, item });
  });

  let running = true;
  let result = -1; // done with store
  let canBuy;
  while(running) {
    buffer.blackOut();

    const text = GW.text.apply('ΩyellowΩWelcome to §store§!', { store });
    const len = GW.text.length(text);
    const tx = Math.floor((buffer.width - len)/2);
    buffer.drawText(tx, 1, text);

    // buffer.drawText(x, 3, 'Items For Sale');

    const hc = ['green', 'teal'];
    buffer.drawText(x, 32, 'Press ΩgreenΩ<a-z, UP, DOWN>∆ to select a good.');
    buffer.drawText(x, 33, `Press Ω${hc[+(y==33)]}Ω<Enter>∆ to sell 1.`);
    buffer.drawText(x, 34, `Press Ω${hc[+(y==34)]}Ω<ENTER>∆ to sell all of the good.`);
    buffer.drawText(x, 35, `Press Ω${hc[+(y==35)]}Ω<B>∆ to see the store inventory.`);
    buffer.drawText(x, 36, `Press Ω${hc[+(y==36)]}Ω<Escape>∆ to leave the store.`);

    canBuy = false;
    if (!data.length) {
      buffer.drawText(x, 4, 'Your pack is empty.', GW.colors.yellow);
    }
    else {
      table.draw(buffer, x, 4, data);

      const selectedData = data[table.active];
      if (selectedData) {
        // Need to do details
        const startX = x + table.width + 5;
        const width = buffer.width - startX - 5;

        // buffer.drawText(startX, 5, `You have ΩgoldΩ${actor.current.gold}∆ gold.`);
        let nextY = buffer.wrapText(startX, 7, width, selectedData.item.kind.description, [100,100,30]);

        if (selectedData.price > store.gold) {
          nextY = buffer.wrapText(startX, nextY + 1, width, 'I do not have enough gold to buy this item.', GW.colors.red);
        }
        else if (!store.itemWillFit(selectedData.item)) {
          nextY = buffer.wrapText(startX, nextY + 1, width, 'I do not have enough room in the store to buy this item.', GW.colors.red);
        }
        else {
          nextY = buffer.wrapText(startX, nextY + 1, width, GW.text.apply('Press ΩgreenΩ<Enter>∆ to sell.'));
          canBuy = true;
        }

      }
    }

    buffer.render();

    await GW.io.loop({
      Escape() {
        running = false;
        result = -1;
        return true;  // stop io.loop
      },
      B() {
        running = false;
        result = 0; // return to buy screen
        return true;
      },
      async Enter() {
        if (!canBuy) return false;
        // DO A BUY!
        const item = data[table.active].item;
        console.log('SELL!', item.getName('a'));
        if (await buyItemFromPlayer(buffer, store, item, actor)) {
          running = false;
          result = 1; // come back to this screen
        }
        return true;
      },
      dir(ev) {
        if(ev.dir[1] < 0) {
          table.active = (data.length + table.active - 1) % data.length;
        }
        else if (ev.dir[1] > 0) {
          table.active = (table.active + 1) % data.length;
        }
        return true;
      },
      keypress(ev) {
        const index = ev.key.charCodeAt(0) - 97;
        if (index >= 0 && index < data.length) {
          table.active = index;
          return true;
        }
        return false;
      }
    });

    console.log('loop');
  }

  return result;
}



GW.message.addKind('STORE_SELL', '§you§ §sold§ §quantity§ §item§ for §cost§ gold.');
GW.message.addKind('STORE_SELL_THANKS', 'Thank you selling me §quantity§ §item§ for §cost§ gold.');
GW.message.addKind('STORE_SELL_PROMPT_QTY', 'Sell how many? (1-§quantity§)');
GW.message.addKind('STORE_SELL_NO_FIT', 'That many will not fit in the store.');


async function buyItemFromPlayer(buffer, store, item, actor) {

  const priceInfo = store.itemBuyInfo(item, actor);

  let quantity = 1;
  if (item.quantity > 1 && item.isStackable()) {
    const canAfford = Math.floor(store.gold/priceInfo.price);
    quantity = Math.min(item.quantity, canAfford);
    if (quantity < 1) {
      return false;
    }
  }

  if (quantity > 1) {
    // Get how many...
    quantity = await GW.ui.inputNumberBox({ min: 1, max: quantity, bg: 'darker_gray' }, 'STORE_SELL_PROMPT_QTY', { quantity, actor, item });
    if (quantity <= 0 || isNaN(quantity)) return false; // canceled, none
  }

  // TODO - Make this obsolete by getting # that will fit ahead of time when we figure out canAfford
  if (!store.itemWillFit(item, quantity)) {
    await GW.ui.confirm({ allowCancel: false }, 'STORE_SELL_NO_FIT', { actor, item });
    return false;
  }

  let packItem = item;
  if (quantity < item.quantity) {
    packItem = item.split(quantity);
  }
  else {
    GW.utils.removeFromChain(actor, 'pack', item);
  }

  store.addToItems(packItem);
  store.gold -= (quantity * priceInfo.price);
  const ctx = { actor, item: packItem, cost: (quantity * priceInfo.price), quantity };
  GW.message.add('STORE_SELL', ctx);
  await GW.ui.confirm({ allowCancel: false, bg: 'darker_gray' }, 'STORE_SELL_THANKS', ctx);

  return true;
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

registerStores();


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
