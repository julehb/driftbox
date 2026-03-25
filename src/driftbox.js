export default class Driftbox {
    constructor(host, options = {}) {
        this.host = host;

        // Options
        this.autoplay = options.autoplay || false;
        this.interval = options.interval || 3000;
        this.pauseOnHover = options.pauseOnHover || false;
        this.paginationEnabled = options.pagination || false;

        // State
        this.current = 1;
        this.total = 0;
        this.timer = null;

        // Resize
        this.resizeObserver = null;

        // Drag/Touch
        this.isDragging = false;
        this.startX = 0;
        this.currentTranslate = 0;
        this.prevTranslate = 0;

        this.init();
        if (this.autoplay) this.startAutoplay();
    }

    init() {
        this.shadow = this.host.attachShadow({ mode: "open" });

        const style = document.createElement("style");
        style.textContent = `
            :host {
                display: block;
                position: relative;
                min-height: 200px;
            }
            
            .drift-box__track {
                width: 100%;
                height: 100%;
                overflow: hidden;
                position: relative;
            }

            .drift-box__thumb {
                display: flex;
                position: absolute;
                top: 0;
                left: 0;
                height: 100%;
                transition: transform 0.3s ease;
                will-change: transform;
            }

            .drift-box__thumb img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                flex-shrink: 0;
                user-select: none;
                pointer-events: none;
            }

            .drift-box__pagination {
                display: flex;
                justify-content: center;
                gap: 8px;
                margin-top: 10px;
            }
        `;

        this.track = document.createElement("div");
        this.track.className = "drift-box__track";

        // receive border-radius from connectedCallback
        if (this.host._customStyles?.borderRadius) {
            this.track.style.borderRadius =
                this.host._customStyles.borderRadius;
        }

        this.thumb = document.createElement("div");
        this.thumb.className = "drift-box__thumb";

        this.slot = document.createElement("slot");
        this.slot.style.display = "none";

        this.track.appendChild(this.thumb);
        this.shadow.append(style, this.track, this.slot);

        if (this.paginationEnabled) {
            this.pagination = document.createElement("div");
            this.pagination.className = "drift-box__pagination";
            this.shadow.appendChild(this.pagination);
        }

        this.slot.addEventListener("slotchange", () => {
            this.setupSlides();
        });
    }

    setupSlides() {
        const assigned = this.slot.assignedElements();
        if (assigned.length === 0) return;

        this.total = assigned.length;
        this.thumb.innerHTML = "";

        const slidesCloned = [
            assigned[assigned.length - 1].cloneNode(true),
            ...assigned.map((el) => el.cloneNode(true)),
            assigned[0].cloneNode(true),
        ];

        this.thumb.style.width = `${slidesCloned.length * 100}%`;

        const slideWidth = 100 / slidesCloned.length;

        slidesCloned.forEach((el) => {
            Object.assign(el.style, {
                width: `${slideWidth}%`,
                height: "100%",
                flexShrink: "0",
            });
            this.thumb.appendChild(el);
        });

        if (this.paginationEnabled) {
            this.pagination.innerHTML = "";
            for (let i = 0; i < this.total; i++) {
                const dot = document.createElement("div");
                Object.assign(dot.style, {
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background:
                        i === this.current - 1
                            ? "#000"
                            : "rgba(75, 75, 75, 0.5)",
                    cursor: "pointer",
                });
                dot.addEventListener("click", () => {
                    this.current = i + 1;
                    this.snapToSlide();
                });
                this.pagination.appendChild(dot);
            }
        }

        this.update(false);
        this.bindEvents();
        this.initResizeObserver();
    }

    initResizeObserver() {
        if (this.resizeObserver) return;

        this.resizeObserver = new ResizeObserver(() => {
            if (!this.isDragging) {
                this.update(false);
            }
        });

        this.resizeObserver.observe(this.track);
    }

    bindEvents() {
        // Mouse
        this.track.addEventListener("mousedown", this.startDrag.bind(this));
        window.addEventListener("mousemove", this.onDrag.bind(this));
        window.addEventListener("mouseup", this.endDrag.bind(this));

        if (
            this.pauseOnHover &&
            this.autoplay &&
            window.matchMedia("(hover: hover)").matches
        ) {
            this.track.addEventListener("mouseenter", () =>
                this.stopAutoplay(),
            );
            this.track.addEventListener("mouseleave", () =>
                this.startAutoplay(),
            );
        }

        // Touch
        this.track.addEventListener("touchstart", this.startDrag.bind(this), {
            passive: true,
        });
        window.addEventListener("touchmove", this.onDrag.bind(this), {
            passive: true,
        });
        window.addEventListener("touchend", this.endDrag.bind(this));
    }

    getPositionX(e) {
        return e.type.includes("mouse") ? e.clientX : e.touches[0].clientX;
    }

    getRealIndex() {
        if (this.current === 0) return this.total - 1;
        if (this.current === this.total + 1) return 0;
        return this.current - 1;
    }

    startDrag(e) {
        this.isDragging = true;
        this.thumb.style.transition = "none";
        this.startX = this.getPositionX(e);

        if (this.autoplay) this.stopAutoplay();
    }

    onDrag(e) {
        if (!this.isDragging) return;

        const currentX = this.getPositionX(e);
        const delta = currentX - this.startX;

        this.currentTranslate = this.prevTranslate + delta;

        this.thumb.style.transform = `translateX(${this.currentTranslate}px)`;
    }

    endDrag() {
        if (!this.isDragging) return;

        this.isDragging = false;

        const movedBy = this.currentTranslate - this.prevTranslate;

        if (movedBy < -50) {
            this.current++;
        } else if (movedBy > 50) {
            this.current--;
        }

        this.snapToSlide();

        if (this.autoplay) this.startAutoplay();
    }

    snapToSlide() {
        const width = this.track.offsetWidth;

        this.currentTranslate = -this.current * width;
        this.prevTranslate = this.currentTranslate;

        this.thumb.style.transition = "transform 0.3s ease";
        this.thumb.style.transform = `translateX(${this.currentTranslate}px)`;

        if (this.paginationEnabled) {
            const realIndex = this.getRealIndex();
            Array.from(this.pagination.children).forEach((dot, idx) => {
                dot.style.background =
                    idx === realIndex ? "#000" : "rgba(75, 75, 75, 0.5)";
            });
        }

        setTimeout(() => {
            if (this.current === this.total + 1) {
                this.current = 1;
                this.jumpWithoutAnimation();
            }

            if (this.current === 0) {
                this.current = this.total;
                this.jumpWithoutAnimation();
            }
        }, 310);
    }

    jumpWithoutAnimation() {
        const width = this.track.offsetWidth;
        this.currentTranslate = -this.current * width;
        this.prevTranslate = this.currentTranslate;
        this.thumb.style.transition = "none";
        this.thumb.style.transform = `translateX(${this.currentTranslate}px)`;
    }

    update(animate = true) {
        const width = this.track.offsetWidth;
        this.currentTranslate = -this.current * width;
        this.prevTranslate = this.currentTranslate;
        this.thumb.style.transition = animate ? "transform 0.3s ease" : "none";
        this.thumb.style.transform = `translateX(${this.currentTranslate}px)`;
    }

    next() {
        this.current++;
        this.snapToSlide();
    }

    prev() {
        this.current--;
        this.snapToSlide();
    }

    startAutoplay() {
        this.stopAutoplay();
        this.timer = setInterval(() => this.next(), this.interval);
    }

    stopAutoplay() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    destroy() {
        this.stopAutoplay();

        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
    }
}

