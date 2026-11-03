// Original procedural composition. No samples or melody extracted from the reference.
// Render: node scripts/render-garden-music.mjs /tmp/garden-original.wav
import fs from 'node:fs';
const rate=32000, seconds=240, n=rate*seconds;
const left=new Float32Array(n),right=new Float32Array(n);
let seed=4217;
const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const hz=m=>440*2**((m-69)/12);
function note(start,midi,duration,level,pan,kind){
 const count=Math.ceil(duration*rate), offset=Math.floor(start*rate), f=hz(midi);
 const l=Math.sqrt((1-pan)/2),r=Math.sqrt((1+pan)/2);
 const phaseSeed=random()*6.28;
 for(let i=0;i<count;i++){
  const t=i/rate,u=t/duration,phase=2*Math.PI*f*t;
  let v;
  if(kind==='pad'){
   const env=Math.sin(Math.PI*u)**2;
   v=env*(.65*Math.sin(phase+.06*Math.sin(2*Math.PI*.17*t))+.28*Math.sin(phase*1.0014+phaseSeed)+.16*Math.sin(phase*2)+.035*Math.sin(phase*3));
  }else if(kind==='flute'){
   const env=(1-Math.exp(-t/0.6))*Math.sin(Math.PI*u)**1.6;
   const breath=.07*Math.sin(2*Math.PI*4.7*t)*Math.min(1,t/1.4);
   v=env*(Math.sin(phase+breath)+.19*Math.sin(2*phase+breath)+.04*Math.sin(3*phase))*(.94+.06*Math.sin(t*3.1));
  }else if(kind==='harp'){
   const env=(1-Math.exp(-t/.012))*Math.exp(-t/1.6)*Math.min(1,(duration-t)/.3);
   v=env*(Math.sin(phase)+.32*Math.exp(-t*.8)*Math.sin(phase*2)+.16*Math.exp(-t*1.5)*Math.sin(phase*3)+.07*Math.exp(-t*2)*Math.sin(phase*4));
  }else{
   // Soft felt-piano-like partials: shorter upper harmonics, gentle detuning.
   const env=(1-Math.exp(-t/.009))*Math.exp(-t/3.1)*Math.min(1,(duration-t)/.4);
   v=env*(.78*Math.sin(phase)+.22*Math.sin(phase*1.0008)+.35*Math.exp(-t*.45)*Math.sin(phase*2.001)+.17*Math.exp(-t*.85)*Math.sin(phase*3.004)+.08*Math.exp(-t*1.4)*Math.sin(phase*4.008)+.035*Math.exp(-t*2)*Math.sin(phase*5.012));
  }
  const idx=(offset+i)%n;left[idx]+=v*level*l;right[idx]+=v*level*r;
 }
}
// Five evolving sections: arrival, dialogue, open space, bloom, return.
// D major / B minor add9 voicings; no reference recording is used.
const chords=[
 [50,57,61,64],[47,54,57,62],[43,50,57,59],[45,52,57,62],
 [50,57,64,66],[54,57,61,64],[43,50,59,62],[45,52,59,61],
 [47,54,62,66],[43,50,57,62],[50,57,61,64],[45,52,57,64],
 [43,50,59,66],[50,57,64,69],[47,54,61,66],[45,52,59,64],
 [43,50,57,62],[47,54,57,62],[45,52,57,64],[50,57,62,64]];
const motifs=[
 [[1,74],[4.8,78],[8.2,76],[10,74]],[[.8,71],[3.7,74],[7,78]],
 [[2,74],[4,71],[8,69]],[[1,73],[5,76],[9,74]],
 [[.7,78],[2.5,81],[5.8,78],[8.4,76],[10,74]],[[1.5,73],[4.4,78],[7.7,76]],
 [[.5,74],[3.5,78],[6.5,81],[9.2,78]],[[2,76],[5.4,73],[8.8,69]],
 [[2.5,78],[7.5,74]],[[1.8,71],[8,69]],[[3,74],[8.2,76]],[[2,73],[7,76]],
 [[.6,78],[2.2,81],[5,83],[7.8,81],[10,78]],[[1,81],[3.8,86],[6.7,81],[9.5,78]],
 [[1.2,78],[4.5,76],[6.4,74],[9.4,71]],[[.8,73],[3.4,76],[7.2,81],[10,76]],
 [[2,74],[5.5,71],[9,69]],[[1.5,71],[6,74],[9.5,78]],
 [[2.5,76],[6.2,73]],[[1,74],[7,69]]];
