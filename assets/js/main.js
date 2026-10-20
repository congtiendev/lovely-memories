import { TIMING, SPEECH, calm } from './config.js';
import { Router, BASE_ROUTES } from './router.js';
import { MESSAGE, ART_LABELS, TOUR, GREETING, GREETING_AUDIO, LETS_GO, NARRATION, INVITE, ROOM_MUSIC, LISTEN } from './content.js';
import { CHAPTERS } from './chapters.js';
import { gapLabel, dateLabel } from './format.js';
import { Doorway } from './components/doorway.js';
import { Flight } from './components/flight.js';
import { Letter } from './components/letter.js';
import { Interlude } from './components/interlude.js';
import { Timeline } from './components/timeline.js';
import { buildGallery } from './components/gallery.js';
import { loaded } from './components/room.js';
import { Modes } from './components/strip.js';
import { Music } from './components/music.js';
import { Tour } from './components/tour.js';
import { Character } from './components/character.js';
import { Narrator } from './components/narrator.js';
import { Invite } from './components/invite.js';
import { Listen, autoplayAllowed } from './components/listen.js';

const doorway = new Doorway(document.querySelector('.doorway'));
const letter = new Letter({
    element: document.querySelector('.letter'),
    paragraphs: MESSAGE,
});
const interlude = new Interlude(document.querySelector('.interlude'));
/* Nhac nen: chi duoc phep chay sau mot cu bam that, nen cho den luc mo cua */
const music = new Music({
    audio: document.querySelector('.music'),
    button: document.querySelector('.sound'),
    tracks: ROOM_MUSIC,   // phong co bai rieng: toi la tu bat
});

/* Moi ky niem mot canh phong, dung tu thu muc memories/. Ten thu muc lam luon
   ten man hinh va dia chi, nen them ky niem khong phai sua gi o day. */
const gallery = buildGallery({
    container: document.querySelector('.rooms'),
    chapters: CHAPTERS,
    labels: ART_LABELS,
});
const folders = gallery.map(({ chapter }) => chapter.folder);
const roomOf = new Map(gallery.map(({ chapter, room }) => [chapter.folder, room]));
const elementOf = new Map(gallery.map(({ chapter, element }) => [chapter.folder, element]));

const router = new Router({
    ...BASE_ROUTES,
    ...Object.fromEntries(folders.map(f => [f, `#/${f}`])),
});
const timeline = new Timeline({
    element: document.querySelector('.timeline'),
    chapters: folders,
    onPick: route => router.go(route),
});
/* Hai che do xem: trinh chieu (bam "Tiep") va cuon ngang (noi lien cac phong).
   Cuon toi phong nao thi dia chi doi toi do, nen moi ky niem van mot dia chi. */
const modes = new Modes({
    element: document.querySelector('.mode'),
    rooms: document.querySelector('.rooms'),
    folders,
    getCurrent: () => current,
    onScrollTo: folder => reachInStrip(folder),
    onChange: () => reshowCurrent(),
    onTour: () => tour.start(),
});

/* Gian phong khong co menu, khong co chu huong dan nao san tren man hinh - lan
   dau vao phong thi phai co ai do chi cho biet bam vao dau. Chi chay mot lan;
   muon xem lai thi co dong cuoi trong bang chon che do. */
const tour = new Tour({ element: document.querySelector('.tour'), steps: TOUR });

/* ---------- NHAN VAT + CUA ----------
   Nhan vat di lai bang phim mui ten / WASD. O cong, toi gan cua thi cua tu mo,
   nhan vat tu buoc vao trong, nho dan, roi moi chuyen canh sang sanh. O cac
   phong thi no di theo nguoi xem tu phong nay sang phong khac. Chi nhan phim
   khi khong co lop phu nao dang chiem man hinh. */
