import { NextResponse } from "next/server";

// ---------------- Helpers ----------------
function makeResumeSuggestions({ resume = "", jobDescription = "" }) {
  const hasMetrics = /\b\d+(\.\d+)?(%|k|m| hours?| days?)?\b/i.test(resume);
  const jdKeywords =
    jobDescription.toLowerCase().match(
      /\b(ai|ml|react|node|python|java|aws|docker|kubernetes|sql|security|system)\b/g
    ) || [];

  return {
    summary: "Draft suggestions generated.",
    highlights: [
      !hasMetrics && "Add quantified impact (numbers, %, time saved).",
      jdKeywords.length
        ? `Mirror JD keywords: ${[...new Set(jdKeywords)].slice(0, 8).join(", ")}.`
        : "Identify and mirror 5–8 hard-skill keywords from the JD.",
      "Prioritize the 4–6 most role-relevant bullets at the top.",
    ].filter(Boolean),
    sections: {
      header: ["Align headline to target role; add LinkedIn/GitHub if missing."],
      experience: [
        "Use STAR/PAR; lead with the Result and metric.",
        "Collapse low-relevance bullets into 1 line or remove.",
      ],
      skills: ["Group core stack vs tools; keep concise (≤1 line)."],
    },
  };
}

function makeInterviewPlan({ remove = "", add = "", transcript = "" }) {
  const toRemove = remove.split(/\n+/).map(s => s.trim()).filter(Boolean).slice(0, 15);
  const toAdd = add.split(/\n+/).map(s => s.trim()).filter(Boolean).slice(0, 15);
  const fillerDetected = /\b(um|uh|like|you know|sort of|kind of)\b/i.test(transcript);

  return {
    summary: "Interview prep plan generated.",
    trims: toRemove,
    additions: toAdd,
    speakingTips: [
      fillerDetected && "Cut filler: pause → finish thought cleanly.",
      transcript.length > 600 && "Target 60–90s per answer; tighten delivery.",
      "Use STAR: Situation → Task → Action → Result (lead with Result).",
    ].filter(Boolean),
    structure: {
      opener: "30s pitch: target role + 2 signature wins + stack.",
      stories: [
        "Impact story w/ metric aligned to JD.",
        "Challenge/failure → lesson → next-time change.",
        "Leadership/ownership under ambiguity.",
      ],
      closer: "2 tailored questions for the interviewer.",
    },
  };
}

// -------------- Parser -------------------
async function parsePayload(req) {
  const url = new URL(req.url);
  const modeFromQuery = (url.searchParams.get("mode") || "").toLowerCase();
  const ct = req.headers.get("content-type") || "";

  if (ct.includes("application/json")) {
    const body = await req.json();
    return { mode: (body.mode || modeFromQuery), body };
  }

  if (ct.includes("multipart/form-data")) {
    const form = await req.formData();
    const mode = String(form.get("mode") || modeFromQuery || "").toLowerCase();
    const body = {
      resume: String(form.get("resume") || ""),
      jobDescription: String(form.get("jobDescription") || ""),
      remove: String(form.get("remove") || ""),
      add: String(form.get("add") || ""),
      transcript: String(form.get("transcript") || ""),
    };
    return { mode, body };
  }

  throw new Error("Unsupported content-type");
}

// -------------- Route --------------------
export async function POST(req) {
  try {
    const { mode, body } = await parsePayload(req);

    if (mode === "resume") {
      const { resume = "", jobDescription = "" } = body || {};
      if (!resume && !jobDescription) {
        return NextResponse.json(
          { error: "Provide resume and/or jobDescription" },
          { status: 400 }
        );
      }
      return NextResponse.json(makeResumeSuggestions({ resume, jobDescription }));
    }

    if (mode === "interview") {
      const { remove = "", add = "", transcript = "" } = body || {};
      return NextResponse.json(makeInterviewPlan({ remove, add, transcript }));
    }

    return NextResponse.json(
      { error: "Missing or invalid 'mode'. Use 'resume' or 'interview'." },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
