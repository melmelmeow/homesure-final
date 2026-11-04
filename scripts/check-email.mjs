/**
 * Does the mail setup actually work?  ->  npm run check-email
 *
 * Reads .env.local, connects to the SMTP server, and sends one real message. Run this before
 * trying the signup form: if something is wrong it says which setting, instead of leaving you to
 * guess from a failed sign-up.
 *
 *   npm run check-email                 sends to SMTP_FROM
 *   npm run check-email you@gmail.com   sends to that address instead
 */
import fs from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";

const ROOT = process.cwd();
const ENV_FILE = path.join(ROOT, ".env.local");

const GREEN = "\x1b[32m", RED = "\x1b[31m", YELLOW = "\x1b[33m", DIM = "\x1b[2m", OFF = "\x1b[0m";
const ok = (m) => console.log(`${GREEN}  OK${OFF}   ${m}`);
const bad = (m) => console.log(`${RED}  FAIL${OFF} ${m}`);
const note = (m) => console.log(`${DIM}       ${m}${OFF}`);

function loadEnv(file) {
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    // Strip one layer of matching quotes, the way dotenv does.
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[match[1]] = value;
  }
  return out;
}

console.log("\nKasafide — email check\n");

const env = loadEnv(ENV_FILE);
if (!Object.keys(env).length) {
  bad(`No .env.local found at ${ENV_FILE}`);
  process.exit(1);
}

const REQUIRED = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM"];
const missing = REQUIRED.filter((key) => !env[key]);

if (missing.length) {
  bad(`These are still blank in .env.local: ${missing.join(", ")}`);
  console.log(`
${YELLOW}  What to do${OFF}

  Sign up free at ${YELLOW}brevo.com${OFF}, then open
  your name (top right) -> ${YELLOW}SMTP & API${OFF} -> the ${YELLOW}SMTP${OFF} tab.

  Copy what it shows into .env.local:

    SMTP_HOST=smtp-relay.brevo.com
    SMTP_PORT=587
    SMTP_USER=<the "Login" it shows you>
    SMTP_PASSWORD=<the Master Password>
    SMTP_FROM="Kasafide <your-own-email@gmail.com>"

  Brevo emails you once to confirm that From address. Click that link, or nothing will send.
  Then run this check again.
`);
  process.exit(1);
}

ok("All five SMTP settings are filled in");

const port = Number(env.SMTP_PORT);
if (!Number.isInteger(port) || port <= 0) {
  bad(`SMTP_PORT is "${env.SMTP_PORT}", which is not a port number. Use 587 for most providers.`);
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port,
  secure: port === 465,          // 465 is implicit TLS; 587 upgrades with STARTTLS
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
});

try {
  await transporter.verify();
  ok(`Connected to ${env.SMTP_HOST}:${port} and the login was accepted`);
} catch (err) {
  bad(`Could not connect to ${env.SMTP_HOST}:${port}`);
  note(err.message);
  const text = String(err.message).toLowerCase();
  if (text.includes("unauthorized ip") || text.includes("525")) {
    note("Your credentials are fine. The provider is refusing this machine's IP address.");
    note("Brevo blocks SMTP from any IP not on its allowlist, and home connections change IP");
    note("whenever the router restarts.");
    try {
      const res = await fetch("https://api.ipify.org", { signal: AbortSignal.timeout(8000) });
      if (res.ok) note(`This machine is currently ${(await res.text()).trim()}.`);
    } catch {
      note("Search \"what is my ip\" to find this machine's address.");
    }
    note("In Brevo: SMTP & API -> Authorised IPs. Add it, or turn the restriction off.");
  } else if (text.includes("auth") || text.includes("credentials") || text.includes("535")) {
    note("That is a login problem: check SMTP_USER and SMTP_PASSWORD.");
    note('On Brevo the user is a login like "8a1b2c001@smtp-brevo.com", not your email address.');
    note("On Gmail the password must be an App Password, not your normal one.");
  } else if (text.includes("timeout") || text.includes("econnrefused") || text.includes("enotfound")) {
    note("That is a connection problem: check SMTP_HOST and SMTP_PORT, and your internet.");
  }
  process.exit(1);
}

const to = process.argv[2] || env.SMTP_FROM.match(/<([^>]+)>/)?.[1] || env.SMTP_FROM;

try {
  const info = await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject: "Kasafide — email is working",
    text: "If you are reading this, Kasafide can send email. Sign-up confirmation links will arrive the same way.",
    html: `<p style="font-family:sans-serif;font-size:15px;color:#2B1B3D;">
             If you are reading this, Kasafide can send email.<br>
             Sign-up confirmation links will arrive the same way.
           </p>`,
  });
  ok(`Test message sent to ${to}`);
  note(`message id ${info.messageId}`);
  console.log(`\n${GREEN}  Email is working.${OFF} Check that inbox — look in spam too, the first one often lands there.\n`);
} catch (err) {
  bad(`Connected fine, but sending failed`);
  note(err.message);
  if (/sender|from|not verified|unauthorized/i.test(err.message)) {
    note(`Your provider has not approved the From address (${env.SMTP_FROM}).`);
    note("On Brevo: Senders & IPs -> add the address -> click the link they email you.");
  }
  process.exit(1);
}
