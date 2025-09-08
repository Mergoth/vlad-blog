import { visit } from 'unist-util-visit'
import fs from 'fs'
import path from 'path'

// CASCADE: Remark plugin to convert carousel hints to HTML with embedded React component
export function remarkPhotoCarousel() {
  return (tree, file) => {
    let hasCarousels = false
    
    visit(tree, 'image', (node, index, parent) => {
      const { url, alt } = node
      
      // CASCADE: Detect carousel by lack of extension in the Markdown image URL
      const urlPath = url.replace(/^\//, '') // Remove leading slash
      const rawExt = path.extname(urlPath)
      if (rawExt) {
        // Has an extension => treat as a normal image, do not transform
        return
      }
      
      // CASCADE: Extract base path and name from URL
      const basePath = path.dirname(urlPath)
      const fileName = path.basename(urlPath)
      // Try common extensions in order
      const candidateExts = ['.jpg', '.jpeg', '.png', '.webp']
      let chosenExt = null
      
      // CASCADE: Find all numbered images in public directory
      const publicDir = path.join(process.cwd(), 'public')
      const imageDir = path.join(publicDir, basePath)
      
      if (!fs.existsSync(imageDir)) {
        console.warn(`CASCADE: Image directory not found: ${imageDir}`)
        return
      }
      
      let images = []
      for (const ext of candidateExts) {
        const found = []
        let counter = 1
        // CASCADE: Look for sequentially numbered images: basename-1.ext, basename-2.ext, ...
        // Stop at first missing number to keep it simple
        while (true) {
          const imagePath = path.join(imageDir, `${fileName}-${counter}${ext}`)
          if (fs.existsSync(imagePath)) {
            found.push(`/${basePath}/${fileName}-${counter}${ext}`)
            counter++
          } else {
            break
          }
        }
        if (found.length > 0) {
          images = found
          chosenExt = ext
          break
        }
      }
      
      // CASCADE: If no numbered images found, keep original
      if (images.length === 0) {
        console.warn(`CASCADE: No carousel images found for pattern: ${fileName}-*.[jpg|jpeg|png|webp] in ${imageDir}`)
        return
      }
      
      console.log(`CASCADE: Found ${images.length} carousel images for ${fileName}:`, images)
      hasCarousels = true
      
      // CASCADE: Create unique ID for this carousel
      const carouselId = `carousel-${Math.random().toString(36).substr(2, 9)}`
      const cleanAlt = alt.replace(/hint/i, '').trim() || 'Photo carousel'
      
      // CASCADE: Generate Splide markup for robust, smooth carousels
      const carouselHtml = images.length === 1 
        ? `<img src="${images[0]}" alt="${cleanAlt}" class="w-full h-auto rounded-lg" />`
        : `
<div id="${carouselId}" class="splide" data-cascade>
  <div class="splide__track rounded-lg overflow-hidden bg-gray-100">
    <ul class="splide__list">
      ${images.map((src, index) =>
        `<li class=\"splide__slide\"><img src=\"${src}\" alt=\"${cleanAlt} ${index + 1}\" class=\"block w-full h-auto object-cover\" loading=\"lazy\" /></li>`
      ).join('')}
    </ul>
  </div>
</div>`;

      const carouselNode = {
        type: 'html',
        value: carouselHtml
      }
      
      // CASCADE: Replace the image node
      parent.children[index] = carouselNode
    })
    
    // CASCADE: Add Splide assets and init script if carousels were found (optimized for memory)
    if (hasCarousels) {
      tree.children.push({
        type: 'html',
        value: `
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/css/splide.min.css" />
<style>
  .splide__pagination { gap: 0.5rem; margin-top: 0.75rem; }
  .splide__pagination__page { width: 8px; height: 8px; background-color: #d1d5db; opacity: 1; }
  .splide__pagination__page.is-active { background-color: #2563eb; transform: none; }
  .splide[data-cascade] .splide__track { aspect-ratio: 16 / 9; }
  @media (max-width: 640px) { .splide[data-cascade] .splide__track { aspect-ratio: 4 / 3; } }
  .splide[data-cascade] .splide__slide { display:flex; align-items:center; justify-content:center; background:#f3f4f6; }
  .splide[data-cascade] .splide__slide img { width:100%; height:100%; object-fit: contain; }
</style>
<script src="https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/js/splide.min.js"></script>
<script>
  // CASCADE: Memory-optimized carousel init with cleanup
  (function() {
    var initialized = false;
    function initCarousels() {
      if (initialized) return;
      initialized = true;
      var carousels = document.querySelectorAll('.splide[data-cascade]:not([data-splide-initialized])');
      carousels.forEach(function (el) {
        el.setAttribute('data-splide-initialized', 'true');
        try {
          var splide = new Splide(el, {
            type: 'loop', perPage: 1, speed: 500, drag: true, pagination: true, arrows: true,
            keyboard: false, gap: '0.5rem', autoplay: true, interval: 4000,
            pauseOnHover: true, pauseOnFocus: true, heightRatio: 0.5625
          });
          splide.mount();
        } catch (e) { console.warn('CASCADE: Splide init failed:', e); }
      });
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initCarousels);
    } else {
      initCarousels();
    }
  })();
</script>`
      })
    }
  }
}
