import React, { useState } from 'react';
import { Save, X, Edit2, ArrowUp, ArrowDown, Trash2, SplitSquareHorizontal, Merge, Plus } from 'lucide-react';

export default function SongEditor({ draftSong, onSave, onCancel }) {
    const [song, setSong] = useState(JSON.parse(JSON.stringify(draftSong)));
    const [editingTitle, setEditingTitle] = useState(false);
    const [titleInput, setTitleInput] = useState(song.title);

    // ==============================
    // Metadata
    // ==============================
    const handleSaveTitle = () => {
        setSong({ ...song, title: titleInput });
        setEditingTitle(false);
    };

    // ==============================
    // Section Actions
    // ==============================
    const handleRenameSection = (secIndex, newName) => {
        const newSong = JSON.parse(JSON.stringify(song));
        newSong.secciones[secIndex].nombre = newName;
        setSong(newSong);
    };

    const moveSection = (secIndex, direction) => {
        if (direction === -1 && secIndex === 0) return;
        if (direction === 1 && secIndex === song.secciones.length - 1) return;

        const newSong = JSON.parse(JSON.stringify(song));
        const temp = newSong.secciones[secIndex];
        newSong.secciones[secIndex] = newSong.secciones[secIndex + direction];
        newSong.secciones[secIndex + direction] = temp;
        setSong(newSong);
    };

    const removeSection = (secIndex) => {
        if (window.confirm("¿Seguro que deseas eliminar esta sección completa?")) {
            const newSong = JSON.parse(JSON.stringify(song));
            newSong.secciones = newSong.secciones.filter((_, i) => i !== secIndex);
            setSong(newSong);
        }
    };

    // ==============================
    // Slide Actions
    // ==============================
    const handleTextChange = (secIndex, slideIndex, value) => {
        const newSong = JSON.parse(JSON.stringify(song));
        newSong.secciones[secIndex].slides[slideIndex].lineas = value.split('\n');
        setSong(newSong);
    };

    const addSlide = (secIndex) => {
        const newSong = JSON.parse(JSON.stringify(song));
        newSong.secciones[secIndex].slides.push({
            id: `slide_manual_${Date.now()}`,
            lineas: [""],
            duracion: 4
        });
        setSong(newSong);
    };

    const removeSlide = (secIndex, slideIndex) => {
        const newSong = JSON.parse(JSON.stringify(song));
        newSong.secciones[secIndex].slides = newSong.secciones[secIndex].slides.filter((_, i) => i !== slideIndex);

        if (newSong.secciones[secIndex].slides.length === 0) {
            newSong.secciones.splice(secIndex, 1);
        }
        setSong(newSong);
    };

    const splitSlideInHalf = (secIndex, slideIndex) => {
        const newSong = JSON.parse(JSON.stringify(song));
        const section = newSong.secciones[secIndex];
        const slide = section.slides[slideIndex];

        if (slide.lineas.length <= 1) return;

        const mid = Math.ceil(slide.lineas.length / 2);
        const firstHalfLines = slide.lineas.slice(0, mid);
        const secondHalfLines = slide.lineas.slice(mid);

        const firstHalf = { ...slide, id: `slide_${Date.now()}_1`, lineas: firstHalfLines };
        const secondHalf = { ...slide, id: `slide_${Date.now()}_2`, lineas: secondHalfLines };

        section.slides.splice(slideIndex, 1, firstHalf, secondHalf);
        setSong(newSong);
    };

    const mergeSlides = (secIndex, slideIndex) => {
        const newSong = JSON.parse(JSON.stringify(song));
        const section = newSong.secciones[secIndex];

        if (slideIndex >= section.slides.length - 1) return;

        const currentSlide = section.slides[slideIndex];
        const nextSlide = section.slides[slideIndex + 1];

        const mergedSlide = {
            ...currentSlide,
            id: `slide_${Date.now()}_merged`,
            lineas: [...currentSlide.lineas, ...nextSlide.lineas]
        };

        section.slides.splice(slideIndex, 2, mergedSlide);
        setSong(newSong);
    };

    // ==============================
    // Render
    // ==============================
    return (
        <div className="flex-col" style={{ height: '100%', background: 'var(--bg-primary)' }}>
            {/* HERMOSO HEADER DE IA */}
            <div style={{
                padding: '2rem 2.5rem', borderBottom: '1px solid var(--border-color)',
                background: 'linear-gradient(145deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
                zIndex: 10
            }}>
                <div className="flex-row justify-between mb-4">
                    <div className="flex-col">
                        <h2 style={{ margin: 0, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.75rem' }}>
                            <Edit2 size={28} /> ¡Estructura Generada con Éxito!
                        </h2>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
                            La Inteligencia Artificial ha organizado la canción. Por favor, revisa las diapositivas y ajusta errores.
                        </span>
                    </div>

                    <div className="flex-row" style={{ gap: '1rem', alignItems: 'center' }}>
                        <button className="danger" onClick={onCancel} style={{ padding: '0.75rem 1.5rem', fontWeight: 'bold' }}>
                            <X size={18} /> Descartar
                        </button>
                        <button className="primary" onClick={() => onSave(song)} style={{ padding: '0.75rem 2rem', fontWeight: 'bold', fontSize: '1.05rem' }}>
                            <Save size={20} /> Guardar Canción
                        </button>
                    </div>
                </div>

                <div className="flex-col mt-4" style={{ maxWidth: '800px' }}>
                    <label className="card-subtitle block mb-2" style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Título de la Alabanza:</label>
                    {editingTitle ? (
                        <input
                            className="w-full"
                            style={{ fontSize: '1.75rem', fontWeight: 'bold', padding: '0.75rem 1rem', background: 'var(--bg-elevated)', border: '1px solid var(--accent)' }}
                            value={titleInput}
                            onChange={e => setTitleInput(e.target.value)}
                            autoFocus
                            onBlur={handleSaveTitle}
                            onKeyDown={e => e.key === 'Enter' && handleSaveTitle()}
                        />
                    ) : (
                        <div className="flex-row justify-between" onClick={() => setEditingTitle(true)} style={{ cursor: 'pointer', padding: '0.5rem 1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                            <span style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{song.title}</span>
                            <Edit2 size={18} style={{ opacity: 0.5 }} />
                        </div>
                    )}
                </div>
            </div>

            {/* EDITOR DE SECCIONES (USANDO GRID Y TAMAÑOS DEL USUARIO) */}
            <div style={{ flexGrow: 1, overflowY: 'auto', padding: '2rem' }}>
                {song.secciones.map((sec, secIndex) => (
                    <div key={sec.id} className="card" style={{ padding: 0, overflow: 'hidden', borderLeft: '6px solid var(--accent)', boxShadow: 'var(--shadow-lg)', marginBottom: '2rem' }}>

                        {/* HEADER DE LA SECCIÓN */}
                        <div className="flex-row justify-between" style={{ background: 'var(--bg-secondary)', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                            <div className="flex-row" style={{ gap: '0.5rem', flexGrow: 1, alignItems: 'center' }}>
                                <Edit2 size={16} style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }} />
                                <input
                                    value={sec.nombre}
                                    onChange={(e) => handleRenameSection(secIndex, e.target.value)}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        color: 'var(--text-primary)',
                                        fontWeight: '800',
                                        fontSize: '1.2rem',
                                        padding: '0.4rem 0.8rem',
                                        width: '250px',
                                        borderRadius: 'var(--radius-sm)',
                                        outline: 'none',
                                    }}
                                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
                                    title="Renombrar sección"
                                />
                            </div>
                            <div className="flex-row" style={{ gap: '0.5rem' }}>
                                <button onClick={() => addSlide(secIndex)} className="primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', marginRight: '1rem' }}>
                                    <Plus size={14} /> Diapositiva
                                </button>
                                <button onClick={() => moveSection(secIndex, -1)} disabled={secIndex === 0} style={{ padding: '0.4rem', minWidth: 'auto', opacity: secIndex === 0 ? 0.3 : 1 }}><ArrowUp size={16} /></button>
                                <button onClick={() => moveSection(secIndex, 1)} disabled={secIndex === song.secciones.length - 1} style={{ padding: '0.4rem', minWidth: 'auto', opacity: secIndex === song.secciones.length - 1 ? 0.3 : 1 }}><ArrowDown size={16} /></button>
                                <button onClick={() => removeSection(secIndex)} className="danger" style={{ padding: '0.4rem', minWidth: 'auto', marginLeft: '1rem' }}><Trash2 size={16} /></button>
                            </div>
                        </div>

                        {/* SLIDES (EL GRID EXACTO DEL USUARIO) */}
                        <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                            {sec.slides.map((slide, slideIndex) => (
                                <div key={slide.id} style={{ background: '#222', padding: '1rem', borderRadius: '8px', position: 'relative' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: 'bold' }}>Diapositiva {slideIndex + 1}</span>
                                        <button onClick={() => removeSlide(secIndex, slideIndex)} style={{ padding: '0.2rem', background: 'transparent', color: 'var(--danger)', border: 'none' }}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    {/* EL TEXTAREA EXACTO DEL USUARIO */}
                                    <textarea
                                        style={{
                                            width: '100%',
                                            background: '#333',
                                            color: 'white',
                                            border: '1px solid #444',
                                            textAlign: 'center',
                                            minHeight: '120px',
                                            fontSize: '1.1rem',
                                            padding: '1rem',
                                            borderRadius: '6px',
                                            resize: 'vertical',
                                            outline: 'none',
                                            fontFamily: 'inherit'
                                        }}
                                        rows={Math.max(4, slide.lineas.length)}
                                        value={slide.lineas.join('\n')}
                                        onChange={(e) => handleTextChange(secIndex, slideIndex, e.target.value)}
                                        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                                        onBlur={e => e.target.style.borderColor = '#444'}
                                    />

                                    {/* BOTONES DE UNIR/DIVIDIR (COMBINANDO LÓGICA CON DISEÑO ROBUSTO) */}
                                    <div className="flex-row justify-between" style={{ marginTop: '0.8rem', gap: '0.5rem' }}>
                                        {slide.lineas.length > 2 && (
                                            <button onClick={() => splitSlideInHalf(secIndex, slideIndex)} style={{ flexGrow: 1, padding: '0.4rem', fontSize: '0.8rem', background: '#333', border: '1px solid #444', color: 'white' }}>
                                                <SplitSquareHorizontal size={14} style={{ marginRight: '4px' }} /> Dividir
                                            </button>
                                        )}
                                        {slideIndex < sec.slides.length - 1 && (
                                            <button onClick={() => mergeSlides(secIndex, slideIndex)} style={{ flexGrow: 1, padding: '0.4rem', fontSize: '0.8rem', background: 'transparent', border: '1px dashed #555', color: '#aaa' }}>
                                                <Merge size={14} style={{ marginRight: '4px' }} /> Unir a la {slideIndex + 2}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}