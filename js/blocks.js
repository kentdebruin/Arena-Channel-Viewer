/**
 * Block rendering and manipulation
 */

import { initializeBlockObservers } from './observers.js';
import { getYouTubeVideoId } from './youtube.js';

/**
 * Render blocks based on current view
 * @param {Array} blocks - Blocks to render
 * @param {boolean} append - Whether to append blocks or replace existing ones
 * @param {Object} state - Application state
 * @param {Object} elements - DOM elements
 */
function renderBlocks(blocks, append = false, state, elements) {
    const container = state.currentView === 'grid' ? elements.blocksGrid : elements.blocksDiary;
    
    if (!append) {
        container.innerHTML = '';
    }
    
    blocks.forEach(block => {
        const blockElement = createBlockElement(block, state);
        if (blockElement) {
            container.appendChild(blockElement);
        }
    });
    
    // Reinitialize observers for new blocks
    initializeBlockObservers();
}

/**
 * Create a block element
 * @param {Object} block - Block data
 * @param {Object} state - Application state
 * @returns {HTMLElement} The created block element
 */
function createBlockElement(block, state) {
    const container = document.createElement('div');
    container.className = 'block-container';
    
    const element = document.createElement('div');
    element.className = 'block';
    element.dataset.id = block.id;
    
    // Add appropriate class based on block type
    if (block.class === 'Image') {
        element.classList.add('is-image');
        if (block.image && block.image.display) {
            const img = document.createElement('img');
            img.loading = 'lazy';
            img.src = block.image.display.url;
            img.alt = block.title || '';
            element.appendChild(img);
        }
    } else if (block.class === 'Text') {
        element.classList.add('is-text');
        const textContent = document.createElement('div');
        textContent.className = 'text-content';
        textContent.textContent = block.content || '';
        element.appendChild(textContent);
    } else if (block.class === 'Link' || block.class === 'Media') {
        const youtubeId = block.source?.url ? getYouTubeVideoId(block.source.url) : null;
        if (youtubeId) {
            element.classList.add('is-video');
            const thumbnail = document.createElement('img');
            thumbnail.loading = 'lazy';
            thumbnail.src = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
            thumbnail.alt = block.title || 'Video thumbnail';
            element.appendChild(thumbnail);
            
            const playButton = document.createElement('button');
            playButton.className = 'play-button';
            playButton.innerHTML = '<span class="material-icons">play_arrow</span>';
            element.appendChild(playButton);
        } else if (block.image && block.image.display) {
            element.classList.add('is-link');
            const img = document.createElement('img');
            img.loading = 'lazy';
            img.src = block.image.display.url;
            img.alt = block.title || '';
            element.appendChild(img);
        }
    }
    
    // Add click handler to open modal
    element.addEventListener('click', () => {
        const index = state.currentBlocks.findIndex(b => b.id === block.id);
        if (typeof window.openModal === 'function') {
            window.openModal(index);
        } else if (typeof window.modalFunctions?.openModal === 'function') {
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

/**
 * Update channel information in the UI
 * @param {Object} channel - Channel data
 * @param {Object} elements - DOM elements
 */
function updateChannelInfo(channel, elements) {
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
    
    // Update document title
    document.title = `${channel.title} | Arena Channel Viewer`;
    
    // Show channel info
    elements.channelInfo.classList.remove('hidden');
}

export { renderBlocks, createBlockElement, updateChannelInfo }; 