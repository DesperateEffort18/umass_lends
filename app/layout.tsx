import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'UMass Lends API',
  description: 'Backend API Server for UMass Lends',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


