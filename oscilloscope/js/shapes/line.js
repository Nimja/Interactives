export class Line {
    constructor(p1, p2) {
        this.p1 = p1;
        this.p2 = p2;
        this.connected = true;
    }

    /**
     * Get the point on this path at position "t".
     *
     * T is NOT distance based, but linear interpolation based.
     *
     * @param {Number} t
     * @returns {Point}
     */
    getAt(t) {
        return this.p1.fadeTo(this.p2, t);
    }
}