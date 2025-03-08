/**
 * CHANNEL CONFIGURATION
 * 
 * This file contains the configuration for the channels displayed on the channels page.
 * You can easily add, remove, or reorder channels by modifying this file.
 * 
 * Each channel object should have the following properties:
 * - title: The display name of the channel
 * - slug: The URL slug of the channel (the part after are.na/channel/)
 * - description: A short description of the channel
 * - length: Approximate number of blocks (optional)
 */

const CHANNELS_CONFIG = [
    {
        title: "Artificial Complexity",
        slug: "artificial-complexity",
        description: "A collection exploring artificial complexity in design and technology.",
        length: 42
    },
    {
        title: "Time and the Future",
        slug: "time-and-the-future",
        description: "Explorations of time, futurism, and temporal concepts.",
        length: 38
    },
    {
        title: "Accidental Baroque",
        slug: "accidental-baroque",
        description: "Modern instances of accidental baroque aesthetics.",
        length: 56
    },
    {
        title: "Community Through the Lens",
        slug: "community-through-the-lens",
        description: "Visual explorations of community and connection.",
        length: 31
    },
    {
        title: "Tennis is Life",
        slug: "tennis-is-life",
        description: "The philosophy, aesthetics, and culture of tennis.",
        length: 27
    },
    {
        title: "Spatial Interfaces",
        slug: "spatial-interfaces",
        description: "Innovative approaches to spatial interface design.",
        length: 45
    }
];

// Default user information
const USER_CONFIG = {
    full_name: "Kent"
}; 