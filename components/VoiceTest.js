"use client";
import { useState, forwardRef, useImperativeHandle } from "react";

const VoiceTest = forwardRef(function VoiceTest({ onTranscript, lang = "en-US" }, ref) {
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState("");
  let recognition = null;

  const start = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("SpeechRecognition API not supported");
      return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = async (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      onTranscript?.(text);
      console.log("✅ Transcript:", text);

      try {
        const res = await fetch("/api/generate?mode=interview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: text, remove: "", add: "" }),
        });

        const data = await res.json();
        const tips = data.speakingTips?.join(" ") || "No tips available.";
        setFeedback(tips);

        const utterance = new SpeechSynthesisUtterance(tips);
        utterance.lang = "en-US";
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error("Error fetching feedback:", err);
      }
    };

    recognition.start();
  };

  const stop = () => {
    try {
      recognition?.stop();
    } catch {}
  };

  useImperativeHandle(ref, () => ({ start, stop }));

  return (
    <div className="p-4 space-y-4">
      {/* Hidden by parent CSS */}
      <button
        onClick={start}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        🎙️ Start Answer
      </button>

      <div className="mt-4">
        <h3 className="text-lg font-semibold">Transcript</h3>
        <p className="text-gray-300">{transcript || "Say something..."}</p>
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-semibold">Feedback</h3>
        <p className="text-green-400">{feedback || "No feedback yet."}</p>
      </div>
    </div>
  );
});

export default VoiceTest; // ✅ Make sure it exports like this
