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
assert.match(guard,/date<current\.date/,'past pickup dates must be blocked client-side');
assert.match(guard,/date===current\.date&&time&&time<current\.time/,'same-day past pickup times must be blocked client-side after a time is selected');
assert.match(guard,/setCustomValidity/,'invalid pickup selections must use native input validity');
assert.match(guard,/stopImmediatePropagation\(\)/,'invalid pickup selection must not reach the existing continue handler');
assert.match(guard,/visibilitychange/,'validation must refresh after the page returns from background');
assert.doesNotMatch(guard,/05:00|18:00|01:30|02:30/,'guard must not invent or duplicate business-hour rules');

assert.match(checkoutSql,/America\/Sao_Paulo/,'server-side checkout must retain timezone validation');
assert.match(checkoutSql,/pickup time is in the past/i,'server-side checkout must remain authoritative for past-time rejection');

console.log('Pickup validation audit passed.');
