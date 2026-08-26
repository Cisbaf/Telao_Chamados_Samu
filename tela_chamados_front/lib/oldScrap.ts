import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const execFileAsync = promisify(execFile);
const LIMITE_MINUTOS_ACAO_TEMPORARIA = 60;

function positiveNumber(value: string | undefined, fallback: number) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseScrapRunnerOutput(stdout: string): RawScrapRelatorio {
    const trimmed = stdout.trim();
    if (!trimmed) {
        throw new Error('Saída vazia do scrapRunner');
    }

    try {
        return JSON.parse(trimmed) as RawScrapRelatorio;
    } catch {
        const jsonLine = trimmed
            .split(/\r?\n/)
            .reverse()
            .find((line) => line.trim().startsWith('{'));

        if (!jsonLine) {
            throw new Error(`Nenhuma linha JSON encontrada na saída do scrapRunner. Saída: ${stdout}`);
        }

        return JSON.parse(jsonLine) as RawScrapRelatorio;
    }
}

type RawScrapRelatorio = {
    RelatorioOcorrenciasUrgentes?: any[];
    RelatorioPacientesCriticos?: any[];
    RelatorioOcorrenciasTransferidas?: any[];
    RelatorioViaturas?: any[];
};

type MunicipioRow = {
    municipio: string;
    disponiveis: number;
    empenhadas: number;
    acaoTemporaria: number;
    acaoTemporariaViaturas: string[];
    baixada: number;
    totalAgrVtr: number;
    tempoAgVtrExcedido: boolean;
    color?: string;
};

type DebugAcaoTemporariaItem = {
    municipio: string;
    viatura: string;
    tituloElemento: string | null;
    dataInterpretada: string | null;
    diferencaMinutos: number | null;
    excedido: boolean;
};

export type ScrapData = {
    totalOcorrencias: number;
    ocorrenciasVermelhas: number;
    ocorrenciasAmarelas: number;
    ocorrenciasVerdes: number;
    totalUPH: number;
    totalTIH: number;
    totalPC: number;
    totalAgReg: number;
    totalAgVtr: number;
    totalViaturas: number;
    viaturasBaixadas: number;
    viaturasEmpenhadas: number;
    viaturasAtivas: number;
    viaturasAcaoTemporaria: number;
    total_USB: number;
    total_USA: number;
    municipios: MunicipioRow[];
    municipiosAguardando: { name: string; value: number; color: string }[];

    RelatorioOcorrenciasUrgentes?: any[];
    RelatorioPacientesCriticos?: any[];
    RelatorioOcorrenciasTransferidas?: any[];
    casosAVC: any[];
    debugAcaoTemporaria?: {
        atualizadoEm: string;
        limiteMinutos: number;
        itens: DebugAcaoTemporariaItem[];
    };
};

const CITY_COLOR_MAP: Record<string, string> = {
    'BELFORD ROXO': 'rgb(0,191,255)',
    'QUEIMADOS': 'rgb(135,206,250)',
    'DUQUE DE CAXIAS': 'rgb(70,130,180)',
    'ITAGUAÍ': 'rgb(0,0,255)',
    'JAPERI': 'rgb(0,255,255)',
    'MAGÉ': 'rgb(112,128,144)',
    'MESQUITA': 'rgb(64,224,208)',
    'NILÓPOLIS': 'rgb(255,255,0)',
    'NOVA IGUAÇU': 'rgb(255,69,0)',
    'PARACAMBI': 'rgb(175,238,238)',
    'SÃO JOÃO DE MERITI': 'rgb(128,0,0)',
    'SEROPÉDICA': 'rgb(139,69,19)',
    'FORA DE ABRANGÊNCIA': 'rgb(255,0,0)',
};

