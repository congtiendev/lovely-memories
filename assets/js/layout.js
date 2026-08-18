/* ---------- TU SAP XEP TRANH TREN TUONG ----------
   Moi nen mot cau truc khac nhau, nen thay vi viet san toa do cho tung to hop
   (nen x so tranh), o day chi khai bao CAC KHOANG TUONG dung duoc cua tung nen,
   con cach treo do thuat toan tu chon: chia tranh cho cac khoang theo be ngang,
   roi trong tung khoang thu 1 hang, 2 hang... va lay cach cho tranh TO NHAT.

   Nho vay them mot nen moi chi la them mot dong toa do khoang tuong, va them
   bao nhieu tranh cung khong phai sua gi.

   Toa do khoang tuong do bang cach quet luoi % tren chinh anh nen. `wide` la
   ban cat ngang, `tall` la ban cat doc; `band` la dai cao dung duoc. */
export const WALLS = {
    'room-statue': {
        wide: { zones: [[13.5, 28], [72, 86.5]], band: [13.1, 71.1] },
        tall: { zones: [[6.6, 23.3], [76.7, 93.4]], band: [21.2, 66.2] },
    },
    'room-panels': {
        wide: { zones: [[9.5, 24.2], [34.5, 65.3], [75.7, 90.4]], band: [16.5, 74.5] },
        tall: { zones: [[22.4, 76.7]], band: [16.5, 69.4] },
    },
};

/* Canh neo DAY man hinh: man cang rong thi phan bi cat cang nam o TREN. Man
   21:9 cat toi 24% chieu cao canh, nen khong treo gi cao hon moc nay. */
const SAFE_TOP = 13;
const GAP_X = 1.6;     // khe giua hai buc, % be ngang canh
const GAP_Y = 2.5;     // khe giua hai hang, % chieu cao canh

/** Chia n buc cho cac khoang, khoang rong hon nhan nhieu hon. */
function share(zones, n) {
    const total = zones.reduce((s, z) => s + (z[1] - z[0]), 0);
    const raw = zones.map(z => n * (z[1] - z[0]) / total);
    const counts = raw.map(Math.floor);
    let left = n - counts.reduce((a, b) => a + b, 0);
    // phan du chia cho khoang nao dang thiet thoi nhat
    const order = raw.map((v, i) => [v - counts[i], i]).sort((a, b) => b[0] - a[0]);
    for (let k = 0; left > 0; k++, left--) counts[order[k % order.length][1]]++;
    return counts;
}

/**
 * Xep `arts` (moi phan tu co .width/.height) vao mot khoang tuong.
 * Tra ve mang {cx, cy, w} tinh bang % cua khung canh.
 * @param roomRatio ti le anh nen (rong/cao) - de doi chieu cao sang be ngang
 */
function fill(zone, band, arts, roomRatio) {
    const [x1, x2] = zone;
    const [y1, y2] = band;
    const W = x2 - x1, H = y2 - y1;
    const ratios = arts.map(a => a.width / a.height);

    let best = null;
    for (let rows = 1; rows <= arts.length; rows++) {
        const perRow = Math.ceil(arts.length / rows);
        const lines = [];
        for (let i = 0; i < arts.length; i += perRow) lines.push(ratios.slice(i, i + perRow));
        // chieu cao bi chan boi ca dai cao lan be ngang hang rong nhat
        const byHeight = (H - (rows - 1) * GAP_Y) / rows;
        const byWidth = Math.min(...lines.map(l =>
            (W - (l.length - 1) * GAP_X) * roomRatio / l.reduce((a, b) => a + b, 0)));
        const h = Math.min(byHeight, byWidth);
        if (!best || h > best.h) best = { h, rows, lines };
    }

    const { h, rows, lines } = best;
    const out = [];
    const blockH = rows * h + (rows - 1) * GAP_Y;
    let idx = 0;
    lines.forEach((line, r) => {
        const widths = line.map(ar => h * ar / roomRatio);
        const lineW = widths.reduce((a, b) => a + b, 0) + (line.length - 1) * GAP_X;
        let x = x1 + (W - lineW) / 2;
        const cy = y1 + (H - blockH) / 2 + r * (h + GAP_Y) + h / 2;
        widths.forEach(w => {
            out[idx++] = { cx: x + w / 2, cy, w };
            x += w + GAP_X;
        });
    });
    return out;
}

/**
 * Sap xep toan bo tranh cua mot phong.
 * @returns mang {cx, cy, w} theo dung thu tu `arts`, don vi % khung canh
 */
export function arrange({ wall, crop, arts, roomRatio }) {
    const spec = WALLS[wall]?.[crop];
    if (!spec || !arts.length) return null;
    const band = [Math.max(spec.band[0], SAFE_TOP), spec.band[1]];
    const counts = share(spec.zones, arts.length);

    const out = [];
    let i = 0;
    spec.zones.forEach((zone, z) => {
        const take = arts.slice(i, i + counts[z]);
        if (take.length) out.push(...fill(zone, band, take, roomRatio));
        i += counts[z];
    });
    return out;
}
