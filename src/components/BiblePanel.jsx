import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useStore } from '../store/useStore';
import { BookOpen, Search, Pin, Clock, Check, Play, Settings, Monitor, MonitorPlay, MonitorOff, Video, FastForward, Upload, Trash2, FolderUp, Minus, Maximize2, Pause } from 'lucide-react';
import ScreenSettings from './ScreenSettings';
import JSZip from 'jszip';

const DraggableWindow = ({ title, children, initialX = 100, initialY = 100, defaultMinimized = false }) => {
    const [pos, setPos] = useState({ x: initialX, y: initialY });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isMinimized, setIsMinimized] = useState(defaultMinimized);

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragOffset({ x: e.clientX - pos.x, y: e.clientY - pos.y });
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isDragging) {
                setPos({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
            }
        };
        const handleMouseUp = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    return (
        <div style={{
            position: 'fixed', left: pos.x, top: pos.y, zIndex: 9999,
            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
            borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
            width: '360px', display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}>
            <div 
                onMouseDown={handleMouseDown}
                style={{
                    padding: '12px 15px', background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)',
                    cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Settings size={16} color="var(--accent)" />
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{title}</span>
                </div>
                <button 
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => setIsMinimized(!isMinimized)} 
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-primary)', cursor: 'pointer', padding: '4px 8px', fontSize: '0.7rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {isMinimized ? <Maximize2 size={12}/> : <Minus size={12}/>}
                    {isMinimized ? 'Maximizar' : 'Minimizar'}
                </button>
            </div>
            {!isMinimized && (
                <div style={{ padding: '15px', maxHeight: '75vh', overflowY: 'auto' }}>
                    {children}
                </div>
            )}
        </div>
    );
};

