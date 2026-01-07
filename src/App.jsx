
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import UploadArea from './components/UploadArea';
import ImageGrid from './components/ImageGrid';
import Sidebar from './components/Sidebar';
import Results from './components/Results';
import Toast from './components/Toast';
import { processImage } from './utils/imageProcessor';
import { generateAltTextBatch } from './utils/altTextGenerator';
import { Sparkles, X } from 'lucide-react';

function App() {
  const [files, setFiles] = useState([]);
  const [processedFiles, setProcessedFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [mode, setMode] = useState('upload'); // upload, settings, results
  const [operation, setOperation] = useState('convert'); // convert, compress
  const [toasts, setToasts] = useState([]);
  const [settings, setSettings] = useState({
    format: 'jpeg',
    quality: 90,
    mode: 'smart',
    customQuality: 85,
    upscaleFactor: 2,
    options: {
      removeMetadata: true,
      optimizeColors: true,
      progressiveEncoding: false,
      stripAlpha: false,
      autoGenerateAlt: true,
      autoRename: true
    },
    resize: {
      width: '',
      height: '',
      maintainAspectRatio: true
    }
  });

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const handleFilesSelected = async (newFiles) => {
    if (files.length + newFiles.length > 101) {
      showToast('Maximum 101 files allowed', 'error');
      return;
    }

    // Generate ALT text/Names if enabled
    try {
      let filesWithAltText;
      // We generate if either feature is on, to save an extra pass if user toggles one later? 
      // Actually, for now, let's just generate if autoGenerateAlt is on OR autoRename is on.
      // But generateAltTextBatch does both analysis.
      const shouldGenerate = settings.options.autoGenerateAlt || settings.options.autoRename;

      if (shouldGenerate) {
        const altResults = await generateAltTextBatch(newFiles);

        filesWithAltText = newFiles.map((file, index) => {
          const result = altResults[index] || {};
          // Only apply if the *specific* option is enabled
          const altText = settings.options.autoGenerateAlt ? (result.altText || file.name.replace(/\.[^/.]+$/, '') || 'Image') : null;
          // For suggested name, we default to slugified original if the generator failed, but only if autoRename is ON
          const suggestedName = settings.options.autoRename ? (result.suggestedName || file.name.replace(/\.[^/.]+$/, '').toLowerCase().replace(/\s+/g, '-')) : null;

          const fileWithAlt = Object.assign(file, {
            altText: altText || undefined, // undefined keeps it clean if null
            suggestedName: suggestedName || undefined
          });
          return fileWithAlt;
        });

        const count = newFiles.length;
        const s = count > 1 ? 's' : '';
        if (settings.options.autoGenerateAlt && settings.options.autoRename) showToast(`${count} image${s} analyzed (ALT + Name)`, 'success');
        else if (settings.options.autoGenerateAlt) showToast(`${count} image${s} analyzed (ALT only)`, 'success');
        else showToast(`${count} image${s} analyzed (Name only)`, 'success');

      } else {
        // No AI generation
        filesWithAltText = newFiles.map(file => {
          // We can still provide a basic alt text from filename if we want, but "autoGenerateAlt" implies "Smart/AI" generation usually.
          // The previous code set altText from filename even in 'else'. Let's keep that behavior for 'altText' as a fallback if desired,
          // OR if the user expects "No Auto Generate" to mean "Empty ALT". 
          // Previous behavior: "fallback: file.name". Let's stick to that if 'autoGenerateAlt' is FALSE? 
          // Actually, if 'autoGenerateAlt' is false, we probably shouldn't set 'altText' at all, or let it be empty so UI doesn't show "Generated: ...".
          // BUT the UI has logic "file.altText && ...". 
          // Standard practice: If disabled, maybe don't clutter the UI.
          // However, for consistency with previous steps, I will set simple filename as altText only if I want to display it.
          // Let's assume if disabled, we treat it as plain files.
          return file;
        });
        showToast(`${newFiles.length} image${newFiles.length > 1 ? 's' : ''} added`, 'success');
      }

      setFiles([...files, ...filesWithAltText]);
    } catch (error) {
      console.error('Error generating ALT text:', error);
      // Fallback
      setFiles([...files, ...newFiles]);
      showToast(`${newFiles.length} image${newFiles.length > 1 ? 's' : ''} added`, 'warning');
    }
  };

  const handleRemoveFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    showToast('Image removed', 'info');
  };

  const handleProcess = async () => {
    setProcessing(true);
    showToast(`Processing ${files.length} image${files.length > 1 ? 's' : ''}...`, 'info');
    try {
      // Special handling for generate-alt as it doesn't create new blobs necessarily
      if (operation === 'generate-alt') {
        const altResults = await generateAltTextBatch(files);
        const updatedFiles = files.map((file, index) => {
          const result = altResults[index] || {};
          file.altText = result.altText || file.altText;
          file.suggestedName = result.suggestedName || file.suggestedName;
          return file;
        });
        setFiles(updatedFiles);

        // Also prepare them for "results" so user can see them in Results view
        const results = updatedFiles.map(file => ({
          original: file,
          processed: file, // no change to blob
          fileName: file.name,
          originalSize: file.size,
          processedSize: file.size,
          dimensions: 'Same',
          previewUrl: URL.createObjectURL(file),
          originalPreviewUrl: URL.createObjectURL(file),
          altText: file.altText,
          suggestedName: file.suggestedName
        }));
        setProcessedFiles(results);
        setMode('results');
        showToast('ALT tags updated successfully!', 'success');
      } else {
        const results = await Promise.all(
          files.map(async (file, index) => {
            try {
              return await processImage(file, operation, settings);
            } catch (error) {
              console.error(`Error processing file ${file.name}:`, error);
              // Show specific error for this file
              const errorMessage = error?.message || 'Unknown error occurred';
              showToast(`Error processing ${file.name}: ${errorMessage}`, 'error');
              throw error; // Re-throw to stop processing
            }
          })
        );
        setProcessedFiles(results);
        setMode('results');
        showToast('Processing complete!', 'success');
      }
    } catch (error) {
      console.error('Processing failed:', error);
      const errorMessage = error?.message || 'An error occurred while processing images';
      showToast(errorMessage, 'error');
    } finally {
      setProcessing(false);
    }
  };


  const handleReset = () => {
    setFiles([]);
    setProcessedFiles([]);
    setMode('upload');
    showToast('Ready for new images', 'info');
  };

  return (
    <div className="container">
      {/* Toast Notifications */}
      <div className="toast-container">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
            >
              <Toast
                message={toast.message}
                type={toast.type}
                onClose={() => removeToast(toast.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="app-layout">
        <Sidebar
          operation={operation}
          setOperation={setOperation}
          settings={settings}
          setSettings={setSettings}
          onProcess={handleProcess}
          processing={processing}
          files={files}
          onReset={handleReset}
        />

        <main className="main-content custom-scrollbar">
          <AnimatePresence mode="wait">
            {mode === 'results' ? (
              <Results
                key="results"
                processedFiles={processedFiles}
                onReset={handleReset}
              />
            ) : (
              <motion.div
                key="workspace"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '10px', overflow: 'visible' }}
              >
                {files.length === 0 ? (
                  <UploadArea onFilesSelected={handleFilesSelected} />
                ) : (
                  <>
                    <div className="glass-panel-enhanced animate-scaleIn" style={{ padding: '24px', borderRadius: '24px' }}>
                      <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <h2 className="text-xl font-bold gradient-text">Selected Images ({files.length}/101)</h2>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                          {/* Cancel Button - Shown when no action is required */}
                          {!processing && (
                            <motion.button
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              onClick={handleReset}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 20px',
                                background: 'var(--error)',
                                color: 'white',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = '#dc2626';
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = 'var(--error)';
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.3)';
                              }}
                            >
                              <X size={16} />
                              Cancel
                            </motion.button>
                          )}
                          <button
                            onClick={() => document.getElementById('addMoreInput').click()}
                            className="btn-secondary"
                            style={{
                              background: 'rgba(99, 102, 241, 0.1)',
                              border: '1px solid var(--primary)',
                              color: 'var(--primary)',
                              cursor: 'pointer',
                              fontWeight: 600,
                              padding: '8px 16px',
                              borderRadius: '10px',
                              transition: 'all 0.3s ease',
                              fontSize: '0.9rem'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = 'rgba(99, 102, 241, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'none';
                            }}
                          >
                            + Add More
                          </button>
                        </div>
                        <input
                          type="file"
                          id="addMoreInput"
                          className="hidden"
                          multiple
                          accept="image/*"
                          onChange={(e) => handleFilesSelected(Array.from(e.target.files))}
                        />
                      </div>
                      <ImageGrid files={files} onRemove={handleRemoveFile} />
                    </div>

                    {/* Controls moved to Sidebar */}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>


    </div>
  );
}

export default App;
