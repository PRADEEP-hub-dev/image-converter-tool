import React from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

const ImagePreviewModal = ({ file, onClose }) => {
    const [scale, setScale] = React.useState(1);

    if (!file) return null;

    return ReactDOM.createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                <div
                    className="relative w-full max-h-[90vh] flex flex-col items-center"
                    style={{ maxWidth: '1200px' }}
                    onClick={e => e.stopPropagation()}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="glass-panel p-2 relative w-full"
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#1e1b4b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%' }}
                    >
                        <button
                            onClick={onClose}
                            className="absolute -top-4 -right-4 bg-red-500 rounded-full p-2 text-white shadow-lg hover:bg-red-600 transition-colors"
                            style={{ position: 'absolute', top: '-15px', right: '-15px', background: 'var(--error)', borderRadius: '50%', padding: '8px', border: 'none', cursor: 'pointer', color: 'white', display: 'flex' }}
                        >
                            <X size={20} />
                        </button>

                        <div className="overflow-auto rounded-lg transparent-pattern" style={{ 
                            maxHeight: '80vh', 
                            maxWidth: '100%', 
                            overflow: 'hidden', 
                            display: 'flex', 
                            justifyContent: 'center',
                            alignItems: 'center',
                            position: 'relative'
                        }}>
                            <img
                                src={file.previewUrl}
                                alt={file.altText || file.fileName}
                                style={{ 
                                    transform: `scale(${scale})`, 
                                    transition: 'transform 0.2s', 
                                    maxWidth: '100%', 
                                    maxHeight: '80vh', 
                                    width: 'auto',
                                    height: 'auto',
                                    objectFit: 'contain',
                                    display: 'block'
                                }}
                            />
                        </div>

                        <div className="flex gap-4 items-center" style={{ display: 'flex', gap: '1rem', background: 'rgba(0,0,0,0.3)', padding: '0.5rem 1rem', borderRadius: '20px' }}>
                            <button
                                onClick={() => setScale(s => Math.max(0.5, s - 0.25))}
                                className="p-2 hover:text-primary transition-colors text-white"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white' }}
                            >
                                <ZoomOut size={20} />
                            </button>
                            <span className="text-sm font-mono text-white">{Math.round(scale * 100)}%</span>
                            <button
                                onClick={() => setScale(s => Math.min(3, s + 0.25))}
                                className="p-2 hover:text-primary transition-colors text-white"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white' }}
                            >
                                <ZoomIn size={20} />
                            </button>
                        </div>

                        <div className="text-center text-white">
                            <p className="font-medium text-lg">{file.fileName}</p>
                            <p className="text-sm text-gray-400">{file.dimensions} • {(file.processedSize / 1024).toFixed(1)} KB</p>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
};

export default ImagePreviewModal;
