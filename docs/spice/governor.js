




async function showGovernor(port, player) {

  player = player || GW.data.player;
  const buffer = GW.ui.startDialog();

  buffer.blackOutRect(16, 0, 64, 38, 'darkest_gray');
  const welcome = 'ΩyellowΩGovernor';
  const len = GW.text.length(welcome);
  let cx = 16 + Math.floor((64-len)/2);
  buffer.plotText(cx, 1, welcome);

  buffer.plotText(21, 3, 'What would you like to do?');

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
    { text: 'Donate for favor',   fn: (() => donateForFavor(port, player)) },
    { text: 'Visit his daughter',   fn: (() => visitDaughter(port, player)) },
    { text: 'Ask for permission to marry his daughter',   fn: (() => askForPermission(port, player)) },
    { text: 'Leave',    fn: (() => { running = false; }) },
  ];

  while(running) {
    list.plot(buffer, 21, 5, data);
    GW.ui.draw();

    await list.loop();

    if (list.cancelled) {
      running = false;
    }
    else if (list.selected >= 0) {
      console.log('You chose', list.selected);
      const item = data[list.selected];
      if (item.fn) {
        await item.fn(this);
      }
    }
  }

  GW.ui.finishDialog();
  return true;
}


async function donateForFavor(port, player) {

  const value = await GW.ui.inputNumberBox({min:1, max: player.current.gold}, `Donate how much gold? (1-${player.current.gold})`);
  if (value > 0) {
    player.current.gold -= value;
    player.current.favor += value;
    GW.message.add('The Governor looks fondly upon your §value§ GP donation to the cause.', { value });
    await GW.ui.confirm({ allowCancel: false }, 'Thank you.');
  }
  return true;
}

var VISITED_DAUGHTER = false;

function updateFavor() {

  const player = GW.data.player;
  if (player) {
    console.log('...updating favor+fancy');
    player.current.favor = Math.floor((player.current.favor || 0) * 0.99);
    player.current.fancy = Math.floor((player.current.fancy || 0) * 0.99);
  }
  VISITED_DAUGHTER = false;

  return 50*100; // every 50 or so turns...
}

GW.scheduler.push(updateFavor, 50*100);


async function askForPermission(port, player) {
  await GW.ui.confirm({ allowCancel: false }, 'Not yet.');
  return true;
}



async function visitDaughter(port, player) {
  if (!VISITED_DAUGHTER) {
    player.current.fancy += 200;
    VISITED_DAUGHTER = true;
  }
  await GW.ui.confirm({ allowCancel: false }, 'What a lovely visit.');
  return true;
}
