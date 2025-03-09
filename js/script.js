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
    POLLING_DELAY: 30000 // 30 seconds
};

// DOM Elements
const elements = {
    channelInput: document.getElementById('channelInput'),
    searchButton: document.getElementById('searchButton'),
    loading: document.getElementById('loading'),
    error: document.getElementById('error'),
    channelInfo: document.getElementById('channelInfo'),
    channelTitle: document.getElementById('channelTitle'),
    channelDescription: document.getElementById('channelDescription'),
    blocksGrid: document.getElementById('blocksGrid'),
    blocksDiary: document.getElementById('blocksDiary'),
    gridViewBtn: document.getElementById('gridViewBtn'),
    diaryViewBtn: document.getElementById('diaryViewBtn'),
    modal: document.querySelector('.modal'),
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
    channel: (slug) => `${API.baseUrl}/channels/${slug}`,
    blocks: (slug, page, perPage) => 
        `${API.baseUrl}/channels/${slug}/contents?page=${page}&per=${perPage}&sort=connected_at&direction=desc`,
    latestBlock: (slug) => 
        `${API.baseUrl}/channels/${slug}/contents?per=1&sort=connected_at&direction=desc`
};

// Event Listeners
elements.searchButton.addEventListener('click', handleSearch);
elements.channelInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});
elements.gridViewBtn.addEventListener('click', () => switchView('grid'));
elements.diaryViewBtn.addEventListener('click', () => switchView('diary'));
elements.modalClose.addEventListener('click', closeModal);
elements.modal.addEventListener('click', (e) => {
    if (e.target === elements.modal) closeModal();
});
elements.modalPrev.addEventListener('click', () => navigateModal(-1));
elements.modalNext.addEventListener('click', () => navigateModal(1));
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
            const response = await fetch(API.channel(state.defaultChannel));
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

