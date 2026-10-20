import { SPEECH, calm } from '../config.js';

/* Bong bong thoai cua nhan vat. Ve bang CSS (khong dung anh) vi cau noi dai ngan
   khac nhau: anh bong bong co kich thuoc co dinh, keo gian la meo duoi va goc.
   Kieu dang theo bo bubble cua asset: nen trang, vien xanh den, bong do lech
   xuong duoi, duoi nhon o goc.

   Bong bong CO GIAN THEO NOI DUNG: luc dau chi la ba cham nho, go toi dau rong ra toi
   do, qua be rong toi da thi cao len tung dong. Chieu cao duoc dat bang JS roi chuyen
   dong mem bang CSS transition (khong the animate height: auto), nen khi them mot dong
   bong bong lon len em chu khong giat. Rieng tu dang go do thi van giu cho (an) cho het
   tu do: neu khong thi chu dang go se nhay xuong dong giua tu. */
const TAIL = `
    <svg class="bubble__tail" viewBox="0 0 40 30" aria-hidden="true" focusable="false">
        <path class="bubble__tail-fill" d="M3 -4V0C12 1 17 9 20 29 23 9 28 1 37 0V-4Z"/>
        <path class="bubble__tail-line" d="M3 0C12 1 17 9 20 29 23 9 28 1 37 0"/>
    </svg>`;

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

export class Bubble {
    #el;
    #on;
    #off;
    #ok;
    #box;
    #inner;
    #run = 0;           // moi cau noi la mot luot; luot cu het hieu luc
    #open = false;
    #cancelAction = null;   // huy lan cho bam nut (dang cho ma bong bong bi thu lai)

