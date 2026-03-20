export default class Driftbox {
    constructor(container, options = {}) {
        this.container = container;
        this.images = options.images || [];
        this.current = 0;

        this.init();
    }

    init() {
        this.track = document.createElement("div");
        this.thumb = document.createElement("div");

        this.track.className = "drift-box__track";
        this.thumb.className = "drift-box__thumb";

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

        const imagesCloned = [
            this.images[this.images.length - 1],
            ...this.images,
            this.images[0],
        ];

        imagesCloned.forEach((src) => {
            const img = document.createElement("img");
            img.src = src;
            Object.assign(img.style, {
                width: "100%",
                height: "100%",
                objectFit: "cover",
                flexShrink: "0",
            });
            this.thumb.appendChild(img);
        });

        this.track.appendChild(this.thumb);
        this.container.appendChild(this.track);

        this.current = 1;
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
            if (this.current === this.images.length + 1) {
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
                this.current = this.images.length;
                this.update(false);
            }
        }, 310);
    }
}

class DriftboxElement extends HTMLElement {
    connectedCallback() {
        const imagesAttr = this.getAttribute("images") || "";
        const images = imagesAttr
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);

        new Driftbox(this, { images });
    }
}

customElements.define("drift-box", DriftboxElement);
