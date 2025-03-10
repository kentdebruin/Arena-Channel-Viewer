/**
 * Extract YouTube video ID from various YouTube URL formats
 * @param {string} url - The YouTube URL
 * @returns {string|null} - The video ID if found, null otherwise
 */
export function getYouTubeVideoId(url) {
    if (!url) return null;
    
    try {
        // Handle various YouTube URL formats
        const patterns = [
            // youtu.be URLs
            /^https?:\/\/youtu\.be\/([^?#]+)/,
            // youtube.com/watch URLs
            /^https?:\/\/(?:www\.)?youtube\.com\/watch\?(?:.*&)?v=([^&#]+)/,
            // youtube.com/embed URLs
            /^https?:\/\/(?:www\.)?youtube\.com\/embed\/([^?#]+)/,
            // Short URLs
            /^https?:\/\/(?:www\.)?youtube\.com\/shorts\/([^?#]+)/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                return match[1];
            }
        }

        return null;
    } catch (error) {
        console.error('Error extracting YouTube video ID:', error);
        return null;
    }
} 