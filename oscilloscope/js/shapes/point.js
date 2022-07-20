export class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    getDist(p) { // Get distance between points with pythagoras!
        let xd = this.x - p.x;
        let yd = this.y - p.y;
        return Math.sqrt(xd * xd + yd * yd);
    }
    clone() {
        return new Point(this.x, this.y);
    }
    fadeTo(p, v) {
        let rv = 1 - v;
        return new Point(
            rv * this.x + v * p.x,
            rv * this.y + v * p.y
        );
    }

    add(p) {
        this.x += p.x;
        this.y += p.y;
        return this;
    }

    multiply(v) {
        this.x *= v;
        this.y *= v;
        return this;
    }

    /**
     * Reflect this point on another point, becoming the opposite side.
     */
    reflect(p) {
        return new Point(
            p.x + (p.x - this.x),
            p.y + (p.y - this.y),
        )
    }

    rotate(angle) {
        if (angle !== 0) {
            var ca = Math.cos(angle), sa = Math.sin(angle), x = this.x, y = this.y;
            this.x = x * ca + y * sa;
            this.y = -x * sa + y * ca;
        }
        return this;
    }
    getAngle(p) {
        return Math.atan2(
            p.y - this.y,
            p.x - this.x
        );
    }
}