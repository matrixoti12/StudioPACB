import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import {
    Plus, Music, Trash2, X, Monitor, Search, BookOpen,
    ClipboardList, Loader2, AlertCircle, CheckCircle2,
    ChevronDown, ArrowLeft, Sparkles, LayoutList, ChevronRight
} from 'lucide-react';
import SongEditor from './SongEditor';
import ScreenSettings from './ScreenSettings';

// ── Cancioneros Bundled ───────────────────────────────────────────────────────
import canciones  from '../data/cancioneros/canciones.json';
import ipuc       from '../data/cancioneros/ipuc.json';
import himnario   from '../data/cancioneros/himnario.json';
import infantiles from '../data/cancioneros/infantiles.json';
import manantial  from '../data/cancioneros/manantial.json';
import micancionero from '../data/cancioneros/micancionero.json';

const CANCIONEROS = [
    { key: 'canciones',    label: 'Canciones Generales',          data: canciones    },
    { key: 'ipuc',         label: 'Corario IPUC Castilla',        data: ipuc         },
    { key: 'himnario',     label: 'Himnario Lluvias de Bendición',data: himnario     },
    { key: 'infantiles',   label: 'Infantiles',                   data: infantiles   },
    { key: 'manantial',    label: 'Manantial de Inspiración',     data: manantial    },
    { key: 'micancionero', label: 'Mi Cancionero',                data: micancionero },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const cleanText = (raw) => {
    if (!raw) return '';
    let t = raw;
    try { t = decodeURIComponent(escape(t)); } catch (_) {}
    
    // Normalizar saltos de línea
    t = t.replace(/\r\n|\r/g, '\n');

    // 1. Eliminar etiquetas de estructura ruidosas como [Coro], (Verso 1), etc.
    // Se eliminan para limpiar el texto base, la estructura se detectará por repetición/bloques.
    t = t.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '');

    // 2. Anti-Fragmentación y limpieza
    t = t.replace(/[^\S\r\n]+/g, ' ') // Múltiples espacios (no saltos) a uno solo
         .split('\n').map(l => l.trim()) // Trim a cada línea
         .join('\n')
         .replace(/\n{3,}/g, '\n\n') // Máximo 2 saltos de línea consecutivos
         .trim();
         
    return t;
};

const SYSTEM_PROMPT = `Eres un experto en proyección de letras para iglesias. Tu tarea es convertir letras de canciones en formato JSON estructurado.

REGLAS DE AGRUPACIÓN (EVITAR EXCESO DE SLIDES):
1. Agrupamiento Lógico: NUNCA generes un slide de una sola línea a menos que sea el final de una sección. Agrupa de 2 en 2 o de 3 en 3 líneas que rimen o tengan sentido juntas.
2. Eliminación de Repeticiones: Solo genera CADA SECCIÓN UNA VEZ (Verso 1, Coro, Puente). El software cliente se encargará de repetir el bloque si es necesario.
3. Limpieza Absoluta: Elimina frases como "Canta conmigo", "Levanta tus manos", "Instrumental" o introducciones habladas.
4. Máximo de Slides: Una canción estándar no debería superar los 10-15 slides totales tras eliminar repeticiones.

FORMATO DE SALIDA (JSON ESTRICTO):
{
    "titulo": "Nombre",
    "artista": "Nombre",
    "secciones": [
        {
            "nombre": "Nombre de la Sección (Ej: Coro)",
            "slides": [
                ["Línea 1", "Línea 2"],
                ["Línea 3", "Línea 4"]
            ]
        }
    ]
}
Responde ÚNICAMENTE con el JSON válido, sin bloques de código markdown ni explicaciones.`;

