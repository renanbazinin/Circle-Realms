// ============================================
// Sound Manager - Audio System
// ============================================

// Sound configuration
interface SoundConfig {
    volume: number;
    musicVolume: number;
    sfxVolume: number;
    muted: boolean;
}

// Default config
let soundConfig: SoundConfig = {
    volume: 0.8,
    musicVolume: 0.5,
    sfxVolume: 1.0,
    muted: false,
};

// Audio context for web audio
let audioContext: AudioContext | null = null;

// Initialize audio context (must be called after user interaction)
export const initAudio = (): void => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Resume if suspended (browser policy)
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
};

// Update sound settings
export const updateSoundSettings = (config: Partial<SoundConfig>): void => {
    soundConfig = { ...soundConfig, ...config };
};

// Get current settings
export const getSoundSettings = (): SoundConfig => {
    return { ...soundConfig };
};

// Sound effect types
export type SFXType = 'shoot' | 'hit' | 'pickup' | 'levelup' | 'damage' | 'death' | 'jump' | 'coin' | 'zonechange';

// Play a simple synthesized sound effect
export const playSFX = (type: SFXType): void => {
    if (soundConfig.muted || soundConfig.sfxVolume === 0) return;

    initAudio();
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    const volume = soundConfig.volume * soundConfig.sfxVolume * 0.3;
    const now = audioContext.currentTime;

    switch (type) {
        case 'shoot':
            oscillator.frequency.setValueAtTime(800, now);
            oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.1);
            gainNode.gain.setValueAtTime(volume, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            oscillator.start(now);
            oscillator.stop(now + 0.1);
            break;

        case 'hit':
            oscillator.frequency.setValueAtTime(300, now);
            oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.15);
            gainNode.gain.setValueAtTime(volume, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            oscillator.start(now);
            oscillator.stop(now + 0.15);
            break;

        case 'pickup':
            oscillator.frequency.setValueAtTime(400, now);
            oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.1);
            oscillator.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
            gainNode.gain.setValueAtTime(volume * 0.7, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            oscillator.start(now);
            oscillator.stop(now + 0.2);
            break;

        case 'coin':
            // Bright, high-pitched coin sound
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(1200, now);
            oscillator.frequency.exponentialRampToValueAtTime(1800, now + 0.05);
            oscillator.frequency.exponentialRampToValueAtTime(1400, now + 0.1);
            gainNode.gain.setValueAtTime(volume * 0.6, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            oscillator.start(now);
            oscillator.stop(now + 0.15);
            break;

        case 'levelup':
            oscillator.frequency.setValueAtTime(400, now);
            oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.1);
            oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.2);
            oscillator.frequency.exponentialRampToValueAtTime(1000, now + 0.3);
            oscillator.frequency.exponentialRampToValueAtTime(1200, now + 0.4);
            gainNode.gain.setValueAtTime(volume * 0.8, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            oscillator.start(now);
            oscillator.stop(now + 0.5);
            break;

        case 'zonechange':
            // Whoosh/transition sound
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(200, now);
            oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.2);
            oscillator.frequency.exponentialRampToValueAtTime(300, now + 0.4);
            gainNode.gain.setValueAtTime(volume * 0.4, now);
            gainNode.gain.exponentialRampToValueAtTime(volume * 0.6, now + 0.2);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            oscillator.start(now);
            oscillator.stop(now + 0.4);
            break;

        case 'damage':
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(200, now);
            oscillator.frequency.exponentialRampToValueAtTime(80, now + 0.2);
            gainNode.gain.setValueAtTime(volume, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            oscillator.start(now);
            oscillator.stop(now + 0.2);
            break;

        case 'death':
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(400, now);
            oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.5);
            gainNode.gain.setValueAtTime(volume, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            oscillator.start(now);
            oscillator.stop(now + 0.5);
            break;

        case 'jump':
            oscillator.frequency.setValueAtTime(200, now);
            oscillator.frequency.exponentialRampToValueAtTime(500, now + 0.15);
            gainNode.gain.setValueAtTime(volume * 0.5, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            oscillator.start(now);
            oscillator.stop(now + 0.15);
            break;
    }
};

// Background music class
class BackgroundMusic {
    private oscillators: OscillatorNode[] = [];
    private gainNode: GainNode | null = null;
    private isPlaying = false;
    private intervalId: number | null = null;

    start(): void {
        if (this.isPlaying || soundConfig.muted || soundConfig.musicVolume === 0) return;

        initAudio();
        if (!audioContext) return;

        this.isPlaying = true;
        this.gainNode = audioContext.createGain();
        this.gainNode.connect(audioContext.destination);
        this.gainNode.gain.value = soundConfig.volume * soundConfig.musicVolume * 0.15;

        // Simple ambient drone
        const playNote = () => {
            if (!audioContext || !this.gainNode || !this.isPlaying) return;

            const osc = audioContext.createOscillator();
            const noteGain = audioContext.createGain();

            osc.connect(noteGain);
            noteGain.connect(this.gainNode);

            // Random pentatonic note
            const notes = [130.81, 146.83, 164.81, 196.00, 220.00, 261.63]; // C3 pentatonic
            const freq = notes[Math.floor(Math.random() * notes.length)];

            osc.frequency.value = freq;
            osc.type = 'sine';

            const now = audioContext.currentTime;
            noteGain.gain.setValueAtTime(0, now);
            noteGain.gain.linearRampToValueAtTime(0.3, now + 0.5);
            noteGain.gain.linearRampToValueAtTime(0, now + 2);

            osc.start(now);
            osc.stop(now + 2);
        };

        // Play ambient notes periodically
        playNote();
        this.intervalId = window.setInterval(playNote, 3000);
    }

    stop(): void {
        this.isPlaying = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.oscillators.forEach(osc => {
            try { osc.stop(); } catch { }
        });
        this.oscillators = [];
    }

    updateVolume(): void {
        if (this.gainNode) {
            this.gainNode.gain.value = soundConfig.volume * soundConfig.musicVolume * 0.15;
        }
    }

    getIsPlaying(): boolean {
        return this.isPlaying;
    }
}

export const backgroundMusic = new BackgroundMusic();
