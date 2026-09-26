(() => {
  'use strict';
  const root = document.querySelector('#bookingDatePicker');
  const input = document.querySelector('#date');
  if (!root || !input) return;
  let data = null, month = '', request = 0;
  const heading = document.createElement('div'); heading.className = 'date-picker-heading';
  const prev = document.createElement('button'); prev.type = 'button'; prev.textContent = '←'; prev.setAttribute('aria-label', 'Предыдущий месяц');
  const title = document.createElement('strong'); title.setAttribute('aria-live', 'polite');
  const next = document.createElement('button'); next.type = 'button'; next.textContent = '→'; next.setAttribute('aria-label', 'Следующий месяц');
  heading.append(prev, title, next);
  const weekdays = document.createElement('div'); weekdays.className = 'date-picker-weekdays'; weekdays.setAttribute('aria-hidden', 'true');
  for (const day of ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']) { const span = document.createElement('span'); span.textContent = day; weekdays.append(span); }
  const grid = document.createElement('div'); grid.className = 'date-picker-days'; grid.setAttribute('role','group'); grid.setAttribute('aria-label','Даты консультаций');
  const note = document.createElement('p'); note.className = 'date-picker-note'; note.setAttribute('role','status');
  const selected = document.createElement('p'); selected.className = 'date-picker-selected'; selected.setAttribute('aria-live','polite');
  root.replaceChildren(heading, weekdays, grid, note, selected);
  const dayValue = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  function choose(value) { input.value = value; input.dispatchEvent(new Event('change', {bubbles:true})); input.dispatchEvent(new Event('input', {bubbles:true})); render(); }
  function render() {
    if (!data) return;
    const first = new Date(month + '-01T12:00:00');
    title.textContent = first.toLocaleDateString('ru', {month:'long', year:'numeric'});
    prev.disabled = month <= data.today.slice(0,7); next.disabled = month >= data.lastDate.slice(0,7);
    grid.replaceChildren();
    for(let i=0;i<(first.getDay()+6)%7;i++) grid.append(document.createElement('span'));
    const count = new Date(first.getFullYear(),first.getMonth()+1,0).getDate();
    for(let day=1;day<=count;day++) {
      const date = dayValue(new Date(first.getFullYear(),first.getMonth(),day));
      const button = document.createElement('button'); button.type='button'; button.textContent=String(day);
      button.disabled = !data.dates[date]; button.setAttribute('aria-pressed',String(input.value===date));
      button.setAttribute('aria-label', `${new Date(date+'T12:00:00').toLocaleDateString('ru',{day:'numeric',month:'long'})}: ${button.disabled?'запись закрыта':'есть свободное время'}`);
      if (date===data.today) button.setAttribute('aria-current','date');
      button.onclick=()=>choose(date); grid.append(button);
    }
    const any = Object.keys(data.dates).length;
    const inMonth = Object.keys(data.dates).some(d=>d.startsWith(month));
    note.textContent = !any ? 'Пока нет открытых дат. Дарья добавит время для записи — загляните позже.' : !inMonth ? 'В этом месяце свободных дат нет. Посмотрите другой месяц.' : 'Выберите выделенную дату. Остальные дни закрыты для записи.';
    selected.textContent = input.value ? 'Выбрано: '+new Date(input.value+'T12:00:00').toLocaleDateString('ru',{day:'numeric',month:'long'})+' · '+data.timezone : 'Время консультаций: '+data.timezone;
  }
  for(const [button,delta] of [[prev,-1],[next,1]]) button.onclick=()=>{const d=new Date(month+'-01T12:00:00');d.setMonth(d.getMonth()+delta);month=dayValue(d).slice(0,7);render();};
  async function refresh({reset=false}={}) {
    const serial=++request;
    if(reset) input.value='';
    root.setAttribute('aria-busy','true'); note.textContent='Проверяем свободные даты…';
    root.querySelectorAll('button').forEach(b=>b.disabled=true);
    document.querySelector('#bookingForm [type="submit"]').disabled=true;
    document.querySelector('#slotGrid').replaceChildren();
    // Invalidate any slot response that started before this refresh.
    input.dispatchEvent(new Event('change', {bubbles:true}));
    try {
      const response=await fetch('/api/calendar?availability=1',{cache:'no-store'});
      const result=await response.json();
      if(serial!==request)return;
      if(!response.ok)throw new Error(result.error||'Не удалось загрузить календарь.');
      data=result;
      if(!month||reset) month=(Object.keys(data.dates).sort()[0]||data.today).slice(0,7);
      if(input.value&&!data.dates[input.value])input.value='';
      render();
      root.setAttribute('aria-busy','false');
      input.dispatchEvent(new Event('change',{bubbles:true}));
    } catch(error) {
      if(serial!==request)return;
      input.value=''; data=null; grid.replaceChildren();
      document.querySelector('#slotGrid').textContent='Выбор времени появится после загрузки календаря.';
      note.textContent=error.message+' ';
      const retry=document.createElement('button');retry.type='button';retry.textContent='Повторить';retry.onclick=()=>refresh();note.append(retry);
    } finally { if(serial===request)root.setAttribute('aria-busy','false'); }
  }
  window.hbCalendar={refresh, isLoading:()=>root.getAttribute('aria-busy')==='true'};
  window.addEventListener('focus',()=>refresh());
})();
