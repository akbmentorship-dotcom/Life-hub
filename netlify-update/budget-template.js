/* Structural adapter for split-month Balance Sheet / Action Plan workbooks.
   No personal figures are bundled. Values are read from the selected file. */
(function(root){
'use strict';
function detect(sheets){return sheets.some(s=>s.name==='Balance Sheet')&&sheets.some(s=>s.name==='Action Plan');}
function prepare(sheets,asOf,visaName){const F=root.Finance,bs=sheets.find(s=>s.name==='Balance Sheet'),ap=sheets.find(s=>s.name==='Action Plan');if(!bs||!ap)throw Error('Missing budget worksheets');F.date(asOf);if(!visaName)throw Error('Select which account is Visa');const at=(s,row,col)=>s.rows[row-1]?.[col-1]??'';
 const amount=(s,r,c)=>F.money(at(s,r,c)||'0');const name=(s,r,c)=>String(at(s,r,c)).trim();const month=asOf.slice(0,7);const debts=[],bills=[];
 function parts(first,second){return [{amount:first,frequency:'monthly',nextDue:month+'-01'},{amount:second,frequency:'monthly',nextDue:month+'-16'}].filter(p=>p.amount>0);}
 function debt(n,opening,apr,first,second){if(!n)throw Error('Missing creditor name');const payment=first+second,installments=parts(first,second);if(n===visaName||/\bvisa\b/i.test(n)){n='Visa';opening=0;}if(!opening&&!payment&&n!=='Visa')return;debts.push({id:F.key(n),name:n,opening,apr,payment,frequency:'monthly',nextDue:installments[0]?.nextDue||month+'-01',asOf,...(installments.length?{installments}:{})});}
 for(let row=14;row<=23;row++){const n=name(ap,row,2);const rate=Number(at(ap,row,4));if(!Number.isFinite(rate))throw Error('Missing numeric interest rate');debt(n,amount(ap,row,3),rate*100,amount(bs,row+12,3),amount(bs,row+12,4));}
 const mortgageRow=Array.from({length:18},(_,i)=>i+6).find(r=>/mortgage/i.test(name(bs,r,2)));if(mortgageRow)debt('Mortgage',amount(bs,6,16),Number(at(bs,6,17))*100,amount(bs,mortgageRow,3),amount(bs,mortgageRow,4));
 if(visaName==='separate'&&!debts.some(d=>d.name==='Visa'))debt('Visa',0,0,0,0);
 function budget(row,labelCol,firstCol,secondCol,fallback){const n=name(bs,row,labelCol)||fallback;if(!n)return;const first=amount(bs,row,firstCol),second=amount(bs,row,secondCol);for(const [part,value] of [[1,first],[16,second]])if(value){const label=(n==='(Name)'?fallback:n)+(part===1?' · first half':' · second half');bills.push({id:F.key(label),name:label,amount:value,frequency:'monthly',nextDue:month+'-'+String(part).padStart(2,'0')});}}
 for(let r=6;r<=23;r++)if(r!==mortgageRow)budget(r,2,3,4,'Fixed expense '+r);
 for(let r=6;r<=19;r++)budget(r,6,7,8,'Variable expense '+r);
 for(let r=22;r<=33;r++)budget(r,6,7,8,'Savings / insurance '+r);
 for(let r=38;r<=40;r++)budget(r,2,3,4,'Business expense '+(r-37));
 const names=new Set();for(const b of bills){if(names.has(b.id))throw Error('Duplicate funded budget category: '+b.name);names.add(b.id);}
 const baselineIncome=[{half:1,amount:amount(bs,2,7)+amount(bs,3,7)},{half:2,amount:amount(bs,2,8)+amount(bs,3,8)}];
 return {debts,bills,baselineIncome,strategy:Number(at(ap,26,3))===1?'snowball':'avalanche'};
}
root.FinanceTemplate={detect,prepare};
})(globalThis);
