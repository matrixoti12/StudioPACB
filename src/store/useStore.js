import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { openDB } from 'idb';

const dbPromise = openDB('pacto-bendicion-db', 1, {
    upgrade(db) {
        db.createObjectStore('store');
    }
});

const idbStorage = {
    getItem: async (name) => {
        const db = await dbPromise;
        return (await db.get('store', name)) || null;
    },
    setItem: async (name, value) => {
        const db = await dbPromise;
        await db.put('store', value, name);
    },
    removeItem: async (name) => {
        const db = await dbPromise;
        await db.delete('store', name);
    }
};

export const useStore = create(
    persist(
        (set, get) => ({
            // Library
            songs: [],
            addSong: (song) => set((state) => ({ songs: [...state.songs, song] })),
            removeSong: (id) => set((state) => ({ songs: state.songs.filter(s => s.id !== id) })),

            // Local Bibles
            localBibles: [],
            addLocalBible: (bible) => set((state) => ({ localBibles: [...state.localBibles, bible] })),
            removeLocalBible: (id) => set((state) => ({ localBibles: state.localBibles.filter(b => b.id !== id) })),

            // Set List
            setList: [],
            addToSet: (song) => set((state) => {
                let flattenedBlocks = [];
                if (song.secciones) {
                    song.secciones.forEach(sec => {
                        sec.slides.forEach(slide => {
                            flattenedBlocks.push({
                                text: slide.lineas.join('\n'),
                                sectionName: sec.nombre // Guardamos el nombre "Coro", "Verso"
                            });
                        });
                    });
                } else if (song.blocks) {
                    // Legacy support: Convertir strings a objetos estructurados
                    flattenedBlocks = song.blocks.map(b => ({ text: b, sectionName: '' }));
                }

                return {
                    setList: [...state.setList, { ...song, blocks: flattenedBlocks, setId: Date.now().toString() }]
                };
            }),
            removeFromSet: (setId) => set((state) => ({ setList: state.setList.filter(s => s.setId !== setId) })),
            reorderSet: (newSetList) => set({ setList: newSetList }),
            clearSet: () => set({ setList: [] }),

            // Live State
            activeTab: 'songs', // 'songs' | 'bible'
            activeSongIndex: 0,
            activeBlockIndex: 0,
            activeBibleVerse: null, // Holds the currently selected/live bible verse
            recentVerses: [], // Array of recently live verses
            pinnedVerses: [], // Array of pinned verses
            isLive: false,
            isBlackScreen: false,
            autoMode: false,
            bibleAutoMode: false,
            smartAuto: true,
            autoInterval: 5,
            globalSpeedFactor: 1.0,
            currentSlideDuration: 0,
            fontSize: 5, // in vw
            fontFamily: 'Inter',
            textColor: '#ffffff',
            textAlign: 'center',
            backgroundUrl: '', // url or color
            bgFit: 'cover',
            bgOpacity: 50, // 0 to 100 (for dark overlay)
            textUppercase: false, // For all caps text
            animationStyle: 'fade', // fade | slideUp | slideLeft | zoom | blur | none

            // Actions for Live State
            setActiveTab: (tab) => set({ activeTab: tab }),
            setActiveSong: (index) => set({ activeSongIndex: index, activeBlockIndex: 0 }),
            setActiveBlock: (index) => set({ activeBlockIndex: index }),
            setActiveBibleVerse: (verse) => set((state) => {
                const isNew = !state.recentVerses.find(v => v.id === verse.id);
                const newRecent = isNew ? [verse, ...state.recentVerses].slice(0, 20) : state.recentVerses;
                return { activeBibleVerse: verse, recentVerses: newRecent };
            }),
            togglePinnedVerse: (verse) => set((state) => {
                const exists = state.pinnedVerses.find(v => v.id === verse.id);
                if (exists) {
                    return { pinnedVerses: state.pinnedVerses.filter(v => v.id !== verse.id) };
                } else {
                    return { pinnedVerses: [...state.pinnedVerses, verse] };
                }
            }),
            setLiveState: (live) => set({ isLive: live }),
            toggleLive: () => set((state) => ({ isLive: !state.isLive })),
            toggleBlackScreen: () => set((state) => ({ isBlackScreen: !state.isBlackScreen })),
            setAutoMode: (auto) => set({ autoMode: auto }),
            toggleAutoMode: () => set((state) => ({ autoMode: !state.autoMode })),
            setBibleAutoMode: (auto) => set({ bibleAutoMode: auto }),
            toggleBibleAutoMode: () => set((state) => ({ bibleAutoMode: !state.bibleAutoMode })),
            toggleSmartAuto: () => set((state) => ({ smartAuto: !state.smartAuto })),
            setAutoInterval: (sec) => set({ autoInterval: sec }),
            setGlobalSpeedFactor: (factor) => set({ globalSpeedFactor: factor }),
            setCurrentSlideDuration: (duration) => set({ currentSlideDuration: duration }),
            setFontSize: (size) => set({ fontSize: size }),
            setFontFamily: (family) => set({ fontFamily: family }),
            setTextColor: (color) => set({ textColor: color }),
            setTextAlign: (align) => set({ textAlign: align }),
            setBackgroundUrl: (url) => set({ backgroundUrl: url }),
            setBgFit: (fit) => set({ bgFit: fit }),
            setBgOpacity: (opacity) => set({ bgOpacity: opacity }),
            setTextUppercase: (uppercase) => set({ textUppercase: uppercase }),
            toggleTextUppercase: () => set((state) => ({ textUppercase: !state.textUppercase })),
            setAnimationStyle: (style) => set({ animationStyle: style }),

            nextBlock: () => {
                const { setList, activeSongIndex, activeBlockIndex } = get();
                if (setList.length === 0) return;
                const currentSong = setList[activeSongIndex];

                if (activeBlockIndex < currentSong.blocks.length - 1) {
                    set({ activeBlockIndex: activeBlockIndex + 1 });
                } else if (activeSongIndex < setList.length - 1) {
                    // Go to next song
                    set({ activeSongIndex: activeSongIndex + 1, activeBlockIndex: 0 });
                }
            },

            prevBlock: () => {
                const { setList, activeSongIndex, activeBlockIndex } = get();
                if (setList.length === 0) return;

                if (activeBlockIndex > 0) {
                    set({ activeBlockIndex: activeBlockIndex - 1 });
                } else if (activeSongIndex > 0) {
                    // Go to end of previous song
                    const prevSong = setList[activeSongIndex - 1];
                    set({ activeSongIndex: activeSongIndex - 1, activeBlockIndex: prevSong.blocks.length - 1 });
                }
            }
        }),
        {
            name: 'pacto-bendicion-store',
            storage: createJSONStorage(() => idbStorage),
            partialize: (state) => ({
                // We persist library and setList, but not live playback state
                songs: state.songs,
                localBibles: state.localBibles,
                setList: state.setList,
                pinnedVerses: state.pinnedVerses,
                smartAuto: state.smartAuto,
                autoInterval: state.autoInterval,
                globalSpeedFactor: state.globalSpeedFactor,
                fontSize: state.fontSize,
                fontFamily: state.fontFamily,
                textColor: state.textColor,
                textAlign: state.textAlign,
                backgroundUrl: state.backgroundUrl,
                bgFit: state.bgFit,
                bgOpacity: state.bgOpacity,
                textUppercase: state.textUppercase,
                animationStyle: state.animationStyle
            }),
        }
    )
);
