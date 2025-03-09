// Cache configuration
const CACHE_CONFIG = {
    keyPrefix: 'arena_cache_',
    duration: 24 * 60 * 60 * 1000, // 24 hours
    maxEntries: 50 // Maximum number of channels to cache
};

// Cache management
class BlockCache {
    static getCacheKey(channelSlug) {
        return `${CACHE_CONFIG.keyPrefix}${channelSlug}`;
    }

    static async cacheBlocks(channelSlug, blocks) {
        try {
            const cacheData = {
                timestamp: Date.now(),
                blocks: blocks
            };
            
            // Clean up old cache entries if needed
            this.cleanupCache();
            
            localStorage.setItem(this.getCacheKey(channelSlug), JSON.stringify(cacheData));
        } catch (error) {
            console.error('Error caching blocks:', error);
        }
    }

    static getCachedBlocks(channelSlug) {
        try {
            const cacheData = localStorage.getItem(this.getCacheKey(channelSlug));
            if (!cacheData) return null;
            
            const { timestamp, blocks } = JSON.parse(cacheData);
            
            // Check if cache is still valid
            if (Date.now() - timestamp > CACHE_CONFIG.duration) {
                localStorage.removeItem(this.getCacheKey(channelSlug));
                return null;
            }
            
            return blocks;
        } catch (error) {
            console.error('Error reading cache:', error);
            return null;
        }
    }

    static cleanupCache() {
        try {
            // Get all cache keys
            const cacheKeys = Object.keys(localStorage)
                .filter(key => key.startsWith(CACHE_CONFIG.keyPrefix))
                .sort((a, b) => {
                    const timeA = JSON.parse(localStorage.getItem(a)).timestamp;
                    const timeB = JSON.parse(localStorage.getItem(b)).timestamp;
                    return timeB - timeA;
                });

            // Remove oldest entries if we exceed maxEntries
            if (cacheKeys.length > CACHE_CONFIG.maxEntries) {
                cacheKeys
                    .slice(CACHE_CONFIG.maxEntries)
                    .forEach(key => localStorage.removeItem(key));
            }
        } catch (error) {
            console.error('Error cleaning cache:', error);
        }
    }

    static clearCache() {
        try {
            Object.keys(localStorage)
                .filter(key => key.startsWith(CACHE_CONFIG.keyPrefix))
                .forEach(key => localStorage.removeItem(key));
        } catch (error) {
            console.error('Error clearing cache:', error);
        }
    }
}

// Export the BlockCache class
window.BlockCache = BlockCache; 