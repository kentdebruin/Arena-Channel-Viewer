import { getYouTubeVideoId } from './youtube.js';

// State management
const state = {
    currentPage: 1,
    perPage: 32, // Decreased from 48 to improve loading speed
    currentChannel: null,
    hasMore: true,
    currentView: 'grid', // 'grid' or 'diary'
    currentBlocks: [],
    currentModalIndex: -1,
    defaultChannel: 'it-s-a-vibe',
    isLoading: false,
    newestBlockId: null,
    pollingInterval: null,
    POLLING_DELAY: 30000, // 30 seconds
    loadingMore: false // New state to track if we're loading more blocks
};

// Expose state to window for other scripts
window.state = state;

// DOM Elements
const elements = {
    channelInput: document.getElementById('channelInput'),
    searchButton: document.getElementById('searchButton'),
    loading: document.getElementById('loading'),
    error: document.getElementById('error'),
    channelInfo: document.getElementById('channelInfo'),
    channelDescription: document.getElementById('channelDescription'),
    blocksGrid: document.getElementById('blocksGrid'),
    blocksDiary: document.getElementById('blocksDiary'),
    gridViewBtn: document.getElementById('gridViewBtn'),
    diaryViewBtn: document.getElementById('diaryViewBtn'),
    modal: document.getElementById('blockModal'),
    modalBody: document.querySelector('.modal-body'),
    modalClose: document.querySelector('.modal-close'),
    modalPrev: document.querySelector('.modal-prev'),
    modalNext: document.querySelector('.modal-next'),
    fixedHeader: document.querySelector('.fixed-header'),
    fixedChannelTitle: document.getElementById('fixedChannelTitle'),
    fixedGridViewBtn: document.getElementById('fixedGridViewBtn'),
    fixedDiaryViewBtn: document.getElementById('fixedDiaryViewBtn'),
    main: document.querySelector('main'),
    breadcrumb: document.getElementById('breadcrumb'),
    currentChannel: document.getElementById('currentChannel')
};

// API endpoints
const API = {
    baseUrl: 'https://api.are.na/v2',
    channelInfo: (slug) => `${API.baseUrl}/channels/${slug}`,
    channelContents: (slug, page = 1, per = 32) => 
        `${API.baseUrl}/channels/${slug}/contents?page=${page}&per=${per}&sort=position&direction=desc`,
    userChannels: (username) => `${API.baseUrl}/users/${username}/channels`,
    maxRetries: 3,
    retryDelay: 1000 // 1 second delay between retries
};

// Event Listeners
elements.searchButton.addEventListener('click', handleSearch);
elements.channelInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});
elements.gridViewBtn.addEventListener('click', () => switchView('grid'));
elements.diaryViewBtn.addEventListener('click', () => switchView('diary'));
elements.fixedGridViewBtn.addEventListener('click', () => switchView('grid'));
elements.fixedDiaryViewBtn.addEventListener('click', () => switchView('diary'));

// Load channel on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Check for channel parameter in URL
        const urlParams = new URLSearchParams(window.location.search);
        const channelParam = urlParams.get('channel');
        
        if (channelParam) {
            // If channel parameter exists, use it
            elements.channelInput.value = channelParam;
            await handleSearch();
        } else {
            // Otherwise, try to fetch the default channel
            const response = await fetch(API.channelInfo(state.defaultChannel));
            if (!response.ok) {
                throw new Error('Default channel not found');
            }
            // Only set the input value and load if the channel exists
            elements.channelInput.value = state.defaultChannel;
            await handleSearch();
        }
    } catch (error) {
        hideLoading();
        showError('Please enter an Are.na channel slug or URL to begin');
        elements.channelInfo.classList.add('hidden');
        elements.blocksGrid.innerHTML = '';
        elements.blocksDiary.innerHTML = '';
        return;
    }
});

// Add scroll handler for fixed header
window.addEventListener('scroll', () => {
    const scrollPosition = window.scrollY;
    const headerHeight = 100; // Adjust this value based on your header height

    if (scrollPosition > headerHeight) {
        elements.fixedHeader.classList.add('visible');
        elements.main.classList.add('fixed-header-visible');
    } else {
        elements.fixedHeader.classList.remove('visible');
        elements.main.classList.remove('fixed-header-visible');
    }
});

