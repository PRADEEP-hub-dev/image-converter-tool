
import { removeBackground } from '@imgly/background-removal';

export const processBackgroundRemoval = async (file) => {
    let objectUrl = null;
    
    try {
        // The library can accept File, Blob, or URL
        // Pass the file directly - the library handles it better
        let imageInput = file;
        
        // Ensure we have a valid File or Blob
        if (!(file instanceof File) && !(file instanceof Blob)) {
            if (typeof file === 'string') {
                // If it's a URL string, use it directly
                imageInput = file;
            } else {
                throw new Error('Invalid file type. Please provide a File or Blob object.');
            }
        }

        // Configure the background removal
        // Using minimal config to avoid fetch issues
        const config = {
            progress: (key, current, total) => {
                if (current && total) {
                    const percent = Math.round((current / total) * 100);
                    console.log(`Background removal progress: ${percent}%`);
                }
            },
            // Use the smallest model first to reduce download size
            model: 'small',
            output: {
                format: 'image/png',
                quality: 1.0
            }
        };

        console.log('Starting background removal...');
        
        // Process the background removal
        // The library will download models on first use
        const blob = await removeBackground(imageInput, config);
        
        if (!blob || !(blob instanceof Blob)) {
            throw new Error('Background removal returned invalid result');
        }

        console.log('Background removal completed successfully');
        return blob;
        
    } catch (error) {
        console.error('Background removal error details:', error);
        
        // Provide user-friendly error messages
        let errorMessage = 'Background removal failed';
        
        if (error && error.message) {
            const msg = error.message.toLowerCase();
            
            if (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('fetch')) {
                errorMessage = 'Network error: Unable to download AI model files. Please check your internet connection and try again. The first use may take longer as models need to be downloaded.';
            } else if (msg.includes('cors') || msg.includes('cross-origin')) {
                errorMessage = 'Network configuration error. Please try again or check your browser settings.';
            } else if (msg.includes('timeout')) {
                errorMessage = 'Request timed out. Please try again with a smaller image or check your internet connection.';
            } else {
                errorMessage = `Background removal failed: ${error.message}`;
            }
        } else if (error && error.toString) {
            errorMessage = `Background removal failed: ${error.toString()}`;
        }
        
        throw new Error(errorMessage);
    } finally {
        // Clean up object URL if we created one
        if (objectUrl) {
            try {
                URL.revokeObjectURL(objectUrl);
            } catch (e) {
                // Ignore cleanup errors
            }
        }
    }
};
