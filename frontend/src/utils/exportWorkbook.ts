import ExcelJS from 'exceljs';

export type ExportCell = string | number | Date | null;
export interface ExportSheet {
  name: string;
  columns: { header: string; width?: number; format?: string; total?: boolean }[];
  rows: ExportCell[][];
}
export const currencyFormat = '"₹" #,##0.00;[Red]("₹" #,##0.00)';

export const buildWorkbook = (title: string, context: string, sheets: ExportSheet[]) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'MediNovel';
  workbook.created = new Date();
  sheets.forEach((definition) => {
    const sheet = workbook.addWorksheet(definition.name, {
      views: [{ state: 'frozen', ySplit: 5 }],
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });
    const count = definition.columns.length;
    sheet.columns = definition.columns.map((column) => ({ width: column.width || 22 }));
    sheet.mergeCells(1, 1, 1, count);
    sheet.getCell(1, 1).value = title;
    sheet.getRow(1).height = 34;
    sheet.getCell(1, 1).font = { name: 'Calibri', size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getCell(1, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF312E81' } };
    sheet.mergeCells(2, 1, 2, count);
    sheet.getCell(2, 1).value = context;
    sheet.getRow(2).height = 32;
    sheet.getCell(2, 1).alignment = { wrapText: true, vertical: 'middle' };
    sheet.mergeCells(3, 1, 3, count);
    sheet.getCell(3, 1).value = `Generated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST · ${definition.rows.length} records`;
    sheet.getCell(3, 1).font = { color: { argb: 'FF64748B' }, size: 10 };
    sheet.getRow(5).values = definition.columns.map((column) => column.header);
    sheet.getRow(5).height = 30;
    sheet.getRow(5).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4338CA' } };
      cell.alignment = { wrapText: true, vertical: 'middle' };
    });
    definition.rows.forEach((values, index) => {
      const row = sheet.addRow(values);
      row.height = 25;
      row.eachCell({ includeEmpty: true }, (cell, column) => {
        cell.font = { name: 'Calibri', size: 11, color: { argb: 'FF1E293B' } };
        cell.alignment = { vertical: 'middle', wrapText: true };
        if (index % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        if (definition.columns[column - 1]?.format) cell.numFmt = definition.columns[column - 1].format!;
      });
    });
    sheet.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5 + definition.rows.length, column: count } };
    if (definition.columns.some((column) => column.total)) {
      const totalRow = sheet.addRow(['TOTAL']);
      definition.columns.forEach((column, index) => {
        if (!column.total) return;
        const result = definition.rows.reduce((sum, row) => sum + (typeof row[index] === 'number' ? row[index] as number : 0), 0);
        totalRow.getCell(index + 1).value = definition.rows.length ? { formula: `SUBTOTAL(109,${sheet.getColumn(index + 1).letter}6:${sheet.getColumn(index + 1).letter}${5 + definition.rows.length})`, result } : 0;
        totalRow.getCell(index + 1).numFmt = column.format || '#,##0';
      });
      totalRow.height = 28;
      totalRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.font = { bold: true, color: { argb: 'FF312E81' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E7FF' } };
      });
    }
    sheet.pageSetup.printTitlesRow = '1:5';
    sheet.headerFooter.oddFooter = '&LMediNovel&CPage &P of &N';
  });
  return workbook;
};

export const downloadWorkbook = async (title: string, context: string, sheets: ExportSheet[], filename: string) => {
  const buffer = await buildWorkbook(title, context, sheets).xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([new Uint8Array(buffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${filename}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
