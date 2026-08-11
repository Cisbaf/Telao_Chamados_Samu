import { Box, Grid, Typography } from '@mui/material';

import type { ScrapData } from '@/lib/oldScrap';

type SummaryCardsProps = {
    data: ScrapData;
};

type SummaryCard = {
    label: string;
    value: number;
    color: string;
};

export default function SummaryCards({ data }: SummaryCardsProps) {
    const cards: SummaryCard[] = [
        {
            label: 'TOTAL OCORRÊNCIAS',
            value: data.totalOcorrencias,
            color: '#1976d2'
        },
        {
            label: 'OCORRÊNCIAS VERMELHAS',
            value: data.ocorrenciasVermelhas,
            color: '#d32f2f'
        },
        {
            label: 'OCORRÊNCIAS AMARELAS',
            value: data.ocorrenciasAmarelas,
            color: '#ffb300'
        },
        {
            label: 'OCORRÊNCIAS VERDES',
            value: data.ocorrenciasVerdes,
            color: '#2e7d32'
        },
        {
            label: 'AG.REGULAÇÃO',
            value: data.totalAgReg,
            color: '#00acc1'
        }
    ];

    return (
        <Grid
            container
            sx={{
                width: '100%',
                m: 0
            }}
        >
            {cards.map((card, index) => (
                <Grid
                    item
                    xs={2.4}
                    key={card.label}
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        borderRight:
                            index < cards.length - 1
                                ? '1px solid #e0e0e0'
                                : 'none',
                        pb: 1
                    }}
                >
                    <Typography
                        sx={{
                            fontWeight: 'bold',
                            fontSize: '1.2rem',
                            color: '#333',
                            mb: 0.5
                        }}
                    >
                        {card.label}
                    </Typography>

                    <Box
                        sx={{
                            bgcolor: card.color,
                            color: 'white',
                            px: 4,
                            py: 0.5,
                            borderRadius: 1,
                            minWidth: 100,
                            textAlign: 'center'
                        }}
                    >
                        <Typography
                            sx={{
                                fontWeight: 900,
                                fontSize: '4rem',
                                lineHeight: 1
                            }}
                        >
                            {card.value}
                        </Typography>
                    </Box>
                </Grid>
            ))}
        </Grid>
    );
}