// Initialize infinite scroll observer
const infiniteScrollObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !state.loadingMore && state.hasMore) {
                loadMoreBlocks();
            }
        });
    },
    {
        rootMargin: '100px',
        threshold: 0.1
    }
);

// Load more blocks when scrolling
async function loadMoreBlocks() {
    if (state.loadingMore || !state.hasMore) return;
    
    state.loadingMore = true;
    state.currentPage++;
    
    try {
        // Add loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-more';
        loadingIndicator.textContent = 'Loading more...';
        const container = state.currentView === 'grid' ? elements.blocksGrid : elements.blocksDiary;
        container.appendChild(loadingIndicator);

        const response = await fetch(`https://api.are.na/v2/channels/${state.currentChannel}/contents?page=${state.currentPage}&per=${state.perPage}&sort=position&direction=desc`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch more blocks');
        }
        
        const data = await response.json();
        
        if (data && data.contents && data.contents.length > 0) {
            // Add new blocks to state
            state.currentBlocks = [...state.currentBlocks, ...data.contents];
            
            // Remove loading indicator
            loadingIndicator.remove();
            
            // Render new blocks
            renderBlocks(data.contents, true);
            
            // Update hasMore based on whether we got a full page of results
            state.hasMore = data.contents.length === state.perPage;
            
            // Add infinite scroll trigger if there might be more blocks
            if (state.hasMore) {
                addInfiniteScrollTrigger();
            }
        } else {
            state.hasMore = false;
            removeInfiniteScrollTrigger();
        }
    } catch (error) {
        console.error('Error loading more blocks:', error);
        state.hasMore = false;
        removeInfiniteScrollTrigger();
    } finally {
        state.loadingMore = false;
        // Remove loading indicator if it still exists
        const loadingIndicator = document.querySelector('.loading-more');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }
    }
}

// Add infinite scroll trigger element
function addInfiniteScrollTrigger() {
    removeInfiniteScrollTrigger(); // Remove existing trigger if any
    
    const trigger = document.createElement('div');
    trigger.className = 'infinite-scroll-trigger';
    trigger.style.height = '1px';
    trigger.style.width = '100%';
    
    if (state.currentView === 'grid') {
        elements.blocksGrid.appendChild(trigger);
    } else {
        elements.blocksDiary.appendChild(trigger);
    }
    
    infiniteScrollObserver.observe(trigger);
}

// Remove infinite scroll trigger
function removeInfiniteScrollTrigger() {
    const existingTrigger = document.querySelector('.infinite-scroll-trigger');
    if (existingTrigger) {
        infiniteScrollObserver.unobserve(existingTrigger);
        existingTrigger.remove();
    }
}

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

// Modify loadInitialContent to support pagination
async function loadInitialContent() {
    try {
        // Show loading blocks
        const loadingBlocks = Array(12).fill(null).map(() => {
            const container = document.createElement('div');
            container.className = 'block-container loading';
            const block = document.createElement('div');
            block.className = 'block';
            container.appendChild(block);
            return container;
        });
        
        if (state.currentView === 'grid') {
            elements.blocksGrid.innerHTML = '';
            loadingBlocks.forEach(block => elements.blocksGrid.appendChild(block));
        }

        // Reset pagination state
        state.currentPage = 1;
        state.hasMore = true;
        state.currentBlocks = [];

        try {
            // Fetch fresh blocks
            const data = await fetchWithRetry(
                API.channelContents(state.currentChannel, state.currentPage, state.perPage)
            );
            
            if (!data || !data.contents) {
                throw new Error('Invalid response from API');
            }

            // Update state
            state.currentBlocks = data.contents;
            state.hasMore = data.contents.length === state.perPage;
            
            // Clear loading blocks
            if (state.currentView === 'grid') {
                elements.blocksGrid.innerHTML = '';
            } else {
                elements.blocksDiary.innerHTML = '';
            }
            
            // Render blocks
            renderBlocks(state.currentBlocks, false);
            
            // Add infinite scroll trigger if there might be more blocks
            if (state.hasMore) {
                addInfiniteScrollTrigger();
            }
            
            // Cache the blocks
            BlockCache.cacheBlocks(state.currentChannel, state.currentBlocks);
            
            // Hide any existing error messages
            hideError();
            
        } catch (error) {
            console.error('Error fetching content:', error);
            // Try to get cached blocks as fallback
            const cachedBlocks = BlockCache.getCachedBlocks(state.currentChannel);
            if (cachedBlocks) {
                // If we have cached blocks, show them but with a warning
                state.currentBlocks = cachedBlocks;
                renderBlocks(cachedBlocks, false);
                showError('Using cached content - some items may be outdated');
            } else {
                throw new Error('Failed to load content');
            }
        }
        
    } catch (error) {
        console.error('Error in loadInitialContent:', error);
        elements.blocksGrid.innerHTML = '';
        elements.blocksDiary.innerHTML = '';
        showError('Failed to load content. Please try again later.');
    } finally {
        // Remove loading blocks if they still exist
        const existingLoadingBlocks = document.querySelectorAll('.block-container.loading');
        existingLoadingBlocks.forEach(block => block.remove());
    }
}

