import test from 'node:test';
import assert from 'node:assert/strict';
import {planParts,allClipsSafe,SAFE_BYTES} from '../src/export-planner.js';
test('30-second clip is one part',()=>assert.equal(planParts(30).length,1));
test('60-second clip creates exactly 2 parts',()=>assert.deepEqual(planParts(60).map(p=>p.length),[30,30]));
test('61 seconds creates 30+30+1',()=>assert.deepEqual(planParts(61).map(p=>p.length),[30,30,1]));
test('all parts must meet safety budget',()=>{
 assert.equal(allClipsSafe([{data:{byteLength:SAFE_BYTES}}]),true);
 assert.equal(allClipsSafe([{data:{byteLength:SAFE_BYTES+1}}]),false);
});
