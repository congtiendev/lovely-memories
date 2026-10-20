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
const LEVEL = 1;          // het co - ban nhac da duoc chuan hoa sat tran khi cat

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
    #theme;               // bai chung (src goc cua the <audio>)
    #playing;             // src dang nap trong the <audio>
    #themeAt = 0;         // giay dang phat cua bai chung luc doi sang bai rieng
    #run = 0;             // moi lan doi bai la mot luot; luot cu het hieu luc
    #swapping = false;    // dang cho bai cu ra het de doi bai
    #ducked = false;      // dang co loi thuyet minh: nhac o muc DUCK

    /** @param tracks { [folder]: src } - phong nao co nhac nen rieng */
    constructor({ audio, button, tracks = {} }) {
        this.#audio = audio;
        this.#button = button;
        this.#tracks = tracks;
        this.#theme = audio.getAttribute('src');
        this.#playing = this.#theme;
        this.#audio.loop = true;
        this.#canFade = volumeIsSettable(this.#audio);
        this.#audio.volume = 0;

        this.#button.addEventListener('click', () => this.toggle());
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
        if (src === this.#theme && this.#themeAt) {
            const at = this.#themeAt;
            // Dat currentTime truoc khi co metadata thi bi bo qua
            audio.addEventListener('loadedmetadata', () => { audio.currentTime = at; }, { once: true });
        }
    }

    #play() {
        // Trinh duyet co the tu choi (chua co cu bam nao duoc tinh la tuong tac,
        // hoac may dang o che do tiet kiem). Tu choi thi im lang, lan bam sau
        // nguoi doc van bat lai duoc bang nut loa.
        if (this.#ducked && !this.#canFade) return;   // khong ha nho duoc: dang thuyet minh thi nhac nghi, duck(false) se phat
        const p = this.#audio.play();
        if (p && p.catch) p.catch(() => {});
        this.#fadeTo(this.#ducked ? DUCK : LEVEL);   // vua doi bai giua luc dang thuyet minh: vao nho
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
            this.#fadeTo(on ? DUCK : LEVEL, 700);
        } else if (on) {
            this.#audio.pause();
        } else {
            const p = this.#audio.play();
            if (p && p.catch) p.catch(() => {});
        }
    }

    #sync() {
        this.#button.classList.toggle('is-off', !this.#on);
        this.#button.setAttribute('aria-pressed', String(this.#on));
        this.#button.setAttribute('aria-label', this.#on ? 'Tắt nhạc nền' : 'Bật nhạc nền');
    }
}
