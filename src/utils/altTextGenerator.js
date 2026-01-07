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
            if (pixelAnalysis.colorName) visualContext.push(`${pixelAnalysis.colorName} toned`);

            const visualString = visualContext.length > 0 ? visualContext.join(' ') : '';

            // Map categories to descriptive subjects
            const categorySubjects = {
                portrait: 'portrait showing a person',
                landscape: 'scenic landscape view',
                product: 'product display',
                logo: 'company brand logo',
                screenshot: 'digital interface screenshot',
                food: 'prepared food dish',
                building: 'architectural building',
                animal: 'animal wildlife',
                vehicle: 'transportation vehicle',
                document: 'written document page',
                artwork: 'creative artwork design',
                photo: 'photograph'
            };

            const subject = categorySubjects[fileAnalysis.category] || 'image';
            const contextName = fileAnalysis.cleanName.length > 3 ? fileAnalysis.cleanName : '';

            // SEO Rule: Combine context (file name) with visual attributes
            if (contextName && fileAnalysis.category) {
                // Example: 'Vibrant landscape view of sunset beach'
                altText = `${visualString} ${subject} of ${contextName}`;
            } else if (contextName) {
                // Example: 'Blue toned image of winter mountains'
                altText = `${visualString} image of ${contextName}`;
            } else if (fileAnalysis.category) {
                // Example: 'Dark portrait showing a person'
                altText = `${visualString} ${subject}`;
            } else {
                // Fallback
                altText = visualString ? `${visualString} abstract image` : 'Descriptive image content';
            }

            // Clean up: Remove redundant "image of image" or double "photo"
            altText = altText
                .replace(/\bimage of image\b/gi, 'image')
                .replace(/\bphoto of photo\b/gi, 'photograph')
                .replace(/\s+/g, ' ')
                .trim();

            // Ensure first letter is capitalized and no trailing period (standard for ALT)
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

