

GW.message.addKind('FOOD_NOT_HUNGRY', '$you$ $are$ not hungry.');
GW.message.addKind('FOOD_EAT', '$you$ $verb$ $the.item$');
GW.message.addKind('FOOD_FULL', '$you$ $are$ full');


class Food extends GW.types.ItemKind {
  constructor(opts={}) {
    GW.utils.kindDefaults(opts, {
      'stats.food': 1,
      ch: '', fg: 'itemColor',
      frequency: 0,
      verb: 'eat',
    });
    super(opts);
    this.flags |= GW.flags.itemKind.IK_DESTROY_ON_USE;
  }

  use(item, actor, ctx={}) {
    if (!actor.isPlayer()) return false;
    if (actor.current.food >= actor.max.food) {
      GW.message.add('FOOD_NOT_HUNGRY', { actor, item });
      return false;
    }
    GW.message.addCombat('FOOD_EAT', { actor, verb: this.verb, item });
    if (actor.current.food + item.stats.food > actor.max.food) {
      GW.message.addCombat('FOOD_FULL', { actor, item });
    }
    actor.adjustStat('food', item.stats.food);
    return true;
  }
}

// if item has a store, frequency of 0 is frequency in the store

function addFood(id, name, frequency, food, cost, store, description, opts={}) {
  return GW.item.addKind(id, new Food({
    name,
    frequency,
    stats: { food, cost },
    description,
    store,
  }));
}

addFood('FOOD_MUSH',    'bowl~ of mush',   '0+', 150,  3, 'STORE_GENERAL', "This ain't your average mush.  No siree!  It's better than that.");
addFood('FOOD_RATION',  'ration~ of food', '0',  500, 10, 'STORE_GENERAL', "All wrapped up nicely, this meal that's ready to eat will fill you up.");
addFood('FOOD_BISCUIT', 'hard biscuit',    '0+', 50,   1, 'STORE_GENERAL', "Hardy fare for travelers on a budget.");
addFood('FOOD_JERKY',   'strip~ of jerky', '0+', 150,  3, 'STORE_GENERAL', "This rough strip of meat really hits the spot when you are away from the kitchen.");

// TODO - confusion?
addFood('FOOD_ALE',     'pint~ of ale',    '0',   50,  3, 'STORE_GENERAL', "Be it dark and malty or all hopped up, it satisfies every time.");
addFood('FOOD_WINE',    'glass~ of wine',  '0',   75,  4, 'STORE_GENERAL', "A nose of tobacco and fresh tilled farmland waffs from the glass.");

addFood('FOOD_MOLD',    'slime mold',      '1+', 300,  5, null,            "Is it edible?  Probably.  Only one way to find out.");
addFood('FOOD_APPLE',   'apple',           '1+', 400,  5, null,            "An odd fruit to be found so deep beneath the surface of the earth.  Great for snacking.");

addFood('FOOD_WAYBREAD',  'piece~ of Elvish waybread', '6+', 750, 40, 'STORE_GENERAL', "Light and buttery wafers that smell faintly of ginger and cinnamon.",
  { });// TODO - Cures Poison, Major Cures
