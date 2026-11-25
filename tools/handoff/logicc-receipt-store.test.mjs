import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { bindReceiptReservation, createReceiptLedger } from './logicc-receipt-store.mjs';

function ledger(db) {
  return createReceiptLedger({
    exec(query, ...args) {
      const statement = db.prepare(query);
      return args.length ? statement.all(...args) : [statement.run()];
    },
  });
}

test('a committed claim survives a second connection and database reopen', () => {
  const dir = mkdtempSync(join(tmpdir(), 'logicc-receipts-'));
  try {
    const path = join(dir, 'ledger.sqlite');
    const digest = 'a'.repeat(64);
    const first = new DatabaseSync(path);
    const second = new DatabaseSync(path);
    assert.equal(ledger(first).claim(digest), 'claimed');
    assert.equal(ledger(second).claim(digest), 'existing');
    first.close();
    second.close();
    const reopened = new DatabaseSync(path);
    assert.equal(ledger(reopened).claim(digest), 'existing');
    reopened.close();
  } finally {
    rmSync(dir, {recursive: true, force: true});
  }
});

test('binding uses deterministic shard and fails closed on ambiguous responses', async () => {
  const digest = 'b'.repeat(64);
  const reserve = bindReceiptReservation({getByName(name) {
    assert.equal(name, 'logicc-receipts-v1-bb');
    return {claim: async value => {
      assert.equal(value, digest);
      return null;
    }};
  }});
  await assert.rejects(reserve(digest), /Unverified/);
  await assert.rejects(reserve('bad'), /Invalid/);
  assert.throws(() => bindReceiptReservation(null), /unavailable/);
});
