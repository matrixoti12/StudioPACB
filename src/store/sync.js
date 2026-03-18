import { useStore } from './useStore';

const channel = new BroadcastChannel('pacto-bendicion-sync');

// ─── Helpers ──────────────────────────────────────────────────────────────────
let debounceTimer = null;
let lastSentSetListRef = null; // reference comparison to avoid re-sending unchanged setList
let lastSentBibleVerse = null;

/** Build the control-only payload (tiny, fast to serialize) */
const buildControlPayload = (state) => ({
    activeSongIndex: state.activeSongIndex,
    activeBlockIndex: state.activeBlockIndex,
    isLive:          state.isLive,
    isBlackScreen:   state.isBlackScreen,
    activeTab:       state.activeTab,
    autoMode:        state.autoMode,
    bibleAutoMode:   state.bibleAutoMode,
    autoInterval:    state.autoInterval,
    fontSize:        state.fontSize,
    fontFamily:      state.fontFamily,
    textColor:       state.textColor,
    textAlign:       state.textAlign,
    bgFit:           state.bgFit,
    bgOpacity:       state.bgOpacity,
    backgroundUrl:   state.backgroundUrl,
    textUppercase:   state.textUppercase,
    animationStyle:  state.animationStyle,
});

/** Send only the heavy data that actually changed */
const sendDelta = (state) => {
    const control = buildControlPayload(state);

    // Check if setList reference changed (new song added / removed / reordered)
    const setListChanged = state.setList !== lastSentSetListRef;
    if (setListChanged) {
        lastSentSetListRef = state.setList;
        // Send everything together when setList changes (rare)
        channel.postMessage({
            type: 'SYNC_STATE',
            payload: { ...control, setList: state.setList }
        });
        return;
    }

    // Check if bible verse changed
    const bibleChanged = state.activeBibleVerse !== lastSentBibleVerse;
    if (bibleChanged) {
        lastSentBibleVerse = state.activeBibleVerse;
        channel.postMessage({
            type: 'SYNC_STATE',
            payload: { ...control, activeBibleVerse: state.activeBibleVerse }
        });
        return;
    }

    // Only control data changed — send lightweight message immediately
    channel.postMessage({ type: 'SYNC_CONTROL', payload: control });
};

// ─── Operator (sender) ────────────────────────────────────────────────────────
export function initOperatorSync() {
    useStore.subscribe((state) => {
        // Debounce to max 1 message per ~16ms (≈60fps) to avoid flooding
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => sendDelta(state), 16);
    });
}

// ─── Live Window (receiver) ───────────────────────────────────────────────────
export function initLiveSync() {
    channel.onmessage = (event) => {
        if (event.data.type === 'SYNC_STATE' || event.data.type === 'SYNC_CONTROL') {
            // Merge payload into store without triggering a full replace
            useStore.setState(event.data.payload);
        }
    };
    // Ask for a full state dump on load
    channel.postMessage({ type: 'REQUEST_STATE' });
}

// ─── Request handler (operator side) ─────────────────────────────────────────
export function listenForRequests() {
    channel.addEventListener('message', (event) => {
        if (event.data.type === 'REQUEST_STATE') {
            const state = useStore.getState();
            lastSentSetListRef = state.setList;
            lastSentBibleVerse = state.activeBibleVerse;
            channel.postMessage({
                type: 'SYNC_STATE',
                payload: {
                    ...buildControlPayload(state),
                    setList:         state.setList,
                    activeBibleVerse: state.activeBibleVerse,
                }
            });
        }
    });
}
