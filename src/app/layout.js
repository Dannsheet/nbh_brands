// app/layout.js
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import ConditionalNavbar from "../components/ConditionalNavbar";
import Footer from "../components/Footer";

// 👇 importamos lo nuevo
import { CartProvider } from "@/context/CartContext";
import { Toaster } from "react-hot-toast";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata = {
  title: "NBH Brands",
  description: "Tienda urbana streetwear",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="bg-primary text-accent font-inter uppercase">
        {/* 👇 envolvemos la app */}
        <CartProvider>
          <ConditionalNavbar />
          <main style={{ scrollSnapType: "y mandatory", WebkitOverflowScrolling: "touch" }}>
            {children}
          </main>
          <Footer />
          <Analytics />
          <SpeedInsights />
          {/* 👇 Toaster para notificaciones */}
          <Toaster position="bottom-right" />
        </CartProvider>
      </body>
    </html>
  );
}
