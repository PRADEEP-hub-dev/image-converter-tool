import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Settings2, Image as ImageIcon, Wand2, Zap, Palette, Layers, Box, Eraser, Maximize2 } from 'lucide-react';

const Sidebar = ({ operation, setOperation, settings, setSettings, onProcess, onGenerate, processing, files, onReset }) => {
    const formats = ['jpeg', 'png', 'webp', 'gif', 'bmp'];
    const modes = [
        { id: 'smart', label: 'Smart', desc: 'AI Balance' },
        { id: 'aggressive', label: 'High', desc: 'Max compression' },
        { id: 'balanced', label: 'Medium', desc: 'Standard' },
        { id: 'custom', label: 'Custom', desc: 'Manual' }
    ];

    const sidebarVariants = {
        hidden: { x: -280, opacity: 0 },
        visible: {
            x: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 20
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 }
    };

    return (
        <motion.div
            className="sidebar glass-panel-enhanced"
            initial="hidden"
            animate="visible"
            variants={sidebarVariants}
        >
            {/* Header */}
            <div className="sidebar-header">
                <div className="logo-container">
                    <motion.div
                        className="logo-icon"
                        whileHover={{ scale: 1.1, rotate: 10 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Sparkles className="text-white" size={24} />
                    </motion.div>
                    <h1 className="logo-text">PixelPerfect</h1>
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                <button
                    onClick={() => setOperation('convert')}
                    className={`nav-item ${operation === 'convert' ? 'active' : ''}`}
                >
                    <Zap size={20} />
                    <span>Convert</span>
                    {operation === 'convert' && <motion.div layoutId="activeTab" className="active-indicator" />}
                </button>
                <button
                    onClick={() => setOperation('remove-bg')}
                    className={`nav-item ${operation === 'remove-bg' ? 'active' : ''}`}
                >
                    <Eraser size={20} />
                    <span>Remove BG</span>
                    {operation === 'remove-bg' && <motion.div layoutId="activeTab" className="active-indicator" />}
                </button>
                <button
                    onClick={() => setOperation('compress')}
                    className={`nav-item ${operation === 'compress' ? 'active' : ''}`}
                >
                    <Layers size={20} />
                    <span>Compress</span>
                    {operation === 'compress' && <motion.div layoutId="activeTab" className="active-indicator" />}
                </button>
                <button
                    onClick={() => setOperation('upscale')}
                    className={`nav-item ${operation === 'upscale' ? 'active' : ''}`}
                >
                    <Maximize2 size={20} />
                    <span>Upscale</span>
                    {operation === 'upscale' && <motion.div layoutId="activeTab" className="active-indicator" />}
                </button>

            </nav>

            {/* Settings Content */}
            <div className="sidebar-content custom-scrollbar">
                <h3 className="section-title">
                    <Settings2 size={16} />
                    <span>Configuration</span>
                </h3>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={operation}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {operation === 'convert' && (
                            <div className="settings-group">
                                <label className="setting-label">Target Format</label>
                                <div className="format-grid">
                                    {formats.map(fmt => (
                                        <button
                                            key={fmt}
                                            onClick={() => setSettings({ ...settings, format: fmt })}
                                            className={`option-btn ${settings.format === fmt ? 'active' : ''}`}
                                        >
                                            {fmt}
                                        </button>
                                    ))}
                                </div>
                                {settings.format !== 'png' && (
                                    <div className="control-group">
                                        <div className="flex justify-between mb-2">
                                            <label className="text-xs text-muted">Quality</label>
                                            <span className="text-xs font-mono text-accent">{settings.quality}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="10"
                                            max="100"
                                            value={settings.quality}
                                            onChange={(e) => setSettings({ ...settings, quality: parseInt(e.target.value) })}
                                            className="range-input"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {operation === 'compress' && (
                            <div className="settings-group">
                                <label className="setting-label">Mode</label>
                                <div className="mode-stack">
                                    {modes.map(mode => (
                                        <button
                                            key={mode.id}
                                            onClick={() => setSettings({ ...settings, mode: mode.id })}
                                            className={`mode-item ${settings.mode === mode.id ? 'active' : ''}`}
                                        >
                                            <div className="mode-info">
                                                <span className="mode-label">{mode.label}</span>
                                                <span className="mode-desc">{mode.desc}</span>
                                            </div>
                                            {settings.mode === mode.id && <div className="mode-check" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}





                        {operation === 'remove-bg' && (
                            <div className="settings-group">
                                <label className="setting-label">AI Removal</label>
                                <div 
                                    className="glass-panel" 
                                    style={{ 
                                        background: 'rgba(255,255,255,0.05)',
                                        padding: '1.25rem',
                                        marginTop: '0.75rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.75rem'
                                    }}
                                >
                                    <p 
                                        className="text-sm text-muted"
                                        style={{
                                            margin: 0,
                                            lineHeight: '1.5',
                                            padding: 0
                                        }}
                                    >
                                        Automatically removes image backgrounds using AI. This process runs entirely in your browser.
                                    </p>
                                    <div 
                                        className="flex items-center gap-2 text-xs text-accent"
                                        style={{
                                            marginTop: '0.25rem',
                                            padding: '0.5rem 0.75rem',
                                            background: 'rgba(99, 102, 241, 0.1)',
                                            borderRadius: '6px',
                                            border: '1px solid rgba(99, 102, 241, 0.2)'
                                        }}
                                    >
                                        <Sparkles size={14} />
                                        <span style={{ fontWeight: 600 }}>High Precision Model</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {operation === 'upscale' && (
                            <div className="settings-group">
                                <label className="setting-label">Upscale Resolution</label>
                                <div className="format-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                                    <button
                                        onClick={() => setSettings({ ...settings, upscaleFactor: 2 })}
                                        className={`option-btn ${settings.upscaleFactor === 2 ? 'active' : ''}`}
                                        style={{ padding: '12px', fontSize: '1rem', fontWeight: 600 }}
                                    >
                                        2× Resolution
                                    </button>
                                    <button
                                        onClick={() => setSettings({ ...settings, upscaleFactor: 4 })}
                                        className={`option-btn ${settings.upscaleFactor === 4 ? 'active' : ''}`}
                                        style={{ padding: '12px', fontSize: '1rem', fontWeight: 600 }}
                                    >
                                        4× Resolution
                                    </button>
                                </div>
                                <div 
                                    className="glass-panel" 
                                    style={{ 
                                        background: 'rgba(255,255,255,0.05)',
                                        padding: '1rem',
                                        marginTop: '0.75rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <p 
                                        className="text-sm text-muted"
                                        style={{
                                            margin: 0,
                                            lineHeight: '1.5',
                                            padding: 0
                                        }}
                                    >
                                        Increase image resolution by {settings.upscaleFactor || 2}×. Original dimensions will be multiplied by the selected factor.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Common Resize Controls */}
                        <div className="divider" />
                        <div className="settings-group">
                            <div className="flex justify-between items-center mb-3">
                                <label className="setting-label mb-0">Resize</label>
                                <label className="toggle-label">
                                    <input
                                        type="checkbox"
                                        checked={settings.resize?.maintainAspectRatio ?? true}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            resize: { ...settings.resize, maintainAspectRatio: e.target.checked }
                                        })}
                                    />
                                    <span className="text-xs text-muted ml-2">Lock Ratio</span>
                                </label>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="input-group">
                                    <input
                                        type="number"
                                        placeholder="W"
                                        value={settings.resize?.width || ''}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            resize: { ...settings.resize, width: e.target.value }
                                        })}
                                        className="s-input"
                                    />
                                    <span className="input-unit">px</span>
                                </div>
                                <div className="input-group">
                                    <input
                                        type="number"
                                        placeholder="H"
                                        value={settings.resize?.height || ''}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            resize: { ...settings.resize, height: e.target.value }
                                        })}
                                        className="s-input"
                                    />
                                    <span className="input-unit">px</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Footer Action */}
            <div className="sidebar-footer">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onProcess}
                    disabled={processing || (files.length === 0)}
                    className={`action-btn ${operation} btn-shine`}
                >
                    {processing ? (
                        <span className="flex items-center gap-2">
                            <motion.span
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            >⚡</motion.span>
                            Processing...
                        </span>
                    ) : (
                        <span>
                            {operation === 'convert' ? 'Convert Images' :
                                operation === 'compress' ? 'Compress Images' :
                                operation === 'upscale' ? 'Upscale Images' :
                                    'Remove Background'}
                        </span>
                    )}
                </motion.button>

                {files.length > 0 && (
                    <button onClick={onReset} className="reset-link">
                        Clear Selection
                    </button>
                )}
            </div>
        </motion.div>
    );
};

export default Sidebar;
