


import { processBackgroundRemoval } from './bgRemover';

export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getCompressionSettings = (mode, customQuality, options = {}, resize = {}) => {
    const { removeMetadata, optimizeColors, progressiveEncoding, stripAlpha } = options;
    let quality = 0.85;

    switch (mode) {
        case 'smart':
            quality = 0.75;
            break;
        case 'aggressive':
            quality = 0.60;
            break;
        case 'balanced':
            quality = 0.80;
            break;
        case 'custom':
            quality = customQuality / 100;
            break;
        default:
            quality = 0.85;
    }

    // Adjust quality based on options (heuristics from original code)
    if (removeMetadata) quality *= 0.95;
    if (optimizeColors) quality *= 0.90;
    if (progressiveEncoding) quality *= 0.98;
    if (stripAlpha) quality *= 0.85;

    return Math.max(0.1, quality);
};

export const processImage = async (file, operation, settings) => {
    let sourceBlob = file;

    if (operation === 'remove-bg') {
        try {
            sourceBlob = await processBackgroundRemoval(file);
            if (!sourceBlob || !(sourceBlob instanceof Blob)) {
                throw new Error('Background removal did not return a valid image');
            }
        } catch (error) {
            console.error('Background removal error:', error);
            // Re-throw with more context if it's already an Error with message
            if (error instanceof Error) {
                throw error;
            } else {
                throw new Error(`Background removal failed: ${error?.toString() || 'Unknown error'}`);
            }
        }
    }

    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            let targetWidth = img.width;
            let targetHeight = img.height;
            let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;

            // Handle Upscaling
            if (operation === 'upscale') {
                const upscaleFactor = settings.upscaleFactor || 2;
                targetWidth = img.width * upscaleFactor;
                targetHeight = img.height * upscaleFactor;
                // For upscaling, we use the full image
                sWidth = img.width;
                sHeight = img.height;
            }
            // Handle Resizing (only if not upscaling)
            else if (settings.resize) {
                const { width, height, maintainAspectRatio, fit = 'cover' } = settings.resize;
                const w = parseInt(width);
                const h = parseInt(height);

                if (w && h) {
                    targetWidth = w;
                    targetHeight = h;

                    if (fit === 'cover') {
                        const aspect = img.width / img.height;
                        const targetAspect = w / h;

                        if (aspect > targetAspect) {
                            // Image is wider than target
                            sWidth = img.height * targetAspect;
                            sx = (img.width - sWidth) / 2;
                        } else {
                            // Image is taller than target
                            sHeight = img.width / targetAspect;
                            sy = (img.height - sHeight) / 2;
                        }
                    } else if (fit === 'contain') {
                        const aspect = img.width / img.height;
                        const targetAspect = w / h;

                        if (aspect > targetAspect) {
                            // Fit to width
                            targetHeight = w / aspect;
                        } else {
                            // Fit to height
                            targetWidth = h * aspect;
                        }
                        // For contain, we draw the whole image into the new smaller bounds
                        sWidth = img.width;
                        sHeight = img.height;
                    }
                    // 'fill' is default behavior (stretch), so no extra logic needed for sWidth/sHeight
                } else if (w) {
                    targetWidth = w;
                    if (maintainAspectRatio) {
                        targetHeight = Math.round(img.height * (w / img.width));
                    }
                } else if (h) {
                    targetHeight = h;
                    if (maintainAspectRatio) {
                        targetWidth = Math.round(img.width * (h / img.height));
                    }
                }
            }

            canvas.width = targetWidth;
            canvas.height = targetHeight;
            
            // Use highest quality smoothing for upscaling
            if (operation === 'upscale') {
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                // Use better interpolation for upscaling
                ctx.imageSmoothingEnabled = true;
            } else {
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
            }

            // Draw with source rectangle (cropping) if needed
            ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);

            let mimeType;
            let quality;
            let extension;
            let fileNamePrefix;

            if (operation === 'convert' || operation === 'remove-bg') {
                mimeType = (operation === 'remove-bg') ? 'image/png' : `image/${settings.format}`;
                quality = (settings.format === 'png' || operation === 'remove-bg') ? 1 : (settings.quality || 90) / 100;
                extension = (operation === 'remove-bg') ? 'png' : (settings.format === 'jpeg' ? 'jpg' : settings.format);
                fileNamePrefix = (operation === 'remove-bg') ? 'bg_removed' : 'converted';
            } else if (operation === 'upscale') {
                // Upscale - preserve original format, use high quality
                let fileType = 'png'; // Default to PNG for upscaled images to preserve quality
                if (file.type && file.type.includes('/')) {
                    const originalType = file.type.split('/')[1];
                    // Keep original format if it's a good format for upscaling
                    if (['png', 'webp', 'jpeg', 'jpg'].includes(originalType.toLowerCase())) {
                        fileType = originalType === 'jpeg' ? 'jpg' : originalType;
                    }
                }
                mimeType = `image/${fileType === 'jpg' ? 'jpeg' : fileType}`;
                quality = fileType === 'png' ? 1.0 : 0.95; // High quality for upscaled images
                extension = fileType;
                fileNamePrefix = `upscaled_${settings.upscaleFactor || 2}x`;
            } else {
                // Compress
                let fileType = 'jpeg';
                if (file.type && file.type.includes('/')) {
                    fileType = file.type.split('/')[1];
                }

                mimeType = `image/${fileType}`;
                quality = getCompressionSettings(settings.mode, settings.customQuality, settings.options, settings.resize);
                extension = fileType === 'jpeg' ? 'jpg' : fileType;
                fileNamePrefix = 'compressed';
            }

            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error('Canvas to Blob failed'));
                        return;
                    }

                    let baseName = file.name;
                    if (baseName && baseName.lastIndexOf('.') !== -1) {
                        baseName = baseName.substring(0, baseName.lastIndexOf('.'));
                    }
                    if (!baseName) baseName = 'image';

                    // Sanitize filename
                    baseName = baseName.replace(/[^a-zA-Z0-9._-]/g, '_');

                    const fileName = `${baseName}_${fileNamePrefix}.${extension}`;

                    resolve({
                        original: file,
                        processed: blob,
                        fileName: fileName,
                        originalSize: file.size,
                        processedSize: blob.size,
                        dimensions: `${targetWidth}×${targetHeight}`,
                        previewUrl: URL.createObjectURL(blob),
                        originalPreviewUrl: URL.createObjectURL(file),
                        altText: file.altText || file.name.replace(/\.[^/.]+$/, '') || 'Image'
                    });
                },
                mimeType,
                quality
            );
        };

        img.onerror = (err) => reject(err);

        const reader = new FileReader();
        reader.onload = (e) => {
            img.src = e.target.result;
        };
        reader.readAsDataURL(sourceBlob);
    });
};
