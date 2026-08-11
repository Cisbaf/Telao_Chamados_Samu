import { Box, Typography } from '@mui/material';

export default function DashboardHeader() {
    return (
        <Box
            sx={{
                mb: 2,
                textAlign: 'center'
            }}
        >
            <Typography variant="h4" fontWeight={700} gutterBottom>
                CHAMADOS EM TELA
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
                Dashboard de scrap SSO atualizado para Next.js + MUI
            </Typography>
        </Box>
    );
}
