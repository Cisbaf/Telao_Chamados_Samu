import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
    title: 'Telão de Chamados',
    description: 'Sistema de monitoramento de chamados para o Samu',
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="pt-BR">
            <body>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
