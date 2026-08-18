import { dateLabel } from '../format.js';

/* Dong thoi gian: nut o goc trai mo ra bang treo, moi bien mot ky niem.
   Ten tren bien lay tu ten thu muc chua anh ('17-03-2026' -> '17 · 03 · 2026'),
   nen them ky niem chi la them mot dong trong CHAPTERS. */
export class Timeline {
    #element;
    #tab;
    #rows;
    #onPick;

    constructor({ element, chapters, onPick = () => {} }) {
        this.#element = element;
        this.#tab = element.querySelector('.timeline__tab');
        this.#rows = element.querySelector('.timeline__rows');
        this.#onPick = onPick;

        this.#build(chapters);
        this.#watchScroll();

        this.#tab.addEventListener('click', event => {
            event.stopPropagation();
            this.toggle();
        });
        // Bam ra ngoai bang thi dong lai. Bat ngay tren lop chua (no phu kin
        // man hinh khi dang mo) de cu bam khong roi xuong canh phong phia sau.
        this.#element.addEventListener('click', event => {
            if (event.target === this.#element) this.close();
        });
        // Luoi an toan cho cu bam khong di qua lop chua
        addEventListener('click', event => {
            if (this.isOpen && !this.#element.contains(event.target)) this.close();
        });
        addEventListener('keydown', event => {
            if (event.key === 'Escape') this.close();
        });
    }

    get isOpen() {
        return this.#element.classList.contains('is-open');
    }

    toggle() {
        this.#element.classList.toggle('is-open');
        this.#tab.setAttribute('aria-expanded', String(this.isOpen));
        this.#updateMore();
    }

    /* Danh sach dai hon long bang thi phai cho biet la con cuon duoc: dai mo o
       hai dau khong du ro. Chi dau tat khi da cuon het. */
    #watchScroll() {
        this.#rows.addEventListener('scroll', () => this.#updateMore(), { passive: true });
        addEventListener('resize', () => this.#updateMore());
        this.#updateMore();
    }

    #updateMore() {
        const el = this.#rows;
        const more = el.scrollHeight - el.clientHeight - el.scrollTop > 4;
        this.#element.classList.toggle('has-more', more);
    }

    close() {
        this.#element.classList.remove('is-open');
        this.#tab.setAttribute('aria-expanded', 'false');
    }

    /** An o man cong: doan mo dau khong nen lo truoc co bao nhieu chuong. */
    setShown(shown) {
        this.#element.classList.toggle('is-shown', shown);
        if (!shown) this.close();
    }

    /** Danh dau chuong dang xem. */
    mark(route) {
        for (const row of this.#rows.querySelectorAll('.timeline__row')) {
            const current = row.dataset.route === route;
            row.classList.toggle('is-current', current);
            row.setAttribute('aria-current', current ? 'true' : 'false');
        }
    }

    #build(chapters) {
        this.#rows.replaceChildren(...chapters.map((folder, i) => {
            const route = folder;   // ten thu muc lam luon ten man hinh
            const label = dateLabel(folder);
            const num = i + 1;
            const item = document.createElement('li');
            item.innerHTML = `
                <button class="timeline__row" type="button" data-route="${route}">
                    <img src="assets/images/timeline-row-480w.webp"
                         srcset="assets/images/timeline-row-480w.webp 480w,
                                 assets/images/timeline-row-960w.webp 960w"
                         sizes="30vmin" width="1432" height="338"
                         decoding="async" alt="">
                    <span class="timeline__num" aria-hidden="true">${num}</span>
                    <span class="timeline__label">${label}</span>
                </button>`;
            item.querySelector('button').addEventListener('click', event => {
                event.stopPropagation();
                this.close();
                this.#onPick(route);
            });
            return item;
        }));
    }
}
