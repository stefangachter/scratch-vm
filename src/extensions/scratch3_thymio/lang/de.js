module.exports = {
    blocks: {
        setMotor: 'setze Motor [M] auf Geschwindigkeit [N]',
        stopMotors: 'Motoren stoppen',
        move: 'fahre um [N]',
        moveWithSpeed: 'fahre um [N] mit Geschwindigkeit [S]',
        moveWithTime: 'fahre um [N] in [S]s',
        turn: 'drehe um [N]',
        turnWithSpeed: 'drehe um [N] mit Geschwindigkeit [S]',
        turnWithTime: 'drehe um [N] in [S]s',
        arc: 'fahre einen Kreis mit Radius [R] und Winkel [A]',
        setOdomoter: 'setze Geschwindigkeit [N] und Richtung x: [O] y: [P]',
        leds: 'setze LED [L] auf Farbe R: [R] G: [G] B: [B]',
        setLeds: 'setze LED [L] auf Farbeffekt [C]',
        changeLeds: 'ändere LED [L] um Farbeffekt [C]',
        clearLeds: 'schalte LED aus',
        nextDial: 'schalte die LED im Ring ein, die auf LED [L] folgt',
        ledsCircle: 'LED im Ring [A] [B] [C] [D] [E] [F] [G] [H]',
        ledsProxH: 'LED Abstandssensoren [A] [B] [C] [D] [E] [F] [G] [H]',
        ledsProxV: 'LED Bodensensoren [A] [B]',
        ledsButtons: 'LED Tasten [A] [B] [C] [D]',
        ledsTemperature: 'LED Temperatur R: [A] B: [B]',
        ledsRc: 'LED Fernbedienung [A]',
        ledsSound: 'LED Mikrofon [A]',
        soundSystem: 'Geräusch [S] abspielen',
        soundFreq: 'Ton mit Frequenz [N]Hz während [S]s abspielen',
        soundPlaySd: 'Geräusch [N] von SD-Karte abspielen',
        soundRecord: 'Geräusch [N] aufnehmen',
        stopSoundRecord: 'Aufnahme stoppen',
        soundReplay: 'Geräusch [N] wiedergeben',
        whenButton: 'wenn die Taste [B] gedrückt wird',
        touching: 'wenn ein Hindernis [S] erkannt wird',
        notouching: 'wenn kein Hindernis [S] erkannt wird',
        touchingThreshold: 'wenn ein Hindernis [S] in Abstand [N] erkannt wird',
        bump: 'wenn ein Stoss erkannt wird',
        soundDetected: 'wenn ein Geräusch erkannt wird',
        valButton: 'Taste [B]',
        proximity: 'Abstandssensor [N]',
        proxHorizontal: 'alle Abstandssensoren anzeigen',
        ground: 'Bodensensor [N]',
        proxGroundDelta: 'alle Bodensensoren anzeigen',
        distance: 'Abstand [S]',
        angle: 'Winkel [S]',
        tilt: 'Neigungswinkel [T]',
        micIntensity: 'Lautstärke' ,
        odometer: 'Wegmesser [O]',
        motor: 'Geschwindigkeit Motor [M]'
    },
    menus: {
        leftrightall: {
            left: 'links',
            right: 'rechts',
            all: 'alle'
        },
        leftright: {
            left: 'links',
            right: 'rechts'
        },
        sensors: {
            front: 'vorne',
            back: 'hinten',
            ground: 'unten'
        },
        sensors2: {
            left: 'links',
            front: 'vorne',
            right: 'rechts',
            back: 'hinten',
            ground: 'unten'
        },
        proxsensors: {
            front_far_left: 'links',
            front_left: 'Mitte links',
            front_center: 'Mitte',
            front_right: 'Mitte rechts',
            front_far_right: 'rechts',
            back_left: 'hinten links',
            back_right: 'hinten rechts'
        },
        horizontalSensors: {
            front_far_left: 'links',
            front_left: 'Mitte links',
            front_center: 'Mitte',
            front_right: 'Mitte rechts',
            front_far_right: 'rechts',
            back_left: 'hinten links',
            back_right: 'hinten rechts'
        },
        groundSensors: {
            left: 'links',
            right: 'rechts'
        },
        light: {
            all: 'alle',
            top: 'oben',
            bottom: 'unten',
            bottom_left: 'unten links',
            bottom_right: 'unten rechts'
        },
        angles: {
            front: 'vorne',
            back: 'hinten',
            ground: 'unten'
        },
        odo: {
            direction: 'Richtung',
            x: 'x',
            y: 'y'
        },
        tilts: {
            front_back: 'vorne nach hinten',
            top_bottom: 'oben nach unten',
            left_right: 'links nach rechts'
        },
        buttons: {
            center: 'Mitte',
            front: 'vorne',
            back: 'hinten',
            left: 'links',
            right: 'rechts'
        },
        nearfar: {
            near: 'nahe',
            far: 'weit'
        }
    }
};
