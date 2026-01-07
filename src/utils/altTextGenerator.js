/**
 * Generates appropriate ALT text for images based on filename and image analysis
 */

/**
 * Analyzes filename and generates descriptive ALT text
 */
const analyzeFilename = (filename) => {
    if (!filename) return 'Image';

    // Remove extension
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');

    // Common keywords in filenames
    const keywords = {
        portrait: ['portrait', 'headshot', 'profile', 'person', 'people', 'face', 'selfie', 'man', 'woman', 'child', 'girl', 'boy'],
        landscape: ['landscape', 'scenery', 'nature', 'outdoor', 'view', 'mountain', 'beach', 'sunset', 'sunrise', 'forest', 'ocean', 'sky', 'clouds'],
        product: ['product', 'item', 'goods', 'merchandise', 'catalog', 'ecommerce', 'package', 'box'],
        logo: ['logo', 'brand', 'icon', 'symbol', 'emblem', 'badge', 'banner'],
        screenshot: ['screenshot', 'screen', 'capture', 'snapshot', 'desktop', 'ui', 'interface'],
        photo: ['photo', 'pic', 'picture', 'img', 'image', 'photograph', 'camera'],
        food: ['food', 'meal', 'dish', 'recipe', 'cooking', 'restaurant', 'cuisine', 'breakfast', 'lunch', 'dinner', 'cake', 'fruit'],
        building: ['building', 'house', 'architecture', 'structure', 'construction', 'home', 'office', 'city', 'street'],
        animal: ['dog', 'cat', 'pet', 'animal', 'bird', 'wildlife', 'puppy', 'kitten', 'lion', 'tiger', 'horse'],
        vehicle: ['car', 'vehicle', 'truck', 'bike', 'motorcycle', 'automobile', 'plane', 'boat', 'ship', 'bus'],
        document: ['document', 'doc', 'file', 'page', 'paper', 'form', 'contract', 'invoice'],
        artwork: ['art', 'painting', 'drawing', 'illustration', 'design', 'graphic', 'poster', 'sketch'],
    };

    const lowerName = nameWithoutExt.toLowerCase();
    let category = null;

    // Find matching category
    for (const [cat, terms] of Object.entries(keywords)) {
        if (terms.some(term => lowerName.includes(term))) {
            category = cat;
            break;
        }
    }

    // Clean filename - replace underscores/hyphens with spaces
    const cleanName = nameWithoutExt
        .replace(/[-_]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    return { cleanName, category };
};

/**
 * Analyzes image pixels to provide descriptive details
 */
const analyzeImagePixels = (ctx, width, height) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    let r = 0, g = 0, b = 0, brightness = 0;

    // Sample a few pixels for performance
    const step = Math.max(1, Math.floor((width * height) / 1000));
    let count = 0;

    for (let i = 0; i < data.length; i += 4 * step) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        brightness += (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        count++;
    }

    const avgR = r / count;
    const avgG = g / count;
    const avgB = b / count;
    const avgBrightness = brightness / count;

    // Determine dominant tone
    let tone = '';
    if (avgBrightness > 200) tone = 'Very bright';
    else if (avgBrightness > 150) tone = 'Bright';
    else if (avgBrightness < 50) tone = 'Dark';
    else if (avgBrightness < 100) tone = 'Dimly lit';

    // Determine dominant color
    let colorName = '';
    const max = Math.max(avgR, avgG, avgB);
    if (max - Math.min(avgR, avgG, avgB) < 15) {
        colorName = avgBrightness > 200 ? 'white' : (avgBrightness < 50 ? 'black' : 'gray');
    } else if (max === avgR) {
        colorName = avgG > avgR * 0.8 ? 'orange/yellowish' : 'reddish';
    } else if (max === avgG) {
        colorName = 'greenish';
    } else {
        colorName = 'bluish';
    }

    return { tone, colorName, avgBrightness, isVibrant: (max - Math.min(avgR, avgG, avgB)) > 50 };
};

/**
 * Verifies if the image is valid and high quality
 */
export const verifyImage = async (file) => {
    return new Promise((resolve) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            const width = img.width;
            const height = img.height;
            const size = file.size;

            let status = 'valid';
            let issues = [];

            if (width < 100 || height < 100) {
                issues.push('Low resolution');
            }
            if (size < 1024) { // less than 1KB
                issues.push('Potentially corrupted or empty');
            }

            if (issues.length > 0) status = 'warning';

            URL.revokeObjectURL(objectUrl);
            resolve({ status, issues, width, height });
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            resolve({ status: 'invalid', issues: ['Could not load image file'] });
        };

        img.src = objectUrl;
    });
};

