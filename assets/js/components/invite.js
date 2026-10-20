import { calm } from '../config.js';

/* La thu moi - lay tu chuyen tau KongTien x Luyna (Date-With-Luyna-18-10-2026), viet lai
   thanh module cho bao tang nay.

   Nghe xong thuyet minh cua phong thi la thu roi tu tren xuong, nay nhe roi nam yen, cay
   but viet lan luot tung dong. Moi dong la mot khoi overflow:hidden, JS noi dan be rong de
   chu "hien ra" theo net but va doi cay but toi dung cho dang viet. Lan dau mo thu cua mot
   phong thi but viet; mo lai thi hien luon ca thu.

   Thu chi de doc, khong co nut tra loi. Cham ra ngoai to thu (hoac Esc): dang viet thi hien
   not ca thu, viet xong roi thi dong.

   Thu co `countdown` (thu-moi.json) thi viet xong, o khoang trong duoi chu ky hien dong ho dem
   nguoc toi gio hen, nhay tung giay; toi gio thi doi thanh cau `done`. */

const PAPER = 'assets/images/invite/paper.webp';           // 1024 x 1536
const SHADOW = 'assets/images/invite/paper-shadow.webp';   // bong do rieng, xem invite.css
const PEN = 'assets/images/invite/pen.webp';

/* pen.webp co nuong san bong do nen canvas rong hon cay but goc (1264 / 1024 lan). Cay but
   giu nguyen co tren man hinh nho nhan be rong voi he so nay. */
const PEN_CANVAS = 1264 / 1024;
/* Vi tri dau ngoi trong pen.webp, ti le 0 -> 1 cua canvas da noi (khop transform-origin
   cua .invite__pen) */
const PEN_TIP = { x: 0.1622, y: 0.8904 };
const HOP = 0.34;         // giay: nhac but sang dong moi
const DROP = 1300;        // ms thu roi tu tren xuong, khop animation cua .invite__letter.is-dropping

export class Invite {
    #onClose = () => {};
    #scene;
    #letter;
    #ink;
    #pen;
    #tip;
    #clock;
    #countdown = null;  // { to, label, done } cua thu dang mo
    #tick = 0;
    #fonts;

    #lines = [];
    #open = false;
    #raf = 0;
    #cur = 0;           // dong dang viet
    #pos = 0;           // px da viet cua dong do
    #phase = 'write';   // write | hop (nhac but sang dong moi)
    #hopT = 0;
    #lastT = 0;
    #seen = {};         // key cac thu da duoc viet mot lan
    #timers = [];       // hen gio cua mot lan mo thu; dong thu la huy het

