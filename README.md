# lovely-memories

Trang tinh, khong build. JS dung ES module nen phai chay qua server:

```bash
python3 -m http.server
```

Mo bang `file://` thi module bi CORS chan va trang se khong chay.

## Man hinh

Moi man hinh mot dia chi (`assets/js/router.js`), F5 hay chia se link deu vao
dung cho thay vi dien lai tu dau:

| Dia chi | Man hinh |
| --- | --- |
| `#/cong` | Cong. Bam vao o cua -> cua mo -> lao vao sanh |
| `#/sanh` | Sanh. Khung "Loi ngo" roi xuong va khac loi nhan len mat da |
| `#/17-03-2026` | Phong ky niem thu nhat. Bam "Bat dau" o khung tranh thi vao day |
| `#/22-05-2026` | Phong ky niem thu hai. Bam "Tiep" o phong truoc thi vao day |
| `#/kham-pha` | Sanh trong, khong con khung tranh (bam vao phong de lui ra) |

Vao chuong hai luon di qua tam bien **"2 thang sau"** (`components/interlude`).
Tam bien nay vua ngan hai chuong vua LA MAN CHO: viec tai va giai ma anh phong
moi duoc lam trong luc no dang phu kin, nen khong bao gio thay canh moi hien ra
nua voi. No o lai it nhat `TIMING.interlude`, cho canh moi toi da
`TIMING.interludeMax` roi di tiep du anh chua ve.

Bam vao mot phong la lui mot buoc (phong 2 -> phong 1 -> sanh -> cong); di tien
thi bang nut trong canh. Trang thai mo cua moi phong nam tren chinh the `.room`
(class `is-open`) chu khong tren `<body>`, nho vay nhieu phong cung ton tai
trong trang ma khong de len nhau.

## Them mot ky niem

Tat ca ky niem nam trong `memories/`, moi ngay mot thu muc `DD-MM-YYYY`. Them
ky niem = tao thu muc, bo anh vao theo dung quy uoc ten, roi chay:

```bash
python3 tools/scan-memories.py
```

Script quet `memories/`, doc kich thuoc that cua tung file webp roi sinh ra
`assets/js/chapters.js`. **Khong phai sua HTML hay JS**: canh phong, tranh treo,
ngay khac, nut "Tiep", dong tren dong thoi gian va dia chi `#/DD-MM-YYYY` deu
duoc dung tu danh sach do. Chu tren tam bien chuyen chuong ("2 thang sau",
"1 thang sau") cung tinh tu khoang cach giua hai ngay.

| Ten file trong thu muc | La gi |
| --- | --- |
| `memory-<w>w.webp` | canh phong, ban cat ngang |
| `memory-portrait-<w>w.webp` | canh phong, ban cat doc |
| `art-NN-<w>w.webp` | tranh treo tuong (ban rong nhat dung cho lop xem) |

Thu muc khong co anh canh thi **dung lai phong cua ky niem truoc** - nhieu ky
niem treo trong cung mot phong la chuyen thuong (`19-06-2026` dang nhu vay).

Vi sao khong tu doc thu muc luc chay: trang tinh khong the liet ke thu muc
(GitHub Pages khong cho index), nen danh sach phai duoc chot san luc build.

Hai thu con phai viet tay: nhan doc cho tranh (`ART_LABELS` trong `content.js`)
va toa do treo tranh trong `css/tokens.css` - toa do phai do tren tung anh canh
nen khong the doan. Toa do gan theo THU MUC CANH (`.room--scene-DD-MM-YYYY`) chu
khong theo thu muc ky niem, nho vay phong dung lai canh thi dung lai luon toa do.

## Phong ky niem

Moi ky niem mot thu muc theo ngay. `17-03-2026/` chua ca canh phong va cac buc
tranh treo trong do; `22-05-2026/` hien chi co canh phong (tuong trong, chua
treo gi):

| File | La gi |
| --- | --- |
| `memory-*w.webp` | canh phong, ban cat ngang (1672x941) |
| `memory-portrait-*w.webp` | canh phong, ban cat doc (941x1672) |
| `art-01-*w.webp` | tranh 1: thong bao follow (ngang) |
| `art-02-*w.webp` | tranh 2: tin nhan dau tien (doc) |

Tranh treo tren hai o tuong phang hai ben hoc tuong. Toa do la % cua anh phong
nen `.room__scene` phai giu DUNG ti le anh (`--room-r`), khong duoc de
`object-fit` cat tuy y - cat tuy y thi tranh troi ra khoi o tuong. Moi ban cat
mot bo toa do, doi o `@media (min-aspect-ratio: 1/1)`; nguong nay phai khop
`<source media>` cua `.room` trong `index.html`.

O tuong do bang cach quet net go trong anh (trong long o khong co net nao):
ban ngang x 13.5-28% va 72-86.5%, y 13.1-71.1%; ban doc x 6.6-23.3% va
76.7-93.4%, y 21.2-66.2%.

Phong 22-05 chua treo tranh; ngay `22 · 05 · 2026` khac tren o lom giua dai
wainscot (ban ngang x 34.3-65.1% y 79.8-86.4%; ban doc x 22.6-76.4% y 74-79.7%)
vi phong nay khong co hoc tuong va panel duoi be tuong.

