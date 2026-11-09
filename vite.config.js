import { defineConfig } from 'vite';

// Relative assets let the same build run at / and GitHub Pages' /mosnterdb/.
export default defineConfig({ base: './' });
