export const calculatePaymentBalance = (invoiceTotal: number, amountPaid: number) => {
  if (!Number.isFinite(invoiceTotal) || !Number.isFinite(amountPaid) || invoiceTotal < 0 || amountPaid < 0) {
    throw { statusCode: 400, code: 'INVALID_PAYMENT_AMOUNT', message: 'Payment amounts must be valid nonnegative numbers' };
  }

  const totalCents = Math.round(invoiceTotal * 100);
  const paidCents = Math.round(amountPaid * 100);
  return {
    totalAmount: totalCents / 100,
    paidAmount: paidCents / 100,
    pendingAmount: Math.max(0, totalCents - paidCents) / 100,
    excessAmount: Math.max(0, paidCents - totalCents) / 100,
    paymentStatus: paidCents === 0 ? 'PENDING' : paidCents >= totalCents ? 'PAID' : 'PARTIALLY_PAID',
  } as const;
};
