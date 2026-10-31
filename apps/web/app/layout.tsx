import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google"

import "@starboard/lib-ui/globals.css"
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
          <Toaster position="top-center">
            <TooltipProvider>{children}</TooltipProvider>
          </Toaster>
        </ThemeProvider>
      </body>
    </html>
  )
}
