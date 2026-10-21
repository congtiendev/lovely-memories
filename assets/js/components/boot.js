/* Thanh tien do cua man cho luc mo trang (.boot trong index.html).

   Tien do that = tong (trong so x ti le xong) cua tung phan can tai: khung hinh nhan vat, anh
   canh, loi doc, font... Moi phan khai bao trong so truoc (declare), roi bao ti le xong (update)
   khi tai. Con so hien tren man hinh KHONG nhay thang toi gia tri that: no duoi theo gia tri do
   (de nhan vat chay mem, khong giat tung buoc khi mot khung hinh vua ve) va bi chan lai de
   khong chay het qua nhanh - man cho phai o lai it nhat `minMs` de nguoi xem kip thay nhan
   vat chay, ke ca khi moi thu da co san trong cache. */
export class BootMeter {
    #el;
    #bar;
    #pct;
    #parts = new Map();   // key -> { weight, done }  (done 0..1)
    #shown = 0;           // 0..100, gia tri dang ve
    #start = performance.now();
    #last = this.#start;
    #raf = 0;
    #minMs;
    #finishing = false;

    constructor(element, { minMs = 900 } = {}) {
        this.#el = element;
        this.#bar = element.querySelector('[role="progressbar"]');
        this.#pct = element.querySelector('.boot__pct');
        this.#minMs = minMs;
        this.#raf = requestAnimationFrame(now => this.#tick(now));
    }

    /** Khai bao mot phan can tai. Phai goi truoc khi cho, de tong trong so da du ngay tu dau. */
    declare(key, weight = 1) {
        if (!this.#parts.has(key)) this.#parts.set(key, { weight, done: 0 });
    }

    /** Bao ti le xong (0..1) cua mot phan. */
    update(key, done) {
        const part = this.#parts.get(key);
        if (part) part.done = Math.max(part.done, Math.min(1, done));
    }

    /** Khai bao mot phan va tinh la xong khi promise ket thuc (thanh cong hay that bai deu xong). */
    track(key, weight, promise) {
        this.declare(key, weight);
        Promise.resolve(promise).finally(() => this.update(key, 1));
        return promise;
    }

    /** Tien do that, 0..1. */
    get value() {
        let total = 0, done = 0;
        for (const { weight, done: d } of this.#parts.values()) {
            total += weight;
            done += weight * d;
        }
        return total ? done / total : 0;
    }

    /** Tai xong (hoac het gio cho): chay not toi 100% roi tra ve. */
    async finish() {
        this.#finishing = true;
        for (const part of this.#parts.values()) part.done = 1;
        await new Promise(resolve => {
            const check = () => (this.#shown >= 99.5 ? resolve() : setTimeout(check, 40));
            check();
        });
        cancelAnimationFrame(this.#raf);
        this.#draw(100);
    }

    #tick(now) {
        const dt = Math.min(now - this.#last, 64);
        this.#last = now;
        const elapsed = now - this.#start;
        // Khong chay nhanh hon "dong ho toi thieu": toi thieu minMs moi duoc cham 100%
        const cap = Math.min(100, (elapsed / this.#minMs) * 100);
        const target = Math.min(this.#finishing ? 100 : this.value * 100, cap);
        this.#shown += (target - this.#shown) * (1 - Math.exp(-dt / 180));
        if (target - this.#shown < 0.05) this.#shown = target;
        this.#draw(this.#shown);
        this.#raf = requestAnimationFrame(t => this.#tick(t));
    }

    #draw(value) {
        const v = Math.min(100, Math.max(0, value));
        this.#el.style.setProperty('--p', v.toFixed(2));
        const whole = Math.round(v);
        this.#pct.textContent = `${whole}%`;
        this.#bar?.setAttribute('aria-valuenow', String(whole));
    }
}
