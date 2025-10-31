import "./globals.css";
import Layout from "../components/Layout";
import { LayoutProvider } from "../context/LayoutContext";
import { AdaptiveLayoutProvider } from "../context/AdaptiveLayoutContext";
import AutoClassificationWrapper from "../components/AutoClassificationWrapper";
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
      <body className={`${lora.variable} ${inter.variable} font-sans`}>
        <AutoClassificationWrapper>
          <AdaptiveLayoutProvider>
            <LayoutProvider>
              <Layout>{children}</Layout>
            </LayoutProvider>
          </AdaptiveLayoutProvider>
        </AutoClassificationWrapper>
      </body>
    </html>
  );
}