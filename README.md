🤖 Prep AI:Your personal interview coach
Ace Your Next Behavioral Interview.

Let's be real, behavioral interviews can be tough. It's hard to practice for those "tell me about a time when..." questions without feeling repetitive. I built Prep AI during a hackathon to scratch my own itch: a simple tool for realistic practice and instant, honest feedback. It uses the Google Gemini API to make sure you're always on your toes.

✨ What it Does
Unlimited, Realistic Questions: No more stale, predictable questions from a list. Get a fresh behavioral prompt every time you click 'Next'.

Feedback That Actually Helps: Get a quick summary of what you did well and where you can improve. No fluff, just actionable advice.

Deep Dive with the STAR Method: Want to know why the feedback says what it does? Get a detailed breakdown of your answer based on the industry-standard STAR framework.

Clean, Focused UI: A simple, modern interface that works great on any device, because your focus should be on practicing, not fighting the layout.

Light & Dark Modes: Automatically syncs with your system theme, with a toggle if you feel like a change.

🚀 Built With
🛠️ How to Run It
Want to fire this up locally? It couldn't be easier:

Clone this repo or just download the three main files.

Toss index.html, style.css, and script.js into the same folder.

Open index.html in your browser.

That's all. No installers, no build steps, no nonsense.

⚙️ How It Works (The Guts)
Prep AI is a simple frontend that talks to the Google Gemini API. Here’s the play-by-play:

When you ask for a question, the app pings the API with a carefully tuned prompt to get a good behavioral question.

You type your answer and hit submit.

The app sends your answer and the original question back to the API, but this time it tells the AI to act as a critical but fair interview coach.

The AI's feedback streams back to the screen. I also built in a retry-logic in case the API is having a busy day.

🔮 What's Next?
This was built in a very short timespan, so there's plenty more that could be done. Here are a few ideas floating around:

Session History: It'd be cool to see a log of your past answers and track your improvement over time.

Question Categories: Let users focus on specific skills like "Leadership," "Teamwork," or "Conflict Resolution."

Voice Mode: Re-implement speech-to-text so you can practice your answers by speaking them, which is way more realistic.

User Accounts: Maybe add a simple login to save your session history.
