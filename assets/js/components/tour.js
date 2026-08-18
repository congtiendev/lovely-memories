/* ---------- TOUR HUONG DAN ----------
   Chay mot lan, ngay lan dau buoc vao mot phong ky niem: soi sang tung nut mot
   va noi nut do lam gi. Gian phong nay khong co menu, khong co chu huong dan
   nao san tren man hinh - khong chi thi nguoi xem se khong biet la bam vao
   tranh duoc, hay dai ngang nam o dau.

   Moi buoc tro toi mot the CO SAN tren trang bang CSS selector (xem TOUR trong
   js/content.js). Buoc nao khong tim thay dich, hoac dich dang bi an (nut loa
   khi chua bat nhac, nut "Tiep" trong che do cuon ngang) thi tu bi bo qua -
   nho vay tour khong bao gio soi vao mot cho trong. */
const KEY = 'lovely-memories:tour';
const PAD = 10;      // vien sang no ra quanh dich
const GAP = 14;      // khoang tu vien sang toi tam the chu

/* KHONG xet opacity o day: luc tour bat dau, tranh va nut "Tiep" van dang hien
   dan (transition-delay trong room.css), opacity con la 0 - lay do lam can cu
   thi hai buoc quan trong nhat cua tour bi bo qua. Chi can the that su co mat
   va co cho tren man hinh la du. */
const shown = el => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none';
};

export class Tour {
    #element;
    #spot;
    #card;
    #title;
    #text;
    #count;
    #next;
    #steps;
    #list = [];
    #i = 0;
    #watched = null;
    #hop = null;

    constructor({ element, steps }) {
        this.#element = element;
        this.#spot = element.querySelector('.tour__spot');
        this.#card = element.querySelector('.tour__card');
        this.#title = element.querySelector('.tour__title');
        this.#text = element.querySelector('.tour__text');
        this.#count = element.querySelector('.tour__count');
        this.#next = element.querySelector('.tour__next');
        this.#steps = steps;

        this.#next.addEventListener('click', event => {
            event.stopPropagation();
            this.#forward();
        });
        element.querySelector('.tour__skip').addEventListener('click', event => {
            event.stopPropagation();
            this.stop();
        });
        addEventListener('keydown', event => {
            if (!this.isOpen) return;
            if (event.key === 'Escape') this.stop();
            if (event.key === 'Enter' || event.key === ' ') this.#forward();
        });
        addEventListener('resize', () => { if (this.isOpen) this.#place(); });
        /* Doi sang ky niem khac la tour het viec: lop ha toi cua no phu len ca
           tam bien chuyen chuong lan canh phong moi, de nguyen thi nguoi xem
           bam "TIEP" ma tuong nhu khong co gi xay ra. Moi lan doi man hinh deu
           doi dia chi (ke ca cac buoc doi im lang), nen bat o day la du. */
        addEventListener('hashchange', () => { if (this.isOpen) this.stop(); });
    }

    get isOpen() { return !this.#element.hidden; }

    get seen() {
        try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
    }

    /** Lan dau vao phong thi chay; da xem roi thi thoi. */
    offer() {
        if (this.seen || this.isOpen) return;
        this.start();
    }

    /** Chay lai tu dau, ke ca khi da xem roi (nut "Xem lai huong dan"). */
    start() {
        this.#list = this.#steps.filter(s => shown(document.querySelector(s.at)));
        if (!this.#list.length) return;
        this.#i = 0;
        this.#element.hidden = false;
        this.#place();
    }

    stop() {
        this.#unwatch();
        this.#element.hidden = true;
        try { localStorage.setItem(KEY, '1'); } catch { /* trinh duyet chan: thoi */ }
    }

    /* Theo doi dung mot dich cua buoc dang chay. Go tay theo doi cu truoc khi
       dat cai moi: khong thi bam mot nut o buoc truoc van con lam tour nhay. */
    #watch(target) {
        this.#unwatch();
        this.#watched = target;
        this.#hop = () => setTimeout(() => this.#forward(), 260);
        target.addEventListener('click', this.#hop);
    }

    #unwatch() {
        this.#watched?.removeEventListener('click', this.#hop);
        this.#watched = null;
    }

    #forward() {
        if (this.#i + 1 >= this.#list.length) {
            this.stop();
            return;
        }
        this.#i++;
        this.#place();
    }

    #place() {
        const step = this.#list[this.#i];
        const target = document.querySelector(step.at);
        if (!shown(target)) {   // dich vua bien mat giua chung
            this.#forward();
            return;
        }

        this.#title.textContent = step.title;
        this.#text.textContent = step.text;
        this.#count.textContent = `${this.#i + 1}/${this.#list.length}`;
        this.#next.textContent = this.#i + 1 === this.#list.length ? 'Xong' : 'Tiếp';

        const r = target.getBoundingClientRect();
        const round = parseFloat(getComputedStyle(target).borderTopLeftRadius) || 0;
        Object.assign(this.#spot.style, {
            left: `${r.left - PAD}px`,
            top: `${r.top - PAD}px`,
            width: `${r.width + PAD * 2}px`,
            height: `${r.height + PAD * 2}px`,
            borderRadius: `${Math.max(12, round + PAD)}px`,
        });

        // Lam that cai vua duoc chi (bam "TIEP" tren tuong chang han) thi tour
        // di tiep luon - de no dung mai o mot buoc da xong nhin nhu bi treo.
        this.#watch(target);

        // The chu bam theo dich: du cho ben duoi thi nam duoi, khong thi len
        // tren. Ngang thi can giua dich nhung khong duoc thoi ra khoi man hinh.
        const card = this.#card;
        card.style.left = card.style.top = '0px';   // do kich thuoc that truoc da
        const cw = card.offsetWidth, ch = card.offsetHeight;
        const below = r.bottom + PAD + GAP + ch < innerHeight - 8;
        const top = below ? r.bottom + PAD + GAP : r.top - PAD - GAP - ch;
        const left = r.left + r.width / 2 - cw / 2;
        card.style.top = `${Math.max(8, Math.min(top, innerHeight - ch - 8))}px`;
        card.style.left = `${Math.max(8, Math.min(left, innerWidth - cw - 8))}px`;
    }
}
