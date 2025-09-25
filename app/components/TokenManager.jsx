"use client";
import { useState, useEffect } from "react";
import { validateMamToken } from "@/src/lib/utilities";

export default function TokenManager({ onTokenUpdate }) {
  const [tokenData, setTokenData] = useState({ exists: false, token: null, location: null });
  const [newToken, setNewToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showTokenInput, setShowTokenInput] = useState(false);

  // Load current token info
  const loadTokenInfo = async () => {
    try {
      const res = await fetch("/api/mam-token");
      const data = await res.json();
      setTokenData(data);
      
      // If no token exists, show input by default
      if (!data.exists) {
        setShowTokenInput(true);
      }
    } catch (error) {
      console.error("Failed to load token info:", error);
      setMessage({ type: "error", text: "Failed to load token information" });
    }
  };

  useEffect(() => {
    loadTokenInfo();
  }, []);

  const saveToken = async () => {
    if (!newToken.trim()) {
      setMessage({ type: "error", text: "Please enter a token" });
      return;
    }

    if (!validateMamToken(newToken)) {
      setMessage({ type: "error", text: "Token format appears invalid. MAM tokens are typically long alphanumeric strings." });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/mam-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: newToken.trim() })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to save token");
      }

      setMessage({ type: "success", text: "Token saved successfully!" });
      setNewToken("");
      setShowTokenInput(false);
      
      // Reload token info and notify parent
      await loadTokenInfo();
      onTokenUpdate?.(true);

      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const deleteToken = async () => {
    if (!confirm("Are you sure you want to delete the current MAM token?")) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/mam-token", { method: "DELETE" });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete token");
      }

      setMessage({ type: "success", text: "Token deleted successfully" });
      setShowTokenInput(true);
      
      // Reload token info and notify parent
      await loadTokenInfo();
      onTokenUpdate?.(false);

      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">MAM Token Manager</h2>
      
      {/* Current Token Status */}
      <div className="p-3 bg-gray-50 rounded-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              Status: <span className={`font-medium ${tokenData.exists ? 'text-green-600' : 'text-red-600'}`}>
                {tokenData.exists ? 'Token configured' : 'No token found'}
              </span>
            </p>
            {tokenData.exists && (
              <>
                <p className="text-sm text-gray-600">
                  Token: <span className="font-mono text-gray-800">{tokenData.token}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Length: <span className="font-medium">{tokenData.fullLength} characters</span>
                </p>
              </>
            )}
          </div>
          
          {tokenData.exists && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowTokenInput(!showTokenInput)}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded cursor-pointer hover:bg-blue-200 transition-colors"
              >
                Update
              </button>
              <button
                onClick={deleteToken}
                disabled={loading}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 cursor-pointer rounded hover:bg-red-200 transition-colors disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Token Input Section */}
      {showTokenInput && (
        <div className="space-y-4 mt-4">
          <div>
            <label htmlFor="mam-token" className="block text-sm font-medium text-gray-700 mb-2">
              MAM Session Token
            </label>
            <textarea
              id="mam-token"
              value={newToken}
              onChange={(e) => setNewToken(e.target.value)}
              placeholder="Paste your MAM session token here..."
              className="w-full p-3 border border-gray-300 rounded-md resize-none font-mono text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-200"
              rows={4}
              disabled={loading}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={saveToken}
              disabled={loading || !newToken.trim()}
              className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Save Token"}
            </button>
            
            {tokenData.exists && (
              <button
                onClick={() => {
                  setShowTokenInput(false);
                  setNewToken("");
                  setMessage(null);
                }}
                disabled={loading}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Message Display */}
      {message && (
        <div className={`mt-4 p-3 rounded-md ${
          message.type === 'error' 
            ? 'bg-red-50 text-red-700 border border-red-200' 
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Help Text */}
      <div className="mt-4 py-4 px-6 bg-blue-50 rounded-md">
        <p className="text-sm text-blue-800">
          <strong>How to get your MAM session token:</strong>
        </p>
        <ol className="text-sm text-blue-700 mt-1 list-decimal list-inside space-y-1">
          <li>Go to your <a href="https://www.myanonamouse.net/preferences/index.php?view=security" class="underline" target="_blank" rel="noopener noreferrer">Security Preferences</a>.</li>
          <li>Create a session with the IP where you'll run Scurry.</li>
          <li>Copy your session token value and paste it above.</li>
        </ol>
        <i class="mt-2 block text-xs text-blue-800">Note: do not prepend <code class="bg-gray-200 text-red-600 p-1 rounded">MAM_ID=</code> above - just the raw token value.</i>
      </div>
    </div>
  );
}