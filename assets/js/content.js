/* Loi nhan duoc go ra trong khung. Moi phan tu la mot doan. */
export const MESSAGE = [
    'Hi Luyna, dù mình quen nhau chưa lâu, nhưng tính ra cũng đã khoảng 3 tháng kể từ khi hai đứa bắt đầu nói chuyện với nhau nhiều hơn và dần tìm hiểu về nhau. Ba tháng — không quá ngắn, cũng chẳng phải quá dài, nhưng đủ để có những khoảnh khắc và kỷ niệm đáng nhớ.',
    'Anh tạo trang web này như một nơi nhỏ để lưu lại những điều đó, để sau này mình có thể nhìn lại những câu chuyện, những khoảnh khắc mình từng đi qua.',
    'Thi thoảng lúc rảnh, em mở ra xem lại nhaaa ^^',
];

/* Nhan cho tung buc tranh (may doc man hinh doc len, va la chu trong lop xem).
   Chi cho nao can noi ro noi dung moi ghi; khong ghi thi lay ngay lam nhan.
   Danh sach chuong thi khong o day - no duoc sinh ra tu thu muc memories/,
   xem tools/scan-memories.py. */
export const ART_LABELS = {
    '17-03-2026/art-01': 'Xem tranh: Luynhne đã bắt đầu follow bạn',
    '17-03-2026/art-02': 'Xem tranh: tin nhắn đầu tiên ngày 17 tháng 3',
    '22-05-2026/art-01': 'Xem tranh: Khánh Linh đã chấp nhận lời mời kết bạn',
    '19-06-2026/art-01': 'Xem tranh: hộp su kem trên bàn làm việc',
    '20-06-2026/art-01': 'Xem tranh: ly trà sữa KOI - "Ôi cảm ơn A đẹp troai"',
    '20-06-2026/art-02': 'Xem tranh: danh bạ "Luy Na"',
    '24-06-2026/art-01': 'Xem tranh: cuộc gọi một tiếng ba phút',
    '26-06-2026/art-01': 'Xem tranh: gấu bông và nước dừa',
    '23-06-2026/art-01': 'Xem tranh: bìa bài hát "Em đồng ý"',
    '23-06-2026/art-02': 'Xem tranh: màn hình khoá đầy thông báo tin nhắn',
    '23-06-2026/art-03': 'Xem tranh: đoạn chat gửi bài "Em đồng ý"',
    '28-06-2026/art-01': 'Xem tranh: bó hoa hồng phấn',
    '28-06-2026/art-02': 'Xem tranh: con ngõ lúc chạng vạng',
    '28-06-2026/art-03': 'Xem tranh: bữa nướng hai đứa',
    '28-06-2026/art-04': 'Xem tranh: hai ly nước và vé xem phim CGV',
    '29-06-2026/art-01': 'Xem tranh: gấu bông thỏ trên chiếc áo hoodie',
    '30-06-2026/art-01': 'Xem tranh: hai ly nước trên bàn quán',
    '30-06-2026/art-02': 'Xem tranh: góc quán cà phê',

    '04-07-2026/art-01': 'Xem tranh: cầu kính đèn neon hình trái tim và bó hoa',
    '04-07-2026/art-02': 'Xem tranh: Luyna trước bức tường ảnh photobooth',
    '04-07-2026/art-03': 'Xem tranh: ngồi bên ô cửa nhìn xuống thành phố về đêm',
    '04-07-2026/art-04': 'Xem tranh: hộp hoa và tấm thiệp trên tay',
    '11-07-2026/art-01': 'Xem tranh: hộp hoa ly và cẩm chướng, chữ LOVE',
    '11-07-2026/art-02': 'Xem tranh: mở hộp hoa trên nền gạch ca-rô',
    '11-07-2026/art-03': 'Xem tranh: bàn cơm chay và chiếc túi love',
    '18-07-2026/art-01': 'Xem tranh: mặt sông đêm lấp loáng ánh đèn',
    '18-07-2026/art-02': 'Xem tranh: Luyna bên bàn ăn trong quán',
    '18-07-2026/art-03': 'Xem tranh: bóng hai đứa trong chiếc gương tròn',
    '18-07-2026/art-04': 'Xem tranh: bữa trưa hôm ấy',
    '18-07-2026/art-05': 'Xem tranh: cả mâm cơm nhìn từ trên xuống',
    '22-07-2026/art-01': 'Xem tranh: chiếc đèn nan tre trên bàn gỗ',
    '22-07-2026/art-02': 'Xem tranh: cà phê đường tàu, bó hoa và trái dừa',
    '22-07-2026/art-03': 'Xem tranh: bữa bánh xèo của hai đứa',
    '22-07-2026/art-04': 'Xem tranh: bó cẩm chướng hồng kèm lời nhắn',
    '24-07-2026/art-01': 'Xem tranh: mâm cơm chay và ấm trà',
    '24-07-2026/art-02': 'Xem tranh: ly cà phê trong quán sáng đèn',
    '24-07-2026/art-03': 'Xem tranh: khung chat "Luy Na" - lời mời kết bạn',
    '01-08-2026/art-01': 'Xem tranh: túi quà và ly nước trước giờ chiếu phim',
    '01-08-2026/art-02': 'Xem tranh: hai bàn tay nắm nhau',
    '05-08-2026/art-01': 'Xem tranh: cơm chiên trong trái thơm',
    '05-08-2026/art-02': 'Xem tranh: trước cửa nhà hàng chay',
    '05-08-2026/art-03': 'Xem tranh: căn nhà cổ mái ngói giữa vòm cây',
    '05-08-2026/art-04': 'Xem tranh: Luyna bên bàn ăn trưa',
    '05-08-2026/art-05': 'Xem tranh: bữa trưa cuối tuần',
};

/* Tour huong dan, chay mot lan khi lan dau buoc vao mot phong ky niem.
   `at` la CSS selector cua thu se duoc soi sang. Buoc nao khong tim thay dich,
   hoac dich dang bi an, thi tu bi bo qua - xem js/components/tour.js. */
export const TOUR = [
    {
        at: '.timeline__tab',
        title: 'Dòng thời gian',
        text: 'Mở ra danh sách tất cả kỷ niệm theo ngày. Bấm một ngày là tới thẳng phòng đó, không cần đi lần lượt.',
    },
    {
        at: '.mode__btn',
        title: 'Chế độ xem',
        text: 'Hai cách đi qua các kỷ niệm: trình chiếu từng phòng, hoặc nối liền thành một dải để cuộn ngang. Bấm vào đây để đọc mô tả rồi chọn.',
    },
    {
        at: '.room.is-open .room__art',
        title: 'Tranh trên tường',
        text: 'Bấm vào một bức để xem ảnh lớn. Bấm ra ngoài hoặc nhấn Esc là đóng lại.',
    },
    {
        at: '.sound',
        title: 'Nhạc nền',
        text: 'Bật hoặc tắt nhạc bất cứ lúc nào.',
    },
    {
        at: '.room.is-open .room__next',
        title: 'Đi tiếp',
        text: 'Bấm TIẾP, hoặc bấm vào nửa phải của phòng, để sang ngày sau. Bấm nửa trái để lùi về ngày trước.',
    },
];
