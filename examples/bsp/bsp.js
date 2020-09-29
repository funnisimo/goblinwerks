
let canvas = null;
let MAP = null;
const startingXY = [40, 28];

GW.random.seed(12345);

const TILES = GW.tiles;


BOX = GW.item.installKind('BOX', {
	name: 'box',
	description: 'a large wooden box',
	sprite: { ch: '\u2612', fg: 'light_brown' },
	flags: 'A_PUSH, A_PULL, A_SLIDE, A_NO_PICKUP, IK_BLOCKS_MOVE',
	stats: { health: 10 }
});




class Node {
	constructor(x, y, w, h) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
	}

	get size() { return this.w * this.h; }
	tooNarrow(minWidth) { return (this.w <= minWidth*2); }
	tooShort(minHeight) { return (this.h <= minHeight*2); }
	tooSmall(minWidth, minHeight) { return (this.tooNarrow(minWidth) && this.tooShort(minHeight)); }

	containsXY(x, y) {
		if (x < this.x || y < this.y) return false;
		if (x > this.x + this.w || y > this.y + this.h) return false;
		return true;
	}

	split(minWidth, minHeight) {
		let splitWidth = !this.tooNarrow(minWidth);
		let splitHeight  = !this.tooShort(minHeight);
		if ((!splitWidth) && (!splitHeight)) {
			console.log('tooNarrow && tooShort', this.toString());
			return null;
		}
		else if (splitWidth && splitHeight) {
			if (this.w > this.h * 2) {
				splitHeight = false;	// splitWidth = true;
			}
			else if (this.w * 1.5 > this.h ) {
				splitWidth = false;	// splitHeight = true;
			}
			else if (GW.random.chance(50)) {
				splitHeight = false;	// splitWidth = true;
			}
			else {
				splitWidth = false;		// splitHeight = true;
			}
		}

		if (splitHeight) {
			let plusH = (this.h - minHeight*2);
			let topH = GW.random.clumped(0, plusH, 3) + minHeight; // + minHeight;
			console.log('Divide TOP/BOTTOM', this.toString(), 'topH=', topH, '=', minHeight, '+ rnd:', plusH);
			const bottomNode = new Node(this.x, this.y + topH, this.w, this.h - topH);
			this.h = topH;
			console.log(' - ', this.toString());
			console.log(' - ', bottomNode.toString());
			return bottomNode;
		}
		if (splitWidth) {
			let plusW = this.w - minWidth*2;
			let leftW = GW.random.clumped(0, plusW, 3) + minWidth;
			console.log('Divide LEFT/RIGHT', this.toString(), 'leftW=', leftW, '=', minWidth, '+ rnd:', plusW);
			const rightNode = new Node(this.x + leftW, this.y, this.w - leftW, this.h);
			this.w = leftW;
			console.log(' - ', this.toString());
			console.log(' - ', rightNode.toString());
			return rightNode;
		}
	}

	toString() {
		return '[' + this.x + ',' + this.y + ' => ' + (this.x + this.w) + ',' + (this.y + this.h) + ']';
	}
}

function makeBspTree(map, opts={}) {
	const minW = opts.minWidth || opts.minW || 7;
	const minH = opts.minHeight || opts.minH || 5;
	const minCount = opts.minCount || 6;

	const root = new Node(1, 1, map.width - 1, map.height - 1);

	let nodes = [root];
	let active = true;
	let len = 1;
	while(active || len < minCount) {
		active = false;
		len = nodes.length;	// get before we add the new ones...
		for(let i = 0; i < len; ++i) {
			const node = nodes[i];
			if ((!node.tooSmall(minW, minH)) && (GW.random.chance(40) || len < minCount)) {
				const added = node.split(minW, minH);
				if (added) {
					nodes.push(added);
					active = true;
				}
			}
		}
	}

	return nodes;
}

function isOpen(grid, x, y) {
	return grid.hasXY(x, y) && (grid[x][y] == 0);
}


function digTunnel(grid, node, x, y, dx, dy) {
	let v = grid[x][y];
	while (!v) {
		x -= dx;
		y -= dy;
		if (!node.containsXY(x, y)) return false;
		v = grid[x][y];
	}
	// console.log('dig tunnel', x, y, v, dx, dy);

	if (grid[x + dx][y + dy]) {
		// console.log('- Not edge.');
		return false;
	}

	let fx = x + dx;
	let fy = y + dy;
	const doorX = fx;
	const doorY = fy;

	while(grid.hasXY(fx, fy)) {
		if (isOpen(grid, fx, fy)) {
			if (!isOpen(grid, fx + dy, fy + dx)) return false;
			if (!isOpen(grid, fx - dy, fy - dx)) return false;
		}
		else if (grid[fx][fy] == v) {
			// console.log('- same');
			return false;
		}
		else if (grid[fx][fy] == 2) {
			return false;	// do not tunnel into doors
		}
		else {
			// console.log('- end:', fx, fy, grid[fx][fy]);
			while( x != fx || y != fy) {
				grid[x][y] = v;
				x += dx;
				y += dy;
			}
			let l = grid[fx][fy];
			if (l == 2) {
				if (grid[fx-1][fy] > 2 && grid[fx-1][fy] != v) {
					l = grid[fx-1][fy];
				}
				else if (grid[fx+1][fy] > 2 && grid[fx+1][fy] != v) {
					l = grid[fx+1][fy];
				}
				else if (grid[fx][fy-1] > 2 && grid[fx][fy-1] != v) {
					l = grid[fx][fy-1];
				}
				else if (grid[fx][fy+1] > 2 && grid[fx][fy+1] != v) {
					l = grid[fx][fy+1];
				}
				else {
					l = v;	// same
				}
			}
			let a = Math.max(v, l);
			let b = Math.min(v, l);
			// console.log('connected:', a, '=>', b);
			grid.replace(a, b);
			grid[doorX][doorY] = 2;
			return l;
		}

		fx = fx + dx;
		fy = fy + dy;
	}

	// console.log('- Not found');
	return false;
}

