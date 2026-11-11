/* Read-only household scenarios. No forecasts are written as transactions. */
(function(root){
'use strict';
const F=typeof module!=='undefined'?require('./budget-engine.js'):root.Finance;
const DAY=86400000;
function simulate(state,input,on,changed=false){
 F.scenarioInput(input);F.date(on);if(input.oneOffCost&&!input.goalTarget)throw Error('Enter a savings goal to model a withdrawal');
 if(input.startDate<on)throw Error('Choose today or a future decision start date');
 const horizon=F.add(on,365*50);if(input.startDate>=horizon)throw Error('Decision start must be within 50 years');const monthly=input.monthlySurplus+(changed?input.incomeDelta-input.spendingDelta:0);

 const debts=state.debts.map(d=>({id:d.id,name:d.name,apr:d.apr,value:F.balance(d,state.events,on).amount,at:on,interest:0,paidOn:null}));
 for(const d of debts)if(d.value===0)d.paidOn=on;
 let savings=Math.min(input.goalSaved,input.goalTarget),savingsDate=input.goalTarget&&savings>=input.goalTarget?on:null;
 const snapshots=()=>debts.map(d=>({id:d.id,name:d.name,date:d.paidOn}));
 if(monthly<0)return {debts:snapshots(),debtFreeDate:debts.every(d=>d.value===0)?on:null,savingsDate,interest:null,shortfall:-monthly,shortfallPeriod:'monthly',horizon};
 const events=[];
 for(const debt of state.debts)for(const due of F.duePayments(debt,on,horizon)){
  const recorded=state.events.filter(e=>e.debtId===debt.id&&e.type==='payment'&&e.date===due.date).reduce((n,e)=>n+e.amount,0);
  const amount=Math.max(0,due.amount-recorded);if(amount)events.push({date:due.date,type:'minimum',debtId:debt.id,amount});
 }
 let tick=on;
 for(let i=0;i<601&&tick<horizon;i++,tick=F.next(tick,'monthly',Number(on.slice(8))))events.push({date:tick,type:'monthly'});
 if(changed)events.push({date:input.startDate,type:'oneoff'});
 const order={minimum:0,oneoff:1,monthly:2};events.sort((a,b)=>a.date.localeCompare(b.date)||order[a.type]-order[b.type]);
 function current(d,date){return d.value+Math.round(d.value*d.apr/100*(F.date(date)-F.date(d.at))/DAY/365);}
 function pay(d,amount,date){if(d.value===0)return 0;const owed=current(d,date),interest=owed-d.value;d.interest+=interest;d.at=date;const paid=Math.min(amount,owed);d.value=owed-paid;if(!d.value)d.paidOn=date;return paid;}
 function fundGoal(amount,date){if(!input.goalTarget)return;const applied=Math.min(amount,Math.max(0,input.goalTarget-savings));savings+=applied;if(savings>=input.goalTarget&&!savingsDate)savingsDate=date;}
 function extra(amount,date){const targets=debts.filter(d=>d.value>0).sort((a,b)=>(changed&&date>=input.startDate?input.newStrategy:state.strategy)==='snowball'?current(a,date)-current(b,date):b.apr-a.apr);for(const debt of targets){if(!amount)break;amount-=pay(debt,amount,date);}return amount;}
 for(const event of events){
  if(event.type==='minimum'){
   const debt=debts.find(d=>d.id===event.debtId),paid=pay(debt,event.amount,event.date);
   // Freed scheduled payments roll forward only once the decision starts.
   fundGoal(extra(event.amount-paid,event.date),event.date);
  }
  if(event.type==='oneoff'){fundGoal(extra(input.oneOffDebt,event.date)+input.oneOffSavings,event.date);if(input.oneOffCost>savings)return {debts:snapshots(),debtFreeDate:debts.every(d=>d.value===0)?debts.reduce((d,x)=>x.paidOn>d?x.paidOn:d,on):null,savingsDate:null,interest:null,shortfall:input.oneOffCost-savings,shortfallPeriod:'one-time',horizon};savings-=input.oneOffCost;if(input.goalTarget&&savings<input.goalTarget)savingsDate=null;}
  if(event.type==='monthly'){
   const applies=changed&&event.date>=input.startDate;const pool=applies?monthly:input.monthlySurplus;const split=(applies?input.newDebtShare:input.debtShare)/100;
   const debtAmount=Math.round(pool*split),leftover=extra(debtAmount,event.date);
   fundGoal(pool-debtAmount+leftover,event.date);
  }
  if(debts.every(d=>d.value===0)&&(!input.goalTarget||savingsDate)&&(!changed||event.date>=input.startDate))break;
 }
 const allPaid=debts.every(d=>d.value===0),debtFreeDate=allPaid?debts.reduce((latest,d)=>d.paidOn>latest?d.paidOn:latest,on):null;
 return {debts:snapshots(),debtFreeDate,savingsDate,shortfall:0,horizon,interest:debts.reduce((n,d)=>n+d.interest+(d.value?current(d,horizon)-d.value:0),0),interestComplete:allPaid};
}
function compare(state,input,on){return {baseline:simulate(state,input,on),scenario:simulate(state,input,on,true)};}
const api={simulate,compare};if(typeof module!=='undefined')module.exports=api;else root.FinanceScenarios=api;
})(globalThis);
