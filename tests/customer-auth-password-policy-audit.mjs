import fs from 'node:fs';

const source=fs.readFileSync('conta.html','utf8')+'\n'+fs.readFileSync('assets/account.js','utf8');
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};
const need=(c,m)=>{if(!c)fail(m)};

need(source.includes('password.length>=12'),'Cadastro: senha nova deve exigir 12+ caracteres');
need(source.includes('/[a-z]/.test(password)'),'Cadastro: deve exigir minúscula');
need(source.includes('/[A-Z]/.test(password)'),'Cadastro: deve exigir maiúscula');
need(source.includes('/[0-9]/.test(password)'),'Cadastro: deve exigir número');
need(source.includes('/[^A-Za-z0-9]/.test(password)'),'Cadastro: deve exigir símbolo');
need(!source.includes('senha com pelo menos 6 caracteres'),'Cadastro: regra antiga de 6 caracteres reapareceu');
need(source.includes('signInWithPassword'),'Login por senha deve continuar disponível para contas existentes');
need(source.includes('signInWithOtp'),'Link mágico deve continuar disponível');
need(source.includes("provider:'google'"),'Google OAuth deve continuar disponível');

if(!process.exitCode)console.log('Customer auth password policy audit: OK');
