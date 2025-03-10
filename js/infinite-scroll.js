/**
 * Infinite scrolling functionality
 */

import { API, fetchWithRetry } from './api.js';
import { initializeBlockObservers } from './observers.js';
import { renderBlocks } from './blocks.js';

/**
 * Add infinite scroll trigger element
 * @param {Object} state - Application state
 * @param {Object} elements - DOM elements
 * @param {IntersectionObserver} observer - Infinite scroll observer
 */
function addInfiniteScrollTrigger(state, elements, observer) {
    removeInfiniteScrollTrigger(observer);
    
    const trigger = document.createElement('div');
    trigger.className = 'infinite-scroll-trigger';
    trigger.style.height = '1px';
    trigger.style.width = '100%';
    
    if (state.currentView === 'grid') {
        elements.blocksGrid.appendChild(trigger);
    } else {
        elements.blocksDiary.appendChild(trigger);
    }
    
    observer.observe(trigger);
}

/**
 * Remove infinite scroll trigger
 * @param {IntersectionObserver} observer - Infinite scroll observer
 */
function removeInfiniteScrollTrigger(observer) {
    const existingTrigger = document.querySelector('.infinite-scroll-trigger');
    if (existingTrigger) {
        observer.unobserve(existingTrigger);
        existingTrigger.remove();
    }
}

/**
 * Load more blocks when scrolling
 * @param {Object} state - Application state
 * @param {Object} elements - DOM elements
 * @param {IntersectionObserver} infiniteScrollObserver - Infinite scroll observer
 */
async function loadMoreBlocks(state, elements, infiniteScrollObserver) {
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

        const data = await fetchWithRetry(
            API.channelContents(state.currentChannel, state.currentPage, state.perPage)
        );
        
        if (data && data.contents && data.contents.length > 0) {
            // Add new blocks to state
            state.currentBlocks = [...state.currentBlocks, ...data.contents];
            
            // Remove loading indicator
            loadingIndicator.remove();
            
            // Render new blocks
            renderBlocks(data.contents, true, state, elements);
            
            // Update hasMore based on whether we got a full page of results
            state.hasMore = data.contents.length === state.perPage;
            
            // Add infinite scroll trigger if there might be more blocks
            if (state.hasMore) {
                addInfiniteScrollTrigger(state, elements, infiniteScrollObserver);
            }
        } else {
            state.hasMore = false;
            removeInfiniteScrollTrigger(infiniteScrollObserver);
        }
    } catch (error) {
        console.error('Error loading more blocks:', error);
        state.hasMore = false;
        removeInfiniteScrollTrigger(infiniteScrollObserver);
    } finally {
        state.loadingMore = false;
        // Remove loading indicator if it still exists
        const loadingIndicator = document.querySelector('.loading-more');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }
    }
}

export { addInfiniteScrollTrigger, removeInfiniteScrollTrigger, loadMoreBlocks }; 