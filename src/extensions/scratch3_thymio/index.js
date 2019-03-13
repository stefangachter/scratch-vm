/**
* Thymio exension for Scratch 3.0
* v 2.0 for internal use
* Created by Pollen Robotics on May 7, 2018
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Lesser General Public License as published
* by the Free Software Foundation, version 3 of the License.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Lesser General Public License for more details.
*
* You should have received a copy of the GNU Lesser General Public License
* along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Timer = require('../../util/timer');
const Cast = require('../../util/cast');
const log = require('../../util/log');
const formatMessage = require('format-message');

const blockIconURI = require('./icon');

const aesl = require('./aesl');
const thymioApi = require('@mobsya/thymio-api');


const clamp = function (val, min, max) {
    val = (val < min ? min : (val > max ? max : val));
    return val;
};

const makeLedsRGBVector = function (color) {
    const rgb = [];
    switch (parseInt(color / 33, 10)) {
    case 0:
        rgb[0] = 33;
        rgb[1] = color % 33;
        rgb[2] = 0;
        break;
    case 1:
        rgb[0] = 33 - (color % 33);
        rgb[1] = 33;
        rgb[2] = 0;
        break;
    case 2:
        rgb[0] = 0;
        rgb[1] = 33;
        rgb[2] = color % 33;
        break;
    case 3:
        rgb[0] = 0;
        rgb[1] = 33 - (color % 33);
        rgb[2] = 33;
        break;
    case 4:
        rgb[0] = color % 33;
        rgb[1] = 0;
        rgb[2] = 33;
        break;
    case 5:
        rgb[0] = 33;
        rgb[1] = 0;
        rgb[2] = 33 - (color % 33);
        break;
    }
    return rgb;
};

class Thymio {
    static get TDM_URL () {
        return 'ws://127.0.0.1:8597';
    }
    static get VMIN () {
        return -500;
    }
    static get VMAX () {
        return 500;
    }
    static get LMIN () {
        return 0;
    }
    static get LMAX () {
        return 32;
    }
    constructor () {
        this.node = null;
        this.connected = 0;
        this.eventCompleteCallback = false;
        this.cachedValues = new Map();
        this._leds = [0, 0, 0];
        this._dial = -1;

        this.connect();
    }
    /**
     * The function subscribes to the TDM notification and tries to lock a Thymio Node.
     * When locked, the aseba script is sent and the various events watched.
     */
    connect () {
        if (this.node) {
            this.disconnect();
        }

        log.info('Tries to connect with TDM.');
        const client = thymioApi.createClient(Thymio.TDM_URL);

        client.onNodesChanged = nodes => {
            for (const node of nodes) {
                if (this.node === null && node.status === thymioApi.NodeStatus.available) {
                    // We found an available node to connect to.
                    // We try to lock it.
                    node.lock().then(() => {
                        log.info(`Node ${node.id} locked.`);
                    });
                } else if (node.status === thymioApi.NodeStatus.ready) {
                    log.info(`Node ${node.id} ready.`);

                    node.onEvents = events => {
                        if (events) {
                            if (typeof this.eventCompleteCallback === 'function') {
                                events.forEach(this.eventCompleteCallback);
                            }
                        }
                    };

                    node.onVariablesChanged = vars => {
                        this.cachedValues = new Map([...this.cachedValues, ...vars]);
                    };

                    node.setEventsDescriptions(aesl.eventsDefinition)
                        .then(() => node.sendAsebaProgram(aesl.asebaScript))
                        .then(() => node.runProgram())
                        .then(() => {
                            this.node = node;
                            this.connected = 2;
                            this.runtime.emit(this.runtime.constructor.PERIPHERAL_CONNECTED);
                            log.info(`Node ready!`);
                        });

                } else if (node.status === thymioApi.NodeStatus.disconnected && node === this.node) {
                    this.disconnect();
                }
            }
        };
    }
    /**
     * The function closes the connection with the TDM.
     */
    disconnect () {
        if (this.node) {
            this.node = null;
        }
        this.connected = 0;
        this.runtime.emit(this.runtime.constructor.PERIPHERAL_DISCONNECTED);
    }
    isConnected () {
        return this.connected === 2;
    }
    sendAction (action, args, callback) {
        log.info(`Send action ${action} with ${args}`);

        if (this.node === null) {
            log.warn(`Tried to send action ${action} before having a connected node!`);
            return;
        }

        // Make sure we are only sending Int16.
        args = args.map(Math.round);

        this.node.emitEvents(action, args).then(callback);
        this.runtime.requestRedraw();
    }
    requestSend (args, _, callback) {
        // In previous version, the event name was used as an id.
        // With the new API it expects a Int16 as the id.
        // We use a static table as actually only a single event is used in this case.
        const action2Id = {
            Q_add_motion: 42
        };
        const actionId = action2Id[args[0]];
        this.sendAction(args[0], [actionId].concat(args.slice(1)), callback);
    }
    /**
     * Run the left/right/all motors.
     * @param {string} motor - Item of menu 'leftrightal'.
     * @param {value} value - Speed in Aseba unities.
     */
    setMotor (motor, value) {
        value = parseInt(clamp(value, Thymio.VMIN, Thymio.VMAX), 10);
        const args = [value];

        log.info(`Set motor ${motor} to ${value}`);

        if (motor === 'left') {
            this.sendAction('M_motor_left', args);
        } else if (motor === 'right') {
            this.sendAction('M_motor_right', args);
        } else {
            this.sendAction('M_motor_left', args, () => {
                this.sendAction('M_motor_right', args);
            });
        }
    }
    /**
     * The robot stops.
     */
    stopMotors () {
        log.info('Stop all motors.');
        const args = [0];

        this.sendAction('M_motor_left', args, () => {
            this.sendAction('M_motor_right', args);
        });
    }
    move (distance, callback) {
        const mm = parseInt(distance, 10);
        if (mm === 0) {
            const args = [100 * 32 / 10]; // speed=10mm/s
            this.sendAction('M_motor_left', args, () => {
                this.sendAction('M_motor_right', args, callback);
            });

        } else {
            let speed;
            if (Math.abs(mm) < 20) {
                speed = 20;
            } else if (Math.abs(mm) > 150) {
                speed = 150;
            } else {
                speed = Math.abs(mm);
            }
            const time = Math.abs(mm) * 100 / speed; // time measured in 100 Hz ticks
            speed = speed * 32 / 10;

            const args = Array();
            args.push('Q_add_motion');
            args.push(time);
            if (mm > 0) {
                args.push(speed);
                args.push(speed);
            } else {
                args.push(speed * -1);
                args.push(speed * -1);
            }
            this.requestSend(args, 2, () => {
                // Set message to look for in event "message" and execute callback (next block) when received
                this.eventCompleteCallback = (data, event) => {
                    if (event.match(/^Q_motion_noneleft/)) {
                        callback();
                    }
                };
            });
        }
    }
    moveWithSpeed (distance, speed, callback) {
        // Construct args to send with request
        const mm = parseInt(distance, 10);
        speed = parseInt(Math.abs(speed), 10);
        speed = parseInt(clamp(speed, Thymio.VMIN * 10 / 32, Thymio.VMAX * 10 / 32), 10);

        if (mm === 0) {
            const args = [speed * 32 / 10]; // speed=10mm/s
            this.sendAction('M_motor_left', args, () => {
                this.sendAction('M_motor_right', args, callback);
            });
        } else {
            const time = Math.abs(mm) * 100 / speed; // time measured in 100 Hz ticks
            speed = speed * 32 / 10;

            const args = Array();
            args.push('Q_add_motion');
            args.push(time);
            if (mm > 0) {
                args.push(speed);
                args.push(speed);
            } else {
                args.push(speed * -1);
                args.push(speed * -1);
            }
            // Send request
            this.requestSend(args, 2, () => {
                // Set message to look for in event "message" and execute callback (next block) when received
                this.eventCompleteCallback = (data, event) => {
                    if (event.match(/^Q_motion_noneleft/)) {
                        callback();
                    }
                };
            });
        }
    }
    moveWithTime (distance, time, callback) {
        const mm = parseInt(distance, 10);
        time = parseInt(Math.abs(time), 10);
        let speed = parseInt(Math.abs(mm) / time, 10);
        speed = parseInt(clamp(speed, Thymio.VMIN * 10 / 32, Thymio.VMAX * 10 / 32), 10);

        time = time * 100; // time measured in 100 Hz ticks
        speed = speed * 32 / 10;

        const args = Array();

        args.push('Q_add_motion');
        args.push(time);
        if (mm > 0) {
            args.push(speed);
            args.push(speed);
        } else {
            args.push(speed * -1);
            args.push(speed * -1);
        }

        // Send request
        this.requestSend(args, 2, () => {
            // Set message to look for in event "message" and execute callback (next block) when received
            this.eventCompleteCallback = (data, event) => {
                if (event.match(/^Q_motion_noneleft/)) {
                    callback();
                }
            };
        });
    }
    turn (angle, callback) {
        angle = parseInt(angle, 10);
        let speed;
        let time;
        if (Math.abs(angle) > 90) {
            speed = 65 * 32 / 10;
            time = Math.abs(angle) * 1.3;
        } else {
            speed = 43 * 32 / 10;
            time = Math.abs(angle) * 2.0;
            time = angle * angle * 2.0 / ((Math.abs(angle) * 1.016) - 0.52); // nonlinear correction
        }

        const args = Array();
        args.push('Q_add_motion');
        args.push(time);
        args.push((angle > 0) ? speed : speed * -1);
        args.push((angle > 0) ? speed * -1 : speed);


        // Send request
        this.requestSend(args, 2, () => {
            // Set message to look for in event "message" and execute callback (next block) when received
            this.eventCompleteCallback = (data, event) => {
                if (event.match(/^Q_motion_noneleft/)) {
                    callback();
                }
            };
        });
    }
    turnWithSpeed (angle, speed, callback) {
        angle = parseInt(angle, 10) * 0.78;
        speed = parseInt(Math.abs(speed), 10);
        speed = parseInt(clamp(speed, Thymio.VMIN * 10 / 32, Thymio.VMAX * 10 / 32), 10);

        if (angle === 0) {
            const args = Array();
            args.push(speed * 32 / 10); // speed=10mm/s

            this.sendAction('M_motor_left', args, () => {
                args[0] = -args[0];
                this.sendAction('M_motor_right', args, callback);
            });
        } else {
            const time = Math.abs(angle) * 100 / speed; // time measured in 100 Hz ticks
            speed = speed * 32 / 10;

            const args = Array();
            args.push('Q_add_motion');
            args.push(time);

            if (angle > 0) {
                args.push(speed);
                args.push(speed * -1);
            } else {
                args.push(speed * -1);
                args.push(speed);
            }

            this.requestSend(args, 2, () => {
                // Set message to look for in event "message" and execute callback (next block) when received
                this.eventCompleteCallback = (data, event) => {
                    if (event.match(/^Q_motion_noneleft/)) {
                        callback();
                    }
                };
            });
        }
    }
    turnWithTime (angle, time, callback) {
        angle = parseInt(angle, 10) * 0.78;
        time = parseInt(Math.abs(time), 10);

        let speed = Math.abs(angle) / time; // time measured in 100 Hz ticks
        speed = speed * 32 / 10;

        const args = Array();
        args.push('Q_add_motion');
        args.push(time * 100);

        if (angle > 0) {
            args.push(speed);
            args.push(speed * -1);
        } else {
            args.push(speed * -1);
            args.push(speed);
        }

        this.requestSend(args, 2, () => {
            // Set message to look for in event "message" and execute callback (next block) when received
            this.eventCompleteCallback = (data, event) => {
                if (event.match(/^Q_motion_noneleft/)) {
                    callback();
                }
            };
        });
    }
    /**
     * Returns the value returned by a given position sensor.
     * @param {number} sensor - 0 to 6 (front 0 to 4, back 6 or 7)
     * @returns {number} value returned by a given position sensor.
     */
    getProximity (sensor) {
        log.info(`Thymio called proximity ${sensor}`);

        sensor = parseInt(sensor, 10);
        if (sensor >= 0 && sensor <= 6) {
            return this.cachedValues.get('prox.horizontal')[sensor];
        }

        return 0;
    }
    /**
     * @param {number} sensor - 0 for the left, 1 for the right
     * @returns {number} value returned by a given position sensor.
     */
    ground (sensor) {
        if (sensor === 0 || sensor === 1) {
            return this.cachedValues.get('prox.ground.delta')[sensor];
        }
        return 0;
    }
    /**
     * @param {string} sensor - (front, back, ground)
     * @returns {number} Distance from an obstacle calculated from the given sensors
     */
    distance (sensor) {
        if (sensor === 'front') {
            return this.cachedValues.get('distance.front');
        } else if (sensor === 'back') {
            return this.cachedValues.get('distance.back');
        }
        const ground = this.cachedValues.get('prox.ground.delta').reduce((a, b) => a + b, 0);

        if (ground > 1000) {
            return 0;
        }
        return 500;
    }
    /**
     * @param {string} sensor - (front, back, ground)
     * @returns {number} Angle under which an obstacle is seen from the robot,
     * calculated from the horizontal sensors of an obstacle.
     */
    angle (sensor) {
        return this.cachedValues.get(`angle.${sensor}`);
    }
    touchVal (sensor) {
        if (sensor === 'front') {
            const front = this.cachedValues.get('prox.horizontal')
                .slice(0, 5)
                .reduce((a, b) => a + b, 0);
            return front;
        } else if (sensor === 'back') {
            const back = this.cachedValues.get('prox.horizontal')
                .slice(5, 7)
                .reduce((a, b) => a + b, 0);
            return back;
        }
        const ground = this.cachedValues.get('prox.ground.delta')
            .reduce((a, b) => a + b, 0);
        return ground;
    }
    touching (sensor) {
        const val = this.touchVal(sensor);

        if (sensor === 'front') {
            return val / 1000 > 0;
        } else if (sensor === 'back') {
            return val / 1000 > 0;
        }
        return val > 50;
    }
    notouching (sensor) {
        const val = this.touchVal(sensor);

        if (sensor === 'front') {
            return val <= 0;
        } else if (sensor === 'back') {
            return val <= 0;
        }
        return val <= 50;
    }
    touchingThreshold (sensor, threshold) {
        let limit = 0;
        if (threshold === 'far') {
            limit = 1000;
        } else {
            limit = 3000;
        }

        const hori = this.cachedValues.get('prox.horizontal');

        if (sensor === 'front') {
            return hori[2] > limit;
        } else if (sensor === 'left') {
            return hori[0] > limit || hori[1] > limit;
        } else if (sensor === 'right') {
            return hori[3] > limit || hori[4] > limit;
        } else if (sensor === 'back') {
            return hori[5] > limit || hori[6] > limit;
        }
        if (threshold === 'far') {
            limit = 50;
        } else {
            limit = 600;
        }
        const ground = this.cachedValues.get('prox.ground.delta');
        return ground[0] > limit || ground[1] > limit;
    }
    leds (led, r, g, b) {
        const args = [
            parseInt(clamp(r, Thymio.LMIN, Thymio.LMAX), 10),
            parseInt(clamp(g, Thymio.LMIN, Thymio.LMAX), 10),
            parseInt(clamp(b, Thymio.LMIN, Thymio.LMAX), 10)
        ];

        if (led === 'all') {
            this.sendAction('V_leds_top', args);
            args.unshift(0);
            this.sendAction('V_leds_bottom', args);
            args[0] = 1;
            this.sendAction('V_leds_bottom', args);
        } else if (led === 'top') {
            this.sendAction('V_leds_top', args);
        } else if (led === 'bottom') {
            args.unshift(0);
            this.sendAction('V_leds_bottom', args);
            args[0] = 1;
            this.sendAction('V_leds_bottom', args);
        } else if (led === 'bottom-left') {
            args.unshift(0);
            this.sendAction('V_leds_bottom', args);
        } else if (led === 'bottom-right') {
            args.unshift(1);
            this.sendAction('V_leds_bottom', args);
        }
    }
    setLeds (led, color) {
        color = parseInt(color, 10) % 198;
        let mask;
        if (led === 'all') {
            mask = 7;
        } else if (led === 'top') {
            mask = 1;
        } else if (led === 'bottom') {
            mask = 6;
        } else if (led === 'bottom-left') {
            mask = 2;
        } else if (led === 'bottom-right') {
            mask = 4;
        } else {
            mask = 7;
        }

        const rgb = makeLedsRGBVector(color); // by default, "V_leds_top"

        if (mask === 1) {
            this.sendAction('V_leds_top', rgb, () => {
                this._leds[0] = color;
            });
        } else if (mask === 2) {
            rgb.unshift(0);
            this.sendAction('V_leds_bottom', rgb, () => {
                this._leds[1] = color;
            });
        } else if (mask === 4) {
            rgb.unshift(1);
            this.sendAction('V_leds_bottom', rgb, () => {
                this._leds[2] = color;
            });
        } else if (mask === 6) {
            rgb.unshift(0);
            this.sendAction('V_leds_bottom', rgb, () => {
                this._leds[1] = color;
                rgb[0] = 1;
                this.sendAction('V_leds_bottom', rgb, () => {
                    this._leds[2] = color;
                });
            });
        } else {
            this.sendAction('V_leds_top', rgb, () => {
                this._leds[0] = color;
                rgb.unshift(0);
                this.sendAction('V_leds_bottom', rgb, () => {
                    this._leds[1] = color;
                    rgb[0] = 1;
                    this.sendAction('V_leds_bottom', rgb, () => {
                        this._leds[2] = color;
                    });
                });
            });
        }
    }
    changeLeds (led, color) {
        let mask;
        if (led === 'all') {
            mask = 7;
        } else if (led === 'top') {
            mask = 1;
        } else if (led === 'bottom') {
            mask = 6;
        } else if (led === 'bottom-left') {
            mask = 2;
        } else if (led === 'bottom-right') {
            mask = 4;
        } else {
            mask = 7;
        }

        if (mask === 1) {
            const rgb = makeLedsRGBVector((parseInt(color + this._leds[0], 10) % 198));
            this.sendAction('V_leds_top', rgb, () => {
                this._leds[0] = color + this._leds[0];
            });
        } else if (mask === 2) {
            const rgb = makeLedsRGBVector((parseInt(color + this._leds[1], 10) % 198));
            rgb.unshift(0);
            this.sendAction('V_leds_bottom', rgb, () => {
                this._leds[1] = color + this._leds[1];
            });
        } else if (mask === 4) {
            const rgb = makeLedsRGBVector((parseInt(color + this._leds[2], 10) % 198));
            rgb.unshift(1);
            this.sendAction('V_leds_bottom', rgb, () => {
                this._leds[2] = color + this._leds[2];
            });
        } else if (mask === 6) {
            let rgb = makeLedsRGBVector((parseInt(color + this._leds[1], 10) % 198));
            rgb.unshift(0);
            this.sendAction('V_leds_bottom', rgb, () => {
                this._leds[1] = color + this._leds[1];
                rgb = makeLedsRGBVector((parseInt(color + this._leds[2], 10) % 198));
                rgb.unshift(1);
                this.sendAction('V_leds_bottom', rgb, () => {
                    this._leds[2] = color + this._leds[2];
                });
            });
        } else {
            let rgb = makeLedsRGBVector((parseInt(color + this._leds[0], 10) % 198));
            this.sendAction('V_leds_top', rgb, () => {
                this._leds[0] = color + this._leds[0];
                rgb = makeLedsRGBVector((parseInt(color + this._leds[1], 10) % 198));
                rgb.unshift(0);
                this.sendAction('V_leds_bottom', rgb, () => {
                    this._leds[1] = color + this._leds[1];
                    rgb = makeLedsRGBVector((parseInt(color + this._leds[2], 10) % 198));
                    rgb.unshift(1);
                    this.sendAction('V_leds_bottom', rgb, () => {
                        this._leds[2] = color + this._leds[2];
                    });
                });
            });
        }
    }
    clearLeds () {
        this.sendAction('V_leds_circle', [0, 0, 0, 0, 0, 0, 0, 0], () => {
            this.sendAction('V_leds_top', [0, 0, 0], () => {
                this.sendAction('V_leds_bottom', [0, 0, 0, 0], () => {
                    this.sendAction('V_leds_bottom', [1, 0, 0, 0], () => {});
                });
            });
        });
    }
    arc (radius, angle, callback) {
        angle = parseInt(angle, 10);
        radius = parseInt(radius, 10);

        if (Math.abs(radius) < 100) {
            radius = (radius < 0) ? -100 : 100; // although actually, we should just call scratch_turn
        }

        const ratio = (Math.abs(radius) - 95) * 10000 / Math.abs(radius);
        const time = (angle * ((50.36 * radius) + 25)) / 3600;

        let vOut = 400;
        let vIn = vOut * ratio / 10000;

        if (radius < 0) {
            vIn = -vIn;
            vOut = -vOut;
        }

        const args = Array();
        args.push('Q_add_motion');
        args.push(time);
        args.push((angle > 0) ? vOut : vIn);
        args.push((angle > 0) ? vIn : vOut);

        this.requestSend(args, 2, () => {
            // Set message to look for in event "message" and execute callback (next block) when received
            this.eventCompleteCallback = (data, event) => {
                if (event.match(/^Q_motion_noneleft/)) {
                    callback();
                }
            };
        });
    }
    soundSystem (sound) {
        this.sendAction('A_sound_system', [parseInt(sound, 10)]);
    }
    soundFreq (freq, duration) {
        this.sendAction('A_sound_freq', [parseInt(freq, 10), parseFloat(duration) * 60]);
    }
    soundPlaySd (sound) {
        this.sendAction('A_sound_play', [parseInt(sound, 10)]);
    }
    soundRecord (sound) {
        this.sendAction('A_sound_record', [parseInt(sound, 10)]);
    }
    soundReplay (sound) {
        this.sendAction('A_sound_replay', [parseInt(sound, 10)]);
    }
    /**
     * @returns {string} values of the 7 proximity sensors.
     */
    getProximityHorizontal () {
        return this.cachedValues.get('prox.horizontal').join(' ');
    }
    micIntensity () {
        return this.cachedValues.get('mic.intensity') / this.cachedValues.get('mic.threshold');
    }
    soundDetected () {
        const intensity = this.micIntensity();
        return intensity > 2;
    }
    bump () {
        const value = 10;
        const acc = this.cachedValues.get('acc');
        const ave = (acc.reduce((a, b) => a + b, 0) / acc.length);
        return ave > value;
    }
    tilt (menu) {
        const acc = this.cachedValues.get('acc');

        if (menu === 'left-right') {
            return acc[0];
        } else if (menu === 'front-back') {
            return acc[1];
        } else if (menu === 'top-bottom') {
            return acc[2];
        }
        return 0;
    }
    setOdomoter (theta, x, y) {
        this.sendAction('Q_set_odometer', [parseInt(theta, 10), parseInt(x, 10), parseInt(y, 10)]);
    }
    odometer (odo) {
        if (odo === 'direction') {
            return this.cachedValues.get('odo.degree');
        } else if (odo === 'x') {
            return this.cachedValues.get('odo.x') / 28;
        } else if (odo === 'y') {
            return this.cachedValues.get('odo.y') / 28;
        }
    }
    motor (motor) {
        return this.cachedValues.get(`motor.${motor}.speed`);
    }
    nextDial (dir) {
        if (this._dial === -1) {
            this._dial = 0;
        } else if (dir === 'left') {
            this._dial = (this._dial + 1) % 8;
        } else {
            this._dial = (8 + (this._dial - 1)) % 8;
        }
        const args = [0, 0, 0, 0, 0, 0, 0, 0];
        args[this._dial] = 32;
        this.sendAction('V_leds_circle', args);
    }
    ledsCircle (l0, l1, l2, l3, l4, l5, l6, l7) {
        const args = [
            parseInt(clamp(l0, Thymio.LMIN, Thymio.LMAX), 10),
            parseInt(clamp(l1, Thymio.LMIN, Thymio.LMAX), 10),
            parseInt(clamp(l2, Thymio.LMIN, Thymio.LMAX), 10),
            parseInt(clamp(l3, Thymio.LMIN, Thymio.LMAX), 10),
            parseInt(clamp(l4, Thymio.LMIN, Thymio.LMAX), 10),
            parseInt(clamp(l5, Thymio.LMIN, Thymio.LMAX), 10),
            parseInt(clamp(l6, Thymio.LMIN, Thymio.LMAX), 10),
            parseInt(clamp(l7, Thymio.LMIN, Thymio.LMAX), 10)
        ];

        this.sendAction('V_leds_circle', args);
    }
    ledsProxH (fl, flm, flc, frc, frm, fr, br, bl) {
        const args = [
            parseInt(clamp(fl, Thymio.LMIN, Thymio.LMAX), 10),
            parseInt(clamp(flm, Thymio.LMIN, Thymio.LMAX), 10),
            parseInt(clamp(flc, Thymio.LMIN, Thymio.LMAX), 10),
            parseInt(clamp(frc, Thymio.LMIN, Thymio.LMAX), 10),
            parseInt(clamp(frm, Thymio.LMIN, Thymio.LMAX), 10),
            parseInt(clamp(fr, Thymio.LMIN, Thymio.LMAX), 10),
            parseInt(clamp(br, Thymio.LMIN, Thymio.LMAX), 10),
            parseInt(clamp(bl, Thymio.LMIN, Thymio.LMAX), 10)
        ];

        this.sendAction('V_leds_prox_h', args);
    }
    ledsProxV (left, right) {
        const args = [
            parseInt(clamp(left, Thymio.LMIN, Thymio.LMAX), 10),
            parseInt(clamp(right, Thymio.LMIN, Thymio.LMAX), 10)
        ];
        this.sendAction('V_leds_prox_v', args);
    }
    ledsButtons (forward, right, backward, left) {
        const args = [
            parseInt(clamp(forward, Thymio.LMIN, Thymio.LMAX), 10),
            parseInt(clamp(right, Thymio.LMIN, Thymio.LMAX), 10),
            parseInt(clamp(backward, Thymio.LMIN, Thymio.LMAX), 10),
            parseInt(clamp(left, Thymio.LMIN, Thymio.LMAX), 10)
        ];
        this.sendAction('V_leds_buttons', args);
    }
    ledsTemperature (hot, cold) {
        const args = [
            parseInt(clamp(hot, Thymio.LMIN, Thymio.LMAX), 10),
            parseInt(clamp(cold, Thymio.LMIN, Thymio.LMAX), 10)
        ];

        this.sendAction('V_leds_temperature', args);
    }
    ledsRc (value) {
        this.sendAction('V_leds_rc', [parseInt(clamp(value, Thymio.LMIN, Thymio.LMAX), 10)]);
    }
    ledsSound (value) {
        this.sendAction('V_leds_sound', [parseInt(clamp(value, Thymio.LMIN, Thymio.LMAX), 10)]);
    }
    emit (value) {
        value = parseInt(value, 10);
        this.sendAction('prox.comm.tx', [value]);
    }
    receive () {
        return this.cachedValues.get('prox.comm.rx');
    }
    whenButton (button) {
        return this.valButton(button);
    }
    valButton (button) {
        if (button === 'center') {
            return this.cachedValues.get('button.center') > 0;
        } else if (button === 'front') {
            return this.cachedValues.get('button.forward') > 0;
        } else if (button === 'back') {
            return this.cachedValues.get('button.backward') > 0;
        } else if (button === 'left') {
            return this.cachedValues.get('button.left') > 0;
        } else if (button === 'right') {
            return this.cachedValues.get('button.right') > 0;
        }
    }
}

