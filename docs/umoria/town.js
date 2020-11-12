



// Builds a store at a row, column coordinate
function townBuildStore(map, store, x, y) {
  const width = map.width;  // 80
  const height = map.height;  // 32

  let perX = Math.floor(width/4);
  let hpx = Math.round(perX/2);
  let perY = Math.floor(height/3);
  let hpy = Math.round(perY/2);

  let cx = perX * (x + 1);
  let cy = perY * (y + 1);

  let top = cy - GW.random.range(2,hpy);
  let bottom = cy + GW.random.range(2,hpy);
  let left = cx - GW.random.range(3,hpx);
  let right = cx + GW.random.range(3,hpx);

  let posX, posY;

  for (posY = top; posY <= bottom; posY++) {
      for (posX = left; posX <= right; posX++) {
          map.setTile(posX, posY, 'WALL');
      }
  }

  let tmp = GW.random.number(4);
  if (tmp < 3) {
      posY = GW.random.number(bottom - top) + top;

      if (tmp == 1) {
          posX = left;
      } else {
          posX = right;
      }
  } else {
      posX = GW.random.number(right - left) + left;

      if (tmp == 3) {
          posY = bottom;
      } else {
          posY = top;
      }
  }

  // dg[posX][posY] = TILE_CORR_FLOOR;

  // int cur_pos = popt();
  // dg.floor[posX][posY].treasure_id = (uint8_t) cur_pos;

  // const store = STORES[store_id] || null;

  const door = map.cell(posX, posY);
  door.setTile(store.tile);
  door.flags |= (GW.flags.cell.IS_IN_AREA_MACHINE | GW.flags.cell.IMPREGNABLE);

  map.eachNeighbor(posX, posY, (cell) => {
    cell.flags |= (GW.flags.cell.IMPREGNABLE | GW.flags.cell.IS_IN_AREA_MACHINE);
  });

  // dg[posX][posY] = store ? store.tile : LOCKED_DOOR;
  // pmap[posX][posY].mechFlags |= IS_IN_ROOM_MACHINE;

  // inventoryItemCopyTo(CONFIG.map.objects::OBJ_STORE_DOOR + store_id, treasure_list[cur_pos]);
}

// // Link all free space in treasure list together
// static void treasureLinker() {
//     for (auto &item : treasure_list) {
//         inventoryItemCopyTo(CONFIG.map.objects::OBJ_NOTHING, item);
//     }
//     current_treasure_id = config::treasure::MIN_TREASURE_LIST_ID;
// }
//
// // Link all free space in monster list together
// static void monsterLinker() {
//     for (auto &monster : monsters) {
//         monster = blank_monster;
//     }
//     next_free_monster_id = CONFIG.monsters.MON_MIN_INDEX_ID;
// }

function townPlaceStores(map) {
    const stores = Object.values(STORES);
    GW.random.shuffle(stores);  // We can only place 6 stores

    for (let y = 0; y < 2; y++) {
        for (let x = 0; x < 3; x++) {
            const store = stores.shift();
            townBuildStore(map, store, x, y);
        }
    }
}


function townIsNight() {
    return (0x1 & Math.floor(GW.data.turnNumber / 5000)) != 0;
}



// Town logic flow for generation of new town
async function generateTown(id=0) {
    // seedSet(game.town_seed);

    const map = GW.make.map(GW.viewport.bounds.width, GW.viewport.bounds.height, { floor: 'FLOOR', boundary: 'WALL', flags: 'MAP_ALWAYS_LIT, MAP_REVEALED' });

    map.name = '-- Town --';
    townPlaceStores(map);

    // dungeonCarveIntoMap(grid);
    //
    // await mapPlaceStairs(0, 1);
    // const start = mapNewSpot(DUNGEON.floorTile);  // Set up the character starting location (used for monster placement too)
    // DUNGEON.locations.start = start;
    //
    // // lightTown(grid);
    //
    // freeGrid(grid);
    //
    // let numberOfMonsters = 6;
    // while (rand_percent(60)) {
    //   numberOfMonsters++;
    // }
    // await populateMonsters(numberOfMonsters, true);

    // storeMaintenance();

    map.revealAll();
    return map;
}
