import { useState, useEffect, useCallback } from "react";
import { authService } from "../services/authService";

// ── Background Floating Particles ─────────────────────────────────────────────
function Particles() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {[...Array(14)].map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: `${(i % 4) * 2 + 3}px`,
            height: `${(i % 4) * 2 + 3}px`,
            borderRadius: "50%",
            background: `rgba(99,102,241,${0.15 + (i % 5) * 0.08})`,
            left: `${(i * 19) % 100}%`,
            top: `${(i * 29) % 100}%`,
            animation: `float-particle ${7 + (i % 5)}s ease-in-out infinite`,
            animationDelay: `${i * 0.4}s`,
          }}
        />
      ))}
    </div>
  );
}

// ── Captcha Visual Box ────────────────────────────────────────────────────────
function CaptchaBox({ captcha, onReload, loading }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 10,
        padding: "6px 10px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          padding: "6px 16px",
          background: "linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(168,85,247,0.2) 100%)",
          border: "1px dashed rgba(129,140,248,0.4)",
          borderRadius: 8,
          letterSpacing: "8px",
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: "1.15rem",
          fontWeight: 800,
          color: "#c7d2fe",
          userSelect: "none",
          textShadow: "0 0 10px rgba(129,140,248,0.5)",
          minWidth: 100,
          textAlign: "center",
        }}
      >
        {captcha?.captcha_text ? captcha.captcha_text : "••••"}
      </div>

      <button
        type="button"
        onClick={onReload}
        disabled={loading}
        title="Lấy mã captcha khác"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8,
          color: "#94a3b8",
          cursor: loading ? "not-allowed" : "pointer",
          padding: "8px 10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all .2s",
        }}
      >
        <svg
          style={loading ? { animation: "spin-ring 0.8s linear infinite" } : {}}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
        >
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
        </svg>
      </button>
    </div>
  );
}