    /** @param texts { tip } - chu chung cua thu (content.js INVITE) */
    constructor({ texts }) {

        this.#scene = document.createElement('div');
        this.#scene.className = 'invite';
        this.#scene.setAttribute('role', 'dialog');
        this.#scene.setAttribute('aria-modal', 'true');
        this.#scene.setAttribute('aria-label', 'Thư mời');
        this.#scene.innerHTML = `
            <div class="invite__letter">
                <img class="invite__shadow" src="${SHADOW}" alt="" decoding="async">
                <img class="invite__sheet" src="${PAPER}" alt="Tờ thư" decoding="async">
                <div class="invite__ink"></div>
                <img class="invite__pen" src="${PEN}" alt="">
                <p class="invite__clock" aria-live="off"></p>
            </div>
            <span class="invite__tip"></span>`;
        const q = sel => this.#scene.querySelector(sel);
        this.#letter = q('.invite__letter');
        this.#ink = q('.invite__ink');
        this.#pen = q('.invite__pen');
        this.#tip = q('.invite__tip');
        this.#tip.textContent = texts.tip;
        this.#clock = q('.invite__clock');

        // Cham ra ngoai to thu: dang viet thi hien not, viet xong thi dong
        this.#scene.addEventListener('click', event => {
            if (!this.#letter.contains(event.target)) this.dismiss();
        });
        addEventListener('keydown', event => {
            if (event.key === 'Escape' && this.#open) this.dismiss();
        });
        addEventListener('resize', () => this.#relayout());

        document.body.append(this.#scene);

        // Cho font viet tay, nhung toi da 1.2s de mang cham cung khong ket animation
        this.#fonts = Promise.race([
            document.fonts ? document.fonts.load('700 1em "Dancing Script"', 'Gửi thư mời').catch(() => {}) : null,
            new Promise(resolve => setTimeout(resolve, 1200)),
        ]);
    }

    get isOpen() {
        return this.#open;
    }

    onClose(handler) {
        this.#onClose = handler;
    }

    /**
     * @param letter { lines: [{ text, style: 'date'|'title'|'greet'|'more'|'sign'|undefined }],
     *                  countdown?: { to: ISO co mui gio, label, done } }
     * @param opts.key   dinh danh de nho thu da viet chua
     */
    open(letter, { key } = {}) {
        if (this.#open || !letter?.lines?.length) return;
        const first = !this.#seen[key];
        this.#seen[key] = true;

        this.#build(letter.lines);
        this.#open = true;
        this.#tip.classList.remove('is-shown');
        this.#countdown = letter.countdown ?? null;
        this.#clock.classList.remove('is-shown');
        this.#clock.textContent = '';
        this.#scene.classList.add('is-open');

        this.#letter.classList.remove('is-dropping');
        if (first && !calm.matches) {
            // Roi tu tren xuong (invite.css), cham day nam yen roi but moi bat dau viet
            void this.#letter.offsetWidth;
            this.#letter.classList.add('is-dropping');
            this.#after(DROP, () => {
                this.#letter.classList.remove('is-dropping');
                this.#fonts.then(() => this.#start());
            });
        } else {
            this.#fonts.then(() => this.#showAll());   // mo lai: hien luon ca thu
        }
    }

    /** Dang viet thi hien luon ca thu; viet xong roi thi dong. */
    dismiss() {
        if (this.#skip()) return;
        this.close();
    }

    close() {
        if (!this.#open) return;
        cancelAnimationFrame(this.#raf);   // dung but giua chung (Back / doi man hinh)
        this.#raf = 0;
        this.#pen.classList.remove('is-on');
        this.#timers.forEach(clearTimeout);
        this.#timers = [];
        clearInterval(this.#tick);
        this.#letter.classList.remove('is-dropping');
        this.#open = false;
        this.#scene.classList.remove('is-open');
        this.#onClose();
    }

    /* ---------- BUT VIET ---------- */

    #build(items) {
        this.#ink.textContent = '';
        this.#lines = items.map(item => {
            const ln = document.createElement('div');
            ln.className = 'invite__line' + (item.style ? ` is-${item.style}` : '');
            const sp = document.createElement('span');
            sp.textContent = item.text;
            ln.append(sp);
            this.#ink.append(ln);
            return { ln, sp, w: 0, x: 0, y: 0 };
        });
    }

    /* Co co chu cho dong dai nhat vua be ngang to giay va ca thu vua chieu cao, roi ghi lai
       toa do tung dong */
    #measure() {
        const lw = this.#letter.clientWidth;
        this.#pen.style.width = lw * 0.42 * PEN_CANVAS + 'px';
        this.#clock.style.fontSize = lw * 0.045 + 'px';
        this.#ink.style.fontSize = lw * 0.066 + 'px';
        for (const o of this.#lines) {
            o.ln.style.width = 'auto';
            o.ln.style.marginLeft = '';   // le tieu de / ngay thang tinh lai sau khi chot co chu
        }

        const ir = this.#ink.getBoundingClientRect();
        let scale = 1;
        for (const o of this.#lines) {
            const avail = ir.right - o.ln.getBoundingClientRect().left;
            if (o.sp.offsetWidth > avail && avail > 0) scale = Math.min(scale, avail / o.sp.offsetWidth);
        }
        if (scale < 1) this.#ink.style.fontSize = lw * 0.066 * scale + 'px';
        // Thu nhieu dong thi con phai vua theo chieu cao: tong cac dong khong duoc tran vung chu
        const tall = this.#lines.reduce((sum, o) => sum + o.ln.offsetHeight, 0);
        const room = this.#ink.clientHeight * 0.97;
        if (tall > room) this.#ink.style.fontSize = lw * 0.066 * scale * room / tall + 'px';

        // Tieu de nam giua, ngay thang sat le phai - bang le trai tinh san: canh bang CSS thi
        // dong noi rong dan se moc ra tu giua (hay tu phai), ngoi but khong bam dung mep chu.
        // Tinh SAU khi chot co chu nen hai dong nay khong bao gio ep ca thu phai co nho lai.
        const iw = this.#ink.clientWidth;
        for (const o of this.#lines) {
            const free = Math.max(0, iw - o.sp.offsetWidth);
            if (o.ln.classList.contains('is-title')) o.ln.style.marginLeft = free / 2 + 'px';
            if (o.ln.classList.contains('is-date')) o.ln.style.marginLeft = free + 'px';
        }

        const br = this.#letter.getBoundingClientRect();
        for (const o of this.#lines) {
            o.w = o.sp.offsetWidth;
            const r = o.ln.getBoundingClientRect();
            o.x = r.left - br.left;
            o.y = r.top - br.top + r.height * 0.74;   // duong ke chan chu
        }
        this.#applyProgress();
    }

    #applyProgress() {
        this.#lines.forEach((o, i) => {
            o.ln.style.width = (i < this.#cur ? o.w : i === this.#cur ? this.#pos : 0) + 'px';
        });
    }

    #penTo(x, y, lift = 0, tilt = 0) {
        const pw = this.#pen.offsetWidth, ph = this.#pen.offsetHeight;
        this.#pen.style.transform =
            `translate(${x - PEN_TIP.x * pw}px, ${y + lift - PEN_TIP.y * ph}px) rotate(${tilt}deg)`;
    }

    #start() {
        if (!this.#open) return;
        this.#cur = 0; this.#pos = 0; this.#phase = 'write'; this.#hopT = 0;
        this.#measure();
        this.#penTo(this.#lines[0].x, this.#lines[0].y);
        this.#pen.classList.add('is-on');
        this.#lastT = performance.now();
        this.#raf = requestAnimationFrame(t => this.#step(t));
    }

    #step(now) {
        const dt = Math.min((now - this.#lastT) / 1000 || 0, 0.05);
        this.#lastT = now;
        const o = this.#lines[this.#cur];
        const speed = parseFloat(getComputedStyle(this.#ink).fontSize) * 9.5;   // px / giay

        if (this.#phase === 'write') {
            this.#pos = Math.min(this.#pos + speed * dt, o.w);
            o.ln.style.width = this.#pos + 'px';
            const wobble = Math.sin(this.#pos / 7) * 1.2;   // rung nhe cho ra net tay
            this.#penTo(o.x + this.#pos, o.y + wobble * 0.3, 0, wobble);
            if (this.#pos >= o.w) { this.#phase = 'hop'; this.#hopT = 0; }
        } else {
            this.#hopT += dt;
            const k = Math.min(this.#hopT / HOP, 1);
            const e = k * k * (3 - 2 * k);
            const nx = this.#lines[this.#cur + 1];
            const ex = o.x + o.w;
            const iw = this.#ink.clientWidth;
            if (nx) this.#penTo(ex + (nx.x - ex) * e, o.y + (nx.y - o.y) * e, -Math.sin(k * Math.PI) * iw * 0.05);
            else this.#penTo(ex + e * iw * 0.4, o.y + e * iw * 0.35, 0, e * 14);
            if (k >= 1) {
                if (!nx) { this.#finish(); return; }
                this.#cur++; this.#pos = 0; this.#phase = 'write';
            }
        }
        this.#raf = requestAnimationFrame(t => this.#step(t));
    }

    /* Viet xong: cat but, hien dong nhac cach dong thu va dong ho dem nguoc (neu co) */
    #finish() {
        this.#raf = 0;
        this.#pen.classList.remove('is-on');
        this.#tip.classList.add('is-shown');
        if (this.#countdown) {
            this.#renderClock();
            this.#clock.classList.add('is-shown');
            clearInterval(this.#tick);
            this.#tick = setInterval(() => this.#renderClock(), 1000);
        }
    }

    /* "Con 2 ngay 05 gio 12 phut 33 giay" - so dam, don vi chu thuong. Het ngay thi bo phan
       ngay; toi gio thi doi thanh cau `done` va thoi dem. */
    #renderClock() {
        const { to, label, done } = this.#countdown;
        let left = Math.floor((Date.parse(to) - Date.now()) / 1000);
        if (!(left > 0)) {
            clearInterval(this.#tick);
            this.#clock.textContent = done;
            return;
        }
        const d = Math.floor(left / 86400); left %= 86400;
        const h = Math.floor(left / 3600); left %= 3600;
        const m = Math.floor(left / 60), sec = left % 60;
        const two = n => String(n).padStart(2, '0');
        const part = (n, unit) => `<b>${n}</b> ${unit}`;
        this.#clock.innerHTML = `${label} `
            + (d ? part(d, 'ngày') + ' ' : '')
            + [part(two(h), 'giờ'), part(two(m), 'phút'), part(two(sec), 'giây')].join(' ');
    }

    #showAll() {
        if (!this.#open) return;
        this.#cur = this.#lines.length; this.#pos = 0;
        this.#measure();
        this.#finish();
    }

    /** Dang viet thi dung va hien het; tra ve true neu co viec de dung */
    #skip() {
        if (!this.#raf) return false;
        cancelAnimationFrame(this.#raf);
        this.#raf = 0;
        this.#showAll();
        return true;
    }

    #relayout() {
        if (!this.#open || !this.#lines.length) return;
        const o = this.#lines[this.#cur];
        const ratio = o?.w ? this.#pos / o.w : 0;
        this.#measure();
        if (o) {
            this.#pos = o.w * ratio;
            this.#applyProgress();
            if (this.#raf) this.#penTo(o.x + this.#pos, o.y);
        }
    }

    #after(delay, fn) {
        this.#timers.push(setTimeout(fn, delay));
    }
}
