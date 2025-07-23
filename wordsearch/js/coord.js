import { DIR_NUMBER, DIRS, TAU } from "./global.js";
/**
 * Coordinate helper class with some useful methods.
 */
export class Coord {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    clone() {
        return new Coord(this.x, this.y);
    }
    add(c) {
        this.x += c.x;
        this.y += c.y;
        return this;
    }
    subtract(c) {
        this.x -= c.x;
        this.y -= c.y;
        return this;
    }
    move(dir, steps) {
        let dirc = DIRS[dir];
        this.x += dirc.x * steps;
        this.y += dirc.y * steps;
        return this;
    }
    abs() {
        this.x = Math.abs(this.x);
        this.y = Math.abs(this.y);
        return this;
    }
    equals(c) {
        return this.x == c.x && this.y == c.y;
    }
    getLength() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }
    /**
     * Get grid length between two points, not using pythagoras.
     * @param {Coord} c 
     * @returns 
     */
    getGridLengthTo(c) {
        let diff = c.clone().subtract(this).abs();
        return Math.max(diff.x, diff.y);
    }
    getAngleTo(c) {
        return Math.atan2(c.y - this.y, c.x - this.x);
    }
    /**
     * Get the 'cardinal' direction from the current point to the given point.
     * @param {Coord} c 
     * @returns 
     */
    getDirTo(c) {
        // Get angle, adding an offset to help with floor operation.
        let angle = this.getAngleTo(c) + (TAU / DIR_NUMBER) * .5;
        // Make sure angle is from 0..TAU (+ the offset)
        if (angle < 0 ) {
            angle += TAU;
        }
        // Map from 0..TAU to 0..DIR_NUMBER
        return Math.floor(angle / TAU * DIR_NUMBER);
    }
}