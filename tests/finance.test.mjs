import test from 'node:test';
import assert from 'node:assert/strict';
import {finance} from '../studio/model.mjs';
const payment=(amount,received,expected='',actual='')=>({amount,received,expected,actual});
const state={projects:[{id:'closed',status:'completed',payments:[payment(7000,true)]},{id:'invoice',status:'invoicing',payments:[payment(9000,false)]},{id:'dated',status:'completed',payments:[payment(3000,true,'','2026-07-10')]}],licenses:[],licensePayments:[]};
test('all-time finance includes closed and undated paid/unpaid projects',()=>{
 const f=finance(state,'2026-10-01','2026-12-31','cashflow','all','all');
 assert.equal(f.rows.length,3);assert.equal(f.received,10000);assert.equal(f.pending,9000);assert.equal(f.total,19000);
});
test('closed status filter includes undated receipts without treating closure as payment',()=>{
 const s=structuredClone(state);s.projects[0].payments.push(payment(1000,false));
 const f=finance(s,'','','cashflow','all','all','completed');
 assert.equal(f.received,10000);assert.equal(f.pending,1000);assert.equal(f.rows.length,3);
});
test('date range remains strict and reports missing dates; cashflow uses actual paid date',()=>{
 const f=finance(state,'2026-07-01','2026-07-31','cashflow','all','range');
 assert.equal(f.total,3000);assert.equal(f.missingDates,2);
 assert.equal(finance(state,'2026-10-01','2026-10-31','cashflow','all','range').total,0);
});
test('license income and source filters follow the same all-time rules',()=>{
 const s=structuredClone(state);s.licenses=[{id:'license',projectId:'closed'}];s.licensePayments=[{...payment(2000,false),contractId:'license'}];
 assert.equal(finance(s,'','','cashflow','license','all').pending,2000);
 assert.equal(finance(s,'','','cashflow','production','all').total,19000);
 assert.equal(finance(s,'','','cashflow','all','all').total,21000);
});
