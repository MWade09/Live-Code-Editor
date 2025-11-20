'use client';

import React, { useState, useEffect } from 'react';
import { Rocket, Key, CheckCircle, XCircle, Save, Eye, EyeOff, ExternalLink, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function DeploymentSettingsPage() {
  const [netlifyToken, setNetlifyToken] = useState('');
  const [vercelToken, setVercelToken] = useState('');
  const [netlifyConnected, setNetlifyConnected] = useState(false);
  const [vercelConnected, setVercelConnected] = useState(false);
  const [showNetlifyToken, setShowNetlifyToken] = useState(false);
  const [showVercelToken, setShowVercelToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadTokenStatus();
  }, []);

  const loadTokenStatus = async () => {
    try {
      const response = await fetch('/api/deployment/tokens');
      const data = await response.json();
      
      setNetlifyConnected(data.netlifyConnected || false);
      setVercelConnected(data.vercelConnected || false);
    } catch (error) {
      console.error('Failed to load token status:', error);
    }
  };

  const saveToken = async (platform: 'netlify' | 'vercel', token: string) => {
    if (!token.trim()) {
      setMessage({ type: 'error', text: 'Please enter a valid token' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/deployment/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform,
          token,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save token');
      }

      setMessage({ 
        type: 'success', 
        text: `${platform === 'netlify' ? 'Netlify' : 'Vercel'} token saved successfully!` 
      });
      
      // Update connection status
      if (platform === 'netlify') {
        setNetlifyConnected(true);
        setNetlifyToken('');
      } else {
        setVercelConnected(true);
        setVercelToken('');
      }

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to save token' 
      });
    } finally {
      setSaving(false);
    }
  };

  const removeToken = async (platform: 'netlify' | 'vercel') => {
    if (!confirm(`Are you sure you want to remove your ${platform === 'netlify' ? 'Netlify' : 'Vercel'} token?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/deployment/tokens?platform=${platform}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove token');
      }

      setMessage({ 
        type: 'success', 
        text: `${platform === 'netlify' ? 'Netlify' : 'Vercel'} token removed successfully` 
      });

      // Update connection status
      if (platform === 'netlify') {
        setNetlifyConnected(false);
      } else {
        setVercelConnected(false);
      }

      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage({ 
        type: 'error', 
        text: 'Failed to remove token' 
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Link 
            href="/settings" 
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
          </Link>
          <div className="flex items-center gap-3">
            <Rocket className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="text-2xl font-bold text-white">Deployment Settings</h1>
              <p className="text-gray-400 text-sm mt-1">
                Configure your deployment platforms to enable one-click deployments
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Status Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-500/10 border border-green-500/30 text-green-400' 
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <p>{message.text}</p>
          </div>
        )}

        {/* Netlify Section */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#00C7B7] rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="white" width="32" height="32">
                  <path d="M12 2L2 12l10 10 10-10L12 2zm0 2.8L19.2 12 12 19.2 4.8 12 12 4.8z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white mb-1">Netlify</h2>
                <div className="flex items-center gap-2">
                  {netlifyConnected ? (
                    <span className="flex items-center gap-1.5 text-sm text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      Connected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-sm text-gray-400">
                      <XCircle className="w-4 h-4" />
                      Not connected
                    </span>
                  )}
                </div>
              </div>
            </div>
            {netlifyConnected && (
              <button
                onClick={() => removeToken('netlify')}
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                Remove Token
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Personal Access Token
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showNetlifyToken ? 'text' : 'password'}
                    value={netlifyToken}
                    onChange={(e) => setNetlifyToken(e.target.value)}
                    placeholder="Enter your Netlify token"
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-10 pr-10 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNetlifyToken(!showNetlifyToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showNetlifyToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <button
                  onClick={() => saveToken('netlify', netlifyToken)}
                  disabled={saving || !netlifyToken.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </div>
            </div>

            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-white mb-2">How to get your Netlify token:</h3>
              <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
                <li>Go to your Netlify dashboard</li>
                <li>Click on your profile → User settings → Applications</li>
                <li>Create a new access token with deploy permissions</li>
                <li>Copy and paste it above</li>
              </ol>
              <a
                href="https://app.netlify.com/user/applications#personal-access-tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Get your token <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Vercel Section */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="white" width="32" height="32">
                  <path d="M12 2L2 19h20L12 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white mb-1">Vercel</h2>
                <div className="flex items-center gap-2">
                  {vercelConnected ? (
                    <span className="flex items-center gap-1.5 text-sm text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      Connected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-sm text-gray-400">
                      <XCircle className="w-4 h-4" />
                      Not connected
                    </span>
                  )}
                </div>
              </div>
            </div>
            {vercelConnected && (
              <button
                onClick={() => removeToken('vercel')}
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                Remove Token
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Access Token
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showVercelToken ? 'text' : 'password'}
                    value={vercelToken}
                    onChange={(e) => setVercelToken(e.target.value)}
                    placeholder="Enter your Vercel token"
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-10 pr-10 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowVercelToken(!showVercelToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showVercelToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <button
                  onClick={() => saveToken('vercel', vercelToken)}
                  disabled={saving || !vercelToken.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </div>
            </div>

            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-white mb-2">How to get your Vercel token:</h3>
              <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
                <li>Go to your Vercel dashboard</li>
                <li>Click on Settings → Tokens</li>
                <li>Create a new token with appropriate scopes</li>
                <li>Copy and paste it above</li>
              </ol>
              <a
                href="https://vercel.com/account/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Get your token <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex gap-3">
            <Key className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-300">
              <p className="font-medium text-white mb-1">Security Notice</p>
              <p>
                Your tokens are stored securely in our database. We never share them with third parties.
                You can remove them anytime from this page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
