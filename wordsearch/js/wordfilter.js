export class WordFilter {
    static cleanString(string) {
        // Normalize, replacing accented characters with their simple forms.
        string = string.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        // Transform to uppercase.
        return string.toUpperCase();
    }
    static filter(words) {
        // If input is string, make it into an array.
        if (typeof words === 'string' || words instanceof String) {
            words = WordFilter.cleanString(words).split(/[^A-Z]+/g)
        }
        if (typeof words !== 'array' && !(words instanceof Array)) {
            throw new Error("Input is not an array?" + words.toString());
        }
        if (words.length === 0) {
            return words;
        }
        let check = words.slice();
        let result = [];

        // Sort by length, ascending.
        check.sort((a, b) => {return a.length - b.length});
        // Filter words for content, making sure to only keep a-z and replace accents with their normalized form.
        for (let i = 0; i < check.length; i++) {
            // Keep only A-Z.
            check[i] = WordFilter.cleanString(check[i]).replace(/[^A-Z]/g, '');
        }        
        // We can skip the first one.
        let max = check.length - 1
        for (let i = 0; i < max; i++) {
            let word = check[i];
            if (word.length < 4) {
                continue; // Min word length = 3.
            }
            let isFound = false;
            for (let r = (i + 1); r < check.length; r++) {
                let compare = check[r];
                if (compare.includes(word)) {
                    isFound = true;
                    break;
                }
            }
            if (!isFound) {
                result.push(word);
            }
        }
        result.push(check[max]); // Add the last word.
        return result;
    }
    static sortAlpha(words) {
        // Sort in alphabetic order.
        words.sort((a, b) => {
            return (a < b) ? -1 : (a > b) ? 1 : 0;
        });
        return words;   
    }
    static sortAlphaObj(words, prop) {
        // Sort in alphabetic order.
        words.sort((a, b) => {
            return (a[prop] < b[prop]) ? -1 : (a[prop] > b[prop]) ? 1 : 0;
        });
        return words;
    }
    static formatForEdit(words) {
        let result = '';
        if (words.length > 0) {
            result = WordFilter.sortAlpha(words).join("\n").toLowerCase();
        }
        return result;
    }
}