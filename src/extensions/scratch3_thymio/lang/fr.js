module.exports = {
    blocks: {
        setMotor: 'moteur [M] [N]',
        stopMotors: 'stop moteurs',
        move: 'avancer [N]',
        moveWithSpeed: 'avancer [N] avec vitesse [S]',
        moveWithTime: 'avancer [N] en [S]s',
        turn: 'tourner [N]',
        turnWithSpeed: 'tourner [N] avec vitesse [S]',
        turnWithTime: 'tourner [N] en [S]s',
        arc: 'cercle rayon [R] angle [A]',
        setOdomoter: 'odomètre [N] [O] [P]',
        leds: 'leds RVB [L] [R] [G] [B]',
        setLeds: 'leds fixer couleur [C] pour [L]',
        changeLeds: 'leds changer couleur [C] pour [L]',
        clearLeds: 'éteindre leds',
        nextDial: 'led cadran suivante [L]',
        ledsCircle: 'leds cadran toutes [A] [B] [C] [D] [E] [F] [G] [H]',
        ledsProxH: 'leds capteurs horiz. [A] [B] [C] [D] [E] [F] [G] [H]',
        ledsProxV: 'leds capteurs dessous [A] [B]',
        ledsButtons: 'leds boutons [A] [B] [C] [D]',
        ledsTemperature: 'leds température [A] [B]',
        ledsRc: 'leds rc [A]',
        ledsSound: 'leds son [A]',
        soundSystem: 'jouer son système [S]',
        soundFreq: 'jouer note [N] pendant [S]s',
        soundPlaySd: 'jouer son SD [N]',
        soundRecord: 'enregistrer son [N]',
        soundReplay: 'rejouer son [N]',
        whenButton: 'bouton [B]',
        touching: 'objet détecté [S]',
        notouching: 'pas d\'objet [S]',
        touchingThreshold: 'objet détecté [S] [N]',
        bump: 'choc',
        soundDetected: 'bruit',
        valButton: 'bouton [B]',
        proximity: 'capteur horizontal [N]',
        proxHorizontal: 'capteurs horizontaux',
        ground: 'capteur dessous [N]',
        proxGroundDelta: 'capteurs dessous',
        distance: 'distance [S]',
        angle: 'angle [S]',
        tilt: 'inclinaison [T]',
        micIntensity: 'niveau sonore',
        odometer: 'odomètre [O]',
        motor: 'mesure moteur [M]'
    },
    menus: {
        leftrightall: {
            left: 'gauche',
            right: 'droite',
            all: 'tous'
        },
        leftright: {
            left: 'gauche',
            right: 'droite'
        },
        sensors: {
            front: 'devant',
            back: 'derrière',
            ground: 'dessous'
        },
        sensors2: {
            left: 'gauche',
            front: 'devant',
            right: 'droite',
            back: 'derrière',
            ground: 'dessous'
        },
        proxsensors: {
            front_far_left: 'devant extrême gauche',
            front_left: 'devabt gauche',
            front_center: 'devant centre',
            front_right: 'devant droite',
            front_far_right: 'devant extrême droite',
            back_left: 'derrière gauche',
            back_right: 'derrière droite'
        },
        light: {
            all: 'tout',
            top: 'dessus',
            bottom: 'dessous',
            bottom_left: 'dessous gauche',
            bottom_right: 'dessous droite'
        },
        angles: {
            front: 'devant',
            back: 'derrière',
            ground: 'dessous'
        },
        odo: {
            direction: 'direction',
            x: 'x',
            y: 'y'
        },
        tilts: {
            front_back: 'devant-derrière',
            top_bottom: 'dessus-dessous',
            left_right: 'gauche-droite à plat'
        },
        buttons: {
            center: 'central',
            front: 'devant',
            back: 'derrière',
            left: 'gauche',
            right: 'droite'
        },
        nearfar: {
            near: 'proche',
            far: 'loin'
        }
    }
};
