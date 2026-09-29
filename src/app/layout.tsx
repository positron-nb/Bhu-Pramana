import type { Metadata, Viewport } from "next";
import "@fontsource-variable/source-serif-4";
import "@fontsource-variable/source-sans-3";
import "@fontsource-variable/source-code-pro";
import "@fontsource-variable/noto-sans-devanagari";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Bhū-Pramāṇa · National Land Policy Evidence Lab",
    template: "%s · Bhū-Pramāṇa",
  },
  description:
    "India's land governance evidence, connected. A national research and policy-innovation platform linking research, law, datasets, geography and transparent policy simulation into traceable policy briefs.",
  applicationName: "Bhū-Pramāṇa",
};

export const viewport: Viewport = {
  themeColor: "#07101c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