    constructor(parent) {
        this.#el = document.createElement('div');
        this.#el.className = 'bubble';
        this.#el.dataset.side = 'left';
        this.#el.setAttribute('role', 'status');   // may doc man hinh doc cau nay
        this.#el.hidden = true;
        this.#el.innerHTML = `
            <div class="bubble__float">
                <div class="bubble__box">
                    <div class="bubble__inner">
                        <span class="bubble__dots" aria-hidden="true"><i></i><i></i><i></i></span>
                        <p class="bubble__text"><span class="bubble__on"></span><span class="bubble__off"></span></p>
                        <div class="bubble__actions"><button class="bubble__ok" type="button" tabindex="-1"></button></div>
                    </div>
                </div>
                ${TAIL}
            </div>`;
        this.#box = this.#el.querySelector('.bubble__box');
        this.#inner = this.#el.querySelector('.bubble__inner');
        this.#on = this.#el.querySelector('.bubble__on');
        this.#off = this.#el.querySelector('.bubble__off');
        this.#ok = this.#el.querySelector('.bubble__ok');
        parent.append(this.#el);
        // Be rong toi da doi theo man hinh thi so dong doi theo: do lai chieu cao
        addEventListener('resize', () => { if (this.#open) this.#fit(false); });
    }

    get isOpen() { return this.#open; }
    get width() { return this.#el.offsetWidth; }

    /**
     * Duoi nam ben nao, dich ngang bong bong bao nhieu px de khong tran man hinh, va
     * duoi cach mep trai bong bong bao nhieu px: bong bong dich thi duoi bu nguoc lai
     * de van chi dung vao dau nhan vat.
     */
    place(side, shift, tailX) {
        this.#el.dataset.side = side;
        this.#el.style.setProperty('--shift', `${shift.toFixed(1)}px`);
        this.#el.style.setProperty('--tail-x', `${tailX.toFixed(1)}px`);
    }

    /**
     * Hien bong bong: cham ba dau "dang go", roi go tung chu.
     * @param onTyped goi khi chu da go xong (nhan vat thoi mo mieng, bong bong con ton tai de doc)
     * @param typingMs go het chu trong dung khoang nay (de khop voi loi doc); bo qua thi go theo SPEECH.char
     * @param hold ms giu bong bong sau khi go xong; bo qua thi tinh theo do dai cau
     * @param action nhan nut (vd 'OK'): go xong thi hien nut va CHO nguoi xem bam, bong bong
     *        khong tu thu lai. Co nut thi Promise tra ve true khi duoc bam.
     * @returns Promise<boolean> true neu noi het (hoac nut duoc bam), false neu bi huy giua chung
     */
    async say(text, { onTyped = () => {}, action = null, typingMs = 0, hold = null } = {}) {
        this.#cancelAction?.();
        const run = ++this.#run;
        const alive = () => run === this.#run;

        this.#ok.textContent = action ?? '';
        this.#el.classList.toggle('has-action', !!action);
        this.#el.classList.remove('is-ready');

        this.#on.textContent = '';
        this.#off.textContent = '';
        this.#el.classList.remove('is-typing', 'is-leaving');
        this.#el.classList.add('is-thinking');
        this.#el.hidden = false;
        this.#open = true;
        this.#fit(false);   // ba cham nho: dat kich thuoc ngay, khong chay tu cao cu
        // Doc lai layout de animation hien ra chay tu dau thay vi gop vao lan truoc
        void this.#el.offsetWidth;
        this.#el.classList.add('is-shown');

        if (calm.matches) {
            this.#on.textContent = text;
            this.#el.classList.remove('is-thinking');
            this.#fit(false);
        } else {
            await wait(SPEECH.thinking);
            if (!alive()) return false;
            this.#el.classList.remove('is-thinking');
            this.#el.classList.add('is-typing');
            const plan = typingMs > 0 ? this.#plan(text, typingMs) : null;
            // Hen gio theo MOC TUYET DOI tinh tu luc bat dau go, khong cong don tung do tre
            // nho: cau dai hang tram chu thi sai so moi lan hen (vai ms) cong lai thanh
            // gan mot giay, chu se tre dan so voi tieng doc.
            const t0 = performance.now();
            let due = 0;
            for (let i = 1; i <= text.length; i++) {
                this.#on.textContent = text.slice(0, i);
                this.#off.textContent = this.#restOfWord(text, i);
                this.#fit(true);
                due += plan ? plan[i - 1] : this.#delay(text[i - 1]);
                await wait(Math.max(0, t0 + due - performance.now()));
                if (!alive()) return false;
            }
        }
        this.#el.classList.remove('is-typing');
        onTyped();
        if (action) return this.#waitForAction(run);
        await wait(hold ?? SPEECH.holdBase + SPEECH.holdPerChar * text.length);
        if (!alive()) return false;
        await this.hide();
        return true;
    }

    /** Hien nut roi cho bam (chuot / cham) hoac phim Enter / Space. */
    #waitForAction(run) {
        this.#el.classList.add('is-ready');
        this.#fit(true);   // nut hien ra thi bong bong cao them mot hang
        this.#ok.tabIndex = 0;
        this.#ok.focus({ preventScroll: true });
        return new Promise(resolve => {
            const finish = clicked => {
                this.#ok.removeEventListener('click', onClick);
                removeEventListener('keydown', onKey);
                this.#ok.tabIndex = -1;
                this.#cancelAction = null;
                resolve(clicked);
            };
            const onClick = () => finish(true);
            const onKey = event => {
                if (event.repeat || (event.key !== 'Enter' && event.key !== ' ')) return;
                event.preventDefault();   // khong de phim lam nut bam them mot lan nua
                finish(true);
            };
            this.#ok.addEventListener('click', onClick);
            addEventListener('keydown', onKey);
            this.#cancelAction = () => finish(false);
        }).then(clicked => {
            if (clicked && run === this.#run) this.hide();   // bam xong thi thu lai, khong cho ai
            return clicked;
        });
    }

    /** Thu bong bong lai. Dung gap thi bo luon cau dang noi. */
    async hide() {
        this.#cancelAction?.();
        const run = ++this.#run;
        if (!this.#open) return;
        this.#el.classList.add('is-leaving');
        this.#el.classList.remove('is-shown', 'is-thinking', 'is-typing', 'is-ready');
        await wait(calm.matches ? 1 : SPEECH.leave);
        if (run !== this.#run) return;   // trong luc thu lai co cau khac xen vao
        this.#el.hidden = true;
        this.#el.classList.remove('is-leaving');
        this.#open = false;
    }

    /** Phan con lai cua TU DANG GO (toi khoang trang ke tiep), de giu cho. */
    #restOfWord(text, i) {
        const next = text.slice(i).search(/\s/);
        return next === -1 ? text.slice(i) : text.slice(i, i + next);
    }

    /**
     * Dat chieu cao hop theo noi dung hien co (hoac bang 0 neu dang an). animate = false
     * thi dat thang, khong chay chuyen dong (lan dau hien, doi be rong man hinh).
     */
    #fit(animate) {
        const box = this.#box;
        if (!animate) {
            box.style.transition = 'none';
            box.style.height = '';
        }
        const h = this.#inner.offsetHeight;
        box.style.height = `${h}px`;
        if (!animate) {
            void box.offsetHeight;   // chot gia tri truoc khi bat lai transition
            box.style.transition = '';
        }
    }

    /* Chia dung `total` ms cho tung ky tu, giu nhip nghi o dau cau (dau phay nghi lau hon
       chu thuong, dau cham lau hon nua) nhung co gian de tong khong doi. */
    #plan(text, total) {
        const weight = char => (',;:'.includes(char) ? 5 : '.!?…'.includes(char) ? 9 : 1);
        const weights = [...text].map(weight);
        const unit = total / weights.reduce((a, b) => a + b, 0);
        return weights.map(w => w * unit);
    }

    #delay(char) {
        if (',;:'.includes(char)) return SPEECH.comma;
        if ('.!?…'.includes(char)) return SPEECH.period;
        return SPEECH.char * (1 + (Math.random() - 0.5) * 0.4);
    }
}
