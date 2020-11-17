

async function showAbout() {

  const buffer = GW.ui.startDialog();

  buffer.blackOut();

  let prompt = GW.text.format("%FAbout uMoria", 'yellow');
	let x = Math.floor((buffer.width - GW.text.length(prompt)) / 2);
	let y = 2;
	buffer.plotText(x, y, prompt);

  y = buffer.wrapText(5, 4, buffer.width - 10, GW.text.format("The %FDungeons of Moria%F is a single player dungeon simulation originally written by %FRobert Alan Koeneke%F, with v1.0 released in 1983. The game was originally developed in VMS Pascal before being ported to the C language and released as Umoria in 1988. Moria has had many variants over the years, with Angband being the most well known. Moria was also an inspiration for one the most commercially successful action roguelike games, %FDiablo%F!", 'gold', null, 'teal', null, 'dark_red', null));

  y = buffer.wrapText(5, y+2, buffer.width - 10, GW.text.format("This version is based on the 5.7.11 release which can be found at: %Fhttps://github.com/dungeons-of-moria/umoria/tree/v5.7.11%F", 'blue', null));

  y = buffer.wrapText(5, y+2, buffer.width - 10, GW.text.format("This version is built using the GoblinWerks framework which can be found at: %Fhttps://github.com/funnisimo/goblinwerks%F", 'blue', null));

  y = buffer.wrapText(5, y+2, buffer.width - 10, GW.text.format("This version deviates pretty significantly from the original because of its use of %FGoblinWerks%F.  The simplest differences are in the use of color and the way the sidebar and messages are handled.  Beyond that, there are changes to the way lighting and dungeon/town generation happens.  The goal was to give you (the player) an '~ish' experience while also giving developers the underlying code that shows how something 'real' could be made with %FGoblinWerks%F.", 'green', null, 'green', null));

	prompt = '[Escape] to close.';
	x = Math.floor((buffer.width - prompt.length) / 2);
	y = y + 2;
	buffer.plotText(x, y, prompt);

  GW.ui.draw();

  await GW.io.nextKeyPress(-1, (ev) => ev.key === 'Escape');

  GW.ui.finishDialog();

}


async function showStory() {

  const buffer = GW.ui.startDialog();

  buffer.blackOut();

  let prompt = GW.text.format("%FThe Dungeons of Moria", 'yellow');
	let x = Math.floor((buffer.width - GW.text.length(prompt)) / 2);
	let y = 2;
	buffer.plotText(x, y, prompt);

  y = buffer.wrapText(5, 4, buffer.width - 10, "The game of Umoria is a single player dungeon simulation. Starting at the town level, you begin your adventure by stocking up on supplies - weapons, armour, and magical devices - from the various stores. After preparing for your adventure, you descend into the Dungeons of Moria where fantastic adventures await!\n\nIf you've prepared well and acquired the right skills and experience - with perhaps a little luck too - you can descend to the deepest levels and attempt to defeat the Balrog.");

  buffer.plotText(5, y + 2, 'Source: http://umoria.org');

	prompt = '[Escape] to close.';
	x = Math.floor((buffer.width - prompt.length) / 2);
	y = 24;
	buffer.plotText(x, y, prompt);

  GW.ui.draw();

  await GW.io.nextKeyPress(-1, (ev) => ev.key === 'Escape');

  GW.ui.finishDialog();

}
