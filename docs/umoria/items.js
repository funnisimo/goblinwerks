

class Food extends GW.types.ItemKind {
  constructor(opts={}) {
    GW.utils.setDefaults(opts, {
      stats: {},
      ch: '', fg: 'itemColor',
      frequency: 0,
      verb: 'eat',
    });
    GW.utils.setDefaults(opts.stats, {
      food: 1,
    });
    super(opts);
    this.flags |= GW.flags.itemKind.IK_DESTROY_ON_USE;
  }

  use(item, actor, ctx={}) {
    if (!actor.isPlayer()) return false;
    if (actor.current.food >= actor.max.food) {
      GW.message.add('You are not hungry.');
      return false;
    }
    GW.message.addCombat('%s %s %s', actor.getName(), actor.getVerb(this.verb), item.getName({ article: true, quantity: 1 }));
    if (actor.current.food + item.stats.food > actor.max.food) {
      GW.message.addCombat('%s %s full', actor.getName(), actor.getVerb('are'));
    }
    actor.adjustStat('food', item.stats.food);
    return true;
  }
}

GW.item.addKind('FOOD_MUSH', new Food({
  name: 'bowl~ of mush',
  frequency: '1+',
  stats: { food: 1500 },
  description: "This ain't your average mush.  No siree!  It's better than that.",
}));

// [
//   // name                                  found,cost,food, range, identified, called, desc
//   ['FOOD_MUSH',     "bowl~ of mush",             '1+',  1, 1500, "This ain't your average mush.  No siree!  Its better than that."], // 397
//   ['FOOD_RATION',   "ration~ of food",           '0+',  3, 5000, "All wrapped up nicely, this meal that's ready to eat will fill you up."], // 21
//   ['FOOD_MOLD',     "slime mold~",               '1+',  2, 3000, "Is it edible?  Probably.  Only one way to find out."], // 24
//   ['FOOD_WAYBREAD', "piece~ of Elvish waybread", '6+', 25, 7500, "Light and buttery wafers that smell faintly of ginger and cinnamon."], // TODO - Cures Poison, Major Cures
//   ['FOOD_BISCUIT',  "hard biscuit~",             '0',   1, 500,  "Hardy fare for travelers on a budget."], // Store Only
//   ['FOOD_JERKY',    "strip~ of jerky",           '0',   2, 1750, "This rough strip of meat really hits the spot when you are away from the kitchen."], // Store Only
//   ['FOOD_ALE',      "pint~ of ale",              '0',   1, 500,  "Be it dark and malty or all hopped up, it satisfies every time."], // Store Only
//   ['FOOD_WINE',     "pint~ of wine",             '0',   2, 400,  "A nose of tobacco and fresh tilled farmland waffs from the glass."], // Store Only
//   ['FOOD_APPLE',    "apple~",					           '1+',  1,	400,  "An odd fruit to be found so deep beneath the surface of the earth.  Great for snacking."],
// ].map( (v) => {
//   GW.install.food(...v);
// });
