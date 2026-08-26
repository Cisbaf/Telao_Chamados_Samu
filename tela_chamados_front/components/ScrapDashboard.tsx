'use client';

import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material';

import ChartsSection from '@/components/ChartsSection';
import SummaryCards from '@/components/SummaryCards';
import VehiclesTable from '@/components/VehiclesTable';
import type { ScrapData } from '@/lib/oldScrap';

const pagePadding = { xs: 1, md: 2 };
const STORAGE_DEBUG_ACAO_TEMPORARIA = 'debugAcaoTemporaria';

function positiveNumber(value: string | undefined, fallback: number) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const SCRAP_REFRESH_MS = positiveNumber(process.env.NEXT_PUBLIC_SCRAP_REFRESH_MS, 30000);

function salvarDebugAcaoTemporaria(debugAcaoTemporaria: ScrapData['debugAcaoTemporaria']) {
    try {
        window.localStorage.setItem(STORAGE_DEBUG_ACAO_TEMPORARIA, JSON.stringify(debugAcaoTemporaria ?? {}));
    } catch {
        // Debug auxiliar apenas para inspeção manual.
    }
}

async function tocarAlertaAVC() {
    const AudioContextClass = window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) return false;

    const audioContext = new AudioContextClass();

    if (audioContext.state === 'suspended') {
        try {
            await audioContext.resume();
        } catch {
            await audioContext.close().catch(() => undefined);
            return false;
        }
    }

    if (audioContext.state !== 'running') {
        await audioContext.close().catch(() => undefined);
        return false;
    }

    const inicio = audioContext.currentTime;
    const duracao = 2.5;

    const masterGain = audioContext.createGain();
    const compressor = audioContext.createDynamicsCompressor();

    compressor.threshold.value = -12;
    compressor.knee.value = 10;
    compressor.ratio.value = 15;
    compressor.attack.value = 0.002;
    compressor.release.value = 0.1;

    masterGain.gain.setValueAtTime(0.0001, inicio);
    masterGain.gain.exponentialRampToValueAtTime(0.85, inicio + 0.05);
    masterGain.gain.setValueAtTime(0.85, inicio + duracao - 0.2);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, inicio + duracao);

    masterGain.connect(compressor);
    compressor.connect(audioContext.destination);

    const frequenciaBip = 800;
    const duracaoBip = 0.18;
    const intervaloBip = 0.25;
    const intervaloGrupo = 0.7;

    for (let tempo = 0; tempo < duracao; tempo += intervaloGrupo) {
        const tempoGrupo = inicio + tempo;

        for (let i = 0; i < 2; i++) {
            const inicioBip = tempoGrupo + (i * intervaloBip);

            if (inicioBip >= inicio + duracao) break;

            const osc = audioContext.createOscillator();
            const ganhoBip = audioContext.createGain();

            osc.type = 'square';
            osc.frequency.setValueAtTime(frequenciaBip, inicioBip);

            ganhoBip.gain.setValueAtTime(0.0001, inicioBip);
            ganhoBip.gain.exponentialRampToValueAtTime(0.8, inicioBip + 0.015);
            ganhoBip.gain.setValueAtTime(0.8, inicioBip + duracaoBip - 0.015);
            ganhoBip.gain.exponentialRampToValueAtTime(0.0001, inicioBip + duracaoBip);

            osc.connect(ganhoBip);
            ganhoBip.connect(masterGain);

            osc.start(inicioBip);
            osc.stop(inicioBip + duracaoBip);
        }
    }

    window.setTimeout(() => {
        audioContext.close().catch(() => undefined);
    }, (duracao + 0.5) * 1000);

    return true;
}

