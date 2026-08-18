#!/usr/bin/env python3
"""Quet memories/ va sinh ra assets/js/chapters.js.

Them mot ky niem = tao thu muc `memories/DD-MM-YYYY/`, bo anh vao, chay:

    python3 tools/scan-memories.py

Quy uoc ten file trong moi thu muc:
    memory-<w>w.webp           canh phong, ban cat ngang
    memory-portrait-<w>w.webp  canh phong, ban cat doc
    art-NN-<w>w.webp           tranh treo tuong (ban rong nhat dung cho lop xem)

Thu muc khong co anh canh thi muon canh, CHON THEO SO TRANH (xem
SCENE_BY_ARTS). Gia tri co the la:
    'DD-MM-YYYY'   muon canh cua mot ky niem khac (canh co hoc tuong, o tuong)
    'bg:<ten>'     dung anh nen chung trong assets/images/background/
                   (<ten>-<w>w.webp va <ten>-portrait-<w>w.webp)
Nen chung deu la tuong PHANG nen treo bao nhieu buc cung duoc; canh co san hoc
tuong / o tuong thi phai co bo toa do rieng cho tung so luong.

Thu muc rong (khong tranh, khong canh) bi bo qua - de san cho nhung ngay chua co
anh ma khong lam ban dong thoi gian.

Trang tinh khong the tu liet ke thu muc luc chay (GitHub Pages khong cho index),
nen danh sach phai duoc chot san o day thay vi do tim tu trinh duyet.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MEM = ROOT / 'memories'
OUT = ROOT / 'assets' / 'js' / 'chapters.js'

# Phong dung cho thu muc khong co anh canh, chon theo so tranh trong thu muc do
# Chon nen theo SO TRANH. Chi co hai nen: `room-statue` co hai o tuong hai ben
# hoc tuong (vua dung cho hai buc), `room-panels` co ba o tuong nen nhan duoc
# moi so luong khac. Cach treo trong tung nen do js/layout.js tu tinh.
SCENE_BY_ARTS = {2: 'room-statue'}
SCENE_FALLBACK = 'room-panels'
BG_DIR = 'assets/images/background'
# CHI nhan nen co tien to `room-`: trong cung thu muc con co gate-* va hall-*
# la canh cong va canh sanh (noi tha khung loi ngo), khong phai phong trung bay.
BG_FILE = re.compile(r'^(room-[a-z0-9-]+?)(-portrait)?-(\d+)w\.webp$')

DATE = re.compile(r'^(\d{2})-(\d{2})-(\d{4})$')
FILE = re.compile(r'^(memory-portrait|memory|art-\d+)-(\d+)w\.webp$')


def scan(folder: Path):
    """Gom cac file theo nhom, moi nhom sap theo be rong tang dan."""
    groups: dict[str, list[tuple[int, str]]] = {}
    for f in sorted(folder.iterdir()):
        m = FILE.match(f.name)
        if m:
            groups.setdefault(m.group(1), []).append((int(m.group(2)), f.name))
    for v in groups.values():
        v.sort()
    return groups


def srcset(folder: str, items):
    return ',\n                    '.join(f"'memories/{folder}/{n} {w}w'" for w, n in items)


def size(path: Path):
    from struct import unpack
    d = path.read_bytes()
    if d[12:16] == b'VP8X':
        return (int.from_bytes(d[24:27], 'little') + 1,
                int.from_bytes(d[27:30], 'little') + 1)
    if d[12:16] == b'VP8 ':
        i = 26
        return (unpack('<H', d[i:i+2])[0] & 0x3fff, unpack('<H', d[i+2:i+4])[0] & 0x3fff)
    if d[12:16] == b'VP8L':
        b = int.from_bytes(d[21:25], 'little')
        return ((b & 0x3fff) + 1, ((b >> 14) & 0x3fff) + 1)
    raise ValueError(f'khong doc duoc kich thuoc: {path}')


def js_list(folder, items, sizes):
    w, h = sizes
    return ('{ src: %r, srcset: %s, width: %d, height: %d }'
            % (f'memories/{folder}/{items[0][1]}',
               '[' + ', '.join(f"'memories/{folder}/{n} {wd}w'" for wd, n in items) + '].join(", ")',
               w, h))


def shared_scenes():
    """Cac anh nen dung chung trong assets/images/background/."""
    out = {}
    d = ROOT / BG_DIR
    for f in sorted(d.iterdir()) if d.is_dir() else []:
        m = BG_FILE.match(f.name)
        if not m:
            continue
        name, portrait, w = m.group(1), bool(m.group(2)), int(m.group(3))
        sc = out.setdefault(name, {'folder': name, 'wide': [], 'tall': [], 'plain': True})
        sc['tall' if portrait else 'wide'].append((w, f.name))
    for sc in out.values():
        sc['wide'].sort(); sc['tall'].sort()
    return out


def main():
    folders = sorted((p for p in MEM.iterdir() if p.is_dir() and DATE.match(p.name)),
                     key=lambda p: tuple(reversed(DATE.match(p.name).groups())))
    groups = {p.name: scan(p) for p in folders}

    # Cac phong co anh canh that: nguon de cho vay
    scenes = {name: {'folder': name, 'wide': g.get('memory'), 'tall': g.get('memory-portrait')}
              for name, g in groups.items() if 'memory' in g or 'memory-portrait' in g}
    shared = shared_scenes()

    chapters, skipped = [], []
    for folder in folders:
        g = groups[folder.name]
        arts = [(name, items) for name, items in sorted(g.items()) if name.startswith('art-')]
        scene = scenes.get(folder.name)
        if not scene:
            if not arts:
                skipped.append(folder.name)   # thu muc rong: chua den luot
                continue
            name = SCENE_BY_ARTS.get(len(arts), SCENE_FALLBACK)
            scene = shared.get(name)
        chapters.append({'folder': folder.name, 'scene': scene, 'arts': arts})

    lines = ["/* FILE NAY DUOC SINH RA TU thu muc memories/ - dung sua tay.",
             "   Chay lai sau khi them ky niem:  python3 tools/scan-memories.py */",
             "export const CHAPTERS = ["]
    for ch in chapters:
        sc = ch['scene']
        lines.append(f"    {{")
        lines.append(f"        folder: '{ch['folder']}',")
        if sc:
            lines.append(f"        scene: {{")
            lines.append(f"            folder: '{sc['folder']}',")
            for key in ('wide', 'tall'):
                items = sc[key]
                if not items:
                    continue
                base = BG_DIR if sc.get('plain') else f"memories/{sc['folder']}"
                w, h = size(ROOT / base / items[-1][1])
                srcs = ', '.join(f"'{base}/{n} {wd}w'" for wd, n in items)
                pick = items[len(items) // 2][1]
                lines.append(f"            {key}: {{ src: '{base}/{pick}',")
                lines.append(f"                    srcset: [{srcs}], width: {w}, height: {h} }},")
            if sc.get('plain'):
                lines.append(f"            plain: true,")
            lines.append(f"        }},")
        lines.append(f"        arts: [")
        for name, items in ch['arts']:
            w, h = size(MEM / ch['folder'] / items[-1][1])
            small = [i for i in items if i[0] <= 768] or items[:1]
            srcs = ', '.join(f"'memories/{ch['folder']}/{n} {wd}w'" for wd, n in small)
            lines.append(f"            {{ name: '{name}',")
            lines.append(f"              src: 'memories/{ch['folder']}/{small[0][1]}',")
            lines.append(f"              srcset: [{srcs}],")
            lines.append(f"              full: 'memories/{ch['folder']}/{items[-1][1]}',")
            lines.append(f"              width: {w}, height: {h} }},")
        lines.append(f"        ],")
        lines.append(f"    }},")
    lines.append("];")
    OUT.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(f'-> {OUT.relative_to(ROOT)}')
    for ch in chapters:
        sc = ch['scene']
        note = f" -> {sc['folder']}" if sc else ' (CHUA CO PHONG)'
        print(f"   {ch['folder']}: {len(ch['arts'])} tranh{note}")
    if skipped:
        print(f'   bo qua {len(skipped)} thu muc rong: {", ".join(skipped)}')


if __name__ == '__main__':
    main()
