
//Clever replacement for setinterval type functions.
window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback, element) {
            window.setTimeout(callback, 1000 / 60);
        };
})();

class Limit {
    /**
     * Input is translated to number and limited.
     *
     * @param {Number} number
     * @param {Number} min
     * @param {Number} max
     * @returns {Number}
     */
    val(number, min, max) {
        var result = number;
        if (result < min || isNaN(result)) {
            result = min;
        } else if (result > max) {
            result = max;
        }
        return result;
    }
    /**
     * Input is translated to integer and limited.
     *
     * @param {Number} number
     * @param {Number} min
     * @param {Number} max
     * @returns {Number}
     */
    int(number, min, max) {
        return limit.val(Math.round(number), min, max) | 0;
    }
    /**
     * Input is translated to number and limited.
     *
     * @param {Number} number
     * @param {Number} min
     * @param {Number} max
     * @returns {Number}
     */
    float(number, min, max) {
        return limit.val(parseFloat(number), min, max);
    }
    /**
     * Limit angle with any system, always get value from 0 .. max.
     * @param {Number} angle
     * @param {Number} max
     * @returns {Number}
     */
    angle(angle, max) {
        angle = angle % max;
        return angle < 0 ? angle + max : angle;
    }
    /**
     * Go from -1..1 to 0..1
     */
    normalize(val) {
        return (val + 1) * .5;
    }
}
var limit = new Limit();