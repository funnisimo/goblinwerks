

async function showAbout() {

  const buffer = GW.ui.startDialog();

  buffer.blackOut();

  let prompt = "ΩyellowΩAbout uMoria∆";
	let x = Math.floor((buffer.width - GW.text.length(prompt)) / 2);
	let y = 2;
	buffer.drawText(x, y, prompt);

  y = buffer.wrapText(5, 4, buffer.width - 10, "The ΩgoldΩDungeons of Moria∆ is a single player dungeon simulation originally written by ΩtealΩRobert Alan Koeneke∆, with v1.0 released in 1983. The game was originally developed in VMS Pascal before being ported to the C language and released as Umoria in 1988. Moria has had many variants over the years, with Angband being the most well known. Moria was also an inspiration for one the most commercially successful action roguelike games, Ωdark_redΩDiablo∆!");

  y = buffer.wrapText(5, y+2, buffer.width - 10, "This version is based on the 5.7.11 release which can be found at: ΩblueΩhttps://github.com/dungeons-of-moria/umoria/tree/v5.7.11∆");

  y = buffer.wrapText(5, y+2, buffer.width - 10, "This version is built using the GoblinWerks framework which can be found at: ΩblueΩhttps://github.com/funnisimo/goblinwerks∆");

  y = buffer.wrapText(5, y+2, buffer.width - 10, "This version deviates pretty significantly from the original because of its use of ΩgreenΩGoblinWerks∆.  The simplest differences are in the use of color and the way the sidebar and messages are handled.  Beyond that, there are changes to the way lighting and dungeon/town generation happens.  The goal was to give you (the player) an '~ish' experience while also giving developers the underlying code that shows how something 'real' could be made with ΩgreenΩGoblinWerks∆.");

	prompt = '[Escape] to close.';
	x = Math.floor((buffer.width - prompt.length) / 2);
	y = y + 2;
	buffer.drawText(x, y, prompt);

  GW.ui.draw();

  await GW.io.nextKeyPress(-1, (ev) => ev.key === 'Escape');

  GW.ui.finishDialog();

}


async function showStory() {

  const buffer = GW.ui.startDialog();

  buffer.blackOut();

  let prompt = "ΩyellowΩThe Dungeons of Moria";
	let x = Math.floor((buffer.width - GW.text.length(prompt)) / 2);
	let y = 2;
	buffer.drawText(x, y, prompt);

  y = buffer.wrapText(5, 4, buffer.width - 10, "The game of Umoria is a single player dungeon simulation. Starting at the town level, you begin your adventure by stocking up on supplies - weapons, armour, and magical devices - from the various stores. After preparing for your adventure, you descend into the Dungeons of Moria where fantastic adventures await!\n\nIf you've prepared well and acquired the right skills and experience - with perhaps a little luck too - you can descend to the deepest levels and attempt to defeat the Balrog.");

  buffer.drawText(5, y + 2, 'Source: http://umoria.org');

	prompt = '[Escape] to close.';
	x = Math.floor((buffer.width - prompt.length) / 2);
	y = 24;
	buffer.drawText(x, y, prompt);

  GW.ui.draw();

  await GW.io.nextKeyPress(-1, (ev) => ev.key === 'Escape');

  GW.ui.finishDialog();

}
