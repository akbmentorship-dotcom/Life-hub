const assert=require('node:assert/strict'),V=require('../budget-voice.js');
assert.deepEqual(V.parse('Hey LifeHub, Kyra’s pay was $1,840.50'),{kind:'pay',name:'Kyra',amount:184050});
assert.deepEqual(V.parse('We paid 300 toward the HELOC'),{kind:'payment',name:'HELOC',amount:30000});
assert.deepEqual(V.parse('What would spending 500 do to our plan?'),{kind:'purchase',amount:50000});
assert.deepEqual(V.parse('Show our next focus'),{kind:'focus'});
for(const text of ['pay everything','We paid -50 toward HELOC','We paid 300 toward HELOC yesterday','Kyra’s pay was 1840 tomorrow'])assert.equal(V.parse(text)?.kind==='pay'||V.parse(text)?.kind==='purchase',false);
assert.equal(V.parse('transfer all money'),null);assert.throws(()=>V.parse('My pay was 0'),/positive/);assert.throws(()=>V.parse('My pay was 1,84'),/amount/);console.log('PASS: explicit voice intents, amounts, unsupported commands and dates');
