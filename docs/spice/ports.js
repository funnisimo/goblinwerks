

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

GW.message.addKind('ENTER_PORT', 'you visit $name$.');

async function enterPort() {

  GW.message.add('ENTER_PORT', this);

  const buffer = GW.ui.startDialog();

  buffer.blackOutRect(0, 0, 64, 38);
  const welcome = GW.text.apply('#yellow#Welcome to $name$', this);
  const len = GW.text.length(welcome);
  let cx = Math.floor((64-len)/2);
  buffer.plotText(cx, 1, welcome);

  buffer.plotText(5, 3, 'Where would you like to go?');

  const list = GW.make.list({
    letters: true,
    selectedColor: 'teal',
    disabledColor: 'black',
    color: 'white',
    selected: 0,
    format: '%-30s',
  });

  let running = true;

  const data = [
    { text: 'Market',   fn: enterMarket },
    { text: 'Shipyard', fn: null },
    { text: 'Store',    fn: null },
    { text: 'Tavern',   fn: null },
    { text: 'Governor', fn: null },
    { text: 'Leave',    fn: (() => { running = false; }) },
  ];

  while(running) {
    list.plot(buffer, 5, 5, data);
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
