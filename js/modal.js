let isModalOpen = false;
let currentBlockIndex = 0;
let isLoading = false;

// Wait for state to be available
function waitForState() {
    return new Promise((resolve) => {
        if (window.state) {
            resolve(window.state);
        } else {
            const checkState = setInterval(() => {
                if (window.state) {
                    clearInterval(checkState);
                    resolve(window.state);
                }
            }, 100);
        }
    });
}

async function openModal(initialIndex = 0) {
    const state = await waitForState();
    isModalOpen = true;
    currentBlockIndex = initialIndex;
    
    // Get blocks from the main state
    const blocks = state.currentBlocks || [];
    if (blocks.length === 0) {
        console.error('No blocks available');
        return;
    }
    
    // Show the modal
    const modal = document.getElementById('blockModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }
    
    showBlock(currentBlockIndex);
    updateBlockNavigation();
}

function closeModal() {
    isModalOpen = false;
    const modal = document.getElementById('blockModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = ''; // Restore scrolling
    }
}

function initializeModal() {
    const modalContent = document.querySelector('.modal-content');
    const modalClose = document.querySelector('.modal-close');
    const modalOverlay = document.querySelector('.modal-overlay');
    const modalPrev = document.querySelector('.modal-prev');
    const modalNext = document.querySelector('.modal-next');
    
    if (modalContent) {
        modalContent.addEventListener('scroll', handleModalScroll);
    }
    
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    
    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeModal);
    }
    
    if (modalPrev) {
        modalPrev.addEventListener('click', showPreviousBlock);
    }
    
    if (modalNext) {
        modalNext.addEventListener('click', showNextBlock);
    }
    
    // Add keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (isModalOpen) {
            if (e.key === 'Escape') closeModal();
            if (e.key === 'ArrowLeft') showPreviousBlock();
            if (e.key === 'ArrowRight') showNextBlock();
        }
    });
}

async function handleModalScroll() {
    if (!isModalOpen || isLoading) return;
    const state = await waitForState();

    const modalContent = document.querySelector('.modal-content');
    const scrollPosition = modalContent.scrollTop + modalContent.clientHeight;
    const totalHeight = modalContent.scrollHeight;
    
    // If we're near the bottom (within 200px) and there are more blocks to load
    if (totalHeight - scrollPosition < 200 && state.hasMore && typeof window.loadMoreBlocks === 'function') {
        window.loadMoreBlocks();
    }
}

async function showNextBlock() {
    const state = await waitForState();
    const blocks = state.currentBlocks || [];
    if (currentBlockIndex < blocks.length - 1) {
        currentBlockIndex++;
        showBlock(currentBlockIndex);
        updateBlockNavigation();
        
        // If we're near the end and there are more blocks to load
        if (state.hasMore && currentBlockIndex >= blocks.length - 3 && typeof window.loadMoreBlocks === 'function') {
            window.loadMoreBlocks();
        }
    }
}

async function showPreviousBlock() {
    if (currentBlockIndex > 0) {
        currentBlockIndex--;
        showBlock(currentBlockIndex);
        updateBlockNavigation();
    }
}

async function showBlock(index) {
    const state = await waitForState();
    const blocks = state.currentBlocks || [];
    const block = blocks[index];
    if (!block) return;

    const modalContent = document.querySelector('.modal-content');
    const modalBody = document.querySelector('.modal-body');
    const headerTitle = document.querySelector('.modal-header-title');
    const headerDate = document.querySelector('.modal-header-date');
    
    if (modalBody) {
        modalBody.innerHTML = ''; // Clear current content
        const blockElement = createModalBlock(block);
        modalBody.appendChild(blockElement);
    }
    
    // Update header - only show date
    if (headerDate) {
        headerDate.textContent = block.connected_at ? 
            formatDate(block.connected_at) : '';
    }
}

