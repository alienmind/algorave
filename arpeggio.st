// Learning the basics - example from https://www.youtube.com/shorts/5OYiOGxHxTQ

samples('github:algorave-dave/samples')
samples('github:tidalcycles/dirt-samples')

const gain = [
  "2",
  "{0.75 2.5}*4",
  "{0.75 2.5!9 0.75 2.5!5 0.75 2.5 0.75 2.5!7 0.75 2.5!3 <2.5 0.75> 2.5}%16",
]

const Structures = [
  "~",
  "x*4",
  "{x ~!9 x ~!5 x ~x ~!8 x ~!3 < ~ x > ~}%16"
]

const drop = 0
// off/on


bassline: note("[eb1, eb2]!16 [f2, f1]!16 [g2, g1]!16 [f2, f1]!8 [bb2, bb1]!8")
  .sound("supersaw")
  .slow(8)
  .postgain(2)
  .room(0.6)
  .lpf(slider(2000,300,2000))
  .room(0.4)
  .postgain(pick(gain, drop))
  ._punchcard({height:200, width:1670})


const arpeggiator = [
  "{d4 bb3 eb3 d3 bb2 eb2}%16",
  "{c4 bb3 f3 c4 bb2 f2}%16",
  "{d4 bb3 g3 d3 bb2 g2}%16",
  "{c4 bb3 f3 c3 bb2 f2}%16"
]

main_arp: note(pick(arpeggiator, "<0 1 2 3>".slow(2)))//.rev()
  .sound("supersaw")
  .lpf(300)
  .sustain(0.5).release(0.01).attack(0)
  .room(0.6)
  .lpenv(slider(5.1925,1.25,6))
  .postgain(pick(gain, drop))
  ._punchcard({height:200, width:1670})

drums: stack(
  s("bd bd bd bd"),
  s("~ sd ~ sd")
  //s("tech").postgain(6).pcurve(2).pdec(1).struct(pick(Structures, drop)).postgain(pick(gain, drop)),
  //s("{ ~ ~ rim ~ cp ~ rim cp ~!2 rim ~ cp ~ < rim ~ >!2}%8").bank("[KorgDDM110, dmx]").speed(1.2).fast(2).postgain(0.5),
  //s("sh").struct("[x!3 ~!2 x!10 ~]").postgain(0.5).lpf(7000).bank("RolandTR808").speed(0.8).jux(rev).room(sine)
  //s("psr:[2|5|6|78|9|12|24|25]").fast(16).almostNever(ply("0")).hpf(1000).postgain(pick(gain, drop)).speed(1.2)
)

