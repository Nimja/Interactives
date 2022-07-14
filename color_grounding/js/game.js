class Game {
    constructor(canvas, introScreen, gameScreen, gameScore, skipButton, switchButton) {
        this.canvas = canvas;
        this.context = this.canvas.getContext("2d");
        this.cam = new Cam(switchButton);

        // Settings for the color detection.
        this.colorBlock = Math.PI / 8;
        this.scoreWidth = this.colorBlock / Math.PI * 180 * 1.1;
        this.blockWidth = .75;

        this.introScreen = introScreen;
        this.gameScreen = gameScreen;
        this.gameScore = gameScore;
        this.skipButton = skipButton;

        this.curScore = 0;
        this.curAngle = 0;
        this.countDown = 0;
        this.maxCount = 2;
        this.curTime = Date.now();

        // Add event listeners.
        this.introScreen.addEventListener('click', this.start.bind(this));
        this.skipButton.addEventListener('click', this.onSkip.bind(this));
        window.addEventListener('resize', this.onResize.bind(this));

        // Add colors.
        this.colors = {
            'red': 0,
            'orange': 30,
            'yellow': 60,
            'green': 120,
            'cyan': 180,
            'blue': 230,
            'purple': 270,
            'magenta': 320,
        };
        this.colorNames = Object.keys(this.colors);
        this.curColor = this.colorNames[0];

        // Add buffer.
        let c = document.createElement('canvas');
        this.buffer = {
            canvas: c,
            context: c.getContext("2d"),
        }
        this.resize(1000);
    }

    resize(size) {
        this.size = size;
        this.hsize = Math.round(this.size * .5);

        // Detection square in center, a bit bigger if the size is big.
        this.colsize = Math.min(10, Math.max(5, Math.round(this.size / 80)));

        this.canvas.width = size;
        this.canvas.height = size;

        let bsize = Math.round(size / 5) * 2;
        this.buffer.canvas.width = bsize;
        this.buffer.canvas.height = bsize;
        this.buffer.size = bsize;
        this.buffer.hsize = Math.round(bsize * .5); // Center & outer radius.;
        this.buffer.rsize = Math.round(bsize * .4); // Inner radius.;
        this.createOverlay();
    }


    start(e) {
        this.cam.enableCam(e);
        this.introScreen.style.display = 'none';
        this.gameScreen.style.display = 'block';
        this.selectRandomColor();
        this.updateScore();
        this.curTime = Date.now();
        this.animate();
    }
    animate() {
        let now = Date.now();
        let passed = (now - this.curTime) / 1000;
        this.curTime = now;
        if (passed < .1) { // After missed frames, skip the rendering until the next one.
            this.mainLoop(passed);
        }
        window.requestAnimFrame(this.animate.bind(this));
    }
    onResize(e) {
        console.log(this.canvas.clientWidth);
    }
    onSkip(e) {
        e.preventDefault();
        if (this.skipButton.disabled) {
            return;
        }
        this.skipButton.disabled = true;
        this.selectRandomColor();
        setTimeout(this.clearSkip.bind(this), 1000);
    }
    clearSkip() {
        this.skipButton.disabled = false;
    }

    updateScore() {
        this.gameScore.innerHTML = "Score: " + this.curScore + " - Current color: <b>" + this.curColor + "</b>";
    }
    selectRandomColor() {
        let cur = this.curColor;
        // Ensure we go to a different color.
        while (cur == this.curColor) {
            this.curColor = this.colorNames[Math.floor(this.colorNames.length * Math.random())];
        }
        this.updateScore();
    }


    mainLoop(diff) {
        let ctx = this.context;
        ctx.clearRect(0, 0, this.size, this.size);
        if (!this.cam.hasData()) {
            return;
        }
        // Draw current cam image.
        this.drawCamera(ctx);
        // Get color (before overlay)
        let col = this.getAverageColor(ctx);

        // Draw overlay.
        ctx.drawImage(this.buffer.canvas, this.hsize - this.buffer.hsize, this.hsize - this.buffer.hsize);

        // Set overlay drawing style.
        ctx.strokeStyle = "rgba(0, 0, 0, .25)";
        ctx.fillStyle = "rgba(255, 255, 255, .5)";
        ctx.lineWidth = 2;

        this.drawTargetColor(ctx);

        this.drawCurrentColor(ctx, col);

        this.checkScoring(ctx, diff);
    }

    getAngleFromHue(hue) {
        // Align red up top.
        return hue / 180 * Math.PI - Math.PI * .5;
    }

    drawCamera(ctx) {
        let dim = this.cam.getSize();
        let min = Math.min(dim.w, dim.h);
        let hmin = min * .5;
        let p = {
            x: dim.w * .5 - hmin,
            y: dim.h * .5 - hmin,
            w: min,
            h: min
        };
        if (this.cam.isFront) {
            ctx.setTransform(-1, 0, 0, 1, 0, 0);
            ctx.drawImage(
                this.cam.video,
                p.x, p.y, p.w, p.h,
                -this.size, 0, this.size, this.size
            );
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        } else {
            ctx.drawImage(
                this.cam.video,
                p.x, p.y, p.w, p.h,
                0, 0, this.size, this.size
            );
        }
    }

    drawTargetColor(ctx) {
        let angle = this.getAngleFromHue(this.colors[this.curColor]),
            middle = (this.buffer.hsize + this.buffer.rsize) * .5,
            radius = (this.buffer.hsize - this.buffer.rsize) * this.blockWidth,
            x = this.hsize + middle * Math.cos(angle),
            y = this.hsize + middle * Math.sin(angle);
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.stroke();
    }

    checkScoring(ctx, diff) {

        let dist = Math.abs(this.getShortestAngle(this.colors[this.curColor] - this.curAngle, 360));
        // Matching color.
        if (dist < this.scoreWidth) {
            this.countDown += diff;
            if (this.countDown > this.maxCount) {
                this.countDown = 0;
                this.curScore += 1;
                this.selectRandomColor();
            } else {
                let cur = 1 - this.countDown / this.maxCount;
                ctx.beginPath();
                ctx.arc(this.hsize, this.hsize, this.buffer.rsize * cur, 0, Math.PI * 2, false);
                ctx.stroke();
            }
        } else {
            this.countDown = 0;
        }
    }


    /**
     * Get the shortest angle.
     */
    getShortestAngle(angle, whole) {
        angle = angle % whole;
        let half = whole * .5;
        if (angle > half) {
            angle += -whole;
        } else if (angle < -half) {
            angle += whole;
        }
        return angle;
    }

    drawCurrentColor(ctx, col) {
        // Too dark or too low saturation.
        if (col.l < .1 || col.s < .05) {
            return;
        }
        // Draw current angle.
        let dist = this.getShortestAngle(col.h - this.curAngle, 360);
        dist *= 1 / 10;
        this.curAngle += dist;

        let angle = this.getAngleFromHue(this.curAngle),
            middle = (this.buffer.hsize + this.buffer.rsize) * .5,
            radius = (this.buffer.hsize - this.buffer.rsize) * this.blockWidth;

        ctx.beginPath();
        ctx.arc(this.hsize, this.hsize, middle + radius, angle - this.colorBlock, angle + this.colorBlock, false);
        ctx.arc(this.hsize, this.hsize, middle - radius, angle + this.colorBlock, angle - this.colorBlock, true);
        ctx.stroke();
        ctx.fill();
    }

    getAverageColor(ctx) {
        let p = this.hsize - this.colsize, s = this.colsize * 2;
        let data = ctx.getImageData(p, p, s, s).data;

        // Per 4 colors, R G B A.
        let length = data.length / 4;
        let totals = { r: 0, g: 0, b: 0 };
        for (var i = 0; i < data.length; i += 4) {
            totals.r += data[i];
            totals.g += data[i + 1];
            totals.b += data[i + 2];
        }
        totals.r = Math.round(totals.r / length);
        totals.g = Math.round(totals.g / length);
        totals.b = Math.round(totals.b / length);
        return new Color(totals.r, totals.g, totals.b);
    }


    createOverlay() {
        // Buffer overlay drawing, only done once.
        let ctx = this.buffer.context, r = this.buffer.hsize, r2 = this.buffer.rsize;
        let color = new Color();
        ctx.clearRect(0, 0, this.buffer.size, this.buffer.size);
        let step = 1, angle1, angle2;
        for (var i = 0; i < (360 + step); i += step) {
            angle1 = this.getAngleFromHue(i);
            angle2 = this.getAngleFromHue(i + step * 1.5);
            ctx.beginPath();
            color.setHsl(i, 1, .8);
            ctx.fillStyle = color.toHex();
            ctx.arc(r, r, r, angle1, angle2, false);
            ctx.arc(r, r, r2, angle2, angle1, true);
            ctx.fill();

        }

        r -= .5; // Allow for pixel aligning of one pixel wide lines.

        ctx.strokeStyle = 'rgba(0, 0, 0, .25)';
        ctx.lineWidth = 1;
        ctx.beginPath(); // Black outline.
        ctx.moveTo(r - r2, r - 1);
        ctx.lineTo(r + r2, r - 1);
        ctx.moveTo(r - r2, r + 1);
        ctx.lineTo(r + r2, r + 1);

        ctx.moveTo(r - 1, r - r2);
        ctx.lineTo(r - 1, r + r2);
        ctx.moveTo(r + 1, r - r2);
        ctx.lineTo(r + 1, r + r2);
        ctx.stroke();


        ctx.strokeStyle = 'rgba(255, 255, 255, .5)';
        ctx.lineWidth = 1;
        ctx.beginPath(); // White center outline.
        ctx.moveTo(r - r2, r);
        ctx.lineTo(r + r2, r);

        ctx.moveTo(r, r - r2);
        ctx.lineTo(r, r + r2);
        ctx.stroke();
    }
}