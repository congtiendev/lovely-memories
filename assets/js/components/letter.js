import { TIMING, calm } from '../config.js';
import { Typewriter } from './typewriter.js';

/* Khung tranh roi xuong giua sanh roi go loi nhan len mat giay. */
export class Letter {
    #element;
    #art;
    #start;
    #writer;
    #sample;
    #warming = null;
    #timers = [];
    #run = 0;   // moi lan doi trang thai la mot luot; luot cu het hieu luc

    constructor({ element, paragraphs }) {
        this.#element = element;
        this.#art = element.querySelector('.letter__art');
        this.#start = element.querySelector('.letter__start');
        this.#sample = paragraphs.join('');
        this.#writer = new Typewriter(element.querySelector('.letter__page'), paragraphs, {
            onDone: () => this.#element.classList.add('is-read'),
        });
    }

    /** Dien tron mach: cho 1s, roi khung xuong, cham day thi go chu. */
    play() {
        if (calm.matches) {
            this.reveal();
            return;
        }
        const run = ++this.#run;
        this.#after(TIMING.letterDelay, () => this.#ready().then(() => {
            if (run === this.#run) this.#drop();   // chua bi bo qua / chua ve cong
        }));
    }

    /** Vao thang: khung nam san o cho, chu hien du - dung khi mo bang URL
        hoac khi nguoi doc bam de bo qua doan go chu. */
    reveal() {
        this.#run++;
        this.#clearTimers();
        this.#element.classList.remove('is-dropping');
        this.#element.classList.add('is-down');
        this.#writer.finish();
    }

    /** Con chu chua go het thi con cai de bo qua. */
    get isUnread() {
        return !this.#element.classList.contains('is-read');
    }

    /** Nut "Bat dau" khac trong o bau duc duoi day khung. */
    onStart(handler) {
        this.#start.addEventListener('click', handler);
    }

    /** Nhac khung len khoi man hinh, tra lai ca gian sanh. */
    dismiss() {
        if (calm.matches) {
            this.hide();
            return;
        }
        const run = ++this.#run;
        this.#element.classList.add('is-leaving');
        this.#after(TIMING.lift, () => {
            if (run === this.#run) this.#element.classList.add('is-gone');
        });
    }

    /** Khung khong con o day nua - dung khi mo bang URL sau khi da bam Bat dau. */
    hide() {
        this.reveal();   // chu van phai o trang thai da doc xong
        this.#element.classList.add('is-gone');
    }

    reset() {
        this.#run++;
        this.#clearTimers();
        this.#element.classList.remove('is-dropping', 'is-down', 'is-read',
                                       'is-leaving', 'is-gone');
        this.#writer.reset();
    }

    #drop() {
        this.#element.classList.add('is-dropping');
        this.#after(TIMING.typeStart, () => this.#writer.play());
        // Het roi thi bo animation va lop GPU di, giu trang thai cuoi bang
        // transform tinh. Dung dong ho chu khong dung `animationend`: su kien
        // do khong bao gio den neu animation bi doi/cat giua duong.
        this.#after(TIMING.drop, () => {
            this.#element.classList.remove('is-dropping');
            this.#element.classList.add('is-down');
        });
    }

    /**
     * Chuan bi san anh khung va font truoc khi den luot dien. Goi cang som
     * cang tot (ngay luc cua bat dau mo): font ve muon thi chu dang khac se
     * bi doi mat giua dong, con anh chua giai ma thi nhip roi bi khuc.
     */
    warmup() {
        this.#warming ||= Promise.all([
            this.#art.decode ? this.#art.decode().catch(() => {}) : Promise.resolve(),
            document.fonts
                ? document.fonts.load('500 1em "EB Garamond"', this.#sample).catch(() => {})
                : Promise.resolve(),
        ]);
        return this.#warming;
    }

    /** Cho khau chuan bi, nhung toi da decodeBudget - cham thi van phai dien. */
    #ready() {
        return Promise.race([
            this.warmup(),
            new Promise(resolve => setTimeout(resolve, TIMING.decodeBudget)),
        ]);
    }

    #after(delay, fn) {
        this.#timers.push(setTimeout(fn, delay));
    }

    #clearTimers() {
        this.#timers.forEach(clearTimeout);
        this.#timers = [];
    }
}
