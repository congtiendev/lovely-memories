# Nhac nen

`theme.mp3` — *Young and Beautiful* (Theatrical version), Lana Del Rey.

Ban goc tai ve la 320 kbps, 173.5s, dinh -1.37 dBFS. Ban dang dung da qua ba
buoc xu ly (bang GStreamer + `audioop`, khong co ffmpeg tren may):

1. **Cat 33s dao dau** — nhac vao thang doan chinh, khong bat nguoi nghe cho.
   Cho cat duoc vao dan 80ms cho khoi nghe "cop".
2. **Chuan hoa am luong** — nhan he so 1.16 de dinh cham 0.99 FS. Vi the trong
   `js/components/music.js` co the mo `LEVEL = 1` ma khong so vo tieng (dang dat 0.8 cho khong to hon tieng thuyet minh).
   Cuoi ban ra dan 400ms cho khop cho no chay vong lai tu dau.
3. **Ma hoa lai 160 kbps CBR** — 8.2 MB -> 2.8 MB. Ban cuoi: 140.5s,
   dinh -0.56 dBFS, rms -14.8 dBFS.

Muon lam lai tu ban goc thi giai ma bang:

    gst-launch-1.0 filesrc location=goc.mp3 ! mpegaudioparse ! mpg123audiodec \
        ! audioconvert ! audioresample ! audio/x-raw,format=S16LE,rate=44100,channels=2 \
        ! wavenc ! filesink location=goc.wav

# Nhac rieng phong 20-10-2026

`i-do.mp3` — *I Do*, 911. Khai o `ROOM_MUSIC` trong `js/content.js`: toi phong do thi
bai nay tu bat tu dau (thay cho nhac chung), roi phong thi tra lai nhac chung, phat
tiep dung cho dang do (`js/components/music.js`).

Ban goc 320 kbps, 201.7s, 8.7 MB, kha nho tieng (dinh -7.27 dBFS, rms -20.8 dBFS).
Nhac vao ngay tu giay dau va da co doan ra dan o cuoi nen khong cat gi. Hai buoc
xu ly (tren may khong co ffmpeg lan GStreamer: giai ma bang `miniaudio`, ma hoa bang
`lameenc`, nhan am luong bang `audioop`):

1. **Chuan hoa am luong** — nhan 2.194 cho dinh cham 0.95 FS (de chua mot chut cho ma
   hoa mp3 khoi vo tieng): rms -13.9 dBFS, to ngang `theme.mp3`.
2. **Ma hoa lai 160 kbps CBR** — 8.7 MB -> 4.0 MB. Giai ma lai: dinh -0.18 dBFS.

# Loi chao o cong

`greeting.mp3` — loi long tieng cua cau chao o man cong (`GREETING` trong
`js/content.js`), 8.5s. Phat qua `Narrator` (key `'gate'` trong `main.js`) nen chu
trong bong bong chay khop do dai file. Trang vua mo thi trinh duyet chan tieng: cau
chao chi co chu, cu bam / phim dau tien se chao lai tu dau kem tieng.


# Nhac chung nhieu bai (theme-1, theme-2, theme-3...)

Nhac cho cong, sanh va cac phong khong co bai rieng la `theme-1.mp3`, `theme-2.mp3`, ... Phat het
bai nay sang bai ke tiep, het bai cuoi thi quay lai bai dau (`js/components/music.js`).

**Them nhac khong can sua code**: tha `theme-3.mp3`, `theme-4.mp3`, ... vao thu muc nay (so lien
tiep, bat dau tu 1). Luc mo trang, trang tu do tim: gui yeu cau HEAD cho tung `theme-N.mp3` toi
file dau tien khong co thi dung (toi da 60 bai). Thieu mot so giua chung (co 1, 2, 4 ma khong co 3)
thi bai 4 bi bo qua. Mau duong dan nam o `THEME_PATTERN` trong `js/content.js`.