const gateStage = document.querySelector('.stage--gate');
const DOOR_X = 49.9;       // tam o cua, % be ngang canh = --door-l + --door-w / 2 (tokens.css)
const DOOR_NEAR = 4.5;     // cach tam cua toi da bao nhieu % thi cua tu mo
const DOOR_FOOT = 95.6;    // chan nhan vat khi dung truoc cua (nguong cua o 94.6%)
const DOOR_INSIDE = 85;    // diem cuoi khi buoc vao trong cua
let entering = false;      // dang di qua cua: khoa phim, bo qua cu bam them
let entryRun = 0;          // moi lan vao cua / huy la mot luot; luot cu het hieu luc
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const roomsEl = document.querySelector('.rooms');
const character = new Character({
    onCamera: () => modes.freeze(),
    // Dai ngang: nhan vat buoc qua mep phong thi phong dang xem doi NGAY, khong doi nen cuon
    // xong (onScrollTo cho cuon dung han 140ms) - bam "Thuyet minh" luc nen con truot theo
    // thi van doc dung phong nhan vat dang dung
    onRoom: index => {
        if (modes.isStrip) reachInStrip(folders[index], { seat: false });
    },
    enabled: () => {
        if (current === 'gate') return !entering;
        return roomOf.has(current)
            && !document.querySelector('.room.art-open')
            && !timeline.isOpen
            && !tour.isOpen
            && !invite.isOpen
            && !document.querySelector('.mode.is-open');
    },
});
/* Nut "Thuyet minh": nhan vat doc loi cua phong dang xem (content.js NARRATION). Cau chao o
   cong cung di qua day ('gate') de tieng va chu khop nhau; nut thi chi hien trong phong
   (.in-rooms .narrate trong narrate.css), o cong khong co. */
const narrator = new Narrator({
    button: document.querySelector('.narrate'),
    character,
    music,
    rooms: { ...NARRATION, gate: { audio: GREETING_AUDIO, lines: [GREETING] } },
    onDone: folder => {
        if (!letters.has(folder)) return;
        setTimeout(() => openInvite(folder), INVITE_AFTER);   // de bong bong cuoi kip thu lai
    },
});

/* ---------- CHO TAI XONG ROI MOI NOI ----------
   Mang cham thi nhan vat, canh va file loi doc ve sau cau noi: bong bong hien ra khi chua thay
   nhan vat dau, tranh dang duoc ke chua hien, tieng khung giua cau. Nen truoc moi lan tu noi
   (chao o cong, tu thuyet minh khi toi phong) cho DUNG nhung thu lan noi do can - khong cho
   ca trang: anh cua moi phong deu nam san trong trang, cho het la cho tai hang tram MB.
   Mang hong hay qua cham thi toi da LOAD_BUDGET roi cu noi. */
const LOAD_BUDGET = 12000;

function readyToSpeak(folder) {
    const parts = [character.ready(), narrator.preload(folder), document.fonts?.ready];
    if (folder === 'gate') {
        parts.push(...[...document.querySelectorAll('.stage--gate img, .doorway img')].map(loaded));
    } else {
        parts.push(roomOf.get(folder)?.ready());
    }
    return Promise.race([Promise.all(parts), wait(LOAD_BUDGET)]);
}

/* ---------- THU MOI ----------
   Phong co thu-moi.json (CHAPTERS[].letter): thuyet minh xong thi la thu roi tu tren xuong
   va but bat dau viet (components/invite.js). Doc xong mot lan thi to thu duoc treo len
   tuong, bam vao de mo lai. */
const INVITE_AFTER = 500;   // ms tu luc thuyet minh xong toi luc thu bat dau roi
const letters = new Map(CHAPTERS.filter(c => c.letter).map(c => [c.folder, c.letter]));
const invite = new Invite({ texts: INVITE });

function openInvite(folder) {
    // Da di phong khac, hoac dang co lop khac chiem man hinh: thoi
    if (current !== folder || invite.isOpen || tour.isOpen || roomOf.get(folder)?.isViewingArt) return;
    narrator.stop();
    invite.open(letters.get(folder), { key: folder });
    roomOf.get(folder).markInvited();
}

