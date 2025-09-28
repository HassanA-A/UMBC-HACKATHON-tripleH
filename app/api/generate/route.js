// app/api/generate/route.js
import { NextResponse } from "next/server";

/* =========================================================
   Runtime hints (OK in Next.js App Router API routes)
   ========================================================= */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================================================
   Basic helper you already had (kept for fallback)
   ========================================================= */
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

/* =========================================================
   SMART engine: extracts keywords from JD & resume,
   finds gaps/overlap, and emits tailored guidance
   ========================================================= */

// simple normalization
function normalize(text = "") {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim();
}

// turn text into a set of normalized tokens
function keywordSet(str) {
  return new Set((str || "").toLowerCase().match(/[a-z0-9+#.\-]{2,}/g) || []);
}

// lightweight skill extractor with stopword filtering
function extractSkills(text) {
  const skills = Array.from(keywordSet(text));
  const noisy = new Set([
    "the","and","or","with","for","to","of","a","an","in","on","at","as","is","are","was","were",
    "be","being","been","team","work","company","project","projects","experience","responsible",
    "helped","using","use","built","build","develop","development","role","year","years","month",
    "months","etc","tools","technologies","framework","frameworks","strong","knowledge","ability",
    "skills","requirements","preferred","required","good","great","excellent"
  ]);
  return skills.filter(w => w.length > 2 && !noisy.has(w)).slice(0, 250);
}

function makeResumeSuggestionsSmart({ resume = "", jobDescription = "" }) {
  const resumeText = normalize(resume);
  const jdText = normalize(jobDescription);

  const hasMetrics =
    /\b\d+(\.\d+)?\s*(%|k|m|b|users?|reqs?|tickets?|ms|s|minutes?|hours?|days?|weeks?)\b/i
      .test(resumeText);

  const resumeSkills = extractSkills(resumeText);
  const jdSkills = extractSkills(jdText);

  // compute overlaps & gaps
  const overlap = jdSkills.filter(s => resumeSkills.includes(s)).slice(0, 12);
  const missing = jdSkills.filter(s => !resumeSkills.includes(s)).slice(0, 12);

  // very light grouping of JD skills that often appear
  const buckets = {
    languages: jdSkills.filter(s => /^(c\+\+|c#|c|java|python|javascript|typescript|go|rust|ruby|scala)$/i.test(s)),
    web: jdSkills.filter(s => /(react|node|express|next|vue|angular|svelte)/i.test(s)),
    cloud: jdSkills.filter(s => /(aws|gcp|azure|kubernetes|docker|terraform)/i.test(s)),
    data: jdSkills.filter(s => /(sql|nosql|postgres|mysql|mongodb|spark|hadoop)/i.test(s)),
    sys: jdSkills.filter(s => /(linux|networking|multithreading|concurrency|distributed)/i.test(s)),
    sec: jdSkills.filter(s => /(security|iam|oauth|jwt|sso|siem)/i.test(s))
  };

  const highlights = [
    !hasMetrics && "Add quantified impact (numbers, %, time saved, users affected, latency).",
    overlap.length > 0 &&
      `Lead with overlapping skills the JD explicitly wants: ${overlap.join(", ")}.`,
    missing.length > 0 &&
      `Consider adding JD keywords you haven’t mentioned yet: ${missing.join(", ")}.`,
    "Reorder bullets so the top 4–6 match the JD most closely.",
  ].filter(Boolean);

  const targeted = [];
  if (buckets.languages.length) {
    targeted.push(`Ensure languages are visible early: ${buckets.languages.join(", ")}.`);
  }
  if (buckets.web.length) {
    targeted.push(`For web roles, surface ${buckets.web.join(", ")} projects above legacy items.`);
  }
  if (buckets.cloud.length) {
    targeted.push(`Highlight cloud/containers: ${buckets.cloud.join(", ")} (include actions + metrics).`);
  }
  if (buckets.data.length) {
    targeted.push(`Show data stack clearly: ${buckets.data.join(", ")} (queries, pipelines, scaling).`);
  }
  if (buckets.sys.length) {
    targeted.push(`Emphasize systems skills: ${buckets.sys.join(", ")} (perf, reliability, debugging).`);
  }
  if (buckets.sec.length) {
    targeted.push(`Call out security items: ${buckets.sec.join(", ")} with scope and controls.`);
  }

  return {
    summary: "Tailored resume suggestions generated.",
    highlights,

    sections: {
      header: [
        "Align headline to target role (e.g., 'Software Engineer – Backend | AWS | Node.js').",
        "Add LinkedIn/GitHub if missing; include 1 line of focus (domain, scale, stack).",
      ],

      experience: [
        "Use STAR/PAR; lead each bullet with the measurable result.",
        overlap.length
          ? `Move projects/roles featuring ${overlap.join(", ")} above unrelated items.`
          : "Move the most JD-relevant projects above legacy work.",
        "Compress low-relevance bullets (≤1 line) or remove them.",
        "Replace weak verbs ('helped with') → ('Led', 'Implemented', 'Optimized').",
        ...targeted.slice(0, 4),
      ],

      skills: [
        overlap.length
          ? `Keep a concise Skills line; ensure ${overlap.join(", ")} are visible.`
          : "Group core stack vs. tools; keep it concise (≤1 line).",
        missing.length
          ? `If you have exposure, add: ${missing.join(", ")}. If not, consider learning resources/certs.`
          : "Skills align well—prioritize those most relevant to the JD.",
      ],
    },
  };
}

/* =========================================================
   Interview plan helper (unchanged)
   ========================================================= */
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

/* =========================================================
   Payload parser – supports JSON and multipart/form-data
   ========================================================= */
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

/* =========================================================
   Route handler
   ========================================================= */
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

      // Prefer SMART engine; fall back to your original function if needed
      const smart = makeResumeSuggestionsSmart({ resume, jobDescription });
      const basic = makeResumeSuggestions({ resume, jobDescription });
      const response =
        (smart && (smart.highlights?.length || smart.sections)) ? smart : basic;

      return NextResponse.json(response);
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
    console.error("API /generate error:", err);
    return NextResponse.json(
      { error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
