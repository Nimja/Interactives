import { reverseDir, STATE_START, STATE_MIDDLE, STATE_END } from "./global.js";
import { Line } from "./line.js";

export class Word {
    constructor(wordstring) {
        this.word = wordstring.toUpperCase();
        this.length = wordstring.length;
        this.marked = false;
        this.placed = false;
        this.index = -1;
        this.dir = -1;
    }

    serialize() {
        return {w: this.word, i: this.index, d: this.dir, m: this.marked ? 1 : 0};
    }
    static unserialize(board, data) {
        let word = new Word(data.w);
        if (!word.attemptPlace(board, data.i, data.d, 0)) {
            console.log("Failed to place word back:", data, board.indexToCoord(data.i));
        }
        word.marked = data.m > 0;
        return word;
    }

    getLetter(index) {
        return this.word[index].toUpperCase();
    }

    getLetters() {
        return this.word.toUpperCase().split("");
    }

    /**
     * Attempt to place a word on the board, checking and placing if successful.
     * @returns Boolean
     */
    attemptPlace(board, index, dir, offset) {
        let c = board.indexToCoord(index);
        c.move(reverseDir(dir), offset);
        // Run check if placement of word would succeed.
        for (let i = 0; i < this.word.length; i++) {
            let cur = c.clone().move(dir, i);
            if (!board.isValidCoord(cur)) {
                return false;
            }
            let curi = board.coordToIndex(cur);
            let letter = board.grid[curi];
            
            let state = this.getLetterState(i);
            if (!letter.isSame(this.word[i]) || !letter.addDir(this, dir, state, true)) {
                return false;
            }
        }
        // Then place.
        let startIndex = 0;
        for (let i = 0; i < this.word.length; i++) {
            let cur = c.clone().move(dir, i);
            let curi = board.coordToIndex(cur);
            if (i === 0) {
                startIndex = curi; // Location of first letter of word.
            }
            let letter = board.grid[curi];
            
            let state = this.getLetterState(i);
            if (letter.isBlank) {
                letter.update(this.word[i]);
            }
            letter.addDir(this, dir, state, false);
        }
        this.line = new Line(c, c.clone().move(dir, this.word.length - 1));
        this.placed = true;
        this.index = startIndex; // Based on the updated start index.
        this.dir = dir;
        board.countLetters(); // Trigger recount of letters after successful placement.
        return true;
    }

    getLetterState(index) {
        if (index === 0) {
            return STATE_START;
        } else if (index === this.word.length - 1) {
            return STATE_END;
        }
        return STATE_MIDDLE;
    }
}