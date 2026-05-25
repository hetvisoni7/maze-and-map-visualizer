/* ─── Stochastic Hill Climbing ─────────────────────────────────────────
   Algorithm:
   1 node ← start
   2 bestNode ← node
   3 while criteria:
   4   neighbour ← RandomNeighbour(node)
   5   deltaE ← eval(neighbour) - eval(node)
   6   if Random(0,1) < 1 / (1 + e^(-deltaE/T))
   7     then node ← neighbour
   8   if eval(node) better than eval(bestNode)
   9     then bestNode ← node
   10 return bestNode
   ────────────────────────────────────────────────────────────────────── */

class StochasticHillClimbingAlgorithm {
    constructor(maze, start, end, nSteps = 100, temperature = 80, heuristicType = 'manhattan') {
        this.maze = maze;
        this.start = start;
        this.end = end;
        this.gridSizeX = maze[0].length;
        this.gridSizeY = maze.length;
        this.nSteps = nSteps;
        this.temperature = temperature;
        this.heuristicType = heuristicType;

        this.current = { ...start };
        this.bestNode = { ...this.current, h: this.h(this.current) };

        this.iterations = 0;
        this.path = [this.maze[this.current.y][this.current.x]];
        this.isComplete = false;
        this.nodesVisited = 1;

        this.openStack = []; // For UI display (neighbour info)
        this.closedList = []; // For UI display

        this.stepNumber = 1; // 1: Pick Neighbour, 2: Decision, 3: Update Best
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

    _probFormula(deltaE) {
        return `1 / (1 + e^(${deltaE.toFixed(2)} / ${this.temperature}))`;
    }

    getNeighbours(node) {
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

        // Goal Check
        if (this.current.x === this.end.x && this.current.y === this.end.y) {
            this.isComplete = true;
            return {
                pathFound: true,
                path: this.path.slice(),
                currentCell, visitedCell: currentCell,
                bestNode: this.bestNode,
                step: { title: 'Goal Reached!', code: `BestNode: (${this.bestNode.x},${this.bestNode.y}) | H: 0.0`, line: 10 }
            };
        }

        if (this.iterations >= this.nSteps) {
            this.isComplete = true;
            return {
                pathFound: false,
                currentCell, visitedCell: currentCell,
                bestNode: this.bestNode,
                step: { title: 'Finished Iterations', code: `BestNode: (${this.bestNode.x},${this.bestNode.y}) | H: ${this.bestNode.h.toFixed(1)}`, line: 10 }
            };
        }

        if (this.stepNumber === 1) {
            // 4 neighbour ← RandomNeighbour(node)
            const neighbours = this.getNeighbours(this.current);
            if (neighbours.length === 0) {
                this.isComplete = true;
                return { pathFound: false, step: { title: 'Stuck', code: 'No neighbours found', line: 10 } };
            }

            this.candidate = neighbours[Math.floor(Math.random() * neighbours.length)];
            this.openStack = [this.candidate]; // Visual update
            this.stepNumber = 2;

            return {
                currentCell,
                visitedCell: currentCell,
                bestNode: this.bestNode,
                step: { 
                    title: `Iteration ${this.iterations + 1}: Cand. neighbour`, 
                    code: `cand ← (${this.candidate.x},${this.candidate.y}) h=${this.candidate.h.toFixed(1)}`,
                    line: 4 
                }
            };
        }

        if (this.stepNumber === 2) {
            // 5 deltaE ← eval(neighbour) – eval(node)
            // Note: In our minimization (distance), better is lower. deltaE = h(neighbour) - h(current)
            // If deltaE is negative, neighbour is better.
            const deltaE = this.candidate.h - this.h(this.current);
            const prob = 1 / (1 + Math.exp(deltaE / this.temperature));
            const rand = Math.random();

            this.iterations++;
            
            if (rand < prob) {
                // 7 node ← neighbour
                this.current = { ...this.candidate };
                const newCell = this.maze[this.current.y][this.current.x];
                this.path.push(newCell);
                this.closedList.push({ x: this.current.x, y: this.current.y });
                this.nodesVisited++;
                this.stepNumber = 3;

                return {
                    currentCell: newCell,
                    visitedCell: newCell,
                    bestNode: this.bestNode,
                    step: { 
                        title: 'Move Accepted', 
                        code: `P(${prob.toFixed(3)}) > R(${rand.toFixed(3)}) | deltaE: ${deltaE.toFixed(1)}`, 
                        line: 6 
                    }
                };
            } else {
                this.stepNumber = 1; // Try again from same node
                return {
                    currentCell,
                    visitedCell: currentCell,
                    bestNode: this.bestNode,
                    step: { 
                        title: 'Move Rejected', 
                        code: `P(${prob.toFixed(3)}) <= R(${rand.toFixed(3)}) | deltaE: ${deltaE.toFixed(1)}`, 
                        line: 6 
                    }
                };
            }
        }

        if (this.stepNumber === 3) {
            // 8 if eval(node) better than eval(bestNode)
            const hN = this.h(this.current);
            const hB = this.bestNode.h;

            this.stepNumber = 1;
            if (hN < hB) {
                // 9 bestNode ← node
                this.bestNode = { ...this.current, h: hN };
                return {
                    currentCell: this.maze[this.current.y][this.current.x],
                    visitedCell: this.maze[this.current.y][this.current.x],
                    bestNode: this.bestNode,
                    step: { title: 'New Best Node!', code: `bestNode ← (${this.current.x},${this.current.y}) | H: ${hN.toFixed(1)}`, line: 9 }
                };
            } else {
                return {
                    currentCell: this.maze[this.current.y][this.current.x],
                    visitedCell: this.maze[this.current.y][this.current.x],
                    bestNode: this.bestNode,
                    step: { title: 'No global improvement', code: `${hN.toFixed(1)} >= ${hB.toFixed(1)}`, line: 8 }
                };
            }
        }
    }
}
