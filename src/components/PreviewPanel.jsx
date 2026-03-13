import React from 'react';
import { useStore } from '../store/useStore';
import { Eye, SkipForward, SkipBack, X } from 'lucide-react';

export default function PreviewPanel({ onClose }) {
    const {
        isLive, setList, activeSongIndex, activeBlockIndex,
        backgroundUrl, isBlackScreen, fontSize, prevBlock, nextBlock,
        fontFamily, textColor, textAlign, bgFit, bgOpacity,
        autoMode, currentSlideDuration, activeTab, activeBibleVerse
    } = useStore();

    let currentText = '';
    let currentReference = '';
    let nextText = 'Fin del Set';

    if (activeTab === 'songs') {
        if (setList.length > 0 && setList[activeSongIndex]) {
            const blocks = setList[activeSongIndex].blocks;
            if (blocks && blocks[activeBlockIndex]) {
                currentText = typeof blocks[activeBlockIndex] === 'string' ? blocks[activeBlockIndex] : blocks[activeBlockIndex]?.text;
            }

            // Calculate next text
            if (activeBlockIndex < blocks.length - 1) {
                nextText = typeof blocks[activeBlockIndex + 1] === 'string' ? blocks[activeBlockIndex + 1] : blocks[activeBlockIndex + 1]?.text;
            } else if (activeSongIndex < setList.length - 1) {
                const nextBlocks = setList[activeSongIndex + 1].blocks;
                nextText = nextBlocks && nextBlocks.length > 0 ? (typeof nextBlocks[0] === 'string' ? nextBlocks[0] : nextBlocks[0]?.text) : '';
            }
        }
    } else if (activeTab === 'bible') {
        if (activeBibleVerse) {
            currentText = activeBibleVerse.text;
            currentReference = activeBibleVerse.reference;
            nextText = 'Proyectando desde la Biblia';
        } else {
            nextText = '';
        }
    }

    // Calculate live string correctly
    const displayLiveBadge = isLive && !isBlackScreen;

    // Real preview container ratio (16:9 approx)
    const aspectStyle = {
        width: '100%',
        aspectRatio: '16/9',
        backgroundColor: backgroundUrl ? 'black' : 'black',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-md)',
        border: displayLiveBadge ? '2px solid var(--danger)' : '1px solid var(--border-color)',
        transition: 'border-color 0.3s'
    };

    // We map vw to a smaller scale (since container is not 100vw, it's roughly 20-25vw of the screen)
    // Let's just use regular percentages or container relative units.
    const previewFontSize = `${Math.max(fontSize * 0.25, 1)}vw`;

    return (
        <div className="panel" style={{ height: '100%' }}>
            <div className="panel-header flex-row justify-between">
                <h2><Eye size={20} /> Vista Previa</h2>
                {onClose && <button onClick={onClose} style={{ padding: '0.3rem', border: 'none', background: 'transparent', color: 'var(--text-secondary)' }}><X size={20} /></button>}
            </div>

            <div className="panel-content" style={{ padding: '1.5rem' }}>
                <div className="mb-4 flex-row justify-between">
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Estado de Transmisión:</span>
                    {isBlackScreen ? (
                        <span className="badge paused">PANTALLA NEGRA</span>
                    ) : isLive ? (
                        <span className="badge live">EN VIVO</span>
                    ) : (
                        <span className="badge paused" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}>PAUSADO</span>
                    )}
                </div>

                {/* Live Preview Monitor */}
                <div style={aspectStyle} className="mb-4">
                    {backgroundUrl && backgroundUrl.startsWith('#') && (
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: backgroundUrl }} />
                    )}
                    {backgroundUrl && !backgroundUrl.startsWith('#') && (
                        <img src={backgroundUrl} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: bgFit, color: 'transparent' }} alt="" onError={(e) => { e.target.style.display = 'none'; }} />
                    )}

                    {/* Dark Overlay Layer */}
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: `rgba(0,0,0,${bgOpacity / 100})`, zIndex: 5 }} />

                    <div style={{
                        position: 'relative', zIndex: 10, width: '100%', height: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '1rem'
                    }}>
                        {(!isBlackScreen && currentText) && (
                            <div style={{
                                color: textColor,
                                fontFamily: fontFamily,
                                textAlign: textAlign,
                                fontWeight: 700,
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: textAlign === 'center' ? 'center' : (textAlign === 'right' ? 'flex-end' : 'flex-start'),
                                gap: '0.5vw',
                                textShadow: '1px 1px 4px rgba(0,0,0,0.8), -1px -1px 4px rgba(0,0,0,0.8)',
                                fontSize: previewFontSize,
                                lineHeight: 1.4
                            }}>
                                <span>{currentText}</span>
                                {currentReference && (
                                    <span style={{
                                        fontSize: '0.6em',
                                        opacity: 0.9,
                                        color: 'var(--accent, #38bdf8)',
                                        fontWeight: 600,
                                        marginTop: '0.2em'
                                    }}>
                                        {currentReference}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ANIMATED PROGRESS BAR FOR AUTO MODE */}
                {(autoMode && isLive && activeTab === 'songs' && currentSlideDuration > 0) && (
                    <div style={{ width: '100%', height: '4px', background: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden', marginTop: '-0.5rem', marginBottom: '1rem' }}>
                        <div
                            key={`prog_${activeSongIndex}_${activeBlockIndex}`}
                            style={{
                                height: '100%',
                                background: 'var(--accent)',
                                width: '100%',
                                animation: `shrink linear forwards`,
                                animationDuration: `${currentSlideDuration}s`
                            }}
                        />
                    </div>
                )}

                {/* Navigation Controles Manuales */}
                <div className="flex-row justify-between mb-4 mt-4" style={{ gap: '1rem' }}>
                    <button onClick={prevBlock} style={{ flexGrow: 1 }}><SkipBack size={16} /> Anterior</button>
                    <button onClick={nextBlock} style={{ flexGrow: 1 }} className="primary"><SkipForward size={16} /> Siguiente</button>
                </div>

                {/* Next Block Info */}
                <div className="card mt-4 mb-4" style={{ background: 'transparent', border: '1px dashed var(--border-color)', padding: '1rem' }}>
                    <div className="card-title" style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Próximo a proyectar</div>
                    <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                        {nextText || '-'}
                    </div>
                </div>

            </div>
        </div>
    );
}
