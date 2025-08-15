import { Letter } from "./letter.js";
import { Word } from "./word.js";
import { Confetti } from "./confetti.js";
import { Coord } from "./coord.js";
import { Line } from "./line.js";
import { DIR_NUMBER, TAU, HPI, reverseDir, shuffle, shuffleIndexes } from "./global.js";
import { WordFilter } from "./wordfilter.js";

/**
 * The main gameboard and play loop.
 */
export class Board {
    constructor(canvas, wordlist) {
        this.wordlist = wordlist;
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        this.setGridSize(2, 2);
        this.fontScale = .7;
        this.lineStretch = .14;
        this.lineRadius = .45;
        this.debug = false;
        // Init
        this.isDragging = false;
        this.lines = [];
        this.words = [];
        this.curLine = undefined;
        this.isDark = false;
        this.hue = 200;
        this.updateColors();

        // Setup listeners.
        canvas.addEventListener("mousedown", this.onMouseDown.bind(this));
        canvas.addEventListener("mousemove", this.onMouseMove.bind(this));
        canvas.addEventListener("mouseup", this.onMouseUp.bind(this));

        canvas.addEventListener("touchstart", this.onTouchStart.bind(this));
        canvas.addEventListener("touchmove", this.onTouchMove.bind(this));
        canvas.addEventListener("touchend", this.onTouchEnd.bind(this));
    }


    setDarkMode(isDark) {
        if (isDark !== this.isDark) {
            this.isDark = isDark;
            this.updateColors();
        }
    }
    setColor(hue) {
        if (hue !== this.hue) {
            this.hue = hue;
            this.updateColors();
        }
    }
    updateColors() {
        this.textColor = this.isDark ? 'white' : 'black';
        let fade = this.isDark ? .3 : .2;
        this.lineFill = "hsla(" + this.hue.toString() + ", 100%, 50%, " + fade + ")";
        this.lineDark = "hsla(" + this.hue.toString() + ", 100%, 50%, 1)";
        this.lineEdge = "hsla(" + this.hue.toString() + ", 100%, 50%, " + (fade + .3) + ")";
    }

    serialize() {
        let result = {'size': {x: this.size.x, y: this.size.y}, 'words': [], 'letters': []};
        // Go over each word and attempt to put it on the board.
        this.words.forEach((word) => {
            if (word.placed) {
                result.words.push(word.serialize());
            }
        });
        this.grid.forEach((letter) => {
            if (!letter.isConnected) {
                result.letters.push(letter.letter);
            }
        });        
        return result;
    }

    unserialize(data) {
        this.setGridSize(data.size.x, data.size.y);
        let result = {'words': [], 'letters': []};
        // Put the words back again.
        data.words.forEach((wdata) => {
            let word = Word.unserialize(this, wdata);
            this.words.push(word);
        });
        this.fillRest(data.letters);
        this.render();
        this.updateWordList();
    }


    resize(size) {
        // Support for high-res devices.
        var pixelRatio = window.devicePixelRatio | 1;

        let w = Math.round(size * pixelRatio);
        let h = w;

        this.canvas.width = w;
        this.canvas.height = h;
        this.canvas.style.width = size + "px";
        this.canvas.style.height = size + "px";
        this.context.lineCap = "round";
        this.context.lineJoin = "round";
        this.calc = {
            size: size,
            w: w,
            h: h,
            line: Math.max(w * .005, 2),
            block: Math.min(w / this.size.x, h / this.size.y),
        }
        this.calc.blockh = this.calc.block * .5;
        this.calc.fontSize = this.calc.block * this.fontScale;

        this.render();
    }

    /**
     * Event functions.
     */
    onMouseDown(event) {
        if (event.button != 0 || this.isDragging) {
            return true;
        }        
        event.preventDefault();
        this.moveStart(this.getMouseCoord(event));
        return false;
    }
    onMouseMove(event) {
        if (!this.isDragging) {
            return true;
        }        
        this.moveDrag(this.getMouseCoord(event));
        return true;
    }

    onMouseUp(event) {
        if (event.button != 0 || !this.isDragging) {
            return true;
        }        
        event.preventDefault();
        if (this.isDragging) {
            this.moveEnd(this.getMouseCoord(event));
        }
        return false;
    }
    getMouseCoord(event) {
        // Support for high-res devices.
        let pixelRatio = window.devicePixelRatio | 1;
        return new Coord(
            event.offsetX * pixelRatio, 
            event.offsetY * pixelRatio
        );
    }
    getTouchCoord(touch) {
        let rect = this.canvas.getBoundingClientRect();
        let pixelRatio = window.devicePixelRatio | 1;
        return new Coord(
            (touch.clientX - rect.left) * pixelRatio, 
            (touch.clientY - rect.top) * pixelRatio
        )
    }

    onTouchStart(event) {
        event.preventDefault();
        this.moveStart(this.getTouchCoord(event.touches[0]));
        return false;
    }
    onTouchMove(event) {
        if (!this.isDragging) {
            return true;
        }        
        this.moveDrag(this.getTouchCoord(event.touches[0]));
        return true;
    }

