import mongoose from "mongoose";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config({ path: "/Users/apple/Desktop/nottexia/.env" });

import { User } from "../src/models/User";
import { Event } from "../src/models/Event";
import { EventChallenge } from "../src/models/EventChallenge";

function hashFlag(flag: string): string {
  return crypto.createHash("sha256").update(flag.trim()).digest("hex");
}

async function seedCTF() {
  const mongoUri = process.env.DATABASE_URL || "mongodb://localhost:27017/notexiav2";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB:", mongoUri);

  // Find or create admin user
  let host = await User.findOne({ role: "admin" });
  if (!host) {
    host = await User.create({
      name: "Notexia Host Admin",
      email: "admin@notexia.com",
      username: "admin_host",
      role: "admin",
    });
  }

  // Define exact requested times (4 Aug 2026 IST)
  // IST is UTC+05:30
  const regStart = new Date("2026-08-04T06:40:00+05:30");
  const regEnd   = new Date("2026-08-04T06:45:00+05:30");
  const evStart  = new Date("2026-08-04T06:46:00+05:30");
  const evEnd    = new Date("2026-08-04T06:50:00+05:30");

  const slug = `web-security-ctf-${Date.now()}`;

  // Create Event
  const ctfEvent = await Event.create({
    name: "Web Security Challenge CTF 2026",
    slug,
    description: "An intense 10-challenge CTF focusing on web security vulnerabilities including SQLi, XSS, Directory Traversal, IDOR, SSRF, and RCE.",
    type: "ctf",
    isPaid: false,
    price: 0,
    currency: "INR",
    registrationStart: regStart,
    registrationEnd: regEnd,
    eventStart: evStart,
    eventEnd: evEnd,
    rulesMarkdown: `# Web Security CTF Rules
1. Flags are formatted as \`NOTEXIA{...}\`.
2. Do not share flags or writeups during the event window.
3. Automated brute-forcing or denial of service against the server infrastructure is strictly prohibited.
4. Have fun and happy hacking!`,
    bannerUrl: "",
    status: "published",
    challengeReleaseMode: "all_at_once",
    createdBy: host._id,
    hostIds: [host._id],
  });

  console.log("\n✅ CTF Event Created Successfully!");
  console.log("--------------------------------------------------");
  console.log("ID:", ctfEvent._id.toString());
  console.log("Name:", ctfEvent.name);
  console.log("Slug:", ctfEvent.slug);
  console.log("Public URL:", `http://localhost:3000/events/${ctfEvent.slug}`);
  console.log("Registration Opens:", regStart.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }), "IST");
  console.log("Registration Closes:", regEnd.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }), "IST");
  console.log("Event Starts:", evStart.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }), "IST");
  console.log("Event Ends:", evEnd.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }), "IST");
  console.log("--------------------------------------------------\n");

  // 10 Web Security Challenges
  const challengesData = [
    {
      title: "1. Source Code Inspection",
      descriptionMarkdown: "A developer left a hidden comment in the frontend HTML. Inspect the page source to discover the secret flag.",
      category: "Web Security",
      points: 100,
      difficulty: "easy" as const,
      flag: "NOTEXIA{inspect_element_master_2026}",
      order: 1,
    },
    {
      title: "2. Cookie Tampering",
      descriptionMarkdown: "The authentication system trusts a client-side session cookie named `is_admin=false`. Tamper with the cookie value to elevate privileges and unlock the flag.",
      category: "Web Security",
      points: 150,
      difficulty: "easy" as const,
      flag: "NOTEXIA{admin_cookie_tampered_7712}",
      order: 2,
    },
    {
      title: "3. Hidden HTTP Response Header",
      descriptionMarkdown: "Check the HTTP response headers sent by the server. Inspect `X-Secret-Flag` to retrieve the flag.",
      category: "Web Security",
      points: 150,
      difficulty: "easy" as const,
      flag: "NOTEXIA{custom_x_header_found}",
      order: 3,
    },
    {
      title: "4. SQL Injection — Authentication Bypass",
      descriptionMarkdown: "The login form concatenates raw user input into an SQL query without sanitization. Use `' OR '1'='1` to bypass authentication.",
      category: "Web Security",
      points: 200,
      difficulty: "medium" as const,
      flag: "NOTEXIA{sqli_or_1_equals_1_bypass}",
      order: 4,
    },
    {
      title: "5. Reflected Cross-Site Scripting (XSS)",
      descriptionMarkdown: "The search input field reflects user input directly into the page without HTML escaping. Inject `<script>alert(document.cookie)</script>` to trigger the flag payload.",
      category: "Web Security",
      points: 200,
      difficulty: "medium" as const,
      flag: "NOTEXIA{alert_xss_payload_executed}",
      order: 5,
    },
    {
      title: "6. Directory Traversal / Path Manipulation",
      descriptionMarkdown: "The file viewer parameter `file=document.txt` allows relative directory navigation. Traverse back with `../../../../etc/passwd` to view system files.",
      category: "Web Security",
      points: 250,
      difficulty: "medium" as const,
      flag: "NOTEXIA{etc_passwd_file_leaked}",
      order: 6,
    },
    {
      title: "7. Insecure Direct Object Reference (IDOR)",
      descriptionMarkdown: "Changing your user ID in `GET /api/user?id=102` to `id=1` reveals the secret administrator profile data.",
      category: "Web Security",
      points: 250,
      difficulty: "medium" as const,
      flag: "NOTEXIA{idor_user_profile_pwned}",
      order: 7,
    },
    {
      title: "8. OS Command Injection",
      descriptionMarkdown: "The ping utility endpoint executes `exec('ping ' + host)`. Append a semicolon `; cat /flag.txt` to execute arbitrary bash commands.",
      category: "Web Security",
      points: 300,
      difficulty: "hard" as const,
      flag: "NOTEXIA{rce_command_injection_root}",
      order: 8,
    },
    {
      title: "9. JWT Secret Key Forgery",
      descriptionMarkdown: "The JWT token signature uses a weak secret key `secret123`. Crack the signature and modify the token payload `{ \"role\": \"admin\" }`.",
      category: "Web Security",
      points: 350,
      difficulty: "hard" as const,
      flag: "NOTEXIA{jwt_signature_forged_9901}",
      order: 9,
    },
    {
      title: "10. Server-Side Request Forgery (SSRF)",
      descriptionMarkdown: "The image fetcher proxies arbitrary URL requests. Send a request to `http://169.254.169.254/latest/meta-data/` to exfiltrate internal cloud metadata.",
      category: "Web Security",
      points: 400,
      difficulty: "hard" as const,
      flag: "NOTEXIA{ssrf_internal_metadata_exfiltrated}",
      order: 10,
    },
  ];

  console.log("📌 Creating 10 Web Security Challenges...\n");

  for (const item of challengesData) {
    const flagHash = hashFlag(item.flag);
    const created = await EventChallenge.create({
      eventId: ctfEvent._id,
      title: item.title,
      descriptionMarkdown: item.descriptionMarkdown,
      category: item.category,
      points: item.points,
      difficulty: item.difficulty,
      flagHash: flagHash,
      order: item.order,
    });

    console.log(`[${created.order}/10] Added: "${created.title}" | ${created.points}pts | Flag: ${item.flag}`);
  }

  console.log("\n🎉 All 10 challenges created and hashed successfully!");
  await mongoose.disconnect();
}

seedCTF().catch(console.error);
