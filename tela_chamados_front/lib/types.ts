export type ChartsSectionProps = { data: any };
export type PacienteAVC = { nome: string; idade: string | number; motivo: string };
export type ChartItem = { name: string; value: number; color?: string };
export type AvcChartItem = ChartItem & { pacientes: PacienteAVC[] };
export type ChartConfig = { title: string; data: ChartItem[]; type: 'default' | 'avc' };
export const MUNICIPIOS_COLORS = ['#d32f2f', '#ff6f00', '#4dd0e1', '#8e0000', '#0000ff',
    '#90caf9', '#ffeb3b', '#4caf50', '#7b1fa2', '#00695c', '#ef6c00', '#3949ab'];