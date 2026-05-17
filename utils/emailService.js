const nodemailer = require('nodemailer');
const { logger } = require('./logger');

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'sandbox.smtp.mailtrap.io',
    port: Number(process.env.EMAIL_PORT) || 2525,
    auth: {
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASS || '',
    },
  });
}

const transporter = createTransport();

/** @param {Record<string, any>} tenant */
function sendReservationEmail(reservationData, tenant) {
  const { name, email, date, time, guests, phone, specialRequests } = reservationData;
  const brand = tenant.brand.name;
  const from = `"${tenant.email.fromName}" <${tenant.email.fromAddress}>`;
  const addr = tenant.contact.addressLines.join('<br/>');

  const htmlContent = `
        <div style="font-family: Georgia, serif; background-color: #1A0A00; color: #F5F1E6; padding: 40px; border: 1px solid #C9A84C;">
            <h1 style="color: #C9A84C; text-align: center; border-bottom: 2px solid #C9A84C; padding-bottom: 10px;">${brand}</h1>
            <h2 style="text-align: center; font-style: italic;">Reservation Confirmed</h2>
            <p>Dear ${name},</p>
            <p>Your table is confirmed. Details:</p>
            <div style="background-color: #261200; padding: 20px; border-radius: 8px; border: 1px solid rgba(201,168,76,0.3);">
                <table style="width: 100%; color: #F5F1E6;">
                    <tr><td><strong>Date:</strong></td><td>${date}</td></tr>
                    <tr><td><strong>Time:</strong></td><td>${time}</td></tr>
                    <tr><td><strong>Guests:</strong></td><td>${guests} Persons</td></tr>
                    <tr><td><strong>Phone:</strong></td><td>${phone}</td></tr>
                    ${specialRequests ? `<tr><td><strong>Requests:</strong></td><td>${specialRequests}</td></tr>` : ''}
                </table>
            </div>
            <p style="margin-top: 30px;">
                <strong>Location:</strong><br/>${addr}<br/>
                <strong>Phone:</strong> ${tenant.contact.phone}
            </p>
            <footer style="margin-top: 40px; border-top: 1px solid #C9A84C; padding-top: 20px; text-align: center; font-size: 12px; color: rgba(245,241,230,0.5);">
                © ${new Date().getFullYear()} ${brand}
            </footer>
        </div>
    `;

  return transporter
    .sendMail({
      from,
      to: `${email}, ${tenant.contact.email}`,
      subject: `Table confirmed — ${brand} — ${date} ${time}`,
      html: htmlContent,
    })
    .then(() => {
      logger.info('Reservation email sent', { to: email });
      return true;
    })
    .catch((err) => {
      logger.warn('Reservation email failed', { message: err.message });
      return false;
    });
}

/** @param {Record<string, any>} tenant */
async function sendOrderReceipt(orderData, tenant) {
  const { cart, total, orderId, email } = orderData;
  const brand = tenant.brand.name;
  const from = `"${tenant.email.fromName}" <${tenant.email.fromAddress}>`;

  const itemsHtml = cart
    .map(
      (item) => `
    <tr>
        <td style="padding:10px; border-bottom:1px solid rgba(201,168,76,0.1);">${item.name} x ${item.quantity}</td>
        <td style="padding:10px; border-bottom:1px solid rgba(201,168,76,0.1); text-align:right;">₹${item.price * item.quantity}</td>
    </tr>
  `
    )
    .join('');

  const htmlContent = `
    <div style="font-family: 'Segoe UI', sans-serif; background-color: #0f0f0f; color: #fff; padding: 40px; border: 1px solid #C9A84C; max-width:600px; margin:auto;">
        <h2 style="color: #C9A84C; text-align: center; letter-spacing: 0.1em; text-transform: uppercase;">Order Receipt</h2>
        <p style="text-align:center; opacity:0.7;">Thank you for dining with ${brand}.</p>
        <div style="margin: 30px 0; border: 1px solid rgba(201,168,76,0.2); padding:20px;">
            <p style="font-size:12px; text-transform:uppercase; color:#C9A84C; margin-bottom:15px;">Order Details (#${orderId})</p>
            <table style="width:100%; font-size:14px; border-collapse:collapse;">
                ${itemsHtml}
                <tr>
                    <td style="padding:20px 10px 10px; font-weight:bold; color:#C9A84C;">Grand Total</td>
                    <td style="padding:20px 10px 10px; font-weight:bold; color:#C9A84C; text-align:right; font-size:18px;">₹${total}</td>
                </tr>
            </table>
        </div>
        <p style="font-size:12px; text-align:center; opacity:0.5; margin-top:40px;">
            Address: ${tenant.contact.addressLines.join(', ')}<br/>
            Contact: ${tenant.contact.phone}
        </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from,
      to: email,
      subject: `Your receipt from ${brand} — #${orderId}`,
      html: htmlContent,
    });
    logger.info('Receipt email sent', { orderId, to: email });
    return true;
  } catch (e) {
    logger.warn('Receipt email failed', { message: e.message });
    return false;
  }
}

/** @param {Record<string, any>} tenant */
async function sendOtpEmail(email, code, tenant) {
  const brand = tenant.brand.name;
  const from = `"${tenant.email.fromName}" <${tenant.email.fromAddress}>`;
  const html = `
    <div style="font-family: sans-serif; background:#0f0f0f;color:#eee;padding:32px;max-width:500px;margin:auto;border:1px solid #C9A84C;">
      <h2 style="color:#C9A84C;text-align:center;">${brand}</h2>
      <p style="text-align:center;">Your one-time verification code is:</p>
      <div style="font-size:32px;letter-spacing:0.4em;font-weight:bold;color:#C9A84C;text-align:center;padding:20px;background:rgba(201,168,76,0.05);border-radius:8px;margin:20px 0;">${code}</div>
      <p style="opacity:0.6;font-size:12px;text-align:center;">Expires in 10 minutes. If you did not request this, please ignore this email.</p>
    </div>`;
  try {
    await transporter.sendMail({
      from,
      to: email,
      subject: `${brand} — Your Verification Code`,
      html,
    });
    logger.info('OTP email sent', { to: email });
    return true;
  } catch (e) {
    logger.warn('OTP email failed', { message: e.message });
    return false;
  }
}

module.exports = { sendReservationEmail, sendOtpEmail, sendOrderReceipt };