function removeAccents(text: string | undefined) {
    if (!text) return '';
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function hasAVC(ocorrencia: any) {
    const motivo = removeAccents(String(ocorrencia?.motivoHD || ocorrencia?.MotivoHD || ocorrencia?.motivo || '')).toUpperCase();
    return /\bA[\s.-]*V[\s.-]*C\b/.test(motivo) || motivo.includes('ACIDENTE VASCULAR CEREBRAL');
}

function normalizeMunicipioName(municipio: string | undefined) {
    if (!municipio) return '';
    const value = String(municipio).trim();

    if (value === 'NOVA IGUAÇU - SEMUS') {
        return 'NOVA IGUAÇU';
    }
    if (value === 'DUQUE DE CAXIAS - HOSPITAL MOACIR DO CARMO') {
        return 'DUQUE DE CAXIAS';
    }

    return value;
}

function getMunicipioColor(municipio: string) {
    return CITY_COLOR_MAP[municipio];
}

function extrairDataAcaoTemporaria(tituloElemento: string | undefined) {
    if (!tituloElemento) return null;

    const agora = new Date();
    const primeiraLinha = tituloElemento.split(/\r?\n/, 1)[0] ?? '';
    const horaAcaoTemporaria = primeiraLinha.match(/Ação Temporária.*?(\d{2}:\d{2})(?!.*\d{2}:\d{2})/i);

    if (horaAcaoTemporaria) {
        const [hora, minuto] = horaAcaoTemporaria[1].split(':');
        return new Date(
            agora.getFullYear(),
            agora.getMonth(),
            agora.getDate(),
            Number(hora),
            Number(minuto),
            0
        );
    }

    const dataHoraCompleta = tituloElemento.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?/);

    if (dataHoraCompleta) {
        const [, dia, mes, ano, hora, minuto, segundo = '00'] = dataHoraCompleta;
        return new Date(Number(ano), Number(mes) - 1, Number(dia), Number(hora), Number(minuto), Number(segundo));
    }

    const horaMinuto = tituloElemento.match(/\d{2}:\d{2}/);
    if (!horaMinuto) return null;

    const [hora, minuto] = horaMinuto[0].split(':');
    return new Date(
            agora.getFullYear(),
            agora.getMonth(),
            agora.getDate(),
            Number(hora),
            Number(minuto),
            0
    );
}

function isTempoAcaoTemporariaExcedido(dataAcaoTemporaria: Date | null) {
    if (!dataAcaoTemporaria) return false;
    return (Date.now() - dataAcaoTemporaria.getTime()) / 60000 >= LIMITE_MINUTOS_ACAO_TEMPORARIA;
}

function countOcorrencias(raw: any[] | undefined, totals: { vermelhas: number; amarelas: number; verdes: number; agReg: number; agVtr: number }, municipiosMap: Record<string, number>) {
    if (!Array.isArray(raw)) return totals;

    for (const item of raw) {
        const prioridade = String(item?.prioridadeOcorrencia || '').trim();
        const textoPrioridade = String(item?.textoPrioridadeViatura || '').trim();
        const cidade = String(item?.cidadeOcorrencia || '').trim();

        if (prioridade === 'POUCO URG') {
            totals.verdes++;
        } else if (prioridade === 'EMERGENTE') {
            totals.vermelhas++;
        } else if (prioridade === 'URGENTE') {
            totals.amarelas++;
        }

        if (textoPrioridade.includes('Ag. VTR') && cidade !== 'EQUIPE CERTIFICADORA DE ÓBITO' && cidade !== 'FROTA PRÓPRIA UNIDADE') {
            totals.agVtr++;
            if (cidade) {
                municipiosMap[cidade] = (municipiosMap[cidade] || 0) + 1;
            }
        } else if ((textoPrioridade === 'Ag. Regula' || textoPrioridade === 'Ag. Regul') && cidade !== 'EQUIPE CERTIFICADORA DE ÓBITO' && cidade !== 'FROTA PRÓPRIA UNIDADE') {
            totals.agReg++;
        }
    }

    return totals;
}

function normalizeMunicipios(rawViaturas: any[] | undefined, rawData: RawScrapRelatorio): MunicipioRow[] {
    if (!Array.isArray(rawViaturas)) return [];

    return rawViaturas
        .filter((linha) => linha?.municipio && linha.municipio !== 'EQUIPE CERTIFICADORA DE ÓBITO' && linha.municipio !== 'FROTA PRÓPRIA UNIDADE')
        .map((linha) => {
            const municipio = normalizeMunicipioName(String(linha.municipio));
            const disponiveis = linha?.EstatisticaGeral?.TotalviaturasAtivas ?? 0;
            const empenhadas = linha?.EstatisticaGeral?.TotalviaturasEmpenhadas ?? 0;
            const acaoTemporaria = linha?.EstatisticaGeral?.TotalviaturasAcaoTemporaria ?? 0;
            const baixada = linha?.EstatisticaGeral?.TotalviaturasBaixadas ?? 0;
            const totalAgrVtr = countAgVtrForMunicipio(rawData, municipio);
            const viaturasAcaoTemporaria = Array.isArray(linha.viaturas)
                ? linha.viaturas.filter((obj: any) => obj?.status === 'Ação temporária')
                : [];
            const acaoTemporariaViaturas = viaturasAcaoTemporaria
                .map((obj: any) => String(obj?.nome || '').trim())
                .filter(Boolean);
            const tempoAgVtrExcedido = viaturasAcaoTemporaria.some((obj: any) =>
                isTempoAcaoTemporariaExcedido(extrairDataAcaoTemporaria(obj?.tituloElemento))
            );
            const color = getMunicipioColor(municipio);

            return {
                municipio,
                disponiveis,
                empenhadas,
                acaoTemporaria,
                acaoTemporariaViaturas,
                baixada,
                totalAgrVtr,
                tempoAgVtrExcedido,
                color,
            };
        });
}

