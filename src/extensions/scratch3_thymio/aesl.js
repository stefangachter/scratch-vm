const xmlstring = '<!DOCTYPE aesl-source> \
<network> \
<!--list of global events--> \
<event size="4" name="Q_add_motion"/> \
<event size="1" name="Q_cancel_motion"/> \
<event size="5" name="Q_motion_added"/> \
<event size="5" name="Q_motion_cancelled"/> \
<event size="5" name="Q_motion_started"/> \
<event size="5" name="Q_motion_ended"/> \
<event size="1" name="Q_motion_noneleft"/> \
<event size="3" name="Q_set_odometer"/> \
<event size="8" name="V_leds_prox_h"/> \
<event size="8" name="V_leds_circle"/> \
<event size="3" name="V_leds_top"/> \
<event size="4" name="V_leds_bottom"/> \
<event size="2" name="V_leds_prox_v"/> \
<event size="4" name="V_leds_buttons"/> \
<event size="1" name="V_leds_rc"/> \
<event size="2" name="V_leds_temperature"/> \
<event size="1" name="V_leds_sound"/> \
<event size="2" name="A_sound_freq"/> \
<event size="1" name="A_sound_play"/> \
<event size="1" name="A_sound_system"/> \
<event size="1" name="A_sound_replay"/> \
<event size="1" name="A_sound_record"/> \
<event size="1" name="M_motor_left"/> \
<event size="1" name="M_motor_right"/> \
<event size="27" name="R_state_update"/> \
<event size="0" name="Q_reset"/> \
<!--list of constants--> \
<constant value="4" name="QUEUE"/> \
<!--show keywords state--> \
<keywords flag="true"/> \
<!--node thymio-II--> \
<node nodeId="1" name="thymio-II"> \
var tmp[9] \
var Qid[QUEUE]   = [ 0,0,0,0 ] \
var Qtime[QUEUE] = [ 0,0,0,0 ] \
var QspL[QUEUE]  = [ 0,0,0,0 ] \
var QspR[QUEUE]  = [ 0,0,0,0 ] \
var Qpc = 0  \
var Qnx = 0  \
var distance.front = 190  \
var distance.back  = 125 \
var angle.front    = 0  \
var angle.back     = 0 \
var angle.ground   = 0 \
var odo.delta  \
var odo.theta = 0  \
var odo.x = 0  \
var odo.y = 0  \
var odo.degree  \
var R_state.do = 1  \
var R_state[27]  \
mic.threshold = 12 \
onevent motor  \
odo.delta = (motor.right.target + motor.left.target) / 2 \
call math.muldiv(tmp[0], (motor.right.target - motor.left.target), 3406, 10000) \
odo.theta += tmp[0] \
call math.cos(tmp[0:1],[odo.theta,16384-odo.theta]) \
call math.muldiv(tmp[0:1], [odo.delta,odo.delta],tmp[0:1], [32767,32767]) \
odo.x += tmp[0]/45 \
odo.y += tmp[1]/45 \
odo.degree = 90 - (odo.theta / 182) \
if Qtime[Qpc] > 0 then \
	emit Q_motion_started([Qid[Qpc], Qtime[Qpc], QspL[Qpc], QspR[Qpc], Qpc]) \
	Qtime[Qpc] = 0 - Qtime[Qpc] \
end \
if Qtime[Qpc] &lt; 0 then \
	motor.left.target = QspL[Qpc] \
	motor.right.target = QspR[Qpc] \
	Qtime[Qpc] += 1 \
	if Qtime[Qpc] == 0 then \
		emit Q_motion_ended([Qid[Qpc], Qtime[Qpc], QspL[Qpc], QspR[Qpc], Qpc]) \
		Qid[Qpc] = 0 \
		Qpc = (Qpc+1)%QUEUE \
		if Qtime[Qpc] == 0 and Qpc == Qnx then \
			emit Q_motion_noneleft([Qpc]) \
			motor.left.target = 0 \
			motor.right.target = 0 \
		end \
	end \
end \
if Qtime[Qpc] == 0 and Qpc != Qnx then \
	Qpc = (Qpc+1)%QUEUE \
end \
call math.fill(tmp,0) \
tmp[Qnx]=1 \
tmp[Qpc]=4 \
call leds.buttons(tmp[0],tmp[1],tmp[2],tmp[3]) \
sub motion_add \
if (Qnx != Qpc or (Qnx == Qpc and Qtime[Qpc] == 0)) and Qid[0]!=tmp[0] and Qid[1]!=tmp[0] and Qid[2]!=tmp[0] and Qid[3]!=tmp[0] then \
	Qid[Qnx]   = tmp[0] \
	Qtime[Qnx] = tmp[1] \
	QspL[Qnx]  = tmp[2] \
	QspR[Qnx]  = tmp[3] \
	emit Q_motion_added([Qid[Qnx], Qtime[Qnx], QspL[Qnx], QspR[Qnx], Qnx]) \
	Qnx = (Qnx+1)%QUEUE \
end \
sub motion_cancel \
for tmp[1] in 1:QUEUE do \
	if Qid[tmp[1]-1] == tmp[0] then \
		emit Q_motion_cancelled([Qid[tmp[1]-1], Qtime[tmp[1]-1], QspL[tmp[1]-1], QspR[tmp[1]-1], tmp[1]-1]) \
		Qtime[tmp[1]-1] = -1  \
	end \
end \
 \
onevent Q_add_motion \
tmp[0:3] = event.args[0:3] \
callsub motion_add \
 \
onevent Q_cancel_motion \
tmp[0] = event.args[0] \
callsub motion_cancel \
 \
onevent Q_set_odometer \
odo.theta = (((event.args[0] + 360) % 360) - 90) * 182 \
odo.x = event.args[1] * 28 \
odo.y = event.args[2] * 28 \
 \
onevent Q_reset \
call math.fill(Qid,0) \
call math.fill(Qtime,0) \
call math.fill(QspL,0) \
call math.fill(QspR,0) \
call math.fill(Qpc,0) \
call math.fill(Qnx,0) \
motor.left.target = 0 \
motor.right.target = 0 \
emit Q_motion_noneleft([Qpc]) \
 \
onevent buttons \
call math.dot(distance.front, prox.horizontal,[13,26,39,26,13,0,0],11) \
call math.clamp(distance.front,190-distance.front,0,190) \
call math.max(distance.back, prox.horizontal[5],prox.horizontal[6]) \
call math.muldiv(distance.back, distance.back, 267,10000) \
call math.clamp(distance.back,125-distance.back,0,125) \
call math.dot(angle.front, prox.horizontal,[4,3,0,-3,-4,0,0],9) \
call math.dot(angle.back, prox.horizontal,[0,0,0,0,0,-4,4],9) \
call math.dot(angle.ground, prox.ground.delta,[4,-4],7) \
R_state = [	((((acc[0]/2)+16)%32)&lt;&lt;10) + ((((acc[1]/2)+16)%32)&lt;&lt;5) + (((acc[2]/2)+16)%32), \
			(((mic.intensity/mic.threshold)%8)&lt;&lt;8) + \
				(0&lt;&lt;5) + \
				(button.backward&lt;&lt;4) + \
				(button.center&lt;&lt;3) + \
				(button.forward&lt;&lt;2) + \
				(button.left&lt;&lt;1) + \
				button.right, \
			((angle.ground+90) &lt;&lt; 8) + (angle.back+90), \
			angle.front, \
			(distance.back&lt;&lt;8) + distance.front, \
			motor.left.target, \
			motor.right.target, \
			motor.left.speed, \
			motor.right.speed, \
			odo.degree, \
			odo.x, \
			odo.y, \
			prox.comm.rx, \
			prox.comm.tx, \
			prox.ground.delta[0:1], \
			prox.horizontal[0:6], \
			Qid[0:3] \
		  ] \
 \
onevent prox \
if R_state.do==1 then \
	emit R_state_update(R_state) \
end \
\
onevent V_leds_bottom \
if event.args[0]==0 then \
	call leds.bottom.left(event.args[1],event.args[2],event.args[3]) \
else \
	call leds.bottom.right(event.args[1],event.args[2],event.args[3]) \
end \
 \
onevent V_leds_buttons \
call leds.buttons(event.args[0],event.args[1], \
                  event.args[2],event.args[3]) \
 \
onevent V_leds_circle \
call leds.circle(event.args[0],event.args[1],event.args[2], \
	             event.args[3],event.args[4],event.args[5], \
	             event.args[6],event.args[7]) \
 \
onevent V_leds_prox_h \
call leds.prox.h(event.args[0],event.args[1],event.args[2], \
	             event.args[3],event.args[4],event.args[5], \
	             event.args[6],event.args[7]) \
 \
onevent V_leds_prox_v \
call leds.prox.v(event.args[0],event.args[1]) \
 \
onevent V_leds_rc \
call leds.rc(event.args[0]) \
 \
onevent V_leds_sound \
call leds.sound(event.args[0]) \
 \
onevent V_leds_temperature \
call leds.temperature(event.args[0],event.args[1]) \
 \
onevent V_leds_top \
call leds.top(event.args[0],event.args[1],event.args[2]) \
 \
onevent A_sound_system \
call sound.system(event.args[0]) \
 \
onevent A_sound_freq \
call sound.freq(event.args[0],event.args[1]) \
 \
onevent A_sound_play \
call sound.play(event.args[0]) \
 \
onevent A_sound_record \
call sound.record(event.args[0]) \
 \
onevent A_sound_replay \
call sound.replay(event.args[0]) \
 \
onevent M_motor_left \
motor.left.target = event.args[0] \
 \
onevent M_motor_right \
motor.right.target = event.args[0] \
 \
</node> \
</network>';

module.exports = xmlstring;
