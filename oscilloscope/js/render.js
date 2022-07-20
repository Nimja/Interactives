export class Render {
    constructor() {
        this.objectUrl = null;
        this.maxVal = 32767; // Max volume.
    }
    getObjectUrl(wave) {
        var data = new Blob([wave.toBuffer()], { type: 'audio/wav' });

        // If we are replacing a previously generated file we need to
        // manually revoke the object URL to avoid memory leaks.
        if (this.objectUrl !== null) {
            window.URL.revokeObjectURL(this.objectUrl);
        }

        this.objectUrl = window.URL.createObjectURL(data);

        // returns a URL you can use as a href
        return this.objectUrl;
    }

    /**
     * Render the drawing instructions on a canvas for testing.
     * @param {*} draw
     * @param {*} sampleRate
     * @param {*} canvas
     */
    renderCanvas(draw, sampleRate, canvas) {
        draw.setVolume(1);
        this.center = Number.parseInt(canvas.width) * .5;
        let ctx = canvas.getContext("2d");
        let c = this.getCoord(draw.draw(0));
        let p = null;
        let curI = 0;
        ctx.fillStyle = '#009900';
        ctx.fillRect(c.x - 5.5, c.y - 5.5, 11, 11);
        ctx.strokeStyle = 'rgba(0, 0, 0, .25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (var i = 0; i < sampleRate; i++) {
            let cur = i / sampleRate;
            let val = draw.draw(cur);
            c = this.getCoord(val);
            ctx.fillStyle = this.getColor(cur, val.cur);
            ctx.fillRect(c.x - .5, c.y - .5, 1, 1);
            if (val.i != curI) {
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(c.x, c.y);
            }
            p = c;
            curI = val.i;
        }
        // Draw final return.
        c = this.getCoord(draw.draw(0));
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(c.x, c.y);
        ctx.stroke();
    }

    getCoord(val) {
        return {
            x: val.l / this.maxVal * this.center + this.center,
            y: val.r / this.maxVal * -this.center + this.center
        };
    }

    getColor(total, cur) {
        let angle = 360 - (cur * 120);
        let light = Math.round((1 - total) * 50) + 25;
        return "hsl(" + angle + ", 100%, " + light + "%)";
    }

    /**
     * Render as WAV file to download.
     * @param {*} draw
     * @param {*} sampleRate
     * @param {*} a
     */
    renderFile(draw, sampleRate, freq, aElement) {
        var bytes = new Int16Array(sampleRate * 2); // 1 second of sound.
        let pcur = 0;
        let fade = 0;
        let max = sampleRate - fade - 1;
        for (var i = 0; i < sampleRate; i += 1) {
            let index = i * 2;
            let time = i / sampleRate;
            let cur = (i / sampleRate * freq) % 1;
            if (i < fade) {
                draw.setVolume(.9 * (i / fade));
                console.log(i, draw.volume / this.maxVal);
            } else if (i > max) {
                draw.setVolume(.9 * (1 - (i - max) / fade));
                console.log(i, draw.volume / this.maxVal);
            } else {
                draw.setVolume(.85 + .05 * Math.sin(time * Math.PI * 2));
            }
            let val = draw.draw(cur);
            bytes[index] = val.l;
            bytes[index + 1] = val.r;
            pcur = cur;
        }

        var wav = new wavefile.WaveFile();
        wav.fromScratch(2, sampleRate, '16', bytes);
        aElement.href = this.getObjectUrl(wav);
        aElement.download = "oscilloscope_drawing.wav";
        aElement.style.display = "";
    }
}