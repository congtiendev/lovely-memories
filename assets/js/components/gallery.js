import { Room } from './room.js';
import { dateLabel, isoDate } from '../format.js';

/* Dung canh cho tung ky niem tu CHAPTERS (do tools/scan-memories.py sinh ra).
   Truoc day moi phong la mot khoi HTML viet tay; gio them mot ky niem chi la
   tao thu muc + chay lai scanner, khong phai sua HTML hay JS nua.

   Danh doi: anh phong khong con nam san trong HTML nen preload scanner khong
   thay truoc. Khong sao - anh phong luon duoc `warmup()` tu som (ngay khi vao
   sanh, hoac trong luc tam bien chuyen chuong dang che), va no chi can den sau
   khi doc xong loi nhan. Rieng anh cong/sanh thi VAN de tinh trong HTML vi do
   la thu nguoi xem thay dau tien. */
export function buildGallery({ container, chapters, labels = {} }) {
    return chapters.map((chapter, i) => {
        const element = document.createElement('div');
        // Toa do treo tranh phu thuoc CA canh phong VA so tranh: cung canh
        // 22-05 nhung 1 buc thi treo giua, 3 buc thi treo ba o tuong.
        element.className = `room room--${chapter.folder} room--arts-${chapter.arts.length}`
            + (chapter.scene ? ` room--scene-${chapter.scene.folder}` : '');
        element.innerHTML = markup(chapter, labels, i < chapters.length - 1);
        container.append(element);
        return { chapter, room: new Room({ element }) };
    });
}

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

function markup(chapter, labels, hasNext) {
    const scene = chapter.scene;
    const arts = inSlots(chapter.arts).map((art, i) => {
        const label = labels[`${chapter.folder}/${art.name}`] ?? `Xem tranh ngày ${dateLabel(chapter.folder)}`;
        return `
            <button class="room__art room__art--${i + 1}" type="button"
                    data-full="${art.full}" aria-label="${label}">
                <img src="${art.src}" srcset="${art.srcset.join(', ')}"
                     sizes="(min-aspect-ratio: 1/1) 20vw, 40vw"
                     width="${art.width}" height="${art.height}"
                     fetchpriority="low" decoding="async" alt="">
            </button>`;
    }).join('');

    return `
        <div class="room__scene">
            ${scene ? picture(scene) : ''}
            ${arts}
            <time class="room__date" datetime="${isoDate(chapter.folder)}">${dateLabel(chapter.folder)}</time>
            ${hasNext ? '<button class="room__next" type="button">Tiếp</button>' : ''}
        </div>
        <div class="room__viewer"><img alt=""></div>`;
}

/* Man doc dung ban cat doc, khong phai ban ngang bi nen. Nguong doi anh phai
   khop @media (min-aspect-ratio: 1/1) trong css/tokens.css: tranh treo theo %
   cua anh nen moi ban cat mot bo toa do. */
function picture({ wide, tall }) {
    const main = tall ?? wide;
    return `
            <picture>
                ${wide && tall ? `<source media="(min-aspect-ratio: 1/1)"
                        srcset="${wide.srcset.join(', ')}" sizes="100vw"
                        width="${wide.width}" height="${wide.height}">` : ''}
                <img class="room__bg" src="${main.src}" srcset="${main.srcset.join(', ')}"
                     sizes="100vw" width="${main.width}" height="${main.height}"
                     fetchpriority="low" decoding="async" alt="">
            </picture>`;
}
