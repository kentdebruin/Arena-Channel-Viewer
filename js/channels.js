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
    searchButton: document.getElementById('searchButton')
};

// API endpoints
const API = {
    baseUrl: 'https://api.are.na/v2',
    channel: (slug) => `${API.baseUrl}/channels/${slug}`,
    userChannels: (username) => `${API.baseUrl}/users/${username}/channels`
};

// Event Listeners
elements.searchButton.addEventListener('click', handleSearch);
elements.channelInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
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

// Load featured channels
async function loadFeaturedChannels() {
    showLoading();
    elements.channelsGrid.innerHTML = '';
    
    try {
        // Load channel data for each featured channel
        const channelPromises = state.featuredChannels.map(slug => 
            fetch(API.channel(slug))
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to load channel: ${slug}`);
                    }
                    return response.json();
                })
                .catch(error => {
                    console.error(error);
                    return null; // Return null for failed channels
                })
        );
        
        const channels = await Promise.all(channelPromises);
        const validChannels = channels.filter(channel => channel !== null);
        
        if (validChannels.length === 0) {
            // If no channels could be loaded from the API, use configuration data
            console.log("Using configuration channel data");
            CHANNELS_CONFIG.forEach(channel => {
                renderChannelCard({
                    ...channel,
                    user: { full_name: USER_CONFIG.full_name }
                });
            });
        } else {
            // Render channel cards from API data
            validChannels.forEach(channel => {
                renderChannelCard(channel);
            });
        }
        
        hideLoading();
        
    } catch (error) {
        console.error('Error loading featured channels:', error);
        hideLoading();
        
        // Use configuration data if API calls fail
        console.log("Using configuration channel data due to error");
        CHANNELS_CONFIG.forEach(channel => {
            renderChannelCard({
                ...channel,
                user: { full_name: USER_CONFIG.full_name }
            });
        });
    }
}

// Render a channel card
function renderChannelCard(channel) {
    const card = document.createElement('div');
    card.className = 'channel-card';
    card.dataset.slug = channel.slug;
    
    // Find a suitable thumbnail image
    let thumbnailUrl = null;
    if (channel.contents && channel.contents.length > 0) {
        // Try to find an image block for the thumbnail
        const imageBlock = channel.contents.find(block => 
            block.class === 'Image' && block.image && block.image.display
        );
        
        if (imageBlock) {
            thumbnailUrl = imageBlock.image.display.url;
        }
    }
    
    // Truncate description if needed
    const description = channel.description || 
        (channel.metadata && channel.metadata.description 
            ? channel.metadata.description.length > 100 
                ? channel.metadata.description.substring(0, 100) + '...' 
                : channel.metadata.description
            : 'No description available');
    
    // Get first letter of each word in title for placeholder
    const titleInitials = channel.title
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .substring(0, 2)
        .toUpperCase();
    
    card.innerHTML = `
        <div class="channel-card-thumbnail">
            ${thumbnailUrl 
                ? `<img src="${thumbnailUrl}" alt="${channel.title}" loading="lazy">` 
                : `<div class="channel-card-placeholder" data-title="${titleInitials}"></div>`
            }
        </div>
        <div class="channel-card-content">
            <div class="channel-card-title">${channel.title}</div>
            <div class="channel-card-description">${description}</div>
            <div class="channel-card-meta">
                <div class="channel-card-count">
                    <span class="material-icons">grid_view</span>
                    ${channel.length || 0} blocks
                </div>
                <div class="channel-card-by">by ${channel.user.full_name}</div>
            </div>
        </div>
    `;
    
    // Add click event to open the channel in the viewer
    card.addEventListener('click', () => {
        // Extract the slug part after the username
        const channelSlug = channel.slug;
        
        // Redirect to the channel viewer page with the channel slug
        window.location.href = `index.html?channel=${channelSlug}`;
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
    window.location.href = `index.html?channel=${slug}`;
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