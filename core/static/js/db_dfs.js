/* ─── DB-DFS: Depth-Bounded Depth-First Search ─────────────────────────
   Matches exact pseudocode requested by user:
   1 OPEN ← (S, null, 0) : [ ]
   2 CLOSED ← empty list
   ...
   ────────────────────────────────────────────────────────────────────── */

class DBDFSAlgorithm {
    constructor(maze, start, end, depthLimit = 10) {
        this.maze       = maze;
        this.start      = start;
        this.end        = end;
        this.depthLimit = depthLimit;

        // 1 OPEN ← (S, null, 0) : [ ]
        this.openStack  = [{ node: {x: start.x, y: start.y}, parent: null, depth: 0, x: start.x, y: start.y }];
        // 2 CLOSED ← empty list
        this.closedList = [];

        this.isComplete     = false;
        this.nodesVisited   = 0;
        this.backtrackCount = 0;
    }

    step() {
        // 3 while OPEN is not empty
        if (this.openStack.length === 0) {
            this.isComplete = true;
            return { pathFound: false, step: {title: 'Return empty list', code: 'return empty list', line: 15} };
        }

        // 4 nodePair ← head OPEN
        const nodePair = this.openStack[0];
        
        // 5 (N, _, depth) ← nodePair
        const N = nodePair.node;
        const depth = nodePair.depth;

        this.nodesVisited++;
        const currentNode = this.maze[N.y][N.x];

        // 6 if GoalTest(N) = TRUE
        if (N.x === this.end.x && N.y === this.end.y) {
            this.isComplete = true;
            return {
                pathFound:   true,
                // 7 return ReconstructPath(nodePair, CLOSED)
                path:        this._reconstructPath(nodePair),
                currentCell: currentNode,
                visitedCell: currentNode,
                step:        { title: 'Goal Reached!', code: 'return ReconstructPath(nodePair, CLOSED)', line: 7 }
            };
        } else {
            // 8 else CLOSED ← nodePair: CLOSED
            this.closedList.unshift(nodePair);
        }

        // 9 if depth < depthBound
        if (depth < this.depthLimit) {
            // 10 children ← MoveGen(N)
            const children = this._moveGen(N);
            
            // 11 newNodes ← RemoveSeen(children, OPEN, CLOSED)
            const newNodes = this._removeSeen(children);
            
            // 12 newPairs ← MakePairs(newNodes, N, depth + 1)
            const newPairs = newNodes.map(c => ({ 
                node: c, parent: N, depth: depth + 1, x: c.x, y: c.y 
            }));
            
            // 13 OPEN ← newPairs ++ tail OPEN
            // `tail OPEN` means everything after the first element since nodePair was `head OPEN`
            this.openStack = newPairs.concat(this.openStack.slice(1));

            return {
                currentCell: currentNode,
                visitedCell: currentNode,
                step: { title: `Expand (${N.x}, ${N.y})`, code: 'OPEN ← newPairs ++ tail OPEN', line: 13 }
            };
        } else {
            // 14 else OPEN ← tail OPEN
            this.openStack = this.openStack.slice(1);
            this.backtrackCount++;

            return {
                currentCell: currentNode,
                visitedCell: currentNode,
                step: { title: `Depth Bound Hit (${depth})`, code: 'OPEN ← tail OPEN', line: 14 }
            };
        }
    }

    _moveGen(N) {
        const children = [];
        // Typically Up, Right, Down, Left
        const dirs = [{dx:0,dy:-1}, {dx:1,dy:0}, {dx:0,dy:1}, {dx:-1,dy:0}];
        for (const {dx, dy} of dirs) {
            const nx = N.x + dx, ny = N.y + dy;
            if (nx >= 0 && ny >= 0 && nx < this.maze[0].length && ny < this.maze.length) {
                if (!this.maze[ny][nx].isObstacle) {
                    children.push({x: nx, y: ny});
                }
            }
        }
        return children;
    }

    _removeSeen(children) {
        return children.filter(c => {
            const inOpen = this.openStack.some(p => p.node.x === c.x && p.node.y === c.y);
            const inClosed = this.closedList.some(p => p.node.x === c.x && p.node.y === c.y);
            return !inOpen && !inClosed;
        });
    }

    _reconstructPath(goalPair) {
        const path = [];
        let curr = goalPair;
        while (curr) {
            path.unshift(this.maze[curr.node.y][curr.node.x]);
            const pNode = curr.parent;
            if (!pNode) break;
            // Find parent pair in CLOSED
            curr = this.closedList.find(p => p.node.x === pNode.x && p.node.y === pNode.y);
        }
        return path;
    }
}
