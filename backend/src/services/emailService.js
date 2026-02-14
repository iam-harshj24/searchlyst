import transporter from '../config/email.js';
import dotenv from 'dotenv';

dotenv.config();

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
