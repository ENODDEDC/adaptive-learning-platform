import "./globals.css";
import Layout from "../components/Layout";
import { LayoutProvider } from "../context/LayoutContext";
import { AdaptiveLayoutProvider } from "../context/AdaptiveLayoutContext";
import AutoClassificationWrapper from "../components/AutoClassificationWrapper";
import { Inter } from "next/font/google";

const inter = Inter({ 
  subsets: ['latin'], 
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
});

export const metadata = {
  title: "AssistEd",
  description: "A modern learning platform designed to enhance educational experiences",
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AutoClassificationWrapper>
          <AdaptiveLayoutProvider>
            <LayoutProvider>
              <Layout>
                <div className="page-transition-wrapper">
                  {children}
                </div>
              </Layout>
            </LayoutProvider>
          </AdaptiveLayoutProvider>
        </AutoClassificationWrapper>
      </body>
    </html>
  );
}