export default class Driftbox {
    constructor(container, options = {}) {
        this.container = container;
        this.current = 1;
        this.autoplay = options.autoplay || false;
        this.interval = options.interval || 3000;
        this.timer = null;

        this.init();
        if (this.autoplay) this.startAutoplay();
    }

    init() {
        this.track = document.createElement("div");
        this.thumb = document.createElement("div");

        Object.assign(this.track.style, {
            width: "100%",
            height: "100%",
            overflow: "hidden",
            position: "relative",
            borderRadius: "10px",
            // cursor: "pointer",
        });

        Object.assign(this.thumb.style, {
            display: "flex",
            position: "absolute",
            top: "0",
            left: "0",
            height: "100%",
            width: "100%",
            transition: "left 0.3s ease",
        });

        const slides = Array.from(this.container.children);
        if (slides.length === 0) return;

        const first = slides[0].cloneNode(true);
        const last = slides[slides.length - 1].cloneNode(true);

        const slidesCloned = [last, ...slides, first];

        slidesCloned.forEach((el) => {
            Object.assign(el.style, {
                width: "100%",
                height: "100%",
                flexShrink: "0",
                objectFit: "cover",
            });
            this.thumb.appendChild(el);
        });

        this.container.innerHTML = "";
        this.track.appendChild(this.thumb);
        this.container.appendChild(this.track);

        this.total = slides.length;

        this.update();

        this.bindEvents();
    }

    bindEvents() {
        this.track.addEventListener("click", () => {
            this.next();
        });
    }

    update(animate = true) {
        this.thumb.style.transition = animate ? "left 0.3s ease" : "none";
        this.thumb.style.left = `-${this.current * 100}%`;
    }

    next() {
        this.current++;
        this.update();

        setTimeout(() => {
            if (this.current === this.total + 1) {
                this.current = 1;
                this.update(false);
            }
        }, 310);
    }

    prev() {
        this.current--;
        this.update();

        setTimeout(() => {
            if (this.current === 0) {
                this.current = this.total;
                this.update(false);
            }
        }, 310);
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

        this.slider = new Driftbox(this, { autoplay, interval });
    }

    disconnectedCallback() {
        if (this.slider) this.slider.stopAutoplay();
    }
}

customElements.define("drift-box", DriftboxElement);
