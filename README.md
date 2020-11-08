# GoblinWerks

This library helps to get you started writing a Roguelike game in Javascript.

## Getting started

Look at the examples folder to find:
  * [Life](examples/life) - Shows how to use the canvas in its most basic form
    - Using the canvas.
  * [Dungeon](examples/dungeon) - Simple dungeon digging and wandering
    - Digging a dungeon with different room shapes, lakes and bridges.
    - FOV
    - Changing maps as you use stairs
  * [Fx](examples/fx) - Example special effects
    - Testing some of the FX shapes that can be used
  * [Lava](examples/lava) - A simple arcade-like game where you jump over a lava pit.
    - Tiles that change as the player walks around
    - Waves of lava
    - jumping over lava (custom command)
  * [Escape](examples/escape) - A GW version of [Escape from ECMA Labs](https://github.com/unstoppablecarl/escape-from-ecma-labs/)
    - A different way of building the map -- via prefab
    - Items that you can push, pull, slide, bash.
    - Bashing, opening, closing doors, shooting targets, custom bump and ai functions.
  * [Beauty](examples/beauty) - A GW version of [Sleeping Beauty](https://github.com/ondras/sleeping-beauty)
    - Title screen
    - Custom combat screen
    - Random drops from monsters
    - Random treasure generation
    - Fancy dungeon generation - with round shaped levels

## FAQ

* What inspired the project?

  I was trying to do a [7DRL](https://7drl.com/) and was a little daunted with some of the basics that I needed to get working in order to have something reasonable -- things like a character building screen, inventory, equipment, etc...  All of the basics of a complete Roguelike.  I wanted to go beyond those and having to build them every time felt like I was just wasting time doing what somebody else has done over again.

  It turns out that there are a lot of gotchas in these areas and a library to give me a decent version of them would help.  The goal is to give you enough to do a full game without limiting you too much to add your custom spin on it.  So a nice core with flexibility.

* Why didn't you build on [rot.js](https://ondras.github.io/rot.js/hp/)?

  Good question.  I love rot.js and what it has done for making casual Roguelikes.  I originally built on top of rot.js, but for some reason, that code did not make this current version -- differences in canvas being one of the main reasons.  I may return to this concept and add rot.js compatability/support again.  I just want to get a little more of the examples that are in my head working so that I can have a fuller picture of the project before redoing that integration.


## License

[MIT](LICENSE).
