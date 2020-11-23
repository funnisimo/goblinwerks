
/*
Black Pearl
Blood Moss
Garlic
Ginseng
Mandrake Root
Nightshade
Spider Silk
Sulfurous Ash
*/


const MARKET_PRICES = {
  garlic:   [2,2,2,2,3,4,5,5,5,5],  // Buy 2, sell 3 = +1
  ginsing:  [4,4,4,4,5,6,7,7,7,8],  // Buy 4, sell 6 = +2
  moss:     [6,6,6,7,7,8,8,9,9,10], // Buy 6, sell 8 = +2
  ash:      [8,8,8,12,12,12,12,14,14,14],  // Buy 8, sell 11 = +3
  silk:     [10,11,12,13,14,15,16,17,18,19],  // Buy 10, sell 14 = +5
  pearl:    [10,11,12,13,14,15,16,17,18,19],  // Buy 10, sell 14 = +5
  mandrake: [20,21,22,23,24,25,26,27,28,29],  // Buy 20, sell 23 = +3
  night:    [30,31,32,33,34,35,36,37,38,39],  // Buy 30, sell 31 = +1
}

const GOODS = {
  garlic: 'Garlic',
  ginsing: 'Ginsing',
  moss: 'Blood Moss',
  ash: 'Sulfurous Ash',
  silk: 'Spider Silk',
  pearl: 'Black Pearl',
  mandrake: 'Mandrake Root',
  night: 'Nightshade',
};


async function enterMarket(port, player) {

  if (!port.market) {
    setupPortMarket(port);
  }

  player = player || GW.data.player;
  const hasGoods = Object.keys(GOODS).reduce( (out, id) => out + (player.current[id] || 0), 0);

  let mode = hasGoods ? 0 : 1;
  while(mode >= 0) {
    if (mode == 0) {
      mode = await playerSellToMarket(port, player);
    }
    else {
      mode = await playerBuyFromMarket(port, player);
    }
  }

  return true;
}


async function playerSellToMarket(port, player) {

  const buffer = GW.ui.startDialog();

  buffer.blackOutRect(0, 0, 64, 38);
  const welcome = GW.text.apply('#yellow#$port$ Market', { port: port.name });
  const len = GW.text.length(welcome);
  let cx = Math.floor((64-len)/2);
  buffer.plotText(cx, 1, welcome);

  buffer.applyText(5, 3, 'What would you like to #green#sell## to the market?');

  buffer.applyText(5, 20, 'Press #green#<a-z, UP, DOWN>## to select a good.');
  buffer.applyText(5, 21, 'Press #green#<Enter>## to sell 1.');
  buffer.applyText(5, 22, 'Press #green#<ENTER>## to sell all of the good.');
  buffer.applyText(5, 23, 'Press #green#<B>## to see buy prices.');
  buffer.applyText(5, 24, 'Press #green#<Escape>## to leave the market.');

  const table = GW.make.table({
    letters: true,
    headers: true,
  })
  .column('Reagent', 'name', '%-15s')
  // .column('Want', 'want', '%4d')
  .column('Price', 'price', '%4d GP')
  .column('Have', 'have', '%4d', '   -')
  ;

  const data = Object.entries(port.market).map( ([id,price]) => {
    return {
      id,
      name: GOODS[id],
      price: Math.floor(price * 0.8),
      have: player.current[id] || 0,
      disabled: !(player.current[id] > 0)
    }
  } );

  let result = 0;
  while(result == 0) {

    // buffer.applyText(5, 3, 'What would you like to #green#buy## at the market?');
    // buffer.applyText(5, 33, 'Press #green#<S>## to Sell.');

    buffer.blackOutRect(5, 16, 54, 2);
    buffer.applyText(5, 16, 'Gold : #gold#$gold$##', { gold: player.current.gold });
    buffer.applyText(5, 17, 'Space on Ship: #yellow#$empty$##', { empty: player.current.empty });

    table.plot(buffer, 5, 5, data);
    GW.ui.draw();

    let sellAll = false;
    await table.loop({
      B() {
        result = 1;
        return true;
      },
      ENTER() {
        sellAll = true;
        table.selected = table.active;
        return true;
      },
      mousemove(ev) {
        if (ev.y >= 20 && ev.y <= 24) {
          console.log('hover', ev.y);
          return true;
        }
      },
      click(ev) {
        if (ev.y >= 20 && ev.y <= 24) {
          console.log('click', ev.y);
          return true;
        }
      }
    });

    if (table.cancelled) {
      // Leaving market
      result = -1;
    }
    else if (table.selected >= 0) {
      console.log('Selling = ', data[table.selected], sellAll);
      const d = data[table.selected];
      if (!d.disabled) {
        const qty = sellAll ? player.current[d.id] : 1;
        const price = d.price;
        player.current.gold += qty * price;
        player.current[d.id] -= qty;
        player.current.empty += qty;
        d.have -= qty;
        if (d.have <= 0) {
          d.disabled = true;
        }
      }

    }
  }

  GW.ui.finishDialog();
  return result;
}



async function playerBuyFromMarket(port, player) {

  const buffer = GW.ui.startDialog();

  buffer.blackOutRect(0, 0, 64, 38);
  const welcome = GW.text.apply('#yellow#$port$ Market', { port: port.name });
  const len = GW.text.length(welcome);
  let cx = Math.floor((64-len)/2);
  buffer.plotText(cx, 1, welcome);

  buffer.applyText(5, 3, 'What would you like to #green#buy## from the market?');

  buffer.applyText(5, 20, 'Press #green#<a-z, UP, DOWN>## to select a good.');
  buffer.applyText(5, 21, 'Press #green#<Enter>## to buy a good.');
  buffer.applyText(5, 22, 'Press #green#<ENTER>## to buy the max of a good.');
  buffer.applyText(5, 23, 'Press #green#<S>## to see sell prices.');
  buffer.applyText(5, 24, 'Press #green#<Escape>## to leave the market.');

  const table = GW.make.table({
    letters: true,
    headers: true,
  })
  .column('Reagent', 'name', '%-15s')
  // .column('Want', 'want', '%4d')
  .column(' Price', 'price', '%4d GP')
  // .column('Have', 'have', '%4d')
  ;

  const data = Object.entries(port.market).map( ([id,price]) => {
    return {
      id,
      name: GOODS[id],
      price,
    }
  });

  let result = 1;
  while(result == 1) {

    buffer.blackOutRect(5, 16, 54, 2);
    buffer.applyText(5, 16, 'Gold : #gold#$gold$##', { gold: player.current.gold });
    buffer.applyText(5, 17, 'Space on Ship: #yellow#$empty$##', { empty: player.current.empty });

    table.plot(buffer, 5, 5, data);
    GW.ui.draw();

    let buyMax = false;
    await table.loop({
      S() {
        result = 0;
        return true;
      },
      ENTER() {
        table.selected = table.active;
        buyMax = true;
        return true;
      }
    });

    if (table.cancelled) {
      // Leaving market
      result = -1;
    }
    else if (table.selected >= 0) {
      console.log('Buying = ', data[table.selected], buyMax);
      const d = data[table.selected];
      if (!d.disabled) {
        const price = d.price;
        let qty = 1;
        if (buyMax) {
          qty = Math.min(Math.floor(player.current.gold / price), player.current.empty);
        }
        player.current.gold -= qty * price;
        player.current[d.id] = qty + (player.current[d.id] || 0);
        player.current.empty -= qty;
      }

    }
  }

  GW.ui.finishDialog();
  return result;
}
