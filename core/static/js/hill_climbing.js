/* ─── Hill Climbing ────────────────────────────────────────────────────
   Matches exact pseudocode requested by user:
   1 bestNode ← S
   2 nextNode ← head sort MoveGen(bestNode)
   ...
   ────────────────────────────────────────────────────────────────────── */

class HillClimbingAlgorithm {
    constructor(maze, start, end, heuristicType = 'manhattan') {
        this.maze  = maze;
        this.start = start;
        this.end   = end;
        this.heuristicType = heuristicType;

        // 1 bestNode ← S
        this.bestNode = { x: start.x, y: start.y, h: this.heuristic(start.x, start.y) };
        this.nextNode = null;
        
        this.visited    = new Set([`${start.x},${start.y}`]);
        this.path       = [{ ...start }];
        this.isComplete = false;

        this.nodesVisited   = 0;
        this.backtrackCount = 0;
        this.openStack  = [];
        this.closedList = [];
        this.stepNumber = 1; // Used to track which part of the psuedocode is currently executing
    }

    heuristic(x, y) {
        if (this.heuristicType === 'euclidean') {
            return Math.sqrt(Math.pow(x - this.end.x, 2) + Math.pow(y - this.end.y, 2));
        }
        // Default: Manhattan
        return Math.abs(x - this.end.x) + Math.abs(y - this.end.y);
    }
    
    _moveGen(node) {
        const dirs = [{dx:0,dy:-1},{dx:1,dy:0},{dx:0,dy:1},{dx:-1,dy:0}];
        const neighbours = [];
        for (const {dx,dy} of dirs) {
            const nx = node.x+dx, ny = node.y+dy;
            if (nx<0||ny<0||nx>=this.maze[0].length||ny>=this.maze.length) continue;
            if (this.maze[ny][nx].isObstacle) continue;
            if (this.visited.has(`${nx},${ny}`)) continue;
            neighbours.push({ x:nx, y:ny, h: this.heuristic(nx,ny) });
        }
        return neighbours;
    }

    _mathFormula() {
        return this.heuristicType === 'euclidean' ? '√((x1-x2)² + (y1-y2)²)=' : '|x1-x2| + |y1-y2|=';
    }

    step() {
        if (this.isComplete) return { pathFound: false };

        const currentCell = this.maze[this.bestNode.y][this.bestNode.x];
        this.nodesVisited++;
        this.closedList.push({ x: this.bestNode.x, y: this.bestNode.y });

        // Goal test
        if (this.bestNode.x === this.end.x && this.bestNode.y === this.end.y) {
            this.isComplete = true;
            return {
                pathFound:   true,
                path:        this.path.map(p => this.maze[p.y][p.x]),
                currentCell, visitedCell: currentCell,
                bestNode: this.bestNode,
                step: { title: 'Goal Reached!', code: `BestNode: (${this.bestNode.x},${this.bestNode.y}) | H: 0.0`, line: 6 }
            };
        }

        // 2 nextNode ← head sort MoveGen(bestNode)
        if (this.stepNumber === 1) {
            const neighbours = this._moveGen(this.bestNode);
            const sorted = neighbours.sort((a,b)=>a.h-b.h);
            this.openStack = sorted;
            
            if (sorted.length > 0) {
                this.nextNode = sorted[0];
                this.stepNumber = 2; // move to inside the loop next time
                return {
                    currentCell, visitedCell: currentCell,
                    step: { title: `Generate nextNode`, code: `nextNode: (${this.nextNode.x},${this.nextNode.y}) | ${this._mathFormula()}${this.nextNode.h.toFixed(1)}`, line: 2 }
                };
            } else {
                // Dead end
                this.isComplete = true;
                this.backtrackCount++;
                const hNode = this.heuristic(this.bestNode.x, this.bestNode.y);
                return {
                    pathFound: false,
                    currentCell, visitedCell: currentCell,
                    step: { title: 'Local optimum / Dead end', code: `BestNode: (${this.bestNode.x},${this.bestNode.y}) | H: ${hNode.toFixed(1)}`, line: 6 }
                };
            }
        }

        // Inside while loop processing
        if (this.stepNumber === 2) {
            const hBest = this.heuristic(this.bestNode.x, this.bestNode.y);
            // 3 while h(nextNode) is better than h(bestNode)
            if (this.nextNode && this.nextNode.h < hBest) {
                const prevH = hBest;
                const nextH = this.nextNode.h;
                const nx = this.nextNode.x; 
                const ny = this.nextNode.y;

                // 4 bestNode ← nextNode
                this.visited.add(`${this.nextNode.x},${this.nextNode.y}`);
                this.path.push({ x: this.nextNode.x, y: this.nextNode.y });
                this.bestNode = { x: this.nextNode.x, y: this.nextNode.y, h: nextH };
                
                const nextCell = this.maze[this.bestNode.y][this.bestNode.x];
                
                // We do '5 nextNode ← head sort MoveGen(bestNode)' up front for the next spin
                const neighbours = this._moveGen(this.bestNode);
                const sorted = neighbours.sort((a,b)=>a.h-b.h);
                this.openStack = sorted;
                if (sorted.length > 0) {
                    this.nextNode = sorted[0];
                } else {
                    this.nextNode = null;
                }
                
                return {
                    currentCell: nextCell, visitedCell: nextCell,
                    step: { title: `bestNode ← nextNode`, code: `h(next) ${nextH.toFixed(1)} < h(best) ${prevH.toFixed(1)}`, line: 4 }
                };
            } else {
                // Stop condition reached
                this.isComplete = true;
                return {
                    pathFound: false, // Stopped at local optimum, not goal necessarily
                    currentCell, visitedCell: currentCell,
                    step: { title: 'Stopping: no better neighbour', code: `BestNode: (${this.bestNode.x},${this.bestNode.y}) | H: ${hBest.toFixed(1)}`, line: 6 }
                };
            }
        }
    }
}
