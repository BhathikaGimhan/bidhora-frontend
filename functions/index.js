/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");
const functions = require("firebase-functions");
const logger = require("firebase-functions/logger");
const nodemailer = require("nodemailer");
const admin = require("firebase-admin");
const chromium = require("@sparticuz/chromium");
const puppeteer = require("puppeteer-core");

// Initialize Firebase Admin
admin.initializeApp();

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// Email configuration
const emailConfig = {
  host: "mail.privateemail.com",
  port: 465,
  secure: true, // use SSL
  auth: {
    user: "contact@bidhora.com",
    pass: "sajith@123",
  },
};

// Helper function to get Sri Lanka time
function getSriLankaTime() {
  const now = new Date();

  return now.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
    // ශ්‍රී ලංකාවේ Time Zone එක
    timeZone: "Asia/Colombo",
  });
}

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport(emailConfig);


// Contact form email handler
exports.sendContactEmail = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { name, email, subject, message, clientTime } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      res.status(400).json({
        success: false,
        message: "All fields are required",
      });
      return;
    }

    // Email to Bidhora contact team
    const contactEmailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>New Contact Form Submission</title>
          <style>
            body { font-family: 'Inter', sans-serif; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); margin: 0; padding: 20px; }
            .container { max-width: 650px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%); color: white; padding: 40px 30px; text-align: center; }
            .logo { display: flex; align-items: center; justify-content: center; gap: 15px; font-size: 28px; font-weight: 700; margin-bottom: 10px; }
            .content { padding: 40px 30px; }
            .alert { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 1px solid #f59e0b; border-radius: 12px; padding: 20px; margin-bottom: 30px; display: flex; align-items: center; gap: 12px; }
            .field-group { margin-bottom: 25px; }
            .field-label { font-weight: 600; color: #374151; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
            .field-value { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; font-size: 15px; }
            .message-box { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #059669; border-radius: 12px; padding: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">
                Bidhora
              </div>
              <div style="font-size: 16px; opacity: 0.9;">New Contact Form Submission</div>
            </div>
            <div class="content">
              <div class="alert">
                <div style="font-size: 24px;">📬</div>
                <div style="font-weight: 500; color: #92400e;">New Contact Form Submission Received</div>
              </div>
              <div class="field-group">
                <label class="field-label">👤 From</label>
                <div class="field-value">${name} &lt;${email}&gt;</div>
              </div>
              <div class="field-group">
                <label class="field-label">📋 Subject</label>
                <div class="field-value">${subject}</div>
              </div>
              <div class="field-group">
                <label class="field-label">💬 Message</label>
                <div class="message-box">${message.replace(/\n/g, "<br>")}</div>
              </div>
            </div>
            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 40px 30px; border-top: 3px solid #10b981; text-align: center;">
              <div style="font-weight: 700; color: #047857; font-size: 22px; margin-bottom: 12px; letter-spacing: -0.5px; text-shadow: 0 1px 2px rgba(5, 150, 105, 0.1);">
                The Bidhora Team
              </div>
              <div style="margin: 20px 0;">
                <div style="display: flex; align-items: center; justify-content: center; gap: 8px; color: #065f46; font-size: 14px; line-height: 1.6; margin-bottom: 10px;">
                  <span>📧</span>
                  <a href="mailto:contact@bidhora.com" style="color: #059669; font-weight: 600; text-decoration: none;">contact@bidhora.com</a>
                </div>
                <div style="display: flex; align-items: center; justify-content: center; gap: 8px; color: #065f46; font-size: 14px; line-height: 1.6; margin-bottom: 10px;">
                  <span>📞</span>
                  <span style="font-weight: 500;">074 377 4787</span>
                </div>
                <div style="display: flex; align-items: center; justify-content: center; gap: 8px; color: #065f46; font-size: 14px; line-height: 1.6;">
                  <span>🌐</span>
                  <a href="https://www.bidhora.com" style="color: #059669; font-weight: 600; text-decoration: none;">www.bidhora.com</a>
                </div>
              </div>
              <p style="color: #6b7280; font-size: 12px; margin-top: 20px; font-style: italic; opacity: 0.8; margin-bottom: 0;">
                Sent via Bidhora Contact Form on ${getSriLankaTime()}
              </p>
            </div>

          </div>
        </body>
      </html>
    `;

    // Confirmation email to user
    const confirmationEmailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Thank you for contacting Bidhora</title>
          <style>
            body { font-family: 'Inter', sans-serif; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); margin: 0; padding: 20px; }
            .container { max-width: 650px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%); color: white; padding: 50px 30px; text-align: center; }
            .logo { display: flex; align-items: center; justify-content: center; gap: 15px; font-size: 32px; font-weight: 700; margin-bottom: 15px; }
            .celebration { font-size: 48px; margin-bottom: 10px; }
            .tagline { font-size: 18px; opacity: 0.9; font-weight: 300; }
            .content { padding: 40px 30px; }
            .greeting { font-size: 24px; font-weight: 600; color: #059669; margin-bottom: 20px; text-align: center; }
            .message { font-size: 16px; line-height: 1.7; color: #4b5563; margin-bottom: 30px; text-align: center; }
            .highlight-box { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #059669; border-radius: 12px; padding: 25px; margin: 30px 0; }
            .highlight-title { font-weight: 600; color: #0c4a6e; margin-bottom: 15px; font-size: 18px; }
            .message-details { background: white; border-radius: 8px; padding: 20px; border-left: 4px solid #059669; }
            .detail-row { margin-bottom: 12px; display: flex; }
            .detail-label { font-weight: 600; color: #374151; min-width: 80px; font-size: 14px; }
            .detail-value { color: #1f2937; flex: 1; }
            .user-message { background: #f8fafc; border-radius: 6px; padding: 15px; margin-top: 15px; border-left: 3px solid #10b981; font-style: italic; }
            .cta-section { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin: 30px 0; }
            .cta-title { font-size: 20px; font-weight: 600; margin-bottom: 10px; }
            .response-time { background: rgba(255,255,255,0.2); border-radius: 20px; padding: 8px 16px; display: inline-block; font-weight: 600; margin-bottom: 15px; }
            .explore-text { font-size: 16px; margin: 20px 0; }
            .footer { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 40px 30px; border-top: 3px solid #10b981; text-align: center; }
            .brand-signature { font-weight: 700; color: #047857; font-size: 22px; margin-bottom: 12px; letter-spacing: -0.5px; text-shadow: 0 1px 2px rgba(5, 150, 105, 0.1); }
            .contact-info { display: flex; flex-direction: column; align-items: center; gap: 10px; margin: 20px 0; }
            .contact-item { display: inline-flex; align-items: center; gap: 8px; color: #065f46; font-size: 14px; line-height: 1.6; }
            .contact-link { color: #059669; font-weight: 600; text-decoration: none; transition: all 0.2s; }
            .contact-link:hover { color: #047857; text-decoration: underline; }
            .footer-timestamp { color: #6b7280; font-size: 12px; margin-top: 20px; font-style: italic; opacity: 0.8; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">
                Bidhora
              </div>
              <div class="celebration">🎉</div>
              <div class="tagline">Thank you for reaching out!</div>
            </div>
            <div class="content">
              <div class="greeting">Hello ${name}!</div>
              <div class="message">Thank you for contacting <strong>Bidhora</strong>! We've received your message and truly appreciate you taking the time to reach out to us.</div>
              <div class="highlight-box">
                <div class="highlight-title">Your Message Details</div>
                <div class="message-details">
                  <div class="detail-row">
                    <span class="detail-label">Subject:</span>
                    <span class="detail-value">${subject}</span>
                  </div>
                  <div class="user-message">${message.replace(
                    /\n/g,
                    "<br>"
                  )}</div>
                </div>
              </div>
              <div class="cta-section">
                <div class="response-time">⚡ 24 Hour Response Guarantee</div>
                <div class="cta-title">We'll Get Back to You Soon!</div>
                <div style="opacity: 0.9;">Our team is reviewing your inquiry and will respond within 24 hours.</div>
              </div>
              <div class="explore-text">In the meantime, feel free to explore our platform and discover how <strong>Bidhora</strong> can help bring your projects to life!</div>
            </div>
 <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 40px 30px; border-top: 3px solid #10b981; text-align: center;">
  <div style="font-weight: 700; color: #047857; font-size: 22px; margin-bottom: 16px; letter-spacing: -0.5px; text-shadow: 0 1px 2px rgba(5, 150, 105, 0.1);">
    The Bidhora Team
  </div>

  <div style="color: #065f46; font-size: 14px; line-height: 1.8;">
    <div style="margin-bottom: 8px;">
      📧 <a href="mailto:contact@bidhora.com" style="color: #059669; font-weight: 600; text-decoration: none;">contact@bidhora.com</a>
    </div>
    <div style="margin-bottom: 8px;">
      📞 <span style="font-weight: 500;">074 377 4787</span>
    </div>
    <div>
      🌐 <a href="https://www.bidhora.com" style="color: #059669; font-weight: 600; text-decoration: none;">www.bidhora.com</a>
    </div>
  </div>

  <p style="color: #6b7280; font-size: 12px; margin-top: 24px; font-style: italic; opacity: 0.8; margin-bottom: 0;">
    Sent on ${getSriLankaTime()}
  </p>
</div>


          </div>
        </body>
      </html>
    `;

    // Send email to Bidhora contact team
    await transporter.sendMail({
      from: '"Bidhora Contact Form" <contact@bidhora.com>',
      to: "contact@bidhora.com",
      subject: `New Contact Form: ${subject}`,
      html: contactEmailHtml,
    });

    // Send confirmation email to user
    await transporter.sendMail({
      from: '"Bidhora Team" <contact@bidhora.com>',
      to: email,
      subject: "Thank you for contacting Bidhora!",
      html: confirmationEmailHtml,
    });

    logger.info("Contact emails sent successfully", { name, email, subject });

    res.status(200).json({
      success: true,
      message:
        "Your message has been sent successfully! We'll get back to you soon.",
    });
  } catch (error) {
    logger.error("Error sending contact email:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send email. Please try again later.",
    });
  }
});

