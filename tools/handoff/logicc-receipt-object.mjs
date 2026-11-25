import { DurableObject } from 'cloudflare:workers';
import { createReceiptLedger } from './logicc-receipt-store.mjs';

export class LogiccReceiptLedger extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.ledger = createReceiptLedger(ctx.storage.sql);
  }

  claim(receipt) {
    return this.ledger.claim(receipt);
  }
}
