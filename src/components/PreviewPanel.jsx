import React from 'react';
import { useStore } from '../store/useStore';
import { Eye, SkipForward, SkipBack, X } from 'lucide-react';

export default function PreviewPanel({ onClose }) {
    // Granular selectors — only re-render when the specific value changes
    const isLive           = useStore(s => s.isLive);
    const isBlackScreen    = useStore(s => s.isBlackScreen);
    const activeTab        = useStore(s => s.activeTab);
    const activeSongIndex  = useStore(s => s.activeSongIndex);
    const activeBlockIndex = useStore(s => s.activeBlockIndex);
    const setList          = useStore(s => s.setList);
    const activeBibleVerse = useStore(s => s.activeBibleVerse);
    const backgroundUrl    = useStore(s => s.backgroundUrl);
    const bgFit            = useStore(s => s.bgFit);
    const bgOpacity        = useStore(s => s.bgOpacity);
    const fontSize         = useStore(s => s.fontSize);
    const fontFamily       = useStore(s => s.fontFamily);
    const textColor        = useStore(s => s.textColor);
    const textAlign        = useStore(s => s.textAlign);
    const textUppercase    = useStore(s => s.textUppercase);
    const autoMode         = useStore(s => s.autoMode);
    const currentSlideDuration = useStore(s => s.currentSlideDuration);
    const prevBlock        = useStore(s => s.prevBlock);
    const nextBlock        = useStore(s => s.nextBlock);

    const isVideoUrl = (url) => {
        if (!url) return false;
        const lower = url.toLowerCase();
        return lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.ogg') || lower.endsWith('.gifv');
    };

    // ── Compute visible text (mirrors LiveWindow logic exactly) ────────────────
    let currentText     = '';
    let currentReference = '';
    let nextText        = 'Fin del Set';

    if (activeTab === 'songs') {
        if (setList.length > 0 && setList[activeSongIndex]) {
            const blocks = setList[activeSongIndex].blocks;
            if (blocks && blocks[activeBlockIndex]) {
                const b = blocks[activeBlockIndex];
                currentText = typeof b === 'string' ? b : b?.text || '';
            }
            if (blocks) {
                if (activeBlockIndex < blocks.length - 1) {
                    const nb = blocks[activeBlockIndex + 1];
                    nextText = typeof nb === 'string' ? nb : nb?.text || '';
                } else if (activeSongIndex < setList.length - 1) {
                    const nextBlocks = setList[activeSongIndex + 1]?.blocks;
                    const nb = nextBlocks?.[0];
                    nextText = nb ? (typeof nb === 'string' ? nb : nb?.text || '') : '';
                }
            }
        }
    } else if (activeTab === 'bible') {
        if (activeBibleVerse) {
            currentText     = activeBibleVerse.text;
            currentReference = activeBibleVerse.reference;
            nextText        = 'Proyectando desde la Biblia';
        } else {
            nextText = '';
        }
    }

    // ── The preview miniature shows what the big screen shows — exactly ────────
    const displayLiveBadge = isLive && !isBlackScreen;
    const showTextInPreview = isLive && !isBlackScreen && !!currentText;

    const aspectStyle = {
        width:           '100%',
        aspectRatio:     '16/9',
        backgroundColor: 'black',
        position:        'relative',
        overflow:        'hidden',
        borderRadius:    'var(--radius-md)',
        boxShadow:       'var(--shadow-md)',
        border:          displayLiveBadge ? '2px solid var(--accent)' : '1px solid var(--border-color)',
        transition:      'border-color 0.3s',
    };

    // Scale font relative to the preview container (~25vw of screen)
    const previewFontSize = `${Math.max(fontSize * 0.25, 1)}vw`;

    return (
        <div className="panel" style={{ height: '100%' }}>
            <div className="panel-header flex-row justify-between">
                <h2><Eye size={20} /> Vista Previa</h2>
                {onClose && <button onClick={onClose} style={{ padding: '0.3rem', border: 'none', background: 'transparent', color: 'var(--text-secondary)' }}><X size={20} /></button>}
            </div>

            <div className="panel-content" style={{ padding: '1.5rem' }}>
                {/* ── Transmission status badge ── */}
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

                {/* ── Live Preview Monitor ── */}
                <div style={aspectStyle} className="mb-4">
                    {/* Background layer */}
                    {backgroundUrl && backgroundUrl.startsWith('#') && (
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: backgroundUrl }} />
                    )}
                    {backgroundUrl && !backgroundUrl.startsWith('#') && !isVideoUrl(backgroundUrl) && (
                        <img src={backgroundUrl} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: bgFit, color: 'transparent' }} alt="" onError={(e) => { e.target.style.display = 'none'; }} />
                    )}
                    {backgroundUrl && !backgroundUrl.startsWith('#') && isVideoUrl(backgroundUrl) && (
                        <video key={backgroundUrl} autoPlay loop muted playsInline style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: bgFit }}>
                            <source src={backgroundUrl} />
                        </video>
                    )}

                    {/* Dark overlay */}
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: `rgba(0,0,0,${bgOpacity / 100})`, zIndex: 5 }} />

                    {/* Text — only when LIVE and not black screen (mirrors big screen) */}
                    <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '1rem' }}>
                        {showTextInPreview && (
                            <div style={{
                                color:          textColor,
                                fontFamily:     fontFamily,
                                textAlign:      textAlign,
                                fontWeight:     700,
                                width:          '100%',
                                display:        'flex',
                                flexDirection:  'column',
                                alignItems:     textAlign === 'center' ? 'center' : (textAlign === 'right' ? 'flex-end' : 'flex-start'),
                                gap:            '0.5vw',
                                textShadow:     '1px 1px 4px rgba(0,0,0,0.8), -1px -1px 4px rgba(0,0,0,0.8)',
                                fontSize:       previewFontSize,
                                lineHeight:     1.4,
                                textTransform:  textUppercase ? 'uppercase' : 'none',
                            }}>
                                <span>{currentText}</span>
                                {currentReference && (
                                    <span style={{ fontSize: '0.6em', opacity: 0.9, color: 'var(--accent, #38bdf8)', fontWeight: 600, marginTop: '0.2em' }}>
                                        {currentReference}
                                    </span>
                                )}
                            </div>
                        )}
                        {/* When paused/offline — show a helpful hint in the preview */}
                        {!isLive && (
                            <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75vw', pointerEvents: 'none', userSelect: 'none' }}>
                                Presiona TRANSMITIR EN VIVO para activar
                            </div>
                        )}
                        {isLive && isBlackScreen && (
                            <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75vw', pointerEvents: 'none', userSelect: 'none' }}>
                                PANTALLA NEGRA ACTIVA
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Auto Mode Progress Bar ── */}
                {(autoMode && isLive && activeTab === 'songs' && currentSlideDuration > 0) && (
                    <div style={{ width: '100%', height: '4px', background: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden', marginTop: '-0.5rem', marginBottom: '1rem' }}>
                        <div
                            key={`prog_${activeSongIndex}_${activeBlockIndex}`}
                            style={{
                                height:            '100%',
                                background:        'var(--accent)',
                                width:             '100%',
                                animation:         `shrink linear forwards`,
                                animationDuration: `${currentSlideDuration}s`,
                            }}
                        />
                    </div>
                )}

                {/* ── Manual Navigation Controls ── */}
                <div className="flex-row justify-between mb-4 mt-4" style={{ gap: '1rem' }}>
                    <button onClick={prevBlock} style={{ flexGrow: 1 }}><SkipBack size={16} /> Anterior</button>
                    <button onClick={nextBlock} style={{ flexGrow: 1 }} className="primary"><SkipForward size={16} /> Siguiente</button>
                </div>

                {/* ── Next Block Info ── */}
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
