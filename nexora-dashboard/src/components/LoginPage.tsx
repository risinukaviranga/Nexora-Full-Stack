import { FormEvent, useState } from "react";
import { Activity, LockKeyhole, Mail } from "lucide-react";
import { login, NexoraUser } from "../lib/api";

export default function LoginPage({ onLogin }: { onLogin: (user: NexoraUser) => void }) {
  const [email, setEmail] = useState("admin@nexora.lk");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      onLogin(await login(email, password));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-screen">
      <form onSubmit={submit} className="login-card">
        <div className="login-mark"><Activity size={25} /></div>
        <p className="login-eyebrow">NEXORA WORKSPACE</p>
        <h1>Welcome back</h1>
        <p className="login-subtitle">Sign in to your business command center.</p>
        <label>Email address</label>
        <div className="login-input"><Mail size={17} /><input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
        <label>Password</label>
        <div className="login-input"><LockKeyhole size={17} /><input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></div>
        {error && <p className="login-error">{error}</p>}
        <button className="login-submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        <p className="login-hint">Development demo: admin@nexora.lk / admin123</p>
      </form>
    </main>
  );
}
