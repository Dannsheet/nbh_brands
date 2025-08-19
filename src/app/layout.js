// app/layout.js
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import ConditionalNavbar from "../components/ConditionalNavbar";
import Footer from "../components/Footer";

// 👇 importamos lo nuevo
import { CartProvider } from "@/context/CartContext";
import { Toaster } from "react-hot-toast";

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
          {children}
          <Footer />
          {/* 👇 Toaster para notificaciones */}
          <Toaster position="top-right" />
        </CartProvider>
        <Analytics />
      </body>
    </html>
  );
}
