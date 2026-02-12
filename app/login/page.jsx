"use client";
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';

function LoginForm() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState('/');
  const searchParams = useSearchParams();

  useEffect(() => {
    const redirect = searchParams.get('redirect');
    if (redirect) {
      setRedirectUrl(redirect);
    }
  }, [searchParams]);

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
      window.location.href = redirectUrl;
    } else {
      const data = await res.json();
      setError(data.error || 'Login failed. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-zinc-900">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-800 p-10 rounded shadow-md w-80">
        <div className="text-center mb-5">
           <Image
             src="/images/logo.png"
             alt="Scurry Logo"
             width={36}
             height={36}
             className="inline vertical-align-middle mb-1"
             style={{ height: 36 }}
             priority
             unoptimized
           />
           <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-zinc-100">Scurry Password</h1>
        </div>
        <input
          type="password"
          className="block w-full rounded-md bg-white dark:bg-zinc-700 px-4 py-2.5 text-base text-gray-900 dark:text-zinc-100 outline-1 -outline-offset-1 outline-gray-200 dark:outline-zinc-600 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-2 focus:-outline-offset-2 focus:outline-pink-400 sm:text-sm/6 pr-10 mb-5"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          disabled={loading}
        />
        {error && <div className="text-red-500 dark:text-red-400 mb-5 text-center">{error}</div>}
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="dark:text-zinc-400">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
