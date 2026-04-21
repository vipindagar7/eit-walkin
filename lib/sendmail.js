import nodemailer from "nodemailer";

export const sendConfirmationMail = async (data) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Echelon Institute" <${process.env.EMAIL_USER}>`,
    to: data.emailId,
    subject: "Application Submitted Successfully – Echelon Institute",
    html: `
      <h2>Application Submitted Successfully 🎉</h2>
      <p>Dear <b>${data.fullName}</b>,</p>

      <p>Thank you for applying to <b>Echelon Institute of Technology, Faridabad</b>.</p>

      <p>We have received your application for the academic session <b>2026-27</b>.</p>

      <h3>Your Details:</h3>
      <ul>
        <li><b>Name:</b> ${data.fullName}</li>
        <li><b>Program:</b> ${data.program || "N/A"}</li>
        <li><b>Contact:</b> ${data.studentContactNo}</li>
      </ul>

      <p>Our team will contact you within <b>24 hours</b>.</p>

      <p>Regards,<br/>Admissions Team</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};