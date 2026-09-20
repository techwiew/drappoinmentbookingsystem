import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '../ui/Button.js';
import type { ExportSheet } from '../../utils/exportWorkbook.js';

export const ExportDataButton: React.FC<{ title: string; context: string; sheets: () => ExportSheet[]; filename: string; disabled?: boolean }> = ({ title, context, sheets, filename, disabled }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return <div className="space-y-1">
    <Button variant="outline" disabled={disabled} isLoading={busy} leftIcon={<Download className="h-4 w-4" />} onClick={async () => {
      setBusy(true); setError('');
      try {
        const { downloadWorkbook } = await import('../../utils/exportWorkbook.js');
        await downloadWorkbook(title, context, sheets(), filename);
      } catch { setError('Export failed. Please try again.'); }
      finally { setBusy(false); }
    }}>Export Data</Button>
    {!!error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
  </div>;
};
