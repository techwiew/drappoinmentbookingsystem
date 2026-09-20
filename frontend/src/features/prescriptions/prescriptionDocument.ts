export type PrescriptionDetail = {
  id: string;
  prescribedAt: string;
  clinic: { name: string; address: string; phone: string };
  patient: { fullName: string; patientNumber: string; age?: number; gender?: string };
  doctor: { id: string; name: string; specialization?: string; registrationNumber?: string };
  diagnosis?: string;
  items: Array<{ medicineName: string; dosage: string; frequency: string; duration: string; foodTiming?: string; instructions?: string }>;
};

export const foodTimingLabel = (value?: string) => ({ BEFORE_FOOD: 'Before food', AFTER_FOOD: 'After food', WITH_FOOD: 'With food', NO_PREFERENCE: 'No preference' }[value || 'NO_PREFERENCE'] || 'No preference');

const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]!));

export function printPrescription(rx: PrescriptionDetail) {
  const popup = window.open('', '_blank', 'width=850,height=900');
  if (!popup) throw new Error('Allow popups to print the prescription.');
  popup.document.write(`<!doctype html><html><head><title>Prescription ${escapeHtml(rx.patient.patientNumber)}</title><style>body{font:15px Arial,sans-serif;color:#14202c;max-width:780px;margin:40px auto;padding:0 24px}header{border-bottom:2px solid #047c82;padding-bottom:16px}h1{margin:0;color:#047c82}small{color:#536170}table{width:100%;border-collapse:collapse;margin-top:24px}th,td{border-bottom:1px solid #d8e0e4;padding:10px;text-align:left;vertical-align:top}th{background:#f2f8f8}@media print{body{margin:12mm auto}}</style></head><body><header><h1>${escapeHtml(rx.clinic.name)}</h1><small>${escapeHtml(rx.clinic.address)} · ${escapeHtml(rx.clinic.phone)}</small></header><h2>Prescription</h2><p><b>Patient:</b> ${escapeHtml(rx.patient.fullName)} (${escapeHtml(rx.patient.patientNumber)})<br><b>Doctor:</b> Dr. ${escapeHtml(rx.doctor.name)}<br><b>Date:</b> ${escapeHtml(new Date(rx.prescribedAt).toLocaleDateString())}<br><b>Diagnosis:</b> ${escapeHtml(rx.diagnosis)}</p><table><thead><tr><th>Medicine</th><th>Dose</th><th>Frequency</th><th>Duration</th><th>Food timing / instructions</th></tr></thead><tbody>${rx.items.map((item) => `<tr><td>${escapeHtml(item.medicineName)}</td><td>${escapeHtml(item.dosage)}</td><td>${escapeHtml(item.frequency)}</td><td>${escapeHtml(item.duration)}</td><td>${escapeHtml(foodTimingLabel(item.foodTiming))}<br>${escapeHtml(item.instructions)}</td></tr>`).join('')}</tbody></table><p style="margin-top:48px;text-align:right">Dr. ${escapeHtml(rx.doctor.name)}<br><small>${escapeHtml(rx.doctor.registrationNumber)}</small></p></body></html>`);
  popup.document.close();
  popup.focus();
  window.setTimeout(() => popup.print(), 250);
}

export async function downloadPrescriptionPdf(rx: PrescriptionDetail) {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF();
  let y = 18;
  const line = (label: string, size = 10) => {
    pdf.setFontSize(size);
    for (const text of pdf.splitTextToSize(label, 180)) {
      if (y > 275) { pdf.addPage(); y = 18; }
      pdf.text(text, 15, y);
      y += size * 0.55;
    }
  };
  line(rx.clinic.name, 17);
  line(`${rx.clinic.address} | ${rx.clinic.phone}`);
  y += 5;
  line(`Prescription - ${new Date(rx.prescribedAt).toLocaleDateString()}`, 13);
  line(`Patient: ${rx.patient.fullName} (${rx.patient.patientNumber})`);
  line(`Doctor: Dr. ${rx.doctor.name}`);
  if (rx.diagnosis) line(`Diagnosis: ${rx.diagnosis}`);
  y += 7;
  rx.items.forEach((item, index) => {
    line(`${index + 1}. ${item.medicineName} - ${item.dosage}`, 11);
    line(`Frequency: ${item.frequency} | Duration: ${item.duration} | ${foodTimingLabel(item.foodTiming)}`);
    if (item.instructions) line(`Instructions: ${item.instructions}`);
    y += 4;
  });
  pdf.save(`prescription-${rx.patient.patientNumber}.pdf`);
}
