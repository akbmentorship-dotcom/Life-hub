const assert=require('node:assert/strict'),F=require('../budget-engine.js');
const on='2026-01-01';
const source={id:'variable',name:'Variable pay',mode:'interval',anchor:on,days:14,active:true,expected:999999};
const debt={id:'debt',name:'Synthetic loan',opening:100000,asOf:on,apr:0,payment:10000,frequency:'monthly',nextDue:'2026-01-05'};
const bill={id:'living',name:'Living',amount:30000,frequency:'monthly',nextDue:'2026-01-03'};
const goal={id:'fund',name:'Emergency fund',opening:10000,target:100000,perPay:10000,asOf:on,deadline:'2026-06-01'};
let s={...F.empty(),incomeSources:[source],debts:[debt],bills:[bill],goals:[goal],payDebtShare:50};
s=F.recordPay(s,{id:'pay1',sourceId:'variable',date:on,amount:100000,through:'2026-01-15'});
assert.equal(F.paycheckPlan(s,'pay1',on).cash,100000,'Expected pay never increases available actual pay');
let plan=F.paycheckPlan(s,'pay1',on);assert.deepEqual(plan.rows.filter(x=>x.kind==='budget').map(x=>x.allocated),[30000]);assert.equal(plan.rows.find(x=>x.kind==='goal').allocated,10000);
const action=(id,kind,amount,targetId,extra={})=>({id,payId:'pay1',kind,amount,targetId,date:on,note:'',...extra});
s=F.recordPayUse(s,action('reserve','budget',30000,'living',{due:'2026-01-03',budgetState:'reserved'}));
assert.equal(s.version,2,'Actual action ledger is protected from older app versions that do not understand corrections');assert.equal(F.paycheckRemaining(s,'pay1'),70000);
assert.equal(F.paycheckPlan(s,'pay1',on).rows.some(x=>x.kind==='budget'),false,'Already funded bills are not reserved again');
s=F.markBudgetPaid(s,'reserve','2026-01-03');assert.equal(F.paycheckRemaining(s,'pay1'),70000,'Marking a reserve paid never spends the paycheque twice');assert.equal(F.billFunded(s,'living','2026-01-03','2026-01-02',true),0);assert.equal(F.billFunded(s,'living','2026-01-03','2026-01-03',true),30000);
s=F.recordPayUse(s,action('debt1','debt',10000,'debt',{due:'2026-01-05'}));
assert.equal(F.balance(debt,s.events,on).amount,90000);assert.equal(F.scheduledPaid(s,'debt','2026-01-05',on),10000,'An early payment funds the intended due date');assert.equal(F.paycheckPlan(s,'pay1',on).rows.some(x=>x.kind==='debt'),false);
const repeated=F.recordPayUse(s,action('debt1','debt',10000,'debt',{due:'2026-01-05'}));assert.equal(repeated.events.length,1,'Retry is idempotent');
s=F.recordPayUse(s,action('saving','goal',10000,'fund'));assert.equal(F.goalBalance(s,'fund',on),20000);assert.equal(F.paycheckRemaining(s,'pay1'),50000);
assert.equal(F.paycheckPlan(s,'pay1',on).rows.some(x=>x.name.includes('per-pay commitment')),false,'Goal per-pay commitment is not recommended twice');
assert.throws(()=>F.recordPayUse(s,action('too-much','buffer',60000,'')),/exceeds/);
s=F.recordPayUse(s,action('buffer','buffer',50000,''));assert.equal(F.paycheckRemaining(s,'pay1'),0);
s=F.releasePayUse(s,'buffer','2026-01-04');assert.equal(F.paycheckRemaining(s,'pay1'),50000);assert.equal(s.payUses.length,4,'Released earmark remains in history');
s=F.reversePayUse(s,'debt1','2026-01-04');assert.equal(F.balance(debt,s.events,'2026-01-04').amount,100000,'Correcting a newly recorded payment reverses its calculation');assert.equal(s.events.length,1);assert.equal(s.events[0].voided,true);assert.equal(F.paycheckRemaining(s,'pay1'),60000);
s=F.reversePayUse(s,'saving','2026-01-04');assert.equal(F.goalBalance(s,'fund','2026-01-04'),10000);
assert.deepEqual(F.validate(JSON.parse(JSON.stringify(s))),s,'Action ledger, corrections and goals survive backup/restore');
assert.throws(()=>F.validate({...s,payUses:[...s.payUses,{...s.payUses[0]}]}),/Invalid paycheque/);
const source2={...source,id:'other',name:'Other pay'};
let shared={...F.empty(),incomeSources:[source,source2],debts:[debt],bills:[bill],goals:[goal]};shared=F.recordPay(shared,{id:'a',sourceId:'variable',date:on,amount:20000,through:'2026-01-15'});shared=F.recordPay(shared,{id:'b',sourceId:'other',date:on,amount:30000,through:'2026-01-15'});
assert.equal(F.paycheckPlan(shared,'a',on).cash,50000);shared=F.recordPayUse(shared,{...action('a-reserve','budget',20000,'living',{due:'2026-01-03',budgetState:'reserved'}),payId:'a'});assert.equal(F.paycheckPlan(shared,'b',on).rows.find(x=>x.kind==='budget').amount,10000,'Same-day receipts share bill funding');
// One pre-existing bank payment can be attributed in portions without duplicating it.
let linked={...shared,events:[{id:'existing',type:'payment',debtId:'debt',date:on,amount:30000}]};linked=F.releasePayUse(linked,'a-reserve',on);linked=F.recordPayUse(linked,{...action('link-a','debt',20000,'debt',{eventId:'existing',due:'2026-01-05'}),payId:'a'});linked=F.recordPayUse(linked,{...action('link-b','debt',10000,'debt',{eventId:'existing',due:'2026-01-05'}),payId:'b'});
assert.equal(linked.events.length,1);assert.equal(F.balance(debt,linked.events,on).amount,70000);assert.equal(F.scheduledPaid(linked,'debt','2026-01-05',on),30000);
assert.throws(()=>F.recordPayUse(linked,{...action('double','debt',1,'debt',{eventId:'existing'}),payId:'b'}),/unassigned portion/);
linked=F.reversePayUse(linked,'link-a',on);assert.equal(F.balance(debt,linked.events,on).amount,70000,'Correcting attribution does not reverse the pre-existing payment');assert.equal(F.paycheckRemaining(linked,'a'),20000);
// Deadline pace is reduced by this household pay date's actual contributions.
const promotion={...debt,payment:0,deadlines:[{id:'promo',label:'Dated portion',amount:100000,due:'2026-01-29'}],deadlineAsOf:on,deadlinePaymentIds:[]};
let paced={...F.empty(),incomeSources:[source],debts:[promotion],goals:[goal],payDebtShare:0};paced=F.recordPay(paced,{id:'pay1',sourceId:'variable',date:on,amount:60000,through:'2026-01-15'});const pace=F.paycheckPlan(paced,'pay1',on).rows.find(x=>x.name.includes('deadline pace')).allocated;paced=F.recordPayUse(paced,action('pace','debt',pace,'debt'));
assert.equal(F.paycheckPlan(paced,'pay1',on).rows.some(x=>x.name.includes('deadline pace')),false,'Recalculating does not request the deadline pace repeatedly');
const linkedPlan={...s,decisionPlan:{asOf:on,goalId:'fund',input:{monthlySurplus:10000,debtShare:50,newDebtShare:50,incomeDelta:0,spendingDelta:0,oneOffDebt:0,oneOffSavings:0,oneOffCost:0,goalName:'old assumption',goalTarget:1,goalSaved:0,goalDeadline:'',newStrategy:'avalanche',startDate:on}}};assert.equal(F.currentPlan(linkedPlan,'2026-01-04').goalSaved,10000);assert.equal(F.currentPlan(linkedPlan,'2026-01-04').goalName,'Emergency fund');
assert.equal(F.goalBalance({...linkedPlan,goalEvents:[{id:'statement',goalId:'fund',type:'reconcile',date:'2026-01-04',amount:77777}]},'fund','2026-01-04'),77777,'Goal statement reconciles without changing paycheque history');
const beforeLaterPay=F.payPeriod(shared,shared.paydays[0]);shared=F.recordPay(shared,{id:'later',sourceId:'variable',date:'2026-01-15',amount:50000});assert.equal(F.payPeriod(shared,shared.paydays[0]),beforeLaterPay,'Planning periods do not drift as later pay is recorded');
console.log('PASS: actual variable pay, recommended vs completed allocations, bill reserves, linked/split payments, savings, goal statements, corrections, shortfalls, shared pay dates and backup compatibility');

