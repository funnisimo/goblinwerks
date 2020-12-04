


async function showStory() {

  const buffer = GW.ui.startDialog();

  buffer.blackOut();

  let text = GW.text.center('ΩgreenΩStory', buffer.width);
  buffer.drawText(0, 2, text);

  let y = 5;
  let x = 5;
  const width = buffer.width - (x*2);

  y = buffer.wrapText(x, y, width, "You grew up the son of a fisherman and he was the son of a fisherman.  You first learned the fickleness of the sea and her whims at the foot of your grandfather.  As you grew, you were put to work on the boat.  This hardened you early and prepared you for a tough, but rewarding life.  You were happy and content to fish with your family.  Life was good.", 'white');

  y = buffer.wrapText(x, y + 1, width, "That was when fate stepped in and changed your world forever.  Noone died, there was no war, nothing like that.  It was the most powerful of all forces that changed your fortune - love.  That's right, you fell in love with a beautiful girl and couldn't keep her out of your mind.  You first saw her sailing confidently in the bay as your brought the day's catch in to market.  Everything about her was perfect and you knew you were smitten.", 'white');

  y = buffer.wrapText(x, y + 1, width, "It turns out that she is the daughter of the new Governor of the islands.  He was sent from the Mainland to bring order and prosperity to this part of the world.  As a lowly fisherman you knew you had no chance to be with her.  But fate had other ideas.", 'white');

  y = buffer.wrapText(x, y + 1, width, "One day, while brining in the catch you were watching her sail.  That's when a rogue wave caught her simple boat leaning the wrong way and capsized her.  You gasped, afraid for your love.  Then you sprang into action, swiftly maneuvering aside her craft and bringing her aboard.  When your eyes met as she thanked you, you knew your love was true.", 'white');

  y = buffer.wrapText(x, y + 1, width, "When you arrived in the harbor with her and her boat, you were greeted by a crowd.  The Governor stepped forward to comfort her.  Then he thanked you for helping her.", 'white');

  text = GW.text.center('Press ΩgreenΩ[Space/Enter]∆ to continue, ΩgreenΩ[Escape]∆ to cancel.', buffer.width);
  buffer.drawText(0, y + 1, text);

  GW.ui.draw();
  let ev = await GW.io.nextKeyPress(-1, (e) => ['Escape', 'Enter', ' '].includes(e.key) );
  if (ev.key === 'Escape') {
    GW.ui.finishDialog();
    return true;
  }

  buffer.blackOut();

  text = GW.text.center('ΩgreenΩStory', buffer.width);
  buffer.drawText(0, 2, text);

  y = 5;
  y = buffer.wrapText(x, y, width, "Weeks later, you grew tired of being content with waves and smiles from her as you brought in the catch.  You had to act.  So you gathered your courage and made an appointment with the Governor.  You went in and asked him if you could visit with his daughter... ", 'white');

  y = buffer.wrapText(x, y + 1, width, "He laughed.  Not a chuckle, but a real belly shaking kind of laugh.  Luckily there weren't any other people around because it hurt your pride.  Still, it hurt.  You weren't going to sit there and be insulted so you puffed up your chest and let him have it.  'Sir!  I'll have you know that I may not be the rich merchant or navy officer that you desire for your daughter, but I'm as good as any of them.  Better!  Better, I say!'", 'white');

  y = buffer.wrapText(x, y + 1, width, "Still chuckling a little, the Governor replied, 'Settle down there lad.  You did help my daughter out of her pickle like a good man, but no matter, I cannot let her marry a fisherman.  That life is too hard for someone of her talents.  She can read, and do the maths, and she has a glimmer of leadership skill behind those eyes.  A life as a fisherman's wife will destroy all of that.  I must do better for her.'", 'white');

  y = buffer.wrapText(x, y + 1, width, "He paused, looked you over, and continued, 'But, she has spoken well of you and might even have a bit of a fancy for her savior.  And I am a man who rose to this position from a humble background as well.  So I will make a deal with you...'", 'white');

  text = GW.text.center('Press ΩgreenΩ[Space/Enter]∆ to continue, ΩgreenΩ[Escape]∆ to cancel.', buffer.width);
  buffer.drawText(0, y + 1, text);

  GW.ui.draw();
  ev = await GW.io.nextKeyPress(-1, (e) => ['Escape', 'Enter', ' '].includes(e.key) );
  if (ev.key === 'Escape') {
    GW.ui.finishDialog();
    return true;
  }

  buffer.blackOut();

  text = GW.text.center('ΩgreenΩStory', buffer.width);
  buffer.drawText(0, 2, text);

  y = 5;
  y = buffer.wrapText(x, y, width, "'I have been charged with bringing peace and prosperity to this region.  That generally means increasing tax revenue and gathering more goods that are wanted in the Mainland.  Right now, you can help with both of these by improving the spice trade.'", 'white');

  y = buffer.wrapText(x, y + 1, width, "'These islands are rich with important spices that are hard to come by in the Mainland.  If you become a spice trader, and if you continue to be successful, I will allow you to see my daughter.  If you are good enough, I will allow you to marry her - if she desires.  But, if you are not good enough or do not have her heart, then... at least you will have learned the spice trade.'", 'white');

  y = buffer.wrapText(x, y + 1, width, "'I will stake you with some gold which you will use to buy your first trading ship and begin trading.  Bring me gold to repay your debt and to gain my favor.  Write and visit my daughter to gain hers.'", 'white');

  y = buffer.wrapText(x, y + 1, width, "'Be careful in these waters for they are dangerous when you get away from where you know.  Pirates, storms, and other things can get you.  To truly be successful, you will need a larger vessel and a crew.'", 'white');

  y = buffer.wrapText(x, y + 1, width, "'Isn't this exciting?  Come in a fisherman, come out a Spice Trader.  With a chance to gain a beautiful wife.  What could be better?  Now go!  Or one of the other suitors for her heart will beat you!'", 'white');

  text = GW.text.center('Press ΩgreenΩ[Any key]∆ to continue.', buffer.width);
  buffer.drawText(0, y + 1, text);

  GW.ui.draw();
  await GW.io.nextKeyPress(-1);

  GW.ui.finishDialog();
  return true;
}
