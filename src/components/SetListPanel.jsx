import React, { memo, useCallback, useState } from 'react';
import { useStore } from '../store/useStore';
import { Play, Pause, AlertTriangle, ArrowUp, ArrowDown, Trash2, ListOrdered, MonitorPlay, PowerOff, SkipForward, SkipBack, PlaySquare, Settings, Timer, Download } from 'lucide-react';
import { toPng } from 'html-to-image';
import JSZip from 'jszip';

// ─── Memoized Block Card ──────────────────────────────────────────────────────
// Extracted + memoized so that scrolling/clicking one block doesn't re-render ALL
const BlockCard = memo(function BlockCard({ block, isActive, autoMode, smartAuto, onClick }) {
    return (
        <div
            className={`block-card ${isActive ? 'active' : ''}`}
            style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}
            onClick={onClick}
        >
            {block.sectionName && (
                <div style={{
                    fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--accent)',
                    textTransform: 'uppercase', marginBottom: '0.3rem', letterSpacing: '0.5px'
                }}>
                    {block.sectionName}
                </div>
            )}
            <div style={{ flexGrow: 1 }}>{block.text || '(Estrofa Vacía)'}</div>
            {isActive && autoMode && smartAuto && (
                <div style={{ position: 'absolute', bottom: '2px', right: '4px', fontSize: '0.6rem', opacity: 0.7 }}>
                    ⏱ Auto
                </div>
            )}
        </div>
    );
});

