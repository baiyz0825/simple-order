import type { Metadata, Viewport } from "next";
import { PrismaClient } from "@prisma/client";
import Providers from "@/components/Providers";
import BottomNav from "@/components/BottomNav";
import "./globals.css";

const prisma = new PrismaClient();

async function getShopName(): Promise<string> {
  try {
    const row = await prisma.shopSetting.findUnique({
      where: { key: "shopName" },
    });
    return row?.value || "精品咖啡烘焙店";
  } catch {
    return "精品咖啡烘焙店";
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const shopName = await getShopName();
  return {
    title: shopName,
    description: "在线点单系统",
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: shopName,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#FF8D4D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="antialiased">
        <div className="app-shell">
          <Providers>
            {children}
            <BottomNav />
          </Providers>
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                })
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
