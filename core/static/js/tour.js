/**
 * PREMIUM PRODUCT TOUR ORCHESTRATOR
 * Guides users through the visualizer interface with premium highlights and glassmorphic popovers.
 */
class ProductTour {
    /**
     * @param {string} tourId Unique ID to track completion in localStorage.
     * @param {Array} steps Array of tour step objects: { element: string, title: string, body: string, position: string }
     */
    constructor(tourId, steps) {
        this.tourId = tourId;
        this.steps = steps.filter(step => document.querySelector(step.element) !== null);
        this.currentStep = 0;
        this.isActive = false;

        this.overlay = null;
        this.highlight = null;
        this.popover = null;

        this.resizeHandler = this.handleResize.bind(this);
        this.keyHandler = this.handleKeyDown.bind(this);
    }

    /**
     * Set up DOM elements for the tour.
     */
    init() {
        if (document.getElementById('tour-overlay-el')) return;

        // Overlay
        this.overlay = document.createElement('div');
        this.overlay.id = 'tour-overlay-el';
        this.overlay.className = 'tour-overlay';

        // Highlight
        this.highlight = document.createElement('div');
        this.highlight.className = 'tour-highlight';

        // Popover
        this.popover = document.createElement('div');
        this.popover.className = 'tour-popover';

        this.overlay.appendChild(this.highlight);
        document.body.appendChild(this.overlay);
        document.body.appendChild(this.popover);
    }

    /**
     * Start the tour if there are steps available.
     * @param {boolean} force If true, starts the tour regardless of localStorage status.
     */
    start(force = false) {
        if (this.steps.length === 0) return;
        
        const completed = localStorage.getItem(`tour-completed-${this.tourId}`);
        if (completed && !force) return;

        this.init();
        this.isActive = true;
        this.currentStep = 0;

        this.overlay.classList.add('active');
        this.popover.classList.add('active');

        this.renderStep();

        window.addEventListener('resize', this.resizeHandler);
        window.addEventListener('keydown', this.keyHandler);
    }

    /**
     * Display the current step, update highlighted cutout and popover location.
     */
    renderStep() {
        if (!this.isActive) return;

        const step = this.steps[this.currentStep];
        const targetEl = document.querySelector(step.element);
        if (!targetEl) return;

        // Auto-scroll target into center view
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Update Popover markup
        const isLast = this.currentStep === this.steps.length - 1;
        const progressText = `Step ${this.currentStep + 1} of ${this.steps.length}`;

        this.popover.innerHTML = `
            <div class="tour-header">
                <span class="tour-title">${step.title}</span>
                <span class="tour-progress">${progressText}</span>
            </div>
            <div class="tour-body">${step.body}</div>
            <div class="tour-footer">
                <button class="tour-btn tour-btn--skip" id="tour-btn-skip">Skip Tour</button>
                <div class="tour-btn-group">
                    ${this.currentStep > 0 ? '<button class="tour-btn tour-btn--back" id="tour-btn-back"><i class="fas fa-chevron-left"></i> Back</button>' : ''}
                    <button class="tour-btn ${isLast ? 'tour-btn--finish' : 'tour-btn--next'}" id="tour-btn-next">
                        ${isLast ? 'Finish <i class="fas fa-check"></i>' : 'Next <i class="fas fa-chevron-right"></i>'}
                    </button>
                </div>
            </div>
        `;

        // Bind events
        document.getElementById('tour-btn-skip').addEventListener('click', () => this.skip());
        if (this.currentStep > 0) {
            document.getElementById('tour-btn-back').addEventListener('click', () => this.prev());
        }
        document.getElementById('tour-btn-next').addEventListener('click', () => {
            if (isLast) this.finish();
            else this.next();
        });

        // Let scroll animation settle slightly, then position elements
        setTimeout(() => {
            this.positionTourElements(targetEl, step.position);
        }, 150);
    }

