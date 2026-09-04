import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'For Hearing Schedule', description: 'Hearing schedule administration dashboard' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
