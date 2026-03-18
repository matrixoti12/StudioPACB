import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Type, Palette, Image as ImageIcon, Video, Link } from 'lucide-react';

const PRESET_FONTS = [
    { label: 'Inter', value: 'Inter, sans-serif' },
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Roboto', value: 'Roboto, sans-serif' },
    { label: 'Serif', value: 'Georgia, serif' },
];

const PRESET_BG = [
    { label: 'Negro', value: '#000000' },
    { label: 'Azul Noche', value: '#020617' },
    { label: 'Bosque', value: '#064e3b' },
    { label: 'Madera', value: 'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?q=80&w=1920&auto=format&fit=crop' },
    { label: 'Cielo', value: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1920&auto=format&fit=crop' }
];

const PRESET_TEXT = [
    { label: 'Blanco', value: '#ffffff' },
    { label: 'Amarillo', value: '#fde047' },
    { label: 'Cian', value: '#67e8f9' },
];

const isVideoUrl = (url) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.ogg') || lower.endsWith('.gifv');
};

const isColorValue = (url) => {
    if (!url) return false;
    return url.startsWith('#') || url.startsWith('rgb');
};

export default function ScreenSettings() {
    const fontSize        = useStore(s => s.fontSize);
    const setFontSize     = useStore(s => s.setFontSize);
    const fontFamily     = useStore(s => s.fontFamily);
    const setFontFamily  = useStore(s => s.setFontFamily);
    const textColor      = useStore(s => s.textColor);
    const setTextColor   = useStore(s => s.setTextColor);
    const textAlign      = useStore(s => s.textAlign);
    const setTextAlign   = useStore(s => s.setTextAlign);
    const backgroundUrl  = useStore(s => s.backgroundUrl);
    const setBackgroundUrl = useStore(s => s.setBackgroundUrl);
    const bgFit          = useStore(s => s.bgFit);
    const setBgFit       = useStore(s => s.setBgFit);
    const bgOpacity      = useStore(s => s.bgOpacity);
    const setBgOpacity   = useStore(s => s.setBgOpacity);
    const textUppercase  = useStore(s => s.textUppercase);
    const toggleTextUppercase = useStore(s => s.toggleTextUppercase);
    const animationStyle = useStore(s => s.animationStyle);
    const setAnimationStyle = useStore(s => s.setAnimationStyle);

    // Determine active bg tab based on current backgroundUrl value
    const getInitialTab = () => {
        if (!backgroundUrl || isColorValue(backgroundUrl)) return 'color';
        if (isVideoUrl(backgroundUrl)) return 'video';
        return 'image';
    };

    const [bgTab, setBgTab] = useState(getInitialTab);
    const [videoUrl, setVideoUrl] = useState(isVideoUrl(backgroundUrl) ? backgroundUrl : '');
    const [imageUrl, setImageUrl] = useState(!isColorValue(backgroundUrl) && !isVideoUrl(backgroundUrl) ? backgroundUrl : '');

    const handleTabChange = (tab) => {
        setBgTab(tab);
        if (tab === 'color') {
            setBackgroundUrl('#000000');
        } else if (tab === 'image') {
            setBackgroundUrl(imageUrl || PRESET_BG[3].value);
            if (!imageUrl) setImageUrl(PRESET_BG[3].value);
        } else if (tab === 'video') {
            setBackgroundUrl(videoUrl || '');
        }
    };

    const handleVideoUrlChange = (url) => {
        setVideoUrl(url);
        setBackgroundUrl(url);
    };

    const handleImageUrlChange = (url) => {
        setImageUrl(url);
        setBackgroundUrl(url);
    };

    return (
        <div className="flex-col" style={{ gap: '1rem' }}>
            <div className="card" style={{ borderLeft: '4px solid var(--accent)' }}>
                <h3 className="card-title flex-row mb-4"><Type size={16} /> Tipografía</h3>
                <div className="mb-4">
                    <label className="card-subtitle mb-2 flex-row"><span style={{ flexGrow: 1 }}>Tamaño</span> <b>{fontSize}vw</b></label>
                    <input type="range" min="2" max="15" step="0.5" value={fontSize} onChange={(e) => setFontSize(parseFloat(e.target.value))} className="w-full" />
                </div>
                <div className="mb-4">
                    <label className="card-subtitle mb-2 block">Fuente Letra</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        {PRESET_FONTS.map(f => (
                            <button key={f.value} onClick={() => setFontFamily(f.value)} className={fontFamily === f.value ? 'active-toggle' : ''} style={{ padding: '0.4rem', fontSize: '0.8rem', fontFamily: f.value }}>
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="mb-4">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                        <input 
                            type="checkbox" 
                            checked={textUppercase} 
                            onChange={toggleTextUppercase} 
                            style={{ accentColor: 'var(--accent)', width: '1rem', height: '1rem', cursor: 'pointer' }}
                        />
                        Forzar <b>MAYÚSCULAS</b>
                    </label>
                </div>
                <div className="mb-2">
                    <label className="card-subtitle mb-2 block">Alineación</label>
                    <div className="segmented-control">
                        {['left', 'center', 'right'].map(align => (
                            <button key={align} onClick={() => setTextAlign(align)} className={textAlign === align ? 'active' : ''} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                                {align === 'left' ? 'Izquierda' : align === 'center' ? 'Centro' : 'Derecha'}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="mb-2 mt-4" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                    <label className="card-subtitle mb-2 block">Animación al Cambiar</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                        {[
                            { v: 'fade', l: 'Suave' }, 
                            { v: 'slideUp', l: 'Arriba' }, 
                            { v: 'slideLeft', l: 'Lado' },
                            { v: 'zoom', l: 'Zoom' },
                            { v: 'blur', l: 'Desenfoque' },
                            { v: 'none', l: 'Ninguna' }
                        ].map(anim => (
                            <button 
                                key={anim.v} 
                                onClick={() => setAnimationStyle(anim.v)} 
                                className={animationStyle === anim.v ? 'active' : ''} 
                                style={{ padding: '0.4rem', fontSize: '0.75rem' }}
                            >
                                {anim.l}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="card" style={{ borderLeft: '4px solid var(--text-primary)', padding: '1.25rem' }}>
                <h3 className="card-title flex-row mb-4"><Palette size={16} /> Color del Texto</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                    {PRESET_TEXT.map(c => (
                        <button onClick={() => setTextColor(c.value)} key={c.value} className={textColor === c.value ? 'active' : ''} style={{ padding: '0.4rem', fontSize: '0.8rem', border: `1px solid ${c.value}`, color: c.value, background: textColor === c.value ? 'rgba(255,255,255,0.1)' : 'transparent', fontWeight: 'bold' }}>
                            {c.label}
                        </button>
                    ))}
                </div>
                <label className="card-subtitle block mb-2">Color Personalizado:</label>
                <input type="text" value={textColor} onChange={(e) => setTextColor(e.target.value)} placeholder="#FFFFFF" className="w-full" />
            </div>

            <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
                <h3 className="card-title flex-row mb-4"><ImageIcon size={16} /> Fondo a Mostrar</h3>

                {/* BG Type Tabs */}
                <div className="segmented-control mb-4">
                    <button
                        className={bgTab === 'color' ? 'active' : ''}
                        onClick={() => handleTabChange('color')}
                        style={{ fontSize: '0.78rem', padding: '0.4rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                        <Palette size={13} /> Color
                    </button>
                    <button
                        className={bgTab === 'image' ? 'active' : ''}
                        onClick={() => handleTabChange('image')}
                        style={{ fontSize: '0.78rem', padding: '0.4rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                        <ImageIcon size={13} /> Imagen
                    </button>
                    <button
                        className={bgTab === 'video' ? 'active' : ''}
                        onClick={() => handleTabChange('video')}
                        style={{ fontSize: '0.78rem', padding: '0.4rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                        <Video size={13} /> Video
                    </button>
                </div>

                {/* COLOR TAB */}
                {bgTab === 'color' && (
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                            {PRESET_BG.filter(b => b.value.startsWith('#')).map(b => (
                                <button
                                    onClick={() => setBackgroundUrl(b.value)}
                                    key={b.label}
                                    className={backgroundUrl === b.value ? 'active-toggle' : ''}
                                    style={{ padding: '0.4rem', fontSize: '0.8rem', borderLeft: `4px solid ${b.value}` }}
                                >
                                    {b.label}
                                </button>
                            ))}
                        </div>
                        <label className="card-subtitle block mb-2">Color personalizado:</label>
                        <input
                            type="text"
                            value={isColorValue(backgroundUrl) ? backgroundUrl : ''}
                            onChange={(e) => setBackgroundUrl(e.target.value)}
                            placeholder="#000000"
                            className="w-full"
                        />
                    </div>
                )}

                {/* IMAGE TAB */}
                {bgTab === 'image' && (
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                            {PRESET_BG.filter(b => !b.value.startsWith('#')).map(b => (
                                <button
                                    onClick={() => { handleImageUrlChange(b.value); }}
                                    key={b.label}
                                    className={backgroundUrl === b.value ? 'active-toggle' : ''}
                                    style={{ padding: '0.4rem', fontSize: '0.8rem' }}
                                >
                                    {b.label}
                                </button>
                            ))}
                        </div>
                        <label className="card-subtitle block mb-2">URL de imagen personalizada:</label>
                        <input
                            type="text"
                            value={imageUrl}
                            onChange={(e) => handleImageUrlChange(e.target.value)}
                            placeholder="https://... (JPG, PNG, WebP)"
                            className="w-full mb-4"
                        />
                        <div className="mb-4">
                            <label className="card-subtitle mb-2 block">Ajuste de Imagen</label>
                            <div className="segmented-control">
                                {[{ v: 'cover', l: 'Rellenar' }, { v: 'contain', l: 'Encajar' }].map(mode => (
                                    <button key={mode.v} onClick={() => setBgFit(mode.v)} className={bgFit === mode.v ? 'active' : ''}>
                                        {mode.l}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* VIDEO TAB */}
                {bgTab === 'video' && (
                    <div>
                        <div style={{
                            background: 'rgba(99,102,241,0.08)',
                            border: '1px solid rgba(99,102,241,0.3)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.75rem',
                            marginBottom: '1rem',
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.5rem'
                        }}>
                            <Video size={14} style={{ flexShrink: 0, marginTop: '2px', color: '#818cf8' }} />
                            <span>El video se reproducirá en <b>loop automático</b> y sin sonido detrás del texto. Compatible con <b>.mp4</b>, <b>.webm</b> y <b>.ogg</b>.</span>
                        </div>

                        <label className="card-subtitle block mb-2">
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Link size={12} /> URL del Video:
                            </span>
                        </label>
                        <input
                            type="text"
                            value={videoUrl}
                            onChange={(e) => handleVideoUrlChange(e.target.value)}
                            placeholder="https://... (.mp4 / .webm / .ogg)"
                            className="w-full mb-3"
                            style={videoUrl && !isVideoUrl(videoUrl) ? { borderColor: '#f87171' } : {}}
                        />

                        {videoUrl && !isVideoUrl(videoUrl) && (
                            <p style={{ color: '#f87171', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                                ⚠️ La URL no parece ser un archivo de video válido (.mp4, .webm, .ogg).
                            </p>
                        )}

                        {videoUrl && isVideoUrl(videoUrl) && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                color: '#4ade80', fontSize: '0.78rem', marginBottom: '0.75rem'
                            }}>
                                <Video size={13} /> Video detectado ✓
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="card-subtitle mb-2 block">Ajuste del Video</label>
                            <div className="segmented-control">
                                {[{ v: 'cover', l: 'Rellenar' }, { v: 'contain', l: 'Encajar' }].map(mode => (
                                    <button key={mode.v} onClick={() => setBgFit(mode.v)} className={bgFit === mode.v ? 'active' : ''}>
                                        {mode.l}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* OSCURECER — always visible */}
                <div>
                    <label className="card-subtitle mb-2 flex-row"><span style={{ flexGrow: 1 }}>Oscurecer Fondo</span> <b>{bgOpacity}%</b></label>
                    <input type="range" min="0" max="100" step="5" value={bgOpacity} onChange={(e) => setBgOpacity(parseInt(e.target.value))} className="w-full" />
                </div>
            </div>
        </div>
    );
}
