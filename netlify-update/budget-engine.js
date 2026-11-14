/* Pure finance calculations. Amounts are integer cents; dates are calendar ISO dates. */
(function(root){
'use strict';
const DAY=86400000;
function date(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||new Date(s+'T00:00:00Z').toISOString().slice(0,10)!==s)throw Error('Enter a valid date');return Date.parse(s+'T00:00:00Z');}
function add(s,n){return new Date(date(s)+n*DAY).toISOString().slice(0,10);}
function money(v){const n=Number(String(v).replace(/[$,\s]/g,''));if(!String(v).trim()||!Number.isFinite(n)||n<0||n>1e10)throw Error('Enter a non-negative amount');return Math.round(n*100);}
function cents(n){return Number.isSafeInteger(n)&&n>=0&&n<=1e12;}
function key(s){return String(s).normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');}
function empty(){return {version:1,debts:[],bills:[],events:[],paydays:[],imports:[],schedule:{anchor:'',days:14},strategy:'avalanche'};}
function validate(s){
 if(!s||![1,2].includes(s.version)||!['debts','bills','events','paydays','imports'].every(k=>Array.isArray(s[k]))||!s.schedule)throw Error('Invalid Finance backup');
 const ids=new Set();for(const d of s.debts){if(typeof d.id!=='string'||ids.has(d.id)||typeof d.name!=='string'||!d.name.trim()||!cents(d.opening)||!cents(d.payment)||!Number.isFinite(d.apr)||d.apr<0||d.apr>100||!['monthly','weekly','biweekly'].includes(d.frequency))throw Error('Invalid debt');if(d.deadlines!==undefined){if(!Array.isArray(d.deadlines)||d.deadlines.length>30||!Array.isArray(d.deadlinePaymentIds)||d.deadlinePaymentIds.some(id=>typeof id!=='string'))throw Error('Invalid debt deadlines');date(d.deadlineAsOf);if(d.deadlineAsOf<d.asOf)throw Error('Milestone snapshot predates debt opening');const milestones=new Set();for(const item of d.deadlines){if(typeof item.id!=='string'||milestones.has(item.id)||typeof item.label!=='string'||!item.label.trim()||item.label.length>100||!cents(item.amount))throw Error('Invalid debt deadline');date(item.due);milestones.add(item.id);}}ids.add(d.id);date(d.asOf);date(d.nextDue);if(d.installments){if(!Array.isArray(d.installments)||!d.installments.length)throw Error('Invalid installments');for(const x of d.installments){if(!cents(x.amount)||!['monthly','weekly','biweekly'].includes(x.frequency))throw Error('Invalid installment');date(x.nextDue);}}if(d.initialApr!==undefined&&(!Number.isFinite(d.initialApr)||d.initialApr<0||d.initialApr>100))throw Error('Invalid opening APR');if(d.rates!==undefined){if(!Array.isArray(d.rates))throw Error('Invalid rate history');for(const r of d.rates){date(r.date);if(r.date<d.asOf||!Number.isFinite(r.apr)||r.apr<0||r.apr>100)throw Error('Invalid rate history');}}}
 const billIds=new Set();for(const b of s.bills){if(billIds.has(b.id))throw Error('Duplicate budget category');billIds.add(b.id);}
 const eventIds=new Set();for(const e of s.events){if(typeof e.id!=='string'||eventIds.has(e.id)||!ids.has(e.debtId)||!['payment','reconcile'].includes(e.type)||!cents(e.amount)||(e.voided!==undefined&&typeof e.voided!=='boolean')||(e.voided&&!(s.payUses||[]).some(u=>u.eventId===e.id&&u.createdPayment&&u.reversedOn)))throw Error('Invalid history');date(e.date);if(e.date<s.debts.find(d=>d.id===e.debtId).asOf)throw Error('History predates opening balance');eventIds.add(e.id);}
 for(const b of s.bills){if(typeof b.id!=='string'||typeof b.name!=='string'||!cents(b.amount)||!['monthly','weekly','biweekly'].includes(b.frequency))throw Error('Invalid budget');date(b.nextDue);}
 const payIds=new Set();for(const p of s.paydays){if(typeof p.id!=='string'||!p.id||payIds.has(p.id)||!cents(p.amount))throw Error('Invalid payday');date(p.date);payIds.add(p.id);}
 if(!Number.isInteger(s.schedule.days)||s.schedule.days<1||s.schedule.days>366)throw Error('Invalid payday interval');if(s.schedule.anchor)date(s.schedule.anchor);
 if(s.strategy!==undefined&&!['snowball','avalanche'].includes(s.strategy))throw Error('Invalid debt priority');if(s.schedule.mode!==undefined&&!['interval','semimonthly'].includes(s.schedule.mode))throw Error('Invalid payday mode');if(s.baselineIncome!==undefined&&(!Array.isArray(s.baselineIncome)||s.baselineIncome.some(p=>!cents(p.amount))))throw Error('Invalid income plan');
 if(s.incomeSources!==undefined){if(!Array.isArray(s.incomeSources))throw Error('Invalid income sources');const sourceIds=new Set();for(const source of s.incomeSources){if(typeof source.id!=='string'||sourceIds.has(source.id)||typeof source.name!=='string'||!source.name.trim()||source.name.length>100||!['interval','monthly','semimonthly','monthlyweekday','monthbusiness','once'].includes(source.mode)||typeof source.active!=='boolean'||!Number.isInteger(source.days)||source.days<1||source.days>366||!cents(source.expected))throw Error('Invalid income source');date(source.anchor);validatePayRule(source);for(const move of source.overrides||[])if(nextPayday({...source,adjustment:'none',overrides:[]},move.scheduled)!==move.scheduled)throw Error('A date move must start on a scheduled payday');sourceIds.add(source.id);}for(const pay of s.paydays)if(pay.sourceId!==undefined&&typeof pay.sourceId!=='string')throw Error('Invalid income source history');}
 if(s.decisionPlan!==undefined){date(s.decisionPlan.asOf);scenarioInput(s.decisionPlan.input);}
 if(s.decisions!==undefined){if(!Array.isArray(s.decisions)||s.decisions.length>100)throw Error('Invalid saved decisions');const seen=new Set();for(const x of s.decisions){if(typeof x.id!=='string'||seen.has(x.id)||typeof x.title!=='string'||!x.title.trim()||x.title.length>100||!['considering','chosen','passed'].includes(x.status))throw Error('Invalid saved decision');date(x.reviewedOn);decisionInput(x.decision);scenarioInput(x.plan);seen.add(x.id);}}
 if(s.cfoReview!==undefined){date(s.cfoReview.date);if(typeof s.cfoReview.note!=='string'||s.cfoReview.note.length>1000)throw Error('Invalid CFO review');}
 if(s.focusDebtId!==undefined&&(typeof s.focusDebtId!=='string'||(s.focusDebtId&&!ids.has(s.focusDebtId))))throw Error('Invalid focus debt');
 if(s.whatIf!==undefined){if(!Array.isArray(s.whatIf)||s.whatIf.length>20)throw Error('Invalid saved scenarios');const scenarioIds=new Set();for(const scenario of s.whatIf){if(typeof scenario.id!=='string'||scenarioIds.has(scenario.id)||typeof scenario.name!=='string'||!scenario.name.trim()||scenario.name.length>100)throw Error('Invalid saved scenario');scenarioInput(scenario.input);scenarioIds.add(scenario.id);}}
 validatePaycheckState(s);
 if(s.imports.some(x=>typeof x!=='string'))throw Error('Invalid imports');return s;
}
function payUses(s,payId){return (s.payUses||[]).filter(x=>(!payId||x.payId===payId)&&!x.releasedOn&&!x.reversedOn);}
function paycheckRemaining(s,payId){const pay=s.paydays.find(x=>x.id===payId);if(!pay)throw Error('Choose a recorded paycheque');return pay.amount-payUses(s,payId).reduce((n,x)=>n+x.amount,0);}
function goalBalance(s,id,on){const goal=(s.goals||[]).find(x=>x.id===id);if(!goal)throw Error('Choose a goal');date(on);if(on<goal.asOf)throw Error('Date predates goal opening');const statements=(s.goalEvents||[]).filter(x=>x.goalId===id&&x.date>=goal.asOf&&x.date<=on).map((x,i)=>({...x,order:i})).sort((a,b)=>a.date.localeCompare(b.date)||a.order-b.order),latest=statements[statements.length-1],from=latest?.date||goal.asOf;let value=latest?.amount??goal.opening;for(const use of payUses(s).filter(x=>x.kind==='goal'&&x.targetId===id&&x.date<=on))if(use.date>from||(use.date===from&&(!latest||(latest.includedUseIds&&!latest.includedUseIds.includes(use.id)))))value+=use.amount;if(!Number.isSafeInteger(value))throw Error('Goal balance is too large');return value;}

function currentPlan(s,on){if(!s.decisionPlan)return null;const input={...s.decisionPlan.input,startDate:on};input.debtShare=100;input.newDebtShare=100;const goal=(s.goals||[]).find(x=>x.id===s.decisionPlan.goalId);if(goal){input.goalName=goal.name;input.goalTarget=goal.target;input.goalSaved=goalBalance(s,goal.id,on);input.goalDeadline=goal.deadline||'';}return input;}
function validatePaycheckState(s){
 if(s.goals!==undefined){if(!Array.isArray(s.goals))throw Error('Invalid goals');const ids=new Set();for(const g of s.goals){if(typeof g.id!=='string'||!g.id||ids.has(g.id)||typeof g.name!=='string'||!g.name.trim()||g.name.length>100||!cents(g.target)||g.target===0||!cents(g.opening)||!cents(g.perPay))throw Error('Invalid goal');date(g.asOf);if(g.budgetIds!==undefined&&(!Array.isArray(g.budgetIds)||new Set(g.budgetIds).size!==g.budgetIds.length||g.budgetIds.some(id=>!s.bills.some(b=>b.id===id)||(s.goals||[]).some(other=>other.id!==g.id&&other.budgetIds?.includes(id)))))throw Error('Each goal budget category must be linked once');if(g.deadline)date(g.deadline);ids.add(g.id);}}
 if(s.goalEvents!==undefined){if(!Array.isArray(s.goalEvents))throw Error('Invalid goal statements');const ids=new Set();for(const e of s.goalEvents){const goal=(s.goals||[]).find(x=>x.id===e.goalId);if(!goal||typeof e.id!=='string'||ids.has(e.id)||e.type!=='reconcile'||!cents(e.amount)||(e.includedUseIds!==undefined&&(!Array.isArray(e.includedUseIds)||e.includedUseIds.some(id=>typeof id!=='string'))))throw Error('Invalid goal statement');date(e.date);if(e.date<goal.asOf)throw Error('Goal statement predates opening');ids.add(e.id);}}
 if(s.payDebtShare!==undefined&&(!Number.isFinite(s.payDebtShare)||s.payDebtShare<0||s.payDebtShare>100))throw Error('Invalid paycheque debt share');
 for(const p of s.paydays){if(p.through){date(p.through);if(p.through<=p.date)throw Error('Invalid paycheque planning period');}if(p.revisions!==undefined){if(!Array.isArray(p.revisions))throw Error('Invalid paycheque corrections');p.revisions.forEach((r,i)=>{date(r.date);if(r.date<p.date||!cents(r.from)||!cents(r.to)||(i>0&&r.from!==p.revisions[i-1].to))throw Error('Invalid paycheque correction');});if(p.revisions.length&&p.revisions[p.revisions.length-1].to!==p.amount)throw Error('Invalid corrected paycheque amount');}}
 if(s.payUses!==undefined){if(!Array.isArray(s.payUses))throw Error('Invalid paycheque actions');const ids=new Set(),linked=new Map();for(const use of s.payUses){const pay=s.paydays.find(x=>x.id===use.payId);if(!pay||typeof use.id!=='string'||!use.id||ids.has(use.id)||!['debt','budget','goal','buffer'].includes(use.kind)||!cents(use.amount)||use.amount===0||(use.kind!=='debt'&&(use.eventId!==undefined||use.createdPayment!==undefined))||(use.createdPayment!==undefined&&typeof use.createdPayment!=='boolean')||typeof use.note!=='string'||use.note.length>300)throw Error('Invalid paycheque action');date(use.date);if(use.date<pay.date)throw Error('Action predates paycheque');if(use.reversedOn){date(use.reversedOn);if(use.reversedOn<use.date||use.releasedOn)throw Error('Invalid correction date');}if(use.releasedOn){date(use.releasedOn);if(use.releasedOn<use.date||!(use.kind==='buffer'||(use.kind==='budget'&&use.budgetState==='reserved')))throw Error('Only earmarked money can be released');}
  if(use.kind==='debt'){const event=s.events.find(x=>x.id===use.eventId);if(!event||event.type!=='payment'||event.debtId!==use.targetId||event.amount<use.amount||event.date!==use.date||(use.createdPayment?(event.amount!==use.amount||!!event.voided!==!!use.reversedOn):!!event.voided))throw Error('Invalid linked debt payment');if(!use.reversedOn){linked.set(use.eventId,(linked.get(use.eventId)||0)+use.amount);if(linked.get(use.eventId)>event.amount)throw Error('Payment linked more than once');}}
  if(use.paidOn){date(use.paidOn);if(use.paidOn<use.date)throw Error('Invalid bill payment date');}if(use.kind==='budget'&&(!s.bills.some(b=>b.id===use.targetId)||!['reserved','paid'].includes(use.budgetState)))throw Error('Invalid budget action');
  if(use.kind==='goal'){const goal=(s.goals||[]).find(g=>g.id===use.targetId);if(!goal||use.date<goal.asOf||(use.budgetId&&(!goal.budgetIds?.includes(use.budgetId)||!use.due)))throw Error('Invalid goal contribution');}
  if(use.due)date(use.due);ids.add(use.id);
 }for(const p of s.paydays)if(paycheckRemaining(s,p.id)<0)throw Error('Actions exceed the actual paycheque');}
 for(const g of s.goals||[]){const through=[g.asOf,...payUses(s).filter(x=>x.kind==='goal'&&x.targetId===g.id).map(x=>x.date),...(s.goalEvents||[]).filter(x=>x.goalId===g.id).map(x=>x.date)].sort().pop();goalBalance(s,g.id,through);}
 if(s.decisionPlan?.goalId&&!s.goals?.some(x=>x.id===s.decisionPlan.goalId))throw Error('Invalid linked decision goal');
}
function recordPayUse(s,use){
 if((s.payUses||[]).some(x=>x.id===use.id))return s;const pay=s.paydays.find(x=>x.id===use.payId);if(!pay||!cents(use.amount)||!use.amount)throw Error('Enter a positive actual amount');if(use.amount>paycheckRemaining(s,use.payId))throw Error('This exceeds the unassigned amount of this paycheque');date(use.date);if(use.date<pay.date)throw Error('Action cannot predate this paycheque');let next=s;const item={...use,note:use.note||''};
 if(use.kind==='debt'){if(use.eventId){const event=s.events.find(x=>x.id===use.eventId),attributed=payUses(s).filter(x=>x.eventId===use.eventId).reduce((n,x)=>n+x.amount,0);if(!event||event.voided||use.amount>event.amount-attributed)throw Error('This exceeds the unassigned portion of that payment');item.createdPayment=false;}else{item.eventId='pay-use-'+use.id;item.createdPayment=true;next=payment(s,use.targetId,use.amount,use.date,item.eventId);}}
 return validate({...next,version:2,payUses:[...(next.payUses||[]),item]});
}
function reversePayUse(s,id,on){date(on);const use=payUses(s).find(x=>x.id===id);if(!use)throw Error('Choose an active action to correct');return validate({...s,version:2,payUses:s.payUses.map(x=>x.id===id?{...x,reversedOn:on}:x),events:s.events.map(e=>use.createdPayment&&e.id===use.eventId?{...e,voided:true}:e)});}
function releasePayUse(s,id,on){date(on);const use=(s.payUses||[]).find(x=>x.id===id);if(!use||use.releasedOn)throw Error('Choose an active earmark');if(!(use.kind==='buffer'||(use.kind==='budget'&&use.budgetState==='reserved')))throw Error('Completed payments and savings cannot be released');return validate({...s,payUses:s.payUses.map(x=>x.id===id?{...x,releasedOn:on}:x)});}
function markBudgetPaid(s,id,on){date(on);const use=payUses(s).find(x=>x.id===id);if(!use||use.kind!=='budget'||use.budgetState!=='reserved')throw Error('Choose a reserved budget amount');return validate({...s,payUses:s.payUses.map(x=>x.id===id?{...x,budgetState:'paid',paidOn:on}:x)});}
function billFunded(s,id,due,on,paidOnly=false){return payUses(s).filter(x=>x.due===due&&x.date<=on&&((x.kind==='budget'&&x.targetId===id&&(!paidOnly||(x.budgetState==='paid'&&(x.paidOn||x.date)<=on)))||(x.kind==='goal'&&x.budgetId===id))).reduce((n,x)=>n+x.amount,0);}

function scheduledPaid(s,id,due,on){return s.events.filter(e=>e.type==='payment'&&!e.voided&&e.debtId===id&&e.date<=on).reduce((n,e)=>{const uses=payUses(s).filter(x=>x.kind==='debt'&&x.eventId===e.id),assigned=uses.reduce((sum,x)=>sum+x.amount,0),toward=uses.filter(x=>x.due===due).reduce((sum,x)=>sum+x.amount,0);return n+toward+(e.date===due?Math.max(0,e.amount-assigned):0);},0);}

function revisePay(s,id,amount,on){date(on);const pay=s.paydays.find(p=>p.id===id);if(!pay||!cents(amount))throw Error('Enter a valid actual take-home amount');if(amount===pay.amount)return s;if(amount<pay.amount-paycheckRemaining(s,id))throw Error('Correct or release assigned actions before reducing this paycheque below its assigned total');return validate({...s,version:2,paydays:s.paydays.map(p=>p.id===id?{...p,amount,revisions:[...(p.revisions||[]),{date:on,from:p.amount,to:amount}]}:p)});}
function payPeriod(s,pay){if(pay.through)return pay.through;const dates=s.paydays.filter(x=>x.date>pay.date).map(x=>x.date);for(const source of incomeSources(s).filter(x=>x.active)){const on=nextPayday(source,pay.date,false);if(on)dates.push(on);}return dates.sort()[0]||null;}
function paycheckPlan(s,payId,on){
 date(on);const pay=s.paydays.find(x=>x.id===payId);if(!pay)throw Error('Choose a recorded paycheque');const end=payPeriod(s,pay);if(!end)throw Error('Set this paycheque’s planning end date');
 const group=s.paydays.filter(x=>x.date===pay.date),cash=group.reduce((n,p)=>n+paycheckRemaining(s,p.id),0);let left=cash,shortfall=0,deadlineShortfall=0,goalShortfall=0;const rows=[],debtLeft=new Map(),goalLeft=new Map(),reserved=new Map();
 const obligations=[];for(const b of s.bills.filter(b=>!(s.goals||[]).some(g=>g.budgetIds?.includes(b.id))))for(const due of occurrences(b,pay.date,end)){const needed=Math.max(0,b.amount-billFunded(s,b.id,due,on));if(needed)obligations.push({id:b.id,name:b.name,due,amount:needed,kind:'budget'});}
 for(const d of s.debts){let remaining=balance(d,s.events,on).amount;debtLeft.set(d.id,remaining);reserved.set(d.id,0);for(const due of duePayments(d,pay.date,end)){const needed=Math.min(remaining,Math.max(0,due.amount-scheduledPaid(s,d.id,due.date,on)));remaining-=needed;if(needed)obligations.push({id:d.id,name:d.name,due:due.date,amount:needed,kind:'debt'});}}
 const activeGoals=(s.goals||[]).map(g=>({...g,remaining:Math.max(0,g.target-goalBalance(s,g.id,on))})).filter(g=>g.remaining).sort((a,b)=>(a.deadline||'9999').localeCompare(b.deadline||'9999'));activeGoals.forEach(g=>goalLeft.set(g.id,g.remaining));
 function allocate(row){const amount=Math.min(left,row.amount,row.kind==='debt'||row.kind==='extra'?debtLeft.get(row.id):row.kind==='goal'?goalLeft.get(row.id):row.amount);if(row.amount)rows.push({...row,allocated:amount});left-=amount;if(row.kind==='debt'||row.kind==='extra')debtLeft.set(row.id,debtLeft.get(row.id)-amount);if(row.kind==='goal')goalLeft.set(row.id,goalLeft.get(row.id)-amount);return amount;}
 obligations.sort((a,b)=>a.due.localeCompare(b.due)||(a.kind==='budget'?-1:1));for(const row of obligations){const assigned=allocate(row);shortfall+=row.amount-assigned;if(row.kind==='debt')reserved.set(row.id,reserved.get(row.id)+assigned);}
 const dated=s.debts.flatMap(d=>debtDeadlines(d,s.events,on).map(x=>({debt:d,...x}))).sort((a,b)=>a.due.localeCompare(b.due));
 for(const x of dated){const already=Math.min(reserved.get(x.debt.id),x.remaining);reserved.set(x.debt.id,reserved.get(x.debt.id)-already);const groupUses=payUses(s).filter(u=>u.kind==='debt'&&group.some(p=>p.id===u.payId)),priorEvents=s.events.map(e=>({...e,amount:e.amount-groupUses.filter(u=>u.eventId===e.id).reduce((n,u)=>n+u.amount,0)})),before=debtDeadlines(x.debt,priorEvents,on).find(m=>m.id===x.id),original=before?.remaining??x.remaining,completed=Math.max(0,original-x.remaining);const required=Math.max(0,Math.ceil(original/deadlinePace(s,x,on).paydays)-completed-already);if(required){const assigned=allocate({id:x.debt.id,name:x.debt.name+' · '+x.label+' deadline pace',due:on,amount:Math.min(debtLeft.get(x.debt.id),required),kind:'extra'});deadlineShortfall+=required-assigned;}}
 // All surplus targets debt before optional savings, including linked savings budget categories.
 let budget=left;for(const x of prioritizedDebts(s,on)){const amount=Math.min(budget,debtLeft.get(x.debt.id));budget-=allocate({id:x.debt.id,name:x.debt.name+' · extra',kind:'extra',amount,due:on});}
 const plannedGoal=new Map();for(const g of activeGoals){let planned=0;for(const id of g.budgetIds||[]){const b=s.bills.find(b=>b.id===id);for(const due of occurrences(b,pay.date,end)){const required=Math.min(goalLeft.get(g.id),Math.max(0,b.amount-billFunded(s,b.id,due,on)));if(required){const amount=allocate({id:g.id,name:g.name+' · '+b.name,kind:'goal',budgetId:b.id,due,amount:required});planned+=amount;goalShortfall+=required-amount;}}}plannedGoal.set(g.id,planned);}
 for(const g of activeGoals){const already=payUses(s).filter(x=>x.kind==='goal'&&x.targetId===g.id&&group.some(p=>p.id===x.payId)).reduce((n,x)=>n+x.amount,0),required=g.budgetIds?.length?0:Math.min(goalLeft.get(g.id),Math.max(0,g.perPay-already-(plannedGoal.get(g.id)||0)));if(required)goalShortfall+=required-allocate({id:g.id,name:g.name+' · per-pay commitment',kind:'goal',amount:required,due:on});}
 let savings=left;for(const g of activeGoals){const amount=Math.min(savings,goalLeft.get(g.id));savings-=allocate({id:g.id,name:g.name,kind:'goal',amount,due:on});}
 return {rows,left,shortfall,deadlineShortfall,goalShortfall,end,cash,group:group.map(x=>x.id),selectedRemaining:paycheckRemaining(s,payId)};
}

function debtRecommendation(s,id,on){
 date(on);const pay=s.paydays.filter(p=>p.date<=on&&payPeriod(s,p)>on).sort((a,b)=>b.date.localeCompare(a.date))[0];
 if(!pay)return null;const plan=paycheckPlan(s,pay.id,on),rows=plan.rows.filter(r=>r.id===id&&['debt','extra'].includes(r.kind));
 return {amount:rows.reduce((n,r)=>n+r.allocated,0),extra:rows.filter(r=>r.kind==='extra').reduce((n,r)=>n+r.allocated,0),cash:plan.cash,start:pay.date,end:plan.end,shortfall:plan.shortfall};
}

function scenarioInput(x){if(!x||(x.oneOffSpending!==undefined&&!cents(x.oneOffSpending))||!['monthlySurplus','oneOffDebt','oneOffSavings','oneOffCost','goalTarget','goalSaved'].every(k=>cents(x[k]))||!['incomeDelta','spendingDelta'].every(k=>Number.isSafeInteger(x[k])&&Math.abs(x[k])<=1e12)||!['debtShare','newDebtShare'].every(k=>Number.isFinite(x[k])&&x[k]>=0&&x[k]<=100)||!['snowball','avalanche'].includes(x.newStrategy)||typeof x.goalName!=='string'||x.goalName.length>100)throw Error('Invalid scenario assumptions');date(x.startDate);if(x.goalDeadline)date(x.goalDeadline);return x;}
function decisionInput(x){if(!x||!['purchase','monthly-cost','monthly-saving','income-more','income-less','extra-debt'].includes(x.kind)||!cents(x.amount)||x.amount===0||!['surplus','savings'].includes(x.funding))throw Error('Enter a positive decision amount');date(x.startDate);return x;}
function next(d,frequency,anchorDay=Number(d.slice(8))){if(frequency!=='monthly')return add(d,frequency==='weekly'?7:14);const t=new Date(date(d));t.setUTCDate(1);t.setUTCMonth(t.getUTCMonth()+1);const last=new Date(Date.UTC(t.getUTCFullYear(),t.getUTCMonth()+1,0)).getUTCDate();t.setUTCDate(Math.min(anchorDay,last));return t.toISOString().slice(0,10);}
function occurrences(item,start,end){date(start);date(end);let d=item.nextDue;const out=[];for(let i=0;i<20000&&d<end;i++,d=next(d,item.frequency,Number(item.nextDue.slice(8))))if(d>=start)out.push(d);return out;}
function duePayments(d,start,end){const schedules=d.installments||[{amount:d.payment,frequency:d.frequency,nextDue:d.nextDue}];return schedules.flatMap(x=>occurrences(x,start,end).map(on=>({date:on,amount:x.amount}))).sort((a,b)=>a.date.localeCompare(b.date));}
// Calendar rules are payer-entered. No regional holiday dates are assumed.
function validatePayRule(s){
 if(s.monthDay!==undefined&&(!Number.isInteger(s.monthDay)||s.monthDay<0||s.monthDay>31))throw Error('Invalid monthly pay date');
 if(s.monthDays!==undefined&&(!Array.isArray(s.monthDays)||s.monthDays.length!==2||s.monthDays.some(n=>!Number.isInteger(n)||n<0||n>31)||s.monthDays[0]===s.monthDays[1]))throw Error('Choose two different monthly pay dates');
 if(s.mode==='monthlyweekday'&&(![1,2,3,4,-1].includes(s.ordinal)||!Number.isInteger(s.weekday)||s.weekday<0||s.weekday>6))throw Error('Choose a weekday rule');
 if(s.mode==='monthbusiness'&&(!Number.isInteger(s.businessCount)||s.businessCount<1||s.businessCount>20))throw Error('Choose a business-day count from 1 to 20');
 if(s.adjustment!==undefined&&!['none','earlier','later'].includes(s.adjustment))throw Error('Invalid non-pay-day handling');
 if(s.holidays!==undefined){if(!Array.isArray(s.holidays)||s.holidays.length>100)throw Error('Too many non-pay dates');s.holidays.forEach(date);}
 if(s.overrides!==undefined){if(!Array.isArray(s.overrides)||s.overrides.length>100)throw Error('Too many date overrides');const seen=new Set();for(const x of s.overrides){date(x.scheduled);date(x.actual);if(x.scheduled<s.anchor||seen.has(x.scheduled))throw Error('Date overrides must be unique and on or after the schedule start');seen.add(x.scheduled);}}
}
function adjustedPayday(s,on){
 const override=s.overrides?.find(x=>x.scheduled===on);if(override)return override.actual;
 if(!s.adjustment||s.adjustment==='none')return on;
 for(let i=0;i<370;i++){const day=new Date(date(on)).getUTCDay();if(day!==0&&day!==6&&!s.holidays?.includes(on))return on;on=add(on,s.adjustment==='earlier'?-1:1);}throw Error('Unable to adjust payday');
}
function nextPayday(schedule,from,inclusive=true){
 date(from);date(schedule.anchor);validatePayRule(schedule);
 if((!schedule.mode||schedule.mode==='interval')&&(!schedule.adjustment||schedule.adjustment==='none')&&!schedule.overrides?.length){const n=Math.max(0,Math.ceil((date(from)-date(schedule.anchor))/(DAY*schedule.days)));const on=add(schedule.anchor,n*schedule.days);return !inclusive&&on===from?add(on,schedule.days):on;}
 const eligible=d=>d>from||(inclusive&&d===from),candidates=[];
 const take=on=>{if(on>=schedule.anchor){const actual=adjustedPayday(schedule,on);if(eligible(actual))candidates.push(actual);}};
 // Include explicit moves even when their original date lies outside the search window.
 for(const x of schedule.overrides||[])if(eligible(x.actual))candidates.push(x.actual);
 if(schedule.mode==='once')take(schedule.anchor);
 else {
  const base=from>schedule.anchor?from:schedule.anchor,start=add(base,-370),end=add(base,740);
  if(!schedule.mode||schedule.mode==='interval'){
   const n=Math.max(0,Math.ceil((date(start)-date(schedule.anchor))/(DAY*schedule.days)));
   for(let on=add(schedule.anchor,n*schedule.days);on<=end;on=add(on,schedule.days))take(on);
  }else {
   const cursor=new Date(date(start));cursor.setUTCDate(1);
   for(let i=0;i<40;i++){
    const year=cursor.getUTCFullYear(),month=cursor.getUTCMonth(),last=new Date(Date.UTC(year,month+1,0)).getUTCDate();
    const iso=day=>new Date(Date.UTC(year,month,day)).toISOString().slice(0,10);
    if(schedule.mode==='monthbusiness'){
     let remaining=schedule.businessCount;for(let day=last;day>=1;day--){const on=iso(day),weekday=new Date(date(on)).getUTCDay();if(weekday!==0&&weekday!==6&&!schedule.holidays?.includes(on)&&--remaining===0){take(on);break;}}
    }else if(schedule.mode==='monthlyweekday'){
     const day=schedule.ordinal===-1?last-(new Date(Date.UTC(year,month,last)).getUTCDay()-schedule.weekday+7)%7:1+(schedule.weekday-new Date(Date.UTC(year,month,1)).getUTCDay()+7)%7+7*(schedule.ordinal-1);take(iso(day));
    }else for(const day of schedule.mode==='semimonthly'?(schedule.monthDays||[1,16]):[schedule.monthDay??Number(schedule.anchor.slice(8))])take(iso(day===0?last:Math.min(day,last)));
    cursor.setUTCMonth(month+1);if(cursor.getTime()>date(end))break;
   }
  }
 }
 return candidates.sort()[0]||null;
}
function debtDeadlines(d,events,on){
 let paid=events.filter(e=>e.debtId===d.id&&e.type==='payment'&&!e.voided&&e.date<=on&&e.date>=(d.deadlineAsOf||d.asOf)&&!d.deadlinePaymentIds?.includes(e.id)).reduce((n,e)=>n+e.amount,0),available=balance(d,events,on).amount;
 return [...(d.deadlines||[])].sort((a,b)=>a.due.localeCompare(b.due)).map(x=>{const applied=Math.min(paid,x.amount);paid-=applied;const remaining=Math.min(available,x.amount-applied);available-=remaining;return {...x,remaining};}).filter(x=>x.remaining>0);
}
function prioritizedDebts(s,on){
 return s.debts.map(debt=>({debt,...balance(debt,s.events,on),milestone:debtDeadlines(debt,s.events,on)[0]})).filter(x=>x.amount>0).sort((a,b)=>{
  if(a.milestone||b.milestone){if(!a.milestone)return 1;if(!b.milestone)return -1;const order=a.milestone.due.localeCompare(b.milestone.due);if(order)return order;}
  return s.strategy==='snowball'?a.amount-b.amount||b.debt.apr-a.debt.apr:b.debt.apr-a.debt.apr||a.amount-b.amount;
 });
}
function focusTarget(s,on){
 const active=prioritizedDebts(s,on);return active[0]?.milestone?active[0]:active.find(x=>x.debt.id===s.focusDebtId)||active[0]||null;
}
function deadlinePace(s,milestone,on){
 const dates=new Set([on]);for(const source of incomeSources(s).filter(x=>x.active)){let cursor=on;for(let i=0;i<20000;i++){const next=nextPayday(source,cursor,false);if(!next||next>milestone.due)break;dates.add(next);cursor=next;}}
 return {paydays:dates.size,amount:Math.ceil(milestone.remaining/dates.size),overdue:milestone.due<on};
}
function incomeSources(s){return s.incomeSources!==undefined?s.incomeSources:s.schedule.anchor?[{...s.schedule,id:'legacy',name:'Household pay',mode:s.schedule.mode||'interval',active:true,expected:0}]:[];}
function upcomingPaydays(s,from,count=8){date(from);const rows=[];for(const source of incomeSources(s).filter(x=>x.active)){let cursor=from,added=0;for(let i=0;i<count+s.paydays.length+1&&added<count;i++){const on=nextPayday(source,cursor,i===0);if(!on)break;if(!s.paydays.some(p=>(p.sourceId||'legacy')===source.id&&p.date===on)){rows.push({date:on,sourceId:source.id,name:source.name,expected:source.expected});added++;}cursor=on;}}return rows.sort((a,b)=>a.date.localeCompare(b.date)||a.name.localeCompare(b.name)).slice(0,count);}
function nextHouseholdPayday(s,on){return upcomingPaydays(s,add(on,1),1)[0]?.date||null;}
function recordPay(s,pay){date(pay.date);if(typeof pay.id!=='string'||!cents(pay.amount))throw Error('Invalid take-home pay');const source=incomeSources(s).find(x=>x.id===pay.sourceId&&x.active);if(!source)throw Error('Choose an active income source');if(s.paydays.some(p=>p.id===pay.id))return s;if(s.paydays.some(p=>(p.sourceId||'legacy')===source.id&&p.date===pay.date))throw Error('Pay is already recorded for this source and date');return {...s,paydays:[...s.paydays,{id:pay.id,sourceId:source.id,sourceName:source.name,date:pay.date,amount:pay.amount,...(pay.through?{through:pay.through}:{})}]};}
function balance(debt,events,through){date(through);if(through<debt.asOf)throw Error('Date predates opening balance');let amount=debt.opening,at=debt.asOf,interest=0,confirmed=null,apr=debt.initialApr??debt.apr;
 const ordered=[...events,...(debt.rates||[]).map(r=>({...r,type:'rate',debtId:debt.id}))].filter(e=>!e.voided&&e.debtId===debt.id&&e.date>=at&&e.date<=through).map((e,i)=>({...e,order:i})).sort((a,b)=>a.date.localeCompare(b.date)||a.order-b.order);
 for(const e of [...ordered,{date:through,type:'end'}]){const accrued=Math.round(amount*apr/100*(date(e.date)-date(at))/DAY/365);amount+=accrued;interest+=accrued;at=e.date;if(e.type==='rate')apr=e.apr;if(e.type==='payment'&&!e.voided)amount=Math.max(0,amount-e.amount);if(e.type==='reconcile'){amount=e.amount;confirmed={date:e.date,amount:e.amount};}}
 return {amount,interest,confirmed};
}
function payment(s,id,amount,on,eventId){const d=s.debts.find(d=>d.id===id);if(!d||!cents(amount)||amount===0)throw Error('Enter a positive payment');date(on);if(s.events.some(e=>e.id===eventId))return s;if(amount>balance(d,s.events,on).amount)throw Error('Payment exceeds projected balance. Reconcile first if needed.');return {...s,events:[...s.events,{id:eventId,debtId:id,type:'payment',amount,date:on}]};}
function forecast(d,events,from,payUses=[]){let value=balance(d,events,from).amount;if(value===0)return {date:from,months:0};if(!d.payment)return {date:null,reason:'Set a scheduled payment'};let at=from;let count=0;const dates=duePayments(d,from,add(from,365*50));for(const due of dates){const on=due.date;value+=Math.round(value*d.apr/100*(date(on)-date(at))/DAY/365);const recorded=scheduledPaid({events,payUses},d.id,on,from);value=Math.max(0,value-Math.max(0,due.amount-recorded));at=on;count++;if(value===0)return {date:on,payments:count};}return {date:null,reason:'No payoff within 50 years; increase payment'};}
function allocation(s,amount,on,through){if(!cents(amount))throw Error('Invalid take-home pay');const end=through||nextHouseholdPayday(s,on);if(!end)throw Error('Set a future household payday or choose a planning end date');date(end);if(end<=on)throw Error('Planning end date must be after the pay date');let left=amount;const rows=[];const obligations=[];
 for(const b of s.bills)for(const due of occurrences(b,on,end))obligations.push({id:b.id,name:b.name,due,amount:b.amount,kind:'budget'});
 for(const d of s.debts){let remaining=balance(d,s.events,on).amount;for(const installment of duePayments(d,on,end)){const due=installment.date;const paid=s.events.filter(e=>e.type==='payment'&&!e.voided&&e.debtId===d.id&&e.date===due).reduce((n,e)=>n+e.amount,0);const needed=Math.min(remaining,Math.max(0,installment.amount-paid));remaining-=needed;if(needed)obligations.push({id:d.id,name:d.name,due,amount:needed,kind:'debt'});}}
 obligations.sort((a,b)=>a.due.localeCompare(b.due)||(a.kind==='budget'?-1:1));let shortfall=0;
 for(const o of obligations){const allocated=Math.min(left,o.amount);left-=allocated;shortfall+=o.amount-allocated;rows.push({...o,allocated});}
 const remaining=new Map(),reserved=new Map();for(const d of s.debts){const amount=rows.filter(r=>r.id===d.id).reduce((n,r)=>n+r.allocated,0);reserved.set(d.id,amount);remaining.set(d.id,Math.max(0,balance(d,s.events,on).amount-amount));}
 const milestones=s.debts.flatMap(d=>debtDeadlines(d,s.events,on).map(x=>{const already=Math.min(reserved.get(d.id),x.remaining);reserved.set(d.id,reserved.get(d.id)-already);return {...x,debt:d,needed:x.remaining-already};})).sort((a,b)=>a.due.localeCompare(b.due));
 function extra(d,needed,label){const amount=Math.min(left,remaining.get(d.id),needed);if(amount){rows.push({id:d.id,name:d.name+' · '+label,kind:'extra',amount,allocated:amount,due:on});left-=amount;remaining.set(d.id,remaining.get(d.id)-amount);}}
 for(const x of milestones)extra(x.debt,x.needed,x.label+' · deadline '+x.due);
 const targets=[...s.debts].sort((a,b)=>s.strategy==='snowball'?balance(a,s.events,on).amount-balance(b,s.events,on).amount:b.apr-a.apr);for(const target of targets)extra(target,remaining.get(target.id),'extra');

 return {rows,left,shortfall,end};
}
function cfoBrief(s,on){
 date(on);const end=add(on,30),income=incomeSources(s).filter(x=>x.active).flatMap(source=>upcomingPaydays({...s,incomeSources:[source]},on,32)).filter(p=>p.date<end).sort((a,b)=>a.date.localeCompare(b.date)),obligations=[];
 for(const b of s.bills)for(const due of occurrences(b,on,end)){const amount=Math.max(0,b.amount-billFunded(s,b.id,due,on,true));if(amount)obligations.push({name:b.name,date:due,amount,kind:'budget'});}
 for(const d of s.debts){let remaining=balance(d,s.events,on).amount;for(const due of duePayments(d,on,end)){const paid=scheduledPaid(s,d.id,due.date,on),amount=Math.min(remaining,Math.max(0,due.amount-paid));remaining-=amount;if(amount)obligations.push({name:d.name,date:due.date,amount,kind:'debt'});}}
 obligations.sort((a,b)=>a.date.localeCompare(b.date)||a.name.localeCompare(b.name));
 const deadlines=s.debts.flatMap(d=>debtDeadlines(d,s.events,on).map(x=>({...x,debtId:d.id,debtName:d.name}))).sort((a,b)=>a.due.localeCompare(b.due));
 const issues=[];
 if(!income.length)issues.push({action:'paydays',text:'No upcoming household income is scheduled in the next 30 days.'});
 const missing=income.filter(x=>!x.expected);if(missing.length)issues.push({action:'paydays',text:'Expected amounts are missing for '+new Set(missing.map(x=>x.sourceId)).size+' scheduled income source(s).'});
 if(!s.bills.length)issues.push({action:'budget',text:'Living costs and obligations have not been added to this Finance ledger.'});
 for(const d of s.debts){const b=balance(d,s.events,on);if(!b.amount)continue;if(!d.payment)issues.push({action:'debt',debtId:d.id,text:d.name+': no recurring payment is configured.'});if(!b.confirmed)issues.push({action:'reconcile',debtId:d.id,text:d.name+': balance has not been lender-confirmed.'});else if(date(on)-date(b.confirmed.date)>35*DAY)issues.push({action:'reconcile',debtId:d.id,text:d.name+': latest lender-confirmed balance is over 35 days old.'});}
 for(const x of deadlines)if(x.due<on)issues.push({action:'milestones',debtId:x.debtId,text:x.debtName+' · '+x.label+': payoff deadline has passed.'});
 const knownIncome=income.reduce((n,x)=>n+(x.expected||0),0),scheduledOut=obligations.reduce((n,x)=>n+x.amount,0),complete=income.length>0&&missing.length===0&&s.bills.length>0;
 if(complete&&knownIncome<scheduledOut)issues.unshift({action:'paydays',text:'Scheduled obligations exceed expected income in this 30-day window. Review timing and available cash.'});
 return {on,end,income,obligations,deadlines,issues,knownIncome,scheduledOut,complete,plannedDifference:complete?knownIncome-scheduledOut:null,reviewDue:!s.cfoReview||date(on)-date(s.cfoReview.date)>=7*DAY};
}

function mergeSetup(s,setup,mapping,on){
 date(on);if(!setup||setup.type!=='life-hub-finance-setup'||setup.version!==1||!Array.isArray(setup.sources)||setup.sources.length>30||!Array.isArray(setup.accounts)||setup.accounts.length>30||mapping.sources.length!==setup.sources.length||mapping.accounts.length!==setup.accounts.length)throw Error('Invalid private Finance setup');
 validate({...empty(),incomeSources:setup.sources.map(x=>({...x,active:true,expected:x.expected??0}))});
 const next=JSON.parse(JSON.stringify(s)),sources=incomeSources(next).map(x=>({...x})),usedSources=new Set(),usedDebts=new Set();
 setup.sources.forEach((input,i)=>{const selected=mapping.sources[i];if(selected==='skip')return;const existing=sources.find(x=>x.id===selected);if(selected!=='new'&&!existing)throw Error('Choose an income source to update');if(usedSources.has(selected)&&selected!=='new')throw Error('Map each existing income source only once');usedSources.add(selected);const row={...input,id:existing?.id||input.id,active:existing?.active??true,expected:input.expected??existing?.expected??0};const index=sources.findIndex(x=>x.id===row.id);if(index>=0)sources[index]=row;else sources.push(row);});
 if(new Set(sources.map(x=>key(x.name))).size!==sources.length)throw Error('An income source with this name already exists. Choose it in the review instead of adding a duplicate.');next.incomeSources=sources;
 setup.accounts.forEach((input,i)=>{const selected=mapping.accounts[i];if(selected==='skip')return;const debt=next.debts.find(x=>x.id===selected);if(!debt)throw Error('Choose the existing debt for each milestone group');if(usedDebts.has(selected))throw Error('Map each debt only once');usedDebts.add(selected);if(!Array.isArray(input.deadlines)||input.deadlines.reduce((n,x)=>n+x.amount,0)>balance(debt,next.events,on).amount)throw Error('Milestones exceed the selected account balance. Confirm or reconcile that debt first.');debt.deadlines=input.deadlines.map(x=>({...x}));debt.deadlineAsOf=on;debt.deadlinePaymentIds=next.events.filter(e=>e.debtId===debt.id&&e.type==='payment'&&!e.voided&&e.date<=on).map(e=>e.id);});
 return validate(next);
}

function importRows(rows,map,kind,asOf){date(asOf);const seen=new Set();return rows.filter(r=>String(r[map.name]??'').trim()).map(r=>{const name=String(r[map.name]).trim(),id=key(name);if(seen.has(id))throw Error('Duplicate account/category: '+name);seen.add(id);const frequency=String(r[map.frequency]||'monthly').trim().toLowerCase();if(!['monthly','weekly','biweekly'].includes(frequency))throw Error('Frequency must be monthly, weekly or biweekly');const nextDue=String(r[map.nextDue]||asOf).trim();date(nextDue);if(kind==='budget')return {id,name,amount:money(r[map.amount]),frequency,nextDue};
 const raw=String(r[map.apr]??'').trim();if(!raw)throw Error('Interest rate is required, including 0');const apr=Number(raw.replace('%',''))*(map.fractionRate&&!raw.includes('%')?100:1);if(!Number.isFinite(apr)||apr<0||apr>100)throw Error('Invalid interest rate');return {id,name,opening:/\bvisa\b/i.test(name)?0:money(r[map.balance]),apr,payment:money(r[map.payment]),asOf,nextDue,frequency};});}
function merge(s,rows,kind,hash,effectiveOn){if(s.imports.includes(hash))throw Error('This import has already been applied');const field=kind==='budget'?'bills':'debts';const items=[...s[field]];for(const row of rows){const i=items.findIndex(d=>key(d.name)===key(row.name));if(i<0)items.push(row);else if(kind==='budget')items[i]={...items[i],...row,id:items[i].id};else {const old=items[i];const rates=[...(old.rates||[])];if(old.apr!==row.apr)rates.push({date:effectiveOn||row.asOf,apr:row.apr});items[i]={...old,initialApr:old.initialApr??old.apr,rates,installments:row.installments,apr:row.apr,payment:row.payment,frequency:row.frequency,nextDue:row.nextDue};}}return validate({...s,[field]:items,imports:[...s.imports,hash]});}
const api={debtRecommendation,payUses,paycheckRemaining,goalBalance,currentPlan,recordPayUse,releasePayUse,reversePayUse,markBudgetPaid,billFunded,scheduledPaid,revisePay,payPeriod,paycheckPlan,scenarioInput,decisionInput,date,add,money,key,empty,validate,next,occurrences,duePayments,validatePayRule,adjustedPayday,nextPayday,debtDeadlines,prioritizedDebts,focusTarget,deadlinePace,incomeSources,upcomingPaydays,nextHouseholdPayday,recordPay,balance,payment,forecast,allocation,cfoBrief,mergeSetup,importRows,merge};if(typeof module!=='undefined')module.exports=api;else root.Finance=api;
})(typeof globalThis!=='undefined'?globalThis:this);