/* O cong: chao xong thi hoi "Chung ta bat dau nhe?" kem nut OK; bam OK thi nhan vat
   di mo cua va vao. Chi lam mot lan moi lan mo trang, vao lai cong thi khong nhac lai
   (van tu di toi cua duoc, hoac bam vao cua). Di toi cua giua chung thi bo het. */
let greeted = false;
async function greet() {
    if (greeted) return;
    greeted = true;
    await wait(SPEECH.startDelay);
    const here = () => current === 'gate' && !entering;
    if (!here()) return;
    // Mang cham (trang that tren GitHub Pages): bong bong khong duoc hien truoc nhan vat
    await readyToSpeak('gate');
    if (!here()) return;

    // Trang vua mo, chua co cu bam nao: trinh duyet chan tieng nen cau chao chi co chu.
    // Cu bam / phim dau tien ma nhan vat con dang chao (khong tieng) thi chao lai tu dau,
    // lan nay co tieng. Phai mo khoa the audio NGAY trong cu bam (iOS), roi moi phat lai.
    let again = false;
    const retry = event => {
        if (!here() || !narrator.isActive || narrator.isVoiced) return;
        if (event.target.closest?.('.doorway')) return;   // bam cua: vao luon, khong chao lai
        // Chi mot lan: giu phim mui ten thi keydown ban lien tuc, moi lan lai cat ngang loi chao
        removeEventListener('pointerdown', retry);
        removeEventListener('keydown', retry);
        again = true;
        narrator.stop();
        narrator.prime();
    };
    addEventListener('pointerdown', retry);
    addEventListener('keydown', retry);
    let done;
    do {
        again = false;
        done = await narrator.play();
    } while (!done && again && here());
    removeEventListener('pointerdown', retry);
    removeEventListener('keydown', retry);

    if (!done || !here()) return;
    if (await character.say(LETS_GO.text, { action: LETS_GO.button }) && here()) enterThroughDoor();
}

/** Dua nhan vat vao man hinh dang xem: san cong, hoac phong; sanh thi cat di. */
function seatCharacter(route) {
    if (elementOf.has(route) && modes.isStrip) {
        // Dai ngang: mot nhan vat cho ca dai, khong gan vao phong nao
        character.mount(roomsEl, 'strip', { index: folders.indexOf(route) });
    } else if (elementOf.has(route)) {
        character.mount(elementOf.get(route).querySelector('.room__scene'), 'room');
    } else if (route === 'gate') {
        character.mount(gateStage, 'gate', {
            reach: { x: DOOR_X, tol: DOOR_NEAR, onReach: enterThroughDoor },
        });
        greet();
    } else {
        character.unmount();
    }
}

const flight = new Flight({
    hall: document.querySelector('.stage--hall'),
    onArrive: () => {
        letter.play();
        roomOf.get(folders[0])?.warmup();   // con ca doan doc loi nhan de anh kip ve
    },
});

/* Mo thang bang URL (F5 giua chung, hoac gui link mot ky niem) thi khong di qua
   cu bam mo cua, ma trinh duyet lai chan moi tieng dong cho toi khi co tuong tac
   that. Nen o cac man hinh do, cham dau tien vao trang la luc nhac vao. */
addEventListener('keydown', event => {
    // Chi dan cho nguoi dung phim: bam phim di chuyen lan dau thi an dong huong dan
    if (current === 'gate' && /^(Arrow(Left|Right|Up|Down)|Key[WASD])$/.test(event.code)) {
        document.body.classList.add('gate-moved');
    }
});