Ngay `17 · 03 · 2026` khac tren panel da duoi be tuong (ban ngang x 39-60.7%
y 77.3-85.7%; ban doc x 37.7-62.2% y 62.8-69.9%), dung dung cong thuc chu khac
voi loi ngo (`--ink` / `--ink-carve`). Panel ban doc hep hon nen tracking phai
bot lai (`--date-track`) de chu con du to.

Tren tuong chi tai ban nho cua tranh; bam vao thi ban lon (`data-full`) moi tai
va hien o `.room__viewer`. Mau nen lop xem lay tu chinh anh phong (trung binh
vung tuong `#ab947b`, ha xuong 42% do sang) de khong lac ra khoi bang mau.

Vao `#/sanh` bang URL thi bo qua doan cong va duong bay, nhung khung tranh va
loi nhan van dien lai tu dau. Dang khac chu ma bam ra sanh thi hien het loi
nhan; khac xong roi moi bam thi quay ve cong.

Nut "Bat dau" chi hien khi da khac xong chu.

## Hai khung tranh

Trang dung hai anh khung khac nhau theo co man hinh (art direction), doi o
nguong `(min-width: 760px) and (min-height: 620px)` - nguong nay nam O HAI CHO
va phai khop nhau: `@media` cuoi `css/tokens.css` va the `<source media>` trong
`index.html`. Lech nhau thi anh mot ti le ma hop khung mot ti le -> khung meo.

| | Man du lon | Man doc / man nho |
| --- | --- | --- |
| Anh | `frame-02` (1536x1024, vang) | `frame-891w` (891x1232, da) |
| Title | trong o cartouche dinh khung | khac tren dau panel |
| Nut | trong o bau duc duoi day | khac tren chan panel |
| Co chu | 3.1% chieu cao khung | 2.58% |

Ly do phai tach: khung ngang ti le 1.5 tren man doc chi rong bang be ngang may,
o chu con ~254x112px - khong cach nao nhet 456 ky tu vao do ma con doc duoc.
Khung doc cho o chu rong gan gap ba, tren iPhone 390px chu duoc ~14px.

Toa do cac o deu la % cua anh khung va do bang cach quet pixel trong anh, khong
uoc luong. Khung vang: o long chinh x 12.2-87.7% y 31-80.4%, cartouche dinh
x 33.6-66.5% y 15.7-23.2%, o bau duc x 35.3-65% y 83.7-91.7%; hoa van bon goc
lan vao toi x 16.3% o y 31.5%. Khung da: panel x 16-84% y 18-86.5%.
Tat ca nam trong `css/tokens.css`; doi anh khung la phai do lai.

## Dong thoi gian (UI toan trang)

Nut o goc tren-trai mo ra mot bang cao tron man hinh, moi bien ten mot ky niem.
Ten tren bien SUY RA tu ten thu muc (`CHAPTERS` trong `js/content.js`), nen them
ky niem la them mot dong o do + mot dong trong `ROUTES` - khong phai viet ten
lan hai. Nut an o man cong de doan mo dau khong lo truoc co bao nhieu chuong.

Ba anh: `timeline-tab` (bien bau duc, cat tu `frame-04`), `timeline-panel`
(khung bang rong), `timeline-row` (mot dong: diem tron + bien ten, da cat viong
trong suot nen hop dong bang dung phan nhin thay). Thanh doc noi cac diem tron
la mot vach CSS, ke qua tam diem (x 9.2% be ngang dong).

Hai cai bay o day, deu da co comment trong `components/timeline.css`:
- **Khong dung `backdrop-filter` cho lop nen toi**: no bien lop do thanh backdrop
  root va Chrome ve no de len ca cai bang, du bang z-index cao hon.
- **Phai dat z-index tuong minh cho ca ba lop** (nen 0 < bang 1 < nut 2): de
  `auto` thi thu tu ve phu thuoc cach compositor xu ly `filter` cua bang, do lai
  10 lan thi 3 lan bang bi lop nen phu.

## Cau truc

```
assets/css/
  tokens.css              bien dung chung: ti le anh, toa do o cua, nhip
  base.css                reset + html/body
  components/stage.css    khung anh nen phu kin viewport
  components/doorway.css  hai canh cua 3D
  components/flight.css   chuyen canh FPV tu cong vao sanh
  components/letter.css   khung tranh roi xuong + title + mat da + nut Bat dau
  components/room.css     canh phong ky niem: tranh treo, ngay khac, loi di tiep
  components/interlude.css  tam bien chuyen chuong ("2 thang sau")
  components/timeline.css   nut goc trai + bang cac ky niem
assets/js/
  config.js               moc thoi gian, nhip go chu
  content.js              noi dung loi nhan + danh sach chuong (CHAPTERS)
  router.js               dia chi <-> man hinh
  components/doorway.js   trang thai dong/mo cua
  components/flight.js    arming -> flying -> arrived
  components/letter.js    roi khung, goi typewriter
  components/room.js      mo man vao phong, treo tranh, lop xem tranh
  components/interlude.js   che man de doi canh, kiem man cho tai anh
  components/timeline.js    dung cac dong tu CHAPTERS, danh dau chuong dang xem
  components/typewriter.js  go chu tung ky tu
  main.js                 gan ket cac phan
```

Cac moc thoi gian trong `js/config.js` phai khop voi CSS (`--dur`, `--drop-dur`,
keyframes `arrive`); cho nao trung lap deu co comment ghi ro.
