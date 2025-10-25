import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            // Proxy /api/* to backend at localhost:5000
            "/api": {
                target: "http://localhost:4000",
                changeOrigin: true,
                secure: false,
            },
        },
    },
});
