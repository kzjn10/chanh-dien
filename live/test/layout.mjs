import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {buildSeats,fitLabel}=createRequire(import.meta.url)('../../assets/garden-layout.js');
const EPS=1e-8;
for(const capacity of [24,36,64,100]){
  test(`${capacity} seats stay in banks, leave aisle clear and respect row depth`,()=>{
    const seats=buildSeats(capacity);
    assert.equal(seats.length,capacity);
    assert.equal(new Set(seats.map(s=>`${s.x},${s.y}`)).size,capacity);
    for(let i=0;i<seats.length;i++){
      const s=seats[i],half=140*s.scale,d=Math.abs(s.x-540);
      for(const key of ['x','y','scale','gap','r','k','rows','pathHalf','outer','rowPitch'])assert.ok(Number.isFinite(s[key]),key);
      assert.ok(s.scale>0&&s.gap>0);
      assert.ok(s.y>=1140-EPS&&s.y<=1740+EPS);
      assert.ok(d-half>=s.pathHalf+24-EPS,'body overlaps aisle margin');
      assert.ok(d+half<=s.outer-24+EPS,'body overlaps outer bank margin');
      assert.ok(280*s.scale+(capacity>=64?8:24)<=s.rowPitch+EPS,'row stack does not fit');
      if(i){assert.ok(s.y>=seats[i-1].y,'not back-to-front');if(s.r>seats[i-1].r)assert.ok(s.scale>=seats[i-1].scale-EPS,'nearer row became smaller');}
    }
    for(let i=0;i<seats.length;i+=2){assert.ok(seats[i].x<540);assert.ok(seats[i+1].x>540);assert.equal(seats[i].y,seats[i+1].y);assert.ok(Math.abs(seats[i].x+seats[i+1].x-1080)<EPS);}
    for(let r=0;r<seats[0].rows;r++){
      const row=seats.filter(s=>s.r===r).sort((a,b)=>a.x-b.x);
      for(let i=1;i<row.length;i++){const a=row[i-1],b=row[i];assert.ok(a.x+a.gap/2<=b.x-b.gap/2+EPS,'label budgets intersect');assert.ok(a.x+140*a.scale<=b.x-140*b.scale+EPS,'body footprints intersect');}
    }
  });
}
const measure=s=>Array.from(s).reduce((sum,c)=>sum+(c==='…'?11:c.codePointAt(0)>0xffff?20:c==='W'?15:9),0);
test('label fitting measures ellipsis inclusively and preserves complete Unicode code points',()=>{
  for(const text of ['','WWWWWWWWWWWWWWWWWW','Nguyễn Thị Bình An','🌿🌸🧘🌿🌸🧘','安然自在的花园','a']){
    for(const width of [0,1,8,10,11,15,20,35,60,100,300]){
      const actual=fitLabel(text,width,measure);assert.ok(measure(actual)<=width,`${JSON.stringify(actual)} exceeds ${width}`);
      assert.ok(!/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(actual),'split surrogate pair');
      if(measure(text)<=width)assert.equal(actual,text);
    }
  }
  assert.equal(fitLabel('WW',11,measure),'…');
  assert.equal(fitLabel('WW',10,measure),'');
});
test('unsupported capacities safely fall back to 24 unique seats',()=>{assert.equal(buildSeats(0).length,24);assert.equal(buildSeats(undefined).length,24);});
