/* Loi nhan duoc go ra trong khung. Moi phan tu la mot doan. */
export const MESSAGE = [
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

/* Cau nhan vat noi khi vua vao man cong, trong bong bong thoai. */
export const GREETING = 'Xin chào em iuuuu, em là em anh Kong, hôm nay em sẽ dẫn chị đi tham quan bảo tàng Keep Memories, nơi lưu giữ những kỷ niệm của Kong Tien & Sunbee';

/* Sau cau chao, nhan vat hoi cau nay kem nut: bam thi di mo cua va vao sanh. */
export const LETS_GO = { text: 'Chúng ta bắt đầu nhé?', button: 'OK' };

/* Thuyet minh theo tung phong: bam nut "Thuyet minh" thi phat loi long tieng va nhan vat noi
   (components/narrator.js). Khoa la ten thu muc ky niem.
     audio  file long tieng (tuy chon, de trong thu muc cua ky niem). Co thi chu trong bong
            bong duoc go cho khop do dai loi doc; khong co thi chi go chu.
     lines  tung cau, noi lan luot, moi cau mot bong bong. Nen khop voi loi trong file audio.
     starts (tuy chon) giay bat dau noi cua tung cau trong file audio, theo thu tu `lines`. Lay tu
            cho nghi that giua cac cau (xem so do song am). Khong co thi thoi gian moi cau chia theo
            so chu - sai lech toi ~1s vi moi cau doc nhanh cham khac nhau.
   Phong nao chua co o day thi nut Thuyet minh tu an. */
export const NARRATION = {
    '17-03-2026': {
        audio: 'memories/17-03-2026/thuyet-minh.mp3',
        starts: [0.06, 10.82],
        lines: [
            'Chà vào một buổi sáng đẹp trời, anh nhận được một tin nhắn trên tiktok, à ra là một bạn muốn xin việc vào vị trí sale, vốn cũng nhiệt tình nên anh cũng tư vấn, giới thiệu công ty các kiểu.',
            'Thời gian sau không thấy ẻm í ới gì nữa anh nghĩ là em kiếm được cv mới rui nên cũng không có tin nhắn nào được gửi thêm.',
        ],
    },
    '22-05-2026': {
        audio: 'memories/22-05-2026/thuyet-minh.mp3',
        starts: [0.06, 14.0],
        lines: [
            'Còn duyên thì sẽ gặp lại mà, 2 tháng sau anh lại em trên chiếc SH mode mà đen biển 89 và đi chung thang máy cùng em, ấn tượng là vết bỏng ở cổ mà anh tưởng là vết bớp. Cũng là hôm đó em có rep story tiktok của anhh.',
            'Và từ đó chúng ta bắt đầu trò chuyện nhiều hơn...',
        ],
    },
    '19-06-2026': {
        audio: 'memories/19-06-2026/thuyet-minh.mp3',
        starts: [0.06, 16.2, 26.1, 33.14],
        lines: [
            'Thời gian đầu có vẻ chưa quen với sự có mặt của ai đó trong cuộc sống, anh cũng chưa có nhiều chủ đề chung để nói với em nên câu chuyện của chúng ta cứ ngắt quãng 1 2 có khi 3 ngày mới nhắn tiếp, anh cũng chủ động up story nhiều hơn chờ ẻm rep, và ẻm rep thật hehe.',
            'Cả locket nữa, anh nghĩ đây mới là cầu nối để chúng ta hiểu về nhau hơn. Buồn cười là cả 2 đều không giỏi tiếng anh nhưng lại thả thính nhau bằng tiếng anh mới chịu haha.',
            'Vào một ngày ẻm đăng locket làm bánh, anh vào khen và cũng may mắn nhận được 1 phần cho đích thân chính chủ ship đến tận tay.',
            'Lần đầu gặp em vừa hồi hộp vừa ngại, anh chỉ kịp nói 1 câu "Ở ngoài em xinh hơn trong ảnh" rùi chạy mất. Cảm ơn em iu nhìu, bánh rất ngonnn',
        ],
    },
    '20-06-2026': {
        audio: 'memories/20-06-2026/thuyet-minh.mp3',
        starts: [0.04],
        lines: [
            'Này là một hôm ẻm đăng note muốn uống gì đó, anh xin số luôn và hỏa tốc ngay một ly Koi Thé đến cho ẻm, với anh lưu số điên thoại của em iu cũng là 1 cột mốc đáng được ghi nhận.',
        ],
    },
    '23-06-2026': {
        audio: 'memories/23-06-2026/thuyet-minh.mp3',
        starts: [0.12],
        lines: [
            'Sau một thời gian nhắn tin đò đưa, anh cũng đưa ra một quyết định rất quan trọng trong cuộc đời mình, là ngỏ lời first date với em iu, anh đã lên sẵn kế hoạch, tâm thư và thật tuyệt khi ẻm đã đồng ý, oh zê she said yessss',
        ],
    },
    '24-06-2026': {
        audio: 'memories/24-06-2026/thuyet-minh.mp3',
        starts: [0.08, 12.6],
        lines: [
            'Cuộc gọi lúc nửa đêm, này là khi ẻm đi đâu về mà lúc tối bận chưa rep tin nhắn anh được nên ẻm call luôn, lúc đầu anh còn ngại bảo tí anh gọi lại để chuẩn bị tinh thần, và 15p sau anh đã gọi lại.',
            'Ẻm khen giọng anh men, không biết chúng ta đã tâm sự gì cả tiếng đồng hồ nhưng buổi tối hôm đấy đối với anh thực sự rất bay bổng, tâm trạng có thể trên mây luôn.',
        ],
    },
    '26-06-2026': {
        audio: 'memories/26-06-2026/thuyet-minh.mp3',
        starts: [0.04, 6.6],
        lines: [
            'Ẻm có đi hiến máu và hỏi anh có thích gấu không ẻm cầm về cho, anh quyết định chúng ta sẽ trao đổi gấu cho nhau luôn,',
            'hôm đó ẻm cũng mua theo 1 quả dừa cầm lên vì đọc được ở đâu đó dừa tốt cho phụ nữ khi vào kì dâu, nhưng ẻm bận không ra nhận được nên nhờ một cậu trợ lí ra nhận.',
        ],
    },
    '28-06-2026': {
        audio: 'memories/28-06-2026/thuyet-minh.mp3',
        starts: [0.1, 12.02, 18.26, 25.84],
        lines: [
            'Cuối cùng ngày này cũng đã đến, buổi hẹn hò đầu tiên của chúng ta, hôm ấy anh dành nguyên buổi trưa để đi tìm hoa và đặt, 4h chiều anh từ quê lên Hà Nội và dọn phòng xong tắm là anh đi lấy hoa luôn.',
            'Vì muốn tạo cho em iu sự bất ngờ nên anh có đến quán trước, gửi hoa ở đó rồi mới qua đón em iu.',
            'Buổi date hôm đó ổn hơn anh mong đợi, anh thậm chí còn không bị rơi vào im lặng phút nào vì cách dẫn dắt của ẻm làm cho anh rất thoải mái.',
            'Đến cuối ngày tôi nhận được lời nhận xét từ ẻm, good job, tôi quyết định dù có phải đánh đổi gì thì tôi cũng phải cưa đổ em ấy.',
        ],
    },
    '29-06-2026': {
        audio: 'memories/29-06-2026/thuyet-minh.mp3',
        starts: [0.06],
        lines: [
            'Đến hôm nay anh mới nhận được gấu từ ẻm, anh sẽ coi đây là món quà đầu tiên mà em tặng anh, vì nhỏ xinh nên anh không ôm được mà chỉ gối đầu ngủ trưa, nó vẫn luôn nằm ở góc tủ nơi anh ngủ trên công ty.',
        ],
    },
    '30-06-2026': {
        audio: 'memories/30-06-2026/thuyet-minh.mp3',
        starts: [0.06, 9.9],
        lines: [
            'Lần đầu rủ ẻm đi cafe, nay ẻm khá bận, khách gọi hỏi trao đổi liên tục, mỗi lần vậy ẻm đều xin phép, xong việc thì đặt luôn điện thoại xuống nói chuyện với anh,',
            'buổi này chủ yếu nói về công việc của anh đưa nên cũng chưa tìm hiểu được nhiều về nhau nhưng anh nhận ra em khá thích đồ màu đen, vì 3 4 lần gặp đều 1 tông màu đen chủ đạo.',
        ],
    },
    '04-07-2026': {
        audio: 'memories/04-07-2026/thuyet-minh.mp3',
        starts: [0.06, 7.08, 13.08],
        lines: [
            'Này là buổi date thứ 3 của tụi mình, hôm này anh đã chuẩn bị plan khá kỹ từ bước chọn hoa, tone màu và địa điểm date.',
            'Thấy ẻm cũng có vẻ khá ưng hoa anh tặng. Lần đầu chụp ảnh cùng nhau trông ai cũng hơi gượng gạo.',
            'Hôm ấy tụi mình nói chuyện xoay quanh cuộc sống, tuổi thơ và drama ở công ty, anh hơi bất ngờ là 10 giờ 30 ẻm đã kiu buồn ngủ và xin đi về rui.',
        ],
    },
    '11-07-2026': {
        audio: 'memories/11-07-2026/thuyet-minh.mp3',
        starts: [0.08, 6.16, 13.84, 21.76],
        lines: [
            'Buổi date thứ tư của chúng mình, do còn thiếu kinh nghiệm chọn quán nên anh dẫn em vào 1 quán lẩu trong Lĩnh Nam.',
            'Trông ẻm có vẻ không thoải mái lắm là chúng mình out luôn. Và rồi ẻm dắt anh đi nét huế, quán cũng rất là oke la.',
            'Hoa hôm ấy anh chọn là hoa ly, ẻm có vẻ bất ngờ vì tưởng đây là hoa tặng để chia ly, nhưng khoongggg, tại anh thấy đẹp thôi.',
            'Và cũng từ đó về sau ẻm không nhận thêm được bó hoa nào có ly nữa.',
        ],
    },
    '18-07-2026': {
        audio: 'memories/18-07-2026/thuyet-minh.mp3',
        starts: [0.1, 9.82, 16.58, 24.24],
        lines: [
            'Hôm này đánh dấu 1 sự kiện mà ẻm có thể khịa đến tận bây giờ. Tối đó anh có chọn 1 quán ăn chay để 2 đứa cùng trải nghiệm, còn ẻm thì mặc một bộ váy trắng rất xinh.',
            'Đây cũng là lần đầu chúng mình chụp ảnh cho nhau. Hôm sau ảnh bế luôn lên story mặc dù còn chưa là gì của nhau.',
            'Ăn xong thì tụi mình có đi đạp vịt, anh có định nắm tay ẻm mà ngại không dám, trong lúc trò chuyện thì ẻm có gợi về mối quan hệ của chúng mình,',
            'và ảnh đùa rằng đang thử việc nên cần tìm hiểu thêm thời gian, và ẻm chốt luôn cho 2 tháng hic.',
        ],
    },
    '24-07-2026': {
        audio: 'memories/24-07-2026/thuyet-minh.mp3',
        starts: [0.08, 9.7, 16.12, 25.86],
        lines: [
            'Đây là cột mốc rất quan trọng mà anh không bao giờ quên, trước khi tan làm ẻm vẫn còn thả thính anh mà chỉ nửa tiếng sau, em thoại 1 câu chấn động "Mình tạm dừng tìm hiểu anh nhé".',
            'Hôm ấy xe anh hỏng nên đang ở quán sửa xe, máy thì cũng gần hết pin nên định về nhà rồi call lại hỏi rõ đầu đuôi,',
            'nhưng về nhà thì ẻm block fb và hủy zalo, anh rất buồn nghĩ có lẽ duyên mình hết rồi, nhưng anh thấy ẻm vẫn chưa hủy locket, anh vẫn thấy 1 tia hi vọng nào đó.',
            'Và rui chiều hôm sau tan làm ẻm hẹn anh ra để nói chuyện, thấu hiểu và thông cảm cho nhau rùi dắt nhau đi ăn lẩu :> lần đầu tiên ăn lẩu cùng nhao diễn ra như thế đóa.',
        ],
    },
    '01-08-2026': {
        audio: 'memories/01-08-2026/thuyet-minh.mp3',
        starts: [0.08, 11.66],
        lines: [
            'Trước đó 3 hôm anh có nhận ra thái độ rất khác từ ẻm, ẻm giận anh, khó chịu với anh nhưng anh vẫn chưa biết được nguyên nhân là gì, hôm này hẹn gặp 2 đứa chơi một bộ bài đặt câu hỏi để thấu hiểu nhau hơn.',
            'Điều anh thấy lăn tăn nhất là món quà anh tặng em hôm đó, có lẽ cho anh chọn lại anh sẽ tặng iu 1 bó hoa, anh cảm nhận được là em không thích món quà đó, anh đã rút kinh nghiệm rui em iu ạ.',
        ],
    },
    '05-08-2026': {
        audio: 'memories/05-08-2026/thuyet-minh.mp3',
        starts: [0.04, 7.52, 15.62],
        lines: [
            'Này là lần thứ 2 chúng ta đi ăn chay cùng nhau, hôm đó trời mưa nhỏ, loay hoay lòng vòng trên phố 1 hồi cũng tìm được quán,',
            'đồ ăn oke, không gian ổn nhưng nhân viên đuổi hơi sớm, đây cũng là buổi đi date để tạm xa em iu một thời gian cho ẻm về quê.',
            'Anh cũng không nghĩ là xa em tận nửa tháng đâu :(( Chuỗi ngày vắng em bắt đầu',
        ],
    },
    '21-08-2026': {
        audio: 'memories/21-08-2026/thuyet-minh.mp3',
        starts: [0.06, 7.96],
        lines: [
            '16 ngày xa cách cuối cùng ẻm cũng lên Hà Nội, ẻm có vẻ rất thích con gấu bông anh tặng, cứ ôm miết thôi quên cả cầm tay anh.',
            'Tụi mình có ghé royal chụp ảnh, đây là lần đầu anh ôm eo em chụp ảnh, trước đó ngại toàn xỏ tay hoặc nắm hờ không à',
        ],
    },
    '23-08-2026': {
        audio: 'memories/23-08-2026/thuyet-minh.mp3',
        starts: [0.1],
        lines: [
            'Hôm này trời mưa nhẹ, anh không đến đón em mà book xe cho ẻm đi, anh đến trước, ẻm mặc style thái lẻn gấc xinhhh, chúng mình đi ăn nét huế rui xem spiderman, định đi tip tăng 3 mà trời đổ mưa mất tiêu.',
        ],
    },
    '29-08-2026': {
        audio: 'memories/29-08-2026/thuyet-minh.mp3',
        starts: [0.08, 9.6],
        lines: [
            'Tụi mình có nhận được cái voucher 500k nên hôm này KPI phải đủ 1tr mới được nghỉ, anh chỉ nhớ hôm đó ăn rất nhiều cá, ngán luôn giờ vẫn chưa dám ăn lại.',
            'Tụi mình có ghé miami coffe để chụp ảnh, đây là một quán cafe rất đẹp decor nhiều hoa, làm hay không nhìn ra đâu là ẻm đâu là hoa nữa.',
        ],
    },
    '02-09-2026': {
        audio: 'memories/02-09-2026/thuyet-minh.mp3',
        starts: [0.08, 9.3],
        lines: [
            'Kỷ niệm lần đầu đi xem pháo hoa cùng nhaooo, trước một mình ai rủ chả mấy khi anh bon chen chốn đông người đâu, nhưng chỉ cần em iu thấy thích thì anh triển khai luôn,',
            'hôm đó xem xong tụi mình còn lượn lờ hồ tây, em ôm anh từ phía sau và thủ thỉ những câu truyện dọc đường',
        ],
    },
    '05-09-2026': {
        audio: 'memories/05-09-2026/thuyet-minh.mp3',
        starts: [0.06],
        lines: [
            'Lần đầu tiên đi mua cây tặng ẻm, khởi đầu với một cây hoa 10 giờ dễ trồng dễ chăm, ai rồi cũng bắt đầu từ đâu đó nhỉ',
        ],
    },
};
