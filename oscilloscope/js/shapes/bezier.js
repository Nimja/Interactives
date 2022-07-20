export class BezierQuadratic {
    constructor(p1, c, p2) {
        this.p1 = p1; // Starting point.
        this.c = c; // Control point.
        this.p2 = p2; // Ending point.
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
        // Lazy linear interpolation version.
        let m1 = this.p1.fadeTo(this.c, t);
        let m2 = this.c.fadeTo(this.p2, t);
        return m1.fadeTo(m2, t);
    }
}

export class BezierCubic {
    constructor(p1, c1, c2, p2) {
        this.p1 = p1; // Starting point.
        this.c1 = c1; // Control point 1.
        this.c2 = c2; // Control point 2.
        this.p2 = p2; // Ending point.
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
        // Bernstein polynomial form.
        let t2 = t * t;
        let t3 = t2 * t;
        let result = this.p1.clone();
        result.multiply(-t3 + 3 * t2 - 3 * t + 1);
        result.add(this.c1.clone().multiply(3 * t3 - 6 * t2 + 3 * t));
        result.add(this.c2.clone().multiply(-3 * t3 + 3 * t2));
        result.add(this.p2.clone().multiply(t3));

        return result;
    }
}
