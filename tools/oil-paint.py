#!/usr/bin/env python3
"""Doi RUOT ANH trong khung sang tranh son dau, giu nguyen khung va vien.

    python3 tools/oil-paint.py <file.webp> ...          # ghi ra ban -oil
    python3 tools/oil-paint.py --box <file.webp> ...    # chi ve o da do duoc

Anh tranh gom ba phan: vien ngoai trong suot, khung vang cham tro, va ruot anh
chup o giua. Chi ruot anh duoc doi; dat hieu ung len ca khung thi net cham tro
va chuyen sac vang se vo thanh dom mau.

Cach do o ruot: di tu tam ra bon phia, dung lai khi gap mot doan lien tuc mau
SANG VA NHAT (tam mat / vien trong cua khung). Tam mat luon nam giua khung va
ruot anh nen day la ranh gioi dang tin nhat ma khong can AI.
"""
import sys
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter


def photo_box(im: Image.Image):
    """Tra ve (l, t, r, b) cua ruot anh chup ben trong khung.

    Hai cach do truoc deu hong: di tu tam ra thi dung ngay giua bo hoa sang mau,
    con dem pixel "giong khung" thi san go va hoa hong am mau cung bi tinh la
    vang cua khung. Cach nay dem nguoc lai - chi dem pixel KHONG THE la khung:
    mau lanh, xanh la, hay gan den. Khung vang cham tro va tam mat khong bao gio
    sinh ra nhung mau do, nen do theo cot/hang thi phan khung ra dung 0.00 con
    ruot anh luon > 0 (do tren ca 28 buc). Cat theo phan tram khoi luong chu
    khong theo doan lien tuc: mot vet am mau vat ngang ruot anh se lam dut doan
    lien tuc, con cat theo khoi luong thi khong he hap gi.
    """
    rgb = im.convert('RGB')
    w, h = rgb.size
    px = rgb.load()
    alpha = im.convert('RGBA').getchannel('A').load()
    step = max(1, min(w, h) // 300)
    xs = range(0, w, step)
    ys = range(0, h, step)

    def alien(x, y):
        if alpha[x, y] < 200:
            return False                     # vien trong suot quanh khung
        r, g, b = px[x, y]
        mx, mn = max(r, g, b), min(r, g, b)
        sat = 0 if mx == 0 else (mx - mn) / mx
        if mx < 45 and sat < 0.55:
            return True                      # gan den: khung khong co vung nay
        if b > g + 6 or g > r + 6:
            return True                      # lanh / tim / xanh la
        return sat > 0.15 and not (r >= g >= b)   # am mau nhung sai thu tu vang

    cols = [sum(alien(x, y) for y in ys) for x in xs]
    rows = [sum(alien(x, y) for x in xs) for y in ys]

    def span(counts, size):
        total = sum(counts)
        if not total:
            return 0, size
        edge = total * 0.004      # bo 0.4% hai dau: vai pixel lac trong khung
        i, run = 0, 0
        while i < len(counts) - 1 and run + counts[i] <= edge:
            run += counts[i]
            i += 1
        j, run = len(counts) - 1, 0
        while j > i and run + counts[j] <= edge:
            run += counts[j]
            j -= 1
        return i * step, min(size, (j + 1) * step)

    l, r = span(cols, w)
    t, b = span(rows, h)
    return (l, t, r, b)


def canvas(size, scale=2):
    w, h = size
    small = Image.effect_noise((max(1, w // scale), max(1, h // scale)), 20).convert('L')
    return small.resize(size, Image.BILINEAR).filter(ImageFilter.GaussianBlur(0.4))


def oil(im: Image.Image, strength: float = 1.0) -> Image.Image:
    """Chi goi cho RUOT anh. Khong posterize: chuyen sac bi be thanh soc mau.

    Ruot anh o day nhieu khi la anh chup man hinh dien thoai: quet ModeFilter
    len thang thi chu tin nhan nhoe thanh vet. Nen sau khi quet ve, cho anh goc
    quay lai o nhung cho co NET MANH (chu, vien vat) qua mot mat na canh - mang
    mau phang van thanh ve son dau, con chu van doc duoc.
    """
    im = im.convert('RGB')
    n = max(3, int(min(im.size) * 0.014 * strength)) | 1
    strokes = im.filter(ImageFilter.ModeFilter(n))          # gom ve thanh mang mau
    strokes = strokes.filter(ImageFilter.ModeFilter(max(3, (n // 2) | 1)))
    strokes = strokes.filter(ImageFilter.MedianFilter(3))
    strokes = ImageChops.blend(strokes, strokes.filter(ImageFilter.SHARPEN), 0.35)

    keep = im.convert('L').filter(ImageFilter.FIND_EDGES)
    keep = keep.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1.2))
    keep = keep.point(lambda v: min(255, int(v * 3.2)))
    out = Image.composite(im, strokes, keep)

    bump = canvas(im.size).filter(ImageFilter.EMBOSS).convert('RGB')
    out = ImageChops.blend(out, ImageChops.soft_light(out, bump), 0.5)
    weave = canvas(im.size, 1).convert('RGB')
    out = ImageChops.blend(out, ImageChops.overlay(out, weave), 0.10)
    return ImageEnhance.Color(out).enhance(0.95)


def main(argv):
    only_box = '--box' in argv
    for p in map(Path, [a for a in argv if not a.startswith('--')]):
        im = Image.open(p)
        box = photo_box(im)
        if only_box:
            shot = im.convert('RGB')
            ImageDraw.Draw(shot).rectangle(box, outline=(255, 0, 0), width=4)
            out = p.with_name(p.stem + '-box.png')
            shot.save(out)
            print(f'{p.name}: o ruot {box} -> {out.name}')
            continue
        done = im.copy()
        done.paste(oil(im.crop(box)), box)
        out = p.with_name(p.stem + '-oil' + p.suffix)
        done.save(out, 'WEBP', quality=88, method=4,
                  **({'alpha_quality': 92} if im.mode in ('RGBA', 'LA') else {}))
        print(f'{p.name}: o ruot {box} -> {out.name}')


if __name__ == '__main__':
    main(sys.argv[1:] or sys.exit(__doc__))
