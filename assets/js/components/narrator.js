/* Nut "Thuyet minh": bam thi nhan vat thuyet minh CAN PHONG DANG XEM - phat loi long tieng
   (neu phong co file audio) va noi cung noi dung trong bong bong thoai, tung cau mot (moi
   cau mot bong bong, xem Bubble). Noi dung theo phong nam trong content.js (NARRATION);
   phong nao chua co thi nut tu an. Doi phong giua chung thi dung lai: loi thuyet minh cua
   phong truoc khong duoc tran sang phong sau.

   Khop chu voi tieng: file audio chi la mot doan lien, khong co moc thoi gian tung cau, nen
   thoi gian moi cau lay tu `starts` trong content.js (do tu cho nghi that trong audio) hoac,
   neu khong co, chia theo so chu cua cau do trong tong do dai audio. Moi cau bat dau khi
   audio chay toi moc cua no va go het chu trong phan thoi gian cua cau. */
const MIN_TYPING = 800;      // ms: cau qua ngan van phai go cham du de nhin thay
const THINKING = 350;       // ms: ba cham "dang go" truoc khi chu hien (SPEECH.thinking trong config.js)
const LEAD = 200;            // ms: do tre cua vong cho (50ms/lan) va khoi dong bong bong; bu de chu dau trung dung luc tieng bat dau
const HOLD = 450;            // ms: sau khi go xong con giu bong bong mot nhip cho kip doc cuoi cau
const BUBBLE_OVERHEAD = HOLD + 260 + THINKING;   // + thu lai (SPEECH.leave) + ba cham "dang go" (SPEECH.thinking): moi cau ton them tung nay ngoai thoi gian go
const METADATA_TIMEOUT = 4000;

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
// File wav rong (0 mau): chi de goi play() mot lan trong cu bam, xem prime()
const SILENCE = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';

export class Narrator {
    #button;
    #label;
    #character;
    #music;
    #rooms;
    #onDone;
    #audio = new Audio();
    #folder = null;
    #active = false;
    #primed = false;    // the audio da tung play() trong mot cu bam (iOS moi cho phat ve sau)
    #voiced = false;    // luot dang chay co tieng (false: trinh duyet chan, chi go chu)
    #run = 0;           // moi lan phat / dung la mot luot; luot cu het hieu luc
    #fetching = new Map();   // url -> Promise: dang tai ca file loi doc ve may
    #local = new Map();      // url -> blob: URL cua file da tai xong, phat ngay khong phai cho mang

    /**
     * @param rooms { [folder]: { audio?: string, lines: string[] } }
     * @param music ha nhac nen khi co loi doc (xem Music.duck)
     * @param onDone(folder) goi khi noi HET loi cua mot phong (bam nut hay tu thuyet minh deu
     *        vay), khong goi khi bi dung giua chung
     */
    constructor({ button, character, rooms, music, onDone = () => {} }) {
        this.#button = button;
        this.#label = button.querySelector('.narrate__label');
        this.#character = character;
        this.#rooms = rooms;
        this.#music = music;
        this.#onDone = onDone;
        this.#audio.preload = 'none';
        button.addEventListener('click', event => {
            event.stopPropagation();   // khong de noi len .room thanh lenh lat sang phong khac
            // Dang go chu ma KHONG co tieng vi phong tu doc luc chua co cu bam nao (trinh duyet
            // chan): bam nut la muon nghe, nen doc lai tu dau kem tieng chu khong dung
            const muted = this.#active && !this.#voiced && !!this.#rooms[this.#folder]?.audio;
            if (this.#active && !muted) {
                this.stop();
                return;
            }
            this.stop();
            this.play();
        });
        this.#sync();
    }

