import { TIMING } from '../config.js';

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

/* Man chuyen chuong. Vua ngan hai chuong bang mot tam bien, vua lam man cho:
   viec chuan bi canh moi duoc lam TRONG luc man nay dang phu kin. */
export class Interlude {
    #element;
    #text;

    constructor(element) {
        this.#element = element;
        this.#text = element.querySelector('.interlude__text');
    }

    /**
     * Phu kin man hinh, chay `prepare`, roi mo ra.
     * @param {string} label chu tren tam bien
     * @param {() => Promise<void> | void} prepare doi canh phia sau trong luc bi che
     *
     * Man nay o lai it nhat TIMING.interlude ke ca khi prepare xong ngay: cho
     * nguoi doc kip doc chu. Nguoc lai neu prepare lau hon thi cho no, nhung
     * toi da TIMING.interludeMax - anh loi thi van phai di tiep.
     */
    async cover(label, prepare) {
        this.#text.textContent = label;
        this.#element.classList.add('is-on');
        await wait(TIMING.interludeFade);   // cho phu kin han roi moi doi canh

        await Promise.all([
            Promise.race([
                Promise.resolve(prepare()).catch(() => {}),
                wait(TIMING.interludeMax),
            ]),
            wait(TIMING.interlude),
        ]);

        this.#element.classList.remove('is-on');
        return wait(TIMING.interludeFade);
    }

    /** Bo qua man cho - dung khi doi canh ma khong dien (mo bang URL). */
    clear() {
        this.#element.classList.remove('is-on');
    }
}
