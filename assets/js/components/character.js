/* Nhan vat di lai bang phim mui ten / WASD, o hai noi: san cong (di toi cua de
   vao sanh) va san cac phong ky niem.

   Dat TRONG mot canh phu kin man hinh (.stage--gate hoac .room__scene) va tinh
   toa do bang % cua canh (giong tranh treo), nen dung duoc du man hinh to hay
   nho. Moi noi co mot dai san rieng (PROFILES): nhan vat chi di duoc trong do.
   Vi tri o phong duoc giu nguyen khi sang phong khac: nhan vat "di theo" nguoi
   xem.

   Che do cuon ngang ('strip'): nhan vat song trong chinh khung cuon (.rooms), tren
   mot truc chung cua ca dai - x tinh bang "be ngang man hinh" (100 = mot phong) -
   nen di lien mot mach tu phong nay sang phong khac, khong bi chan o mep phong, chi
   dung o hai dau dai. Nen cuon theo de nhan vat luon o giua man hinh.

   Anh: assets/images/character/ (webp, cung khung cat nen chan luon nam o day
   anh va cac frame khong lech nhau). Hoat anh theo animations.json cua bo asset:
   di thi chay walk_<huong> 8fps, dung lai thi quay ve phia nguoi xem va dung nghi
   (hoat anh cho 6 khung: dung yen, thi thoang chop mat, khong noi). present_talk
   chi chay khi nhan vat dang noi trong bong bong thoai (say()). */
import { Bubble } from './bubble.js';

const DIR = 'assets/images/character/';
const WALK_FPS = 8;
const TALK_FPS = 6;
const FRAMES = { down: 4, left: 4, right: 4, up: 4, talk: 6, idle: 6 };
/* Dung nghi (idle-0..5): thoi gian giu moi khung, ms. Mo mat giu lau, khung 2-4
   la cu chop mat nhanh - chop moi ~2.5s, du de thay no song, khong lap khung nao
   cung deu nhu may. */
const IDLE_MS = [650, 650, 90, 110, 90, 650];
const RETRY_MAX_MS = 3000;  // khoang cho toi da giua hai lan thu tai lai mot frame hong
const ASPECT = 300 / 457;  // be ngang / chieu cao cua moi frame
const HEAD_X = 0.54;        // tam cai dau nam o 54% be ngang frame (162/300), khong phai 50%: duoi bong bong chi vao day

const wideCrop = matchMedia('(min-aspect-ratio: 1/1)');

/* floor: dai san di duoc, % chieu cao canh (do tren anh nen).
   height: chieu cao nhan vat, % chieu cao canh - xa (sat tuong/cua) nho hon gan
   (sat nguoi xem), cho cam giac chieu sau du san chi la mot dai hep. */
const PROFILES = {
    room: {
        floor: () => (wideCrop.matches
            ? { top: 93.2, bottom: 98.6 }
            : { top: 82, bottom: 97 }),
        height: { far: 0.2, near: 0.27 },
        start: 0.28,
    },
    // Dai ngang luon dung ban cat NGANG cua anh nen, nen san giong phong o man ngang
    strip: {
        floor: () => ({ top: 93.2, bottom: 98.6 }),
        height: { far: 0.2, near: 0.27 },
        start: 0.28,
    },
    // Anh cong chi co mot ban (ngang), nen dai san khong doi theo ban cat.
    // Chan cua nam o 94.6% - xem --door-t/--door-h trong tokens.css.
    gate: {
        floor: () => ({ top: 95.4, bottom: 99.6 }),
        height: { far: 0.19, near: 0.24 },
        start: 0.12,
    },
};
const FOLLOW_TAU = 150;   // ms: nen cuon theo nhan vat cham mot nhip, khong dinh cung vao no
const SPEED = 0.42;       // chieu cao canh moi giay, theo chieu ngang
const DEPTH_SPEED = 0.5;  // di len/xuong cham hon vi san ngan
const COLUMN_X = 0.3;          // dai ngang: nhan vat dung o cot (30% be ngang phong), khong che ngay o giua nen
const ROOM_WALK_SPEED = 1.2;   // boi so SPEED khi tu di sang phong ke (bam "Tiep" o dai ngang): ~4-5s, gan toc do di bo thuong de buoc chan khop voi quang duong

