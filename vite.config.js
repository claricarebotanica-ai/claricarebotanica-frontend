import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    watch: {
      // Chokidar's glob matching can miss these paths on Windows; regexes match
      // the absolute path regardless of slash direction.
      ignored: [/claricare-logo\.jpg$/i, /claricare-hero\.mp4$/i, /about-product-source\.png$/i],
    },
  },
});