/* Loi thuyet minh tu doc SAU cu bam (canh hien xong, cuon dung...), ma trinh duyet chi cho
   phat tieng sau mot cu bam that, va iOS con doi chinh the audio do da tung play() trong mot
   cu bam. Nen cu bam / phim nao cung mo khoa (mo xong roi thi prime() khong lam gi nua).
   Nghe `click` chu khong nghe `pointerdown`: ngon tay cham xuong chua duoc tinh la tuong tac,
   phai nhac len (touchend / click) moi duoc. Nghe o pha capture de nut nao chan noi bot
   (stopPropagation) cung khong lot.
   Phong vua tu doc luc trang chua co cu bam nao (mo link, F5) thi bi chan tieng, chi go chu:
   cu bam dau tien doc lai tu dau, lan nay co tieng - nhu cau chao o cong (greet). Nut
   "Thuyet minh" tu lo truong hop do (Narrator). */
let interacted = false;   // du phong cho trinh duyet chua co navigator.userActivation
const hasInteracted = () => navigator.userActivation?.hasBeenActive ?? interacted;

function unlockVoice(event) {
    interacted = true;
    if (event.target.closest?.('.narrate') || event.target.closest?.('.listen')) return;
    if (roomOf.has(current) && narrator.isActive && !narrator.isVoiced && NARRATION[current]?.audio) {
        narrator.stop();
        narrator.play();   // goi ngay trong cu bam: the audio duoc phep phat va mo khoa luon
        return;
    }
    narrator.prime();
}
addEventListener('click', unlockVoice, true);
addEventListener('keydown', unlockVoice, true);

/* F5 / mo link vao thang mot phong hay sanh: chua co cu bam nao nen trinh duyet chan tieng.
   Toi luc le ra phai thuyet minh (hoac ngay khi vao sanh) thi moi nguoi xem cham mot cai -
   cu cham do bat nhac va doc thuyet minh tu dau, co tieng. Xem components/listen.js. */
const listen = new Listen(LISTEN);
listen.onTap(() => {
    music.start();
    if (roomOf.has(current) && NARRATION[current]) {
        narrator.stop();
        narrator.play();   // dong bo trong cu cham: duoc phep phat tieng
    }
});

/** Can moi cham khong: chua co cu bam nao VA trinh duyet khong cho tu phat tieng. Trinh
    duyet cho tu phat (da cho phep trang nay, hoac hay nghe o day) thi nhac vao luon, khong
    phai doi cu bam nao. */
async function needsTap() {
    if (hasInteracted()) return false;
    if (!(await autoplayAllowed())) return true;
    music.start();
    return false;
}

let armed = false;
function armMusic() {
    if (armed) return;
    armed = true;
    /* Moi cu bam deu goi start(): lan dau la bat nhac, cac lan sau chi thu phat lai neu lan
       truoc trinh duyet tu choi. Nghe `click` (pha capture) chu khong nghe `pointerdown`: tren
       dien thoai cham ngon tay xuong chua duoc tinh la tuong tac, play() se bi chan. */
    const on = () => music.start();
    document.addEventListener('click', on, true);
    document.addEventListener('keydown', on, true);
}

let hop = 0;             // moi lan doi man hinh la mot luot; luot cu het hieu luc
let current = null;      // man hinh dang mo, de biet dang di tien hay lui
// Khai bao o day chu khong canh ham dung no: router.start() ben duoi chay restoreChapter ngay
// luc nap trang, truoc khi toi dong khai bao o phia sau
const NARRATE_AFTER = 1900;   // ms: nhan vat hien sau 1200ms + 600ms mo dan (character.css)
const NARRATE_STRIP = 700;    // ms: dai ngang - dung lai o phong mot nhip moi doc, luot qua thi thoi
let narrateTimer = 0;

/* ---------- DIEU HUONG ----------
   Moi man hinh mot dia chi. Vao thang bang URL (F5, mo lai link) thi bo qua
   doan cong va duong bay - da xem roi thi khong bat xem lai. Rieng khung tranh,
   loi nhan va tam bien chuyen chuong van dien lai tu dau: do la phan dang xem.
   Moi ham restore duoi day dat DU trang thai cua man hinh do, khong dua vao
   viec truoc do dang o dau - nhu vay nhay bang nut Back/Forward luon dung. */
