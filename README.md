# Arena Channel Viewer

A modern, responsive web application for viewing Are.na channels with an elegant interface. This viewer provides an enhanced way to browse and interact with Are.na channel content.

🌐 **[View Live Website](https://kentdebruin.github.io/Arena-Channel-Viewer/)**

## Features

- 🔍 Search and view any Are.na channel by slug
- 📱 Responsive design that works on desktop and mobile
- 👀 Two viewing modes:
  - Grid View: Traditional gallery layout
  - Diary View: Chronological timeline layout
- 🖼️ Modal view for detailed content viewing
- ⌨️ Keyboard navigation support in modal view
- 🔄 Infinite scrolling for seamless content loading
- ⚡ Fast loading with optimized performance
- 📅 Date-based content organization in diary view

## Usage

1. Enter an Are.na channel slug in the search bar
2. Press enter or click the arrow to load the channel
3. Toggle between Grid and Diary views using the view buttons
4. Click on any content to open it in modal view
5. Use arrow keys or buttons to navigate between items in modal view

## Default Channel

The application loads with a default channel "it-s-a-vibe" for immediate content viewing.

## Technical Details

Built using vanilla JavaScript, HTML, and CSS, with no external dependencies. The application interfaces with the Are.na API to fetch and display channel content.

### Key Components

- Responsive CSS Grid layout
- Infinite scroll implementation
- Modal viewer with keyboard navigation
- Dynamic content loading
- Error handling and loading states

## Development

To run this project locally:

1. Clone the repository
```bash
git clone https://github.com/kentdebruin/Arena-Channel-Viewer.git
```

2. Open `index.html` in your browser

3. Start exploring Are.na channels!

## Contributing

Feel free to submit issues and enhancement requests!

## Latest Update
- Added gradient overlay to grid view text blocks to indicate overflow content (Updated: 2025-03-02 18:31:07)
- Force rebuild of GitHub Pages site 