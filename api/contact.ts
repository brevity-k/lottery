import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const OWNER_EMAIL = process.env.CONTACT_EMAIL || 'rottery0.kr@gmail.com';
const FROM_EMAIL = 'My Lotto Stats <onboarding@resend.dev>';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || !apiKey.startsWith('re_')) {
      return res.status(503).json({ error: 'Email service is not configured.' });
    }

    const resend = new Resend(apiKey);
    const { name, email, message } = req.body as {
      name: string;
      email: string;
      message: string;
    };

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({ error: 'Please fill in all fields.' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (name.length > 200 || email.length > 320 || message.length > 5000) {
      return res.status(400).json({ error: 'Input exceeds maximum allowed length.' });
    }

    const safeSubjectName = name.replace(/[\r\n]/g, '').slice(0, 200);

    await resend.emails.send({
      from: FROM_EMAIL,
      to: OWNER_EMAIL,
      subject: `My Lotto Stats Contact: ${safeSubjectName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 12px;">
            New Contact Inquiry
          </h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <tr>
              <td style="padding: 8px 12px; font-weight: bold; color: #555; width: 80px;">Name</td>
              <td style="padding: 8px 12px;">${escapeHtml(name)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; font-weight: bold; color: #555;">Email</td>
              <td style="padding: 8px 12px;">
                <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>
              </td>
            </tr>
          </table>
          <div style="margin-top: 20px; padding: 16px; background: #f0f5ff; border-radius: 8px; border-left: 4px solid #2563eb;">
            <p style="margin: 0 0 8px; font-weight: bold; color: #555;">Message</p>
            <p style="margin: 0; white-space: pre-wrap; line-height: 1.6;">${escapeHtml(message)}</p>
          </div>
        </div>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({ error: 'Failed to send email. Please try again later.' });
  }
}