function buildDebugAcaoTemporaria(rawViaturas: any[] | undefined) {
    if (!Array.isArray(rawViaturas)) {
        return {
            atualizadoEm: new Date().toISOString(),
            limiteMinutos: LIMITE_MINUTOS_ACAO_TEMPORARIA,
            itens: [] as DebugAcaoTemporariaItem[],
        };
    }

    const itens = rawViaturas
        .filter((linha) => linha?.municipio && linha.municipio !== 'EQUIPE CERTIFICADORA DE ÓBITO' && linha.municipio !== 'FROTA PRÓPRIA UNIDADE')
        .flatMap((linha) => {
            const municipio = normalizeMunicipioName(String(linha.municipio));
            const viaturasAcaoTemporaria = Array.isArray(linha.viaturas)
                ? linha.viaturas.filter((obj: any) => obj?.status === 'Ação temporária')
                : [];

            return viaturasAcaoTemporaria.map((obj: any) => {
                const dataAcaoTemporaria = extrairDataAcaoTemporaria(obj?.tituloElemento);
                return {
                    municipio,
                    viatura: String(obj?.nome || '').trim(),
                    tituloElemento: obj?.tituloElemento ?? null,
                    dataInterpretada: dataAcaoTemporaria?.toISOString() ?? null,
                    diferencaMinutos: dataAcaoTemporaria
                        ? Math.floor((Date.now() - dataAcaoTemporaria.getTime()) / 60000)
                        : null,
                    excedido: isTempoAcaoTemporariaExcedido(dataAcaoTemporaria),
                };
            });
        });

    return {
        atualizadoEm: new Date().toISOString(),
        limiteMinutos: LIMITE_MINUTOS_ACAO_TEMPORARIA,
        itens,
    };
}

function countAgVtrForMunicipio(raw: RawScrapRelatorio, municipio: string) {
    if (!municipio) return 0;

    const normalizedMunicipio = removeAccents(municipio).toUpperCase();
    const sources = [raw.RelatorioOcorrenciasUrgentes, raw.RelatorioOcorrenciasTransferidas, raw.RelatorioPacientesCriticos];
    let total = 0;

    for (const source of sources) {
        if (!Array.isArray(source)) continue;
        for (const item of source) {
            const textoPrioridade = String(item?.textoPrioridadeViatura || '').trim();
            const cidade = removeAccents(String(item?.cidadeOcorrencia || '').trim()).toUpperCase();
            if (textoPrioridade === 'Ag. VTR' && cidade !== 'EQUIPE CERTIFICADORA DE ÓBITO' && cidade !== 'FROTA PRÓPRIA UNIDADE' && cidade === normalizedMunicipio) {
                total++;
            }
        }
    }

    return total;
}

