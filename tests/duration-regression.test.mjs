import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveDuration, planParts, clipTimingArgs } from '../src/export-planner.js';

test('decoder duration overrides stale browser metadata', () => {
  assert.equal(resolveDuration(120, 'Duration: 00:01:00.00, start: 0.000000'), 60);
});
test('duration fallback and limits are validated after probing', () => {
  assert.equal(resolveDuration(60, 'Duration: N/A'), 60);
  for (const d of [NaN, Infinity, 0, -1, 181]) assert.throws(() => resolveDuration(d, ''));
});
test('60 seconds has consecutive, fixed 30-second output bounds', () => {
  assert.deepEqual(planParts(60), [{index:0,start:0,length:30},{index:1,start:30,length:30}]);
  assert.deepEqual(clipTimingArgs(planParts(60)[1]), ['-t','30']);
});
test('fractional tails remain covered and no part exceeds 30 seconds', () => {
  for (const duration of [0.01, 29.9, 30, 30.01, 59.99, 60, 60.01, 61, 180]) {
    const parts=planParts(duration);
    assert.equal(parts[0].start,0);
    for (const p of parts) assert.ok(p.length>0 && p.length<=30);
    assert.ok(Math.abs(parts.reduce((n,p)=>n+p.length,0)-duration)<1e-6);
  }
});

test('video duration prevents an extra part from padded audio', () => {
  assert.equal(resolveDuration(60.2, 'Duration: 00:01:00.20', 60), 60);
  assert.equal(planParts(resolveDuration(60.2, 'Duration: 00:01:00.20', 60)).length, 2);
});
