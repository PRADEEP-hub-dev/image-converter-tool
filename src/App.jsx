
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import UploadArea from './components/UploadArea';
import ImageGrid from './components/ImageGrid';
import Sidebar from './components/Sidebar';
import Results from './components/Results';
import Toast from './components/Toast';
import { processImage } from './utils/imageProcessor';
import { Sparkles } from 'lucide-react';

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
      stripAlpha: false
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

  const handleFilesSelected = (newFiles) => {
    if (files.length + newFiles.length > 101) {
      showToast('Maximum 101 files allowed', 'error');
      return;
    }
    setFiles([...files, ...newFiles]);
    showToast(`${newFiles.length} image${newFiles.length > 1 ? 's' : ''} added successfully`, 'success');
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
                style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
              >
                {files.length === 0 ? (
                  <UploadArea onFilesSelected={handleFilesSelected} />
                ) : (
                  <>
                    <div className="glass-panel-enhanced animate-scaleIn" style={{ padding: '1.5rem' }}>
                      <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                        <h2 className="text-lg font-medium">Selected Images ({files.length}/101)</h2>
                        <button
                          onClick={() => document.getElementById('addMoreInput').click()}
                          className="btn-secondary"
                          style={{
                            background: 'none',
                            border: '1px solid var(--primary)',
                            color: 'var(--primary)',
                            cursor: 'pointer',
                            fontWeight: 500,
                            padding: '6px 12px',
                            borderRadius: '8px',
                            transition: 'all 0.3s ease'
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
