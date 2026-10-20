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
const EDGE = 1.2;      // le an toan so voi mep man hinh khi canh bi cat hai ben, % be ngang canh
const MIN_ZONE = 4;    // khoang tuong hep hon nua (%) thi khong con treo duoc gi

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

/** Chia deu so buc cho moi hang: ceil(n / rows) buc mot hang. */
function evenLines(ratios, rows) {
    const perRow = Math.ceil(ratios.length / rows);
    const lines = [];
    for (let i = 0; i < ratios.length; i += perRow) lines.push(ratios.slice(i, i + perRow));
    return lines;
}

/** Chia thanh dung `rows` hang LIEN TIEP (giu thu tu) sao cho tong ti le cua
 *  hang rong nhat la nho nhat. Du nho (n <= 7) nen vet can het cho don gian. */
function balancedLines(ratios, rows) {
    const n = ratios.length;
    if (rows > n) return null;
    let best = null;
    const cut = (start, left, acc) => {
        if (left === 1) {
            const lines = [...acc, ratios.slice(start)];
            const widest = Math.max(...lines.map(l => l.reduce((a, b) => a + b, 0)));
            if (!best || widest < best.widest - 1e-9) best = { widest, lines };
            return;
        }
        for (let end = start + 1; end <= n - (left - 1); end++)
            cut(end, left - 1, [...acc, ratios.slice(start, end)]);
    };
    cut(0, rows, []);
    return best.lines;
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
        // Hai cach chia hang: chia deu so buc (cu), va chia sao cho hang rong
        // nhat (tong ti le lon nhat) nho nhat. Cach sau cuu truong hop mot buc
        // vuong roi vao hang dau lam ca khoi phai co lai (phong 06-09 tren
        // dien thoai). Hoa thi giu cach cu, nen cac phong khac khong doi.
        for (const lines of [evenLines(ratios, rows), balancedLines(ratios, rows)]) {
            if (!lines) continue;
            // chieu cao bi chan boi ca dai cao lan be ngang hang rong nhat
            const byHeight = (H - (lines.length - 1) * GAP_Y) / lines.length;
            const byWidth = Math.min(...lines.map(l =>
                (W - (l.length - 1) * GAP_X) * roomRatio / l.reduce((a, b) => a + b, 0)));
            const h = Math.min(byHeight, byWidth);
            if (!best || h > best.h + 1e-9) best = { h, rows: lines.length, lines };
        }
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
 * Phan canh phong THAT SU nhin thay tren man hinh. .room__scene phu kin
 * viewport (cover), neo day giua: man hep hon anh thi mat hai ben, man rong/lun
 * hon anh thi mat phan tren. Tranh treo theo % cua anh nen phai tu rut khoang
 * tuong lai theo phan nhin thay, khong thi tranh bi cat o mep man hinh (dien
 * thoai hep voi canh room-statue) hoac tran len tren (may tinh bang doc).
 * @returns {{x: [number, number], top: number}} x la khoang %, top la % tu dinh
 */
function visibleWindow(aspect, roomRatio) {
    const x = Math.min(1, aspect / roomRatio);
    const y = Math.min(1, roomRatio / aspect);
    // chua them mot dai nho cho hai nut o goc tren khi man bi cat phan tren
    const top = y < 1 ? (1 - y) * 100 + 0.06 * y * 100 : 0;
    return { x: [50 - 50 * x + (x < 1 ? EDGE : 0), 50 + 50 * x - (x < 1 ? EDGE : 0)], top };
}

/**
 * Sap xep toan bo tranh cua mot phong.
 * @param aspect ti le viewport (rong/cao); bo qua thi coi nhu thay du ca canh
 * @returns mang {cx, cy, w} theo dung thu tu `arts`, don vi % khung canh
 */
export function arrange({ wall, crop, arts, roomRatio, aspect }) {
    const spec = WALLS[wall]?.[crop];
    if (!spec || !arts.length) return null;
    const view = aspect ? visibleWindow(aspect, roomRatio) : { x: [0, 100], top: 0 };
    const band = [Math.max(spec.band[0], SAFE_TOP, view.top), spec.band[1]];
    // khoang tuong bi cat bot theo phan nhin thay; khoang nao con qua hep thi bo
    let zones = spec.zones
        .map(([a, b]) => [Math.max(a, view.x[0]), Math.min(b, view.x[1])])
        .filter(([a, b]) => b - a >= MIN_ZONE);
    if (!zones.length || band[1] - band[0] < MIN_ZONE) { zones = spec.zones; band[0] = Math.min(band[0], spec.band[0]); }
    const counts = share(zones, arts.length);

    const out = [];
    let i = 0;
    zones.forEach((zone, z) => {
        const take = arts.slice(i, i + counts[z]);
        if (take.length) out.push(...fill(zone, band, take, roomRatio));
        i += counts[z];
    });
    return out;
}
