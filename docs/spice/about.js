

async function showAbout() {

  const buffer = GW.ui.startDialog();

  buffer.blackOut();

  let text = GW.text.center('ΩgreenΩAbout', buffer.width);
  buffer.drawText(0, 2, text);

  let y = 5;
  let x = 5;
  const width = buffer.width - (x*2);

  y = buffer.wrapText(x, y, width, "Written by: ΩblueΩFunnisimo");
  y = buffer.wrapText(x, y, width, "Using     : ΩgreenΩGoblinwerks∆ - https://github.com/funnisimo/goblinwerks");


  text = GW.text.center('Press ΩgreenΩ[Any key]∆ to continue.', buffer.width);
  buffer.drawText(0, y + 1, text);

  GW.ui.draw();
  await GW.io.nextKeyPress(-1);

  GW.ui.finishDialog();
  return true;
}
