'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Verse {
  reference: string;
  text: string;
  translation: string;
}

interface Feedback {
  accuracy: number;
  mistakes: Array<{
    type: 'missing' | 'wrong' | 'added';
    word: string;
    position: number;
  }>;
  encouragement: string;
  suggestions: string;
}

function PracticePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bibleId = searchParams.get('bibleId');
  const verseId = searchParams.get('verseId');
  const book = searchParams.get('book');
  const chapter = searchParams.get('chapter');
  const verse = searchParams.get('verse');

  const [verseData, setVerseData] = useState<Verse | null>(null);
  const [mode, setMode] = useState<'study' | 'practice' | 'feedback'>('study');
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [realTimeFeedback, setRealTimeFeedback] = useState<{
    words: Array<{ text: string; status: 'correct' | 'incorrect' | 'pending' | 'missing' }>;
    currentAccuracy: number;
  } | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeSinceLastWord, setTimeSinceLastWord] = useState<number>(0);
  const [showResetFlash, setShowResetFlash] = useState(false); // Visual indicator for reset
  const [mounted, setMounted] = useState(false); // For hydration fix
  const [speechRecognitionAvailable, setSpeechRecognitionAvailable] = useState(true); // Assume available initially
  const [verseCompleted, setVerseCompleted] = useState(false); // Track if verse has been completed

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const lastWordTimeRef = useRef<number>(0);
  const pauseCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const resetTriggeredRef = useRef<boolean>(false); // Prevent multiple resets
  const isRecordingRef = useRef<boolean>(false); // Ref to track recording state for closures
  const transcriptionRef = useRef<string>(''); // Ref to track transcription for pause detection
  const accumulatedTranscriptRef = useRef<string>(''); // Accumulated transcript across recognition restarts
  const audioContextRef = useRef<AudioContext | null>(null); // Persistent audio context
  const completionPlayedRef = useRef<boolean>(false); // Prevent multiple completion sounds
  const [pauseThreshold, setPauseThreshold] = useState<number>(3000); // Default 3 seconds

  // Initialize audio context on first user interaction (required by browsers)
  const initAudioContext = () => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
    }
    // Resume if suspended
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  // Play beep sound using Web Audio API
  const playBeep = async (): Promise<void> => {
    // Always show visual flash as backup
    setShowResetFlash(true);
    setTimeout(() => setShowResetFlash(false), 500);
    
    try {
      // Ensure audio context is initialized
      if (!audioContextRef.current) {
        initAudioContext();
      }
      
      const audioContext = audioContextRef.current;
      if (!audioContext) {
        console.warn('No audio context available');
        return;
      }
      
      // Resume if suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 880; // Higher pitch for better audibility
      oscillator.type = 'square'; // Square wave is more noticeable

      // Make beep louder and longer so it's clearly audible
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
      
      console.log('🔔 Beep played - pause threshold exceeded');
    } catch (error) {
      console.warn('Could not play beep:', error);
    }
  };

  // Play completion sound (different tone to indicate success)
  const playCompletionSound = async (): Promise<void> => {
    try {
      if (!audioContextRef.current) {
        initAudioContext();
      }
      
      const audioContext = audioContextRef.current;
      if (!audioContext) return;
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Play a pleasant ascending three-tone "ding-ding-ding" for completion
      const playTone = (freq: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = freq;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      // Play ascending tones for success (C5, E5, G5)
      const now = audioContext.currentTime;
      playTone(523, now, 0.15);        // C5
      playTone(659, now + 0.15, 0.15); // E5
      playTone(784, now + 0.30, 0.3);  // G5
      
      console.log('🎉 Completion sound played!');
    } catch (error) {
      console.warn('Could not play completion sound:', error);
    }
  };

  // Real-time feedback generator with tolerance for pauses
  const generateRealTimeFeedback = (verseText: string, userText: string) => {
    const verseWords = verseText.toLowerCase()
      .replace(/[.,!?;:—–]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 0);
    
    const userWords = userText.toLowerCase()
      .replace(/[.,!?;:—–]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 0);

    const words: Array<{ text: string; status: 'correct' | 'incorrect' | 'pending' | 'missing' }> = [];
    let correctCount = 0;
    let userIndex = 0;
    const lookAheadWindow = 3; // Allow up to 3 words lookahead for pauses

    // Sequential matching with tolerance for pauses
    for (let i = 0; i < verseWords.length; i++) {
      const verseWord = verseWords[i];
      let matched = false;
      let matchedAt = -1;

      // Try to find match within lookahead window (allows for pauses)
      const searchEnd = Math.min(userIndex + lookAheadWindow, userWords.length);
      for (let j = userIndex; j < searchEnd; j++) {
        if (verseWord === userWords[j]) {
          matched = true;
          matchedAt = j;
          break;
        }
      }

      if (matched && matchedAt >= 0) {
        // Mark any words between current position and match as incorrect (if they don't match future verse words)
        for (let k = userIndex; k < matchedAt; k++) {
          // Check if this word matches any upcoming verse word
          let matchesFutureWord = false;
          for (let v = i + 1; v < Math.min(i + 4, verseWords.length); v++) {
            if (userWords[k] === verseWords[v]) {
              matchesFutureWord = true;
              break;
            }
          }
          if (!matchesFutureWord) {
            words.push({ text: userWords[k], status: 'incorrect' });
          }
        }
        
        words.push({ text: verseWord, status: 'correct' });
        correctCount++;
        userIndex = matchedAt + 1;
      } else {
        // Word not found in lookahead window
        if (userIndex < userWords.length) {
          // We have words but they don't match - check if current user word matches future verse words
          let matchesFutureVerseWord = false;
          for (let v = i + 1; v < Math.min(i + 4, verseWords.length); v++) {
            if (userWords[userIndex] === verseWords[v]) {
              matchesFutureVerseWord = true;
              break;
            }
          }
          
          if (matchesFutureVerseWord) {
            // User word matches a future verse word - mark current verse word as missing
            words.push({ text: verseWord, status: 'missing' });
            // Don't advance userIndex - let it match the future word
          } else {
            // User word doesn't match anything - mark verse word as missing and user word as incorrect
            words.push({ text: verseWord, status: 'missing' });
            words.push({ text: userWords[userIndex], status: 'incorrect' });
            userIndex++;
          }
        } else {
          // No more user words - determine if missing or pending based on progress
          // Be more lenient: only mark as missing if we're significantly past where we should be
          const expectedProgress = (i / verseWords.length) * userWords.length;
          if (userWords.length > 0 && userWords.length < expectedProgress - 1) {
            words.push({ text: verseWord, status: 'pending' });
          } else {
            words.push({ text: verseWord, status: 'missing' });
          }
        }
      }
    }

    // Add any remaining user words as incorrect
    while (userIndex < userWords.length) {
      words.push({ text: userWords[userIndex], status: 'incorrect' });
      userIndex++;
    }

    // Calculate accuracy based on correct matches vs total verse words
    const accuracy = verseWords.length > 0
      ? Math.round((correctCount / verseWords.length) * 100)
      : 0;

    return {
      words: words.slice(0, Math.max(verseWords.length * 2, userWords.length) + 2),
      currentAccuracy: accuracy,
    };
  };

  useEffect(() => {
    if (!bibleId || !verseId) {
      setError('Missing Bible ID or Verse ID');
      return;
    }

    // Build query string with all parameters for fallback support
    const params = new URLSearchParams({
      bibleId: bibleId,
      verseId: verseId,
    });
    if (book) params.append('book', book);
    if (chapter) params.append('chapter', chapter);
    if (verse) params.append('verse', verse);

    // Load verse
    fetch(`/api/verse?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.verse) {
          setVerseData(data.verse);
          if (data.warning) {
            console.warn(data.warning);
          }
        } else {
          setError(data.message || data.error || 'Verse not found');
        }
      })
      .catch((err) => {
        console.error('Error loading verse:', err);
        setError('Failed to load verse');
      });
  }, [bibleId, verseId, book, chapter, verse]);

  // Mark component as mounted (for hydration fix)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load pause threshold from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('pauseThreshold');
      if (stored) {
        setPauseThreshold(parseInt(stored, 10));
      }
    }
  }, []);

  // Save pause threshold to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pauseThreshold', pauseThreshold.toString());
    }
  }, [pauseThreshold]);

  useEffect(() => {
    // Only initialize on client side
    if (typeof window === 'undefined') return;
    
    // Detect iOS devices (iPhone, iPad, iPod)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition =
        (window as any).webkitSpeechRecognition ||
        (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      // iOS doesn't support continuous mode properly - it stops immediately
      // On iOS, we use non-continuous mode and restart after each result
      recognition.continuous = !isIOS;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      // Keep recognition running even during silence
      (recognition as any).maxAlternatives = 1;
      
      if (isIOS) {
        console.log('📱 iOS detected - using non-continuous speech recognition mode');
      }

      recognition.onresult = (event: any) => {
        let interimText = '';
        let newFinalText = '';
        let hasNewFinalWords = false;

        // Process only new results
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            newFinalText += transcript + ' ';
            hasNewFinalWords = true;
          } else {
            interimText += transcript;
          }
        }

        // Process final results - check if they contain actual words (not just noise)
        if (hasNewFinalWords) {
          const trimmedNew = newFinalText.trim();
          
          // Only consider it "real words" if it contains actual letters/numbers
          // This filters out background noise that generates empty or punctuation-only results
          const hasRealWords = /[a-zA-Z0-9]/.test(trimmedNew) && trimmedNew.length > 1;
          
          if (hasRealWords) {
            // ONLY update last word time for REAL words (not noise)
            lastWordTimeRef.current = Date.now();
            setTimeSinceLastWord(0);
            resetTriggeredRef.current = false; // Reset flag when new words come in
            
            const currentAccumulated = accumulatedTranscriptRef.current;
            
            // Check if this text is a duplicate (sometimes recognition re-sends on restart)
            const isDuplicate = currentAccumulated.length > 0 && 
              (currentAccumulated.endsWith(trimmedNew) || 
               trimmedNew.startsWith(currentAccumulated.slice(-50)));
            
            if (!isDuplicate) {
              // ACCUMULATE transcription (don't reset on recognition restart)
              accumulatedTranscriptRef.current = (currentAccumulated + ' ' + trimmedNew).trim();
              console.log('📝 New final words:', trimmedNew, '| Total:', accumulatedTranscriptRef.current);
            } else {
              console.log('⚠️ Skipped duplicate:', trimmedNew);
            }
          } else {
            // Log noise/empty results for debugging
            console.log('🔇 Ignored noise/empty result:', JSON.stringify(trimmedNew));
          }
        }

        // Update state with accumulated transcript
        const totalTranscript = accumulatedTranscriptRef.current;
        setTranscription(totalTranscript);
        transcriptionRef.current = totalTranscript; // Keep ref in sync for pause detection
        setInterimTranscript(interimText);

        // Real-time feedback - combine accumulated + interim for live display
        const fullText = totalTranscript + ' ' + interimText;
        if (verseData && fullText.trim()) {
          const feedback = generateRealTimeFeedback(verseData.text, fullText.trim());
          setRealTimeFeedback(feedback);
          
          // Check for completion - detect when user has reached the END of the verse
          // This is independent of accuracy - just checks if last words were spoken
          if (!completionPlayedRef.current) {
            const verseWords = verseData.text.toLowerCase()
              .replace(/[.,!?;:—–"'"']/g, ' ')
              .split(/\s+/)
              .filter(w => w.length > 0);
            
            const spokenWords = fullText.toLowerCase()
              .replace(/[.,!?;:—–"'"']/g, ' ')
              .split(/\s+/)
              .filter(w => w.length > 0);
            
            // Get the last 2-3 words of the verse (handles variations)
            const lastVerseWords = verseWords.slice(-3);
            const lastSpokenWords = spokenWords.slice(-5); // Look at last 5 spoken words
            
            // Check if the last word of the verse appears in recent speech
            const lastVerseWord = verseWords[verseWords.length - 1];
            const secondLastVerseWord = verseWords.length > 1 ? verseWords[verseWords.length - 2] : '';
            
            // Completion triggers if:
            // 1. Last word of verse is in the last few spoken words, OR
            // 2. Last 2 words of verse appear together in speech
            const lastWordSpoken = lastSpokenWords.includes(lastVerseWord);
            const lastTwoWordsMatch = lastSpokenWords.some((word, i) => 
              word === secondLastVerseWord && lastSpokenWords[i + 1] === lastVerseWord
            );
            
            if (lastWordSpoken || lastTwoWordsMatch) {
              completionPlayedRef.current = true;
              setVerseCompleted(true);
              playCompletionSound();
              console.log(`🎉 Verse completed! Last word "${lastVerseWord}" detected. Accuracy: ${feedback.currentAccuracy}%`);
            }
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error, 'isIOS:', isIOS);
        
        // Handle specific error types
        if (event.error === 'aborted') {
          // Aborted is usually temporary - try to restart if still recording
          // iOS triggers abort more frequently, so handle it gracefully
          console.log('🔄 Recognition aborted, attempting restart...');
          if (isRecordingRef.current && recognitionRef.current) {
            const restartDelay = isIOS ? 200 : 100;
            setTimeout(() => {
              try {
                recognitionRef.current?.start();
                setError(null); // Clear error on successful restart
                console.log('🎤 Restarted after abort');
              } catch (e) {
                console.log('Could not restart after abort:', e);
                // On iOS, don't give up immediately - try again
                if (isIOS && isRecordingRef.current) {
                  setTimeout(() => {
                    try {
                      recognitionRef.current?.start();
                      setError(null);
                      console.log('🎤 iOS: Retry after abort succeeded');
                    } catch (e2) {
                      setIsRecording(false);
                      isRecordingRef.current = false;
                      setError('Microphone access interrupted. Please try again.');
                    }
                  }, 500);
                } else {
                  setIsRecording(false);
                  isRecordingRef.current = false;
                  setError('Microphone access interrupted. Please try again.');
                }
              }
            }, restartDelay);
          }
        } else if (event.error === 'not-allowed') {
          setIsRecording(false);
          isRecordingRef.current = false;
          setError('Microphone access denied. Please allow microphone access in your browser settings.');
        } else if (event.error === 'no-speech') {
          // No speech detected - this is normal, just continue
          // On iOS, this might trigger more often - restart if still recording
          console.log('No speech detected, continuing...');
          if (isIOS && isRecordingRef.current && recognitionRef.current) {
            setTimeout(() => {
              try {
                recognitionRef.current?.start();
                console.log('🎤 iOS: Restarted after no-speech');
              } catch (e) {
                // Ignore - might already be running
              }
            }, 100);
          }
        } else {
          // Other errors - stop recording
          setIsRecording(false);
          isRecordingRef.current = false;
          setError('Speech recognition error: ' + event.error);
        }
      };

      recognition.onend = () => {
        // Use ref to check current recording state (not stale closure value)
        // This prevents issues where isRecording state was captured at effect setup time
        console.log('🎤 Speech recognition ended, isRecordingRef:', isRecordingRef.current, 'isIOS:', isIOS);
        
        if (isRecordingRef.current && recognitionRef.current) {
          // User is still recording - restart speech recognition
          // Browser stops recognition after silence, we need to restart it
          // iOS needs a slightly longer delay to prevent rapid start/stop cycles
          const restartDelay = isIOS ? 100 : 50;
          
          setTimeout(() => {
            if (isRecordingRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
                console.log('🎤 Speech recognition restarted automatically');
              } catch (error: any) {
                // If already started, that's fine
                if (error.name !== 'InvalidStateError') {
                  console.log('Recognition restart error:', error);
                  // On iOS, try again with a longer delay if there's an error
                  if (isIOS && isRecordingRef.current) {
                    setTimeout(() => {
                      try {
                        recognitionRef.current?.start();
                        console.log('🎤 iOS: Retry restart succeeded');
                      } catch (e) {
                        console.log('🎤 iOS: Retry restart failed:', e);
                      }
                    }, 300);
                  }
                }
              }
            }
          }, restartDelay);
        } else {
          // User explicitly stopped - clean up
          console.log('🛑 User stopped recording, cleaning up');
          setIsRecording(false);
          setInterimTranscript('');
          if (pauseCheckIntervalRef.current) {
            clearInterval(pauseCheckIntervalRef.current);
            pauseCheckIntervalRef.current = null;
          }
        }
      };
      
      // Assign to ref after all setup is complete
      recognitionRef.current = recognition;
    } else {
      setSpeechRecognitionAvailable(false);
      setError('Speech recognition not supported in this browser');
    }

    // Cleanup function - stops recognition when component unmounts or verse changes
    return () => {
      console.log('🧹 Cleaning up speech recognition...');
      // Stop recording if active
      if (recognitionRef.current) {
        isRecordingRef.current = false; // Set ref first to prevent restart
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors when stopping
        }
      }
      // Clear intervals
      if (pauseCheckIntervalRef.current) {
        clearInterval(pauseCheckIntervalRef.current);
        pauseCheckIntervalRef.current = null;
      }
    };
  }, [verseData, generateRealTimeFeedback]);

  // Monitor for long pauses when recording
  useEffect(() => {
    if (!isRecording) {
      if (pauseCheckIntervalRef.current) {
        clearInterval(pauseCheckIntervalRef.current);
        pauseCheckIntervalRef.current = null;
      }
      return;
    }

    // Initialize last word time when recording starts
    lastWordTimeRef.current = Date.now();
    console.log('⏱️ Starting pause detection with threshold:', pauseThreshold, 'ms');

    // Check for pauses every 500ms (less frequent to reduce noise)
    pauseCheckIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - lastWordTimeRef.current;
      setTimeSinceLastWord(elapsed);
      
      // Use transcriptionRef to get current value (not stale closure)
      const currentTranscription = transcriptionRef.current;
      
      // Log status every 2 seconds for debugging
      if (elapsed % 2000 < 500) {
        console.log(`⏱️ Pause timer: ${(elapsed/1000).toFixed(1)}s / ${(pauseThreshold/1000).toFixed(1)}s | transcription: ${currentTranscription.length} chars | resetTriggered: ${resetTriggeredRef.current}`);
      }
      
      // Only trigger reset if:
      // 1. Pause threshold is exceeded
      // 2. We have some transcription (don't reset on initial silence)
      // 3. We haven't already reset recently (prevent multiple resets)
      if (elapsed >= pauseThreshold && currentTranscription.length > 0 && !resetTriggeredRef.current) {
        console.log(`🚨 PAUSE THRESHOLD EXCEEDED: ${elapsed}ms >= ${pauseThreshold}ms (transcription: "${currentTranscription.slice(0, 50)}...")`);
        
        // Mark that we've triggered a reset to prevent multiple triggers
        resetTriggeredRef.current = true;
        
        // Play beep FIRST and wait for it, then reset matching
        playBeep().then(() => {
          // Reset matching after beep plays
          console.log('🔄 Resetting matching after beep');
          setTranscription('');
          transcriptionRef.current = '';
          accumulatedTranscriptRef.current = ''; // Reset accumulated transcript
          setInterimTranscript('');
          setRealTimeFeedback(null);
          completionPlayedRef.current = false; // Allow completion detection again
          setVerseCompleted(false); // Reset completion state
          lastWordTimeRef.current = Date.now(); // Reset timer
          setTimeSinceLastWord(0);
          // Keep resetTriggeredRef true for a bit to prevent immediate re-trigger
          setTimeout(() => {
            resetTriggeredRef.current = false; // Allow future resets
            console.log('✅ Ready for next pause detection');
          }, 1000);
        }).catch((error) => {
          console.warn('Beep failed, resetting anyway:', error);
          // Reset even if beep fails
          setTranscription('');
          transcriptionRef.current = '';
          accumulatedTranscriptRef.current = ''; // Reset accumulated transcript
          setInterimTranscript('');
          setRealTimeFeedback(null);
          completionPlayedRef.current = false; // Allow completion detection again
          setVerseCompleted(false); // Reset completion state
          lastWordTimeRef.current = Date.now();
          setTimeSinceLastWord(0);
          setTimeout(() => {
            resetTriggeredRef.current = false;
          }, 1000);
        });
      } else if (elapsed < pauseThreshold * 0.5) {
        // Reset the flag if we're well under threshold again (user started speaking)
        if (resetTriggeredRef.current) {
          resetTriggeredRef.current = false;
        }
      }
    }, 200);

    return () => {
      if (pauseCheckIntervalRef.current) {
        clearInterval(pauseCheckIntervalRef.current);
        pauseCheckIntervalRef.current = null;
      }
    };
  }, [isRecording, pauseThreshold]); // Removed transcription from deps - use ref instead

  const startRecording = () => {
    if (recognitionRef.current && verseData) {
      // Initialize audio context on user interaction (required by browsers)
      initAudioContext();
      
      // Reset all transcription state
      setTranscription('');
      transcriptionRef.current = '';
      accumulatedTranscriptRef.current = ''; // Reset accumulated transcript
      setInterimTranscript('');
      setRealTimeFeedback(null);
      completionPlayedRef.current = false; // Reset completion flag for new recording
      setVerseCompleted(false); // Reset completion state
      lastWordTimeRef.current = Date.now();
      setTimeSinceLastWord(0);
      resetTriggeredRef.current = false;
      setShowResetFlash(false);
      setIsRecording(true);
      isRecordingRef.current = true; // Keep ref in sync
      recognitionRef.current.start();
      console.log('🎙️ Recording started, pause threshold:', pauseThreshold, 'ms');
    }
  };

  const stopRecording = () => {
    console.log('🛑 Stopping recording...');
    // Set ref FIRST to prevent any restart attempts
    isRecordingRef.current = false;
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore errors when stopping (might already be stopped)
        console.log('Stop error (safe to ignore):', e);
      }
    }
    
    setIsRecording(false);
    // Clear interim transcript when stopping
    setInterimTranscript('');
    // Clear any errors from the recording session
    setError(null);
    // Clear pause check interval
    if (pauseCheckIntervalRef.current) {
      clearInterval(pauseCheckIntervalRef.current);
      pauseCheckIntervalRef.current = null;
    }
  };

  const handleGetFeedback = async () => {
    if (!verseData || !transcription.trim()) {
      alert('Please record your recitation first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verseText: verseData.text,
          userRecitation: transcription,
        }),
      });

      const data = await response.json();

      if (data.feedback) {
        setFeedback(data.feedback);
        setMode('feedback');
      } else {
        // Handle specific error codes
        if (data.code === 'QUOTA_EXCEEDED') {
          setError(`⚠️ ${data.message || data.error}`);
        } else if (data.code === 'INVALID_KEY') {
          setError(`🔑 ${data.message || data.error}`);
        } else {
          setError(data.message || data.error || 'Failed to get feedback');
        }
      }
    } catch (err: any) {
      console.error('Error getting feedback:', err);
      setError('Failed to get feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkMemorized = () => {
    if (!verseData) return;

    // Stop recording before navigating
    stopRecording();

    const memorizedVerses = JSON.parse(
      localStorage.getItem('memorizedVerses') || '[]'
    );
    const verseRef = `${book} ${chapter}:${verse}`;
    
    if (!memorizedVerses.includes(verseRef)) {
      memorizedVerses.push(verseRef);
      localStorage.setItem('memorizedVerses', JSON.stringify(memorizedVerses));
    }

    router.push('/');
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <main className="min-h-screen p-4 md:p-8 bg-gray-50">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
          <div className="text-center">Loading...</div>
        </div>
      </main>
    );
  }

  if (error && !verseData) {
    return (
      <main className="min-h-screen p-4 md:p-8 bg-gray-50">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Error</h1>
          <p className="text-gray-700 mb-4">{error}</p>
          <Link href="/select" className="text-blue-600 hover:text-blue-700">
            ← Go back to verse selection
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">
              {book} {chapter}:{verse}
            </h1>
            <Link 
              href="/select" 
              className="text-blue-600 hover:text-blue-700"
              onClick={() => stopRecording()} // Stop recording before navigating
            >
              Select Another Verse
            </Link>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                stopRecording(); // Stop recording when switching modes
                setMode('study');
              }}
              className={`px-4 py-2 rounded ${
                mode === 'study'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Study
            </button>
            <button
              onClick={() => {
                stopRecording(); // Stop recording when switching modes
                setMode('practice');
                setTranscription('');
                setInterimTranscript('');
                setRealTimeFeedback(null);
                setFeedback(null);
              }}
              className={`px-4 py-2 rounded ${
                mode === 'practice'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Practice
            </button>
            {feedback && (
              <button
                onClick={() => {
                  stopRecording(); // Stop recording when switching modes
                  setMode('feedback');
                }}
                className={`px-4 py-2 rounded ${
                  mode === 'feedback'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Feedback
              </button>
            )}
          </div>
        </div>

        {/* Study Mode */}
        {mode === 'study' && verseData && (
          <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500 mb-4">{verseData.reference}</p>
              <p className="text-xl md:text-2xl text-gray-800 leading-relaxed">
                {verseData.text}
              </p>
            </div>
            <div className="text-center">
              <button
                onClick={() => setMode('practice')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                I'm Ready to Practice
              </button>
            </div>
          </div>
        )}

        {/* Practice Mode */}
        {mode === 'practice' && (
          <div className={`bg-white rounded-lg shadow-md p-6 md:p-8 transition-all duration-200 ${showResetFlash ? 'ring-4 ring-red-500 bg-red-50' : ''}`}>
            {/* Reset Flash Indicator */}
            {showResetFlash && (
              <div className="mb-4 p-3 bg-red-100 border-2 border-red-500 rounded-lg text-center animate-pulse">
                <span className="text-red-700 font-bold text-lg">🔄 RESET - Start Over!</span>
              </div>
            )}

            {/* Completion Banner */}
            {verseCompleted && (
              <div className="mb-4 p-4 bg-green-100 border-2 border-green-500 rounded-lg text-center">
                <div className="flex items-center justify-center gap-4">
                  <span className="text-green-700 font-bold text-lg">🎉 Verse Complete!</span>
                  <button
                    onClick={() => {
                      setVerseCompleted(false);
                      completionPlayedRef.current = false;
                      setTranscription('');
                      transcriptionRef.current = '';
                      accumulatedTranscriptRef.current = '';
                      setInterimTranscript('');
                      setRealTimeFeedback(null);
                      lastWordTimeRef.current = Date.now();
                      setTimeSinceLastWord(0);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  >
                    Practice Again
                  </button>
                </div>
                {realTimeFeedback && (
                  <p className="mt-2 text-green-600">
                    Accuracy: {realTimeFeedback.currentAccuracy}%
                  </p>
                )}
              </div>
            )}
            
            {/* Pause Threshold Slider */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pause Reset Time: {(pauseThreshold / 1000).toFixed(1)} seconds
              </label>
              <input
                type="range"
                min="1000"
                max="10000"
                step="500"
                value={pauseThreshold}
                onChange={(e) => setPauseThreshold(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1s (Short)</span>
                <span>5s</span>
                <span>10s (Long)</span>
              </div>
              <div className="mt-3 p-2 bg-white rounded border">
                <p className="text-xs font-medium text-gray-700 mb-1">What is "pause time"?</p>
                <p className="text-xs text-gray-600 mb-2">
                  Pause time is the <strong>time between words</strong> - the gap from when you say one word until you say the next word.
                </p>
                {isRecording && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-xs text-gray-600">
                      Time since last word: <span className={`font-semibold ${
                        timeSinceLastWord >= pauseThreshold ? 'text-red-600' :
                        timeSinceLastWord >= pauseThreshold * 0.7 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {(timeSinceLastWord / 1000).toFixed(1)}s
                      </span>
                      {timeSinceLastWord >= pauseThreshold && (
                        <span className="ml-2 text-red-600 font-semibold">⚠️ Reset triggered!</span>
                      )}
                    </p>
                  </div>
                )}
                <p className="text-xs text-gray-600 mt-2">
                  If you pause (stop speaking) longer than the threshold, you'll hear a beep and matching will reset from the beginning.
                </p>
                <button
                  onClick={() => {
                    initAudioContext();
                    playBeep();
                  }}
                  className="mt-2 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  🔊 Test Beep Sound
                </button>
              </div>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold mb-4">
                Recite the verse from memory
              </h2>
              
              {/* Real-time feedback display */}
              {isRecording && realTimeFeedback && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="mb-2">
                    <span className="text-sm font-medium text-gray-600">Live Accuracy: </span>
                    <span className={`text-lg font-bold ${
                      realTimeFeedback.currentAccuracy >= 90 ? 'text-green-600' :
                      realTimeFeedback.currentAccuracy >= 70 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {realTimeFeedback.currentAccuracy}%
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 justify-center items-center text-lg">
                    {realTimeFeedback.words.map((word, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-1 rounded transition-all ${
                          word.status === 'correct'
                            ? 'bg-green-200 text-green-800 font-medium'
                            : word.status === 'incorrect'
                            ? 'bg-red-200 text-red-800 font-medium'
                            : word.status === 'missing'
                            ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {word.text}
                        {word.status === 'missing' && <span className="text-xs"> (missing)</span>}
                      </span>
                    ))}
                  </div>
                  {interimTranscript && (
                    <div className="mt-2 text-sm text-gray-500 italic">
                      Speaking: {interimTranscript}
                    </div>
                  )}
                </div>
              )}
              
              {/* Final transcription display */}
              {!isRecording && transcription && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700">{transcription}</p>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-4">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="bg-red-600 text-white px-8 py-4 rounded-full hover:bg-red-700 transition-colors font-medium text-lg flex items-center gap-2"
                >
                  <span className="w-3 h-3 bg-white rounded-full"></span>
                  Start Recording
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="bg-gray-600 text-white px-8 py-4 rounded-full hover:bg-gray-700 transition-colors font-medium text-lg flex items-center gap-2"
                >
                  <span className="w-3 h-3 bg-white rounded-full animate-pulse"></span>
                  Stop Recording
                </button>
              )}

              {transcription && !isRecording && (
                <button
                  onClick={handleGetFeedback}
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400"
                >
                  {loading ? 'Analyzing...' : 'Get Feedback'}
                </button>
              )}

              {error && (
                <div className="text-red-600 text-sm mt-2">{error}</div>
              )}

              {mounted && !speechRecognitionAvailable && (
                <div className="text-yellow-600 text-sm mt-2">
                  Speech recognition not available. You can type your recitation
                  below.
                </div>
              )}
            </div>

            {mounted && !speechRecognitionAvailable && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type your recitation:
                </label>
                <textarea
                  value={transcription}
                  onChange={(e) => {
                    setTranscription(e.target.value);
                    transcriptionRef.current = e.target.value;
                    accumulatedTranscriptRef.current = e.target.value;
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Type the verse as you remember it..."
                />
                {transcription && (
                  <button
                    onClick={handleGetFeedback}
                    disabled={loading}
                    className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400"
                  >
                    {loading ? 'Analyzing...' : 'Get Feedback'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Feedback Mode */}
        {mode === 'feedback' && feedback && verseData && (
          <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
            <div className="text-center mb-6">
              <div className="text-4xl font-bold mb-2">
                {feedback.accuracy}%
              </div>
              <div className="text-gray-600 mb-6">Accuracy</div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-gray-800">{feedback.encouragement}</p>
              </div>

              {feedback.suggestions && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold mb-2">Suggestions:</h3>
                  <p className="text-gray-700">{feedback.suggestions}</p>
                </div>
              )}

              {feedback.mistakes.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold mb-2">Areas to work on:</h3>
                  <ul className="list-disc list-inside text-gray-700">
                    {feedback.mistakes.map((mistake, idx) => (
                      <li key={idx}>
                        {mistake.type}: {mistake.word}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setMode('practice');
                  setTranscription('');
                  setFeedback(null);
                }}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Try Again
              </button>
              {feedback.accuracy >= 90 && (
                <button
                  onClick={handleMarkMemorized}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Mark as Memorized ✓
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen p-4 md:p-8 bg-gray-50">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
          <div className="text-center">Loading...</div>
        </div>
      </main>
    }>
      <PracticePageContent />
    </Suspense>
  );
}

