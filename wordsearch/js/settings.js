import { Board } from "./board.js";
import { WordFilter } from "./wordfilter.js";
import { Dictionaries } from "./dictionaries.js";
import { DEFAULT_DICTIONARY, DEFAULT_GRIDSIZE, DEFAULT_COLOR, GRID_SIZE_MIN, GRID_SIZE_MAX } from "./global.js";

const SETTING_BOARD = 'board';
const SETTING_MODE = 'mode';
const SETTING_COLOR = 'color';
const SETTING_GRID = 'grid';
const SETTING_DICTIONARY = 'dictionary';

const FORM_METHOD_SAVE = 'save';
const FORM_METHOD_DELETE = 'delete';
const FORM_METHOD_COPY = 'copy';

/**
 * Main class that runs the game, triggers loading and switches panels.
 * 
 * This is mostly because there's a somewhat tight coupling between the settings and the board.
 */
export class Settings {
    constructor () {
        this.landscape = {
            holder: document.getElementById("wsg-landscape"),
            words: document.getElementById("wsg-words-landscape"),
        }
        this.portrait = {
            holder: document.getElementById("wsg-portrait"),
            words: document.getElementById("wsg-words-portrait"),
        }
        this.el = {
            main: document.getElementById("wsg-game"),
            buttons: document.getElementById("wsg-buttons"),
            loading: document.getElementById("wsg-loading"),
            focus: document.getElementById("wsg-focus"),
            buttonNew: document.getElementById("wsg-button-new"),
            buttonSettings: document.getElementById("wsg-button-settings"),
            buttonResume: document.getElementById("wsg-button-resume"),
            buttonDefault: document.getElementById("wsg-button-default"),
            buttonDarkMode: document.getElementById("wsg-button-darkmode"),
            buttonGameOpen: document.getElementById("wsg-game-open"),
            buttonGameClose: document.getElementById("wsg-game-close"),
            canvas: document.getElementById("wsg-board"),
            // Holders
            holderGame: document.getElementById("wsg-game-holder"),
            holderSettings: document.getElementById("wsg-settings-holder"),
            // Settings.
            form: document.getElementById("wsg-settings-form"),
            formSelect: document.getElementById("wsg-settings-select"),
            formWords: document.getElementById("wsg-settings-input"),
            formName: document.getElementById("wsg-settings-name"),
            formNameInput: document.getElementById("wsg-settings-name-input"),
            formButtons: document.getElementById("wsg-settings-buttons"),
            formInfo: document.getElementById("wsg-settings-info"),
            optionGridsize: document.getElementById("wsg-settings-gridsize"),
            optionColor: document.getElementById("wsg-settings-color"),
        }
        this.board = new Board(
            this.el.canvas,
            this.landscape.words
        );
        this.board.canvas.addEventListener("boardupdated", this.onBoardUpdated.bind(this));
        this.currentDictionary = this.getSetting(SETTING_DICTIONARY);
        
        let oldstate = this.getSetting(SETTING_BOARD);
        if (oldstate) {
            this.board.unserialize(oldstate);
        }
        for (let i = GRID_SIZE_MIN; i <= GRID_SIZE_MAX; i++) {
            this.makeOption(this.el.optionGridsize, i.toString(), i + " x " + i);
        }
        this.isOpen = true;
        
        // Add event listeners.
        this.el.buttonNew.addEventListener("click", this.onNew.bind(this));
        this.el.buttonSettings.addEventListener("click", this.onSetting.bind(this));
        this.el.buttonResume.addEventListener("click", this.onSetting.bind(this));
        this.el.buttonDefault.addEventListener("click", this.onRestoreDefaults.bind(this));
        this.el.buttonDarkMode.addEventListener("click", this.onDarkmode.bind(this));

        this.el.buttonGameOpen.addEventListener("click", this.onOpen.bind(this));
        this.el.buttonGameClose.addEventListener("click", this.onClose.bind(this));
        
        this.el.form.addEventListener("submit", this.onFormSubmit.bind(this));
        this.el.formSelect.addEventListener("change", this.onFormSelect.bind(this));
        this.el.optionGridsize.addEventListener("change", this.onGridSize.bind(this));
        this.el.optionColor.addEventListener("change", this.onColor.bind(this));
        this.el.optionColor.addEventListener("input", this.onColor.bind(this));

        // On window level.
        window.addEventListener("resize", this.resize.bind(this));
        // Restore settings and resize.
        this.setDarkMode(this.getSetting(SETTING_MODE));
        this.setColor(this.getSetting(SETTING_COLOR));
        this.setGridSize(this.getSetting(SETTING_GRID));
        this.resize();
        this.dictionaries = new Dictionaries(this);
        this.onOpenClose(true);
        this.ensurePlaying();
    }

    initialLoad() {
        this.getCurrentDictionary();
        if (this.board.words.length === 0) {
            this.onNew();
        }
    }

    ensurePlaying() {
        // Make sure settings are closed.
        this.isPlaying = true;
        this.showSettings();
    }

