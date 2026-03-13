import { useStore } from './useStore';

const channel = new BroadcastChannel('pacto-bendicion-sync');

export function initOperatorSync() {
    // Suscribirse a cambios del store y emitirlos al BroadcastChannel
    useStore.subscribe((state) => {
        channel.postMessage({
            type: 'SYNC_STATE',
            payload: {
                activeSongIndex: state.activeSongIndex,
                activeBlockIndex: state.activeBlockIndex,
                isLive: state.isLive,
                isBlackScreen: state.isBlackScreen,
                fontSize: state.fontSize,
                fontFamily: state.fontFamily,
                textColor: state.textColor,
                textAlign: state.textAlign,
                backgroundUrl: state.backgroundUrl,
                bgFit: state.bgFit,
                bgOpacity: state.bgOpacity,
                setList: state.setList,
                autoMode: state.autoMode,
                bibleAutoMode: state.bibleAutoMode,
                autoInterval: state.autoInterval,
                activeTab: state.activeTab,
                activeBibleVerse: state.activeBibleVerse
            }
        });

        // Auto-advance logic for operator
        // Or actually, operator should handle auto-advance interval!
    });
}

export function initLiveSync() {
    // Escuchar cambios desde el operador
    channel.onmessage = (event) => {
        if (event.data.type === 'SYNC_STATE') {
            useStore.setState(event.data.payload);
        }
    };

    // Ask for state immediately on load
    channel.postMessage({ type: 'REQUEST_STATE' });
}

export function listenForRequests() {
    channel.addEventListener('message', (event) => {
        if (event.data.type === 'REQUEST_STATE') {
            const state = useStore.getState();
            channel.postMessage({
                type: 'SYNC_STATE',
                payload: {
                    activeSongIndex: state.activeSongIndex,
                    activeBlockIndex: state.activeBlockIndex,
                    isLive: state.isLive,
                    isBlackScreen: state.isBlackScreen,
                    fontSize: state.fontSize,
                    fontFamily: state.fontFamily,
                    textColor: state.textColor,
                    textAlign: state.textAlign,
                    backgroundUrl: state.backgroundUrl,
                    bgFit: state.bgFit,
                    bgOpacity: state.bgOpacity,
                    setList: state.setList,
                    autoMode: state.autoMode,
                    bibleAutoMode: state.bibleAutoMode,
                    autoInterval: state.autoInterval,
                    activeTab: state.activeTab,
                    activeBibleVerse: state.activeBibleVerse
                }
            });
        }
    });
}
