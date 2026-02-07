import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet } from 'react-router-dom';
import { Header } from './Header.js';
import { PageTransition } from '../ui/PageTransition.js';
export function AppLayout() {
    return (_jsxs("div", { className: "min-h-screen bg-emby-bg-base", children: [_jsx(Header, {}), _jsx("main", { className: "px-6 py-4 lg:px-8 max-w-[1920px] mx-auto", children: _jsx(PageTransition, { children: _jsx(Outlet, {}) }) })] }));
}
