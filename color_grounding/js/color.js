class Color {

    constructor(color, g, b) {
        this.r = 0;
        this.g = 0;
        this.b = 0;
        this.h = 0;
        this.s = 0;
        this.l = 0;
        if (arguments.length === 3) {
            this.setRgb(color, g, b)
        } else if (arguments.length === 1) {
            this.fromHex(color);
        }
    }
    fromHex(color) {
        this.r = parseInt(color.slice(1, 3), 16);
        this.g = parseInt(color.slice(3, 5), 16);
        this.b = parseInt(color.slice(5, 7), 16);
        this.calculateHsl();
        return this;
    }
    setRgb(r, g, b) {
        this.r = parseInt(r);
        this.g = parseInt(g);
        this.b = parseInt(b);
        this.calculateHsl();
        return this;
    }
    setSpectrum(x) {
        var r = limit.float(2.0 - Math.abs(x - 0.72) * 8.0, 0, 1);
        var g = limit.float(1.7 - Math.abs(x - 0.47) * 6.46, 0, 1);
        var b = limit.float(2.0 - Math.abs(x - 0.17) * 10.0, 0, 1);
        var w = limit.float(2.0 - Math.abs(x - 0.10) * 20.0, 0, 1);
        r += w * .5;
        this.setRgb(r * 255, g * 255, b * 255);
        return this;
    }
    inverse() {
        this.r = 255 - this.r;
        this.g = 255 - this.g;
        this.b = 255 - this.b;
        this.calculateHsl();
        return this;
    }
    reverse() {
        this.inverse();
        this.setHsl(this.h + 180, this.s, this.l);
        return this;
    }
    clone() {
        var c = new Color();
        c.r = this.r;
        c.g = this.g;
        c.b = this.b;
        c.h = this.h;
        c.s = this.s;
        c.l = this.l;
        return c;
    }
    fadeTo(toColor, amount) {
        amount = limit.float(amount, 0, 1);
        var c = new Color();
        c.r = Math.round(this.r + (toColor.r - this.r) * amount);
        c.g = Math.round(this.g + (toColor.g - this.g) * amount);
        c.b = Math.round(this.b + (toColor.b - this.b) * amount);
        c.calculateHsl();
        return c;
    }
    toRgb() {
        return 'rgb(' + this.r + ', ' + this.g + ', ' + this.b + ')';
    }
    toRgba(a) {
        return 'rgba(' + this.r + ', ' + this.g + ', ' + this.b + ', ' + limit.float(a, 0, 1) + ')';
    }
    /** Translate an integer into 2 digit hex) */
    _nth(int) {
        return (256 | int).toString(16).slice(-2);
    }
    toHex() {
        return '#' + this._nth(this.r) + this._nth(this.g) + this._nth(this.b);
    }
    toLargeInt(a) {
        var alphaNum = Math.floor(a * 255);
        return parseInt("0x" + this._nth(alphaNum) + this._nth(this.b) + this._nth(this.g) + this._nth(this.r));
    }
    toInt() {
        return parseInt("0x" + this._nth(this.r) + this._nth(this.g) + this._nth(this.b));
    }
    setHsl(h, s, l) {
        this.h = h;
        this.s = s;
        this.l = l;
        this.calculateRgb();
        return this;
    }
    adjustHsl(h, s, l) {
        var result = new Color();
        return result.setHsl(this.h + h, this.s + s, this.l + l);
    }
    limitValues() {
        this.limitValuesRgb();
        this.limitValuesHsl();
    }
    limitValuesHsl() {
        this.h = limit.angle(this.h, 360);
        this.s = limit.float(this.s, 0, 1);
        this.l = limit.float(this.l, 0, 1);
    }
    limitValuesRgb() {
        this.r = limit.int(this.r, 0, 255);
        this.g = limit.int(this.g, 0, 255);
        this.b = limit.int(this.b, 0, 255);
    }
    calculateHsl() {
        this.limitValuesRgb();
        var h,
            r = this.r / 255,
            g = this.g / 255,
            b = this.b / 255,
            min = Math.min(r, g, b),
            max = Math.max(r, g, b),
            delta = max - min;

        this.h = 0;
        this.s = 0;
        this.l = max;

        if (delta > 0) {
            this.s = delta / max;
            if (r == max) {
                h = (g - b) / delta + (g < b ? 6 : 0); //Delta between Yellow & Magenta
            } else if (g == max) {
                h = 2 + (b - r) / delta; //Delta between Cyaan & Yellow
            } else {
                h = 4 + (r - g) / delta; //Delta between Magenta & Cyan
            }
            h *= 60;
            this.h = h;
        }
        this.limitValuesHsl();
    }
    calculateRgb() {
        this.limitValuesHsl();
        var l = this.l * 255;
        if (this.s == 0) {
            this.r = l;
            this.g = l;
            this.b = l;
            this.limitValuesRgb();
            return;
        } else {
            // Hue part, from 0 to 6.
            var colorPart = Math.floor(this.h / 60),
                fHue = this.h / 60 - colorPart,
                g = l * (1 - this.s), //Greyness value (base light)
                fu = l * (1 - this.s * (1 - fHue)), //To primary color
                fd = l * (1 - this.s * fHue); //From primary color
        }
        switch (colorPart) {
            case 0:
                this.r = l;
                this.g = fu;
                this.b = g;
                break;
            case 1:
                this.r = fd;
                this.g = l;
                this.b = g;
                break;
            case 2:
                this.r = g;
                this.g = l;
                this.b = fu;
                break;
            case 3:
                this.r = g;
                this.g = fd;
                this.b = l;
                break;
            case 4:
                this.r = fu;
                this.g = g;
                this.b = l;
                break;
            case 5:
                this.r = l;
                this.g = g;
                this.b = fd;
                break;
        }
        this.limitValuesRgb();
    }
}