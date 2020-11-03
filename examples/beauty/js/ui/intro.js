

const KNIGHT = [
	"   .-.   ",
	" __|=|__ ",
	"(_/'-'\\_)",
	"//\\___/\\\\",
	"<>/   \\<>",
	" \\|_._|/ ",
	"  <_I_>  ",
	"   |||   ",
	"  /_|_\\  "
];

function drawKnight(buf, x=0, y=0) {
	if (y < 0) {
  	y = buf.height + y - KNIGHT.length;
  }
	const color = GW.make.color('#aae');
	KNIGHT.forEach( (line, j) => {
  	for(let i = 0; i < line.length; ++i) {
    	const ch = line[i];
      buf.plotChar(x + i, y + j, ch, color);
    }
  });
}

const FLOWER = [
	" .:. ",
	"-=o=-",
	" ':' ",
	" \\|/ "
];

const FLOWER_COLOR = {
	o: 'yellow',
  '\\': 'green',
  '|': 'green',
  '/': 'green',
  default: 'red',
};

function drawFlower(buf, x=0, y=0) {
	x = buf.width - FLOWER[0].length;
	if (y < 0) {
  	y = buf.height + y - FLOWER.length;
  }
	FLOWER.forEach( (line, j) => {
  	for(let i = 0; i < line.length; ++i) {
    	const ch = line[i];
      const color = FLOWER_COLOR[ch] || FLOWER_COLOR.default;
      buf.plotChar(x + i, y + j, ch, color);
    }
  });
}

function drawGrass(buf, y=0) {
	if (y < 0) {
  	y = buf.height + y;
  }
  for(let x = 0; x < buf.width; ++x) {
  	buf.plotChar(x, y, '^', 'green');
  }
}


const TITLE = [
".oPYo. 8                       o             ",
"8      8                                     ",
"`Yooo. 8 .oPYo. .oPYo. .oPYo. o8 odYo. .oPYo.",
"    `8 8 8oooo8 8oooo8 8    8  8 8' `8 8    8",
"     8 8 8.     8.     8    8  8 8   8 8    8",
"`YooP' 8 `Yooo' `Yooo' 8YooP'  8 8   8 `YooP8",
"                       8                    8",
"                       8                 ooP'",
" .oPYo.                        o             ",
" 8   `8                        8             ",
"o8YooP' .oPYo. .oPYo. o    o  o8P o    o     ",
" 8   `b 8oooo8 .oooo8 8    8   8  8    8     ",
" 8    8 8.     8    8 8    8   8  8    8     ",
" 8oooP' `Yooo' `YooP8 `YooP'   8  `YooP8     ",
"                                       8     ",
"                                    ooP'     "];

function drawTitle(buf, x=0, y=0) {
	if (y < 0) {
  	y = buf.height + y - TITLE.length;
  }
	TITLE.forEach( (line, j) => {
  	for(let i = 0; i < line.length; ++i) {
    	const ch = line[i];
      buf.plotChar(x + i, y + j, ch, 'gold');
    }
  });

}

const TOWER_START = [
	" _     _     _     _ ",
	"[_]___[_]___[_]___[_]",
	"[__#__][__#I_]__I__#]",
	"[_I_#_I__*[__]__#_*_]",
	"   [_]_#_]__I_#__]   ",
	"   [I_|/     \\|*_]   ",
	'   [#_||  ?  ||_#]   ',
	"   [_I||     ||_#]   ",
	"   [__]|     ||#_]   "];

const TOWER_END = [
	" \\\\[__]#_I__][__#]// "
];


const TOWER_FG = {
	default: 'light_gray',
	'?': 'red',
  '#': 'green',
  '*': 'pink',
  '/': 'green',
  '\\': 'green',
};

const TOWER_BG = {
	default: 'darkest_gray',
  '?': 'black',
	' ': 'black',
  '/': 'black',
  '\\': 'black',
};

