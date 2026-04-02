'use client';

import { useState } from 'react';
import { Check, Clipboard } from 'lucide-react';

export function DocsCopyPromptButton({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
        copied
          ? 'bg-green-500 text-white'
          : 'border border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]'
      }`}
    >
      {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
      <span>{copied ? 'Prompt Copied' : 'Copy Prompt'}</span>
    </button>
  );
}
