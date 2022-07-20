import { Point } from './shapes/point.js';
import { Line } from './shapes/line.js';
import { Arc } from './shapes/arc.js';
import { BezierCubic, BezierQuadratic } from './shapes/bezier.js';

export class Draw {
    constructor(instructions, size) {
        size = Number.isFinite(size) ? size : 100;
        this.scale = size * .5;
        this.offset = size * -.5;
        this.shapes = [];
        this.lookupSteps = 1000;
        this.parseInstructions(instructions);
        this.makeLookup();
        this.setVolume(.9);
    }

    /**
     * Parse SVG path instructions, as descriped here:
     *
     * https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths
     * @param {string} instructions
     */
    parseInstructions(instructions) {
        let parts = instructions.toString().trim().split(/[\s,]+/);
        let size = 1;
        let operation = '';
        let lastPoint = new Point(-1, -1), firstPoint = null, curPoint = null;
        let shape = false;
        let connected = true;
        let c1, c2;
        let isRelative = false;
        for (var i = 0; i < parts.length; i++) {
            let cur = parts[i];
            if (cur.match(/^[A-Za-z]$/)) {
                if (cur.match(/^[a-y]$/)) {
                    isRelative = true;
                    cur = cur.toUpperCase();
                } else {
                    isRelative = false;
                }
                operation = cur;
                if (operation == 'z') {
                    this.shapes.push(new Line(lastPoint, firstPoint));
                    firstPoint = null;
                }
                continue;
            }
            shape = false;
            switch (operation) {
                case "C": // Cubic bezier curves, with 2 control points and an endpoint.
                    c1 = this.getCoord(parts, i + 0, isRelative, lastPoint);
                    c2 = this.getCoord(parts, i + 2, isRelative, lastPoint);
                    curPoint = this.getCoord(parts, i + 4, isRelative, lastPoint);
                    shape = new BezierCubic(lastPoint, c1, c2, curPoint)
                    i += 5; // Total 6 values (3 coords)
                    break;
                case "S": // Continue C, reflecting on last control point.
                    c1 = this.getLastShape(BezierCubic).c2.reflect(lastPoint);
                    c2 = this.getCoord(parts, i + 0, isRelative, lastPoint);
                    curPoint = this.getCoord(parts, i + 2, isRelative, lastPoint);
                    shape = new BezierCubic(lastPoint, c1, c2, curPoint);
                    i += 3; // Total 6 values (3 coords)
                    break;
                    break;
                case "Q": // Quadratic bezier curves, with 1 control point and an endpoint.
                    c1 = this.getCoord(parts, i + 0, isRelative, lastPoint);
                    curPoint = this.getCoord(parts, i + 2, isRelative, lastPoint);
                    shape = new BezierQuadratic(lastPoint, c1, curPoint);
                    i += 3; // Total 4 values (2 coords)
                    break;
                case "T": // Continue Q, reflecting on control point.
                    c1 = this.getLastShape(BezierQuadratic).c.reflect(lastPoint)
                    curPoint = this.getCoord(parts, i, isRelative, lastPoint);
                    shape = new BezierQuadratic(lastPoint, c1, curPoint);
                    i += 1; // Total 2 values (1 coords)
                    break;
                case "A": // Arcs (they suck!)
                    let radiusX = this.parseNumber(parts[i]);
                    let radiusY = this.parseNumber(parts[i + 1]);
                    // The actual endpoint.
                    curPoint = this.getCoord(parts, i + 5, isRelative, lastPoint);
                    if (radiusX == 0 || radiusY == 0) { // Arcs with radius 0 are flat.
                        shape = new Line(lastPoint, curPoint);
                    } else {
                        shape = new Arc(
                            lastPoint,
                            radiusX,
                            radiusY,
                            Number.parseFloat(parts[i + 2]),
                            Number.parseInt(parts[i + 3]),
                            Number.parseInt(parts[i + 4]),
                            curPoint
                        );
                    }
                    i += 6; // Total 7 values we do.
                    break;
                case "L": // Line, easy.
                    curPoint = this.getCoord(parts, i, isRelative, lastPoint);
                    i += 1;
                    shape = new Line(lastPoint, curPoint);
                    break;
                case "M": // Move.
                    curPoint = this.getCoord(parts, i, isRelative, lastPoint);
                    i += 1;
                    // Set next shape as disconnected.
                    connected = false;
                    operation = "L" // Additional commands after M are interpreted as Ls.
                    break;
                default:
                    throw "Not supported yet: " + operation;
            }
            if (shape) {
                shape.connected = connected;
                connected = true;
                this.shapes.push(shape);
            }
            lastPoint = curPoint;
            if (!firstPoint) {
                firstPoint = curPoint;
            }
        }
    }

