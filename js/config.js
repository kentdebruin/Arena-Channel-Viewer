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
 * - sampleImage: Main image URL to use as fallback if API fails
 * - sampleImages: Array of additional image URLs for slideshow effect
 */

const CHANNELS_CONFIG = [
    {
        title: "It's a Vibe",
        slug: "it-s-a-vibe",
        description: "Collection of vibes and aesthetic inspirations.",
        length: 0,
        sampleImage: "https://d2w9rnfcy7mm78.cloudfront.net/11075925/original_b5e0b5e0b5e0b5e0b5e0b5e0b5e0b5e0.jpg",
        sampleImages: [
            "https://d2w9rnfcy7mm78.cloudfront.net/11075926/original_c5b13e70a9e3ffe7a1eb1a0e7eef55d5.jpg",
            "https://d2w9rnfcy7mm78.cloudfront.net/11075927/original_d8b5e0042c3bfbcb3c9e773e248e0622.jpg",
            "https://d2w9rnfcy7mm78.cloudfront.net/11075928/original_9d1b6b2d5b5e7d58a22216d9c7b1f7a9.jpg"
        ]
    },
    {
        title: "Accidental Baroque",
        slug: "accidental-baroque",
        description: "a collection of accidental baroque"
    },
    {
        title: "Interior 2030",
        slug: "interior-2030",
        description: "What I think is good living in a house",
        length: 0,
        sampleImage: "https://d2w9rnfcy7mm78.cloudfront.net/11075921/original_b5e0b5e0b5e0b5e0b5e0b5e0b5e0b5e0.jpg",
        sampleImages: [
            "https://d2w9rnfcy7mm78.cloudfront.net/11075922/original_c5b13e70a9e3ffe7a1eb1a0e7eef55d5.jpg",
            "https://d2w9rnfcy7mm78.cloudfront.net/11075923/original_d8b5e0042c3bfbcb3c9e773e248e0622.jpg",
            "https://d2w9rnfcy7mm78.cloudfront.net/11075924/original_9d1b6b2d5b5e7d58a22216d9c7b1f7a9.jpg"
        ]
    },
    {
        title: "Business Cards",
        slug: "business-cards-gk-eigsa-4s",
        description: "Collection of business card designs and inspiration."
    },
    {
        title: "Photography",
        slug: "photography-o9r85qh8qv8",
        description: "Curated collection of inspiring photography.",
        length: 0,
        sampleImage: "https://d2w9rnfcy7mm78.cloudfront.net/11075941/original_c5b13e70a9e3ffe7a1eb1a0e7eef55d5.jpg",
        sampleImages: [
            "https://d2w9rnfcy7mm78.cloudfront.net/11075942/original_d8b5e0042c3bfbcb3c9e773e248e0622.jpg",
            "https://d2w9rnfcy7mm78.cloudfront.net/11075943/original_9d1b6b2d5b5e7d58a22216d9c7b1f7a9.jpg",
            "https://d2w9rnfcy7mm78.cloudfront.net/11075944/original_a1eb1a0e7eef55d5c5b13e70a9e3ffe7.jpg"
        ]
    },
    {
        title: "Football is Life",
        slug: "football-is-life-5gfzfkrbvgq",
        description: "The beautiful game and its impact on life and culture."
    },
    {
        title: "Words",
        slug: "words-igfvslsuyr0",
        description: "A collection of meaningful words and phrases."
    },
    {
        title: "Graphic",
        slug: "graphic-03cnlqdnkyy",
        description: "Graphic design inspiration and visual concepts.",
        length: 0,
        sampleImage: "https://d2w9rnfcy7mm78.cloudfront.net/11075945/original_b5e0b5e0b5e0b5e0b5e0b5e0b5e0b5e0.jpg",
        sampleImages: [
            "https://d2w9rnfcy7mm78.cloudfront.net/11075946/original_c5b13e70a9e3ffe7a1eb1a0e7eef55d5.jpg",
            "https://d2w9rnfcy7mm78.cloudfront.net/11075947/original_d8b5e0042c3bfbcb3c9e773e248e0622.jpg",
            "https://d2w9rnfcy7mm78.cloudfront.net/11075948/original_9d1b6b2d5b5e7d58a22216d9c7b1f7a9.jpg"
        ]
    },
    {
        title: "Sustainable UX",
        slug: "sustainable-ux",
        description: "Exploring sustainable practices in user experience design."
    },
    {
        title: "Human and Their Computer",
        slug: "human-and-their-computer",
        description: "The relationship between humans and technology."
    },
    {
        title: "The Good Software",
        slug: "the-good-software",
        description: "Examples and principles of well-designed software."
    },
    {
        title: "Photography Campaign",
        slug: "photography-campaign-gbdhtdhgmhc",
        description: "Visual storytelling through photography campaigns."
    },
    {
        title: "Mind of the Machine",
        slug: "mind-of-the-machine",
        description: "Exploring artificial intelligence and machine learning concepts."
    },
    {
        title: "Artificial Complexity",
        slug: "artificial-complexity",
        description: "A collection exploring artificial complexity in design and technology.",
        length: 42,
        sampleImage: "https://d2w9rnfcy7mm78.cloudfront.net/11075897/original_9d1b6b2d5b5e7d58a22216d9c7b1f7a9.jpg",
        sampleImages: [
            "https://d2w9rnfcy7mm78.cloudfront.net/11075898/original_d8b5e0042c3bfbcb3c9e773e248e0622.jpg",
            "https://d2w9rnfcy7mm78.cloudfront.net/11075899/original_a1eb1a0e7eef55d5c5b13e70a9e3ffe7.jpg",
            "https://d2w9rnfcy7mm78.cloudfront.net/11075900/original_4a15a9f5e3c1f8b5e0b5e0b5e0b5e0b5.jpg"
        ]
    },
    {
        title: "Time and the Future",
        slug: "time-and-the-future",
        description: "Explorations of time, futurism, and temporal concepts.",
        length: 38,
        sampleImage: "https://d2w9rnfcy7mm78.cloudfront.net/11075901/original_b5e0b5e0b5e0b5e0b5e0b5e0b5e0b5e0.jpg",
        sampleImages: [
            "https://d2w9rnfcy7mm78.cloudfront.net/11075902/original_c5b13e70a9e3ffe7a1eb1a0e7eef55d5.jpg",
            "https://d2w9rnfcy7mm78.cloudfront.net/11075903/original_d8b5e0042c3bfbcb3c9e773e248e0622.jpg",
            "https://d2w9rnfcy7mm78.cloudfront.net/11075904/original_9d1b6b2d5b5e7d58a22216d9c7b1f7a9.jpg"
        ]
    },
    {
        title: "Community Through the Lens",
        slug: "community-through-the-lens",
        description: "Visual explorations of community and connection.",
        length: 31,
        sampleImage: "https://d2w9rnfcy7mm78.cloudfront.net/11075909/original_9d1b6b2d5b5e7d58a22216d9c7b1f7a9.jpg",
        sampleImages: [
            "https://d2w9rnfcy7mm78.cloudfront.net/11075910/original_a1eb1a0e7eef55d5c5b13e70a9e3ffe7.jpg",
            "https://d2w9rnfcy7mm78.cloudfront.net/11075911/original_b5e0b5e0b5e0b5e0b5e0b5e0b5e0b5e0.jpg",
            "https://d2w9rnfcy7mm78.cloudfront.net/11075912/original_c5b13e70a9e3ffe7a1eb1a0e7eef55d5.jpg"
        ]
    },
    {
        title: "Tennis is Life",
        slug: "tennis-is-life",
        description: "The philosophy, aesthetics, and culture of tennis.",
        length: 27,
        sampleImage: "https://d2w9rnfcy7mm78.cloudfront.net/11075913/original_d8b5e0042c3bfbcb3c9e773e248e0622.jpg",
        sampleImages: [
            "https://d2w9rnfcy7mm78.cloudfront.net/11075914/original_9d1b6b2d5b5e7d58a22216d9c7b1f7a9.jpg",
            "https://d2w9rnfcy7mm78.cloudfront.net/11075915/original_a1eb1a0e7eef55d5c5b13e70a9e3ffe7.jpg",
            "https://d2w9rnfcy7mm78.cloudfront.net/11075916/original_b5e0b5e0b5e0b5e0b5e0b5e0b5e0b5e0.jpg"
        ]
    },
    {
        title: "Spatial Interfaces",
        slug: "spatial-interfaces",
        description: "Innovative approaches to spatial interface design.",
        length: 45,
        sampleImage: "https://d2w9rnfcy7mm78.cloudfront.net/11075917/original_c5b13e70a9e3ffe7a1eb1a0e7eef55d5.jpg",
        sampleImages: [
            "https://d2w9rnfcy7mm78.cloudfront.net/11075918/original_d8b5e0042c3bfbcb3c9e773e248e0622.jpg",
            "https://d2w9rnfcy7mm78.cloudfront.net/11075919/original_9d1b6b2d5b5e7d58a22216d9c7b1f7a9.jpg",
            "https://d2w9rnfcy7mm78.cloudfront.net/11075920/original_a1eb1a0e7eef55d5c5b13e70a9e3ffe7.jpg"
        ]
    },
    {
        title: "The Good Days",
        slug: "the-good-days",
        description: "Moments and memories of good days.",
        length: 0,
        sampleImage: "https://d2w9rnfcy7mm78.cloudfront.net/11075929/original_a1eb1a0e7eef55d5c5b13e70a9e3ffe7.jpg",
        sampleImages: [
            "https://d2w9rnfcy7mm78.cloudfront.net/11075930/original_b5e0b5e0b5e0b5e0b5e0b5e0b5e0b5e0.jpg",
            "https://d2w9rnfcy7mm78.cloudfront.net/11075931/original_c5b13e70a9e3ffe7a1eb1a0e7eef55d5.jpg",
            "https://d2w9rnfcy7mm78.cloudfront.net/11075932/original_d8b5e0042c3bfbcb3c9e773e248e0622.jpg"
        ]
    },
    {
        title: "Interface Metaphors",
        slug: "interface-metaphors",
        description: "Exploring metaphors in interface design.",
        length: 0,
        sampleImage: "https://d2w9rnfcy7mm78.cloudfront.net/11075933/original_9d1b6b2d5b5e7d58a22216d9c7b1f7a9.jpg",
        sampleImages: [
            "https://d2w9rnfcy7mm78.cloudfront.net/11075934/original_a1eb1a0e7eef55d5c5b13e70a9e3ffe7.jpg",
            "https://d2w9rnfcy7mm78.cloudfront.net/11075935/original_b5e0b5e0b5e0b5e0b5e0b5e0b5e0b5e0.jpg",
            "https://d2w9rnfcy7mm78.cloudfront.net/11075936/original_c5b13e70a9e3ffe7a1eb1a0e7eef55d5.jpg"
        ]
    },
    {
        title: "Book Design",
        slug: "book-design-90mbcfgysb4",
        description: "Inspirational book design and typography.",
        length: 0,
        sampleImage: "https://d2w9rnfcy7mm78.cloudfront.net/11075937/original_d8b5e0042c3bfbcb3c9e773e248e0622.jpg",
        sampleImages: [
            "https://d2w9rnfcy7mm78.cloudfront.net/11075938/original_9d1b6b2d5b5e7d58a22216d9c7b1f7a9.jpg",
            "https://d2w9rnfcy7mm78.cloudfront.net/11075939/original_a1eb1a0e7eef55d5c5b13e70a9e3ffe7.jpg",
            "https://d2w9rnfcy7mm78.cloudfront.net/11075940/original_b5e0b5e0b5e0b5e0b5e0b5e0b5e0b5e0.jpg"
        ]
    }
];

// Default user information
const USER_CONFIG = {
    full_name: "Kent"
}; 