export default function AuthModal({ onLoginSuccess }) {
  // Modes: "login" | "register" | "verify_otp" | "forgot_password"
  const [mode, setMode]             = useState("login");
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [captchaInput, setCaptcha]  = useState("");
  const [otpCode, setOtpCode]       = useState("");

  const [captchaData, setCaptchaData] = useState(null);
  const [loadingCaptcha, setLoadingCaptcha] = useState(false);

  const [errorMsg, setErrorMsg]     = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading]       = useState(false);
  const [showPass, setShowPass]     = useState(false);
  const [animate, setAnimate]       = useState(false);

  useEffect(() => {
    setAnimate(true);
  }, []);

  // Tải Captcha từ backend
  const loadCaptcha = useCallback(async () => {
    setLoadingCaptcha(true);
    try {
      const data = await authService.getCaptcha();
      setCaptchaData(data);
      setCaptcha("");
    } catch {
      // Fallback local visual code nếu backend sleep
      setCaptchaData({
        captcha_id: "local_id",
        captcha_text: "7F9K",
      });
    } finally {
      setLoadingCaptcha(false);
    }
  }, []);

  useEffect(() => {
    if (mode !== "verify_otp") {
      loadCaptcha();
    }
  }, [mode, loadCaptcha]);

  const switchMode = (newMode) => {
    setMode(newMode);
    setErrorMsg("");
    setSuccessMsg("");
    setCaptcha("");
    setOtpCode("");
  };

  // Xử lý gửi Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    // ── 1. ĐĂNG NHẬP ──────────────────────────────────────────────────────────
    if (mode === "login") {
      if (!email.trim() || !password.trim()) {
        setErrorMsg("Vui lòng nhập đầy đủ tài khoản/email và mật khẩu.");
        return;
      }
      if (!captchaInput.trim()) {
        setErrorMsg("Vui lòng nhập mã Captcha 4 ký tự.");
        return;
      }
      setLoading(true);
      try {
        const res = await authService.login({
          email: email.trim(),
          password,
          captcha_id: captchaData?.captcha_id,
          captcha_text: captchaInput.trim(),
        });
        setSuccessMsg(`Chào mừng trở lại, ${res.username || res.user?.email}!`);
        setTimeout(() => onLoginSuccess(res), 700);
      } catch (err) {
        setErrorMsg(err.message);
        loadCaptcha();
      } finally {
        setLoading(false);
      }
      return;
    }

    // ── 2. ĐĂNG KÝ ────────────────────────────────────────────────────────────
    if (mode === "register") {
      if (!email.trim() || !password.trim()) {
        setErrorMsg("Vui lòng nhập đầy đủ Email và Mật khẩu.");
        return;
      }
      if (!email.includes("@")) {
        setErrorMsg("Vui lòng nhập định dạng Email hợp lệ để nhận mã kích hoạt.");
        return;
      }
      if (password.length < 6) {
        setErrorMsg("Mật khẩu phải có ít nhất 6 ký tự.");
        return;
      }
      if (!captchaInput.trim()) {
        setErrorMsg("Vui lòng nhập mã Captcha 4 ký tự.");
        return;
      }
      setLoading(true);
      try {
        const res = await authService.register({
          email: email.trim(),
          password,
          captcha_id: captchaData?.captcha_id,
          captcha_text: captchaInput.trim(),
        });
        setSuccessMsg(res.message || "Mã kích hoạt đã được gửi tới email của bạn!");
        // Chuyển sang bước nhập OTP
        setTimeout(() => {
          setMode("verify_otp");
          setErrorMsg("");
          setSuccessMsg("");
        }, 1200);
      } catch (err) {
        setErrorMsg(err.message);
        loadCaptcha();
      } finally {
        setLoading(false);
      }
      return;
    }

    // ── 3. XÁC THỰC OTP EMAIL ────────────────────────────────────────────────
    if (mode === "verify_otp") {
      if (!otpCode.trim() || otpCode.trim().length !== 6) {
        setErrorMsg("Vui lòng nhập đủ 6 chữ số mã OTP.");
        return;
      }
      setLoading(true);
      try {
        const res = await authService.verifyEmail(email.trim(), otpCode.trim());
        setSuccessMsg(res.message || "Kích hoạt thành công! Đang tự động đăng nhập...");
        // Tự động đăng nhập luôn sau khi kích hoạt
        const loginRes = await authService.login({
          email: email.trim(),
          password,
        });
        setTimeout(() => onLoginSuccess(loginRes), 1000);
      } catch (err) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    // ── 4. QUÊN MẬT KHẨU ─────────────────────────────────────────────────────
    if (mode === "forgot_password") {
      if (!email.trim() || !email.includes("@")) {
        setErrorMsg("Vui lòng nhập địa chỉ Email đã đăng ký.");
        return;
      }
      if (!captchaInput.trim()) {
        setErrorMsg("Vui lòng nhập mã Captcha 4 ký tự.");
        return;
      }
      setLoading(true);
      try {
        const res = await authService.forgotPassword({
          email: email.trim(),
          captcha_id: captchaData?.captcha_id,
          captcha_text: captchaInput.trim(),
        });
        setSuccessMsg(res.message);
      } catch (err) {
        setErrorMsg(err.message);
        loadCaptcha();
      } finally {
        setLoading(false);
      }
      return;
    }
  };

  return (
    <>
      {/* ── Keyframes ── */}
      <style>{`
        @keyframes float-particle {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
          33% { transform: translateY(-25px) translateX(12px); opacity: 0.8; }
          66% { transform: translateY(12px) translateX(-18px); opacity: 0.5; }
        }
        @keyframes auth-slide-up {
          from { opacity: 0; transform: translateY(28px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes spin-ring {
          to { transform: rotate(360deg); }
        }
        .auth-btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(99,102,241,0.5);
        }
        .auth-btn-primary:active:not(:disabled) { transform: translateY(0); }
        .auth-input:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.18);
        }
        .auth-switch-btn:hover { color: #a5b4fc; }
        .auth-tab-btn { transition: all .2s; }
        .auth-tab-btn.active {
          background: rgba(99,102,241,0.22);
          color: #a5b4fc;
          border-color: rgba(99,102,241,0.45);
        }
        .eye-btn:hover { color: #cbd5e1; }
      `}</style>

      {/* ── Backdrop ── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "radial-gradient(ellipse 85% 65% at 50% 40%, #151336 0%, #070712 65%, #000 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
        }}
      >
        <Particles />

        {/* Glow Effects */}
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "15%",
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 70%)",
            filter: "blur(50px)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "15%",
            right: "12%",
            width: 260,
            height: 260,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)",
            filter: "blur(50px)",
            pointerEvents: "none",
          }}
        />

        {/* ── Modal Card ── */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            maxWidth: 440,
            background: "rgba(15,15,30,0.88)",
            backdropFilter: "blur(26px)",
            border: "1px solid rgba(99,102,241,0.25)",
            borderRadius: 22,
            boxShadow: "0 32px 80px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.08)",
            overflow: "hidden",
            animation: animate ? "auth-slide-up 0.45s cubic-bezier(.22,.68,0,1.2) forwards" : "none",
            opacity: animate ? undefined : 0,
          }}
        >
          {/* Accent Line */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 2.5,
              background: "linear-gradient(90deg, transparent, #6366f1, #a855f7, transparent)",
            }}
          />

          <div style={{ padding: "36px 36px 32px" }}>
            {/* ── Logo + Brand ── */}
            <div style={{ textAlign: "center", marginBottom: 22 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 15,
                  margin: "0 auto 12px",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 24px rgba(99,102,241,0.45)",
                }}
              >
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: "1.55rem",
                  fontWeight: 800,
                  letterSpacing: "-0.5px",
                  background: "linear-gradient(135deg, #e8eaf6 30%, #c7d2fe 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                RenGoFun
              </h1>
              <p
                style={{
                  margin: "3px 0 0",
                  fontSize: "0.76rem",
                  color: "#64748b",
                  letterSpacing: "0.4px",
                }}
              >
                Hệ Thống Xác Thực Bảo Mật Đám Mây (Cloud Auth v3.0)
              </p>
            </div>

            {/* ── Tabs (Chỉ hiện khi ở login hoặc register) ── */}
            {(mode === "login" || mode === "register") && (
              <div
                style={{
                  display: "flex",
                  gap: 4,
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 10,
                  padding: 4,
                  marginBottom: 20,
                }}
              >
                <button
                  type="button"
                  className={`auth-tab-btn ${mode === "login" ? "active" : ""}`}
                  onClick={() => switchMode("login")}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: 7,
                    border: "1px solid transparent",
                    background: "transparent",
                    color: "#94a3b8",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  className={`auth-tab-btn ${mode === "register" ? "active" : ""}`}
                  onClick={() => switchMode("register")}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: 7,
                    border: "1px solid transparent",
                    background: "transparent",
                    color: "#94a3b8",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Tạo tài khoản
                </button>
              </div>
            )}

            {/* ── Tiêu đề khi ở Mode OTP hoặc Quên Mật Khẩu ── */}
            {mode === "verify_otp" && (
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "#e0e7ff" }}>
                  Xác thực Email kích hoạt
                </div>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 4 }}>
                  Mã 6 chữ số đã gửi tới <strong style={{ color: "#a5b4fc" }}>{email}</strong>
                </div>
              </div>
            )}

            {mode === "forgot_password" && (
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "#e0e7ff" }}>
                  Yêu cầu cấp lại mật khẩu
                </div>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 4 }}>
                  Quản trị viên sẽ phê duyệt và gửi mật khẩu mới qua Gmail
                </div>
              </div>
            )}

            {/* ── Alert Messages ── */}
            {errorMsg && (
              <div
                style={{
                  marginBottom: 16,
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "#fca5a5",
                  fontSize: "0.78rem",
                  lineHeight: 1.5,
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-start",
                }}
              >
                <span style={{ marginTop: 1, flexShrink: 0 }}>⚠</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div
                style={{
                  marginBottom: 16,
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "rgba(34,197,94,0.08)",
                  border: "1px solid rgba(34,197,94,0.3)",
                  color: "#86efac",
                  fontSize: "0.78rem",
                  lineHeight: 1.5,
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <span>✓</span> <span>{successMsg}</span>
              </div>
            )}

            {/* ── FORM ── */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Trường Email / Username */}
              {mode !== "verify_otp" && (
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      color: "#94a3b8",
                      marginBottom: 6,
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                    }}
                  >
                    {mode === "login" ? "Email hoặc Username" : "Địa chỉ Email"}
                  </label>
                  <div style={{ position: "relative" }}>
                    <div
                      style={{
                        position: "absolute",
                        left: 13,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#6366f1",
                        pointerEvents: "none",
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </div>
                    <input
                      className="auth-input"
                      type={mode === "login" ? "text" : "email"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={mode === "login" ? "Nhập email hoặc username..." : "ten_ban@gmail.com"}
                      disabled={loading}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "11px 14px 11px 38px",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 10,
                        color: "#e8eaf6",
                        fontSize: "0.85rem",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Trường Mật khẩu */}
              {(mode === "login" || mode === "register") && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <label
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        color: "#94a3b8",
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                      }}
                    >
                      Mật khẩu
                    </label>
                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => switchMode("forgot_password")}
                        className="auth-switch-btn"
                        style={{
                          background: "none",
                          border: "none",
                          color: "#818cf8",
                          fontSize: "0.72rem",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        Quên mật khẩu?
                      </button>
                    )}
                  </div>

                  <div style={{ position: "relative" }}>
                    <div
                      style={{
                        position: "absolute",
                        left: 13,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#6366f1",
                        pointerEvents: "none",
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </div>
                    <input
                      className="auth-input"
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Nhập mật khẩu..."
                      disabled={loading}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "11px 44px 11px 38px",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 10,
                        color: "#e8eaf6",
                        fontSize: "0.85rem",
                      }}
                    />
                    <button
                      type="button"
                      className="eye-btn"
                      onClick={() => setShowPass(!showPass)}
                      style={{
                        position: "absolute",
                        right: 13,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#6b7280",
                        padding: 0,
                      }}
                    >
                      {showPass ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Trường Captcha 4 ký tự */}
              {mode !== "verify_otp" && (
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      color: "#94a3b8",
                      marginBottom: 6,
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                    }}
                  >
                    Mã xác thực Captcha
                  </label>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <CaptchaBox
                      captcha={captchaData}
                      onReload={loadCaptcha}
                      loading={loadingCaptcha}
                    />
                    <input
                      className="auth-input"
                      type="text"
                      maxLength={4}
                      value={captchaInput}
                      onChange={(e) => setCaptcha(e.target.value.toUpperCase())}
                      placeholder="Nhập 4 ký tự..."
                      disabled={loading}
                      style={{
                        flex: 1,
                        padding: "11px 14px",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 10,
                        color: "#e8eaf6",
                        fontSize: "0.95rem",
                        letterSpacing: "3px",
                        fontWeight: 700,
                        textAlign: "center",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Trường Nhập OTP 6 số (chỉ hiện khi verify_otp) */}
              {mode === "verify_otp" && (
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      color: "#94a3b8",
                      marginBottom: 8,
                      textAlign: "center",
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                    }}
                  >
                    Nhập mã OTP (6 chữ số)
                  </label>
                  <input
                    className="auth-input"
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••••"
                    autoFocus
                    disabled={loading}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "14px 14px",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(99,102,241,0.3)",
                      borderRadius: 12,
                      color: "#a5b4fc",
                      fontSize: "1.6rem",
                      letterSpacing: "12px",
                      fontWeight: 800,
                      textAlign: "center",
                    }}
                  />
                  <div style={{ textAlign: "center", marginTop: 8, fontSize: "0.72rem", color: "#64748b" }}>
                    Mã có hiệu lực trong 15 phút. Kiểm tra cả thư mục Spam.
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                className="auth-btn-primary"
                type="submit"
                disabled={loading}
                style={{
                  marginTop: 6,
                  padding: "12px 20px",
                  borderRadius: 11,
                  background: loading
                    ? "rgba(99,102,241,0.4)"
                    : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  border: "none",
                  color: "white",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 9,
                  transition: "all .2s",
                  boxShadow: loading ? "none" : "0 4px 16px rgba(99,102,241,0.35)",
                }}
              >
                {loading ? (
                  <>
                    <svg
                      style={{ animation: "spin-ring 0.8s linear infinite" }}
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="3"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M22 12a10 10 0 00-10-10" stroke="white" />
                    </svg>
                    Đang xử lý với Cloud Auth...
                  </>
                ) : (
                  <>
                    {mode === "login" && "Đăng nhập ngay"}
                    {mode === "register" && "Đăng ký & Gửi OTP"}
                    {mode === "verify_otp" && "Xác nhận & Vào ứng dụng"}
                    {mode === "forgot_password" && "Gửi yêu cầu tới Admin"}
                  </>
                )}
              </button>
            </form>

            {/* ── Switcher & Điều hướng ── */}
            <div style={{ textAlign: "center", marginTop: 20, fontSize: "0.78rem", color: "#6b7280" }}>
              {mode === "login" && (
                <>
                  Chưa có tài khoản?{" "}
                  <button
                    className="auth-switch-btn"
                    type="button"
                    onClick={() => switchMode("register")}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#6366f1",
                      fontWeight: 700,
                      fontSize: "0.78rem",
                      padding: 0,
                    }}
                  >
                    Đăng ký ngay →
                  </button>
                </>
              )}

              {mode === "register" && (
                <>
                  Đã có tài khoản?{" "}
                  <button
                    className="auth-switch-btn"
                    type="button"
                    onClick={() => switchMode("login")}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#6366f1",
                      fontWeight: 700,
                      fontSize: "0.78rem",
                      padding: 0,
                    }}
                  >
                    ← Đăng nhập
                  </button>
                </>
              )}

              {(mode === "verify_otp" || mode === "forgot_password") && (
                <button
                  className="auth-switch-btn"
                  type="button"
                  onClick={() => switchMode("login")}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#6366f1",
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    padding: 0,
                  }}
                >
                  ← Quay lại Đăng nhập
                </button>
              )}
            </div>

            {/* ── Security Trust Footer ── */}
            <div
              style={{
                marginTop: 18,
                padding: "8px 12px",
                borderRadius: 9,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                justifyContent: "center",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span style={{ fontSize: "0.67rem", color: "#475569" }}>
                JWT 15m · Refresh Token 7d · Bcrypt Hash · OTP Gmail TLS
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}