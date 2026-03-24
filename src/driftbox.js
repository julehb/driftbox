export default class Driftbox {
    constructor(host, options = {}) {
        this.host = host;
        this.current = 1;
        this.autoplay = options.autoplay || false;
        this.interval = options.interval || 3000;
        this.timer = null;

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

            .drift-box__thumb ::slotted(*) {
                width: 100%;
                height: 100%;
                flex-shrink: 0;
                object-fit: cover;
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
