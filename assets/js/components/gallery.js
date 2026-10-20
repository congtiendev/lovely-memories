import { Room } from './room.js';
import { dateLabel, isoDate } from '../format.js';
import { arrange, WALLS } from '../layout.js';

/* Dung canh cho tung ky niem tu CHAPTERS (do tools/scan-memories.py sinh ra).
   Truoc day moi phong la mot khoi HTML viet tay; gio them mot ky niem chi la
   tao thu muc + chay lai scanner, khong phai sua HTML hay JS nua.

   Danh doi: anh phong khong con nam san trong HTML nen preload scanner khong
   thay truoc. Khong sao - anh phong luon duoc `warmup()` tu som (ngay khi vao
   sanh, hoac trong luc tam bien chuyen chuong dang che), va no chi can den sau
   khi doc xong loi nhan. Rieng anh cong/sanh thi VAN de tinh trong HTML vi do
   la thu nguoi xem thay dau tien. */
/* ANH CHUA GAN DIA CHI: moi anh cua phong de o data-src / data-srcset, Room#hydrate() moi gan
   that khi phong sap can (phong dang xem va hai phong ke ben - warmup(); dai ngang them
   nhung phong sap cuon toi - xem observeStrip duoi day). Cac phong chi bi an bang
   `visibility`, nen gan san thi vao trang la trinh duyet tai anh cua CA 45 phong cung luc
   (gan tram MB), tranh bang thong voi canh cong va nhan vat - mang cham la nhan vat hien
   ra sau ca cau chao. */

/* Ban cat ngang hay doc - dung nguong voi <source media> trong markup */
const wideCrop = matchMedia('(min-aspect-ratio: 1/1)');

/* To giay cua thu moi, treo tren tuong o phong co `letter` (xem components/invite.js).
   Kich thuoc la cua chinh anh paper.webp. */
const SHEET = { name: 'thu-moi', sheet: true, src: 'assets/images/invite/paper.webp',
                width: 1024, height: 1536 };

export function buildGallery({ container, chapters, labels = {} }) {
    const built = chapters.map((chapter, i) => {
        const element = document.createElement('div');
        // Toa do treo tranh phu thuoc CA canh phong VA so tranh: cung canh
        // 22-05 nhung 1 buc thi treo giua, 3 buc thi treo ba o tuong.
        element.className = `room room--${chapter.folder} room--arts-${chapter.arts.length}`
            + (chapter.scene ? ` room--scene-${chapter.scene.folder}` : '')
            // Nen chung deu la tuong PHANG: treo tu do theo so luong, khong
            // phai neo vao o tuong nhu canh co hoc tuong.
            + (chapter.scene?.plain ? ' room--plain' : '');
        // Thu tu treo phai dung MOT ban duy nhat cho ca markup lan tinh bo cuc,
        // khong thi buc nay se nhan kich thuoc tinh cho buc kia.
        // To thu moi (neu co) treo nhu buc cuoi cung: cung thuat toan tim cho, cung lop
        // .room__art de nhan toa do, chi khac la bam vao thi mo lai thu chu khong phong to.
        // No chi hien sau khi thu da roi xuong mot lan (xem .room.is-invited, invite.css).
        const order = [...inSlots(chapter.arts), ...(chapter.letter ? [SHEET] : [])];
        element.innerHTML = markup(chapter, order, labels, chapters[i + 1], i > 0);
        container.append(element);
        return { chapter, order, element, room: new Room({ element }) };
    });

    /* Vi tri tranh do thuat toan tinh (xem layout.js), khong viet san trong CSS:
       moi nen mot cau truc nen bo cuc phai suy ra tu khoang tuong that. Tinh lai
       khi doi ngang/doc vi hai ban cat co bo khoang tuong khac nhau. */
    const place = () => {
        const crop = wideCrop.matches ? 'wide' : 'tall';
        for (const { chapter, order, element } of built) {
            const wall = chapter.scene?.folder;
            const scene = chapter.scene?.[crop] ?? chapter.scene?.wide;
            if (!wall || !scene) continue;
            const spots = arrange({
                wall, crop, arts: order,
                roomRatio: scene.width / scene.height,
                aspect: innerWidth / innerHeight,
            });
            if (!spots) continue;
            element.querySelectorAll('.room__art').forEach((art, i) => {
                const s = spots[i];
                if (!s) return;
                art.style.setProperty('--art-cx', `${s.cx.toFixed(2)}%`);
                art.style.setProperty('--art-cy', `${s.cy.toFixed(2)}%`);
                art.style.setProperty('--art-w', `${s.w.toFixed(2)}%`);
            });
        }
    };
    place();
    wideCrop.addEventListener('change', place);
    observeStrip(container, built);
    // Phan canh nhin thay doi theo ti le man hinh (xoay may, doi cua so), nen
    // tinh lai khi ti le doi that su - thanh dia chi tren dien thoai co/gian
    // cung ban `resize` nhung khong doi ti le dang ke, bo qua de tranh giat.
    let lastAspect = (innerWidth / innerHeight).toFixed(2);
    addEventListener('resize', () => {
        const a = (innerWidth / innerHeight).toFixed(2);
        if (a !== lastAspect) { lastAspect = a; place(); }
    });
    return built;
}