class DriftboxElement extends HTMLElement {
    connectedCallback() {
        const autoplay = this.hasAttribute("autoplay");
        const interval = parseInt(this.getAttribute("interval")) || 3000;
        const pauseOnHover = this.hasAttribute("pause-on-hover");
        const pagination = this.hasAttribute("pagination");

        const styles = this.parseAttributes();

        Object.assign(this.style, {
            marginLeft: styles.marginLeft || "auto",
            marginRight: styles.marginRight || "auto",
        });

        this._customStyles = styles;

        this.slider = new Driftbox(this, {
            autoplay,
            interval,
            pauseOnHover,
            pagination,
        });
    }

    disconnectedCallback() {
        this.slider?.destroy();
    }

    parseAttributes() {
        const styles = {};

        // alignment
        if (this.hasAttribute("left")) {
            styles.marginLeft = "0";
            styles.marginRight = "auto";
        }

        if (this.hasAttribute("center")) {
            styles.marginLeft = "auto";
            styles.marginRight = "auto";
        }

        if (this.hasAttribute("right")) {
            styles.marginLeft = "auto";
            styles.marginRight = "0";
        }

        // border-radius
        if (this.hasAttribute("rounded")) {
            styles.borderRadius = "10px";
        }

        return styles;
    }

    next() {
        this.slider?.next();
    }

    prev() {
        this.slider?.prev();
    }
}

customElements.define("drift-box", DriftboxElement);
