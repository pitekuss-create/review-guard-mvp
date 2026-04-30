"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export default function TrialExpireButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleExpireTrial = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setMessage("User not authenticated");
        return;
      }

      const response = await fetch("/api/expire-trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage("Trial expired successfully! Refresh page to test billing lock.");
      } else {
        setMessage("Failed to expire trial: " + result.error);
      }
    } catch (error) {
      console.error("[TrialExpireButton] Error:", error);
      setMessage("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-red-900/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-red-700/50">
        <button
          onClick={handleExpireTrial}
          disabled={loading}
          className="text-xs text-red-200 hover:text-white transition-colors disabled:opacity-50"
        >
          {loading ? "Processing..." : "[Dev] Expire Trial Now"}
        </button>
        {message && (
          <div className="mt-2 text-xs text-red-300 max-w-48">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
