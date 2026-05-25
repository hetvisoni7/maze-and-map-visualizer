/* ─── Random Walk ──────────────────────────────────────────────────────
   Stochastic Search:
   1 node ← random candidate solution or start
   2 bestNode ← node
   3 for i ← 1 to n
   4   node ← RandomChoose(MoveGen(node))
   5   if node is better than bestNode
   6     then bestNode ← node
   7 return bestNode
   ────────────────────────────────────────────────────────────────────── */

class RandomWalkAlgorithm {
    constructor(maze, start, end, nSteps = 10, heuristicType = 'manhattan') {
        this.maze = maze;
        this.start = start;
        this.end = end;
        this.gridSizeX = maze[0].length;
        this.gridSizeY = maze.length;
        this.nSteps = nSteps;
        this.heuristicType = heuristicType;

        // 1 node ← random candidate solution
        const node = this._getRandomStart();
        this.current = { ...node };
        
        // 2 bestNode ← node
        this.bestNode = { ...node, h: this.h(node) };

        this.iterations = 0;
        this.path = [this.maze[this.current.y][this.current.x]];
        this.visited = new Set([`${this.current.x},${this.current.y}`]);
        
        this.isComplete = false;
        this.nodesVisited = 1;
        this.backtrackCount = 0;
        this.openStack = []; // For UI display (showing neighbours)
        this.closedList = []; // For UI display

        this.stepNumber = 1; // 1: MoveGen & Choose, 2: Compare & Update bestNode
    }

    _getRandomStart() {
        const freeCells = [];
        for (let y = 0; y < this.gridSizeY; y++) {
            for (let x = 0; x < this.gridSizeX; x++) {
                if (!this.maze[y][x].isObstacle) {
                    freeCells.push({ x, y });
                }
            }
        }
        return freeCells[Math.floor(Math.random() * freeCells.length)];
    }

    h(node) {
        const dx = node.x - this.end.x;
        const dy = node.y - this.end.y;
        if (this.heuristicType === 'euclidean') {
            return Math.sqrt(dx * dx + dy * dy);
        }
        return Math.abs(dx) + Math.abs(dy);
    }

    _mathFormula() {
        return this.heuristicType === 'euclidean' ? '√((x1-x2)² + (y1-y2)²)=' : '|x1-x2| + |y1-y2|=';
    }

    moveGen(node) {
        const directions = [
            { dx: 0, dy: -1 },
            { dx: 1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 }
        ];
        const neighbours = [];
        for (const dir of directions) {
            const nx = node.x + dir.dx;
            const ny = node.y + dir.dy;
            if (nx >= 0 && nx < this.gridSizeX && ny >= 0 && ny < this.gridSizeY) {
                if (!this.maze[ny][nx].isObstacle) {
                    neighbours.push({ x: nx, y: ny, h: this.h({ x: nx, y: ny }) });
                }
            }
        }
        return neighbours;
    }

    step() {
        if (this.isComplete) return { pathFound: false };

        const currentCell = this.maze[this.current.y][this.current.x];

        // Goal test
        if (this.current.x === this.end.x && this.current.y === this.end.y) {
            this.isComplete = true;
            return {
                pathFound: true,
                path: this.path.slice(),
                currentCell, visitedCell: currentCell,
                step: { title: 'Goal Reached!', code: `BestNode: (${this.bestNode.x},${this.bestNode.y}) | H: 0.0`, line: 7 }
            };
        }

        if (this.iterations >= this.nSteps) {
            this.isComplete = true;
            return {
                pathFound: false,
                currentCell, visitedCell: currentCell,
                step: { title: 'Finished Random Walk', code: `BestNode: (${this.bestNode.x},${this.bestNode.y}) | H: ${this.bestNode.h.toFixed(1)}`, line: 7 }
            };
        }

        if (this.stepNumber === 1) {
            // 4 node ← RandomChoose(MoveGen(node))
            const neighbours = this.moveGen(this.current);
            this.openStack = neighbours; // Visual update

            if (neighbours.length === 0) {
                this.isComplete = true;
                return {
                    pathFound: false,
                    step: { title: 'Stuck: No neighbours', code: `BestNode: (${this.bestNode.x},${this.bestNode.y})`, line: 7 }
                };
            }

            const nextNode = neighbours[Math.floor(Math.random() * neighbours.length)];
            this.current = { ...nextNode };
            this.nodesVisited++;
            this.iterations++;
            this.path.push(this.maze[this.current.y][this.current.x]);
            this.closedList.push({ x: this.current.x, y: this.current.y });

            this.stepNumber = 2;
            return {
                currentCell: this.maze[this.current.y][this.current.x],
                visitedCell: currentCell,
                bestNode: this.bestNode,
                step: { title: `Step ${this.iterations}: Random Move`, code: `node ← (${this.current.x},${this.current.y})`, line: 4 }
            };
        }

        if (this.stepNumber === 2) {
            // 5 if node is better than bestNode
            const hCurrent = this.h(this.current);
            const hBest = this.bestNode.h;

            this.stepNumber = 1;
            if (hCurrent < hBest) {
                // 6 then bestNode ← node
                this.bestNode = { ...this.current, h: hCurrent };
                return {
                    currentCell: this.maze[this.current.y][this.current.x],
                    visitedCell: this.maze[this.current.y][this.current.x],
                    bestNode: this.bestNode,
                    step: { title: 'Found Better Node!', code: `bestNode ← (${this.current.x},${this.current.y}) | H: ${hCurrent.toFixed(1)}`, line: 6 }
                };
            } else {
                return {
                    currentCell: this.maze[this.current.y][this.current.x],
                    visitedCell: this.maze[this.current.y][this.current.x],
                    bestNode: this.bestNode,
                    step: { title: 'No improvement', code: `${hCurrent.toFixed(1)} >= ${hBest.toFixed(1)}`, line: 5 }
                };
            }
        }
    }
}
