class MapVisualizer {
    constructor() {
        this.delay = 50;
        this.isRunning = false;
        this.isPaused = false;

        // Initialize Leaflet Map
        this.map = L.map('leaflet-map-container', {
            zoomControl: false, // Hide default for cleaner UI
            zoomSnap: 0.25      // Allow more granular zoom levels
        }).setView([23.0, 81.0], 4.75); // Center exactly on India and fit perfectly

        // Basemaps for theme switching
        this.darkTileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
        this.lightTileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png';
        
        this.tileLayer = L.tileLayer(this.darkTileUrl, {
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(this.map);

        this.initTheme();

        this.edgeLayerGroup = L.layerGroup().addTo(this.map);
        this.nodeLayerGroup = L.layerGroup().addTo(this.map);

        this.nodes = {}; // map of stateCode to L.circleMarker
        this.edges = {}; // map of edgeId to L.polyline

        this.performanceData = {
            'astar': { time: 0, nodes: 0 },
            'dijkstra': { time: 0, nodes: 0 }
        };

        this.algorithms = {
            'astar': {
                name: 'A* Algorithm',
                class: AStarMapAlgorithm,
                description: 'A* uses both actual distance traveled g(n) and estimated direct distance to target h(n) to find the shortest path efficiently.',
                complexity: { time: 'O(E + V log V)', space: 'O(V)' },
                pseudocode: [
                    'A*(S)',
                    '1. parent(S) ← null',
                    '2. g(S) ← 0',
                    '3. f(S) ← g(S) + h(S)',
                    '4. OPEN ← S : []',
                    '5. CLOSED ← empty list',
                    '6. while OPEN is not empty',
                    '7.      N ← remove node with lowest f-value from OPEN',
                    '8.      add N to CLOSED',
                    '9.      if GoalTest(N) = True then return ReconstructPath(N)',
                    '10.     for each neighbour M ϵ MoveGen(N)',
                    '11.             if (M ∉ OPEN and M ∉ CLOSED)',
                    '12.                   parent(M) ← N',
                    '13.                   g(M) ← g(N) + k(N,M)',
                    '14.                   f(M) ← g(M) + h(M)',
                    '15.                   add M to OPEN',
                    '16.             else',
                    '17.                   if (g(N) + k(N,M)) < g(M)',
                    '18.                       parent(M) ← N',
                    '19.                       g(M) ← g(N) + k(N,M)',
                    '20.                       f(M) ← g(M) + h(M)',
                    '21.                       if M ϵ CLOSED',
                    '22.                          PropagateImprovement(M)',
                    '23.     return empty list',
                    '',
                    'PropagateImprovement(M)',
                    '1. for each neighbour X ϵ MoveGen(M)',
                    '2.      if g(M) + k(M,X) < g(X)',
                    '3.           parent(X) ← M',
                    '4.           g(X) ← g(M) + k(M,X)',
                    '5.           f(X) ← g(X) + h(X)',
                    '6.           if X ϵ CLOSED',
                    '7.                PropagateImprovement(X)'
                ]
            },
            'dijkstra': {
                name: "Dijkstra's Algorithm",
                class: DijkstraMapAlgorithm,
                description: "Dijkstra's Algorithm finds the shortest paths from source to all other nodes by taking the shortest distance path at each step.",
                complexity: { time: 'O(E + V log V)', space: 'O(V)' },
                pseudocode: [
                    'Dijkstra(S)',
                    '1. Assign infinite cost to all nodes',
                    '2. Set cost(S) = 0',
                    '3. Assign color WHITE to all nodes',
                    '4. while there are WHITE nodes',
                    '5.      N ← cheapest WHITE node',
                    '6.      if N is Destination then Return Path',
                    '7.      Color N BLACK',
                    '8.      for each neighbour M of N',
                    '9.           Relaxation(N, M):',
                    '10.              if cost(N) + k(N,M) < cost(M)',
                    '11.                   cost(M) = cost(N) + k(N,M)',
                    '12.                   parent(M) = N',
                    '13. return empty list'
                ]
            }
        };

        this.currentAlgorithm = 'astar';
        this.setupMap();
        this.setupEventListeners();
    }

    setupMap() {
        this.edgeLayerGroup.clearLayers();
        this.nodeLayerGroup.clearLayers();
        if (this.carMarker) this.map.removeLayer(this.carMarker);

        this.nodes = {};
        this.edges = {};

        let startDropdown = document.getElementById('start-state');
        let endDropdown = document.getElementById('end-state');

        let currStart = startDropdown.value;
        let currEnd = endDropdown.value;

        startDropdown.innerHTML = '';
        endDropdown.innerHTML = '';

        // Draw Edges First
        mapEdges.forEach(edge => {
            const source = mapNodes[edge.source];
            const target = mapNodes[edge.target];
            const edgeId = this.getEdgeId(edge.source, edge.target);

            let polyline = L.polyline([
                [source.lat, source.lng],
                [target.lat, target.lng]
            ], {
                color: 'rgba(0, 212, 255, 0.15)',
                weight: 2,
                opacity: 1
            });

            this.edgeLayerGroup.addLayer(polyline);
            this.edges[edgeId] = polyline;
        });

        // Draw Nodes
        Object.keys(mapNodes).forEach(stateCode => {
            const node = mapNodes[stateCode];

            startDropdown.innerHTML += `<option value="${stateCode}">${node.name}</option>`;
            endDropdown.innerHTML += `<option value="${stateCode}">${node.name}</option>`;

            let circle = L.circleMarker([node.lat, node.lng], {
                radius: 6,
                fillColor: '#0a0e17',
                color: 'rgba(0, 212, 255, 0.5)',
                weight: 2,
                fillOpacity: 1
            });

            circle.bindTooltip(stateCode, {
                permanent: true,
                direction: 'right',
                className: 'leaflet-state-label',
                offset: [10, 0]
            });

            this.nodeLayerGroup.addLayer(circle);
            this.nodes[stateCode] = circle;
        });

        startDropdown.value = currStart || 'DL';
        endDropdown.value = currEnd || 'KL';

        document.getElementById('start-display').textContent = startDropdown.value;
        document.getElementById('end-display').textContent = endDropdown.value;

        this.updateNodeState(startDropdown.value, 'start');
        this.updateNodeState(endDropdown.value, 'end');
        this.updateAlgorithmInfo();
    }

    getEdgeId(s1, s2) {
        return `edge-${[s1, s2].sort().join('-')}`;
    }

    setupEventListeners() {
        // Category Switcher Logic
        const catLabels = document.querySelectorAll('.cat-label');
        catLabels.forEach(label => {
            label.addEventListener('click', (e) => {
                const group = label.closest('.cat-group');
                const wasOpen = group.classList.contains('open');
                
                // Close all groups
                document.querySelectorAll('.cat-group').forEach(g => g.classList.remove('open'));
                
                // Toggle this one
                if (!wasOpen) group.classList.add('open');
                e.stopPropagation();
            });
        });

        // Close dropdown when clicking elsewhere
        document.addEventListener('click', () => {
            document.querySelectorAll('.cat-group').forEach(group => group.classList.remove('open'));
        });

        // Algorithm Selection
        document.querySelectorAll('.cat-algo').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const value = btn.dataset.algo;
                this.currentAlgorithm = value;

                // Update UI active states
                document.querySelectorAll('.cat-algo').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Update active pill
                const algo = this.algorithms[value];
                document.getElementById('active-algo-name').textContent = algo.name;
                
                // Update header display if any
                const displayTitle = document.getElementById('display-title');
                if (displayTitle) displayTitle.innerHTML = `<i class="fas ${value === 'astar' ? 'fa-star' : 'fa-project-diagram'}"></i> ${algo.name}`;

                this.updateAlgorithmInfo();
                
                // Close the dropdown
                btn.closest('.cat-group').classList.remove('open');
                e.stopPropagation();
            });
        });

        // Tab Switching Logic
        const tabs = document.querySelectorAll('.ptab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const panelId = `panel-${tab.dataset.panel}`;
                
                // Update tabs
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Update contents
                document.querySelectorAll('.panel-content').forEach(p => p.classList.remove('active'));
                document.getElementById(panelId).classList.add('active');
            });
        });

        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        document.getElementById('start-state').addEventListener('change', (e) => { 
            if (!this.isRunning) {
                this.setupMap();
                document.getElementById('start-display').textContent = e.target.value;
            }
        });
        document.getElementById('end-state').addEventListener('change', (e) => { 
            if (!this.isRunning) {
                this.setupMap();
                document.getElementById('end-display').textContent = e.target.value;
            }
        });

        document.getElementById('speed-slider').addEventListener('input', (e) => {
            const val = e.target.value;
            this.delay = 101 - val;
            
            const label = document.getElementById('speed-label');
            if (val < 33) label.textContent = 'Slow';
            else if (val < 66) label.textContent = 'Medium';
            else label.textContent = 'Fast';
        });

        const startBtn = document.getElementById('start-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const resetBtn = document.getElementById('reset-btn');

        startBtn.addEventListener('click', async () => {
            if (this.isRunning) return;
            this.isRunning = true;
            this.isPaused = false;

            startBtn.disabled = true;
            startBtn.classList.add('btn--disabled');
            pauseBtn.disabled = false;
            
            const statusDot = document.querySelector('.status-dot');
            const statusText = document.querySelector('#status-indicator span:last-child');
            statusDot.className = 'status-dot status-dot--running';
            statusText.textContent = 'Navigating...';

            await this.startJourney();

            this.isRunning = false;
            startBtn.disabled = false;
            startBtn.classList.remove('btn--disabled');
            startBtn.innerHTML = '<i class="fas fa-redo"></i><span>Run Again</span>';
            
            pauseBtn.disabled = true;
            statusDot.className = 'status-dot status-dot--idle';
            statusText.textContent = 'Journey Finished';
        });

        pauseBtn.addEventListener('click', () => {
            if (!this.isRunning) return;
            this.isPaused = !this.isPaused;
            if (this.isPaused) {
                pauseBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
            } else {
                pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
            }
        });

        resetBtn.addEventListener('click', () => {
            window.location.reload();
        });
    }

    updateAlgorithmInfo() {
        const algo = this.algorithms[this.currentAlgorithm];
        document.getElementById('algo-description').textContent = algo.description;
        document.getElementById('algo-time').textContent = algo.complexity.time;
        document.getElementById('algo-space').textContent = algo.complexity.space;
        this.setPseudocode(this.currentAlgorithm);
    }

    setPseudocode(algoKey) {
        const codeLines = this.algorithms[algoKey].pseudocode;
        const container = document.getElementById('pseudocode-display');
        container.innerHTML = codeLines.map((line, i) => `
            <div class="code-line" id="code-line-${i}">
                <span class="ln">${i}</span>
                <code>${line}</code>
            </div>
        `).join('');
    }

    async highlightLine(lineNumber) {
        document.querySelectorAll('.code-line').forEach(line => {
            line.classList.remove('highlight-line');
        });

        const line = document.getElementById(`code-line-${lineNumber}`);
        if (line) {
            line.classList.add('highlight-line');
            const container = document.getElementById('pseudocode-display');
            const scrollPos = line.offsetTop - (container.clientHeight / 2) + (line.clientHeight / 2);
            container.scrollTo({ top: scrollPos, behavior: 'smooth' });
        }
    }

    getDelay() {
        return this.delay;
    }

    async pause() {
        while (this.isPaused) await new Promise(resolve => setTimeout(resolve, 100));
        return new Promise(resolve => setTimeout(resolve, this.delay));
    }

    updateNodeState(stateCode, stateType) {
        if (!this.nodes[stateCode]) return;
        const marker = this.nodes[stateCode];

        const nodeData = mapNodes[stateCode];
        if (stateType === 'current' && nodeData) {
            document.getElementById('current-location').textContent = nodeData.name;
        }

        switch (stateType) {
            case 'start':
                marker.setStyle({ fillColor: '#00ff88', color: '#fff', radius: 8, fillOpacity: 1 });
                break;
            case 'end':
                marker.setStyle({ fillColor: '#ff3366', color: '#fff', radius: 8, fillOpacity: 1 });
                break;
            case 'current':
                marker.setStyle({ fillColor: '#ffaa00', color: '#fff', radius: 8, fillOpacity: 1 });
                marker.bringToFront();
                break;
            case 'visited':
                marker.setStyle({ fillColor: '#00d4ff', color: 'rgba(0, 212, 255, 0.8)', radius: 6, fillOpacity: 0.6 });
                break;
            case 'path':
                marker.setStyle({ fillColor: '#00ff88', color: '#fff', radius: 8, fillOpacity: 1 });
                marker.bringToFront();
                break;
            default:
                marker.setStyle({ fillColor: '#0a0e17', color: 'rgba(0, 212, 255, 0.4)', radius: 6, fillOpacity: 1 });
        }
    }

    highlightEdge(s1, s2) {
        const edgeId = this.getEdgeId(s1, s2);
        if (this.edges[edgeId]) {
            this.edges[edgeId].setStyle({
                color: '#00d4ff',
                weight: 4,
                opacity: 0.8
            });
        }
    }

    updatePerformanceUI() {
        const astar = this.performanceData['astar'];
        const dijkstra = this.performanceData['dijkstra'];

        // Update Text Values
        document.getElementById('val-nodes-astar').textContent = astar.nodes;
        document.getElementById('val-nodes-dijkstra').textContent = dijkstra.nodes;
        document.getElementById('val-time-astar').textContent = `${astar.time}ms`;
        document.getElementById('val-time-dijkstra').textContent = `${dijkstra.time}ms`;

        // Calculate Bar Widths (Relative to each other)
        if (astar.nodes > 0 || dijkstra.nodes > 0) {
            const maxNodes = Math.max(astar.nodes, dijkstra.nodes);
            document.getElementById('perf-nodes-astar').style.width = `${(astar.nodes / maxNodes) * 100}%`;
            document.getElementById('perf-nodes-dijkstra').style.width = `${(dijkstra.nodes / maxNodes) * 100}%`;
        }

        if (astar.time > 0 || dijkstra.time > 0) {
            const maxTime = Math.max(astar.time, dijkstra.time);
            document.getElementById('perf-time-astar').style.width = `${(astar.time / maxTime) * 100}%`;
            document.getElementById('perf-time-dijkstra').style.width = `${(dijkstra.time / maxTime) * 100}%`;
        }

        // Determine Winner
        const winnerDisplay = document.getElementById('comp-winner-display');
        if (astar.time > 0 && dijkstra.time > 0) {
            if (astar.time < dijkstra.time) {
                winnerDisplay.innerHTML = '<i class="fas fa-trophy"></i> A* is faster! (Heuristic advantage)';
                winnerDisplay.style.color = 'var(--cyan)';
            } else if (dijkstra.time < astar.time) {
                winnerDisplay.innerHTML = '<i class="fas fa-trophy"></i> Dijkstra found it! (Optimal but slower)';
                winnerDisplay.style.color = 'var(--violet)';
            } else {
                winnerDisplay.textContent = "It's a tie!";
                winnerDisplay.style.color = 'var(--green)';
            }
        }
    }

    resetDataStructures() {
        document.getElementById('open-list').innerHTML = '<div class="empty-ds">Queue is empty</div>';
        document.getElementById('closed-list').innerHTML = '<div class="empty-ds">Set is empty</div>';
        document.getElementById('algorithm-steps').innerHTML = '<div class="empty-ds">Wait for algorithm to process...</div>';
        
        document.getElementById('open-count').textContent = '0';
        document.getElementById('closed-count').textContent = '0';
        document.getElementById('stat-distance').textContent = '0 km';
        document.getElementById('stat-visited').textContent = '0';
    }

    addStep(title, details = '') {
        const container = document.getElementById('algorithm-steps');
        const emptyMsg = container.querySelector('.empty-ds');
        if (emptyMsg) emptyMsg.remove();

        const stepEl = document.createElement('div');
        stepEl.className = 'step-item';
        stepEl.innerHTML = `
            <div class="step-content">
                <div class="step-title">${title}</div>
                ${details ? `<div class="step-code">${details}</div>` : ''}
            </div>
        `;
        
        container.appendChild(stepEl);
        
        // Auto-scroll to bottom of the feed
        const panel = container.closest('.panel-content');
        if (panel) {
            panel.scrollTo({ top: panel.scrollHeight, behavior: 'smooth' });
        }
    }

    async updateDataStructures(openList, closedList, currentCost = 0) {
        const openContainer = document.getElementById('open-list');
        const closedContainer = document.getElementById('closed-list');

        document.getElementById('open-count').textContent = openList.length;
        document.getElementById('closed-count').textContent = closedList.length;
        document.getElementById('stat-visited').textContent = `${Math.round(currentCost * 100) / 100}`;

        const openItems = openList.length ? openList.map(s => `<div class="ds-item">${mapNodes[s].name} (${s})</div>`).join('') : '<div class="empty-ds">Queue is empty</div>';
        const closedItems = closedList.length ? closedList.map(s => `<div class="ds-item">${mapNodes[s].name} (${s})</div>`).join('') : '<div class="empty-ds">Set is empty</div>';

        if (openContainer.innerHTML !== openItems) openContainer.innerHTML = openItems;
        if (closedContainer.innerHTML !== closedItems) closedContainer.innerHTML = closedItems;
    }

    async startJourney() {
        this.setupMap();

        const startState = document.getElementById('start-state').value;
        const endState = document.getElementById('end-state').value;

        this.updateNodeState(startState, 'start');
        this.updateNodeState(endState, 'end');

        const startTime = performance.now();
        let engine = new this.algorithms[this.currentAlgorithm].class(this);
        const path = await engine.run(startState, endState);
        const endTime = performance.now();

        // Record metrics
        const visitedCount = parseInt(document.getElementById('closed-count').textContent) || 0;
        const execTime = Math.round(endTime - startTime);
        
        this.performanceData[this.currentAlgorithm] = {
            time: execTime,
            nodes: visitedCount
        };

        this.updatePerformanceUI();

        if (path.length > 0) {
            await this.animateFinalPath(path);
        } else {
            alert('No path found! Ensure the graph is connected.');
        }
    }

    async animateFinalPath(path) {
        let totalDist = 0;

        // Trace the optimal path
        for (let i = 0; i < path.length - 1; i++) {
            const edgeId = this.getEdgeId(path[i], path[i + 1]);
            if (this.edges[edgeId]) {
                this.edges[edgeId].setStyle({
                    color: '#00ff88',
                    weight: 6,
                    opacity: 1,
                    dashArray: '10, 10',
                    className: 'path-pulse' // Allows adding animated css line dashes
                });
            }
        }

        const tooltipStyle = `
            background: none; border: none; box-shadow: none; color: #fff; 
            font-weight: bold; font-family: 'Orbitron'; font-size: 1.2em;
            text-shadow: 0 0 10px #00ff88;
        `;

        // Define Car Icon for Leaflet
        const carHtml = `
            <div id="leaflet-car" style="transform-origin: center; transition: transform 0.1s linear;">
                <svg width="40" height="40" viewBox="-20 -20 40 40" style="overflow: visible;">
                    <circle cx="0" cy="0" r="16" fill="rgba(0, 255, 136, 0.4)" filter="drop-shadow(0 0 15px #00ff88)" />
                    <circle cx="0" cy="0" r="10" fill="#fff" />
                    <!-- Holographic Core -->
                    <circle cx="0" cy="0" r="4" fill="#00ff88" />
                </svg>
            </div>
        `;

        const carIcon = L.divIcon({
            html: carHtml,
            className: 'custom-car-icon',
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });

        const startNode = mapNodes[path[0]];
        this.carMarker = L.marker([startNode.lat, startNode.lng], { icon: carIcon, zIndexOffset: 1000 }).addTo(this.map);
        this.carMarker.bindTooltip("0 km", { permanent: true, direction: "top", offset: [0, -10], className: 'car-dist-tooltip' }).openTooltip();

        const followCamera = document.getElementById('camera-follow');

        for (let i = 0; i < path.length - 1; i++) {
            const u = path[i];
            const v = path[i + 1];

            const edge = mapEdges.find(e => (e.source === u && e.target === v) || (e.source === v && e.target === u));
            const segmentDist = edge ? edge.dist : 0;

            const uNode = mapNodes[u];
            const vNode = mapNodes[v];

            this.updateNodeState(u, 'path');

            // Bearing calculation for orientation
            const lat1 = uNode.lat * Math.PI / 180;
            const lng1 = uNode.lng * Math.PI / 180;
            const lat2 = vNode.lat * Math.PI / 180;
            const lng2 = vNode.lng * Math.PI / 180;
            const y = Math.sin(lng2 - lng1) * Math.cos(lat2);
            const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1);
            let bearing = Math.atan2(y, x) * 180 / Math.PI;

            // Framerate interpolation based on speed
            const frames = Math.max(15, Math.floor(this.delay / 3));
            const frameTime = this.delay / frames;

            for (let f = 1; f <= frames; f++) {
                const fraction = f / frames;
                const iLat = uNode.lat + (vNode.lat - uNode.lat) * fraction;
                const iLng = uNode.lng + (vNode.lng - uNode.lng) * fraction;

                this.carMarker.setLatLng([iLat, iLng]);

                const carDiv = document.getElementById('leaflet-car');
                if (carDiv) {
                    carDiv.style.transform = `rotate(${bearing}deg)`;
                }

                if (followCamera && followCamera.checked) {
                    this.map.panTo([iLat, iLng], { animate: false });
                }

                while (this.isPaused) {
                    await new Promise(r => setTimeout(r, 100));
                }
                await new Promise(r => setTimeout(r, frameTime));
            }

            totalDist += segmentDist;
            this.carMarker.setTooltipContent(`${totalDist} km`);
            document.getElementById('stat-distance').textContent = `${totalDist} km`;
        }

        this.updateNodeState(path[path.length - 1], 'path');
    }

    initTheme() {
        const savedTheme = localStorage.getItem('app-theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeUI(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('app-theme', newTheme);
        this.updateThemeUI(newTheme);
    }

    updateThemeUI(theme) {
        const toggleBtn = document.getElementById('theme-toggle');
        if (toggleBtn) {
            toggleBtn.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        }
        // Update tile layer
        if (this.tileLayer) {
            this.tileLayer.setUrl(theme === 'dark' ? this.darkTileUrl : this.lightTileUrl);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.mapVis = new MapVisualizer();
});
