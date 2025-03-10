// State management
const state = {
    isLoading: false,
    // Get channel slugs from the configuration
    featuredChannels: CHANNELS_CONFIG.map(channel => channel.slug),
    // Kent's username for API calls
    username: 'kent'
};

// DOM Elements
const elements = {
    loading: document.getElementById('loading'),
    error: document.getElementById('error'),
    channelsGrid: document.getElementById('channelsGrid'),
    channelInput: document.getElementById('channelInput'),
    searchButton: document.getElementById('searchButton'),
    fixedHeader: document.querySelector('.fixed-header'),
    fixedChannelInput: document.getElementById('fixedChannelInput'),
    fixedSearchButton: document.getElementById('fixedSearchButton'),
    main: document.querySelector('main')
};

// API endpoints
const API = {
    baseUrl: 'https://api.are.na/v2',
    channel: (slug) => `${API.baseUrl}/channels/${slug}?sort=connected_at&direction=desc&per=25`,
    userChannels: (username) => `${API.baseUrl}/users/${username}/channels`,
    maxRetries: 3,
    retryDelay: 1000 // 1 second delay between retries
};

// Event Listeners
elements.searchButton.addEventListener('click', handleSearch);
elements.channelInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

// Add fixed header event listeners
elements.fixedSearchButton.addEventListener('click', handleSearch);
elements.fixedChannelInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

// Handle scroll events for fixed header
let lastScrollY = 0;
let ticking = false;

window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            const currentScrollY = window.scrollY;
            
            // Show/hide fixed header based on scroll direction and position
            if (currentScrollY > 100) {
                if (currentScrollY > lastScrollY) {
                    // Scrolling down
                    elements.fixedHeader.classList.remove('visible');
                    elements.main.classList.remove('fixed-header-visible');
                } else {
                    // Scrolling up
                    elements.fixedHeader.classList.add('visible');
                    elements.main.classList.add('fixed-header-visible');
                }
            } else {
                elements.fixedHeader.classList.remove('visible');
                elements.main.classList.remove('fixed-header-visible');
            }
            
            lastScrollY = currentScrollY;
            ticking = false;
        });
        
        ticking = true;
    }
});

// Sync input fields
elements.channelInput.addEventListener('input', (e) => {
    elements.fixedChannelInput.value = e.target.value;
});

elements.fixedChannelInput.addEventListener('input', (e) => {
    elements.channelInput.value = e.target.value;
});

// Load channels on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadFeaturedChannels();
    } catch (error) {
        hideLoading();
        showError('Failed to load channels. Please try again later.');
    }
});

