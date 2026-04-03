'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, KeyRound, UserPlus, LogIn, Clipboard, Check, Sparkles } from 'lucide-react';

const TOKEN_STORAGE_KEY = 'erdb_active_token';
const TOKEN_PASSWORD_STORAGE_KEY = 'erdb_token_password';

type AuthMode = 'login' | 'register';

async function saveCredentialsInBrowser(token: string, password: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  window.localStorage.setItem(TOKEN_PASSWORD_STORAGE_KEY, password);

  const passwordCredentialCtor = (window as Window & {
    PasswordCredential?: new (data: { id: string; name?: string; password: string }) => Credential;
  }).PasswordCredential;

  if (!('credentials' in navigator) || !passwordCredentialCtor) {
    return;
  }

  try {
    const credential = new passwordCredentialCtor({
      id: token,
      name: 'ERDB Token Account',
      password,
    });
    await navigator.credentials.store(credential);
  } catch {
    // Some browsers silently block credential storage or require a native save prompt.
  }
}

export function WorkspaceAuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('login');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [generatedToken, setGeneratedToken] = useState('');
  const [hasSavedCredentials, setHasSavedCredentials] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const attemptedStoredLoginRef = useRef(false);

  const resetRegisterState = () => {
    setGeneratedToken('');
    setHasSavedCredentials(false);
    setCopiedToken(false);
  };

  const handleGenerateToken = async () => {
    setStatus('loading');
    setMessage('');
    setHasSavedCredentials(false);
    setCopiedToken(false);

    try {
      const response = await fetch('/api/workspace-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-token' }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to generate token');
      }
      setGeneratedToken(data.token);
      setStatus('idle');
    } catch (error: any) {
      setStatus('error');
      setMessage(error?.message || 'Unable to generate token');
    }
  };

  const handleCopyCredentials = async () => {
    if (!generatedToken || !password) {
      setStatus('error');
      setMessage('Generate the token and enter a password before saving your credentials.');
      return;
    }

    const credentials = `ERDB login\nToken: ${generatedToken}\nPassword: ${password}`;
    await navigator.clipboard.writeText(credentials);
    await saveCredentialsInBrowser(generatedToken, password);
    setCopiedToken(true);
    setHasSavedCredentials(true);
    setMessage('Credentials copied and saved in this browser when supported.');
  };

  useEffect(() => {
    if (typeof window === 'undefined' || attemptedStoredLoginRef.current) {
      return;
    }

    attemptedStoredLoginRef.current = true;
    const savedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY) || '';
    const savedPassword = window.localStorage.getItem(TOKEN_PASSWORD_STORAGE_KEY) || '';

    if (!savedToken || !savedPassword) {
      return;
    }

    setToken(savedToken);
    setPassword(savedPassword);

    void (async () => {
      try {
        const response = await fetch('/api/workspace-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'login', token: savedToken, password: savedPassword }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Auto login failed');
        }
        router.replace('/configurator');
        router.refresh();
      } catch {
        setMode('login');
      }
    })();
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('loading');
    setMessage('');

    if (mode === 'register' && password !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match.');
      return;
    }

    if (mode === 'register' && !generatedToken) {
      setStatus('error');
      setMessage('Generate a token first.');
      return;
    }

    if (mode === 'register' && !hasSavedCredentials) {
      setStatus('error');
      setMessage('Save your token and password first, then continue.');
      return;
    }

    try {
      const response = await fetch('/api/workspace-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          mode === 'login'
            ? { action: 'login', token, password }
            : { action: 'register', token: generatedToken, password }
        ),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      if (typeof window !== 'undefined' && data.token) {
        await saveCredentialsInBrowser(data.token, password);
      }

      router.replace('/configurator');
      router.refresh();
    } catch (error: any) {
      setStatus('error');
      setMessage(error?.message || 'Request failed');
    } finally {
      setStatus((current) => (current === 'error' ? 'error' : 'idle'));
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.22),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.16),transparent_28%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-16">
        <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-8 shadow-[0_40px_140px_-70px_rgba(0,0,0,1)] backdrop-blur-xl">
            <div className="inline-flex rounded-full border border-orange-400/20 bg-orange-500/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-200">
              Workspace Access
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Sign in before opening the configurator
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
              Sign in with a token to unlock the full workspace experience — or continue as a guest using query-string URLs like before.
            </p>

            {/* Key benefit highlight */}
            <div className="mt-6 rounded-2xl border border-orange-400/20 bg-orange-500/[0.07] p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-orange-500/20">
                  <Sparkles className="h-4 w-4 text-orange-300" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-orange-100">Zero reinstalls, instant updates</div>
                  <p className="mt-1 text-xs leading-6 text-slate-400">
                    With a token, your addon URL never changes. Your configuration lives server-side — so every tweak you make in the configurator applies <strong className="text-slate-200">instantly to all already-installed addons</strong>, with no reinstall or URL update needed.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <KeyRound className="h-5 w-5 text-orange-300" />
                <div className="mt-3 text-sm font-semibold text-white">Token Login</div>
                <p className="mt-1 text-xs leading-6 text-slate-400">
                  Sign in with your existing <code className="text-slate-300">Tk-...</code> token and password to restore your saved workspace and all your settings.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <UserPlus className="h-5 w-5 text-sky-300" />
                <div className="mt-3 text-sm font-semibold text-white">Quick Register</div>
                <p className="mt-1 text-xs leading-6 text-slate-400">
                  Generate a new token account in seconds. Install the addon once, then configure everything from the workspace — changes apply live.
                </p>
              </div>
            </div>
            <div className="mt-6">
              <Link
                href="/configurator?guest=1"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.08]"
              >
                <KeyRound className="h-4 w-4" />
                <span>Continue Without Token</span>
              </Link>
              <p className="mt-2 text-xs leading-6 text-slate-500">
                Settings are encoded in the URL. You will need to reinstall the addon whenever you change your configuration.
              </p>
            </div>
          </section>


          <section className="rounded-[32px] border border-white/10 bg-[#090909]/95 p-6 shadow-[0_40px_140px_-70px_rgba(0,0,0,1)] backdrop-blur-xl">
            <div className="flex rounded-2xl border border-white/10 bg-white/[0.03] p-1">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setMessage('');
                  resetRegisterState();
                }}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${mode === 'login' ? 'bg-orange-500 text-black' : 'text-slate-300 hover:bg-white/[0.04]'}`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setMessage('');
                  resetRegisterState();
                }}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${mode === 'register' ? 'bg-sky-400 text-black' : 'text-slate-300 hover:bg-white/[0.04]'}`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {mode === 'login' && (
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Token
                  </span>
                  <input
                    type="text"
                    autoComplete="username"
                    value={token}
                    onChange={(event) => setToken(event.target.value)}
                    placeholder="Tk-..."
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-orange-400/50"
                  />
                </label>
              )}

              {mode === 'login' && (
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Password
                  </span>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Token password"
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3 pl-11 pr-4 text-sm text-white outline-none transition focus:border-orange-400/50"
                    />
                  </div>
                </label>
              )}

              {mode === 'register' && (
                <>
                  <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
                          Step 1
                        </div>
                        <p className="mt-1 text-sm text-slate-200">Generate the token for the new account.</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleGenerateToken}
                        disabled={status === 'loading'}
                        className="inline-flex items-center gap-2 rounded-2xl bg-sky-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-sky-300 disabled:opacity-60"
                      >
                        <Sparkles className="h-4 w-4" />
                        <span>Generate Token</span>
                      </button>
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-[#080808]/80 p-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Generated Token
                      </div>
                      <div className="mt-2 break-all font-mono text-sm text-white">
                        {generatedToken || 'Click "Generate Token" to create your token.'}
                      </div>
                    </div>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Password
                    </span>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Choose a password"
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3 pl-11 pr-4 text-sm text-white outline-none transition focus:border-sky-400/50"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Confirm Password
                    </span>
                    <input
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Repeat the password"
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/50"
                    />
                  </label>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Step 2
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-300">
                      Save these login details before continuing. After this step you will need both the token and the password.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleCopyCredentials}
                        className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.09]"
                      >
                        {copiedToken ? <Check className="h-4 w-4 text-emerald-300" /> : <Clipboard className="h-4 w-4" />}
                        <span>{copiedToken ? 'Credentials Copied' : 'Copy Token And Password'}</span>
                      </button>
                    </div>
                    {hasSavedCredentials && (
                      <p className="mt-3 text-sm text-emerald-300">
                        Credentials saved. You can now complete registration.
                      </p>
                    )}
                  </div>
                </>
              )}

              {message && (
                <p className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${mode === 'login' ? 'bg-orange-500 text-black hover:bg-orange-400' : 'bg-sky-400 text-black hover:bg-sky-300'} disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {mode === 'login' ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                <span>{status === 'loading' ? 'Please wait...' : mode === 'login' ? 'Enter Workspace' : 'Create Account And Continue'}</span>
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
