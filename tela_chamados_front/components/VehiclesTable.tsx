import {
    Box,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography
} from '@mui/material';

type Municipio = {
    municipio: string;
    disponiveis: number;
    empenhadas: number;
    acaoTemporaria: number;
    baixada: number;
    totalAgrVtr: number;
};

type VehiclesTableProps = {
    data?: Municipio[];
    totalViaturas?: number;
};

const cellStyle = {
    py: 0.5,
    px: 1,
    fontSize: '1.2rem',
    fontWeight: 'bold',
    borderRight: '1px solid #e0e0e0',
    borderBottom: '1px solid #e0e0e0'
};

const headerStyle = {
    ...cellStyle,
    fontSize: '1.1rem',
    color: '#333'
};

const coloredHeaderStyle = {
    disponiveis: {
        ...headerStyle,
        color: '#2e7d32'
    },
    empenhadas: {
        ...headerStyle,
        color: '#d32f2f'
    },
    acaoTemporaria: {
        ...headerStyle,
        color: '#1976d2'
    },
    baixada: {
        ...headerStyle,
        borderRight: 'none',
        color: '#6d4c41'
    }
};

function renderTable(tableData: Municipio[]) {
    return (
        <Table size="small">
            <TableHead>
                <TableRow>
                    <TableCell sx={headerStyle}>MUNICÍPIO</TableCell>
                    <TableCell
                        align="center"
                        sx={coloredHeaderStyle.disponiveis}
                    >
                        DISPONÍVEIS
                    </TableCell>
                    <TableCell align="center" sx={headerStyle}>
                        AG.VTR
                    </TableCell>
                    <TableCell
                        align="center"
                        sx={coloredHeaderStyle.empenhadas}
                    >
                        EMPENHADAS
                    </TableCell>
                    <TableCell
                        align="center"
                        sx={coloredHeaderStyle.acaoTemporaria}
                    >
                        A. TEMPORÁRIA
                    </TableCell>
                    <TableCell
                        align="center"
                        sx={coloredHeaderStyle.baixada}
                    >
                        BAIXADA
                    </TableCell>
                </TableRow>
            </TableHead>

            <TableBody>
                {tableData.map((row, index) => (
                    <TableRow
                        key={row.municipio}
                        sx={{
                            bgcolor:
                                index % 2 === 0
                                    ? 'white'
                                    : '#f5f5f5'
                        }}
                    >
                        <TableCell sx={cellStyle}>
                            {row.municipio.toUpperCase()}
                        </TableCell>
                        <TableCell align="center" sx={cellStyle}>
                            {row.disponiveis}
                        </TableCell>
                        <TableCell align="center" sx={cellStyle}>
                            {row.totalAgrVtr}
                        </TableCell>
                        <TableCell align="center" sx={cellStyle}>
                            {row.empenhadas}
                        </TableCell>
                        <TableCell
                            align="center"
                            sx={cellStyle}
                        >
                            {row.acaoTemporaria}
                        </TableCell>
                        <TableCell
                            align="center"
                            sx={{
                                ...cellStyle,
                                borderRight: 'none'
                            }}
                        >
                            {row.baixada}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

export default function VehiclesTable({
    data = [],
    totalViaturas = 0
}: VehiclesTableProps) {
    const midPoint = Math.ceil(data.length / 2);
    const leftData = data.slice(0, midPoint);
    const rightData = data.slice(midPoint);

    return (
        <Box>
            <Box
                sx={{
                    bgcolor: '#8b1e1b',
                    py: 0.5,
                    display: 'flex',
                    justifyContent: 'center'
                }}
            >
                <Typography
                    sx={{
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '1.6rem'
                    }}
                >
                    VIATURAS DE MUNICÍPIO - {totalViaturas}
                </Typography>
            </Box>

            <Grid container>
                <Grid
                    item
                    xs={6}
                    sx={{
                        borderRight: '2px solid #ccc'
                    }}
                >
                    {renderTable(leftData)}
                </Grid>
                <Grid item xs={6}>{renderTable(rightData)}</Grid>
            </Grid>
        </Box>
    );
}
