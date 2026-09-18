/**
 * ollama-client.ts
 *
 * Ollama + MCP client.
 *
 * MCP is connected once when the AI server starts.
 * callAI() is then called for each HTTP request.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Ollama, Message } from "ollama";

import dotenv from "dotenv";
import { ResultSchema } from "@modelcontextprotocol/sdk/types";
dotenv.config();

const OLLAMA_API = process.env.OLLAMA_API_KEY;
const OLLAMA_URL = "https://ollama.com";
const OLLAMA_MODEL = "gpt-oss:120b";

const ollama = new Ollama({
  host: OLLAMA_URL,
  headers: {
    Authorization: "Bearer " + OLLAMA_API,
  },
});

interface OpenAiTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type?: string;
      [key: string]: any;
    };
  };
}


// --------------------------------------------------
// MCP CLIENT
// --------------------------------------------------

const transport = new StdioClientTransport({
  command: "node",
  args: ["build/index.js"],
});

const mcpClient = new Client({
  name: "ollama-bridge",
  version: "1.0.0",
});


// --------------------------------------------------
// MCP TOOLS
// --------------------------------------------------

let openAiTools: OpenAiTool[] = [];


// --------------------------------------------------
// INITIALIZE MCP
// --------------------------------------------------

export async function initializeMCP() {
  await mcpClient.connect(transport);

  const { tools: mcpTools } = await mcpClient.listTools();

  openAiTools = mcpTools.map((t) => ({
    type: "function",
    function: {
      name: t.name,
      description: t.description ?? "",
      parameters: t.inputSchema,
    },
  }));

  // console.log(
  //   `Connected to MCP server. Discovered ${mcpTools.length} tools:`,
  //   mcpTools.map((t) => t.name).join(", ")
  // );
}



export async function getUserProfile(username: string) {
  const result = await mcpClient.readResource({
    uri: `portfolio://users/${username}`,
  });

  const resourceText = result.contents
  .map((content) => {
    if ("text" in content) {
      return content.text;
    }

    return "";
  })
  .join("\n");

  return resourceText;
}

// --------------------------------------------------
// AI CALL
// --------------------------------------------------

export async function callAI({
  messages,
  username,
}: {
  messages: Message[];
  username: string;
}) {

  const MAX_TURNS = 5;
  // console.log(`Calling Ollama with ${messages[messages.length - 1].content}`);
  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const res = await ollama.chat({
      model: OLLAMA_MODEL,
      messages,
      tools: openAiTools,
    });

    const assistantMessage = res.message;

    messages.push(assistantMessage);

    // ---------------------------------------------
    // Ollama gave final answer
    // ---------------------------------------------

    if (!assistantMessage.tool_calls?.length) {
      // console.log(`\nOllama: ${assistantMessage.content}\n`);

      return assistantMessage.content;
    }

    // ---------------------------------------------
    // Ollama requested tools
    // ---------------------------------------------

    for (const call of assistantMessage.tool_calls) {
      // console.log(
      //   `[calling tool: ${call.function.name}(${JSON.stringify(
      //     call.function.arguments
      //   )})]`
      // );

      const result = await mcpClient.callTool({
        name: call.function.name,
        arguments: call.function.arguments,
      });

      const resultText = Array.isArray(result.content)
        ? result.content
            .map((c) =>
              "text" in c ? c.text : JSON.stringify(c)
            )
            .join("\n")
        : JSON.stringify(result.content);

      messages.push({
        role: "tool",
        content: resultText,
      });
    }
  }

  return "I wasn't able to complete the request.";
}


// --------------------------------------------------
// SHUTDOWN
// --------------------------------------------------

export async function closeMCP() {
  await mcpClient.close();

  console.log("MCP connection closed.");
}