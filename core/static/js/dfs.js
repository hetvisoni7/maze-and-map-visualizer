class DFSAlgorithm {
    constructor(maze, start, end) {
        this.maze = maze;
        this.start = start;
        this.end = end;
        this.gridSize = maze.length;
        
        // Initialize data structures
        this.openStack = [{ ...start, parent: null }];
        this.closedList = [];
        this.currentCell = null;
        
        // Statistics
        this.nodesVisited = 0;
        this.backtrackCount = 0;
        this.isComplete = false;
        this.pathFound = false;
        this.finalPath = [];
        
        // Step tracking
        this.currentStep = 0;
        this.lastStepType = null;
    }

    step() {
        if (this.isComplete) {
            return { isComplete: true };
        }
        
        let result = {};
        
        // Step 1: Check if OPEN is empty
        if (this.openStack.length === 0) {
            this.isComplete = true;
            result.step = {
                title: 'OPEN stack is empty',
                code: 'No more nodes to explore',
                line: 4
            };
            return result;
        }
        
        // Step 2: Pop from OPEN stack
        const currentNode = this.openStack.pop();
        this.currentCell = this.maze[currentNode.y][currentNode.x];
        this.lastStepType = 'pop';
        
        result.currentCell = this.currentCell;
        result.step = {
            title: 'Pop from OPEN stack',
            code: `(N, parent) ← pop OPEN → ((${currentNode.x},${currentNode.y}), ${currentNode.parent ? `(${currentNode.parent.x},${currentNode.parent.y})` : 'null'})`,
            line: 5
        };
        
        // Step 3: Check if goal is reached
        if (this.isGoal(currentNode)) {
            this.isComplete = true;
            this.pathFound = true;
            this.finalPath = this.reconstructPath(currentNode);
            
            result.pathFound = true;
            result.path = this.finalPath;
            result.step = {
                title: 'Goal reached!',
                code: `GoalTest(N) = TRUE at (${currentNode.x},${currentNode.y})`,
                line: 6
            };
            return result;
        }
        
        // Step 4: Add to CLOSED list
        this.closedList.push(currentNode);
        this.nodesVisited++;
        
        result.visitedCell = this.currentCell;
        result.step = {
            title: 'Add to CLOSED list',
            code: `CLOSED ← [(N, parent)] + CLOSED`,
            line: 8
        };
        
        // Step 5: Generate children
        const children = this.generateChildren(currentNode);
        
        // Step 6: Remove seen nodes
        const newNodes = this.removeSeen(children);
        
        // Step 7: Create pairs and add to OPEN stack
        const newPairs = this.makePairs(newNodes, currentNode);
        this.openStack.push(...newPairs);
        
        // If we backtracked (popped but no new children added)
        if (this.lastStepType === 'pop' && newPairs.length === 0 && this.openStack.length > 0) {
            this.backtrackCount++;
        }
        
        result.step = {
            title: 'Expand children and add to OPEN',
            code: `children ← ${children.length} nodes, newNodes ← ${newPairs.length} nodes`,
            line: 11
        };
        
        return result;
    }

    isGoal(node) {
        return node.x === this.end.x && node.y === this.end.y;
    }

    generateChildren(node) {
        const directions = [
            { dx: 0, dy: -1, name: 'Up' },
            { dx: 1, dy: 0, name: 'Right' },
            { dx: 0, dy: 1, name: 'Down' },
            { dx: -1, dy: 0, name: 'Left' }
        ];
        
        const children = [];
        
        for (const dir of directions) {
            const newX = node.x + dir.dx;
            const newY = node.y + dir.dy;
            
            // Check boundaries
            if (newX >= 0 && newX < this.gridSize && newY >= 0 && newY < this.gridSize) {
                const cell = this.maze[newY][newX];
                
                // Check if not an obstacle
                if (!cell.isObstacle) {
                    children.push({
                        x: newX,
                        y: newY,
                        parent: node
                    });
                }
            }
        }
        
        return children;
    }

    removeSeen(nodes) {
        return nodes.filter(node => {
            // Check if in OPEN stack
            const inOpen = this.openStack.some(n => n.x === node.x && n.y === node.y);
            
            // Check if in CLOSED list
            const inClosed = this.closedList.some(n => n.x === node.x && n.y === node.y);
            
            return !inOpen && !inClosed;
        });
    }

    makePairs(nodes, parent) {
        return nodes.map(node => ({
            x: node.x,
            y: node.y,
            parent: parent
        }));
    }

    reconstructPath(goalNode) {
        const path = [];
        let currentNode = goalNode;
        
        while (currentNode !== null) {
            path.unshift(this.maze[currentNode.y][currentNode.x]);
            currentNode = currentNode.parent;
        }
        
        return path;
    }

    getNeighbors(x, y) {
        const neighbors = [];
        const directions = [
            { dx: 0, dy: -1 },
            { dx: 1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 }
        ];
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (newX >= 0 && newX < this.gridSize && newY >= 0 && newY < this.gridSize) {
                neighbors.push({ x: newX, y: newY });
            }
        }
        
        return neighbors;
    }

    getCell(x, y) {
        return this.maze[y] && this.maze[y][x];
    }
}

