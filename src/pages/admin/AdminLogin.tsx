import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { admin, ApiError } from "../../api/api";
import Brand from "../../component/Brand";
import { Button, inputClass, labelClass } from "./ui";

type LocState = { from?: { pathname?: string } };

export default function Login() {
  const nav = useNavigate();
  const loc = useLocation();
  const from = (loc.state as LocState | null)?.from?.pathname || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    admin.me().then(() => {
      if (active) nav("/admin", { replace: true });
    }).catch(() => {});
    return () => {
      active = false;
    };
  }, [nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await admin.login(email.trim(), password);
      nav(from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sign-in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-pearl px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Brand name="Maison Rosé" className="text-3xl" />
          <p className="mt-3 text-[0.7rem] uppercase tracking-[0.24em] text-taupe">
            Salon Admin
          </p>
        </div>

        <form
          onSubmit={submit}
          className="rounded-xl border border-line bg-cream p-7 shadow-[0_30px_80px_-50px_rgba(23,18,15,0.5)]"
        >
          <div className="mb-5">
            <label htmlFor="admin-email" className={labelClass}>
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="you@salon.com"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="admin-password" className={labelClass}>
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder="••••••••"
            />
          </div>

          {error ? (
            <p role="alert" className="mb-4 text-sm text-rose-deep">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-taupe">
          <a href="/" className="ul-link hover:text-ink">
            ← Back to the site
          </a>
        </p>
      </div>
    </div>
  );
}


