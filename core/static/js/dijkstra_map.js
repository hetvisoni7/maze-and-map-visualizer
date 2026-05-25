class DijkstraMapAlgorithm {
    constructor(visualizer) {
        this.visualizer = visualizer;
        this.delay = visualizer.getDelay();
    }

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
        this.visualizer.setPseudocode('dijkstra');

        const parent = {};
        const cost = {};
        const colors = {}; // WHITE (unvisited), BLACK (visited)

        // 1. Assign infinite cost to all nodes
        // 3. Assign color WHITE to all nodes
        Object.keys(mapNodes).forEach(nodeId => {
            cost[nodeId] = Infinity;
            colors[nodeId] = 'WHITE';
            this.visualizer.updateNodeState(nodeId, 'default');
        });

        await this.visualizer.highlightLine(1);
        await this.visualizer.highlightLine(3);
        this.visualizer.addStep('Initialization', 'Set all node costs to ∞ and color to WHITE.');
        await this.visualizer.pause();

        // 2. Set cost(S) = 0
        cost[startState] = 0;
        parent[startState] = null;
        await this.visualizer.highlightLine(2);
        this.visualizer.addStep('Start Node Setup', `Set cost for ${mapNodes[startState].name} to 0.`);
        await this.visualizer.pause();

        // 4. while there are WHITE nodes
        while (Object.values(colors).includes('WHITE')) {
            await this.visualizer.highlightLine(4);
            await this.visualizer.pause();

            // 5. N ← cheapest WHITE node
            let N = null;
            let minCostValue = Infinity;

            Object.keys(mapNodes).forEach(nodeId => {
                if (colors[nodeId] === 'WHITE' && cost[nodeId] < minCostValue) {
                    minCostValue = cost[nodeId];
                    N = nodeId;
                }
            });

            // If no reachable WHITE node exists, break
            if (N === null || cost[N] === Infinity) break;

            await this.visualizer.highlightLine(5);
            this.visualizer.updateNodeState(N, 'current');
            this.visualizer.addStep('Picking Node', `Cheapest WHITE node: ${mapNodes[N].name} (Cost: ${cost[N].toFixed(2)})`);
            
            // Sync with UI Data Structure view
            const whiteNodes = Object.keys(colors).filter(id => colors[id] === 'WHITE' && cost[id] < Infinity);
            const blackNodes = Object.keys(colors).filter(id => colors[id] === 'BLACK');
            await this.visualizer.updateDataStructures(whiteNodes, blackNodes, cost[N]);
            await this.visualizer.pause();

            // 6. if N is Destination then Return Path
            await this.visualizer.highlightLine(6);
            if (N === endState) {
                this.visualizer.addStep('Destination Found!', `Reached ${mapNodes[endState].name}.`);
                await this.visualizer.pause();
                return this.reconstructPath(parent, endState);
            }

            // 7. Color N BLACK
            colors[N] = 'BLACK';
            this.visualizer.updateNodeState(N, 'visited');
            await this.visualizer.highlightLine(7);
            this.visualizer.addStep('Finalizing Node', `${mapNodes[N].name} is now BLACK (Visited).`);
            await this.visualizer.pause();

            // 8. for each neighbour M of N
            const neighbors = this.getNeighbors(N);
            await this.visualizer.highlightLine(8);
            await this.visualizer.pause();

            for (const neighbor of neighbors) {
                const M = neighbor.id;
                const kNM = neighbor.dist;

                // 9. Relaxation(N, M):
                await this.visualizer.highlightLine(9);
                
                // 10. if cost(N) + k(N,M) < cost(M)
                await this.visualizer.highlightLine(10);
                if (cost[N] + kNM < cost[M]) {
                    this.visualizer.addStep('Relaxation Effect', `New cheaper path to ${mapNodes[M].name} via ${mapNodes[N].name}.`);
                    await this.visualizer.pause();

                    // 11. cost(M) = cost(N) + k(N,M)
                    cost[M] = cost[N] + kNM;
                    await this.visualizer.highlightLine(11);
                    
                    // 12. parent(M) = N
                    parent[M] = N;
                    await this.visualizer.highlightLine(12);
                    
                    this.visualizer.highlightEdge(N, M);
                    // Update DS with new costs
                    const updatedWhite = Object.keys(colors).filter(id => colors[id] === 'WHITE' && cost[id] < Infinity);
                    await this.visualizer.updateDataStructures(updatedWhite, blackNodes, cost[N]);
                    await this.visualizer.pause();
                }
            }
        }

        // 13. return empty list
        await this.visualizer.highlightLine(13);
        return [];
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