    getLastShape(expectedClass) {
        if (this.shapes.length == 0) {
            throw "No shape yet :(";
        }
        let result = this.shapes[this.shapes.length - 1];
        if (result instanceof expectedClass) {
            return result;
        }
        throw "Last shape is not a " + expectedClass.toString();
    }

    parseNumber(x) {
        return Number.parseFloat(x) / this.scale;
    }

    /**
     * Get a coordinate from parts.
     *
     * Only endpoints update the storing, apparently.
     */
    getCoord(parts, i, isRelative, lastPoint) {
        let result = new Point(
            this.parseCoord(parts[i], !isRelative),
            this.parseCoord(parts[i + 1], !isRelative)
        );
        if (isRelative) {
            result.add(lastPoint);
        }
        return result;
    }

    parseCoord(x, useOffset) {
        let offset = useOffset ? this.offset : 0;
        return (Number.parseFloat(x) + offset) / this.scale;
    }

    makeLookup() {
        let lookup = [];
        let rsteps = Math.floor(this.lookupSteps / this.shapes.length) + 1; // Lookup steps per line.
        let total = 0, line;
        let prev = this.shapes[0].getAt(0);
        // Get the points evenly spaced by T.
        for (var i = 0; i < this.shapes.length; i++) {
            line = this.shapes[i];
            for (var r = 0; r < rsteps; r++) {
                let cur = r / rsteps;
                let p = line.getAt(cur);
                // Only increase distance if connected to previous.
                if (prev && (r > 0 || line.connected)) {
                    total += p.getDist(prev);
                }
                lookup.push({ i: i, t: cur, total: total });
                prev = p;
            }
        }
        // Final point on final line.
        let p = line.getAt(1);
        total += p.getDist(prev);
        lookup.push({ i: this.shapes.length - 1, t: 1, total: total });

        // Calculate fraction of total for each lookup.
        for (var i = 0; i < lookup.length; i++) {
            lookup[i].fraction = lookup[i].total / total;
        }
        // Get the points evenly spaced by total distance.
        let reverse = [], index = 0;
        let look = lookup[0];
        let next = lookup[index + 1];
        let max = lookup.length - 1;
        for (var i = 0; i < this.lookupSteps; i++) {
            let cur = i / this.lookupSteps;
            // Shift to next lookup if needed.
            while (next.fraction < cur && index < max) {
                index++;
                look = lookup[index];
                next = lookup[index + 1];
            }
            reverse.push(
                {
                    i: look.i,
                    dist: cur,
                    t: lerp(
                        look.t,
                        next.i === look.i ? next.t : 1,
                        getFract(look.fraction, next.fraction, cur)
                    )
                }
            );
        }
        // Final endpoint.
        reverse.push(
            {
                i: this.shapes.length - 1,
                dist: 1,
                t: 1
            }
        );
        this.reverse = reverse;
    }

    setVolume(vol) { // Set from 0 to 1.
        vol = limitFloat(vol, 0, 1);
        this.volume = 32767 * vol; // 90% volume.
    }

    /**
     * Get a distance value (cur) and return a point on our path
     * @param {Number} cur
     * @returns {Point}
     */
    draw(cur) {
        let reverseIndex = this.reverse.length - 2;
        let curReverse = 1;
        cur = limitFloat(cur, 0, 1);
        if (cur < 1) {
            curReverse = cur * this.lookupSteps;
            reverseIndex = curReverse << 0;
            curReverse -= reverseIndex;
        }
        // Current point and future point.
        let look = this.reverse[reverseIndex];
        let next = this.reverse[reverseIndex + 1];
        // As long as we're on the same path, interpolate between this.
        let nextT = next.i === look.i ? next.t : 1;
        let curT = lerp(look.t, nextT, curReverse);
        let p = this.shapes[look.i].getAt(curT);
        return this.makeResult(
            p.x * this.volume,
            -p.y * this.volume,
            look.i,
            curT
        );
    }

    drawCircle(cur) {
        let left = this.volume * Math.sin(cur * Math.PI * 2);
        let right = this.volume * Math.cos(cur * Math.PI * 2);
        return this.makeResult(left, right, 0, cur);
    }

    makeResult(left, right, i, cur) {
        return { l: Math.round(left), r: Math.round(right), i: i, cur: cur };
    }
}

// Linear interpolate between two values.
function lerp(v1, v2, t) {
    return (1 - t) * v1 + t * v2;
}
// Get T value for cur value between v1 and v2.
function getFract(v1, v2, cur) {
    return (cur - v1) / (v2 - v1)
}

function limitFloat(v, min, max) {
    if (!Number.isFinite(v)) {
        throw "Not a finite number: " + v;
    }
    return v < min ? min : v > max ? max : v;
}