const KEYS = {
    ArrowLeft: 'left', a: 'left', A: 'left',
    ArrowRight: 'right', d: 'right', D: 'right',
    ArrowUp: 'up', w: 'up', W: 'up',
    ArrowDown: 'down', s: 'down', S: 'down',
};

/* Bo go tieng Viet (Unikey, EVKey, ibus-bamboo...) co the doi event.key cua W A S D
   thanh 'Process' / 'Unidentified'; event.code la phim vat ly nen khong bi anh huong. */
const CODES = {
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
};

const lerp = (a, b, t) => a + (b - a) * t;

export class Character {
    #root;
    #onCamera;
    #onRoom;
    #room = null;       // dai ngang: phong nhan vat dang dung, lan bao gan nhat qua onRoom
    #cam = null;        // vi tri cuon dang ve (so thuc) khi nen dang cuon theo nhan vat
    #index = 0;         // chi so phong dang xem (cho dai ngang: dat nhan vat vao dung phong)
    #frames = {};       // { down: [img x4], ..., talk: [img x6] }
    #loaded = null;     // Promise: moi khung hinh da tai xong (xem ready())
    #shown = null;
    #enabled;
    #scene = null;
    #kind = 'room';
    #reach = null;      // { x, tol, onReach }: cham vach nay thi coi nhu toi noi
    #held = [];         // phim dang giu, cai bam sau cung o cuoi
    #at = { room: null, gate: null, strip: null };   // vi tri nho lai cho tung noi: { x, y }
    #locked = false;    // khoa phim (dang tu di)
    #auto = null;       // chuyen dong tu dong dang chay
    #panTo = null;      // dai ngang: vi tri cuon (px) nen cuon toi va giu o do sau khi tu di xong, thay vi can nhan vat
    #shrink = 1;        // he so thu nho them khi tu di vao trong
    #opacity = 1;
    #facing = 'down';
    #state = 'idle';
    #bubble = null;     // bong bong thoai, tao o lan noi dau tien
    #speaking = false;  // dang go chu: nhan vat mo mieng (present_talk)
    #frame = 0;
    #frameAt = 0;
    #last = 0;
    #raf = 0;

