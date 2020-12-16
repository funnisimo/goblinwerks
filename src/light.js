
import { utils as Utils, range as Range, grid as Grid } from 'gw-core';
import * as Flags from './flags.js';
import * as Color from './color.js';
import * as GW from './gw.js';

const LIGHT_SMOOTHING_THRESHOLD = 150;       // light components higher than this magnitude will be toned down a little

GW.def.INTENSITY_DARK = 20; // less than 20% for highest color in rgb

const LIGHT_COMPONENTS = Color.make();

class Light {
	constructor(color, range, fadeTo, pass) {
		this.color = Color.from(color) || null;	/* color */
		this.radius = Range.make(range || 1);
		this.fadeTo = Number.parseInt(fadeTo) || 0;
		this.passThroughActors = (pass && (pass !== 'false')) ? true : false; // generally no, but miner light does
	}

	copy(other) {
		this.color = other.color;
		this.radius.copy(other.radius);
		this.fadeTo = other.fadeTo;
		this.passThroughActors = other.passThroughActors;
	}

  // Returns true if any part of the light hit cells that are in the player's field of view.
  paint( map, x, y, maintainShadows=false, isMinersLight=false) {

  	if (!map) return;

  	let i, j, k;
  	// let colorComponents = [0,0,0];
    let lightMultiplier;

  	let radius = this.radius.value();
  	let outerRadius = Math.ceil(radius);

  	// calcLightComponents(colorComponents, this);
    LIGHT_COMPONENTS.copy(this.color).bake();

    // console.log('paint', LIGHT_COMPONENTS.toString(true), x, y, outerRadius);

  	// the miner's light does not dispel IS_IN_SHADOW,
  	// so the player can be in shadow despite casting his own light.
  	const dispelShadows = !maintainShadows && (intensity(LIGHT_COMPONENTS) > GW.def.INTENSITY_DARK);
  	const fadeToPercent = this.fadeTo;

    const grid = Grid.alloc(map.width, map.height, 0);
  	map.calcFov(grid, x, y, outerRadius, (this.passThroughActors ? 0 : Flags.Cell.HAS_ACTOR), Flags.Tile.T_OBSTRUCTS_VISION, !isMinersLight);

    let overlappedFieldOfView = false;

    grid.forCircle(x, y, outerRadius, (v, i, j) => {
      if (!v) return;
      const cell = map.cell(i, j);

      lightMultiplier = Math.floor(100 - (100 - fadeToPercent) * (Utils.distanceBetween(x, y, i, j) / radius));
      for (k=0; k<3; k++) {
        cell.light[k] += Math.floor(LIGHT_COMPONENTS[k] * lightMultiplier / 100);
      }
      if (dispelShadows) {
        cell.flags &= ~Flags.Cell.IS_IN_SHADOW;
      }
      if (cell.flags & (Flags.Cell.IN_FOV | Flags.Cell.ANY_KIND_OF_VISIBLE)) {
          overlappedFieldOfView = true;
      }

      // console.log(i, j, lightMultiplier, cell.light);
    });

  	if (dispelShadows) {
      const cell = map.cell(x, y);
  		cell.flags &= ~Flags.Cell.IS_IN_SHADOW;
  	}

  	Grid.free(grid);
    return overlappedFieldOfView;
  }

}

GW.types.Light = Light;


export function intensity(color) {
  const data = color.color || color;
  return Math.max(data[0], data[1], data[2]);
}


export function make(color, radius, fadeTo, pass) {

	if (arguments.length == 1) {
		if (color && color.color) {
			pass = color.passThroughActors;
			fadeTo = color.fadeTo;
			radius = color.radius;
			color = color.color;
		}
		else if (typeof color === 'string') {
			([color, radius, fadeTo, pass] = color.split(/[,|]/).map( (t) => t.trim() ));
		}
		else if (Array.isArray(color)) {
			([color, radius, fadeTo, pass] = color);
		}
	}
	else {
		([color, radius, fadeTo, pass] = arguments);
	}

	radius = radius || 0;
	return new GW.types.Light(color, radius, fadeTo, pass);
}

GW.make.light = make;

const LIGHT_SOURCES = GW.lights;


// TODO - USE STRINGS FOR LIGHT SOURCE IDS???
//      - addLightKind(id, source) { LIIGHT_SOURCES[id] = source; }
//      - LIGHT_SOURCES = {};
export function addKind(id, ...args) {
	let source = args[0];
	if (source && !(source instanceof GW.types.Light)) {
		source = GW.make.light(...args);
	}
	LIGHT_SOURCES[id] = source;
	if (source) source.id = id;
	return source;
}



export function addKinds(config) {
	const entries = Object.entries(config);
	entries.forEach( ([name,info]) => {
		addKind(name, info);
	});
}




export function from(...args) {
	if (args.length == 1 && typeof args[0] === 'string' ) {
		const cached = LIGHT_SOURCES[args[0]];
		if (cached) return cached;
	}
	return make(...args);
}



// export function calcLightComponents(colorComponents, theLight) {
// 	const randComponent = cosmetic.range(0, theLight.color.rand);
// 	colorComponents[0] = randComponent + theLight.color.red + cosmetic.range(0, theLight.color.redRand);
// 	colorComponents[1] = randComponent + theLight.color.green + cosmetic.range(0, theLight.color.greenRand);
// 	colorComponents[2] = randComponent + theLight.color.blue + cosmetic.range(0, theLight.color.blueRand);
// }




