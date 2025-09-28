"use client";
import { useState } from "react";
import supabase from "../lib/supabaseClient";

export default function ResumeUpload({ user }) {
  const [uploading, setUploading] = useState(false);
  const [resumeUrl, setResumeUrl] = useState(null);

  async function handleResumeUpload(event) {
    try {
      setUploading(true);

      const file = event.target.files[0];
      if (!file) return;

      // Unique filename using user.id + timestamp
      const filePath = `${user.id}/${Date.now()}_${file.name}`;

      // Upload to Supabase storage bucket "resumes"
      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL (or signed URL if private bucket)
      const { data: { publicUrl } } = supabase.storage
        .from("resumes")
        .getPublicUrl(filePath);

      setResumeUrl(publicUrl);

      // Save link in profiles table
      const { error: dbError } = await supabase
        .from("profiles")
        .update({ resume_url: publicUrl })
        .eq("id", user.id);

      if (dbError) throw dbError;

      alert("✅ Resume uploaded successfully!");
    } catch (err) {
      console.error("Upload error:", err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mt-6">
      <input
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleResumeUpload}
        disabled={uploading}
      />
      {uploading && <p className="text-gray-400">Uploading...</p>}
      {resumeUrl && (
        <p className="text-green-500">
          Resume uploaded: <a href={resumeUrl} target="_blank">View</a>
        </p>
      )}
    </div>
  );
}
