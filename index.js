const fs = require("fs");

const setNestedProperty = (object, key, value) => {
    const properties = key.split('.');
    let index = 0;
    for (; index < properties.length - 1; ++index) {
        object = object[properties[index]];
    }
    object[properties[index]] = value;
}

const getNestedProperty = (object, key) => {
    const properties = key.split('.');
    let index = 0;
    for (; index < properties.length; ++index) {
        object = object && object[properties[index]];
    }
    return object;
}

module.exports = class MyJsonDatabase {

    /**
     * @typedef {object} BackupsOptions
     * @property {boolean} [enabled=false] Whether the backupshots are enabled
     * @property {number} [interval=86400000] The interval between each snapshot
     * @property {string} [path='./backups/'] The path of the backups
     */

    /**
     * @typedef {object} DatabaseOptions
     * @property {BackupsOptions} snapshots
     */

    /**
     * @param {string} filePath The path of the json file used for the database.
     * @param {DatabaseOptions} options
     */
    constructor(filePath, options){

        /**
         * The path of the json file used as database.
         * @type {string}
         */
        this.jsonFilePath = filePath || "./my-database.json";

        /**
         * The options for the database
         * @type {DatabaseOptions}
         */
        this.options = options || {};

        if (this.options.backups && this.options.backups.enabled) {
            const path = this.options.backups.path || './backups/';
            if (!fs.existsSync(path)) {
                fs.mkdirSync(path);
            }
            setInterval(() => {
                this.makeSnapshot();
            }, (this.options.backups.interval || 86400000));
        }

        /**
         * The data stored in the database.
         * @type {object}
         */
        this.data = {};

        if(!fs.existsSync(this.jsonFilePath)){
            fs.writeFileSync(this.jsonFilePath, "{}", "utf-8");
        } else {
            this.fetchDataFromFile();
        }
    }

    /**
     * Make a snapshot of the database and save it in the snapshot folder
     * @param {string} path The path where the snapshot will be stored
     */
    makeSnapshot (path) {
        path = path || this.options.backups.path || './backups/';
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path);
        }
        const fileName = `backup-${Date.now()}.json`;
        fs.writeFileSync(path.join(path, fileName));
    }

    /**
     * Get data from the json file and store it in the data property.
     */
    fetchDataFromFile(){
        const savedData = JSON.parse(fs.readFileSync(this.jsonFilePath));
        if(typeof savedData === "object"){
            this.data = savedData;
        }
    }

    /**
     * Write data to the json file.
     */
    save(){
        fs.writeFileSync(this.jsonFilePath, JSON.stringify(this.data, null, 2), "utf-8");
    }

    /**
     * Get data for a key in the database
     * @param {string} key 
     */
    get(key){
        return getNestedProperty(this.data, key);
    }

    /**
     * Check if a key data exists.
     * @param {string} key 
     */
    has(key){
        return getNestedProperty(this.data, key) != undefined;
    }
    
    /**
     * Set new data for a key in the database.
     * @param {string} key
     * @param {*} value 
     */
    set(key, value){
        setNestedProperty(this.data, key, value);
        this.save();
    }

    /**
     * Delete data for a key from the database.
     * @param {string} key 
     */
    delete(key){
        delete this.data[key];
        this.save();
    }

    /**
     * Add a number to a key in the database.
     * @param {string} key 
     * @param {number} count 
     */
    add(key, count){
        if(!this.data[key]) this.data[key] = 0;
        this.data[key] += count;
        this.save();
    }

    /**
     * Subtract a number to a key in the database.
     * @param {string} key 
     * @param {number} count 
     */
    subtract(key, count){
        if(!this.data[key]) this.data[key] = 0;
        this.data[key] -= count;
        this.save();
    }

    /**
     * Push an element to a key in the database.
     * @param {string} key 
     * @param {*} element 
     */
    push(key, element){
        if (!this.data[key]) this.data[key] = [];
        this.data[key].push(element);
        this.save();
    }
    /**
     * pull one of the elements from the key in the database 
     * @param {string} key 
     * @param {*} element 
     */
    pullOne(key, element){
        if (!this.data[key]) this.data[key] = [];
        var index = this.data[key].indexOf(element)
        if(index > -1) {
          this.data[key].splice(index, 1)
        }
        this.save();
    }
    /**
     * pull all the same elements from the key that is in the database
     * @param {string} key 
     * @param {*} element 
     */
    pullMany(key, element){
        if (!this.data[key]) this.data[key] = [];
        var i = 0;
        var value = this.data[key]
        while (i < value.length) {
          if(value[i] === element) {
            value.splice(i, 1)
          } else {
            ++i
          }
        } 
        this.save();
    }
    /**
     * Clear a key, on the database.
     * @param {string} key
     */
    clear(key) {
      if(!this.data[key]) throw new Error (`there is no key "${key}", in your database`)
      this.data[key] = {}
      this.save()
    }
    /**
     * Clear all database
     *
     */
    clearAll(){
        this.data = {};
        this.save();
    }

    /**
     * Get all the data from the database.
     */
    all(){
        return Object.keys(this.data).map((key) => {
            return {
                key,
                data: this.data[key]
            }
        });
    }

};
