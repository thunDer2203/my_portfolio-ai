import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import {
  initializeMCP,
  callAI,
  closeMCP,
} from "../build/ollama-client.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());


// --------------------------------------------------
// START MCP
// --------------------------------------------------

await initializeMCP();


// --------------------------------------------------
// /chat
// --------------------------------------------------

app.post("/chat", async (req, res) => {
  try {
    const { message, username } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    console.log("\n-----------------------------");
    console.log("Incoming request");
    console.log("Username:", username);
    console.log("Message:", message);
    console.log("-----------------------------");

    const response = await callAI({
      message,
      username,
    });

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