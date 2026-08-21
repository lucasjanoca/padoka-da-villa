import fs from 'node:fs';

const nav=fs.readFileSync('assets/internal-nav.js','utf8');
const fail=message=>{throw new Error(message)};
const expect=(condition,message)=>{if(!condition)fail(message)};

expect(nav.includes("pdv:['owner','manager','cashier','attendant']"),'PDV deve aparecer apenas para owner/manager/cashier/attendant.');
expect(nav.includes("estoque:['owner','manager','stock']"),'Estoque deve aparecer apenas para owner/manager/stock.');
expect(nav.includes("producao:['owner','manager','production']"),'Produção deve aparecer apenas para owner/manager/production.');
expect(nav.includes("perdas:['owner','manager','stock','production']"),'Perdas deve aparecer apenas para owner/manager/stock/production.');
expect(nav.includes("relatorios:['owner','manager']"),'Relatórios devem ficar restritos a owner/manager.');
expect(nav.includes("configuracoes:['owner','manager']"),'Configurações devem ficar restritas a owner/manager.');
expect(nav.includes('inicio:null')&&nav.includes('pedidos:null')&&nav.includes('produtos:null'),'Visão geral, pedidos e produtos devem continuar disponíveis a todo staff ativo.');
expect(nav.includes("from('padoka_staff_users').select('role,active')"),'Navegação deve resolver a função pelo cadastro real padoka_staff_users.');
expect(nav.includes("link.hidden=!allowed(link.dataset.padokaModule,role)"),'Links do menu interno precisam ser filtrados pela função resolvida.');
expect(nav.includes('filterPageShortcuts(role)'),'Atalhos e abas fora do drawer também devem seguir a função do staff.');
expect(nav.includes("window.padokaCanAccess=id=>allowed(id,role)"),'Demais módulos devem poder consultar a mesma decisão de acesso já resolvida.');
expect(nav.includes("location.replace('internal.html')"),'Acesso direto a módulo incompatível deve voltar ao painel interno.');
expect(nav.includes('.padoka-role-pending #app{visibility:hidden!important}'),'Módulo restrito não deve ficar visível enquanto a função ainda está sendo validada.');
expect(!nav.includes('InfoTech.io'),'Navegação PADOKA não deve referenciar InfoTech.io.');

console.log('staff-navigation-audit: ok');
