"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {getSessionId} from "../utils/session";

import PortfolioHome from "./PortfolioHome";

import { useAuthStore } from "../store/authStore";
import { usePortfolioStore } from "../store/portfolioStore";

export default function Hero() {



/*
 * ------------------------------------------------
 * Simple markdown formatter (bold + line breaks)
 * ------------------------------------------------
 */
function formatMessage(content) {
  // Split on **bold** segments, keeping the delimiters
  const parts = content.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

  const username = usePortfolioStore((s) => s.username);

  const terminalUser = username || "shubham";

  const { user } = useAuthStore();

  const router = useRouter();

const inputRef = useRef(null);
const bottomRef = useRef(null);

  const [mounted, setMounted] = useState(false);
  const [showPortfolio, setShowPortfolio] = useState(false);

  const [input, setInput] = useState("");
 const [messages, setMessages] = useState([]);

  const [loading, setLoading] = useState(false);

  /*
   * ------------------------------------------------
   * Mounted
   * ------------------------------------------------
   */

  useEffect(() => {

    setMounted(true);
  }, []);

  /*
   * ------------------------------------------------
   * Auto scroll
   * ------------------------------------------------
   */

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading]);

  /*
   * ------------------------------------------------
   * Send message
   * ------------------------------------------------
   */

  const sendMessage = async () => {

    const sessionId = getSessionId();
    const trimmedInput = input.trim();

    if (!trimmedInput || loading) return;

    // Add user message immediately
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: trimmedInput,
      },
    ]);

    setInput("");

    setLoading(true);

    try {

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_AI_API_URL}/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: terminalUser==="shubham"?"creator":terminalUser,
            message: trimmedInput,
            converId: sessionId, // Use username as conversation ID for simplicity
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to communicate with AI server");
      }

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            data.response ||
            "I couldn't generate a response right now.",
        },
      ]);
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Unable to connect to the AI server. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /*
   * ------------------------------------------------
   * Keyboard handling
   * ------------------------------------------------
   */

