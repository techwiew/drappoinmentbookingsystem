import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import { buildWorkbook } from './exportWorkbook.js';
import { financialSheets, reportSheets } from '../features/reports/exportData.js';

describe('Excel exports', () => {
  it('round trips a real XLSX with numeric currency, dates, styling and totals', async () => {
    const definitions = financialSheets([{ patientName: '=SUM(A1:A9)', patientNumber: '001', doctorName: 'Doctor', consultationFee: 250.5, totalAmount: 250.5, paidAmount: 100, pendingAmount: 150.5, paymentStatus: 'PARTIALLY_PAID', paymentMethod: 'CASH', createdAt: '2026-09-19T20:00:00Z' }], []);
    const workbook = buildWorkbook('Financial', 'Filter: Partially paid', definitions);
    const restored = new ExcelJS.Workbook();
    await restored.xlsx.load(await workbook.xlsx.writeBuffer());
    const sheet = restored.getWorksheet('Financial')!;
    expect(sheet.getCell('A6').value).toBe('=SUM(A1:A9)'); // Text must never become a formula.
    expect(sheet.getCell('D6').value).toBe(250.5);
    expect(sheet.getCell('L6').value).toEqual(new Date('2026-09-20T00:00:00Z'));
    expect(sheet.getCell('H7').value).toEqual({ formula: 'SUBTOTAL(109,H6:H6)', result: 100 });
    expect(sheet.getCell('D6').numFmt).toContain('#,##0.00');
    expect(sheet.getCell('A5').font.bold).toBe(true);
    expect(sheet.views[0]).toMatchObject({ state: 'frozen', ySplit: 5 });
    expect(restored.worksheets).toHaveLength(2);
  });
  it('exports empty financial data with zero totals and reports with their displayed values', () => {
    const empty = buildWorkbook('Financial', 'No rows', financialSheets([], []));
    expect(empty.getWorksheet('Financial')!.getCell('D6').value).toBe(0);
    const sheets = reportSheets({ kpis: { completedCount: 4, todayCollection: 100, todayIpdCollection: 50 }, ipdRevenueTrends: [{ date: '2026-09-20', revenue: 50 }] });
    expect(sheets[0].rows).toContainEqual(['Completed Consultations', 4]);
    expect(sheets[1].rows).toContainEqual(['Total Collected Today', 150]);
    expect(sheets[2].rows[0][1]).toBe(50);
  });
});
