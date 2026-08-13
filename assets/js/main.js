import { TIMING, calm } from './config.js';
import { Router, BASE_ROUTES } from './router.js';
import { MESSAGE, ART_LABELS } from './content.js';
import { CHAPTERS } from './chapters.js';
import { gapLabel, dateLabel } from './format.js';
import { Doorway } from './components/doorway.js';
import { Flight } from './components/flight.js';
import { Letter } from './components/letter.js';
import { Interlude } from './components/interlude.js';
import { Timeline } from './components/timeline.js';
import { buildGallery } from './components/gallery.js';

const doorway = new Doorway(document.querySelector('.doorway'));
const letter = new Letter({
    element: document.querySelector('.letter'),
    paragraphs: MESSAGE,
});
const interlude = new Interlude(document.querySelector('.interlude'));

/* Moi ky niem mot canh phong, dung tu thu muc memories/. Ten thu muc lam luon
   ten man hinh va dia chi, nen them ky niem khong phai sua gi o day. */
const gallery = buildGallery({
    container: document.querySelector('.rooms'),
    chapters: CHAPTERS,
    labels: ART_LABELS,
});
const folders = gallery.map(({ chapter }) => chapter.folder);
const roomOf = new Map(gallery.map(({ chapter, room }) => [chapter.folder, room]));

const router = new Router({
    ...BASE_ROUTES,
    ...Object.fromEntries(folders.map(f => [f, `#/${f}`])),
});
const timeline = new Timeline({
    element: document.querySelector('.timeline'),
    chapters: folders,
    onPick: route => router.go(route),
});
const flight = new Flight({
    hall: document.querySelector('.stage--hall'),
    onArrive: () => {
        letter.play();
        roomOf.get(folders[0])?.warmup();   // con ca doan doc loi nhan de anh kip ve
    },
});

let launch = null;
let hop = 0;             // moi lan doi man hinh la mot luot; luot cu het hieu luc
let current = null;      // man hinh dang mo, de biet dang di tien hay lui

/* ---------- DIEU HUONG ----------
   Moi man hinh mot dia chi. Vao thang bang URL (F5, mo lai link) thi bo qua
   doan cong va duong bay - da xem roi thi khong bat xem lai. Rieng khung tranh,
   loi nhan va tam bien chuyen chuong van dien lai tu dau: do la phan dang xem.
   Moi ham restore duoi day dat DU trang thai cua man hinh do, khong dua vao
   viec truoc do dang o dau - nhu vay nhay bang nut Back/Forward luon dung. */
router.start(route => {
    // Dong thoi gian la UI toan trang, chi an o man cong (doan mo dau khong nen
    // lo truoc co bao nhieu chuong)
    timeline.setShown(route !== 'gate');
    timeline.mark(route);

    const from = current;
    current = route;
    if (route === 'hall') return restoreHall();
    if (route === 'explore') return restoreExplore();
    if (roomOf.has(route)) return restoreChapter(route, from);
    restoreGate();
});

/** Dat san canh sanh, khong dien lai duong bay. */
function enterHall() {
    clearTimeout(launch);
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
    enterHall();     // sanh nam san phia sau, de luc quay ra khong phai tai lai
    letter.hide();

    const index = folders.indexOf(folder);
    const room = roomOf.get(folder);
    const was = from ? folders.indexOf(from) : -1;
    const step = was >= 0 ? index - was : null;   // null = khong ro (F5, mo link)

    if (index === 0 && step !== null) {
        interlude.clear();      // chuong dau: khong co gi truoc no de "sau"
        leaveRooms(folder);
        room.settle();
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
        await room.warmup();
    });
}

function restoreGate() {
    hop++;
    clearTimeout(launch);
    interlude.clear();
    leaveRooms();
    flight.reset();
    letter.reset();
    doorway.reset();
}

/* ---------- TUONG TAC ---------- */
doorway.onClick(() => {
    const open = doorway.toggle();

    clearTimeout(launch);
    if (!open) {
        flight.disarm();
        return;
    }

    flight.arm();
    letter.warmup();   // con ~4s nua moi den luot khung tranh, du cho font ve
    launch = setTimeout(takeOff, calm.matches ? TIMING.calmDoors : TIMING.doors + TIMING.hold);
});

function takeOff() {
    doorway.lock();
    // Doi dia chi ma khong goi lai handler: chuyen canh dang chay, khong the de
    // router nhay thang den ket qua. Doi lai, F5 giua duong bay se vao ngay
    // trong sanh - dung y do.
    router.go('hall', { silent: true });
    flight.start();
}

// Bam "Bat dau": khung tranh nhac len, dong thoi canh phong dau tien hien dan
letter.onStart(() => {
    router.go(folders[0], { silent: true });
    current = folders[0];   // doi dia chi im lang thi phai tu cap nhat moc nay
    letter.dismiss();
    roomOf.get(folders[0]).enter();
});

gallery.forEach(({ room }, i) => {
    // Bam "Tiep": qua tam bien roi vao chuong sau
    room.onNext(() => {
        const next = folders[i + 1];
        if (!next) return;
        router.go(next, { silent: true });
        const from = current;
        current = next;
        restoreChapter(next, from);
    });

    // Bam vao phong: lui mot buoc. Dang xem tranh thi bam la dong tranh truoc.
    room.onClick(() => {
        if (room.isViewingArt) {
            room.closeArt();
            return;
        }
        router.go(i === 0 ? 'explore' : folders[i - 1]);
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
