

var PORTS = {};


class Port {
  constructor(id, opts={}) {
    this.name = opts.name;
    this.tile = id;
    this.event = 'ENTER_' + id;
    this.market = {};
  }

}

function resetPorts() {
  Object.values(MARKET_PRICES).forEach( (prices) => {
    GW.random.shuffle(prices);
  });
  Object.values(PORTS).forEach( (port, i) => {
    Object.entries(MARKET_PRICES).forEach( ([id,prices]) => {
      port.market[id] = prices[i];
    });
  });
}

GW.message.addKind('ENTER_PORT', 'you visit §name§.');


function updateMarkets() {

  console.log('updating port markets...');

  // pick a random market to adjust
  const portA = GW.random.item(PORTS);
  const portB = GW.random.item(PORTS);
  if (portA !== portB) {
    const good = GW.random.key(portA.market);
    if (portA.market[good] < portB.market[good]) {
      addRumor(GOODS[good] + ' prices are rising in ' + portA.name + '.');
    }
    else if (portA.market[good] > portB.market[good]) {
      addRumor(GOODS[good] + ' prices are falling in ' + portA.name + '.');
    }
    [portA.market[good], portB.market[good]] = [portB.market[good], portA.market[good]];
  }

  return 10 * 100;
}

GW.scheduler.push(updateMarkets, 100);


async function enterPort() {

  GW.message.add('ENTER_PORT', this);

  const buffer = GW.ui.startDialog();

  buffer.mix('black', 50);
  buffer.blackOutRect(16, 0, 64, 38, 'darkest_gray');
  const welcome = GW.text.apply('ΩyellowΩWelcome to §name§', this);
  const len = GW.text.length(welcome);
  let cx = 16 + Math.floor((64-len)/2);
  buffer.drawText(cx, 1, welcome);

  buffer.drawText(21, 3, 'Where would you like to go?');

  const list = GW.make.list({
    letters: true,
    selectedColor: 'teal',
    disabledColor: 'black',
    color: 'white',
    selected: 0,
    format: '%-30s',
    bg: 'darkest_gray',
  });

  let running = true;

  const data = [
    { text: 'Market',   fn: enterMarket },
    { text: 'Shipyard', fn: null },
    { text: 'Store',    fn: null },
    { text: 'Tavern',   fn: enterTavern },
    { text: 'Governor', fn: showGovernor },
    { text: 'Leave',    fn: (() => { running = false; }) },
  ];

  while(running) {
    list.draw(buffer, 21, 5, data);
    GW.ui.draw();

    await list.loop();

    if (list.cancelled) {
      // Leaving port
      running = false;
    }
    else if (list.selected >= 0) {
      console.log('You chose', list.selected);
      const item = data[list.selected];
      if (item.fn) {
        await item.fn(this);
      }
      // else if (list.selected == 5) {
      //   running = false;
      // }
    }
  }

  GW.ui.finishDialog();
  return true;
}



function addPort(id, opts={}) {

  const port = new Port(id, opts);

  GW.tile.addKind(id, {
    name: port.name, article: false,
    ch: '\u2302', fg: 'yellow', bg: 'brown',
    flags: 'T_OBSTRUCTS_TILE_EFFECTS, T_OBSTRUCTS_ITEMS, TM_VISUALLY_DISTINCT, TM_LIST_IN_SIDEBAR',
    events: {
      playerEnter: { emit: port.event }
    }
  });

  GW.on(port.event, enterPort, port);
  // store.update();

  PORTS[id] = port;
  return port;
}

// function registerPorts() {
//   for(let id in PORTS) {
//     const port = PORTS[id];
//     GW.scheduler.push(port.update.bind(port), GW.random.number(port.updateTime));
//   }
// }
//
// GW.on('MAP_START', registerPorts);


addPort('PORT_YORK',     { name: 'York',     });
addPort('PORT_NANTES',   { name: 'Nantes',   });
addPort('PORT_PORTO',    { name: 'Porto',    });
addPort('PORT_WICKLO',   { name: 'Wicklo',   });
addPort('PORT_BRINDISI', { name: 'Brindisi', });
addPort('PORT_CORK',     { name: 'Cork',     });
addPort('PORT_THIRA',    { name: 'Thira',    });
addPort('PORT_GULLUK',   { name: 'Gulluk',   });
addPort('PORT_MAROC',    { name: 'Maroc',    });
addPort('PORT_TASUCU',   { name: 'Tasucu',   });
