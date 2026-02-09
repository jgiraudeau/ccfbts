import React from 'react';
import './globals.css';

export const metadata = {
    title: 'CCFBTS - Gestion & Suivi BTS NDRC',
    description: 'Application de gestion des CCF et suivi de compétences pour le BTS NDRC.',
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
