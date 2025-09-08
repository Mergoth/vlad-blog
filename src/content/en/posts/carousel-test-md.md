---
title: "Photo Carousel Test - Pure Markdown"
description: "Testing photo carousel functionality with pure markdown files"
date: 2025-01-08
draft: true
id: carousel-test-md
---

# Photo Carousel Test - Pure Markdown

This post demonstrates the new photo carousel functionality using pure `.md` files with the remark plugin.

## Camping Carousel

Here's a carousel of camping photos using the special syntax:

![Camping Hint](/images/motorhome/camping)

The system automatically detects `camping-1.jpg`, `camping-2.jpg`, `camping-3.jpg` and creates an interactive carousel.

## Scenery Photo

Single image example:

![Beautiful Scenery Hint](/images/motorhome/scenery)

This shows `scenery-1.jpg` as a regular image since there's only one.

## Regular Image (No Carousel)

This is a regular image without the "hint" keyword:

![Regular motorhome image](/images/motorhome/motorhome.jpg)

## How It Works

1. Use the syntax: `![Your Description Hint](/images/path/basename)`
2. Make sure you have numbered images: `basename-1.jpg`, `basename-2.jpg`, etc.
3. The remark plugin automatically detects and creates carousels
4. Single images display normally, multiple images get carousel functionality
5. No need to convert to `.mdx` - works with pure markdown!
