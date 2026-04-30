"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { clearRoiModalSession } from "@/lib/trialUtils";
import { RotateCcw, Clock, Zap } from "lucide-react";

export default function TimeMachineController() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleTimeTravel = async (action: 'reset' | 'd3' | 'expired' | 'sync_db') => {
    setLoading(action);
    setMessage(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setMessage("User not authenticated");
        return;
      }

      const response = await fetch("/api/time-machine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, action }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage(result.message);
        
        // Clear all session storage to ensure complete reset
        sessionStorage.clear();
        
        // Use router.refresh() to reflect changes immediately
        router.refresh();
      } else {
        setMessage(`Failed: ${result.error}${result.details ? ` (${result.details})` : ''}`);
      }
    } catch (error) {
      console.error("[TimeMachineController] Error:", error);
      setMessage("Network error occurred");
    } finally {
      setLoading(null);
    }
  };

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-zinc-900/95 backdrop-blur-sm rounded-lg p-4 shadow-xl border border-zinc-700/50 min-w-[280px]">
      <div className="text-xs font-semibold text-zinc-300 mb-3 flex items-center gap-2">
        <Clock className="h-3 w-3" />
        Developer Time Machine
      </div>
      
      <div className="space-y-2">
        <button
          onClick={() => handleTimeTravel('reset')}
          disabled={loading !== null}
          className="w-full flex items-center gap-2 text-xs bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 px-3 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-wait"
        >
          <RotateCcw className="h-3 w-3" />
          {loading === 'reset' ? 'Setting Demo...' : 'Demo Mode (D-14)'}
        </button>

        <button
          onClick={() => handleTimeTravel('sync_db')}
          disabled={loading !== null}
          className="w-full flex items-center gap-2 text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-3 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-wait"
        >
          <RotateCcw className="h-3 w-3" />
          {loading === 'sync_db' ? 'Syncing...' : 'Real Today (Sync DB)'}
        </button>

        <button
          onClick={() => handleTimeTravel('d3')}
          disabled={loading !== null}
          className="w-full flex items-center gap-2 text-xs bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 px-3 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-wait"
        >
          <Clock className="h-3 w-3" />
          {loading === 'd3' ? 'Setting D-3...' : 'Set to D-3'}
        </button>

        <button
          onClick={() => handleTimeTravel('expired')}
          disabled={loading !== null}
          className="w-full flex items-center gap-2 text-xs bg-red-600/20 hover:bg-red-600/30 text-red-400 px-3 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-wait"
        >
          <Zap className="h-3 w-3" />
          {loading === 'expired' ? 'Expiring...' : 'Force Expire (D-0)'}
        </button>
      </div>

      {message && (
        <div className="mt-3 text-xs text-zinc-400 border-t border-zinc-700 pt-2">
          {message}
        </div>
      )}
    </div>
  );
}