const localStructureSong = (rawText, titleHint = '') => {
    const text = cleanText(rawText);
    const rawBlocks = text.split(/\n\n+/).map(b => b.trim()).filter(Boolean);

    // Normalize block for comparison
    const normalize = (s) => s.toLowerCase().replace(/[^a-záéíóúüñ\s]/g, '').replace(/\s+/g, ' ').trim();

    // Count occurrences to identify what's a coro (appears ≥2 times)
    const counts = {};
    rawBlocks.forEach(b => {
        const k = normalize(b);
        counts[k] = (counts[k] || 0) + 1;
    });
    const chorusKeys = new Set(Object.entries(counts).filter(([, v]) => v >= 2).map(([k]) => k));

    // Build sections — PRESERVING ORDER, avoiding exact repetitions
    let versoNum = 1;
    let puenteNum = 1;
    const seenLabels = new Map();
    const sections = [];
    let hasSeenCoro = false;

    for (const block of rawBlocks) {
        const k = normalize(block);
        
        // Si el bloque ya fue procesado y guardado, saltarlo para evitar repeticiones
        if (seenLabels.has(k)) {
            continue;
        }

        const isCoro = chorusKeys.has(k);

        if (isCoro) {
            hasSeenCoro = true;
            const label = 'Coro';
            seenLabels.set(k, label);
            sections.push({ nombre: label, block });
        } else {
            // Verso / Puente individuales
            const lines = block.split('\n').filter(Boolean);
            const avgLen = lines.length
                ? lines.reduce((s, l) => s + l.length, 0) / lines.length
                : 0;

            const isPuente = hasSeenCoro && avgLen < 25 && lines.length <= 2;

            let label;
            if (isPuente) {
                label = `Puente${puenteNum > 1 ? ' ' + puenteNum : ''}`;
                puenteNum++;
            } else {
                label = `Verso ${versoNum}`;
                versoNum++;
            }
            seenLabels.set(k, label);
            sections.push({ nombre: label, block });
        }
    }

    // Divide each section block into slides with Intelligent Grouping (2-3 lines)
    const makeSections = (sects) => sects.map((sec, si) => {
        const lines = sec.block.split('\n').filter(Boolean);
        const slides = [];
        
        // Algoritmo de agrupación inteligente para evitar slides huérfanos (1 línea)
        let i = 0;
        while (i < lines.length) {
            const remaining = lines.length - i;
            let take = 2; // Default 2 lines

            if (remaining === 1) {
                // Should not happen if logic below is correct, but take it
                take = 1;
            } else if (remaining === 3) {
                take = 3; // Perfect triplet
            } else if (remaining === 5) {
                take = 3; // 3 + 2 is better than 2 + 2 + 1
            }
            // else if remaining is 4 -> take 2 (leaves 2)
            // else if remaining >= 6 -> take 2 (leaves >= 4)
            
            const chunk = lines.slice(i, i + take);
            if (chunk.length > 0) slides.push(chunk);
            i += take;
        }

        const now = Date.now();
        return {
            id: `sec_local_${now}_${si}`,
            nombre: sec.nombre,
            slides: slides.map((sl, li) => {
                // Cálculo duración estimado
                const joinedText = sl.join(' ');
                const words = joinedText.split(/\s+/).filter(Boolean).length;
                let duration = 4;
                if (words > 25) duration = 8;
                else if (words > 12) duration = 6;
                
                return {
                    id: `slide_local_${now}_${si}_${li}`,
                    lineas: sl,
                    duracion: duration
                };
            })
        };
    }).filter(s => s.slides.length > 0);

    return {
        id: Date.now().toString(),
        title: titleHint || 'Nueva Canción',
        artista: '',
        secciones: makeSections(sections),
        fechaCreacion: new Date().toISOString(),
        ultimaModificacion: new Date().toISOString(),
        ultimaUsada: null,
        _localStructured: true
    };
};

const ADD_MODES = { PASTE: 'paste', CANCIONERO: 'cancionero', SEARCH: 'search' };