// ─── Memoized Song Card ───────────────────────────────────────────────────────
const SongCard = memo(function SongCard({
    song, sIdx, isSongActive, activeSongIndex, activeBlockIndex,
    autoMode, smartAuto, isLive,
    onSetActiveSong, onSetActiveBlock, onSetLiveState,
    onMoveUp, onMoveDown, onRemove,
    totalSongs
}) {
    return (
        <div key={song.setId} className={`card ${isSongActive ? 'active' : ''}`} style={{ padding: '1rem' }}>
            <div className="flex-row justify-between mb-4">
                <div
                    className="card-title"
                    onClick={() => onSetActiveSong(sIdx)}
                    style={{ fontSize: '1.2rem', cursor: 'pointer', flexGrow: 1 }}
                >
                    {sIdx + 1}. {song.title}
                </div>
                <div className="segmented-control">
                    <button onClick={() => onMoveUp(sIdx)} disabled={sIdx === 0} title="Mover Arriba"><ArrowUp size={16} /></button>
                    <button onClick={() => onMoveDown(sIdx)} disabled={sIdx === totalSongs - 1} title="Mover Abajo"><ArrowDown size={16} /></button>
                    <button onClick={() => onRemove(song.setId)} style={{ color: 'var(--danger)' }} title="Eliminar del Set"><Trash2 size={16} /></button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.8rem' }}>
                {song.blocks.map((block, bIdx) => {
                    const isBlockActive = isSongActive && activeBlockIndex === bIdx;
                    return (
                        <BlockCard
                            key={bIdx}
                            block={block}
                            isActive={isBlockActive}
                            autoMode={autoMode}
                            smartAuto={smartAuto}
                            onClick={() => {
                                onSetActiveSong(sIdx);
                                onSetActiveBlock(bIdx);
                                if (!isLive) onSetLiveState(true);
                            }}
                        />
                    );
                })}
            </div>
        </div>
    );
});

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SetListPanel() {
    // Granular selectors — each one only re-renders when that specific value changes
    const setList          = useStore(s => s.setList);
    const activeSongIndex  = useStore(s => s.activeSongIndex);
    const activeBlockIndex = useStore(s => s.activeBlockIndex);
    const isLive           = useStore(s => s.isLive);
    const isBlackScreen    = useStore(s => s.isBlackScreen);
    const autoMode         = useStore(s => s.autoMode);
    const smartAuto        = useStore(s => s.smartAuto);
    const autoInterval     = useStore(s => s.autoInterval);
    const globalSpeedFactor = useStore(s => s.globalSpeedFactor);

    const setActiveSong    = useStore(s => s.setActiveSong);
    const setActiveBlock   = useStore(s => s.setActiveBlock);
    const setLiveState     = useStore(s => s.setLiveState);
    const toggleLive       = useStore(s => s.toggleLive);
    const toggleBlackScreen = useStore(s => s.toggleBlackScreen);
    const toggleAutoMode   = useStore(s => s.toggleAutoMode);
    const toggleSmartAuto  = useStore(s => s.toggleSmartAuto);
    const setAutoInterval  = useStore(s => s.setAutoInterval);
    const setGlobalSpeedFactor = useStore(s => s.setGlobalSpeedFactor);
    const nextBlock        = useStore(s => s.nextBlock);
    const prevBlock        = useStore(s => s.prevBlock);
    const removeFromSet    = useStore(s => s.removeFromSet);
    const reorderSet       = useStore(s => s.reorderSet);
    const clearSet         = useStore(s => s.clearSet);

    const [isGenerating, setIsGenerating] = useState(false);
    const liveWindowRef = React.useRef(null);

    // Stable callbacks (prevent BlockCard/SongCard prop equality breaks)
    const handleMoveUp = useCallback((index) => {
        if (index === 0) return;
        const newSet = [...setList];
        [newSet[index - 1], newSet[index]] = [newSet[index], newSet[index - 1]];
        reorderSet(newSet);
        if (activeSongIndex === index) setActiveSong(index - 1);
        else if (activeSongIndex === index - 1) setActiveSong(index);
    }, [setList, activeSongIndex, reorderSet, setActiveSong]);

    const handleMoveDown = useCallback((index) => {
        if (index === setList.length - 1) return;
        const newSet = [...setList];
        [newSet[index + 1], newSet[index]] = [newSet[index], newSet[index + 1]];
        reorderSet(newSet);
        if (activeSongIndex === index) setActiveSong(index + 1);
        else if (activeSongIndex === index + 1) setActiveSong(index);
    }, [setList, activeSongIndex, reorderSet, setActiveSong]);

    const openLiveWindow = useCallback(() => {
        if (liveWindowRef.current && !liveWindowRef.current.closed) {
            liveWindowRef.current.focus();
        } else {
            liveWindowRef.current = window.open('#/live', 'PactoLiveWindow', 'width=1280,height=720,menubar=no,toolbar=no');
        }
    }, []);

    const handleDownloadBackup = async () => {
        if (setList.length === 0) return;
        setIsGenerating(true);

        try {
            const zip = new JSZip();
            // Container oculto para renderizar
            const container = document.createElement('div');
            Object.assign(container.style, {
                position: 'fixed', top: '-9999px', left: '-9999px',
                width: '1280px', height: '720px',
                backgroundColor: 'black', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '60px', padding: '60px',
                textAlign: 'center', fontFamily: 'Arial, sans-serif',
                lineHeight: '1.4', whiteSpace: 'pre-wrap'
            });
            document.body.appendChild(container);

            for (let sIdx = 0; sIdx < setList.length; sIdx++) {
                const song = setList[sIdx];
                const cleanTitle = song.title.replace(/[^a-z0-9]/gi, '_').substring(0, 30);
                const songFolder = zip.folder(`${sIdx + 1}_${cleanTitle}`);

                for (let bIdx = 0; bIdx < song.blocks.length; bIdx++) {
                    const block = song.blocks[bIdx];
                    container.innerText = block.text || '';
                    
                    // Renderizar
                    const dataUrl = await toPng(container, { quality: 0.9, width: 1280, height: 720 });
                    const base64Data = dataUrl.split(',')[1];
                    songFolder.file(`slide_${bIdx + 1}.png`, base64Data, { base64: true });
                }
            }

            // Descargar ZIP
            const content = await zip.generateAsync({ type: 'blob' });
            const url = window.URL.createObjectURL(content);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `Respaldo_Culto_${new Date().toISOString().slice(0, 10)}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            document.body.removeChild(container);

        } catch (error) {
            console.error("Error generando respaldo:", error);
            alert("Error al generar el respaldo de diapositivas.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="panel" style={{ flexGrow: 1, borderRight: '1px solid var(--border-color)' }}>
            <div className="panel-header flex-row justify-between">
                <h2><ListOrdered size={20} /> Set del Culto</h2>
                <div className="flex-row">
                    <button className="secondary" onClick={handleDownloadBackup} disabled={isGenerating || setList.length === 0} title="Guardar diapositivas como imágenes">
                        <Download size={16} /> {isGenerating ? 'Generando...' : 'Respaldo'}
                    </button>
                    <button className="danger" onClick={clearSet} title="Limpiar todo el set">Limpiar Set</button>
                    <button className="primary" onClick={openLiveWindow}>
                        <MonitorPlay size={16} /> Abrir Ventana Live
                    </button>
                </div>
            </div>

            <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.5rem' }}>

                {/* Controls */}
                <div className="toolbar flex-row justify-between" style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-lg)', flexWrap: 'wrap', gap: '1.5rem' }}>
                    <div className="flex-row gap-4" style={{ flexWrap: 'wrap' }}>
                        <button
                            className={isLive ? 'danger active' : 'primary'}
                            onClick={toggleLive}
                            style={{ padding: '0.85rem 1.75rem', fontWeight: 600, fontSize: '0.95rem' }}
                        >
                            {isLive ? <><Pause size={20} /> DETENER VIVO</> : <><Play size={20} /> TRANSMITIR EN VIVO</>}
                        </button>
                        <button
                            className={isBlackScreen ? 'danger active' : 'danger'}
                            onClick={toggleBlackScreen}
                            style={{ padding: '0.85rem 1.75rem', fontWeight: 600, fontSize: '0.95rem' }}
                        >
                            <PowerOff size={20} /> {isBlackScreen ? 'MOSTRAR LETRA' : 'PANTALLA NEGRA'}
                        </button>
                    </div>

                    <div className="flex-col" style={{ flexGrow: 1, minWidth: '300px', borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem' }}>
                        <div className="flex-row justify-between mb-2">
                            <label className="card-title flex-row" style={{ margin: 0, fontSize: '0.95rem', alignSelf: 'center' }}><Timer size={16} /> Automático</label>
                            <div className="segmented-control" style={{ flexGrow: 1, maxWidth: '200px' }}>
                                <button onClick={toggleSmartAuto} className={smartAuto ? 'active' : ''} style={{ fontSize: '0.75rem', padding: '0.4rem' }} title="Calcula el tiempo por palabras">
                                    Inteligente
                                </button>
                                <button onClick={toggleAutoMode} className={autoMode ? 'active' : ''} style={{ fontSize: '0.75rem', padding: '0.4rem' }}>
                                    {autoMode ? 'Auto ON' : 'Auto OFF'}
                                </button>
                            </div>
                        </div>

                        {!smartAuto ? (
                            <div className="flex-row" style={{ gap: '0.5rem', marginTop: '0.5rem' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', minWidth: '60px' }}>Fijo: {autoInterval}s</span>
                                <input type="range" min="1" max="15" step="0.5" value={autoInterval} onChange={(e) => setAutoInterval(parseFloat(e.target.value))} style={{ flexGrow: 1 }} />
                            </div>
                        ) : (
                            <div className="flex-col" style={{ marginTop: '0.5rem', gap: '0.5rem' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--accent)', textAlign: 'right' }}>✨ Tiempo dinámico activo</div>
                                <div className="flex-row justify-between mb-2">
                                    <label className="card-title flex-row" style={{ margin: 0, fontSize: '0.75rem', alignSelf: 'center', color: 'var(--text-secondary)' }}>Velocidad Global</label>
                                    <div className="segmented-control" style={{ flexGrow: 1, maxWidth: '150px' }}>
                                        {[0.8, 1.0, 1.2].map(speed => (
                                            <button
                                                key={speed}
                                                onClick={() => setGlobalSpeedFactor(speed)}
                                                className={globalSpeedFactor === speed ? 'active' : ''}
                                                style={{ fontSize: '0.7rem', padding: '0.2rem' }}
                                                disabled={!autoMode}
                                            >
                                                {speed}x
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {setList.length === 0 && (
                    <div style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem' }}>
                        <p>El set está vacío.</p>
                        <p style={{ fontSize: '0.8rem' }}>Haz clic en las canciones de la librería para agregarlas.</p>
                    </div>
                )}

                {/* Memoized song cards */}
                {setList.map((song, sIdx) => (
                    <SongCard
                        key={song.setId}
                        song={song}
                        sIdx={sIdx}
                        isSongActive={activeSongIndex === sIdx}
                        activeSongIndex={activeSongIndex}
                        activeBlockIndex={activeBlockIndex}
                        autoMode={autoMode}
                        smartAuto={smartAuto}
                        isLive={isLive}
                        onSetActiveSong={setActiveSong}
                        onSetActiveBlock={setActiveBlock}
                        onSetLiveState={setLiveState}
                        onMoveUp={handleMoveUp}
                        onMoveDown={handleMoveDown}
                        onRemove={removeFromSet}
                        totalSongs={setList.length}
                    />
                ))}
            </div>
        </div>
    );
}
