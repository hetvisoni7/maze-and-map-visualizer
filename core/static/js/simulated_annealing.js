/* ─── Simulated Annealing ─────────────────────────────────────────────
   Algorithm:
   1 node ← start
   2 bestNode ← node
   3 T ← Initial Large Value
   4 for time ← 1 to numberOfEpochs
   5   while cycles < M:
   6     neighbour ← RandomNeighbour(node)
   7     deltaE ← h(neighbour) - h(node)
   8     if Random(0,1) < 1 / (1 + e^(deltaE/T))  // deltaE is positive if neighbour is worse
   9       then node ← neighbour
   10    if h(node) < h(bestNode)
   11      then bestNode ← node
   12  T ← T * CoolingConstant
   13 return bestNode
   ────────────────────────────────────────────────────────────────────── */

class SimulatedAnnealingAlgorithm {
    constructor(maze, start, end, nEpochs = 5, cyclesPerEpoch = 50, initialTemp = 100, heuristicType = 'manhattan') {
        this.maze = maze;
        this.start = start;
        this.end = end;
        this.gridSizeX = maze[0].length;
        this.gridSizeY = maze.length;
        this.nEpochs = nEpochs;
        this.cyclesPerEpoch = cyclesPerEpoch;
        this.initialTemp = initialTemp;
        this.temperature = initialTemp;
        this.heuristicType = heuristicType;

        this.current = { ...start };
        this.bestNode = { ...this.current, h: this.h(this.current) };

        this.epoch = 1;
        this.cycle = 0;
        this.path = [this.maze[this.current.y][this.current.x]];
        this.isComplete = false;
        this.nodesVisited = 1;

        this.openStack = []; 
        this.closedList = [];

        this.stepNumber = 1; // 1: Neighbour, 2: Decision, 3: Update Best, 4: Cooling
        this.coolingFactor = 0.1; // User example used t *= 0.1
    }

    h(node) {
        const dx = node.x - this.end.x;
        const dy = node.y - this.end.y;
        if (this.heuristicType === 'euclidean') {
            return Math.sqrt(dx * dx + dy * dy);
        }
        return Math.abs(dx) + Math.abs(dy);
    }

    getNeighbours(node) {
        const directions = [
            { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }
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
                step: { title: 'Goal Reached!', code: `Best: (${this.bestNode.x},${this.bestNode.y})`, line: 12 }
            };
        }

        if (this.epoch > this.nEpochs) {
            this.isComplete = true;
            return {
                pathFound: false,
                currentCell, visitedCell: currentCell,
                bestNode: this.bestNode,
                step: { title: 'Finished Epochs', code: `Best: (${this.bestNode.x},${this.bestNode.y}) | H: ${this.bestNode.h.toFixed(1)}`, line: 14 }
            };
        }

        if (this.stepNumber === 1) {
            // 6 neighbour ← RandomNeighbour(node)
            const neighbours = this.getNeighbours(this.current);
            if (neighbours.length === 0) {
                this.isComplete = true;
                return { pathFound: false, step: { title: 'No Moves', code: 'Current node is blocked', line: 14 } };
            }

            this.candidate = neighbours[Math.floor(Math.random() * neighbours.length)];
            this.openStack = [this.candidate]; 
            this.stepNumber = 2;

            return {
                currentCell,
                visitedCell: currentCell,
                bestNode: this.bestNode,
                step: { 
                    title: `Epoch ${this.epoch} | Cycle ${this.cycle+1}: Neighbour`, 
                    code: `cand: (${this.candidate.x},${this.candidate.y}) h=${this.candidate.h.toFixed(1)} | T: ${this.temperature.toFixed(2)}`,
                    line: 6 
                }
            };
        }

        if (this.stepNumber === 2) {
            // 7 deltaE ← eval(neighbour) – eval(node)
            const deltaE = this.candidate.h - this.h(this.current);
            const prob = 1 / (1 + Math.exp(deltaE / this.temperature));
            const rand = Math.random();

            this.cycle++;
            
            if (rand < prob) {
                // 9 then node ← neighbour
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
                        code: `P(${prob.toFixed(3)}) > R(${rand.toFixed(3)}) | Temp: ${this.temperature.toFixed(2)}`, 
                        line: 8 
                    }
                };
            } else {
                this.stepNumber = 3; 
                return {
                    currentCell,
                    visitedCell: currentCell,
                    bestNode: this.bestNode,
                    step: { 
                        title: 'Move Rejected', 
                        code: `P(${prob.toFixed(3)}) <= R(${rand.toFixed(3)}) | Stay at (${this.current.x},${this.current.y})`, 
                        line: 8 
                    }
                };
            }
        }

        if (this.stepNumber === 3) {
            // 10 if eval(node) better than eval(bestNode)
            const hN = this.h(this.current);
            if (hN < this.bestNode.h) {
                this.bestNode = { ...this.current, h: hN };
                this.stepNumber = (this.cycle >= this.cyclesPerEpoch) ? 4 : 1;
                return {
                    currentCell: this.maze[this.current.y][this.current.x],
                    visitedCell: this.maze[this.current.y][this.current.x],
                    bestNode: this.bestNode,
                    step: { title: 'New Global Best!', code: `bestNode ← (${this.current.x},${this.current.y}) h=${hN.toFixed(1)}`, line: 11 }
                };
            } else {
                const oldStep = this.stepNumber;
                this.stepNumber = (this.cycle >= this.cyclesPerEpoch) ? 4 : 1;
                return {
                    currentCell: this.maze[this.current.y][this.current.x],
                    visitedCell: this.maze[this.current.y][this.current.x],
                    bestNode: this.bestNode,
                    step: { title: (this.cycle >= this.cyclesPerEpoch) ? 'Epoch Complete' : 'Continuing Cycle', code: `h(node)=${hN.toFixed(1)}`, line: 10 }
                };
            }
        }

        if (this.stepNumber === 4) {
            // 13 T ← CoolinGFunCtion(T, time)
            const oldT = this.temperature;
            this.temperature *= this.coolingFactor;
            this.epoch++;
            this.cycle = 0;
            this.stepNumber = 1;

            return {
                currentCell,
                visitedCell: currentCell,
                bestNode: this.bestNode,
                step: { title: 'Cooling Process', code: `T: ${oldT.toFixed(2)} → ${this.temperature.toFixed(2)} (x 0.1)`, line: 13 }
            };
        }
    }
}
