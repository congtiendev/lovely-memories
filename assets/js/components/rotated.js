/* Che do "xoay" cho iPhone: trang chay TRONG mot iframe da xoay 90 do (rotate.html), nen no thay
   mot man hinh ngang that. File nay lo nhung gi iframe xoay can them:

     - class `is-rotated` tren <html> (nut xoay thanh nut "quay lai man hinh doc", xem strip.css)
     - bao trang khung moi khi doi man hinh (de F5 van vao dung cho) va khi nguoi xem muon thoat
     - vuot bang tay: cuon / danh sach cuon cua trinh duyet nam trong iframe da xoay, safari khong
       dam bao doi chieu vuot theo chieu xoay, nen o day tu vuot bang JS (touch-action: none).

   Ngoai iframe xoay, file nay khong lam gi. */
export const ROTATED = window.parent !== window
    && new URLSearchParams(location.search).get('rotated') === '1';

if (ROTATED) document.documentElement.classList.add('is-rotated');

/** Bao trang khung. Chi gui cho cung goc (rotate.html cung thu muc). */
export function tell(message) {
    try { parent.postMessage(message, location.origin); } catch { /* khong sao */ }
}

/**
 * Vuot bang tay mot khung cuon trong iframe xoay.
 * @param axis 'x' | 'y'
 * @param onStart goi khi bat dau vuot that (de dung cac thu dang tu cuon cua khung do)
 */
function pan(el, axis, onStart = () => {}) {
    const prop = axis === 'x' ? 'scrollLeft' : 'scrollTop';
    const pos = event => (axis === 'x' ? event.clientX : event.clientY);
    let id = null, start = 0, from = 0, dragging = false, last = 0, lastT = 0, speed = 0, raf = 0;

    el.addEventListener('pointerdown', event => {
        if (event.pointerType !== 'touch' || id !== null) return;
        cancelAnimationFrame(raf);
        id = event.pointerId;
        start = last = pos(event);
        lastT = event.timeStamp;
        from = el[prop];
        dragging = false;
        speed = 0;
    });
    el.addEventListener('pointermove', event => {
        if (event.pointerId !== id) return;
        const p = pos(event);
        if (!dragging && Math.abs(p - start) > 8) {
            dragging = true;
            onStart();
            try { el.setPointerCapture(id); } catch { /* khong sao */ }
        }
        if (!dragging) return;
        el[prop] = from - (p - start);
        const dt = Math.max(1, event.timeStamp - lastT);
        speed = (p - last) / dt;   // px / ms
        last = p; lastT = event.timeStamp;
    });
    const end = event => {
        if (event.pointerId !== id) return;
        id = null;
        if (!dragging) return;
        // Vuot xong tay nhac len: nuot cu click ke tiep (khong thi tha tay ra lai tinh la bam vao tranh)
        el.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); }, { capture: true, once: true });
        setTimeout(() => el.removeEventListener('click', () => {}, true), 0);
        // Quan tinh: troi tiep roi cham dan
        let v = Math.max(-3, Math.min(3, speed));
        let t0 = performance.now();
        const glide = now => {
            const dt = Math.min(64, now - t0); t0 = now;
            el[prop] -= v * dt;
            v *= Math.exp(-dt / 320);
            if (Math.abs(v) > 0.02) raf = requestAnimationFrame(glide);
        };
        raf = requestAnimationFrame(glide);
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
}

/**
 * @param modes dai ngang (strip.js): dung cac thu dang tu cuon khi nguoi xem bat dau vuot
 */
export function initRotated({ modes }) {
    if (!ROTATED) return;
    const rooms = document.querySelector('.rooms');
    if (rooms) pan(rooms, 'x', () => modes.freeze());
    const list = document.querySelector('.timeline__rows');
    if (list) pan(list, 'y');

    // Nut o goc phai: o day no la "quay lai man hinh doc"
    const tip = document.querySelector('.rotate-btn__tip');
    if (tip) tip.textContent = 'Xoay máy sang ngang (đầu máy hướng sang trái). Bấm đây để quay lại màn hình dọc';
    const button = document.querySelector('.rotate-btn');
    if (button) button.setAttribute('aria-label', 'Quay lại màn hình dọc');

    const report = () => tell({ type: 'route', hash: location.hash });
    addEventListener('hashchange', report);
    report();
}
