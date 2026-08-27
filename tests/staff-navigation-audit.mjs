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
expect(nav.includes('auth.onAuthStateChange'),'Navegação interna deve reagir a mudanças de autenticação sem depender de reload manual.');
expect(nav.includes("event==='INITIAL_SESSION'||event==='TOKEN_REFRESHED'"),'Eventos de inicialização/refresh não devem provocar revalidação desnecessária.');
expect(nav.includes('clearResolvedStaff()'),'Troca/logout de sessão deve limpar imediatamente papel e permissões resolvidos anteriormente.');
expect(nav.includes('delete window.padokaStaffRole')&&nav.includes('delete window.padokaCanAccess'),'Permissões globais antigas devem ser descartadas ao mudar a sessão.');
expect(nav.includes('staffValidationEpoch'),'Respostas assíncronas de validações antigas precisam ser invalidadas quando a sessão muda.');
expect(nav.includes('latestSession?.user?.id!==session.user.id'),'A função do staff só pode ser aplicada se a mesma conta continuar autenticada após a consulta ao banco.');
expect(nav.includes('setTimeout(()=>applyStaffRole(nextUserId),0)'),'Revalidação após evento Auth deve ocorrer fora do callback para evitar trabalho assíncrono dentro do listener.');
expect(!nav.includes('InfoTech.io'),'Navegação PADOKA não deve referenciar InfoTech.io.');

console.log('staff-navigation-audit: ok');
