import React from 'react';
import './globals.css';

export const metadata = {
    title: 'Assistant CCF - Gestion & Suivi BTS NDRC',
    description: 'Assistant pour la gestion des CCF et le suivi de compétences pour le BTS NDRC.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="fr">
            <body className="min-h-screen bg-slate-50 font-sans text-gray-900 antialiased">
                {children}
            </body>
        </html>
    );
}