// Add keyboard navigation
document.addEventListener('keydown', (e) => {
    if (!elements.modal.classList.contains('hidden')) {
        if (e.key === 'Escape') closeModal();
        if (e.key === 'ArrowLeft') navigateModal(-1);
        if (e.key === 'ArrowRight') navigateModal(1);
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

// Load initial content
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

        // Try to get cached blocks first
        const cachedBlocks = BlockCache.getCachedBlocks(state.currentChannel);
        if (cachedBlocks) {
            // Render cached blocks immediately
            state.currentBlocks = cachedBlocks;
            renderBlocks(cachedBlocks, false);
        }

        // Fetch fresh blocks
        const response = await fetch(
            API.blocks(state.currentChannel, state.currentPage, state.perPage)
        );
        
        if (!response.ok) {
            throw new Error('Failed to load content');
        }

        const data = await response.json();
        if (data.contents && Array.isArray(data.contents)) {
            state.currentBlocks = data.contents;
            state.hasMore = data.contents.length === state.perPage;
            
            // Update newestBlockId
            if (data.contents.length > 0) {
                state.newestBlockId = data.contents[0].id;
            }
            
            // Cache the blocks
            await BlockCache.cacheBlocks(state.currentChannel, data.contents);
            
            // Clear loading blocks before rendering actual content
            if (state.currentView === 'grid') {
                elements.blocksGrid.innerHTML = '';
            }
            renderBlocks(data.contents, false);

            // Start polling for new blocks
            startPolling();
        }

    } catch (error) {
        showError(error.message);
    }
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
    const response = await fetch(API.channel(slug));
    if (!response.ok) {
        throw new Error('Channel not found');
    }
    return response.json();
}

// Render blocks based on current view
function renderBlocks(blocks, isAppending = false) {
    if (state.currentView === 'grid') {
        renderGridView(blocks, isAppending);
    } else {
        renderDiaryView(blocks, isAppending);
    }
}

// Grid view rendering
function renderGridView(blocks, isAppending = false) {
    // Sort blocks by connected_at in descending order (newest first)
    const sortedBlocks = [...blocks].sort((a, b) => 
        new Date(b.connected_at) - new Date(a.connected_at)
    );
    
    if (!isAppending) {
        elements.blocksGrid.innerHTML = '';
    }
    
    sortedBlocks.forEach(block => {
        const blockElement = createBlockElement(block);
        elements.blocksGrid.appendChild(blockElement);
    });
}

// Diary view rendering
function renderDiaryView(blocks, isAppending = false) {
    state.currentBlocks = blocks;
    const blocksByDate = groupBlocksByDate(blocks);
    
    // Sort dates in descending order (newest first)
    const sortedDates = Object.keys(blocksByDate).sort((a, b) => b.localeCompare(a));
    
    if (!isAppending) {
        elements.blocksDiary.innerHTML = '';
    }
    
    sortedDates.forEach(date => {
        const dateSection = document.createElement('div');
        dateSection.className = 'diary-date';
        dateSection.textContent = formatDate(date);
        elements.blocksDiary.appendChild(dateSection);

        // Sort blocks within each date by connected_at in descending order
        const sortedBlocks = blocksByDate[date].sort((a, b) => 
            new Date(b.connected_at) - new Date(a.connected_at)
        );

        sortedBlocks.forEach(block => {
            const diaryBlock = createDiaryBlockElement(block);
            elements.blocksDiary.appendChild(diaryBlock);
        });
    });
}

// Group blocks by date
function groupBlocksByDate(blocks) {
    return blocks.reduce((groups, block) => {
        const date = block.connected_at.split('T')[0];
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(block);
        return groups;
    }, {});
}

// Create diary block element
function createDiaryBlockElement(block) {
    const diaryBlock = document.createElement('div');
    diaryBlock.className = 'diary-block';
    diaryBlock.addEventListener('click', () => openModal(block, state.currentBlocks.findIndex(b => b.id === block.id)));

    let content = '';
    
    // Add image section if it's an image block
    if (block.class === 'Image' && block.image && block.image.display && block.image.display.url) {
        content += `
            <div class="diary-block-image">
                <img src="${block.image.display.url}" alt="${block.title || 'Image block'}">
            </div>
        `;
    }

    content += `
        <div class="diary-block-content">
            <div class="diary-block-header">
                ${block.title ? `<h3 class="diary-block-title">${block.title}</h3>` : ''}
                <time class="diary-block-time">${formatTime(block.connected_at)}</time>
            </div>
    `;

    switch (block.class) {
        case 'Text':
            content += `<p class="block-text">${block.content}</p>`;
            break;
        case 'Link':
            content += `
                <a href="${block.source.url}" target="_blank" class="block-link">
                    ${block.source.url}
                </a>
                ${block.description ? `<p class="block-text">${block.description}</p>` : ''}
            `;
            break;
    }

    content += '</div>';
    diaryBlock.innerHTML = content;
    return diaryBlock;
}

// Date formatting helper
function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Time formatting helper
function formatTime(dateStr) {
    return new Date(dateStr).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Helper function to extract YouTube video ID from URL
function getYouTubeVideoId(url) {
    try {
        // Log the URL we're trying to parse
        console.log('Trying to parse YouTube URL:', url);
        
        const urlObj = new URL(url);
        console.log('URL parsed as:', urlObj.toString());
        console.log('Hostname:', urlObj.hostname);
        
        // Handle youtu.be format
        if (urlObj.hostname === 'youtu.be') {
            const id = urlObj.pathname.slice(1);
            console.log('youtu.be format, extracted ID:', id);
            return id;
        }
        
        // Handle youtube.com formats
        if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com' || urlObj.hostname === 'm.youtube.com') {
            // Handle standard watch URLs
            if (urlObj.pathname === '/watch') {
                const id = new URLSearchParams(urlObj.search).get('v');
                console.log('youtube.com/watch format, extracted ID:', id);
                return id;
            }
            
            // Handle shortened /v/ URLs
            if (urlObj.pathname.startsWith('/v/')) {
                const id = urlObj.pathname.split('/v/')[1];
                console.log('youtube.com/v/ format, extracted ID:', id);
                return id;
            }
            
            // Handle embed URLs
            if (urlObj.pathname.startsWith('/embed/')) {
                const id = urlObj.pathname.split('/embed/')[1];
                console.log('youtube.com/embed/ format, extracted ID:', id);
                return id;
            }
        }
        
        console.log('No YouTube video ID found in URL');
        return null;
    } catch (e) {
        console.error('Error parsing YouTube URL:', e);
        return null;
    }
}

// Create block element based on type
function createBlockElement(block) {
    const container = document.createElement('div');
    container.className = 'block-container';
    
    const element = document.createElement('div');
    element.className = 'block';
    
    switch (block.class) {
        case 'Image':
            if (block.image && block.image.display && block.image.display.url) {
                element.innerHTML = `<img src="${block.image.display.url}" alt="${block.title || 'Image block'}">`;
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
            // Log the link block for debugging
            console.log('Processing Link block:', {
                title: block.title,
                url: block.source?.url,
                description: block.description
            });
            
            // Check if it's a YouTube link
            const linkYTId = block.source?.url ? getYouTubeVideoId(block.source.url) : null;
            if (linkYTId) {
                console.log('Found YouTube ID:', linkYTId);
                // Show YouTube thumbnail as a regular image
                element.innerHTML = `
                    <img src="https://img.youtube.com/vi/${linkYTId}/maxresdefault.jpg" 
                         alt="${block.title || 'YouTube video'}"
                         onerror="this.onerror=null; this.src='https://img.youtube.com/vi/${linkYTId}/hqdefault.jpg';">
                `;
            } else {
                console.log('Not a YouTube link, rendering as regular link');
                // Regular link handling
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
            // Log the media block for debugging
            console.log('Processing Media block:', {
                title: block.title,
                url: block.source?.url,
                description: block.description
            });
            
            // Check if it's a YouTube link
            const mediaYTId = block.source?.url ? getYouTubeVideoId(block.source.url) : null;
            if (mediaYTId) {
                console.log('Found YouTube ID:', mediaYTId);
                // Show YouTube thumbnail with play button overlay
                element.innerHTML = `
                    <img src="https://img.youtube.com/vi/${mediaYTId}/maxresdefault.jpg" 
                         alt="${block.title || 'YouTube video'}"
                         onerror="this.onerror=null; this.src='https://img.youtube.com/vi/${mediaYTId}/hqdefault.jpg';">
                    <div class="youtube-overlay">
                        <span class="material-icons">play_circle</span>
                    </div>
                `;
                element.classList.add('youtube-block');
            } else {
                // Handle other media types or show unsupported message
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
        openModal(block, index);
    });
    
    // Add title below the block if it exists
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
    
    // Add both the title and the Are.na link
    elements.channelTitle.innerHTML = `
        ${channel.title} 
        ${blockCountText}
        <a href="https://www.are.na/channel/${channel.slug}" 
           class="arena-link" 
           target="_blank" 
           title="View on Are.na"
           rel="noopener noreferrer">
           <span class="material-icons">open_in_new</span>
        </a>
    `;
    
    // Update breadcrumb and fixed header title
    elements.currentChannel.textContent = channel.title;
    elements.fixedChannelTitle.textContent = channel.title;
    elements.breadcrumb.classList.remove('hidden');
    
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

// Modal functions
function openModal(block, index) {
    state.currentModalIndex = index;
    elements.modalBody.innerHTML = '';
    elements.modalBody.appendChild(createModalContent(block));
    elements.modal.classList.remove('hidden');
    updateNavigationButtons();
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    elements.modal.classList.add('hidden');
    state.currentModalIndex = -1;
    document.body.style.overflow = '';
}

async function navigateModal(direction) {
    const newIndex = state.currentModalIndex + direction;
    
    // If we're moving forward and approaching the end of loaded blocks, try to load more
    if (direction > 0 && state.hasMore && newIndex >= state.currentBlocks.length - 3) {
        try {
            state.isLoading = true;
            state.currentPage++;
            
            // Show loading state in modal
            const loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'modal-loading';
            loadingIndicator.innerHTML = `
                <div class="block-container loading">
                    <div class="block"></div>
                </div>
            `;
            elements.modalBody.appendChild(loadingIndicator);
            
            const response = await fetch(
                API.blocks(state.currentChannel, state.currentPage, state.perPage)
            );
            
            if (!response.ok) {
                throw new Error('Failed to load more blocks');
            }

            const data = await response.json();
            if (data.contents && Array.isArray(data.contents)) {
                if (data.contents.length === 0) {
                    state.hasMore = false;
                } else {
                    state.currentBlocks = [...state.currentBlocks, ...data.contents];
                    state.hasMore = data.contents.length === state.perPage;
                }
            }
        } catch (error) {
            console.error('Error loading more blocks:', error);
            state.hasMore = false;
        } finally {
            state.isLoading = false;
            // Remove loading indicator
            const loadingIndicator = elements.modalBody.querySelector('.modal-loading');
            if (loadingIndicator) {
                loadingIndicator.remove();
            }
        }
    }

    // Now try to navigate to the new index
    if (newIndex >= 0 && newIndex < state.currentBlocks.length) {
        openModal(state.currentBlocks[newIndex], newIndex);
    }
}

function updateNavigationButtons() {
    const hasPrev = state.currentModalIndex > 0;
    // Show next button if we're not at the end or if there are more blocks to load
    const hasNext = state.currentModalIndex < state.currentBlocks.length - 1 || state.hasMore;
    
    elements.modalPrev.classList.toggle('hidden', !hasPrev);
    elements.modalNext.classList.toggle('hidden', !hasNext);
}

function createModalContent(block) {
    const container = document.createElement('div');
    const content = document.createElement('div');
    content.className = 'modal-block-content';
    
    // Update header content
    const headerTitle = document.querySelector('.modal-header-title');
    const headerDate = document.querySelector('.modal-header-date');
    
    if (headerTitle) {
        // Create a link to the Are.na block
        headerTitle.innerHTML = `
            <a href="https://www.are.na/block/${block.id}" 
               target="_blank" 
               class="block-title-link">
                ${block.title || 'Untitled'}
            </a>
        `;
    }
    
    if (headerDate) {
        headerDate.textContent = block.connected_at ? 
            `${formatDate(block.connected_at)} at ${formatTime(block.connected_at)}` : '';
    }
    
    // Add content based on block type
    switch (block.class) {
        case 'Image':
            if (block.image && block.image.display && block.image.display.url) {
                content.classList.add('is-image');
                const img = document.createElement('img');
                img.src = block.image.display.url;
                img.alt = block.title || 'Image';
                content.appendChild(img);
            } else {
                const errorText = document.createElement('p');
                errorText.textContent = 'Image unavailable';
                content.appendChild(errorText);
            }
            break;
            
        case 'Text':
            const textContainer = document.createElement('div');
            textContainer.className = 'modal-text-container';
            textContainer.innerHTML = `<p>${block.content}</p>`;
            content.appendChild(textContainer);
            break;
            
        case 'Link':
            const modalYTId = block.source?.url ? getYouTubeVideoId(block.source.url) : null;
            if (modalYTId) {
                content.classList.add('is-video');
                // Create responsive video container
                const videoContainer = document.createElement('div');
                videoContainer.className = 'video-container';
                // Add YouTube embed without autoplay
                videoContainer.innerHTML = `
                    <iframe 
                        width="960" 
                        height="540" 
                        src="https://www.youtube.com/embed/${modalYTId}" 
                        frameborder="0" 
                        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                `;
                content.appendChild(videoContainer);
            } else {
                const linkContainer = document.createElement('div');
                linkContainer.className = 'modal-text-container';
                linkContainer.innerHTML = `
                    <a href="${block.source.url}" target="_blank" class="block-link">
                        ${block.title || block.source.url}
                    </a>
                    ${block.description ? `<p>${block.description}</p>` : ''}
                `;
                content.appendChild(linkContainer);
            }
            break;

        case 'Media':
            const youtubeId = block.source?.url ? getYouTubeVideoId(block.source.url) : null;
            if (youtubeId) {
                content.classList.add('is-video');
                // Create responsive video container
                const videoContainer = document.createElement('div');
                videoContainer.className = 'video-container';
                // Add YouTube embed without autoplay
                videoContainer.innerHTML = `
                    <iframe 
                        width="960" 
                        height="540" 
                        src="https://www.youtube.com/embed/${youtubeId}" 
                        frameborder="0" 
                        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                `;
                content.appendChild(videoContainer);
            } else {
                const errorText = document.createElement('p');
                errorText.textContent = 'Video unavailable';
                content.appendChild(errorText);
            }
            break;
    }
    
    container.appendChild(content);
    return container;
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