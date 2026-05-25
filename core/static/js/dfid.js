/* ─── DFID: Depth-First Iterative Deepening ──────────────────────────────
   Algorithm:
   1 depthBound ← 0
   2 while TRUE
   3   result ← DB-DFS(start, depthBound)
   4   if result found return result
   5   depthBound ← depthBound + 1
   ────────────────────────────────────────────────────────────────────── */

class DFIDAlgorithm {
    constructor(maze, start, end) {
        this.maze = maze;
        this.start = start;
        this.end = end;
        this.depthBound = 0;
        
        this.isComplete = false;
        this.nodesVisited = 0;
        this.backtrackCount = 0;
        this.iteration = 0;
        this.history = []; // [{bound, iterations}]

        // Internal DB-DFS instance for the current depth bound
        this.initDepthSearch();
    }

    initDepthSearch() {
        this.dbdfs = new DBDFSAlgorithm(this.maze, this.start, this.end, this.depthBound);
        this.openStack = this.dbdfs.openStack;
        this.closedList = this.dbdfs.closedList;
        this.openStack = this.dbdfs.openStack;
        this.closedList = this.dbdfs.closedList;
        this.iteration = 0;
    }

    step() {
        if (this.isComplete) return { pathFound: false };

        // 3 result ← DB-DFS(start, depthBound)
        const result = this.dbdfs.step();

        // Update external state for UI tracking
        this.openStack = this.dbdfs.openStack;
        this.closedList = this.dbdfs.closedList;
        this.nodesVisited++; // Incremental visit across all iterations
        this.iteration++;

        if (result.pathFound) {
            this.isComplete = true;
            this.history.push({ bound: this.depthBound, iterations: this.iteration });
            return {
                ...result,
                step: { title: `Goal Found! (Path at Bound: ${this.depthBound})`, code: `DFID Search completed successfully`, line: 4 }
            };
        }

        // If DB-DFS finished this bound without finding goal
        if (this.dbdfs.isComplete && !result.pathFound) {
            // 5 depthBound ← depthBound + 1
            const oldBound = this.depthBound;
            
            // Log history
            this.history.push({ bound: oldBound, iterations: this.iteration });

            this.depthBound++;
            this.initDepthSearch();
            
            return {
                currentCell: this.maze[this.start.y][this.start.x],
                visitedCell: null,
                step: { 
                    title: `Increasing Depth: ${oldBound} → ${this.depthBound}`, 
                    code: 'depthBound ← depthBound + 1', 
                    line: 5 
                }
            };
        }

        // Otherwise, just return the current DB-DFS step
        return {
            ...result,
            step: {
                title: `Depth Bound ${this.depthBound}: ${result.step.title}`,
                code: result.step.code,
                line: 3
            }
        };
    }
}
