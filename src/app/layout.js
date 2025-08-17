import "./globals.css";
import Layout from "../components/Layout";

export const metadata = {
  title: "AssistEd",
  description: "A modern learning platform designed to enhance educational experiences",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}