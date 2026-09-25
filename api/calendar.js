const { read, mutate, fail, validDate, validateTimes, clock, slots, demo, crypto } = require('../lib/calendar-store.cjs');
const sign = value => crypto.createHmac('sha256', process.env.ADMIN_SESSION_SECRET || '').update(value).digest('hex');
function equal(a, b) { const x = crypto.createHash('sha256').update(a).digest(); const y = crypto.createHash('sha256').update(b).digest(); return crypto.timingSafeEqual(x, y); }
function authorized(req) {
  if (!process.env.ADMIN_SESSION_SECRET) return false;
  const cookie = (req.headers.cookie || '').split('; ').find(c => c.startsWith('hb_admin='))?.slice(9) || '';
  const [expiry, signature] = cookie.split('.');
  return Number(expiry) > Date.now() && equal(signature || '', sign(expiry));
}
function cookie(res, value, maxAge) { res.setHeader('Set-Cookie', `hb_admin=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${demo() ? '' : '; Secure'}`); }
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const url = new URL(req.url, 'http://localhost');
    if (req.method === 'GET') {
      const { state } = await read();
      if (url.searchParams.get('admin') === '1') {
        if (!authorized(req)) fail('Войдите, чтобы открыть расписание.', 401);
        const { attempts, ...publicAdmin } = state;
        return res.status(200).json({ ...publicAdmin, demo: demo() });
      }
      const date = url.searchParams.get('date');
      if (!validDate(date)) fail('Выберите дату.');
      return res.status(200).json({ date, slots: slots(state, date), timezone: state.timezone, duration: state.duration, today: clock(state.timezone).date });
    }
    if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); fail('Method not allowed', 405); }
    if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) fail('Запрос отклонён.', 403);
    if (!String(req.headers['content-type'] || '').startsWith('application/json')) fail('Ожидается JSON.', 415);
    const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    if (JSON.stringify(data).length > 30000) fail('Слишком много данных.');
    if (data.action === 'login') {
      if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_SESSION_SECRET) fail('Вход ещё не настроен.', 503);
      // Persistent limit shared by all serverless instances.
      const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0];
      const key = crypto.createHash('sha256').update(ip).digest('hex');
      await mutate(s => {
        s.attempts ||= {};
        for (const k in s.attempts) if (s.attempts[k].until < Date.now()) delete s.attempts[k];
        const a = s.attempts[key] ||= { count: 0, until: Date.now() + 900000 };
        if (a.count >= 10) fail('Слишком много попыток. Попробуйте через 15 минут.', 429);
        a.count++;
      });
      if (!equal(String(data.password || ''), process.env.ADMIN_PASSWORD)) fail('Неверный пароль.', 401);
      const expiry = String(Date.now() + 43200000);
      cookie(res, `${expiry}.${sign(expiry)}`, 43200);
      return res.status(200).json({ ok: true });
    }
    if (data.action === 'logout') { cookie(res, '', 0); return res.status(200).json({ ok: true }); }
    if (data.action === 'book') {
      const clean = (key, max) => String(data[key] || '').trim().slice(0, max);
      const booking = { id: crypto.randomUUID(), requestId: clean('requestId', 80), date: data.date, slot: data.slot, clientName: clean('clientName', 120), email: clean('email', 254), phone: clean('phone', 80), service: clean('service', 200), message: clean('message', 3000), status: 'confirmed', createdAt: new Date().toISOString() };
      booking.contactChannels = Array.isArray(data.contactChannels) ? data.contactChannels.filter(c => ['WhatsApp', 'Telegram'].includes(c)) : [];
      if (!validDate(booking.date) || !booking.requestId || !booking.clientName || !booking.phone || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.email)) fail('Проверьте имя, телефон, почту и дату.');
      const saved = await mutate(s => {
        const prior = s.bookings.find(b => b.requestId === booking.requestId);
        if (prior) return { id: prior.id, duplicate: true };
        const today = clock(s.timezone).date;
        if (booking.date > new Date(Date.parse(today) + 90 * 86400000).toISOString().slice(0, 10) || !slots(s, booking.date).includes(booking.slot)) fail('Это время уже недоступно. Выберите другое.', 409);
        booking.duration = s.duration;
        booking.timezone = s.timezone;
        s.bookings.push(booking);
        return { id: booking.id };
      });
      let emailSent = false;
      if (!saved.duplicate && !demo()) {
        try { await require('./send-email').notifyBooking({ ...booking, date: `${booking.date} (${booking.timezone})` }); emailSent = true; } catch { /* The booking stays confirmed even if the mail provider is unavailable. */ }
      }
      return res.status(200).json({ ok: true, id: saved.id, emailSent });
    }
    if (!authorized(req)) fail('Войдите, чтобы изменить расписание.', 401);
    await mutate(s => {
      if (data.version !== s.version) fail('Расписание изменилось в другом окне. Обновите страницу перед сохранением.', 409);
      if (data.action === 'weekly') {
        const duration = Number(data.duration);
        if (![30, 45, 60, 75, 90, 120].includes(duration)) fail('Выберите длительность.');
        try { new Intl.DateTimeFormat('ru', { timeZone: data.timezone }).format(); } catch { fail('Проверьте часовой пояс.'); }
        if (typeof data.timezone !== 'string' || !data.timezone) fail('Укажите часовой пояс.');
        if (data.timezone !== s.timezone && s.bookings.some(b => b.status !== 'cancelled' && b.date >= clock(s.timezone).date)) fail('Есть будущие записи. Сначала согласуйте их перенос, затем меняйте часовой пояс.');
        if (!Array.isArray(data.weekly) || data.weekly.length !== 7) fail('Проверьте расписание недели.');
        s.weekly = data.weekly.map(t => validateTimes(t, duration));
        for (const date in s.exceptions) s.exceptions[date] = validateTimes(s.exceptions[date], duration);
        s.duration = duration; s.timezone = data.timezone;
      } else if (data.action === 'exception') {
        if (!validDate(data.from) || !validDate(data.to) || data.to < data.from || Date.parse(data.to) - Date.parse(data.from) > 366 * 86400000) fail('Проверьте диапазон дат (до одного года).');
        for (let d = Date.parse(data.from); d <= Date.parse(data.to); d += 86400000) {
          const date = new Date(d).toISOString().slice(0, 10);
          if (data.reset) delete s.exceptions[date]; else s.exceptions[date] = validateTimes(data.times, s.duration);
        }
      } else if (data.action === 'cancel') {
        const b = s.bookings.find(b => b.id === data.id);
        if (!b) fail('Запись не найдена.', 404);
        b.status = 'cancelled';
      } else fail('Неизвестное действие.');
    });
    return res.status(200).json({ ok: true });
  } catch (e) { return res.status(e.status || 500).json({ ok: false, error: e.status ? e.message : 'Не удалось выполнить действие. Попробуйте ещё раз.' }); }
};
