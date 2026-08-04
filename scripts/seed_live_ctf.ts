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

async function seedLiveCTF() {
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

  const now = new Date();
  // Registration & Event active right now (started 15 mins ago, active for next 2 hours)
  const regStart = new Date(now.getTime() - 15 * 60 * 1000);
  const regEnd   = new Date(now.getTime() + 120 * 60 * 1000);
  const evStart  = new Date(now.getTime() - 15 * 60 * 1000);
  const evEnd    = new Date(now.getTime() + 120 * 60 * 1000);

  const slug = `live-web-security-ctf-${Date.now()}`;

  // Create Event
  const ctfEvent = await Event.create({
    name: "🚀 Live Practice Web Security CTF",
    slug,
    description: "Active practice CTF featuring 10 web security challenges ranging from beginner HTML inspection to advanced RCE & SSRF exploitation.",
    type: "ctf",
    isPaid: false,
    price: 0,
    currency: "INR",
    registrationStart: regStart,
    registrationEnd: regEnd,
    eventStart: evStart,
    eventEnd: evEnd,
    rulesMarkdown: `# Web Security Practice CTF Rules
1. All flags format: \`NOTEXIA{...}\`.
2. Submit flags in the CTF Arena to score points and climb the live leaderboard.
3. Decaying score model is enabled: earlier solves yield more points!
4. Hints cost 20 points each to unlock.
5. Good luck & happy hacking!`,
    bannerUrl: "",
    status: "live",
    challengeReleaseMode: "all_at_once",
    createdBy: host._id,
    hostIds: [host._id],
  });

  console.log("\n✅ Live CTF Event Created Successfully!");
  console.log("--------------------------------------------------");
  console.log("ID:", ctfEvent._id.toString());
  console.log("Name:", ctfEvent.name);
  console.log("Slug:", ctfEvent.slug);
  console.log("Event Page:", `http://localhost:3000/events/${ctfEvent.slug}`);
  console.log("Register URL:", `http://localhost:3000/events/${ctfEvent.slug}/register`);
  console.log("Arena URL:", `http://localhost:3000/events/${ctfEvent.slug}/arena`);
  console.log("--------------------------------------------------\n");

  // 10 Web Security Challenges with answers/flags
  const challengesData = [
    {
      title: "1. Source Code Inspection",
      descriptionMarkdown: "A developer left a secret flag in the HTML source code. Can you find it?\n\n**Hint**: Press `Ctrl+U` or `Inspect Element`.",
      category: "Web Security",
      points: 100,
      difficulty: "easy" as const,
      flag: "NOTEXIA{inspect_element_master_2026}",
      order: 1,
      hints: [
        { text: "Look for HTML comment tags: <!-- NOTEXIA{...} -->", cost: 20 },
      ],
    },
    {
      title: "2. Cookie Privilege Escalation",
      descriptionMarkdown: "The app uses a cookie `role=user`. Change it to gain administrator rights and view the secret flag.",
      category: "Web Security",
      points: 150,
      difficulty: "easy" as const,
      flag: "NOTEXIA{admin_cookie_tampered_7712}",
      order: 2,
      hints: [
        { text: "Use your browser DevTools -> Application -> Cookies -> set role=admin", cost: 20 },
      ],
    },
    {
      title: "3. Hidden HTTP Header",
      descriptionMarkdown: "Inspect the HTTP response headers returned by the server endpoint to reveal `X-Secret-Flag`.",
      category: "Web Security",
      points: 150,
      difficulty: "easy" as const,
      flag: "NOTEXIA{http_header_secret_9941}",
      order: 3,
      hints: [
        { text: "Check Network tab -> Headers -> Response Headers", cost: 20 },
      ],
    },
    {
      title: "4. SQL Injection Authentication Bypass",
      descriptionMarkdown: "Bypass the login screen using a classic SQL injection payload: `' OR '1'='1`.",
      category: "Web Security",
      points: 200,
      difficulty: "medium" as const,
      flag: "NOTEXIA{sqli_bypass_auth_successful}",
      order: 4,
      hints: [
        { text: "Input `' OR 1=1 --` into username field.", cost: 20 },
      ],
    },
    {
      title: "5. Directory Traversal / Path Traversal",
      descriptionMarkdown: "Read the secret system file by abusing path traversal: `GET /api/download?file=../../../../etc/passwd`.",
      category: "Web Security",
      points: 250,
      difficulty: "medium" as const,
      flag: "NOTEXIA{path_traversal_etc_passwd_found}",
      order: 5,
      hints: [
        { text: "Use `../` sequences to navigate out of the web root directory.", cost: 20 },
      ],
    },
    {
      title: "6. Reflected Cross-Site Scripting (XSS)",
      descriptionMarkdown: "Inject a payload `<script>alert('XSS')</script>` into the search parameter to trigger the secret XSS flag.",
      category: "Web Security",
      points: 250,
      difficulty: "medium" as const,
      flag: "NOTEXIA{reflected_xss_executed_8832}",
      order: 6,
      hints: [
        { text: "Parameters not sanitized: `?q=<script>...`", cost: 20 },
      ],
    },
    {
      title: "7. Insecure Direct Object Reference (IDOR)",
      descriptionMarkdown: "Access user profile ID #1 directly by changing the URL parameter `/user/profile?id=1`.",
      category: "Web Security",
      points: 300,
      difficulty: "medium" as const,
      flag: "NOTEXIA{idor_admin_profile_accessed_3310}",
      order: 7,
      hints: [
        { text: "Change `id=105` to `id=1` in the request parameters.", cost: 20 },
      ],
    },
    {
      title: "8. Server-Side Request Forgery (SSRF)",
      descriptionMarkdown: "Force the server to issue a request to internal loopback `http://127.0.0.1:8080/admin/flag`.",
      category: "Web Security",
      points: 350,
      difficulty: "hard" as const,
      flag: "NOTEXIA{ssrf_internal_admin_pwned_5501}",
      order: 8,
      hints: [
        { text: "Target localhost/127.0.0.1 via the webhook/fetch URL endpoint.", cost: 20 },
      ],
    },
    {
      title: "9. Broken Access Control (JWT Sub Claim)",
      descriptionMarkdown: "Modify the JWT payload sub claim to `admin` without verifying signature on a weak secret app.",
      category: "Web Security",
      points: 400,
      difficulty: "hard" as const,
      flag: "NOTEXIA{jwt_unsigned_none_algorithm_flag}",
      order: 9,
      hints: [
        { text: "Set algorithm to `none` or change payload claims on jwt.io", cost: 20 },
      ],
    },
    {
      title: "10. Remote Code Execution (RCE)",
      descriptionMarkdown: "Exploit command injection in the ping utility parameter: `127.0.0.1; cat /flag.txt`.",
      category: "Web Security",
      points: 500,
      difficulty: "hard" as const,
      flag: "NOTEXIA{rce_command_injection_root_flag_9999}",
      order: 10,
      hints: [
        { text: "Use semicolon `;` or pipe `|` to chain system commands.", cost: 20 },
      ],
    },
  ];

  for (const item of challengesData) {
    await EventChallenge.create({
      eventId: ctfEvent._id,
      title: item.title,
      descriptionMarkdown: item.descriptionMarkdown,
      category: item.category,
      points: item.points,
      difficulty: item.difficulty,
      flagHash: hashFlag(item.flag),
      order: item.order,
      hints: item.hints,
    });
    console.log(`Created Challenge ${item.order}: ${item.title} (${item.points} pts) -> Flag: ${item.flag}`);
  }

  console.log("\n🎉 All 10 challenges created! CTF is Live now!");
  process.exit(0);
}

seedLiveCTF().catch((err) => {
  console.error(err);
  process.exit(1);
});
