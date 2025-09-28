"use client";

import { useEffect, useState } from "react";
import supabase from "../lib/supabaseClient";

export default function Home() {
  const [user, setUser] = useState(null);

  async function handleLogin() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });

    if (error) {
      console.error("Login error:", error.message);
      return;
    }
  }

  async function checkOrCreateProfile(user) {
    // Check if profile exists
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile) {
      await supabase.from("profiles").insert([
        {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata.full_name,
          avatar_url: user.user_metadata.avatar_url,
        },
      ]);
    }
  }

  useEffect(() => {
    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await checkOrCreateProfile(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="p-6">
      {!user ? (
        <button
          onClick={handleLogin}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Sign in with Google
        </button>
      ) : (
        <p>Welcome, {user.email} 🎉</p>
      )}
    </div>
  );
}
