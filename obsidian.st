//https://github.com/alienmind/algorave
// Learning the basics - example from https://www.youtube.com/shorts/5OYiOGxHxTQ

samples('github:algorave-dave/samples')
samples('github:tidalcycles/dirt-samples')
//samples('bubo:waveforms')

const gain = [
  "2",
  "{0.75 2.5}*4",
  "{0.75 2.5!9 0.75 2.5!5 0.75 2.5 0.75 2.5!7 0.75 2.5!3 <2.5 0.75> 2.5}%16",
]

const drop = 1
// off/on


const chords = [
  "Em",
  "Gbm",
  "Bm",
  "Em",
  "Bm",
  "Gbm",
  "Em",
  "Bm",
  "Bm"
]

chord_prog: chord(pick(chords,"<0 1 2 3 4 5 6 7>")).sound("supersaw").voicing()
  .sound("supersaw")
  .lpf(300)
  .sustain(1).release(5).attack(0)
  .room(0.6)
  .lpenv(slider(4.1,1.25,6))
  .postgain(0.5)
  
main_arp: n("0 1 2 3 4 5 6").chord(pick(chords, "<0 1 2 3 4 5 6 7>")).voicing()//.rev()
  .sound("supersaw")
  .lpf(300)
  .sustain(0.5).release(0.01).attack(0)
  .room(0.6)
  .lpenv(slider(1.25,1.25,6))
  .postgain(pick(gain, drop))
  //._punchcard({height:200, width:1670})


const Structures = [
  "~",
  "x*4",
  "{x ~!9 x ~!5 x ~x ~!8 x ~!3 < ~ x > ~}%16"
]


drums: stack(
  s("sh*4").bank("tr909"),
  s("[bd bd]*2").bank("tr909").dec(.4).postgain(0.5*drop),  
  s("~ sd ~ sd").bank("tr909").postgain(drop),
  //s("tech").postgain(6).pcurve(2).pdec(1).struct(pick(Structures, drop)).postgain(pick(gain, drop)),
  //s("{ ~ ~ rim ~ cp ~ rim cp ~!2 rim ~ cp ~ < rim ~ >!2}%8").bank("[KorgDDM110, dmx]").speed(1.2).fast(2).postgain(0.5),
  //s("sh").struct("[x!3 ~!2 x!10 ~]").postgain(0.5).lpf(7000).bank("RolandTR808").speed(0.8).jux(rev).room(sine)
  //s("psr:[2|5|6|78|9|12|24|25]").fast(16).almostNever(ply("0")).hpf(1000).postgain(pick(gain, drop)).speed(1.2)
)
