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
must(js,"new Set(['owner','manager'])",'Relatórios financeiros devem continuar restritos a owner/manager');
must(js,"const REPORT_TZ='America/Sao_Paulo'",'Relatório deve fixar o dia operacional no fuso da padaria');
must(js,"timeZone:REPORT_TZ",'Cálculo de hoje deve usar explicitamente America/Sao_Paulo');
must(js,"formatToParts(new Date())",'Data operacional deve ser montada sem depender do timezone local do dispositivo');
must(js,"sb.auth.onAuthStateChange",'Relatório deve reagir a logout e troca de conta');
must(js,"clearReporting()",'Troca de sessão deve limpar imediatamente relatório e estado anterior');
must(js,"sb.removeChannel(channel)",'Troca de sessão deve remover o canal Realtime do staff anterior');
must(js,"lifecycleEpoch",'Respostas assíncronas antigas devem ser invalidadas após troca de sessão');
must(js,"document.documentElement.classList.contains('padoka-staff-pending')",'Relatório deve aguardar a revalidação global do staff antes de reativar');
must(js,"session?.user?.id!==expectedUserId",'Relatório deve confirmar que a sessão ainda pertence ao usuário esperado');
must(js,"setTimeout(()=>activate(nextUserId),0)",'Callback de Auth não deve executar chamadas Supabase assíncronas diretamente');
mustNot(js,".from('padoka_sales')",'Frontend não deve recalcular vendas lendo tabelas diretamente');
mustNot(js,".from('padoka_sale_items')",'Frontend não deve recalcular ranking diretamente no navegador');
mustNot(js,"localStorage",'Relatório consolidado não deve depender de localStorage');

console.log('reporting-frontend-audit: ok');
