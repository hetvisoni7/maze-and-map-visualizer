const ROWS = 20;
const COLS = 20;

const mazeElement = document.getElementById("maze");

// Grid values
// 0 = free, 1 = wall
let maze = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => 0)
);

// Create grid
function createMaze() {
    mazeElement.innerHTML = "";
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.id = `cell-${r}-${c}`;

            // Toggle wall on click
            cell.addEventListener("click", () => {
                if ((r === 0 && c === 0) || (r === ROWS-1 && c === COLS-1)) return;
                maze[r][c] = maze[r][c] === 0 ? 1 : 0;
                cell.classList.toggle("wall");
            });

            mazeElement.appendChild(cell);
        }
    }

    document.getElementById("cell-0-0").classList.add("start");
    document.getElementById(`cell-${ROWS-1}-${COLS-1}`).classList.add("goal");
}

createMaze();
