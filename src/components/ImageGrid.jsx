
import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatFileSize } from '../utils/imageProcessor';

const ImageGrid = ({ files, onRemove }) => {
    return (
        <div className="grid grid-cols-2 md-grid-cols-3 lg-grid-cols-4">
            <AnimatePresence>
                {files.map((file, index) => (
                    <motion.div
                        key={`${file.name}-${index}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="glass-panel image-card group"
                    >
                        <button
                            onClick={(e) => { e.stopPropagation(); onRemove(index); }}
                            className="remove-btn"
                        >
                            <X size={14} />
                        </button>

                        <div className="image-preview">
                            <img
                                src={URL.createObjectURL(file)}
                                alt={file.altText || file.name}
                                onLoad={(e) => URL.revokeObjectURL(e.target.src)}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: 'block',
                                    maxWidth: '100%',
                                    maxHeight: '100%'
                                }}
                            />
                        </div>

                        <div className="text-left">
                            <p className="font-medium text-sm" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={file.name}>{file.name}</p>
                            <p className="text-xs text-muted">{formatFileSize(file.size)}</p>
                            {file.altText && (
                                <p 
                                    className="text-xs" 
                                    style={{ 
                                        marginTop: '4px',
                                        color: 'var(--accent-cyan)',
                                        fontStyle: 'italic',
                                        opacity: 0.9,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        fontSize: '0.7rem'
                                    }}
                                    title={`ALT: ${file.altText}`}
                                >
                                    🏷️ {file.altText}
                                </p>
                            )}
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default ImageGrid;
