// Tempo 120 bpm
setCps(120/60/4)

// Basic mixer
const BASS_VOL=slider(1,0,1)
const HIHATS_VOL=slider(0.441,0,1)
const PADS_VOL=slider(0.624,0,1)

// Other modifiers
const BASS_ENERGY=slider(5.96,0,8)


// 4 on the floor
$kick: s("[sbd]*4").gain(1)._scope()

// Sidechain kick to orbit 2,3,4
.duck("2:3:4").duckattack(.2).duckdepth(.8)


// Random 303 bassline - not super random really, occasionally +1 octave
$bass: n(irand(2).almostNever(x=>x.add(7)).sub(7).seg(16)).scale("c:phrygian")._pianoroll()
// Make it repeatable
.rib(10,4)
// Heavy distortion
.dist("2:0.3")
// Nice tb303 with adjustable energy
.s("sawtooth").lpf(200).lpenv(BASS_ENERGY).lpq(12).gain(BASS_VOL)
// Make it pump with the duck
.orbit(2)

// Upbeats only
$hihats: s("[~ hh]*4").delay(0.1).gain(HIHATS_VOL)._scope()
// Subpad to keep it interesting, detuned, every 2 bars 
$subpad: s("supersaw").detune(1).rel(5).beat(2,32).slow(2).orbit(2)
.fm(slider(1.495,0,5)).fmh(slider(2.04,0,5)).gain(PADS_VOL)


$riser: s("pulse").orbit(4).seg(16).dec(.1).fm(time).fmh(time)
