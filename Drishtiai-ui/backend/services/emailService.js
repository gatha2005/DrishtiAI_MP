require("dotenv").config();
const nodemailer = require("nodemailer");

console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS length:", process.env.EMAIL_PASS?.length);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
transporter.verify((error, success) => {
  if (error) {
    console.log("VERIFY ERROR:", error);
  } else {
    console.log("SMTP READY");
  }
});
async function sendAlertEmail(
  email,
  caseId,
  sketchPath,
  generatedPath
) {
 await transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: email,
  subject: "🚨 DrishtiAI Detection Alert",

  html: `
    <h2 style="color:red;">
      🚨 Suspect Detected
    </h2>

    <p>
      <b>Case ID:</b> ${caseId}
    </p>

    <p>
      <b>Detection Time:</b>
      ${new Date().toLocaleString()}
    </p>

    <hr>

    <h3>Original Sketch</h3>

    <img
      src="cid:sketchImage"
      width="250"
    />

    <br><br>

    <h3>Generated Face</h3>

    <img
      src="cid:generatedImage"
      width="250"
    />
  `,

  attachments: [
    {
      filename: "sketch.png",
      path: sketchPath,
      cid: "sketchImage"
    },
    {
      filename: "generated.png",
      path: generatedPath,
      cid: "generatedImage"
    }
  ]
});;

  console.log("✅ Alert Email Sent");
}

module.exports = sendAlertEmail;