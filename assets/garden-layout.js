(function(root){
  const grids={24:[4,6],36:[6,6],64:[8,8],100:[10,10]};
  function buildSeats(capacity){
    const [cols,rows]=grids[capacity]||grids[24], seats=[],perSide=cols/2,rowPitch=600/(rows-1);
    const frontSafe=Math.min(.38,(227/perSide-12)/280,(rowPitch-(capacity>=64?8:24))/280);
    for(let r=0;r<rows;r++){
      const t=r/(rows-1),y=1140+600*t,pathHalf=90+75*t,outer=420+20*t;
      const inner=pathHalf+24,edge=outer-24,cellWidth=(edge-inner)/perSide;
      const scale=frontSafe*(.78+.22*t);
      for(let k=0;k<perSide;k++)for(const side of [-1,1]){
        seats.push({x:540+side*(inner+cellWidth*(k+.5)),y,scale,gap:cellWidth-10,r,k:side<0?k:perSide+k,rows,pathHalf,outer,rowPitch});
      }
    }return seats;
  }
  function fitLabel(text,maxWidth,measure){
    if(maxWidth<=0)return '';
    if(measure(text)<=maxWidth)return text;
    if(measure('…')>maxWidth)return '';
    const chars=Array.from(text);while(chars.length&&measure(chars.join('')+'…')>maxWidth)chars.pop();
    return chars.join('')+'…';
  }
  const api={buildSeats,fitLabel};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GardenLayout=api;
})(typeof window!=='undefined'?window:globalThis);
