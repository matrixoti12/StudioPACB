import React from 'react';
import { useStore } from '../store/useStore';
import { Type, Palette, Image as ImageIcon } from 'lucide-react';

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

export default function ScreenSettings() {
    const {
        fontSize, setFontSize, fontFamily, setFontFamily,
        textColor, setTextColor, textAlign, setTextAlign,
        backgroundUrl, setBackgroundUrl, bgFit, setBgFit,
        bgOpacity, setBgOpacity
    } = useStore();

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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                    {PRESET_BG.map(b => (
                        <button onClick={() => setBackgroundUrl(b.value)} key={b.label} className={backgroundUrl === b.value ? 'active-toggle' : ''} style={{ padding: '0.4rem', fontSize: '0.8rem' }}>
                            {b.label}
                        </button>
                    ))}
                </div>
                <label className="card-subtitle block mb-2">Color o URL Personalizado:</label>
                <input type="text" value={backgroundUrl} onChange={(e) => setBackgroundUrl(e.target.value)} placeholder="Ej. #000000 o https://miapp..." className="w-full mb-4" />

                {backgroundUrl && !backgroundUrl.startsWith('#') && (
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
                )}

                <div>
                    <label className="card-subtitle mb-2 flex-row"><span style={{ flexGrow: 1 }}>Oscurecer Fondo</span> <b>{bgOpacity}%</b></label>
                    <input type="range" min="0" max="100" step="5" value={bgOpacity} onChange={(e) => setBgOpacity(parseInt(e.target.value))} className="w-full" />
                </div>
            </div>
        </div>
    );
}