// Enhanced fetch with retry mechanism
async function fetchWithRetry(url, retries = API.maxRetries) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            
            // Log rate limit information
            const remaining = response.headers.get('X-RateLimit-Remaining');
            const limit = response.headers.get('X-RateLimit-Limit');
            if (remaining && limit) {
                console.log(`Are.na API Rate Limit: ${remaining}/${limit} remaining`);
            }

            if (response.status === 429) { // Rate limited
                const retryAfter = response.headers.get('Retry-After') || API.retryDelay;
                console.warn(`Rate limited. Waiting ${retryAfter}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, retryAfter));
                continue;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`Successfully fetched data from Are.na API: ${url}`);
            return data;
        } catch (error) {
            const isLastAttempt = i === retries - 1;
            if (isLastAttempt) {
                console.error(`Failed to fetch after ${retries} attempts:`, error);
                throw error;
            } else {
                console.warn(`Attempt ${i + 1} failed, retrying in ${API.retryDelay}ms...`);
                await new Promise(resolve => setTimeout(resolve, API.retryDelay));
            }
        }
    }
}

// Initialize Intersection Observer for lazy loading
const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
                img.src = img.dataset.src;
                delete img.dataset.src;
            }
            observer.unobserve(img);
        }
    });
}, {
    rootMargin: '50px 0px', // Start loading images 50px before they enter the viewport
    threshold: 0.1
});

// Load featured channels
async function loadFeaturedChannels() {
    showLoading();
    elements.channelsGrid.innerHTML = '';
    
    // Show loading blocks only for the number of channels we're loading
    const numChannels = state.featuredChannels.length;
    const loadingBlocks = Array(numChannels).fill(null).map(() => {
        const container = document.createElement('div');
        container.className = 'channel-card-wrapper';
        const card = document.createElement('div');
        card.className = 'channel-card loading';
        container.appendChild(card);
        return container;
    });
    
    loadingBlocks.forEach(block => elements.channelsGrid.appendChild(block));
    
    try {
        // Load channel data for each featured channel
        const channelPromises = state.featuredChannels.map(slug => 
            fetchWithRetry(API.channel(slug))
                .then(data => {
                    console.log(`Channel ${slug} loaded:`, {
                        totalBlocks: data.length,
                        imageBlocks: data.contents?.filter(block => block.class === 'Image').length || 0,
                        newestBlock: data.contents?.[0]?.connected_at
                    });
                    return data;
                })
                .catch(error => {
                    console.error(`Failed to load channel ${slug}:`, error);
                    return null;
                })
        );
        
        const channels = await Promise.all(channelPromises);
        const validChannels = channels.filter(channel => channel !== null);
        
        // Clear the loading blocks before rendering actual content
        elements.channelsGrid.innerHTML = '';
        
        if (validChannels.length === 0) {
            console.warn("No channels could be loaded from Are.na API, falling back to configuration data");
            showError('Using offline channel data - some images may not be up to date');
            
            // If no channels could be loaded from the API, use configuration data
            CHANNELS_CONFIG.forEach(channel => {
                console.log(`Using sample data for channel: ${channel.slug}`);
                // Create a mock channel object with contents for images
                const mockChannel = {
                    ...channel,
                    user: { full_name: USER_CONFIG.full_name },
                    contents: []
                };
                
                // Add additional images first (they will be shown in the slideshow)
                if (channel.sampleImages && channel.sampleImages.length > 0) {
                    channel.sampleImages.forEach((url, index) => {
                        mockChannel.contents.push({
                            class: 'Image',
                            image: {
                                display: {
                                    url: url
                                }
                            },
                            id: `sample-${index}`,
                            connected_at: new Date(Date.now() - (index + 1) * 86400000).toISOString() // Mock dates, newer to older
                        });
                    });
                }
                
                // Add main image last (it will be the newest)
                if (channel.sampleImage) {
                    mockChannel.contents.push({
                        class: 'Image',
                        image: {
                            display: {
                                url: channel.sampleImage
                            }
                        },
                        id: 'sample-main',
                        connected_at: new Date().toISOString() // Most recent date
                    });
                }
                
                renderChannelCard(mockChannel);
            });
        } else {
            console.log(`Successfully loaded ${validChannels.length} channels from Are.na API`);
            hideError(); // Hide any previous error messages
            // Render channel cards from API data
            validChannels.forEach(channel => {
                console.log(`Rendering channel ${channel.slug} with ${channel.contents?.length || 0} blocks`);
                renderChannelCard(channel);
            });
        }
        
        hideLoading();
        
        // Preload images for smoother animations
        preloadSlideshowImages();
        
        // Set up proper hover effects
        setupHoverEffects();
        
    } catch (error) {
        console.error('Error loading featured channels:', error);
        hideLoading();
        showError('Unable to load live channel data - showing offline content');
        
        // Clear the loading blocks before showing offline content
        elements.channelsGrid.innerHTML = '';
        
        // Use configuration data if API calls fail
        console.warn("Using configuration channel data due to error");
        CHANNELS_CONFIG.forEach(channel => {
            console.log(`Using sample data for channel: ${channel.slug}`);
            // Create a mock channel object with contents for images
            const mockChannel = {
                ...channel,
                user: { full_name: USER_CONFIG.full_name },
                contents: []
            };
            
            // Add additional images first (they will be shown in the slideshow)
            if (channel.sampleImages && channel.sampleImages.length > 0) {
                channel.sampleImages.forEach((url, index) => {
                    mockChannel.contents.push({
                        class: 'Image',
                        image: {
                            display: {
                                url: url
                            }
                        },
                        id: `sample-${index}`,
                        connected_at: new Date(Date.now() - (index + 1) * 86400000).toISOString() // Mock dates, newer to older
                    });
                });
            }
            
            // Add main image last (it will be the newest)
            if (channel.sampleImage) {
                mockChannel.contents.push({
                    class: 'Image',
                    image: {
                        display: {
                            url: channel.sampleImage
                        }
                    },
                    id: 'sample-main',
                    connected_at: new Date().toISOString() // Most recent date
                });
            }
            
            renderChannelCard(mockChannel);
        });
        
        // Preload images for smoother animations
        preloadSlideshowImages();
        
        // Set up proper hover effects
        setupHoverEffects();
    }
}

// Preload all slideshow images to ensure smooth animations
function preloadSlideshowImages() {
    const slideshowImages = document.querySelectorAll('.channel-card-slideshow img');
    slideshowImages.forEach(img => {
        // Create a new Image object to preload
        const preloadImg = new Image();
        preloadImg.src = img.src;
        
        // Keep lazy loading for slideshow images
        if (!img.hasAttribute('loading')) {
            img.setAttribute('loading', 'lazy');
        }
        
        // Add a loaded class when the image is fully loaded
        preloadImg.onload = () => {
            img.classList.add('loaded');
        };
    });
}

// Render a channel card
function renderChannelCard(channel) {
    const card = document.createElement('div');
    card.className = 'channel-card-wrapper';
    card.dataset.slug = channel.slug;

    // Sort blocks by connected_at, newest first
    const sortedBlocks = channel.contents
        .filter(block => (block.class === 'Image' && block.image && block.image.display) || 
                        (block.class === 'Text' && block.content))
        .sort((a, b) => new Date(b.connected_at) - new Date(a.connected_at));

    // Get first letter of each word in title for placeholder
    const titleInitials = channel.title
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .substring(0, 2)
        .toUpperCase();

    const channelCard = document.createElement('div');
    channelCard.className = 'channel-card';

    const imagesContainer = document.createElement('div');
    imagesContainer.className = 'channel-card-images';

    if (sortedBlocks.length > 0) {
        // Add the newest block first (it will be shown as cover)
        const latestBlockDiv = document.createElement('div');
        latestBlockDiv.className = 'channel-card-image';
        
        const latestBlock = sortedBlocks[0];
        if (latestBlock.class === 'Image') {
            const latestImg = document.createElement('img');
            latestImg.loading = 'lazy';
            latestImg.alt = latestBlock.title || channel.title;
            // Use data-src for deferred loading
            latestImg.dataset.src = latestBlock.image.display.url;
            // Add a low-quality placeholder or blur effect while loading
            latestImg.style.filter = 'blur(5px)';
            latestImg.onload = () => {
                latestImg.style.filter = 'none';
                latestImg.classList.add('loaded');
            };
            imageObserver.observe(latestImg);
            latestBlockDiv.appendChild(latestImg);
        } else if (latestBlock.class === 'Text') {
            latestBlockDiv.className = 'channel-card-text';
            const textContent = document.createElement('div');
            textContent.className = 'text-content';
            textContent.textContent = latestBlock.content;
            latestBlockDiv.appendChild(textContent);
        }
        
        imagesContainer.appendChild(latestBlockDiv);

        // Add older images for the slideshow (only image blocks)
        const olderImageBlocks = sortedBlocks
            .slice(1)
            .filter(block => block.class === 'Image');
        
        // Show up to 8 images in the slideshow
        const numImages = Math.min(olderImageBlocks.length, 8);
        for (let i = 0; i < numImages; i++) {
            const imageDiv = document.createElement('div');
            imageDiv.className = 'channel-card-image';
            
            const img = document.createElement('img');
            img.loading = 'lazy';
            img.alt = olderImageBlocks[i].title || `${channel.title} image ${i + 1}`;
            // Use data-src for deferred loading
            img.dataset.src = olderImageBlocks[i].image.display.url;
            // Add a low-quality placeholder or blur effect while loading
            img.style.filter = 'blur(5px)';
            img.onload = () => {
                img.style.filter = 'none';
                img.classList.add('loaded');
            };
            imageObserver.observe(img);
            
            imageDiv.appendChild(img);
            imagesContainer.appendChild(imageDiv);
        }
    } else {
        // Only show placeholder if there are no blocks
        const placeholderDiv = document.createElement('div');
        placeholderDiv.className = 'channel-card-image';
        
        const placeholder = document.createElement('div');
        placeholder.className = 'channel-card-placeholder';
        placeholder.dataset.title = titleInitials;
        
        placeholderDiv.appendChild(placeholder);
        imagesContainer.appendChild(placeholderDiv);
    }

    channelCard.appendChild(imagesContainer);

    // Add title container
    const titleContainer = document.createElement('div');
    titleContainer.className = 'channel-card-title-container';
    
    const title = document.createElement('h3');
    title.className = 'channel-card-title';
    
    // Create the internal link (for our viewer)
    const titleLink = document.createElement('a');
    titleLink.href = `channel.html?channel=${channel.slug}`;
    titleLink.textContent = channel.title;
    titleLink.className = 'viewer-link';
    
    title.appendChild(titleLink);
    titleContainer.appendChild(title);

    // Add everything to the wrapper
    card.appendChild(channelCard);
    card.appendChild(titleContainer);

    // Add click handler
    card.addEventListener('click', (e) => {
        if (!e.target.closest('a')) {
            window.location.href = `channel.html?channel=${channel.slug}`;
        }
    });

    elements.channelsGrid.appendChild(card);
}

// Handle search form submission
function handleSearch() {
    const input = elements.channelInput.value.trim();
    if (!input) return;
    
    // Extract slug from input (could be a URL or a slug)
    let slug = input;
    
    // If it's a URL, extract the slug
    if (input.includes('are.na')) {
        const urlParts = input.split('/');
        slug = urlParts[urlParts.length - 1];
    }
    
    // Redirect to the channel viewer page with the channel slug
    window.location.href = `channel.html?channel=${slug}`;
}

// Show loading indicator
function showLoading() {
    elements.loading.classList.remove('hidden');
    state.isLoading = true;
}

// Hide loading indicator
function hideLoading() {
    elements.loading.classList.add('hidden');
    state.isLoading = false;
}

// Show error message
function showError(message) {
    elements.error.textContent = message;
    elements.error.classList.remove('hidden');
}

// Hide error message
function hideError() {
    elements.error.classList.add('hidden');
}

// Set up proper hover effects for channel cards
function setupHoverEffects() {
    const cards = document.querySelectorAll('.channel-card');
    
    cards.forEach(card => {
        const images = card.querySelectorAll('.channel-card-image:not(:first-child)');
        let currentIndex = 0;
        let slideshowInterval;

        const showNextImage = () => {
            images.forEach(img => img.classList.remove('active'));
            if (currentIndex < images.length) {
                images[currentIndex].classList.add('active');
                currentIndex = (currentIndex + 1) % images.length;
            }
        };

        card.addEventListener('mouseenter', () => {
            if (images.length > 0) {
                // Reset any active states
                images.forEach(img => img.classList.remove('active'));
                
                // Show the first slideshow image immediately
                images[0].classList.add('active');
                currentIndex = 1;

                // Start smooth slideshow with cross-fade
                slideshowInterval = setInterval(showNextImage, 800); // Slower timing for smoother transitions
            }
        });

        card.addEventListener('mouseleave', () => {
            clearInterval(slideshowInterval);
            images.forEach(img => img.classList.remove('active'));
            currentIndex = 0;
        });
    });
} 