/* ─── Tabu Search ──────────────────────────────────────────────────────
   Like hill climbing but maintains a tabu list (short-term memory) of
   recently visited cells. Allows moving to non-best neighbours when
   stuck, as long as they are not on the tabu list.
   ────────────────────────────────────────────────────────────────────── */

class TabuSearchAlgorithm {
    constructor(maze, start, end, tabuSize = 5, heuristicType = 'manhattan') {
        this.maze = maze;
        this.start = start;
        this.end = end;
        this.gridSizeX = maze[0].length;
        this.gridSizeY = maze.length;
        this.heuristicType = heuristicType;

        // Python Example Variables
        this.current = { ...start };
        this.bestSeen = { ...start, h: this.h(start) };
        this.tabuSize = tabuSize;
        this.maxIterations = 1000;
        this.iterations = 0;

        // memory = { "x,y": count }
        this.memory = {};
        this.path = [this.maze[start.y][start.x]];
        
        // UI logic 
        this.visited = new Set([this.key(this.start)]);
        this.isComplete = false;
        this.nodesVisited = 0; 
        this.backtrackCount = 0; 
        this.openStack = []; 
        this.closedList = [];

        this.stepNumber = 1; // State machine for visual pseudocode steps
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
        // Lower h is better for minimization
        return this.h(a) < this.h(b);
    }

    moveGen(node) {
        const directions = [
            { dx: 0, dy: -1 },
            { dx: 1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 }
        ];
        const children = [];
        for (const dir of directions) {
            const newX = node.x + dir.dx;
            const newY = node.y + dir.dy;
            if (newX >= 0 && newX < this.gridSizeX && newY >= 0 && newY < this.gridSizeY) {
                const cell = this.maze[newY][newX];
                if (!cell.isObstacle) children.push({ x: newX, y: newY, h: this.h({x: newX, y: newY}) });
            }
        }
        return children;
    }

    allowed(nodes) {
        // memory[i] == 0 means allowed
        return nodes.filter(n => (this.memory[this.key(n)] || 0) === 0);
    }

    best(nodes) {
        if (nodes.length === 0) return null;
        // Sort ascending for minimization
        return nodes.slice().sort((a, b) => this.h(a) - this.h(b))[0];
    }

    update_memory(n, taboo) {
        const nKey = this.key(n);
        // Decrement all non-zero counts
        for (const k in this.memory) {
            if (this.memory[k] > 0) {
                this.memory[k] -= 1;
            }
        }
        // Set new tabu node
        this.memory[nKey] = taboo;
    }

    _mathFormula() {
        return this.heuristicType === 'euclidean' ? '√((x1-x2)² + (y1-y2)²)=' : '|x1-x2| + |y1-y2|=';
    }

    step() {
        if (this.isComplete) return { pathFound: false };
        if (this.iterations >= this.maxIterations) {
            this.isComplete = true;
            return { pathFound: false, step: { title: 'Stop: Limit met', code: `BestNode: (${this.bestSeen.x},${this.bestSeen.y}) | H: ${this.bestSeen.h.toFixed(1)}`, line: 8 } };
        }

        const currentCell = this.maze[this.current.y][this.current.x];

        // Goal test (implicit termination criterion)
        if (this.current.x === this.end.x && this.current.y === this.end.y) {
            this.isComplete = true;
            return {
                pathFound: true,
                path: this.path.slice(),
                currentCell, visitedCell: currentCell,
                step: { title: 'Goal Reached!', code: `BestNode: (${this.bestSeen.x},${this.bestSeen.y}) | H: 0.0`, line: 8 }
            };
        }

        if (this.stepNumber === 1) {
            this.nodesVisited++;
            this.closedList.push({ x: this.current.x, y: this.current.y });

            const neighbors = this.moveGen(this.current);
            const allowedNeighbors = this.allowed(neighbors);
            const nextNode = this.best(allowedNeighbors);

            // Populating UI DS Array
            this.openStack = allowedNeighbors.sort((a,b) => a.h - b.h);

            // If no allowed move, stop.
            if (!nextNode) {
                this.isComplete = true;
                return { pathFound: false, currentCell, visitedCell: currentCell,
                    step: { title: 'Stop: No moves', code: `BestNode: (${this.bestSeen.x},${this.bestSeen.y}) | H: ${this.bestSeen.h.toFixed(1)}`, line: 8 } };
            }

            // Update current node to be next best
            this.current = { ...nextNode };
            this.path.push(this.maze[this.current.y][this.current.x]);
            this.visited.add(this.key(this.current));
            this.iterations++;

            // Visual feedback: Update classes based on memory counts
            document.querySelectorAll('.tabu-cell').forEach(el => el.classList.remove('tabu-cell'));
            for (const k in this.memory) {
                if (this.memory[k] > 0) {
                    const [tx, ty] = k.split(',').map(Number);
                    const el = document.querySelector(`.grid-cell[data-x="${tx}"][data-y="${ty}"]`);
                    if (el && !this.maze[ty][tx].isStart && !this.maze[ty][tx].isEnd) {
                        el.classList.add('tabu-cell');
                    }
                }
            }

            this.stepNumber = 2; // Next iteration will evaluate IF statement

            return {
                currentCell: this.maze[this.current.y][this.current.x], 
                visitedCell: currentCell,
                bestNode: this.bestSeen,
                step: { title: `N ← best(allowed(MoveGen(N)))`, code: `N=(${this.current.x},${this.current.y}) ${this._mathFormula()}${this.h(this.current).toFixed(1)}`, line: 5 }
            };
        }

        if (this.stepNumber === 2) {
            this.stepNumber = 1; // Return to MoveGen step next time

            const formulaStr = this._mathFormula();
            const hN = this.h(this.current);
            const hBS = this.h(this.bestSeen);

            // 6 IF N better than bestSeen
            if (this.better(this.current, this.bestSeen)) {
                // 7 bestSeen ← N
                this.bestSeen = { ...this.current, h: hN };
                
                // update_memory happens after IF in user's python code
                this.update_memory(this.current, this.tabuSize);

                return {
                    currentCell: this.maze[this.current.y][this.current.x], 
                    visitedCell: this.maze[this.current.y][this.current.x],
                    bestNode: this.bestSeen,
                    step: { title: `Found better globally!`, code: `bestSeen ← N (${hN.toFixed(1)} < ${hBS.toFixed(1)})`, line: 7 }
                };
            } else {
                this.update_memory(this.current, this.tabuSize);
                return {
                    currentCell: this.maze[this.current.y][this.current.x], 
                    visitedCell: this.maze[this.current.y][this.current.x],
                    bestNode: this.bestSeen,
                    step: { title: `N is not better than bestSeen`, code: `${hN.toFixed(1)} >= ${hBS.toFixed(1)}`, line: 6 }
                };
            }
        }
    }
}
