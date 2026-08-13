/* Ten thu muc ky niem la 'DD-MM-YYYY'; moi nhan chu tren trang deu suy ra tu do. */

export const dateLabel = folder => folder.split('-').join(' · ');

export const isoDate = folder => folder.split('-').reverse().join('-');

const asDate = folder => {
    const [d, m, y] = folder.split('-').map(Number);
    return new Date(y, m - 1, d);
};

/** Chu tren tam bien chuyen chuong, tinh tu khoang cach giua hai ngay. */
export function gapLabel(from, to) {
    const days = Math.round((asDate(to) - asDate(from)) / 86400000);
    const months = Math.round(days / 30.44);
    if (months >= 12) {
        const years = Math.round(months / 12);
        return `${years} năm sau`;
    }
    if (months >= 1) return `${months} tháng sau`;
    return `${days} ngày sau`;
}
