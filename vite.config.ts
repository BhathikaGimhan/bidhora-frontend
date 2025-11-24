import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: {
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://test-payment.geniebiz.lk https://payment.geniebiz.lk https://www.google-analytics.com https://maxcdn.bootstrapcdn.com https://apis.google.com https://accounts.google.com https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://maxcdn.bootstrapcdn.com https://accounts.google.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' ws: wss: http://localhost:8080 https://api-e7fpchtlna-uc.a.run.app https://geniepayment-e7fpchtlna-uc.a.run.app https://geniepayment-e7fpchtlna-uc.a.run.app/ https://api.bidhora.com https://us-central1-bidhora.cloudfunctions.net https://sendcontactemail-e7fpchtlna-uc.a.run.app https://test-payment.geniebiz.lk https://payment.geniebiz.lk https://firestore.googleapis.com https://*.googleapis.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com; frame-src 'self' https://test-payment.geniebiz.lk https://payment.geniebiz.lk https://accounts.google.com https://bidhora.firebaseapp.com https://bidhora.web.app https://bidhora.com https://www.bidhora.com; object-src 'none'; base-uri 'self';",
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "SAMEORIGIN",
      "X-XSS-Protection": "1; mode=block",
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(
    Boolean
  ),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
