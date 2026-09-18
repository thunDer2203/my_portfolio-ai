import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";


const server = new McpServer({
  name: "portfolio-mcp-server2",
  version: "1.0.0",
});
const BASE_URL = "http://localhost:5000/api";

// ---- Tools ----
// Each tool is a discrete, callable action an LLM client can invoke.
// Keep descriptions specific — the model decides *when* to call a tool
// based on this text, so vague descriptions lead to it picking the wrong one.

server.tool(
  "get_about",
  "Get the portfolio owner's bio, headline, name, and location.",
  {
    username: z.string().optional().describe("The portfolio owner's username, e.g. 'tester'"),
  },
  async ({ username }) => {
    const about = await fetch(`${BASE_URL}/about${username ? `/${username}` : ""}`).then((res) => res.json());
    return {
      content: [{ type: "text", text: JSON.stringify(about, null, 2) }],
    };
  }
);

server.tool(
  "get_skills",
  "List the portfolio owner's technical skills, optionally filtered by username (e.g. 'tester').",
  {
    username: z
      .string()
      .optional()
      .describe("Optional username to filter by, e.g. 'tester'"),
  },
  async ({ username }) => {
    const skills = await fetch(`${BASE_URL}/skills${username ? `/${username}` : ""}`).then((res) => res.json());
    return {
      content: [{ type: "text", text: JSON.stringify(skills, null, 2) }],
    };
  }
);

server.tool(
  "get_projects",
  "List all projects on the portfolio, including their description and tech stack.",
  {
    username:z.string().optional().describe("Optional username to filter by, e.g. 'tester'")
  },
  async ({ username }) => {
    const projects = await fetch(`${BASE_URL}/projects${username ? `/${username}` : ""}`).then((res) => res.json());
    return {
      content: [{ type: "text", text: JSON.stringify(projects, null, 2) }],
    };
  }
);

// server.tool(
//   "search_projects",
//   "Search projects by keyword — matches against project name, description, or tech stack. Use this for questions like 'does he have experience with X'.",
//   {
//     query: z.string().describe("Keyword to search for, e.g. 'Postgres' or 'webhook'"),
//   },
//   async ({ query }) => {
//     const results = await searchProjects(query);
//     return {
//       content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
//     };
//   }
// );

server.tool(
  "get_experience",
  "List the portfolio owner's work experience, including role, company, and dates.",
  {
    username: z.string().optional().describe("Optional username to filter by, e.g. 'tester'")
  },
  async ({ username }) => {
    const experience = await fetch(`${BASE_URL}/experience${username ? `/${username}` : ""}`).then((res) => res.json());
    return {
      content: [{ type: "text", text: JSON.stringify(experience, null, 2) }],
    };
  }
);

// server.tool(
//   "get_resume_url",
//   "Get the URL to the portfolio owner's downloadable resume.",
//   {
//     username: z.string().optional().describe("Optional username to filter by, e.g. 'tester'")
//   },
//   async ({ username }) => {
//     const url = await fetch(`${BASE_URL}/resume${username ? `/${username}` : ""}`).then((res) => res.json());
//     return { content: [{ type: "text", text: url }] };
//   }
// );

server.tool(
  "get_social_links",
  "List the portfolio owner's social/professional links (GitHub, LinkedIn, etc).",
  {
    username: z.string().optional().describe("Optional username to filter by, e.g. 'tester'")
  },
  async ({ username }) => {
    const links = await fetch(`${BASE_URL}/socials${username ? `/${username}` : ""}`).then((res) => res.json());
    return {
      content: [{ type: "text", text: JSON.stringify(links, null, 2) }],
    };
  }
);

// ---- Start server over stdio ----
// stdio transport = for local testing with Claude Desktop / MCP Inspector.
// For the public-facing portfolio chat widget, you'll later swap this for
// the Streamable HTTP transport so it's reachable over the web. See README.

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Portfolio MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error starting server:", err);
  process.exit(1);
});
