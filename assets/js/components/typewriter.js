import { TYPING } from '../config.js';

const PAUSE_AFTER = { ',': 'comma', ';': 'comma', ':': 'comma',
                      '.': 'period', '!': 'period', '?': 'period',
                      '—': 'period', '…': 'period' };

/* Go chu ra tung ky tu. Moi doan la mot <p>, con tro nhay o doan dang go.
   Dung setTimeout chu khong dung requestAnimationFrame: rAF ngung chay khi
   nguoi dung chuyen tab, chu se ket lai giua cau va khong bao gio go xong. */
export class Typewriter {
    #host;
    #paragraphs;
    #speed;
    #onDone;
    #lines = [];
    #line = 0;
    #pos = 0;
    #timer = null;

    constructor(host, paragraphs, { speed = TYPING, onDone = () => {} } = {}) {
        this.#host = host;
        this.#paragraphs = paragraphs;
        this.#speed = speed;
        this.#onDone = onDone;
    }

    play() {
        this.#build();
        this.#line = 0;
        this.#pos = 0;
        this.#lines[0].el.classList.add('is-typing');
        this.#tick();
    }

    /** Hien het chu ngay, dung dang go giua duong. */
    finish() {
        clearTimeout(this.#timer);
        if (!this.#lines.length) this.#build();
        for (const line of this.#lines) {
            line.el.textContent = line.text;
            line.el.classList.remove('is-typing');
        }
        this.#onDone();
    }

    reset() {
        clearTimeout(this.#timer);
        this.#lines = [];
        this.#host.replaceChildren();
    }

    #build() {
        this.#host.replaceChildren();
        this.#lines = this.#paragraphs.map(text => {
            const el = document.createElement('p');
            el.className = 'letter__p';
            this.#host.append(el);
            return { el, text };
        });
    }

    #tick() {
        const line = this.#lines[this.#line];
        const char = line.text[this.#pos++];
        this.#render(line, char);

        if (this.#pos < line.text.length) {
            this.#timer = setTimeout(() => this.#tick(), this.#delay(char));
            return;
        }

        line.el.textContent = line.text;   // go xong doan thi gop het lai lam mot
        line.el.classList.remove('is-typing');
        const next = this.#lines[++this.#line];
        if (!next) {
            this.#onDone();
            return;
        }

        this.#pos = 0;
        next.el.classList.add('is-typing');
        this.#timer = setTimeout(() => this.#tick(), this.#speed.paragraph);
    }

    /* Chi ky tu vua go moi duoc boc trong <span> de chay hieu ung khac da;
       nhung ky tu truoc do gop het vao mot text node. Nho vay moi doan chi
       giu toi da hai node thay vi hang tram <span> chet nam lai. Dau cach
       khong boc: <span> la inline-block nen mot dau cach inline-block se
       chan cho ngat dong, chu se tran ra khoi le trong mot nhip. */
    #render(line, char) {
        const typed = line.text.slice(0, this.#pos);
        if (char === ' ') {
            line.el.textContent = typed;
            return;
        }
        const chip = document.createElement('span');
        chip.className = 'letter__chip';
        chip.textContent = char;
        line.el.replaceChildren(document.createTextNode(typed.slice(0, -1)), chip);
    }

    #delay(char) {
        const base = this.#speed[PAUSE_AFTER[char]] ?? this.#speed.char;
        return base * (1 + (Math.random() - 0.5) * this.#speed.jitter);
    }
}
