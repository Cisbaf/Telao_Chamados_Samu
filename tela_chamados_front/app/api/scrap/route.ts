import { NextResponse } from 'next/server';
import { scrapeData } from '@/lib/oldScrap';
import type { ScrapData } from '@/lib/oldScrap';

function positiveNumber(value: string | undefined, fallback: number) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const SCRAP_CACHE_TTL_MS = positiveNumber(process.env.SCRAP_CACHE_TTL_MS, 30000);

let cachedData: ScrapData | null = null;
let cachedAt = 0;
let scrapeInFlight: Promise<ScrapData> | null = null;

export async function GET() {
    try {
        const now = Date.now();

        if (cachedData && now - cachedAt < SCRAP_CACHE_TTL_MS) {
            return NextResponse.json(cachedData, {
                status: 200,
                headers: { 'x-scrap-cache': 'hit' },
            });
        }

        if (scrapeInFlight && cachedData) {
            return NextResponse.json(cachedData, {
                status: 200,
                headers: { 'x-scrap-cache': 'stale-while-refresh' },
            });
        }

        if (!scrapeInFlight) {
            scrapeInFlight = scrapeData()
                .then((data) => {
                    cachedData = data;
                    cachedAt = Date.now();
                    return data;
                })
                .finally(() => {
                    scrapeInFlight = null;
                });
        }

        const data = await scrapeInFlight;
        return NextResponse.json(data, { status: 200 });
    } catch (err) {
        console.error('API scrap error', err);
        return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
    }
}
