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
const logger = require("firebase-functions/logger");
const nodemailer = require("nodemailer");

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
                  <a href="${project_link || 'https://www.bidhora.com/dashboard'}" class="action-button">
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
