// netlify/functions/contact.js
const nodemailer = require("nodemailer");

function badRequest(msg) {
    return { statusCode: 400, body: msg };
}

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    let data;
    try {
        data = JSON.parse(event.body || "{}");
    } catch {
        return badRequest("Invalid JSON.");
    }

    const name = (data.name || "").trim();
    const email = (data.email || "").trim();
    const subject = (data.subject || "").trim();
    const message = (data.message || "").trim();

    if (!name || !email || !subject || !message) return badRequest("Missing fields.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return badRequest("Invalid email.");

    // ✅ SMTP via variables d'environnement (Netlify)
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true", // true si 465, sinon false
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    const to = process.env.CONTACT_TO; // ton email de réception
    const from = process.env.MAIL_FROM || process.env.SMTP_USER; // un email autorisé par ton SMTP

    try {
        await transporter.sendMail({
            from: `PurKit <${from}>`,
            to,
            subject: `[PurKit] ${subject}`,
            replyTo: `${name} <${email}>`,
            text:
                `Nom: ${name}\n` +
                `Email: ${email}\n\n` +
                `Message:\n${message}\n`,
        });

        return { statusCode: 200, body: "OK" };
    } catch (err) {
        return { statusCode: 500, body: "Failed to send email." };
    }
};