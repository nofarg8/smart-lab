import { useState, useEffect, useCallback, useRef } from 'react';

export const useTts = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    
    // Refs to manage the speech queue and state without causing re-renders inside callbacks
    const sentenceQueueRef = useRef<string[]>([]);
    const currentSentenceIndexRef = useRef<number>(0);
    const isPausedByUserRef = useRef(false); // To distinguish user pause from end-of-sentence pause
    
    // Interval to keep the speech synthesis active on some browsers
    const keepAliveIntervalRef = useRef<number | null>(null);

    const getHebrewVoice = useCallback(() => {
        const voices = window.speechSynthesis.getVoices();
        // This is a common race condition. If voices are not loaded yet, we can try again.
        if (!voices.length) {
            return null;
        }
        const preferredVoices = [
            (v: SpeechSynthesisVoice) => v.lang === 'he-IL' && v.name.includes('Google'),
            (v: SpeechSynthesisVoice) => v.lang === 'he-IL' && v.name.includes('Microsoft'),
            (v: SpeechSynthesisVoice) => v.lang === 'he-IL',
        ];

        for (const condition of preferredVoices) {
            const voice = voices.find(condition);
            if (voice) return voice;
        }
        return null;
    }, []);

    const speakNextSentence = useCallback(() => {
        // If paused by user, don't proceed to the next sentence
        if (isPausedByUserRef.current) return;
        
        // Check if we've finished the queue
        if (currentSentenceIndexRef.current >= sentenceQueueRef.current.length) {
            setIsPlaying(false);
            setIsPaused(false);
            isPausedByUserRef.current = false;
            return;
        }

        const text = sentenceQueueRef.current[currentSentenceIndexRef.current];
        const utterance = new SpeechSynthesisUtterance(text);
        const voice = getHebrewVoice();

        // If no voice is ready, retry shortly
        if (!voice) {
            setTimeout(speakNextSentence, 250);
            return;
        }
        
        utterance.voice = voice;
        utterance.lang = 'he-IL';
        utterance.rate = 0.9;
        
        utterance.onend = () => {
            currentSentenceIndexRef.current++;
            // A short, natural pause between sentences
            setTimeout(speakNextSentence, 200); 
        };

        utterance.onerror = (event) => {
            // 'interrupted' is expected when we call cancel(). We don't need to log it as an error.
            if (event.error !== 'interrupted') {
                console.error('SpeechSynthesis Error:', event.error);
            }
            // Reset state fully on any error or interruption
            setIsPlaying(false);
            setIsPaused(false);
            isPausedByUserRef.current = false;
            sentenceQueueRef.current = [];
        };
        
        speechSynthesis.speak(utterance);
    }, [getHebrewVoice]);

    const play = useCallback((text: string) => {
        // Cancel any ongoing speech to start fresh.
        speechSynthesis.cancel();
        
        // Reset state
        setIsPlaying(true);
        setIsPaused(false);
        isPausedByUserRef.current = false;

        // Split text into speakable units. Handles various sentence endings and newlines.
        const sentences = text.match(/[^.!?\n]+([.!?\n]|\s)*|[\n]+/g) || [text];
        sentenceQueueRef.current = sentences.map(s => s.trim()).filter(Boolean);
        currentSentenceIndexRef.current = 0;
        
        speakNextSentence();
    }, [speakNextSentence]);

    const pause = useCallback(() => {
        isPausedByUserRef.current = true;
        speechSynthesis.pause();
        setIsPaused(true);
    }, []);

    const resume = useCallback(() => {
        isPausedByUserRef.current = false;
        speechSynthesis.resume();
        setIsPaused(false);
        // If speech was paused and then resumed, check if we need to manually trigger the next sentence.
        // This handles cases where the pause happened between sentences.
        if (!speechSynthesis.speaking) {
            speakNextSentence();
        }
    }, [speakNextSentence]);

    const cancel = useCallback(() => {
        sentenceQueueRef.current = [];
        currentSentenceIndexRef.current = 0;
        isPausedByUserRef.current = false;
        speechSynthesis.cancel(); // This will trigger the 'onerror' with 'interrupted'
        setIsPlaying(false);
        setIsPaused(false);
    }, []);

    // Effect for initializing and cleaning up
    useEffect(() => {
        const handleVoicesChanged = () => {
            // This event listener helps ensure voices are loaded, especially on mobile.
        };
        speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

        // Keep-alive for browsers that go silent
        keepAliveIntervalRef.current = window.setInterval(() => {
            if (speechSynthesis.speaking && !isPausedByUserRef.current) {
                speechSynthesis.resume();
            }
        }, 5000);

        return () => {
            // Cleanup on component unmount
            speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
            if (keepAliveIntervalRef.current) {
                clearInterval(keepAliveIntervalRef.current);
            }
            // Important: cancel any speech when the component using the hook unmounts.
            speechSynthesis.cancel();
        };
    }, []);

    return { play, pause, resume, cancel, isPlaying, isPaused };
};
