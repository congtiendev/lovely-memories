/* Nhac nen. Chi bat dau khi nguoi doc bam mo cua - trinh duyet chi cho phat
   tieng sau mot cu bam that, khong the tu chay luc trang vua tai.
   Ban nhac da duoc cat bo 33s dao dau va chuan hoa cho dinh sat tran (xem
   ghi chu trong assets/audios/), nen o day cu mo het co. The <audio> van de
   preload="none": chi tai khi den luc phat, khong lam nang luc mo trang.

   Nhac nen chay xuyen suot ca cong, sanh lan cac phong ky niem. Co loi thuyet minh thi nhac
   chi HA NHO (duck), doc xong thi to tro lai - khong tat. Nut loa tat/bat duoc; cong/sanh va
   phong moi ben nho lua chon rieng.

   Phong co BAI RIENG (`tracks`, content.js ROOM_MUSIC): toi phong do thi bai do tu bat tu
   dau, khong theo lua chon tat nhac cua cac phong khac; roi phong thi bai ra dan va tra
   lai nhac cu, phat tiep dung cho dang do. Nut loa trong phong do bat/tat rieng bai do.
   Van chi mot the <audio>, doi `src` khi doi bai: iOS chi cho phat tieng tren the da
   tung play() trong mot cu bam, va the nay da duoc mo khoa tu luc mo cua. */
const FADE = 2600;        // vao nhe dan cho khop nhip cua dang mo
const LEAVE = 1200;       // ra nhe dan khi doi bai, hoac khi sang noi da tat nhac
const ROOM_DEFAULT = true;    // nhac nen trong phong luc dau: bat (thuyet minh thi ha nho, xem duck())
const DUCK = 0.16;        // am luong nhac nen khi co loi thuyet minh (khong bat duoc tren iOS: xem duck())
const LEVEL = 0.8;        // 80%: ban nhac da duoc chuan hoa sat tran nen mo het co thi hoi to so voi tieng thuyet minh va tieng nhan vat

/* Safari iOS khong cho dat `volume` cua <audio> (luon doc ra 1, ghi bi bo qua), nen o do
   am luong di qua mot GainNode cua Web Audio (xem #useGain). Do thu mot lan thay vi do
   user-agent. */
function volumeIsSettable(audio) {
    const before = audio.volume;
    audio.volume = 0.5;
    const ok = audio.volume === 0.5;
    audio.volume = before;
    return ok;
}

const VOLUME_KEY = 'lovely-memories:volume';   // am luong nguoi nghe chon, 0..1

/** Am luong da luu (mac dinh 1 = het muc LEVEL). Loi doc (che do rieng tu...) thi dung mac dinh. */
function savedVolume() {
    try {
        const v = parseFloat(localStorage.getItem(VOLUME_KEY));
        if (Number.isFinite(v)) return Math.min(1, Math.max(0, v));
    } catch { /* khong sao */ }
    return 1;
}

const MAX_THEMES = 60;   // gioi han so bai chung se do tim (tranh do vo han neu may chu tra 200 cho moi duong dan)

/** File nhac co that su ton tai khong. May chu tra trang HTML (200) cho duong dan khong co thi khong tinh. */
async function exists(src) {
    try {
        const res = await fetch(src, { method: 'HEAD' });
        return res.ok && /audio|octet-stream/.test(res.headers.get('content-type') ?? '');
    } catch {
        return false;
    }
}

export class Music {
    #audio;
    #button;
    #fade = null;
    #canFade = true;      // false: khong chinh duoc am luong (iOS truoc khi co #gain)
    #gain = null;         // iOS: GainNode thay cho audio.volume
    #started = false;     // da co cu bam that (start()): truoc do khong phat duoc gi
    #wanted = false;      // cong/sanh: nguoi doc co muon nghe khong (nut bat/tat)
    #roomWanted = ROOM_DEFAULT;   // trong phong ky niem: nhu tren
    #inRoom = false;
    #folder = null;       // phong dang dung (null: cong/sanh)
    #tracks;              // { [folder]: src } bai rieng cua tung phong
    #trackWanted = {};    // phong co bai rieng: nut loa bat/tat rieng, mac dinh bat
    #themes;              // danh sach bai chung, phat het bai nay den bai kia roi lap lai tu dau
    #themeIndex = 0;      // bai chung dang toi luot
    #prefetched = null;   // bai ke tiep da duoc tai san (tranh khoang lang luc doi bai)
    #playing;             // src dang nap trong the <audio>
    #themeAt = 0;         // giay dang phat cua bai chung luc doi sang bai rieng
    #run = 0;             // moi lan doi bai la mot luot; luot cu het hieu luc
    #swapping = false;    // dang cho bai cu ra het de doi bai
    #master = savedVolume();   // am luong nguoi nghe chon bang thanh keo (nhan voi LEVEL / DUCK)
    #ducked = false;      // dang co loi thuyet minh: nhac o muc DUCK

