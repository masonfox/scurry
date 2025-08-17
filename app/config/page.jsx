"use client";
import { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import MessageBanner from "../MessageBanner";

export default function ConfigPage() {
  const [config, setConfig] = useState({
    mamTokenExists: false,
    hardcoverTokenExists: false,
  });
  const [formData, setFormData] = useState({
    mamToken: '',
    hardcoverToken: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      setLoading(true);
      const res = await fetch('/api/config');
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load configuration');
      }
      
      setConfig(data);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function saveConfig() {
    try {
      setSaving(true);
      setMessage(null);
      
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mamToken: formData.mamToken || undefined,
          hardcoverToken: formData.hardcoverToken || undefined,
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save configuration');
      }
      
      let successMessage = 'Configuration saved successfully!';
      
      setMessage({ type: 'success', text: successMessage });
      setFormData({ mamToken: '', hardcoverToken: '' }); // Clear form
      await loadConfig(); // Reload to update status
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div>
        <Navigation />
        <main className="max-w-4xl mx-auto p-4">
          <div className="text-center">⏳ Loading configuration...</div>
        </main>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      <main className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">⚙️ Configuration</h1>

        {message && (
          <MessageBanner type={message.type} text={message.text} />
        )}

        {/* Status Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
            <h3 className="text-md font-semibold text-gray-800 mb-3">Setup Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>MAM Token:</span>
                <span className={config.mamTokenExists ? 'text-green-600' : 'text-red-600'}>
                  {config.mamTokenExists ? '✅ Ready' : '❌ Required'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Hardcover Token:</span>
                <span className={config.hardcoverTokenExists ? 'text-green-600' : 'text-red-600'}>
                  {config.hardcoverTokenExists ? '✅ Ready' : '❌ Required'}
                </span>
              </div>
            </div>
            
            {config.mamTokenExists && config.hardcoverTokenExists && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-green-800 text-sm font-medium">
                  🎉 All configured! Automatic book downloads are ready.
                </p>
              </div>
            )}
          </div>

        <div className="space-y-8">
          {/* MAM Token Configuration */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">MyAnonamouse (MAM) Token</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  config.mamTokenExists 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {config.mamTokenExists ? 'Configured' : 'Not Configured'}
                </span>
              </div>
              
              <div>
                <label htmlFor="mamToken" className="block text-sm font-medium text-gray-700 mb-2">
                  MAM API Token
                </label>
                <input
                  type="password"
                  id="mamToken"
                  value={formData.mamToken}
                  onChange={(e) => setFormData(prev => ({ ...prev, mamToken: e.target.value }))}
                  placeholder={config.mamTokenExists ? "Enter new token to update..." : "Enter your MAM API token"}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Get your MAM API token from your MAM account settings
                </p>
              </div>
            </div>
          </div>

          {/* Hardcover Configuration */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Hardcover Token</h2>
            <div className="text-xs text-gray-800 mb-4">
              <p>Integrating with <a href="https://hardcover.app" target="_blank" className="text-blue-500">Hardcover</a> will allow you to automatically <i>attempt</i> to download books from your "Want To Read" List.</p>
              <p className="mt-2">This is purely <i>optional</i>, with MAM search functionality working without this configuration.</p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Token Status:</span>
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  config.hardcoverTokenExists 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {config.hardcoverTokenExists ? 'Configured' : 'Not Configured'}
                </span>
              </div>
              
              <div>
                <label htmlFor="hardcoverToken" className="block text-sm font-medium text-gray-700 mb-2">
                  Hardcover API Token
                </label>
                <input
                  type="password"
                  id="hardcoverToken"
                  value={formData.hardcoverToken}
                  onChange={(e) => setFormData(prev => ({ ...prev, hardcoverToken: e.target.value }))}
                  placeholder={config.hardcoverTokenExists ? "Enter new token to update..." : "Enter your Hardcover API token"}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Get your Hardcover API token from your <a href="https://hardcover.app/account/api" target="_blank" className="text-blue-500">Hardcover settings</a><br />
                </p>
                <p className="text-warning text-xs mt-2 text-red-500">Note: do not copy <code>Bearer</code>. Only the token value itself.</p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={saveConfig}
              disabled={saving || (!formData.mamToken && !formData.hardcoverToken)}
              className="bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white font-semibold py-2 px-6 rounded"
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
