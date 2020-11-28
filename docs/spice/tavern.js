

const COMMON_RUMORS = [
  'Buy low, sell high!',
  'Roasted garlic on toast is my favorite.',
  'Mmmmm... Beer.',
  'Every ship needs a full crew.',
  'Hi-Ho, Hi-Ho, its off to work we go.',
  'Yo-Ho-Ho for a bottle of rum.',
  "What're you lookin' at?",
  "The sea is where I belong."
];

const RUMORS = [];


async function enterTavern(port, player) {

  player = player || GW.data.player;

  const buffer = GW.ui.startDialog();

  buffer.blackOutRect(16, 0, 64, 38, 'darkest_gray');
  const welcome = GW.text.apply('#yellow#$port$ Tavern', { port: port.name });
  const len = GW.text.length(welcome);
  let cx = 16 + Math.floor((64-len)/2);
  buffer.plotText(cx, 1, welcome);

  buffer.applyText(21, 3, 'What can I get you?');

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
    { text: 'Buy the house a round!',   fn: showRumor, disabled: (player.current.gold < 10) },
    { text: 'Leave',    fn: (() => { running = false; }) },
  ];

  while(running) {
    list.plot(buffer, 21, 5, data);
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
        await item.fn(port, player);
      }
      // else if (list.selected == 5) {
      //   running = false;
      // }
    }
  }

  GW.ui.finishDialog();

  return true;
}

function addRumor(rumor) {
  RUMORS.push(rumor);
  while (RUMORS.length > 10) RUMORS.shift();
}

async function showRumor(port, player) {
  let rumor;

  if (player.current.gold < 10) {
    rumor = "You don't have enough gold for that.";
  }
  else {
    player.current.gold -= 10;
    if (RUMORS.length) {
      if (GW.random.chance(50)) {
        rumor = RUMORS.shift();
      }
    }
    rumor = rumor || GW.random.item(COMMON_RUMORS);
  }
  await GW.ui.confirm({ allowCancel:false, bg: 'dark_gray' }, rumor);
  return true;
}
