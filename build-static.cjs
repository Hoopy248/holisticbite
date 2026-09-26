const fs = require('node:fs');
const path = require('node:path');
const root=__dirname;
fs.mkdirSync(path.join(root,'public'),{recursive:true});
for(const file of ['appearance.js','content.css','admin-content.js','site-content.js','index.html','script.js','booking-calendar.js','booking-calendar.css','styles.css','velvet-signal.css','velvet-signal.js','velvet-fix.css','questionnaire.html','body-map.html','admin.html','admin.js','admin.css']) {
  fs.copyFileSync(path.join(root,file),path.join(root,'public',file));
}
fs.cpSync(path.join(root,'assets'),path.join(root,'public','assets'),{recursive:true});
console.log('Static site prepared in public/.');