/**
 * Scratch 3.0 blocks to interact with a Thymio-II robot.
 */
class Scratch3ThymioBlocks {
    static get DEFAULT_LANG () {
        return 'en';
    }

    static get EXTENSION_ID () {
        return 'thymio';
    }

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
        this.runtime.registerPeripheralExtension(Scratch3ThymioBlocks.EXTENSION_ID, this);

        this.thymio = new Thymio();
        this.thymio.runtime = this.runtime;
    }
    isConnected () {
        return this.thymio.isConnected();
    }
    /**
      * @returns {object} messages - extension messages for locale
        It is defined by using the current browser locale or the default (en) if the language is not (yet) supported.
    */
    getMessagesForLocale () {
        const locale = formatMessage.setup().locale;

        let messages;
        try {
            messages = require(`./lang/${locale}`);
        } catch (ex) {
            log.warn(`Locale "${locale}" is not (yet) supported for this extension.`);
            log.warn(`Falling back to ${Scratch3ThymioBlocks.DEFAULT_LANG}`);

            messages = require(`./lang/${Scratch3ThymioBlocks.DEFAULT_LANG}`);
        }
        return messages;
    }
    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        const messages = this.getMessagesForLocale();

        return {
            id: Scratch3ThymioBlocks.EXTENSION_ID,
            name: 'Thymio',
            blockIconURI: blockIconURI,
            showStatusButton: true,
            blocks: [
                {
                    opcode: 'setMotor',
                    text: messages.blocks.setMotor,
                    blockType: BlockType.COMMAND,
                    arguments: {
                        M: {
                            type: ArgumentType.STRING,
                            menu: 'leftrightall',
                            defaultValue: 'all'
                        },
                        N: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 50
                        }
                    }
                },
                {
                    opcode: 'stopMotors',
                    text: messages.blocks.stopMotors,
                    blockType: BlockType.COMMAND
                },
                {
                    opcode: 'move',
                    text: messages.blocks.move,
                    blockType: BlockType.COMMAND,
                    arguments: {
                        N: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 50
                        }
                    }
                },
                {
                    opcode: 'moveWithSpeed',
                    text: messages.blocks.moveWithSpeed,
                    blockType: BlockType.COMMAND,
                    arguments: {
                        N: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 50
                        },
                        S: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 50
                        }
                    }
                },
                {
                    opcode: 'moveWithTime',
                    text: messages.blocks.moveWithTime,
                    blockType: BlockType.COMMAND,
                    arguments: {
                        N: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 50
                        },
                        S: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    }
                },
                {
                    opcode: 'turn',
                    text: messages.blocks.turn,
                    blockType: BlockType.COMMAND,
                    arguments: {
                        N: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 45
                        }
                    }
                },
                {
                    opcode: 'turnWithSpeed',
                    text: messages.blocks.turnWithSpeed,
                    blockType: BlockType.COMMAND,
                    arguments: {
                        N: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 90
                        },
                        S: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 50
                        }
                    }
                },
                {
                    opcode: 'turnWithTime',
                    text: messages.blocks.turnWithTime,
                    blockType: BlockType.COMMAND,
                    arguments: {
                        N: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 90
                        },
                        S: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    }
                },
                {
                    opcode: 'arc',
                    text: messages.blocks.arc,
                    blockType: BlockType.COMMAND,
                    arguments: {
                        R: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 150
                        },
                        A: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 45
                        }
                    }
                },
                {
                    opcode: 'setOdomoter',
                    text: messages.blocks.setOdomoter,
                    blockType: BlockType.COMMAND,
                    arguments: {
                        N: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 90
                        },
                        O: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        P: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    }
                },
                {
                    opcode: 'leds',
                    text: messages.blocks.leds,
                    blockType: BlockType.COMMAND,
                    arguments: {
                        L: {
                            type: ArgumentType.STRING,
                            menu: 'light',
                            defaultValue: 'all'
                        },
                        R: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 32
                        },
                        G: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        B: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    }
                },
                {
                    opcode: 'setLeds',
                    text: messages.blocks.setLeds,
                    blockType: BlockType.COMMAND,
                    arguments: {
                        L: {
                            type: ArgumentType.STRING,
                            menu: 'light',
                            defaultValue: 'all'
                        },
                        C: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    }
                },
                {
                    opcode: 'changeLeds',
                    text: messages.blocks.changeLeds,
                    blockType: BlockType.COMMAND,
                    arguments: {
                        L: {
                            type: ArgumentType.STRING,
                            menu: 'light',
                            defaultValue: 'all'
                        },
                        C: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 33
                        }
                    }
                },
                {
                    opcode: 'clearLeds',
                    text: messages.blocks.clearLeds,
                    blockType: BlockType.COMMAND
                },
                {
                    opcode: 'nextDial',
                    text: messages.blocks.nextDial,
                    blockType: BlockType.COMMAND,
                    arguments: {
                        L: {
                            type: ArgumentType.STRING,
                            menu: 'leftright',
                            defaultValue: 'left'
                        }
                    }
                },
                {
                    opcode: 'ledsCircle',
                    text: messages.blocks.ledsCircle,
                    blockType: BlockType.COMMAND,
                    arguments: {
                        A: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        B: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 8
                        },
                        C: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 16
                        },
                        D: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 32
                        },
                        E: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        F: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 8
                        },
                        G: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 16
                        },
                        H: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 32
                        }
                    }
                },
                {
                    opcode: 'ledsProxH',
                    text: messages.blocks.ledsProxH,
                    blockType: BlockType.COMMAND,
                    arguments: {
                        A: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        B: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 8
                        },
                        C: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 16
                        },
                        D: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 32
                        },
                        E: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        F: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 8
                        },
                        G: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 16
                        },
                        H: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 32
                        }
                    }
                },
                {
                    opcode: 'ledsProxV',
                    text: messages.blocks.ledsProxV,
                    blockType: BlockType.COMMAND,
                    arguments: {
                        A: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 32
                        },
                        B: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 32
                        }
                    }
                },
                {
                    opcode: 'ledsButtons',
                    text: messages.blocks.ledsButtons,
                    blockType: BlockType.COMMAND,
                    arguments: {
                        A: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 16
                        },
                        B: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 32
                        },
                        C: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 16
                        },
                        D: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 32
                        }
                    }
                },
                {
                    opcode: 'ledsTemperature',
                    text: messages.blocks.ledsTemperature,
                    blockType: BlockType.COMMAND,
                    arguments: {
                        A: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 32
                        },
                        B: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 8
                        }
                    }
                },
                {
                    opcode: 'ledsRc',
                    text: messages.blocks.ledsRc,
                    blockType: BlockType.COMMAND,
                    arguments: {
                        A: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 16
                        }
                    }
                },
                {
                    opcode: 'ledsSound',
                    text: messages.blocks.ledsSound,
                    blockType: BlockType.COMMAND,
                    arguments: {
                        A: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 32
                        }
                    }
                },
                {
                    opcode: 'soundSystem',
                    text: messages.blocks.soundSystem,
                    blockType: BlockType.COMMAND,
                    arguments: {
                        S: {
                            type: ArgumentType.STRING,
                            menu: 'sounds',
                            defaultValue: 1
                        }
                    }
                },
                {
                    opcode: 'soundFreq',
                    text: messages.blocks.soundFreq,
                    blockType: BlockType.COMMAND,
                    arguments: {
                        N: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 440
                        },
                        S: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    }
                },
                {
                    opcode: 'soundPlaySd',
                    text: messages.blocks.soundPlaySd,
                    blockType: BlockType.COMMAND,
                    arguments: {
                        N: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    }
                },
                {
                    opcode: 'soundRecord',
                    text: messages.blocks.soundRecord,
                    blockType: BlockType.COMMAND,
                    arguments: {
                        N: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    }
                },
                {
                    opcode: 'soundReplay',
                    text: messages.blocks.soundReplay,
                    blockType: BlockType.COMMAND,
                    arguments: {
                        N: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    }
                },
                {
                    opcode: 'whenButton',
                    text: messages.blocks.whenButton,
                    blockType: BlockType.HAT,
                    arguments: {
                        B: {
                            type: ArgumentType.STRING,
                            menu: 'buttons',
                            defaultValue: 'center'
                        }
                    }
                },
                {
                    opcode: 'touching',
                    text: messages.blocks.touching,
                    blockType: BlockType.HAT,
                    arguments: {
                        S: {
                            type: ArgumentType.STRING,
                            menu: 'sensors',
                            defaultValue: 'front'
                        }
                    }
                },
                {
                    opcode: 'notouching',
                    text: messages.blocks.notouching,
                    blockType: BlockType.HAT,
                    arguments: {
                        S: {
                            type: ArgumentType.STRING,
                            menu: 'sensors',
                            defaultValue: 'front'
                        }
                    }
                },
                {
                    opcode: 'touchingThreshold',
                    text: messages.blocks.touchingThreshold,
                    blockType: BlockType.HAT,
                    arguments: {
                        S: {
                            type: ArgumentType.STRING,
                            menu: 'sensors2',
                            defaultValue: 'front'
                        },
                        N: {
                            type: ArgumentType.STRING,
                            menu: 'nearfar',
                            defaultValue: 'near'
                        }
                    }
                },
                {
                    opcode: 'bump',
                    text: messages.blocks.bump,
                    blockType: BlockType.HAT
                },
                {
                    opcode: 'soundDetected',
                    text: messages.blocks.soundDetected,
                    blockType: BlockType.HAT
                },
                {
                    opcode: 'valButton',
                    text: messages.blocks.valButton,
                    blockType: BlockType.BOOLEAN,
                    arguments: {
                        B: {
                            type: ArgumentType.STRING,
                            menu: 'buttons',
                            defaultValue: 'center'
                        }
                    }
                },
                {
                    opcode: 'proximity',
                    text: messages.blocks.proximity,
                    blockType: BlockType.REPORTER,
                    arguments: {
                        N: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 2
                        }
                    }
                },
                {
                    opcode: 'proxHorizontal',
                    text: messages.blocks.proxHorizontal,
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'ground',
                    text: messages.blocks.ground,
                    blockType: BlockType.REPORTER,
                    arguments: {
                        N: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    }
                },
                {
                    opcode: 'proxGroundDelta',
                    text: messages.blocks.proxGroundDelta,
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'distance',
                    text: messages.blocks.distance,
                    blockType: BlockType.REPORTER,
                    arguments: {
                        S: {
                            type: ArgumentType.STRING,
                            menu: 'sensors',
                            defaultValue: 'front'
                        }
                    }
                },
                {
                    opcode: 'angle',
                    text: messages.blocks.angle,
                    blockType: BlockType.REPORTER,
                    arguments: {
                        S: {
                            type: ArgumentType.STRING,
                            menu: 'angles',
                            defaultValue: 'front'
                        }
                    }
                },

                {
                    opcode: 'tilt',
                    text: messages.blocks.tilt,
                    blockType: BlockType.REPORTER,
                    arguments: {
                        T: {
                            type: ArgumentType.STRING,
                            menu: 'tilts',
                            defaultValue: 'front-back'
                        }
                    }
                },
                {
                    opcode: 'micIntensity',
                    text: messages.blocks.micIntensity,
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'odometer',
                    text: messages.blocks.odometer,
                    blockType: BlockType.REPORTER,
                    arguments: {
                        O: {
                            type: ArgumentType.STRING,
                            menu: 'odo',
                            defaultValue: 'direction'
                        }
                    }
                },
                {
                    opcode: 'motor',
                    text: messages.blocks.motor,
                    blockType: BlockType.REPORTER,
                    arguments: {
                        M: {
                            type: ArgumentType.STRING,
                            menu: 'leftright',
                            defaultValue: 'left'
                        }
                    }
                }
                /* {
                    opcode: 'emit',
                    text: 'emit [N]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        N: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    }
                },
                {
                    opcode: 'receive',
                    text: 'receive',
                    blockType: BlockType.REPORTER
                },*/
            ],
            menus: {
                leftrightall: [
                    {text: messages.menus.leftrightall.left, value: 'left'},
                    {text: messages.menus.leftrightall.right, value: 'right'},
                    {text: messages.menus.leftrightall.all, value: 'all'}
                ],
                leftright: [
                    {text: messages.menus.leftright.left, value: 'left'},
                    {text: messages.menus.leftright.right, value: 'right'}
                ],
                sensors: [
                    {text: messages.menus.sensors.front, value: 'front'},
                    {text: messages.menus.sensors.back, value: 'back'},
                    {text: messages.menus.sensors.ground, value: 'ground'}
                ],
                sensors2: [
                    {text: messages.menus.sensors2.left, value: 'left'},
                    {text: messages.menus.sensors2.front, value: 'front'},
                    {text: messages.menus.sensors2.right, value: 'right'},
                    {text: messages.menus.sensors2.back, value: 'back'},
                    {text: messages.menus.sensors2.ground, value: 'ground'}
                ],
                proxsensors: [
                    {text: messages.menus.proxsensors.front_far_left, value: 0},
                    {text: messages.menus.proxsensors.front_left, value: 1},
                    {text: messages.menus.proxsensors.front_center, value: 2},
                    {text: messages.menus.proxsensors.front_right, value: 3},
                    {text: messages.menus.proxsensors.front_far_right, value: 4},
                    {text: messages.menus.proxsensors.back_left, value: 5},
                    {text: messages.menus.proxsensors.back_right, value: 6}
                ],
                light: [
                    {text: messages.menus.light.all, value: 'all'},
                    {text: messages.menus.light.top, value: 'top'},
                    {text: messages.menus.light.bottom, value: 'bottom'},
                    {text: messages.menus.light.bottom_left, value: 'bottom-left'},
                    {text: messages.menus.light.bottom_right, value: 'bottom-right'}
                ],
                angles: [
                    {text: messages.menus.angles.front, value: 'front'},
                    {text: messages.menus.angles.back, value: 'back'},
                    {text: messages.menus.angles.ground, value: 'ground'}
                ],
                sounds: ['0', '1', '2', '3', '4', '5', '6', '7'],
                odo: [
                    {text: messages.menus.odo.direction, value: 'direction'},
                    {text: messages.menus.odo.x, value: 'x'},
                    {text: messages.menus.odo.y, value: 'y'}
                ],
                tilts: [
                    {text: messages.menus.tilts.front_back, value: 'front-back'},
                    {text: messages.menus.tilts.top_bottom, value: 'top-bottom'},
                    {text: messages.menus.tilts.left_right, value: 'left-right'}
                ],
                buttons: [
                    {text: messages.menus.buttons.center, value: 'center'},
                    {text: messages.menus.buttons.front, value: 'front'},
                    {text: messages.menus.buttons.back, value: 'back'},
                    {text: messages.menus.buttons.left, value: 'left'},
                    {text: messages.menus.buttons.right, value: 'right'}
                ],
                nearfar: [
                    {text: messages.menus.nearfar.near, value: 'near'},
                    {text: messages.menus.nearfar.far, value: 'far'}
                ]
            }
        };
    }
    /**
     * Check if the stack timer needs initialization.
     * @param {object} util - utility object provided by the runtime.
     * @return {boolean} - true if the stack timer needs to be initialized.
     * @private
     */
    _stackTimerNeedsInit (util) {
        return !util.stackFrame.timer;
    }

    /**
     * Start the stack timer and the yield the thread if necessary.
     * @param {object} util - utility object provided by the runtime.
     * @param {number} duration - a duration in seconds to set the timer for.
     * @private
     */
    _startStackTimer (util, duration) {
        this._running = true;

        util.stackFrame.timer = new Timer();
        util.stackFrame.timer.start();
        util.stackFrame.duration = duration;
        util.yield();
    }

    /**
     * Check the stack timer, and if its time is not up yet, yield the thread.
     * @param {object} util - utility object provided by the runtime.
     * @private
     */
    _checkStackTimer (util) {
        const timeElapsed = util.stackFrame.timer.timeElapsed();
        if (this._running && timeElapsed < util.stackFrame.duration * 1000) {
            util.yield();
        }
    }
    _stopStackTimer () {
        this._running = false;
    }
    /**
     * Run the left/right/all motors.
     * @param {object} args - the block's arguments.
     * @property {M} string - Item of menu 'leftrightall'.
     * @property {N} value - Speed in Aseba unities.
     */
    setMotor (args) {
        this.thymio.setMotor(args.M, Cast.toNumber(args.N));
    }
    /**
     * Stop all motors.
     */
    stopMotors () {
        this.thymio.stopMotors();
    }
    move (args, util) {
        if (this._stackTimerNeedsInit(util)) {
            this.thymio.move(Cast.toNumber(args.N), () => this._stopStackTimer());
            this._startStackTimer(util, 1000000);
        } else {
            this._checkStackTimer(util);
        }
    }
    moveWithSpeed (args, util) {
        if (this._stackTimerNeedsInit(util)) {
            this.thymio.moveWithSpeed(
                Cast.toNumber(args.N),
                Cast.toNumber(args.S),
                () => this._stopStackTimer()
            );
            this._startStackTimer(util, 1000000);
        } else {
            this._checkStackTimer(util);
        }
    }
    moveWithTime (args, util) {
        if (this._stackTimerNeedsInit(util)) {
            this.thymio.moveWithTime(
                Cast.toNumber(args.N),
                Cast.toNumber(args.S),
                () => this._stopStackTimer()
            );
            this._startStackTimer(util, 1000000);
        } else {
            this._checkStackTimer(util);
        }
    }
    turn (args, util) {
        if (this._stackTimerNeedsInit(util)) {
            this.thymio.turn(
                Cast.toNumber(args.N),
                () => this._stopStackTimer()
            );
            this._startStackTimer(util, 1000000);
        } else {
            this._checkStackTimer(util);
        }
    }
    turnWithSpeed (args, util) {
        if (this._stackTimerNeedsInit(util)) {
            this.thymio.turnWithSpeed(
                Cast.toNumber(args.N),
                Cast.toNumber(args.S),
                () => this._stopStackTimer()
            );
            this._startStackTimer(util, 1000000);
        } else {
            this._checkStackTimer(util);
        }
    }
    turnWithTime (args, util) {
        if (this._stackTimerNeedsInit(util)) {
            this.thymio.turnWithTime(
                Cast.toNumber(args.N),
                Cast.toNumber(args.S),
                () => this._stopStackTimer()
            );
            this._startStackTimer(util, 1000000);
        } else {
            this._checkStackTimer(util);
        }
    }
    /**
     * Proximity sensor
     * @param {object} args - the block's arguments.
     * @property {N} number - 0 to 6 (front 0 to 4, back 5 or 6)
     * @returns {number} value returned by a given position sensor.
     */
    proximity (args) {
        return this.thymio.getProximity(Cast.toNumber(args.N));
    }
    /**
     * @param {object} args - the block's arguments.
     * @property {number} N - 0 for the left, 1 for the right
     * @returns {number} value returned by a given position sensor.
     */
    ground (args) {
        return this.thymio.ground(Cast.toNumber(args.N));
    }
    /**
     * @param {object} args - the block's arguments.
     * @property {S} string - (front, back, ground)
     * @returns {number} Distance from an obstacle calculated from the given sensors
     */
    distance (args) {
        return this.thymio.distance(args.S);
    }
    /**
     * @param {object} args - the block's arguments.
     * @property {S} string - (front, back, ground)
     * @returns {number} Angle under which an obstacle is seen from the robot,
     * calculated from the horizontal sensors of an obstacle.
     */
    angle (args) {
        return this.thymio.angle(args.S);
    }
    touching (args) {
        return this.thymio.touching(args.S);
    }
    notouching (args) {
        return this.thymio.notouching(args.S);
    }
    touchingThreshold (args) {
        return this.thymio.touchingThreshold(args.S, args.N);
    }
    leds (args) {
        this.thymio.leds(args.L, args.R, args.G, args.B);
    }
    setLeds (args) {
        this.thymio.setLeds(args.L, args.C);
    }
    changeLeds (args) {
        this.thymio.changeLeds(args.L, args.C);
    }
    clearLeds () {
        this.thymio.clearLeds();
    }
    arc (args, util) {
        if (this._stackTimerNeedsInit(util)) {
            this.thymio.arc(
                Cast.toNumber(args.R),
                Cast.toNumber(args.A),
                () => this._stopStackTimer()
            );
            this._startStackTimer(util, 1000000);
        } else {
            this._checkStackTimer(util);
        }
    }
    soundSystem (args) {
        this.thymio.soundSystem(args.S);
    }
    soundFreq (args) {
        this.thymio.soundFreq(Cast.toNumber(args.N), Cast.toNumber(args.S));
    }
    soundPlaySd (args) {
        this.thymio.soundPlaySd(args.N);
    }
    soundRecord (args) {
        this.thymio.soundRecord(args.N);
    }
    soundReplay (args) {
        this.thymio.soundReplay(args.N);
    }
    /**
     * @returns {string} values of the 7 proximity sensors.
     */
    proxHorizontal () {
        return this.thymio.getProximityHorizontal();
    }
    /**
     * @returns {string} values of the 2 lower sensors.
     */
    proxGroundDelta () {
        const left = this.thymio.ground(0);
        const right = this.thymio.ground(1);
        return `${left} ${right}`;
    }
    micIntensity () {
        return this.thymio.micIntensity();
    }
    soundDetected () {
        return this.thymio.soundDetected();
    }
    bump () {
        return this.thymio.bump();
    }
    tilt (args) {
        return this.thymio.tilt(args.T);
    }
    setOdomoter (args) {
        this.thymio.setOdomoter(Cast.toNumber(args.N), Cast.toNumber(args.O), Cast.toNumber(args.P));
    }
    odometer (args) {
        return this.thymio.odometer(args.O);
    }
    motor (args) {
        return this.thymio.motor(args.M);
    }
    nextDial (args) {
        this.thymio.nextDial(args.L);
    }
    ledsCircle (args) {
        this.thymio.ledsCircle(
            Cast.toNumber(args.A),
            Cast.toNumber(args.B),
            Cast.toNumber(args.C),
            Cast.toNumber(args.D),
            Cast.toNumber(args.E),
            Cast.toNumber(args.F),
            Cast.toNumber(args.G),
            Cast.toNumber(args.H)
        );
    }
    ledsProxH (args) {
        this.thymio.ledsProxH(
            Cast.toNumber(args.A),
            Cast.toNumber(args.B),
            Cast.toNumber(args.C),
            Cast.toNumber(args.D),
            Cast.toNumber(args.E),
            Cast.toNumber(args.F),
            Cast.toNumber(args.G),
            Cast.toNumber(args.H)
        );
    }
    ledsProxV (args) {
        this.thymio.ledsProxV(
            Cast.toNumber(args.A),
            Cast.toNumber(args.B)
        );
    }
    ledsButtons (args) {
        this.thymio.ledsButtons(
            Cast.toNumber(args.A),
            Cast.toNumber(args.B),
            Cast.toNumber(args.C),
            Cast.toNumber(args.D)
        );
    }
    ledsTemperature (args) {
        this.thymio.ledsTemperature(
            Cast.toNumber(args.A),
            Cast.toNumber(args.B)
        );
    }
    ledsRc (args) {
        this.thymio.ledsRc(Cast.toNumber(args.A));
    }
    ledsSound (args) {
        this.thymio.ledsSound(Cast.toNumber(args.A));
    }
    emit (args) {
        this.thymio.emit(Cast.toNumber(args.N));
    }
    receive () {
        return this.thymio.receive();
    }
    whenButton (args) {
        return this.thymio.whenButton(args.B);
    }
    valButton (args) {
        return this.thymio.valButton(args.B);
    }
}

module.exports = Scratch3ThymioBlocks;
