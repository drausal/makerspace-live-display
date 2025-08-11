'use client';

import { useState } from 'react';
import Link from 'next/link';

export function AdminPanel() {
  const [mockTime, setMockTime] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleTimeOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/time-override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mockTime: mockTime || null,
          password: password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(
          mockTime
            ? `✅ Time override set to: ${new Date(
                mockTime
              ).toLocaleString()}`
            : '✅ Time override cleared - using real time'
        );
      } else {
        setMessage(`❌ ${result.error || 'Failed to update time override'}`);
      }
    } catch (error) {
      setMessage('❌ Error: Could not connect to the API');
      console.error('Time override error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearOverride = () => {
    setMockTime('');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-surface rounded-lg border border-border shadow-lg">
          <div className="p-6 border-b border-border">
            <h1 className="text-3xl font-bold text-primary">
              Admin Panel
            </h1>
            <p className="text-secondary">
              Makerspace Display System Control
            </p>
          </div>

          <div className="p-6">
            <form onSubmit={handleTimeOverride} className="space-y-6">
              <div>
                <label
                  htmlFor="mockTime"
                  className="block text-lg font-bold text-secondary mb-2"
                >
                  Time Override
                </label>
                <input
                  type="datetime-local"
                  id="mockTime"
                  value={mockTime}
                  onChange={(e) => setMockTime(e.target.value)}
                  className="w-full p-3 bg-background border border-border rounded-md"
                />
                <p className="text-sm text-secondary mt-2">
                  Leave empty to use real system time.
                </p>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-lg font-bold text-secondary mb-2"
                >
                  Admin Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 bg-background border border-border rounded-md"
                  required
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Apply Override'}
                </button>
                <button
                  type="button"
                  onClick={clearOverride}
                  className="bg-secondary text-white font-bold py-3 px-6 rounded-lg"
                >
                  Clear Override
                </button>
              </div>
            </form>

            {message && (
              <div
                className={`mt-6 p-4 rounded-md border ${
                  message.startsWith('✅')
                    ? 'bg-success/20 border-success text-success'
                    : 'bg-danger/20 border-danger text-danger'
                }`}
              >
                <p className="font-bold">{message}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-primary hover:underline">
            &larr; Back to TV Display
          </Link>
        </div>
      </div>
    </div>
  );
}