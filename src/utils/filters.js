
export const applyCartoonFilter = (ctx, width, height) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const output = ctx.createImageData(width, height);
    const outputData = output.data;

    // 1. Edge Detection (Sobel Operator)
    // Pre-calculate grayscale for edge detection
    const grayscale = new Uint8Array(width * height);
    for (let i = 0; i < data.length; i += 4) {
        // Luminance
        grayscale[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }

    const inputData = data;
    const w = width;
    const h = height;

    const edgeThreshold = 80; // Lowered from 100 to catch more edges
    const saturationBoost = 1.5; // Enhance colors

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const idx = y * w + x;
            const pixelIdx = idx * 4;

            // Edge Detection
            let isEdge = false;
            if (y > 0 && y < h - 1 && x > 0 && x < w - 1) {
                // Sobel kernels inline
                const gx =
                    -1 * grayscale[idx - w - 1] + 1 * grayscale[idx - w + 1] +
                    -2 * grayscale[idx - 1] + 2 * grayscale[idx + 1] +
                    -1 * grayscale[idx + w - 1] + 1 * grayscale[idx + w + 1];

                const gy =
                    -1 * grayscale[idx - w - 1] - 2 * grayscale[idx - w] - 1 * grayscale[idx - w + 1] +
                    1 * grayscale[idx + w - 1] + 2 * grayscale[idx + w] + 1 * grayscale[idx + w + 1];

                const magnitude = Math.abs(gx) + Math.abs(gy);
                isEdge = magnitude > edgeThreshold;
            }

            if (isEdge) {
                outputData[pixelIdx] = 0;
                outputData[pixelIdx + 1] = 0;
                outputData[pixelIdx + 2] = 0;
                outputData[pixelIdx + 3] = 255;
            } else {
                // Color Quantization & Saturation
                const levels = 8;
                let r = inputData[pixelIdx];
                let g = inputData[pixelIdx + 1];
                let b = inputData[pixelIdx + 2];

                // Boost Saturation
                const gray = 0.299 * r + 0.587 * g + 0.114 * b;
                r = clamp(gray + (r - gray) * saturationBoost);
                g = clamp(gray + (g - gray) * saturationBoost);
                b = clamp(gray + (b - gray) * saturationBoost);

                // Quantize
                outputData[pixelIdx] = Math.floor(r / (256 / levels)) * (256 / levels);
                outputData[pixelIdx + 1] = Math.floor(g / (256 / levels)) * (256 / levels);
                outputData[pixelIdx + 2] = Math.floor(b / (256 / levels)) * (256 / levels);
                outputData[pixelIdx + 3] = 255;
            }
        }
    }

    return output;
};


export const applySketchFilter = (ctx, width, height) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const output = ctx.createImageData(width, height);
    const outputData = output.data;

    // Pre-calculate grayscale
    const grayscale = new Uint8Array(width * height);
    for (let i = 0; i < data.length; i += 4) {
        grayscale[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }

    const w = width;
    const h = height;
    const edgeThreshold = 30; // Sensitive threshold for sketch

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const idx = y * w + x;
            const pixelIdx = idx * 4;

            // Default to white paper
            outputData[pixelIdx] = 255;
            outputData[pixelIdx + 1] = 255;
            outputData[pixelIdx + 2] = 255;
            outputData[pixelIdx + 3] = 255;

            if (y > 0 && y < h - 1 && x > 0 && x < w - 1) {
                const gx =
                    -1 * grayscale[idx - w - 1] + 1 * grayscale[idx - w + 1] +
                    -2 * grayscale[idx - 1] + 2 * grayscale[idx + 1] +
                    -1 * grayscale[idx + w - 1] + 1 * grayscale[idx + w + 1];

                const gy =
                    -1 * grayscale[idx - w - 1] - 2 * grayscale[idx - w] - 1 * grayscale[idx - w + 1] +
                    1 * grayscale[idx + w - 1] + 2 * grayscale[idx + w] + 1 * grayscale[idx + w + 1];

                const magnitude = Math.abs(gx) + Math.abs(gy);

                if (magnitude > edgeThreshold) {
                    // Make edges black like pencil/ink
                    // Use magnitude to determine darkness for softer strokes
                    const darkness = Math.max(0, 255 - magnitude);
                    outputData[pixelIdx] = darkness;
                    outputData[pixelIdx + 1] = darkness;
                    outputData[pixelIdx + 2] = darkness;
                }
            }
        }
    }

    return output;
};

function clamp(value) {
    return Math.max(0, Math.min(255, value));
}
