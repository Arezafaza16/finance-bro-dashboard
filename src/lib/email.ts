import nodemailer from 'nodemailer';

// Email configuration - uses console.log fallback if not configured
const isEmailConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

const transporter = isEmailConfigured
  ? nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
  : null;

const fromEmail = process.env.SMTP_FROM || 'noreply@finance-bro.app';
const appName = 'Finance-Bro';
const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!transporter) {
    // Fallback: log to console for development
    console.log(' ========== EMAIL (DEV MODE) ==========');
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log('Content:', options.html.replace(/<[^>]*>/g, ''));
    console.log('==========================================\n');
    return true;
  }

  try {
    await transporter.sendMail({
      from: `"${appName}" <${fromEmail}>`,
      ...options,
    });
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">🔐 ${appName}</h1>
      </div>
      <div style="background: #1e293b; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #f1f5f9; margin-top: 0;">Kode OTP Reset Password</h2>
        <p style="color: #94a3b8;">Gunakan kode OTP berikut untuk mereset password Anda:</p>
        <div style="background: #334155; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #a855f7; letter-spacing: 8px;">${otp}</span>
        </div>
        <p style="color: #94a3b8; font-size: 14px;">Kode ini berlaku selama <strong>10 menit</strong>.</p>
        <p style="color: #94a3b8; font-size: 14px;">Jika Anda tidak meminta reset password, abaikan email ini.</p>
        <hr style="border: none; border-top: 1px solid #475569; margin: 20px 0;">
        <p style="color: #64748b; font-size: 12px; text-align: center;">
          © ${new Date().getFullYear()} ${appName}. All rights reserved.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `[${appName}] Kode OTP Reset Password`,
    html,
  });
}

export async function sendPasswordChangedNotification(
  email: string,
  resetLink: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">🔐 ${appName}</h1>
      </div>
      <div style="background: #1e293b; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #f1f5f9; margin-top: 0;">Password Anda Telah Diubah</h2>
        <p style="color: #94a3b8;">Password akun Anda baru saja diubah pada:</p>
        <div style="background: #334155; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="color: #f1f5f9; margin: 0;">
            <strong>Waktu:</strong> ${new Date().toLocaleString('id-ID', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta'
  })} WIB
          </p>
        </div>
        <p style="color: #94a3b8;">Jika Anda yang melakukan perubahan ini, Anda dapat mengabaikan email ini.</p>
        <div style="background: #7f1d1d; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
          <p style="color: #fca5a5; margin: 0; font-weight: bold;">⚠️ Bukan Anda yang mengubah?</p>
          <p style="color: #fca5a5; margin: 10px 0 0;">
            Jika Anda tidak merasa mengubah password, segera amankan akun Anda:
          </p>
        </div>
        <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px;">
          Reset Password Sekarang
        </a>
        <hr style="border: none; border-top: 1px solid #475569; margin: 20px 0;">
        <p style="color: #64748b; font-size: 12px; text-align: center;">
          © ${new Date().getFullYear()} ${appName}. All rights reserved.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `[${appName}] Password Anda Telah Diubah`,
    html,
  });
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
