'use client';

import { CssBaseline, ThemeProvider } from '@mui/material';
import { CacheProvider, EmotionCache } from '@emotion/react';
import { createTheme } from '@mui/material/styles';
import createCache from '@emotion/cache';

const clientSideEmotionCache = createCache({ key: 'css', prepend: true });

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#7e2c2c',
        },
        secondary: {
            main: '#1976d2',
        },
    },
});

interface ProvidersProps {
    children: React.ReactNode;
    emotionCache?: EmotionCache;
}

export function Providers({ children, emotionCache = clientSideEmotionCache }: ProvidersProps) {
    return (
        <CacheProvider value={emotionCache}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </CacheProvider>
    );
}
