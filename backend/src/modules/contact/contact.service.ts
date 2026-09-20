import { prisma } from '../../lib/prisma.js';
import { sendEmail } from '../../services/email.service.js';

const DEFAULT_NOTIFICATION_RECIPIENTS = ['info@medinovel.com'];
const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
}[character] || character));

const getNotificationRecipients = () => {
  const configured = (process.env.CONTACT_NOTIFY_EMAILS || process.env.NOTIFY_EMAILS || '')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);

  return configured.length > 0 ? configured : DEFAULT_NOTIFICATION_RECIPIENTS;
};

const sendInquiryNotification = async (payload: {
  name: string;
  phone: string;
  clinicType: string;
  city: string;
}) => {
  const recipients = getNotificationRecipients();
  const mailBody = [
    'A new demo request was submitted.',
    '',
    `Name: ${payload.name}`,
    `Phone: ${payload.phone}`,
    `Clinic Type: ${payload.clinicType}`,
    `City: ${payload.city}`,
    '',
    `Submitted At: ${new Date().toISOString()}`,
  ].join('\n');

  try {
    await sendEmail({
      to: recipients.join(','),
      subject: 'New Demo Request - MediNovel',
      text: mailBody,
      html: `<div style="font-family:Arial,sans-serif;color:#17201f"><h2 style="color:#00685f">New MediNovel demo request</h2><table cellpadding="8"><tr><td><b>Name</b></td><td>${escapeHtml(payload.name)}</td></tr><tr><td><b>Phone</b></td><td>${escapeHtml(payload.phone)}</td></tr><tr><td><b>Clinic type</b></td><td>${escapeHtml(payload.clinicType)}</td></tr><tr><td><b>City</b></td><td>${escapeHtml(payload.city)}</td></tr></table><p style="color:#52605d">Submitted at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p></div>`,
    });
  } catch (error) {
    console.error('[contact-email] Failed to send demo request notification:', error);
  }
};

export class ContactService {
  static async createInquiry(data: {
    name: string;
    phone: string;
    clinicType: string;
    city: string;
  }) {
    const inquiry = await prisma.inquiry.create({
      data: {
        name: data.name.trim(),
        phone: data.phone.trim(),
        clinicType: data.clinicType.trim(),
        city: data.city.trim(),
      },
    });

    await sendInquiryNotification({
      name: inquiry.name,
      phone: inquiry.phone,
      clinicType: inquiry.clinicType,
      city: inquiry.city,
    });

    return inquiry;
  }
}
