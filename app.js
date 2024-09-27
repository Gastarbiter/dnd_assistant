// app.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";
import dotenv from "dotenv";
import session from "express-session"; // Import express-session

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure session middleware
app.use(
  session({
    secret: "your-secret-key", // Replace with a secure secret key
    resave: false,
    saveUninitialized: true,
  })
);

// Serve static files from the 'public' directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  // Initialize conversation history if it doesn't exist
  if (!req.session.messages) {
    req.session.messages = [
      {
        role: "system",
        content:
          "You are an expert assistant on Dungeons & Dragons. You have all the information about Dungeons & Dragons including its history, significance, and 5th edition guidebook. You know all the lore, character creation, rule sets, tips, and everything about it. Because it is a fantasy role-playing game, you behave like a wise and old wizard. You are somewhat humorous and occasionally sarcastic. You can also create character sheets for users and guide them.",
      },
    ];
  }

  // Add the user's message to the conversation history
  req.session.messages.push({ role: "user", content: userMessage });

  // Limit the conversation history to the last N messages
  const maxMessages = 10; // Adjust this number as needed
  const limitedMessages = req.session.messages.slice(-maxMessages);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Use "gpt-4" if you have access
      messages: limitedMessages,
    });

    const assistantReply = completion.choices[0].message.content;

    // Add the assistant's reply to the conversation history
    req.session.messages.push({
      role: "assistant",
      content: assistantReply,
    });

    res.json({ reply: assistantReply });
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request." });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
