import "./globals.css";
import Layout from "../components/Layout";
import { LayoutProvider } from "../context/LayoutContext";
import { Lora, Inter } from "next/font/google";

const lora = Lora({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-lora' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: "AssistEd",
  description: "A modern learning platform designed to enhance educational experiences",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/styles/powerpoint-layout.css" />
      </head>
      <body className={`${lora.variable} ${inter.variable} font-sans`}>
        <LayoutProvider>
          <Layout>{children}</Layout>
        </LayoutProvider>
      </body>
    </html>
  );
}