import transporter from '../config/email.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Sends a welcome email to new waitlist signups.
 * Designed for deliverability: personal tone, no spam triggers, plain-text alternative,
 * consistent sender identity, and CAN-SPAM compliant footer.
 */
export const sendWelcomeEmail = async ({ full_name, email }) => {
  const firstName = full_name?.trim().split(/\s+/)[0] || 'there';
  const companyAddress = process.env.COMPANY_ADDRESS || 'www.searchlyst.com';

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Searchlyst</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a; color: #ffffff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px;">
          <!-- Header -->
          <tr>
            <td style="padding-bottom: 32px; border-bottom: 1px solid rgba(255,255,255,0.1);">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #ffffff;">Searchlyst</h1>
            </td>
          </tr>
          <!-- Greeting -->
          <tr>
            <td style="padding-top: 40px;">
              <p style="margin: 0 0 24px; font-size: 18px; line-height: 1.6; color: #ffffff;">Hi ${firstName},</p>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.7; color: #a3a3a3;">Welcome to Searchlyst.</p>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.7; color: #a3a3a3;">Search is evolving fast — people are asking AI, not just search engines. Searchlyst is built to help brands and creators understand and improve how they show up in AI search.</p>
            </td>
          </tr>
          <!-- Benefits box -->
          <tr>
            <td style="padding: 24px; margin: 24px 0; background-color: #171717; border-radius: 12px; border-left: 4px solid #dc2626;">
              <p style="margin: 0 0 16px; font-size: 15px; font-weight: 600; color: #ffffff;">You've joined our early waitlist, which means:</p>
              <ul style="margin: 0; padding-left: 20px; font-size: 15px; line-height: 1.8; color: #a3a3a3;">
                <li>Priority access to our beta</li>
                <li>Early product updates and insights</li>
                <li>A front-row seat to how AI search visibility really works</li>
              </ul>
            </td>
          </tr>
          <!-- Main content -->
          <tr>
            <td>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.7; color: #a3a3a3;">We're currently in beta and launching soon. Early users will be invited first.</p>
              <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.7; color: #a3a3a3;">Keep an eye on your inbox — exciting updates coming shortly.</p>
            </td>
          </tr>
          <!-- CTA -->
          <tr>
            <td style="padding-bottom: 40px;">
              <a href="https://www.searchlyst.com" style="display: inline-block; padding: 14px 28px; background-color: #dc2626; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 8px;">Visit Searchlyst</a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1);">
              <p style="margin: 0 0 8px; font-size: 14px; color: #737373;">— Team Searchlyst</p>
              <p style="margin: 0 0 8px; font-size: 13px; color: #525252;">www.searchlyst.com</p>
              <p style="margin: 0 0 8px; font-size: 12px; color: #525252;">Being early matters more than being loud</p>
              <p style="margin: 16px 0 0; font-size: 11px; color: #404040;">${companyAddress}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const textContent = `Hi ${firstName},

Welcome to Searchlyst.

Search is evolving fast — people are asking AI, not just search engines. Searchlyst is built to help brands and creators understand and improve how they show up in AI search.

You've joined our early waitlist, which means:
- Priority access to our beta
- Early product updates and insights
- A front-row seat to how AI search visibility really works

We're currently in beta and launching soon. Early users will be invited first.

Keep an eye on your inbox — exciting updates coming shortly.

—
Team Searchlyst
www.searchlyst.com
Being early matters more than being loud

${companyAddress}`;

  try {
    const info = await transporter.sendMail({
      from: `"Team Searchlyst" <${process.env.SMTP_USER}>`,
      to: email,
      replyTo: process.env.REPLY_TO_EMAIL || process.env.SMTP_USER,
      subject: "Welcome to Searchlyst — you're on the list",
      text: textContent,
      html: htmlContent,
      headers: {
        'X-Entity-Ref-ID': 'welcome-waitlist',
      },
    });

    console.log('✓ Welcome email sent to:', email, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('✗ Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

export const sendWaitlistNotification = async (waitlistData) => {
  const { full_name, email, website_url, source } = waitlistData;

  // Email HTML template
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #dc2626; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #374151; }
        .value { color: #1f2937; margin-top: 5px; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="margin: 0;">🎉 New Waitlist Signup</h2>
        </div>
        <div class="content">
          <div class="field">
            <div class="label">Full Name:</div>
            <div class="value">${full_name}</div>
          </div>
          <div class="field">
            <div class="label">Email:</div>
            <div class="value"><a href="mailto:${email}">${email}</a></div>
          </div>
          <div class="field">
            <div class="label">Website URL:</div>
            <div class="value"><a href="${website_url}" target="_blank">${website_url}</a></div>
          </div>
          <div class="field">
            <div class="label">Source:</div>
            <div class="value">${source || 'Not specified'}</div>
          </div>
          <div class="field">
            <div class="label">Time:</div>
            <div class="value">${new Date().toLocaleString()}</div>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated notification from Searchlyst</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Plain text version as fallback
  const textContent = `
New Waitlist Signup

Full Name: ${full_name}
Email: ${email}
Website URL: ${website_url}
Source: ${source || 'Not specified'}
Time: ${new Date().toLocaleString()}

---
This is an automated notification from Searchlyst
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Searchlyst Notifications" <${process.env.SMTP_USER}>`,
      to: process.env.NOTIFICATION_EMAIL,
      subject: `New Waitlist Signup - ${full_name}`,
      text: textContent,
      html: htmlContent,
    });

    console.log('✓ Notification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('✗ Error sending notification email:', error);
    // Don't throw error - we don't want email failures to block waitlist signup
    return { success: false, error: error.message };
  }
};
