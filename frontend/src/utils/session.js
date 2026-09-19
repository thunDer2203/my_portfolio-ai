export function getSessionId(username) {
  if (typeof window === "undefined" || !username) return null;

  const key = `chat_session_id:${username}`;
  let sessionId = sessionStorage.getItem(key);

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(key, sessionId);
  }

  return sessionId;
}
