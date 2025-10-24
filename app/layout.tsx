import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "R1D3 Framework Visualizer",
  description: "Interactive graph visualization for exploring R1D3 cybersecurity framework concepts",
  keywords: ["R1D3", "cybersecurity", "framework", "visualization", "graph"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
