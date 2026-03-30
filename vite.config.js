import { resolve } from 'path';

export default {
  root: './',
  base: '/project/',
  server: {
    port: 4000,
    cors: true
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        crossyRoad: resolve(__dirname, 'crossy-road/index.html'),
        tunnelBoat: resolve(__dirname, 'tunnel-boat/index.html'),
        globe: resolve(__dirname, '3d-globe/index.html'),
        neonTunnel: resolve(__dirname, 'neon-tunnel/index.html')
      }
    }
  }
}
