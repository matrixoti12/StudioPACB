import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { initOperatorSync, listenForRequests } from '../store/sync';
import LibraryPanel from '../components/LibraryPanel';
import SetListPanel from '../components/SetListPanel';
import PreviewPanel from '../components/PreviewPanel';
import BiblePanel from '../components/BiblePanel';
import { Sidebar, LayoutTemplate, Home, Monitor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function OperatorPanel() {
    const navigate = useNavigate();
    const activeTab = useStore(state => state.activeTab);
    const isLive = useStore(state => state.isLive);
    const autoMode = useStore(state => state.autoMode);
    const smartAuto = useStore(state => state.smartAuto);
    const autoInterval = useStore(state => state.autoInterval);
    const globalSpeedFactor = useStore(state => state.globalSpeedFactor);
    const setCurrentSlideDuration = useStore(state => state.setCurrentSlideDuration);
    const nextBlock = useStore(state => state.nextBlock);
    const activeBlockIndex = useStore(state => state.activeBlockIndex);
    const activeSongIndex = useStore(state => state.activeSongIndex);
    const setList = useStore(state => state.setList);

    const [showLibrary, setShowLibrary] = useState(true);
    const [showPreview, setShowPreview] = useState(true);

    useEffect(() => {
        let timer;
        // Music Auto-advance only runs when we are projecting songs
        if (autoMode && isLive && activeTab === 'songs') {
            let delay = autoInterval;

            if (smartAuto && setList.length > 0 && setList[activeSongIndex]) {
                const blocks = setList[activeSongIndex].blocks;
                if (blocks && blocks[activeBlockIndex]) {
                    const block = blocks[activeBlockIndex];
                    const text = typeof block === 'string' ? block : block?.text || '';
                    const sectionName = typeof block === 'string' ? '' : block?.sectionName || '';
                    const secLower = sectionName.toLowerCase();

                    const words = text.split(/\s+/).filter(w => w.trim().length > 0).length;
                    const linesCount = text.split('\n').filter(l => l.trim().length > 0).length;

                    // 1. Base por palabras
                    if (words <= 4) delay = 3.5;
                    else if (words <= 8) delay = 4.5;
                    else if (words <= 14) delay = 5.5;
                    else delay = 7.0; // 15+ words

                    // 2. Ajuste por sección
                    if (secLower.includes('coro')) delay += 0.5;
                    else if (secLower.includes('puente')) delay += 1.0;
                    else if (secLower.includes('final')) delay += 1.5;

                    // 3. Ajuste por densidad visual
                    if (linesCount === 1) delay += 0.5; // Muy corto visualmente, darle un poco más para que la intro/pausa se sienta
                    else if (linesCount >= 3 && words >= 12) delay += 1.0; // Bloques muy densos requieren más lectura
                }
            }

            // Aplicar factor de velocidad global
            const finalDelay = delay * (globalSpeedFactor || 1);

            // Setear el tiempo total en la UI para la barra de progreso
            setCurrentSlideDuration(finalDelay);

            timer = setTimeout(() => {
                nextBlock();
            }, finalDelay * 1000);
        } else {
            setCurrentSlideDuration(0);
        }
        return () => clearTimeout(timer);
    }, [autoMode, isLive, activeTab, autoInterval, nextBlock, activeBlockIndex, activeSongIndex, smartAuto, setList, globalSpeedFactor, setCurrentSlideDuration]);

    useEffect(() => {
        initOperatorSync();
        listenForRequests();
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', background: 'var(--bg-primary)' }}>
            {/* Top Minimalist Toolbar */}
            <div className="topbar flex-row" style={{ padding: '0.5rem 1.5rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', justifyContent: 'space-between', zIndex: 10 }}>
                <div className="flex-row" style={{ gap: '0.8rem' }}>
                    <img src="/logo.png" alt="Logo" style={{ height: '32px', borderRadius: '4px', objectFit: 'contain' }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 700, letterSpacing: '0.5px', fontSize: '14px' }}>PACTO Y BENDICIÓN STUDIO</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: isLive ? 'var(--danger)' : 'var(--text-secondary)' }} />
                            <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{isLive ? 'EN VIVO' : 'OFFLINE'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex-row segmented-control" style={{ padding: '3px', background: 'transparent', border: 'none' }}>
                    <button
                        onClick={() => navigate('/')}
                        style={{ display: 'flex', gap: '6px', alignItems: 'center', borderRadius: '8px', padding: '0.4rem 1rem', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    >
                        <Home size={16} /> Menú Principal
                    </button>
                </div>

                <div className="flex-row" style={{ gap: '0.5rem' }}>
                    <button onClick={() => setShowLibrary(!showLibrary)} className={showLibrary ? 'active-toggle' : ''}>
                        <Sidebar size={16} /> Librería
                    </button>
                    <button onClick={() => setShowPreview(!showPreview)} className={showPreview ? 'active-toggle' : ''}>
                        <LayoutTemplate size={16} /> Vista Previa
                    </button>
                </div>
            </div>

            <div className="operator-layout" style={{
                display: 'grid',
                gridTemplateColumns: activeTab === 'songs'
                    ? `${showLibrary ? '320px' : '0px'} 1fr ${showPreview ? '350px' : '0px'}`
                    : `1fr ${showPreview ? '350px' : '0px'}`,
                flexGrow: 1,
                overflow: 'hidden',
                transition: 'grid-template-columns 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                background: 'var(--bg-primary)',
                gap: '0'
            }}>
                {activeTab === 'songs' ? (
                    <>
                        <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', opacity: showLibrary ? 1 : 0, transition: 'opacity 0.3s' }}>
                            <LibraryPanel onClose={() => setShowLibrary(false)} />
                        </div>
                        <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <SetListPanel />
                        </div>
                    </>
                ) : (
                    <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <BiblePanel showLibrary={showLibrary} />
                    </div>
                )}

                <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', opacity: showPreview ? 1 : 0, transition: 'opacity 0.3s' }}>
                    <PreviewPanel onClose={() => setShowPreview(false)} />
                </div>
            </div>
        </div>
    );
}
