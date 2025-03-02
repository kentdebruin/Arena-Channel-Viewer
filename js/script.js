// State management
const state = {
    currentPage: 1,
    perPage: 24, // Reduced for faster initial load
    currentChannel: null,
    hasMore: true,
    currentView: 'grid', // 'grid' or 'diary'
    currentBlocks: [],
    currentModalIndex: -1,
    defaultChannel: 'it-s-a-vibe',
    isLoading: false
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
    main: document.querySelector('main')
};

// API endpoints
const API = {
    baseUrl: 'https://api.are.na/v2',
    channel: (slug) => `${API.baseUrl}/channels/${slug}`,
    blocks: (slug, page, perPage) => 
        `${API.baseUrl}/channels/${slug}/contents?page=${page}&per=${perPage}&sort=connected_at&direction=desc`
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

// Load default channel on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Try to fetch the default channel first
        const response = await fetch(API.channel(state.defaultChannel));
        if (!response.ok) {
            throw new Error('Default channel not found');
        }
        // Only set the input value and load if the channel exists
        elements.channelInput.value = state.defaultChannel;
        await handleSearch();
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
        showLoading();
        
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
            
            // Clear loading blocks before rendering actual content
            if (state.currentView === 'grid') {
                elements.blocksGrid.innerHTML = '';
            }
            renderBlocks(data.contents, false);
        }

    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

// Load more content
async function loadMoreContent() {
    if (state.isLoading || !state.hasMore) return;

    try {
        state.isLoading = true;
        state.currentPage++;
        
        const response = await fetch(
            API.blocks(state.currentChannel, state.currentPage, state.perPage)
        );
        
        if (!response.ok) {
            throw new Error('Failed to load more content');
        }

        const data = await response.json();
        if (data.contents && Array.isArray(data.contents)) {
            if (data.contents.length === 0) {
                state.hasMore = false;
            } else {
                state.currentBlocks = [...state.currentBlocks, ...data.contents];
                state.hasMore = data.contents.length === state.perPage;
                renderBlocks(data.contents, true);
            }
        }

    } catch (error) {
        showError(error.message);
    } finally {
        state.isLoading = false;
        hideLoading();
    }
}

// Add scroll handler for lazy loading
window.addEventListener('scroll', debounce(() => {
    const scrollPosition = window.innerHeight + window.scrollY;
    const bodyHeight = document.body.offsetHeight;
    const scrollThreshold = 200;

    if (bodyHeight - scrollPosition < scrollThreshold) {
        loadMoreContent();
    }
}, 100));

// Main search handler
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

    // Reset state
    state.currentPage = 1;
    state.currentChannel = channelSlug;
    state.hasMore = true;
    state.currentBlocks = [];
    elements.blocksGrid.innerHTML = '';
    elements.blocksDiary.innerHTML = '';
    hideError();
    
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
    if (block.class === 'Image' && block.image) {
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

// Create block element based on type
function createBlockElement(block) {
    const container = document.createElement('div');
    container.className = 'block-container';
    
    const element = document.createElement('div');
    element.className = 'block';
    
    switch (block.class) {
        case 'Image':
            element.innerHTML = `<img src="${block.image.display.url}" alt="${block.title || 'Image block'}">`;
            break;
            
        case 'Text':
            element.innerHTML = `
                <div class="block-content">
                    <p class="block-text">${block.content}</p>
                </div>
            `;
            break;
            
        case 'Link':
            element.innerHTML = `
                <div class="block-content">
                    <a href="${block.source.url}" target="_blank" class="block-link">
                        ${block.source.url}
                    </a>
                    ${block.description ? `
                        <p class="block-text">${block.description}</p>
                    ` : ''}
                </div>
            `;
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
    
    elements.channelTitle.innerHTML = `${channel.title} ${blockCountText}`;
    elements.fixedChannelTitle.innerHTML = `${channel.title} ${blockCountText}`;
    
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
    
    // Add content based on block type
    switch (block.class) {
        case 'Image':
            if (block.image) {
                content.classList.add('is-image');
                
                // Add image header if title or date exists
                if (block.title || block.connected_at) {
                    const header = document.createElement('div');
                    header.className = 'modal-image-header';
                    
                    if (block.title) {
                        const title = document.createElement('h2');
                        title.className = 'modal-image-title';
                        title.textContent = block.title;
                        header.appendChild(title);
                    }
                    
                    if (block.connected_at) {
                        const date = document.createElement('div');
                        date.className = 'modal-image-date';
                        date.textContent = `${formatDate(block.connected_at)} at ${formatTime(block.connected_at)}`;
                        header.appendChild(date);
                    }
                    
                    content.appendChild(header);
                }
                
                const img = document.createElement('img');
                img.src = block.image.display.url;
                img.alt = block.title || 'Image';
                content.appendChild(img);
            }
            break;
            
        case 'Text':
            const textContainer = document.createElement('div');
            textContainer.className = 'modal-text-container';
            textContainer.innerHTML = `<p>${block.content}</p>`;
            content.appendChild(textContainer);
            
            // Add header for text content
            if (block.title || block.connected_at) {
                const header = document.createElement('div');
                header.className = 'modal-text-header';
                
                if (block.title) {
                    const title = document.createElement('h2');
                    title.className = 'modal-text-title';
                    title.textContent = block.title;
                    header.appendChild(title);
                }
                
                if (block.connected_at) {
                    const date = document.createElement('div');
                    date.className = 'modal-text-date';
                    date.textContent = `${formatDate(block.connected_at)} at ${formatTime(block.connected_at)}`;
                    header.appendChild(date);
                }
                
                content.appendChild(header);
            }
            break;
            
        case 'Link':
            const linkContainer = document.createElement('div');
            linkContainer.className = 'modal-text-container';
            linkContainer.innerHTML = `
                <a href="${block.source.url}" target="_blank" class="block-link">
                    ${block.title || block.source.url}
                </a>
                ${block.description ? `<p>${block.description}</p>` : ''}
            `;
            content.appendChild(linkContainer);
            
            // Add header for link content
            if (block.title || block.connected_at) {
                const header = document.createElement('div');
                header.className = 'modal-text-header';
                
                if (block.title) {
                    const title = document.createElement('h2');
                    title.className = 'modal-text-title';
                    title.textContent = block.title;
                    header.appendChild(title);
                }
                
                if (block.connected_at) {
                    const date = document.createElement('div');
                    date.className = 'modal-text-date';
                    date.textContent = `${formatDate(block.connected_at)} at ${formatTime(block.connected_at)}`;
                    header.appendChild(date);
                }
                
                content.appendChild(header);
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

// Debounce helper function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}