// Modify renderBlocks to support appending
function renderBlocks(blocks, append = false) {
    const container = state.currentView === 'grid' ? elements.blocksGrid : elements.blocksDiary;
    
    if (!append) {
        container.innerHTML = '';
    }
    
    blocks.forEach(block => {
        const blockElement = createBlockElement(block);
        if (blockElement) {
            container.appendChild(blockElement);
        }
    });
    
    // Reinitialize observers for new blocks
    initializeBlockObservers();
}

// Check for new blocks
async function checkForNewBlocks() {
    if (!state.currentChannel || state.isLoading) return;
    
    try {
        const response = await fetch(API.latestBlock(state.currentChannel));
        
        if (!response.ok) return;
        
        const data = await response.json();
        if (!data.contents || !data.contents[0]) return;
        
        const latestBlock = data.contents[0];
        
        // If we have a new block
        if (!state.newestBlockId || latestBlock.id !== state.newestBlockId) {
            // Fetch new blocks
            const newBlocksResponse = await fetch(
                API.blocks(state.currentChannel, 1, state.perPage)
            );
            
            if (!newBlocksResponse.ok) return;
            
            const newData = await newBlocksResponse.json();
            if (!newData.contents || !newData.contents.length) return;
            
            // Update state
            state.newestBlockId = latestBlock.id;
            state.currentBlocks = newData.contents;
            
            // Update cache
            await BlockCache.cacheBlocks(state.currentChannel, newData.contents);
            
            // Re-render blocks
            renderBlocks(newData.contents, false);
        }
    } catch (error) {
        console.error('Error checking for new blocks:', error);
    }
}

// Start polling for new blocks
function startPolling() {
    // Clear existing interval if any
    if (state.pollingInterval) {
        clearInterval(state.pollingInterval);
    }
    
    // Start new polling interval
    state.pollingInterval = setInterval(checkForNewBlocks, state.POLLING_DELAY);
}

// Stop polling
function stopPolling() {
    if (state.pollingInterval) {
        clearInterval(state.pollingInterval);
        state.pollingInterval = null;
    }
}

// Update the handleSearch function
async function handleSearch() {
    const inputValue = elements.channelInput.value.trim();
    if (!inputValue) {
        showError('Please enter a channel slug or URL');
        elements.channelInfo.classList.add('hidden');
        elements.blocksGrid.innerHTML = '';
        elements.blocksDiary.innerHTML = '';
        return;
    }

    const channelSlug = extractChannelSlug(inputValue);
    if (!channelSlug) {
        showError('Invalid channel URL or slug');
        elements.channelInfo.classList.add('hidden');
        elements.blocksGrid.innerHTML = '';
        elements.blocksDiary.innerHTML = '';
        return;
    }

    // Stop existing polling
    stopPolling();

    // Reset state
    state.currentPage = 1;
    state.currentChannel = channelSlug;
    state.hasMore = true;
    state.currentBlocks = [];
    state.newestBlockId = null;
    elements.blocksGrid.innerHTML = '';
    elements.blocksDiary.innerHTML = '';
    hideError();
    
    // Show loading blocks immediately
    const loadingBlocks = Array(12).fill(null).map(() => {
        const container = document.createElement('div');
        container.className = 'block-container loading';
        const block = document.createElement('div');
        block.className = 'block';
        container.appendChild(block);
        return container;
    });
    
    if (state.currentView === 'grid') {
        elements.blocksGrid.innerHTML = '';
        loadingBlocks.forEach(block => elements.blocksGrid.appendChild(block));
    }
    
    try {
        showLoading();
        
        // Fetch channel info
        const channelData = await fetchChannel(channelSlug);
        updateChannelInfo(channelData);
        
        // Load initial content
        await loadInitialContent();
        
    } catch (error) {
        elements.channelInfo.classList.add('hidden');
        elements.blocksGrid.innerHTML = '';
        elements.blocksDiary.innerHTML = '';
        showError(error.message);
    } finally {
        hideLoading();
    }
}