const BIBLE_BOOKS = {
    1: "Génesis", 2: "Éxodo", 3: "Levítico", 4: "Números", 5: "Deuteronomio",
    6: "Josué", 7: "Jueces", 8: "Rut", 9: "1 Samuel", 10: "2 Samuel",
    11: "1 Reyes", 12: "2 Reyes", 13: "1 Crónicas", 14: "2 Crónicas", 15: "Esdras",
    16: "Nehemías", 17: "Ester", 18: "Job", 19: "Salmos", 20: "Proverbios",
    21: "Eclesiastés", 22: "Cantares", 23: "Isaías", 24: "Jeremías", 25: "Lamentaciones",
    26: "Ezequiel", 27: "Daniel", 28: "Oseas", 29: "Joel", 30: "Amós",
    31: "Abdías", 32: "Jonás", 33: "Miqueas", 34: "Nahúm", 35: "Habacuc",
    36: "Sofonías", 37: "Hageo", 38: "Zacarías", 39: "Malaquías", 40: "Mateo",
    41: "Marcos", 42: "Lucas", 43: "Juan", 44: "Hechos", 45: "Romanos",
    46: "1 Corintios", 47: "2 Corintios", 48: "Gálatas", 49: "Efesios", 50: "Filipenses",
    51: "Colosenses", 52: "1 Tesalonicenses", 53: "2 Tesalonicenses", 54: "1 Timoteo",
    55: "2 Timoteo", 56: "Tito", 57: "Filemón", 58: "Hebreos", 59: "Santiago",
    60: "1 Pedro", 61: "2 Pedro", 62: "1 Juan", 63: "2 Juan", 64: "3 Juan",
    65: "Judas", 66: "Apocalipsis"
};

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

    const localBibles = useStore(state => state.localBibles) || [];
    const addLocalBible = useStore(state => state.addLocalBible);
    const removeLocalBible = useStore(state => state.removeLocalBible);

    const [books, setBooks] = useState([]);
    const [selectedBook, setSelectedBook] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [selectedChapter, setSelectedChapter] = useState(1);
    const [verses, setVerses] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // New Search States
    const [searchQuery, setSearchQuery] = useState('');
    const [searchFilter, setSearchFilter] = useState('all'); // 'all', 'ot', 'nt'
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const [sidebarTab, setSidebarTab] = useState('books'); // 'books' | 'recent' | 'pinned'
    const [selectedTranslation, setSelectedTranslation] = useState('local_rv1960');
    const [importing, setImporting] = useState(false);

    const verseRefs = useRef({});
    const bibleLiveWindowRef = useRef(null);


    // 1. Initial Selection Setup
    useEffect(() => {
        // Enforce local
        if (localBibles.length > 0 && (!selectedTranslation || !localBibles.find(b => b.id === selectedTranslation))) {
            setSelectedTranslation(localBibles[0].id);
        }

        // AUTO-PRELOAD DE BIBLIAS LOCALES SI LA BASE DE DATOS ESTÁ VACÍA
        const preloadLocalBibles = async () => {
            const storeState = useStore.getState();
            if (storeState.localBibles && storeState.localBibles.length > 0) return; // Ya hay biblias

            console.log("Preloading local bibles...");
            setImporting(true);
            const biblesToLoad = [
                'dhh.bi',
                'ntv.bi',
                'rv1960.bi',
                'tla.bi',
                'nvi.bi'
            ];

            let firstImportedId = null;

            for (const filename of biblesToLoad) {
                try {
                    const res = await fetch(`/biblias/${filename}`);
                    if (!res.ok) continue;
                    
                    const blob = await res.blob();
                    const zip = new JSZip();
                    const content = await zip.loadAsync(blob);
                    
                    const fileNames = Object.keys(content.files);
                    const txtFile = fileNames.find(n => !content.files[n].dir);
                    if(!txtFile) continue;
                    
                    const rawText = await content.file(txtFile).async("string");
                    const lines = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
                    
                    let parsedBooksObj = {};
                    let parsedVerses = [];
                    let maxChapterPerBook = {};

                    lines.forEach(line => {
                        const parts = line.split('|');
                        if (parts.length >= 4) {
                            const bookIdStr = parts[0].trim();
                            const bookId = parseInt(bookIdStr, 10);
                            const chapter = parseInt(parts[1].trim(), 10);
                            const verseNum = parts[2].trim();
                            let separatorIdx = line.indexOf('|', line.indexOf('|', line.indexOf('|') + 1) + 1);
                            const text = line.substring(separatorIdx + 1).trim();
                            
                            if (isNaN(bookId) || isNaN(chapter)) return;

                            if (!parsedBooksObj[bookIdStr]) {
                                parsedBooksObj[bookIdStr] = {
                                    id: bookIdStr,
                                    name: BIBLE_BOOKS[bookId] || `Libro ${bookId}`,
                                    numberOfChapters: chapter
                                };
                                maxChapterPerBook[bookIdStr] = chapter;
                            } else {
                                if (chapter > maxChapterPerBook[bookIdStr]) {
                                    maxChapterPerBook[bookIdStr] = chapter;
                                    parsedBooksObj[bookIdStr].numberOfChapters = chapter;
                                }
                            }
                            
                            parsedVerses.push({
                                bookId: bookIdStr,
                                chapter: chapter,
                                number: verseNum,
                                content: text
                            });
                        }
                    });
                    
                    const finalBooks = Object.values(parsedBooksObj).sort((a,b) => parseInt(a.id) - parseInt(b.id));
                    const bibleName = filename.replace(/\.bi$/i, '').replace(/\.zip$/i, '').split('-')[0].trim();
                    let shortName = filename.includes('- ') ? filename.split('- ')[1].replace('.bi', '').trim() : bibleName.toUpperCase();
                    
                    const bibleId = `local_${shortName.toLowerCase()}`;
                    
                    // Solo añadir si no existe ya
                    if (!useStore.getState().localBibles?.find(b => b.id === bibleId)) {
                        useStore.getState().addLocalBible({
                            id: bibleId,
                            name: bibleName,
                            shortName: shortName,
                            isLocal: true,
                            books: finalBooks,
                            verses: parsedVerses
                        });
                    }
                    
                    if (!firstImportedId) firstImportedId = bibleId;

                } catch (err) {
                    console.error("Failed to preload:", filename, err);
                }
            }
            setImporting(false);
            if (firstImportedId) setSelectedTranslation(firstImportedId);
        };
        
        preloadLocalBibles();

    }, []);

    // 2. Load Books based on translation
    useEffect(() => {
        const localDb = localBibles.find(b => b.id === selectedTranslation);
        if (localDb) {
            setBooks(localDb.books || []);
            if (localDb.books && localDb.books.length > 0 && !selectedBook) {
                setSelectedBook(localDb.books[0]);
            } else if (localDb.books && selectedBook) {
                const matchedBook = localDb.books.find(b => b.id === selectedBook.id);
                setSelectedBook(matchedBook || localDb.books[0]);
            }
            return;
        }

        const fetchBooks = async () => {
            setLoading(true);
            try {
                const res = await fetch(`https://bible.helloao.org/api/${selectedTranslation}/books.json`);
                const data = await res.json();
                setBooks(data.books || []);
                if (data.books && data.books.length > 0 && !selectedBook) {
                    setSelectedBook(data.books[0]);
                } else if (data.books && selectedBook) {
                    const matchedBook = data.books.find(b => b.id === selectedBook.id);
                    setSelectedBook(matchedBook || data.books[0]);
                }
            } catch (error) {
                console.error("Error fetching books:", error);
            }
            setLoading(false);
        };
        fetchBooks();
    }, [selectedTranslation]);

    // 3. Load Chapters
    useEffect(() => {
        if (selectedBook) {
            setChapters(Array.from({ length: selectedBook.numberOfChapters }, (_, i) => i + 1));
            // Only reset chapter if it exceeds new book's chapters
            if (selectedChapter > selectedBook.numberOfChapters) {
                setSelectedChapter(1);
            }
        }
    }, [selectedBook]);

    // 4. Load Verses for Reading Pane
    useEffect(() => {
        const fetchVerses = async () => {
            if (!selectedBook) return;
            setLoading(true);

            const localDb = localBibles.find(b => b.id === selectedTranslation);
            if (localDb) {
                const chapterVerses = localDb.verses.filter(v => 
                    v.bookId == selectedBook.id && v.chapter == selectedChapter
                );
                // Sort just in case
                setVerses(chapterVerses.sort((a,b) => parseInt(a.number) - parseInt(b.number)));
                setLoading(false);
                return;
            }

            try {
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

    // 5. Smart Search Effect
    useEffect(() => {
        if (!searchQuery || searchQuery.trim().length === 0) {
            setIsSearching(false);
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        const lowerQuery = searchQuery.toLowerCase().trim();
        const localDb = localBibles.find(b => b.id === selectedTranslation);
        
        // Smart parse: check if it looks like "Juan 3:16" or "Génesis 1"
        let searchIsReference = false;
        let refBookName = null;
        let refChapter = null;
        let refVerse = null;

        const refMatch = lowerQuery.match(/^([a-zñáéíóú\s\d]+)\s+(\d+)(?::(\d+))?$/i);
        if (refMatch) {
            refBookName = refMatch[1].trim().toLowerCase();
            refChapter = parseInt(refMatch[2]);
            refVerse = refMatch[3] ? parseInt(refMatch[3]) : null;
            searchIsReference = true;
        }
        
        if (localDb) {
            let results = [];
            
            if (searchIsReference) {
                // Find matching book
                const matchedBook = localDb.books.find(b => b.name.toLowerCase().includes(refBookName));
                if (matchedBook) {
                    results = localDb.verses.filter(v => {
                        if (v.bookId != matchedBook.id) return false;
                        if (v.chapter != refChapter) return false;
                        if (refVerse && v.number != refVerse) return false;
                        return true;
                    });
                }
            } else {
                // Normal text search
                results = localDb.verses.filter(v => v.content.toLowerCase().includes(lowerQuery));
            }

            if (searchFilter === 'ot') results = results.filter(v => parseInt(v.bookId) <= 39);
            if (searchFilter === 'nt') results = results.filter(v => parseInt(v.bookId) >= 40);
            
            const mapped = results.slice(0, 100).map(v => {
                const bookInfo = localDb.books.find(b => b.id == v.bookId);
                return {
                    ...v,
                    bookName: bookInfo ? bookInfo.name : `Libro ${v.bookId}`,
                    reference: `${bookInfo ? bookInfo.name : 'L'} ${v.chapter}:${v.number}`,
                    text: v.content,
                    isLocal: true
                };
            });
            setSearchResults(mapped);
        } else {
            // Buscador limitado para API (no se puede peinar todo de golpe sin un index)
            // Filtraremos solo el libro actual si es online
            let text = '';
            const mapped = verses.filter(v => {
                if (typeof v.content === 'string') text = v.content;
                else if (Array.isArray(v.content)) text = v.content.map(c => typeof c === 'string' ? c : c.text || '').join('');
                return text.toLowerCase().includes(lowerQuery);
            }).map(v => ({
                ...v,
                bookName: selectedBook.name,
                reference: `${selectedBook.name} ${selectedChapter}:${v.number}`,
                text: typeof v.content === 'string' ? v.content : v.content.map(c => typeof c === 'string' ? c : c.text || '').join(''),
                isLocal: false
            }));
            setSearchResults(mapped);
        }

    }, [searchQuery, searchFilter, localBibles, selectedTranslation, verses, selectedBook]);


    // Extract text safely from either string or array (for API)
    const getText = (content) => {
        if (typeof content === 'string') return content;
        if (Array.isArray(content)) return content.map(c => typeof c === 'string' ? c : c.text || '').join('');
        return '';
    };

    const handleProject = (verseInfo, forceComplete = false) => {
        let text = verseInfo.text || getText(verseInfo.content);
        
        const safeChapter = verseInfo.chapter || selectedChapter;
        const safeBookId = verseInfo.bookId || selectedBook?.id || 1;

        const newVerseContext = {
            id: `${safeBookId}-${safeChapter}-${verseInfo.number}`,
            text: text,
            reference: verseInfo.reference || `${selectedBook?.name || ''} ${safeChapter}:${verseInfo.number}`,
            bookId: safeBookId,
            chapter: safeChapter,
            number: verseInfo.number,
            rawVerse: verseInfo
        };

        setActiveBibleVerse(newVerseContext);
        
        // Auto-scroll the reading pane to make the verse visible.
        setTimeout(() => {
           if(verseRefs.current[`verse_${verseInfo.number}`]) {
               verseRefs.current[`verse_${verseInfo.number}`].scrollIntoView({ behavior: 'smooth', block: 'center' });
           } 
        }, 50);

        if (!isLive) setLiveState(true);
    };

    const reProjectSaved = (v) => {
        setActiveBibleVerse(v);
        // Intentar navegar si cambiaste de libro pero pusiste uno del historial
        const b = books.find(book => book.id == v.bookId);
        if (b && (selectedBook?.id !== b.id || selectedChapter !== v.chapter)) {
            setSelectedBook(b);
            setSelectedChapter(parseInt(v.chapter));
        }
        
        setTimeout(() => {
           if(verseRefs.current[`verse_${v.number}`]) {
               verseRefs.current[`verse_${v.number}`].scrollIntoView({ behavior: 'smooth', block: 'center' });
           } 
        }, 150);

        if (!isLive) setLiveState(true);
    };

    const navigateToSearchResult = (result) => {
        if (result.isLocal) {
            const b = books.find(book => book.id == result.bookId);
            if (b) {
                setSelectedBook(b);
                setSelectedChapter(parseInt(result.chapter));
                setTimeout(() => {
                    if(verseRefs.current[`verse_${result.number}`]) {
                        verseRefs.current[`verse_${result.number}`].scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 100);
            }
        } else {
            handleProject(result);
        }
    };

    const handleBulkImport = async (e) => {
        const files = Array.from(e.target.files).filter(f => f.name.endsWith('.bi') || f.name.endsWith('.zip'));
        if (files.length === 0) return;
        
        setImporting(true);
        let importedCount = 0;
        let lastImportedId = null;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
                const zip = new JSZip();
                const content = await zip.loadAsync(file);
                
                const fileNames = Object.keys(content.files);
                const txtFile = fileNames.find(n => !content.files[n].dir);
                if(!txtFile) continue;
                
                const rawText = await content.file(txtFile).async("string");
                const lines = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
                
                let parsedBooksObj = {};
                let parsedVerses = [];
                let maxChapterPerBook = {};

                lines.forEach(line => {
                    const parts = line.split('|');
                    if (parts.length >= 4) {
                        const bookIdStr = parts[0].trim();
                        const bookId = parseInt(bookIdStr, 10);
                        const chapter = parseInt(parts[1].trim(), 10);
                        const verseNum = parts[2].trim();
                        // Tratar el resto del string como contenido
                        let separatorIdx = line.indexOf('|', line.indexOf('|', line.indexOf('|') + 1) + 1);
                        const text = line.substring(separatorIdx + 1).trim();
                        
                        if (isNaN(bookId) || isNaN(chapter)) return;

                        if (!parsedBooksObj[bookIdStr]) {
                            parsedBooksObj[bookIdStr] = {
                                id: bookIdStr,
                                name: BIBLE_BOOKS[bookId] || `Libro ${bookId}`,
                                numberOfChapters: chapter
                            };
                            maxChapterPerBook[bookIdStr] = chapter;
                        } else {
                            if (chapter > maxChapterPerBook[bookIdStr]) {
                                maxChapterPerBook[bookIdStr] = chapter;
                                parsedBooksObj[bookIdStr].numberOfChapters = chapter;
                            }
                        }
                        
                        parsedVerses.push({
                            bookId: bookIdStr,
                            chapter: chapter,
                            number: verseNum,
                            content: text
                        });
                    }
                });
                
                const finalBooks = Object.values(parsedBooksObj).sort((a,b) => parseInt(a.id) - parseInt(b.id));
                const bibleName = file.name.replace(/\.bi$/i, '').replace(/\.zip$/i, '');
                
                // Generar ID predecible
                const bibleId = `local_${bibleName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`;
                
                // Check existance
                const existingBibles = useStore.getState().localBibles || [];
                if (!existingBibles.find(b => b.id === bibleId)) {
                    addLocalBible({
                        id: bibleId,
                        name: bibleName,
                        shortName: bibleName.substring(0, 3).toUpperCase(),
                        isLocal: true,
                        books: finalBooks,
                        verses: parsedVerses
                    });
                    importedCount++;
                    lastImportedId = bibleId;
                }
            } catch(err) {
                console.error("Error importando", file.name, err);
            }
        }
        
        setImporting(false);
        if (importedCount > 0) {
            alert(`✅ Se importaron ${importedCount} biblias correctamente.`);
            if (lastImportedId) setSelectedTranslation(lastImportedId);
        } else {
            alert(`⚠️ No se importaron nuevas biblias (ya existían o no eran válidas).`);
        }
        e.target.value = '';
    }

    // Highlighting query in text
    const highlightText = (text, highlight) => {
        if (!highlight.trim()) {
            return <span>{text}</span>;
        }
        const regex = new RegExp(`(${highlight})`, 'gi');
        const parts = text.split(regex);
        return (
            <span>
                {parts.map((part, i) => 
                    regex.test(part) ? <mark key={i} style={{ background: 'var(--accent)', color: 'black', padding: '0 2px', borderRadius: '2px' }}>{part}</mark> : <span key={i}>{part}</span>
                )}
            </span>
        );
    };

    const renderOptionsContent = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.5rem', width: '100%' }}>
            {/* Screen Config */}
            <div>
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    <Monitor size={16} /> Configuración de Pantalla
                </h4>
                <ScreenSettings />
            </div>

            {/* Import Section */}
            <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FolderUp size={16} /> Importación Masiva
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.4' }}>
                    Selecciona tu carpeta completa de "biblias" con archivos .bi o .zip para cargarlas todas juntas.
                </p>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}>
                    <input 
                        type="file" 
                        webkitdirectory="true" 
                        directory="true"
                        multiple
                        style={{ display: 'none' }} 
                        onChange={handleBulkImport} 
                        disabled={importing}
                    />
                    {importing ? 'Importando...' : 'Cargar Carpeta de Biblias'}
                </label>

                {localBibles.length > 0 && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Instaladas:</h5>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto' }}>
                            {localBibles.map(b => (
                                <div key={b.id} className="flex-row justify-between" style={{ background: 'rgba(255,255,255,0.02)', padding: '6px 8px', borderRadius: '4px' }}>
                                    <span style={{ fontSize: '0.75rem' }}>{b.shortName}</span>
                                    <button onClick={() => {
                                        if(confirm(`¿Eliminar ${b.name}?`)) {
                                            removeLocalBible(b.id);
                                        }
                                    }} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', padding: 0, cursor: 'pointer' }}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="panel" style={{ flexDirection: 'row', borderRight: 'none', height: '100%', background: 'var(--bg-primary)' }}>
            
            {/* LEFT COLUMN: Search & Results / Books (25%) */}
            <div style={{
                width: showLibrary ? '340px' : '0px',
                borderRight: showLibrary ? '1px solid var(--border-color)' : 'none',
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--bg-secondary)',
                transition: 'width 0.3s ease',
                overflow: 'hidden',
                flexShrink: 0
            }}>
                {/* Unified Header: Translations & Search */}
                <div style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-color)' }}>
                    {/* Translation Selector */}
                    <div style={{ padding: '1rem 1rem 0.5rem 1rem' }}>
                        <select
                            value={selectedTranslation}
                            onChange={(e) => setSelectedTranslation(e.target.value)}
                            style={{
                                width: '100%',
                                background: 'var(--bg-primary)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-color)',
                                padding: '0.6rem',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            {localBibles.length > 0 ? (
                                localBibles.map(b => (
                                    <option key={b.id} value={b.id}>{b.shortName} - {b.name}</option>
                                ))
                            ) : (
                                <option value="">Cargando biblias...</option>
                            )}
                        </select>
                    </div>

                    {/* Search Bar */}
                    <div style={{ padding: '0.5rem 1rem' }}>
                        <div className="flex-row" style={{ background: 'var(--bg-primary)', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '0.8rem' }}>
                            <Search size={16} color="var(--text-secondary)" />
                            <input
                                style={{ border: 'none', background: 'transparent', padding: 0, outline: 'none', width: '100%', marginLeft: '8px', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                                placeholder="Buscar en la Biblia..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                        
                        <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem', justifyContent: 'center' }}>
                            <label className="flex-row" style={{ gap: '4px', cursor: 'pointer' }}>
                                <input type="radio" checked={searchFilter === 'all'} onChange={() => setSearchFilter('all')} /> Toda
                            </label>
                            <label className="flex-row" style={{ gap: '4px', cursor: 'pointer' }}>
                                <input type="radio" checked={searchFilter === 'ot'} onChange={() => setSearchFilter('ot')} /> A.T.
                            </label>
                            <label className="flex-row" style={{ gap: '4px', cursor: 'pointer' }}>
                                <input type="radio" checked={searchFilter === 'nt'} onChange={() => setSearchFilter('nt')} /> N.T.
                            </label>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="segmented-control" style={{ margin: '0 1rem 1rem 1rem' }}>
                        <button className={sidebarTab === 'books' ? 'active' : ''} onClick={() => setSidebarTab('books')} style={{ fontSize: '0.75rem', padding: '0.5rem', fontWeight: sidebarTab === 'books' ? 600 : 400 }}>Libros</button>
                        <button className={sidebarTab === 'recent' ? 'active' : ''} onClick={() => setSidebarTab('recent')} style={{ fontSize: '0.75rem', padding: '0.5rem', fontWeight: sidebarTab === 'recent' ? 600 : 400 }}>Historial</button>
                        <button className={sidebarTab === 'pinned' ? 'active' : ''} onClick={() => setSidebarTab('pinned')} style={{ fontSize: '0.75rem', padding: '0.5rem', fontWeight: sidebarTab === 'pinned' ? 600 : 400 }}>Fijados</button>
                    </div>
                </div>

                {/* Content List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
                    {isSearching ? (
                        <div>
                            <div style={{ padding: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '0.5rem' }}>
                                Encontrado: {searchResults.length} veces (límite 100)
                            </div>
                            {searchResults.length === 0 ? (
                                <p style={{ fontSize: '0.8rem', textAlign: 'center', margin: '2rem 0', color: 'var(--text-secondary)' }}>
                                    No hay resultados para "{searchQuery}"
                                    {!localBibles.find(b => b.id === selectedTranslation) && <><br/>(En biblias web, solo busca en el capítulo actual)</>}
                                </p>
                            ) : (
                                searchResults.map(res => (
                                    <div 
                                        key={res.id || `${res.bookId}-${res.chapter}-${res.number}`}
                                        onClick={() => navigateToSearchResult(res)}
                                        style={{
                                            padding: '0.8rem',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                                            transition: 'background 0.2s',
                                            borderRadius: '6px'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <BookOpen size={12}/> {res.reference}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', lineHeight: '1.4', color: 'var(--text-primary)' }}>
                                            {highlightText(res.text, searchQuery)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : sidebarTab === 'books' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', alignContent: 'start' }}>
                            {books.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '1rem', gridColumn: 'span 2', textAlign: 'center' }}>Cargando libros...</p>}
                            {books.map(book => (
                                <button
                                    key={book.id}
                                    onClick={() => setSelectedBook(book)}
                                    style={{
                                        padding: '0.6rem 0.4rem',
                                        background: selectedBook?.id === book.id ? 'var(--accent)' : 'var(--bg-elevated)',
                                        color: selectedBook?.id === book.id ? '#000' : 'var(--text-primary)',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        borderRadius: '6px',
                                        fontSize: '0.75rem',
                                        fontWeight: selectedBook?.id === book.id ? 700 : 500,
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minHeight: '36px'
                                    }}
                                >
                                    {book.name}
                                </button>
                            ))}
                        </div>
                    ) : sidebarTab === 'recent' ? (
                        <div style={{ padding: '0.5rem' }}>
                            {recentVerses.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '1rem' }}>No hay historial.</p>}
                            {recentVerses.map(v => (
                                <div key={v.id} style={{ marginBottom: '1rem', cursor: 'pointer', display: 'flex', flexDirection: 'column' }} onClick={() => reProjectSaved(v)}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{v.reference}</div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); togglePinnedVerse(v); }}
                                            style={{ background: 'none', border: 'none', padding: '0 4px', color: pinnedVerses.find(p => p.id === v.id) ? 'var(--accent)' : 'var(--text-secondary)' }}
                                        >
                                            <Pin size={12} fill={pinnedVerses.find(p => p.id === v.id) ? 'currentColor' : 'none'} />
                                        </button>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.text}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ padding: '0.5rem' }}>
                            {pinnedVerses.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '1rem' }}>No has fijado ningún versículo.</p>}
                            {pinnedVerses.map(v => (
                                <div key={v.id} style={{ marginBottom: '1rem', cursor: 'pointer', display: 'flex', flexDirection: 'column' }} onClick={() => reProjectSaved(v)}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)' }}>{v.reference}</div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); togglePinnedVerse(v); }}
                                            style={{ background: 'none', border: 'none', padding: '0 4px', color: 'var(--accent)' }}
                                        >
                                            <Pin size={12} fill="currentColor" />
                                        </button>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{v.text}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* COLUMN 2: Minimalist Reading Pane */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-elevated)', position: 'relative' }}>

                {/* Quick Controls Header */}
                <div style={{ padding: '0.8rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>Panel de Lectura</div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            className="flex-row primary"
                            onClick={() => {
                                if (bibleLiveWindowRef.current && !bibleLiveWindowRef.current.closed) {
                                    bibleLiveWindowRef.current.focus();
                                } else {
                                    bibleLiveWindowRef.current = window.open('#/live/bible', 'PactoLiveBible', 'width=1280,height=720,menubar=no,toolbar=no');
                                }
                            }}
                            style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', borderRadius: '4px', fontWeight: 600 }}
                        >
                            <MonitorPlay size={16} style={{marginRight: '6px'}} /> Abrir Ventana Live
                        </button>
                        <button
                            className={`flex-row ${isBlackScreen ? 'danger active' : 'danger'}`}
                            onClick={toggleBlackScreen}
                            style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', borderRadius: '4px', fontWeight: 600 }}
                        >
                            <MonitorOff size={16} style={{marginRight: '6px'}} /> {isBlackScreen ? 'MOSTRAR LETRA' : 'PANTALLA NEGRA'}
                        </button>
                        <button
                            className={`flex-row ${isLive ? 'danger active' : 'primary'}`}
                            onClick={toggleLive}
                            style={{ padding: '0.6rem 1.5rem', fontSize: '0.85rem', borderRadius: '4px', fontWeight: 600 }}
                        >
                            {isLive ? <><Pause size={16} style={{marginRight: '6px'}} /> DETENER</> : <><Play size={16} style={{marginRight: '6px'}} /> EN VIVO</>}
                        </button>
                    </div>
                </div>

                <div id="read-pane" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                            Cargando capítulo...
                        </div>
                    ) : selectedBook ? (
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
                                            fontSize: '0.8rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {cap}
                                    </button>
                                ))}
                            </div>
                            <div className="panel-content" style={{ padding: '0.5rem 1rem', position: 'relative' }}>
                                <div className="flex-row justify-between mb-2">
                                    <h2 style={{ color: 'var(--accent)', fontSize: '1.2rem', margin: 0 }}>{selectedBook.name} {selectedChapter}</h2>
                                </div>

                                {loading && <div style={{ color: 'var(--text-secondary)' }}>Cargando versículos...</div>}

                                {!loading && verses.map((v) => {
                                    const text = getText(v.content);
                                    const isLiveNow = activeBibleVerse?.id === `${selectedBook.id}-${selectedChapter}-${v.number}` && isLive;
                                    const isPinned = pinnedVerses.find(p => p.id === `${selectedBook.id}-${selectedChapter}-${v.number}`);

                                    return (
                                        <div
                                            key={v.number}
                                            ref={el => verseRefs.current[`verse_${v.number}`] = el}
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'row',
                                                alignItems: 'flex-start',
                                                gap: '1rem',
                                                marginBottom: '0.2rem',
                                                padding: '0.4rem',
                                                borderRadius: 'var(--radius-sm)',
                                                background: isLiveNow ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255,255,255,0.01)',
                                                border: `1px solid ${isLiveNow ? 'rgba(239, 68, 68, 0.3)' : 'transparent'}`,
                                                position: 'relative'
                                            }}
                                            onMouseEnter={e => { if(!isLiveNow) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                                            onMouseLeave={e => { if(!isLiveNow) e.currentTarget.style.background = 'rgba(255,255,255,0.01)' }}
                                        >
                                            <div style={{ flex: '0 0 30px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                                {v.number}
                                            </div>
                                            <div style={{ flex: '1 1 auto', minWidth: '0', fontSize: '0.9rem', lineHeight: '1.3' }}>
                                                {text}
                                            </div>
                                            <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                
                                                {/* Pin Button On Hover */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        togglePinnedVerse({
                                                            id: `${selectedBook.id}-${selectedChapter}-${v.number}`,
                                                            text: text,
                                                            reference: `${selectedBook.name} ${selectedChapter}:${v.number}`,
                                                            bookId: selectedBook.id,
                                                            chapter: selectedChapter,
                                                            number: v.number,
                                                            rawVerse: v
                                                        });
                                                    }}
                                                    className="pin-btn"
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: isPinned ? 'var(--accent)' : 'var(--text-secondary)',
                                                        cursor: 'pointer',
                                                        padding: '4px',
                                                        opacity: isPinned ? 1 : 0.4,
                                                        transition: 'opacity 0.2s'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                                    onMouseLeave={e => e.currentTarget.style.opacity = isPinned ? 1 : 0.4}
                                                    title={isPinned ? "Desfijar versículo" : "Fijar versículo"}
                                                >
                                                    <Pin size={14} fill={isPinned ? 'currentColor' : 'none'} />
                                                </button>

                                                <button
                                                    className={isLiveNow ? 'danger active' : 'primary'}
                                                    onClick={() => handleProject(v)}
                                                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}
                                                >
                                                    {isLiveNow ? <Check size={12} style={{marginRight: '2px'}}/> : <Play size={12} style={{marginRight: '2px'}}/>}
                                                    {isLiveNow ? 'Proyectando' : 'Proyectar'}
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-secondary)', flexDirection: 'column', gap: '1rem', opacity: 0.5 }}>
                            <BookOpen size={64} />
                            <h2>Selecciona un libro y capítulo</h2>
                        </div>
                    )}
                </div>
            </div>

            {/* COLUMN 3: Docked Options (Always visible) */}
            <div style={{ 
                width: '320px', 
                borderLeft: '1px solid var(--border-color)', 
                background: 'var(--bg-secondary)', 
                display: 'flex', 
                flexDirection: 'column',
                flexShrink: 0
            }}>
                <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Settings size={18} color="var(--accent)" />
                    <span style={{ fontWeight: 600, fontSize: '1rem' }}>Opciones</span>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {renderOptionsContent()}
                </div>
            </div>

        </div>
    );
}