function digUp(grid, node) {
	const seq = GW.utils.sequence(node.w);
	GW.random.shuffle(seq);

	for(let dx of seq) {
		if (digTunnel(grid, node, node.x + dx, node.y, 0, -1)) {
			return true;
		}
	}
	return false;
}

function digDown(grid, node) {
	const seq = GW.utils.sequence(node.w);
	GW.random.shuffle(seq);

	for(let dx of seq) {
		if (digTunnel(grid, node, node.x + dx, node.y + node.h - 1, 0, 1)) {
			return true;
		}
	}
	return false;
}

function digLeft(grid, node) {
	const seq = GW.utils.sequence(node.h);
	GW.random.shuffle(seq);

	for(let dy of seq) {
		if (digTunnel(grid, node, node.x, node.y + dy, -1, 0)) {
			return true;
		}
	}
	return false;
}


function digRight(grid, node) {
	const seq = GW.utils.sequence(node.h);
	GW.random.shuffle(seq);

	for(let dy of seq) {
		if (digTunnel(grid, node, node.x + node.w - 1, node.y + dy, 1, 0)) {
			return true;
		}
	}
	return false;
}


function digRoom(grid, node, id=1) {

	const opts = {
		width: node.w - 1,
		height: node.h - 1,
		minPct: 100,
	};

	const roomGrid = GW.grid.alloc(grid.width, grid.height);
	let tries = 20;
	let bounds;

	while(tries--) {
		const ratio = Math.abs(100 - Math.round(100 * node.w/node.h));
		// if (ratio < 20 && GW.random.chance(30)) {
		// 	GW.digger.circularRoom(opts, roomGrid);
		// }
		// else {
			GW.digger.rectangularRoom(opts, roomGrid);
		// }
		bounds = roomGrid.calcBounds();

		if (bounds.right - bounds.left < node.w && bounds.bottom - bounds.top < node.h) {
			break;
		}
	}

	if (!tries) {
		console.error('Failed to build room after 20 tries!');
		console.log(opts);
		return false;
	}

	GW.grid.offsetZip(grid, roomGrid, node.x - bounds.left, node.y - bounds.top, id);
	node.w = bounds.right - bounds.left + 1;
	node.h = bounds.bottom - bounds.top + 1;

	return true;
}


function digBspTree(map, tree, opts={}) {
	// console.log(tree);
	const grid = GW.grid.alloc(map.width, map.height);

	tree.forEach( (node, i) => {
		digRoom(grid, node, i + 3);
	});

	GW.random.shuffle(tree);

	const dig = [digLeft, digRight, digUp, digDown];
	tree.forEach( (node, i) => {
		GW.random.shuffle(dig);
		for(let i = 0; i < dig.length; ++i) {
			if (dig[i](grid, node)) return;
		}
	});

	// grid.dump();

	if (grid.count( (v) => v > 3 )) {
		GW.grid.free(grid);
		console.log('NOT CONNECTED!');
		return false;
	}

	grid.forEach( (v, i, j) => {
		if (v > 2) {
			map.setTile(i, j, 'FLOOR');
		}
		else if (v == 2) {
			map.setTile(i, j, 'DOOR');
		}
	});

	GW.grid.free(grid);
	return true;
}


function drawMap(attempt=0) {
	if (attempt > 20) {
		console.error('Failed to build map!');
		return false;
	}
	const seed = GW.random._v - 1;

	// dig a map
	MAP.clear();
	GW.dungeon.start(MAP);

	const opts = { minWidth: 7, minHeight: 5, minCount: 10, minPct: 100, start: startingXY };

	let success = false;
	let tree;
	while(!success) {
		tree = makeBspTree(MAP, opts);
		success = digBspTree(MAP, tree, opts);
	}

	// GW.dungeon.log = console.log;
	GW.dungeon.addLoops(30, 5);
	// GW.dungeon.log = GW.utils.NOOP;

	// let lakeCount = GW.random.number(5);
	// for(let i = 0; i < lakeCount; ++i) {
	// 	GW.dungeon.digLake();
	// }
	//
	// GW.dungeon.addBridges(40, 8);

	// if (!GW.dungeon.addStairs(startingXY[0], startingXY[1], -1, -1)) {
	// 	console.error('Failed to place stairs.');
	// 	return drawMap(++attempt);
	// }

	GW.dungeon.finish();

	console.log('BSP TREE', tree);

	const box = GW.make.item('BOX');
	MAP.addItemNear(1, 1, box);

	canvas.buffer.erase();
	GW.viewport.draw(canvas.buffer, MAP);
	console.log('MAP SEED = ', seed);
}


function handleClick(e) {
	startingXY[0] = canvas.toX(e.clientX);
	startingXY[1] = canvas.toY(e.clientY);
	drawMap();
}

function handleKey(e) {
	if (e.key == 'Shift') return;
	drawMap();
}



// start the environment
function start() {
	MAP = GW.make.map(80, 30);
	canvas = GW.ui.start({ width: 80, height: 30, div: 'game', io: false });
	// game.onmousedown = handleClick;
	document.onkeydown = handleKey;

	canvas.buffer.plotText(10, 15, 'Click to draw map with starting location at click point.', [100,50,0]);
	canvas.buffer.plotText(10, 17, 'Press any key to redesign the map at same starting point.', [100,50,0]);
}

window.onload = start;
