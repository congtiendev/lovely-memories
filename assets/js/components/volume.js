/* Tang giam am luong nhac nen. Nut loa o goc duoi-phai van la nut tat/bat tieng, nhung bam vao
   thi MO thanh am luong ben canh truoc (hover tren may tinh cung mo), roi tu dong thu lai sau
   vai giay khong dung toi:

     - thanh dong 0..100%, nut - / + moi lan 10% (de bam tren dien thoai, noi thanh keo nho kho trung)
     - bam nut loa luc thanh dang mo = tat / bat tieng (giong cac trinh phat nhac)
     - phim M tat/bat tieng, phim [ ] giam/tang am luong

   Am luong luu lai (localStorage) nen lan sau mo trang van o muc do. Chi nhac nen: tieng thuyet
   minh va tieng nhan vat khong bi anh huong. */
const STEP = 0.1;
const CLOSE_AFTER = 3500;   // ms khong dung toi thi thu thanh lai

export class Volume {
    #music;
    #sound;
    #panel;
    #range;
    #pct;
    #timer = 0;

    constructor({ music, sound, panel }) {
        this.#music = music;
        this.#sound = sound;
        this.#panel = panel;
        this.#range = panel.querySelector('.volume__range');
        this.#pct = panel.querySelector('.volume__pct');
        this.#show(music.volume);

        sound.addEventListener('click', () => {
            if (this.isOpen) this.#music.toggle();   // thanh dang mo: bam loa la tat / bat tieng
            else this.open();                          // chua mo: bam loa chi mo thanh
        });
        // May tinh: re chuot vao la mo san, bam loa luc do la tat tieng ngay
        sound.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') this.open(); });
        panel.addEventListener('pointerenter', () => this.#hold());
        panel.addEventListener('pointerleave', event => { if (event.pointerType === 'mouse') this.#later(900); });

        this.#range.addEventListener('input', () => this.#set(this.#range.value / 100));
        for (const button of panel.querySelectorAll('.volume__step')) {
            button.addEventListener('click', () => this.#set(this.#music.volume + STEP * Number(button.dataset.step)));
        }
        // Moi cham vao thanh deu keo dai thoi gian mo
        panel.addEventListener('pointerdown', () => this.#hold());
        panel.addEventListener('focusin', () => this.#hold());
        panel.addEventListener('focusout', () => this.#later());

        addEventListener('keydown', event => {
            if (event.ctrlKey || event.metaKey || event.altKey || event.target.closest?.('input, textarea')) return;
            if (event.key === 'm' || event.key === 'M') { this.#music.toggle(); this.open(); }
            else if (event.key === '[') { this.#set(this.#music.volume - STEP); this.open(); }
            else if (event.key === ']') { this.#set(this.#music.volume + STEP); this.open(); }
        });
        // Bam ra ngoai thi thu thanh
        addEventListener('pointerdown', event => {
            if (this.isOpen && !panel.contains(event.target) && !sound.contains(event.target)) this.close();
        });
    }

    get isOpen() { return this.#panel.classList.contains('is-open'); }

    open() {
        if (this.#sound.hidden) return;   // nhac chua bat (chua co cu bam nao): chua co gi de chinh
        this.#panel.hidden = false;
        this.#panel.classList.add('is-open');
        this.#sound.setAttribute('aria-expanded', 'true');
        this.#later();
    }

    close() {
        clearTimeout(this.#timer);
        this.#panel.classList.remove('is-open');
        this.#sound.setAttribute('aria-expanded', 'false');
    }

    #hold() {
        clearTimeout(this.#timer);
    }

    #later(ms = CLOSE_AFTER) {
        clearTimeout(this.#timer);
        this.#timer = setTimeout(() => this.close(), ms);
    }

    #set(v) {
        const volume = Math.round(Math.min(1, Math.max(0, v)) * 100) / 100;
        this.#music.setVolume(volume);
        this.#show(volume);
        this.#later();
    }

    #show(volume) {
        const pct = Math.round(volume * 100);
        this.#range.value = String(pct);
        this.#range.style.setProperty('--fill', `${pct}%`);
        this.#range.setAttribute('aria-valuetext', `${pct}%`);
        this.#pct.textContent = `${pct}%`;
    }
}
