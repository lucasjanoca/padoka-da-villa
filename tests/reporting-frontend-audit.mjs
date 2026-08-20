import fs from 'node:fs';

const js=fs.readFileSync(new URL('../assets/reporting-sync.js',import.meta.url),'utf8');
const nav=fs.readFileSync(new URL('../assets/internal-nav.js',import.meta.url),'utf8');
const must=(source,needle,msg)=>{if(!source.includes(needle))throw new Error(msg)};
const mustNot=(source,needle,msg)=>{if(source.includes(needle))throw new Error(msg)};

must(nav,"assets/reporting-sync.js",'Gestão precisa carregar o frontend de relatórios');
must(js,"sb.rpc('padoka_report_summary'",'Frontend deve usar a RPC autoritativa de relatórios');
must(js,"p_from:from,p_to:to",'Frontend deve enviar período explícito à RPC');
must(js,"O período máximo do relatório é de 31 dias.",'Frontend deve validar o limite de 31 dias');
must(js,"has_provisional_data",'Frontend deve sinalizar dados provisórios');
must(js,"Produtos mais vendidos",'Frontend deve exibir o ranking retornado pelo servidor');
must(js,"Relatórios consolidados financeiros são restritos à gerência.",'Frontend deve tratar falta de permissão sem expor erro técnico');
must(js,"table:'padoka_sales'",'Relatório deve atualizar após mudanças de vendas');
must(js,"table:'padoka_orders'",'Relatório deve atualizar após mudanças de pedidos');
mustNot(js,".from('padoka_sales')",'Frontend não deve recalcular vendas lendo tabelas diretamente');
mustNot(js,".from('padoka_sale_items')",'Frontend não deve recalcular ranking diretamente no navegador');
mustNot(js,"localStorage",'Relatório consolidado não deve depender de localStorage');

console.log('reporting-frontend-audit: ok');
