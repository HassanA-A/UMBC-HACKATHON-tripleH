import { useState } from "react";

export default function VoiceTest() {
  const [transcript, setTranscript] = useState("");

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      console.log("User said:", text);
    };

    recognition.start();
  };

  return (
    <div className="p-4">
      <button
        onClick={startListening}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        🎙️ Start Answer
      </button>
      <p className="mt-4">Transcript: {transcript}</p>
    </div>
  );
}
