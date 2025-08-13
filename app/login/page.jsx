"use client";
import { useState } from 'react';
import Image from 'next/image';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      window.location.href = '/';
    } else {
      const data = await res.json();
      setError(data.error || 'Login failed. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-10 rounded shadow-md w-80">
        <div className="text-center mb-5">
           <Image
             src="/images/logo.png"
             alt="Scurry Logo"
             width={36}
             height={36}
             className="inline vertical-align-middle mb-1"
             style={{ height: 36 }}
             priority
           />
           <h1 className="text-2xl font-bold text-center text-gray-800">Scurry Password</h1>
        </div>
        <input
          type="password"
          className="block w-full rounded-md bg-white px-4 py-2.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-200 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-pink-400 sm:text-sm/6 pr-10 mb-5"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          disabled={loading}
        />
        {error && <div className="text-red-500 mb-5 text-center">{error}</div>}
        <button
          type="submit"
          className="w-full bg-pink-400 text-white py-2 rounded hover:bg-pink-500 cursor-pointer disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
