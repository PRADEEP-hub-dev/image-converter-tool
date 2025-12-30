
import React, { useState } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const UploadArea = ({ onFilesSelected }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
        if (files.length > 0) onFilesSelected(files);
    };

    const handleFileInput = (e) => {
        const files = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
        if (files.length > 0) onFilesSelected(files);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass-panel-enhanced upload-area-enhanced ${isDragging ? 'dragover' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('fileInput').click()}
            whileHover={{ scale: 1.01 }}
        >
            <input
                type="file"
                id="fileInput"
                className="hidden"
                multiple
                accept="image/*"
                onChange={handleFileInput}
            />

            <motion.div
                className="upload-icon-wrapper icon-bounce"
                animate={isDragging ? { scale: 1.2 } : { scale: 1 }}
            >
                {isDragging ? <ImageIcon size={48} /> : <Upload size={48} />}
            </motion.div>

            <h2 className="gradient-text" style={{ marginBottom: '1rem', fontSize: '1.75rem' }}>
                {isDragging ? 'Drop your images here!' : 'Upload Images'}
            </h2>

            <p className="text-muted" style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                {isDragging ? 'Release to upload' : 'Drag & drop or click to browse'}
            </p>

            <p className="text-xs text-muted">Supports JPG, PNG, WebP, GIF, BMP (Max 101 files)</p>

            {!isDragging && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    style={{
                        marginTop: '1.5rem',
                        display: 'flex',
                        gap: '1rem',
                        justifyContent: 'center',
                        flexWrap: 'wrap'
                    }}
                >
                    {['JPG', 'PNG', 'WebP', 'GIF'].map((format, i) => (
                        <motion.div
                            key={format}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + i * 0.1 }}
                            style={{
                                padding: '4px 12px',
                                background: 'rgba(99, 102, 241, 0.2)',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: '#a5b4fc'
                            }}
                        >
                            {format}
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </motion.div>
    );
};

export default UploadArea;
