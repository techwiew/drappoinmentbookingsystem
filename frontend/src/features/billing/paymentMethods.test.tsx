// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Select } from '../../components/ui/Select.js';
import { PAYMENT_METHOD_OPTIONS } from './paymentMethods.js';

describe('Billing payment method dropdown', () => {
  it('shows readable methods and keeps the selected API value', () => {
    const PaymentMethodField = () => {
      const [method, setMethod] = React.useState('CASH');
      return <Select label="Payment Method" value={method} onChange={(event) => setMethod(event.target.value)} options={[...PAYMENT_METHOD_OPTIONS]} />;
    };
    render(<PaymentMethodField />);

    const dropdown = screen.getByRole('combobox', { name: 'Payment Method' }) as HTMLSelectElement;
    expect(dropdown.value).toBe('CASH');
    expect(screen.getByRole('option', { name: 'UPI / QR Code' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Card / POS' })).toBeTruthy();
    fireEvent.change(dropdown, { target: { value: 'UPI' } });
    expect(dropdown.value).toBe('UPI');
  });
});
