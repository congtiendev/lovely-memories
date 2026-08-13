/* Moi man hinh mot dia chi rieng, de F5 hay chia se link deu vao dung cho.
   Dung hash chu khong dung duong dan that: trang tinh khong co server de
   rewrite, /sanh se thanh 404 ngay khi tai lai. */
/* Ba man hinh co dinh. Dia chi cua tung ky niem duoc them tu ngoai vao
   (main.js dung ten thu muc lam ca ten man hinh va dia chi). */
export const BASE_ROUTES = {
    gate: '#/cong',
    hall: '#/sanh',
    explore: '#/kham-pha',   // da doc loi nhan, khung tranh khong con o day
};

export class Router {
    #routes;
    #fallback;
    #skipNext = false;
    #handler = () => {};

    constructor(routes, fallback = 'gate') {
        this.#routes = routes;
        this.#fallback = fallback;
    }

    /** Ten man hinh dang mo, suy ra tu thanh dia chi. */
    get current() {
        const hash = location.hash;
        return Object.keys(this.#routes).find(name => this.#routes[name] === hash) ?? this.#fallback;
    }

    /** Goi handler ngay voi man hinh hien tai, roi moi lan dia chi doi. */
    start(handler) {
        this.#handler = handler;
        addEventListener('hashchange', () => {
            if (this.#skipNext) {
                this.#skipNext = false;   // chinh minh vua doi dia chi, khong phai nguoi dung
                return;
            }
            this.#handler(this.current);
        });
        this.#handler(this.current);
    }

    /**
     * @param {string} name  ten man hinh trong ROUTES
     * @param {{replace?: boolean, silent?: boolean}} options
     *   replace: thay dia chi hien tai, khong them buoc lui.
     *   silent: chi doi dia chi, khong goi handler - dung khi man hinh dang
     *           tu dien chuyen canh va khong muon bi nhay thang den ket qua.
     */
    go(name, { replace = false, silent = false } = {}) {
        const hash = this.#routes[name];
        if (!hash || location.hash === hash) return;

        if (replace) {
            history.replaceState(null, '', hash);   // khong sinh hashchange
            return;
        }
        this.#skipNext = silent;
        location.hash = hash;
    }
}
