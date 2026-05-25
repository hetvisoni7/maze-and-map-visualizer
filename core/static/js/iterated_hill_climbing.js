/* ─── Iterated Hill Climbing ───────────────────────────────────────────
   Runs hill climbing repeatedly from random start positions (restarts).
   When stuck, restarts from a new random position. Continues until
   goal is found or max restarts is exceeded.
   ────────────────────────────────────────────────────────────────────── */

class IteratedHillClimbingAlgorithm {
    constructor(maze, start, end, maxRestarts = 5, heuristicType = 'manhattan') {
        this.maze        = maze;
        this.start       = start;
        this.end         = end;
        this.maxRestarts = maxRestarts;
        this.heuristicType = heuristicType;
        this.gridSizeX   = maze[0].length;
        this.gridSizeY   = maze.length;

        // 1 bestNode ← random candidate solution
        const initialRandom = this._randomFreeCell();
        this.bestNode = { ...initialRandom, h: this.h(initialRandom) };

        this.restartCount = 0;
        this.isComplete   = false;

        this.nodesVisited   = 0;
        this.backtrackCount = 0;

        // For display
        this.openStack  = [];
        this.closedList = [];

        this.stepNumber = 1; // 1: Select Random Start, 2: Hill Climb Step, 3: Compare results
        this._initIteration();
    }

    _initIteration() {
        // hillclimbing(random.choice(list(MoveGen.keys())))
        const startNode = this._randomFreeCell();
        this.current = { ...startNode, h: this.h(startNode) };
        this.visited = new Set([this.key(this.current)]);
        this.path    = [this.maze[this.current.y][this.current.x]];
    }

    key(node) {
        return `${node.x},${node.y}`;
    }

    h(node) {
        const dx = node.x - this.end.x;
        const dy = node.y - this.end.y;
        if (this.heuristicType === 'euclidean') {
            return Math.sqrt(dx * dx + dy * dy);
        }
        return Math.abs(dx) + Math.abs(dy);
    }

    better(a, b) {
        return this.h(a) < this.h(b);
    }

    _randomFreeCell() {
        const free = [];
        for (let y = 0; y < this.gridSizeY; y++) {
            for (let x = 0; x < this.gridSizeX; x++) {
                if (!this.maze[y][x].isObstacle) {
                    free.push({ x, y });
                }
            }
        }
        if (free.length === 0) return { ...this.start };
        return free[Math.floor(Math.random() * free.length)];
    }

    _moveGen(node) {
        const directions = [{dx:0,dy:-1},{dx:1,dy:0},{dx:0,dy:1},{dx:-1,dy:0}];
        const children = [];
        for (const dir of directions) {
            const nx = node.x + dir.dx, ny = node.y + dir.dy;
            if (nx >= 0 && nx < this.gridSizeX && ny >= 0 && ny < this.gridSizeY) {
                if (!this.maze[ny][nx].isObstacle && !this.visited.has(`${nx},${ny}`)) {
                    children.push({ x: nx, y: ny, h: this.h({x:nx, y:ny}) });
                }
            }
        }
        return children;
    }

    _mathFormula() {
        return this.heuristicType === 'euclidean' ? '√((x1-x2)² + (y1-y2)²)=' : '|x1-x2| + |y1-y2|=';
    }

    step() {
        if (this.isComplete) return { pathFound: false };

        const currentCell = this.maze[this.current.y][this.current.x];

        // Goal Test (Check during any step)
        if (this.current.x === this.end.x && this.current.y === this.end.y) {
            this.isComplete = true;
            return {
                pathFound: true,
                path: this.path.slice(),
                currentCell, visitedCell: currentCell,
                step: { title: 'Goal found!', code: `BestNode: (${this.current.x},${this.current.y}) | H: 0.0`, line: 6 }
            };
        }

        if (this.stepNumber === 1) {
            this.nodesVisited++;
            this.closedList.push({ x: this.current.x, y: this.current.y });

            // Inner Hill Climbing logic: find best neighbour
            const children = this._moveGen(this.current);
            const sorted = children.sort((a,b) => a.h - b.h);
            this.openStack = sorted;

            const nextNode = sorted[0];

            // while h(nextnode) < h(current)
            if (nextNode && nextNode.h < this.h(this.current)) {
                this.current = { ...nextNode };
                this.visited.add(this.key(this.current));
                this.path.push(this.maze[this.current.y][this.current.x]);
                
                return {
                    currentCell: this.maze[this.current.y][this.current.x], 
                    visitedCell: currentCell,
                    bestNode: this.bestNode, // Added bestNode
                    step: { title: `Iteration #${this.restartCount + 1}: Move`, code: `h(next)=${nextNode.h.toFixed(1)} < h(current)=${this.h(currentCell).toFixed(1)}`, line: 3 }
                };
            } else {
                // local optimum reached for this hillclimbing(s) run
                this.stepNumber = 2; 
                return {
                    currentCell, visitedCell: currentCell,
                    bestNode: this.bestNode, // Added bestNode
                    step: { title: `Iteration #${this.restartCount + 1}: Peak`, code: `currentBest=(${this.current.x},${this.current.y}) h=${this.h(this.current).toFixed(1)}`, line: 3 }
                };
            }
        }

        if (this.stepNumber === 2) {
            const currentBest = { ...this.current, h: this.h(this.current) };
            const hBS = this.h(this.bestNode);
            const hCB = currentBest.h;

            let stepData;
            // if h(currentbest) better than h(bestnode)
            if (hCB < hBS) {
                this.bestNode = { ...currentBest };
                stepData = { title: `New bestNode!`, code: `bestNode ← h(${hCB.toFixed(1)}) < h(${hBS.toFixed(1)})`, line: 5 };
            } else {
                stepData = { title: `Kept bestNode`, code: `h(currentBest)=${hCB.toFixed(1)} >= h(bestNode)=${hBS.toFixed(1)}`, line: 4 };
            }

            this.restartCount++;
            if (this.restartCount >= this.maxRestarts) {
                this.isComplete = true;
                return { 
                    currentCell, visitedCell: currentCell,
                    step: { title: 'Finished Iterations', code: `BestNode: (${this.bestNode.x},${this.bestNode.y}) | H: ${this.bestNode.h.toFixed(1)}`, line: 6 }
                };
            } else {
                this.stepNumber = 1;
                this._initIteration();
                return { currentCell, visitedCell: currentCell, step: stepData };
            }
        }
    }
}
