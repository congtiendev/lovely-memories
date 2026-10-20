/* Nhip do phai khop voi CSS: doors = --dur (2800ms) + tre cua canh phai (80ms),
   (Cua mo cham tren muc dich - nhan vat doi cua mo het roi moi buoc vao.)
   arriveDelay / arrive = delay va thoi luong cua keyframes `arrive`,
   drop = thoi luong keyframes `drop` cua khung tranh. */
export const TIMING = {
    doors: 2880,          // hai canh xoay xong
    doorsPause: 450,      // cua mo het, dung ngam mot nhip roi nhan vat moi buoc vao
    hold: 1500,           // dung lai ngam truoc khi lao vao
    walkIn: 2300,         // nhan vat buoc vao trong cua va nho dan
    arriveDelay: 980,
    arrive: 2400,
    decodeBudget: 600,    // toi da cho anh giai ma; anh loi thi van phai dien tiep
    letterDelay: 1000,    // vao sanh 1s thi khung tranh roi xuong
    drop: 1400,           // khop voi --drop-dur trong tokens.css
    typeStart: 1150,      // khung vua cham day thi bat dau go chu
    lift: 620,            // khop voi --lift-dur trong tokens.css
    interludeFade: 600,   // khop voi --interlude-fade trong tokens.css
    interlude: 2000,      // man chuyen chuong o lai it nhat bao lau
    interludeMax: 4000,   // ... va cho canh moi toi da bao lau
    calmDoors: 400,       // cac moc rut gon khi nguoi dung tat hieu ung
    calmArrive: 300,
};

/* Nhip go chu. Cac dau cau duoc nghi lau hon cho ra hoi nguoi viet.
   Ca loi nhan ~450 ky tu, cac moc nay cho ra khoang 13s. */
export const TYPING = {
    char: 15,
    jitter: 0.45,         // xe dich +/- 22% quanh moc tren
    comma: 100,           // , ; :
    period: 240,          // . ! ? — …
    paragraph: 520,
};

/* Loi nhan vat noi trong bong bong thoai (components/bubble.js). */
export const SPEECH = {
    startDelay: 0,        // vao cong la noi ngay (F5 cung vay), khong cho
    thinking: 350,        // ba dau cham "dang go" truoc khi chu hien ra
    char: 34,
    comma: 170,           // , ; :
    period: 340,          // . ! ? …
    holdBase: 1600,       // sau khi go xong con giu bong bong de doc: base + perChar * so chu
    holdPerChar: 14,
    leave: 260,           // khop thoi luong animation thu lai trong character.css
};

export const calm = matchMedia('(prefers-reduced-motion: reduce)');