/**
 * Generates ALT text for an image file
 */
export const generateAltText = async (file) => {
    return new Promise((resolve) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Use a small canvas for analysis
            const analysisWidth = 100;
            const analysisHeight = Math.round((img.height / img.width) * 100);
            canvas.width = analysisWidth;
            canvas.height = analysisHeight;
            ctx.drawImage(img, 0, 0, analysisWidth, analysisHeight);

            const pixelAnalysis = analyzeImagePixels(ctx, analysisWidth, analysisHeight);
            const fileAnalysis = analyzeFilename(file.name);

            let altText = '';

            // Build SEO-friendly description
            const visualContext = [];
            if (pixelAnalysis.isVibrant) visualContext.push('vibrant');
            if (pixelAnalysis.tone && !pixelAnalysis.isVibrant) visualContext.push(pixelAnalysis.tone.toLowerCase());
            if (pixelAnalysis.colorName) visualContext.push(pixelAnalysis.colorName); // Removed "toned"

            const visualString = visualContext.length > 0 ? visualContext.join(' ') : '';

            // Map categories to concise subjects (40% shorter)
            const categorySubjects = {
                portrait: 'portrait',
                landscape: 'landscape',
                product: 'product',
                logo: 'logo',
                screenshot: 'screenshot',
                food: 'food',
                building: 'building',
                animal: 'animal',
                vehicle: 'vehicle',
                document: 'document',
                artwork: 'artwork',
                photo: 'photo'
            };

            const subject = categorySubjects[fileAnalysis.category] || 'image';
            const contextName = fileAnalysis.cleanName.length > 3 ? fileAnalysis.cleanName : '';

            // SEO Rule: Ultra-concise (Max 3-4 words)
            // Strategy: Visual Adjective + (Specific Name OR Category)

            let parts = [];

            // 1. Add visual context (max 1 word)
            if (visualString) {
                // Take only the first word of visual string (e.g. 'vibrant' from 'vibrant red')
                parts.push(visualString.split(' ')[0]);
            }

            // 2. Add subject (prioritize context name if available, else category)
            if (contextName) {
                // If we have a specific name, use it.
                // Don't append category subject at the back (avoids "sunset beach landscape")
                parts.push(contextName);
            } else {
                parts.push(subject);
            }

            // Join and clean
            altText = parts.join(' ').trim();

            // Fallback if empty
            if (!altText || altText.length < 2) {
                altText = subject || 'Image';
            }

            // Enforce hard word limit (max 4 words)
            const words = altText.split(/\s+/);
            if (words.length > 4) {
                altText = words.slice(0, 4).join(' ');
            }

            // Ensure first letter is capitalized
            altText = altText.charAt(0).toUpperCase() + altText.slice(1);

            // Limit to 125 chars (SEO Best Practice)
            if (altText.length > 125) {
                altText = altText.substring(0, 122) + '...';
            }

            // Generate Short SEO Name (suggested filename)
            let shortName = '';
            if (contextName) {
                // If we have a meaningful filename, use it but clean it up
                shortName = contextName;
                // Add category if not present
                if (categorySubjects[fileAnalysis.category] && !shortName.toLowerCase().includes(fileAnalysis.category)) {
                    // e.g. "sunset-beach" + "landscape" -> "sunset-beach-landscape"
                    const simpleCat = fileAnalysis.category; // e.g. 'landscape'
                    shortName = `${shortName} ${simpleCat}`;
                }
            } else {
                // No useful filename, use subject + visual
                shortName = `${visualString} ${fileAnalysis.category || 'image'}`.trim();
            }

            // Slugify for filename usage
            const suggestedName = shortName
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '') // Remove non-word chars except spaces and hyphens
                .replace(/\s+/g, '-')     // Replace spaces with hyphens
                .replace(/-+/g, '-');     // distinct hyphens

            URL.revokeObjectURL(objectUrl);
            resolve({ altText, suggestedName });
        };

        img.onerror = () => {
            const fileAnalysis = analyzeFilename(file.name);
            const fallbackAlt = fileAnalysis.cleanName || file.name.replace(/\.[^/.]+$/, '') || 'Image';
            // Simple slugify for fallback
            const fallbackName = fallbackAlt.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
            URL.revokeObjectURL(objectUrl);
            resolve({ altText: fallbackAlt, suggestedName: fallbackName });
        };

        img.src = objectUrl;
    });
};

/**
 * Batch generate ALT text for multiple files
 */
export const generateAltTextBatch = async (files) => {
    const altTextPromises = files.map(file => generateAltText(file));
    return Promise.all(altTextPromises);
};

