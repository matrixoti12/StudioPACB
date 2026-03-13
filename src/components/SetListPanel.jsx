import React from 'react';
import { useStore } from '../store/useStore';
import { Play, Pause, AlertTriangle, ArrowUp, ArrowDown, Trash2, ListOrdered, MonitorPlay, PowerOff, SkipForward, SkipBack, PlaySquare, Settings, Timer } from 'lucide-react';

export default function SetListPanel() {
    const {
        setList, removeFromSet, reorderSet, clearSet,
        activeSongIndex, activeBlockIndex,
        setActiveSong, setActiveBlock,
        isLive, toggleLive, isBlackScreen, setLiveState, toggleBlackScreen,
        autoMode, toggleAutoMode, smartAuto, toggleSmartAuto, autoInterval, setAutoInterval,
        globalSpeedFactor, setGlobalSpeedFactor, nextBlock, prevBlock
    } = useStore();

    const handleMoveUp = (index) => {
        if (index === 0) return;
        const newSet = [...setList];
        [newSet[index - 1], newSet[index]] = [newSet[index], newSet[index - 1]];
        reorderSet(newSet);
        // adjust active index if needed
        if (activeSongIndex === index) setActiveSong(index - 1);
        else if (activeSongIndex === index - 1) setActiveSong(index);
    };

    const handleMoveDown = (index) => {
        if (index === setList.length - 1) return;
        const newSet = [...setList];
        [newSet[index + 1], newSet[index]] = [newSet[index], newSet[index + 1]];
        reorderSet(newSet);
        if (activeSongIndex === index) setActiveSong(index + 1);
        else if (activeSongIndex === index + 1) setActiveSong(index);
    };

    let liveWindowRef = React.useRef(null);

    const openLiveWindow = () => {
        if (liveWindowRef.current && !liveWindowRef.current.closed) {
            liveWindowRef.current.focus();
        } else {
            liveWindowRef.current = window.open('#/live', 'PactoLiveWindow', 'width=1280,height=720,menubar=no,toolbar=no');
        }
    };

    return (
        <div className="panel" style={{ flexGrow: 1, borderRight: '1px solid var(--border-color)' }}>
            <div className="panel-header flex-row justify-between">
                <h2><ListOrdered size={20} /> Set del Culto</h2>
                <div className="flex-row">
                    <button className="danger" onClick={clearSet} title="Limpiar todo el set">
                        Limpiar Set
                    </button>
                    <button className="primary" onClick={openLiveWindow}>
                        <MonitorPlay size={16} /> Abrir Ventana Live
                    </button>
                </div>
            </div>

            <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.5rem' }}>

                {/* Controles Globales / Sistema Híbrido */}
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
                                <div style={{ fontSize: '0.75rem', color: 'var(--accent)', textAlign: 'right' }}>
                                    ✨ Tiempo dinámico activo
                                </div>
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

                {/* Lista de Canciones en el Set */}
                {setList.map((song, sIdx) => {
                    const isSongActive = activeSongIndex === sIdx;

                    return (
                        <div key={song.setId} className={`card ${isSongActive ? 'active' : ''}`} style={{ padding: '1rem' }}>
                            <div className="flex-row justify-between mb-4">
                                <div
                                    className="card-title"
                                    onClick={() => setActiveSong(sIdx)}
                                    style={{ fontSize: '1.2rem', cursor: 'pointer', flexGrow: 1 }}
                                >
                                    {sIdx + 1}. {song.title}
                                </div>
                                <div className="segmented-control">
                                    <button onClick={() => handleMoveUp(sIdx)} disabled={sIdx === 0} title="Mover Arriba"><ArrowUp size={16} /></button>
                                    <button onClick={() => handleMoveDown(sIdx)} disabled={sIdx === setList.length - 1} title="Mover Abajo"><ArrowDown size={16} /></button>
                                    <button onClick={() => removeFromSet(song.setId)} style={{ color: 'var(--danger)' }} title="Eliminar del Set"><Trash2 size={16} /></button>
                                </div>
                            </div>

                            {/* Bloques / Diapositivas */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.8rem' }}>
                                {song.blocks.map((block, bIdx) => {
                                    const isBlockActive = isSongActive && activeBlockIndex === bIdx;
                                    return (
                                        <div
                                            key={bIdx}
                                            className={`block-card ${isBlockActive ? 'active' : ''}`}
                                            style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}
                                            onClick={() => {
                                                setActiveSong(sIdx);
                                                setActiveBlock(bIdx);
                                                if (!isLive) setLiveState(true); // Auto transmit si tocas bloque (opcional)
                                                // Reiniciar auto es automático xq reactiva effect en panel oper
                                            }}
                                        >
                                            {/* Nuevo: Etiqueta de Sección arriba (si existe y no es legacy vacío) */}
                                            {block.sectionName && (
                                                <div style={{
                                                    fontSize: '0.65rem',
                                                    fontWeight: 'bold',
                                                    color: 'var(--accent)',
                                                    textTransform: 'uppercase',
                                                    marginBottom: '0.3rem',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    {block.sectionName}
                                                </div>
                                            )}

                                            <div style={{ flexGrow: 1 }}>{block.text || '(Estrofa Vacía)'}</div>
                                            {isBlockActive && autoMode && smartAuto && (
                                                <div style={{ position: 'absolute', bottom: '2px', right: '4px', fontSize: '0.6rem', opacity: 0.7 }}>
                                                    ⏱ Auto
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
