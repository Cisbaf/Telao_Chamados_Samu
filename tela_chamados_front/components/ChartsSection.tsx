'use client';

import { AvcChartItem, ChartConfig, ChartItem, ChartsSectionProps, MUNICIPIOS_COLORS, PacienteAVC } from '@/lib/types';
import { Box, Grid, Paper, Typography } from '@mui/material';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const asArray = (value: unknown): any[] => Array.isArray(value) ? value : [];
const asNumber = (value: unknown): number => Number.isFinite(Number(value)) ? Number(value) : 0;
const normalizeText = (value: unknown): string => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();
const formatCity = (value: unknown): string => String(value ?? '').trim().toUpperCase() || 'MUNICÍPIO NÃO INFORMADO';

function getReason(item: any): string {
    return String(item?.motivoHD ?? item?.MotivoHD ?? item?.motivo ?? item?.diagnostico
        ?? item?.hipoteseDiagnostica ?? item?.hipotese ?? item?.descricao ?? '').trim();
}

function hasAVC(item: any): boolean {
    const reason = normalizeText(getReason(item));
    return /\bA[\s.-]*V[\s.-]*C\b/.test(reason) || reason.includes('ACIDENTE VASCULAR CEREBRAL');
}

function getCity(item: any): string {
    return formatCity(item?.cidadeOcorrencia ?? item?.municipioOcorrencia ?? item?.nomeMunicipio ?? item?.cidade ?? item?.municipio);
}

function getPatientName(item: any): string {
    return String(item?.pacienteOcorrencia ?? item?.nomePaciente ?? item?.pacienteNome ?? item?.paciente ?? item?.nome ?? 'Paciente não informado').trim();
}

function getPatientAge(item: any): string | number {
    const age = item?.pacienteIdadeOcorrencia ?? item?.idadePaciente ?? item?.pacienteIdade ?? item?.idade;
    return age === null || age === undefined || String(age).trim() === '' ? 'Não informada' : age;
}

function renderLegend({ payload }: any) {
    return (
        <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 0.7 }}>
            {(payload ?? []).map((entry: any, index: number) => (
                <Box component="li" key={`${entry.value}-${index}`} sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: '#000', fontSize: '0.8rem', fontWeight: 900, lineHeight: 1.15 }}>
                    <Box component="span" sx={{ width: 12, height: 12, flex: '0 0 12px', bgcolor: entry.color }} />
                    <Box component="span" sx={{ color: '#000', overflowWrap: 'anywhere' }}>{entry.value}</Box>
                </Box>
            ))}
        </Box>
    );
}

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }: any) => {
    const number = asNumber(value);
    if (number === 0) return null;

    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

    return (
        <text x={x} y={y} fill="#000" textAnchor="middle" dominantBaseline="central"
            fontSize={20} fontWeight={900} stroke="#fff" strokeWidth={0.8} paintOrder="stroke">
            {number}
        </text>
    );
};

function AvcTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
    const item = payload?.[0]?.payload as AvcChartItem | undefined;
    if (!active || !item) return null;

    return (
        <Paper elevation={8} sx={{ p: 1.5, minWidth: 220, maxWidth: 380, maxHeight: 320, overflowY: 'auto', color: '#000', border: '2px solid', borderColor: 'error.main' }}>
            <Typography sx={{ color: '#000', fontWeight: 900, fontSize: '1rem', mb: 0.5 }}>🚨 {item.name}</Typography>
            <Typography sx={{ color: '#000', fontWeight: 'bold', mb: 1 }}>
                {item.value} {item.value === 1 ? 'caso de AVC' : 'casos de AVC'}
            </Typography>

            {item.pacientes.map((paciente, index) => (
                <Box key={`${item.name}-${paciente.nome}-${index}`} sx={{ pt: index === 0 ? 0 : 1, mt: index === 0 ? 0 : 1, borderTop: index === 0 ? 'none' : '1px solid #ddd' }}>
                    <Typography sx={{ color: '#000', fontSize: '0.85rem', fontWeight: 'bold' }}>{paciente.nome}</Typography>
                    <Typography sx={{ color: '#000', fontSize: '0.8rem' }}>Idade: {paciente.idade}</Typography>
                    <Typography sx={{ color: '#000', fontSize: '0.8rem' }}>Motivo: {paciente.motivo}</Typography>
                </Box>
            ))}
        </Paper>
    );
}

function buildAvcData(data: any): { avcData: AvcChartItem[]; totalCasosAVC: number } {
    const directCases = asArray(data?.casosAVC);
    const reports = [
        ...asArray(data?.RelatorioOcorrenciasUrgentes ?? data?.relatorioOcorrenciasUrgentes),
        ...asArray(data?.RelatorioPacientesCriticos ?? data?.relatorioPacientesCriticos),
        ...asArray(data?.RelatorioOcorrenciasTransferidas ?? data?.relatorioOcorrenciasTransferidas)
    ];

    const cases = directCases.length > 0 ? directCases : reports.filter(hasAVC);

    const byCity = cases.reduce<Record<string, { quantidade: number; pacientes: PacienteAVC[] }>>((acc, item) => {
        const city = getCity(item);
        acc[city] ??= { quantidade: 0, pacientes: [] };
        acc[city].quantidade += 1;
        acc[city].pacientes.push({ nome: getPatientName(item), idade: getPatientAge(item), motivo: getReason(item) || 'AVC' });
        return acc;
    }, {});

    const avcData = Object.entries(byCity).map(([city, info], index) => ({
        name: city,
        value: info.quantidade,
        pacientes: info.pacientes,
        color: MUNICIPIOS_COLORS[index % MUNICIPIOS_COLORS.length]
    }));

    return { avcData, totalCasosAVC: cases.length };
}

