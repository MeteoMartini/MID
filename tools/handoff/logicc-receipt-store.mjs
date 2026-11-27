const receiptPattern = /^[a-f0-9]{64}$/;

function validateReceipt(receipt) {
  if (typeof receipt !== 'string' || !receiptPattern.test(receipt)) {
    throw new TypeError('Invalid Logicc receipt');
  }
}

// The caller supplies the private SQLite Durable Object's sql storage.
export function createReceiptLedger(sql) {
  sql.exec('CREATE TABLE IF NOT EXISTS receipts (digest TEXT PRIMARY KEY) WITHOUT ROWID');
  return {
    claim(receipt) {
      validateReceipt(receipt);
      const rows = Array.from(sql.exec(
        'INSERT INTO receipts(digest) VALUES (?) ON CONFLICT(digest) DO NOTHING RETURNING digest',
        receipt,
      ));
      if (rows.length === 0) return 'existing';
      if (rows.length === 1 && rows[0].digest === receipt) return 'claimed';
      throw new Error('Unexpected Logicc receipt storage response');
    },
  };
}

// The object has no public route. Names are deterministic so retries go to
// the same shard. No deletion or timeout may reopen a receipt.
export function bindReceiptReservation(namespace) {
  if (!namespace || typeof namespace.getByName !== 'function') {
    throw new TypeError('Logicc receipt namespace is unavailable');
  }
  return async receipt => {
    validateReceipt(receipt);
    const stub = namespace.getByName('logicc-receipts-v1-' + receipt.slice(0, 2));
    const result = await stub.claim(receipt);
    if (result !== 'claimed' && result !== 'existing') {
      throw new Error('Unverified Logicc receipt claim');
    }
    return result;
  };
}
