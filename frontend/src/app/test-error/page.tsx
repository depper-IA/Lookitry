'use client';

import { useState } from 'react';

export default function TestError() {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error('This is a test error');
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-6">
      <button
        type="button"
        onClick={() => setShouldThrow(true)}
        className="rounded-xl bg-[#FF5C3A] px-6 py-3 text-sm font-bold uppercase tracking-wider"
      >
        Trigger test error
      </button>
    </main>
  );
}
