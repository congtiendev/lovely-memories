#!/usr/bin/env python3
"""Sinh anh xem truoc khi gui link va bo icon cua trang.

    python3 tools/make-share-art.py

Ra ba thu, deu nam trong assets/images/:
    share-1200x630.jpg    anh hien ra khi dan link vao Messenger / Zalo / Telegram
    favicon.ico           icon tren thanh tab (chua san 16, 32, 48 px)
    apple-touch-icon.png  icon khi luu ra man hinh chinh cua iPhone (180 px)

Anh xem truoc dung chinh canh sanh cua trang, cat theo khuon 1.91:1 ma cac mang
xa hoi dung. Chu tren anh de bang tieng Anh, khong dau: anh ve bang Noto Serif
Display (Pillow khong doc duoc woff2 cua EB Garamond) va dau tieng Viet cua
font nay dat khong khop voi than chu khi phong to.

Anh khong ghi ngay thang: cau chuyen chua co ngay ket.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets' / 'images'
SCENE = OUT / 'background' / 'hall-1672w.webp'

SERIF = '/usr/share/fonts/truetype/noto/NotoSerifDisplay-Regular.ttf'
SERIF_MED = '/usr/share/fonts/truetype/noto/NotoSerifDisplay-Medium.ttf'

W, H = 1200, 630
# CHU TREN ANH KHONG DUNG TIENG VIET: anh nay ve bang Noto Serif Display chu
# khong phai EB Garamond cua trang, ma dau tieng Viet cua font thay the dat
# khong khop voi than chu - phong len 92px la thay ngay. Chu khong dau thi
# khong co van de do. Tieng Viet van dung binh thuong o the <title> va cac the
# og: trong index.html, do la chu that chu khong phai anh.
KICKER = 'FOR LUYNA'
TITLE = 'Lovely Memories'

INK = (36, 26, 16)
GOLD = (214, 178, 108)
CREAM = (248, 238, 217)


def font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except OSError:
        return ImageFont.truetype(SERIF, size)


def spaced(draw, xy, text, fnt, fill, track=0, anchor_mid=True):
    """Ve chu co gian khoang cach - Pillow khong co letter-spacing san."""
    widths = [draw.textlength(c, font=fnt) for c in text]
    total = sum(widths) + track * (len(text) - 1)
    x, y = xy
    if anchor_mid:
        x -= total / 2
    for c, w in zip(text, widths):
        draw.text((x, y), c, font=fnt, fill=fill)
        x += w + track
    return total


def share_image():
    scene = Image.open(SCENE).convert('RGB')
    # Cat theo khuon 1.91:1, neo len phia tren mot chut: vom tran va chum den la
    # phan dep nhat cua canh sanh, con mat san thi khong noi len dieu gi.
    w, h = scene.size
    crop_h = round(w / (W / H))
    top = round((h - crop_h) * 0.32)
    im = scene.crop((0, top, w, top + crop_h)).resize((W, H), Image.LANCZOS)

    # Ha sang toan anh de chu noi len, roi toi dan ra bon goc cho mat do ve giua
    im = Image.blend(im, Image.new('RGB', (W, H), INK), 0.34)
    vign = Image.new('L', (W, H), 0)
    ImageDraw.Draw(vign).ellipse((-W * 0.30, -H * 0.55, W * 1.30, H * 1.55), fill=255)
    vign = vign.filter(ImageFilter.GaussianBlur(90))
    im = Image.composite(im, Image.blend(im, Image.new('RGB', (W, H), INK), 0.5), vign)

    # Mot quang toi mem sau khoi chu. Canh sanh sang nhat dung ngay giua (vom
    # tran, cau thang), chu vang dat thang len do se chim; quang nay keo nen
    # xuong du de chu noi len ma van khong doc ra la mot cai hop den.
    veil = Image.new('L', (W, H), 0)
    ImageDraw.Draw(veil).ellipse((W * 0.10, H * 0.16, W * 0.90, H * 0.80), fill=150)
    veil = veil.filter(ImageFilter.GaussianBlur(70))
    im = Image.composite(Image.blend(im, Image.new('RGB', (W, H), INK), 0.62), im, veil)

    d = ImageDraw.Draw(im)
    # Duong chi vang vien trong, kieu bang ten treo trong bao tang
    d.rectangle((26, 26, W - 27, H - 27), outline=(120, 98, 60), width=1)
    d.rectangle((32, 32, W - 33, H - 33), outline=(168, 138, 84), width=1)

    # Chi hai dong, khong ghi ngay thang: cau chuyen chua co ngay ket, ma ghi
    # moi ngay bat dau thi lai thanh mot cai moc kho khan tren mot tam anh von
    # chi de moi nguoi buoc vao.
    spaced(d, (W / 2, 232), KICKER, font(SERIF, 30), GOLD, track=11)
    spaced(d, (W / 2, 294), TITLE, font(SERIF_MED, 92), CREAM, track=2)

    im.save(OUT / 'share-1200x630.jpg', 'JPEG', quality=88, optimize=True, progressive=True)
    return (OUT / 'share-1200x630.jpg').stat().st_size


def heart(size):
    """Mot trai tim vang tren nen muc, bo vien vang mong - ve o co lon roi thu
       nho lai cho vien khong bi rang cua."""
    s = size * 8
    im = Image.new('RGB', (s, s), INK)
    d = ImageDraw.Draw(im)
    d.ellipse((s * 0.06, s * 0.06, s * 0.94, s * 0.94), outline=(120, 96, 56), width=max(1, s // 90))

    # Trai tim = hai vong tron + mot tam giac, cach dung nhat va ro nhat o 16px
    r = s * 0.205
    cx, cy = s / 2, s * 0.415
    d.ellipse((cx - r * 1.94, cy - r, cx + r * 0.06, cy + r), fill=GOLD)
    d.ellipse((cx - r * 0.06, cy - r, cx + r * 1.94, cy + r), fill=GOLD)
    d.polygon([(cx - r * 1.93, cy + r * 0.16), (cx + r * 1.93, cy + r * 0.16),
               (cx, s * 0.875)], fill=GOLD)
    return im.resize((size, size), Image.LANCZOS)


def icons():
    heart(180).save(OUT / 'apple-touch-icon.png')
    heart(48).save(OUT / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])


if __name__ == '__main__':
    size = share_image()
    icons()
    print(f'-> assets/images/share-1200x630.jpg  ({size // 1024} KB)')
    print('-> assets/images/favicon.ico  (16/32/48)')
    print('-> assets/images/apple-touch-icon.png  (180)')
