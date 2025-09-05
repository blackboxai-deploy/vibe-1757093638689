import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { Sidebar } from '@/components/layout/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'HabitFlow - Pomodoro Habit Tracker',
  description: 'Build better habits with focused Pomodoro sessions and track your progress',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen bg-background">
            {/* Main container with sidebar */}
            <div className="flex">
              <Sidebar />
              
              {/* Main content area */}
              <main className="flex-1 ml-64 min-h-screen">
                <div className="p-6">
                  {children}
                </div>
              </main>
            </div>
          </div>
          
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}