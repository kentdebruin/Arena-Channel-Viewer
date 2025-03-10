// Command+K search functionality
export class CommandKSearch {
    constructor() {
        this.init();
        this.bindEvents();
    }

    init() {
        // Create and append the modal HTML
        const modal = document.createElement('div');
        modal.className = 'command-k-overlay';
        modal.innerHTML = `
            <div class="command-k-modal">
                <div class="command-k-search">
                    <span class="material-icons">search</span>
                    <input type="text" placeholder="Search channels or paste an Are.na URL...">
                </div>
                <div class="command-k-results"></div>
                <div class="command-k-shortcut">
                    <span>esc</span>
                    <kbd>esc</kbd>
                    <span>to close</span>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Store elements
        this.overlay = modal;
        this.modal = modal.querySelector('.command-k-modal');
        this.input = modal.querySelector('input');
        this.results = modal.querySelector('.command-k-results');
        this.selectedIndex = -1;
        this.channels = [];
    }

    bindEvents() {
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Command/Ctrl + K to open
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                this.open();
            }

            // Escape to close
            if (e.key === 'Escape' && this.isOpen()) {
                this.close();
            }
        });

        // Search input events
        this.input.addEventListener('input', () => {
            this.handleSearch();
        });

        // Keyboard navigation
        this.input.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    this.selectNext();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.selectPrevious();
                    break;
                case 'Enter':
                    e.preventDefault();
                    this.handleEnter();
                    break;
            }
        });

        // Close on overlay click
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });
    }

    extractChannelSlug(input) {
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

    async handleSearch() {
        const query = this.input.value.trim();
        
        console.log('Search query:', query);
        console.log('Available channels:', window.CHANNELS_CONFIG);
        
        if (!query) {
            // Show all channels when search is empty
            this.channels = window.CHANNELS_CONFIG.map(channel => channel.slug);
            console.log('Empty query - showing all channels:', this.channels);
            this.renderResults();
            return;
        }

        // Check if it's a direct channel URL
        if (query.includes('are.na/')) {
            const slug = this.extractChannelSlug(query);
            console.log('Direct Are.na URL detected - slug:', slug);
            this.results.innerHTML = `
                <div class="command-k-result" data-slug="${slug}">
                    <span class="material-icons">arrow_forward</span>
                    <span class="channel-title">Go to channel: ${slug}</span>
                </div>
            `;
            
            // Add click handler
            const directResult = this.results.querySelector('.command-k-result');
            directResult.addEventListener('click', () => {
                this.navigateToChannel(slug);
            });
            
            this.channels = [slug];
            this.selectedIndex = 0;
            return;
        }

        try {
            // Filter channels based on the query
            const filteredChannels = window.CHANNELS_CONFIG.filter(channel => {
                const titleMatch = channel.title.toLowerCase().includes(query.toLowerCase());
                const slugMatch = channel.slug.toLowerCase().includes(query.toLowerCase());
                console.log(`Checking channel - Title: ${channel.title}, Slug: ${channel.slug}, Matches: ${titleMatch || slugMatch}`);
                return titleMatch || slugMatch;
            }).map(channel => channel.slug);

            console.log('Filtered channels:', filteredChannels);
            this.channels = filteredChannels;
            this.renderResults();
        } catch (error) {
            console.error('Search error:', error);
            this.showError();
        }
    }

    renderResults() {
        if (!this.channels.length) {
            this.showEmptyState();
            return;
        }

        this.results.innerHTML = '';
        this.channels.forEach((channelSlug, index) => {
            // Find the channel config for this slug
            const channelConfig = window.CHANNELS_CONFIG.find(c => c.slug === channelSlug);
            if (!channelConfig) return;

            const result = document.createElement('div');
            result.className = 'command-k-result';
            if (index === this.selectedIndex) {
                result.classList.add('selected');
            }
            result.innerHTML = `
                <div class="channel-info">
                    <span class="channel-title">${channelConfig.title}</span>
                    <span class="channel-description">${channelConfig.description || ''}</span>
                </div>
            `;
            result.addEventListener('click', () => {
                this.navigateToChannel(channelSlug);
            });
            this.results.appendChild(result);
        });
    }

    showEmptyState() {
        this.results.innerHTML = `
            <div class="command-k-empty">
                No channels found
            </div>
        `;
    }

    showError() {
        this.results.innerHTML = `
            <div class="command-k-empty">
                An error occurred while searching
            </div>
        `;
    }

    selectNext() {
        if (this.selectedIndex < this.channels.length - 1) {
            this.selectedIndex++;
            this.renderResults();
        }
    }

    selectPrevious() {
        if (this.selectedIndex > 0) {
            this.selectedIndex--;
            this.renderResults();
        }
    }

    handleEnter() {
        if (this.selectedIndex >= 0 && this.selectedIndex < this.channels.length) {
            this.navigateToChannel(this.channels[this.selectedIndex]);
        } else {
            // If no selection but we have input, try to navigate directly
            const query = this.input.value.trim();
            if (query) {
                const slug = this.extractChannelSlug(query);
                this.navigateToChannel(slug);
            }
        }
    }

    navigateToChannel(channel) {
        window.location.href = `channel.html?channel=${channel}`;
        this.close();
    }

    open() {
        this.overlay.classList.add('active');
        this.input.value = '';
        this.input.focus();
        this.selectedIndex = -1;
        // Show all channels when opening
        this.channels = window.state.featuredChannels;
        this.renderResults();
    }

    close() {
        this.overlay.classList.remove('active');
        this.input.value = '';
        this.selectedIndex = -1;
    }

    isOpen() {
        return this.overlay.classList.contains('active');
    }
} 