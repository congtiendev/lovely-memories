/* Goi y di chuyen nhan vat, hien MOT LAN luc vao phong dau tien (nho bang localStorage).
   Khac voi tour huong dan (tour.js, chi cac nut, co lop ha toi) o cho: day la mot the nho khong chan gi,
   hien duoi chan nhan vat, ve ban phim W A S D / mui ten roi tu tat khi nguoi xem bam mot phim di chuyen
   (da biet cach roi), hoac sau vai giay.

   Rieng tung cua rieng no (khong gop vao tour) de ai da xem tour cu van duoc chi cach di chuyen. */
const KEY = 'lovely-memories:move-hint';
const SHOW_MS = 10000;     // hien toi da bao lau neu nguoi xem chua bam phim nao
const WAIT_MS = 500;       // moi lan hoi "da duoc phep hien chua"
const WAIT_MAX = 60;       // ... toi da 30s (huong dan / thu / thuyet minh dang che thi doi)
const MOVE_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyA', 'KeyS', 'KeyD']);
const touchOnly = matchMedia('(hover: none) and (pointer: coarse)');

export class MoveHint {
    #element;
    #ready;
    #applies;
    #offered = false;
    #timer = 0;

    /**
     * @param ready () => boolean - co duoc phep hien luc nay khong (khong co lop phu nao dang mo)
     * @param applies () => boolean - nguoi xem nay co cach nao di chuyen nhan vat khong: may co ban phim
     *        thi luon co; may cam ung chi co o che do cuon ngang (vuot)
     */
    constructor({ element, ready = () => true, applies = () => true }) {
        this.#element = element;
        this.#ready = ready;
        this.#applies = applies;
        // Da bam phim di chuyen (ke ca truoc khi hien) thi khoi chi nua
        addEventListener('keydown', event => {
            if (MOVE_KEYS.has(event.code) && !event.ctrlKey && !event.metaKey && !event.altKey) this.#done();
        });
    }

    get seen() {
        try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
    }

    get isOpen() { return this.#element.classList.contains('is-open'); }

    /** Goi moi lan vao phong; chi that su hien mot lan. */
    offer() {
        if (this.seen || this.#offered || this.isOpen) return;
        if (!this.#applies()) return;   // may cam ung o trinh chieu: chua co cach di chuyen, de lan sau
        this.#offered = true;
        let tries = 0;
        const poll = () => {
            if (this.seen) return;
            if (this.#ready()) return this.#show();
            if (++tries > WAIT_MAX) { this.#offered = false; return; }
            this.#timer = setTimeout(poll, WAIT_MS);
        };
        // Khong goi ngay: offer() co the chay luc nap trang, truoc khi cac thanh phan cua main.js khai bao xong
        this.#timer = setTimeout(poll, WAIT_MS);
    }

    #show() {
        this.#element.hidden = false;
        // Hai dong chu: ban phim / cam ung, CSS chon theo thiet bi
        this.#element.classList.toggle('is-touch', touchOnly.matches);
        void this.#element.offsetWidth;
        this.#element.classList.add('is-open');
        try { localStorage.setItem(KEY, '1'); } catch { /* trinh duyet chan: thoi, lan sau hien lai */ }
        this.#timer = setTimeout(() => this.#hide(), SHOW_MS);
    }

    #done() {
        try { localStorage.setItem(KEY, '1'); } catch { /* khong sao */ }
        this.#hide();
    }

    #hide() {
        clearTimeout(this.#timer);
        if (!this.isOpen) return;
        this.#element.classList.remove('is-open');
        setTimeout(() => { if (!this.isOpen) this.#element.hidden = true; }, 400);
    }
}
