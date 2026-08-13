/* Hai canh cua o cong: chi lo trang thai dong/mo va nhan cua tro giup. */
export class Doorway {
    static LABEL = { open: 'Đóng cửa', closed: 'Mở cửa' };

    constructor(element) {
        this.element = element;
    }

    get isOpen() {
        return this.element.classList.contains('open');
    }

    /** Doi trang thai, tra ve trang thai moi. */
    toggle() {
        return (this.open = !this.isOpen);
    }

    set open(open) {
        this.element.classList.toggle('open', open);
        this.element.setAttribute('aria-expanded', String(open));
        this.element.setAttribute('aria-label',
            open ? Doorway.LABEL.open : Doorway.LABEL.closed);
    }

    /** Khoa lai khi da bat dau bay, khong cho bam nua. */
    lock() {
        this.element.disabled = true;
    }

    /** Ve lai vach xuat phat: dong san, mo khoa. */
    reset() {
        this.open = false;
        this.element.disabled = false;
    }

    onClick(handler) {
        this.element.addEventListener('click', handler);
    }
}
