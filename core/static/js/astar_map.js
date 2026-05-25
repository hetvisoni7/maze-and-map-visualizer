class AStarMapAlgorithm {
    constructor(visualizer) {
        this.visualizer = visualizer;
        this.delay = visualizer.getDelay();
    }

    // Heuristic: Haversine distance for geographic lat/lng coordinates
    heuristic(node1, node2) {
        const n1 = mapNodes[node1];
        const n2 = mapNodes[node2];
        const R = 6371; // Earth's radius in kilometers
        const dLat = (n2.lat - n1.lat) * Math.PI / 180;
        const dLon = (n2.lng - n1.lng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(n1.lat * Math.PI / 180) * Math.cos(n2.lat * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    // Get neighbors and their edge weights (k(N, M))
    getNeighbors(node) {
        return mapEdges.filter(e => e.source === node || e.target === node).map(e => {
            return {
                id: e.source === node ? e.target : e.source,
                dist: e.dist
            };
        });
    }

    async run(startState, endState) {
        this.visualizer.resetDataStructures();
        this.visualizer.setPseudocode('astar');

        // 1. parent(S) ← null
        // 2. g(S) ← 0
        // 3. f(S) ← g(S) + h(S)
        const parent = {};
        const gScore = {};
        const fScore = {};

        parent[startState] = null;
        gScore[startState] = 0;
        fScore[startState] = this.heuristic(startState, endState);

        await this.visualizer.highlightLine(1); // parent(S)
        await this.visualizer.highlightLine(2); // gScore
        await this.visualizer.highlightLine(3); // fScore
        await this.visualizer.pause();

        // 4. OPEN ← S : []
        let openList = [startState];

        // 5. CLOSED ← empty list
        let closedList = new Set();

        await this.visualizer.highlightLine(4);
        await this.visualizer.updateDataStructures(openList, Array.from(closedList), 0);
        await this.visualizer.pause();
        await this.visualizer.highlightLine(5);
        await this.visualizer.pause();

        // 6. while OPEN is not empty
        this.visualizer.addStep('Starting Search', `Source: ${startState}, Destination: ${endState}`);
        while (openList.length > 0) {
            await this.visualizer.highlightLine(6);
            await this.visualizer.pause();

            // 7. N ← remove node with lowest f-value from OPEN
            openList.sort((a, b) => fScore[a] - fScore[b]);
            const N = openList.shift();

            await this.visualizer.highlightLine(7);
            this.visualizer.addStep('Exploring Node', `Current: ${mapNodes[N].name} (${N}), f=${fScore[N].toFixed(2)}`);
            
            // Re-render
            this.visualizer.updateNodeState(N, 'current');
            await this.visualizer.updateDataStructures(openList, Array.from(closedList), fScore[N]);
            await this.visualizer.pause();

            // 8. add N to CLOSED
            closedList.add(N);
            this.visualizer.updateNodeState(N, 'visited');
            await this.visualizer.highlightLine(8);
            await this.visualizer.updateDataStructures(openList, Array.from(closedList), fScore[N]);
            await this.visualizer.pause();

            // 9. if GoalTest(N) = True then return ReconstructPath(N)
            await this.visualizer.highlightLine(9);
            if (N === endState) {
                this.visualizer.addStep('Goal Found!', `Destination ${mapNodes[endState].name} reached.`);
                await this.visualizer.pause();
                return this.reconstructPath(parent, endState);
            }

            // 10. for each neighbour M ϵ MoveGen(N)
            const neighbors = this.getNeighbors(N);
            await this.visualizer.highlightLine(10);
            await this.visualizer.pause();

            for (const neighbor of neighbors) {
                const M = neighbor.id;
                const dist_N_M = neighbor.dist;

                // 11. if (M ∉ OPEN and M ∉ CLOSED)
                await this.visualizer.highlightLine(11);
                await this.visualizer.pause();

                if (!openList.includes(M) && !closedList.has(M)) {
                    // 12. parent(M) ← N
                    parent[M] = N;
                    await this.visualizer.highlightLine(12);
                    // 13. g(M) ← g(N) + k(N,M)
                    gScore[M] = gScore[N] + dist_N_M;
                    await this.visualizer.highlightLine(13);
                    // 14. f(M) ← g(M) + h(M)
                    fScore[M] = gScore[M] + this.heuristic(M, endState);
                    await this.visualizer.highlightLine(14);

                    // 15. add M to OPEN
                    openList.push(M);
                    this.visualizer.addStep('New Neighbor Found', `Discovered ${mapNodes[M].name} (${M}), g=${gScore[M].toFixed(2)}`);
                    await this.visualizer.highlightLine(15);
                    this.visualizer.highlightEdge(N, M);
                    await this.visualizer.updateDataStructures(openList, Array.from(closedList), fScore[N]);
                    await this.visualizer.pause();
                } else {
                    // 16. else
                    await this.visualizer.highlightLine(16);
                    await this.visualizer.pause();

                    // 17. if (g(N) + k(N,M)) < g(M)
                    await this.visualizer.highlightLine(17);
                    if (gScore[N] + dist_N_M < gScore[M]) {
                        await this.visualizer.pause();
                        // 18. parent(M) ← N
                        parent[M] = N;
                        await this.visualizer.highlightLine(18);
                        // 19. g(M) ← g(N) + k(N,M)
                        gScore[M] = gScore[N] + dist_N_M;
                        await this.visualizer.highlightLine(19);
                        // 20. f(M) ← g(M) + h(M)
                        fScore[M] = gScore[M] + this.heuristic(M, endState);
                        await this.visualizer.highlightLine(20);
                        await this.visualizer.pause();

                        // 21. if M ϵ CLOSED
                        await this.visualizer.highlightLine(21);
                        if (closedList.has(M)) {
                            this.visualizer.addStep('Path Improved', `Better path to ${mapNodes[M].name} found via ${mapNodes[N].name}. Propagating...`);
                            await this.visualizer.pause();
                            // 22. PropagateImprovement(M)
                            await this.visualizer.highlightLine(22);
                            await this.propagateImprovement(M, gScore, fScore, parent, closedList, endState);
                        }
                    }
                }
            }
        }

        // 23. return empty list
        await this.visualizer.highlightLine(23);
        return [];
    }

    async propagateImprovement(M, gScore, fScore, parent, closedList, endState) {
        // PropagateImprovement(M)
        await this.visualizer.highlightLine(25);
        await this.visualizer.pause();

        const neighbors = this.getNeighbors(M);
        // 1. for each neighbour X ϵ MoveGen(M)
        await this.visualizer.highlightLine(26);
        await this.visualizer.pause();

        for (const neighbor of neighbors) {
            const X = neighbor.id;
            const dist_M_X = neighbor.dist;

            // 2. if g(M) + k(M,X) < g(X)
            await this.visualizer.highlightLine(27);
            if (gScore[M] + dist_M_X < gScore[X]) {
                await this.visualizer.pause();
                // 3. parent(X) ← M
                parent[X] = M;
                await this.visualizer.highlightLine(28);
                // 4. g(X) ← g(M) + k(M,X)
                gScore[X] = gScore[M] + dist_M_X;
                await this.visualizer.highlightLine(29);
                // 5. f(X) ← g(X) + h(X)
                fScore[X] = gScore[X] + this.heuristic(X, endState);
                await this.visualizer.highlightLine(30);
                await this.visualizer.pause();

                // 6. if X ϵ CLOSED
                await this.visualizer.highlightLine(31);
                if (closedList.has(X)) {
                    await this.visualizer.pause();
                    // 7. PropagateImprovement(X)
                    await this.visualizer.highlightLine(32);
                    await this.propagateImprovement(X, gScore, fScore, parent, closedList, endState);
                }
            }
        }
    }

    reconstructPath(parent, current) {
        const path = [current];
        while (parent[current] !== null) {
            current = parent[current];
            path.unshift(current);
        }
        return path;
    }
}
