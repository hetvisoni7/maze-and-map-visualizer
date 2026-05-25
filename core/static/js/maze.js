/* ─── MAZE VISUALIZER — Main Controller ──────────────────────────────── */

// Algorithm metadata for info cards & pseudocode
const ALGO_META = {
    dfs: {
        name: 'Depth-First Search',
        icon: 'fa-sitemap',
        cat:  'Blind Search',
        desc: 'Explores as far as possible along each branch before backtracking. Uses a <strong>stack</strong>. Not guaranteed to find the shortest path.',
        time: 'O(V+E)', space: 'O(V)',
        openLabel: 'OPEN Stack',
        pseudo: [
            'function DFS(S):',
            '  OPEN ← [(S, null)]',
            '  CLOSED ← []',
            '  while OPEN is not empty:',
            '    (N, parent) ← pop OPEN',
            '    if GoalTest(N): return Path(N)',
            '    CLOSED ← [(N,parent)] + CLOSED',
            '    newNodes ← children(N) \\ seen',
            '    OPEN ← newNodes + OPEN',
            '  return []  // no path'
        ]
    },
    bfs: {
        name: 'Breadth-First Search',
        icon: 'fa-expand-arrows-alt',
        cat:  'Blind Search',
        desc: 'Explores all neighbours at current depth first. Uses a <strong>queue</strong>. Guarantees the <strong>shortest path</strong>.',
        time: 'O(V+E)', space: 'O(V)',
        openLabel: 'OPEN Queue',
        pseudo: [
            'function BFS(S):',
            '  OPEN ← [(S, null)]',
            '  CLOSED ← []',
            '  while OPEN is not empty:',
            '    (N, parent) ← dequeue OPEN',
            '    if GoalTest(N): return Path(N)',
            '    CLOSED ← [(N,parent)] + CLOSED',
            '    newNodes ← children(N) \\ seen',
            '    OPEN ← OPEN + newNodes',
            '  return []  // no path'
        ]
    },
    dbdfs: {
        name: 'Depth-Bounded DFS',
        icon: 'fa-level-down-alt',
        cat:  'Blind Search',
        desc: 'DFS with a configurable <strong>depth limit</strong>. Prunes branches that exceed the limit to avoid infinite search.',
        time: 'O(b^d)', space: 'O(d)',
        openLabel: 'OPEN Stack',
        pseudo: [
            'DB-DFS(S, depthBound)',
            '  OPEN ← (S, null, 0) : [ ]',
            '  CLOSED ← empty list',
            '  while OPEN is not empty',
            '    nodePair ← head OPEN',
            '    (N, _, depth) ← nodePair',
            '    if GoalTest(N) = TRUE',
            '      return ReconstructPath(nodePair, CLOSED)',
            '    else CLOSED ← nodePair: CLOSED',
            '    if depth < depthBound',
            '      children ← MoveGen(N)',
            '      newNodes ← RemoveSeen(children, OPEN, CLOSED)',
            '      newPairs ← MakePairs(newNodes, N, depth + 1)',
            '      OPEN ← newPairs ++ tail OPEN',
            '    else OPEN ← tail OPEN',
            '  return empty list'
        ]
    },
    dfid: {
        name: 'DFID',
        icon: 'fa-search-plus',
        cat:  'Blind Search',
        desc: '<strong>Depth-First Iterative Deepening</strong> combining DFS efficiency with BFS completeness by repeating DB-DFS with increasing depth limits.',
        time: 'O(b^d)', space: 'O(d)',
        openLabel: 'Stack (Bound)',
        pseudo: [
            'DFID(start):',
            '  depthBound ← 0',
            '  while TRUE:',
            '    result ← DB-DFS(start, depthBound)',
            '    if result != null return result',
            '    depthBound ← depthBound + 1'
        ]
    },
    hillclimbing: {
        name: 'Hill Climbing',
        icon: 'fa-mountain',
        cat:  'Heuristic',
        desc: 'Greedily moves to the neighbour with <strong>lowest distance</strong> to goal. Fast but can get stuck at local optima.',
        time: 'O(∞)', space: 'O(1)',
        openLabel: 'Candidates h(n)',
        pseudo: [
            'HillClimbing(S)',
            '  bestNode ← S',
            '  nextNode ← head sort MoveGen(bestNode)',
            '  while h(nextNode) is better than h(bestNode)',
            '    bestNode ← nextNode',
            '    nextNode ← head sort MoveGen(bestNode)',
            '  return bestNode'
        ]
    },
    tabu: {
        name: 'Tabu Search',
        icon: 'fa-ban',
        cat:  'Heuristic',
        desc: 'Hill climbing with a <strong>tabu list</strong> (short-term memory) to escape local optima by forbidding recently visited cells.',
        time: 'O(iter)', space: 'O(tenure)',
        openLabel: 'Candidates',
        pseudo: [
            'TabuSearch(Start)',
            '  N ← Start',
            '  bestSeen ← N',
            '  Until some termination criterion:',
            '    N ← best(allowed(MoveGen(N)))',
            '    IF N better than bestSeen:',
            '      bestSeen ← N',
            '  return bestSeen'
        ]
    },
    ihc: {
        name: 'Iterated Hill Climbing (IHC)',
        icon: 'fa-redo',
        cat:  'Heuristic',
        desc: 'Repeats Hill Climbing from <strong>random restart positions</strong> to escape local optima. More restarts = higher probability of finding goal.',
        time: 'O(r·steps)', space: 'O(1)',
        openLabel: 'Candidates h(n)',
        pseudo: [
            'IHC(N)',
            '  bestNode ← random candidate solution',
            '  repeat N times:',
            '    currentBest ← hillClimbing(new random start)',
            '    if h(currentBest) is better than h(bestNode):',
            '      bestNode ← currentBest',
            '  return bestNode'
        ]
    },
    beam: {
        name: 'Beam Search',
        icon: 'fa-project-diagram',
        cat:  'Heuristic',
        desc: 'Maintains <strong>b</strong> best candidates at each level. Explores multiple promising paths concurrently, balancing depth and breadth.',
        time: 'O(b^d)', space: 'O(b·d)',
        openLabel: 'Beam (Set)',
        pseudo: [
            'BeamSearch(S, b):',
            '  bestNode ← S',
            '  nextNodes ← top b sort(MoveGen(bestNode))',
            '  while h(nextHead) < h(bestNode):',
            '    bestNode ← nextHead',
            '    CANDS ← children(nextNodes)',
            '    nextNodes ← top b sort(CANDS)',
            '  return bestNode'
        ]
    },
    randomwalk: {
        name: 'Random Walk',
        icon: 'fa-walking',
        cat:  'Stochastic',
        desc: 'Explores the maze by taking <strong>random steps</strong> between neighbours. Keeps track of the best node (closest to goal) found during the walk.',
        time: 'O(N)', space: 'O(1)',
        openLabel: 'Neighbours',
        pseudo: [
            'RandomWalk(n)',
            '  node ← random candidate solution or start',
            '  bestNode ← node',
            '  for i ← 1 to n',
            '    node ← RandomChoose(MoveGen(node))',
            '    if node is better than bestNode',
            '      then bestNode ← node',
            '  return bestNode'
        ]
    },
    shc: {
        name: 'Stochastic Hill Climbing',
        icon: 'fa-dice-d20',
        cat:  'Stochastic',
        desc: 'Uses a <strong>temperature (T)</strong> factor to decide whether to move to a random neighbor. Probability = 1 / (1 + e<sup>&Delta;E/T</sup>).',
        time: 'O(N)', space: 'O(1)',
        openLabel: 'Choice (P)',
        pseudo: [
            'SHC(T, start)',
            '  node ← start, bestNode ← node',
            '  while criteria:',
            '    neighbour ← RandomNeighbour(node)',
            '    deltaE ← eval(neighbour) - eval(node)',
            '    if Random(0,1) < 1 / (1 + e^(-deltaE/T))',
            '      then node ← neighbour',
            '    if eval(node) better than eval(bestNode)',
            '      then bestNode ← node',
            '  return bestNode'
        ]
    },
    sa: {
        name: 'Simulated Annealing',
        icon: 'fa-fire-alt',
        cat:  'Stochastic',
        desc: 'A probabilistic technique that uses a <strong>Cooling Schedule</strong>. It accepts worse moves with decreasing probability as time passes to settle into a global optimum.',
        time: 'O(Epochs * Cycles)', space: 'O(1)',
        openLabel: 'Choice (P/T)',
        pseudo: [
            'SA(start, Epochs)',
            '  node ← start, bestNode ← node, T ← Large',
            '  for time ← 1 to Epochs:',
            '    while cycles < M:',
            '      neighbour ← RandomNeighbour(node)',
            '      deltaE ← eval(neighbour) - eval(node)',
            '      if Random(0,1) < 1 / (1 + e^(-deltaE/T))',
            '        then node ← neighbour',
            '      if eval(node) better than eval(bestNode)',
            '        then bestNode ← node',
            '    T ← CoolingFunction(T, time)',
            '  return bestNode'
        ]
    }
};

