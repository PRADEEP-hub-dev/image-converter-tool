
import React, { useState } from 'react';
import { Download, ArrowLeft, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatFileSize } from '../utils/imageProcessor';

import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Eye } from 'lucide-react';
import ImagePreviewModal from './ImagePreviewModal';

const Results = ({ processedFiles, onReset }) => {
    const [previewFile, setPreviewFile] = useState(null);
    const totalOriginal = processedFiles.reduce((acc, f) => acc + f.originalSize, 0);
    const totalProcessed = processedFiles.reduce((acc, f) => acc + f.processedSize, 0);
    const savings = ((totalOriginal - totalProcessed) / totalOriginal * 100).toFixed(1);

    const downloadFile = async (file, index = 0) => {
        try {
            // Create a fresh blob with explicit type from the stored blob
            const freshBlob = new Blob([file.processed], { type: file.processed.type });

            // Create a temporary URL from the fresh blob
            const url = URL.createObjectURL(freshBlob);

            const link = document.createElement('a');
            link.style.display = 'none';
            link.href = url;
            link.download = file.fileName || `processed_image_${index}.jpg`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Cleanup
            setTimeout(() => URL.revokeObjectURL(url), 100);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Download failed. Please try again.');
        }
    };

    const downloadAll = async () => {
        const zip = new JSZip();

        processedFiles.forEach((file, index) => {
            // Ensure fileName has an extension, if not add one based on type
            let name = file.fileName || `processed_image_${index + 1}`;
            if (!name.includes('.')) {
                const ext = file.processed.type.split('/')[1] || 'jpg';
                name = `${name}.${ext}`;
            }
            zip.file(name, file.processed);
        });

        try {
            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, 'processed_images.zip');
        } catch (error) {
            console.error('Failed to zip files:', error);
            alert('Failed to create ZIP file.');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="container"
        >
            <div className="text-center" style={{ marginBottom: '2rem' }}>
                <div style={{
                    width: '64px', height: '64px', margin: '0 auto 1rem',
                    background: 'rgba(16, 185, 129, 0.2)', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--success)'
                }}>
                    <CheckCircle size={32} />
                </div>
                <h2 style={{ marginBottom: '0.5rem' }}>Processing Complete!</h2>
                <p className="text-muted">
                    Saved <span className="text-success font-bold">{savings}%</span> space
                    ({formatFileSize(totalOriginal)} → {formatFileSize(totalProcessed)})
                </p>
            </div>

            <div className="flex justify-center gap-4" style={{ marginBottom: '2rem' }}>
                <button
                    onClick={onReset}
                    className="btn btn-secondary"
                >
                    <ArrowLeft size={18} />
                    Process More
                </button>
                <button
                    onClick={downloadAll}
                    className="btn btn-success"
                >
                    <Download size={18} />
                    Download ZIP
                </button>
            </div>

            <div className="results-grid">
                {processedFiles.map((file, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="glass-panel result-card"
                    >
                        <div className="compare-view" style={{ cursor: 'pointer' }} onClick={() => setPreviewFile(file)}>
                            <div className="compare-half" style={{ borderRight: '1px solid var(--border)' }}>
                                <img
                                    src={file.originalPreviewUrl}
                                    style={{ 
                                        opacity: 0.5,
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        display: 'block',
                                        maxWidth: '100%',
                                        maxHeight: '100%'
                                    }}
                                    alt="Original"
                                />
                                <span className="text-xs" style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px', color: '#ccc' }}>Original</span>
                            </div>
                            <div className="compare-half transparent-pattern">
                                <img
                                    src={file.previewUrl}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        display: 'block',
                                        maxWidth: '100%',
                                        maxHeight: '100%'
                                    }}
                                    alt="Processed"
                                />
                                <span className="text-xs" style={{ position: 'absolute', top: '8px', right: '8px', background: 'var(--success)', padding: '2px 6px', borderRadius: '4px', color: 'white', fontWeight: 'bold' }}>New</span>
                            </div>

                            <div style={{
                                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', opacity: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.2s'
                            }} className="hover:opacity-100 group-hover:opacity-100">
                                <span style={{ background: 'rgba(0,0,0,0.7)', padding: '8px 16px', borderRadius: '20px', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.9rem' }}>
                                    <Eye size={16} /> Click to Preview
                                </span>
                            </div>
                        </div>

                        <div style={{ padding: '1rem' }}>
                            <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
                                <h3 className="font-medium text-sm" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }} title={file.fileName}>{file.fileName}</h3>
                                <span className="text-xs text-muted font-mono">{file.dimensions}</span>
                            </div>

                            <div className="flex justify-between items-center text-sm" style={{ marginBottom: '1rem' }}>
                                <span className="text-muted" style={{ textDecoration: 'line-through' }}>{formatFileSize(file.originalSize)}</span>
                                <span className="text-success font-bold">{formatFileSize(file.processedSize)}</span>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPreviewFile(file)}
                                    className="btn btn-secondary"
                                    style={{ padding: '8px', flex: '0 0 auto' }}
                                    title="Preview"
                                >
                                    <Eye size={18} />
                                </button>
                                <button
                                    onClick={() => downloadFile(file, index)}
                                    className="btn btn-secondary w-full"
                                    style={{ fontSize: '0.875rem', padding: '8px' }}
                                >
                                    Download
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {previewFile && (
                <ImagePreviewModal
                    file={previewFile}
                    onClose={() => setPreviewFile(null)}
                />
            )}
        </motion.div>
    );
};

export default Results;
