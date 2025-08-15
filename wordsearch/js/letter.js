import { DIR_NUMBER, reverseDir, STATE_START, STATE_MIDDLE, STATE_END } from "./global.js";

/**
 * Contain a letter for the grid.
 */
export class Letter {
    constructor(letter) {
        this.update(letter);
        this.dirs = Array(DIR_NUMBER);
        this.dirs.fill(false);
        this.isConnected = false;
    }
    formatLetter(letter) {
        return letter[0].toString().toUpperCase()
    }
    isSame(letter) {
        if (letter.length != 1) {
            return false;
        }
        return this.formatLetter(letter) == this.letter || this.isBlank;
    }
    update(letter) {
        this.isBlank = letter.length == 0;
        this.letter = this.isBlank ? '' : this.formatLetter(letter);
        return this.isBlank;
    }
    /**
     * Add a direction, as a check or final.
     * @param {Word} word 
     * @param {Number} dir 
     * @param {Number} state Which part of the word this letter is (1=start, 2=middle, 3=end)
     * @param {Boolean} checkOnly 
     * @returns 
     */
    addDir(word, dir, state, checkOnly) {
        let rdir = reverseDir(dir);
        var checkdirs = [];
        if (state == STATE_START || state == STATE_MIDDLE) {
            checkdirs.push(dir);
        }
        if (state == STATE_MIDDLE || state == STATE_END) {
            checkdirs.push(rdir);
        }
        // Check all directions are clear.
        for (let i = 0; i < checkdirs.length; i++) {
            if (this.dirs[checkdirs[i]] !== false) {
                return false;
            }
        }
        if (!checkOnly) {
            for (let i = 0; i < checkdirs.length; i++) {
                this.dirs[checkdirs[i]] = {state: state, word: word};
            }
            this.isConnected = true;
        }
        return true;
    }
}
