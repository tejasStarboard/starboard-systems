import { Geist, JetBrains_Mono } from "next/font/google"
import type { Metadata } from "next"

import "@starboard/lib-ui/globals.css"
import { AppInteractionGuard } from "@/components/app-interaction-guard"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@starboard/lib-ui/lib/utils"
import { TooltipProvider } from "@starboard/lib-ui/components/tooltip"
import { Toaster } from "@starboard/lib-ui/components/toast"

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Starboard",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontSans.variable,
        "font-mono",
        jetbrainsMono.variable
      )}
    >
      <body>
        <ThemeProvider>
          <AppInteractionGuard>
            <Toaster position="top-center">
              <TooltipProvider>{children}</TooltipProvider>
            </Toaster>
          </AppInteractionGuard>
        </ThemeProvider>
      </body>
    </html>
  )
}
