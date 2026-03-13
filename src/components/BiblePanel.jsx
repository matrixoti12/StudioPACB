import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { BookOpen, Search, Pin, Clock, Check, Play, Settings, Monitor, MonitorPlay, MonitorOff, Video, FastForward } from 'lucide-react';
import ScreenSettings from './ScreenSettings';

export default function BiblePanel({ showLibrary = true }) {
    const activeBibleVerse = useStore(state => state.activeBibleVerse);
    const setActiveBibleVerse = useStore(state => state.setActiveBibleVerse);
    const recentVerses = useStore(state => state.recentVerses);
    const pinnedVerses = useStore(state => state.pinnedVerses);
    const togglePinnedVerse = useStore(state => state.togglePinnedVerse);
    const isLive = useStore(state => state.isLive);
    const setLiveState = useStore(state => state.setLiveState);
    const toggleLive = useStore(state => state.toggleLive);
    const isBlackScreen = useStore(state => state.isBlackScreen);
    const toggleBlackScreen = useStore(state => state.toggleBlackScreen);
    const bibleAutoMode = useStore(state => state.bibleAutoMode);
    const toggleBibleAutoMode = useStore(state => state.toggleBibleAutoMode);
    const autoInterval = useStore(state => state.autoInterval);
    const setAutoInterval = useStore(state => state.setAutoInterval);
    const bgOpacity = useStore(state => state.bgOpacity);
    const setBgOpacity = useStore(state => state.setBgOpacity);

    const [books, setBooks] = useState([]);
    const [selectedBook, setSelectedBook] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [selectedChapter, setSelectedChapter] = useState(1);
    const [verses, setVerses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sidebarTab, setSidebarTab] = useState('recent'); // 'recent' | 'pinned' | 'settings'
    const [translations, setTranslations] = useState([]);
    const [selectedTranslation, setSelectedTranslation] = useState('spa_rvg');

    // Load Translations & Initial Books
    useEffect(() => {
        const fetchTranslations = async () => {
            try {
                const res = await fetch('https://bible.helloao.org/api/available_translations.json');
                const data = await res.json();
                // Filter to Spanish versions for cleaner UX, but allow all if needed.
                const spanishVersions = data.translations.filter(t => t.language === 'spa');
                setTranslations(spanishVersions);
            } catch (error) {
                console.error("Error fetching translations:", error);
            }
        };
        fetchTranslations();
    }, []);

    // Load Books based on translation
    useEffect(() => {
        const fetchBooks = async () => {
            try {
                const res = await fetch(`https://bible.helloao.org/api/${selectedTranslation}/books.json`);
                const data = await res.json();
                setBooks(data.books || []);
                if (data.books && data.books.length > 0 && !selectedBook) {
                    setSelectedBook(data.books[0]);
                } else if (data.books && selectedBook) {
                    // Try to map to the same book in new translation, otherwise default to first
                    const matchedBook = data.books.find(b => b.id === selectedBook.id);
                    setSelectedBook(matchedBook || data.books[0]);
                }
            } catch (error) {
                console.error("Error fetching books:", error);
            }
        };
        fetchBooks();
    }, [selectedTranslation]);

    // Load Chapters based on selected book
    useEffect(() => {
        if (selectedBook) {
            setChapters(Array.from({ length: selectedBook.numberOfChapters }, (_, i) => i + 1));
            setSelectedChapter(1); // auto select chap 1
        }
    }, [selectedBook]);

    // Load Verses
    useEffect(() => {
        const fetchVerses = async () => {
            if (!selectedBook) return;
            setLoading(true);
            try {
                // Book ID must be matched or use directly the ID from API
                const res = await fetch(`https://bible.helloao.org/api/${selectedTranslation}/${selectedBook.id}/${selectedChapter}.json`);
                const data = await res.json();

                if (data && data.chapter && data.chapter.content) {
                    const onlyVerses = data.chapter.content.filter(item => item.type === 'verse');
                    setVerses(onlyVerses);
                } else {
                    setVerses([]);
                }
            } catch (error) {
                console.error("Error fetching verses:", error);
                setVerses([]);
            }
            setLoading(false);
        };
        fetchVerses();
    }, [selectedBook, selectedChapter, selectedTranslation]);

    // Auto Advance Logic for Bible
    useEffect(() => {
        let intervalId;
        if (isLive && bibleAutoMode && activeBibleVerse && activeBibleVerse.number && !isBlackScreen) {
            intervalId = setInterval(() => {
                const currentNumber = parseInt(activeBibleVerse.number);
                // Find next verse in the current chapter array
                const sortedLocalVerses = [...verses].sort((a, b) => parseInt(a.number) - parseInt(b.number));
                const currentIndex = sortedLocalVerses.findIndex(v => parseInt(v.number) === currentNumber);

                if (currentIndex !== -1 && currentIndex < sortedLocalVerses.length - 1) {
                    const nextVerse = sortedLocalVerses[currentIndex + 1];
                    handleProject(nextVerse);
                }
            }, autoInterval * 1000);
        }
        return () => clearInterval(intervalId);
    }, [isLive, bibleAutoMode, activeBibleVerse, verses, isBlackScreen, autoInterval]);

    const handleProject = (verse) => {
        const newVerseContext = {
            id: `${selectedBook.id}-${selectedChapter}-${verse.number}`,
            text: verse.content.join ? verse.content.join(' ') : verse.content, // Sometimes content might be array or string depending on API, API says it's array/objects mostly
            reference: `${selectedBook.name} ${selectedChapter}:${verse.number}`,
            bookId: selectedBook.id,
            chapter: selectedChapter,
            number: verse.number,
            rawVerse: verse
        };

        // Fix logic for text extracting if Content is complex
        let extractedText = '';
        if (typeof verse.content === 'string') {
            extractedText = verse.content;
        } else if (Array.isArray(verse.content)) {
            // Flatten nested objects like text blocks
            extractedText = verse.content.map(c => typeof c === 'string' ? c : c.text || '').join('');
        }
        newVerseContext.text = extractedText;

        setActiveBibleVerse(newVerseContext);
        if (!isLive) {
            setLiveState(true);
        }
    };

    const reProjectSaved = (v) => {
        setActiveBibleVerse(v);
        if (!isLive) setLiveState(true);
    };



    const filteredBooks = books.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const renderVerseRow = (v) => {
        return (
            <div key={v.id} style={{
                padding: '0.75rem',
                borderBottom: '1px solid var(--border-color)',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '8px',
                marginBottom: '8px'
            }}>
                <div className="flex-row justify-between" style={{ marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--accent)', fontSize: '0.85rem' }}>{v.reference}</span>
                    <div className="flex-row" style={{ gap: '0.5rem' }}>
                        <button
                            onClick={() => togglePinnedVerse(v)}
                            style={{
                                padding: '4px',
                                background: 'transparent',
                                border: 'none',
                                color: pinnedVerses.find(p => p.id === v.id) ? 'var(--accent)' : 'var(--text-secondary)'
                            }}
                            title="Fijar"
                        >
                            <Pin size={14} fill={pinnedVerses.find(p => p.id === v.id) ? 'currentColor' : 'none'} />
                        </button>
                        <button
                            onClick={() => reProjectSaved(v)}
                            style={{
                                padding: '4px 8px',
                                fontSize: '0.75em',
                                background: activeBibleVerse?.id === v.id && isLive ? 'var(--danger)' : 'var(--accent)',
                                color: activeBibleVerse?.id === v.id && isLive ? 'white' : 'black',
                                border: 'none'
                            }}
                        >
                            <Play size={12} fill="currentColor" />
                        </button>
                    </div>
                </div>
                <div style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>
                    {v.text}
                </div>
            </div>
        )
    };

    return (
        <div className="panel" style={{ flexDirection: 'row', borderRight: 'none', height: '100%' }}>
            {/* LEFT COLUMN: Book Selection */}
            <div style={{
                width: showLibrary ? '280px' : '0px',
                borderRight: showLibrary ? '1px solid var(--border-color)' : 'none',
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--bg-secondary)',
                transition: 'width 0.3s ease',
                overflow: 'hidden'
            }}>
                <div className="panel-header" style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '280px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '0.9rem', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}><BookOpen size={14} /> Biblioteca</h2>
                        <select
                            value={selectedTranslation}
                            onChange={(e) => setSelectedTranslation(e.target.value)}
                            style={{
                                background: 'var(--bg-elevated)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-color)',
                                padding: '2px 4px',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                outline: 'none',
                                maxWidth: '120px'
                            }}
                        >
                            {translations.map(t => (
                                <option key={t.id} value={t.id}>{t.shortName} - {t.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-row" style={{ background: 'var(--bg-primary)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                        <Search size={14} color="var(--text-secondary)" />
                        <input
                            style={{ border: 'none', background: 'transparent', padding: 0, outline: 'none', width: '100%', marginLeft: '8px', color: 'var(--text-primary)' }}
                            placeholder="Buscar libro..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div className="panel-content" style={{ padding: '0.4rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '4px', alignContent: 'start', minWidth: '280px' }}>
                    {books.length === 0 ? <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', gridColumn: '1 / -1' }}>Cargando libros...</p> : null}
                    {filteredBooks.map(book => (
                        <div
                            key={book.id}
                            onClick={() => setSelectedBook(book)}
                            title={book.name}
                            style={{
                                padding: '0.5rem 0.2rem',
                                borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer',
                                background: selectedBook?.id === book.id ? 'var(--accent)' : 'var(--bg-elevated)',
                                color: selectedBook?.id === book.id ? '#000' : 'var(--text-primary)',
                                fontWeight: selectedBook?.id === book.id ? 700 : 500,
                                fontSize: '0.7rem',
                                textAlign: 'center',
                                transition: 'all 0.2s',
                                border: '1px solid rgba(255,255,255,0.05)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minHeight: '32px',
                                whiteSpace: 'normal',
                                lineHeight: '1.2'
                            }}
                        >
                            {book.name}
                        </div>
                    ))}
                </div>
            </div>

            {/* MIDDLE COLUMN: Chapters & Verses */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
                {selectedBook ? (
                    <>
                        <div className="panel-header" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                            <span style={{ fontWeight: 600, marginRight: '0.5rem', alignSelf: 'center', fontSize: '0.85rem' }}>Capítulos:</span>
                            {chapters.map(cap => (
                                <button
                                    key={cap}
                                    onClick={() => setSelectedChapter(cap)}
                                    style={{
                                        minWidth: '32px',
                                        padding: '0.2rem',
                                        background: selectedChapter === cap ? 'var(--accent)' : 'var(--bg-elevated)',
                                        color: selectedChapter === cap ? '#000' : 'var(--text-primary)',
                                        border: 'none',
                                        borderRadius: '4px',
                                        fontSize: '0.8rem'
                                    }}
                                >
                                    {cap}
                                </button>
                            ))}
                        </div>
                        <div className="panel-content" style={{ padding: '0.5rem 1rem', position: 'relative' }}>
                            <div className="flex-row justify-between mb-2">
                                <h2 style={{ color: 'var(--accent)', fontSize: '1.2rem', margin: 0 }}>{selectedBook.name} {selectedChapter}</h2>
                                <button
                                    className="primary"
                                    onClick={() => window.open('#/live/bible', 'bibleLiveWindow', 'width=1280,height=720,menubar=no,toolbar=no')}
                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                >
                                    <MonitorPlay size={14} style={{ marginRight: '6px' }} /> Abrir Ventana Live (Biblia)
                                </button>
                            </div>

                            {loading && <div style={{ color: 'var(--text-secondary)' }}>Cargando versículos...</div>}

                            {!loading && verses.map((v) => {
                                // Extract text safely
                                let text = '';
                                if (typeof v.content === 'string') text = v.content;
                                else if (Array.isArray(v.content)) text = v.content.map(c => typeof c === 'string' ? c : c.text || '').join('');

                                const isLiveNow = activeBibleVerse?.id === `${selectedBook.id}-${selectedChapter}-${v.number}` && isLive;

                                return (
                                    <div
                                        key={v.number}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'row',
                                            alignItems: 'flex-start',
                                            gap: '1rem',
                                            marginBottom: '0.2rem',
                                            padding: '0.4rem',
                                            borderRadius: 'var(--radius-sm)',
                                            background: isLiveNow ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255,255,255,0.01)',
                                            border: `1px solid ${isLiveNow ? 'rgba(239, 68, 68, 0.3)' : 'transparent'}`
                                        }}
                                    >
                                        <div style={{ flex: '0 0 30px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                            {v.number}
                                        </div>
                                        <div style={{ flex: '1 1 auto', minWidth: '0', fontSize: '0.9rem', lineHeight: '1.3' }}>
                                            {text}
                                        </div>
                                        <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center' }}>
                                            <button
                                                className={isLiveNow ? 'danger active' : 'primary'}
                                                onClick={() => handleProject(v)}
                                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                                            >
                                                {isLiveNow ? <Check size={12} /> : <Play size={12} />}
                                                {isLiveNow ? 'Proyectando' : 'Proyectar'}
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </>
                ) : (
                    <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', flexDirection: 'column', gap: '1rem' }}>
                        <BookOpen size={48} opacity={0.2} />
                        <p>Selecciona un libro a la izquierda para comenzar</p>
                    </div>
                )}
            </div>

            {/* RIGHT COLUMN: History & Pinned */}
            <div style={{ width: '280px', borderLeft: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)' }}>
                <div className="panel-header" style={{ padding: '1rem 0 0 0' }}>
                    <div className="segmented-control" style={{ margin: '0 0.5rem 0.5rem 0.5rem' }}>
                        <button className={sidebarTab === 'recent' ? 'active' : ''} onClick={() => setSidebarTab('recent')} style={{ fontSize: '0.75rem', padding: '0.4rem' }}>
                            Recientes
                        </button>
                        <button className={sidebarTab === 'pinned' ? 'active' : ''} onClick={() => setSidebarTab('pinned')} style={{ fontSize: '0.75rem', padding: '0.4rem' }}>
                            Fijados
                        </button>
                        <button className={sidebarTab === 'settings' ? 'active' : ''} onClick={() => setSidebarTab('settings')} style={{ fontSize: '0.75rem', padding: '0.4rem' }}>
                            Pantalla
                        </button>
                    </div>
                </div>
                <div className="panel-content" style={{ padding: sidebarTab === 'settings' ? '0rem 0.5rem' : '0.5rem', overflowY: 'auto' }}>
                    {sidebarTab === 'recent' && (
                        <div>
                            {recentVerses.length === 0 && <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', marginTop: '2rem' }}>No hay versículos recientes.</p>}
                            {recentVerses.map(renderVerseRow)}
                        </div>
                    )}
                    {sidebarTab === 'pinned' && (
                        <div>
                            {pinnedVerses.length === 0 && <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', marginTop: '2rem' }}>No has fijado ningún versículo.</p>}
                            {pinnedVerses.map(renderVerseRow)}
                        </div>
                    )}
                    {sidebarTab === 'settings' && (
                        <div style={{ paddingBottom: '1rem' }}>
                            <ScreenSettings />
                        </div>
                    )}
                </div>

                {/* Extra Quick Controls for Bible overlay */}
                <div style={{ padding: '0.8rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <h3 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                        <Settings size={14} /> Controles en Vivo
                    </h3>

                    <div className="flex-row" style={{ gap: '0.5rem' }}>
                        <button
                            className={`flex-1 ${isLive ? 'danger active' : 'primary'}`}
                            onClick={toggleLive}
                            style={{ padding: '0.6rem', fontSize: '0.85rem' }}
                        >
                            {isLive ? <MonitorOff size={14} /> : <Monitor size={14} />}
                            {isLive ? 'Detener' : 'En Vivo'}
                        </button>
                        <button
                            className={`flex-1 ${isBlackScreen ? 'active-toggle' : ''}`}
                            onClick={toggleBlackScreen}
                            style={{ padding: '0.6rem', fontSize: '0.85rem', background: isBlackScreen ? '#000' : 'var(--bg-secondary)', color: 'white', border: '1px solid var(--border-color)' }}
                        >
                            <Monitor size={14} fill={isBlackScreen ? "currentColor" : "none"} />
                            {isBlackScreen ? 'Mostrar' : 'Ocultar'}
                        </button>
                    </div>

                    <div style={{ background: 'var(--bg-secondary)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="flex-row justify-between mb-2">
                            <span style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <FastForward size={14} color={bibleAutoMode ? 'var(--danger)' : 'var(--text-secondary)'} /> Auto-Avance
                            </span>
                            <button
                                onClick={toggleBibleAutoMode}
                                style={{
                                    padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', border: 'none',
                                    background: bibleAutoMode ? 'var(--danger)' : 'var(--bg-elevated)',
                                    color: bibleAutoMode ? '#fff' : 'var(--text-secondary)'
                                }}
                            >
                                {bibleAutoMode ? 'ON' : 'OFF'}
                            </button>
                        </div>
                        {bibleAutoMode && (
                            <div className="flex-row justify-between mt-2" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                <span>Intervalo:</span>
                                <div className="flex-row" style={{ gap: '4px' }}>
                                    <input
                                        type="number"
                                        min="1"
                                        max="60"
                                        value={autoInterval}
                                        onChange={(e) => setAutoInterval(Number(e.target.value))}
                                        style={{ width: '40px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'white', textAlign: 'center', padding: '2px 0', borderRadius: '4px' }}
                                    />
                                    <span>seg</span>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
