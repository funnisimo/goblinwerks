
let canvas = null;
let MAP = null;
const startingXY = [40, 28];

GW.random.seed(12345);

const TILES = GW.tiles;

function handleClick(e) {
	startingXY[0] = canvas.toX(e.clientX);
	startingXY[1] = canvas.toY(e.clientY);
	drawMap();
}

function handleKey(e) {
	if (e.key == 'Shift') return;
	drawMap();
}


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

	split(minWidth, minHeight) {
		let splitWidth = !this.tooNarrow(minWidth);
		let splitHeight  = !this.tooShort(minHeight);
		if ((!splitWidth) && (!splitHeight)) {
			console.log('tooNarrow && tooShort', this.toString());
			return null;
		}
		else if (splitWidth && splitHeight) {
			if (GW.random.percent(50)) {
				splitWidth = true;
				splitHeight = false;
			}
			else {
				splitHeight = true;
				splitWidth = false;
			}
		}

		if (this.w > this.h * 1.5) {
			splitHeight = false;
			splitWidth = true;
		}
		else if (this.h > this.w * 1.5) {
			splitHeight = true;
			splitWidth = false;
		}

		if (splitHeight) {
			let plusH = Math.min(10,(this.h - minHeight*2));
			let topH = GW.random.number(plusH) + minHeight; // + minHeight;
			console.log('Divide TOP/BOTTOM', this.toString());
			const bottomNode = new Node(this.x, this.y + topH, this.w, this.h - topH);
			this.h = topH;
			console.log(' - ', this.toString());
			console.log(' - ', bottomNode.toString());
			return bottomNode;
		}
		if (splitWidth) {
			let plusW = Math.min(15, this.w - minWidth*2);
			let leftW = GW.random.number(plusW) + minWidth;
			console.log('Divide LEFT/RIGHT', this.toString());
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

	const root = new Node(1, 1, map.width - 1, map.height - 1);

	let nodes = [root];
	let active = true;
	let len = 1;
	while(active || len < 5) {
		active = false;
		len = nodes.length;	// get before we add the new ones...
		for(let i = 0; i < len; ++i) {
			const node = nodes[i];
			if (len < 5 || ((!node.tooSmall(minW, minH)) && GW.random.percent(50))) {
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


function digTunnel(grid, x, y, dx, dy) {
	const v = grid[x][y];
	console.log('dig tunnel', x, y, v, dx, dy);

	if (grid[x + dx][y + dy]) {
		console.log('- Not edge.');
		return false;
	}

	let fx = x + dx;
	let fy = y + dy;

	while(grid.hasXY(fx, fy)) {
		if (isOpen(grid, fx, fy)) {
			if (!isOpen(grid, fx + dy, fy + dx)) return false;
			if (!isOpen(grid, fx - dy, fy - dx)) return false;
		}
		else if (grid[fx][fy] == v) {
			console.log('- same');
			return false;
		}
		else {
			console.log('- end:', fx, fy, grid[fx][fy]);
			while( x != fx || y != fy) {
				grid[x][y] = v;
				x += dx;
				y += dy;
			}
			const l = grid[fx][fy];
			let a = Math.max(v, l);
			let b = Math.min(v, l);
			console.log('connected:', a, '=>', b);
			grid.replace(a, b);
			return l;
		}

		fx = fx + dx;
		fy = fy + dy;
	}

	console.log('- Not found');
	return false;
}

function digUp(grid, node) {
	const seq = GW.utils.sequence(node.w);
	GW.random.shuffle(seq);

	for(let dx of seq) {
		if (digTunnel(grid, node.x + dx, node.y, 0, -1)) {
			return true;
		}
	}
	return false;
}

function digDown(grid, node) {
	const seq = GW.utils.sequence(node.w);
	GW.random.shuffle(seq);

	for(let dx of seq) {
		if (digTunnel(grid, node.x + dx, node.y + node.h - 1, 0, 1)) {
			return true;
		}
	}
	return false;
}

function digLeft(grid, node) {
	const seq = GW.utils.sequence(node.h);
	GW.random.shuffle(seq);

	for(let dy of seq) {
		if (digTunnel(grid, node.x, node.y + dy, -1, 0)) {
			return true;
		}
	}
	return false;
}


function digRight(grid, node) {
	const seq = GW.utils.sequence(node.h);
	GW.random.shuffle(seq);

	for(let dy of seq) {
		if (digTunnel(grid, node.x + node.w - 1, node.y + dy, 1, 0)) {
			return true;
		}
	}
	return false;
}

function digBspTree(map, tree, opts={}) {
	console.log(tree);
	const minW = opts.minWidth || opts.minW || 7;
	const minH = opts.minHeight || opts.minH || 5;

	const grid = GW.grid.alloc(map.width, map.height);

	tree.forEach( (node, i) => {
		const w = Math.round(node.w * (75 + GW.random.number(25)) / 100) - 1;
		const h = Math.round(node.h * (75 + GW.random.number(25)) / 100) - 1;
		const x = node.x + GW.random.clumped(1, node.w - w, 3) - 1;
		const y = node.y + GW.random.clumped(1, node.h - h, 3) - 1;
		node.x = x;
		node.y = y;
		node.w = w;
		node.h = h;
		grid.updateRect(x, y, w, h, () => i + 1 );
	});

	GW.random.shuffle(tree);

	const dig = [digLeft, digRight, digUp, digDown];
	tree.forEach( (node, i) => {
		GW.random.shuffle(dig);
		for(let i = 0; i < dig.length; ++i) {
			if (dig[i](grid, node)) return;
		}
	});

	grid.dump();

	if (grid.count( (v) => v > 1 )) {
		console.log('NOT CONNECTED!');
	}

	grid.forEach( (v, i, j) => {
		if (v) {
			map.setTile(i, j, 1);
		}
	});

	GW.grid.free(grid);
}


function drawMap(attempt=0) {
	if (attempt > 20) {
		console.error('Failed to build map!');
		return false;
	}
	const seed = GW.random._v - 1;

	// dig a map
	MAP.fill(6);
	const opts = { minWidth: 7, minHeight: 5, start: startingXY };
	const tree = makeBspTree(MAP, opts);
	digBspTree(MAP, tree, opts);

	GW.viewport.draw(canvas.buffer, MAP);
	console.log('MAP SEED = ', seed);
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