// Fetch channel information
async function fetchChannel(slug) {
    const response = await fetch(API.channelInfo(slug));
    if (!response.ok) {
        throw new Error('Channel not found');
    }
    return response.json();
}

// Initialize observers for lazy loading images in blocks
function initializeBlockObservers() {
    const blockImages = document.querySelectorAll('.block img');
    
    // Create a new intersection observer
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    // Set the actual image source
                    img.src = img.dataset.src;
                    delete img.dataset.src;
                    
                    // Add loaded class when the image is fully loaded
                    img.onload = () => {
                        img.classList.add('loaded');
                    };
                }
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '50px 0px', // Start loading images 50px before they enter the viewport
        threshold: 0.1
    });
    
    // Observe all block images
    blockImages.forEach(img => {
        // Only observe images that haven't been loaded yet
        if (!img.classList.contains('loaded')) {
            imageObserver.observe(img);
        }
    });
}

// Modify createBlockElement to use data-src for lazy loading
function createBlockElement(block) {
    const container = document.createElement('div');
    container.className = 'block-container';
    
    const element = document.createElement('div');
    element.className = 'block';
    
    switch (block.class) {
        case 'Image':
            if (block.image && block.image.display && block.image.display.url) {
                const img = document.createElement('img');
                img.dataset.src = block.image.display.url;
                img.alt = block.title || 'Image block';
                element.appendChild(img);
            } else {
                element.innerHTML = `
                    <div class="block-content">
                        <p class="block-text">Image unavailable</p>
                    </div>
                `;
            }
            break;
            
        case 'Text':
            element.innerHTML = `
                <div class="block-content">
                    <p class="block-text">${block.content}</p>
                </div>
            `;
            // Check for overflow after render
            setTimeout(() => {
                const content = element.querySelector('.block-content');
                const text = element.querySelector('.block-text');
                if (text.scrollHeight > content.clientHeight) {
                    content.classList.add('overflow');
                }
            }, 0);
            break;
            
        case 'Link':
            // Check if it's a YouTube link
            const linkYTId = block.source?.url ? getYouTubeVideoId(block.source.url) : null;
            if (linkYTId) {
                const img = document.createElement('img');
                img.dataset.src = `https://img.youtube.com/vi/${linkYTId}/maxresdefault.jpg`;
                img.alt = block.title || 'YouTube video';
                img.onerror = function() {
                    this.onerror = null;
                    this.dataset.src = `https://img.youtube.com/vi/${linkYTId}/hqdefault.jpg`;
                };
                element.appendChild(img);
            } else {
                element.innerHTML = `
                    <div class="block-content">
                        <div class="block-link-container">
                            ${block.title ? `
                                <div class="block-link-meta">
                                    <h3 class="block-link-title">${block.title}</h3>
                                    ${block.source?.description ? `
                                        <p class="block-link-description">${block.source.description}</p>
                                    ` : ''}
                                </div>
                            ` : ''}
                            <a href="${block.source?.url || '#'}" target="_blank" class="block-link">
                                ${block.source?.url || 'Link unavailable'}
                            </a>
                            ${block.description ? `
                                <div class="block-description">
                                    <p class="block-text">${block.description}</p>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            }
            break;

        case 'Media':
            const mediaYTId = block.source?.url ? getYouTubeVideoId(block.source.url) : null;
            if (mediaYTId) {
                const imgContainer = document.createElement('div');
                imgContainer.style.position = 'relative';
                
                const img = document.createElement('img');
                img.dataset.src = `https://img.youtube.com/vi/${mediaYTId}/maxresdefault.jpg`;
                img.alt = block.title || 'YouTube video';
                img.onerror = function() {
                    this.onerror = null;
                    this.dataset.src = `https://img.youtube.com/vi/${mediaYTId}/hqdefault.jpg`;
                };
                
                const overlay = document.createElement('div');
                overlay.className = 'youtube-overlay';
                const playIcon = document.createElement('span');
                playIcon.className = 'material-icons';
                playIcon.textContent = 'play_circle';
                overlay.appendChild(playIcon);
                
                imgContainer.appendChild(img);
                imgContainer.appendChild(overlay);
                element.appendChild(imgContainer);
                element.classList.add('youtube-block');
            } else {
                element.innerHTML = `
                    <div class="block-content">
                        <p class="block-text">Unsupported media type</p>
                    </div>
                `;
            }
            break;
            
        default:
            element.innerHTML = `
                <div class="block-content">
                    <p class="block-text">Unsupported block type: ${block.class}</p>
                </div>
            `;
    }

    element.addEventListener('click', () => {
        const index = state.currentBlocks.findIndex(b => b.id === block.id);
        if (typeof window.modalFunctions !== 'undefined' && typeof window.modalFunctions.openModal === 'function') {
            window.modalFunctions.openModal(index);
        } else {
            console.error('Modal functions not available');
        }
    });
    
    if (block.title) {
        const titleDiv = document.createElement('div');
        titleDiv.className = 'block-title';
        titleDiv.textContent = block.title;
        element.appendChild(titleDiv);
    }
    
    container.appendChild(element);
    return container;
}