    /**
     * Position highlight highlight and popover bubble relative to target.
     */
    positionTourElements(targetEl, preferredPos) {
        const rect = targetEl.getBoundingClientRect();
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;

        const pad = 6; // padding around highlighted element

        // Update highlight boundary
        this.highlight.style.top = `${rect.top + scrollY - pad}px`;
        this.highlight.style.left = `${rect.left + scrollX - pad}px`;
        this.highlight.style.width = `${rect.width + (pad * 2)}px`;
        this.highlight.style.height = `${rect.height + (pad * 2)}px`;

        // Clear arrow classes
        this.popover.className = 'tour-popover active';

        // Calculate positions
        const popoverWidth = this.popover.offsetWidth;
        const popoverHeight = this.popover.offsetHeight;

        let popoverTop = 0;
        let popoverLeft = 0;
        let arrowClass = 'tour-popover--arrow-top';

        const offset = 18; // offset from target element including arrow size

        // Decide actual positioning
        switch (preferredPos) {
            case 'bottom':
                popoverTop = rect.bottom + scrollY + offset;
                popoverLeft = rect.left + scrollX + (rect.width / 2) - (popoverWidth / 2);
                arrowClass = 'tour-popover--arrow-top';
                break;
            case 'top':
                popoverTop = rect.top + scrollY - popoverHeight - offset;
                popoverLeft = rect.left + scrollX + (rect.width / 2) - (popoverWidth / 2);
                arrowClass = 'tour-popover--arrow-bottom';
                break;
            case 'left':
                popoverTop = rect.top + scrollY + (rect.height / 2) - (popoverHeight / 2);
                popoverLeft = rect.left + scrollX - popoverWidth - offset;
                arrowClass = 'tour-popover--arrow-right';
                break;
            case 'right':
                popoverTop = rect.top + scrollY + (rect.height / 2) - (popoverHeight / 2);
                popoverLeft = rect.right + scrollX + offset;
                arrowClass = 'tour-popover--arrow-left';
                break;
        }

        // Viewport boundaries safety fallback
        const buffer = 15;
        if (popoverLeft < buffer) {
            popoverLeft = buffer;
        } else if (popoverLeft + popoverWidth > window.innerWidth - buffer) {
            popoverLeft = window.innerWidth - popoverWidth - buffer;
        }

        if (popoverTop < buffer) {
            popoverTop = rect.bottom + scrollY + offset;
            arrowClass = 'tour-popover--arrow-top';
        } else if (popoverTop + popoverHeight > document.documentElement.scrollHeight - buffer) {
            popoverTop = rect.top + scrollY - popoverHeight - offset;
            arrowClass = 'tour-popover--arrow-bottom';
        }

        // Apply classes and positioning
        this.popover.classList.add(arrowClass);
        this.popover.style.top = `${popoverTop}px`;
        this.popover.style.left = `${popoverLeft}px`;
    }

    next() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.renderStep();
        }
    }

    prev() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.renderStep();
        }
    }

    skip() {
        this.cleanup();
        localStorage.setItem(`tour-completed-${this.tourId}`, 'skipped');
    }

    finish() {
        this.cleanup();
        localStorage.setItem(`tour-completed-${this.tourId}`, 'completed');
    }

    cleanup() {
        this.isActive = false;
        if (this.overlay) this.overlay.classList.remove('active');
        if (this.popover) this.popover.classList.remove('active');

        window.removeEventListener('resize', this.resizeHandler);
        window.removeEventListener('keydown', this.keyHandler);

        setTimeout(() => {
            if (this.overlay) this.overlay.remove();
            if (this.popover) this.popover.remove();
        }, 400);
    }

    handleResize() {
        if (!this.isActive) return;
        const step = this.steps[this.currentStep];
        const targetEl = document.querySelector(step.element);
        if (targetEl) {
            this.positionTourElements(targetEl, step.position);
        }
    }

    handleKeyDown(e) {
        if (!this.isActive) return;
        if (e.key === 'ArrowRight' || e.key === 'Enter') {
            const isLast = this.currentStep === this.steps.length - 1;
            if (isLast) this.finish();
            else this.next();
        } else if (e.key === 'ArrowLeft') {
            this.prev();
        } else if (e.key === 'Escape') {
            this.skip();
        }
    }
}