    onTouchEnd(event) {
        if (!this.isDragging || !event.changedTouches[0]) {
            return true;
        }
        event.preventDefault();
        this.moveEnd(this.getTouchCoord(event.changedTouches[0]));
        return false;
    }

    moveStart(realc) {
        var c = this.realToCoord(realc);
        this.curLine = new Line(c);
        this.isDragging = true;
        this.render();
    }

    moveDrag(realc) {
        let start = this.curLine.start.clone();
        let dist = this.realToCoord(realc).getGridLengthTo(start);
        if (dist == 0) {
            this.curLine.setEnd(start);
            this.render();
            return false;
        }
        // Which ring we're in.
        let realCenter = this.coordToReal(this.curLine.start);
        let dir = realCenter.getDirTo(realc);
        // let dist = Math.floor((realc.clone().subtract(realCenter).getLength() + this.calc.blockh) / this.calc.block);
        this.curLine.setEnd(start.move(dir, dist));
        this.render();
        return true;
    }
    moveEnd(realc) {
        // If this is a valid move.
        let line = this.curLine;
        if (this.moveDrag(realc) && this.isValidCoord(line.start)) {
            let letter = this.grid[this.coordToIndex(line.start)];
            let info = letter.dirs[line.dir];
            // Is start or end of word.
            if (info && (info.state == 3 || info.state == 1)) {
                let word = info.word;
                if (!word.marked && line.withinMargin(word.length - 1, 1)) {
                    word.marked = true
                    this.updateWordList();
                }
            }
        }
        this.curLine = undefined;
        this.render();
        this.isDragging = false;
    }

    setGridSize(x, y) {
        x = parseInt(x);
        y = parseInt(y);
        this.size = {x: x, y: y};
        this.max = x * y;
        this.cleanBoard();
        this.resize(this.calc ? this.calc.size : 100);
    } 

    resetGrid() {
        this.grid = Array(this.max);
        this.emptySquares = [];
        for (let i = 0; i < this.max; i++) {
            this.grid[i] = new Letter("", []);
            this.emptySquares.push(i);
        }
        this.alphabet = {};
    }
    fillRest(letters) {
        let orderedLetters = !!letters ? letters.slice() : [];
        let usedLetters = Object.keys(this.alphabet);
        for (let i = 0; i < this.max; i++) {
            let letter = this.grid[i];
            let string = '';
            if (!letter.isConnected) {
                if (orderedLetters.length > 0) {
                    string = orderedLetters.shift();
                } else {
                    string = usedLetters[Math.floor(Math.random() * usedLetters.length)];
                }
                letter.update(string);
            }
        }
    }

    cleanBoard() {
        // Reset board.
        this.resetGrid();
        this.isDragging = false;
        this.curLine = undefined;
        this.words = [];
        this.isCompleted = false;
        this.clearAnim();
    }

    startGame(words) {
        this.cleanBoard();
        words = shuffle(words);
        this.words = [];
        for (let i = 0; i < words.length; i++) {
            this.words.push(new Word(words[i]));
        }
        let maxLength = Math.max(this.size.x, this.size.y);
        // Go over each word and attempt to put it on the board.
        this.words.forEach((word) => {
            // If the word is too long for this board, skip it.
            if (word.length > maxLength) {
                return;
            }
            // Attempt to connect the word to an existing one.
            if (!this.attemptLetterWalk(word)) {
                // Pick a random place on the board.
                for (let i = 0; i < 10; i++) {
                    // Pick a random empty square.
                    let index = Math.floor(Math.random() * this.emptySquares.length);
                    if (this.attemptWordAtIndex(word, this.emptySquares[index], 0)) {
                        break;
                    }
                }
            }
        });
        WordFilter.sortAlphaObj(this.words, 'word');
        let word = this.getUnusedWordOfLength(this.emptySquares.length);
        this.fillRest(word ? word.getLetters() : false);
        this.render();
        this.updateWordList();
    }

    countLetters() {
        this.alphabet = {};
        this.emptySquares = [];
        for (let i = 0; i < this.max; i++) {
            let letter = this.grid[i];
            if (!letter.isConnected) {
                this.emptySquares.push(i);
                continue;
            }
            if (!(letter.letter in this.alphabet)) {
                this.alphabet[letter.letter] = [];
            }
            this.alphabet[letter.letter].push(i);
        }
    }

    attemptLetterWalk(word) {
        if (word.placed) {
            return false;
        }
        let randomIndex = shuffleIndexes(word.length);
        for (let i = 0; i < randomIndex.length; i++) {
            let offset = randomIndex[i];
            let letterString = word.getLetter(offset);
            if (letterString in this.alphabet) {
                let randomIndexes = shuffle(this.alphabet[letterString]);
                for (let r = 0; r < randomIndexes.length; r++) {
                    if (this.attemptWordAtIndex(word, randomIndexes[r], offset)) {
                        return true;
                    }
                }
            }
        }
        return false;    
    }