function updateDisplayDetail(map) {

  map.eachCell( (cell, i, j) => {
    // clear light flags
    cell.flags &= ~(Flags.Cell.CELL_LIT | Flags.Cell.CELL_DARK);

    if (cell.light.some( (v, i) => v !== cell.oldLight[i])) {
      cell.flags |= Flags.Cell.LIGHT_CHANGED;
    }

    if (cell.isDark())
    {
      cell.flags |= Flags.Cell.CELL_DARK;
    } else if (!(cell.flags & Flags.Cell.IS_IN_SHADOW)) {
      cell.flags |= Flags.Cell.CELL_LIT;
    }
  });
}

export function backUpLighting(map, lights) {
	let k;
  map.eachCell( (cell, i, j) => {
    for (k=0; k<3; k++) {
      lights[i][j][k] = cell.light[k];
    }
  });
}

export function restoreLighting(map, lights) {
	let k;
  map.eachCell( (cell, i, j) => {
    for (k=0; k<3; k++) {
      cell.light[k] = lights[i][j][k];
    }
  });
}

export function recordOldLights(map) {
  let k;
  map.eachCell( (cell) => {
    for (k=0; k<3; k++) {
			cell.oldLight[k] = cell.light[k];
			cell.flags &= ~(Flags.Cell.LIGHT_CHANGED);
		}
  });
}

export function zeroOutLights(map) {
	let k;
  const light = map.ambientLight ? map.ambientLight : [0,0,0];
  map.eachCell( (cell, i, j) => {
    for (k=0; k<3; k++) {
      cell.light[k] = light[k];
    }
    cell.flags |= Flags.Cell.IS_IN_SHADOW;
  });
}

export function recordGlowLights(map) {
  let k;
  map.eachCell( (cell) => {
    for (k=0; k<3; k++) {
			cell.glowLight[k] = cell.light[k];
		}
  });
}

export function restoreGlowLights(map) {
	let k;
  map.eachCell( (cell) => {
    for (k=0; k<3; k++) {
      cell.light[k] = cell.glowLight[k];
    }
  });
}


export function updateLighting(map) {
	let i, j, k;
	let layer;		// enum dungeonLayers
	let tile;			// enum tileType
	let monst;		// creature *

	// Copy Light over oldLight
  recordOldLights(map);

  if (map.flags & Flags.Map.MAP_STABLE_LIGHTS) return false;

  // and then zero out Light.
	zeroOutLights(map);

	if (map.flags & Flags.Map.MAP_STABLE_GLOW_LIGHTS) {
		restoreGlowLights(map);
	}
	else {
		// GW.debug.log('painting glow lights.');
		// Paint all glowing tiles.
    map.eachLight( (id, x, y) => {
      const light = LIGHT_SOURCES[id];
      if (light) {
        light.paint(map, x, y);
      }
    });

		recordGlowLights(map);
		map.flags |= Flags.Map.MAP_STABLE_GLOW_LIGHTS;
	}

	// Cycle through monsters and paint their lights:
  Utils.eachChain(map.actors, (actor) => {
    if (actor.kind.light) {
			actor.kind.light.paint(map, actor.x, actor.y);
		}
    // if (monst.mutationIndex >= 0 && mutationCatalog[monst.mutationIndex].light != LIGHT_SOURCES['NO_LIGHT']) {
    //     paint(map, mutationCatalog[monst.mutationIndex].light, actor.x, actor.y, false, false);
    // }
		// if (actor.isBurning()) { // monst.status.burning && !(actor.kind.flags & Flags.Actor.AF_FIERY)) {
		// 	paint(map, LIGHT_SOURCES.BURNING_CREATURE, actor.x, actor.y, false, false);
		// }
		// if (actor.isTelepathicallyRevealed()) {
		// 	paint(map, LIGHT_SOURCES['TELEPATHY_LIGHT'], actor.x, actor.y, false, true);
		// }
  });

	// Also paint telepathy lights for dormant monsters.
  // for (monst of map.dormantMonsters) {
  //     if (monsterTelepathicallyRevealed(monst)) {
  //         paint(map, LIGHT_SOURCES['TELEPATHY_LIGHT'], monst.xLoc, monst.yLoc, false, true);
  //     }
  // }

	updateDisplayDetail(map);

	// Miner's light:
  const PLAYER = GW.data.player;
  if (PLAYER) {
    const MINERS_LIGHT = LIGHT_SOURCES.MINERS_LIGHT;
    if (MINERS_LIGHT && MINERS_LIGHT.radius) {
      MINERS_LIGHT.paint(map, PLAYER.x, PLAYER.y, true, true);
    }
  }

  map.flags |= Flags.Map.MAP_STABLE_LIGHTS;

  // if (PLAYER.status.invisible) {
  //     PLAYER.info.foreColor = playerInvisibleColor;
	// } else if (playerInDarkness()) {
	// 	PLAYER.info.foreColor = playerInDarknessColor;
	// } else if (pmap[PLAYER.xLoc][PLAYER.yLoc].flags & IS_IN_SHADOW) {
	// 	PLAYER.info.foreColor = playerInShadowColor;
	// } else {
	// 	PLAYER.info.foreColor = playerInLightColor;
	// }

  return true;
}


// TODO - Move and make more generic
export function playerInDarkness(map, PLAYER, darkColor) {
  const cell = map.cell(PLAYER.x, PLAYER.y);
	return (cell.light[0] + 10 < darkColor.red
			&& cell.light[1] + 10 < darkColor.green
			&& cell.light[2] + 10 < darkColor.blue);
}