    onNew() {
        this.ensurePlaying();

        // Restart the board.
        this.board.setGridSize(this.gridSize, this.gridSize);
        this.board.startGame(this.getCurrentDictionary().words);
        this.saveSetting(SETTING_BOARD, this.board.serialize());
    }

    getCurrentDictionary() {
        if (!this.currentDictionary || !this.dictionaries.isExisting(this.currentDictionary)) {
            // Override if we're dealing with a deleted default value.
            this.setDictionary(DEFAULT_DICTIONARY);
        }
        return this.dictionaries.getDictionary(this.currentDictionary);
    }

    setDictionary(name) {
        if (!name) {
            return false;
        }
        if (this.dictionaries.isExisting(name)) {
            this.currentDictionary = name;
            this.saveSetting(SETTING_DICTIONARY, name);
            this.el.formSelect.value = this.currentDictionary;
            let dict = this.dictionaries.getDictionary(name);
            this.el.formWords.value = WordFilter.formatForEdit(dict.words);
            return true;
        }
        return false;
    }

    onSetting() {
        this.isPlaying = !this.isPlaying;
        this.showSettings();
    }
    showSettings() {
        this.setVisible(this.el.holderGame, this.isPlaying);
        this.setVisible(this.el.holderSettings, !this.isPlaying);
        if (this.isPlaying) { // Go back to board.
            this.updateOrientationVisibility();
        } else { // Show settings.
            // Clear options.
            this.el.formSelect.innerHTML = '';
            // Add default/new option.
            this.makeOption(this.el.formSelect, '', 'New');
            // this.makeOption(this.el.formSelect, '', '─── standard ───', true);
            let names = this.dictionaries.getNames();
            // Add standard ones.
            let optgroup = document.createElement("optgroup");
            optgroup.label = '─── standard ───'
            names.forEach((name) => {
                let dict = this.dictionaries.getDictionary(name);
                if (!dict.custom) {
                    this.makeOption(optgroup, name, name);
                }
            });
            this.el.formSelect.add(optgroup);
            // this.makeOption(this.el.formSelect, '', '─── custom ───', true);
            // Add custom ones.
            optgroup = document.createElement("optgroup");
            optgroup.label = '─── custom ───'
            names.forEach((name) => {
                let dict = this.dictionaries.getDictionary(name);
                if (dict.custom) {
                    this.makeOption(optgroup, name, name);
                }
            });
            if (optgroup.children.length) {
                this.el.formSelect.add(optgroup);
            }
            this.el.formSelect.value = this.currentDictionary;
            this.onFormSelect();            
        }
    }
    makeOption(select, value, text, isDisabled) {
        let option = document.createElement("option");
        option.value = value;
        option.text = text;
        select.appendChild(option);
        if (!!isDisabled) {
            option.disabled = true;
        }
        return option;     
    }
    onFormSelect() {
        let value = this.el.formSelect.value;
        let custom = true;
        this.el.formNameInput.value = '';
        if (value && this.setDictionary(value)) {
            let dict = this.dictionaries.getDictionary(value);
            custom = dict.custom;
        } else {
            this.el.formWords.value = '';
        }
        this.el.formWords.readOnly = !custom;
        this.setVisible(this.el.formButtons, custom);
        this.setVisible(this.el.formName, !value);
    }
    onFormSubmit(event) { // Submitting the form.
        let formData = new FormData(event.target, event.submitter);
        event.preventDefault();
        let method = formData.get('submit');
        let words = formData.get('words');
        words = WordFilter.filter(words);
        let dictionary = formData.get('dictionary');
        switch (method) {
            case FORM_METHOD_COPY: return this.doFormCopy(words);
            case FORM_METHOD_DELETE: return this.doFormDelete(dictionary);
            case FORM_METHOD_SAVE: 
                let name = formData.get('name').substr(0, 30);
                return this.doFormSave(dictionary, name, words); 
        }
        return false;
    }    

    doFormCopy(words) {
        this.el.formSelect.selectedIndex = 0;
        this.onFormSelect(); 
        this.el.formWords.value = WordFilter.formatForEdit(words);
        this.formShowMessage("Copied...");
        return true;
    }
    doFormDelete(dictionary) {
        let message = dictionary ? "Are you sure you want to delete: " + dictionary : "Do you want to discard this draft?";
        if (window.confirm(message)) {
            this.dictionaries.deleteDictionary(dictionary);
            this.setDictionary(DEFAULT_DICTIONARY);
            this.showSettings();
            this.formShowMessage("Deleted!");
            return true;
        }
        return false;
    }
    doFormSave(dictionary, name, words) {
        let errors = [];
        if (!dictionary && !name) {
            errors.push("You have to set a name!");
        }
        if (words.length === 0) {
            errors.push("Please check your words!");
        }
        this.el.formWords.value = WordFilter.formatForEdit(words);
        if (!errors.length) {
            if (!dictionary) {
                this.dictionaries.addDictionary(name, words);
                this.setDictionary(name);
            } else {
                this.dictionaries.updateDictionary(dictionary, words);
                this.setDictionary(dictionary);
            }
            this.showSettings();
        }
        if (errors.length) {
            alert(errors.join("\n"));
        } else {
            this.formShowMessage("Saved!");
        }
        return errors.length == 0;    
    }
    formShowMessage(message) {
        this.el.formInfo.innerHTML = '<p>' + message + '</p>';        
    }