    /**
     * Tai TRON file loi doc cua phong `folder` ve may truoc khi doc. Phat thang tu mang thi mang
     * cham se khung giua cau: tieng dung ma chu trong bong bong van chay theo thoi gian da tinh,
     * lech nhau. Tai xong thi #startVoice dung ban trong may. Loi mang thi thoi, phat tu mang.
     */
    preload(folder) {
        const url = this.#rooms[folder]?.audio;
        if (!url) return Promise.resolve();
        if (!this.#fetching.has(url)) {
            this.#fetching.set(url, fetch(url)
                .then(res => (res.ok ? res.blob() : null))
                .then(blob => { if (blob) this.#local.set(url, URL.createObjectURL(blob)); })
                .catch(() => {}));
        }
        return this.#fetching.get(url);
    }

    /** Phong dang xem doi (hoac roi khoi phong: null). Chi hien nut khi phong co loi. */
    setRoom(folder) {
        if (folder === this.#folder) return;
        this.stop();
        this.#folder = folder;
        this.#sync();
    }

    /**
     * Goi NGAY trong cu bam ("Truoc"/"Tiep") khi se thuyet minh SAU mot luc (nhan vat con di
     * bo, tam bien chuyen canh con che): iOS chi cho the audio phat tieng ve sau neu no da
     * tung play() trong mot cu bam. Phat mot doan rong, tat tieng, roi dung.
     */
    prime() {
        if (this.#primed || this.#active) return;
        const audio = this.#audio;
        audio.muted = true;
        audio.src = SILENCE;
        // Chi coi la da mo khoa khi phat thu THAT SU duoc: cu cham ma trinh duyet khong tinh la
        // tuong tac (pointerdown cua ngon tay...) thi lan sau con thu lai
        audio.play().then(() => { this.#primed = true; audio.pause(); }, () => {})
            .finally(() => { audio.muted = false; });
    }

    /** Thuyet minh phong dang dat. Tra ve true neu noi het, false neu bi dung / doi phong giua chung. */
    async play() {
        const room = this.#rooms[this.#folder];
        if (!room?.lines?.length) return false;
        const run = ++this.#run;
        const alive = () => run === this.#run;
        this.#active = true;
        this.#sync();

        // play() phai goi NGAY trong luc xu ly cu bam (iOS khong cho phat sau khi da await),
        // nen bat dau phat truoc roi moi cho biet do dai.
        const voice = room.audio ? await this.#startVoice(room.audio, run) : null;
        if (!alive()) return false;
        this.#voiced = !!voice;
        if (voice) {
            this.#primed = true;   // da phat duoc tieng: the audio da mo khoa
            this.#music?.duck(true);
        }

        // Moc bat dau tung cau: do san tu cho nghi that trong audio (room.starts) thi dung,
        // khong thi chia theo so chu (sai lech vi moi cau doc nhanh cham khac nhau).
        const starts = voice && room.starts?.length === room.lines.length ? room.starts : null;
        const total = room.lines.reduce((sum, line) => sum + line.length, 0);
        let elapsed = 0;   // giay: moc bat dau cua cau dang xet theo cach chia theo so chu
        for (let i = 0; i < room.lines.length; i++) {
            const line = room.lines[i];
            let at = elapsed, span = voice ? voice.duration * line.length / total : 0;
            if (starts) {
                // Bong bong ba cham hien truoc chu mot nhip (SPEECH.thinking): bat dau som chung do
                // de chu dau tien trung dung luc tieng bat dau
                at = Math.max(0, starts[i] - (THINKING + LEAD) / 1000);
                span = (i + 1 < starts.length ? starts[i + 1] : voice.duration) - starts[i];
            }
            if (voice) await this.#until(at, run);
            if (!alive()) return false;
            const done = await this.#character.say(line, voice
                ? { typingMs: Math.max(MIN_TYPING, span * 1000 - BUBBLE_OVERHEAD), hold: HOLD }
                : {});
            if (!alive() || !done) return false;
            elapsed += span;
        }
        // Chu xong thi cho not tieng (neu con), roi tra lai nhac nen
        if (voice) await this.#until(Infinity, run);
        if (!alive()) return false;
        this.#finish();
        this.#onDone(this.#folder);
        return true;
    }

    /** Dang thuyet minh (ke ca luc chi go chu, khong co tieng). */
    get isActive() { return this.#active; }

    /** Luot dang chay co phat duoc tieng khong. */
    get isVoiced() { return this.#active && this.#voiced; }

    stop() {
        this.#run++;
        if (!this.#active) return;
        this.#character.shutUp();
        this.#finish();
    }

    #finish() {
        this.#active = false;
        this.#audio.pause();
        this.#music?.duck(false);
        this.#sync();
    }

    /** Phat file long tieng tu dau. Tra ve { duration (giay) } hoac null neu khong phat duoc. */
    async #startVoice(url, run) {
        const audio = this.#audio;
        audio.src = this.#local.get(url) ?? url;   // da tai ve may (preload) thi khong phai cho mang
        audio.currentTime = 0;
        const started = audio.play().then(() => true, () => false);
        await Promise.race([
            new Promise(resolve => {
                if (audio.readyState >= 1) resolve();
                else audio.addEventListener('loadedmetadata', resolve, { once: true });
            }),
            // Trinh duyet chan phat thi metadata co the khong bao gio ve: thoi cho, go chu ngay
            started.then(ok => ok ? new Promise(() => {}) : undefined),
            wait(METADATA_TIMEOUT),
        ]);
        const ok = await started;
        // Luot nay da bi luot moi thay (bam lai nut, cu bam dau tien doc lai co tieng...): the
        // audio gio la cua luot moi, dung dung vao - pause() o day se cat ngang tieng cua no
        if (run !== this.#run) return null;
        if (!ok || !Number.isFinite(audio.duration)) {
            audio.pause();
            return null;   // trinh duyet chan phat / file loi: chi go chu, khong co tieng
        }
        return { duration: audio.duration };
    }

    /** Cho audio chay toi giay `t` (hoac toi het bai neu t = Infinity); dung lai neu bi huy. */
    async #until(t, run) {
        const audio = this.#audio;
        while (run === this.#run && !audio.ended && !audio.paused && audio.currentTime < t) {
            await wait(50);
        }
    }

    #sync() {
        const has = !!this.#rooms[this.#folder]?.lines?.length;
        this.#button.hidden = !has;
        this.#button.setAttribute('aria-pressed', String(this.#active));
        this.#button.classList.toggle('is-playing', this.#active);
        this.#label.textContent = this.#active ? 'Dừng' : 'Thuyết minh';
    }
}