export default function ScrapDashboard() {
    const [data, setData] = useState<ScrapData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [audioBlocked, setAudioBlocked] = useState(false);
    const [requestActive, setRequestActive] = useState(false);
    const [avcAlertVisible, setAvcAlertVisible] = useState(false);
    const [novosAvcDetalhes, setNovosAvcDetalhes] = useState<Array<{ cidade: string; chamado: string; paciente: string }>>([]);

    // Novo estado para controlar se o som foi clicado/ativado ao menos uma vez desde o reload
    const [somIniciado, setSomIniciado] = useState(false);

    const ultimoTotalAVCRef = useRef<number | null>(null);
    const avcAlertTimeoutRef = useRef<number | null>(null);
    const seenAvcIds = useRef<Set<string>>(new Set());
    const isFirstLoad = useRef(true);

    async function dispararAlertaAVC() {
        setSomIniciado(true);
        try {
            setAudioBlocked(!(await tocarAlertaAVC()));
        } catch {
            setAudioBlocked(true);
        }
    }

    // Função para testar manualmente o alerta
    function testarAlerta() {
        setNovosAvcDetalhes([{
            cidade: 'MUNICÍPIO TESTE',
            chamado: '999999',
            paciente: 'PACIENTE SIMULADO'
        }]);
        setAvcAlertVisible(true);

        if (avcAlertTimeoutRef.current) window.clearTimeout(avcAlertTimeoutRef.current);
        avcAlertTimeoutRef.current = window.setTimeout(() => setAvcAlertVisible(false), 4000);

        void dispararAlertaAVC();
    }

    useEffect(() => {
        let isMounted = true;
        let requestInProgress = false;
        const abortController = new AbortController();

        async function loadScrap() {
            if (!isMounted || requestInProgress) return;
            requestInProgress = true;
            setRequestActive(true);

            try {
                const response = await fetch('/api/scrap', { cache: 'no-store', signal: abortController.signal });
                if (!response.ok) throw new Error(`Erro ${response.status}: ${response.statusText}`);

                const json: ScrapData = await response.json();
                if (!isMounted) return;

                const listaAvc = json.casosAVC ?? [];
                const totalAVC = listaAvc.length;

                ultimoTotalAVCRef.current = totalAVC;
                salvarDebugAcaoTemporaria(json.debugAcaoTemporaria);
                setData(json);
                setError(null);

                if (isFirstLoad.current) {
                    listaAvc.forEach((oc: any) => {
                        if (oc.numeroChamado) seenAvcIds.current.add(oc.numeroChamado);
                    });
                    isFirstLoad.current = false;
                } else if (totalAVC > 0) {
                    const novos = listaAvc.filter((oc: any) => oc.numeroChamado && !seenAvcIds.current.has(oc.numeroChamado));

                    if (novos.length > 0) {
                        novos.forEach((oc: any) => seenAvcIds.current.add(oc.numeroChamado));

                        const detalhes = novos.map((oc: any) => ({
                            cidade: oc.cidadeOcorrencia || 'NÃO INFORMADO',
                            chamado: oc.numeroChamado || 'S/N',
                            paciente: oc.pacienteOcorrencia || 'NÃO INFORMADO'
                        }));

                        setNovosAvcDetalhes(detalhes);
                        setAvcAlertVisible(true);

                        if (avcAlertTimeoutRef.current) window.clearTimeout(avcAlertTimeoutRef.current);
                        avcAlertTimeoutRef.current = window.setTimeout(() => setAvcAlertVisible(false), 4000);
                        void dispararAlertaAVC();
                    }
                }
            } catch (err) {
                if (!isMounted || (err instanceof Error && err.name === 'AbortError')) return;
                setError(err instanceof Error ? err.message : 'Erro ao buscar dados');
            } finally {
                requestInProgress = false;
                if (isMounted) {
                    setRequestActive(false);
                    setLoading(false);
                }
            }
        }

        loadScrap();
        const intervalId = window.setInterval(loadScrap, SCRAP_REFRESH_MS);
        return () => {
            isMounted = false;
            abortController.abort();
            window.clearInterval(intervalId);
            if (avcAlertTimeoutRef.current) window.clearTimeout(avcAlertTimeoutRef.current);
        };
    }, []);

    if (loading && !data) return <Box sx={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><CircularProgress /></Box>;
    if (error && !data) return <Box sx={{ p: 2 }}><Alert severity="error">{error}</Alert></Box>;
    if (!data) return <Typography sx={{ p: 2 }}>Nenhum dado disponível.</Typography>;

    return (
        <Box sx={{ bgcolor: 'white', minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', overflowX: 'hidden', overflowY: 'auto' }}>
            <Box sx={{ bgcolor: '#8b1e1b', py: 0.5, px: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, position: 'relative' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ color: 'white', fontWeight: 900, fontSize: { xs: '1.4rem', md: '2rem' } }}>CHAMADOS EM TELA</Typography>
                    <Box title={requestActive ? 'Atualizando dados' : 'Dados atualizados'} sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: requestActive ? 'warning.main' : '#00ff00', boxShadow: requestActive ? '0 0 8px #ff9800' : '0 0 8px #00ff00', transition: 'background-color 0.2s ease' }} />
                </Box>

                {/* BOTÕES NO CABEÇALHO */}
                <Box sx={{ position: 'absolute', right: 14, display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Button size="small" variant="text" onClick={testarAlerta}
                        sx={{
                            minWidth: 0, px: 1, py: 0.1, color: 'rgba(255,255,255,0.72)', fontSize: '0.7rem',
                            fontWeight: 700, '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', color: '#fff' }
                        }}>
                        TESTAR ALERTA
                    </Button>

                    <Button
                        size="small"
                        variant={!somIniciado ? "contained" : "text"}
                        onClick={dispararAlertaAVC}
                        sx={{
                            minWidth: 0,
                            px: 1.5,
                            py: 0.3,
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            bgcolor: !somIniciado ? '#ffeb3b' : 'transparent',
                            color: !somIniciado ? '#000' : 'rgba(255,255,255,0.72)',
                            boxShadow: !somIniciado ? '0 0 10px rgba(255, 235, 59, 0.8)' : 'none',
                            animation: !somIniciado ? 'pulseSom 1.5s infinite' : 'none',
                            '@keyframes pulseSom': {
                                '0%': { transform: 'scale(1)' },
                                '50%': { transform: 'scale(1.05)', bgcolor: '#fff59d' },
                                '100%': { transform: 'scale(1)' }
                            },
                            '&:hover': {
                                bgcolor: !somIniciado ? '#fdd835' : 'rgba(255,255,255,0.08)',
                                color: !somIniciado ? '#000' : '#fff'
                            }
                        }}
                    >
                        {!somIniciado ? '⚠️ ATIVAR SOM' : audioBlocked ? 'ativar som' : 'som'}
                    </Button>
                </Box>
            </Box>

            {/* AVISO DE SOM NÃO ATIVADO */}
            {!somIniciado && (
                <Alert
                    severity="warning"
                    variant="filled"
                    action={
                        <Button color="inherit" size="small" onClick={dispararAlertaAVC} sx={{ fontWeight: 900 }}>
                            CLIQUE AQUI PARA ATIVAR
                        </Button>
                    }
                    sx={{
                        borderRadius: 0,
                        py: 0.2,
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        bgcolor: '#f57c00',
                        color: '#fff'
                    }}
                >
                    ⚠️ O alerta sonoro está inativo desde o reload. Clique em "ATIVAR SOM" para permitir os bipes de emergência.
                </Alert>
            )}

            {/* TELA CHEIA DE ALERTA COM MUNICÍPIO E NÚMERO DO CHAMADO */}
            {avcAlertVisible && (
                <Box sx={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9999,
                    bgcolor: '#901AF0',
                    color: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    p: 3,
                    animation: 'avcPulse 0.5s infinite alternate',
                    '@keyframes avcPulse': {
                        from: { bgcolor: '#7f25c9' },
                        to: { bgcolor: '#590A99' }
                    }
                }}>
                    <Typography sx={{
                        fontSize: { xs: '2.5rem', sm: '4rem', md: '6rem' },
                        fontWeight: 900,
                        lineHeight: 1.1,
                        textTransform: 'uppercase',
                        textShadow: '0 4px 12px rgba(0,0,0,0.45)',
                        mb: 3
                    }}>
                        CHAMADO DE AVC!
                    </Typography>

                    {novosAvcDetalhes.map((item, idx) => (
                        <Box key={idx} sx={{ bgcolor: 'rgba(0, 0, 0, 0.3)', p: 3, borderRadius: 2, mb: 2, maxWidth: '900px', width: '100%' }}>
                            <Typography sx={{ fontSize: { xs: '1.5rem', md: '2.2rem' }, fontWeight: 800, color: '#ffeb3b', mb: 1 }}>
                                MUNICÍPIO: {item.cidade}
                            </Typography>
                            <Typography sx={{ fontSize: { xs: '1.2rem', md: '1.8rem' }, fontWeight: 700, mb: 1 }}>
                                Nº CHAMADO: {item.chamado}
                            </Typography>
                            <Typography sx={{ fontSize: { xs: '1rem', md: '1.4rem' }, opacity: 0.9 }}>
                                PACIENTE: {item.paciente}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            )}

            {error && <Alert severity="warning" sx={{ borderRadius: 0, py: 0 }}>Não foi possível atualizar os dados: {error}</Alert>}
            <Box sx={{ pt: 1, pb: 1, borderBottom: '1px solid #ccc', flexShrink: 0 }}><SummaryCards data={data} /></Box>
            <Box sx={{ width: '100%', px: pagePadding, py: 1, flexShrink: 0 }}><ChartsSection data={data} /></Box>
            <Box sx={{ width: '100%', px: pagePadding, pb: 1, flexShrink: 0 }}>

                <VehiclesTable data={data.municipios ?? []} totalViaturas={data.totalViaturas} />
            </Box>
        </Box>
    );
}
