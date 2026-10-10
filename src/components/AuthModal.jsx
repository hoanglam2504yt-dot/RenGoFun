import React, { useState } from "react";
import { authService } from "../services/authService";

export default function AuthModal({ onLoginSuccess }) {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        setLoading(true);

        try {
            if (isLogin) {
                const res = await authService.login(username, password);
                onLoginSuccess(res);
            } else {
                await authService.register(username, password);
                // Tự động đăng nhập luôn sau khi đăng ký thành công
                const res = await authService.login(username, password);
                onLoginSuccess(res);
            }
        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl w-full max-w-md shadow-2xl text-slate-100">
                <h2 className="text-2xl font-bold mb-2 text-center text-cyan-400">
                    RenGoFun
                </h2>
                <p className="text-sm text-slate-400 text-center mb-6">
                    {isLogin ? "Đăng nhập tài khoản để tiếp tục" : "Tạo tài khoản tài nguyên mới"}
                </p>

                {errorMsg && (
                    <div className="mb-4 p-3 bg-red-950/60 border border-red-500/50 text-red-300 text-xs rounded-lg">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                            Tên tài khoản
                        </label>
                        <input
                            type="text"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-cyan-500 text-sm"
                            placeholder="Nhập username..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                            Mật khẩu
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-cyan-500 text-sm"
                            placeholder="Nhập password..."
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white font-medium rounded-lg text-sm transition-colors"
                    >
                        {loading ? "Đang xử lý..." : isLogin ? "Đăng nhập" : "Đăng ký"}
                    </button>
                </form>

                <div className="mt-6 text-center text-xs text-slate-400">
                    {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
                    <button
                        type="button"
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setErrorMsg("");
                        }}
                        className="text-cyan-400 hover:underline font-semibold ml-1"
                    >
                        {isLogin ? "Đăng ký ngay" : "Đăng nhập tại đây"}
                    </button>
                </div>
            </div>
        </div>
    );
}