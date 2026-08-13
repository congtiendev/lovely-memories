import { TIMING } from '../config.js';

/* Mot canh phong ky niem. Trang thai nam tren chinh the .room (khong phai
   <body>) de nhieu phong cung ton tai trong trang ma khong de len nhau.
   Phong co the khong co tranh, khong co nut di tiep - moi thu deu la tuy chon. */
export class Room {
    #element;
    #img;
    #viewer;
    #viewerImg;
    #next;
    #decoding = null;

    constructor({ element }) {
        this.#element = element;
        this.#img = element.querySelector('.room__bg');
        this.#viewer = element.querySelector('.room__viewer');
        this.#viewerImg = this.#viewer?.querySelector('img');
        this.#next = element.querySelector('.room__next');

        for (const art of element.querySelectorAll('.room__art')) {
            art.addEventListener('click', event => {
                event.stopPropagation();   // dung de noi len .room thanh lenh lui ra
                this.#view(art);
            });
        }
        this.#viewer?.addEventListener('click', event => {
            event.stopPropagation();
            this.closeArt();
        });
        this.#next?.addEventListener('click', event => {
            event.stopPropagation();
        });
        addEventListener('keydown', event => {
            if (event.key === 'Escape') this.closeArt();
        });
    }

    /** Giai ma san. Goi som (ngay khi vao sanh): anh phong nang, ma no chi
        duoc dung den sau khi doc xong loi nhan. */
    warmup() {
        return (this.#decoding ||= this.#img.decode
            ? this.#img.decode().catch(() => {})
            : Promise.resolve());
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
