import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import {
  initializeMCP,
  callAI,
  closeMCP,
  getUserProfile
} from "../build/ollama-client.js";

dotenv.config();

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);


// --------------------------------------------------
// START MCP
// --------------------------------------------------

await initializeMCP();

const conversations = new Map();
// --------------------------------------------------
// /chat
// --------------------------------------------------

app.post("/chat", async (req, res) => {
  try {
    const { message, username, converId } = req.body;

    if (!message || !message.trim() || !converId || !converId.trim() || !username || !username.trim()) {
      return res.status(400).json({
        error: "Something went wrong",
      });
    }

    // console.log("\n-----------------------------");
    // console.log("Incoming request");
    // console.log("Username:", username);
    // console.log("Message:", message);
    // console.log("Conversation ID:", converId);
    // console.log("-----------------------------");

    let messages=conversations.get(converId);
    // console.log("Existing messages for conversation:", messages);
    if(!messages){
        const userProfile = await getUserProfile(username);
        messages = [
            {
      role: "system",
      content: `
You are the AI assistant embedded in ${username}'s portfolio website. You represent them professionally to visitors — think of yourself as a knowledgeable colleague who knows their work well and is helping present it.

Portfolio owner profile: ${userProfile} (format: {"id","username","email","name","title"})

Rules:

Before answering any question about the owner's work, skills, projects, or experience, call the available tools to fetch real data. Never invent or assume portfolio details — if a tool returns nothing relevant, say you don't have that information rather than guessing.
Stay on topic. You exist to talk about this portfolio and the owner's professional work. If a visitor asks something unrelated (general chit-chat, unrelated tech questions, etc.), you can engage briefly and naturally, but steer back toward the portfolio rather than sustaining long tangents.
Keep responses conversational and natural — short paragraphs or simple bullet points only. Never output tables, JSON, or markdown code blocks.
No emojis. Tone is professional but warm, not stiff.
Be concise by default. Expand only when the visitor asks a follow-up or the question genuinely needs detail.
If asked who you are, describe yourself briefly as ${username}'s assistant/colleague helping showcase their work — don't overdo the personality, one or two lines is enough.
If a question is ambiguous (e.g. "tell me about the projects"), ask one clarifying question or give a short overview and offer to go deeper, rather than dumping everything at once.
      `,
    },

    {
      role: "user",
      content: message,
    },
        ];

    }

    messages.push({role:"user",content:message})
    const response = await callAI({
      messages,
      username,
    });

    messages.push({role:"assisstant",content:response});
    conversations.set(converId,messages);

    return res.json({
      response,
    });
  } catch (error) {
    console.error("AI server error:", error);

    return res.status(500).json({
      error: "Failed to process AI request",
    });
  }
});

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the AI server" });
});
// --------------------------------------------------
// START SERVER
// --------------------------------------------------

const PORT = process.env.PORT || 1143;

app.listen(PORT, () => {
  console.log(`AI server running on port ${PORT}`);
});


// --------------------------------------------------
// SHUTDOWN
// --------------------------------------------------

process.on("SIGINT", async () => {
  await closeMCP();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await closeMCP();
  process.exit(0);
});