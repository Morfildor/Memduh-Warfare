import { SAVE_KEY } from '../constants';

export interface ScoreRecord {
    score: number;
    stage: number;
    date: string;
}

interface SaveData {
    records: ScoreRecord[];
    music: boolean;
    sfx: boolean;
    seenTutorial: boolean;
}

const DEFAULTS: SaveData = { records: [], music: true, sfx: true, seenTutorial: false };

// localStorage can throw (private mode, blocked storage) - the game must still run.
let cache: SaveData | null = null;

function load(): SaveData {
    if (cache) return cache;
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        cache = raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
    } catch {
        cache = { ...DEFAULTS };
    }
    return cache!;
}

function persist() {
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(cache));
    } catch {
        /* ignore */
    }
}

export const Save = {
    get records() {
        return load().records;
    },
    get best() {
        return load().records[0]?.score ?? 0;
    },
    get music() {
        return load().music;
    },
    get sfx() {
        return load().sfx;
    },
    get seenTutorial() {
        return load().seenTutorial;
    },
    set(key: 'music' | 'sfx' | 'seenTutorial', v: boolean) {
        load()[key] = v;
        persist();
    },
    /** Returns the rank (0-based) the score reached, or -1 if it did not make the table. */
    addRecord(score: number, stage: number): number {
        const d = load();
        const rec: ScoreRecord = { score, stage, date: new Date().toLocaleDateString('tr-TR') };
        d.records.push(rec);
        d.records.sort((a, b) => b.score - a.score);
        d.records = d.records.slice(0, 5);
        persist();
        return d.records.indexOf(rec);
    },
};

