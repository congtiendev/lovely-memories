import { TIMING, calm } from '../config.js';

/* Chuyen canh FPV tu cong vao sanh. Ba trang thai deu la class tren <body>
   de CSS tu lo phan con lai: arming (thang lop GPU) -> flying -> arrived.
   `arrived` mot minh la ket qua cuoi; `flying` la doan dien de den do. */
export class Flight {
    #root;
    #hall;
    #hallImg;
    #decoding = null;
    #arriveTimer = null;
    #onArrive;
    #run = 0;   // moi lan doi trang thai la mot luot; luot cu het hieu luc

    constructor({ hall, root = document.body, onArrive = () => {} }) {
        this.#root = root;
        this.#hall = hall;
        this.#hallImg = hall.querySelector('img');
        this.#onArrive = onArrive;
    }

    get hall() {
        return this.#hall;
    }

    get hasArrived() {
        return this.#root.classList.contains('arrived');
    }

    /** Thang lop GPU truoc, va giai ma san anh sanh ngay tu luc cua bat dau mo.
        Neu de trinh duyet giai ma giua chung animation thi luong dung hinh
        mot nhip -> cam giac do cung. */
    arm() {
        this.#root.classList.add('arming');
        this.#preload();
    }

    disarm() {
        this.#root.classList.remove('arming');
    }

    /** Lao vao sanh. Khong cho requestAnimationFrame o day: neu nguoi dung
        chuyen tab, rAF ngung chay va hieu ung se ket lai vinh vien. */
    start() {
        const run = ++this.#run;
        return Promise.race([
            this.#preload(),
            new Promise(resolve => setTimeout(resolve, TIMING.decodeBudget)),
        ]).then(() => {
            if (run !== this.#run) return;   // giua luc cho anh thi da bi keo ve cong
            this.#root.classList.add('flying');
            this.#arriveTimer = setTimeout(
                () => {
                    // Xong duong bay thi go lop GPU, khong giu will-change vo han
                    this.#root.classList.remove('arming');
                    this.#root.classList.add('arrived');
                    this.#onArrive();
                },
                calm.matches ? TIMING.calmArrive : TIMING.arriveDelay + TIMING.arrive);
        });
    }

    /** Dat thang vao sanh, khong dien lai chuyen canh - dung khi mo bang URL. */
    settle() {
        this.#run++;
        clearTimeout(this.#arriveTimer);
        this.#root.classList.remove('flying', 'arming');
        this.#root.classList.add('arrived');
        this.#preload();
    }

    /** Quay lai cong. */
    reset() {
        this.#run++;
        clearTimeout(this.#arriveTimer);
        this.#root.classList.remove('flying', 'arrived', 'arming');
    }

    #preload() {
        return (this.#decoding ||= this.#hallImg.decode
            ? this.#hallImg.decode().catch(() => {})
            : Promise.resolve());
    }
}
