const log = require('../../util/log');

const aeslString = require('./aesl');
const blockIconURI = require('./icon');


class Thymio {
    static get ASEBA_HTTP_URL () {
        return 'http://localhost:3000';
    }

    constructor () {
        this.source = null;
        this.connected = 0;
        this.eventCompleteCallback = false;
        this.cachedValues = Array();
        this.leds = [0, 0, 0];
        this.dial = -1;

        this.loadAesl();
        this.connect();
    }
    /**
     * The function subscribes to the Thymio’s SSE stream, sets an Event Listener on messages received
     * and stores R_state variable in cachedValues
     */
    connect () {
        if (this.source) {
            this.disconnect();
        }

        const url = `${Thymio.ASEBA_HTTP_URL}/nodes/thymio-II/events`;
        this.source = new EventSource(url);

        this.source.addEventListener('open', () => {
            log.info('Connection opened with Thymio web bridge.');
        });
        this.source.addEventListener('message', e => {
            const eventData = e.data.split(' ');
            this.connected = 2;

            if (eventData[0] === 'R_state_update') {
                this.cachedValues = eventData;
            } else {
                log.info(`Thymio emitted: ${eventData}`);
            }
            // If block requires to check event message for completion, it will set eventCompleteCallback
            if (typeof eventCompleteCallback === 'function') {
                log.info(`Call callback with ${eventData}`);

                // We pass eventData to be able to read event message
                this.eventCompleteCallback(eventData);
            }
        });
        this.source.addEventListener('error', () => {
            this.disconnect('Event stream closed');
            this.connected = 0;
            this.connect();
        });
    }
    /**
     * The function closes the Event Source.
     */
    disconnect () {
        if (this.source) {
            this.source.close();
            this.source = null;
        }
        this.connected = 0;
    }
    /**
     * The function sends code of thymio_motion.aesl to asebahttp bridge
     */
    loadAesl () {
        log.info('Send Aesl for Thymio.');

        const xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = () => {
            if (xhttp.readyState === 4) {
                log.info('thymio_motion.aesl sent.');
                this.connect();
            }
        };

        xhttp.open('PUT', `${Thymio.ASEBA_HTTP_URL}/nodes/thymio-II`, true);
        xhttp.send(aeslString);
    }
    sendAction (action, args, callback) {
        log.info(`Send action ${action} with ${args}`);

        const params = args.join('/');

        const xmlhttp = new XMLHttpRequest();
        xmlhttp.responseType = 'json';
        const url = `${Thymio.ASEBA_HTTP_URL}/nodes/thymio-II/${action}/${params}`;

        if (typeof callback === 'function') {
            xmlhttp.onreadystatechange = callback;
        }

        xmlhttp.open('GET', url, true);
        xmlhttp.send();
    }
}

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

        this.thymio = new Thymio();
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
