# Nhac nen

`theme.mp3` — *Young and Beautiful* (Theatrical version), Lana Del Rey.

Ban goc tai ve la 320 kbps, 173.5s, dinh -1.37 dBFS. Ban dang dung da qua ba
buoc xu ly (bang GStreamer + `audioop`, khong co ffmpeg tren may):

1. **Cat 33s dao dau** — nhac vao thang doan chinh, khong bat nguoi nghe cho.
   Cho cat duoc vao dan 80ms cho khoi nghe "cop".
2. **Chuan hoa am luong** — nhan he so 1.16 de dinh cham 0.99 FS. Vi the trong
   `js/components/music.js` co the mo `LEVEL = 1` ma khong so vo tieng.
   Cuoi ban ra dan 400ms cho khop cho no chay vong lai tu dau.
3. **Ma hoa lai 160 kbps CBR** — 8.2 MB -> 2.8 MB. Ban cuoi: 140.5s,
   dinh -0.56 dBFS, rms -14.8 dBFS.

Muon lam lai tu ban goc thi giai ma bang:

    gst-launch-1.0 filesrc location=goc.mp3 ! mpegaudioparse ! mpg123audiodec \
        ! audioconvert ! audioresample ! audio/x-raw,format=S16LE,rate=44100,channels=2 \
        ! wavenc ! filesink location=goc.wav
