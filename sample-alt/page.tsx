"use client";

import { useEffect, useState } from "react";
import LogoutButton from "./components/LogoutButton";

export default function Home() {
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(false);
  const [govInfo, setGovInfo] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("userName");
    if (stored) setName(stored);
  }, []);

  function saveName(e?: React.FormEvent) {
    e?.preventDefault();
    localStorage.setItem("userName", name);
    setEditing(false);
  }

  async function refreshGov() {
    setGovInfo("Loading latest government info...");
    // placeholder: will call real API later
    await new Promise((r) => setTimeout(r, 600));
    setGovInfo("No updates available. (Placeholder — will fetch from government API.)");
  }

  return (
    <main className="min-h-screen p-8 bg-slate-50">

      // Header with welcome message and logout
      <header className="max-w-5xl mx-auto flex items-center justify-between py-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome{name ? `, ${name}` : ""}!</h1>
          <p className="text-slate-600">Your personal Flood Lookout dashboard.</p>
        </div>
        {/* <div className="flex items-center gap-4">
          <LogoutButton />
        </div> */}
      </header>

      // User Data Section
      <section className="max-w-5xl mx-auto mt-8 space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Profile</h2>
          <div className="mt-3 flex items-center gap-4">
            <p className="text-slate-700">Name: <span className="font-medium">{name || "Guest"}</span></p>
            {!editing ? (
              <button
                className="ml-4 rounded bg-blue-600 px-3 py-1 text-white"
                onClick={() => setEditing(true)}
              >
                Edit
              </button>
            ) : (
              <form onSubmit={saveName} className="flex items-center gap-2">
                <input
                  className="rounded border px-2 py-1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
                <button className="rounded bg-green-600 px-3 py-1 text-white" type="submit">
                  Save
                </button>
                <button
                  type="button"
                  className="rounded bg-gray-200 px-3 py-1"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
        </div>
        
        // Government Info Section
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Latest government info</h2>
            <div className="flex items-center gap-2">
              <button
                className="rounded bg-blue-600 px-3 py-1 text-white"
                onClick={refreshGov}
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="mt-3 text-slate-700">
            {govInfo ? (
              <p>{govInfo}</p>
            ) : (
              <p className="italic text-slate-500">No data yet. This will be populated from the government API.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
