import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Clapperboard } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore.js';
export function LoginForm() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const login = useAuthStore((s) => s.login);
    const navigate = useNavigate();
    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(username, password);
            navigate('/');
        }
        catch (err) {
            setError(err.response?.data?.error || '登录失败，请重试');
        }
        finally {
            setLoading(false);
        }
    }
    return (_jsx("div", { className: "min-h-screen bg-emby-bg-base flex items-center justify-center px-4", children: _jsxs("div", { className: "w-full max-w-md", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx(Clapperboard, { className: "w-12 h-12 text-emby-green mx-auto mb-3" }), _jsx("h1", { className: "text-3xl font-bold text-white mb-2", children: "M3u8 Preview" }), _jsx("p", { className: "text-emby-text-secondary", children: "\u767B\u5F55\u4EE5\u7EE7\u7EED" })] }), _jsxs("form", { onSubmit: handleSubmit, className: "bg-emby-bg-dialog rounded-md p-6 space-y-4 border border-emby-border-subtle", children: [error && (_jsx("div", { className: "bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-md text-sm", children: error })), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-emby-text-primary mb-1.5", children: "\u7528\u6237\u540D" }), _jsx("input", { type: "text", value: username, onChange: (e) => setUsername(e.target.value), className: "w-full px-3 py-2 bg-emby-bg-input border border-emby-border rounded-md text-white placeholder-emby-text-muted focus:outline-none focus:ring-2 focus:ring-emby-green focus:border-transparent", placeholder: "\u8BF7\u8F93\u5165\u7528\u6237\u540D", required: true, autoFocus: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-emby-text-primary mb-1.5", children: "\u5BC6\u7801" }), _jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), className: "w-full px-3 py-2 bg-emby-bg-input border border-emby-border rounded-md text-white placeholder-emby-text-muted focus:outline-none focus:ring-2 focus:ring-emby-green focus:border-transparent", placeholder: "\u8BF7\u8F93\u5165\u5BC6\u7801", required: true })] }), _jsx("button", { type: "submit", disabled: loading, className: "w-full py-2.5 bg-emby-green hover:bg-emby-green-dark disabled:opacity-50 text-white font-medium rounded-md transition-colors", children: loading ? '登录中...' : '登录' }), _jsxs("p", { className: "text-center text-sm text-emby-text-secondary", children: ["\u8FD8\u6CA1\u6709\u8D26\u53F7\uFF1F", ' ', _jsx(Link, { to: "/register", className: "text-emby-green-light hover:text-emby-green-hover", children: "\u6CE8\u518C" })] })] })] }) }));
}
