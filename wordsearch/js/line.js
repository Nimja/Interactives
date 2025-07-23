export class Line {
    constructor(start, end) {
        this.start = start;
        this.end = end ? end : start;
        this.update();
    }
    setEnd(end) {
        if (!this.end.equals(end)) {
            this.end = end;
            this.update();
        }
    }
    clone() {
        return new Line(this.start.clone(), this.end.clone());
    }
    /**
     * Store direction and gridlength.
     */
    update() {
        this.dir = this.start.getDirTo(this.end);
        this.length = this.start.getGridLengthTo(this.end);
    }
    /**
     * Check if length is within margin of this line.
     */
    withinMargin(length, margin) {
        return this.length - margin <= length && length <= this.length + margin;
    }
}