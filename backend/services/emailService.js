/**
 * Email Service — REQ-5 Password Reset
 * Uses Resend API for transactional emails.
 * Falls back to console logging if RESEND_API_KEY is not set (dev mode).
 */
const logger = require('../utils/logger');

let resendClient = null;

function getResendClient() {
  if (resendClient) return resendClient;
  if (!process.env.RESEND_API_KEY) {
    logger.warn('RESEND_API_KEY not configured — emails will be logged to console only');
    return null;
  }
  try {
    const { Resend } = require('@resend/node');
    resendClient = new Resend(process.env.RESEND_API_KEY);
    return resendClient;
  } catch {
    logger.warn('Resend package not installed. Run: npm install @resend/node');
    return null;
  }
}

const APP_NAME = process.env.APP_NAME || 'AI-ActivEdu';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@ai-activedu.edu';
const APP_URL = process.env.APP_URL || 'http://localhost:5173';

/**
 * sendPasswordResetEmail — sends a password reset email.
 * Token should be a secure random string, expires in 30 min.
 */
async function sendPasswordResetEmail(email, token) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;
  const html = `
    <div style="font-family: Inter, system-ui, sans-serif; max-width: 560px; margin: 0 auto; color: #1e293b;">
      <div style="background: #1e3a5f; padding: 32px 40px;">
        <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0;">${APP_NAME}</h1>
      </div>
      <div style="padding: 40px; background: #ffffff; border: 1px solid #e2e8f0; border-top: none;">
        <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 16px;">Reset your password</h2>
        <p style="color: #64748b; margin: 0 0 24px; line-height: 1.6;">
          We received a request to reset the password for your ${APP_NAME} account.
          Click the button below to choose a new password. This link expires in <strong>30 minutes</strong>.
        </p>
        <a href="${resetUrl}" style="display: inline-block; background: #ea580c; color: #ffffff; font-weight: 700; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-size: 15px;">
          Reset Password
        </a>
        <p style="color: #94a3b8; font-size: 13px; margin: 24px 0 0;">
          If you didn't request this, you can safely ignore this email.
          For security, do not share this link with anyone.
        </p>
        <p style="color: #94a3b8; font-size: 12px; margin: 8px 0 0;">
          Link: <code style="background: #f8fafc; padding: 2px 6px; border-radius: 4px;">${resetUrl}</code>
        </p>
      </div>
    </div>
  `;

  const client = getResendClient();

  if (!client) {
    // Dev fallback — log to console for testing
    logger.info('DEV MODE — Password reset email (not sent)', {
      to: email,
      resetUrl,
    });
    return { success: true, devMode: true, resetUrl };
  }

  try {
    const result = await client.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `[${APP_NAME}] Reset your password`,
      html,
    });
    logger.info('Password reset email sent', { to: email, emailId: result.data?.id });
    return { success: true, emailId: result.data?.id };
  } catch (err) {
    logger.error('Failed to send password reset email', { error: err.message, to: email });
    throw new Error('Failed to send reset email. Please try again.');
  }
}

async function sendVerificationEmail(email, code) {
  const html = `
    <div style="font-family: Inter, system-ui, sans-serif; max-width: 560px; margin: 0 auto; color: #1e293b;">
      <div style="background: #1e3a5f; padding: 32px 40px;">
        <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0;">${APP_NAME}</h1>
      </div>
      <div style="padding: 40px; background: #ffffff; border: 1px solid #e2e8f0; border-top: none;">
        <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 16px;">Verify your email</h2>
        <p style="color: #64748b; margin: 0 0 24px; line-height: 1.6;">
          Enter the 6-digit code below to complete your ${APP_NAME} account registration.
          This code expires in <strong>15 minutes</strong>.
        </p>
        <div style="background: #f0f5ff; border: 2px solid #1e3a5f; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #1e3a5f; font-family: monospace;">${code}</span>
        </div>
        <p style="color: #94a3b8; font-size: 13px; margin: 0;">
          If you didn't create an account, you can safely ignore this email.
        </p>
      </div>
    </div>
  `;

  const client = getResendClient();

  if (!client) {
    logger.info('DEV MODE — Verification email (not sent)', { to: email, code });
    return { success: true, devMode: true, code };
  }

  try {
    const result = await client.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `[${APP_NAME}] Your verification code: ${code}`,
      html,
    });
    logger.info('Verification email sent', { to: email, emailId: result.data?.id });
    return { success: true, emailId: result.data?.id };
  } catch (err) {
    logger.error('Failed to send verification email', { error: err.message, to: email });
    throw new Error('Failed to send verification email. Please try again.');
  }
}

module.exports = { sendPasswordResetEmail, sendVerificationEmail };
