const {test}=require('node:test'),assert=require('node:assert/strict');
const {validate,defaults}=require('../lib/appearance.cjs');
test('Appearance accepts legacy content, validates fonts/colors and rejects unsafe or oversized images',()=>{
 assert.deepEqual(validate(undefined),defaults);
 const a={...defaults,uniform:true,background:'#F0F1F2',font:'georgia',images:{portrait:{src:'data:image/webp;base64,UklGRg==',alt:'Дарья'}}};
 assert.equal(validate(a).background,'#f0f1f2');assert.equal(validate(a).images.portrait.alt,'Дарья');
 for(const src of ['javascript:alert(1)','data:image/svg+xml;base64,PHN2Zz4=','https://example.com/a.jpg','data:image/webp;base64,'+'A'.repeat(160001)])assert.throws(()=>validate({...a,images:{portrait:{src,alt:''}}}));
 assert.throws(()=>validate({...a,font:'url(evil)'}));assert.throws(()=>validate({...a,background:'#fff;display:none'}));
 const content=require('../lib/content-store.cjs');assert.deepEqual(content.validate(structuredClone(content.defaults)).appearance,defaults);
});
