"use client";

import { useRef, useState, useEffect } from "react";
import VoiceTest from "../components/VoiceTest"; // adjust path if needed

export default function Home() {
  const [activeTab, setActiveTab] = useState("resume");

  // ==== Interview mic + transcript ====
  const [recording, setRecording] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const voiceRef = useRef(null);
  const taRef = useRef(null);

  useEffect(() => {
    if (taRef.current) taRef.current.scrollTop = taRef.current.scrollHeight;
  }, [voiceText]);

  const toggleRecording = () => {
    if (!voiceRef.current) return;
    if (recording) {
      voiceRef.current.stop();
      setRecording(false);
    } else {
      setVoiceText("");
      voiceRef.current.start();
      setRecording(true);
    }
  };

  // ==== Resume / JD ====
  const [resumeName, setResumeName] = useState("");
  const [jdText, setJdText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const resumeInputRef = useRef(null);

  const pickResume = () => resumeInputRef.current?.click();

  const handleGenerateResumeSuggestions = () => {
    if (!resumeName || !jdText.trim()) return;
    setSuggestions([
      "Quantify impact with metrics (% saved, users affected, revenue boosted).",
      "Mirror JD keywords in your top bullets and Skills section.",
      "Replace weak verbs: “helped with” → “Led”, “Implemented”, “Optimized”.",
      "Move the most relevant experience higher; compress legacy work.",
      "Focus on outcomes, not tasks: problem → action → measurable result."
    ]);
  };

  const UploadPill = ({ label, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full px-6 py-3 bg-neutral-900 text-white
                 shadow-[0_8px_20px_rgba(0,0,0,0.35)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.45)]
                 hover:bg-neutral-800 active:translate-y-px transition"
    >
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 16V4" />
        <path d="M8.5 7.5 12 4l3.5 3.5" />
        <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
      </svg>
      <span className="font-medium">{label}</span>
    </button>
  );

  const canGenerate = Boolean(resumeName) && jdText.trim().length > 0;

  // ==== Calendar (simple month view + arrow time picker) ====
  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const y = monthCursor.getFullYear();
  const m = monthCursor.getMonth(); // 0-11
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const startWeekday = new Date(y, m, 1).getDay();
  const monthName = monthCursor.toLocaleString(undefined, { month: "long", year: "numeric" });
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
  const keyFor = (day) => `${y}-${pad(m + 1)}-${pad(day)}`;
  const prevMonth = () => setMonthCursor(new Date(y, m - 1, 1));
  const nextMonth = () => setMonthCursor(new Date(y, m + 1, 1));

  const [events, setEvents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState("");
  const [modalForm, setModalForm] = useState({
    hour: "",
    minute: "",
    company: "",
    location: "",
    notes: "",
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem("interviewEvents");
      if (raw) setEvents(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("interviewEvents", JSON.stringify(events));
    } catch {}
  }, [events]);

  const roundNowToNext5 = () => {
    const now = new Date();
    let h = now.getHours();
    let mi = now.getMinutes();
    const r = Math.ceil(mi / 5) * 5;
    if (r === 60) {
      h = (h + 1) % 24;
      mi = 0;
    } else {
      mi = r;
    }
    return { hour: h, minute: mi };
  };

  const openAddModal = (day) => {
    setModalDate(keyFor(day));
    const def = roundNowToNext5();
    setModalForm({ hour: def.hour, minute: def.minute, company: "", location: "", notes: "" });
    setModalOpen(true);
  };

  const addEvent = () => {
    if (modalForm.hour === "" || modalForm.minute === "") return;
    const time = `${pad(Number(modalForm.hour))}:${pad(Number(modalForm.minute))}`;
    const evt = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
      date: modalDate,
      time,
      company: modalForm.company,
      location: modalForm.location,
      notes: modalForm.notes,
    };
    setEvents((prev) =>
      [...prev, evt].sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`))
    );
    setModalOpen(false);
  };

  const removeEvent = (id) => setEvents((prev) => prev.filter((e) => e.id !== id));
  const eventsByDate = events.reduce((acc, e) => {
    (acc[e.date] ||= []).push(e);
    return acc;
  }, {});

  return (
    <div className="relative min-h-screen text-white flex flex-col">
      <PatternBackground />

      {/* Header */}
      <header className="border-b border-gray-700 z-10 relative">
        <div className="mx-auto max-w-7xl px-4 py-5">
          <div className="text-xl font-bold tracking-tight">Interview Bot</div>
          <nav className="mt-3 flex justify-center gap-2">
            <button
              className={`px-4 py-2 rounded-xl text-sm font-medium ${
                activeTab === "resume" ? "bg-white text-black" : "bg-gray-800 text-white hover:bg-gray-700"
              }`}
              onClick={() => setActiveTab("resume")}
            >
              Resume Refinement
            </button>
            <button
              className={`px-4 py-2 rounded-xl text-sm font-medium ${
                activeTab === "interview" ? "bg-white text-black" : "bg-gray-800 text-white hover:bg-gray-700"
              }`}
              onClick={() => setActiveTab("interview")}
            >
              Interview Prep
            </button>
            <button
              className={`px-4 py-2 rounded-xl text-sm font-medium ${
                activeTab === "calendar" ? "bg-white text-black" : "bg-gray-800 text-white hover:bg-gray-700"
              }`}
              onClick={() => setActiveTab("calendar")}
            >
              Calendar
            </button>
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-8">
          {/* === Resume Refinement === */}
          {activeTab === "resume" && (
            <section className="bg-gray-900/80 rounded-2xl shadow-sm border border-gray-700 p-6">
              <h2 className="text-xl font-semibold">Resume Refinement</h2>
              <p className="text-sm text-gray-400 mt-1">
                Upload your resume and type the job requirements, then generate tailored edits.
              </p>

              <div className="mt-6 space-y-8">
                <div>
                  <div className="mb-3 text-sm font-medium">Resume</div>
                  <div className="flex justify-center">
                    <UploadPill label="Upload Resume" onClick={pickResume} />
                    <input
                      ref={resumeInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      className="hidden"
                      onChange={(e) => setResumeName(e.target.files?.[0]?.name || "")}
                    />
                  </div>
                  {resumeName && (
                    <p className="mt-2 text-xs text-white/70 text-center">Selected: {resumeName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="jdText" className="block text-sm font-medium mb-2">
                    Job Description (paste or type key requirements)
                  </label>
                  <textarea
                    id="jdText"
                    rows={6}
                    placeholder="Paste or type key requirements here..."
                    className="w-full rounded-xl border border-gray-600 bg-black/70 text-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                  />
                </div>

                {suggestions.length > 0 && (
                  <div>
                    <div className="mb-2 text-sm font-medium">Needs to be changed</div>
                    <ul className="list-disc pl-6 space-y-1 text-white/90">
                      {suggestions.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-2 flex justify-center">
                  <button
                    onClick={handleGenerateResumeSuggestions}
                    disabled={!canGenerate}
                    className={`px-5 py-2.5 rounded-xl transition ${
                      canGenerate
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-700 text-white/60 cursor-not-allowed"
                    }`}
                  >
                    Generate Resume Suggestions
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* === Interview Prep === */}
          {activeTab === "interview" && (
            <section className="bg-gray-900/80 rounded-2xl shadow-sm border border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Interview Prep</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Practice speaking your answers aloud and capture a transcript.
                  </p>
                </div>

                {/* SINGLE transparent mic button */}
                <button
                  type="button"
                  onClick={toggleRecording}
                  aria-pressed={recording}
                  aria-label={recording ? "End recording" : "Start recording"}
                  className={`inline-flex items-center justify-center px-4 h-11 rounded-xl text-sm font-medium transition
                    ${recording
                      ? "bg-emerald-600/40 hover:bg-emerald-500/60 border border-emerald-400"
                      : "bg-transparent border border-gray-500 hover:border-white/70"}`}
                  title={recording ? "End Recording" : "Start Recording"}
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z" />
                    <path d="M5 12a7 7 0 0 0 14 0" />
                    <path d="M12 19v3" />
                  </svg>
                  {recording ? "End Recording" : "Start Recording"}
                </button>
              </div>

              <div className="mt-8 border-t border-gray-700 pt-6">
                <h3 className="text-lg font-semibold mb-2">Practice Answer (Voice)</h3>

                {/* Hide any internal buttons VoiceTest might render via global CSS below */}
                <div className="hide-internal-voice-buttons">
                  <VoiceTest ref={voiceRef} onTranscript={(t) => setVoiceText(t)} lang="en-US" />
                </div>

                <textarea
                  ref={taRef}
                  readOnly
                  value={voiceText}
                  placeholder={recording ? "Listening… start speaking." : "Click Start Recording to begin your answer."}
                  className="w-full h-40 rounded-xl border border-gray-600 bg-black/70 text-white p-3 focus:outline-none"
                />
              </div>
            </section>
          )}

          {/* === Calendar === */}
          {activeTab === "calendar" && (
            <section className="bg-gray-900/80 rounded-2xl shadow-sm border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Interview Calendar</h2>
                <div className="flex items-center gap-2">
                  <button onClick={prevMonth} className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700">‹ Prev</button>
                  <div className="text-sm text-white/80 w-44 text-center">{monthName}</div>
                  <button onClick={nextMonth} className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700">Next ›</button>
                </div>
              </div>

              <div className="grid grid-cols-7 text-center text-xs text-white/70 mb-2">
                {WEEKDAYS.map((w) => (
                  <div key={w} className="py-2">{w}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: startWeekday }).map((_, i) => (
                  <div key={`blank-${i}`} className="rounded-lg p-3 border border-transparent" />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const evts = eventsByDate[keyFor(day)] || [];
                  const hasEvents = evts.length > 0;
                  return (
                    <button
                      key={day}
                      onClick={() => openAddModal(day)}
                      className={`text-left rounded-lg p-3 border transition
                        ${hasEvents ? "border-indigo-600/50 bg-indigo-900/20" : "border-gray-700 bg-black/60"}
                        hover:border-white/30`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold">{day}</span>
                        {hasEvents && (
                          <span className="inline-flex items-center justify-center text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-700/80">
                            {evts.length}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        {evts.slice(0, 2).map((e) => (
                          <div key={e.id} className="text-[11px] text-white/85 truncate">
                            {e.time} {e.company ? `• ${e.company}` : ""}
                          </div>
                        ))}
                        {evts.length > 2 && (
                          <div className="text-[11px] text-white/60">+{evts.length - 2} more</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Add event modal */}
              {modalOpen && (
                <AddEventModal
                  modalDate={modalDate}
                  modalForm={modalForm}
                  setModalForm={setModalForm}
                  addEvent={addEvent}
                  close={() => setModalOpen(false)}
                  eventsByDate={eventsByDate}
                  removeEvent={removeEvent}
                />
              )}
            </section>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-700">
        <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-gray-400 flex items-center justify-between">
          <span>© {new Date().getFullYear()} Interview Bot</span>
          <span>Made by Tripple H group</span>
        </div>
      </footer>

      {/* Hide any buttons rendered inside VoiceTest */}
      <style jsx global>{`
        .hide-internal-voice-buttons button { display: none !important; }
      `}</style>
    </div>
  );
}

/* ---------- Pattern Background (dark, subtle job-themed icons) ---------- */
function PatternBackground() {
  return (
    <>
      <div className="fixed inset-0 -z-10 bg-black pattern-bg" aria-hidden="true" />
      <style jsx global>{`
        .pattern-bg {
          background-image: url('data:image/svg+xml;utf8,\
<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480" viewBox="0 0 480 480">\
  <g stroke=\"%23ffffff\" stroke-opacity=\"0.07\" stroke-width=\"2\" fill=\"none\">\
    <g transform=\"translate(30,30) rotate(-12 40 55)\">\
      <rect x=\"0\" y=\"0\" width=\"80\" height=\"110\" rx=\"8\"/>\
      <line x1=\"12\" y1=\"22\" x2=\"66\" y2=\"22\"/>\
      <line x1=\"12\" y1=\"40\" x2=\"66\" y2=\"40\"/>\
      <line x1=\"12\" y1=\"58\" x2=\"54\" y2=\"58\"/>\
    </g>\
    <g transform=\"translate(180,50) rotate(8 0 0)\">\
      <circle cx=\"28\" cy=\"28\" r=\"20\"/>\
      <line x1=\"44\" y1=\"44\" x2=\"66\" y2=\"66\"/>\
    </g>\
    <g transform=\"translate(310,36) rotate(-6 0 0)\">\
      <rect x=\"0\" y=\"26\" width=\"92\" height=\"60\" rx=\"8\"/>\
      <path d=\"M20 26 v-10 h52 v10\"/>\
    </g>\
    <g transform=\"translate(80,190) rotate(6 0 0)\">\
      <circle cx=\"30\" cy=\"26\" r=\"14\"/>\
      <path d=\"M6 66 q24 -18 48 0\"/>\
    </g>\
    <g transform=\"translate(230,190) rotate(-10 0 0)\">\
      <rect x=\"0\" y=\"0\" width=\"100\" height=\"130\" rx=\"10\"/>\
      <line x1=\"14\" y1=\"26\" x2=\"86\" y2=\"26\"/>\
      <line x1=\"14\" y1=\"46\" x2=\"72\" y2=\"46\"/>\
      <line x1=\"14\" y1=\"66\" x2=\"72\" y2=\"66\"/>\
      <line x1=\"14\" y1=\"86\" x2=\"60\" y2=\"86\"/>\
    </g>\
    <g transform=\"translate(370,200) rotate(14 0 0)\">\
      <rect x=\"0\" y=\"10\" width=\"84\" height=\"110\" rx=\"8\"/>\
      <rect x=\"8\" y=\"0\" width=\"84\" height=\"110\" rx=\"8\"/>\
    </g>\
    <g transform=\"translate(120,340) rotate(-14 0 0)\">\
      <circle cx=\"22\" cy=\"22\" r=\"16\"/>\
      <line x1=\"34\" y1=\"34\" x2=\"54\" y2=\"54\"/>\
    </g>\
    <g transform=\"translate(250,330) rotate(4 0 0)\">\
      <rect x=\"0\" y=\"0\" width=\"74\" height=\"106\" rx=\"8\"/>\
      <line x1=\"12\" y1=\"24\" x2=\"60\" y2=\"24\"/>\
      <line x1=\"12\" y1=\"44\" x2=\"60\" y2=\"44\"/>\
      <line x1=\"12\" y1=\"64\" x2=\"48\" y2=\"64\"/>\
    </g>\
    <g transform=\"translate(370,340) rotate(-8 0 0)\">\
      <rect x=\"0\" y=\"0\" width=\"96\" height=\"64\" rx=\"8\"/>\
      <circle cx=\"22\" cy=\"22\" r=\"10\"/>\
      <line x1=\"40\" y1=\"18\" x2=\"84\" y2=\"18\"/>\
      <line x1=\"40\" y1=\"34\" x2=\"72\" y2=\"34\"/>\
    </g>\
  </g>\
</svg>');
          background-repeat: repeat;
          background-size: 480px 480px;
          background-position: top left;
        }
      `}</style>
    </>
  );
}

/* ---------- Add Interview Modal with Arrow Time Picker ---------- */
function AddEventModal({
  modalDate,
  modalForm,
  setModalForm,
  addEvent,
  close,
  eventsByDate,
  removeEvent,
}) {
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`);

  const incHour = () =>
    setModalForm((f) => ({ ...f, hour: ((Number(f.hour) || 0) + 1) % 24 }));
  const decHour = () =>
    setModalForm((f) => ({ ...f, hour: ((Number(f.hour) || 0) + 23) % 24 }));

  const incMinute = () =>
    setModalForm((f) => {
      let h = Number(f.hour) || 0;
      let mi = Number(f.minute) || 0;
      mi += 5;
      if (mi >= 60) {
        mi = 0;
        h = (h + 1) % 24;
      }
      return { ...f, hour: h, minute: mi };
    });

  const decMinute = () =>
    setModalForm((f) => {
      let h = Number(f.hour) || 0;
      let mi = Number(f.minute) || 0;
      mi -= 5;
      if (mi < 0) {
        mi = 55;
        h = (h + 23) % 24;
      }
      return { ...f, hour: h, minute: mi };
    });

  const onHourInput = (v) => {
    let n = Number(v);
    if (Number.isNaN(n)) n = 0;
    if (n < 0) n = 0;
    if (n > 23) n = 23;
    setModalForm((f) => ({ ...f, hour: n }));
  };

  const onMinuteInput = (v) => {
    let n = Number(v);
    if (Number.isNaN(n)) n = 0;
    if (n < 0) n = 0;
    if (n > 59) n = 59;
    setModalForm((f) => ({ ...f, minute: n }));
  };

  const hasTime = modalForm.hour !== "" && modalForm.minute !== "";

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-20">
      <div className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-950 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Add Interview</h3>
          <button onClick={close} className="text-sm px-2 py-1 rounded-md bg-gray-900 hover:bg-gray-800">
            Close
          </button>
        </div>
        <div className="text-xs text-white/70 mb-3">Date: {modalDate}</div>

        <div className="grid gap-3">
          {/* Time picker with arrows */}
          <div>
            <label className="block text-xs text-white/70 mb-2">Time (24-hour)</label>
            <div className="flex items-center gap-3">
              {/* Hour */}
              <div className="flex items-center gap-1">
                <button
                  onClick={decHour}
                  className="px-2 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800"
                  aria-label="Decrease hour"
                >
                  ▲
                </button>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={modalForm.hour}
                  onChange={(e) => onHourInput(e.target.value)}
                  className="w-16 text-center rounded-lg border border-gray-800 bg-black text-white px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-700/50"
                />
                <button
                  onClick={incHour}
                  className="px-2 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800"
                  aria-label="Increase hour"
                >
                  ▼
                </button>
              </div>

              <span className="opacity-70">:</span>

              {/* Minute (5-min steps) */}
              <div className="flex items-center gap-1">
                <button
                  onClick={decMinute}
                  className="px-2 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800"
                  aria-label="Decrease minutes"
                >
                  ▲
                </button>
                <input
                  type="number"
                  min={0}
                  max={59}
                  step={1}
                  value={modalForm.minute}
                  onChange={(e) => onMinuteInput(e.target.value)}
                  className="w-16 text-center rounded-lg border border-gray-800 bg-black text-white px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-700/50"
                />
                <button
                  onClick={incMinute}
                  className="px-2 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800"
                  aria-label="Increase minutes"
                >
                  ▼
                </button>
              </div>
            </div>
            <div className="mt-2 text-xs text-white/60">
              Selected: {hasTime ? `${pad(Number(modalForm.hour))}:${pad(Number(modalForm.minute))}` : "—"}
            </div>
          </div>

          <div>
            <label className="block text-xs text-white/70 mb-1">Company (optional)</label>
            <input
              type="text"
              value={modalForm.company}
              onChange={(e) => setModalForm((f) => ({ ...f, company: e.target.value }))}
              className="w-full rounded-lg border border-gray-800 bg-black text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-700/50"
              placeholder="Acme Corp"
            />
          </div>
          <div>
            <label className="block text-xs text-white/70 mb-1">Location / Link (optional)</label>
            <input
              type="text"
              value={modalForm.location}
              onChange={(e) => setModalForm((f) => ({ ...f, location: e.target.value }))}
              className="w-full rounded-lg border border-gray-800 bg-black text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-700/50"
              placeholder="Zoom / 123 Main St"
            />
          </div>
          <div>
            <label className="block text-xs text-white/70 mb-1">Notes (optional)</label>
            <input
              type="text"
              value={modalForm.notes}
              onChange={(e) => setModalForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full rounded-lg border border-gray-800 bg-black text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-700/50"
              placeholder="Recruiter screen"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={addEvent}
            disabled={!hasTime}
            className={`px-4 py-2 rounded-lg text-sm transition ${
              hasTime ? "bg-indigo-700 hover:bg-indigo-600 text-white" : "bg-gray-800 text-white/60 cursor-not-allowed"
            }`}
          >
            Add Interview
          </button>
          <button onClick={close} className="px-4 py-2 rounded-lg text-sm bg-gray-900 hover:bg-gray-800">
            Cancel
          </button>
        </div>

        {(eventsByDate[modalDate] || []).length > 0 && (
          <div className="mt-6">
            <div className="text-sm font-medium mb-2">Interviews on {modalDate}</div>
            <ul className="space-y-2">
              {(eventsByDate[modalDate] || []).map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between rounded-lg border border-gray-800 bg-black/70 px-3 py-2 text-sm"
                >
                  <div className="truncate">
                    <span className="font-medium">{e.time}</span>
                    {e.company ? <span className="text-white/80"> • {e.company}</span> : null}
                    {e.location ? <span className="text-white/60"> ({e.location})</span> : null}
                    {e.notes ? <span className="text-white/60"> — {e.notes}</span> : null}
                  </div>
                  <button
                    onClick={() => removeEvent(e.id)}
                    className="text-xs px-2 py-1 rounded-md bg-gray-900 hover:bg-gray-800"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
