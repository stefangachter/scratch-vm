const blockIconURI = require('./icon');


/**
 * Scratch 3.0 blocks to interact with a Thymio-II robot.
 */
class Scratch3ThymioBlocks {
    /**
     * Construct a set of Thymio blocks.
     * @param {Runtime} runtime - the Scratch 3.0 runtime.
     */
    constructor (runtime) {
        /**
         * The Scratch 3.0 runtime.
         * @type {Runtime}
         */
        this.runtime = runtime;
    }
    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        return {
            id: 'thymio',
            name: 'Thymio',
            blockIconURI: blockIconURI,
            blocks: [],
            menus: {}
        };
    }
}

module.exports = Scratch3ThymioBlocks;