    attemptWordAtIndex(word, index, offset) {
        if (word.placed) {
            return false;
        }
        let randomDirs = shuffleIndexes(DIR_NUMBER);
        for (let i = 0; i < DIR_NUMBER; i++) {
            let dir = randomDirs[i];
            if (word.attemptPlace(this, index, dir, offset)) {
                return true;
            }
        }
        return false;
    }

    getUnusedWordOfLength(length) {
        // Get unused words of the right length.
        let words = this.words.filter((word) => { return (word.length == length && !word.placed); });
        if (words.length == 0) {
            return false; // No word found.
        }
        words = shuffle(words);
        return words[0];
    }

    indexToCoord(i) {
        let y = Math.floor(i / this.size.x);
        let x = i - (y * this.size.x);
        return new Coord(x, y);
    }
    coordToIndex(c) {
        return c.y * this.size.x + c.x;
    }
    coordToReal(c) {
        return new Coord(
            c.x * this.calc.block + this.calc.blockh,
            c.y * this.calc.block + this.calc.blockh
        );
    }
    isValidCoord(c) {
        return c.x >= 0 && c.y >= 0 && c.x < this.size.x && c.y < this.size.y;
    }
    realToCoord(c) {
        return new Coord(
            Math.floor(c.x / this.calc.block),
            Math.floor(c.y / this.calc.block)
        );
    }

    render() {
        if (!this.calc || !this.calc.w) {
            return false;
        }
        let ctx = this.context;
        ctx.clearRect(0, 0, this.calc.w, this.calc.h);
        // Draw highlight lines.
        ctx.fillStyle = this.lineFill;
        this.words.forEach((word) => {
            if (word.line && word.marked) {
                this.drawLine(word.line, true);
            }
        });        
        // Draw letters.
        ctx.fillStyle = this.textColor;
        let size = this.calc.fontSize;
        ctx.font = size.toString() + "px arial";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        for (let i = 0; i < this.max; i++) {
            var c = this.coordToReal(this.indexToCoord(i));
            ctx.fillText(this.grid[i].letter, c.x + size * .013, c.y + size * .07);
            if (this.debug) {
                ctx.lineWidth = 1;
                ctx.strokeStyle = 'red';
                ctx.beginPath();
                ctx.arc(c.x, c.y, size * .5, 0, TAU);
                ctx.stroke();
            }
        }
        // Draw current selection.
        ctx.lineWidth = this.calc.line;
        ctx.strokeStyle =this.lineEdge;
        if (this.curLine !== undefined) {
            // Lazy linedrawing.
            this.drawLine(this.curLine, false);
        }
    }
    /**
     * Draw a line on the board with start/end point.
     */
    drawLine(line, isFill) {
        let ctx = this.context;        
        let radius = this.calc.fontSize * this.lineRadius;
        let stretch = this.calc.fontSize * this.lineStretch;
        ctx.beginPath();
        let cr1 = this.coordToReal(line.start);
        let cr2 = this.coordToReal(line.end);
        let angle = line.dir / DIR_NUMBER * TAU + HPI;
        cr1.move(reverseDir(line.dir), stretch);
        cr2.move(line.dir, stretch);
        ctx.arc(cr1.x, cr1.y, radius, angle, angle + Math.PI, false);
        ctx.arc(cr2.x, cr2.y, radius, angle + Math.PI, angle, false);
        ctx.closePath();
        if (isFill) {
            ctx.fill();
        } else {
            ctx.stroke();
        }
    }

    updateWordList() {
        var list = [];
        let isCompleted = this.words.length > 0;
        this.words.forEach((word) => {
            if (word.placed) {
                if (word.marked) {
                    list.push("<p><s>" + word.word + "</s></p>");
                } else {
                    isCompleted = false;
                    list.push("<p>" + word.word + "</p>");
                }
            }
        });                
        this.wordlist.innerHTML = list.join("\n");
        this.isCompleted = isCompleted;
        this.canvas.dispatchEvent(new Event("boardupdated"));
    }
    showWin() {
        if (this.anim && this.anim.active) {
            return false;
        }
        this.clearAnim();
        this.anim.active = true;
        for (let i = 0; i < 100; i++) {
            this.anim.confetti.push(new Confetti());
        }
        window.requestAnimationFrame(this.animateWin.bind(this));
    }
    animateWin() {
        let now = Date.now();
        let total = 3;
        let elapsed = now - this.anim.prev;
        if (elapsed < 1000) {
            this.anim.cur += elapsed / 1000; // Current time in seconds.
            this.anim.confetti.forEach((c) => {
                c.update(this.anim.cur / total);
            });
        }
        this.anim.prev = now;
        // Total animation time.
        if (this.anim.cur < total) {
            window.requestAnimationFrame(this.animateWin.bind(this));
        } else {
            this.clearAnim();
        }
    }
    clearAnim() {
        if (this.anim) {
            this.anim.confetti.forEach((c) => {
                c.delete();
            });        
        }
        this.anim = {
            active: false,
            cur: 0,
            prev: Date.now(),
            confetti: [],
        };        
    }
    solve() {
        if (this.isCompleted) {
            return;
        }
        this.words.forEach((word) => {
            if (word.placed) {
                word.marked = true;
            }
        });
        this.render();
        this.updateWordList();
    }
}