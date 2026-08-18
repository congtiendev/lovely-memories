/* Nhac nen. Chi bat dau khi nguoi doc bam mo cua - trinh duyet chi cho phat
   tieng sau mot cu bam that, khong the tu chay luc trang vua tai.
   Ban nhac da duoc cat bo 33s dao dau va chuan hoa cho dinh sat tran (xem
   ghi chu trong assets/audios/), nen o day cu mo het co. The <audio> van de
   preload="none": chi tai khi den luc phat, khong lam nang luc mo trang. */
const FADE = 2600;        // vao nhe dan cho khop nhip cua dang mo
const LEVEL = 1;          // het co - ban nhac da duoc chuan hoa sat tran khi cat

export class Music {
    #audio;
    #button;
    #fade = null;
    #wanted = false;      // nguoi doc co muon nghe khong (nut bat/tat)

    constructor({ audio, button }) {
        this.#audio = audio;
        this.#button = button;
        this.#audio.loop = true;
        this.#audio.volume = 0;

        this.#button.addEventListener('click', () => this.toggle());
    }

    /** Bam mo cua: nhac vao dan. Goi lai nhieu lan cung khong lam gi them. */
    start() {
        if (this.#wanted) return;
        this.#wanted = true;
        this.#button.hidden = false;
        this.#play();
    }

    toggle() {
        this.#wanted = !this.#wanted;
        if (this.#wanted) {
            this.#play();
        } else {
            this.#audio.pause();
            clearInterval(this.#fade);
            this.#audio.volume = 0;
        }
        this.#sync();
    }

    #play() {
        this.#sync();
        // Trinh duyet co the tu choi (chua co cu bam nao duoc tinh la tuong tac,
        // hoac may dang o che do tiet kiem). Tu choi thi im lang, lan bam sau
        // nguoi doc van bat lai duoc bang nut loa.
        const p = this.#audio.play();
        if (p && p.catch) p.catch(() => {});
        this.#fadeTo(LEVEL);
    }

    /* Vao/ra bang dong ho chu khong bang transition: `volume` khong phai thuoc
       tinh CSS nen khong co transition nao chay duoc cho no. */
    #fadeTo(target) {
        clearInterval(this.#fade);
        const step = (target - this.#audio.volume) / (FADE / 50);
        this.#fade = setInterval(() => {
            const v = this.#audio.volume + step;
            if ((step > 0 && v >= target) || (step < 0 && v <= target)) {
                this.#audio.volume = target;
                clearInterval(this.#fade);
                return;
            }
            this.#audio.volume = Math.min(1, Math.max(0, v));
        }, 50);
    }

    #sync() {
        this.#button.classList.toggle('is-off', !this.#wanted);
        this.#button.setAttribute('aria-pressed', String(this.#wanted));
        this.#button.setAttribute('aria-label', this.#wanted ? 'Tắt nhạc nền' : 'Bật nhạc nền');
    }
}