router.start(route => {
    markRoute(route);
    if (route !== 'gate') armMusic();

    const from = current;
    current = route;

    if (route === 'hall' || route === 'explore') offerListen(route);
    if (route === 'hall') return restoreHall();
    if (route === 'explore') return restoreExplore();
    if (roomOf.has(route)) return restoreChapter(route, from);
    restoreGate();
});

/* ---------- MAN CHO LUC MO TRANG ----------
   Mang cham thi anh hien dan tung mang, cua chua co, nhan vat chua ve - nhin nhu trang hong.
   Nen che bang man cho (.boot trong index.html) toi khi man dau tien da tai du nhung gi no can
   (readyToSpeak: canh, nhan vat, font, loi doc; sanh thi anh sanh), toi da LOAD_BUDGET. */
(async () => {
    const boot = document.querySelector('.boot');
    if (!boot) return;
    const route = current;
    if (route === 'gate' || roomOf.has(route)) {
        await readyToSpeak(route);
    } else {
        const hall = [...document.querySelectorAll('.stage--hall img')].map(loaded);
        await Promise.race([Promise.all([...hall, document.fonts?.ready]), wait(LOAD_BUDGET)]);
    }
    boot.classList.add('is-done');
    setTimeout(() => boot.remove(), 900);   // khop transition .8s cua .boot
})();

/* Trang thai UI toan trang cua mot man hinh. Router goi ham nay, va nut
   "Bat dau" cung phai goi: nut do doi dia chi im lang (de con giu hieu ung
   nhac khung tranh) nen router khong chay, truoc day dan toi vao phong dau
   tien ma khong co nut dong thoi gian lan nut che do xem. */
function markRoute(route) {
    invite.close();   // Back / Forward giua luc dang doc thu: thu khong theo sang man khac
    if (route === 'gate') listen.hide();   // cong co cach rieng: greet chao lai khi co cu bam dau tien
    // Dong thoi gian la UI toan trang, chi an o man cong (doan mo dau khong nen
    // lo truoc co bao nhieu chuong)
    timeline.setShown(route !== 'gate');
    timeline.mark(route);
    modes.setShown(route !== 'gate');
    // Dai ngang chi duoc phep phu man hinh khi dang o trong cac phong
    document.body.classList.toggle('in-rooms', roomOf.has(route));
    narrator.setRoom(route === 'gate' ? 'gate' : roomOf.has(route) ? route : null);
    music.setRoom(roomOf.has(route) ? route : null);   // phong co bai rieng thi doi bai
    document.body.classList.toggle('at-gate', route === 'gate');
    if (route === 'gate') document.body.classList.remove('gate-moved');
    seatCharacter(route);
}

/* Doi che do giua chung: dai ngang bat MOI phong hien san, con trinh chieu chi
   hien phong dang mo - doi xong ma khong dat lai thi nguoi xem roi ve mot man
   trong (trinh chieu) hoac ve dau dai (cuon ngang). */
function reshowCurrent() {
    if (!roomOf.has(current)) return;
    interlude.clear();
    leaveRooms(current);
    roomOf.get(current).settle();
    seatCharacter(current);   // doi che do thi doi cho o: trinh chieu gan vao phong, dai ngang gan vao ca dai
    if (modes.isStrip) {
        modes.scrollTo(current, { smooth: false });
        warmAround(current);
    }
}

/* Dai ngang: da toi mot phong (cuon toi noi, hoac nhan vat buoc vao) - doi dia chi, dong thoi
   gian va loi thuyet minh sang phong do. `seat: false` khi chinh nhan vat buoc vao: no dang
   di, gan lai vao dai luc nay se cat ngang buoc chan va nen dang cuon theo. */
function reachInStrip(folder, { seat = true } = {}) {
    if (!folder || folder === current) return;
    current = folder;
    router.go(folder, { silent: true });
    timeline.mark(folder);
    warmAround(folder);
    if (seat) seatCharacter(folder);
    narrator.setRoom(folder);
    music.setRoom(folder);   // phong co bai rieng thi doi bai ngay luc buoc vao
    narrateSoon(folder, NARRATE_STRIP);
}

