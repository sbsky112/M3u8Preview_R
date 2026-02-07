import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useAuthStore } from '../../stores/authStore.js';
import { useNavigate, NavLink, Link } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Clapperboard, Search, Film, ListVideo, Heart, Clock, Settings, Users, MonitorPlay, Download, Home, LogOut, ChevronDown, } from 'lucide-react';
export function Header() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const dropdownRef = useRef(null);
    const isAdmin = user?.role === 'ADMIN';
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    function handleSearch(e) {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/library?search=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
            setShowMobileSearch(false);
        }
    }
    async function handleLogout() {
        setShowDropdown(false);
        await logout();
        navigate('/login');
    }
    function handleDropdownNav(to) {
        setShowDropdown(false);
        navigate(to);
    }
    return (_jsxs("header", { className: "h-14 bg-gradient-to-b from-black/80 to-transparent flex items-center px-4 lg:px-6 gap-2 lg:gap-4 sticky top-0 z-30", children: [_jsxs(Link, { to: "/", className: "flex items-center gap-2 flex-shrink-0 mr-2 lg:mr-4", children: [_jsx(Clapperboard, { className: "w-6 h-6 text-emby-green" }), _jsx("span", { className: "text-lg font-bold text-emby-green hidden lg:block", children: "M3u8 Preview" })] }), _jsxs("nav", { className: "hidden lg:flex items-center gap-1", children: [_jsx(NavLink, { to: "/library", className: ({ isActive }) => `flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors relative ${isActive
                            ? 'text-emby-green font-medium'
                            : 'text-emby-text-secondary hover:text-white'}`, children: ({ isActive }) => (_jsxs(_Fragment, { children: [_jsx(Film, { className: "w-4 h-4" }), _jsx("span", { children: "\u6211\u7684\u5A92\u4F53" }), isActive && (_jsx("span", { className: "absolute bottom-0 left-3 right-3 h-0.5 bg-emby-green rounded-full" }))] })) }), _jsx(NavLink, { to: "/playlists", className: ({ isActive }) => `flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors relative ${isActive
                            ? 'text-emby-green font-medium'
                            : 'text-emby-text-secondary hover:text-white'}`, children: ({ isActive }) => (_jsxs(_Fragment, { children: [_jsx(ListVideo, { className: "w-4 h-4" }), _jsx("span", { children: "\u5408\u96C6" }), isActive && (_jsx("span", { className: "absolute bottom-0 left-3 right-3 h-0.5 bg-emby-green rounded-full" }))] })) })] }), _jsx("div", { className: "flex-1" }), _jsx("form", { onSubmit: handleSearch, className: "hidden lg:block max-w-xs w-64", children: _jsxs("div", { className: "relative", children: [_jsx("input", { type: "text", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), placeholder: "\u641C\u7D22\u5A92\u4F53...", className: "w-full pl-10 pr-4 py-1.5 bg-emby-bg-input border border-emby-border rounded-lg text-white placeholder-emby-text-muted focus:outline-none focus:ring-2 focus:ring-emby-green focus:border-transparent text-sm" }), _jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emby-text-muted" })] }) }), _jsx("button", { onClick: () => setShowMobileSearch(!showMobileSearch), className: "lg:hidden p-2 text-emby-text-secondary hover:text-white transition-colors", children: _jsx(Search, { className: "w-5 h-5" }) }), _jsxs("div", { className: "relative", ref: dropdownRef, children: [_jsxs("button", { onClick: () => setShowDropdown(!showDropdown), className: "flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors", children: [_jsx("div", { className: "w-8 h-8 bg-emby-green rounded-full flex items-center justify-center text-white text-sm font-medium", children: user?.username?.charAt(0).toUpperCase() }), _jsx(ChevronDown, { className: `w-4 h-4 text-emby-text-secondary transition-transform ${showDropdown ? 'rotate-180' : ''}` })] }), showDropdown && (_jsxs("div", { className: "absolute right-0 top-full mt-2 w-52 bg-emby-bg-dialog border border-emby-border rounded-lg shadow-xl py-1 animate-dropdown", children: [_jsxs("div", { className: "px-4 py-2.5 border-b border-emby-border", children: [_jsx("p", { className: "text-sm font-medium text-white", children: user?.username }), _jsx("p", { className: "text-xs text-emby-text-secondary", children: user?.email })] }), _jsxs("div", { className: "lg:hidden border-b border-emby-border py-1", children: [_jsx(DropdownItem, { icon: Home, label: "\u9996\u9875", onClick: () => handleDropdownNav('/') }), _jsx(DropdownItem, { icon: Film, label: "\u6211\u7684\u5A92\u4F53", onClick: () => handleDropdownNav('/library') }), _jsx(DropdownItem, { icon: ListVideo, label: "\u5408\u96C6", onClick: () => handleDropdownNav('/playlists') })] }), _jsxs("div", { className: "border-b border-emby-border py-1", children: [_jsx(DropdownItem, { icon: Heart, label: "\u6536\u85CF", onClick: () => handleDropdownNav('/favorites') }), _jsx(DropdownItem, { icon: Clock, label: "\u89C2\u770B\u5386\u53F2", onClick: () => handleDropdownNav('/history') })] }), isAdmin && (_jsxs("div", { className: "border-b border-emby-border py-1", children: [_jsx(DropdownItem, { icon: Settings, label: "\u7BA1\u7406\u9762\u677F", onClick: () => handleDropdownNav('/admin') }), _jsx(DropdownItem, { icon: Users, label: "\u7528\u6237\u7BA1\u7406", onClick: () => handleDropdownNav('/admin/users') }), _jsx(DropdownItem, { icon: MonitorPlay, label: "\u5A92\u4F53\u7BA1\u7406", onClick: () => handleDropdownNav('/admin/media') }), _jsx(DropdownItem, { icon: Download, label: "\u5BFC\u5165\u5A92\u4F53", onClick: () => handleDropdownNav('/import') })] })), _jsx("div", { className: "py-1", children: _jsxs("button", { onClick: handleLogout, className: "w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-emby-bg-elevated transition-colors", children: [_jsx(LogOut, { className: "w-4 h-4" }), "\u9000\u51FA\u767B\u5F55"] }) })] }))] }), showMobileSearch && (_jsx("div", { className: "absolute top-14 left-0 right-0 bg-emby-bg-card border-b border-emby-border px-4 py-2 lg:hidden animate-dropdown", children: _jsx("form", { onSubmit: handleSearch, children: _jsxs("div", { className: "relative", children: [_jsx("input", { type: "text", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), placeholder: "\u641C\u7D22\u5A92\u4F53...", autoFocus: true, className: "w-full pl-10 pr-4 py-2 bg-emby-bg-input border border-emby-border rounded-lg text-white placeholder-emby-text-muted focus:outline-none focus:ring-2 focus:ring-emby-green focus:border-transparent text-sm" }), _jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emby-text-muted" })] }) }) }))] }));
}
/** 下拉菜单通用项 */
function DropdownItem({ icon: Icon, label, onClick }) {
    return (_jsxs("button", { onClick: onClick, className: "w-full flex items-center gap-3 px-4 py-2 text-sm text-emby-text-primary hover:bg-emby-bg-elevated transition-colors", children: [_jsx(Icon, { className: "w-4 h-4 text-emby-text-secondary" }), label] }));
}
