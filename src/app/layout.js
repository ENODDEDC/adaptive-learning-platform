import "./globals.css";
import Layout from "../components/Layout";
import { LayoutProvider } from "../context/LayoutContext";

export const metadata = {
  title: "AssistEd",
  description: "A modern learning platform designed to enhance educational experiences",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <LayoutProvider>
          <Layout>{children}</Layout>
        </LayoutProvider>
      </body>
    </html>
  );
}