class MazeVisualizer {
    constructor() {
        this.gridSize    = 15;
        this.maze        = [];
        this.start       = { x: 0, y: 0 };
        this.end         = { x: 14, y: 14 };
        this.algorithm   = 'dfs';
        this.currentTool = 'wall';
        this.speed       = 50;

        this.isVisualizing = false;
        this.isPaused      = false;

        this.nodesVisited   = 0;
        this.pathLength     = 0;
        this.executionTime  = 0;
        this.backtrackCount = 0;

        this.mazeGrid       = document.getElementById('maze-grid');
        this.gridSizeSlider = document.getElementById('grid-size');
        this.speedSlider    = document.getElementById('speed-slider');
        this.obstacleSlider = document.getElementById('obstacle-density');

        this.initTheme();
        this.init();
    }

    init() {
        this.setupAlgoSwitcher();
        this.setupEventListeners();
        this.setupPanelTabs();
        this.generateMaze();
        this.updateAlgorithmInfo();
    }

    // ─── ALGO CATEGORY SWITCHER ─────────────────────────

    setupAlgoSwitcher() {
        // Open/close category dropdowns
        document.querySelectorAll('.cat-label').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const group = btn.parentElement;
                const isOpen = group.classList.contains('open');
                // Close all
                document.querySelectorAll('.cat-group').forEach(g => g.classList.remove('open'));
                if (!isOpen) group.classList.add('open');
            });
        });

        // Close on outside click
        document.addEventListener('click', () => {
            document.querySelectorAll('.cat-group').forEach(g => g.classList.remove('open'));
        });

        // Algorithm option click
        document.querySelectorAll('.cat-algo').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const algoId = btn.dataset.algo;
                this.selectAlgorithm(algoId);
                // Close dropdown
                document.querySelectorAll('.cat-group').forEach(g => g.classList.remove('open'));
            });
        });
    }

    selectAlgorithm(algoId) {
        this.algorithm = algoId;
        const meta = ALGO_META[algoId];
        if (!meta) return;

        // Mark active in dropdown
        document.querySelectorAll('.cat-algo').forEach(b => b.classList.remove('active'));
        const btn = document.querySelector(`.cat-algo[data-algo="${algoId}"]`);
        if (btn) btn.classList.add('active');

        // Active category label highlight
        document.querySelectorAll('.cat-label').forEach(l => l.classList.remove('active'));
        const catGroup = btn?.closest('.cat-group');
        if (catGroup) catGroup.querySelector('.cat-label').classList.add('active');

        // Update active pill
        const pill = document.getElementById('active-algo-pill');
        const nameEl = document.getElementById('active-algo-name');
        const catEl  = document.getElementById('active-algo-cat');
        const icon   = pill?.querySelector('i');

        if (nameEl) nameEl.textContent = btn?.querySelector('.algo-abbr')?.textContent || algoId.toUpperCase();
        if (catEl)  catEl.textContent  = meta.cat;
        if (icon)   { icon.className = `fas ${meta.icon}`; }
        if (pill) {
            pill.classList.toggle('heuristic', meta.cat === 'Heuristic');
        }

        // Show/hide algorithm-specific controls
        this._toggleAlgoControls(algoId, meta.cat);

        // Update open label in DS panel
        const openLabel = document.getElementById('open-label');
        if (openLabel) openLabel.textContent = meta.openLabel || 'OPEN';

        this.updateAlgorithmInfo();
        this.resetVisualization();
    }

    _toggleAlgoControls(algoId, category) {
        const show = (id, visible) => {
            const el = document.getElementById(id);
            if (el) el.style.display = visible ? 'flex' : 'none';
        };
        show('depth-limit-row',      algoId === 'dbdfs');
        show('heuristic-select-row', category === 'Heuristic' || algoId === 'randomwalk' || algoId === 'shc' || algoId === 'sa');
        show('tabu-tenure-row',      algoId === 'tabu');
        show('beam-width-row',      algoId === 'beam');
        show('ihc-restarts-row',     algoId === 'ihc' || algoId === 'randomwalk' || algoId === 'sa');
        show('temperature-row',      algoId === 'shc' || algoId === 'sa');
        show('sa-cycles-row',        algoId === 'sa');

        // Show/Hide search status overlay
        const isDFID = (algoId === 'dfid');
        const isHeuristic = (category === 'Heuristic' || category === 'Stochastic');
        
        const overlay = document.getElementById('search-status-overlay');
        if (overlay) overlay.style.display = (isDFID || isHeuristic) ? 'flex' : 'none';

        // Toggle groups inside overlay
        document.querySelectorAll('.sso-group-dfid').forEach(el => el.style.display = isDFID ? 'flex' : 'none');
        document.querySelectorAll('.sso-group-heuristic').forEach(el => el.style.display = isHeuristic ? 'flex' : 'none');

        // Dynamic labels for the restart/steps row
        const restartRowLabel = document.querySelector('#ihc-restarts-row .field-label');
        const restartHint = document.getElementById('ihc-hint');
        if (restartRowLabel) {
            if (algoId === 'randomwalk') {
                restartRowLabel.innerHTML = 'Number of Steps <span class="field-hint" style="padding: 2px 6px; font-size: 0.65rem;">Total path length</span>';
            } else if (algoId === 'ihc') {
                restartRowLabel.innerHTML = 'Number of Iterations <span class="field-hint" style="padding: 2px 6px; font-size: 0.65rem;">Restart count</span>';
            } else if (algoId === 'sa') {
                restartRowLabel.innerHTML = 'Number of Epochs <span class="field-hint" style="padding: 2px 6px; font-size: 0.65rem;">Cooling stages</span>';
            }
        }
    }

    // ─── EVENT LISTENERS ─────────────────────────────────

    setupEventListeners() {
        // Grid size slider — LIVE: immediately rebuilds the maze
        this.gridSizeSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            const lbl = document.getElementById('grid-size-label');
            if (lbl) lbl.textContent = `${val} × ${val}`;
            this.gridSize = val;
            this.generateMaze();
            this.resetVisualization();
        });

        // Speed
        this.speedSlider.addEventListener('input', (e) => {
            this.speed = parseInt(e.target.value);
            const speeds = ['Very Slow','Slow','Medium','Fast','Very Fast'];
            const lbl = document.getElementById('speed-label');
            if (lbl) lbl.textContent = speeds[Math.min(Math.floor(this.speed/20), 4)];
        });

        // Density label and live update
        this.obstacleSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            const lbl = document.getElementById('density-label');
            if (lbl) lbl.textContent = val + '%';
            this.generateMaze();
            this.resetVisualization();
        });

        // Depth limit label
        const depthLimitSlider = document.getElementById('depth-limit');
        if (depthLimitSlider) {
            depthLimitSlider.addEventListener('input', (e) => {
                const lbl = document.getElementById('depth-limit-label');
                if (lbl) lbl.textContent = e.target.value;
            });
        }

        // Tabu tenure label
        const tabuSlider = document.getElementById('tabu-tenure');
        if (tabuSlider) {
            tabuSlider.addEventListener('input', (e) => {
                const lbl = document.getElementById('tabu-tenure-label');
                if (lbl) lbl.textContent = e.target.value;
            });
        }

        // IHC restarts label
        const ihcSlider = document.getElementById('ihc-restarts');
        if (ihcSlider) {
            ihcSlider.addEventListener('input', (e) => {
                const lbl = document.getElementById('ihc-restarts-label');
                if (lbl) lbl.textContent = e.target.value;
            });
        }

        // Generate — re-runs with current slider values (density may change)
        document.getElementById('generate-maze').addEventListener('click', () => {
            this.gridSize = parseInt(this.gridSizeSlider.value);
            this.generateMaze();
            this.resetVisualization();
        });

        // Clear walls
        document.getElementById('clear-obstacles').addEventListener('click', () => {
            this.clearObstacles();
            this.resetVisualization();
        });

        // Playback
        document.getElementById('start-btn').addEventListener('click', () => {
            if (!this.isVisualizing)      this.startVisualization();
            else if (this.isPaused)       this.resumeVisualization();
            else                          this.pauseVisualization();
        });
        document.getElementById('pause-btn').addEventListener('click', () => this.pauseVisualization());
        document.getElementById('step-btn').addEventListener('click', () => { if (this.isPaused) this.stepVisualization(); });

        // Reset
        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) resetBtn.addEventListener('click', () => this.resetVisualization());

        // Beam width label
        const beamSlider = document.getElementById('beam-width');
        if (beamSlider) {
            beamSlider.addEventListener('input', (e) => {
                const lbl = document.getElementById('beam-width-label');
                if (lbl) lbl.textContent = e.target.value;
            });
        }

        // Tools
        ['set-start','set-end','set-wall','set-erase'].forEach(id => {
            document.getElementById(id)?.addEventListener('click', () => {
                this.currentTool = id.replace('set-','');
                document.querySelectorAll('.tool-card').forEach(c => c.classList.remove('active'));
                document.getElementById(id)?.classList.add('active');
            });
        });

        document.getElementById('theme-toggle')?.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Help modal
        document.getElementById('help-btn')?.addEventListener('click', () =>
            document.getElementById('help-modal').classList.add('active'));
        document.getElementById('close-help')?.addEventListener('click', () =>
            document.getElementById('help-modal').classList.remove('active'));
        document.getElementById('help-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'help-modal') e.target.classList.remove('active');
        });

        // DFID History modal
        document.getElementById('dfid-history-btn')?.addEventListener('click', () => {
            this.showHistoryModal();
        });
        document.getElementById('close-history')?.addEventListener('click', () =>
            document.getElementById('history-modal').classList.remove('active'));
        document.getElementById('history-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'history-modal') e.target.classList.remove('active');
        });
    }

    // ─── PANEL TABS ───────────────────────────────────────

    setupPanelTabs() {
        document.querySelectorAll('.ptab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.ptab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                document.querySelectorAll('.panel-content').forEach(p => p.classList.remove('active'));
                document.getElementById(`panel-${tab.dataset.panel}`)?.classList.add('active');
            });
        });
    }

    // ─── MAZE GENERATION ──────────────────────────────────

    generateMaze() {
        this.maze = [];
        this.mazeGrid.innerHTML = '';

        this.end = {
            x: Math.max(0, Math.min(this.gridSize-1, this.end.x || this.gridSize-1)),
            y: Math.max(0, Math.min(this.gridSize-1, this.end.y || this.gridSize-1))
        };
        // Default end to bottom-right
        if (!this.end.x && !this.end.y) this.end = { x: this.gridSize-1, y: this.gridSize-1 };
        // Recalculate default end on grid size change
        this.end = { x: this.gridSize-1, y: this.gridSize-1 };
        this.start = { x: 0, y: 0 };

        const wrapper = this.mazeGrid.parentElement;
        // Force a layout flush so we get the real dimensions
        const availW = Math.max((wrapper?.offsetWidth  || 600) - 16, 100);
        const availH = Math.max((wrapper?.offsetHeight || 500) - 16, 100);
        
        // Calculate cell size, but enforce a minimum size (e.g. 25px) so when zoomed in it scrolls
        const calculatedSize = Math.min(
            Math.floor(availW  / this.gridSize),
            Math.floor(availH  / this.gridSize),
            80   // max cell size so large grids still look reasonable
        );
        const cellSize = Math.max(calculatedSize, 25);

        this.mazeGrid.style.gridTemplateColumns = `repeat(${this.gridSize}, ${cellSize}px)`;
        this.mazeGrid.style.gridTemplateRows    = `repeat(${this.gridSize}, ${cellSize}px)`;

        for (let y = 0; y < this.gridSize; y++) {
            this.maze[y] = [];
            for (let x = 0; x < this.gridSize; x++) {
                const cell = {
                    x, y,
                    isStart:    x === this.start.x && y === this.start.y,
                    isEnd:      x === this.end.x   && y === this.end.y,
                    isObstacle: false, isVisited: false, isPath: false, isCurrent: false, parent: null
                };
                this.maze[y][x] = cell;

                const el = document.createElement('div');
                el.className = 'grid-cell';
                el.dataset.x = x; el.dataset.y = y;

                if (cellSize >= 20) {
                    const num = document.createElement('div');
                    num.className = 'cell-number';
                    num.textContent = `${x},${y}`;
                    el.appendChild(num);
                }

                el.addEventListener('click', () => this.handleCellClick(x, y));
                el.addEventListener('mouseenter', (e) => { if (e.buttons === 1) this.handleCellClick(x, y, true); });
                el.addEventListener('mousemove', () => {
                    const el2 = document.getElementById('current-coords');
                    if (el2) el2.textContent = `(${x},${y})`;
                });

                this.mazeGrid.appendChild(el);
                this.updateCell(x, y);
            }
        }

        const density = parseInt(this.obstacleSlider.value);
        this.generateRandomObstacles(density);
        this.updateCoordinates();

        if (!this.mazeGrid.dataset.touchBound) {
            this.mazeGrid.dataset.touchBound = "true";
            this.mazeGrid.addEventListener('touchmove', (e) => {
                if (e.cancelable) e.preventDefault();
                if (this.isVisualizing && !this.isPaused) return;
                
                const touch = e.touches[0];
                const target = document.elementFromPoint(touch.clientX, touch.clientY);
                if (target && target.classList.contains('grid-cell')) {
                    const tx = parseInt(target.dataset.x);
                    const ty = parseInt(target.dataset.y);
                    if (this.lastTouchX !== tx || this.lastTouchY !== ty) {
                        this.handleCellClick(tx, ty, true);
                        this.lastTouchX = tx;
                        this.lastTouchY = ty;
                    }
                }
            }, { passive: false });
            
            this.mazeGrid.addEventListener('touchend', () => {
                this.lastTouchX = null;
                this.lastTouchY = null;
            });
        }
    }

    generateRandomObstacles(density) {
        for (let y = 0; y < this.gridSize; y++)
            for (let x = 0; x < this.gridSize; x++)
                if (!this.maze[y][x].isStart && !this.maze[y][x].isEnd)
                    this.maze[y][x].isObstacle = false;

        const count = Math.floor(this.gridSize * this.gridSize * (density / 100));
        for (let i = 0; i < count; i++) {
            let x, y, tries = 0;
            do { x = Math.floor(Math.random()*this.gridSize); y = Math.floor(Math.random()*this.gridSize); tries++; }
            while ((this.maze[y][x].isStart || this.maze[y][x].isEnd || this.maze[y][x].isObstacle) && tries < 300);
            if (tries < 300) this.maze[y][x].isObstacle = true;
        }

        for (let y = 0; y < this.gridSize; y++)
            for (let x = 0; x < this.gridSize; x++)
                this.updateCell(x, y);
    }

    clearObstacles() {
        for (let y = 0; y < this.gridSize; y++)
            for (let x = 0; x < this.gridSize; x++)
                if (!this.maze[y][x].isStart && !this.maze[y][x].isEnd) {
                    this.maze[y][x].isObstacle = false;
                    this.updateCell(x, y);
                }
    }

    // ─── CELL INTERACTION ─────────────────────────────────

    handleCellClick(x, y, isDrag = false) {
        if (this.isVisualizing && !this.isPaused) return;
        const cell = this.maze[y][x];
        const tool = this.currentTool;

        if (tool === 'start') {
            if (isDrag) return;
            this.maze[this.start.y][this.start.x].isStart = false;
            this.updateCell(this.start.x, this.start.y);
            if (!cell.isEnd && !cell.isObstacle) {
                this.start = { x, y }; cell.isStart = true;
                this.updateCell(x, y); this.updateCoordinates();
            }
        } else if (tool === 'end') {
            if (isDrag) return;
            this.maze[this.end.y][this.end.x].isEnd = false;
            this.updateCell(this.end.x, this.end.y);
            if (!cell.isStart && !cell.isObstacle) {
                this.end = { x, y }; cell.isEnd = true;
                this.updateCell(x, y); this.updateCoordinates();
            }
        } else if (tool === 'wall') {
            if (!cell.isStart && !cell.isEnd) { 
                if (isDrag) {
                    if (!cell.isObstacle) { cell.isObstacle = true; this.updateCell(x, y); }
                } else {
                    cell.isObstacle = !cell.isObstacle; this.updateCell(x, y); 
                }
            }
        } else if (tool === 'erase') {
            if (!cell.isStart && !cell.isEnd) {
                cell.isObstacle = false; cell.isVisited = false; cell.isPath = false;
                this.updateCell(x, y);
            }
        }
    }

    updateCell(x, y) {
        const cell = this.maze[y][x];
        const el = document.querySelector(`.grid-cell[data-x="${x}"][data-y="${y}"]`);
        if (!el) return;
        const num = el.querySelector('.cell-number');
        el.className = 'grid-cell';
        if (num) el.appendChild(num);
        if      (cell.isStart)    el.classList.add('start');
        else if (cell.isEnd)      el.classList.add('end');
        else if (cell.isPath)     el.classList.add('path');
        else if (cell.isVisited)  el.classList.add('visited');
        else if (cell.isObstacle) el.classList.add('obstacle');
        if (cell.isCurrent)       el.classList.add('current');
    }

    updateCoordinates() {
        const s = document.getElementById('start-coords');
        const e = document.getElementById('end-coords');
        if (s) s.textContent = `(${this.start.x},${this.start.y})`;
        if (e) e.textContent = `(${this.end.x},${this.end.y})`;
    }

    // ─── ALGORITHM INFO PANEL ─────────────────────────────

    updateAlgorithmInfo() {
        const meta = ALGO_META[this.algorithm];
        if (!meta) return;

        const box = document.getElementById('algorithm-info-box');
        if (box) {
            box.innerHTML = `
                <h4 class="algo-name"><i class="fas ${meta.icon}"></i> ${meta.name}</h4>
                <p class="algo-desc">${meta.desc}</p>
                <div class="complexity-row">
                    <div class="complexity-chip"><span class="cc-label">Time</span><span class="cc-val">${meta.time}</span></div>
                    <div class="complexity-chip"><span class="cc-label">Space</span><span class="cc-val">${meta.space}</span></div>
                </div>
            `;
        }

        // Update pseudocode panel
        const pseudo = document.getElementById('pseudocode-box');
        if (pseudo && meta.pseudo) {
            pseudo.innerHTML = meta.pseudo.map((line, i) =>
                `<div class="code-line"><span class="ln">${i+1}</span><code>${this._escHtml(line)}</code></div>`
            ).join('');
        }

        this.clearAlgorithmSteps();
        this.clearDataStructures();
    }

    _escHtml(str) {
        return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
                  .replace(/ /g, '&nbsp;');
    }

    // ─── VISUALIZATION CONTROL ────────────────────────────

    startVisualization() {
        if (this.isVisualizing) return;
        this.resetVisualization();
        this.isVisualizing = true;
        this.isPaused = false;
        this.updateVisualizationControls();
        this.updateStatus('running');

        switch (this.algorithm) {
            case 'dfs':          this.runDFS(); break;
            case 'bfs':          this.runBFS(); break;
            case 'dbdfs':        this.runDBDFS(); break;
            case 'dfid':         this.runDFID(); break;
            case 'hillclimbing': this.runHillClimbing(); break;
            case 'tabu':         this.runTabuSearch(); break;
            case 'ihc':          this.runIHC(); break;
            case 'randomwalk':   this.runRandomWalk(); break;
            case 'shc':          this.runSHC(); break;
            case 'sa':           this.runSA(); break;
            case 'beam':         this.runBeamSearch(); break;
        }
    }

    pauseVisualization() {
        if (!this.isVisualizing || this.isPaused) return;
        this.isPaused = true;
        this.updateVisualizationControls();
        this.updateStatus('paused');
    }

    resumeVisualization() {
        if (!this.isVisualizing || !this.isPaused) return;
        this.isPaused = false;
        this.updateVisualizationControls();
        this.updateStatus('running');
    }

    stepVisualization() {}

    resetVisualization() {
        this.isVisualizing = false; this.isPaused = false;
        this.lastAlgoInstance = null;
        this.nodesVisited = 0; this.pathLength = 0; this.executionTime = 0; this.backtrackCount = 0;

        for (let y = 0; y < this.gridSize; y++)
            for (let x = 0; x < this.gridSize; x++) {
                this.maze[y][x].isVisited = false; this.maze[y][x].isPath = false;
                this.maze[y][x].isCurrent = false; this.maze[y][x].parent = null;

                // Remove tabu-cell and best-node class
                const el = document.querySelector(`.grid-cell[data-x="${x}"][data-y="${y}"]`);
                if (el) {
                    el.classList.remove('tabu-cell');
                    el.classList.remove('best-node');
                }

                this.updateCell(x, y);
            }

        this.updateVisualizationControls();
        this.updateStatus('idle');
        this.updateStats();
        this.clearDataStructures();
        this.clearAlgorithmSteps();
        this.clearPathCoordinates();

        const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
        set('path-status', 'Not Started'); set('path-found', '—'); set('total-steps', '0');
        set('sso-bound', '0'); set('sso-iteration', '1');
        set('sso-best-node', '—'); set('sso-best-h', '—');
        
        const beamB = document.getElementById('beam-width');
        if (beamB) beamB.value = 2;
    }

    updateVisualizationControls() {
        const startBtn = document.getElementById('start-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const stepBtn  = document.getElementById('step-btn');
        if (!this.isVisualizing) {
            startBtn.innerHTML = '<i class="fas fa-play"></i><span>Start Visualization</span>';
            pauseBtn.disabled = true; stepBtn.disabled = true;
        } else if (this.isPaused) {
            startBtn.innerHTML = '<i class="fas fa-play"></i><span>Resume</span>';
            pauseBtn.disabled = true; stepBtn.disabled = false;
        } else {
            startBtn.innerHTML = '<i class="fas fa-pause"></i><span>Pause</span>';
            pauseBtn.disabled = false; stepBtn.disabled = true;
        }
    }

    updateStatus(status) {
        const pill = document.getElementById('status-indicator');
        if (!pill) return;
        const dotClass = { idle:'status-dot--idle', running:'status-dot--running', paused:'status-dot--paused', finished:'status-dot--finished', error:'status-dot--error' };
        const text     = { idle:'Ready to start', running:'Visualizing...', paused:'Paused', finished:'Completed!', error:'Error' };
        pill.innerHTML = `<span class="status-dot ${dotClass[status]||'status-dot--idle'}"></span><span>${text[status]||status}</span>`;
    }

    updateStats() {
        const s = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
        s('nodes-visited',   this.nodesVisited);
        s('path-length',     this.pathLength);
        s('execution-time',  this.executionTime);
        s('backtrack-count', this.backtrackCount);
        s('backtrack-display', this.backtrackCount);
        s('total-steps',     this.nodesVisited);
    }

    updateDataStructures(openList, closedList) {
        const openEl   = document.getElementById('open-stack');
        const closedEl = document.getElementById('closed-list');
        const isQueue  = this.algorithm === 'bfs';

        if (openEl) {
            openEl.innerHTML = '';
            if (!openList || openList.length === 0) {
                openEl.innerHTML = `<div class="empty-ds">${isQueue?'Queue':'Stack'} is empty</div>`;
            } else {
                (isQueue ? openList : [...openList].reverse()).slice(0, 30).forEach(n => {
                    const item = document.createElement('div');
                    item.className = 'ds-item';
                    item.textContent = n.h !== undefined ? `(${n.x},${n.y}) h=${n.h}` : `(${n.x},${n.y})`;
                    openEl.appendChild(item);
                });
            }
        }

        if (closedEl) {
            closedEl.innerHTML = '';
            if (!closedList || closedList.length === 0) {
                closedEl.innerHTML = '<div class="empty-ds">List is empty</div>';
            } else {
                closedList.slice(-30).forEach(n => {
                    const item = document.createElement('div');
                    item.className = 'ds-item';
                    item.textContent = `(${n.x},${n.y})`;
                    closedEl.appendChild(item);
                });
            }
        }

        const oc = document.getElementById('open-count');
        const cc = document.getElementById('closed-count');
        if (oc) oc.textContent = openList?.length || 0;
        if (cc) cc.textContent = closedList?.length || 0;
    }

    clearDataStructures() {
        const isQueue = this.algorithm === 'bfs';
        const oe = document.getElementById('open-stack');
        const ce = document.getElementById('closed-list');
        const oc = document.getElementById('open-count');
        const cc = document.getElementById('closed-count');
        if (oe) oe.innerHTML = `<div class="empty-ds">${isQueue?'Queue':'Stack'} is empty</div>`;
        if (ce) ce.innerHTML = '<div class="empty-ds">List is empty</div>';
        if (oc) oc.textContent = '0';
        if (cc) cc.textContent = '0';
    }

    addAlgorithmStep(title, code, active = false) {
        const feed = document.getElementById('algorithm-steps');
        if (!feed) return;
        const n = feed.children.length + 1;
        const item = document.createElement('div');
        item.className = `step-item${active?' active':''}`;
        item.innerHTML = `<div class="step-num">${n}</div><div class="step-body"><div class="step-title">${title}</div><div class="step-code">${code}</div></div>`;
        feed.appendChild(item);
        feed.scrollTop = feed.scrollHeight;
    }

    clearAlgorithmSteps() {
        const feed = document.getElementById('algorithm-steps');
        if (feed) {
            if (this.algorithm === 'dbdfs') {
                feed.innerHTML = `<div class="step-item initial-step"><div class="step-num">1-2</div><div class="step-body"><div class="step-title">Initialize OPEN and CLOSED</div><div class="step-code">OPEN &larr; (S, null, 0) : [ ]<br>CLOSED &larr; empty list</div></div></div>`;
            } else {
                feed.innerHTML = `<div class="step-item initial-step"><div class="step-num">1</div><div class="step-body"><div class="step-title">Initialize OPEN and CLOSED</div><div class="step-code">OPEN &larr; (S, null) | CLOSED &larr; empty</div></div></div>`;
            }
        }
    }

    addPathCoordinate(x, y) {
        const list = document.getElementById('path-coordinates');
        if (!list) return;
        if (list.querySelector('.empty-path')) list.innerHTML = '';
        const item = document.createElement('div');
        item.className = 'coordinate-item';
        item.textContent = `(${x},${y})`;
        list.appendChild(item);
        list.scrollTop = list.scrollHeight;
    }

    clearPathCoordinates() {
        const list = document.getElementById('path-coordinates');
        if (list) list.innerHTML = '<div class="empty-path">Run visualization first</div>';
    }

    highlightPseudocodeLine(n) {
        document.querySelectorAll('.code-line').forEach(l => l.classList.remove('highlight-line'));
        const lines = document.querySelectorAll('.code-line');
        if (lines[n-1]) lines[n-1].classList.add('highlight-line');
    }

    updateCurrentCoordinates(cell) {
        const el = document.getElementById('current-coords');
        if (el) el.textContent = cell ? `(${cell.x},${cell.y})` : '—';
    }

    // ─── SHARED RUN LOOP (generic) ────────────────────────

    async _runAlgorithm(algoInstance, openListKey) {
        this.lastAlgoInstance = algoInstance;
        const startTime = performance.now();
        this.addAlgorithmStep('Initialize', 'OPEN ← [(S, null)], CLOSED ← []', true);
        this.highlightPseudocodeLine(1);

        // Overlay elements
        const overlay = document.getElementById('search-status-overlay');
        const ssoBound = document.getElementById('sso-bound');
        const ssoIter = document.getElementById('sso-iteration');

        const isDFID = algoInstance.constructor.name === 'DFIDAlgorithm';
        const isHeuristic = ['HillClimbingAlgorithm', 'TabuSearchAlgorithm', 'IteratedHillClimbingAlgorithm', 'StochasticHillClimbingAlgorithm', 'SimulatedAnnealingAlgorithm', 'RandomWalkAlgorithm', 'BeamSearchAlgorithm'].includes(algoInstance.constructor.name);
        
        if (overlay) overlay.style.display = (isDFID || isHeuristic) ? 'flex' : 'none';

        while (this.isVisualizing && !algoInstance.isComplete) {
            if (this.isPaused) { await this.waitForResume(); if (!this.isVisualizing) break; }

            const result = algoInstance.step();

            // Update Overlay (DFID or Heuristic)
            if (isDFID) {
                if (ssoBound) ssoBound.textContent = algoInstance.depthBound;
                if (ssoIter)  ssoIter.textContent  = algoInstance.iteration;
            } else if (isHeuristic) {
                const ssoBestN = document.getElementById('sso-best-node');
                const ssoBestH = document.getElementById('sso-best-h');
                const b = algoInstance.bestNode || algoInstance.bestSeen;
                if (b) {
                    if (ssoBestN) ssoBestN.textContent = `(${b.x},${b.y})`;
                    if (ssoBestH) ssoBestH.textContent = b.h?.toFixed(1) || '0';
                    
                    // HIGHLIGHT BEST NODE ON GRID
                    document.querySelectorAll('.best-node').forEach(el => el.classList.remove('best-node'));
                    const bestCellEl = document.querySelector(`.grid-cell[data-x="${b.x}"][data-y="${b.y}"]`);
                    if (bestCellEl) bestCellEl.classList.add('best-node');
                }
            }

            this.nodesVisited   = algoInstance.nodesVisited;
            this.backtrackCount = algoInstance.backtrackCount;
            this.updateDataStructures(algoInstance[openListKey] || [], algoInstance.closedList || []);

            if (result.step) {
                this.addAlgorithmStep(result.step.title, result.step.code, true);
                this.highlightPseudocodeLine(result.step.line || 1);
            }

            // Update current cell highlight
            if (result.currentCell) {
                const prev = this.maze.flat().find(c => c.isCurrent);
                if (prev) { prev.isCurrent = false; this.updateCell(prev.x, prev.y); }
                result.currentCell.isCurrent = true;
                this.updateCell(result.currentCell.x, result.currentCell.y);
            }

            if (result.visitedCell) {
                result.visitedCell.isVisited = true;
                this.updateCell(result.visitedCell.x, result.visitedCell.y);
            }

            this.updateStats();
            this.updateCurrentCoordinates(result.currentCell);

            // Highlight bestNode found (Heuristic/Stochastic)
            if (result.bestNode) {
                // Clear old highlights
                document.querySelectorAll('.grid-cell.best-node').forEach(el => el.classList.remove('best-node'));
                // Add to new best
                const bestEl = document.querySelector(`.grid-cell[data-x="${result.bestNode.x}"][data-y="${result.bestNode.y}"]`);
                if (bestEl) bestEl.classList.add('best-node');
            }

            if (result.pathFound) {
                result.path.forEach(cell => {
                    cell.isPath = true;
                    this.updateCell(cell.x, cell.y);
                    this.addPathCoordinate(cell.x, cell.y);
                });
                this.pathLength = result.path.length;
                this.executionTime = Math.floor(performance.now() - startTime);
                this.updateStats();
                this.updateStatus('finished');
                const pf = document.getElementById('path-found'); if (pf) pf.textContent = 'Yes ✓';
                const ps = document.getElementById('path-status'); if (ps) ps.textContent = 'Path Found';
                this.addAlgorithmStep('Path Found!', `Length = ${result.path.length}`);
                this.highlightPseudocodeLine(6);
                this.isVisualizing = false;
                this.updateVisualizationControls();
                break;
            }

            if (algoInstance.isComplete && !result.pathFound) {
                this.executionTime = Math.floor(performance.now() - startTime);
                this.updateStats();
                this.updateStatus('finished');
                const pf = document.getElementById('path-found'); if (pf) pf.textContent = 'No ✗';
                const ps = document.getElementById('path-status'); if (ps) ps.textContent = 'No Path';
                this.addAlgorithmStep('Search Complete', 'No path found');
                this.isVisualizing = false;
                this.updateVisualizationControls();
                break;
            }

            await this.delay();
        }
    }

    async runDFS() {
        const algo = new DFSAlgorithm(this.maze, this.start, this.end);
        await this._runAlgorithm(algo, 'openStack');
    }

    async runBFS() {
        const algo = new BFSAlgorithm(this.maze, this.start, this.end);
        await this._runAlgorithm(algo, 'openQueue');
    }

    async runDBDFS() {
        const depthLimit = parseInt(document.getElementById('depth-limit')?.value || '10');
        const algo = new DBDFSAlgorithm(this.maze, this.start, this.end, depthLimit);
        await this._runAlgorithm(algo, 'openStack');
    }

    async runDFID() {
        const algo = new DFIDAlgorithm(this.maze, this.start, this.end);
        await this._runAlgorithm(algo, 'openStack');
    }

    async runHillClimbing() {
        const hType = document.getElementById('heuristic-type')?.value || 'manhattan';
        const algo = new HillClimbingAlgorithm(this.maze, this.start, this.end, hType);
        await this._runAlgorithm(algo, 'openStack');
    }

    async runTabuSearch() {
        const tenure = parseInt(document.getElementById('tabu-tenure')?.value || '5');
        const hType = document.getElementById('heuristic-type')?.value || 'manhattan';
        const algo = new TabuSearchAlgorithm(this.maze, this.start, this.end, tenure, hType);
        await this._runAlgorithm(algo, 'openStack');
    }

    async runIHC() {
        const restarts = parseInt(document.getElementById('ihc-restarts')?.value || '5');
        const hType = document.getElementById('heuristic-type')?.value || 'manhattan';
        const algo = new IteratedHillClimbingAlgorithm(this.maze, this.start, this.end, restarts, hType);
        await this._runAlgorithm(algo, 'openStack');
    }

    async runBeamSearch() {
        const b = parseInt(document.getElementById('beam-width')?.value || '2');
        const hType = document.getElementById('heuristic-type')?.value || 'manhattan';
        const algo = new BeamSearchAlgorithm(this.maze, this.start, this.end, b, hType);
        await this._runAlgorithm(algo, 'openStack');
    }

    async runRandomWalk() {
        const nSteps = parseInt(document.getElementById('ihc-restarts')?.value || '10');
        const hType = document.getElementById('heuristic-type')?.value || 'manhattan';
        const algo = new RandomWalkAlgorithm(this.maze, this.start, this.end, nSteps, hType);
        await this._runAlgorithm(algo, 'openStack');
    }

    async runSHC() {
        // Internal default to 100 since user removed the iteration input for SHC
        const nSteps = 100;
        const temp = parseFloat(document.getElementById('temperature')?.value || '80');
        const hType = document.getElementById('heuristic-type')?.value || 'manhattan';
        const algo = new StochasticHillClimbingAlgorithm(this.maze, this.start, this.end, nSteps, temp, hType);
        await this._runAlgorithm(algo, 'openStack');
    }

    async runSA() {
        const nEpochs = parseInt(document.getElementById('ihc-restarts')?.value || '5');
        const cycles = parseInt(document.getElementById('sa-cycles')?.value || '50');
        const initialTemp = parseFloat(document.getElementById('temperature')?.value || '100');
        const hType = document.getElementById('heuristic-type')?.value || 'manhattan';
        const algo = new SimulatedAnnealingAlgorithm(this.maze, this.start, this.end, nEpochs, cycles, initialTemp, hType);
        await this._runAlgorithm(algo, 'openStack');
    }

    // ─── UTILITIES ────────────────────────────────────────

    waitForResume() {
        return new Promise(resolve => {
            const check = () => this.isPaused ? setTimeout(check, 100) : resolve();
            check();
        });
    }

    delay() {
        return new Promise(resolve => setTimeout(resolve, Math.max(1, 105 - this.speed)));
    }

    showHistoryModal() {
        const modal = document.getElementById('history-modal');
        const list = document.getElementById('dfid-history-list');
        if (!modal || !list) return;

        modal.classList.add('active');
        list.innerHTML = '';

        const algo = this.lastAlgoInstance;
        if (!algo || (!algo.history.length && algo.iteration === 0)) {
            list.innerHTML = '<div class="empty-history">No history recorded yet. Run DFID to see results.</div>';
            return;
        }

        // Combine completed history with live bound progress
        const displayHistory = [...algo.history];
        const isAlreadyInHistory = algo.history.some(h => h.bound === algo.depthBound);
        
        if (!algo.isComplete && !isAlreadyInHistory) {
            displayHistory.push({ bound: algo.depthBound, iterations: algo.iteration, isLive: true });
        }

        displayHistory.forEach(item => {
            const div = document.createElement('div');
            div.className = `history-item${item.isLive ? ' history-item--live' : ''}`;
            div.innerHTML = `
                <div class="history-item-bound">
                    <i class="fas fa-layer-group"></i> Bound: ${item.bound} ${item.isLive ? '<small>(Active)</small>' : ''}
                </div>
                <div class="history-item-iters">
                    Iterations: <span>${item.iterations}</span>
                </div>
            `;
            list.appendChild(div);
        });
    }

    showToast(msg) {
        let t = document.getElementById('_toast');
        if (!t) {
            t = document.createElement('div'); t.id = '_toast';
            t.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(10,15,28,.97);border:1px solid rgba(0,212,255,.3);color:#e2e8f4;padding:8px 20px;border-radius:99px;font-family:Inter,sans-serif;font-size:.8rem;z-index:1000;pointer-events:none;opacity:0;transition:opacity .22s ease;box-shadow:0 4px 20px rgba(0,0,0,.5)';
            document.body.appendChild(t);
        }
        t.textContent = msg; t.style.opacity = '1';
        clearTimeout(t._t); t._t = setTimeout(() => { t.style.opacity = '0'; }, 3000);
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
    }
}

// ─── BOOT ─────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    window.mazeVisualizer = new MazeVisualizer();
});