import { DIR_NUMBER, reverseDir, STATE_START, STATE_MIDDLE, STATE_END } from "./global.js";

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
    addDir(word, dir, state, checkOnly) { // State is 1 for start, 2 for middle and 3 for end.
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
