import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { initLiveSync } from '../store/sync';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';

export default function LiveWindow() {
    const { type } = useParams(); // 'songs' | 'bible' | undefined
    const isLive = useStore(state => state.isLive);
    const isBlackScreen = useStore(state => state.isBlackScreen);
    const activeTab = useStore(state => state.activeTab);
    const activeSongIndex = useStore(state => state.activeSongIndex);
    const activeBlockIndex = useStore(state => state.activeBlockIndex);
    const activeBibleVerse = useStore(state => state.activeBibleVerse);
    const setList = useStore(state => state.setList);
    const fontSize = useStore(state => state.fontSize);
    const fontFamily = useStore(state => state.fontFamily);
    const textColor = useStore(state => state.textColor);
    const textAlign = useStore(state => state.textAlign);
    const backgroundUrl = useStore(state => state.backgroundUrl);
    const bgFit = useStore(state => state.bgFit);
    const bgOpacity = useStore(state => state.bgOpacity);
    const textUppercase = useStore(state => state.textUppercase);
    const animationStyle = useStore(state => state.animationStyle);

    const isVideoUrl = (url) => {
        if (!url) return false;
        const lower = url.toLowerCase();
        return lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.ogg') || lower.endsWith('.gifv') || lower.includes('imgur.com') && (lower.includes('.mp4') || lower.includes('.gifv'));
    };

    useEffect(() => {
        initLiveSync();
    }, []);

    let currentText = '';
    let currentReference = '';

    if (isLive && !isBlackScreen) {
        // Evaluate activeTab or force evaluate based on route parameter 'type'
        const effectiveTab = type ? type : activeTab;

        if (effectiveTab === 'songs') {
            if (setList.length > 0 && setList[activeSongIndex]) {
                const activeBlocs = setList[activeSongIndex].blocks;
                if (activeBlocs && activeBlocs[activeBlockIndex]) {
                    const blockItem = activeBlocs[activeBlockIndex];
                    currentText = typeof blockItem === 'string' ? blockItem : blockItem?.text || '';
                }
            }
        } else if (effectiveTab === 'bible') {
            if (activeBibleVerse) {
                currentText = activeBibleVerse.text;
                currentReference = activeBibleVerse.reference;
            }
        }
    }

    return (
        <div className="live-window" style={{ backgroundColor: '#000' }}>
            {backgroundUrl && backgroundUrl.startsWith('#') && (
                <div className="live-background" style={{ backgroundColor: backgroundUrl }} />
            )}
            {backgroundUrl && !backgroundUrl.startsWith('#') && !isVideoUrl(backgroundUrl) && (
                <img src={backgroundUrl} className="live-background" alt="Background" style={{ objectFit: bgFit }} />
            )}
            {backgroundUrl && !backgroundUrl.startsWith('#') && isVideoUrl(backgroundUrl) && (
                <video
                    key={backgroundUrl}
                    className="live-background"
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{ objectFit: bgFit }}
                >
                    <source src={backgroundUrl} />
                </video>
            )}

            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: `rgba(0,0,0,${bgOpacity / 100})`, zIndex: 5 }} />

            <div className="live-text-container">
                <AnimatePresence mode="wait">
                    {currentText && !isBlackScreen && (
                        <motion.div
                            key={`${activeTab}_${activeSongIndex}_${activeBlockIndex}`}
                            {...(
                                animationStyle === 'slideUp' ? {
                                    initial: { opacity: 0, y: 30 },
                                    animate: { opacity: 1, y: 0 },
                                    exit: { opacity: 0, y: -30 },
                                    transition: { duration: 0.4, ease: "easeOut" }
                                } :
                                animationStyle === 'slideLeft' ? {
                                    initial: { opacity: 0, x: 50 },
                                    animate: { opacity: 1, x: 0 },
                                    exit: { opacity: 0, x: -50 },
                                    transition: { duration: 0.4, ease: "easeOut" }
                                } :
                                animationStyle === 'zoom' ? {
                                    initial: { opacity: 0, scale: 0.8 },
                                    animate: { opacity: 1, scale: 1 },
                                    exit: { opacity: 0, scale: 1.1 },
                                    transition: { duration: 0.4, ease: "easeOut" }
                                } :
                                animationStyle === 'blur' ? {
                                    initial: { opacity: 0, filter: "blur(10px)" },
                                    animate: { opacity: 1, filter: "blur(0px)" },
                                    exit: { opacity: 0, filter: "blur(10px)" },
                                    transition: { duration: 0.5 }
                                } :
                                animationStyle === 'none' ? {
                                    initial: { opacity: 1 },
                                    animate: { opacity: 1 },
                                    exit: { opacity: 0 },
                                    transition: { duration: 0 }
                                } :
                                // fade (default)
                                {
                                    initial: { opacity: 0 },
                                    animate: { opacity: 1 },
                                    exit: { opacity: 0 },
                                    transition: { duration: 0.4 }
                                }
                            )}
                            className="live-text"
                            style={{
                                fontSize: `${fontSize}vw`,
                                fontFamily: fontFamily,
                                color: textColor,
                                textAlign: textAlign,
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: textAlign === 'center' ? 'center' : (textAlign === 'right' ? 'flex-end' : 'flex-start'),
                                gap: '1vw',
                                textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
                                textTransform: textUppercase ? 'uppercase' : 'none'
                            }}
                        >
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
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
