import fs from 'node:fs';

const source = fs.readFileSync('assets/catalog.js', 'utf8');
const fail = message => { throw new Error(message); };
const expect = (condition, message) => { if (!condition) fail(message); };

const ids = ['expresso', 'cappuccino', 'suco', 'agua'];
const entries = new Map();

for (const id of ids) {
  const pattern = new RegExp(`\\{id:'${id}',[\\s\\S]*?img:'([^']+)'[\\s\\S]*?\\}`, 'i');
  const match = source.match(pattern);
  expect(match, `Catálogo deve manter metadados visuais próprios para ${id}.`);
  entries.set(id, match[1]);
}

const urls = [...entries.values()];
expect(new Set(urls).size === ids.length, 'Expresso, cappuccino, suco e água devem usar quatro imagens distintas.');
expect(!urls.some(url => url === 'assets/logo-padoka.svg'), 'Bebidas conhecidas não devem cair no placeholder da logo PADOKA.');

expect(/id:'expresso'[\s\S]*?desc:'[^']*(?:Café|café)[^']*'/i.test(source), 'Expresso deve continuar descrito como café.');
expect(/id:'cappuccino'[\s\S]*?desc:'[^']*(?:Cappuccino|cappuccino)[^']*'/i.test(source), 'Cappuccino deve manter descrição própria.');
expect(/id:'suco'[\s\S]*?desc:'[^']*(?:Suco|suco)[^']*'/i.test(source), 'Suco deve manter descrição própria.');
expect(/id:'agua'[\s\S]*?desc:'[^']*(?:Água|água)[^']*'/i.test(source), 'Água deve manter descrição própria.');

expect(source.includes("const PADOKA_ORIGIN='https://yncspxfsvlqdnodlsosb.supabase.co'"), 'Catálogo deve permanecer fixado ao backend da PADOKA.');
expect(!/service_role|sb_secret_/i.test(source), 'Catálogo público não pode conter credencial privilegiada.');

console.log('beverage-visual-distinctness-audit: ok');
