'use strict';
const $ = s => document.querySelector(s);
const names = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
let state, selected, month, busy = false;
const dateString = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const parse = d => new Date(d + 'T12:00:00');
const times = v => v.trim() ? v.split(',').map(s => s.trim()) : [];
function status(message='', error=false){$('#status').textContent=message;$('#status').classList.toggle('error',error);}
async function api(data){const r=await fetch('/api/calendar'+(data?'':'?admin=1'),data?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}:{});const result=await r.json();if(!r.ok)throw Object.assign(new Error(result.error||'Не удалось загрузить расписание.'),{status:r.status});return result;}
function loginView(){ $('#login').hidden=false;$('#workspace').hidden=true;$('#logout').hidden=true;state=null; window.dispatchEvent(new Event('admin:logout')); }
async function load(){state=await api();$('#login').hidden=true;$('#workspace').hidden=false;$('#logout').hidden=false;$('#demo').hidden=!state.demo;$('#zone').textContent=`Время консультаций: ${state.timezone} · ${state.duration} минут`;selected ||= new Intl.DateTimeFormat('en-CA',{timeZone:state.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());month ||= parse(selected);render();}
async function run(fn){if(busy)return;busy=true;document.querySelectorAll('button').forEach(b=>b.disabled=true);status();try{await fn();}catch(e){status(e.message,true);if(e.status===401)loginView();}finally{busy=false;document.querySelectorAll('button').forEach(b=>b.disabled=false);}}
async function save(data){await api({...data,version:state.version});await load();status('Сохранено. Новое расписание уже доступно клиентам.');}
function bookingElement(b, compact=false){const row=document.createElement('article');row.className='booking';const body=document.createElement('div');const title=document.createElement('strong');title.textContent=`${b.slot} · ${b.clientName}`;body.append(title);const details=document.createElement('p');details.textContent=`${compact?'':b.date+' · '}${b.service}\n${b.duration} мин · ${b.timezone||state.timezone}`;body.append(details);if(!compact){const contact=document.createElement('p');contact.textContent=`${b.phone}\n${b.email}`;body.append(contact);if(b.message){const message=document.createElement('p');message.textContent=b.message;body.append(message);}}row.append(body);if(b.status==='cancelled'){const label=document.createElement('small');label.textContent='Отменена';body.append(label);}else if(!compact){const cancel=document.createElement('button');cancel.textContent='Отменить запись';cancel.onclick=()=>{if(confirm(`Вы согласовали отмену с ${b.clientName}? Время ${b.date} ${b.slot} снова станет доступным.`))run(()=>save({action:'cancel',id:b.id}));};row.append(cancel);}return row;}
function render(){
 $('#month').textContent=month.toLocaleDateString('ru',{month:'long',year:'numeric'});$('#days').replaceChildren();
 const start=new Date(month.getFullYear(),month.getMonth(),1), count=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
 for(let i=0;i<(start.getDay()+6)%7;i++)$('#days').append(document.createElement('span'));
 for(let n=1;n<=count;n++){const d=new Date(month.getFullYear(),month.getMonth(),n), date=dateString(d), ts=state.exceptions[date]??[], booked=state.bookings.filter(b=>b.date===date&&b.status!=='cancelled').length;const button=document.createElement('button');button.className='day'+(date===selected?' selected':'')+(!ts.length?' closed':'');button.setAttribute('aria-pressed',String(date===selected));button.setAttribute('aria-label',`${d.toLocaleDateString('ru',{day:'numeric',month:'long'})}, ${booked} записей, ${ts.length?'расписание открыто':'выходной'}`);button.append(String(n));const small=document.createElement('small');small.textContent=booked?`${booked} зап.`:ts.length?`${ts.length} врем.`:'Выходной';button.append(small);button.onclick=()=>{selected=date;renderDay();render();};$('#days').append(button);}
 renderDay();const form=$('#weeklyForm');form.elements.duration.value=state.duration;form.elements.timezone.value=state.timezone;
 renderBookings();
}
function renderDay(){ $('#selectedDay').textContent=parse(selected).toLocaleDateString('ru',{day:'numeric',month:'long',weekday:'long'});$('#dayForm').elements.times.value=(state.exceptions[selected]??[]).join(', ');$('#dayBookings').replaceChildren();const bookings=state.bookings.filter(b=>b.date===selected&&b.status!=='cancelled').sort((a,b)=>a.slot.localeCompare(b.slot));if(bookings.length){for(const b of bookings)$('#dayBookings').append(bookingElement(b,true));}else{const p=document.createElement('p');p.className='muted';p.textContent='На этот день пока никто не записан.';$('#dayBookings').append(p);}}
function renderBookings(){const today=new Intl.DateTimeFormat('en-CA',{timeZone:state.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());const list=state.bookings.filter(b=>$('#bookingFilter').value==='all'||(b.date>=today&&b.status!=='cancelled')).sort((a,b)=>(a.date+a.slot).localeCompare(b.date+b.slot));$('#bookingList').replaceChildren();if(!list.length){const p=document.createElement('p');p.textContent='Записей пока нет. Откройте часы в календаре — клиенты смогут выбрать их на сайте.';$('#bookingList').append(p);}else list.forEach(b=>$('#bookingList').append(bookingElement(b)));}
$('#loginForm').onsubmit=e=>{e.preventDefault();run(async()=>{await api({action:'login',password:e.target.elements.password.value});e.target.reset();await load();});};
$('#logout').onclick=()=>run(async()=>{await api({action:'logout'});loginView();});
$('#refresh').onclick=()=>run(load);
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-tab]').forEach(t=>{t.setAttribute('aria-pressed',String(t===b));$('#'+t.dataset.tab).hidden=t!==b;});});
$('#prev').onclick=()=>{month=new Date(month.getFullYear(),month.getMonth()-1,1);render();};$('#next').onclick=()=>{month=new Date(month.getFullYear(),month.getMonth()+1,1);render();};
$('#dayForm').onsubmit=e=>{e.preventDefault();run(()=>save({action:'exception',from:selected,to:selected,times:times(e.target.elements.times.value)}));};
$('#closeDay').onclick=()=>run(()=>save({action:'exception',from:selected,to:selected,times:[]}));
$('#vacationForm').onsubmit=e=>{e.preventDefault();const f=e.target;run(()=>save({action:'exception',from:f.elements.from.value,to:f.elements.to.value,times:[]}));};
$('#weeklyForm').onsubmit=e=>{e.preventDefault();const f=e.target;run(()=>save({action:'settings',duration:Number(f.elements.duration.value),timezone:f.elements.timezone.value}));};
$('#bookingFilter').onchange=renderBookings;
// Native time picker lets Dasha add a time without typing a comma-separated list.
const addTimeRow=document.createElement('div');addTimeRow.className='inline';
const addTimeLabel=document.createElement('label');addTimeLabel.textContent='Ещё одно время';
const addTimeInput=document.createElement('input');addTimeInput.type='time';addTimeInput.step='900';addTimeLabel.append(addTimeInput);
const addTimeButton=document.createElement('button');addTimeButton.type='button';addTimeButton.textContent='Добавить время';addTimeButton.style.alignSelf='end';
addTimeButton.onclick=()=>{if(!addTimeInput.value){addTimeInput.focus();return;}const field=$('#dayForm').elements.times;field.value=[...new Set([...times(field.value),addTimeInput.value])].sort().join(', ');addTimeInput.value='';status('Время добавлено. Нажмите «Открыть запись», чтобы открыть его клиентам.');};
addTimeRow.append(addTimeLabel,addTimeButton);$('#dayForm').children[0].after(addTimeRow);
run(load);
