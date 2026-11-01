/**
 * Black-box checks for session progress round-tripping.
 * Run: npx tsx scripts/test-session-codec.ts
 *
 * Covers the crash "d.values is not a function": a saved Map must come back as
 * a real Map, and a value corrupted into a plain object must fall back to the
 * caller's default instead of being handed to the screen.
 */
import { toStorable, fromStorable } from '../src/utils/sessionCodec';

let failed = 0;

function check(name: string, cond: boolean): void {
  if (cond) {
    console.log('  ok  ', name);
  } else {
    failed += 1;
    console.error('  FAIL', name);
  }
}

// What IndexedDB's structured clone and JSON.stringify both do to a Map.
function throughJSON(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value));
}

const results = new Map<string, boolean>([['你好', true], ['爱', false]]);

const stored = toStorable(results);
check('a Map stores as a tagged object, not a Map', !(stored instanceof Map));
check('the tagged form survives JSON', throughJSON(stored) !== undefined);

const restored = fromStorable(throughJSON(stored), new Map<string, boolean>());
check('restored value is a Map', restored instanceof Map);
check('restored Map has .values()', typeof (restored as Map<string, boolean>).values === 'function');
check('entries survive the round trip', (restored as Map<string, boolean>).get('你好') === true);
check('entry count matches', (restored as Map<string, boolean>).size === 2);

const seen = new Set<string>(['你好', '爱']);
const restoredSet = fromStorable(throughJSON(toStorable(seen)), new Set<string>());
check('a Set comes back as a Set', restoredSet instanceof Set);
check('Set entries survive', (restoredSet as Set<string>).has('爱'));

// The corrupted shapes that crashed the screen.
const fallback = new Map<string, boolean>();
const fromEmpty = fromStorable({}, fallback);
check('an empty object falls back to the default Map', fromEmpty instanceof Map && fromEmpty.size === 0);
check('the fallback is the same instance', fromEmpty === fallback);

const fromMissing = fromStorable({ dataType: 'Map' }, fallback);
check('a tagged object with no entries falls back', fromMissing === fallback);

const fromNull = fromStorable(null, fallback);
check('null falls back to the default', fromNull === fallback);

// A plain value that is not a collection passes through unchanged.
check('a number passes through', fromStorable(3, 0) === 3);

console.log(failed === 0 ? '\nAll checks passed.' : `\n${failed} check(s) failed.`);
process.exit(failed === 0 ? 0 : 1);
