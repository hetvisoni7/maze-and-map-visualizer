/* ─── Beam Search ──────────────────────────────────────────────────────
   Algorithm (Minimization Adaptation):
   BeamSearch(S, b)
   1 bestNode ← S
   2 nextNodes ← head sort(h, b) MoveGen(bestNode)
   3 while h(nextNodes[0]) is better than h(bestNode):
   4   CANDS ← []
   5   for each n in nextNodes:
   6     CANDS ← CANDS ++ MoveGen(n)
   7   bestNode ← head nextNodes
   8   nextNodes ← head sort(h, b) CANDS
   9 return bestNode
   ────────────────────────────────────────────────────────────────────── */

class BeamSearchAlgorithm {
    constructor(maze, start, end, beamWidth = 2, heuristicType = 'manhattan') {
        this.maze = maze;
        this.start = start;
        this.end = end;
        this.beamWidth = beamWidth;
        this.heuristicType = heuristicType;
        this.gridSizeX = maze[0].length;
        this.gridSizeY = maze.length;

        // 1 bestNode ← S
        this.bestNode = { ...start, h: this.h(start) };
        
        // 2 nextNodes ← head sort(h, b) MoveGen(bestNode)
        const initialChildren = this._getNeighbours(start);
        this.nextNodes = initialChildren.sort((a, b) => a.h - b.h).slice(0, beamWidth);
        
        this.isComplete = false;
        this.nodesVisited = 1;
        this.backtrackCount = 0;
        
        // UI tracking
        this.openStack = this.nextNodes; // Show current beam in "OPEN"
        this.closedList = []; // Track nodes processed
        this.pathNodes = [{...start}]; // For path reconstruction
        
        this.stepNumber = 1; // 1: Expand/Collect, 2: Update Beam
    }

    h(node) {
        const dx = node.x - this.end.x;
        const dy = node.y - this.end.y;
        if (this.heuristicType === 'euclidean') {
            return Math.sqrt(dx * dx + dy * dy);
        }
        return Math.abs(dx) + Math.abs(dy);
    }

    _getNeighbours(node) {
        const directions = [
            { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }
        ];
        const neighbours = [];
        for (const dir of directions) {
            const nx = node.x + dir.dx, ny = node.y + dir.dy;
            if (nx >= 0 && nx < this.gridSizeX && ny >= 0 && ny < this.gridSizeY) {
                if (!this.maze[ny][nx].isObstacle) {
                    neighbours.push({ x: nx, y: ny, h: this.h({ x: nx, y: ny }), parent: node });
                }
            }
        }
        return neighbours;
    }

    step() {
        if (this.isComplete) return { pathFound: false };

        const currentCell = this.maze[this.bestNode.y][this.bestNode.x];

        // Goal Test
        if (this.bestNode.x === this.end.x && this.bestNode.y === this.end.y) {
            this.isComplete = true;
            return {
                pathFound: true,
                path: this._reconstructPath(this.bestNode),
                currentCell, visitedCell: currentCell,
                bestNode: this.bestNode,
                step: { title: 'Goal Reached!', code: `BestNode: (${this.bestNode.x},${this.bestNode.y})`, line: 9 }
            };
        }

        // 3 while h(nextNodes[0]) is better than h(bestNode)
        const topCandidate = this.nextNodes[0];
        if (!topCandidate || topCandidate.h >= this.bestNode.h) {
            this.isComplete = true;
            return {
                pathFound: false,
                currentCell, visitedCell: currentCell,
                bestNode: this.bestNode,
                step: { title: 'Local Optimum Reached', code: `h(next)=${topCandidate?.h.toFixed(1) || '∞'} >= h(best)=${this.bestNode.h.toFixed(1)}`, line: 3 }
            };
        }

        if (this.stepNumber === 1) {
            // Collect CANDS
            this.candidates = [];
            for (const n of this.nextNodes) {
                this.candidates.push(...this._getNeighbours(n));
                this.closedList.push({ x: n.x, y: n.y });
                this.nodesVisited++;
            }
            
            this.stepNumber = 2;
            return {
                currentCell,
                visitedCell: currentCell,
                bestNode: this.bestNode,
                step: { title: `Beam width ${this.beamWidth}: Expanding`, code: `CANDS ← MoveGen(nextNodes)`, line: 6 }
            };
        }

        if (this.stepNumber === 2) {
            // Update bestNode and nextNodes
            this.bestNode = { ...this.nextNodes[0] };
            this.nextNodes = this.candidates.sort((a,b) => a.h - b.h).slice(0, this.beamWidth);
            this.openStack = this.nextNodes;
            
            this.stepNumber = 1;
            return {
                currentCell: this.maze[this.bestNode.y][this.bestNode.x],
                visitedCell: this.maze[this.bestNode.y][this.bestNode.x],
                bestNode: this.bestNode,
                step: { title: `New best: (${this.bestNode.x},${this.bestNode.y})`, code: `bestNode ← head nextNodes`, line: 7 }
            };
        }
    }

    _reconstructPath(node) {
        const path = [];
        let curr = node;
        while (curr) {
            path.unshift(this.maze[curr.y][curr.x]);
            curr = curr.parent;
        }
        return path;
    }
}
