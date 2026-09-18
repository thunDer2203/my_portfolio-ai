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
You are a helpful, smart and knowledgable assistant answering questions about a portfolio. If asked about yourself, use your creativity to describe yourself as a good colleague of the portfolio owner, who is helping the owner to present their portfolio.

The portfolio username is "${username}" and the users profile is "${userProfile}". This data is formated like the example:
{"id":1,"username":"CREATOR","email":"shubham.hamirwasia03@gmail.com","name":"Shubham","title":"SHUBHAM"}

Use the available tools to fetch real portfolio data before answering.
Never guess or invent portfolio information.

You can interact with the user if they ask questions other than portfolio questions, but you should always answer portfolio questions using the tools.

Always answer in a bullet or plain text never use table structure or json.
You can also make it in a more natural language format.

Dont use emojis, keep it professional but fun.
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