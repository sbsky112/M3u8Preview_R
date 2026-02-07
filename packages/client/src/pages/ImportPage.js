import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { importApi } from '../services/importApi.js';
export function ImportPage() {
    const [step, setStep] = useState('input');
    const [format, setFormat] = useState('text');
    const [textContent, setTextContent] = useState('');
    const [preview, setPreview] = useState(null);
    const [result, setResult] = useState(null);
    const [fileName, setFileName] = useState('');
    const [selectedFileName, setSelectedFileName] = useState('');
    const fileRef = useRef(null);
    const previewMutation = useMutation({
        mutationFn: async () => {
            if (format === 'text') {
                return importApi.previewText(textContent);
            }
            else {
                const file = fileRef.current?.files?.[0];
                if (!file)
                    throw new Error('请选择文件');
                setFileName(file.name);
                return importApi.previewFile(file);
            }
        },
        onSuccess: (data) => {
            setPreview(data);
            setStep('preview');
        },
    });
    const executeMutation = useMutation({
        mutationFn: () => {
            if (!preview)
                throw new Error('No preview data');
            const validItems = preview.items.filter((_, i) => !preview.errors.some(e => e.row === i + 1));
            return importApi.execute(validItems, format === 'text' ? 'TEXT' : 'FILE', fileName);
        },
        onSuccess: (data) => {
            setResult(data);
            setStep('result');
        },
    });
    function reset() {
        setStep('input');
        setFormat('text');
        setTextContent('');
        setPreview(null);
        setResult(null);
        setFileName('');
        setSelectedFileName('');
    }
    const stepNames = ['input', 'preview', 'result'];
    const stepLabels = {
        input: '输入数据',
        preview: '预览确认',
        result: '导入结果',
    };
    return (_jsxs("div", { className: "max-w-4xl mx-auto space-y-6", children: [_jsx("h1", { className: "text-2xl font-bold text-white", children: "\u6279\u91CF\u5BFC\u5165" }), _jsx("div", { className: "flex items-center gap-4 text-sm", children: stepNames.map((s, i) => (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: `w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${step === s ? 'bg-emby-green text-white' : i < stepNames.indexOf(step) ? 'bg-emby-green text-white' : 'bg-emby-bg-input text-emby-text-muted'}`, children: i + 1 }), _jsx("span", { className: step === s ? 'text-white' : 'text-emby-text-muted', children: stepLabels[s] }), i < 2 && _jsx("span", { className: "text-emby-text-muted mx-2", children: "\u2192" })] }, s))) }), step === 'input' && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex gap-3", children: [_jsx("button", { onClick: () => setFormat('text'), className: `px-4 py-2 rounded-lg text-sm ${format === 'text' ? 'bg-emby-green text-white' : 'bg-emby-bg-input text-emby-text-secondary hover:bg-emby-bg-elevated'}`, children: "\u6587\u672C\u8F93\u5165" }), _jsx("button", { onClick: () => setFormat('file'), className: `px-4 py-2 rounded-lg text-sm ${format === 'file' ? 'bg-emby-green text-white' : 'bg-emby-bg-input text-emby-text-secondary hover:bg-emby-bg-elevated'}`, children: "\u6587\u4EF6\u4E0A\u4F20" })] }), format === 'text' ? (_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-sm text-emby-text-secondary", children: "\u6BCF\u884C\u4E00\u6761\u8BB0\u5F55\u3002\u683C\u5F0F\uFF1A\u7EAFURL \u6216 \u6807\u9898|URL|\u5206\u7C7B|\u6807\u7B7E1,\u6807\u7B7E2" }), _jsx("textarea", { value: textContent, onChange: e => setTextContent(e.target.value), rows: 12, placeholder: "https://example.com/video1.m3u8\n示例视频|https://example.com/video2.m3u8|电影|动作,科幻", className: "w-full px-4 py-3 bg-emby-bg-card border border-emby-border rounded-lg text-white placeholder-emby-text-muted text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emby-green resize-y" })] })) : (_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-sm text-emby-text-secondary", children: "\u652F\u6301 CSV\u3001Excel (.xlsx)\u3001JSON \u683C\u5F0F" }), _jsxs("div", { className: "border-2 border-dashed border-emby-border rounded-lg p-8 text-center hover:border-emby-border-light transition-colors", children: [_jsx("input", { ref: fileRef, type: "file", accept: ".csv,.xlsx,.json", className: "hidden", onChange: () => {
                                            const name = fileRef.current?.files?.[0]?.name || '';
                                            setSelectedFileName(name);
                                        } }), _jsx("button", { onClick: () => fileRef.current?.click(), className: "px-4 py-2 bg-emby-bg-input text-white rounded-lg hover:bg-emby-bg-elevated text-sm", children: "\u9009\u62E9\u6587\u4EF6" }), _jsx("p", { className: "text-emby-text-muted text-xs mt-2", children: selectedFileName || '支持 .csv, .xlsx, .json' })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("a", { href: importApi.getTemplateUrl('csv'), download: true, className: "text-emby-green-light text-sm hover:underline", children: "\u4E0B\u8F7D CSV \u6A21\u677F" }), _jsx("span", { className: "text-emby-text-muted", children: "|" }), _jsx("a", { href: importApi.getTemplateUrl('json'), download: true, className: "text-emby-green-light text-sm hover:underline", children: "\u4E0B\u8F7D JSON \u6A21\u677F" })] })] })), _jsx("button", { onClick: () => previewMutation.mutate(), disabled: previewMutation.isPending || (format === 'text' && !textContent.trim()), className: "px-6 py-2 bg-emby-green text-white rounded-lg hover:bg-emby-green-dark disabled:opacity-50 text-sm", children: previewMutation.isPending ? '解析中...' : '预览' }), previewMutation.error && (_jsx("div", { className: "bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-md text-sm", children: previewMutation.error.message }))] })), step === 'preview' && preview && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex gap-4 text-sm", children: [_jsxs("span", { className: "text-emby-text-secondary", children: ["\u603B\u8BA1: ", _jsx("span", { className: "text-white", children: preview.totalCount })] }), _jsxs("span", { className: "text-green-400", children: ["\u6709\u6548: ", preview.validCount] }), _jsxs("span", { className: "text-red-400", children: ["\u65E0\u6548: ", preview.invalidCount] })] }), _jsxs("div", { className: "bg-emby-bg-card border border-emby-border-subtle rounded-lg overflow-x-auto", children: [_jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-emby-border-subtle", children: [_jsx("th", { className: "px-4 py-3 text-left text-emby-text-secondary font-medium", children: "#" }), _jsx("th", { className: "px-4 py-3 text-left text-emby-text-secondary font-medium", children: "\u6807\u9898" }), _jsx("th", { className: "px-4 py-3 text-left text-emby-text-secondary font-medium", children: "URL" }), _jsx("th", { className: "px-4 py-3 text-left text-emby-text-secondary font-medium", children: "\u5206\u7C7B" }), _jsx("th", { className: "px-4 py-3 text-left text-emby-text-secondary font-medium", children: "\u6807\u7B7E" }), _jsx("th", { className: "px-4 py-3 text-left text-emby-text-secondary font-medium", children: "\u72B6\u6001" })] }) }), _jsx("tbody", { children: preview.items.slice(0, 50).map((item, i) => {
                                            const hasError = preview.errors.some(e => e.row === i + 1);
                                            return (_jsxs("tr", { className: `border-b border-emby-border-subtle/50 ${hasError ? 'bg-red-500/5' : ''}`, children: [_jsx("td", { className: "px-4 py-2 text-emby-text-muted", children: i + 1 }), _jsx("td", { className: "px-4 py-2 text-white max-w-48 truncate", children: item.title || '-' }), _jsx("td", { className: "px-4 py-2 text-emby-text-secondary max-w-48 truncate", children: item.m3u8Url || '-' }), _jsx("td", { className: "px-4 py-2 text-emby-text-secondary", children: item.categoryName || '-' }), _jsx("td", { className: "px-4 py-2 text-emby-text-secondary", children: item.tagNames?.join(', ') || '-' }), _jsx("td", { className: "px-4 py-2", children: hasError
                                                            ? _jsx("span", { className: "text-red-400 text-xs", children: "! \u9519\u8BEF" })
                                                            : _jsx("span", { className: "text-green-400 text-xs", children: "\u6709\u6548" }) })] }, i));
                                        }) })] }), preview.items.length > 50 && _jsx("p", { className: "px-4 py-2 text-emby-text-muted text-xs", children: "\u4EC5\u663E\u793A\u524D 50 \u6761..." })] }), preview.errors.length > 0 && (_jsxs("div", { className: "bg-red-500/10 border border-red-500/20 rounded-lg p-4", children: [_jsx("p", { className: "text-red-400 text-sm font-medium mb-2", children: "\u9519\u8BEF\u8BE6\u60C5\uFF1A" }), _jsx("ul", { className: "space-y-1", children: preview.errors.slice(0, 10).map((err, i) => (_jsxs("li", { className: "text-red-300 text-xs", children: ["\u884C ", err.row, ": ", err.field, " - ", err.message] }, i))) })] })), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { onClick: () => setStep('input'), className: "px-4 py-2 bg-emby-bg-input text-emby-text-primary rounded-lg hover:bg-emby-bg-elevated text-sm", children: "\u8FD4\u56DE\u4FEE\u6539" }), _jsx("button", { onClick: () => executeMutation.mutate(), disabled: executeMutation.isPending || preview.validCount === 0, className: "px-6 py-2 bg-emby-green text-white rounded-lg hover:bg-emby-green-dark disabled:opacity-50 text-sm", children: executeMutation.isPending ? '导入中...' : `确认导入 (${preview.validCount} 条)` })] }), executeMutation.error && (_jsx("div", { className: "bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-md text-sm", children: executeMutation.error.message }))] })), step === 'result' && result && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: `p-6 rounded-lg border ${result.failedCount === 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-yellow-500/10 border-yellow-500/20'}`, children: [_jsx("h3", { className: `text-lg font-semibold ${result.failedCount === 0 ? 'text-green-400' : 'text-yellow-400'}`, children: result.failedCount === 0 ? '导入完成' : '部分导入成功' }), _jsxs("div", { className: "mt-3 flex gap-6 text-sm", children: [_jsxs("span", { className: "text-emby-text-secondary", children: ["\u603B\u8BA1: ", _jsx("span", { className: "text-white", children: result.totalCount })] }), _jsxs("span", { className: "text-green-400", children: ["\u6210\u529F: ", result.successCount] }), result.failedCount > 0 && _jsxs("span", { className: "text-red-400", children: ["\u5931\u8D25: ", result.failedCount] })] })] }), result.errors && result.errors.length > 0 && (_jsxs("div", { className: "bg-red-500/10 border border-red-500/20 rounded-lg p-4", children: [_jsx("p", { className: "text-red-400 text-sm font-medium mb-2", children: "\u5931\u8D25\u8BE6\u60C5\uFF1A" }), _jsx("ul", { className: "space-y-1", children: result.errors.slice(0, 20).map((err, i) => (_jsxs("li", { className: "text-red-300 text-xs", children: ["\u884C ", err.row, ": ", err.field, " - ", err.message] }, i))) })] })), _jsx("button", { onClick: reset, className: "px-6 py-2 bg-emby-green text-white rounded-lg hover:bg-emby-green-dark text-sm", children: "\u7EE7\u7EED\u5BFC\u5165" })] }))] }));
}
