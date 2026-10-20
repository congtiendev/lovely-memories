/* ---------- CHE DO XEM ----------
   Hai cach di qua cac ky niem:
     'show'  trinh chieu - moi luc mot phong, bam "Tiep" de sang chuong sau
     'strip' cuon ngang  - noi lien tuong cac phong thanh mot dai, vuot sang ben

   Mo trang lan nao cung bat dau o TRINH CHIEU: do la cach xem chinh, con cuon
   ngang la mot loi choi them - nho lai lua chon cu se lam nguoi mo link roi
   thang vao mot dai anh ma khong hieu chuyen gi. Doi che do chi co hieu luc
   trong phien dang xem.

   Dai ngang luon dung ban cat NGANG cua anh nen, nen tren dien thoai dung thi
   trang xin xoay ngang; may nao khong cho khoa huong thi hien loi nhac xoay tay. */
const KEY = 'lovely-memories:mode';   // khoa cu, chi de don di

/* Hang so thoi gian (ms) cua truot mem: dai di toi dich theo ham mu, sau 3 lan
   tau la xong 95% quang duong. Lan chuot can bam sat tay; tha tay sau khi keo
   thi troi xa hon nhu day mot tam tranh tren ray. */
const WHEEL_TAU = 110;
const FLING_TAU = 325;
const FLING_MAX = 4;          // px/ms - vung qua manh cung khong vang qua vai phong
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

export class Modes {
    #root;
    #button;
    #label;
    #rooms;
    #hint;
    #mode = 'show';
    #onScrollTo;
    #onChange;
    #onTour;
    #folders = [];

