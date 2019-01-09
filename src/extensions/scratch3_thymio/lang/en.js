module.exports = {
    blocks: {
        setMotor: 'motor [M] [N]',
        stopMotors: 'stop motors',
        move: 'move [N]',
        moveWithSpeed: 'move [N] with speed [S]',
        moveWithTime: 'move [N] in [S]s',
        turn: 'turn [N]',
        turnWithSpeed: 'turn [N] with speed [S]',
        turnWithTime: 'turn [N] in [S]s',
        arc: 'circle radius [R] angle [A]',
        setOdomoter: 'set odometer [N] [O] [P]',
        leds: 'leds RGB [L] [R] [G] [B]',
        setLeds: 'leds set color [C] on [L]',
        changeLeds: 'leds change color [C] on [L]',
        clearLeds: 'leds clear',
        nextDial: 'leds next dial [L]',
        ledsCircle: 'leds dial all [A] [B] [C] [D] [E] [F] [G] [H]',
        ledsProxH: 'leds sensors h [A] [B] [C] [D] [E] [F] [G] [H]',
        ledsProxV: 'leds sensors v [A] [B]',
        ledsButtons: 'leds buttons [A] [B] [C] [D]',
        ledsTemperature: 'leds temperature [A] [B]',
        ledsRc: 'leds rc [A]',
        ledsSound: 'leds sound [A]',
        soundSystem: 'play system sound [S]',
        soundFreq: 'play note [N] during [S]s',
        soundPlaySd: 'play sound SD [N]',
        soundRecord: 'record sound [N]',
        soundReplay: 'replay sound [N]',
        whenButton: 'when button [B]',
        touching: 'object detected [S]',
        notouching: 'no object [S]',
        touchingThreshold: 'object detected [S] [N]',
        bump: 'tap',
        soundDetected: 'sound detected',
        valButton: 'button [B]',
        proximity: 'proximity sensor [N]',
        proxHorizontal: 'proximity sensors',
        ground: 'ground sensor [N]',
        proxGroundDelta: 'ground sensors',
        distance: 'distance [S]',
        angle: 'angle [S]',
        tilt: 'tilt on [T]',
        micIntensity: 'sound level',
        odometer: 'odometer [O]',
        motor: 'measure motor [M]'
    },
    menus: {
        leftrightall: {
            left: 'left',
            right: 'right',
            all: 'all'
        },
        leftright: {
            left: 'left',
            right: 'right'
        },
        sensors: {
            front: 'front',
            back: 'back',
            ground: 'ground'
        },
        sensors2: {
            left: 'left',
            front: 'front',
            right: 'right',
            back: 'back',
            ground: 'ground'
        },
        proxsensors: {
            front_far_left: 'front far left',
            front_left: 'front left',
            front_center: 'front center',
            front_right: 'front right',
            front_far_right: 'front far right',
            back_left: 'back left',
            back_right: 'back right'
        },
        light: {
            all: 'all',
            top: 'top',
            bottom: 'bottom',
            bottom_left: 'bottom left',
            bottom_right: 'bottom right'
        },
        angles: {
            front: 'front',
            back: 'back',
            ground: 'ground'
        },
        odo: {
            direction: 'direction',
            x: 'x',
            y: 'y'
        },
        tilts: {
            front_back: 'front-back',
            top_bottom: 'top-bottom',
            left_right: 'left-right'
        },
        buttons: {
            center: 'center',
            front: 'front',
            back: 'back',
            left: 'left',
            right: 'right'
        },
        nearfar: {
            near: 'near',
            far: 'far'
        }
    }
};
