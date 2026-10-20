import { TIMING } from '../config.js';

/** Anh da tai xong (hoac hong - hong thi thoi cho, khong ket). `complete` dung ca khi anh
    da hong tu truoc: luc do su kien `error` da qua roi, cho no la cho mai. */
export const loaded = img => img.complete
    ? Promise.resolve()
    : new Promise(resolve => {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
    });

/* Mot canh phong ky niem. Trang thai nam tren chinh the .room (khong phai
   <body>) de nhieu phong cung ton tai trong trang ma khong de len nhau.
   Phong co the khong co tranh, khong co nut di tiep - moi thu deu la tuy chon. */
export class Room {
    #element;
    #img;
    #viewer;
    #viewerImg;
    #next;
    #prev;
    #invite;
    #decoding = null;
    #hydrated = false;

    constructor({ element }) {
        this.#element = element;
        this.#img = element.querySelector('.room__bg');
        this.#viewer = element.querySelector('.room__viewer');
        this.#viewerImg = this.#viewer?.querySelector('img');
        this.#next = element.querySelector('.room__next');
        this.#prev = element.querySelector('.room__prev');
        this.#invite = element.querySelector('.room__invite');

        // To thu moi cung la .room__art (de nhan cho treo) nhung khong mo lop xem tranh
        for (const art of element.querySelectorAll('.room__art:not(.room__invite)')) {
            art.addEventListener('click', event => {
                event.stopPropagation();   // dung de noi len .room thanh lenh lui ra
                this.#view(art);
            });
        }
        this.#viewer?.addEventListener('click', event => {
            event.stopPropagation();
            this.closeArt();
        });
        for (const button of [this.#next, this.#prev, this.#invite]) {
            button?.addEventListener('click', event => {
                event.stopPropagation();
            });
        }
        addEventListener('keydown', event => {
            if (event.key === 'Escape') this.closeArt();
        });
    }

    /** Giai ma san. Goi som (ngay khi vao sanh): anh phong nang, ma no chi
        duoc dung den sau khi doc xong loi nhan. */
    warmup() {
        this.#hydrate();
        return (this.#decoding ||= this.#img.decode
            ? this.#img.decode().catch(() => {})
            : Promise.resolve());
    }

    /* Gan dia chi that cho moi anh cua phong (gallery.js de san o data-src / data-srcset de
       vao trang khong phai tai anh cua ca 45 phong). Goi lai nhieu lan khong sao. */
    #hydrate() {
        if (this.#hydrated) return;
        this.#hydrated = true;
        for (const el of this.#element.querySelectorAll('[data-srcset]')) {
            el.srcset = el.dataset.srcset;
            delete el.dataset.srcset;
        }
        for (const el of this.#element.querySelectorAll('img[data-src]')) {
            el.src = el.dataset.src;
            delete el.dataset.src;
        }
    }

    /** Anh nen va moi buc tranh cua phong da tai xong (khong tinh anh `lazy` chi dung o dai
        ngang). Doi cai nay truoc khi thuyet minh: noi ve buc tranh chua hien thi vo duyen. */
    ready() {
        this.#hydrate();
        const imgs = [...this.#element.querySelectorAll('.room__scene img')]
            .filter(img => img.loading !== 'lazy');
        return Promise.all([this.warmup(), ...imgs.map(loaded)]);
    }

    /** Mo man vao phong, cho anh giai ma nhung toi da decodeBudget. */
    enter() {
        return Promise.race([
            this.warmup(),
            new Promise(resolve => setTimeout(resolve, TIMING.decodeBudget)),
        ]).then(() => this.#element.classList.add('is-open'));
    }

    /** Dat thang trong phong, khong mo man - dung khi mo bang URL hoac khi
        dang bi man chuyen chuong che. */
    settle() {
        this.#element.classList.add('is-open');
        this.warmup();
    }

    leave() {
        this.closeArt();
        this.#element.classList.remove('is-open');
    }

    get isViewingArt() {
        return this.#element.classList.contains('art-open');
    }

    closeArt() {
        this.#element.classList.remove('art-open');
    }

    onClick(handler) {
        this.#element.addEventListener('click', handler);
    }

    /** Nut di tiep sang chuong sau (phong cuoi thi khong co nut nay). */
    onNext(handler) {
        this.#next?.addEventListener('click', handler);
    }

    /** Nut quay lai chuong truoc (phong dau thi khong co nut nay). */
    onPrev(handler) {
        this.#prev?.addEventListener('click', handler);
    }

    /** Bam vao to thu moi treo tren tuong (phong co thu moi). */
    onInvite(handler) {
        this.#invite?.addEventListener('click', handler);
    }

    /** Thu da roi xuong va doc mot lan: treo to thu len tuong de bam vao xem lai. */
    markInvited() {
        this.#element.classList.add('is-invited');
    }

    /** Ban lon chi tai o day, khong tai san cho buc tren tuong. Cho giai ma
        xong (toi da decodeBudget) roi moi mo, khong thi lop xem hien ra trong. */
    #view(art) {
        if (!this.#viewerImg) return;   // phong khong co lop xem thi bo qua
        const full = art.dataset.full;
        const label = art.getAttribute('aria-label') || '';
        if (this.#viewerImg.getAttribute('src') !== full) {
            this.#viewerImg.src = full;
            this.#viewerImg.srcset = '';
            this.#viewerImg.alt = label;
        }
        Promise.race([
            this.#viewerImg.decode ? this.#viewerImg.decode().catch(() => {}) : Promise.resolve(),
            new Promise(resolve => setTimeout(resolve, TIMING.decodeBudget)),
        ]).then(() => this.#element.classList.add('art-open'));
    }
}