function createModalBlock(block) {
    const blockContainer = document.createElement('div');
    blockContainer.className = 'modal-block';
    
    // Create content based on block type
    const content = document.createElement('div');
    content.className = 'modal-block-content';
    
    if (block.class === 'Image' && block.image) {
        const img = document.createElement('img');
        img.src = block.image.display.url;
        img.alt = block.title || '';
        content.appendChild(img);
    } else if (block.class === 'Text') {
        const textContainer = document.createElement('div');
        textContainer.className = 'modal-text-container';
        textContainer.textContent = block.content || '';
        content.appendChild(textContainer);
    } else if (block.class === 'Link' || block.class === 'Media') {
        const youtubeId = block.source?.url ? getYouTubeVideoId(block.source.url) : null;
        if (youtubeId) {
            const videoContainer = document.createElement('div');
            videoContainer.className = 'video-container';
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
            // Create a container for link content
            const linkContainer = document.createElement('div');
            linkContainer.className = 'modal-link-container';

            // Add the image if available
            if (block.image && block.image.display) {
                const img = document.createElement('img');
                img.src = block.image.display.url;
                img.alt = block.title || '';
                linkContainer.appendChild(img);
            }

            // Add link information
            const infoContainer = document.createElement('div');
            infoContainer.className = 'modal-info-container';
            
            // Add block title if available
            if (block.title) {
                const title = document.createElement('h2');
                title.className = 'modal-info-title';
                title.textContent = block.title;
                infoContainer.appendChild(title);
            }

            // Add source URL if available
            if (block.source?.url) {
                const sourceUrl = document.createElement('a');
                sourceUrl.href = block.source.url;
                sourceUrl.target = '_blank';
                sourceUrl.rel = 'noopener noreferrer';
                sourceUrl.className = 'modal-info-link';
                sourceUrl.textContent = block.source.url;
                infoContainer.appendChild(sourceUrl);
            }
            
            // Add source description if available
            if (block.source?.description) {
                const sourceDescription = document.createElement('p');
                sourceDescription.className = 'modal-info-description';
                sourceDescription.textContent = block.source.description;
                infoContainer.appendChild(sourceDescription);
            }
            
            // Add block description if available
            if (block.description) {
                const description = document.createElement('p');
                description.className = 'modal-info-description';
                description.textContent = block.description;
                infoContainer.appendChild(description);
            }

            // Add block content if available
            if (block.content) {
                const contentContainer = document.createElement('div');
                contentContainer.className = 'modal-content-container';
                contentContainer.textContent = block.content;
                infoContainer.appendChild(contentContainer);
            }
            
            linkContainer.appendChild(infoContainer);
            content.appendChild(linkContainer);
        }
    } else {
        // Handle any other unsupported block types
        const infoContainer = document.createElement('div');
        infoContainer.className = 'modal-info-container';
        
        // Add block title if available
        if (block.title) {
            const title = document.createElement('h2');
            title.className = 'modal-info-title';
            title.textContent = block.title;
            infoContainer.appendChild(title);
        }
        
        // Add block description if available
        if (block.description) {
            const description = document.createElement('p');
            description.className = 'modal-info-description';
            description.textContent = block.description;
            infoContainer.appendChild(description);
        }
        
        // Add message about unsupported type
        const unsupportedMessage = document.createElement('p');
        unsupportedMessage.className = 'modal-info-message';
        unsupportedMessage.textContent = `This is a ${block.class} block type.`;
        infoContainer.appendChild(unsupportedMessage);
        
        content.appendChild(infoContainer);
    }
    
    // Add Are.na link for all block types
    const arenaLink = document.createElement('a');
    arenaLink.href = `https://www.are.na/block/${block.id}`;
    arenaLink.target = '_blank';
    arenaLink.rel = 'noopener noreferrer';
    arenaLink.className = 'modal-arena-link';
    arenaLink.innerHTML = '<span class="material-icons">open_in_new</span> View on Are.na';
    blockContainer.appendChild(content);
    blockContainer.appendChild(arenaLink);
    
    return blockContainer;
}

async function updateBlockNavigation() {
    const state = await waitForState();
    const blocks = state.currentBlocks || [];
    const prevButton = document.querySelector('.modal-prev');
    const nextButton = document.querySelector('.modal-next');
    
    if (prevButton) {
        prevButton.classList.toggle('hidden', currentBlockIndex === 0);
    }
    
    if (nextButton) {
        const isLastBlock = currentBlockIndex === blocks.length - 1;
        nextButton.classList.toggle('hidden', isLastBlock && !state.hasMore);
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

function getYouTubeVideoId(url) {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

// Initialize modal when the page loads
document.addEventListener('DOMContentLoaded', initializeModal);

// Export functions that need to be accessed from other files
window.openModal = openModal; // Export directly to window for compatibility
window.modalFunctions = {
    get isModalOpen() { return isModalOpen; },
    get currentBlockIndex() { return currentBlockIndex; },
    openModal,
    closeModal,
    updateBlockNavigation,
    showNextBlock,
    showPreviousBlock,
    showBlock
}; 