/**
 * main.tsx — Titik Masuk Aplikasi React
 *
 * File ini adalah entry point untuk frontend React.
 * Menginisialisasi:
 * 1. React StrictMode: mendeteksi masalah potensial saat development
 * 2. BrowserRouter: routing berbasis URL untuk SPA (Single Page Application)
 * 3. App: komponen root yang berisi definisi route
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css"; // Import global styles (Tailwind + custom CSS)

// Render aplikasi ke elemen #root di index.html
// biome-ignore lint/style/noNonNullAssertion: elemen #root dijamin ada di index.html
createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<BrowserRouter>
			<App />
		</BrowserRouter>
	</StrictMode>,
);
