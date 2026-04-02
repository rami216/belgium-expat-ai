"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const QUESTION =
  "I just moved to a new apartment. How many days do I have to register at the local commune before I get fined?";
const ANSWER_PARTS = [
  "Welcome to Belgium! By law, you must register your new address at the commune ",
  "within 8 days",
  " of arriving. Make sure you bring your passport and your lease agreement!",
];
const FULL_ANSWER = ANSWER_PARTS.join("");

function useTypewriter(text: string, speed = 28, active = false) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const idx = useRef(0);

  useEffect(() => {
    if (!active) {
      setDisplayed("");
      setDone(false);
      idx.current = 0;
      return;
    }
    if (idx.current >= text.length) {
      setDone(true);
      return;
    }
    const t = setTimeout(() => {
      idx.current += 1;
      setDisplayed(text.slice(0, idx.current));
      if (idx.current >= text.length) setDone(true);
    }, speed);
    return () => clearTimeout(t);
  }, [active, displayed, text, speed]);

  return { displayed, done };
}

type Phase =
  | "idle"
  | "typing-question"
  | "question-sent"
  | "ai-thinking"
  | "ai-replying"
  | "reply-done"
  | "highlighting"
  | "popup-shown"
  | "saving"
  | "saved"
  | "notebook";

export default function HowItWorksPage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [inputVal, setInputVal] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [category, setCategory] = useState("Commune");
  const [notebookVisible, setNotebookVisible] = useState(false);

  const questionTyped = useTypewriter(
    QUESTION,
    22,
    phase === "typing-question",
  );
  const answerTyped = useTypewriter(FULL_ANSWER, 18, phase === "ai-replying");

  useEffect(() => {
    if (phase === "typing-question") setInputVal(questionTyped.displayed);
  }, [phase, questionTyped.displayed]);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    if (phase === "typing-question" && questionTyped.done) {
      t = setTimeout(() => setPhase("question-sent"), 400);
    }
    if (phase === "question-sent") {
      t = setTimeout(() => setPhase("ai-thinking"), 500);
    }
    if (phase === "ai-thinking") {
      t = setTimeout(() => setPhase("ai-replying"), 1800);
    }
    if (phase === "ai-replying" && answerTyped.done) {
      t = setTimeout(() => setPhase("reply-done"), 600);
    }
    if (phase === "reply-done") {
      t = setTimeout(() => setPhase("highlighting"), 900);
    }
    if (phase === "highlighting") {
      t = setTimeout(() => setPhase("popup-shown"), 1000);
    }
    if (phase === "popup-shown") {
      t = setTimeout(() => setPhase("saving"), 1800);
    }
    if (phase === "saving") {
      t = setTimeout(() => {
        setPhase("saved");
        setNotebookVisible(true);
      }, 800);
    }
    if (phase === "saved") {
      t = setTimeout(() => setPhase("notebook"), 900);
    }
    return () => clearTimeout(t);
  }, [phase, questionTyped.done, answerTyped.done]);

  const start = () => {
    setPhase("idle");
    setInputVal("");
    setShowPopup(false);
    setNotebookVisible(false);
    setTimeout(() => setPhase("typing-question"), 300);
  };

  const isHighlighting = [
    "highlighting",
    "popup-shown",
    "saving",
    "saved",
    "notebook",
  ].includes(phase);
  const showQuestion = [
    "question-sent",
    "ai-thinking",
    "ai-replying",
    "reply-done",
    "highlighting",
    "popup-shown",
    "saving",
    "saved",
    "notebook",
  ].includes(phase);
  const showThinking = phase === "ai-thinking";
  const showAnswer = [
    "ai-replying",
    "reply-done",
    "highlighting",
    "popup-shown",
    "saving",
    "saved",
    "notebook",
  ].includes(phase);
  const showChat = phase !== "idle";

  const answerText = showAnswer
    ? phase === "ai-replying"
      ? answerTyped.displayed
      : FULL_ANSWER
    : "";

  const highlightIdx = isHighlighting
    ? answerText.indexOf("within 8 days")
    : -1;
  const before =
    highlightIdx >= 0 ? answerText.slice(0, highlightIdx) : answerText;
  const highlight = highlightIdx >= 0 ? "within 8 days" : "";
  const after =
    highlightIdx >= 0
      ? answerText.slice(highlightIdx + "within 8 days".length)
      : "";

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 font-sans">
      <div className="max-w-3xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">
            Interactive guide
          </p>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
            Master the Belgian Bureaucracy
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
            Your AI consultant helps you build a custom survival guide for your
            move to Brussels. Watch it in action below.
          </p>
        </div>

        {/* Demo Card */}
        <div className="bg-white border border-gray-200 rounded-3xl shadow-lg overflow-hidden mb-10 transition-all duration-300">
          {/* Demo Header */}
          <div className="px-5 py-3 border-b border-gray-200 flex items-center gap-3 bg-gray-50">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            <p className="text-sm text-gray-500 flex-1 text-center font-medium">
              Brussels Guide — AI Consultant
            </p>
          </div>

          {/* Step labels */}
          <div className="flex border-b border-gray-100 bg-white">
            {[
              { label: "1. Ask a question", active: showChat && !showAnswer },
              {
                label: "2. Highlight to save",
                active: isHighlighting && !notebookVisible,
              },
              { label: "3. Organize", active: notebookVisible },
            ].map((s, i) => (
              <div
                key={i}
                className={`flex-1 py-3 text-center text-xs font-bold uppercase tracking-wider transition-all duration-400 border-b-2 ${s.active ? "text-blue-600 border-blue-600 bg-blue-50/30" : "text-gray-400 border-transparent"}`}
              >
                {s.label}
              </div>
            ))}
          </div>

          {/* Chat area */}
          <div className="min-h-[320px] p-6 flex flex-col gap-4 relative bg-gray-50/50">
            {phase === "idle" && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 pt-8">
                <div className="text-5xl">🇧🇪</div>
                <p className="text-gray-500 text-center font-medium">
                  Press play to see how it works
                </p>
                <button
                  onClick={start}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-2.5 font-bold flex items-center gap-2 shadow-md transition-all transform hover:scale-105"
                >
                  <span>▶</span> Start demo
                </button>
              </div>
            )}

            {/* User question bubble */}
            {showQuestion && (
              <div
                className="flex justify-end"
                style={{ animation: "fadeSlideUp 0.35s ease" }}
              >
                <div className="bg-blue-600 text-white rounded-2xl rounded-br-sm px-4 py-3 max-w-[80%] text-sm shadow-sm leading-relaxed">
                  {QUESTION}
                </div>
              </div>
            )}

            {/* AI thinking */}
            {showThinking && (
              <div
                className="flex items-center gap-3"
                style={{ animation: "fadeSlideUp 0.35s ease" }}
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm shrink-0">
                  🤖
                </div>
                <div className="flex gap-1.5 px-4 py-3 bg-white border border-gray-200 rounded-2xl rounded-bl-sm shadow-sm">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-gray-400"
                      style={{
                        animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* AI answer */}
            {showAnswer && (
              <div
                className="flex items-start gap-3 relative"
                style={{ animation: "fadeSlideUp 0.35s ease" }}
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm shrink-0 mt-1">
                  🤖
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 max-w-[80%] text-sm text-gray-800 shadow-sm leading-relaxed relative">
                  {/* Highlight popup */}
                  {phase === "popup-shown" && (
                    <div
                      className="absolute -top-12 left-10 bg-gray-900 text-white px-3 py-2 rounded-xl flex items-center gap-3 text-xs shadow-2xl whitespace-nowrap z-10"
                      style={{ animation: "popIn 0.2s ease" }}
                    >
                      <span className="text-gray-300">"within 8 days"</span>
                      <button className="bg-blue-600 text-white rounded-lg px-3 py-1 font-bold shadow-sm">
                        💾 Save that
                      </button>
                    </div>
                  )}

                  {highlight ? (
                    <span>
                      {before}
                      <span
                        className={`rounded px-1 transition-colors duration-500 ${isHighlighting ? "bg-yellow-200 text-gray-900 font-medium" : "bg-transparent text-inherit"}`}
                      >
                        {highlight}
                      </span>
                      {after}
                    </span>
                  ) : (
                    answerText
                  )}

                  {phase === "ai-replying" && (
                    <span
                      className="inline-block w-0.5 h-3.5 bg-blue-600 ml-0.5 align-baseline"
                      style={{ animation: "blink 0.8s step-end infinite" }}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Save flash */}
            {phase === "saving" && (
              <div
                className="absolute bottom-6 right-6 bg-green-100 text-green-700 border border-green-200 rounded-lg px-4 py-2 text-sm font-bold shadow-sm"
                style={{ animation: "fadeSlideUp 0.3s ease" }}
              >
                ✅ Saved to notebook!
              </div>
            )}
          </div>

          {/* Input bar */}
          {showChat && (
            <div className="p-4 border-t border-gray-200 flex gap-3 items-center bg-white">
              <div className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-gray-100 min-h-[42px] flex items-center">
                {phase === "typing-question" ? inputVal : ""}
                {phase === "typing-question" && (
                  <span
                    className="inline-block w-0.5 h-3.5 bg-blue-600 ml-0.5 align-baseline"
                    style={{ animation: "blink 0.8s step-end infinite" }}
                  />
                )}
              </div>
              <button className="bg-blue-600 text-white rounded-xl w-10 h-10 flex items-center justify-center font-bold shrink-0 shadow-sm">
                ↑
              </button>
            </div>
          )}
        </div>

        {/* Notebook panel */}
        <div
          className={`bg-white border border-gray-200 rounded-3xl shadow-lg overflow-hidden mb-10 transition-all duration-700 ease-in-out ${notebookVisible ? "max-h-[320px] opacity-100 mt-8" : "max-h-0 opacity-0 border-transparent shadow-none mt-0"}`}
        >
          <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-3 bg-gray-50">
            <span className="text-lg">📝</span>
            <p className="m-0 font-bold text-gray-900 flex-1">
              Your Personal Notebook
            </p>
            <span className="text-xs font-bold bg-green-100 text-green-700 px-2.5 py-1 rounded-md">
              1 snippet saved
            </span>
          </div>
          <div className="p-6">
            <div
              className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5"
              style={{
                animation: notebookVisible
                  ? "fadeSlideUp 0.5s ease 0.3s both"
                  : "none",
              }}
            >
              <p className="text-gray-800 text-sm font-medium mb-4 leading-relaxed">
                "Register your new address at the commune{" "}
                <strong className="text-blue-600">within 8 days</strong>"
              </p>
              <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <span className="text-xs text-gray-400 font-medium">
                  Saved just now
                </span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="bg-green-50 text-green-700 text-xs font-bold px-3 py-1.5 rounded-lg outline-none border border-green-200 cursor-pointer shadow-sm"
                >
                  <option>📁 Commune</option>
                  <option>📄 Visa</option>
                  <option>🏠 Housing</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Replay + CTA */}
        <div className="flex gap-4 justify-center items-center flex-wrap mt-8">
          {phase !== "idle" && (
            <button
              onClick={start}
              className="text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl px-5 py-3 text-sm font-bold flex items-center gap-2 shadow-sm transition-colors"
            >
              ↺ Replay Animation
            </button>
          )}
          <Link
            href="/chat"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-3 text-sm font-bold flex items-center gap-2 shadow-md transition-transform transform hover:-translate-y-0.5"
          >
            Try the Consultant Now →
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.9) translateY(5px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