    onGridSize() {
        this.setGridSize(this.el.optionGridsize.value);
    }
    onDarkmode() {
        this.setDarkMode(!this.isDark);
    }
    onColor() {
        this.setColor(this.el.optionColor.value);
    }
    onRestoreDefaults() {
        this.setGridSize(DEFAULT_GRIDSIZE);
        this.setDarkMode(false);
        this.setColor(DEFAULT_COLOR);
        this.setDictionary(DEFAULT_DICTIONARY);
    }

    saveSetting(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }
    getSetting(key) {
        let val = localStorage.getItem(key);
        if (val) {
            val = JSON.parse(val);
        }
        return val;
    }
    setGridSize(size) {
        size = parseInt(size);
        if (isNaN(size) || size < GRID_SIZE_MIN || size > GRID_SIZE_MAX) {
            size = DEFAULT_GRIDSIZE;
        }
        this.gridSize = size;
        this.saveSetting(SETTING_GRID, size);
        this.el.optionGridsize.value = size.toString();
    }

    setDarkMode(isDark) {
        this.isDark = !!isDark;
        this.board.setDarkMode(isDark);
        if (isDark) {
            document.body.style.setProperty("--color-background", 'black');
            document.body.style.setProperty("--color-text", 'white');
            document.body.style.setProperty("--color-form-bg", '#222');
            document.body.style.setProperty("--color-form-edge", '#444');
        } else {
            document.body.style.setProperty("--color-background", 'white');
            document.body.style.setProperty("--color-text", 'black');
            document.body.style.setProperty("--color-form-bg", '#ddd');
            document.body.style.setProperty("--color-form-edge", '#999');
        }
        this.saveSetting(SETTING_MODE, this.isDark);
        this.board.render();
    }
    setColor(hue) {
        hue = parseInt(hue);
        if (isNaN(hue)) { // Default to 200.
            hue = DEFAULT_COLOR;
        }
        if (hue < 0) {
            hue == 0;          
        }
        if (hue > 360) {
            hue = 360;
        }
        if (this.hue === hue) {
            return false;
        }
        this.hue = hue;
        this.el.optionColor.value = hue;
        this.board.setColor(hue);
        document.body.style.setProperty("--color-form-color", this.board.lineFill);
        this.saveSetting(SETTING_COLOR, this.hue);
        this.board.render();
        return true;
    }

    setVisible(obj, isVisible) {
        obj.style.display = isVisible ? '' : 'none';
    }
    setOrientation(isLandscape) {
        if (isLandscape === this.isLandscape) {
            return;
        }
        this.isLandscape = isLandscape;
        this.updateOrientationVisibility();
        this.board.wordlist = isLandscape ? this.landscape.words : this.portrait.words;
        this.board.updateWordList();
    }
    updateOrientationVisibility() {
        this.setVisible(this.landscape.holder, this.isLandscape);
        this.setVisible(this.portrait.holder, !this.isLandscape);
    }

    resize() {
        let w = window.innerWidth;
        let h = window.innerHeight;
        let menuWidth = 30 + 10;
        let menuHeight = 40 + 80 + 20;
        let isLandscape = w > h;
        let cw = isLandscape ? w - menuHeight : w;
        let ch = !isLandscape ? h - menuHeight : h;
        let size = Math.min(cw, ch);
        this.board.resize(size);
        this.el.focus.style.width = size + 'px';
        this.el.focus.style.height = size + 'px';

        this.el.main.style.width = w + 'px';
        this.el.main.style.height = h + 'px';

        this.landscape.words.style.height = h + 'px';
        this.portrait.words.style.height = h - size + 'px';

        this.el.buttonNew.style.right = "10px";
        this.el.buttonNew.style.bottom = "10px";

        this.setOrientation(w > h);

        this.el.buttonSettings.style.right = "10px";
        let topspace = this.isLandscape ? 10 : size + 10;
        this.el.buttonSettings.style.top = topspace + "px";
        
        this.setVisible(this.el.loading, false);
        this.setVisible(this.el.buttons, true);   
    }

    onOpen() {
        this.onOpenClose(true);
    }
    onClose() {
        this.onOpenClose(false);
    }
    onOpenClose(isOpen) {
        this.isPlaying = true;
        this.showSettings();
        this.isOpen = isOpen;
        this.setVisible(this.el.main, this.isOpen);
        if (this.isOpen) {
            document.body.parentElement.style.overflow = 'hidden'; // Disable scrolling on top.
        } else {
            document.body.parentElement.style.overflow = '';
        }
    }

    onBoardUpdated() {
        this.saveSetting(SETTING_BOARD, this.board.serialize());
        if (this.board.isCompleted) {
            this.board.showWin();
        }
    }
}

// Init settings that will start everything.
export var settings = new Settings();