function countViaturasTotals(rawViaturas: any[] | undefined) {
    const result = {
        totalViaturas: 0,
        viaturasBaixadas: 0,
        viaturasEmpenhadas: 0,
        viaturasAtivas: 0,
        viaturasAcaoTemporaria: 0,
        total_USB: 0,
        total_USA: 0,
    };

    if (!Array.isArray(rawViaturas)) return result;

    for (const linha of rawViaturas) {
        if (!linha?.municipio || linha.municipio === 'EQUIPE CERTIFICADORA DE ÓBITO' || linha.municipio === 'FROTA PRÓPRIA UNIDADE') {
            continue;
        }

        const estatistica = linha?.EstatisticaGeral || {};
        const viaturas = Array.isArray(linha.viaturas) ? linha.viaturas : [];

        const baixadas = estatistica.TotalviaturasBaixadas ?? 0;
        const empenhadas = estatistica.TotalviaturasEmpenhadas ?? 0;
        const ativas = estatistica.TotalviaturasAtivas ?? 0;
        const acaoTemporaria = estatistica.TotalviaturasAcaoTemporaria ?? 0;

        result.totalViaturas += baixadas + empenhadas + ativas + acaoTemporaria;
        result.viaturasBaixadas += baixadas;
        result.viaturasEmpenhadas += empenhadas;
        result.viaturasAtivas += ativas;
        result.viaturasAcaoTemporaria += acaoTemporaria;

        for (const viatura of viaturas) {
            const nome = String(viatura?.nome || '').toUpperCase();
            const status = String(viatura?.status || '');

            // Ignora baixadas
            if (status === 'Baixada') continue;

            if (nome.includes('USB')) {
                result.total_USB++;
            }
            if (nome.includes('USA')) {
                result.total_USA++;
            }
        }
    }

    return result;
}

function transformScrapData(raw: RawScrapRelatorio): ScrapData {
    const urgentes = raw.RelatorioOcorrenciasUrgentes ?? [];
    const transferidas = raw.RelatorioOcorrenciasTransferidas ?? [];
    const criticos = raw.RelatorioPacientesCriticos ?? [];

    const todasOcorrencias = [...urgentes, ...transferidas, ...criticos];
    const casosAVC = todasOcorrencias.filter(hasAVC);

    const municipiosAguardandoMap: Record<string, number> = {};

    const totals = countOcorrencias(urgentes, { vermelhas: 0, amarelas: 0, verdes: 0, agReg: 0, agVtr: 0 }, municipiosAguardandoMap);
    countOcorrencias(transferidas, totals, municipiosAguardandoMap);
    countOcorrencias(criticos, totals, municipiosAguardandoMap);

    const viaturasTotals = countViaturasTotals(raw.RelatorioViaturas);
    const municipios = normalizeMunicipios(raw.RelatorioViaturas, raw);
    const debugAcaoTemporaria = buildDebugAcaoTemporaria(raw.RelatorioViaturas);

    const municipiosAguardando = Object.keys(municipiosAguardandoMap).map((cidade) => ({
        name: cidade,
        value: municipiosAguardandoMap[cidade],
        color: CITY_COLOR_MAP[cidade] || '#cccccc',
    }));

    return {
        totalOcorrencias: urgentes.length + transferidas.length + criticos.length,
        ocorrenciasVermelhas: totals.vermelhas,
        ocorrenciasAmarelas: totals.amarelas,
        ocorrenciasVerdes: totals.verdes,
        totalUPH: urgentes.length,
        totalTIH: transferidas.length,
        totalPC: criticos.length,
        totalAgReg: totals.agReg,
        totalAgVtr: totals.agVtr,
        totalViaturas: viaturasTotals.totalViaturas,
        viaturasBaixadas: viaturasTotals.viaturasBaixadas,
        viaturasEmpenhadas: viaturasTotals.viaturasEmpenhadas,
        viaturasAtivas: viaturasTotals.viaturasAtivas,
        viaturasAcaoTemporaria: viaturasTotals.viaturasAcaoTemporaria,
        total_USB: viaturasTotals.total_USB,
        total_USA: viaturasTotals.total_USA,
        municipios,
        municipiosAguardando,
        casosAVC,
        debugAcaoTemporaria,
    };
}

export async function scrapeData(): Promise<ScrapData> {
    const scriptPath = path.resolve(process.cwd(), 'scripts/scrapRunner.js');
    const projectRoot = path.resolve(process.cwd(), '..');

    const { stdout, stderr } = await execFileAsync('node', [scriptPath], {
        cwd: projectRoot,
        env: process.env,
        maxBuffer: 10 * 1024 * 1024,
        timeout: positiveNumber(process.env.SCRAP_RUNNER_TIMEOUT_MS, 120000) + 10000,
        killSignal: 'SIGKILL',
    });

    if (stderr) {
        console.error('scrapRunner stderr:', stderr);
    }

    try {
        const rawData = parseScrapRunnerOutput(stdout);
        return transformScrapData(rawData);
    } catch (err) {
        throw new Error(`Falha ao parsear JSON da saída do scrap: ${err}\nSaída: ${stdout}`);
    }
}