    /**
     * @param tracks { [folder]: src } - phong nao co nhac nen rieng
     * @param themePattern duong dan nhac chung co `{n}` (vd 'assets/audios/theme-{n}.mp3'): nhac cho cong,
     *        sanh va cac phong khong co bai rieng. Bai 1 la src cua the <audio>; bai 2, 3, 4... duoc DO TIM
     *        luc mo trang (HEAD toi khi gap file khong co) nen them nhac chi la tha file vao thu muc,
     *        khong sua code. Phat het bai nay sang bai ke tiep, het cuoi quay lai bai dau.
     */
    constructor({ audio, button, tracks = {}, themePattern = null }) {
        this.#audio = audio;
        this.#button = button;
        this.#tracks = tracks;
        this.#themes = [themePattern ? themePattern.replace('{n}', 1) : audio.getAttribute('src')];
        if (themePattern) this.#discover(themePattern);
        this.#playing = this.#theme;
        if (audio.getAttribute('src') !== this.#playing) audio.src = this.#playing;
        this.#audio.loop = this.#themes.length === 1;   // mot bai thi lap bai do; nhieu bai thi `ended` chuyen bai
        audio.addEventListener('ended', () => this.#nextTheme());
        audio.addEventListener('timeupdate', () => this.#prefetchNext());
        this.#canFade = volumeIsSettable(this.#audio);
        this.#audio.volume = 0;
        // Bam nut loa do components/volume.js lo (mo thanh am luong / tat tieng), khong phai o day
    }

    /** Am luong nguoi nghe chon, 0..1. */
    get volume() { return this.#master; }

    /** Muc ra loa khi binh thuong / khi dang co loi thuyet minh, da nhan voi am luong nguoi nghe chon. */
    get #level() { return LEVEL * this.#master; }
    get #duckLevel() { return DUCK * this.#master; }

    /** Nguoi nghe keo thanh am luong: doi ngay (khong ra dan dai: keo thanh la muon nghe thay lien). */
    setVolume(v) {
        this.#master = Math.min(1, Math.max(0, v));
        try { localStorage.setItem(VOLUME_KEY, String(this.#master)); } catch { /* khong sao */ }
        this.#sync();
        // Dang phat that thi doi ngay; dang doi bai / dang tat thi #play() se lay muc moi luc vao
        if (!this.#started || !this.#on || this.#swapping || this.#audio.paused) return;
        this.#fadeTo(this.#ducked ? this.#duckLevel : this.#level, 90);
    }

    /** Cu bam that dau tien: nhac vao dan. Goi lai o moi cu bam sau: neu lan truoc trinh
        duyet tu choi phat (ngon tay cham xuong chua duoc tinh la tuong tac...) ma nhac van
        dang bat thi thu phat lai, khong thi nut loa bao bat ma khong co tieng mai. */
    start() {
        if (this.#started) {
            if (this.#on && this.#audio.paused && !this.#swapping) this.#play();
            return;
        }
        this.#started = true;
        if (!this.#canFade) this.#useGain();   // dang trong cu bam: duoc phep tao AudioContext
        this.#wanted = true;
        this.#button.hidden = false;
        this.#apply();
    }

    /** Dang o phong ky niem nao (thu muc), hoac null neu o cong/sanh. */
    setRoom(folder) {
        folder ??= null;
        if (folder === this.#folder) return;
        this.#folder = folder;
        this.#inRoom = folder !== null;
        if (this.#started) this.#apply(LEAVE);
    }

    toggle() {
        if (this.#track) this.#trackWanted[this.#folder] = !this.#on;
        else if (this.#inRoom) this.#roomWanted = !this.#roomWanted;
        else this.#wanted = !this.#wanted;
        this.#apply(0);
    }

    /* Do tim bai 2, 3, 4... theo mau duong dan: dung o file dau tien khong co. Chay nen, khong chan gi:
       bai 1 dang phat / sap phat, toi luc het bai thi danh sach da du. Bai moi them vao cuoi danh sach
       ngay khi tim thay, nen ke ca khi nguoi nghe dang nghe bai 1 thi bai 3 van duoc xep vao luot. */
    async #discover(pattern) {
        for (let n = 2; n <= MAX_THEMES; n++) {
            const src = pattern.replace('{n}', n);
            if (!(await exists(src))) break;
            this.#themes.push(src);
            // Co tu 2 bai tro len: het bai chung thi chuyen bai, khong lap mot bai. Bai rieng cua phong
            // (dang phat luc nay) van phai lap.
            if (this.#playing === this.#theme) this.#audio.loop = false;
        }
    }

    /** Bai chung dang toi luot. */
    get #theme() { return this.#themes[this.#themeIndex]; }

    get #track() { return this.#tracks[this.#folder] ?? null; }

    get #on() {
        if (this.#track) return this.#trackWanted[this.#folder] ?? true;
        return this.#inRoom ? this.#roomWanted : this.#wanted;
    }

    /** Bat/tat theo cho dang dung, doi bai neu can. `outMs`: tat (hoac roi bai dang phat
        de doi bai) thi ra dan trong chung do (0 = ngay). */
    #apply(outMs = 0) {
        this.#sync();
        const run = ++this.#run;
        this.#swapping = false;   // luot doi bai cu (neu con) da bi luot nay thay
        const want = this.#track ?? this.#theme;
        if (want !== this.#playing) {
            // Doi bai: cho bai dang phat ra het roi moi nap bai moi, khong thi cat cut
            const swap = () => {
                if (run !== this.#run) return;   // doi phong tiep giua luc dang ra
                this.#swapping = false;
                this.#swap(want);
                if (this.#on) this.#play();
            };
            if (outMs && this.#canFade && !this.#audio.paused) {
                this.#swapping = true;
                this.#fadeTo(0, outMs, swap);
            } else {
                clearInterval(this.#fade);
                this.#swapping = true;
                swap();
            }
            return;
        }
        if (this.#on) {
            this.#play();
        } else if (outMs && this.#canFade && !this.#audio.paused) {
            this.#fadeTo(0, outMs, () => this.#audio.pause());
        } else {
            clearInterval(this.#fade);
            this.#audio.pause();
            this.#vol = 0;
        }
    }

    /* iOS: noi the <audio> qua mot GainNode de van ha nho / to lai duoc (audio.volume bi bo
       qua). Phai tao trong cu bam that, khong thi AudioContext nam o trang thai `suspended`
       va nhac di qua no se cam lang. iOS tam dung context khi bi ngat (cuoc goi, khoa man
       hinh...): cu cham sau la danh thuc lai. Khong tao duoc thi giu cach cu (tam dung nhac
       trong luc thuyet minh). */
    #useGain() {
        try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return;
            const ctx = new Ctx();
            const gain = ctx.createGain();
            gain.gain.value = 0;
            ctx.createMediaElementSource(this.#audio).connect(gain).connect(ctx.destination);
            ctx.resume?.();
            const wake = () => { if (ctx.state !== 'running') ctx.resume?.(); };
            // click chu khong pointerdown: ngon tay phai nhac len moi duoc tinh la tuong tac
            addEventListener('click', wake, true);
            addEventListener('keydown', wake, true);
            this.#gain = gain;
            this.#canFade = true;
        } catch { /* trinh duyet khong cho: giu nguyen audio.volume */ }
    }

    /* Am luong dang ra loa: qua GainNode neu co (iOS), khong thi audio.volume */
    get #vol() { return this.#gain ? this.#gain.gain.value : this.#audio.volume; }
    set #vol(v) {
        if (this.#gain) this.#gain.gain.value = v;
        else this.#audio.volume = v;
    }

    /** Nap bai khac vao the <audio>. Bai rieng luon tu dau; bai chung phat tiep cho cu. */
    #swap(src) {
        const audio = this.#audio;
        if (this.#playing === this.#theme) this.#themeAt = audio.currentTime;
        audio.pause();
        this.#vol = 0;
        audio.src = src;
        this.#playing = src;
        // Bai rieng cua phong lap lai; bai chung chay het roi chuyen bai (xem #nextTheme)
        audio.loop = src !== this.#theme || this.#themes.length === 1;
        if (src === this.#theme && this.#themeAt) {
            const at = this.#themeAt;
            // Dat currentTime truoc khi co metadata thi bi bo qua
            audio.addEventListener('loadedmetadata', () => { audio.currentTime = at; }, { once: true });
        }
    }

    /* Bai chung phat het: sang bai ke tiep, het cuoi thi quay lai bai dau. Bai rieng cua phong thi
       `loop` nen khong bao gio toi day. */
    #nextTheme() {
        if (this.#audio.loop || this.#playing !== this.#theme || this.#swapping) return;
        this.#themeIndex = (this.#themeIndex + 1) % this.#themes.length;
        this.#themeAt = 0;
        const audio = this.#audio;
        audio.src = this.#theme;
        this.#playing = this.#theme;
        if (this.#started && this.#on) this.#play();
    }

    /* Con ~20s thi bai chung het: tai san bai ke tiep vao bo nho dem, de luc doi bai khong co khoang lang
       (bai nang vai MB, tai luc do thi nghe thay chung). Chi lam mot lan cho moi bai. */
    #prefetchNext() {
        const audio = this.#audio;
        if (this.#themes.length < 2 || this.#playing !== this.#theme || !audio.duration) return;
        if (audio.duration - audio.currentTime > 20) return;
        const next = this.#themes[(this.#themeIndex + 1) % this.#themes.length];
        if (this.#prefetched === next) return;
        this.#prefetched = next;
        fetch(next).catch(() => {});
    }

    #play() {
        // Trinh duyet co the tu choi (chua co cu bam nao duoc tinh la tuong tac,
        // hoac may dang o che do tiet kiem). Tu choi thi im lang, lan bam sau
        // nguoi doc van bat lai duoc bang nut loa.
        if (this.#ducked && !this.#canFade) return;   // khong ha nho duoc: dang thuyet minh thi nhac nghi, duck(false) se phat
        const p = this.#audio.play();
        if (p && p.catch) p.catch(() => {});
        this.#fadeTo(this.#ducked ? this.#duckLevel : this.#level);   // vua doi bai giua luc dang thuyet minh: vao nho
    }

    /* Vao/ra bang dong ho chu khong bang transition: `volume` khong phai thuoc
       tinh CSS nen khong co transition nao chay duoc cho no. */
    #fadeTo(target, ms = FADE, done = () => {}) {
        clearInterval(this.#fade);
        if (!this.#canFade) return;   // khong chinh duoc am luong: nhac vao het co ngay
        const step = (target - this.#vol) / (ms / 50);
        this.#fade = setInterval(() => {
            const v = this.#vol + step;
            if ((step > 0 && v >= target) || (step < 0 && v <= target) || step === 0) {
                this.#vol = target;
                clearInterval(this.#fade);
                done();
                return;
            }
            this.#vol = Math.min(1, Math.max(0, v));
        }, 50);
    }

    /**
     * Ha nhac nen cho loi thuyet minh nghe ro (on = true), tra lai khi xong (on = false).
     * Chi khi khong chinh duoc am luong (iOS ma khong tao duoc GainNode) moi phai tam dung
     * han nhac trong luc doc.
     */
    duck(on) {
        this.#ducked = on;
        // Dang ra bai cu de doi bai: dung cat ngang (bai moi se tu vao dung muc, xem #play)
        if (!this.#started || !this.#on || this.#swapping) return;
        if (this.#canFade) {
            this.#fadeTo(on ? this.#duckLevel : this.#level, 700);
        } else if (on) {
            this.#audio.pause();
        } else {
            const p = this.#audio.play();
            if (p && p.catch) p.catch(() => {});
        }
    }

    #sync() {
        // Keo thanh ve 0 cung nhu tat tieng: bieu tuong loa gach cheo
        this.#button.classList.toggle('is-off', !this.#on || this.#master === 0);
        this.#button.setAttribute('aria-pressed', String(this.#on));
        this.#button.setAttribute('aria-label', this.#on ? 'Tắt nhạc nền' : 'Bật nhạc nền');
    }
}
