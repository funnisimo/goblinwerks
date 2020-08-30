
// This Grid holds all the simulation data:
// 1 - alive, 0 - dead
let data = GW.grid.alloc(100, 34);

// when you click a cell, you make it alive
function handleClick(e) {
	const x = GW.canvas.toX(e.clientX);
	const y = GW.canvas.toY(e.clientY);

	data[x][y] = 1;
	draw();
}

// draw all the cells
// alive = @, dead = ' '
function draw() {
	const buf = GW.canvas.BUFFER;
	data.forEach( (v, x, y) => {
		if (v) {
			buf.plotChar(x, y, ' ', [0], [100, 50, 50]);
		}
		else {
			buf.plotChar(x, y, ' ', [0], [0]);
		}
	});
	GW.canvas.draw();
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
function start() {
	GW.canvas.setup(100, 34, 'game');
	game.onmousedown = handleClick;
	document.onkeydown = runSim;
}

window.onload = start;
