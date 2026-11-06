/* Browser entry for Netlify Identity, bundled to /pwa/identity.js at deploy time
 * (scripts/optimize.mjs). pwa/pro.js loads it on demand and talks to window.MHSIdentity. */
import { login, signup, logout, getUser, handleAuthCallback, requestPasswordRecovery, updateUser, onAuthChange, getSettings, AuthError, MissingIdentityError } from "@netlify/identity";

function code(err) {
  if (err instanceof MissingIdentityError) return "identity_missing";
  if (err instanceof AuthError) {
    const m = String(err.message || "").toLowerCase();
    if (m.includes("not confirmed")) return "unconfirmed";
    if (m.includes("already")) return "exists";
    if (err.status === 401 || m.includes("invalid")) return "invalid";
    if (err.status === 403) return "signup_closed";
    if (err.status === 422) return m.includes("password") ? "weak" : "invalid_input";
    if (err.status === 429) return "rate";
  }
  return "network";
}
const wrap = fn => async (...a) => { try { return await fn(...a); } catch (e) { const x = new Error(code(e)); x.code = code(e); throw x; } };

window.MHSIdentity = {
  login: wrap(login),
  signup: wrap((email, password) => signup(email, password)),
  logout: wrap(logout),
  getUser,
  callback: wrap(handleAuthCallback),
  recover: wrap(requestPasswordRecovery),
  setPassword: wrap(password => updateUser({ password })),
  setMeta: wrap(data => updateUser({ data })),
  onChange: onAuthChange,
  settings: wrap(getSettings),
};
document.dispatchEvent(new Event("mhs:identity"));
