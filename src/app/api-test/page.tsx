// app/api-test/page.tsx - API and LocalStorage testing page
'use client';

import { useState } from 'react';
import Link from 'next/link';

interface StorageInfo {
  info: {
    type: string;
    usage?: string;
    keys: string[];
  };
  health: {
    calendar: {
      lastFetch: string;
      eventCount: number;
      errors: string[];
    };
    processing: {
      totalEvents: number;
      validEvents: number;
      ageGroupBreakdown: Record<string, number>;
    };
    uptime: string;
  };
  timestamp: string;
}

export default function ApiTestPage() {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchStorageInfo = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/debug/storage');
      const data = await response.json();
      setStorageInfo(data);
      setMessage('✅ Storage info loaded successfully');
    } catch (error) {
      setMessage('❌ Error fetching storage info: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const clearStorage = async () => {
    if (!password) {
      setMessage('❌ Password required to clear storage');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/debug/storage?password=${encodeURIComponent(password)}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      
      if (response.ok) {
        setMessage('✅ Storage cleared successfully');
        setStorageInfo(null);
      } else {
        setMessage(`❌ ${data.error || 'Failed to clear storage'}`);
      }
    } catch (error) {
      setMessage('❌ Error clearing storage: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const testCalendarApi = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/calendar/status');
      const data = await response.json();
      setMessage(`✅ Calendar API test: Status = ${data.status}`);
    } catch (error) {
      setMessage('❌ Calendar API error: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-lg">
          <div className="p-6 border-b border-gray-700">
            <h1 className="text-3xl font-bold text-blue-400">
              API & LocalStorage Test
            </h1>
            <p className="text-gray-400 mt-2">
              Test localStorage functionality and API endpoints
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Direct API Links */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-green-400">Direct API Links</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a 
                  href="/api/health" 
                  target="_blank" 
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-center block"
                >
                  GET /api/health
                </a>
                <a 
                  href="/api/calendar/status" 
                  target="_blank" 
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-center block"
                >
                  GET /api/calendar/status
                </a>
                <a 
                  href="/api/display/status" 
                  target="_blank" 
                  className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-center block"
                >
                  GET /api/display/status
                </a>
                <a 
                  href="/api/debug/storage" 
                  target="_blank" 
                  className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded text-center block"
                >
                  GET /api/debug/storage
                </a>
              </div>
            </div>

            {/* Interactive Tests */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-blue-400">Interactive Tests</h2>
              
              <div className="flex gap-4">
                <button
                  onClick={testCalendarApi}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded"
                >
                  Test Calendar API
                </button>
                
                <button
                  onClick={fetchStorageInfo}
                  disabled={isLoading}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-4 py-2 rounded"
                >
                  Get Storage Info
                </button>
              </div>
            </div>

            {/* Storage Management */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-red-400">Storage Management</h2>
              
              <div className="flex gap-2">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Admin password"
                  className="bg-gray-700 border border-gray-600 rounded px-3 py-2 flex-1"
                />
                <button
                  onClick={clearStorage}
                  disabled={isLoading || !password}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 px-4 py-2 rounded"
                >
                  Clear LocalStorage
                </button>
              </div>
            </div>

            {/* Message Display */}
            {message && (
              <div className={`p-4 rounded border ${
                message.startsWith('✅') 
                  ? 'bg-green-900/20 border-green-600 text-green-300'
                  : 'bg-red-900/20 border-red-600 text-red-300'
              }`}>
                {message}
              </div>
            )}

            {/* Storage Info Display */}
            {storageInfo && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-yellow-400">Storage Information</h3>
                <pre className="bg-gray-900 border border-gray-600 rounded p-4 overflow-auto text-sm">
                  {JSON.stringify(storageInfo, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-700">
            <div className="flex gap-4">
              <Link 
                href="/" 
                className="text-blue-400 hover:text-blue-300 hover:underline"
              >
                ← TV Display
              </Link>
              <Link 
                href="/admin" 
                className="text-purple-400 hover:text-purple-300 hover:underline"
              >
                → Admin Panel
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
