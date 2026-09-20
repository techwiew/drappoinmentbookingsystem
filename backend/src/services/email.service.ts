import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || process.env.MAIL_HOST || 'mail.medinovel.com';
const SMTP_PORT = Number(process.env.SMTP_PORT || process.env.MAIL_PORT || 465);
const SMTP_USER = process.env.SMTP_USER || process.env.MAIL_USER || 'info@medinovel.com';
const SMTP_PASS = process.env.SMTP_PASS || process.env.MAIL_PASS;
const MAIL_FROM = process.env.MAIL_FROM || `MediNovel <${SMTP_USER}>`;

let transporter: nodemailer.Transporter | null = null;

export const isEmailConfigured = () => Boolean(SMTP_PASS);

export const getMailer = () => {
  if (!SMTP_PASS) {
    throw new Error('SMTP is not configured. Set SMTP_PASS for the info@medinovel.com mailbox.');
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: (process.env.SMTP_SECURE || process.env.MAIL_SECURE || 'true') === 'true',
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return transporter;
};

export const sendEmail = async (message: Omit<nodemailer.SendMailOptions, 'from'>) =>
  getMailer().sendMail({ from: MAIL_FROM, ...message });

export const verifyEmailConfiguration = async () => getMailer().verify();
