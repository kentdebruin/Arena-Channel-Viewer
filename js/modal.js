let isModalOpen = false;
let currentBlockIndex = 0;
let isLoading = false;
let lastLoadedPage = 1;
let loadedBlocks = [];
let hasMoreBlocks = true; // New flag to track if more blocks are available

async function openModal(initialIndex = 0) {
    isModalOpen = true;
    currentBlockIndex = initialIndex;
    
    // Reset state if opening fresh
    if (loadedBlocks.length === 0) {
        lastLoadedPage = 1;
        hasMoreBlocks = true;
        await loadMoreBlocks();
    }
    
    showBlock(currentBlockIndex);
    updateBlockNavigation();
}

function closeModal() {
    isModalOpen = false;
}

function initializeModal() {
    const modalContent = document.querySelector('.modal-content');
    if (modalContent) {
        modalContent.addEventListener('scroll', handleModalScroll);
    }
}

function handleModalScroll() {
    if (!isModalOpen || isLoading) return;

    const modalContent = document.querySelector('.modal-content');
    const scrollPosition = modalContent.scrollTop + modalContent.clientHeight;
    const totalHeight = modalContent.scrollHeight;
    
    // If we're near the bottom (within 200px), load more content
    if (totalHeight - scrollPosition < 200) {
        loadMoreBlocks();
    }
}

async function showNextBlock() {
    // Try to load more blocks if we're near the end
    if (hasMoreBlocks && currentBlockIndex >= loadedBlocks.length - 3) {
        await loadMoreBlocks();
    }
    
    if (currentBlockIndex < loadedBlocks.length - 1) {
        currentBlockIndex++;
        showBlock(currentBlockIndex);
        updateBlockNavigation();
    }
}

async function showPreviousBlock() {
    if (currentBlockIndex > 0) {
        currentBlockIndex--;
        showBlock(currentBlockIndex);
        updateBlockNavigation();
    }
}

function showBlock(index) {
    const block = loadedBlocks[index];
    if (!block) return;

    const modalContent = document.querySelector('.modal-content');
    modalContent.innerHTML = ''; // Clear current content
    const blockElement = createModalBlock(block);
    modalContent.appendChild(blockElement);
}

async function loadMoreBlocks() {
    if (isLoading || !hasMoreBlocks) return;
    isLoading = true;

    try {
        // Fetch next page of blocks
        const response = await fetch(`/api/blocks?page=${lastLoadedPage + 1}`);
        const newBlocks = await response.json();

        if (newBlocks && newBlocks.length > 0) {
            lastLoadedPage++;
            loadedBlocks = [...loadedBlocks, ...newBlocks];
            
            // If in fullscreen mode, proactively load more
            if (isModalOpen && hasMoreBlocks && currentBlockIndex >= loadedBlocks.length - 5) {
                setTimeout(() => loadMoreBlocks(), 100);
            }
        } else {
            hasMoreBlocks = false; // No more blocks available
        }
        
        updateBlockNavigation();
    } catch (error) {
        console.error('Error loading more blocks:', error);
        hasMoreBlocks = false; // Assume no more blocks on error
    } finally {
        isLoading = false;
    }
}

function appendBlocksToModal(blocks) {
    const modalContent = document.querySelector('.modal-content');
    
    blocks.forEach(block => {
        const blockElement = createModalBlock(block);
        modalContent.appendChild(blockElement);
    });
}

function createModalBlock(block) {
    const blockContainer = document.createElement('div');
    blockContainer.className = 'modal-block';
    
    // Create header with title and date
    const header = document.createElement('div');
    header.className = block.type === 'Image' ? 'modal-image-header' : 'modal-text-header';
    
    if (block.title) {
        const title = document.createElement('h2');
        title.className = block.type === 'Image' ? 'modal-image-title' : 'modal-text-title';
        title.textContent = block.title;
        header.appendChild(title);
    }
    
    if (block.date) {
        const date = document.createElement('div');
        date.className = block.type === 'Image' ? 'modal-image-date' : 'modal-text-date';
        date.textContent = formatDate(block.date);
        header.appendChild(date);
    }
    
    blockContainer.appendChild(header);

    // Create content based on block type
    const content = document.createElement('div');
    content.className = 'modal-block-content';
    
    if (block.type === 'Image' && block.image) {
        const img = document.createElement('img');
        img.src = block.image;
        img.alt = block.title || '';
        content.appendChild(img);
    } else {
        const textContainer = document.createElement('div');
        textContainer.className = 'modal-text-container';
        textContainer.textContent = block.content || '';
        content.appendChild(textContainer);
    }
    
    blockContainer.appendChild(content);
    return blockContainer;
}

function updateBlockNavigation() {
    const prevButton = document.querySelector('.modal-prev');
    const nextButton = document.querySelector('.modal-next');
    
    if (prevButton) {
        prevButton.classList.toggle('hidden', currentBlockIndex === 0);
    }
    
    if (nextButton) {
        const isLastBlock = currentBlockIndex === loadedBlocks.length - 1;
        nextButton.classList.toggle('hidden', isLastBlock && !hasMoreBlocks);
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Initialize modal when the page loads
document.addEventListener('DOMContentLoaded', initializeModal);

// Export functions that need to be accessed from other files
window.modalFunctions = {
    get isModalOpen() { return isModalOpen; },
    get currentBlockIndex() { return currentBlockIndex; },
    get loadedBlocksCount() { return loadedBlocks.length; },
    get hasMoreBlocks() { return hasMoreBlocks; },
    openModal,
    closeModal,
    loadMoreBlocks,
    updateBlockNavigation,
    showNextBlock,
    showPreviousBlock,
    showBlock
}; 