// ── Component ─────────────────────────────────────────────────────────────────
export default function LibraryPanel({ onClose }) {
    const songs       = useStore(s => s.songs);
    const addSong     = useStore(s => s.addSong);
    const removeSong  = useStore(s => s.removeSong);
    const addToSet    = useStore(s => s.addToSet);
    const [mainTab, setMainTab] = useState('library');
    const [isAdding, setIsAdding] = useState(false);
    const [addMode, setAddMode] = useState(ADD_MODES.PASTE);

    // Paste mode
    const [pasteText, setPasteText] = useState('');

    // Cancionero mode
    const [selectedCat, setSelectedCat] = useState(CANCIONEROS[0].key);
    const [catSearch, setCatSearch] = useState('');

    // Online search state machine: idle → searching → results → lyrics → ai
    const [searchQuery, setSearchQuery] = useState('');
    const [searchStatus, setSearchStatus] = useState('idle'); // idle|loading|results|error
    const [searchResults, setSearchResults] = useState([]);   // suggested list
    const [searchError, setSearchError] = useState('');
    const [pickedSong, setPickedSong] = useState(null);       // { artist, title }
    const [lyricsStatus, setLyricsStatus] = useState('idle'); // idle|loading|ok|error
    const [lyricsText, setLyricsText] = useState('');

    // AI
    const [isGenerating, setIsGenerating] = useState(false);
    const [draftSong, setDraftSong] = useState(null);

    // ── Handle mode reset ──────────────────────────────────────────────────────
    const openAddPanel = () => {
        setIsAdding(true);
        setAddMode(ADD_MODES.PASTE);
        setPasteText('');
        resetSearch();
    };

    const resetSearch = () => {
        setSearchQuery('');
        setSearchStatus('idle');
        setSearchResults([]);
        setSearchError('');
        setPickedSong(null);
        setLyricsStatus('idle');
        setLyricsText('');
    };

    // ── AI Structuring — Gemini (gratis) → DeepSeek → local ───────────────────
    const handleAIGeneration = async (rawText, titleHint = '') => {
        const query = cleanText(rawText);
        if (!query) return;
        setIsGenerating(true);
        // Don't close panel yet, wait for result
        // setIsAdding(false); 

        const geminiKey   = import.meta.env.VITE_GEMINI_API_KEY;

        // Helper: parse AI JSON response into structured song
        const parseAndBuild = (raw, source) => {
            let content = raw.trim().replace(/^```json|^```|```$/gi, '').trim();
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) content = jsonMatch[0];
            const parsed = JSON.parse(content);
            if (parsed.titulo === undefined) throw new Error(`${source}: falta "titulo"`);
            if (!Array.isArray(parsed.secciones) || !parsed.secciones.length)
                throw new Error(`${source}: sin secciones`);

            const secciones = parsed.secciones.map((sec, si) => {
                const slides = (sec.slides || []).map((rawSlide, li) => {
                    let safeLines;

                    if (Array.isArray(rawSlide)) {
                        // Permitimos hasta 12 líneas por slide para dar flexibilidad a la IA
                        safeLines = rawSlide.slice(0, 12);
                    } else if (rawSlide && typeof rawSlide === 'object') {
                        // Formatos alternativos
                        if (Array.isArray(rawSlide.lineas)) {
                            safeLines = rawSlide.lineas.slice(0, 12);
                        } else if (Array.isArray(rawSlide.lines)) {
                            safeLines = rawSlide.lines.slice(0, 12);
                        } else if (Array.isArray(rawSlide.texto)) {
                            safeLines = rawSlide.texto.slice(0, 12);
                        } else if (typeof rawSlide.text === 'string') {
                            safeLines = [rawSlide.text];
                        } else {
                            safeLines = [JSON.stringify(rawSlide)];
                        }
                    } else {
                        safeLines = [String(rawSlide)];
                    }

                    // Cálculo de duración inteligente
                    const joinedText = safeLines.join(' ');
                    const words = joinedText.split(/\s+/).filter(Boolean).length;
                    const chars = joinedText.length;
                    
                    let duration = 4; // base
                    if (words > 25 || chars > 120) duration = 8;
                    else if (words > 12 || chars > 60) duration = 6;
                    
                    return {
                        id: `s_${Date.now()}_${si}_${li}`,
                        lineas: safeLines,
                        duracion: duration
                    };
                });

                return {
                    id: `sec_${Date.now()}_${si}`,
                    nombre: sec.nombre || 'Sección',
                    slides
                };
            }).filter(s => s.slides.length > 0);

            return {
                id: Date.now().toString(),
                title: parsed.titulo,
                artista: parsed.artista || '',
                secciones,
                fechaCreacion: new Date().toISOString(),
                ultimaModificacion: new Date().toISOString(),
                ultimaUsada: null
            };
        };

        const userMsg = `Aplica el análisis estructural a esta letra${titleHint ? ` de "${titleHint}"` : ''}:\n\n${query}`;

        // ── 1. Intentar con Google Gemini (gratis) ──────────────────────────────
        if (geminiKey && !geminiKey.includes('TU_LLAVE')) {
            try {
                // Usamos la versión controlada '002' (más reciente estable) o fallback a 'gemini-pro' si falla la anterior
              const gUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
                const gRes = await fetch(gUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        system_instruction: {
                            parts: [{ text: SYSTEM_PROMPT }]
                        },
                        contents: [{
                            role: "user",
                            parts: [{ text: userMsg }]
                        }],
                        generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
                    })
                });

                if (!gRes.ok) {
                    if (gRes.status === 404) {
                        throw new Error('Modelo Gemini no encontrado o URL incorrecta (404). Verifique la versión del modelo.');
                    }
                    const errText = await gRes.text();
                    console.error('❌ Gemini API Error:', gRes.status, errText);
                    throw new Error(`Gemini API Error: ${gRes.status} - ${errText}`);
                }

                const gData = await gRes.json();
                console.log('🤖 RAW GEMINI RESPONSE:', JSON.stringify(gData, null, 2));
                const text = gData?.candidates?.[0]?.content?.parts?.[0]?.text;
                
                if (text) {
                    const draft = parseAndBuild(text, 'Gemini');
                    setDraftSong(draft);
                    setIsAdding(false);
                    resetSearch();
                    setPasteText('');
                    setIsGenerating(false);
                    return;
                }
            } catch(e) {
                console.warn('⚠️ Gemini falló, usando fallback local:', e.message);
                
                // Opcional: Mostrar alerta al usuario para que sepa por qué falló
                // alert(`Error AI: ${e.message}. Usando modo local.`);
            }
        }

        // ── 2. Fallback: algoritmo local (siempre funciona) ─────────────────────
        console.info('Usando estructurador local como fallback.');
        const draft = localStructureSong(query, titleHint);
        setDraftSong(draft);
        setIsAdding(false);
        resetSearch();
        setPasteText('');
        setIsGenerating(false);
    };

    // ── Lyrics.ovh Suggest Search ──────────────────────────────────────────────
    const handleSuggestSearch = async () => {
        if (!searchQuery.trim()) return;
        setSearchStatus('loading');
        setSearchResults([]);
        setSearchError('');
        setPickedSong(null);
        setLyricsStatus('idle');
        setLyricsText('');

        try {
            const url = `https://api.lyrics.ovh/suggest/${encodeURIComponent(searchQuery.trim())}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Sin resultados para esa búsqueda');
            const data = await res.json();
            if (!data.data || data.data.length === 0) throw new Error('No se encontraron canciones');
            setSearchResults(data.data.slice(0, 12)); // max 12 resultados
            setSearchStatus('results');
        } catch (err) {
            setSearchError(err.message);
            setSearchStatus('error');
        }
    };

    // ── Fetch lyrics for a picked song ─────────────────────────────────────────
    const handlePickSong = async (song) => {
        setPickedSong(song);
        setLyricsStatus('loading');
        setLyricsText('');

        try {
            const artist = song.artist.name;
            const title  = song.title;
            const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('No se pudo obtener la letra');
            const data = await res.json();
            if (!data.lyrics) throw new Error('Sin letra disponible');
            setLyricsText(data.lyrics);
            setLyricsStatus('ok');
        } catch (err) {
            setLyricsStatus('error');
            setLyricsText(err.message);
        }
    };

    // ── Cancionero filtered list ───────────────────────────────────────────────
    const currentCat = CANCIONEROS.find(c => c.key === selectedCat) || CANCIONEROS[0];
    const filteredSongs = catSearch.length > 0
        ? currentCat.data.filter(s => s.titulo.toLowerCase().includes(catSearch.toLowerCase())).slice(0, 80)
        : currentCat.data.slice(0, 80);

    // ── Styles ────────────────────────────────────────────────────────────────
    const pill = (active) => ({
        display: 'flex', alignItems: 'center', gap: '0.35rem',
        padding: '0.4rem 0.7rem', borderRadius: 'var(--radius-full)',
        fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
        border: 'none', transition: 'all 0.15s',
        background: active ? 'var(--accent)' : 'var(--bg-elevated)',
        color: active ? '#000' : 'var(--text-secondary)',
    });

    const infoBox = (color, icon, text) => (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.6rem 0.8rem', background: `${color}12`, border: `1px solid ${color}30`, borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            {icon}<span>{text}</span>
        </div>
    );

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="panel flex-col" style={{ borderRight: '1px solid var(--border-color)', height: '100%' }}>

            {/* ── Header ── */}
            <div className="panel-header flex-row justify-between" style={{ paddingBottom: '0.5rem', borderBottom: 'none' }}>
                <h2 style={{ margin: 0 }}>
                    {mainTab === 'library' ? <><Music size={18} /> Librería</> : <><Monitor size={18} /> Pantalla</>}
                </h2>
                {onClose && <button onClick={onClose} style={{ padding: '0.3rem', border: 'none', background: 'transparent', color: 'var(--text-secondary)' }}><X size={18} /></button>}
            </div>

            {/* ── Main Tabs ── */}
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
                <div className="segmented-control">
                    <button onClick={() => setMainTab('library')} className={mainTab === 'library' ? 'active' : ''}><Music size={14} /> Canciones</button>
                    <button onClick={() => setMainTab('settings')} className={mainTab === 'settings' ? 'active' : ''}><Monitor size={14} /> Pantalla</button>
                </div>
            </div>

            <div className="panel-content flex-col" style={{ flexGrow: 1, overflowY: 'auto', padding: '1rem', gap: 0 }}>

                {/* ══════════ LIBRARY TAB ══════════ */}
                {mainTab === 'library' && (
                    <>
                        {/* Section header */}
                        <div className="flex-row justify-between" style={{ marginBottom: '0.75rem' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                {songs.length} canción{songs.length !== 1 ? 'es' : ''}
                            </span>
                            <button
                                className={isAdding ? '' : 'primary'}
                                onClick={isAdding ? () => setIsAdding(false) : openAddPanel}
                                style={{ padding: '0.4rem 0.9rem', fontSize: '0.82rem' }}
                            >
                                {isAdding ? <><X size={13} /> Cancelar</> : <><Plus size={13} /> Nueva</>}
                            </button>
                        </div>

                        {/* ── ADD PANEL ── */}
                        {isAdding && (
                            <div style={{
                                background: 'linear-gradient(145deg,var(--bg-secondary),var(--bg-tertiary))',
                                border: '1px solid var(--accent)40',
                                borderRadius: 'var(--radius-md)',
                                padding: '1rem',
                                marginBottom: '1rem',
                            }}>
                                {/* Header */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.9rem' }}>
                                    <Sparkles size={15} color="var(--accent)" />
                                    <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Estructurador IA</span>
                                </div>

                                {/* Mode pills */}
                                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                    <button style={pill(addMode === ADD_MODES.PASTE)} onClick={() => setAddMode(ADD_MODES.PASTE)}>
                                        <ClipboardList size={12} /> Pegar Letra
                                    </button>
                                    <button style={pill(addMode === ADD_MODES.CANCIONERO)} onClick={() => setAddMode(ADD_MODES.CANCIONERO)}>
                                        <BookOpen size={12} /> Cancionero
                                    </button>
                                    <button style={pill(addMode === ADD_MODES.SEARCH)} onClick={() => { setAddMode(ADD_MODES.SEARCH); resetSearch(); }}>
                                        <Search size={12} /> Buscar Online
                                    </button>
                                </div>

                                {/* ── PASTE MODE ── */}
                                {addMode === ADD_MODES.PASTE && (
                                    <div>
                                        {infoBox('#00d2ff', <ClipboardList size={13} style={{ color: '#00d2ff', flexShrink: 0, marginTop: 2 }} />, 'Pega la letra sucia de Letras.com. La IA la ordenará en Verso, Coro y Puente.')}
                                        <textarea
                                            rows={7}
                                            placeholder="Pega la letra aquí..."
                                            value={pasteText}
                                            onChange={e => setPasteText(e.target.value)}
                                            disabled={isGenerating}
                                            style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem', resize: 'vertical' }}
                                        />
                                        <button
                                            className="primary w-full"
                                            onClick={() => handleAIGeneration(pasteText)}
                                            disabled={isGenerating || !pasteText.trim()}
                                            style={{ padding: '0.65rem', fontWeight: 700 }}
                                        >
                                            {isGenerating ? <><Loader2 size={14} className="spin" /> Estructurando...</> : '🪄 Organizar con IA'}
                                        </button>
                                    </div>
                                )}

                                {/* ── CANCIONERO MODE ── */}
                                {addMode === ADD_MODES.CANCIONERO && (
                                    <div>
                                        {/* Book selector */}
                                        <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                                            Libro ({currentCat.data.length} canciones)
                                        </label>
                                        <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                                            <select
                                                value={selectedCat}
                                                onChange={e => { setSelectedCat(e.target.value); setCatSearch(''); }}
                                                style={{ width: '100%', padding: '0.5rem 2rem 0.5rem 0.7rem', appearance: 'none', cursor: 'pointer' }}
                                            >
                                                {CANCIONEROS.map(c => (
                                                    <option key={c.key} value={c.key}>{c.label} ({c.data.length})</option>
                                                ))}
                                            </select>
                                            <ChevronDown size={14} style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
                                        </div>

                                        {/* Search within book */}
                                        <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
                                            <Search size={13} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                            <input
                                                type="text"
                                                placeholder="Buscar canción..."
                                                value={catSearch}
                                                onChange={e => setCatSearch(e.target.value)}
                                                style={{ paddingLeft: '1.8rem', fontSize: '0.83rem' }}
                                            />
                                        </div>

                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                                            {catSearch ? `${filteredSongs.length} resultados` : `Mostrando 80 de ${currentCat.data.length}`} — clic para enviar a IA
                                        </div>

                                        {/* Songs list */}
                                        <div style={{ maxHeight: '220px', overflowY: 'auto', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)' }}>
                                            {filteredSongs.map(s => (
                                                <button
                                                    key={s.id}
                                                    onClick={() => handleAIGeneration(s.letra, s.titulo)}
                                                    disabled={isGenerating}
                                                    style={{ width: '100%', textAlign: 'left', padding: '0.45rem 0.7rem', borderRadius: 0, borderBottom: '1px solid var(--border-color)', fontSize: '0.82rem', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                                >
                                                    {s.titulo}
                                                </button>
                                            ))}
                                            {filteredSongs.length === 0 && (
                                                <p style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'center' }}>Sin resultados</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ── SEARCH ONLINE MODE ── */}
                                {addMode === ADD_MODES.SEARCH && (
                                    <div>
                                        {/* Step 1: Query */}
                                        {(searchStatus === 'idle' || searchStatus === 'loading' || searchStatus === 'error') && !pickedSong && (
                                            <>
                                                {infoBox('#818cf8', <Search size={13} style={{ color: '#818cf8', flexShrink: 0, marginTop: 2 }} />, 'Busca por artista o título. Te mostraré las opciones para que elijas la correcta.')}
                                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                    <input
                                                        type="text"
                                                        placeholder="Ej: Dios de pactos Marcos Witt..."
                                                        value={searchQuery}
                                                        onChange={e => setSearchQuery(e.target.value)}
                                                        onKeyDown={e => e.key === 'Enter' && handleSuggestSearch()}
                                                        style={{ flex: 1, fontSize: '0.85rem' }}
                                                        autoFocus
                                                    />
                                                    <button
                                                        className="primary"
                                                        onClick={handleSuggestSearch}
                                                        disabled={searchStatus === 'loading' || !searchQuery.trim()}
                                                        style={{ padding: '0.5rem 0.75rem', flexShrink: 0 }}
                                                    >
                                                        {searchStatus === 'loading' ? <Loader2 size={14} className="spin" /> : <Search size={14} />}
                                                    </button>
                                                </div>
                                                {searchStatus === 'error' && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f87171', fontSize: '0.78rem', marginTop: '0.4rem' }}>
                                                        <AlertCircle size={13} /> {searchError}
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {/* Step 2: Results list */}
                                        {searchStatus === 'results' && !pickedSong && (
                                            <>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{searchResults.length} versiones encontradas — elige una</span>
                                                    <button onClick={resetSearch} style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', border: 'none', background: 'transparent', color: 'var(--text-secondary)' }}><ArrowLeft size={12} /> Nueva búsqueda</button>
                                                </div>
                                                <div style={{ maxHeight: '230px', overflowY: 'auto', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)' }}>
                                                    {searchResults.map((song, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => handlePickSong(song)}
                                                            style={{ width: '100%', textAlign: 'left', padding: '0.55rem 0.75rem', borderRadius: 0, borderBottom: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.1rem' }}
                                                        >
                                                            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</span>
                                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{song.artist?.name}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}

                                        {/* Step 3: Lyrics preview for selected song */}
                                        {pickedSong && (
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                                                    <button onClick={() => { setPickedSong(null); }} style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}><ArrowLeft size={12} /> Volver</button>
                                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                                        <div style={{ fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pickedSong.title}</div>
                                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{pickedSong.artist?.name}</div>
                                                    </div>
                                                </div>

                                                {lyricsStatus === 'loading' && (
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-secondary)', padding: '1.5rem', fontSize: '0.82rem' }}>
                                                        <Loader2 size={16} className="spin" /> Obteniendo letra...
                                                    </div>
                                                )}

                                                {lyricsStatus === 'error' && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f87171', fontSize: '0.78rem', padding: '0.5rem' }}>
                                                        <AlertCircle size={13} /> {lyricsText}
                                                    </div>
                                                )}

                                                {lyricsStatus === 'ok' && (
                                                    <>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#4ade80', fontSize: '0.78rem', marginBottom: '0.5rem' }}>
                                                            <CheckCircle2 size={13} /> Letra obtenida
                                                        </div>
                                                        <div style={{ maxHeight: '140px', overflowY: 'auto', padding: '0.55rem', background: 'rgba(0,0,0,0.35)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', marginBottom: '0.75rem', border: '1px solid var(--border-color)', lineHeight: 1.6 }}>
                                                            {lyricsText}
                                                        </div>
                                                        <button
                                                            className="primary w-full"
                                                            onClick={() => handleAIGeneration(lyricsText, pickedSong.title)}
                                                            disabled={isGenerating}
                                                            style={{ padding: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                                        >
                                                            {isGenerating ? <><Loader2 size={14} className="spin" /> Estructurando...</> : '🪄 Organizar con IA'}
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Generating overlay */}
                                {isGenerating && (
                                    <div style={{ marginTop: '0.75rem', textAlign: 'center', color: 'var(--accent)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                        <Loader2 size={14} className="spin" /> La IA está organizando en Versos, Coros y Puentes...
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Song Library List ── */}
                        {songs.length === 0 && !isAdding && (
                            <div style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem' }}>
                                <Music size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.15 }} />
                                <p style={{ fontSize: '0.9rem' }}>No hay canciones guardadas.</p>
                                <p style={{ fontSize: '0.78rem', marginTop: '0.25rem', opacity: 0.6 }}>Usa "Nueva" para agregar una canción.</p>
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {songs.map(song => (
                                <div
                                    key={song.id}
                                    className="card"
                                    onClick={() => addToSet(song)}
                                    title="Clic para agregar al Set"
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.7rem 0.9rem', marginBottom: 0 }}
                                >
                                    <Music size={14} style={{ color: 'var(--accent)', flexShrink: 0, opacity: 0.7 }} />
                                    <div style={{ flexGrow: 1, overflow: 'hidden' }}>
                                        <div style={{ fontSize: '0.88rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                                            {song.secciones ? song.secciones.reduce((a, s) => a + s.slides.length, 0) : song.blocks?.length} diapositivas
                                            {song.artista ? ` · ${song.artista}` : ''}
                                        </div>
                                    </div>
                                    <button
                                        className="danger"
                                        onClick={e => { e.stopPropagation(); removeSong(song.id); }}
                                        style={{ padding: '0.35rem', minWidth: 'auto', border: 'none', borderRadius: 'var(--radius-sm)' }}
                                        title="Eliminar"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* ══════════ SETTINGS TAB ══════════ */}
                {mainTab === 'settings' && <ScreenSettings />}
            </div>

            {/* ── SONG EDITOR MODAL ── */}
            {draftSong && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(4,9,20,0.96)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div style={{ width: '95%', maxWidth: '1400px', height: '95vh', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', boxShadow: '0 30px 60px rgba(0,0,0,0.9)', overflow: 'hidden', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>

                        {/* ── AI Confirmation Banner ── */}
                        <div style={{
                            padding: '0.75rem 1.25rem',
                            background: 'linear-gradient(90deg, rgba(56,189,248,0.08), rgba(99,102,241,0.08))',
                            borderBottom: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.75rem',
                        }}>
                            <CheckCircle2 size={18} style={{ color: '#4ade80', flexShrink: 0, marginTop: 2 }} />
                            <div style={{ flexGrow: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                                    IA completó la estructuración — {draftSong.secciones?.length || 0} secciones · {draftSong.secciones?.reduce((a, s) => a + s.slides.length, 0) || 0} diapositivas
                                    {draftSong._localStructured && <span style={{ marginLeft: '0.5rem', fontSize: '0.72rem', background: 'rgba(251,191,36,0.15)', color: '#fbbf24', padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-full)', border: '1px solid rgba(251,191,36,0.3)' }}>⚡ Modo Local</span>}
                                </div>
                                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                    {draftSong.secciones?.map((sec, i) => (
                                        <div key={i} style={{
                                            display: 'flex', alignItems: 'center', gap: '0.25rem',
                                            padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-full)',
                                            fontSize: '0.73rem', fontWeight: 600,
                                            background: sec.nombre.toLowerCase().includes('coro') ? 'rgba(56,189,248,0.15)'
                                                    : sec.nombre.toLowerCase().includes('puente') ? 'rgba(167,139,250,0.15)'
                                                    : 'rgba(255,255,255,0.06)',
                                            color: sec.nombre.toLowerCase().includes('coro') ? '#38bdf8'
                                                 : sec.nombre.toLowerCase().includes('puente') ? '#a78bfa'
                                                 : 'var(--text-secondary)',
                                            border: '1px solid rgba(255,255,255,0.08)',
                                        }}>
                                            <LayoutList size={10} />
                                            {sec.nombre}
                                            <ChevronRight size={10} style={{ opacity: 0.5 }} />
                                            {sec.slides.length} diapo{sec.slides.length !== 1 ? 's' : ''}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <SongEditor
                            draftSong={draftSong}
                            onSave={finalSong => { addSong(finalSong); setDraftSong(null); }}
                            onCancel={() => setDraftSong(null)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}