    /**
     * @param enabled ham tra ve true khi duoc phep dieu khien (khong co lop phu nao dang mo)
     * @param onCamera goi truoc khi nen bat dau cuon theo nhan vat: ben cuon tay (truot mem,
     *        quan tinh) phai dung lai, khong thi hai ben keo scrollLeft nguoc nhau
     * @param onRoom(index) dai ngang: nhan vat vua BUOC sang phong khac. Bao ngay luc qua
     *        mep phong, khong doi nen cuon xong - nguoi xem bam "Thuyet minh" luc nen con
     *        dang truot theo thi van dung phong nhan vat dang dung
     */
    constructor({ enabled = () => true, onCamera = () => {}, onRoom = () => {} } = {}) {
        this.#enabled = enabled;
        this.#onCamera = onCamera;
        this.#onRoom = onRoom;
        this.#root = document.createElement('div');
        this.#root.className = 'character';
        this.#root.setAttribute('aria-hidden', 'true');

        addEventListener('keydown', event => this.#key(event, true));
        addEventListener('keyup', event => this.#key(event, false));
        // Mat tieu diem giua luc dang giu phim thi khong bao gio nhan keyup
        addEventListener('blur', () => { this.#held = []; });
        addEventListener('resize', () => this.#fit());
    }

    /**
     * Dua nhan vat vao mot canh.
     * @param scene phan tu phu kin man hinh, neo day giua (.stage--gate / .room__scene), hoac
     *        khung cuon .rooms khi kind = 'strip'
     * @param kind 'room' | 'gate' | 'strip'
     * @param reach (chi cong) { x, tol, onReach }: toi gan x (% be ngang canh) trong
     *        tol thi goi onReach mot lan va khoa phim.
     * @param index (chi dai ngang) phong dang xem, de dat nhan vat vao do lan dau
     */
    mount(scene, kind = 'room', { reach = null, index = 0 } = {}) {
        if (!scene) return;
        const changed = scene !== this.#scene;
        // Doi giua phong va dai ngang: giu nguyen cho nhan vat dang dung tren man hinh
        // thay vi nhay ve cho cu da luu (hai ben dung toa do khac nhau)
        let carry = null;
        const old = changed && this.#scene && kind !== 'gate' && this.#kind !== 'gate'
            ? this.#at[this.#kind] : null;
        if (old) {
            // Vi tri ngang TRONG phong, tinh tu vi tri da luu (khong do tu hinh hien tai:
            // bo cuc vua doi nen hinh do con tinh theo kieu cu)
            const vw = document.documentElement.clientWidth;
            const local = this.#kind === 'strip'
                ? (((old.x % 100) + 100) % 100) / 100 * vw
                : (vw - this.#scene.offsetWidth) / 2 + old.x / 100 * this.#scene.offsetWidth;
            carry = { local, y: old.y };
        }
        this.#index = index;
        this.#kind = kind;
        this.#reach = reach;
        this.#cam = null;
        this.#panTo = null;
        if (changed) {
            this.#scene = scene;
            this.#load();
            scene.append(this.#root);
            this.#root.dataset.kind = kind;
            this.#start();
        }
        // Cong luon bat dau lai tu dau (vao lai tu sanh thi cua da dong, nguoi
        // moi dung o vach xuat phat); phong thi giu vi tri cu.
        if (kind === 'gate') this.reset();
        else this.#unlock();
        if (carry) this.#carryIn(carry);
        else this.#fit(changed);
        // Moc de so: chi bao khi nhan vat tu buoc qua mep phong, khong bao luc vua dat vao
        this.#room = this.roomIndex;
    }

    /** Dai ngang: phong nhan vat dang dung (theo vi tri chan, khong theo nen cuon). Ngoai dai
        ngang thi null - o do nhan vat khong ra khoi phong cua minh. */
    get roomIndex() {
        if (this.#kind !== 'strip' || !this.#scene || !this.#at.strip) return null;
        const [x] = this.#pos();
        return Math.min(this.#rooms() - 1, Math.max(0, Math.floor(x / 100)));
    }

    /** Dai ngang: dua nhan vat ve mot phong khac (nhay tu dong thoi gian), dat o cho xuat phat cua phong do. */
    warp(index) {
        this.#index = index;
        if (this.#kind === 'strip' && this.#scene) this.#fit(true);
        this.#room = this.roomIndex;   // nhay toi chu khong buoc qua: khong bao onRoom
    }

    #carryIn({ local, y }) {
        const d = this.#dims();
        if (!d.w) { this.#fit(true); return; }
        const x = this.#kind === 'strip'
            ? (this.#index + local / d.w) * 100
            : (local - (document.documentElement.clientWidth - d.w) / 2) / d.w * 100;
        const b = this.#bounds();
        this.#at[this.#kind] = { x, y: y ?? (b.y[0] + b.y[1]) / 2 };
        this.#set(x, this.#at[this.#kind].y);
        this.#draw();
    }

    /** Roi canh (len sanh, ve cong): thoi di lai, giu nguyen vi tri. */
    unmount() {
        this.shutUp();
        this.cancel();
        this.#held = [];
        // Buoc vao cua la mo dan + nho dan: roi canh thi tra ve nhu cu, khong thi vao
        // phong dau tien (cong -> sanh -> phong) nhan vat van vo hinh
        this.#opacity = 1;
        this.#shrink = 1;
        this.#scene = null;
        this.#root.remove();
        this.#stop();
    }

    /** Dat lai o vach xuat phat: mo khoa, hien lai, dung noi. */
    reset() {
        this.shutUp();
        this.cancel();
        this.#unlock();
        this.#at[this.#kind] = null;
        this.#opacity = 1;
        this.#shrink = 1;
        this.#facing = 'down';
        this.#state = 'idle';
        this.#frame = 0;
        this.#fit(true);
    }

    /**
     * Noi mot cau: hien bong bong thoai tren dau, go tung chu, nhan vat mo mieng
     * trong luc go. Tra ve Promise<boolean>: true neu noi het, false neu bi cat ngang.
     * @param action nhan nut (vd 'OK'): noi xong thi hoi va cho bam; true neu duoc bam.
     * @param typingMs / hold xem Bubble.say (khop chu voi loi doc)
     */
    async say(text, { action = null, typingMs = 0, hold = null } = {}) {
        if (!this.#scene) return false;
        this.#bubble ??= new Bubble(this.#root);
        this.#speaking = true;
        const done = await this.#bubble.say(text, {
            action, typingMs, hold,
            onTyped: () => { this.#speaking = false; },
        });
        this.#speaking = false;
        return done;
    }

    /** Im ngay: thu bong bong lai, bo cau dang noi (vao cua, doi man hinh). */
    shutUp() {
        this.#speaking = false;
        this.#bubble?.hide();
    }

    /** Khoa phim, vi dang co canh khac chiem quyen dieu khien (tu di toi cua). */
    lock() {
        this.#locked = true;
        this.#held = [];
    }

    /**
     * Tu di toi mot diem (% canh). Tra ve Promise<boolean>: true neu toi noi,
     * false neu bi huy giua chung (doi man hinh).
     * @param to { x, y }
     * @param opts.speed boi so toc do di thuong (mac dinh 1); hoac opts.duration (ms)
     *        de di dung chung khoang thoi gian do, bat ke quang duong.
     * @param opts.shrink cuoi duong nhan vat con bao nhieu phan chieu cao (1 = khong doi)
     * @param opts.fade true thi mo dan o doan cuoi
     * @param opts.pan (dai ngang) vi tri cuon dich, px: nen cuon toi do cung nhip voi buoc di,
     *        thay vi can nhan vat o giua man hinh
     */
    walkTo(to, { speed = 1, duration = 0, shrink = 1, fade = false, pan = null } = {}) {
        this.cancel();
        return new Promise(resolve => {
            this.#auto = {
                from: null, to, speed, duration, shrink, fade, pan, panFrom: null, resolve,
                elapsed: 0,
            };
        });
    }

    /**
     * Dai ngang: tu di bo toi cot cua phong `index` (giu nguyen hang dang dung). Nen cuon di
     * cung luc, voi cung nhip, toi dung phong do - nen toi noi phong nam tron trong man hinh
     * (nhan vat khong o giua man nhu luc tu di, vi cot lech ve mot ben).
     * Khoa phim trong luc di. Tra ve Promise<boolean>: true neu toi noi, false neu bi huy.
     */
    async walkToRoom(index) {
        if (this.#kind !== 'strip' || !this.#scene) return false;
        this.shutUp();
        this.lock();
        const [, y] = this.#pos();
        const pan = index * this.#scene.clientWidth;
        this.#panTo = pan;
        const arrived = await this.walkTo(
            { x: (index + COLUMN_X) * 100, y },
            { speed: ROOM_WALK_SPEED, pan },
        );
        if (arrived) this.#unlock();
        return arrived;
    }

    /** Huy chuyen dong tu dong dang chay (neu co). */
    cancel() {
        if (!this.#auto) return;
        const { resolve } = this.#auto;
        this.#auto = null;
        resolve(false);
    }

    #unlock() {
        this.#locked = false;
    }

    /* Tai 23 frame mot lan, luc dau tien vao canh. Moi frame la mot <img>
       chong len nhau, chi bat cai dang hien: doi frame bang cach doi src thi
       chop mot nhip luc trinh duyet giai ma lai anh. */
    /** Moi khung hinh cua nhan vat da tai xong - doi cai nay roi moi cho no noi, khong thi
        bong bong thoai hien ra ma chua thay nhan vat dau (mang cham). Goi som cung duoc. */
    ready() {
        this.#load();
        return this.#loaded;
    }

    #load() {
        if (this.#frames.down) return;
        const waiting = [];
        const make = (name, n) => Array.from({ length: n }, (_, i) => {
            const img = new Image();
            img.src = `${DIR}${name}-${i}.webp`;
            img.alt = '';
            // Tai hong (dev server dang tai lai file, file chua kip co, mang chap chon)
            // thi thu lai mai voi khoang cho tang dan toi RETRY_MAX_MS, khong bo cuoc:
            // bo cuoc la nhan vat vo hinh cho toi khi nguoi xem tai lai trang.
            let retries = 0;
            img.addEventListener('error', () => {
                retries++;
                const wait = Math.min(RETRY_MAX_MS, 400 * retries);
                setTimeout(() => { img.src = `${DIR}${name}-${i}.webp?r=${retries}`; }, wait);
            });
            img.decoding = 'async';
            img.fetchPriority = 'low';   // dung tranh anh nen cong dang can ve truoc
            img.draggable = false;
            // Loi thi tai lai o tren, nen chi `load` moi tinh la xong
            waiting.push(new Promise(resolve => img.addEventListener('load', resolve, { once: true })));
            this.#root.append(img);
            return img;
        });
        for (const [name, n] of Object.entries(FRAMES)) this.#frames[name] = make(name, n);
        this.#loaded = Promise.all(waiting);
    }

    #key(event, down) {
        const dir = KEYS[event.key] ?? CODES[event.code];
        if (!dir) return;
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        if (!down) {
            this.#held = this.#held.filter(d => d !== dir);
            return;
        }
        if (!this.#scene || this.#locked || !this.#enabled()) return;
        event.preventDefault();
        if (!this.#held.includes(dir)) this.#held.push(dir);
    }

    #start() {
        if (this.#raf) return;
        this.#last = performance.now();
        const tick = now => {
            this.#raf = requestAnimationFrame(tick);
            this.#step(Math.min(now - this.#last, 64), now);
            this.#last = now;
        };
        this.#raf = requestAnimationFrame(tick);
    }

    #stop() {
        cancelAnimationFrame(this.#raf);
        this.#raf = 0;
    }

    get #profile() { return PROFILES[this.#kind]; }

    /* Kich thuoc de doi x% <-> px. Phong/cong: be ngang canh. Dai ngang: be ngang man hinh
       (= mot phong, 100 don vi) va chieu cao canh nen cua phong; `ch` la chieu cao khung cuon. */
    #dims() {
        if (this.#kind === 'strip') {
            const scene = this.#scene.querySelector('.room__scene');
            return { w: this.#scene.clientWidth, h: scene?.offsetHeight ?? 0, ch: this.#scene.clientHeight };
        }
        return { w: this.#scene.offsetWidth, h: this.#scene.offsetHeight, ch: 0 };
    }

    #rooms() {
        return this.#scene.querySelectorAll(':scope > .room').length || 1;
    }

    /* Nen cuon theo nhan vat, giu no o giua man hinh (tru hai dau dai, noi nhan vat di
       lech ra mep). Chi cuon khi nhan vat dang di; dung lai thi cuon not phan con du roi
       thoi, de nguoi xem keo tay di xem cho khac duoc ma khong bi keo nguoc ve. */
    #follow(dtMs) {
        const el = this.#scene;
        const active = !!this.#auto || (!this.#locked && this.#enabled() && this.#held.length > 0);
        if (!active && this.#cam === null) return;
        const w = el.clientWidth;
        const [x] = this.#pos();
        // Nguoi xem tu di tiep: thoi giu phong dich cua lan tu di truoc
        if (active && !this.#auto) this.#panTo = null;
        let target = Math.min(el.scrollWidth - w, Math.max(0, x / 100 * w - w / 2));
        if (this.#cam === null) {
            this.#onCamera();
            this.#cam = el.scrollLeft;
        }
        const a = this.#auto;
        if (a?.pan != null) {
            // Cuon cung nhip voi buoc di: tu cho dang dung toi dau phong dich
            a.panFrom ??= this.#cam;
            const t = a.total > 0 ? Math.min(1, a.elapsed / a.total) : 1;
            target = lerp(a.panFrom, a.pan, t);
        } else if (this.#panTo !== null) {
            target = this.#panTo;
        }
        this.#cam += (target - this.#cam) * (1 - Math.exp(-dtMs / FOLLOW_TAU));
        el.scrollLeft = this.#cam;
        if (!active && Math.abs(target - this.#cam) < 0.5) this.#cam = null;
    }

    #step(dtMs, now) {
        if (!this.#scene) return;
        const dt = dtMs / 1000;
        const { w, h } = this.#dims();
        if (!w || !h) return;   // canh dang an (display: none)
        // Mount luc canh con an (cong quay lai tu sanh) thi chua dat duoc vi tri
        if (!this.#at[this.#kind]) this.#fit(true);

        const [x0] = this.#pos();
        if (this.#auto) {
            this.#stepAuto(dtMs, now, w, h);
        } else {
            this.#stepManual(dt, now, w, h);
        }
        if (this.#kind === 'strip') {
            // Chi xet khi nhan vat vua di chuyen: dung yen ma nguoi xem keo nen sang phong
            // khac thi phong dang xem la phong tren man hinh, khong phai phong cua nhan vat
            const room = this.#pos()[0] !== x0 ? this.roomIndex : this.#room;
            if (room !== this.#room) {
                this.#room = room;
                this.#onRoom(room);
            }
            this.#follow(dtMs);
        }

        const fps = this.#state === 'talk' ? TALK_FPS : WALK_FPS;
        const hold = this.#state === 'idle' ? IDLE_MS[this.#frame] : 1000 / fps;
        if (now - this.#frameAt >= hold) {
            this.#frameAt = now;
            this.#frame = (this.#frame + 1) % FRAMES[this.#state];
        }
        this.#draw();
    }

    #stepManual(dt, now, w, h) {
        const [x, y] = this.#pos();
        const moving = !this.#locked && this.#enabled() ? this.#held : [];
        const vx = (moving.includes('right') ? 1 : 0) - (moving.includes('left') ? 1 : 0);
        const vy = (moving.includes('down') ? 1 : 0) - (moving.includes('up') ? 1 : 0);

        if (vx || vy) {
            // Chuyen dong cheo khong duoc nhanh hon di thang
            const norm = vx && vy ? Math.SQRT1_2 : 1;
            const pxPerSec = SPEED * h * norm;
            this.#set(
                x + vx * pxPerSec * dt / w * 100,
                y + vy * pxPerSec * DEPTH_SPEED * dt / h * 100,
            );
            // Huong chon theo phim bam sau cung; cheo thi uu tien trai/phai
            const last = moving[moving.length - 1];
            this.#facing = (last === 'left' || last === 'right') ? last
                : vx ? (vx > 0 ? 'right' : 'left') : (vy > 0 ? 'down' : 'up');
            this.#setState(this.#facing, now);
            this.#checkReach();
        } else {
            // Dung lai: quay ve phia nguoi xem, dung nghi - hoac dung noi neu dang go chu
            const want = this.#speaking ? 'talk' : 'idle';
            if (this.#state !== want) {
                this.#facing = 'down';
                this.#setState(want, now);
            }
        }
    }

    #stepAuto(dtMs, now, w, h) {
        const a = this.#auto;
        const [x, y] = this.#pos();
        if (!a.from) {
            a.from = { x, y };
            const dxPx = (a.to.x - x) / 100 * w, dyPx = (a.to.y - y) / 100 * h;
            a.dist = Math.hypot(dxPx, dyPx);
            a.total = a.duration || (a.dist / (SPEED * h * a.speed)) * 1000;
        }
        a.elapsed += dtMs;
        const t = a.total > 0 ? Math.min(1, a.elapsed / a.total) : 1;
        // Khong kep vao dai san: vao cua la di LEN KHOI dai san
        this.#at[this.#kind] = { x: lerp(a.from.x, a.to.x, t), y: lerp(a.from.y, a.to.y, t) };

        const dx = (a.to.x - a.from.x) / 100 * w, dy = (a.to.y - a.from.y) / 100 * h;
        this.#facing = Math.abs(dx) > Math.abs(dy) * 1.2 ? (dx > 0 ? 'right' : 'left')
            : (dy < 0 ? 'up' : 'down');
        if (a.dist > 1) this.#setState(this.#facing, now);

        this.#shrink = lerp(1, a.shrink, t);
        // Mo dan o 40% cuoi quang duong
        this.#opacity = a.fade ? Math.min(1, Math.max(0, (1 - t) / 0.4)) : 1;

        if (t >= 1) {
            this.#auto = null;
            a.resolve(true);
        }
    }

    #setState(state, now) {
        if (state === this.#state) return;
        this.#state = state;
        this.#frame = 0;
        this.#frameAt = now;
    }

    /** Cham vach (cong): toi gan cua thi tu khoa phim va bao ben ngoai. */
    #checkReach() {
        const r = this.#reach;
        if (!r || this.#locked) return;
        const [x] = this.#pos();
        if (Math.abs(x - r.x) <= r.tol) {
            this.lock();
            r.onReach();
        }
    }

    #pos() {
        return [this.#at[this.#kind]?.x ?? 0, this.#at[this.#kind]?.y ?? 0];
    }

    #set(x, y) {
        const b = this.#bounds();
        this.#at[this.#kind] = {
            x: Math.min(b.x[1], Math.max(b.x[0], x)),
            y: Math.min(b.y[1], Math.max(b.y[0], y)),
        };
    }

    #bounds() {
        const p = this.#profile;
        const floor = p.floor();
        const { w, h } = this.#dims();
        if (this.#kind === 'strip') {
            // Khong co mep giua cac phong: chi dung o hai dau dai
            const half = p.height.near * h * ASPECT / 2 / w * 100;
            return { x: [half + 1, 100 * this.#rooms() - half - 1], y: [floor.top, floor.bottom] };
        }
        // Canh phu kin man hinh (cover), neo day giua: man hep thi mat hai ben.
        // Do tu kich thuoc that nen dung cho moi ti le man hinh, khong doan.
        const view = document.documentElement.clientWidth;
        const hidden = Math.max(0, (w - view) / 2) / w * 100;
        // Nua be ngang nhan vat o cho gan nhat (to nhat), % be ngang canh
        const half = p.height.near * h * ASPECT / 2 / w * 100;
        return {
            x: [hidden + half + 1, 100 - hidden - half - 1],
            y: [floor.top, floor.bottom],
        };
    }

    /** Doi ban cat / doi kich thuoc man hinh: dua lai vao trong san. */
    #fit(place = false) {
        if (!this.#scene || !this.#dims().w) return;
        const b = this.#bounds();
        if (place || !this.#at[this.#kind]) {
            // Lan dau: dung lech ve mot ben, tranh nut "Tiep" o giua day (phong)
            // va cho con duong toi cua (cong). Dai ngang: dung o dau phong dang xem.
            this.#at[this.#kind] = {
                x: this.#kind === 'strip'
                    ? (this.#index + this.#profile.start) * 100
                    : b.x[0] + (b.x[1] - b.x[0]) * this.#profile.start,
                y: (b.y[0] + b.y[1]) / 2,
            };
            this.#set(...this.#pos());
        } else if (!this.#auto) {
            const [x, y] = this.#pos();
            this.#set(x, y);
        }
        this.#draw();
    }

    #draw() {
        if (!this.#scene) return;
        const p = this.#profile;
        const floor = p.floor();
        const [x, y] = this.#pos();
        // Do sau 0 (sat cua/tuong) .. 1 (sat nguoi xem); ra ngoai dai san thi dung o 0
        const t = Math.min(1, Math.max(0, (y - floor.top) / (floor.bottom - floor.top)));
        const heightPct = lerp(p.height.far, p.height.near, t) * this.#shrink * 100;
        const s = this.#root.style;
        if (this.#kind === 'strip') {
            // Khung cuon la khung CUON: toa do tinh bang px trong noi dung cua no, nen
            // nhan vat tu troi theo nen khi cuon. Canh nen cua phong neo day khung.
            const { w, h, ch } = this.#dims();
            s.left = `${(x / 100 * w).toFixed(1)}px`;
            s.top = `${(ch - h + y / 100 * h).toFixed(1)}px`;
            s.height = `${(heightPct / 100 * h).toFixed(1)}px`;
            // Duoi 5: lop xem tranh (z-index 5) phai nam tren nhan vat
            s.zIndex = String(1 + Math.round(t * 3));
        } else {
            s.left = `${x.toFixed(2)}%`;
            s.top = `${y.toFixed(2)}%`;
            s.height = `${heightPct.toFixed(2)}%`;
            // Dung truoc thi nam sau mot nguoi dung sau: sap theo chieu sau
            s.zIndex = String(1 + Math.round(t * 10));
        }
        s.opacity = this.#opacity < 1 ? this.#opacity.toFixed(3) : '';

        if (this.#bubble?.isOpen) this.#placeBubble();
        const img = this.#pick();
        if (img === this.#shown) return;
        this.#shown?.classList.remove('is-on');
        img?.classList.add('is-on');
        this.#shown = img;
    }

    /* Frame can ve luc nay. Frame chua tai xong / bi hong thi dung tam frame khac da co
       (cung hoat anh, roi toi frame nao da tai duoc) de nhan vat khong bien mat. */
    #pick() {
        const ready = img => img?.complete && img.naturalWidth > 0;
        const want = this.#frames[this.#state]?.[this.#frame];
        if (ready(want)) return want;
        const same = this.#frames[this.#state]?.find(ready);
        if (same) return same;
        for (const list of Object.values(this.#frames)) {
            const any = list.find(ready);
            if (any) return any;
        }
        return want;
    }

    /** Duoi bong bong chi ve phia dau nhan vat; dung o nua trai man hinh thi bong bong
        mo ra ben phai va nguoc lai. Sat mep thi dich vao de khong tran ra ngoai. */
    #placeBubble() {
        const r = this.#root.getBoundingClientRect();
        const cx = r.left + r.width * HEAD_X;
        const vw = document.documentElement.clientWidth;
        const side = cx < vw / 2 ? 'left' : 'right';
        const bw = this.#bubble.width;
        const tip = side === 'left' ? 0.12 : 0.88;   // duoi nam o 12% / 88% be ngang bong bong
        const left = cx - tip * bw;
        const margin = 10;
        const clamped = Math.min(Math.max(left, margin), Math.max(margin, vw - bw - margin));
        // Duoi khong duoc chay ra sat goc bo tron cua bong bong
        const corner = 28;
        const tailX = Math.min(Math.max(cx - clamped, corner), bw - corner);
        this.#bubble.place(side, clamped - left, tailX);
    }
}
