import { Point } from "./point.js";

export class Arc {
    constructor(p1, rx, ry, axisRotation, largeArcFlag, sweepFlag, p2) {
        this.parseArcParameters(p1, rx, ry, axisRotation, largeArcFlag, sweepFlag, p2)
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
        let set = this.settings;
        let angle = set.aStart + set.aDist * t;
        let p = new Point(
            set.radius * Math.cos(angle),
            set.radius * Math.sin(angle)
        );
        p.add(set.center);
        return p;
    }

    /**
     * Calculate the (cirlce only) parameters so we go from artist-frienly to developer friendly.
     *
     * @param {Point} start
     * @param {Number} rx
     * @param {Number} ry
     * @param {Number} axisRotation
     * @param {Number} largeArcFlag
     * @param {Number} sweepFlag
     * @param {Point} end
     */
    parseArcParameters(start, rx, ry, axisRotation, largeArcFlag, sweepFlag, end) {
        axisRotation = axisRotation * Math.PI / 180;

        // Ensure radii are positive
        rx = Math.abs(rx);
        ry = Math.abs(ry);
        // For now we only support circles.
        let radius = Math.max(rx, ry);
        // Get center point and distance.
        let middle = start.fadeTo(end, .50);
        let dist = middle.getDist(start);

        let center = new Point(0, 0);
        if (dist > radius) { // Bigger than center.
            radius = dist;
            center.x = 0;
        } else {
            center.x = Math.sqrt(radius * radius - dist * dist);
        }

        // Get the angles for our circle.
        let angle = Math.atan2(dist, center.x);
        const isSweep = sweepFlag > 0;
        const isLarge = largeArcFlag > 0;

        let angle1 = Math.PI + angle;
        let angle2 = Math.PI - angle;

        // Use large circle.
        if (isLarge) {
            center.x *= -1;
            angle1 = -angle;
            angle2 = angle - Math.PI * 2;
        }

        // Sweep from different direction.
        if (isSweep) {
            center.x *= -1;
            let temp = angle1;
            // Flip angles and rotate 180 degrees.
            angle1 = angle2 + Math.PI;
            angle2 = temp + Math.PI;
        }

        // Rotate whole result based on lines.
        let rotation = Math.PI * -.5 + start.getAngle(end); // Normal angle.
        center.rotate(-rotation); // Rotate the center point in opposite direction.
        center.add(middle);
        angle1 += rotation;
        angle2 += rotation;

        this.settings = {
            center: center,
            radius: radius,

            aStart: angle1,
            aDist: angle2 - angle1,
            rotation: axisRotation
        };
    }
}