export default class Driftbox {
    constructor(host, options = {}) {
        this.host = host;
        this.current = 1;
        this.autoplay = options.autoplay || false;
        this.interval = options.interval || 3000;
        this.pauseOnHover = options.pauseOnHover || false;
        this.timer = null;

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
            .drift-box__track {
                width: 100%;
                height: 100%;
                overflow: hidden;
                position: relative;
                borderRadius: 10px;
            }

            .drift-box__thumb {
                display: flex;
                position: absolute;
                top: 0;
                left: 0;
                height: 100%;
                width: 100%;
                transition: left 0.3s ease;
            }

            .drift-box__thumb img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                flex-shrink: 0;
                user-select: none;
                pointer-events: none;
            }
            `;

        this.track = document.createElement("div");
        this.thumb = document.createElement("div");

        this.track.className = "drift-box__track";
        this.thumb.className = "drift-box__thumb";

        this.slot = document.createElement("slot");

        this.thumb.appendChild(this.slot);
        this.track.appendChild(this.thumb);
        this.shadow.append(style, this.track);

        this.slot.addEventListener("slotchange", () => {
            this.setupSlides();
        });
    }

    setupSlides() {
        const assigned = this.slot.assignedElements();

        if (assigned.length === 0) return;

        this.total = assigned.length;

        const first = assigned[0].cloneNode(true);
        const last = assigned[assigned.length - 1].cloneNode(true);

        this.thumb.innerHTML = "";

        const slidesCloned = [last, ...assigned, first];
        slidesCloned.forEach((el) => {
            Object.assign(el.style, {
                width: "100%",
                height: "100%",
                flexShrink: "0",
            });
            this.thumb.appendChild(el);
        });

        this.update(false);
        this.bindEvents();
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
}

class DriftboxElement extends HTMLElement {
    connectedCallback() {
        const autoplay = this.hasAttribute("autoplay");
        const interval = parseInt(this.getAttribute("interval")) || 3000;
        const pauseOnHover = this.hasAttribute("pause-on-hover");

        this.slider = new Driftbox(this, { autoplay, interval, pauseOnHover });
    }

    disconnectedCallback() {
        this.slider?.stopAutoplay();
    }

    next() {
        this.slider?.next();
    }

    prev() {
        this.slider?.prev();
    }
}

customElements.define("drift-box", DriftboxElement);