const handleKeyDown = (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
};

  /*
   * ------------------------------------------------
   * Don't render before hydration
   * ------------------------------------------------
   */

  if (!mounted) return null;

  /*
   * ------------------------------------------------
   * Portfolio view
   * ------------------------------------------------
   */

  if (showPortfolio) {
    return (
      <PortfolioHome
        onReturn={() => setShowPortfolio(false)}
        username={username}
      />
    );
  }

  /*
   * ------------------------------------------------
   * Main UI
   * ------------------------------------------------
   */

  return (
    <main className="min-h-screen bg-lime-100 text-gray-800 relative overflow-hidden">

      {/* -------------------------------------------- */}
      {/* Background */}
      {/* -------------------------------------------- */}

      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(
              rgba(132, 204, 22, 0.08) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(132, 204, 22, 0.08) 1px,
              transparent 1px
            )
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* -------------------------------------------- */}
      {/* Top right buttons */}
      {/* -------------------------------------------- */}

      <div className="absolute top-5 right-5 z-20 flex items-center gap-2">

        {/* Dashboard */}

        <button
          onClick={() => {
            if (user) {
              router.push("/dashboard");
            } else {
              router.push("/register");
            }
          }}
          className="
            px-3
            py-1.5
            text-xs
            font-medium
            rounded-full
            border
            border-gray-700/20
            text-gray-700/70
            bg-lime-100/40
            backdrop-blur-sm
            transition-all
            duration-300
            hover:bg-gray-800
            hover:text-lime-100
            hover:border-gray-800
            hover:-translate-y-0.5
          "
        >
          {user ? "Dashboard" : "Create Portfolio"}
        </button>

        {/* Portfolio */}

        <button
          onClick={() => setShowPortfolio(true)}
          className="
            px-3
            py-1.5
            text-xs
            font-medium
            rounded-full
            bg-gray-800
            text-lime-100
            border
            border-gray-800
            transition-all
            duration-300
            hover:bg-gray-700
            hover:-translate-y-0.5
            hover:shadow-md
          "
        >
          Portfolio →
        </button>

      </div>

      {/* -------------------------------------------- */}
      {/* Content */}
      {/* -------------------------------------------- */}

      <div
        className={`
          relative
          z-10
          min-h-screen
          w-full
          flex
          flex-col
          mx-auto
          max-w-4xl
          px-5
          sm:px-8
          transition-all
          duration-700
        `}
      >

        {/* ---------------------------------------- */}
        {/* Empty state */}
        {/* ---------------------------------------- */}

        {messages.length === 0 && (
          <div
            className="
              flex-1
              flex
              flex-col
              items-center
              justify-center
              pb-20
            "
          >

            <h1
              className="
                text-4xl
                sm:text-5xl
                font-semibold
                tracking-tight
                text-gray-800
                font-sans
                mb-3
              "
            >
              Hello, {terminalUser}
            </h1>

            <p
              className="
                text-sm
                sm:text-base
                text-gray-600/70
                font-sans
                mb-8
              "
            >
              Ask me anything about this portfolio.
            </p>

            {/* Initial input */}

            <ChatInput
              input={input}
              setInput={setInput}
              sendMessage={sendMessage}
              handleKeyDown={handleKeyDown}
              inputRef={inputRef}
              loading={loading}
            />

          </div>
        )}

        {/* ---------------------------------------- */}
        {/* Chat state */}
        {/* ---------------------------------------- */}

        {messages.length > 0 && (
          <div className="flex flex-col min-h-screen">

            {/* Messages */}

            <div className="flex-1 pt-24 pb-40">

              <div className="space-y-8">

                {messages.map((message, index) => (
                  <div
                    key={index}
                    className="w-full"
                  >

                    {message.role === "user" ? (

                      <div className="flex justify-end">

                        <div className="max-w-[80%]">

                          <div className="text-[11px] text-gray-500 mb-1.5 text-right font-mono">
                            {terminalUser}
                          </div>

                          <div
                            className="
                              bg-gray-800
                              text-lime-100
                              px-4
                              py-3
                              rounded-2xl
                              rounded-br-md
                              text-sm
                              leading-relaxed
                              shadow-sm
                            "
                          >
                            {message.content}
                          </div>

                        </div>

                      </div>

                    ) : (

                      <div className="max-w-[85%]">

                        <div className="text-[11px] text-gray-500 mb-1.5 font-mono">
                          {terminalUser}.AI
                        </div>

                        <div
                          className="
                            text-gray-800
                            text-sm
                            sm:text-base
                            leading-7
                            whitespace-pre-wrap
                            font-sans
                          "
                        >
                          {formatMessage(message.content)}
                        </div>

                      </div>

                    )}

                  </div>
                ))}

                {/* -------------------------------- */}
                {/* Loading */}
                {/* -------------------------------- */}

                {loading && (
                  <div className="max-w-[85%]">

                    <div className="text-[11px] text-gray-500 mb-1.5 font-mono">
                      {terminalUser}.AI
                    </div>

                    <div className="flex items-center gap-1.5">

                      <span className="w-1.5 h-1.5 rounded-full bg-gray-600 animate-bounce" />

                      <span
                        className="
                          w-1.5
                          h-1.5
                          rounded-full
                          bg-gray-600
                          animate-bounce
                        "
                        style={{
                          animationDelay: "150ms",
                        }}
                      />

                      <span
                        className="
                          w-1.5
                          h-1.5
                          rounded-full
                          bg-gray-600
                          animate-bounce
                        "
                        style={{
                          animationDelay: "300ms",
                        }}
                      />

                    </div>

                  </div>
                )}


              </div>

            </div>
                <div ref={bottomRef} />

            {/* ------------------------------------ */}
            {/* Bottom input */}
            {/* ------------------------------------ */}

            <div
              className="
                fixed
                bottom-5
                left-1/2
                -translate-x-1/2
                w-[calc(100%-2rem)]
                max-w-3xl
                z-30
              "
            >
              <ChatInput
                input={input}
                setInput={setInput}
                sendMessage={sendMessage}
                handleKeyDown={handleKeyDown}
                inputRef={inputRef}
                loading={loading}
              />

              <p className="text-[10px] text-gray-500/60 text-center mt-2 font-mono">
                Enter to send · Shift + Enter for new line
              </p>
            </div>

          </div>
        )}

      </div>

    </main>
  );
}


/*
|--------------------------------------------------------------------------
| Chat Input
|--------------------------------------------------------------------------
*/

function ChatInput({
  input,
  setInput,
  sendMessage,
  handleKeyDown,
  inputRef,
  loading,
}) {
  return (
    <div className="w-full bg-lime-200/80 border border-gray-800/10 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 focus-within:ring-2 focus-within:ring-lime-500/60 focus-within:-translate-y-0.5">
      <textarea
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={loading}
        rows={1}
        placeholder="Ask me anything..."
        className="w-full min-h-[52px] max-h-40 resize-none bg-transparent px-5 pt-4 pb-2 text-sm text-gray-800 placeholder:text-gray-500 outline-none font-sans disabled:opacity-50"
      />

      <div className="flex justify-end px-3 pb-3">
        <button
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          className="w-8 h-8 rounded-full bg-gray-800 text-lime-100 flex items-center justify-center text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-30"
        >
          ↑
        </button>
      </div>
    </div>
  );
}