/* Dai ngang: giai ma san anh nen hai phong ke ben. Khong lam thi trinh duyet
   chi giai ma luc phong vua lo vao man hinh - dung giua luc dang truot, va do
   chinh la cu khung hinh thay ro nhat. */
function warmAround(folder) {
    const i = folders.indexOf(folder);
    for (const f of [folders[i - 1], folders[i + 1]]) roomOf.get(f)?.warmup();
}

/* Cho canh phong hien va tranh treo xong roi moi soi den: soi vao mot buc tranh
   dang con mo dan thi nguoi xem khong biet dang duoc chi cai gi. */
function offerTour() {
    setTimeout(() => tour.offer(), 1900);
}

/** Dat san canh sanh, khong dien lai duong bay. */
function enterHall() {
    abortEntry();
    doorway.open = true;
    doorway.lock();
    flight.settle();
}

function leaveRooms(except) {
    for (const [folder, room] of roomOf) if (folder !== except) room.leave();
}

function restoreHall() {
    hop++;
    enterHall();
    interlude.clear();
    leaveRooms();
    letter.reset();   // co the dang tu trong phong lui ra: phai go het dau vet cu
    letter.warmup();
    letter.play();
}

function restoreExplore() {
    hop++;
    enterHall();
    interlude.clear();
    leaveRooms();
    letter.hide();
}

/* Tam bien chuyen chuong vua ngan chuong, vua che cho anh phong moi kip tai.
   Chu tren bien phai dung voi HUONG DI, khong phai luon la "N thang sau":
     - buoc tien mot chuong (bam "Tiep", hoac mo bang URL)  -> "2 thang sau"
     - lui lai, hoac nhay tu dong thoi gian                  -> ghi luon ngay den
   Truoc day luc nao cung ghi "N thang sau" nen lui lai cung doc thanh di tiep.
   Luot (hop) chan truong hop nguoi doc bam Back giua luc dang che. */
function restoreChapter(folder, from) {
    const run = ++hop;
    seatCharacter(folder);
    enterHall();     // sanh nam san phia sau, de luc quay ra khong phai tai lai
    letter.hide();

    // Che do cuon ngang: ca dai luon hien, chi can dua dung phong ve giua man
    if (modes.isStrip) {
        interlude.clear();
        modes.scrollTo(folder, { smooth: from != null });
        character.warp(folders.indexOf(folder));   // nhay thang toi phong do thi nhan vat cung toi
        narrateSoon(folder, NARRATE_STRIP);
        return;
    }

    const index = folders.indexOf(folder);
    const room = roomOf.get(folder);
    const was = from ? folders.indexOf(from) : -1;
    const step = was >= 0 ? index - was : null;   // null = khong ro (F5, mo link)

    if (index === 0 && step !== null) {
        interlude.clear();      // chuong dau: khong co gi truoc no de "sau"
        leaveRooms(folder);
        room.settle();
        offerTour();
        narrateSoon(folder);
        warmAround(folder);
        return;
    }

    const label = step === 1 || step === null
        ? (index > 0 ? gapLabel(folders[index - 1], folder) : dateLabel(folder))
        : dateLabel(folder);

    interlude.cover(label, async () => {
        // Dat canh len TRUOC roi moi cho anh giai ma. Lam nguoc lai thi neu anh
        // giai ma cham hon suc cho cua tam bien (interludeMax), bien se mo ra
        // khi canh chua duoc dat -> nguoi doc thay canh cu.
        if (run !== hop) return;
        room.settle();
        leaveRooms(folder);
        await room.ready();   // ca tranh, khong chi anh nen: tam bien mo ra la tranh da treo du
    }).then(() => {
        if (run !== hop) return;   // da di phong khac giua luc tam bien che
        offerTour();
        narrateSoon(folder);
        warmAround(folder);   // tai san hai phong ke ben cho lan bam Truoc / Tiep sau
    });
}