// Project price notification email handler
exports.sendProjectPriceNotification = onRequest(
  { cors: true },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const {
        to_email,
        to_name,
        project_title,
        project_price,
        project_duration,
        admin_notes,
        project_id,
        payment_link,
        deposit_amount,
      } = req.body;

      // Validate required fields
      if (!to_email || !project_title || !project_price || !project_id) {
        res.status(400).json({
          success: false,
          message:
            "Required fields: to_email, project_title, project_price, project_id",
        });
        return;
      }

      // Email to customer about project pricing with payment link
      const priceNotificationHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Project Price Set - ${project_title}</title>
          <style>
            body { font-family: 'Inter', sans-serif; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); margin: 0; padding: 20px; }
            .container { max-width: 650px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%); color: white; padding: 40px 30px; text-align: center; }
            .logo { display: flex; align-items: center; justify-content: center; gap: 15px; font-size: 28px; font-weight: 700; margin-bottom: 10px; }
            .content { padding: 40px 30px; }
            .greeting { font-size: 24px; font-weight: 600; color: #059669; margin-bottom: 20px; }
            .message { font-size: 16px; line-height: 1.7; color: #4b5563; margin-bottom: 30px; }
            .price-box { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 3px solid #059669; border-radius: 16px; padding: 30px; margin: 30px 0; text-align: center; }
            .price-label { font-size: 14px; color: #059669; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
            .price-amount { font-size: 36px; font-weight: 700; color: #059669; margin-bottom: 10px; }
            .project-title { font-size: 20px; font-weight: 600; color: #1f2937; margin-bottom: 20px; }
            .details-section { background: #f8fafc; border-radius: 12px; padding: 25px; margin: 25px 0; }
            .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-row:last-child { border-bottom: none; }
            .detail-label { font-weight: 600; color: #374151; }
            .detail-value { color: #1f2937; font-weight: 500; }
            .notes-section { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 1px solid #f59e0b; border-radius: 12px; padding: 20px; margin: 25px 0; }
            .notes-title { font-weight: 600; color: #92400e; margin-bottom: 10px; }
            .notes-content { color: #92400e; line-height: 1.6; }
            .payment-section { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 3px solid #3b82f6; border-radius: 16px; padding: 30px; margin: 30px 0; text-align: center; }
            .deposit-label { font-size: 14px; color: #1e40af; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
            .deposit-amount { font-size: 48px; font-weight: 700; color: #1e40af; margin-bottom: 15px; }
            .deposit-note { font-size: 14px; color: #475569; margin-bottom: 25px; line-height: 1.6; }
            .payment-btn { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 18px; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3); }
            .payment-btn:hover { transform: translateY(-2px); box-shadow: 0 15px 20px -3px rgba(59, 130, 246, 0.4); }
            .cta-section { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin: 30px 0; }
            .cta-title { font-size: 20px; font-weight: 600; margin-bottom: 15px; }
            .project-id { background: #e5e7eb; color: #374151; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-family: monospace; }
            .highlight { color: #3b82f6; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">
                Bidhora
              </div>
              <div style="font-size: 16px; opacity: 0.9;">Project Price Notification</div>
            </div>
            <div class="content">
              <div class="greeting">Hello ${to_name || "Valued Customer"}!</div>
              <div class="message">Great news! Our admin team has reviewed your project and set a competitive price for you.</div>

              <div class="price-box">
                <div class="price-label">Total Project Price</div>
                <div class="price-amount">LKR ${project_price}</div>
                <div class="project-title">${project_title}</div>
              </div>

              <div class="details-section">
                <div class="detail-row">
                  <span class="detail-label">Project:</span>
                  <span class="detail-value">${project_title}</span>
                </div>
                ${
                  project_duration
                    ? `
                <div class="detail-row">
                  <span class="detail-label">Duration:</span>
                  <span class="detail-value">${project_duration}</span>
                </div>
                `
                    : ""
                }
                <div class="detail-row">
                  <span class="detail-label">Total Price:</span>
                  <span class="detail-value">LKR ${project_price}</span>
                </div>
              </div>

              ${
                admin_notes
                  ? `
              <div class="notes-section">
                <div class="notes-title">📝 Admin Notes</div>
                <div class="notes-content">${admin_notes.replace(
                  /\n/g,
                  "<br>"
                )}</div>
              </div>
              `
                  : ""
              }

              ${
                payment_link && deposit_amount
                  ? `
              <div class="payment-section">
                <div style="font-size: 32px; margin-bottom: 15px;">💳</div>
                <div class="deposit-label">Initial Deposit Required</div>
                <div class="deposit-amount">LKR ${deposit_amount}</div>
                <div class="deposit-note">
                  To proceed with your project, we require a <span class="highlight">10% deposit</span> of the total project price.<br>
                  This secures your project slot and allows us to assign an employee to start working on it.
                </div>
                <a href="${payment_link}" class="payment-btn">💳 Pay Deposit Now</a>
                <div style="font-size: 12px; color: #64748b; margin-top: 20px;">
                  Secure payment powered by Genie
                </div>
              </div>
              `
                  : ""
              }

              <div class="cta-section">
                <div class="cta-title">Next Steps</div>
                <div style="opacity: 0.9; margin-bottom: 15px;">
                  ${
                    payment_link
                      ? "After paying the 10% deposit, our admin will assign an employee to your project and work will begin!"
                      : "You can now approve or reject this price from your dashboard."
                  }
                </div>
                <div style="font-size: 14px; opacity: 0.8;">
                  ${
                    payment_link
                      ? "Click the button above to make your payment securely."
                      : "Login to your Bidhora account to make your decision."
                  }
                </div>
              </div>

              <div style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px;">
                Project ID: <span class="project-id">${project_id}</span>
              </div>
            </div>

<div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 40px 30px; border-top: 3px solid #10b981; text-align: center;">
  <div style="font-weight: 700; color: #047857; font-size: 22px; margin-bottom: 16px; letter-spacing: -0.5px; text-shadow: 0 1px 2px rgba(5, 150, 105, 0.1);">
    The Bidhora Team
  </div>

  <div style="color: #065f46; font-size: 14px; line-height: 1.8;">
    <div style="margin-bottom: 8px;">
      📧 <a href="mailto:contact@bidhora.com" style="color: #059669; font-weight: 600; text-decoration: none;">contact@bidhora.com</a>
    </div>
    <div style="margin-bottom: 8px;">
      📞 <span style="font-weight: 500;">074 377 4787</span>
    </div>
    <div>
      🌐 <a href="https://www.bidhora.com" style="color: #059669; font-weight: 600; text-decoration: none;">www.bidhora.com</a>
    </div>
  </div>

  <p style="color: #6b7280; font-size: 12px; margin-top: 24px; font-style: italic; opacity: 0.8; margin-bottom: 0;">
    Sent on ${getSriLankaTime()}
  </p>
</div>


          </div>
        </body>
      </html>
    `;

      // Send email to customer
      await transporter.sendMail({
        from: '"Bidhora Team" <contact@bidhora.com>',
        to: to_email,
        subject: `Project Price Set - ${project_title} ${
          payment_link ? "- Payment Required" : ""
        }`,
        html: priceNotificationHtml,
      });

      logger.info("Project price notification email sent successfully", {
        to_email,
        project_title,
        project_price,
        project_id,
        payment_link: payment_link ? "included" : "not included",
        deposit_amount,
      });

      res.status(200).json({
        success: true,
        message: "Price notification sent successfully!",
      });
    } catch (error) {
      logger.error("Error sending project price notification:", error);
      res.status(500).json({
        success: false,
        message: "Failed to send price notification. Please try again later.",
      });
    }
  }
);

// Employee assignment notification email handler
exports.sendEmployeeAssignmentNotification = onRequest(
  { cors: true },
  async (req, res) => {
    // Handle CORS preflight request
    if (req.method === "OPTIONS") {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type");
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const {
        employee_email,
        employee_name,
        project_title,
        project_description,
        project_price,
        project_id,
        buyer_email,
        project_link,
      } = req.body;

      // Validate required fields
      if (
        !employee_email ||
        !employee_name ||
        !project_title ||
        !project_price ||
        !project_id
      ) {
        res.status(400).json({
          success: false,
          message: "All fields are required",
        });
        return;
      }

      // Email to employee
      const assignmentEmailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>New Project Assignment</title>
            <style>
              body { font-family: 'Inter', sans-serif; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); margin: 0; padding: 20px; }
              .container { max-width: 650px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
              .header { background: linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%); color: white; padding: 50px 30px; text-align: center; }
              .logo { font-size: 32px; font-weight: 700; margin-bottom: 15px; }
              .celebration { font-size: 48px; margin-bottom: 10px; }
              .tagline { font-size: 18px; opacity: 0.9; font-weight: 300; }
              .content { padding: 40px 30px; }
              .greeting { font-size: 24px; font-weight: 600; color: #059669; margin-bottom: 20px; text-align: center; }
              .message { font-size: 16px; line-height: 1.7; color: #4b5563; margin-bottom: 30px; text-align: center; }
              .project-card { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #059669; border-radius: 12px; padding: 25px; margin: 30px 0; }
              .project-title { font-size: 22px; font-weight: 700; color: #0c4a6e; margin-bottom: 15px; text-align: center; }
              .project-details { background: white; border-radius: 8px; padding: 20px; margin-top: 20px; }
              .detail-row { display: flex; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
              .detail-row:last-child { border-bottom: none; }
              .detail-label { font-weight: 600; color: #374151; min-width: 140px; font-size: 14px; }
              .detail-value { color: #1f2937; flex: 1; }
              .price-badge { background: linear-gradient(135deg, #0c4a6e 0%, #0369a1 100%); color: white; padding: 12px 20px; border-radius: 8px; display: inline-block; font-size: 24px; font-weight: 700; }
              .description-box { background: #f8fafc; border-left: 4px solid #10b981; border-radius: 8px; padding: 15px; margin-top: 15px; line-height: 1.6; }
              .action-section { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin: 30px 0; }
              .action-title { font-size: 20px; font-weight: 600; margin-bottom: 15px; }
              .action-button { background: white; color: #059669; padding: 14px 32px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: 600; margin-top: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              .action-button:hover { background: #f0fdf4; }
              .project-id { color: #059669; font-weight: 600; font-family: monospace; }
              .alert-box { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0; display: flex; align-items: center; gap: 10px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">Bidhora</div>
                <div class="celebration">🎉</div>
                <div class="tagline">New Project Assignment!</div>
              </div>
              
              <div class="content">
                <div class="greeting">Hello ${employee_name}!</div>
                <div class="message">
                  Great news! You've been assigned to a new project. The buyer has already paid the 10% deposit, and you can start working on this project immediately.
                </div>

                <div class="project-card">
                  <div class="project-title">${project_title}</div>
                  
                  <div class="project-details">
                    <div class="detail-row">
                      <span class="detail-label">💰 Project Value:</span>
                      <span class="detail-value">
                        <span class="price-badge">LKR ${project_price.toFixed(
                          2
                        )}</span>
                      </span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">📧 Buyer Contact:</span>
                      <span class="detail-value">${
                        buyer_email || "Contact via admin"
                      }</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">🆔 Project ID:</span>
                      <span class="detail-value"><span class="project-id">${project_id}</span></span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">💳 Payment Status:</span>
                      <span class="detail-value" style="color: #059669; font-weight: 600;">✅ 10% Deposit Paid</span>
                    </div>
                  </div>

                  ${
                    project_description
                      ? `
                    <div class="description-box">
                      <strong>📋 Project Description:</strong><br/>
                      ${project_description}
                    </div>
                  `
                      : ""
                  }
                </div>

                <div class="alert-box">
                  <div style="font-size: 24px;">⏰</div>
                  <div style="flex: 1;">
                    <strong>Important:</strong> Please start working on this project as soon as possible. Once completed, submit your work through the Bidhora platform for admin review.
                  </div>
                </div>

                <div class="action-section">
                  <div class="action-title">Ready to Get Started?</div>
                  <div style="opacity: 0.9; margin-bottom: 10px;">
                    Login to your Bidhora account to view full project details and begin work.
                  </div>
                  <a href="${project_link || `https://www.bidhora.com/employee/projects/${project_id}`}" class="action-button">
                    View Project Details →
                  </a>
                </div>

                <div class="message" style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                  <strong>Next Steps:</strong><br/>
                  1. Review the project requirements carefully<br/>
                  2. Begin working on the project<br/>
                  3. Submit your completed work for admin review<br/>
                  4. Once approved, the buyer will receive the final deliverable and you'll get credit for completion
                </div>
              </div>

   <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 40px 30px; border-top: 3px solid #10b981; text-align: center;">
  <div style="font-weight: 700; color: #047857; font-size: 22px; margin-bottom: 16px; letter-spacing: -0.5px; text-shadow: 0 1px 2px rgba(5, 150, 105, 0.1);">
    The Bidhora Team
  </div>

  <div style="color: #065f46; font-size: 14px; line-height: 1.8;">
    <div style="margin-bottom: 8px;">
      📧 <a href="mailto:contact@bidhora.com" style="color: #059669; font-weight: 600; text-decoration: none;">contact@bidhora.com</a>
    </div>
    <div style="margin-bottom: 8px;">
      📞 <span style="font-weight: 500;">074 377 4787</span>
    </div>
    <div>
      🌐 <a href="https://www.bidhora.com" style="color: #059669; font-weight: 600; text-decoration: none;">www.bidhora.com</a>
    </div>
  </div>

  <p style="color: #6b7280; font-size: 12px; margin-top: 24px; font-style: italic; opacity: 0.8; margin-bottom: 0;">
    Sent on ${getSriLankaTime()}
  </p>
</div>


            </div>
          </body>
        </html>
      `;

      // Send email to employee
      await transporter.sendMail({
        from: '"Bidhora Team" <contact@bidhora.com>',
        to: employee_email,
        subject: `🎉 New Project Assigned - ${project_title}`,
        html: assignmentEmailHtml,
      });

      logger.info("Employee assignment notification sent successfully", {
        employee_email,
        employee_name,
        project_id,
        project_title,
      });

      res.status(200).json({
        success: true,
        message: "Assignment notification sent successfully!",
      });
    } catch (error) {
      logger.error("Error sending employee assignment notification:", error);
      res.status(500).json({
        success: false,
        message:
          "Failed to send assignment notification. Please try again later.",
      });
    }
  }
);

// Final payment notification handler
exports.sendFinalPaymentNotification = onRequest(
  { cors: true },
  async (req, res) => {
    // Handle CORS preflight request
    if (req.method === "OPTIONS") {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type");
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const {
        to_email,
        to_name,
        project_title,
        project_id,
        total_price,
        initial_payment,
        final_payment,
        payment_link,
      } = req.body;

      // Validate required fields
      if (
        !to_email ||
        !to_name ||
        !project_title ||
        !project_id ||
        !total_price ||
        !initial_payment ||
        !final_payment ||
        !payment_link
      ) {
        res.status(400).json({
          success: false,
          message: "All fields are required",
        });
        return;
      }

      // Email HTML for final payment notification
      const paymentEmailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Complete Your Project Payment - Bidhora</title>
          <style>
            body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); margin: 0; padding: 20px; }
            .container { max-width: 650px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%); color: white; padding: 50px 30px; text-align: center; position: relative; }
            .logo { font-size: 36px; font-weight: 800; margin-bottom: 15px; letter-spacing: -0.5px; }
            .celebration { font-size: 54px; margin-bottom: 12px; animation: bounce 2s infinite; }
            @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
            .tagline { font-size: 19px; opacity: 0.95; font-weight: 400; letter-spacing: 0.3px; }
            .content { padding: 45px 35px; }
            .greeting { font-size: 26px; font-weight: 700; color: #059669; margin-bottom: 22px; text-align: center; }
            .message { font-size: 17px; line-height: 1.8; color: #4b5563; margin-bottom: 32px; text-align: center; }
            .highlight-box { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 3px solid #059669; border-radius: 14px; padding: 28px; margin: 32px 0; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.15); }
            .project-title { font-size: 22px; font-weight: 700; color: #0c4a6e; margin-bottom: 22px; text-align: center; display: flex; align-items: center; justify-content: center; gap: 10px; }
            .payment-details { background: white; border-radius: 10px; padding: 22px; }
            .detail-row { display: flex; justify-content: space-between; padding: 16px 0; border-bottom: 2px solid #e5e7eb; align-items: center; }
            .detail-row:last-child { border-bottom: none; }
            .detail-label { font-weight: 600; color: #374151; font-size: 15px; }
            .detail-value { color: #1f2937; font-weight: 600; font-size: 15px; }
            .total-row { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 22px; border-radius: 10px; margin-top: 18px; border: 2px solid #f59e0b; }
            .total-label { font-size: 19px; font-weight: 700; color: #92400e; }
            .total-value { font-size: 28px; font-weight: 800; color: #059669; }
            .cta-container { text-align: center; margin: 35px 0; }
            .cta-text { font-size: 19px; font-weight: 700; color: #374151; margin-bottom: 18px; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 18px 48px; text-decoration: none; border-radius: 14px; font-weight: 700; font-size: 19px; box-shadow: 0 8px 16px rgba(5, 150, 105, 0.35); transition: all 0.3s ease; }
            .cta-button:hover { transform: translateY(-3px); box-shadow: 0 12px 24px rgba(5, 150, 105, 0.45); }
            .info-box { background: #eff6ff; border: 2px solid #3b82f6; border-radius: 12px; padding: 22px; margin: 25px 0; }
            .info-title { font-weight: 700; color: #1e40af; margin-bottom: 12px; font-size: 16px; }
            .info-text { color: #4b5563; font-size: 15px; line-height: 1.7; }
            .security-badge { background: #fef3c7; border: 2px solid #f59e0b; border-radius: 10px; padding: 18px; margin-top: 25px; text-align: center; }
            .security-text { font-weight: 700; color: #92400e; font-size: 15px; display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Bidhora</div>
              <div class="celebration">🎊</div>
              <div class="tagline">Your Project is Ready!</div>
            </div>
            
            <div class="content">
              <div class="greeting">🎉 Great News, ${to_name}!</div>
              
              <div class="message">
                Your project <strong>"${project_title}"</strong> has been <strong>successfully completed</strong> and approved by our admin team! 
                The work is ready for you to download and use immediately.
              </div>
              
              <div class="highlight-box">
                <div class="project-title">
                  💼 ${project_title}
                </div>
                
                <div class="payment-details">
                  <div class="detail-row">
                    <span class="detail-label">📊 Total Project Price:</span>
                    <span class="detail-value">LKR ${total_price.toLocaleString()}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">✅ Initial Payment (10%):</span>
                    <span class="detail-value" style="color: #059669;">LKR ${initial_payment.toLocaleString()} ✓</span>
                  </div>
                  <div class="total-row detail-row">
                    <span class="total-label">💰 Final Payment (90%):</span>
                    <span class="total-value">LKR ${final_payment.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div class="cta-container">
                <div class="cta-text">🎁 Complete Your Payment to Access Files</div>
                <a href="${payment_link}" class="cta-button">
                  💳 Pay Now & Download Files
                </a>
              </div>

              <div class="info-box">
                <div class="info-title">📋 What Happens Next?</div>
                <div class="info-text">
                  <strong>1.</strong> Click the "Pay Now" button above<br/>
                  <strong>2.</strong> Complete the secure payment process<br/>
                  <strong>3.</strong> Immediately access and download all project files<br/>
                  <strong>4.</strong> Keep the files forever - they're yours!
                </div>
              </div>

              <div class="security-badge">
                <div class="security-text">
                  <span>🔒 Secure Payment</span>
                  <span>•</span>
                  <span>📥 Instant Download</span>
                  <span>•</span>
                  <span>✅ Quality Guaranteed</span>
                </div>
              </div>
            </div>
<div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 40px 30px; border-top: 3px solid #10b981; text-align: center;">
  <div style="font-weight: 700; color: #047857; font-size: 22px; margin-bottom: 16px; letter-spacing: -0.5px; text-shadow: 0 1px 2px rgba(5, 150, 105, 0.1);">
    The Bidhora Team
  </div>

  <div style="color: #065f46; font-size: 14px; line-height: 1.8;">
    <div style="margin-bottom: 8px;">
      📧 <a href="mailto:contact@bidhora.com" style="color: #059669; font-weight: 600; text-decoration: none;">contact@bidhora.com</a>
    </div>
    <div style="margin-bottom: 8px;">
      📞 <span style="font-weight: 500;">074 377 4787</span>
    </div>
    <div>
      🌐 <a href="https://www.bidhora.com" style="color: #059669; font-weight: 600; text-decoration: none;">www.bidhora.com</a>
    </div>
  </div>

  <p style="color: #6b7280; font-size: 12px; margin-top: 24px; font-style: italic; opacity: 0.8; margin-bottom: 0;">
    Sent on ${getSriLankaTime()}
  </p>
</div>



          </div>
        </body>
      </html>
    `;

      // Send email to buyer
      await transporter.sendMail({
        from: '"Bidhora Team" <contact@bidhora.com>',
        to: to_email,
        subject: `🎊 Your Project is Ready! Complete Payment to Download - ${project_title}`,
        html: paymentEmailHtml,
      });

      logger.info("Final payment notification sent successfully", {
        to_email,
        to_name,
        project_id,
        project_title,
        final_payment,
      });

      res.status(200).json({
        success: true,
        message: "Final payment notification sent successfully!",
      });
    } catch (error) {
      logger.error("Error sending final payment notification:", error);
      res.status(500).json({
        success: false,
        message:
          "Failed to send final payment notification. Please try again later.",
      });
    }
  }
);

/**
 * Genie Payment Gateway Proxy
 * Handles payment initiation and verification through Genie API
 * PRODUCTION MODE - Using real Genie credentials
 */
exports.geniePayment = onRequest(
  { cors: true, maxInstances: 10 },
  async (req, res) => {
    // Only allow POST requests
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const { action, paymentData, paymentId, environment } = req.body;

    const targetEnv = environment === 'uat' ? 'uat' : 'production';
    const GENIE_API_BASE = targetEnv === 'uat' ? 'https://api.uat.geniebiz.lk' : 'https://api.geniebiz.lk';

    logger.info(`Genie ${targetEnv.toUpperCase()} Payment Gateway`, { 
      environment: targetEnv,
      baseUrl: GENIE_API_BASE 
    });

    // Get Genie credentials from environment variables or hardcoded defaults
    let GENIE_APPLICATION_ID;
    let GENIE_API_KEY;

    if (targetEnv === 'uat') {
        GENIE_APPLICATION_ID = process.env.GENIE_UAT_APPLICATION_ID || "36bafce7-a201-429b-a9e2-c5b78546677c";
        GENIE_API_KEY = process.env.GENIE_UAT_API_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBJZCI6IjM2YmFmY2U3LWEyMDEtNDI5Yi1hOWUyLWM1Yjc4NTQ2Njc3YyIsImNvbXBhbnlJZCI6IjYzOTdmMzlkZjA3ZmJhMDAwODQyYTkwYiIsImlhdCI6MTY3MDkwMjY4NSwiZXhwIjo0ODI2NTc2Mjg1fQ.fy12dgFhA3iB_RCjD7y8j5HClNRZUiBZgAg-QzFpxaE";
    } else {
        GENIE_APPLICATION_ID = process.env.GENIE_APPLICATION_ID || "e6092ac4-3dba-466c-b0a7-137566fd81af";
        GENIE_API_KEY = process.env.GENIE_API_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBJZCI6ImU2MDkyYWM0LTNkYmEtNDY2Yy1iMGE3LTEzNzU2NmZkODFhZiIsImNvbXBhbnlJZCI6IjY5MWFmNTFiOTVhNDRhODY2MzkzYTgzNCIsImlhdCI6MTc2Mzc4Njg0MSwiZXhwIjo0OTE5NDYwNDQxfQ.CBoQW3aJauu9wtfFgPdVQCAqV9ZbS2YB93nFjw0kb40";
    }

    logger.info(`Genie ${targetEnv.toUpperCase()} credentials loaded`, {
      environment: targetEnv,
      appIdLength: GENIE_APPLICATION_ID?.length || 0,
      apiKeyLength: GENIE_API_KEY?.length || 0,
      appIdPrefix: GENIE_APPLICATION_ID?.substring(0, 8) || 'missing'
    });

    if (!GENIE_APPLICATION_ID || !GENIE_API_KEY) {
      logger.error("Genie credentials not configured", {
        appId: GENIE_APPLICATION_ID ? 'present' : 'missing',
        apiKey: GENIE_API_KEY ? 'present' : 'missing'
      });
      res.status(500).json({ error: "Payment gateway not configured" });
      return;
    }

    try {
      if (action === "initiate") {
        // Initiate payment
        logger.info(`Initiating Genie ${targetEnv.toUpperCase()} payment`, { 
          paymentData,
          apiKeyPrefix: GENIE_API_KEY.substring(0, 20) + "..."
        });

        // Prepare request body for Genie API v2
        const genieRequestBody = {
          amount: parseFloat(paymentData.amount) * 100, // Convert to cents
          currency: paymentData.currency,
          localId: paymentData.orderId,
          customerReference: paymentData.orderId,
          redirectUrl: paymentData.returnUrl,
          webhook: paymentData.notifyUrl,
          customer: {
            name: paymentData.customerName,
            email: paymentData.customerEmail,
            billingEmail: paymentData.customerEmail,
            billingAddress1: "N/A",
            billingCity: "Colombo",
            billingCountry: "LK",
            billingPostCode: "00000",
            currency: paymentData.currency
          }
        };

        const apiUrl = `${GENIE_API_BASE}/public/v2/transactions`;

        logger.info(`Sending to Genie ${targetEnv.toUpperCase()} API`, { 
          environment: targetEnv,
          url: apiUrl,
          requestBody: genieRequestBody,
          headers: {
            "Content-Type": "application/json",
            "Authorization": `${GENIE_API_KEY.substring(0, 30)}...`
          }
        });

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: GENIE_API_KEY,
          },
          body: JSON.stringify(genieRequestBody),
        });

        logger.info("Genie API Response", {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorData = {};
          try {
            errorData = JSON.parse(errorText);
          } catch (e) {
            errorData = { message: errorText };
          }
          
          logger.error("Genie API Error", {
            status: response.status,
            statusText: response.statusText,
            errorData: errorData,
            requestBody: {
              amount: parseFloat(paymentData.amount),
              currency: paymentData.currency,
              reference: paymentData.orderId,
            }
          });
          
          res.status(response.status).json({
            error: errorData.message || "Payment initiation failed",
            details: errorData,
          });
          return;
        }

        const result = await response.json();
        logger.info("Genie payment initiated successfully", { 
          transactionId: result.id,
          state: result.state,
          url: result.url,
          shortUrl: result.shortUrl
        });

        res.status(200).json({
          success: true,
          paymentId: result.id,
          transactionId: result.id,
          orderId: result.localId || result.customerReference || paymentData.orderId,
          amount: result.amountAsDecimal || (result.amount / 100).toFixed(2),
          currency: result.currency,
          state: result.state,
          redirectUrl: result.url,
          shortUrl: result.shortUrl,
          expires: result.expires
        });
      } else if (action === "verify") {
        // Verify payment
        logger.info(`Verifying Genie ${targetEnv.toUpperCase()} payment`, { 
          paymentId,
          environment: targetEnv
        });

        const verifyUrl = `${GENIE_API_BASE}/public/v2/transactions/${paymentId}`;

        const response = await fetch(verifyUrl, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: GENIE_API_KEY,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          logger.error("Genie verification error", errorData);
          res.status(response.status).json({
            error: errorData.message || "Payment verification failed",
            details: errorData,
          });
          return;
        }

        const result = await response.json();
        logger.info("Genie payment verified", { result });

        res.status(200).json({
          status: result.status,
          orderId: result.reference || result.order_id,
        });
      } else {
        res.status(400).json({ error: "Invalid action" });
      }
    } catch (error) {
      logger.error("Genie payment error", error);
      res.status(500).json({
        error: "Payment processing failed",
        message: error.message,
      });
    }
  }
);

/**
 * Genie Payment Webhook Handler
 * Receives payment notifications from Genie and updates project status
 */
exports.genieWebhook = onRequest(
  { cors: true, maxInstances: 10, memory: '1GiB' },
  async (req, res) => {
    // Only allow POST requests
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const webhookData = req.body;
      
      logger.info("Genie webhook received", {
        data: webhookData,
        headers: req.headers
      });

      // Extract transaction details from webhook
      const { id: transactionId, localId, customerReference, status, state } = webhookData;
      const orderId = localId || customerReference;

      if (!orderId) {
        logger.error("Webhook missing order ID", webhookData);
        res.status(400).json({ error: "Missing order ID" });
        return;
      }

      // Determine if this is a deposit or final payment based on order ID
      const isDepositPayment = orderId.startsWith('DEPOSIT_');
      const isFinalPayment = orderId.startsWith('FINAL_');

      if (!isDepositPayment && !isFinalPayment) {
        logger.error("Unknown payment type", { orderId });
        res.status(400).json({ error: "Unknown payment type" });
        return;
      }

      // Extract project ID from order ID
      const projectId = orderId.split('_')[1];

      logger.info("Processing webhook", {
        projectId,
        orderId,
        transactionId,
        status,
        state,
        paymentType: isDepositPayment ? 'deposit' : 'final'
      });

      // Check if payment is successful
      // Genie sends either COMPLETED, CONFIRMED, or SUCCESS status
      const isSuccess = status === 'COMPLETED' || 
                       state === 'COMPLETED' || 
                       status === 'SUCCESS' ||
                       state === 'CONFIRMED' ||
                       status === 'CONFIRMED';

      if (isSuccess) {
        const db = admin.firestore();
        const projectRef = db.collection('projects').doc(projectId);

        // Check if payment already processed (idempotency)
        const projectDoc = await projectRef.get();
        if (!projectDoc.exists) {
          logger.error("Project not found", { projectId });
          res.status(404).json({ error: "Project not found" });
          return;
        }

        const projectData = projectDoc.data();

        if (isDepositPayment) {
          // Check if this deposit payment was already processed (idempotency)
          if (projectData.initialPaymentStatus === 'paid' && projectData.depositInvoiceNumber) {
            logger.info("Deposit payment already processed - idempotent check", { 
              projectId, 
              transactionId,
              existingPaymentId: projectData.initialPaymentId,
              existingInvoiceNumber: projectData.depositInvoiceNumber
            });
            res.status(200).json({ 
              success: true, 
              message: "Payment already processed" 
            });
            return;
          }

          // Generate invoice number once (only on first webhook call)
          const invoiceNumber = projectData.depositInvoiceNumber || generateInvoiceNumber('deposit', projectId);
          
          // Update deposit payment status with invoice number (atomic update)
          await projectRef.update({
            initialPaymentStatus: 'paid',
            initialPaymentId: transactionId || orderId,
            initialPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
            customerDecision: 'approved',
            status: 'ready_to_assign',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            depositInvoiceNumber: invoiceNumber,
          });

          logger.info("Deposit payment updated successfully", { projectId, transactionId, invoiceNumber });
          
          // Send invoice email for deposit payment ONLY ONCE
          try {
            // Re-fetch to check if email was already sent by another webhook call
            const updatedDoc = await projectRef.get();
            const updatedData = updatedDoc.data();
            
            if (updatedData.depositInvoiceEmailSent) {
              logger.info("Deposit invoice email already sent - skipping", { projectId, invoiceNumber });
            } else {
              // Use transaction to ensure only one email is sent
              await db.runTransaction(async (transaction) => {
                const freshDoc = await transaction.get(projectRef);
                const freshData = freshDoc.data();
                
                // Double-check email wasn't sent
                if (freshData.depositInvoiceEmailSent) {
                  logger.info("Email already sent (race condition prevented)", { projectId });
                  return;
                }
                
                // Mark as sending immediately
                transaction.update(projectRef, {
                  depositInvoiceEmailSent: true,
                });
              });
              
              // Now send the email (outside transaction)
              const buyerId = projectData.createdBy || projectData.buyerId || projectData.customerId;
              if (!buyerId) {
                throw new Error('No buyer ID found in project data');
              }
              const buyerDoc = await db.collection('users').doc(buyerId).get();
              const buyerData = buyerDoc.data();
              
              // Log project data for debugging
              logger.info("Project data for invoice", {
                projectId,
                adminPrice: projectData.adminPrice,
                budget: projectData.budget,
                initialPaymentAmount: projectData.initialPaymentAmount,
              });
              
              // Use adminPrice (not budget) and fallback to initialPaymentAmount
              const totalAmount = projectData.adminPrice || projectData.budget || 0;
              const depositAmount = projectData.initialPaymentAmount || (totalAmount * 0.1);
              
              const invoiceData = {
                invoiceNumber,
                invoiceDate: new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }),
                paymentType: 'deposit',
                projectId,
                projectTitle: projectData.title || 'Project',
                projectDescription: projectData.description,
                buyerName: buyerData?.displayName || buyerData?.email || 'Customer',
                buyerEmail: buyerData?.email || projectData.customerEmail,
                amount: depositAmount,
                currency: 'LKR',
                transactionId: transactionId || orderId,
                paymentMethod: 'Genie Payment Gateway',
                totalProjectAmount: totalAmount,
                depositPercentage: 10,
              };
              
              await sendInvoiceEmail(invoiceData);
              
              logger.info("Deposit invoice email sent", { projectId, invoiceNumber });
            }
          } catch (emailError) {
            logger.error("Failed to send deposit invoice email", { 
              projectId, 
              error: emailError.message 
            });
            // Rollback email sent flag if email failed
            try {
              await projectRef.update({
                depositInvoiceEmailSent: false,
              });
            } catch (rollbackError) {
              logger.error("Failed to rollback email sent flag", { projectId });
            }
          }
        } else if (isFinalPayment) {
          // Check if this final payment was already processed (idempotency)
          if (projectData.finalPaymentStatus === 'paid' && projectData.finalInvoiceNumber) {
            logger.info("Final payment already processed - idempotent check", { 
              projectId, 
              transactionId,
              existingPaymentId: projectData.finalPaymentId,
              existingInvoiceNumber: projectData.finalInvoiceNumber
            });
            res.status(200).json({ 
              success: true, 
              message: "Payment already processed" 
            });
            return;
          }

          // Generate invoice number once (only on first webhook call)
          const invoiceNumber = projectData.finalInvoiceNumber || generateInvoiceNumber('final', projectId);
          
          // Update final payment status with invoice number (atomic update)
          await projectRef.update({
            finalPaymentStatus: 'paid',
            finalPaymentId: transactionId || orderId,
            finalPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'completed',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            finalInvoiceNumber: invoiceNumber,
          });

          logger.info("Final payment updated successfully", { projectId, transactionId, invoiceNumber });
          
          // Send invoice email for final payment ONLY ONCE
          try {
            // Re-fetch to check if email was already sent by another webhook call
            const updatedDoc = await projectRef.get();
            const updatedData = updatedDoc.data();
            
            if (updatedData.finalInvoiceEmailSent) {
              logger.info("Final invoice email already sent - skipping", { projectId, invoiceNumber });
            } else {
              // Use transaction to ensure only one email is sent
              await db.runTransaction(async (transaction) => {
                const freshDoc = await transaction.get(projectRef);
                const freshData = freshDoc.data();
                
                // Double-check email wasn't sent
                if (freshData.finalInvoiceEmailSent) {
                  logger.info("Email already sent (race condition prevented)", { projectId });
                  return;
                }
                
                // Mark as sending immediately
                transaction.update(projectRef, {
                  finalInvoiceEmailSent: true,
                });
              });
              
              // Now send the email (outside transaction)
              const buyerId = projectData.createdBy || projectData.buyerId || projectData.customerId;
              if (!buyerId) {
                throw new Error('No buyer ID found in project data');
              }
              const buyerDoc = await db.collection('users').doc(buyerId).get();
              const buyerData = buyerDoc.data();
              
              // Log project data for debugging
              logger.info("Project data for final invoice", {
                projectId,
                adminPrice: projectData.adminPrice,
                budget: projectData.budget,
                initialPaymentAmount: projectData.initialPaymentAmount,
              });
              
              // Use adminPrice (not budget) and calculate final payment
              const totalAmount = projectData.adminPrice || projectData.budget || 0;
              const finalAmount = totalAmount * 0.9;
              
              const invoiceData = {
                invoiceNumber,
                invoiceDate: new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }),
                paymentType: 'final',
                projectId,
                projectTitle: projectData.title || 'Project',
                projectDescription: projectData.description,
                buyerName: buyerData?.displayName || buyerData?.email || 'Customer',
                buyerEmail: buyerData?.email || projectData.customerEmail,
                amount: finalAmount,
                currency: 'LKR',
                transactionId: transactionId || orderId,
                paymentMethod: 'Genie Payment Gateway',
                totalProjectAmount: totalAmount,
                finalPercentage: 90,
              };
              
              await sendInvoiceEmail(invoiceData);
              
              logger.info("Final invoice email sent", { projectId, invoiceNumber });
            }
          } catch (emailError) {
            logger.error("Failed to send final invoice email", { 
              projectId, 
              error: emailError.message 
            });
            // Rollback email sent flag if email failed
            try {
              await projectRef.update({
                finalInvoiceEmailSent: false,
              });
            } catch (rollbackError) {
              logger.error("Failed to rollback email sent flag", { projectId });
            }
          }
        }

        res.status(200).json({ 
          success: true, 
          message: "Payment processed successfully" 
        });
      } else {
        logger.warn("Payment not successful", { status, state, orderId });
        res.status(200).json({ 
          success: false, 
          message: "Payment not completed" 
        });
      }
    } catch (error) {
      logger.error("Webhook processing error", error);
      res.status(500).json({
        error: "Webhook processing failed",
        message: error.message,
      });
    }
  }
);

/**
 * Verify and Confirm Payment
 * Called by frontend after payment redirect to verify payment status
 */
exports.verifyPayment = onRequest(
  { cors: true, maxInstances: 10 },
  async (req, res) => {
    // Only allow POST requests
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const { projectId, paymentType } = req.body;

      if (!projectId || !paymentType) {
        res.status(400).json({ error: "Missing required parameters" });
        return;
      }

      logger.info("Verifying payment", { projectId, paymentType });

      const db = admin.firestore();
      const projectRef = db.collection('projects').doc(projectId);
      const projectDoc = await projectRef.get();

      if (!projectDoc.exists) {
        res.status(404).json({ error: "Project not found" });
        return;
      }

      const projectData = projectDoc.data();

      if (paymentType === 'deposit') {
        const isPaid = projectData.initialPaymentStatus === 'paid';
        res.status(200).json({
          success: true,
          isPaid,
          paymentId: projectData.initialPaymentId,
          message: isPaid ? "Deposit payment verified" : "Payment not yet confirmed"
        });
      } else if (paymentType === 'final') {
        const isPaid = projectData.finalPaymentStatus === 'paid';
        res.status(200).json({
          success: true,
          isPaid,
          paymentId: projectData.finalPaymentId,
          message: isPaid ? "Final payment verified" : "Payment not yet confirmed"
        });
      } else {
        res.status(400).json({ error: "Invalid payment type" });
      }
    } catch (error) {
      logger.error("Payment verification error", error);
      res.status(500).json({
        error: "Verification failed",
        message: error.message,
      });
    }
  }
);

/**
 * Register Webhook with Genie
 * One-time setup to register our webhook URL with Genie Business
 * This ensures all payment notifications are sent to our webhook endpoint
 */
exports.registerGenieWebhook = onRequest(
  { cors: true, maxInstances: 1 },
  async (req, res) => {
    try {
      const GENIE_API_KEY = process.env.GENIE_API_KEY;
      // Get webhook URL from environment or use default
      const WEBHOOK_URL = process.env.GENIE_WEBHOOK_URL || 
        "https://geniewebhook-e7fpchtlna-uc.a.run.app";

      logger.info("Registering webhook with Genie", { hookUrl: WEBHOOK_URL });

      const response = await fetch("https://api.geniebiz.lk/public/webhooks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": GENIE_API_KEY,
          "Accept": "application/json",
        },
        body: JSON.stringify({
          hookUrl: WEBHOOK_URL,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        logger.error("Failed to register webhook", {
          status: response.status,
          data: responseData,
        });
        res.status(response.status).json({
          error: "Failed to register webhook with Genie",
          details: responseData,
        });
        return;
      }

      logger.info("Webhook registered successfully", responseData);
      res.status(200).json({
        success: true,
        message: "Webhook registered successfully with Genie",
        webhookId: responseData.id,
        hookUrl: responseData.hookUrl,
        created: responseData.created,
      });
    } catch (error) {
      logger.error("Error registering webhook", error);
      res.status(500).json({
        error: "Failed to register webhook",
        message: error.message,
      });
    }
  }
);

/**
 * Manual Payment Fix
 * One-time function to manually mark a payment as paid
 * Use for payments that were made before webhook was properly configured
 */
exports.manualPaymentFix = onRequest(
  { cors: true, maxInstances: 1 },
  async (req, res) => {
    try {
      const { projectId, paymentType, transactionId } = req.body || req.query;

      if (!projectId || !paymentType) {
        res.status(400).json({ 
          error: "Missing required parameters",
          required: ["projectId", "paymentType (deposit or final)"]
        });
        return;
      }

      logger.info("Manual payment fix requested", { projectId, paymentType, transactionId });

      const db = admin.firestore();
      const projectRef = db.collection('projects').doc(projectId);
      const projectDoc = await projectRef.get();

      if (!projectDoc.exists) {
        res.status(404).json({ error: "Project not found" });
        return;
      }

      const txId = transactionId || `MANUAL_FIX_${Date.now()}`;

      if (paymentType === 'deposit') {
        await projectRef.update({
          initialPaymentStatus: 'paid',
          initialPaymentId: txId,
          initialPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
          customerDecision: 'approved',
          status: 'ready_to_assign',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        logger.info("Deposit payment manually fixed", { projectId, txId });
        res.status(200).json({
          success: true,
          message: "Deposit payment marked as paid",
          projectId,
          transactionId: txId,
          newStatus: 'ready_to_assign'
        });
      } else if (paymentType === 'final') {
        await projectRef.update({
          finalPaymentStatus: 'paid',
          finalPaymentId: txId,
          finalPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'completed',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        logger.info("Final payment manually fixed", { projectId, txId });
        res.status(200).json({
          success: true,
          message: "Final payment marked as paid",
          projectId,
          transactionId: txId,
          newStatus: 'completed'
        });
      } else {
        res.status(400).json({ 
          error: "Invalid payment type",
          allowed: ["deposit", "final"]
        });
      }
    } catch (error) {
      logger.error("Manual payment fix error", error);
      res.status(500).json({
        error: "Failed to fix payment",
        message: error.message,
      });
    }
  }
);

/**
 * List Registered Webhooks
 * Get all webhooks registered with Genie Business
 */
exports.listGenieWebhooks = onRequest(
  { cors: true, maxInstances: 1 },
  async (req, res) => {
    try {
      const GENIE_API_KEY = process.env.GENIE_API_KEY;

      logger.info("Fetching registered webhooks from Genie");

      const response = await fetch("https://api.geniebiz.lk/public/webhooks", {
        method: "GET",
        headers: {
          "Authorization": GENIE_API_KEY,
          "Accept": "application/json",
        },
      });

      const responseData = await response.json();

      if (!response.ok) {
        logger.error("Failed to fetch webhooks", {
          status: response.status,
          data: responseData,
        });
        res.status(response.status).json({
          error: "Failed to fetch webhooks from Genie",
          details: responseData,
        });
        return;
      }

      logger.info("Webhooks fetched successfully", {
        count: Array.isArray(responseData) ? responseData.length : 0,
      });

      res.status(200).json({
        success: true,
        webhooks: responseData,
      });
    } catch (error) {
      logger.error("Error fetching webhooks", error);
      res.status(500).json({
        error: "Failed to fetch webhooks",
        message: error.message,
      });
    }
  }
);
/**
 * Generate invoice PDF using Puppeteer for perfect Unicode support
 */
async function generateInvoicePDF(data) {
  let browser = null;
  try {
    // Configure chromium for serverless environment
    chromium.setHeadlessMode = true;
    chromium.setGraphicsMode = false;

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();

    // HTML Template with embedded CSS and Google Fonts
    // Recreating the exact design from the original jsPDF implementation
    // Note: We use base64 encoded logo if available, otherwise fallback to text
    let logoHtml = '';
    try {
      const fs = require('fs');
      const path = require('path');
      const logoPath = path.join(__dirname, 'bidhora-logo.png');
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        const logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
        logoHtml = `<div style="width: 30mm; height: 30mm; display: flex; align-items: center; justify-content: center;">
          <img src="${logoBase64}" alt="Bidhora" style="width: 100%; height: 100%; object-fit: contain;" />
        </div>`;
      }
    } catch (e) {
      console.warn('Logo not found for PDF generation', e);
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Sinhala:wght@400;700&family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: 'Noto Sans Sinhala', 'Poppins', sans-serif;
              margin: 0;
              padding: 0;
              color: #333;
              background: white;
            }
          </style>
        </head>
        <body>
          <div style="padding: 0; color: #333; font-family: 'Noto Sans Sinhala', 'Poppins', sans-serif; width: 210mm; min-height: 297mm; position: relative; box-sizing: border-box;">
            
            <!-- Header Background -->
            <div style="background-color: #10b981; height: 45mm; width: 100%; position: absolute; top: 0; left: 0; z-index: 0;"></div>
            
            <!-- Header Content -->
            <div style="position: relative; z-index: 1; padding: 8mm 15mm; display: flex; justify-content: space-between; align-items: flex-start;">
               <div style="display: flex; align-items: center; gap: 15px;">
                 <!-- Logo -->
                 ${logoHtml}
                 <div style="color: white;">
                   <h1 style="font-size: 28pt; font-weight: bold; margin: 0; line-height: 1;">Bidhora</h1>
                   <p style="margin: 5px 0 0 0; font-size: 10pt;">Professional Digital Solution Platform</p>
                 </div>
               </div>
               <div style="text-align: right; padding-top: 10mm;">
                 <h2 style="font-size: 24pt; font-weight: bold; margin: 0; color: white;">INVOICE</h2>
               </div>
            </div>

            <div style="padding: 10mm 20mm;">
              <!-- Info Box -->
              <div style="background-color: #f3f4f6; padding: 5mm; border-radius: 3mm; margin-bottom: 10mm; display: flex; flex-direction: column; gap: 2mm;">
                <div style="font-size: 10pt; font-weight: bold; color: #1f2937;">Invoice Number: ${data.invoiceNumber}</div>
                <div style="font-size: 10pt; font-weight: bold; color: #1f2937;">Date: ${data.invoiceDate}</div>
                <div style="font-size: 10pt; font-weight: bold; color: #1f2937;">Transaction ID: ${data.transactionId}</div>
              </div>

              <!-- Bill To -->
              <div style="margin-bottom: 15mm;">
                <h3 style="color: #10b981; font-size: 12pt; font-weight: bold; margin-bottom: 3mm;">BILL TO:</h3>
                <p style="margin: 0; font-weight: bold; font-size: 11pt; color: #1f2937;">${data.buyerName}</p>
                <p style="margin: 2mm 0 0 0; font-size: 10pt; color: #374151;">${data.buyerEmail}</p>
              </div>

              <!-- Project Details -->
              <div style="margin-bottom: 10mm;">
                <h3 style="color: #10b981; font-size: 12pt; font-weight: bold; margin-bottom: 3mm;">PROJECT DETAILS:</h3>
                
                <div style="margin-bottom: 2mm; display: flex; align-items: flex-start;">
                  <span style="font-size: 10pt; font-weight: bold; color: #1f2937; width: 35mm; flex-shrink: 0;">Project Title:</span>
                  <span style="font-size: 10pt; color: #374151;">${data.projectTitle}</span>
                </div>
                
                <div style="margin-bottom: 2mm; display: flex; align-items: flex-start;">
                  <span style="font-size: 10pt; font-weight: bold; color: #1f2937; width: 35mm; flex-shrink: 0;">Project ID:</span>
                  <span style="font-size: 10pt; color: #374151;">${data.projectId}</span>
                </div>
                
                ${data.projectDescription ? `
                  <div style="margin-bottom: 2mm; display: flex; align-items: flex-start;">
                    <span style="font-size: 10pt; font-weight: bold; color: #1f2937; width: 35mm; flex-shrink: 0;">Description:</span>
                    <span style="font-size: 10pt; color: #374151; white-space: pre-wrap;">${data.projectDescription}</span>
                  </div>
                ` : ''}
              </div>

              <!-- Payment Details Table -->
              <div style="margin-bottom: 10mm;">
                <h3 style="color: #10b981; font-size: 12pt; font-weight: bold; margin-bottom: 5mm;">PAYMENT DETAILS:</h3>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="background-color: #10b981; color: white;">
                      <th style="padding: 3mm 5mm; text-align: left; font-size: 10pt; font-weight: bold;">Description</th>
                      <th style="padding: 3mm 5mm; text-align: right; font-size: 10pt; font-weight: bold;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style="background-color: white;">
                      <td style="padding: 3mm 5mm; border-bottom: 1px solid #e5e7eb; font-size: 10pt; color: #1f2937;">
                        ${data.paymentType === 'deposit' 
                          ? `Deposit Payment (${data.depositPercentage || 10}%)` 
                          : `Final Payment (${data.finalPercentage || 90}%)`}
                      </td>
                      <td style="padding: 3mm 5mm; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 10pt; color: #1f2937;">
                        ${data.currency} ${Number(data.amount).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                ${data.totalProjectAmount ? `
                  <div style="background-color: #f3f4f6; padding: 2mm 5mm; margin-top: 0; font-size: 9pt; color: #374151;">
                    Total Project Value: ${data.currency} ${Number(data.totalProjectAmount).toFixed(2)}
                  </div>
                ` : ''}

                <!-- Total Paid Bar -->
                <div style="background-color: #1f2937; color: white; padding: 3mm 5mm; margin-top: 0; display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 12pt; font-weight: bold;">TOTAL PAID</span>
                  <span style="font-size: 12pt; font-weight: bold;">${data.currency} ${Number(data.amount).toFixed(2)}</span>
                </div>
              </div>

              <!-- Payment Method & Status -->
              <div style="display: flex; justify-content: space-between; font-size: 10pt; color: #1f2937; margin-bottom: 40mm;">
                <div>Payment Method: ${data.paymentMethod}</div>
                <div style="text-align: right;">Status: PAID</div>
              </div>

            </div>

            <!-- Footer -->
            <div style="position: absolute; bottom: 15mm; left: 0; width: 100%; padding: 0 20mm; box-sizing: border-box;">
              <div style="border-top: 0.5px solid #10b981; margin-bottom: 5mm;"></div>
              <div style="text-align: center; color: #1f2937; font-size: 9pt;">
                <div>Bidhora</div>
                <div>Colombo, Sri Lanka</div>
                <div>contact@bidhora.com | https://bidhora.com</div>
                <div style="margin-top: 3mm; font-size: 8pt; color: #808080;">Thank you for your business!</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0px',
        right: '0px',
        bottom: '0px',
        left: '0px'
      }
    });

    return pdfBuffer;

  } catch (error) {
    console.error("Error generating PDF with Puppeteer:", error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Generate invoice number
 */
function generateInvoiceNumber(paymentType, projectId) {
  const prefix = paymentType === 'deposit' ? 'INV-DEP' : 'INV-FIN';
  const timestamp = Date.now();
  const shortProjectId = projectId.substring(0, 6).toUpperCase();
  return `${prefix}-${shortProjectId}-${timestamp}`;
}

/**
 * Send invoice email with PDF attachment
 */
async function sendInvoiceEmail(invoiceData) {
  // generateInvoicePDF now returns a Buffer directly
  const pdfBuffer = await generateInvoicePDF(invoiceData);
  
  const paymentTypeText = invoiceData.paymentType === 'deposit' ? 'Deposit' : 'Final';
  
  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Invoice - ${invoiceData.invoiceNumber}</title>
        <style>
          body { font-family: 'Inter', sans-serif; background: #f8fafc; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%); color: white; padding: 40px 30px; text-align: center; }
          .content { padding: 40px 30px; }
          .success-icon { font-size: 64px; text-align: center; margin-bottom: 20px; }
          .title { font-size: 24px; font-weight: 700; color: #1f2937; text-align: center; margin-bottom: 10px; }
          .subtitle { font-size: 16px; color: #6b7280; text-align: center; margin-bottom: 30px; }
          .invoice-box { background: #f0fdf4; border: 2px solid #059669; border-radius: 12px; padding: 20px; margin: 20px 0; }
          .invoice-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #d1fae5; }
          .invoice-row:last-child { border-bottom: none; font-weight: 700; }
          .label { color: #374151; font-weight: 600; }
          .value { color: #059669; }
          .button { display: inline-block; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; padding: 20px; background: #f9fafb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div style="font-size: 28px; font-weight: 700; margin-bottom: 10px;">Bidhora</div>
            <div>Payment Invoice</div>
          </div>
          <div class="content">
            <div class="success-icon">✅</div>
            <div class="title">Payment Successful!</div>
            <div class="subtitle">Thank you for your payment. Your invoice is attached.</div>
            
            <div class="invoice-box">
              <div class="invoice-row">
                <span class="label">Invoice No:</span>
                <span class="value">${invoiceData.invoiceNumber}</span>
              </div>
              <div class="invoice-row">
                <span class="label">Amount:</span>
                <span class="value">${invoiceData.currency} ${Number(invoiceData.amount).toFixed(2)}</span>
              </div>
              <div class="invoice-row">
                <span class="label">Date:</span>
                <span class="value">${invoiceData.invoiceDate}</span>
              </div>
            </div>

            <div style="text-align: center;">
              <a href="https://bidhora.com/profile" class="button">View Project Details</a>
            </div>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
            <p>&copy; ${new Date().getFullYear()} Bidhora. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const mailOptions = {
    from: '"Bidhora Payments" <contact@bidhora.com>',
    to: invoiceData.buyerEmail,
    subject: `Payment Receipt - ${invoiceData.projectTitle}`,
    html: emailHtml,
    attachments: [
      {
        filename: `Invoice_${invoiceData.invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  };

  await transporter.sendMail(mailOptions);
}

// Send marketer welcome email
exports.sendMarketerWelcomeEmail = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { email, name, promoCode, commissionRate, profileId } = req.body;

    if (!email || !promoCode) {
      res.status(400).json({ success: false, message: "Missing required fields" });
      return;
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to Bidhora Marketing Program</title>
          <style>
            body { font-family: 'Inter', sans-serif; background: #f8fafc; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 40px 30px; text-align: center; }
            .content { padding: 40px 30px; }
            .title { font-size: 24px; font-weight: 700; color: #1f2937; text-align: center; margin-bottom: 10px; }
            .subtitle { font-size: 16px; color: #6b7280; text-align: center; margin-bottom: 30px; }
            .info-box { background: #f0fdf4; border: 2px solid #059669; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; }
            .code { font-size: 32px; font-weight: 800; color: #059669; letter-spacing: 2px; margin: 10px 0; display: block; }
            .rate { font-size: 18px; color: #4b5563; font-weight: 600; }
            .button { display: inline-block; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; padding: 20px; background: #f9fafb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div style="font-size: 28px; font-weight: 700; margin-bottom: 10px;">Bidhora</div>
              <div>Marketing Partner Program</div>
            </div>
            <div class="content">
              <div class="title">Welcome Aboard, ${name}!</div>
              <div class="subtitle">You have been approved as a Bidhora Marketer.</div>
              
              <p style="color: #374151; line-height: 1.6; text-align: center;">
                We are excited to have you join our marketing team. Use your unique promo code below to invite new clients and earn commissions on their projects.
              </p>

              <div class="info-box">
                <div style="font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">Your Promo Code</div>
                <span class="code">${promoCode}</span>
                <div class="rate">Commission Rate: ${commissionRate}%</div>
              </div>

              <div style="text-align: center;">
                <a href="https://bidhora.com/profile/${profileId}" class="button">Access Your Dashboard</a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 20px;">
                Share this code with potential clients. When they start a project using your code, you'll earn a commission!
              </p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} Bidhora. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: '"Bidhora Team" <contact@bidhora.com>',
      to: email,
      subject: "Welcome to Bidhora Marketing Program - Your Promo Code",
      html: emailHtml,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ success: true, message: "Welcome email sent successfully" });
  } catch (error) {
    logger.error("Error sending marketer welcome email:", error);
    res.status(500).json({ success: false, message: "Failed to send email", error: error.message });
  }
});
