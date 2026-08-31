import fs from 'node:fs';

const migration=fs.readFileSync('supabase/075_security_definer_search_path_hardening.sql','utf8');
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};
const need=(r,m)=>{if(!r.test(migration))fail(m)};

need(/alter function padoka_private\.padoka_list_product_barcodes\(\)[\s\S]*set search_path\s*=\s*''/i,'barcode private implementation must use an empty search_path');
need(/alter function padoka_private\.padoka_save_profile\(text, text, date, boolean, boolean\)[\s\S]*set search_path\s*=\s*''/i,'profile private implementation must use an empty search_path');
need(/alter function padoka_private\.padoka_update_order_status\(uuid, text\)[\s\S]*set search_path\s*=\s*''/i,'order-status private implementation must use an empty search_path');

if(!process.exitCode)console.log('SECURITY DEFINER search_path audit: OK');