/* Dai ngang: cac phong noi lien nhau, keo / lan chuot luot qua nhieu phong mot luc, nen gan
   anh cho phong nao vao trong mot be ngang man hinh quanh khung nhin. Che do trinh chieu thi
   moi phong deu phu kin man hinh (luc nao cung "giao" khung nhin) - o do bo qua, da co
   warmup() cho phong dang xem va hai phong ke ben lo. */
function observeStrip(container, built) {
    if (!('IntersectionObserver' in window)) return;
    const roomOf = new Map(built.map(({ element, room }) => [element, room]));
    const io = new IntersectionObserver(entries => {
        if (!document.documentElement.classList.contains('mode-strip')
            && !document.body.classList.contains('mode-strip')) return;
        for (const entry of entries) if (entry.isIntersecting) roomOf.get(entry.target)?.warmup();
    }, { root: container, rootMargin: '0px 100% 0px 100%' });
    for (const { element } of built) io.observe(element);
}

/* --art-ar la ti le that cua buc tranh, de CSS treo theo CHIEU CAO thay vi be
   ngang o nhung o chi co mot buc: cac buc o do co hinh dang rat khac nhau
   (0.68 den 1.0), co dinh be ngang thi buc cao se vong len gap ruoi buc kia. */

/* Bo ba tranh thi buc gan VUONG nhat duoc dua vao o giua (slot 2): o giua la o
   tuong lon nhat, va mot buc vuong dat o day moi neo duoc bo cuc - dat no o mot
   ben thi hai canh trong khong deu. Cac buc con lai giu nguyen thu tu. */
function inSlots(arts) {
    if (arts.length !== 3) return arts;
    const squarest = arts.reduce((best, a) =>
        Math.abs(a.width / a.height - 1) < Math.abs(best.width / best.height - 1) ? a : best);
    const rest = arts.filter(a => a !== squarest);
    return [rest[0], squarest, rest[1]];
}

function markup(chapter, order, labels, next, hasPrev) {
    const scene = chapter.scene;
    const hasNext = !!next;
    const arts = order.map((art, i) => {
        if (art.sheet) return `
            <button class="room__art room__art--${i + 1} room__invite" type="button"
                    style="--art-ar: ${(art.width / art.height).toFixed(4)}" aria-label="Mở thư mời">
                <img data-src="${art.src}" width="${art.width}" height="${art.height}"
                     fetchpriority="low" decoding="async" alt="">
                <span class="room__invite-label">Thư mời</span>
            </button>`;
        const label = labels[`${chapter.folder}/${art.name}`] ?? `Xem tranh ngày ${dateLabel(chapter.folder)}`;
        return `
            <button class="room__art room__art--${i + 1}" type="button"
                    style="--art-ar: ${(art.width / art.height).toFixed(4)}"
                    data-full="${art.full}" aria-label="${label}">
                <img data-src="${art.src}" data-srcset="${art.srcset.join(', ')}"
                     sizes="(min-aspect-ratio: 1/1) 20vw, 40vw"
                     width="${art.width}" height="${art.height}"
                     fetchpriority="low" decoding="async" alt="">
            </button>`;
    }).join('');

    return `
        <div class="room__scene">
            ${scene ? picture(scene) : ''}
            ${bleed(scene, next?.scene)}
            ${arts}
            <time class="room__date" datetime="${isoDate(chapter.folder)}">${dateLabel(chapter.folder)}</time>
            ${hasPrev ? '<button class="room__prev" type="button">Trước</button>' : ''}
            ${hasNext ? '<button class="room__next" type="button">Tiếp</button>' : ''}
        </div>
        <div class="room__viewer"><img alt=""></div>`;
}

/* Dai ngang: phong ke ben dung anh nen KHAC thi mep noi la mot vet cat thang (lat guong chi
   cuu duoc hai phong cung anh). Nen dat san o mep phai phong nay mot ban sao anh nen cua
   phong ke ben, dung cho no se nam neu phong do lan sang, roi cho no mo dan vao trong: sat
   mep thi trung tung pixel voi phong ke ben, vao trong thi tan han vao tuong phong nay
   (strip.css). Nam TRONG canh, duoi tranh, de khong phu mo len buc treo sat mep. Chi dung
   ban cat ngang (dai ngang luon cat ngang) va loading="lazy": o che do trinh chieu lop nay
   an nen anh khong bi tai. */
function bleed(scene, nextScene) {
    const wide = nextScene?.wide;
    if (!scene || !wide || nextScene.folder === scene.folder) return '';
    return `
            <div class="room__bleed" aria-hidden="true">
                <img data-src="${wide.src}" data-srcset="${wide.srcset.join(', ')}" sizes="100vw"
                     width="${wide.width}" height="${wide.height}"
                     loading="lazy" decoding="async" alt="">
            </div>`;
}

/* Man doc dung ban cat doc, khong phai ban ngang bi nen. Nguong doi anh phai
   khop @media (min-aspect-ratio: 1/1) trong css/tokens.css: tranh treo theo %
   cua anh nen moi ban cat mot bo toa do. */
function picture({ wide, tall }) {
    const main = tall ?? wide;
    return `
            <picture>
                ${wide && tall ? `<source media="(min-aspect-ratio: 1/1)"
                        data-srcset="${wide.srcset.join(', ')}" sizes="100vw"
                        width="${wide.width}" height="${wide.height}">` : ''}
                <img class="room__bg" data-src="${main.src}" data-srcset="${main.srcset.join(', ')}"
                     sizes="100vw" width="${main.width}" height="${main.height}"
                     fetchpriority="low" decoding="async" alt="">
            </picture>`;
}