/* ---------- TU THUYET MINH KHI TOI PHONG ----------
   Mo phong bang bat ky cach nao (Truoc/Tiep, dong thoi gian, bam nua phong, mo link, cuon
   hay di bo trong dai ngang) thi nhan vat tu thuyet minh, khong can bam nut "Thuyet minh".
   Trinh chieu: sau khi tam bien chuyen canh mo ra va nhan vat da hien (xem .character trong
   character.css). Dai ngang: dung lai o phong mot nhip. Mo link khi chua co cu bam nao thi
   trinh duyet chan tieng: chi go chu (Narrator tu lo). */
async function walkToChapter(index) {
    narrator.stop();   // loi cua phong dang roi di thi thoi, khong thi bong bong lai bat len giua duong
    if (!(await character.walkToRoom(index))) return;   // bi huy giua duong (bam tiep, doi man hinh)
    // Nen con troi mot nhip moi bao "da toi phong" (onScrollTo): dat phong truoc de
    // luc do setRoom thanh viec da xong, khong cat ngang loi dang noi
    narrator.setRoom(folders[index]);
    narrateSoon(folders[index], 0);
}

/** Sanh khong co loi thuyet minh nen khong qua narrateSoon: vao bang F5 thi moi cham ngay
    de bat nhac. */
async function offerListen(route) {
    if (await needsTap() && current === route) listen.show();
}

/** Thuyet minh phong vua mo sau `delay` ms. Mot hen gio duy nhat: nhieu duong cung bao
    "da toi phong" (cuon dung, nhan vat buoc qua mep, di bo toi noi) cung chi doc mot lan. */
function narrateSoon(folder, delay = NARRATE_AFTER) {
    clearTimeout(narrateTimer);
    // Da di cho khac, dang doc roi, hoac dang co lop che (huong dan lan dau, thu, man moi cham...)
    const ready = () => current === folder && !narrator.isActive && !listen.isOpen
        && !tour.isOpen && !invite.isOpen && !timeline.isOpen && !roomOf.get(folder)?.isViewingArt;
    narrateTimer = setTimeout(async () => {
        if (!ready()) return;
        await readyToSpeak(folder);   // anh phong, tranh, nhan vat, file loi doc
        if (!ready()) return;
        // Trinh duyet dang chan tieng (F5, mo link): moi cham thay vi go chu ma khong co tieng
        if (await needsTap()) {
            if (ready()) listen.show();
            return;
        }
        if (ready()) narrator.play();
    }, delay);
}

function restoreGate() {
    hop++;
    abortEntry();
    interlude.clear();
    leaveRooms();
    flight.reset();
    letter.reset();
    doorway.reset();
}

/* ---------- TUONG TAC ---------- */
/* Bam vao cua cung nhu di toi cua: nhan vat tu di toi, cua tu mo (danh cho may
   khong co ban phim). Khong con cach nao mo cua ma nhan vat khong buoc vao. */
doorway.onClick(() => enterThroughDoor());

/** Cua tu mo -> nhan vat buoc vao trong, nho dan -> lao vao sanh. */
async function enterThroughDoor() {
    if (entering) return;
    entering = true;
    const run = ++entryRun;
    const alive = () => run === entryRun;

    character.lock();
    narrator.stop();      // dang chao (co tieng) do thi thoi, vao cua
    character.shutUp();
    flight.arm();
    music.start();     // cu bam OK / phim di toi cua la tuong tac dau tien: du de trinh duyet cho phat
    letter.warmup();   // con vai giay nua moi den luot khung tranh, du cho font ve

    if (calm.matches) {
        doorway.open = true;
        await wait(TIMING.calmDoors);
        if (alive()) takeOff();
        return;
    }
    // Di toi truoc cua truoc, roi cua moi tu mo (cham), roi moi buoc vao
    const atDoor = await character.walkTo({ x: DOOR_X, y: DOOR_FOOT });
    if (!alive() || !atDoor) return;
    doorway.open = true;
    await wait(TIMING.doors + TIMING.doorsPause);
    if (!alive()) return;
    const inside = await character.walkTo(
        { x: DOOR_X, y: DOOR_INSIDE },
        { duration: TIMING.walkIn, shrink: 0.26, fade: true },
    );
    if (alive() && inside) takeOff();
}

