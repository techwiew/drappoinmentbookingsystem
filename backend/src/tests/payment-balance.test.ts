import { describe, expect, it } from 'vitest';
import { calculatePaymentBalance } from '../modules/billing/payment-balance.js';

describe('payment balances', () => {
  it('keeps a balance when the patient pays less than the fee', () => {
    expect(calculatePaymentBalance(500, 200)).toEqual({
      totalAmount: 500,
      paidAmount: 200,
      pendingAmount: 300,
      excessAmount: 0,
      paymentStatus: 'PARTIALLY_PAID',
    });
  });

  it('records excess received without changing the consultation fee', () => {
    expect(calculatePaymentBalance(500, 650)).toEqual({
      totalAmount: 500,
      paidAmount: 650,
      pendingAmount: 0,
      excessAmount: 150,
      paymentStatus: 'PAID',
    });
  });

  it('rounds cumulative payments to two decimal places', () => {
    expect(calculatePaymentBalance(0.3, 0.1 + 0.2).excessAmount).toBe(0);
  });
});