let sameDayGoal={...F.empty(),goals:[goal],incomeSources:[source]};sameDayGoal=F.recordPay(sameDayGoal,{id:'pay1',sourceId:'variable',date:on,amount:20000});sameDayGoal={...sameDayGoal,goalEvents:[{id:'morning',type:'reconcile',goalId:'fund',date:on,amount:15000,includedUseIds:[]}]};sameDayGoal=F.recordPayUse(sameDayGoal,action('after-statement','goal',1000,'fund'));assert.equal(F.goalBalance(sameDayGoal,'fund',on),16000,'New contributions after a same-day confirmation remain visible');
assert.throws(()=>F.validate({...sameDayGoal,payUses:[{...sameDayGoal.payUses[0],amount:30000}]}),/exceed/);
console.log('PASS: same-day goal confirmations preserve later contributions; invalid action totals cannot restore');

const revised=F.revisePay(s,'pay1',120000,'2026-01-04');assert.equal(revised.paydays[0].amount,120000);assert.equal(revised.paydays[0].revisions[0].from,100000);assert.equal(F.paycheckRemaining(revised,'pay1')-F.paycheckRemaining(s,'pay1'),20000);assert.throws(()=>F.revisePay(s,'pay1',1,'2026-01-04'),/assigned total/);assert.deepEqual(F.validate(JSON.parse(JSON.stringify(revised))),revised);console.log('PASS: actual take-home corrections retain original amounts and cannot underfund assigned actions');

