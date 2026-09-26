const {test}=require('node:test'),assert=require('node:assert/strict');
const S=require('../design-settings.js'),{validate}=require('../lib/block-design.cjs');
test('Block styles validate inheritance, gradients, images and independent desktop/mobile typography',()=>{
 assert.equal(validate(undefined),undefined);
 const d=S.defaults();d.global.mode='gradient';d.global.angle=45;d.blocks.method={...S.style(),mode:'color',color1:'#edf1ef',font:'georgia',headingSize:64,mobileHeadingSize:34,textSize:18};d.blocks.method1={...S.style(),mode:'image',image:'data:image/webp;base64,UklGRg==',headingSize:28};
 assert.deepEqual(validate(d),d);
 for(const [key,value] of [['headingSize',999],['textSize',0],['mobileHeadingSize',90],['angle',Infinity],['font','url(x)'],['color1','red;display:none'],['mode','evil']])assert.throws(()=>validate({...d,global:{...d.global,[key]:value}}));
 assert.throws(()=>validate({...d,blocks:{unknown:S.style()}}));
 assert.throws(()=>validate({...d,global:{...S.style(),mode:'image'}}));
 assert.throws(()=>validate({...d,global:{...S.style(),mode:'image',image:'data:image/svg+xml;base64,AAAA'}}));
 const appearance=require('../lib/appearance.cjs');assert.deepEqual(appearance.validate({...appearance.defaults,design:d}).design,d);
});
