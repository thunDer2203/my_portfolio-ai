export function getSessionId() {
  if (typeof window === "undefined") return null;

  let sessionId = localStorage.getItem("chat_session_id");

  if (!sessionId) {
    sessionId = crypto.randomUUID(); // built into modern browsers
    localStorage.setItem("chat_session_id", sessionId);
  }

  return sessionId;
}
