import {type Metadata} from 'next'
import {
    SignInButton,
    SignUpButton,
    SignedIn,
    SignedOut,
    UserButton,
} from '@clerk/nextjs'
import {Providers} from '@/components/providers'
import './globals.css'

// Fonts disabled for Cloudflare Pages compatibility
// const geistSans = Geist({
//     variable: '--font-geist-sans',
//     subsets: ['latin'],
// })
//
// const geistMono = Geist_Mono({
//     variable: '--font-geist-mono',
//     subsets: ['latin'],
// })

export const metadata: Metadata = {
    title: 'Anki Chinese MVP',
    description: 'Learn Chinese with AI-generated flashcards',
}

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en">
        <body className="antialiased">
        <Providers>
            {children}
        </Providers>
        </body>
        </html>
    )
}
