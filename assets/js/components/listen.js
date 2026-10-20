/* Man "Cham de nghe". Trinh duyet chan moi tieng dong cho toi khi nguoi xem cham / bam vao
   trang, va F5 xoa luon dau vet cu bam cua lan truoc - nen mo lai mot phong bang F5 hay bang
   link thi nhac nen lan loi thuyet minh deu cam lang, nhan vat chi go chu. Thay vi de nguoi
   xem tu doan la phai bam, phu mot lop mo nhe len canh va moi ho cham: cu cham do (hoac mot
   phim bat ky) la cu bam that, du de nhac va giong cung vao ngay.

   Chi hien khi that su can (main.js hoi autoplayAllowed() truoc): may da cho tu phat tieng,
   hoac nguoi xem da bam vao trang roi, thi khong bao gio thay lop nay. */
const SILENCE = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';

/** Trang co duoc tu phat tieng ngay luc nay khong (chua can cu bam nao). */
export async function autoplayAllowed() {
    const policy = navigator.getAutoplayPolicy?.('mediaelement');   // Firefox: hoi thang duoc
    if (policy) return policy === 'allowed';
    // Con lai: thu phat mot doan rong, KHONG tat tieng - bi chan thi play() tu choi ngay
    try {
        const probe = new Audio(SILENCE);
        await probe.play();
        probe.pause();
        return true;
    } catch {
        return false;
    }
}

export class Listen {
    #el;
    #onTap = () => {};

    /** @param text dong chinh, @param hint dong phu nho ben duoi (content.js LISTEN) */
    constructor({ text, hint }) {
        this.#el = document.createElement('div');
        this.#el.className = 'listen';
        this.#el.setAttribute('role', 'button');
        this.#el.tabIndex = -1;
        this.#el.setAttribute('aria-label', text);
        this.#el.innerHTML = `
            <span class="listen__badge" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                    <path d="M4 9.5h3.2L12 5.4v13.2L7.2 14.5H4z"/>
                    <path class="listen__wave" d="M15.2 9a4.2 4.2 0 0 1 0 6"/>
                    <path class="listen__wave listen__wave--far" d="M17.8 6.6a7.6 7.6 0 0 1 0 10.8"/>
                </svg>
            </span>
            <span class="listen__text"></span>
            <span class="listen__hint"></span>`;
        this.#el.querySelector('.listen__text').textContent = text;
        this.#el.querySelector('.listen__hint').textContent = hint;

        this.#el.addEventListener('click', event => {
            event.stopPropagation();   // khong de cu cham nay lat phong / ve cong
            this.#tap();
        });
        // Nguoi dung ban phim: phim nao cung la cu bam that
        addEventListener('keydown', () => this.#tap());
        document.body.append(this.#el);
    }

    get isOpen() {
        return this.#el.classList.contains('is-open');
    }

    /** Viec can lam NGAY trong cu cham (bat nhac, doc thuyet minh) - phai goi dong bo o day
        thi trinh duyet moi tinh la do nguoi xem bam. */
    onTap(handler) {
        this.#onTap = handler;
    }

    show() {
        this.#el.classList.add('is-open');
        this.#el.focus({ preventScroll: true });
    }

    hide() {
        this.#el.classList.remove('is-open');
    }

    #tap() {
        if (!this.isOpen) return;
        this.hide();
        this.#onTap();
    }
}