const savingsBill={id:'savings-budget',name:'Savings allocation',amount:20000,frequency:'monthly',nextDue:on};let budgetGoal={...F.empty(),incomeSources:[source],bills:[savingsBill],goals:[{...goal,budgetIds:['savings-budget'],perPay:5000}],payDebtShare:0};budgetGoal=F.recordPay(budgetGoal,{id:'pay1',sourceId:'variable',date:on,amount:30000,through:'2026-01-15'});const fundedPlan=F.paycheckPlan(budgetGoal,'pay1',on);assert.equal(fundedPlan.rows.some(x=>x.kind==='budget'),false);assert.equal(fundedPlan.rows.filter(x=>x.kind==='goal'&&x.budgetId==='savings-budget').reduce((n,x)=>n+x.allocated,0),20000);assert.equal(fundedPlan.rows.some(x=>x.name.includes('per-pay commitment')),false,'Linked budget goal replaces its standalone per-pay commitment');budgetGoal=F.recordPayUse(budgetGoal,action('budget-goal','goal',20000,'fund',{budgetId:'savings-budget',due:on}));assert.equal(F.goalBalance(budgetGoal,'fund',on),30000);assert.equal(F.billFunded(budgetGoal,'savings-budget',on,on),20000);assert.equal(F.paycheckPlan(budgetGoal,'pay1',on).rows.some(x=>x.budgetId==='savings-budget'),false);console.log('PASS: existing workbook savings allocations become real goal contributions without duplicate bill or per-pay funding');

const earlyState=F.recordPayUse(F.recordPay({...F.empty(),incomeSources:[source],debts:[debt]},{id:'pay1',sourceId:'variable',date:on,amount:10000}),action('early','debt',10000,'debt',{due:'2026-01-05'}));assert.equal(F.forecast(debt,earlyState.events,on,earlyState.payUses).date,'2026-10-05','Forecast does not pay an explicitly funded upcoming instalment a second time');assert.equal(F.cfoBrief(earlyState,on).obligations.some(x=>x.kind==='debt'),false,'CFO overview removes an instalment paid early');console.log('PASS: forecasts and upcoming obligations respect an early payment linked to its due date');

assert.equal(F.currentPlan({...linkedPlan,payDebtShare:25},'2026-01-04').debtShare,25,'Operational and decision-plan extra-money splits stay aligned');
const reimported=F.merge(s,[{...debt,opening:999999,apr:5,payment:20000}],'debt','new-workbook-review','2026-01-04');assert.deepEqual(reimported.payUses,s.payUses);assert.deepEqual(reimported.goals,s.goals);assert.deepEqual(reimported.events,s.events);assert.equal(reimported.debts[0].opening,debt.opening);const budgetUpdated=F.merge(budgetGoal,[{...savingsBill,amount:25000}],'budget','new-savings-budget');assert.deepEqual(budgetUpdated.goals,budgetGoal.goals);assert.deepEqual(budgetUpdated.payUses,budgetGoal.payUses);console.log('PASS: updated workbook settings retain actual pay actions, corrections, linked goal budgets and payment history');
