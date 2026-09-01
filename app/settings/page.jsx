"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import TokenManager from "../components/TokenManager";

const TABS = [
  { id: "qbittorrent", label: "qBittorrent" },
  { id: "tags", label: "Tags" },
  { id: "categories", label: "Categories" },
  { id: "token", label: "MAM Token" },
];

function SettingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get("tab") || "qbittorrent";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // qBittorrent form state
  const [qbUrl, setQbUrl] = useState("");
  const [qbUsername, setQbUsername] = useState("");
  const [qbPassword, setQbPassword] = useState("");
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState(null);

  // Tags form state
  const [tagsEnabled, setTagsEnabled] = useState(false);
  const [availableTags, setAvailableTags] = useState([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [defaultBookTags, setDefaultBookTags] = useState([]);
  const [defaultAudiobookTags, setDefaultAudiobookTags] = useState([]);

  // Categories form state
  const [categoriesEnabled, setCategoriesEnabled] = useState(false);
  const [defaultBookCategory, setDefaultBookCategory] = useState("books");
  const [defaultAudiobookCategory, setDefaultAudiobookCategory] = useState("audiobooks");

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.ok && data.settings) {
        setSettings(data.settings);
        // Populate form state
        setQbUrl(data.settings.qbittorrent?.url || "");
        setQbUsername(data.settings.qbittorrent?.username || "");
        setQbPassword(data.settings.qbittorrent?.password || "");
        setTagsEnabled(data.settings.tags?.enabled || false);
        setAvailableTags(data.settings.tags?.available || []);
        setDefaultBookTags(Array.isArray(data.settings.tags?.defaults?.books) ? data.settings.tags.defaults.books : []);
        setDefaultAudiobookTags(Array.isArray(data.settings.tags?.defaults?.audiobooks) ? data.settings.tags.defaults.audiobooks : []);
        setCategoriesEnabled(data.settings.categories?.enabled || false);
        setDefaultBookCategory(data.settings.categories?.defaults?.books || "books");
        setDefaultAudiobookCategory(data.settings.categories?.defaults?.audiobooks || "audiobooks");
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
      setMessage({ type: "error", text: "Failed to load settings" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Helper to check if arrays are equal
  const arraysEqual = (a, b) => {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((val, idx) => val === sortedB[idx]);
  };

  // Dirty state detection
  const isQbDirty = settings && (
    qbUrl.trim() !== (settings.qbittorrent?.url || "") ||
    qbUsername.trim() !== (settings.qbittorrent?.username || "") ||
    qbPassword !== (settings.qbittorrent?.password || "")
  );

  const isTagsDirty = settings && (
    tagsEnabled !== (settings.tags?.enabled || false) ||
    !arraysEqual(availableTags, settings.tags?.available || []) ||
    !arraysEqual(defaultBookTags, Array.isArray(settings.tags?.defaults?.books) ? settings.tags.defaults.books : []) ||
    !arraysEqual(defaultAudiobookTags, Array.isArray(settings.tags?.defaults?.audiobooks) ? settings.tags.defaults.audiobooks : [])
  );

  const isCategoriesDirty = settings && (
    categoriesEnabled !== (settings.categories?.enabled || false) ||
    defaultBookCategory.trim() !== (settings.categories?.defaults?.books || "books") ||
    defaultAudiobookCategory.trim() !== (settings.categories?.defaults?.audiobooks || "audiobooks")
  );

  // Overall dirty state (for beforeunload)
  const isDirty = isQbDirty || isTagsDirty || isCategoriesDirty;

  // Current tab dirty state (for tab switching)
  const isCurrentTabDirty = 
    (activeTab === "qbittorrent" && isQbDirty) ||
    (activeTab === "tags" && isTagsDirty) ||
    (activeTab === "categories" && isCategoriesDirty);

  // Guard: Browser close / refresh
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleTabChange = (tabId) => {
    // Guard: Tab switching
    if (isCurrentTabDirty) {
      const confirmed = window.confirm("You have unsaved changes. Leave without saving?");
      if (!confirmed) return;
    }

    setActiveTab(tabId);
    setMessage(null);
    setConnectionResult(null);
    // Update URL without navigation
    const url = new URL(window.location);
    url.searchParams.set("tab", tabId);
    window.history.replaceState({}, "", url.toString());
  };

  const saveSettings = async (updatedSettings) => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: updatedSettings }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to save settings");
      }
      setSettings(data.settings);
      setMessage({ type: "success", text: "Settings saved successfully" });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveQbittorrent = () => {
    saveSettings({
      ...buildCurrentSettings(),
      qbittorrent: {
        url: qbUrl.trim(),
        username: qbUsername.trim(),
        password: qbPassword,
      },
    });
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionResult(null);
    try {
      const res = await fetch("/api/settings/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: qbUrl.trim(),
          username: qbUsername.trim(),
          password: qbPassword,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setConnectionResult({ type: "success", text: "Connection successful" });
      } else {
        setConnectionResult({ type: "error", text: data.error || "Connection failed" });
      }
    } catch (err) {
      setConnectionResult({ type: "error", text: err.message || "Connection test failed" });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleAddTag = () => {
    const tag = newTagInput.trim();
    if (!tag) return;
    if (availableTags.includes(tag)) {
      setMessage({ type: "error", text: `Tag "${tag}" already exists` });
      return;
    }
    if (tag.length > 50) {
      setMessage({ type: "error", text: "Tag name must be 50 characters or less" });
      return;
    }
    setAvailableTags([...availableTags, tag]);
    setNewTagInput("");
    setMessage(null);
  };

  const handleRemoveTag = (tag) => {
    setAvailableTags(availableTags.filter((t) => t !== tag));
    // Clear defaults if they reference the removed tag
    setDefaultBookTags((prev) => prev.filter((t) => t !== tag));
    setDefaultAudiobookTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleSaveTags = () => {
    saveSettings({
      ...buildCurrentSettings(),
      tags: {
        enabled: tagsEnabled,
        available: availableTags,
        defaults: {
          books: defaultBookTags,
          audiobooks: defaultAudiobookTags,
        },
      },
    });
  };

  const handleSaveCategories = () => {
    saveSettings({
      ...buildCurrentSettings(),
      categories: {
        enabled: categoriesEnabled,
        defaults: {
          books: defaultBookCategory.trim(),
          audiobooks: defaultAudiobookCategory.trim(),
        },
      },
    });
  };

  /** Build the current settings object from form state */
  const buildCurrentSettings = () => ({
    qbittorrent: {
      url: qbUrl.trim(),
      username: qbUsername.trim(),
      password: qbPassword,
    },
    tags: {
      enabled: tagsEnabled,
      available: availableTags,
      defaults: {
        books: defaultBookTags,
        audiobooks: defaultAudiobookTags,
      },
    },
    categories: {
      enabled: categoriesEnabled,
      defaults: {
        books: defaultBookCategory.trim(),
        audiobooks: defaultAudiobookCategory.trim(),
      },
    },
  });

  const handleBackClick = () => {
    // Guard: Back button navigation
    if (isDirty) {
      const confirmed = window.confirm("You have unsaved changes. Leave without saving?");
      if (!confirmed) return;
    }
    router.push("/");
  };

  if (loading) {
    return (
      <main className="my-4 p-4 w-full max-w-4xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <svg className="animate-spin h-8 w-8 mx-auto mb-4 text-pink-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600 dark:text-zinc-400">Loading settings...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="my-4 p-4 w-full max-w-4xl mx-auto">
      {/* Header with integrated navigation */}
      <div className="rounded-lg bg-gray-50 dark:bg-zinc-800 overflow-hidden">
        <div className="pt-7 pr-7 pl-5 pb-0 flex items-center gap-2.5">
          <button
            onClick={handleBackClick}
            className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            aria-label="Back to search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 dark:text-zinc-400">
              <path d="M19 12H5"></path>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-zinc-100">Settings</h1>
        </div>

        {/* Tab Navigation */}
        <nav className="px-7 mt-5" aria-label="Settings tabs">
          <div role="tablist" className="flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? "border-pink-400 text-pink-500 dark:text-pink-400"
                  : "border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300 hover:border-gray-300 dark:hover:border-zinc-600"
              }`}
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              role="tab"
            >
              {tab.label}
            </button>
          ))}
          </div>
        </nav>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`mt-4 p-3 rounded-md text-sm ${
          message.type === "error"
            ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/40"
            : "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/40"
        }`}>
          {message.text}
        </div>
      )}

      {/* Tab Content */}
      <div className="mt-6">
        {/* qBittorrent Tab */}
        {activeTab === "qbittorrent" && (
          <div role="tabpanel" id="panel-qbittorrent" aria-labelledby="tab-qbittorrent" className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-zinc-100 mb-1">qBittorrent Connection</h2>
              <p className="text-sm text-gray-500 dark:text-zinc-400">Configure your qBittorrent Web UI connection details.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="qb-url" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  URL
                </label>
                <input
                  id="qb-url"
                  type="url"
                  value={qbUrl}
                  onChange={(e) => setQbUrl(e.target.value)}
                  placeholder="http://qbittorrent:8080"
                  className="w-full p-2.5 border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-800 focus:border-pink-200 dark:focus:border-pink-700 text-sm"
                />
              </div>

              <div>
                <label htmlFor="qb-username" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  Username
                </label>
                <input
                  id="qb-username"
                  type="text"
                  value={qbUsername}
                  onChange={(e) => setQbUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full p-2.5 border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-800 focus:border-pink-200 dark:focus:border-pink-700 text-sm"
                />
              </div>

              <div>
                <label htmlFor="qb-password" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  Password
                </label>
                <input
                  id="qb-password"
                  type="password"
                  value={qbPassword}
                  onChange={(e) => setQbPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full p-2.5 border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-800 focus:border-pink-200 dark:focus:border-pink-700 text-sm"
                />
              </div>
            </div>

            {/* Connection test result */}
            {connectionResult && (
              <div className={`p-3 rounded-md text-sm ${
                connectionResult.type === "success"
                  ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/40"
                  : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/40"
              }`}>
                {connectionResult.text}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleTestConnection}
                disabled={testingConnection || !qbUrl.trim() || !qbUsername.trim()}
                className="px-4 py-2 text-sm font-medium bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-md hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testingConnection ? "Testing..." : "Test Connection"}
              </button>
              <button
                onClick={handleSaveQbittorrent}
                disabled={saving || !qbUrl.trim() || !qbUsername.trim()}
                className="px-4 py-2 text-sm font-medium bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        )}

        {/* Tags Tab */}
        {activeTab === "tags" && (
          <div role="tabpanel" id="panel-tags" aria-labelledby="tab-tags" className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-zinc-100 mb-1">Tag Management</h2>
              <p className="text-sm text-gray-500 dark:text-zinc-400">Configure tags that can be applied to torrents when downloading. Tags are sent to qBittorrent.</p>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">Enable Tags</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">When enabled, you can select tags during the download review step</p>
              </div>
              <button
                onClick={() => setTagsEnabled(!tagsEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  tagsEnabled ? "bg-pink-400" : "bg-gray-300 dark:bg-zinc-600"
                }`}
                role="switch"
                aria-checked={tagsEnabled}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  tagsEnabled ? "translate-x-6" : "translate-x-1"
                }`} />
              </button>
            </div>

            {tagsEnabled && (
              <>
                {/* Add new tag */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                    Available Tags
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(); } }}
                      placeholder="Enter a tag name..."
                      className="flex-1 p-2.5 border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-800 focus:border-pink-200 dark:focus:border-pink-700 text-sm"
                    />
                    <button
                      onClick={handleAddTag}
                      disabled={!newTagInput.trim()}
                      className="px-4 py-2 text-sm font-medium bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Tag list */}
                {availableTags.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                      Tag Defaults
                    </label>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mb-3">Toggle defaults to pre-select tags when downloading a torrent of the corresponding type.</p>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-zinc-400 flex-1">Tag</span>
                      <span className="text-xs font-medium text-gray-500 dark:text-zinc-400 w-17">Books</span>
                      <span className="text-xs font-medium text-gray-500 dark:text-zinc-400 w-20">Audiobooks</span>
                      <span className="w-8" />
                    </div>
                    <div className="space-y-1">
                      {availableTags.map((tag) => {
                        const isBookDefault = defaultBookTags.includes(tag);
                        const isAudiobookDefault = defaultAudiobookTags.includes(tag);
                        return (
                          <div
                            key={tag}
                            className="flex items-center gap-2 p-2.5 rounded-md bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700"
                          >
                            <span className="flex-1 text-sm text-gray-900 dark:text-zinc-100 truncate">{tag}</span>
                            <div className="w-20 flex justify-center">
                              <button
                                onClick={() => setDefaultBookTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                                  isBookDefault ? "bg-pink-400" : "bg-gray-300 dark:bg-zinc-600"
                                }`}
                                role="switch"
                                aria-checked={isBookDefault}
                                aria-label={`Default for books: ${tag}`}
                              >
                                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                  isBookDefault ? "translate-x-[18px]" : "translate-x-[3px]"
                                }`} />
                              </button>
                            </div>
                            <div className="w-20 flex justify-center">
                              <button
                                onClick={() => setDefaultAudiobookTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                                  isAudiobookDefault ? "bg-pink-400" : "bg-gray-300 dark:bg-zinc-600"
                                }`}
                                role="switch"
                                aria-checked={isAudiobookDefault}
                                aria-label={`Default for audiobooks: ${tag}`}
                              >
                                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                  isAudiobookDefault ? "translate-x-[18px]" : "translate-x-[3px]"
                                }`} />
                              </button>
                            </div>
                            <button
                              onClick={() => handleRemoveTag(tag)}
                              className="w-8 flex justify-center p-1 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer text-gray-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400"
                              aria-label={`Remove tag: ${tag}`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {availableTags.length === 0 && (
                  <p className="text-sm text-gray-400 dark:text-zinc-500 italic">No tags configured yet. Add your first tag above.</p>
                )}
              </>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleSaveTags}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <div role="tabpanel" id="panel-categories" aria-labelledby="tab-categories" className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-zinc-100 mb-1">Category Management</h2>
              <p className="text-sm text-gray-500 dark:text-zinc-400">Configure qBittorrent categories assigned to downloads by medium type.</p>
            </div>

            {/* Enable toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">Enable Categories</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">When enabled, downloads are assigned a qBittorrent category based on medium type</p>
              </div>
              <button
                onClick={() => setCategoriesEnabled(!categoriesEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  categoriesEnabled ? "bg-pink-400" : "bg-gray-300 dark:bg-zinc-600"
                }`}
                role="switch"
                aria-checked={categoriesEnabled}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  categoriesEnabled ? "translate-x-6" : "translate-x-1"
                }`} />
              </button>
            </div>

            {categoriesEnabled && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-zinc-300">Default Categories</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="cat-books" className="block text-sm text-gray-600 dark:text-zinc-400 mb-1">Books</label>
                    <input
                      id="cat-books"
                      type="text"
                      value={defaultBookCategory}
                      onChange={(e) => setDefaultBookCategory(e.target.value)}
                      placeholder="books"
                      className="w-full p-2.5 border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-800 text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="cat-audiobooks" className="block text-sm text-gray-600 dark:text-zinc-400 mb-1">Audiobooks</label>
                    <input
                      id="cat-audiobooks"
                      type="text"
                      value={defaultAudiobookCategory}
                      onChange={(e) => setDefaultAudiobookCategory(e.target.value)}
                      placeholder="audiobooks"
                      className="w-full p-2.5 border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-800 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleSaveCategories}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        )}

        {/* MAM Token Tab */}
        {activeTab === "token" && (
          <div role="tabpanel" id="panel-token" aria-labelledby="tab-token">
            <TokenManager onTokenUpdate={() => {}} />
          </div>
        )}
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="my-4 p-4 w-full max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-20 bg-gray-200 dark:bg-zinc-700 rounded-lg mb-6"></div>
          <div className="h-12 bg-gray-200 dark:bg-zinc-700 rounded-lg"></div>
        </div>
      </div>
    }>
      <SettingsPage />
    </Suspense>
  );
}