    constructor({ element, rooms, hint, folders, root = document.body,
                  onScrollTo = () => {}, onChange = () => {}, onTour = () => {} }) {
        this.#root = root;
        this.#button = element.querySelector('.mode__btn');
        this.#label = element.querySelector('.mode__label');
        this.#element = element;
        this.#rooms = rooms;
        this.#hint = hint;
        this.#folders = folders;
        this.#onScrollTo = onScrollTo;
        this.#onChange = onChange;
        this.#onTour = onTour;

        // Nut mo bang chon che do; chon xong thi dong lai
        this.#button.addEventListener('click', event => {
            event.stopPropagation();
            this.#togglePanel();
        });
        for (const choice of element.querySelectorAll('.mode__choice')) {
            choice.addEventListener('click', event => {
                event.stopPropagation();
                this.set(choice.dataset.mode);
                this.#togglePanel(false);
            });
        }
        element.querySelector('.mode__tour')?.addEventListener('click', event => {
            event.stopPropagation();
            this.#togglePanel(false);
            this.#onTour();
        });
        addEventListener('click', event => {
            if (!element.contains(event.target)) this.#togglePanel(false);
        });
        addEventListener('keydown', event => {
            if (event.key === 'Escape') this.#togglePanel(false);
        });
        // Cuon toi dau thi dia chi doi toi do - moi ky niem van mot dia chi rieng
        this.#rooms.addEventListener('scroll', () => {
            if (this.#mode !== 'strip') return;
            clearTimeout(this.#settle);
            this.#settle = setTimeout(() => this.#onScrollTo(this.centred), 140);
        }, { passive: true });

        this.#enableDrag();
        this.#enableWheel();
        addEventListener('resize', () => this.#checkOrientation());
        // Don not lua chon da luu tu ban truoc, khong thi may nao tung chon cuon
        // ngang se mai mai con lai mot khoa mo trong localStorage
        try { localStorage.removeItem(KEY); } catch { /* trinh duyet chan: khong sao */ }
        this.set('show', { silent: true });
    }

    #element;
    #settle = null;
    #current = null;
    #raf = 0;
    #pos = 0;        // vi tri dang ve, so thuc - scrollLeft doc lai bi lam tron
    #target = 0;
    #tau = WHEEL_TAU;
    #tick = 0;

    /** Chuong dang xem - de luc doi che do con biet dua ai ve giua. */
    set current(folder) { this.#current = folder; }

    get mode() { return this.#mode; }
    get isStrip() { return this.#mode === 'strip'; }

    /** Thu muc cua phong dang nam giua man hinh. */
    get centred() {
        const middle = this.#rooms.scrollLeft + this.#rooms.clientWidth / 2;
        const kids = [...this.#rooms.children];
        let best = 0, bestGap = Infinity;
        kids.forEach((el, i) => {
            const gap = Math.abs(el.offsetLeft + el.offsetWidth / 2 - middle);
            if (gap < bestGap) { bestGap = gap; best = i; }
        });
        return this.#folders[best];
    }

    setShown(shown) {
        this.#element.classList.toggle('is-shown', shown);
    }

    #togglePanel(open = !this.#element.classList.contains('is-open')) {
        this.#element.classList.toggle('is-open', open);
        this.#button.setAttribute('aria-expanded', String(open));
    }

    set(mode, { silent = false } = {}) {
        this.#mode = mode;
        this.#root.classList.toggle('mode-strip', mode === 'strip');
        for (const choice of this.#element.querySelectorAll('.mode__choice')) {
            choice.setAttribute('aria-current', String(choice.dataset.mode === mode));
        }
        this.#checkOrientation();
        if (!silent) {
            // Hai che do bay canh phong theo hai cach khac han nhau (dai ngang
            // hien san moi phong, trinh chieu chi hien phong dang mo), nen doi
            // che do giua chung thi ben goi phai dat lai canh dang xem.
            this.#onChange(mode);
        }
        // Doi sang dai ngang thi dua dung chuong dang xem ve giua man hinh.
        // Cho mot nhip: luc nay class vua duoc gan, cac o phong chua co kich
        // thuoc that nen scrollTo se tinh sai.
        if (mode === 'strip' && this.#current) {
            setTimeout(() => this.scrollTo(this.#current, { smooth: false }), 60);
        }
    }

    /* Tren dien thoai vuot tay la trinh duyet tu cuon. Tren may tinh thi khong
       co gi de vuot, nen o day bat chuot: nhan va keo sang nhu keo mot buc
       tranh dai. Keo qua 5px thi nuot luon cu click ke tiep, khong thi tha tay
       ra lai bi tinh la bam vao tranh. */
    #enableDrag() {
        const el = this.#rooms;
        let startX = 0, startLeft = 0, dragging = false, moved = 0;
        // Vai mau (thoi diem, x) cuoi cung de tinh van toc luc tha tay
        let trail = [];

        el.addEventListener('pointerdown', event => {
            // CHI keo trong che do cuon ngang. Truoc day khong xet, nen o che do
            // trinh chieu mot cu bam chuot binh thuong (tay ai cung nhich vai
            // px giua luc nhan va luc tha) bi tinh la mot cu keo, va doan ket
            // thuc keo nuot luon cu click do -> bam "TIEP" khong an gi.
            if (!this.isStrip) return;
            if (event.pointerType === 'touch' || event.button !== 0) return;
            // Dang troi thi cham vao la dung lai, nhu chan tay len tam tranh
            this.#stopGlide();
            dragging = true; moved = 0;
            startX = event.clientX;
            startLeft = el.scrollLeft;
            trail = [{ t: event.timeStamp, x: event.clientX }];
            // Bat/nha con tro co the nem loi (con tro tong hop, hoac da bi nha
            // truoc do). De no nem thi ca doan ket thuc keo bi bo dở va dai
            // khong truot ve dung phong nua.
            try { el.setPointerCapture(event.pointerId); } catch { /* khong sao */ }
        });
        el.addEventListener('pointermove', event => {
            if (!dragging) return;
            const dx = event.clientX - startX;
            moved = Math.max(moved, Math.abs(dx));
            if (moved > 5) el.classList.add('is-dragging');
            el.scrollLeft = startLeft - dx;
            trail.push({ t: event.timeStamp, x: event.clientX });
            while (trail.length > 2 && event.timeStamp - trail[0].t > 100) trail.shift();
        });
        const end = event => {
            if (!dragging) return;
            dragging = false;
            el.classList.remove('is-dragging');
            try { el.releasePointerCapture?.(event.pointerId); } catch { /* khong sao */ }
            // Tha tay ma dai dung sung lai la cam giac khung nhat. Lay van toc
            // trong ~100ms cuoi roi cho dai troi tiep va cham dan. Dung tay mot
            // nhip roi moi tha (mau cuoi da cu) thi khong troi.
            const first = trail[0], last = trail[trail.length - 1];
            const span = last.t - first.t;
            if (moved > 5 && span > 0 && event.timeStamp - last.t < 60) {
                const v = Math.max(-FLING_MAX, Math.min(FLING_MAX, (first.x - last.x) / span));
                this.#glideTo(el.scrollLeft + v * FLING_TAU, FLING_TAU);
            }
            if (moved > 5) {
                const eat = e => { e.stopPropagation(); e.preventDefault(); };
                el.addEventListener('click', eat, { capture: true, once: true });
                setTimeout(() => el.removeEventListener('click', eat, { capture: true }), 0);
            }
        };
        el.addEventListener('pointerup', end);
        el.addEventListener('pointercancel', end);
    }

    /* Banh xe chuot lan theo truc DOC, ma dai nay chay ngang - trinh duyet
       khong tu doi truc, nen phai doi tay. Trackpad vuot ngang thi da co
       deltaX san, cu lay cai nao lon hon.
       Lan/keo toi dau thi dung o do: khong snap, khong tu truot ve mot phong -
       tu keo nguoc lai nhu vay lam nguoi xem mat quyen dieu khien khung hinh.

       Truoc day moi nac chuot cong thang ~100px vao scrollLeft: dai nhay cuc
       tung buoc. Gio moi nac chi doi DICH, dai truot mem toi do; lan lien tiep
       thi dich cong don nen van theo kip tay. */
    #enableWheel() {
        this.#rooms.addEventListener('wheel', event => {
            if (!this.isStrip || event.ctrlKey) return;   // ctrl = phong to trang
            // Trackpad vuot NGANG: trinh duyet tu cuon dung truc va co san quan
            // tinh muot hon moi thu tu viet - de nguyen cho no.
            if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) {
                this.#stopGlide();
                return;
            }
            event.preventDefault();
            // Firefox co the bao theo DONG (deltaMode 1) hay theo TRANG (2):
            // khong doi ra px thi mot nac chuot chi di duoc 3px
            const unit = [1, 40, this.#rooms.clientWidth][event.deltaMode] ?? 1;
            const from = this.#raf ? this.#target : this.#rooms.scrollLeft;
            this.#glideTo(from + event.deltaY * unit, WHEEL_TAU);
        }, { passive: false });
    }

    /* ---------- TRUOT MEM ----------
       Mot vong rAF duy nhat cho ca lan chuot lan quan tinh sau khi keo: moi
       khung hinh di mot phan quang duong con lai, tinh theo thoi gian that
       (khong theo so khung) nen man 60Hz hay 144Hz deu troi nhu nhau. */
    #glideTo(target, tau) {
        const el = this.#rooms;
        const max = el.scrollWidth - el.clientWidth;
        if (!this.#raf) this.#pos = el.scrollLeft;
        this.#target = Math.max(0, Math.min(max, target));
        this.#tau = tau;
        if (reducedMotion.matches) {
            this.#stopGlide();
            el.scrollLeft = this.#target;
            return;
        }
        if (this.#raf) return;
        this.#tick = performance.now();
        const frame = now => {
            // timestamp cua rAF co the som hon performance.now() vua lay
            const dt = Math.max(0, Math.min(now - this.#tick, 64));
            this.#tick = now;
            this.#pos += (this.#target - this.#pos) * (1 - Math.exp(-dt / this.#tau));
            if (Math.abs(this.#target - this.#pos) < 0.5) {
                el.scrollLeft = this.#target;
                this.#raf = 0;
                return;
            }
            el.scrollLeft = this.#pos;
            this.#raf = requestAnimationFrame(frame);
        };
        this.#raf = requestAnimationFrame(frame);
    }

    #stopGlide() {
        cancelAnimationFrame(this.#raf);
        this.#raf = 0;
    }

    /** Dung truot mem / quan tinh: co ben khac (nhan vat) sap cam lai thanh cuon. */
    freeze() {
        this.#stopGlide();
    }

    /** Dua mot ky niem ve giua dai. */
    scrollTo(folder, { smooth = true } = {}) {
        const i = this.#folders.indexOf(folder);
        const el = this.#rooms.children[i];
        if (!el) return;
        this.#stopGlide();   // khong thi vong rAF va cuon cua trinh duyet giang co nhau
        this.#rooms.scrollTo({
            left: el.offsetLeft + el.offsetWidth / 2 - this.#rooms.clientWidth / 2,
            behavior: smooth ? 'smooth' : 'auto',
        });
    }

    /* Dai ngang chi hop ly khi man hinh nam ngang. Thu khoa huong truoc (chi
       chay duoc khi dang toan man hinh va tren may cho phep), khong duoc thi
       nhac nguoi xem tu xoay. */
    async #checkOrientation() {
        const portrait = innerHeight > innerWidth;
        const need = this.isStrip && portrait;
        this.#root.classList.toggle('needs-rotate', need);
        if (!need || !screen.orientation?.lock) return;
        try {
            if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
            await screen.orientation.lock('landscape');
            this.#root.classList.remove('needs-rotate');
        } catch {
            /* may khong cho khoa huong - de loi nhac hien */
        }
    }
}