function drawTower(buf, x=0, y=0, h=0) {
	const width = TOWER_START[0].length;
	if (x < 0) {
  	x = buf.width + x - width;
  }
  if (h <= 0) {
  	h = buf.height - y + h - 1;
  }

	TOWER_START.forEach( (line, j) => {
  	for(let i = 0; i < line.length; ++i) {
    	const ch = line[i];
      fg = TOWER_FG[ch] || TOWER_FG.default;
      bg = (y + j) ? TOWER_BG[ch] || TOWER_BG.default : 'black';
      if (ch == '/' || ch == '\\') {
      	bg = TOWER_BG.default;
        fg = TOWER_FG.default;
      }
      buf.plotChar(x + i, y + j, ch, fg, bg);
    }
	});


	for(let j = y + TOWER_START.length; j < y + h; ++j) {
    let content = "";
    let separatorDistance = 0;
    let vineDistance = 0;

    for (let i=0; i<width - 8; i++) {
      let ch = "";
      let separatorChance = Math.floor(100 * (separatorDistance-0.5) / 3);
      let vineChance = Math.floor(100 * (vineDistance+1) / 15);

      if (GW.random.chance(separatorChance)) {
        ch = GW.random.item(["I", "]", "["]);
        separatorDistance = 0;
      } else {
        separatorDistance++;
        ch = "_";
      }

      if (GW.random.chance(vineChance)) {
        ch = GW.random.item(["#", "#", "*"]);
        vineDistance = 0;
      } else {
        vineDistance++;
      }

      content += ch;
    }

		const line = `   [${content}]   `;
  	for(let i = 0; i < line.length; ++i) {
    	const ch = line[i];
			fg = TOWER_FG[ch] || TOWER_FG.default;
      bg = TOWER_BG[ch] || TOWER_BG.default;
      buf.plotChar(x + i, j, ch, fg, bg);
    }
  }

	TOWER_END.forEach( (line, j) => {
  	for(let i = 0; i < line.length; ++i) {
    	const ch = line[i];
			fg = TOWER_FG[ch] || TOWER_FG.default;
      bg = TOWER_BG[ch] || TOWER_BG.default;
      buf.plotChar(x + i, y + h + j, ch, fg, bg);
    }
  });

}


function drawText(buf, x=0, y=0, w=0) {
	const text = 'Into a profound slumber she sank, surrounded only by dense brambles, thorns and roses.  ' +
  							'Many adventurers tried to find and rescue her, but none came back...' +
								'\n\nHit [Enter] to start the game';

	buf.wrapText(x, y, w, text);
}

const FACTS = [
	"This game was created in one week",
	"This game was written using GoblinWerks, a JavaScript Roguelike Toolkit",
	"The tower is procedurally generated. Try refreshing this page!",
	"You can reload this page to get another Fun Fact",
	"The original Sleeping Beauty fairy tale was written by Charles Perrault",
	"This game is best played with a maximized browser window",
	"This game can be won!",
	"This game can be lost!",
	"This game features permadeath and procedural generation",
	"This game uses the awesome 'Metrickal' font face",
	"This game runs even in Microsoft Internet Explorer 11",
	"Eating a lutefisk might be dangerous"
];

function drawFact(buf, y=0) {
	if (y < 0) {
  	y = buf.height + y;
  }

	const fact = '%FFun Fact: ' + GW.random.item(FACTS);

	const x = Math.floor((buf.width - fact.length)/2);
	buf.plotText(x, y, fact, 'lighter_gray');
}


async function showIntro() {

  const buffer = GW.ui.startDialog();

  drawTitle(buffer, 4, 2);
  drawKnight(buffer, 4, -4);
  drawFlower(buffer, 0, -4);
  drawGrass(buffer, -4);
  drawTower(buffer, -6, 0, -4);
  drawText(buffer, 18, 26, 40);
  drawFact(buffer, -2);

  GW.ui.draw();

  await GW.io.nextKeyPress(-1, (e) => e.key === 'Enter' );

  await GW.ui.fadeTo('black', 250, buffer);

  GW.ui.finishDialog();
}