// Utility functions for the DFS algorithm
const DFS = {
    // Main DFS function based on provided pseudocode
    findPath: function(maze, start, end) {
        // OPEN ← (S, null) : [ ]
        let OPEN = [{ node: start, parent: null }];
        let CLOSED = [];
        
        while (OPEN.length > 0) {
            // nodePair ← head OPEN
            let nodePair = OPEN[0];
            OPEN = OPEN.slice(1);
            
            let N = nodePair.node;
            
            // if GoalTest(N) = TRUE
            if (N.x === end.x && N.y === end.y) {
                // return ReconstructPath(nodePair, CLOSED)
                return this.reconstructPath(nodePair, CLOSED);
            }
            
            // else CLOSED ← nodePair : CLOSED
            CLOSED = [nodePair, ...CLOSED];
            
            // children ← MoveGen(N)
            let children = this.moveGen(N, maze);
            
            // newNodes ← RemoveSeen(children, OPEN, CLOSED)
            let newNodes = this.removeSeen(children, OPEN, CLOSED);
            
            // newPairs ← MakePairs(newNodes, N)
            let newPairs = this.makePairs(newNodes, N);
            
            // OPEN ← newPairs ++ (tail OPEN)
            OPEN = [...newPairs, ...OPEN];
        }
        
        // return empty list
        return [];
    },
    
    reconstructPath: function(nodePair, CLOSED) {
        let path = [nodePair.node];
        let parent = nodePair.parent;
        
        while (parent !== null) {
            // Find the node with parent
            let link = this.findLink(parent, CLOSED);
            if (link) {
                path.unshift(link.node);
                parent = link.parent;
            } else {
                break;
            }
        }
        
        return path;
    },
    
    findLink: function(node, CLOSED) {
        for (let pair of CLOSED) {
            if (pair.node.x === node.x && pair.node.y === node.y) {
                return pair;
            }
        }
        return null;
    },
    
    moveGen: function(node, maze) {
        const gridSize = maze.length;
        const children = [];
        const directions = [
            { dx: 0, dy: -1 },
            { dx: 1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 }
        ];
        
        for (let dir of directions) {
            const newX = node.x + dir.dx;
            const newY = node.y + dir.dy;
            
            if (newX >= 0 && newX < gridSize && newY >= 0 && newY < gridSize) {
                if (!maze[newY][newX].isObstacle) {
                    children.push({ x: newX, y: newY });
                }
            }
        }
        
        return children;
    },
    
    removeSeen: function(nodeList, OPEN, CLOSED) {
        return nodeList.filter(node => {
            // Check if node occurs in OPEN
            let inOpen = OPEN.some(pair => pair.node.x === node.x && pair.node.y === node.y);
            
            // Check if node occurs in CLOSED
            let inClosed = CLOSED.some(pair => pair.node.x === node.x && pair.node.y === node.y);
            
            return !inOpen && !inClosed;
        });
    },
    
    makePairs: function(nodeList, parent) {
        return nodeList.map(node => ({
            node: node,
            parent: parent
        }));
    },
    
    occursIn: function(node, nodePairs) {
        for (let pair of nodePairs) {
            if (pair.node.x === node.x && pair.node.y === node.y) {
                return true;
            }
        }
        return false;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DFSAlgorithm, DFS };
}