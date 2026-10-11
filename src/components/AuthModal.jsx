import { useState, useEffect } from "react";
import { authService } from "../services/authService";

// ── Animated floating particle background ──────────────────────────────
function Particles() {
  return (
    <div style={{
      position: "absolute", inset: 0, overflow: "hidden",
      pointerEvents: "none", zIndex: 0
    }}>
      {[...Array(12)].map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          width: `${Math.random() * 6 + 2}px`,
          height: `${Math.random() * 6 + 2}px`,
          borderRadius: "50%",
          background: `rgba(99,102,241,${Math.random() * 0.4 + 0.1})`,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animation: `float-particle ${Math.random() * 8 + 6}s ease-in-out infinite`,
          animationDelay: `${Math.random() * 4}s`,
        }} />
      ))}
    </div>
  );
}

export default function AuthModal({ onLoginSuccess }) {
  const [isLogin, setIsLogin]       = useState(true);
  const [username, setUsername]     = useState("");
  const [password, setPassword]     = useState("");
  const [errorMsg, setErrorMsg]     = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading]       = useState(false);
  const [showPass, setShowPass]     = useState(false);
  const [animate, setAnimate]       = useState(false);

  useEffect(() => { setAnimate(true); }, []);

  const switchMode = () => {
    setIsLogin(!isLogin);
    setErrorMsg(""); setSuccessMsg("");
    setUsername(""); setPassword("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(""); setSuccessMsg("");
    if (!username.trim() || !password.trim()) {
      setErrorMsg("Vui lòng nhập đầy đủ tài khoản và mật khẩu.");
      return;
    }
    if (!isLogin && password.length < 6) {
      setErrorMsg("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        const res = await authService.login(username.trim(), password);
        setSuccessMsg(`Chào mừng trở lại, ${res.username}! Đang vào app...`);
        setTimeout(() => onLoginSuccess(res), 800);
      } else {
        await authService.register(username.trim(), password);
        setSuccessMsg("Đăng ký thành công! Đang đăng nhập tự động...");
        const res = await authService.login(username.trim(), password);
        setTimeout(() => onLoginSuccess(res), 800);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── CSS keyframes injection ── */}
      <style>{`
        @keyframes float-particle {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
          33% { transform: translateY(-30px) translateX(15px); opacity: 0.8; }
          66% { transform: translateY(15px) translateX(-20px); opacity: 0.5; }
        }
        @keyframes auth-slide-up {
          from { opacity: 0; transform: translateY(32px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes spin-ring {
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer-line {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .auth-btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(99,102,241,0.5);
        }
        .auth-btn-primary:active:not(:disabled) { transform: translateY(0); }
        .auth-input:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
        }
        .auth-switch-btn:hover { color: #818cf8; }
        .auth-tab-btn { transition: all .2s; }
        .auth-tab-btn.active {
          background: rgba(99,102,241,0.18);
          color: #818cf8;
          border-color: rgba(99,102,241,0.4);
        }
        .eye-btn:hover { color: #94a3b8; }
      `}</style>

      {/* ── Backdrop ── */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "radial-gradient(ellipse 80% 60% at 50% 40%, #1e1b4b 0%, #0a0a14 60%, #000 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
      }}>
        <Particles />

        {/* Glow orbs */}
        <div style={{
          position: "absolute", top: "20%", left: "15%",
          width: 300, height: 300, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
          filter: "blur(40px)", pointerEvents: "none"
        }} />
        <div style={{
          position: "absolute", bottom: "15%", right: "10%",
          width: 240, height: 240, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)",
          filter: "blur(40px)", pointerEvents: "none"
        }} />

        {/* ── Card ── */}
        <div style={{
          position: "relative", zIndex: 1, width: "100%", maxWidth: 420,
          background: "rgba(15,15,30,0.85)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(99,102,241,0.2)",
          borderRadius: 20,
          boxShadow: "0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
          overflow: "hidden",
          animation: animate ? "auth-slide-up 0.5s cubic-bezier(.22,.68,0,1.2) forwards" : "none",
          opacity: animate ? undefined : 0,
        }}>
          {/* Shimmer line top */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 2,
            background: "linear-gradient(90deg, transparent, #6366f1, #8b5cf6, transparent)",
            opacity: 0.8
          }} />

          <div style={{ padding: "40px 36px 36px" }}>
            {/* ── Logo + Brand ── */}
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16, margin: "0 auto 14px",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 8px 24px rgba(99,102,241,0.4)",
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <h1 style={{
                margin: 0, fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.5px",
                background: "linear-gradient(135deg, #e8eaf6 30%, #a5b4fc 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>RenGoFun</h1>
              <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "#64748b", letterSpacing: "0.5px" }}>
                Professional DTF Processing Studio
              </p>
            </div>

            {/* ── Mode tabs ── */}
            <div style={{
              display: "flex", gap: 4, background: "rgba(255,255,255,0.04)",
              borderRadius: 10, padding: 4, marginBottom: 24,
            }}>
              {[
                { mode: true,  label: "Đăng nhập" },
                { mode: false, label: "Đăng ký" }
              ].map(({ mode, label }) => (
                <button
                  key={String(mode)}
                  className={`auth-tab-btn ${isLogin === mode ? "active" : ""}`}
                  onClick={() => { setIsLogin(mode); setErrorMsg(""); setSuccessMsg(""); }}
                  style={{
                    flex: 1, padding: "8px 12px", borderRadius: 7,
                    border: "1px solid transparent",
                    background: "transparent", color: "#94a3b8",
                    fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
                  }}
                >{label}</button>
              ))}
            </div>

            {/* ── Alert messages ── */}
            {errorMsg && (
              <div style={{
                marginBottom: 16, padding: "10px 14px", borderRadius: 10,
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)",
                color: "#fca5a5", fontSize: "0.78rem", lineHeight: 1.5,
                display: "flex", gap: 8, alignItems: "flex-start"
              }}>
                <span style={{ marginTop: 1, flexShrink: 0 }}>⚠</span>
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div style={{
                marginBottom: 16, padding: "10px 14px", borderRadius: 10,
                background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)",
                color: "#86efac", fontSize: "0.78rem", lineHeight: 1.5,
                display: "flex", gap: 8, alignItems: "center"
              }}>
                <span>✓</span> <span>{successMsg}</span>
              </div>
            )}

            {/* ── Form ── */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Username */}
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600,
                  color: "#94a3b8", marginBottom: 6, letterSpacing: "0.5px", textTransform: "uppercase" }}>
                  Tên tài khoản
                </label>
                <div style={{ position: "relative" }}>
                  <div style={{
                    position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)",
                    color: "#6366f1", pointerEvents: "none"
                  }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <input
                    className="auth-input"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nhập username của bạn..."
                    autoComplete="username"
                    disabled={loading}
                    style={{
                      width: "100%", boxSizing: "border-box",
                      padding: "11px 14px 11px 38px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 10, color: "#e8eaf6", fontSize: "0.85rem",
                      transition: "all .2s",
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600,
                  color: "#94a3b8", marginBottom: 6, letterSpacing: "0.5px", textTransform: "uppercase" }}>
                  Mật khẩu {!isLogin && <span style={{ color: "#6b7280", textTransform: "none" }}>(tối thiểu 6 ký tự)</span>}
                </label>
                <div style={{ position: "relative" }}>
                  <div style={{
                    position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)",
                    color: "#6366f1", pointerEvents: "none"
                  }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <input
                    className="auth-input"
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu..."
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    disabled={loading}
                    style={{
                      width: "100%", boxSizing: "border-box",
                      padding: "11px 44px 11px 38px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 10, color: "#e8eaf6", fontSize: "0.85rem",
                      transition: "all .2s",
                    }}
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => setShowPass(!showPass)}
                    style={{
                      position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer",
                      color: "#6b7280", padding: 0, transition: "color .2s"
                    }}
                  >
                    {showPass ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                className="auth-btn-primary"
                type="submit"
                disabled={loading}
                style={{
                  marginTop: 6, padding: "12px 20px", borderRadius: 11,
                  background: loading
                    ? "rgba(99,102,241,0.4)"
                    : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  border: "none", color: "white", fontWeight: 700, fontSize: "0.88rem",
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                  transition: "all .2s", letterSpacing: "0.3px",
                  boxShadow: loading ? "none" : "0 4px 16px rgba(99,102,241,0.35)",
                }}
              >
                {loading ? (
                  <>
                    <svg style={{ animation: "spin-ring 0.8s linear infinite" }}
                      width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="rgba(255,255,255,0.5)" strokeWidth="3">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M22 12a10 10 0 00-10-10" stroke="white"/>
                    </svg>
                    Đang kết nối MongoDB Atlas...
                  </>
                ) : (
                  <>
                    {isLogin ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
                      </svg>
                    )}
                    {isLogin ? "Đăng nhập" : "Tạo tài khoản"}
                  </>
                )}
              </button>
            </form>

            {/* ── Cold start notice ── */}
            {loading && (
              <p style={{
                textAlign: "center", fontSize: "0.71rem", color: "#f59e0b",
                margin: "12px 0 0", lineHeight: 1.5
              }}>
                💡 Máy chủ miễn phí có thể mất 30–45s để thức dậy lần đầu
              </p>
            )}

            {/* ── Switch mode ── */}
            <div style={{ textAlign: "center", marginTop: 22, fontSize: "0.78rem", color: "#6b7280" }}>
              {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
              <button
                className="auth-switch-btn"
                type="button"
                onClick={switchMode}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#6366f1", fontWeight: 700, fontSize: "0.78rem",
                  padding: "0 2px", transition: "color .2s"
                }}
              >
                {isLogin ? "Đăng ký ngay →" : "← Đăng nhập"}
              </button>
            </div>

            {/* ── Security badge ── */}
            <div style={{
              marginTop: 20, padding: "10px 14px", borderRadius: 10,
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", gap: 8, justifyContent: "center"
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span style={{ fontSize: "0.68rem", color: "#475569", letterSpacing: "0.3px" }}>
                Bảo mật bằng JWT · Mật khẩu mã hóa Bcrypt · MongoDB Atlas TLS
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}