for(let phrase=0;phrase<20;phrase++){
 const at=phrase*12,chord=chords[phrase],section=Math.floor(phrase/4);
 const intensity=[.78,.94,.64,1,.72][section];
 chord.forEach((m,i)=>note(at-2+seconds,m,16,.023*intensity,[-.5,-.18,.2,.5][i],'pad'));
 note(at+.15,chord[0]-12,10,.053*intensity,-.08,'piano');
 motifs[phrase].forEach(([t,m],i)=>note(at+t+(random()-.5)*.12,m,8,.105*intensity*(.88+random()*.22),-.18+(i%3)*.12,'piano'));
 // Arpeggiated responses vary in register, rhythm and density between sections.
 if(section!==2){
  const times=phrase%2?[3,3.65,4.5,9.8,10.55]:[5.1,5.85,6.8];
  times.forEach((t,i)=>note(at+t,chord[(i+1)%4]+12,5,.032*intensity,.35,'harp'));
 }
 if([3,5,7,8,10,12,14,16,18].includes(phrase)){
  const line=motifs[phrase];
  note(at+1.7,line[0][1]-12,4.7,.043*intensity,-.3,'flute');
  note(at+7.3,line[line.length-1][1]-12,5,.037*intensity,-.25,'flute');
 }
}
// Tiny discrete droplets, no continuous rushing-water noise.
for(let start=2;start<seconds;start+=3+random()*5){
 const duration=.12+random()*.1,f=650+random()*650,pan=(random()-.5)*.8;
 for(let i=0;i<duration*rate;i++){
  const t=i/rate,u=t/duration,v=.008*Math.sin(Math.PI*u)**2*Math.exp(-u*3)*Math.sin(2*Math.PI*(f*t+f*.8*t*t));
  const idx=(Math.floor(start*rate)+i)%n;left[idx]+=v*(1-pan);right[idx]+=v*(1+pan);
 }
}
// Circular stereo reflections preserve tails across the loop boundary.
const dryL=left.slice(),dryR=right.slice();
for(const [delay,gain] of [[.137,.17],[.293,.14],[.431,.11],[.677,.085],[1.013,.065],[1.571,.045],[2.113,.025]]){
 const d=Math.floor(delay*rate);
 for(let i=0;i<n;i++){const j=(i+d)%n;left[j]+=dryR[i]*gain;right[j]+=dryL[i]*gain;}
}
let peak=0,sum=0;
for(let i=0;i<n;i++){peak=Math.max(peak,Math.abs(left[i]),Math.abs(right[i]));sum+=left[i]**2+right[i]**2;}
const gain=Math.min(.62/peak,.12/Math.sqrt(sum/(2*n)));
const out=Buffer.alloc(44+n*4);
out.write('RIFF');out.writeUInt32LE(out.length-8,4);out.write('WAVEfmt ',8);out.writeUInt32LE(16,16);out.writeUInt16LE(1,20);out.writeUInt16LE(2,22);out.writeUInt32LE(rate,24);out.writeUInt32LE(rate*4,28);out.writeUInt16LE(4,32);out.writeUInt16LE(16,34);out.write('data',36);out.writeUInt32LE(n*4,40);
for(let i=0;i<n;i++){out.writeInt16LE(Math.round(left[i]*gain*32767),44+i*4);out.writeInt16LE(Math.round(right[i]*gain*32767),46+i*4);}
fs.writeFileSync(process.argv[2]||'/tmp/garden-original.wav',out);
console.log(JSON.stringify({seconds,peak:peak*gain,rms:Math.sqrt(sum/(2*n))*gain,seamLeft:Math.abs(left[0]-left[n-1])*gain,seamRight:Math.abs(right[0]-right[n-1])*gain}));
