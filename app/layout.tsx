import type { Metadata } from "next";
import Script from "next/script";
import "bootstrap/dist/css/bootstrap.min.css";
import "@/css/style.css";
import "@/css/navbar.css";
import "@/css/login-modal.css";
import Navbar from "@/components/Navbar";
import LoginModal from "@/components/LoginModal";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "NoseBoop - Find Your Dog's Perfect Match",
  description:
    "Meet new and interesting dogs nearby. The premier dating app for dogs and their owners.",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <LoginModal />
        {children}
        <Footer />
        <Script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
