const apiKey = process.env.GEMINI_API_KEY;
fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "api-key": apiKey,
    "x-goog-api-key": apiKey,
    "Authorization": `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    model: "gemini-1.5-flash",
    messages: [{role: "user", content: "hello"}],
  })
}).then(r => r.text()).then(console.log);
