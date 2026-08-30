import fs from 'node:fs';
import assert from 'node:assert/strict';

const catalog=fs.readFileSync('assets/catalog.js','utf8');
const guard=fs.readFileSync('assets/pickup-validation.js','utf8');
const checkoutSql=fs.readFileSync('supabase/011_checkout_order_idempotency.sql','utf8');

assert.match(catalog,/loadPickupValidation\(\)/,'public catalog boot must load pickup validation on the ordering page');
assert.match(catalog,/assets\/pickup-validation\.js/,'pickup validation asset must be loaded');
assert.match(catalog,/document\.getElementById\('pickup'\)/,'guard must only load on the public pickup flow');

assert.match(guard,/America\/Sao_Paulo/,'client validation must use the padaria timezone');
assert.match(guard,/dateInput\.min=current\.date/,'date input must reject dates before today');
assert.match(guard,/if\(!date\)dateMessage=['"]Escolha a data de retirada\./,'pickup date must be explicitly required by the guard');
assert.match(guard,/if\(date&&!time\)timeMessage=['"]Escolha o horário de retirada\./,'pickup time must be explicitly required after a date is chosen');
assert.match(guard,/date<current\.date/,'past pickup dates must be blocked client-side');
assert.match(guard,/date===current\.date&&time&&time<=current\.time/,'same-day pickup times at or before the current minute must be blocked client-side');
assert.match(guard,/dateInput\.setCustomValidity\(dateMessage\)/,'date validity must use the computed required/past-date message');
assert.match(guard,/timeInput\.setCustomValidity\(timeMessage\)/,'time validity must use the computed required/past-time message');
assert.match(guard,/stopImmediatePropagation\(\)/,'invalid pickup selection must not reach the existing continue handler');
assert.match(guard,/visibilitychange/,'validation must refresh after the page returns from background');
assert.match(guard,/previousDate&&previousDate<dateInput\.min[\s\S]*?validate\(false\)/,'clearing an expired selection must immediately refresh native validity');
assert.doesNotMatch(guard,/05:00|18:00|01:30|02:30/,'guard must not invent or duplicate business-hour rules');

assert.match(checkoutSql,/America\/Sao_Paulo/,'server-side checkout must retain timezone validation');
assert.match(checkoutSql,/pickup time is in the past/i,'server-side checkout must remain authoritative for past-time rejection');

console.log('Pickup validation audit passed.');
