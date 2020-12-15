
// This Grid holds all the simulation data:
// 1 - alive, 0 - dead
let data = null;
let canvas = null;

const DEAD = GW.make.sprite(' ', [0], [0]);
const ALIVE = GW.make.sprite(' ', [0], [100, 50, 50]);

// when you click a cell, you make it alive
function handleClick(e) {
	const x = canvas.toX(e.clientX);
	const y = canvas.toY(e.clientY);

	lastX = x;
	lastY = y;

	console.log('click', x, y);
	data[x][y] = (data[x][y] + 1) % 2;
	draw();
}

let lastX = -1;
let lastY = -1;
// when you click a cell, you make it alive
function handleMove(e) {
	if (!e.buttons) {
		lastX = lastY = -1;
		return;
	}
	const x = canvas.toX(e.clientX);
	const y = canvas.toY(e.clientY);

	if (x == lastX && y == lastY) return;
	lastX = x;
	lastY = y;

	console.log('click', x, y);
	data[x][y] = (data[x][y] + 1) % 2;
	draw();
}

// draw all the cells
// alive = @, dead = ' '
function draw() {
	data.forEach( (v, x, y) => {
		GW.ui.buffer.drawSprite(x, y, v ? ALIVE : DEAD);
	});
	// canvas.render();
  GW.ui.buffer.render();
}


// return the number of alive neighbors for the cell
function neighborCount(x, y) {
	let count = 0;
	data.eachNeighbor(x, y, (v, i, j) => {
		if (v) { count += 1; }
	});
	return count;
}

/*
1 - Any live cell with two or three live neighbours survives.
2 - Any dead cell with three live neighbours becomes a live cell.
3 - All other live cells die in the next generation. Similarly, all other dead cells stay dead.
*/
function runSim() {
	const newData = GW.grid.alloc(100, 34, 0);	// grid for sim results (filled with 0's)

	data.forEach( (v, i, j) => {
		const count = neighborCount(i, j);
		if (v) {
			if (count < 2 || count > 3) v = 0; // see 1, 3 above
		}
		else {
			if (count == 3) v = 1;	// see 2, 3 above
		}

		newData[i][j] = v;	// update new data
	});

	GW.grid.free(data);	// recycle old data
	data = newData;			// use new data
	draw();							// redraw screen
}

// start the environment
async function start() {
	canvas = GW.ui.start({ tileSize: 11, div: 'game', io: false });
	canvas.node.onmousedown = handleClick;
	canvas.node.onmousemove = handleMove;
	document.onkeydown = runSim;

  data = GW.grid.alloc(canvas.width, canvas.height);

	GW.ui.buffer.drawText(20, 15, 'Click to Turn on/off some cells.', [100,50,0]);
	GW.ui.buffer.drawText(20, 17, 'Press any key to run simulation.', [100,50,0]);
  GW.ui.buffer.render();

}

window.onload = start;
