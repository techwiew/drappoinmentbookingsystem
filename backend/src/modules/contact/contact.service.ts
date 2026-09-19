import nodemailer from 'nodemailer';
import { prisma } from '../../lib/prisma.js';

const DEFAULT_NOTIFICATION_RECIPIENTS = ['info@nativenodes.com', 'techwiew@gmail.com'];
const DEFAULT_EMAIL_FROM = 'info@medinovel.com';

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
  const smtpUser = process.env.SMTP_USER || process.env.MAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.MAIL_PASS;

  if (!smtpUser || !smtpPass) {
    console.warn('[contact-email] SMTP credentials are not configured. Skipping notification email.');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || process.env.MAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || process.env.MAIL_PORT || 587),
    secure: (process.env.SMTP_SECURE || process.env.MAIL_SECURE || 'false') === 'true',
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

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
    await transporter.sendMail({
      from: process.env.MAIL_FROM || DEFAULT_EMAIL_FROM,
      to: recipients.join(','),
      subject: 'New Demo Request - MediNovel',
      text: mailBody,
      replyTo: payload.phone,
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