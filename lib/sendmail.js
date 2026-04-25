import nodemailer from "nodemailer";

export const sendConfirmationMail = async (data) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const courses = (data.coursesInterested || []).join(", ") || data.program || "N/A";

  const mailOptions = {
    from: `"Echelon Institute of Technology" <${process.env.EMAIL_USER}>`,
    to: data.emailId,
    subject: "Thank You for Your Interest – Echelon Institute of Technology",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#1a56db;padding:28px 36px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:800;letter-spacing:0.5px;">
                ECHELON INSTITUTE OF TECHNOLOGY
              </h1>
              <p style="margin:6px 0 0;color:#c7d8f8;font-size:12px;">
                Affiliated to Guru Gobind Singh Indraprastha University &nbsp;|&nbsp; Approved by AICTE
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 36px 28px;">

              <p style="margin:0 0 18px;font-size:15px;color:#1a202c;">
                Dear <strong>${data.fullName}</strong>,
              </p>

              <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">
                Thank you for showing your interest in the
                <strong style="color:#1a56db;">${courses}</strong>
                at <strong>Echelon Institute of Technology</strong>, affiliated to
                Guru Gobind Singh Indraprastha University. We are glad to have had
                the opportunity to connect with you and understand your academic aspirations.
              </p>

              <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">
                At Echelon, we take pride in being an institute <em>of the students, for the
                students, by the students</em>. With a strong focus on experiential education,
                we ensure that learning goes beyond classrooms through hands-on projects,
                industry exposure, and practical application.
              </p>

              <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.7;">
                We encourage you to proceed with the admission process at the earliest,
                as seats in your chosen program are limited and offered on a
                <strong>first-come, first-served</strong> basis.
              </p>

              <!-- Next Steps box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;border-left:4px solid #1a56db;border-radius:6px;margin-bottom:24px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#1a56db;text-transform:uppercase;letter-spacing:0.5px;">
                      Next Steps
                    </p>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:4px 0;font-size:14px;color:#374151;">
                          &bull;&nbsp; Review detailed information about your chosen course
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;font-size:14px;color:#374151;">
                          &bull;&nbsp;Complete your admission formalities
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;font-size:14px;color:#374151;">
                          &bull;&nbsp; Explore applicable scholarships
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.7;">
                For any further information or assistance, you may reply to this email
                or contact us at <strong>9999753763</strong>.
              </p>

              <p style="margin:0 0 6px;font-size:15px;color:#374151;">
                We look forward to welcoming you to Echelon Institute of Technology.
              </p>

              <p style="margin:24px 0 0;font-size:15px;color:#374151;line-height:1.7;">
                Warm regards,<br/>
                <strong>Admissions Team</strong><br/>
                Echelon Institute of Technology
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f9ff;border-top:1px solid #e5e7eb;padding:18px 36px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                Echelon Institute of Technology, Faridabad, Haryana
              </p>
              <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;">
                This is an automated email. Please do not reply directly — or call us at 9999753763.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
    `,
  };

  await transporter.sendMail(mailOptions);
};