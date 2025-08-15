Source of: https://nimja.com/other/interactive/wordsearch

* Click/tap and drag to highlight a word from the list.
* Words in the list are struck through automatically as you mark them.
* The left-over letters might spell a word!
* Settings menu can manage word lists (or change the current one), grid size, darkmode, color.
* Progress is kept through page reloads.
* Selections have a 1 letter leeway in both directions. Selecting "stone" will auto-select "stones", as long as the starting point is correct.
* Word lists are automatically filtered to:
    * Remove doubles or partial words (here is dropped in favor of where, for example).
    * Minimum word length of 4 letters.
    * Automatically change letters like ë to e.
* Game board is created by:
    * Attempt to connect a new word to any existing letter on the board.
    * Attempt to place a new word starting on an empty space.
    * After exhausting the word list, attempt fill the empty spaces with an unused word.

On a technical side: localStorage is used for settings, indexedDB for word lists. All data is local, nothing is sent to the server.