

var PORTS = {};

function addPort(id, opts={}) {

  opts.id = id;
  // const port = makePort(opts);
  //

  const port = {};
  port.name = opts.name;
  port.tile = id;
  port.event = 'ENTER_' + id;
  GW.tile.addKind(id, {
    name: port.name, article: false,
    ch: '\u2302', fg: 'yellow', bg: 'brown',
    flags: 'T_OBSTRUCTS_TILE_EFFECTS, T_OBSTRUCTS_ITEMS, TM_VISUALLY_DISTINCT, TM_LIST_IN_SIDEBAR',
    events: {
      playerEnter: { emit: port.event }
    }
  });

  // GW.on(event, enterStore, store);
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
