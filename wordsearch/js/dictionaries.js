import { Board } from "./board.js";
import { WordFilter } from "./wordfilter.js";
import { WORDS_DUTCH, WORDS_DEFAULT, WORDS_HYPNO } from "./global.js";

const SETTING_DB_NAME = 'wordsearch'
const TABLE_DICTIONARIES = 'dictionaries';

/**
 * Holder class for dictionaries, keeping a copy of the data to avoid issues with async calls.
 */
export class Dictionaries {
    constructor (settings) {
        this.db = false;
        this.settings = settings;
        this.dictionaries = {};        
        this.dictionaries['default'] = {name: 'default', custom: false, words: WordFilter.filter(WORDS_DEFAULT)};
        this.dictionaries['hypno'] = {name: 'hypno', custom: false, words: WordFilter.filter(WORDS_HYPNO)};
        this.dictionaries['dutch'] = {name: 'dutch', custom: false, words: WordFilter.filter(WORDS_DUTCH)};

        const request = indexedDB.open(SETTING_DB_NAME);
        request.onerror = (event) => {
            console.log(event);
        }
        request.onsuccess = (event) => {
            this.db = event.target.result;
            let transaction = this.getTransaction();
            transaction.openCursor().onsuccess = (event) => {
                const cursor = event.target.result;
                // Loop until done.
                if (cursor) {
                    let data = cursor.value;
                    // If this is double or mimics a standard dictionary, remove it.
                    if (data.name in this.dictionaries) {
                        transaction.delete(data.name);
                    } else {
                        this.dictionaries[data.name] = {name: data.name, custom: true, words: data.words};
                    }
                    cursor.continue();
                } else {
                    // Trigger initial load.
                    this.settings.initialLoad();
                }
            };

        }
        request.onupgradeneeded = (event) => {
            this.db = event.target.result;
            const objectStore = this.db.createObjectStore(TABLE_DICTIONARIES, { keyPath: "name" });
            // Check when the creation is done.
            objectStore.transaction.oncomplete = (event) => {
                // Trigger trigger initial load.
                this.settings.initialLoad();
            };            
        }
    }

    getNames() {
        let names = Object.keys(this.dictionaries);
        // Sort in alphabetic order, noncustom first.
        names.sort((a, b) => {
            let da = this.dictionaries[a];
            let db = this.dictionaries[b];
            if (da.custom == db.custom) {
                a = a.toLowerCase();
                b = b.toLowerCase();
                return (a < b) ? -1 : (a > b) ? 1 : 0;
            }
            return da.custom ? 1 : -1;
        });        
        return names;
    }
    getDictionary(name) {
        if (this.isExisting(name)) {
            return this.dictionaries[name];
        }
        return false;
    }
    isExisting(name, isCustom) {
        let result = !!name && (name in this.dictionaries);
        if (result && !!isCustom) {
            let dict = this.dictionaries[name];
            result = dict.custom;
        }
        return result;
    }

    getFallback() {
        return {name: fallback, custom: false, words: ["EXTREMELY", "ELONGATED", "TESTWORDS"]}
    }

    addDictionary(name, words) {
        if (this.isExisting(name)) {
            return false;
        }        
        let transaction = this.getTransaction();
        this.dictionaries[name] = {name: name, custom: true, words: words};
        transaction.add({name: name, words: words});
        return true;
    }
    updateDictionary(name, words) {
        if (!this.isExisting(name, true)) {
            return false;
        }
        // Update local.
        this.dictionaries[name].words = words;
        // Update in IndexedDB.
        let transaction = this.getTransaction();
        // Get the object from the DB and update it.
        const request = transaction.get(name);
        request.onerror = (event) => {
            console.log("error retrieving:" + name, event);
        };
        request.onsuccess = (event) => {
            // Get the object.
            const data = event.target.result;

            // Update the words.
            data.words = words;

            // Put it back in the DB.
            const requestUpdate = transaction.put(data);
            requestUpdate.onerror = (event) => {
                console.log("error storing:" + name, event);
            };
        };        
    }

    deleteDictionary(name) {
        if (!this.isExisting(name, true)) {
            return false;
        }
        let transaction = this.getTransaction();
        delete this.dictionaries[name];
        transaction.delete(name);
    }

    getTransaction() {
        return this.db.transaction(TABLE_DICTIONARIES, "readwrite").objectStore(TABLE_DICTIONARIES);
    }
}