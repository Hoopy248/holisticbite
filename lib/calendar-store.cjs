const crypto = require('node:crypto');
const KEY = 'holisticbite:calendar:v1';
const memory = new Map();
const initial = () => ({ version: 0, timezone: 'Europe/Tallinn', duration: 90, weekly: [[], [], [], [], [], [], []], exceptions: {}, bookings: [] });
async function redis(command) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw Object.assign(new Error('Хранилище расписания ещё не подключено.'), { status: 503 });
  const response = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(command), signal: AbortSignal.timeout(10000) });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error('Не удалось сохранить расписание. Попробуйте ещё раз.');
  return data.result;
}
const demo = () => process.env.CALENDAR_DEMO === '1' && !process.env.VERCEL;
async function read(key = KEY, create = initial) {
  const raw = demo() ? memory.get(key) || null : await redis(['GET', key]);
  return { raw, state: raw ? JSON.parse(raw) : create() };
}
async function mutate(fn, key = KEY, create = initial) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const { raw, state } = await read(key, create);
    const result = fn(state);
    state.version++;
    const next = JSON.stringify(state);
    if (demo()) { if ((memory.get(key) || null) !== raw) continue; memory.set(key, next); return result; }
    const saved = await redis(['EVAL', "local v=redis.call('GET',KEYS[1]); if (v or '')~=ARGV[1] then return 0 end; redis.call('SET',KEYS[1],ARGV[2]); return 1", '1', key, raw || '', next]);
    if (saved === 1) return result;
  }
  throw Object.assign(new Error('Расписание изменилось. Повторите действие.'), { status: 409 });
}
function fail(message, status = 400) { throw Object.assign(new Error(message), { status }); }
function validDate(date) { return typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date; }
const minutes = time => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
function validateTimes(times, duration) {
  if (!Array.isArray(times) || times.length > 24 || times.some(t => typeof t !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(t))) fail('Проверьте время консультаций.');
  const sorted = [...new Set(times)].sort();
  if (sorted.some((t, i) => minutes(t) + duration > 1440 || (i && minutes(t) - minutes(sorted[i - 1]) < duration))) fail('Консультации пересекаются или заканчиваются после полуночи.');
  return sorted;
}
function clock(timezone, now = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now).map(p => [p.type, p.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}
function slots(state, date) {
  const now = clock(state.timezone);
  if (date < now.date || date > new Date(Date.parse(now.date) + 90 * 86400000).toISOString().slice(0, 10)) return [];
  // Dates are closed until Dasha explicitly opens them. Legacy weekly hours are not published.
  const times = state.exceptions[date] ?? [];
  return times.filter(t => (date > now.date || t > now.time) && !state.bookings.some(b => b.date === date && b.status !== 'cancelled' && minutes(t) < minutes(b.slot) + b.duration && minutes(t) + state.duration > minutes(b.slot)));
}
module.exports = { read, mutate, fail, validDate, validateTimes, clock, slots, demo, crypto };