/** Roi man cong giua chung (Back, doi dia chi): bo dang vao cua do dang. */
function abortEntry() {
    entryRun++;
    entering = false;
    character.cancel();
}

function takeOff() {
    doorway.lock();
    character.unmount();
    // Doi dia chi ma khong goi lai handler: chuyen canh dang chay, khong the de
    // router nhay thang den ket qua. Doi lai, F5 giua duong bay se vao ngay
    // trong sanh - dung y do.
    router.go('hall', { silent: true });
    flight.start();
}

// Bam "Bat dau": khung tranh nhac len, dong thoi canh phong dau tien hien dan
letter.onStart(() => {
    const first = folders[0];
    router.go(first, { silent: true });
    current = first;    // doi dia chi im lang thi phai tu cap nhat moc nay
    markRoute(first);   // ... va tu bat nut dong thoi gian / nut che do xem
    letter.dismiss();
    if (modes.isStrip) modes.scrollTo(first, { smooth: false });
    narrator.prime();   // cu bam nay mo khoa tieng cho loi thuyet minh se doc sau khi canh hien
    roomOf.get(first).enter().then(() => {
        offerTour();
        narrateSoon(first);
    });
});

gallery.forEach(({ room }, i) => {
    room.onInvite(() => openInvite(folders[i]));   // to thu tren tuong: mo lai thu

    // Bam "Tiep": qua tam bien roi vao chuong sau
    room.onNext(() => {
        const next = folders[i + 1];
        if (!next) return;
        // Dai ngang: khong nhay canh, nhan vat tu di bo sang phong ke, nen cuon theo no
        // (onScrollTo cap nhat dia chi khi den noi)
        narrator.prime();
        if (modes.isStrip) {
            walkToChapter(i + 1);
            return;
        }
        router.go(next, { silent: true });
        const from = current;
        current = next;
        markRoute(next);   // doi dia chi im lang: tu cap nhat dong thoi gian, nut thuyet minh...
        restoreChapter(next, from);
    });

    // Bam "Truoc": lui ve chuong truoc. Dai ngang thi nhan vat tu di bo nguoc lai; trinh
    // chieu thi ghi luon ngay den (nhu bam nua trai canh phong), khong dien "N thang sau"
    room.onPrev(() => {
        const prev = folders[i - 1];
        if (!prev) return;
        narrator.prime();
        if (modes.isStrip) {
            walkToChapter(i - 1);
            return;
        }
        router.go(prev);
    });

    /* Bam vao canh phong: di theo dung truc thoi gian, khong nhay lung tung.
       Nua ben PHAI la toi ngay sau, nua ben TRAI la lui ve ngay truoc - giong
       lat mot cuon album. Het hai dau thi dung lai: o ky niem dau tien bam ben
       trai khong con gi de lui, o ky niem cuoi bam ben phai khong con gi de toi.
       Dang xem tranh phong to thi cu bam dau tien la dong tranh lai. */
    room.onClick(event => {
        if (room.isViewingArt) {
            room.closeArt();
            return;
        }
        if (modes.isStrip) return;   // dai ngang: di lai bang cach vuot
        const forward = event.clientX >= innerWidth / 2;
        const target = folders[forward ? i + 1 : i - 1];
        if (!target) return;
        router.go(target);
    });
});

// Bam ra sanh: dang go chu thi hien het loi nhan, doc xong roi thi quay lai cong
flight.hall.addEventListener('click', () => {
    if (!flight.hasArrived) return;
    if (letter.isUnread) {
        letter.reveal();
        return;
    }
    router.go('gate');
});
