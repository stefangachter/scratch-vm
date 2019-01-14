module.exports = {
    blocks: {
        setMotor: 'motori [M] [N]',
        stopMotors: 'ferma motori',
        move: 'avanza di [N]',
        moveWithSpeed: 'avanza di [N] con velocità [S]',
        moveWithTime: 'avanza di [N] in [S]s',
        turn: 'rutoa di [N] gradi',
        turnWithSpeed: 'ruota di [N] grandi con velocità [S]',
        turnWithTime: 'ruota di [N] in [S]s',
        arc: 'fai un cerchio di raggio [R] per [A] gradi',
        setOdomoter: 'inizializza isometria [N] [O] [P]',
        leds: 'tutti i LED RVB [L] [R] [G] [B]',
        setLeds: 'colora LED [C] [L]',
        changeLeds: 'cambia colore LED [C] [L]',
        clearLeds: 'spegni LED',
        nextDial: 'on LED quadrante [L]',
        ledsCircle: 'on LED quadrante [A] [B] [C] [D] [E] [F] [G] [H]',
        ledsProxH: 'LED sensori prox. [A] [B] [C] [D] [E] [F] [G] [H]',
        ledsProxV: 'LED sensori terreno [A] [B]',
        ledsButtons: 'LED bottoni [A] [B] [C] [D]',
        ledsTemperature: 'LED bottoni [A] [B]',
        ledsRc: 'LED RC [A]',
        ledsSound: 'LED microfono [A]',
        soundSystem: 'suona suono Thymio [S]',
        soundFreq: 'suona nota [N] per [S]s',
        soundPlaySd: 'suono suono su scheda SD [N]',
        soundRecord: 'registra suono [N]',
        soundReplay: 'riproduci suono [N]',
        whenButton: 'bottone [B]',
        touching: 'oggetto rilevato [S]',
        notouching: 'nessun oggetto rilevato [S]', // TODO: correct?
        touchingThreshold: 'oggetto rilevato [S] [N]',
        bump: 'urto',
        soundDetected: 'rumore captato',
        valButton: 'bottone [B]',
        proximity: 'sensore prox. [N]',
        proxHorizontal: 'sensori di prox.',
        ground: 'sensore terreno [N]',
        proxGroundDelta: 'sensori di prox.',
        distance: 'distanza [S]',
        angle: 'angolo [S]',
        tilt: 'inclinazione [T]',
        micIntensity: 'livello sonoro',
        odometer: 'isometria [O]',
        motor: 'misura motori [M]'
    },
    menus: {
        leftrightall: {
            left: 'sinistro',
            right: 'destro',
            all: 'tutti'
        },
        leftright: {
            left: 'sinistro',
            right: 'destro'
        },
        sensors: {
            front: 'devanti',
            back: 'dietro',
            ground: 'terreno'
        },
        sensors2: {
            left: 'sinistro',
            front: 'devanti',
            right: 'destro',
            back: 'dietro',
            ground: 'terreno'
        },
        proxsensors: {
            front_far_left: 'tutto a sinistra',
            front_left: 'a sinistra',
            front_center: 'centrale',
            front_right: 'a destra',
            front_far_right: 'tutto a destra',
            back_left: 'posteriore sinistro',
            back_right: 'posteriore destro'
        },
        light: {
            all: 'tutti',
            top: 'superiori',
            bottom: 'inferiori',
            bottom_left: 'inferiori a sinistra',
            bottom_right: 'inferiori a destra'
        },
        angles: {
            front: 'devanti',
            back: 'dietro',
            ground: 'terreno'
        },
        odo: {
            direction: 'direzione',
            x: 'x',
            y: 'y'
        },
        tilts: {
            front_back: 'devanti-dietro',
            top_bottom: 'sopra-sotto',
            left_right: 'sinistro-destro'
        },
        buttons: {
            center: 'centrale',
            front: 'devanti',
            back: 'dietro',
            left: 'sinistro',
            right: 'destra'
        },
        nearfar: {
            near: 'vicina', // TODO: correct?
            far: 'lontana' // TODO: correct?
        }
    }
};
