// app/layout.js
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export const metadata = {
  title: "NBH Brands",
  description: "Tienda urbana streetwear",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="bg-primary text-accent font-inter uppercase">
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