export default function ChartsSection({ data }: ChartsSectionProps) {
    const municipiosData: ChartItem[] = asArray(data?.municipiosAguardando).map((item, index) => ({
        name: String(item?.name ?? item?.municipio ?? item?.cidade ?? 'NÃO INFORMADO').toUpperCase(),
        value: asNumber(item?.value ?? item?.quantidade ?? item?.total),
        color: item?.color ?? MUNICIPIOS_COLORS[index % MUNICIPIOS_COLORS.length]
    }));

    const chamadosData: ChartItem[] = [
        { name: 'ATENDIMENTO PRIMÁRIO', value: asNumber(data?.totalUPH), color: '#455a64' },
        { name: 'ATENDIMENTO SECUNDÁRIO', value: asNumber(data?.totalPC), color: '#00acc1' },
        { name: 'TRANSFERÊNCIA INTER HOSPITALAR - TIH', value: asNumber(data?.totalTIH), color: '#1565c0' }
    ];

    const viaturasData: ChartItem[] = [
        { name: 'EMPENHADAS', value: asNumber(data?.viaturasEmpenhadas), color: '#26c6da' },
        { name: 'DISPONÍVEIS', value: asNumber(data?.viaturasAtivas), color: '#00897b' },
        { name: 'AÇÃO TEMPORÁRIA', value: asNumber(data?.viaturasAcaoTemporaria), color: '#29b6f6' }
    ];

    const tiposViaturaData: ChartItem[] = [
        { name: 'USA', value: asNumber(data?.total_USA), color: '#00bcd4' },
        { name: 'USB', value: asNumber(data?.total_USB), color: '#607d8b' }
    ];

    const { avcData, totalCasosAVC } = buildAvcData(data);

    const chartsList: ChartConfig[] = [
        { title: 'DISTRIBUIÇÃO DOS TIPOS DE CHAMADO', data: chamadosData, type: 'default' },
        { title: 'MUNICÍPIOS AGUARDANDO VIATURA', data: municipiosData, type: 'default' },
        { title: 'STATUS DE VIATURA', data: viaturasData, type: 'default' },
        { title: 'DISTRIBUIÇÃO TIPOS DE VIATURA', data: tiposViaturaData, type: 'default' },
        { title: 'PACIENTES COM AVC', data: avcData, type: 'avc' }
    ];

    return (
        <Box sx={{
            width: '100%',
            overflow: 'visible',
            '& .recharts-wrapper': { overflow: 'visible !important' },
            '& .recharts-surface': { overflow: 'visible !important' },
            '& .recharts-legend-wrapper': { overflow: 'visible !important', zIndex: 5 }
        }}>
            <Grid container spacing={2} alignItems="flex-start" justifyContent="center" sx={{ overflow: 'visible' }}>
                {chartsList.map((chart, chartIndex) => {
                    const total = chart.data.reduce((sum, item) => sum + asNumber(item.value), 0);
                    const isAvcChart = chart.type === 'avc';

                    return (
                        <Grid item xs={12} sm={6} md={4} lg={2.4} key={chart.title}
                            sx={{ minWidth: 0, minHeight: 340, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'visible' }}>

                            <Typography sx={{
                                minHeight: 40, display: 'flex', justifyContent: 'center', alignItems: 'center',
                                fontWeight: 900, color: '#000', textAlign: 'center', mb: 0.5,
                                px: 0.5, fontSize: '0.95rem', lineHeight: 1.2
                            }}>
                                {isAvcChart && totalCasosAVC > 0 ? '🚨 ' : ''}{chart.title}
                            </Typography>

                            <Box sx={{
                                width: '100%', height: 290, minWidth: 0,
                                position: 'relative', overflow: 'visible',
                                '& svg': { overflow: 'visible !important' }
                            }}>
                                {total === 0 && !isAvcChart && (
                                    <Box sx={{
                                        position: 'absolute', top: '50%', left: '40%',
                                        transform: 'translate(-50%, -50%)',
                                        zIndex: 2, pointerEvents: 'none'
                                    }}>
                                        <Typography sx={{ fontSize: '3rem', fontWeight: 900, color: '#000' }}>0</Typography>
                                    </Box>
                                )}

                                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                    <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                                        style={{ overflow: 'visible' }}>

                                        <Pie data={chart.data} cx="40%" cy="50%" innerRadius={55} outerRadius={90}
                                            dataKey="value" nameKey="name" stroke="#fff" strokeWidth={2}
                                            labelLine={false} label={renderCustomizedLabel} isAnimationActive={false}>
                                            {chart.data.map((entry, cellIndex) => (
                                                <Cell key={`cell-${chartIndex}-${cellIndex}`}
                                                    fill={entry.color ?? MUNICIPIOS_COLORS[cellIndex % MUNICIPIOS_COLORS.length]} />
                                            ))}
                                        </Pie>



                                        {isAvcChart
                                            ? <Tooltip content={<AvcTooltip />} wrapperStyle={{ zIndex: 1000 }} />
                                            : <Tooltip wrapperStyle={{ zIndex: 1000 }}
                                                contentStyle={{ color: '#000', fontWeight: 'bold' }}
                                                itemStyle={{ color: '#000' }} />}

                                        <Legend layout="vertical" verticalAlign="middle" align="right"
                                            wrapperStyle={{
                                                width: '48%',
                                                lineHeight: '1.2',
                                                color: '#000',
                                                overflow: 'visible',
                                                zIndex: 5
                                            }}
                                            content={renderLegend}
                                            iconType="square"
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </Grid>
                    );
                })}
            </Grid>
        </Box>
    );
}