import React, { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Settings, Type, Image as ImageIcon, Music, Trash2, FileText, X, Palette, Monitor } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import SongEditor from './SongEditor';
import ScreenSettings from './ScreenSettings';
// Vite optimiza el uso de workers nativos importándolos con ?url
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;



export default function LibraryPanel({ onClose }) {
    const {
        songs, addSong, removeSong, addToSet
    } = useStore();

    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newLyrics, setNewLyrics] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeTab, setActiveTab] = useState('library');
    const [draftSong, setDraftSong] = useState(null); // Para almacenar la respuesta de IA antes de guardar
    const fileInputRef = useRef(null);

    // Utilidad de limpieza de texto PRE-IA
    const cleanTextBeforeAI = (rawText) => {
        if (!rawText) return "";
        let text = rawText;
        // 1. Convertir a UTF-8 (viene implícito en JS pero asegurar decodificación si es necesario)
        try { text = decodeURIComponent(escape(text)); } catch (e) { }
        // 2. Normalizar todos los saltos de línea y retornos de carro a \n
        text = text.replace(/\r\n|\r/g, '\n');
        // 3. Limpiar caracteres invisibles extraños (manteniendo espacios y saltos de línea)
        text = text.replace(/[^\S\r\n]+/g, ' ');
        // 4. Aplicar trim a cada línea
        text = text.split('\n').map(line => line.trim()).join('\n');
        // 5. Eliminar múltiples líneas vacías consecutivas (dejar máximo 1)
        text = text.replace(/\n{2,}/g, '\n\n');
        // 6. Trim final
        return text.trim();
    };

    const handleAIGeneration = async (textToProcess = null) => {
        const rawQuery = textToProcess || newLyrics;
        const query = cleanTextBeforeAI(rawQuery);
        if (!query) return;

        setIsGenerating(true);

        try {
            const systemPrompt = `Actúa como analista musical especializado en estructura de canciones cristianas para proyección en iglesias.
Te proporcionaré la letra completa de una canción ya limpia.
Tu tarea es:
Identificar la estructura musical real.
Detectar automáticamente el coro según frecuencia de repetición.
Identificar versos, puente, precoro o final aunque no estén marcados explícitamente.
No duplicar secciones repetidas.
Crear una estructura reutilizable (no narrativa lineal del video).
Dividir cada sección en bloques optimizados para pantalla 1920x1080.
Cada bloque (slide) debe contener entre 1 y 3 líneas.
Si una línea es demasiado larga, dividirla respetando el sentido semántico.
Mantener equilibrio visual y legibilidad.
No agregar comentarios ni explicaciones.

Debes devolver únicamente JSON válido con esta estructura exacta:
{
"titulo": "Nombre de la canción",
"artista": "Nombre del artista si se puede detectar, si no dejar vacío",
"secciones": [
{
"nombre": "Verso 1",
"slides": [
["línea 1", "línea 2"],
["línea 3"]
]
}
]
}

Reglas obligatorias:
No incluir texto fuera del JSON.
No duplicar coros o secciones repetidas.
No generar slides con más de 3 líneas.
No generar slides vacíos.
No alterar el contenido original de la letra.
El objetivo es generar una estructura profesional modular reutilizable para proyección en vivo.`;

            const userPrompt = `Aplica el análisis estructural a esta letra:\n\n${query}`;

            const response = await fetch('https://api.deepseek.com/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer sk-a5f81691da8e4556a50c08c019d51509'
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.1
                })
            });

            if (!response.ok) throw new Error("Error conectando con la API de DeepSeek.");

            const data = await response.json();
            let aiContent = data.choices[0].message.content.trim();

            // Limpieza de marcadores markdown
            aiContent = aiContent.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();

            const parsed = JSON.parse(aiContent);

            // Validaciones Post-IA estrictas
            if (!parsed || typeof parsed !== 'object') throw new Error("La respuesta no es un objeto JSON válido.");
            if (!parsed.titulo) throw new Error("Falta el campo 'titulo' en la respuesta de la IA.");
            if (!Array.isArray(parsed.secciones) || parsed.secciones.length === 0) throw new Error("La IA no devolvió secciones válidas.");

            // Mapeo e hidratación (Añadir IDs, fechas y cálculo de duración automática)
            const normalizedSecciones = parsed.secciones.map((sec, secIndex) => {
                if (!Array.isArray(sec.slides) || sec.slides.length === 0) {
                    throw new Error(`La sección "${sec.nombre}" no tiene slides válidos.`);
                }
                const normalizedSlides = sec.slides.map((slideLines, slideIndex) => {
                    if (!Array.isArray(slideLines) || slideLines.length === 0 || slideLines.length > 4) {
                        throw new Error(`El slide ${slideIndex} en la sección "${sec.nombre}" no cumple con el límite de 1 a 4 líneas.`);
                    }

                    const wordCount = slideLines.join(' ').split(/\s+/).filter(w => w.length > 0).length;
                    let duracion = 4; // default (1-6 words approx)
                    if (wordCount >= 7 && wordCount <= 12) duracion = 5.5;
                    else if (wordCount >= 13) duracion = 7.5;

                    return {
                        id: `slide_${Date.now()}_${secIndex}_${slideIndex}`,
                        lineas: slideLines,
                        duracion: duracion
                    };
                });

                return {
                    id: `sec_${Date.now()}_${secIndex}`,
                    nombre: sec.nombre || 'Sección',
                    slides: normalizedSlides
                };
            });

            // Parse final track
            const finalDraft = {
                id: Date.now().toString(),
                title: parsed.titulo,
                artista: parsed.artista || "",
                secciones: normalizedSecciones,
                fechaCreacion: new Date().toISOString(),
                ultimaModificacion: new Date().toISOString(),
                ultimaUsada: null
            };

            // En lugar de guardar directo, ponemos la canción en estado borrador (draft) para su revisión final
            setDraftSong(finalDraft);
            setIsAdding(false);
            setNewLyrics('');
            setNewTitle('');

        } catch (error) {
            console.error(error);
            alert("Error en validación de Inteligencia Artificial: " + error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            setNewTitle(file.name.replace(/\.[^/.]+$/, "")); // Quita la extensión

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();

                // Mapeo simple: juntamos items de texto e intentamos preservar saltos leyendo Y
                let lastY = -1;
                textContent.items.forEach(item => {
                    if (lastY !== -1 && Math.abs(item.transform[5] - lastY) > 10) {
                        // Cambio de línea detectado (eje Y)
                        fullText += '\n';

                        // Si el salto es muy grande, asumimos que es nueva estrofa
                        if (Math.abs(item.transform[5] - lastY) > 25) {
                            fullText += '\n';
                        }
                    }
                    fullText += item.str;
                    lastY = item.transform[5];
                });
                fullText += '\n\n'; // Fin de página
            }

            // Limpiar múltiples saltos vacíos consecutivos u operaciones previas locales al script IA
            fullText = cleanTextBeforeAI(fullText);

            // Cuando tenemos el texto del PDF, se lo pasamos a la IA en vez de intentar arreglarlo localmente
            handleAIGeneration(fullText);

            // Refrescar input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

        } catch (error) {
            console.error(error);
            alert("Hubo un error al intentar leer el PDF: " + error.message);
        }
    };

    const handlePdfImport = () => {
        if (fileInputRef.current) fileInputRef.current.click();
    };

    return (
        <div className="panel flex-col" style={{ borderRight: '1px solid var(--border-color)', height: '100%' }}>
            <div className="panel-header flex-row justify-between" style={{ paddingBottom: '0.5rem', borderBottom: 'none' }}>
                <h2 style={{ margin: 0 }}>{activeTab === 'library' ? <><Music size={20} /> Librería</> : <><Monitor size={20} /> Pantalla</>}</h2>
                {onClose && <button onClick={onClose} style={{ padding: '0.3rem', border: 'none', background: 'transparent', color: 'var(--text-secondary)' }}><X size={20} /></button>}
            </div>

            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
                <div className="segmented-control">
                    <button onClick={() => setActiveTab('library')} className={activeTab === 'library' ? 'active' : ''}><Music size={16} /> Canciones</button>
                    <button onClick={() => setActiveTab('settings')} className={activeTab === 'settings' ? 'active' : ''}><Monitor size={16} /> Pantalla</button>
                </div>
            </div>

            <div className="panel-content flex-col" style={{ flexGrow: 1, overflowY: 'auto', padding: '1.5rem' }}>
                <>
                    {activeTab === 'library' && (
                        <>
                            <div className="flex-row justify-between mb-4">
                                <h3 style={{ fontSize: '1.1rem' }}>Tus Canciones</h3>
                                <button className="primary" onClick={() => setIsAdding(!isAdding)}>
                                    {isAdding ? 'Cancelar' : <><Plus size={16} /> Nueva</>}
                                </button>
                            </div>

                            {isAdding && (
                                <div className="card mb-4" style={{ borderColor: 'var(--accent)', background: 'linear-gradient(145deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)' }}>
                                    <div className="mb-3" style={{ fontSize: '0.9rem', color: 'var(--text-primary)', textAlign: 'center' }}>
                                        <b>✨ Estructurador Inteligente (DeepSeek)</b>
                                    </div>
                                    <div className="mb-2" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                                        Pega la letra sucia de Letras.com, o sube tu PDF. La IA la ordenará por ti.
                                    </div>
                                    <textarea
                                        className="mb-4"
                                        rows={8}
                                        placeholder="Pega todo el texto de la letra aquí..."
                                        value={newLyrics}
                                        onChange={e => setNewLyrics(e.target.value)}
                                        disabled={isGenerating}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}
                                    ></textarea>
                                    <button
                                        className="primary w-full mb-4"
                                        onClick={() => handleAIGeneration()}
                                        disabled={isGenerating || !newLyrics.trim()}
                                        style={{ padding: '0.8rem', fontSize: '1rem' }}
                                    >
                                        {isGenerating ? '🪄 Estructurando, espere...' : '🪄 Organizar Texto con IA'}
                                    </button>

                                    <div style={{ borderTop: '1px solid var(--border-color)', margin: '1rem 0', opacity: 0.5 }}></div>

                                    <input
                                        type="file"
                                        accept="application/pdf"
                                        style={{ display: 'none' }}
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                    />
                                    <button
                                        className="w-full"
                                        onClick={handlePdfImport}
                                        disabled={isGenerating}
                                    >
                                        <FileText size={16} /> Importar PDF Mágico
                                    </button>
                                </div>
                            )}

                            {songs.length === 0 && !isAdding && (
                                <div style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem' }}>
                                    <Music size={40} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                                    <p>No hay canciones guardadas.</p>
                                    <p style={{ fontSize: '0.8rem' }}>Añade una canción para empezar.</p>
                                </div>
                            )}

                            {songs.map(song => (
                                <div key={song.id} className="card flex-row justify-between" onClick={() => addToSet(song)} title="Haz clic para agregar al Set del Culto">
                                    <div style={{ flexGrow: 1, overflow: 'hidden' }}>
                                        <div className="card-title" style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{song.title}</div>
                                        <div className="card-subtitle">{song.secciones ? song.secciones.reduce((acc, sec) => acc + sec.slides.length, 0) : song.blocks?.length} diapositivas</div>
                                    </div>
                                    <button className="danger" onClick={(e) => { e.stopPropagation(); removeSong(song.id); }} style={{ padding: '0.5rem', minWidth: 'auto', border: 'none' }} title="Eliminar"><Trash2 size={16} /></button>
                                </div>
                            ))}
                        </>
                    )}

                    {activeTab === 'settings' && (
                        <ScreenSettings />
                    )}
                </>

            </div>

            {/* MODAL EDITOR DE CANCIÓN EN PANTALLA COMPLETA */}
            {draftSong && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, width: '100vw', height: '100vh',
                    backgroundColor: 'rgba(5,5,5,0.95)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div style={{
                        width: '95%',
                        maxWidth: '1400px',
                        height: '95vh',
                        backgroundColor: 'var(--bg-primary)',
                        borderRadius: 'var(--radius-lg)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 1)',
                        overflow: 'hidden',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <SongEditor
                            draftSong={draftSong}
                            onSave={(finalSong) => {
                                addSong(finalSong);
                                setDraftSong(null);
                            }}
                            onCancel={() => setDraftSong(null)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