// Update channel information
function updateChannelInfo(channel) {
    const blockCount = channel.length || 0;
    const blockCountText = `<span class="block-count">${blockCount}</span>`;
    const arenaLink = `<a href="https://www.are.na/channel/${channel.slug}" 
           class="arena-link" 
           target="_blank" 
           title="View on Are.na"
           rel="noopener noreferrer">
           <span class="material-icons">open_in_new</span>
        </a>`;
    
    // Update both main and fixed header breadcrumbs
    const breadcrumbContent = `${channel.title} ${blockCountText} ${arenaLink}`;
    elements.currentChannel.innerHTML = breadcrumbContent;
    elements.fixedChannelTitle.innerHTML = breadcrumbContent;
    
    if (channel.description) {
        elements.channelDescription.textContent = channel.description;
        elements.channelDescription.classList.remove('hidden');
    } else {
        elements.channelDescription.classList.add('hidden');
    }
    
    elements.channelInfo.classList.remove('hidden');
}

// UI Helper functions
function showLoading() {
    elements.loading.classList.remove('hidden');
}

function hideLoading() {
    elements.loading.classList.add('hidden');
}

function showError(message) {
    elements.error.textContent = message;
    elements.error.classList.remove('hidden');
}

function hideError() {
    elements.error.textContent = '';
    elements.error.classList.add('hidden');
}

// View switching
async function switchView(view) {
    state.currentView = view;
    elements.gridViewBtn.classList.toggle('active', view === 'grid');
    elements.diaryViewBtn.classList.toggle('active', view === 'diary');
    elements.fixedGridViewBtn.classList.toggle('active', view === 'grid');
    elements.fixedDiaryViewBtn.classList.toggle('active', view === 'diary');
    elements.blocksGrid.classList.toggle('hidden', view !== 'grid');
    elements.blocksDiary.classList.toggle('hidden', view !== 'diary');
    
    // Clear the current view
    if (view === 'grid') {
        elements.blocksGrid.innerHTML = '';
    } else {
        elements.blocksDiary.innerHTML = '';
    }

    // Reset and load initial content
    state.currentPage = 1;
    state.hasMore = true;
    state.currentBlocks = [];
    await loadInitialContent();
}

// Extract channel slug from URL or return the slug itself
function extractChannelSlug(input) {
    try {
        // Check if it's a URL
        if (input.includes('are.na/')) {
            const url = new URL(input.startsWith('http') ? input : `https://${input}`);
            // Get the pathname and split it into parts
            const parts = url.pathname.split('/').filter(part => part);
            // The channel slug should be the last part
            return parts[parts.length - 1];
        }
        // If not a URL, return the input as is
        return input;
    } catch (e) {
        // If URL parsing fails, return the input as is
        return input;
    }
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

// Clean up when leaving the page
window.addEventListener('beforeunload', () => {
    stopPolling();
});