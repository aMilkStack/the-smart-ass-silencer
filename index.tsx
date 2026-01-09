import React, { useState, useEffect, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI, Modality } from "@google/genai";
import { annotate } from "rough-notation";
import logoImg from "./logo.png";
import {
  Coffee,
  Mic,
  Glasses,
  Receipt,
  PenTool,
  Copy,
  Check,
  Volume2,
  MicOff,
  Settings,
  X,
  HelpCircle,
  ArrowRight,
  Square
} from "lucide-react";

// --- Keyboard Navigation Hooks ---

/**
 * Hook for trapping focus within a container (for modals/dialogs)
 * Returns a ref to attach to the container element
 */
const useFocusTrap = (isActive: boolean, onEscape?: () => void) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    // Store the currently focused element to restore later
    previousActiveElement.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    // Get all focusable elements
    const getFocusableElements = () => {
      return container.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
// --- Focus Trap Hook for Modals ---
const useFocusTrap = (isActive: boolean, containerRef: React.RefObject<HTMLElement | null>) => {
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Save the previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Get all focusable elements within the container
    const getFocusableElements = (): HTMLElement[] => {
      if (!containerRef.current) return [];
      const elements = containerRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      return Array.from(elements).filter(
        (el: HTMLElement) => !el.hasAttribute('disabled') && el.offsetParent !== null
      );
    };

    // Focus the first focusable element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      setTimeout(() => focusableElements[0].focus(), 50);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle Escape key
      if (e.key === 'Escape' && onEscape) {
        e.preventDefault();
        onEscape();
        return;
      }

      // Handle Tab key for focus trapping
      if (e.key === 'Tab') {
        const focusable = getFocusableElements();
        if (focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
      focusableElements[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusables = getFocusableElements();
      if (focusables.length === 0) return;

      const firstElement = focusables[0];
      const lastElement = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus to previously focused element
      if (previousActiveElement.current && previousActiveElement.current.focus) {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive, onEscape]);

  return containerRef;
};

/**
 * Hook for roving tabindex in grouped controls (like button groups)
 * Handles arrow key navigation within a group of elements
 */
const useRovingTabIndex = <T extends HTMLElement>(
  items: number,
  orientation: 'horizontal' | 'vertical' | 'both' = 'horizontal'
) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const itemRefs = useRef<(T | null)[]>([]);

  const setItemRef = (index: number) => (el: T | null) => {
    itemRefs.current[index] = el;
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const isHorizontal = orientation === 'horizontal' || orientation === 'both';
    const isVertical = orientation === 'vertical' || orientation === 'both';

    let newIndex = index;

    switch (e.key) {
      case 'ArrowLeft':
        if (isHorizontal) {
          e.preventDefault();
          newIndex = index > 0 ? index - 1 : items - 1;
        }
        break;
      case 'ArrowRight':
        if (isHorizontal) {
          e.preventDefault();
          newIndex = index < items - 1 ? index + 1 : 0;
        }
        break;
      case 'ArrowUp':
        if (isVertical) {
          e.preventDefault();
          newIndex = index > 0 ? index - 1 : items - 1;
        }
        break;
      case 'ArrowDown':
        if (isVertical) {
          e.preventDefault();
          newIndex = index < items - 1 ? index + 1 : 0;
        }
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = items - 1;
        break;
    }

    if (newIndex !== index) {
      setActiveIndex(newIndex);
      itemRefs.current[newIndex]?.focus();
    }
  };

  const getItemProps = (index: number) => ({
    ref: setItemRef(index),
    tabIndex: index === activeIndex ? 0 : -1,
    onKeyDown: (e: React.KeyboardEvent) => handleKeyDown(e, index),
    onFocus: () => setActiveIndex(index),
  });

  return { activeIndex, setActiveIndex, getItemProps };
      // Return focus to previous element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive, containerRef]);
};

// --- Escape Key Hook for Modals ---
const useEscapeKey = (isActive: boolean, onEscape: () => void) => {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onEscape();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, onEscape]);
};

// --- Sound Effects ---
const createSoundEffect = (frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.1) => {
  return () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Silently fail if audio context is not available
    }
  };
};
  AlertTriangle,
  RefreshCw,
  Loader2
  RotateCw
} from "lucide-react";

// --- Sound Effects (Subtle & Pleasant) ---

// Soft tactile click - like a gentle button press
const playClickSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // Soft tick: quick sine wave with gentle attack
    oscillator.frequency.setValueAtTime(1800, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.03);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.03, audioCtx.currentTime + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.05);
  } catch (e) {}
};

// Pleasant success chime - gentle ascending two-note tone
const playSuccessSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

    // First note (lower)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.frequency.value = 523.25; // C5
    osc1.type = 'sine';
    gain1.gain.setValueAtTime(0, audioCtx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    osc1.start(audioCtx.currentTime);
    osc1.stop(audioCtx.currentTime + 0.15);

    // Second note (higher) - slightly delayed
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.frequency.value = 659.25; // E5
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0, audioCtx.currentTime + 0.08);
    gain2.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc2.start(audioCtx.currentTime + 0.08);
    osc2.stop(audioCtx.currentTime + 0.3);
  } catch (e) {}
};

// Soft pop for copy action
const playPopSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.frequency.setValueAtTime(500, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(900, audioCtx.currentTime + 0.04);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.06, audioCtx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
    oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.05);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.1);
  } catch (e) {}
};

// --- Haptic Feedback ---
const triggerHaptic = (style: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') => {
  if (!navigator.vibrate) return;

  const patterns: Record<string, number | number[]> = {
    light: 10,
    medium: 20,
    heavy: 30,
    success: [10, 50, 20],
    warning: [20, 30, 20],
    error: [30, 50, 30, 50, 30],
  };

  try {
    navigator.vibrate(patterns[style] || 10);
  } catch (e) {
    // Silently fail if vibration is not available
  }
};

// --- Swipe Gesture Hook ---
const useSwipeGesture = (
  onSwipeRight?: () => void,
  onSwipeLeft?: () => void,
  threshold: number = 80
) => {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;

      // Only trigger if horizontal movement is dominant and fast enough
      if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5 && deltaTime < 300) {
        if (deltaX > threshold && onSwipeRight) {
          triggerHaptic('light');
          onSwipeRight();
        } else if (deltaX < -threshold && onSwipeLeft) {
          triggerHaptic('light');
          onSwipeLeft();
        }
      }

      touchStartRef.current = null;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeRight, onSwipeLeft, threshold]);

  return containerRef;
};

// --- Keyboard Avoidance Hook ---
const useKeyboardAvoidance = () => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    // Use visualViewport API for accurate keyboard detection
    const viewport = window.visualViewport;
    if (!viewport) return;

    const handleResize = () => {
      const keyboardH = window.innerHeight - viewport.height;
      setKeyboardHeight(keyboardH > 50 ? keyboardH : 0);
      setIsKeyboardVisible(keyboardH > 50);
    };

    viewport.addEventListener('resize', handleResize);
    viewport.addEventListener('scroll', handleResize);

    return () => {
      viewport.removeEventListener('resize', handleResize);
      viewport.removeEventListener('scroll', handleResize);
    };
  }, []);

  return { keyboardHeight, isKeyboardVisible };
const playExplosionSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Create noise for explosion
    const bufferSize = audioCtx.sampleRate * 0.3;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    // Low pass filter for rumble
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.3);

    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    noise.start(audioCtx.currentTime);
    noise.stop(audioCtx.currentTime + 0.3);

    // Add a bass thump
    const osc = audioCtx.createOscillator();
    const oscGain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.2);
    oscGain.gain.setValueAtTime(0.4, audioCtx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.connect(oscGain);
    oscGain.connect(audioCtx.destination);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.2);
  } catch (e) {}
};

const playRageTickSound = (intensity: number) => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // Higher pitch as intensity increases
    const baseFreq = 200 + (intensity * 400);
    oscillator.frequency.setValueAtTime(baseFreq, audioCtx.currentTime);
    oscillator.type = 'square';

    gainNode.gain.setValueAtTime(0.05 + (intensity * 0.05), audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.05);
  } catch (e) {}
};

// --- Configuration ---
const LOADING_MESSAGES_EN = [
  "Analysing bullshit...",
  "Checking ego...",
  "Sighing loudly...",
  "Rolling eyes...",
  "Consulting the archives of cringe...",
  "Preparing verbal violence...",
  "Detecting high levels of waffle...",
  "Loading sarcasm module...",
  "Translating 'Thought Leader' to English...",
  "Calculating audacity...",
  "Locating actual point..."
];

const LOADING_MESSAGES_DE = [
  "Analysiere Blödsinn...",
  "Überprüfe Ego...",
  "Seufze laut...",
  "Verdrehe die Augen...",
  "Konsultiere das Archiv des Fremdschämens...",
  "Bereite verbale Gewalt vor...",
  "Erkenne hohen Geschwätzpegel...",
  "Lade Sarkasmus-Modul...",
  "Übersetze 'Thought Leader' ins Deutsche...",
  "Berechne Dreistigkeit...",
  "Suche den eigentlichen Punkt..."
];

// --- Audio Helpers ---
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// --- Components ---

// Pong Minigame Component (Horizontal / Classic Mode)
const PongLoader = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    // Get dimensions
    let w = container.clientWidth;
    let h = container.clientHeight;

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // Game variables
    const paddleWidth = 12;
    const paddleHeight = 60;
    const ballR = 8;
    const paddleOffset = 20;

    // Y-axis positions (Center vertically initially)
    let playerY = h / 2;
    let aiY = h / 2;

    // Scores
    let playerScore = 0;
    let aiScore = 0;
    const winningScore = 5;
    let gameOver = false;
    let ballPaused = false;
    let pauseTimeout: number | null = null;

    // Initial Ball State
    const resetBall = () => {
        return {
            x: w/2,
            y: h/2,
            dx: 5 * (Math.random() > 0.5 ? 1 : -1),
            dy: 3.5 * (Math.random() > 0.5 ? 1 : -1)
        };
    };
    let ball = resetBall();

    // Helper to draw rounded rects manually for broader compatibility
    const drawRoundedRect = (x: number, y: number, width: number, height: number, radius: number) => {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    };

    // Interaction Handlers
    const movePaddle = (clientY: number) => {
        if (gameOver) return; // Don't move paddle when game is over
        const rect = container.getBoundingClientRect();
        const y = clientY - rect.top;
        playerY = Math.max(paddleHeight/2, Math.min(h - paddleHeight/2, y));
    };

    const onTouch = (e: TouchEvent) => {
        e.preventDefault(); // Prevent scrolling while playing
        if (gameOver) {
            // Restart game
            playerScore = 0;
            aiScore = 0;
            gameOver = false;
            ball = resetBall();
            playerY = h/2;
            aiY = h/2;
            ballPaused = false;
        } else {
            movePaddle(e.touches[0].clientY);
        }
    };

    const onMouse = (e: MouseEvent) => movePaddle(e.clientY);

    const onClick = () => {
        if (gameOver) {
            // Restart game
            playerScore = 0;
            aiScore = 0;
            gameOver = false;
            ball = resetBall();
            playerY = h/2;
            aiY = h/2;
            ballPaused = false;
        }
    };

    // Keyboard controls state
    const keysPressed = new Set<string>();
    const paddleSpeed = 8;

    const onKeyDown = (e: KeyboardEvent) => {
        keysPressed.add(e.key);

        // Restart game with Enter or Space when game over
        if (gameOver && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            playerScore = 0;
            aiScore = 0;
            gameOver = false;
            ball = resetBall();
            playerY = h/2;
            aiY = h/2;
            ballPaused = false;
        }

        // Prevent page scrolling with arrow keys when focused
        if (['ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
            e.preventDefault();
        }
    };

    const onKeyUp = (e: KeyboardEvent) => {
        keysPressed.delete(e.key);
    };

    // Process keyboard input in game loop
    const processKeyboardInput = () => {
        if (gameOver) return;

        if (keysPressed.has('ArrowUp') || keysPressed.has('w') || keysPressed.has('W')) {
            playerY = Math.max(paddleHeight/2, playerY - paddleSpeed);
        }
        if (keysPressed.has('ArrowDown') || keysPressed.has('s') || keysPressed.has('S')) {
            playerY = Math.min(h - paddleHeight/2, playerY + paddleSpeed);
        }
    };

    // Main game loop with keyboard input
    const runLoop = () => {
        processKeyboardInput();
        // AI Logic: Move towards ball Y with slight delay for fairness
        const target = ball.y;
        const aiSpeed = 0.06;
        aiY += (target - aiY) * aiSpeed;

        // Clamp AI
        aiY = Math.max(paddleHeight/2, Math.min(h - paddleHeight/2, aiY));

        // Physics (only if ball is not paused)
        if (!ballPaused && !gameOver) {
            ball.x += ball.dx;
            ball.y += ball.dy;
        }

        // Wall Bounces (Top & Bottom) with position correction
        if (ball.y - ballR < 0) {
            ball.y = ballR;
            ball.dy = Math.abs(ball.dy);
        }
        if (ball.y + ballR > h) {
            ball.y = h - ballR;
            ball.dy = -Math.abs(ball.dy);
        }

        // Player Paddle (Left Side) Collision
        const playerPaddleRight = paddleOffset + paddleWidth;
        if (ball.dx < 0 && ball.x - ballR <= playerPaddleRight && ball.x + ballR >= paddleOffset) {
            if (ball.y >= playerY - paddleHeight/2 - ballR && ball.y <= playerY + paddleHeight/2 + ballR) {
                ball.x = playerPaddleRight + ballR;
                ball.dx = Math.abs(ball.dx) * 1.03;
                const hitOffset = (ball.y - playerY) / (paddleHeight/2);
                ball.dy += hitOffset * 1.5;
            }
        }

        // AI Paddle (Right Side) Collision
        const aiPaddleLeft = w - paddleOffset - paddleWidth;
        if (ball.dx > 0 && ball.x + ballR >= aiPaddleLeft && ball.x - ballR <= w - paddleOffset) {
            if (ball.y >= aiY - paddleHeight/2 - ballR && ball.y <= aiY + paddleHeight/2 + ballR) {
                ball.x = aiPaddleLeft - ballR;
                ball.dx = -Math.abs(ball.dx) * 1.03;
                const hitOffset = (ball.y - aiY) / (paddleHeight/2);
                ball.dy += hitOffset * 1.5;
            }
        }

        // Scoring if missed
        if (ball.x < -ballR * 2) {
            aiScore++;
            if (aiScore >= winningScore) {
                gameOver = true;
            } else {
                ball = resetBall();
                ballPaused = true;
                pauseTimeout = window.setTimeout(() => { ballPaused = false; }, 1000);
            }
        } else if (ball.x > w + ballR * 2) {
            playerScore++;
            if (playerScore >= winningScore) {
                gameOver = true;
            } else {
                ball = resetBall();
                ballPaused = true;
                pauseTimeout = window.setTimeout(() => { ballPaused = false; }, 1000);
            }
        }

        // Cap speed
        ball.dx = Math.max(-10, Math.min(10, ball.dx));
        ball.dy = Math.max(-8, Math.min(8, ball.dy));

        // Draw
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "#2a2a2a";
        ctx.strokeStyle = "#2a2a2a";
        ctx.lineWidth = 2;

        drawRoundedRect(paddleOffset, playerY - paddleHeight/2, paddleWidth, paddleHeight, 4);
        drawRoundedRect(w - paddleOffset - paddleWidth, aiY - paddleHeight/2, paddleWidth, paddleHeight, 4);

        ctx.beginPath();
        ctx.setLineDash([5, 15]);
        ctx.moveTo(w/2, 0);
        ctx.lineTo(w/2, h);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "rgba(239, 68, 68, 0.15)";
        ctx.beginPath();
        ctx.arc(ball.x - ball.dx * 2, ball.y - ball.dy * 2, ballR * 0.8, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = "rgba(239, 68, 68, 0.08)";
        ctx.beginPath();
        ctx.arc(ball.x - ball.dx * 4, ball.y - ball.dy * 4, ballR * 0.6, 0, Math.PI*2);
        ctx.fill();

        ctx.fillStyle = "#ef4444";
        ctx.strokeStyle = "#2a2a2a";
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ballR, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#2a2a2a";
        ctx.font = "bold 32px 'Gochi Hand', cursive";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(playerScore.toString(), w / 4, 20);
        ctx.fillText(aiScore.toString(), (w * 3) / 4, 20);

        if (gameOver) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = "#fff";
            ctx.font = "bold 48px 'Gochi Hand', cursive";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            const winner = playerScore >= winningScore ? "YOU WIN!" : "CPU WINS!";
            ctx.fillText(winner, w / 2, h / 2 - 20);
            ctx.font = "bold 20px 'Gochi Hand', cursive";
            ctx.fillText("Press Enter to restart", w / 2, h / 2 + 30);
        }

        animationId = requestAnimationFrame(runLoop);
    };
    runLoop();

    container.addEventListener('touchmove', onTouch, { passive: false });
    container.addEventListener('mousemove', onMouse);
    container.addEventListener('click', onClick);
    container.addEventListener('keydown', onKeyDown);
    container.addEventListener('keyup', onKeyUp);

    // Handle Resize
    const handleResize = () => {
        w = container.clientWidth;
        h = container.clientHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);
        // Reset game on resize
        ball = resetBall();
        playerY = h/2;
        aiY = h/2;
    };
    window.addEventListener('resize', handleResize);

    return () => {
        cancelAnimationFrame(animationId);
        if (pauseTimeout) clearTimeout(pauseTimeout);
        container.removeEventListener('touchmove', onTouch);
        container.removeEventListener('mousemove', onMouse);
        container.removeEventListener('click', onClick);
        container.removeEventListener('keydown', onKeyDown);
        container.removeEventListener('keyup', onKeyUp);
        window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div
        ref={containerRef}
        tabIndex={0}
        role="application"
        aria-label="Pong game - Use arrow keys or W/S to move paddle, Enter to restart"
        className="w-full h-48 md:h-60 wobbly-box bg-white relative overflow-hidden cursor-none touch-none select-none focus:outline-none focus:ring-2 focus:ring-amber-400"
    >
        <canvas ref={canvasRef} className="block w-full h-full" aria-hidden="true" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-200 font-black text-4xl md:text-5xl pointer-events-none -z-10 select-none opacity-40 rotate-12 text-center" aria-hidden="true">
            ↑↓ OR W/S<br />TO PLAY
        </div>
        <div className="absolute bottom-2 left-2 text-xs text-gray-400 font-bold opacity-50 pointer-events-none" aria-hidden="true">
            YOU
        </div>
        <div className="absolute top-2 right-2 text-xs text-gray-400 font-bold opacity-50 pointer-events-none" aria-hidden="true">
            CPU
        </div>
        <span className="sr-only">Interactive Pong game. Use up/down arrow keys or W/S to control paddle. Press Enter or Space to restart when game ends.</span>
      ref={containerRef}
      className="w-full h-48 md:h-60 wobbly-box bg-white relative overflow-hidden cursor-none touch-none select-none"
      role="application"
      aria-label="Pong game - move your mouse or finger to control the left paddle. Score 5 points to win."
      tabIndex={0}
    >
        <canvas
          ref={canvasRef}
          className="block w-full h-full"
          aria-hidden="true"
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-200 font-black text-4xl md:text-5xl pointer-events-none -z-10 select-none opacity-40 rotate-12 text-center" aria-hidden="true">
            MOVE TO<br />PLAY PONG
        </div>
        <div className="absolute bottom-2 left-2 text-xs text-gray-400 font-bold opacity-50 pointer-events-none" aria-hidden="true">
            YOU
        </div>
        <div className="absolute top-2 right-2 text-xs text-gray-400 font-bold opacity-50 pointer-events-none" aria-hidden="true">
    <div ref={containerRef} className="w-full h-48 md:h-60 wobbly-box bg-white relative overflow-hidden cursor-none touch-none select-none">
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-200 heading-xl text-4xl md:text-5xl pointer-events-none -z-10 select-none opacity-40 rotate-12 text-center tracking-tight">
            MOVE TO<br />PLAY PONG
        </div>
        <div className="absolute bottom-2 left-2 text-xs text-gray-400 label opacity-50 pointer-events-none tracking-wider">
            YOU
        </div>
        <div className="absolute top-2 right-2 text-xs text-gray-400 label opacity-50 pointer-events-none tracking-wider">
            CPU
        </div>
        {/* Screen reader alternative */}
        <span className="sr-only">
          Interactive Pong game loading indicator. Move mouse or touch to control left paddle.
        </span>
    </div>
  );
};


// Loading Skeleton Component
const Skeleton = ({ className = "", lines = 3 }: { className?: string; lines?: number }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-4"
          style={{
            width: i === lines - 1 ? '60%' : i % 2 === 0 ? '100%' : '85%',
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
    </div>
  );
};

// Result Skeleton - Shows expected result structure while loading
const ResultSkeleton = () => {
  return (
    <div className="animate-fade-slide-in space-y-8 py-4">
      {/* Kill Shot Skeleton */}
      <div className="wobbly-box bg-white border-4 border-gray-200 p-6 md:p-8 relative">
        <div className="space-y-3">
          <div className="skeleton h-8 w-3/4 mx-auto" />
          <div className="skeleton h-8 w-1/2 mx-auto" />
        </div>
      </div>

      {/* Autopsy Skeleton */}
      <div className="mt-8">
        <div className="skeleton h-6 w-32 mb-4" />
        <div className="bg-gray-50 border border-gray-200 border-dashed rounded-lg p-5 md:p-6">
          <Skeleton lines={3} />
        </div>
      </div>

      {/* Follow-up Skeleton */}
      <div className="mt-8">
        <div className="skeleton h-6 w-40 mb-4" />
        <div className="bg-gray-50 border border-gray-200 border-dashed rounded-lg p-5 md:p-6">
          <Skeleton lines={2} />
        </div>
      </div>
    </div>
  );
};

// Pull to Refresh Hook
const usePullToRefresh = (onRefresh: () => void, enabled: boolean = true) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const threshold = 80;

  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startYRef.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startYRef.current === null || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const distance = currentY - startYRef.current;

      if (distance > 0 && window.scrollY === 0) {
        e.preventDefault();
        // Apply resistance to pull
        const resistedDistance = Math.min(distance * 0.5, 150);
        setPullDistance(resistedDistance);
      }
    };

    const handleTouchEnd = () => {
      if (pullDistance > threshold && !isRefreshing) {
        setIsRefreshing(true);
        onRefresh();
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
        }, 1000);
      } else {
        setPullDistance(0);
      }
      startYRef.current = null;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, onRefresh, pullDistance, isRefreshing]);

  return { pullDistance, isRefreshing, containerRef };
};

// Pull to Refresh Indicator Component
const PullToRefreshIndicator = ({
  pullDistance,
  isRefreshing,
  threshold = 80
}: {
  pullDistance: number;
  isRefreshing: boolean;
  threshold?: number;
}) => {
  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 180;

  if (pullDistance === 0 && !isRefreshing) return null;

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 z-50 pull-indicator"
      style={{
        top: Math.min(pullDistance * 0.5, 60) - 40,
        opacity: isRefreshing ? 1 : progress
      }}
    >
      <div className={`bg-white wobbly-box p-3 shadow-lg ${isRefreshing ? 'animate-bounce' : ''}`}>
        <RotateCw
          size={24}
          className={isRefreshing ? 'animate-spin' : ''}
          style={{
            transform: isRefreshing ? undefined : `rotate(${rotation}deg)`,
            transition: 'transform 0.1s ease-out'
          }}
        />
      </div>
    </div>
  );
};

// Animated Button Component with enhanced press state
const AnimatedButton = ({
  children,
  onClick,
  disabled,
  className = "",
  variant = "primary"
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: "primary" | "secondary";
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const baseClasses = "btn-press transition-all duration-150 transform";
  const variantClasses = variant === "primary"
    ? "wobbly-box bg-red-400 hover:bg-red-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
    : "wobbly-box bg-white border-4 border-black hover:bg-yellow-100";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      className={`${baseClasses} ${variantClasses} ${className} ${
        isPressed && !disabled ? 'scale-[0.96] translate-y-0.5' : 'hover:-translate-y-0.5 hover:scale-[1.02]'
      }`}
    >
      {children}
    </button>
  );
};

// Reusable Scribble Text (SVG Animation)
const ScribbleHeader = ({
    text,
    className = "",
    delay = 0,
    color = "#2a2a2a",
    as: Component = "h2"
}: {
    text: string,
    className?: string,
    delay?: number,
    color?: string,
    as?: "h1" | "h2" | "h3" | "h4" | "span" | "p"
}) => {
  return (
    <div className={`relative ${className} overflow-visible`} role="presentation">
        {/* Visually hidden heading for screen readers */}
        <Component className="sr-only">{text}</Component>
        <svg
          viewBox="0 0 400 60"
          className="w-full h-full scribble-text pointer-events-none overflow-visible"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
          role="img"
        >
          <text
            x="50%"
            y="70%"
            textAnchor="middle"
            style={{
                fontFamily: '"Gochi Hand", cursive',
                fontWeight: 900,
                fontSize: '40px',
                stroke: color,
                fill: 'transparent'
            }}
          >
            {text.split('').map((char, i) => (
              <tspan
                key={i}
                style={{
                    animationDelay: `${delay + (i * 0.05)}s`,
                    fill: 'transparent'
                }}
              >
                {char}
              </tspan>
            ))}
          </text>
        </svg>
    </div>
  );
};

// Wrapper for Rough Notation effects
const RoughHighlight = ({ 
    show, 
    type, 
    color, 
    children, 
    padding = 5,
    strokeWidth = 2,
    iterations = 2,
    animationDuration = 500,
    className = ""
}: any) => {
    const ref = useRef<HTMLDivElement>(null);
    const annotationRef = useRef<any>(null);

    useEffect(() => {
        if (show && ref.current) {
            if (annotationRef.current) {
                annotationRef.current.remove();
            }
            // Small timeout to ensure layout is ready
            const timer = setTimeout(() => {
                if(!ref.current) return;
                const annotation = annotate(ref.current, {
                    type,
                    color,
                    padding,
                    strokeWidth,
                    iterations,
                    animationDuration
                });
                annotation.show();
                annotationRef.current = annotation;
            }, 50);
            return () => clearTimeout(timer);
        } else if (!show && annotationRef.current) {
            annotationRef.current.hide();
        }
        
        return () => {
            if (annotationRef.current) annotationRef.current.remove();
        };
    }, [show, type, color, padding, strokeWidth, iterations, animationDuration]);

    return (
        <div ref={ref} className={`inline-block w-full ${className}`}>
            {children}
        </div>
    );
};

// Rage Meter Component - Builds up and explodes!
const RageMeter = ({
    onComplete,
    language
}: {
    onComplete: () => void;
    language: 'en' | 'de';
}) => {
    const [progress, setProgress] = useState(0);
    const [isShaking, setIsShaking] = useState(false);
    const [isExploding, setIsExploding] = useState(false);
    const [particles, setParticles] = useState<Array<{id: number; x: number; y: number; tx: number; ty: number; r: number; color: string; size: number}>>([]);
    const [showFlash, setShowFlash] = useState(false);
    const meterRef = useRef<HTMLDivElement>(null);
    const lastTickRef = useRef(0);

    const rageLabelsEn = [
        { threshold: 0, label: "Mildly annoyed" },
        { threshold: 20, label: "Eye twitching" },
        { threshold: 40, label: "Blood pressure rising" },
        { threshold: 60, label: "Seeing red" },
        { threshold: 80, label: "MAXIMUM RAGE" },
        { threshold: 95, label: "CRITICAL!!!" },
    ];

    const rageLabelsDe = [
        { threshold: 0, label: "Leicht genervt" },
        { threshold: 20, label: "Augenzucken" },
        { threshold: 40, label: "Blutdruck steigt" },
        { threshold: 60, label: "Sehe rot" },
        { threshold: 80, label: "MAXIMALE WUT" },
        { threshold: 95, label: "KRITISCH!!!" },
    ];

    const rageLabels = language === 'de' ? rageLabelsDe : rageLabelsEn;

    const getCurrentLabel = () => {
        for (let i = rageLabels.length - 1; i >= 0; i--) {
            if (progress >= rageLabels[i].threshold) {
                return rageLabels[i].label;
            }
        }
        return rageLabels[0].label;
    };

    useEffect(() => {
        // Animate progress
        const duration = 2000; // 2 seconds to fill
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const newProgress = Math.min(100, (elapsed / duration) * 100);

            // Play tick sounds at intervals
            const tickInterval = 10;
            if (Math.floor(newProgress / tickInterval) > lastTickRef.current) {
                lastTickRef.current = Math.floor(newProgress / tickInterval);
                playRageTickSound(newProgress / 100);
            }

            setProgress(newProgress);

            // Start shaking at 50%
            if (newProgress >= 50 && !isShaking) {
                setIsShaking(true);
            }

            if (newProgress < 100) {
                requestAnimationFrame(animate);
            } else {
                // Explosion time!
                triggerExplosion();
            }
        };

        requestAnimationFrame(animate);
    }, []);

    const triggerExplosion = () => {
        setIsExploding(true);
        setShowFlash(true);
        playExplosionSound();

        // Generate particles
        const newParticles: typeof particles = [];
        const colors = ['#ef4444', '#f97316', '#eab308', '#dc2626', '#fbbf24'];

        for (let i = 0; i < 30; i++) {
            const angle = (Math.PI * 2 * i) / 30 + (Math.random() - 0.5) * 0.5;
            const distance = 100 + Math.random() * 150;
            newParticles.push({
                id: i,
                x: 0,
                y: 0,
                tx: Math.cos(angle) * distance,
                ty: Math.sin(angle) * distance,
                r: Math.random() * 720 - 360,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 8 + Math.random() * 16
            });
        }
        setParticles(newParticles);

        // Hide flash quickly
        setTimeout(() => setShowFlash(false), 150);

        // Complete after explosion animation
        setTimeout(() => {
            onComplete();
        }, 600);
    };

    const shakeIntensity = isShaking ? Math.min((progress - 50) / 50, 1) : 0;

    return (
        <div className="flex flex-col items-center gap-4 py-6 relative">
            {/* Flash overlay */}
            {showFlash && (
                <div className="fixed inset-0 bg-red-500 animate-flash z-50 pointer-events-none" />
            )}

            {/* Rage Label */}
            <div className={`text-2xl md:text-3xl font-black text-center transition-all duration-200 ${
                progress >= 80 ? 'text-red-600 scale-110' : progress >= 60 ? 'text-orange-500' : 'text-gray-800'
            }`}>
                {getCurrentLabel()}
            </div>

            {/* Meter Container */}
            <div
                ref={meterRef}
                className={`relative w-full max-w-md h-12 md:h-16 wobbly-box bg-gray-100 overflow-hidden ${
                    isShaking ? 'animate-rage-shake' : ''
                } ${progress >= 80 ? 'rage-glow' : ''}`}
                style={{
                    transform: isShaking ? `translateX(${(Math.random() - 0.5) * shakeIntensity * 6}px)` : undefined,
                    transition: isExploding ? 'transform 0.3s ease-out' : undefined
                }}
            >
                {/* Fill Bar */}
                <div
                    className={`absolute inset-y-0 left-0 transition-all duration-100 ${
                        isExploding ? 'animate-rage-explode' : ''
                    }`}
                    style={{
                        width: `${progress}%`,
                        background: progress < 50
                            ? 'linear-gradient(90deg, #fbbf24, #f97316)'
                            : progress < 80
                            ? 'linear-gradient(90deg, #f97316, #ef4444)'
                            : 'linear-gradient(90deg, #ef4444, #dc2626)',
                    }}
                />

                {/* Percentage */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-xl md:text-2xl font-black ${
                        progress > 50 ? 'text-white' : 'text-gray-800'
                    } drop-shadow-md`}>
                        {Math.round(progress)}%
                    </span>
                </div>

                {/* Particles */}
                {particles.map(particle => (
                    <div
                        key={particle.id}
                        className="rage-particle absolute"
                        style={{
                            left: '50%',
                            top: '50%',
                            width: particle.size,
                            height: particle.size,
                            backgroundColor: particle.color,
                            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                            '--tx': `${particle.tx}px`,
                            '--ty': `${particle.ty}px`,
                            '--r': `${particle.r}deg`,
                        } as React.CSSProperties}
                    />
                ))}
            </div>

            {/* Sub-label */}
            <div className={`text-sm md:text-base font-bold text-gray-500 transition-opacity duration-300 ${
                isExploding ? 'opacity-0' : 'opacity-100'
            }`}>
                {language === 'de' ? 'Wut-Analyse läuft...' : 'Analysing rage levels...'}
            </div>
        </div>
    );
};

const CopyButton = ({ text, language }: { text: string, language: 'en' | 'de' }) => {
    const [copied, setCopied] = useState(false);
    const copyLabel = language === 'de' ? 'In Zwischenablage kopieren' : 'Copy to clipboard';
    const copiedLabel = language === 'de' ? 'Kopiert!' : 'Copied!';

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            playPopSound();
            triggerHaptic('success');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
            triggerHaptic('error');
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        handleCopy();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            handleCopy();
        }
    };

    return (
        <button
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            className={`absolute top-2 right-2 p-3 md:p-2 rounded-full hover:bg-black/5 transition-all duration-200 group z-20 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 ${copied ? 'animate-pop bg-green-50/50' : 'hover:scale-110 active:scale-90'}`}
            onClick={handleCopy}
            className={`absolute top-2 right-2 p-3 min-w-[44px] min-h-[44px] rounded-full hover:bg-black/5 transition-all duration-200 group z-20 flex items-center justify-center ${copied ? 'animate-pop bg-green-50/50' : 'hover:scale-110 active:scale-90'}`}
            aria-label={copied ? copiedLabel : copyLabel}
            aria-live="polite"
            className={`absolute top-2 right-2 p-3 md:p-2 rounded-full hover:bg-black/5 transition-all duration-200 group z-20 focus-ring ${copied ? 'animate-pop bg-green-50/50' : 'hover:scale-110 active:scale-90'}`}
            className={`absolute top-2 right-2 p-3 md:p-2 rounded-full hover:bg-black/5 transition-all duration-200 group z-20 touch-feedback ${copied ? 'animate-pop bg-green-50/50' : 'hover:scale-110 active:scale-90'}`}
            title={language === 'de' ? 'In Zwischenablage kopieren' : 'Copy to clipboard'}
            aria-label={copied
                ? (language === 'de' ? 'Kopiert!' : 'Copied!')
                : (language === 'de' ? 'In Zwischenablage kopieren' : 'Copy to clipboard')
            }
            aria-live="polite"
        >
            <div className="relative w-5 h-5" aria-hidden="true">
                {/* Copy Icon - scales down and rotates out when copied */}
                <div className={`absolute inset-0 transition-all duration-300 ease-out transform ${
                    copied ? 'opacity-0 scale-50 rotate-12' : 'opacity-100 scale-100 rotate-0'
                }`}>
                     <Copy size={20} className="text-gray-400 group-hover:text-black group-focus:text-black transition-colors" />
                </div>

                {/* Check Icon - pops in when copied */}
                <div className={`absolute inset-0 transition-all duration-300 ease-out transform ${
                    copied ? 'opacity-100 scale-100 rotate-0 animate-bounce-once' : 'opacity-0 scale-0 -rotate-12'
                }`}>
                    <Check size={20} className="text-green-600 font-bold" strokeWidth={3} />
                </div>
            </div>
        </button>
    );
};

// --- Loading Spinner Component ---
const LoadingSpinner = ({
    size = 24,
    color = "currentColor",
    className = ""
}: {
    size?: number,
    color?: string,
    className?: string
}) => (
    <svg
        className={`loading-spinner ${className}`}
        width={size}
        height={size}
        viewBox="0 0 50 50"
    >
        <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke={color}
            strokeWidth="4"
        />
    </svg>
);

// --- Skeleton Loader Component ---
const Skeleton = ({
    className = "",
    style = {}
}: {
    className?: string,
    style?: React.CSSProperties
}) => (
    <div className={`skeleton ${className}`} style={style} />
);

// --- Error Display Component ---
const ErrorDisplay = ({
    error,
    onDismiss,
    onRetry,
    language
}: {
    error: string;
    onDismiss: () => void;
    onRetry?: () => void;
    language: 'en' | 'de';
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        // Trigger entrance animation
        const timer = setTimeout(() => setIsVisible(true), 10);
        return () => clearTimeout(timer);
    }, []);

    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(onDismiss, 300);
    };

    return (
        <div
            className={`relative overflow-hidden transition-all duration-300 ease-out ${
                isVisible && !isExiting
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-2'
            }`}
        >
            <div className="wobbly-box bg-gradient-to-r from-red-50 to-red-100 border-red-300 p-4 md:p-5 error-shake error-pulse">
                {/* Decorative corner fold */}
                <div className="absolute top-0 right-0 w-8 h-8 bg-red-200 transform rotate-45 translate-x-4 -translate-y-4" />

                <div className="flex items-start gap-3">
                    {/* Icon with animation */}
                    <div className="flex-shrink-0 p-2 bg-red-200 rounded-full">
                        <AlertTriangle
                            size={24}
                            className="text-red-600 animate-pulse"
                        />
                    </div>

                    {/* Error content */}
                    <div className="flex-1 min-w-0">
                        <h4 className="font-black text-red-800 text-lg mb-1">
                            {language === 'de' ? 'Oops! Da lief was schief' : 'Oops! Something went wrong'}
                        </h4>
                        <p className="text-red-700 font-bold text-base leading-relaxed">
                            {error}
                        </p>
                    </div>

                    {/* Dismiss button */}
                    <button
                        onClick={handleDismiss}
                        className="flex-shrink-0 p-1 hover:bg-red-200 rounded-full transition-colors focus-ring"
                        title={language === 'de' ? 'Schließen' : 'Dismiss'}
                    >
                        <X size={20} className="text-red-500 hover:text-red-700" />
                    </button>
                </div>

                {/* Action buttons */}
                {onRetry && (
                    <div className="mt-4 flex justify-end gap-2">
                        <button
                            onClick={onRetry}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-all hover:scale-105 active:scale-95 focus-ring"
                        >
                            <RefreshCw size={16} />
                            {language === 'de' ? 'Nochmal versuchen' : 'Try Again'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Loading Button Component ---
const LoadingButton = React.forwardRef<
    HTMLButtonElement,
    {
        onClick: () => void;
        disabled?: boolean;
        loading?: boolean;
        children: React.ReactNode;
        className?: string;
        [key: string]: any;
    }
>(({ onClick, disabled, loading, children, className = "", ...props }, ref) => {
    return (
        <button
            ref={ref}
            onClick={onClick}
            disabled={disabled || loading}
            className={`relative overflow-hidden ${className} ${loading ? 'btn-loading' : ''}`}
            {...props}
        >
            {/* Content wrapper with fade effect */}
            <span className={`flex items-center justify-center gap-3 transition-opacity duration-200 ${
                loading ? 'opacity-0' : 'opacity-100'
            }`}>
                {children}
            </span>

            {/* Loading overlay */}
            {loading && (
                <span className="absolute inset-0 flex items-center justify-center gap-3">
                    <LoadingSpinner size={28} color="currentColor" />
                    <span className="animate-pulse">...</span>
                </span>
            )}
        </button>
    );
});

const LanguageSelectionModal = ({
    isOpen,
    onSelectLanguage
}: {
    isOpen: boolean;
    onSelectLanguage: (lang: 'en' | 'de') => void;
}) => {
    // Focus trap for the modal (no escape since language must be selected)
    const focusTrapRef = useFocusTrap(isOpen);

    // Roving tabindex for language buttons (vertical navigation)
    const { getItemProps } = useRovingTabIndex<HTMLButtonElement>(2, 'vertical');
    const modalRef = useRef<HTMLDivElement>(null);

    // Focus trap and escape key handling
    useFocusTrap(isOpen, modalRef);

    if (!isOpen) return null;

    const handleSelect = (lang: 'en' | 'de') => {
        triggerHaptic('light');
        localStorage.setItem('language_selected', 'true');
        localStorage.setItem('user_language', lang);
        onSelectLanguage(lang);
    };

    return (
        <div
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300"
            role="dialog"
            aria-modal="true"
            aria-labelledby="language-modal-title"
        >
            <div
                ref={focusTrapRef}
                className="bg-white wobbly-box p-8 md:p-10 max-w-md w-full relative text-center space-y-6"
            >
                <div className="space-y-2">
                    <h2 id="language-modal-title" className="text-2xl md:text-3xl font-black">Choose Your Language</h2>
                    <p className="text-lg md:text-xl font-black">Wähle deine Sprache</p>
                ref={modalRef}
                className="bg-white wobbly-box p-8 md:p-10 max-w-md w-full relative text-center space-y-6"
            >
                <div className="space-y-2">
                    <h2 id="language-modal-title" className="text-2xl md:text-3xl font-black">
                        Choose Your Language
                    </h2>
                    <p className="text-lg md:text-xl font-black" aria-hidden="true">
                        Wähle deine Sprache
                    </p>
                    <h2 className="text-2xl md:text-3xl heading-lg tracking-tight">Choose Your Language</h2>
                    <p className="text-lg md:text-xl heading-md">Wähle deine Sprache</p>
                </div>

                <div className="space-y-3" role="group" aria-label="Language selection">
                    <button
                        {...getItemProps(0)}
                        onClick={() => handleSelect('en')}
                        className="w-full p-4 font-black text-xl bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all active:shadow-none active:translate-x-[6px] active:translate-y-[6px] hover:bg-yellow-100 focus:outline-none focus:ring-4 focus:ring-amber-400 focus:ring-offset-2"
                        className="w-full p-4 min-h-[56px] font-black text-xl bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all active:shadow-none active:translate-x-[6px] active:translate-y-[6px] hover:bg-yellow-100"
                        aria-label="Select English language"
                        className="w-full p-4 font-black text-xl bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all active:shadow-none active:translate-x-[6px] active:translate-y-[6px] hover:bg-yellow-100 focus-ring"
                        className="w-full p-4 font-black text-xl bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all active:shadow-none active:translate-x-[6px] active:translate-y-[6px] hover:bg-yellow-100 touch-feedback"
                        className="w-full p-4 font-black text-xl bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all active:scale-[0.97] active:shadow-none active:translate-x-[6px] active:translate-y-[6px] hover:bg-yellow-100 btn-press animate-bounce-in"
                    >
                        English
                    </button>
                    <button
                        {...getItemProps(1)}
                        onClick={() => handleSelect('de')}
                        className="w-full p-4 font-black text-xl bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all active:shadow-none active:translate-x-[6px] active:translate-y-[6px] hover:bg-yellow-100 focus:outline-none focus:ring-4 focus:ring-amber-400 focus:ring-offset-2"
                        className="w-full p-4 min-h-[56px] font-black text-xl bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all active:shadow-none active:translate-x-[6px] active:translate-y-[6px] hover:bg-yellow-100"
                        aria-label="Sprache Deutsch auswählen (Select German language)"
                        className="w-full p-4 font-black text-xl bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all active:shadow-none active:translate-x-[6px] active:translate-y-[6px] hover:bg-yellow-100 focus-ring"
                        className="w-full p-4 font-black text-xl bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all active:shadow-none active:translate-x-[6px] active:translate-y-[6px] hover:bg-yellow-100 touch-feedback"
8                        className="w-full p-4 font-black text-xl bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all active:scale-[0.97] active:shadow-none active:translate-x-[6px] active:translate-y-[6px] hover:bg-yellow-100 btn-press animate-bounce-in-delayed"
                        style={{ animationDelay: '0.1s' }}
                    >
                        Deutsch
                    </button>
                </div>
            </div>
        </div>
    );
};

// Sarcasm level labels
const SARCASM_LEVELS = {
    en: [
        { level: 1, label: "Mildly Annoyed", desc: "Polite disappointment" },
        { level: 2, label: "Eye Roll", desc: "Passive-aggressive sighing" },
        { level: 3, label: "Properly British", desc: "Dry wit & backhanded compliments" },
        { level: 4, label: "Savage", desc: "No mercy, no survivors" },
        { level: 5, label: "Nuclear", desc: "Verbal war crimes" }
    ],
    de: [
        { level: 1, label: "Leicht Genervt", desc: "Höfliche Enttäuschung" },
        { level: 2, label: "Augenrollen", desc: "Passiv-aggressives Seufzen" },
        { level: 3, label: "Typisch Deutsch", desc: "Bürokratische Verachtung" },
        { level: 4, label: "Brutal", desc: "Keine Gnade, keine Überlebenden" },
        { level: 5, label: "Atomar", desc: "Verbale Kriegsverbrechen" }
    ]
};

const SettingsModal = ({
    isOpen,
    onClose,
    language,
    setLanguage,
    onPlayAudio,
    hasAudio,
    autoPlay,
    setAutoPlay,
    sarcasmLevel,
    setSarcasmLevel,
    isPlaying,
    step,
    onRegenerateWithLanguage
}: any) => {
    const [showLanguageConfirm, setShowLanguageConfirm] = useState(false);
    const [pendingLanguage, setPendingLanguage] = useState<'en' | 'de' | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const confirmModalRef = useRef<HTMLDivElement>(null);

    // Focus trap and escape key handling
    const handleClose = useCallback(() => {
        if (showLanguageConfirm) {
            setShowLanguageConfirm(false);
            setPendingLanguage(null);
        } else {
            onClose();
        }
    }, [showLanguageConfirm, onClose]);

    useFocusTrap(isOpen && !showLanguageConfirm, modalRef);
    useFocusTrap(showLanguageConfirm, confirmModalRef);
    useEscapeKey(isOpen, handleClose);

    // Focus trap with Escape to close (only when confirmation dialog is not shown)
    const focusTrapRef = useFocusTrap(isOpen && !showLanguageConfirm, onClose);

    // Focus trap for confirmation dialog
    const confirmFocusTrapRef = useFocusTrap(showLanguageConfirm, () => {
        setShowLanguageConfirm(false);
        setPendingLanguage(null);
    });

    // Roving tabindex for language buttons
    const { getItemProps: getLangItemProps } = useRovingTabIndex<HTMLButtonElement>(2, 'horizontal');

    // Roving tabindex for confirmation dialog buttons
    const { getItemProps: getConfirmItemProps } = useRovingTabIndex<HTMLButtonElement>(2, 'horizontal');

    // Generate unique IDs for ARIA
    const autoPlayId = useRef(`autoplay-toggle-${Math.random().toString(36).substr(2, 9)}`).current;

    if (!isOpen) return null;

    const handleLanguageChange = (newLang: 'en' | 'de') => {
        if (newLang === language) return;
        triggerHaptic('light');

        // If viewing results, show confirmation
        if (step === 'result') {
            setPendingLanguage(newLang);
            setShowLanguageConfirm(true);
        } else {
            setLanguage(newLang);
        }
    };

    const confirmLanguageChange = () => {
        if (pendingLanguage) {
            setLanguage(pendingLanguage);
            onRegenerateWithLanguage(pendingLanguage);
            setShowLanguageConfirm(false);
            setPendingLanguage(null);
            onClose();
        }
    };

    const cancelLanguageChange = () => {
        setShowLanguageConfirm(false);
        setPendingLanguage(null);
    };

    // Handle toggle with keyboard
    const handleToggleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setAutoPlay(!autoPlay);
        }
    };

    const t = {
        title: language === 'de' ? 'Einstellungen' : 'Settings',
        languageLabel: language === 'de' ? 'Sprach-Protokoll' : 'Language Protocol',
        autoPlayLabel: language === 'de' ? 'Beleidigungen automatisch abspielen' : 'Auto-play Insults',
        lastTransmission: language === 'de' ? 'Letzte Übertragung' : 'Last Transmission',
        replayAudio: language === 'de' ? 'Audio wiederholen' : 'Replay Audio',
        playing: language === 'de' ? 'Spielt ab...' : 'Playing...',
        closeSettings: language === 'de' ? 'Einstellungen schließen' : 'Close settings'
    };

    const autoPlayId = "autoplay-toggle";
    const languageGroupId = "language-selection";

    return (
        <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-modal-title"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div ref={focusTrapRef} className="bg-white wobbly-box p-6 md:p-8 max-w-xs md:max-w-sm w-full relative">
                 <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
                    aria-label={t.closeSettings}
        >
            <div
                ref={modalRef}
                className="bg-white wobbly-box p-6 md:p-8 max-w-xs md:max-w-sm w-full relative"
            >
                 <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 min-w-[44px] min-h-[44px] hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center"
                    aria-label={t.closeSettings}
                    className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors focus-ring"
                >
                    <X size={24} aria-hidden="true" />
                </button>

                <h2 id="settings-modal-title" className="text-2xl font-black mb-6 flex items-center gap-2">
                    <Settings className="animate-spin-slow" aria-hidden="true" /> {t.title}
                <h2 className="text-2xl heading-lg tracking-tight mb-6 flex items-center gap-2">
                    <Settings className="animate-spin-slow" /> {t.title}
                </h2>

                <div className="space-y-6">
                    {/* Language Switch */}
                    <fieldset className="space-y-2">
                        <legend id={languageGroupId} className="font-bold text-gray-600 block">{t.languageLabel}</legend>
                    <div className="space-y-2">
                        <label id="language-group-label" className="font-bold text-gray-600 block">{t.languageLabel}</label>
                        {step === 'result' && (
                            <div className="text-xs text-amber-600 mb-2 flex items-start gap-1" role="alert">
                        <label className="label text-sm text-gray-600 block">{t.languageLabel}</label>
                        {step === 'result' && (
                            <div className="text-xs text-amber-700 mb-2 flex items-start gap-1" role="alert">
                                <span aria-hidden="true">⚠️</span>
                                <span>{language === 'de' ? 'Sprachwechsel erzeugt neues Ergebnis' : 'Changing language will regenerate result'}</span>
                            </div>
                        )}
                        <div className="flex gap-2" role="group" aria-labelledby="language-group-label">
                        <div className="flex gap-2" role="radiogroup" aria-labelledby={languageGroupId}>
                            <button
                                {...getLangItemProps(0)}
                                onClick={() => handleLanguageChange('en')}
                                aria-pressed={language === 'en'}
                                className={`flex-1 p-3 font-bold border-2 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 ${
                                className={`flex-1 p-3 min-h-[48px] font-bold border-2 transition-all ${
                                    language === 'en'
                                    ? 'bg-black text-white border-black transform -rotate-1 shadow-md'
                                    : 'bg-white text-gray-600 border-gray-300 hover:border-black'
                                className={`flex-1 p-3 font-bold border-2 transition-all focus-ring ${
                                    language === 'en'
                                    ? 'bg-black text-white border-black transform -rotate-1 shadow-md'
                                    : 'bg-white text-gray-400 border-gray-200 hover:border-black hover:bg-gray-50'
                                }`}
                                role="radio"
                                aria-checked={language === 'en'}
                                aria-label="English"
                            >
                                English
                            </button>
                            <button
                                {...getLangItemProps(1)}
                                onClick={() => handleLanguageChange('de')}
                                aria-pressed={language === 'de'}
                                className={`flex-1 p-3 font-bold border-2 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 ${
                                className={`flex-1 p-3 min-h-[48px] font-bold border-2 transition-all ${
                                    language === 'de'
                                    ? 'bg-black text-white border-black transform rotate-1 shadow-md'
                                    : 'bg-white text-gray-600 border-gray-300 hover:border-black'
                                className={`flex-1 p-3 font-bold border-2 transition-all focus-ring ${
                                    language === 'de'
                                    ? 'bg-black text-white border-black transform rotate-1 shadow-md'
                                    : 'bg-white text-gray-400 border-gray-200 hover:border-black hover:bg-gray-50'
                                }`}
                                role="radio"
                                aria-checked={language === 'de'}
                                aria-label="Deutsch"
                            >
                                Deutsch
                            </button>
                        </div>
                    </fieldset>

                    {/* Auto Play Toggle */}
                    <div className="flex items-center justify-between">
                         <label id={autoPlayId} className="font-bold text-gray-600">{t.autoPlayLabel}</label>
                         <label htmlFor={autoPlayId} className="font-bold text-gray-600 cursor-pointer">
                            {t.autoPlayLabel}
                         </label>
                         <label className="label text-sm text-gray-600">{t.autoPlayLabel}</label>
                         <button
                            id={autoPlayId}
                            onClick={() => setAutoPlay(!autoPlay)}
                            onKeyDown={handleToggleKeyDown}
                            role="switch"
                            aria-checked={autoPlay}
                            aria-labelledby={autoPlayId}
                            className={`w-14 h-8 rounded-full border-2 border-black flex items-center px-1 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 ${
                            className={`w-14 h-8 min-w-[56px] rounded-full border-2 border-black flex items-center px-1 transition-all ${
                            className={`w-14 h-8 rounded-full border-2 border-black flex items-center px-1 transition-all focus-ring ${
                                autoPlay ? 'bg-green-400 justify-end' : 'bg-gray-200 justify-start'
                            }`}
                            role="switch"
                            aria-checked={autoPlay}
                            aria-label={t.autoPlayLabel}
                        >
                            <div className="w-5 h-5 bg-white border-2 border-black rounded-full shadow-sm" aria-hidden="true"></div>
                            <div className={`w-5 h-5 bg-white border-2 border-black rounded-full shadow-sm transition-transform ${autoPlay ? 'scale-110' : 'scale-100'}`}></div>
                         </button>
                    </div>

                    {/* Sarcasm Level Slider */}
                    <div className="space-y-3 pt-4 border-t-2 border-dashed border-gray-200">
                        <label className="font-bold text-gray-600 block">
                            {language === 'de' ? 'Brutalitätsstufe' : 'Brutality Level'}
                        </label>
                        <div className="relative">
                            {/* Custom slider track */}
                            <div className="relative h-3 bg-gradient-to-r from-yellow-200 via-orange-400 to-red-600 border-2 border-black rounded-full">
                                {/* Slider markers */}
                                <div className="absolute inset-0 flex justify-between px-1 items-center">
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <div
                                            key={n}
                                            className={`w-1.5 h-1.5 rounded-full transition-all ${
                                                n <= sarcasmLevel ? 'bg-black' : 'bg-white/50'
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>
                            {/* Invisible range input for interaction */}
                            <input
                                type="range"
                                min="1"
                                max="5"
                                value={sarcasmLevel}
                                onChange={(e) => {
                                    playClickSound();
                                    setSarcasmLevel(parseInt(e.target.value, 10));
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            {/* Custom thumb indicator */}
                            <div
                                className="absolute top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-150"
                                style={{ left: `calc(${((sarcasmLevel - 1) / 4) * 100}% - ${sarcasmLevel === 1 ? '0px' : sarcasmLevel === 5 ? '24px' : '12px'})` }}
                            >
                                <div className="w-6 h-6 bg-white border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-xs font-black">
                                    {sarcasmLevel}
                                </div>
                            </div>
                        </div>
                        {/* Level display */}
                        <div className="text-center">
                            <div className="text-lg font-black">
                                {sarcasmLevel}/5 — {SARCASM_LEVELS[language][sarcasmLevel - 1].label}
                            </div>
                            <div className="text-xs text-gray-500 italic">
                                {SARCASM_LEVELS[language][sarcasmLevel - 1].desc}
                            </div>
                        </div>
                    </div>

                     {/* Audio Playback */}
                     {hasAudio && (
                        <div className="pt-4 border-t-2 border-dashed border-gray-200">
                             <p className="font-bold text-gray-600 block mb-2">{t.lastTransmission}</p>
                             <button
                                onClick={onPlayAudio}
                                disabled={isPlaying}
                                className="w-full p-4 border-2 border-black bg-yellow-300 font-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 active:shadow-none active:translate-x-[4px] active:translate-y-[4px] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
                                aria-live="polite"
                                className="w-full p-4 min-h-[56px] border-2 border-black bg-yellow-300 font-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 active:shadow-none active:translate-x-[4px] active:translate-y-[4px] disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label={isPlaying ? t.playing : t.replayAudio}
                                aria-disabled={isPlaying}
                             <label className="label text-sm text-gray-600 block mb-2">{t.lastTransmission}</label>
                             <button
                                onClick={onPlayAudio}
                                disabled={isPlaying}
                                className="w-full p-4 border-2 border-black bg-yellow-300 font-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 active:shadow-none active:translate-x-[4px] active:translate-y-[4px] disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
                            >
                                <Volume2 size={24} className={isPlaying ? "animate-pulse" : ""} aria-hidden="true" />
                                {isPlaying ? t.playing : t.replayAudio}
                            </button>
                        </div>
                     )}
                </div>
            </div>

            {/* Language Change Confirmation Dialog */}
            {showLanguageConfirm && (
                <div
                    className="absolute inset-0 bg-black/70 flex items-center justify-center p-4 z-10"
                    role="alertdialog"
                    aria-modal="true"
                    aria-labelledby="confirm-dialog-title"
                    aria-describedby="confirm-dialog-desc"
                >
                    <div ref={confirmFocusTrapRef} className="bg-white wobbly-box p-6 max-w-xs w-full">
                        <h3 id="confirm-dialog-title" className="text-xl font-black mb-3">
                            <span aria-hidden="true">⚠️</span> {language === 'de' ? 'Sprache wechseln?' : 'Change Language?'}
                        </h3>
                        <p id="confirm-dialog-desc" className="text-gray-700 mb-4 leading-relaxed">
                    <div ref={confirmModalRef} className="bg-white wobbly-box p-6 max-w-xs w-full">
                        <h3 id="confirm-dialog-title" className="text-xl font-black mb-3">
                            <span aria-hidden="true">⚠️ </span>
                            {language === 'de' ? 'Sprache wechseln?' : 'Change Language?'}
                        </h3>
                        <p id="confirm-dialog-desc" className="text-gray-700 mb-4 leading-relaxed">
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4 z-10">
                    <div className="bg-white wobbly-box p-6 max-w-xs w-full">
                        <h3 className="text-xl heading-md tracking-tight mb-3">
                            {language === 'de' ? '⚠️ Sprache wechseln?' : '⚠️ Change Language?'}
                        </h3>
                        <p className="text-gray-700 mb-4 body-lg">
                            {language === 'de'
                                ? 'Das Ergebnis wird neu generiert, um die Antwort und das Audio in der neuen Sprache zu erhalten.'
                                : 'This will regenerate the result to get the response and audio in the new language.'}
                        </p>
                        <div className="flex gap-2" role="group">
                            <button
                                {...getConfirmItemProps(0)}
                                onClick={cancelLanguageChange}
                                className="flex-1 p-3 border-2 border-gray-300 text-gray-600 font-bold hover:bg-gray-100 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
                                className="flex-1 p-3 min-h-[48px] border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-100 transition-all"
                                className="flex-1 p-3 border-2 border-gray-300 text-gray-600 font-bold hover:bg-gray-100 transition-all focus-ring"
                            >
                                {language === 'de' ? 'Abbrechen' : 'Cancel'}
                            </button>
                            <button
                                {...getConfirmItemProps(1)}
                                onClick={confirmLanguageChange}
                                className="flex-1 p-3 bg-black text-white font-bold border-2 border-black hover:bg-gray-800 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
                                className="flex-1 p-3 min-h-[48px] bg-black text-white font-bold border-2 border-black hover:bg-gray-800 transition-all"
                                className="flex-1 p-3 bg-black text-white font-bold border-2 border-black hover:bg-gray-800 transition-all focus-ring"
                            >
                                {language === 'de' ? 'Neu generieren' : 'Regenerate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Onboarding Guide Component ---
const OnboardingGuide = ({
    step,
    onNext,
    onClose,
    refs,
    language
}: {
    step: number,
    onNext: () => void,
    onClose: () => void,
    refs: {
        settings: React.RefObject<HTMLButtonElement | null>,
        input: React.RefObject<HTMLTextAreaElement | null>,
        button: React.RefObject<HTMLButtonElement | null>
    },
    language: 'en' | 'de'
}) => {
    const annotationRef = useRef<any>(null);
    const nextButtonRef = useRef<HTMLButtonElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'Escape':
                    e.preventDefault();
                    onClose();
                    break;
                case 'Enter':
                case ' ':
                    // Only if focused on a non-button element or the container
                    if (document.activeElement?.tagName !== 'BUTTON') {
                        e.preventDefault();
                        onNext();
                    }
                    break;
                case 'ArrowRight':
                case 'ArrowDown':
                    e.preventDefault();
                    onNext();
                    break;
                case 'ArrowLeft':
                case 'ArrowUp':
                    // Could add previous step if desired
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onNext, onClose]);

    // Auto-focus the next button when step changes
    useEffect(() => {
        setTimeout(() => nextButtonRef.current?.focus(), 100);
    }, [step]);
    const guideRef = useRef<HTMLDivElement>(null);

    // Focus trap and escape key for the guide
    useFocusTrap(true, guideRef);
    useEscapeKey(true, onClose);

    const stepsEn = [
        {
            title: "Welcome to The Silencer",
            text: "Encountered an ego that needs deflating? Someone confidently incorrect? This tool analyzes their statement and dismantles it with surgical sarcasm.",
            target: null,
            position: "center"
        },
        {
            title: "Input The Stupidity",
            text: "Paste the dumb statement here. Or click the Mic button to dictate it yourself. (The app will read the roast back to you in the results).",
            target: refs.input,
            position: "bottom"
        },
        {
            title: "Destroy It",
            text: "Hit this button to consult the archives of cringe. We'll generate a 'Kill Shot' comeback and a technical autopsy of why they're wrong.",
            target: refs.button,
            position: "top"
        },
        {
            title: "Configuration",
            text: "Choose your flavor of destruction: British Cynicism (Default) or German Efficiency. This also controls the voice for the results.",
            target: refs.settings,
            position: "left"
        }
    ];

    const stepsDe = [
        {
            title: "Willkommen beim Rausschmeißer",
            text: "Ein Ego entdeckt, das mal runtergeholt werden muss? Jemand, der selbstbewusst Quatsch erzählt? Dieses Tool analysiert die Aussage und zerlegt sie mit chirurgischem Sarkasmus.",
            target: null,
            position: "center"
        },
        {
            title: "Blödsinn eingeben",
            text: "Hier den dummen Spruch einfügen. Oder auf das Mikrofon klicken und selbst diktieren. (Die App liest dir die Antwort im Ergebnis vor).",
            target: refs.input,
            position: "bottom"
        },
        {
            title: "Vernichten",
            text: "Drück diesen Knopf, um das Archiv des Fremdschämens zu befragen. Wir generieren einen 'Gnadenschuss' und eine technische Obduktion, warum die Person falsch liegt.",
            target: refs.button,
            position: "top"
        },
        {
            title: "Konfiguration",
            text: "Wähle deine Zerstörungsart: Britischer Zynismus (Standard) oder Deutsche Effizienz. Dies steuert auch die Stimme für die Ergebnisse.",
            target: refs.settings,
            position: "left"
        }
    ];

    const steps = language === 'de' ? stepsDe : stepsEn;
    const totalSteps = steps.length;

    const currentStepData = steps[step] || steps[0];

    useEffect(() => {
        // Clear previous annotation immediately
        if (annotationRef.current) {
            annotationRef.current.remove();
            annotationRef.current = null;
        }

        let timer: NodeJS.Timeout;

        if (currentStepData.target && currentStepData.target.current) {
            timer = setTimeout(() => {
                if (!currentStepData.target?.current) return;
                const annotation = annotate(currentStepData.target.current!, {
                    type: 'box',
                    color: '#f59e0b', // Amber-500
                    padding: 8,
                    strokeWidth: 4,
                    iterations: 3,
                    animationDuration: 400
                });
                annotation.show();
                annotationRef.current = annotation;
            }, 100);
        }

        return () => {
            clearTimeout(timer);
            if (annotationRef.current) {
                annotationRef.current.remove();
                annotationRef.current = null;
            }
        };
    }, [step, currentStepData]);

    // Positioning logic: Return classes for the Wrapper (Position + Flex Alignment)
    // We use w-full left-0 to align the wrapper to the card container, then use justify-* to align the note inside.
    const getPositionClass = (pos: string) => {
        switch(pos) {
            case "bottom": 
                 // Input step - position below input area, accounting for different screen sizes
                 return "top-[55%] md:top-[58%] justify-center";
            case "top": 
                 // Button step
                 return "bottom-16 md:bottom-24 justify-center";
            case "left": 
                 // Settings step
                 // Mobile: Center Top
                 // Desktop: Right Align
                 return "top-12 justify-center md:top-16 md:justify-end md:pr-16";
            default: 
                 // Center (Welcome step)
                 // Note: We use -translate-y-1/2 on the positioning wrapper here for vertical centering
                 return "top-1/2 -translate-y-1/2 justify-center";
        }
    };

    const totalSteps = steps.length;
    const closeLabel = language === 'de' ? 'Tour schließen' : 'Close tour';
    const stepLabel = language === 'de'
        ? `Schritt ${step + 1} von ${totalSteps}`
        : `Step ${step + 1} of ${totalSteps}`;

    return (
        <div
            className="absolute inset-0 z-50 pointer-events-none flex flex-col items-center justify-center overflow-visible"
            role="dialog"
            aria-modal="true"
            aria-label={language === 'de' ? `Tour Schritt ${step + 1} von ${totalSteps}` : `Tour step ${step + 1} of ${totalSteps}`}
            aria-label={language === 'de' ? 'Anleitung Tour' : 'Onboarding Tour'}
        >
             {/* Backdrop for step 0 to focus attention */}
             {step === 0 && (
                <div
                    className="absolute inset-0 bg-white/50 backdrop-blur-sm -z-10 pointer-events-auto"
                    onClick={onClose}
                    aria-hidden="true"
                ></div>
             )}

             {/* Positioning Wrapper: Handles Static Layout Position (Top/Bottom) and Flex Alignment */}
             <div
                key={`wrapper-${step}`}
                className={`absolute left-0 w-full flex ${getPositionClass(currentStepData.position)} transition-all duration-300 pointer-events-none`}
             >
                {/* Animation Wrapper: Handles the Float/Bobbing Animation */}
                <div className="animate-float">

                     {/* The Sticky Note Visual: Handles Entrance Animation (Slap) and Interactivity */}
                     <div className="w-[85vw] max-w-[300px] md:max-w-xs bg-yellow-200 text-black p-5 md:p-6 shadow-xl border-2 border-yellow-400/50 animate-slap origin-center pointer-events-auto mx-4" style={{ borderRadius: '2px 255px 5px 25px / 255px 5px 225px 5px' }}>
                     <div
                        ref={guideRef}
                        className="w-[85vw] max-w-[300px] md:max-w-xs bg-yellow-200 text-black p-5 md:p-6 shadow-xl border-2 border-yellow-400/50 animate-slap origin-center pointer-events-auto mx-4"
                        style={{ borderRadius: '2px 255px 5px 25px / 255px 5px 225px 5px' }}
                        role="region"
                        aria-labelledby={`tour-step-title-${step}`}
                     >

                        {/* Tape */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-white/40 rotate-1" aria-hidden="true"></div>

                        <button
                            ref={closeButtonRef}
                            onClick={onClose}
                            className="absolute -top-2 -right-2 bg-white rounded-full p-1 border border-gray-200 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
                            aria-label={language === 'de' ? 'Tour schließen' : 'Close tour'}
                            onClick={onClose}
                            className="absolute -top-2 -right-2 bg-white rounded-full p-2 min-w-[36px] min-h-[36px] border border-gray-200 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center"
                            aria-label={closeLabel}
                            className="absolute -top-2 -right-2 bg-white rounded-full p-1 border border-gray-200 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors focus-ring"
                        >
                            <X size={16} aria-hidden="true" />
                        </button>

                        <h3 id={`tour-step-${step}-title`} className="font-black text-lg mb-2 flex items-center gap-2">
                            <span className="bg-black text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shrink-0" aria-hidden="true">{step + 1}</span>
                            <span className="sr-only">{language === 'de' ? `Schritt ${step + 1}:` : `Step ${step + 1}:`}</span>
                            {currentStepData.title}
                        </h3>

                        <p id={`tour-step-${step}-desc`} className="font-hand text-sm md:text-base leading-tight mb-4 text-gray-800">
                            {currentStepData.text}
                        </p>

                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500" aria-hidden="true">
                                {step + 1}/{totalSteps}
                            </span>
                            <button
                                ref={nextButtonRef}
                                onClick={onNext}
                                className="bg-black text-white px-3 py-1.5 md:px-4 md:py-2 font-bold transform rotate-1 hover:-rotate-1 transition-transform flex items-center gap-2 text-xs md:text-sm border-2 border-transparent hover:border-black hover:bg-white hover:text-black focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
                                aria-describedby={`tour-step-${step}-desc`}
                        <h3 id={`tour-step-title-${step}`} className="font-black text-lg mb-2 flex items-center gap-2">
                            <span
                                className="bg-black text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shrink-0"
                                aria-hidden="true"
                            >
                                {step + 1}
                            </span>
                            <span className="sr-only">{stepLabel}: </span>
                            {currentStepData.title}
                        </h3>

                        <p className="font-hand text-sm md:text-base leading-tight mb-4 text-gray-800">
                        <h3 className="heading-md text-lg tracking-tight mb-2 flex items-center gap-2">
                            <span className="bg-black text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shrink-0">{step + 1}</span>
                            {currentStepData.title}
                        </h3>

                        <p className="font-hand text-sm md:text-base body-md mb-4 text-gray-800">
                            {currentStepData.text}
                        </p>

                        <div className="flex justify-end">
                            <button
                                onClick={onNext}
                                className="bg-black text-white px-4 py-2 min-h-[44px] font-bold transform rotate-1 hover:-rotate-1 transition-transform flex items-center gap-2 text-sm border-2 border-transparent hover:border-black hover:bg-white hover:text-black"
                                aria-label={step === totalSteps - 1
                                    ? (language === 'de' ? 'Tour beenden' : 'Finish tour')
                                    : (language === 'de' ? `Weiter zu Schritt ${step + 2}` : `Continue to step ${step + 2}`)
                                }
                            >
                                {step === totalSteps - 1
                                className="bg-black text-white px-3 py-1.5 md:px-4 md:py-2 font-bold transform rotate-1 hover:-rotate-1 transition-all flex items-center gap-2 text-xs md:text-sm border-2 border-transparent hover:border-black hover:bg-white hover:text-black focus-ring active:scale-95"
                            >
                                {step === steps.length - 1
                                    ? (language === 'de' ? "Verstanden" : "Got it")
                                    : (language === 'de' ? "Weiter" : "Next")
                                } <ArrowRight size={14} aria-hidden="true" />
                            </button>
                        </div>
                     </div>
                </div>
             </div>
        </div>
    );
};


const ResultSection = ({
    title,
    text,
    color,
    delay,
    headerWidth = "w-48",
    animationDelay = 0,
    language
}: {
    title: string,
    text: string,
    color: string,
    delay: number,
    headerWidth?: string,
    animationDelay?: number,
    language: 'en' | 'de'
}) => {
    const [highlighted, setHighlighted] = useState(false);
    const [visible, setVisible] = useState(false);
    const sectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), animationDelay);
        return () => clearTimeout(timer);
    }, [animationDelay]);

    // Check if any child element has focus (for keyboard navigation highlight)
    const handleFocusIn = () => setHighlighted(true);
    const handleFocusOut = (e: React.FocusEvent) => {
        // Only remove highlight if focus is leaving this section entirely
        if (!sectionRef.current?.contains(e.relatedTarget as Node)) {
            setHighlighted(false);
        }
    };

    return (
        <div
            ref={sectionRef}
            className={`relative mt-8 group transition-all duration-500 ease-out ${
                visible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: `${animationDelay}ms` }}
            onMouseEnter={() => setHighlighted(true)}
            onMouseLeave={() => setHighlighted(false)}
            onFocus={handleFocusIn}
            onBlur={handleFocusOut}
            role="region"
            aria-label={title}
        >
             {/* Header */}
             <div className={`absolute -top-6 -left-2 ${headerWidth} h-12 z-20 pointer-events-none`} aria-hidden="true">
                <ScribbleHeader text={title} color={color} delay={delay} />
            </div>

            {/* Content Box */}
            <RoughHighlight
                show={highlighted}
                type="box"
                color={color}
                padding={8}
                strokeWidth={2}
                animationDuration={300}
            >
                <div className={`bg-white/50 border border-gray-200 border-dashed rounded-lg p-5 md:p-6 pt-8 text-lg md:text-xl leading-relaxed text-gray-800 relative transition-all duration-300 group-hover:border-transparent group-hover:bg-transparent group-focus-within:border-transparent group-focus-within:bg-transparent ${
                    highlighted ? 'transform -translate-y-1 shadow-lg' : ''
                <div className={`bg-white/50 border border-gray-200 border-dashed rounded-lg p-5 md:p-6 pt-8 text-lg md:text-xl body-lg text-gray-800 relative transition-all duration-300 group-hover:border-transparent group-hover:bg-transparent ${
                    hovered ? 'transform -translate-y-1 shadow-lg' : ''
                }`}>
                    <CopyButton text={text} language={language} />
                    <div className="prose prose-lg prose-p:font-hand body-lg">
                        <p>{text}</p>
                    </div>
                </div>
            </RoughHighlight>
        </div>
    );
};

const App = () => {
  const [input, setInput] = useState("");
  const [step, setStep] = useState<'input' | 'loading' | 'rage' | 'result'>('input');
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES_EN[0]);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES_EN[0]);

  // Premium polish hooks
  const { keyboardHeight, isKeyboardVisible } = useKeyboardAvoidance();
  const [loadingPhase, setLoadingPhase] = useState<'skeleton' | 'pong'>('skeleton');
  const [isExiting, setIsExiting] = useState(false);

  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [showLanguageSelect, setShowLanguageSelect] = useState(() => {
    // Show language selection if not set before
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('language_selected');
    }
    return false;
  });
  const [language, setLanguage] = useState<'en' | 'de'>(() => {
    // Load from localStorage on init
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('user_language') as 'en' | 'de') || 'en';
    }
    return 'en';
  });
  const [autoPlay, setAutoPlay] = useState(true);
  const [sarcasmLevel, setSarcasmLevel] = useState<number>(() => {
    // Load from localStorage on init (default: 3 - "Properly Annoyed")
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sarcasm_level');
      return saved ? parseInt(saved, 10) : 3;
    }
    return 3;
  });
  const [apiKey, setApiKey] = useState(() => {
    // Load from environment variable first, then localStorage
    if (typeof window !== 'undefined') {
      return import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || '';
    }
    return '';
  });

  // Roast Counter State
  const [roastCount, setRoastCount] = useState(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('roast_count') || '0', 10);
    }
    return 0;
  });

  // Save API key to localStorage when it changes
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('gemini_api_key', apiKey);
    }
  }, [apiKey]);

  // Save language preference when it changes and update HTML lang attribute
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_language', language);
      // Update HTML lang attribute for screen readers
      const htmlElement = document.getElementById('html-root') || document.documentElement;
      htmlElement.setAttribute('lang', language === 'de' ? 'de' : 'en');
    }
  }, [language]);

  // Save sarcasm level when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sarcasm_level', sarcasmLevel.toString());
    }
  }, [sarcasmLevel]);

  // Tour State
  const [tourStep, setTourStep] = useState<number | null>(null);

  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Voice Input State
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Refs for specific highlighting
  const killShotRef = useRef<HTMLHeadingElement>(null);

  // Refs for Onboarding
  const settingsBtnRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const actionBtnRef = useRef<HTMLButtonElement>(null);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to submit (only when on input screen and input has content)
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && step === 'input' && input.trim()) {
        e.preventDefault();
        playClickSound();
        handleSilencer();
      }

      // Ctrl/Cmd + M to toggle mic
      if ((e.ctrlKey || e.metaKey) && e.key === 'm' && step === 'input') {
        e.preventDefault();
        toggleRecording();
      }

      // Ctrl/Cmd + , to open settings
      if ((e.ctrlKey || e.metaKey) && e.key === ',' && !showSettings && !showLanguageSelect) {
        e.preventDefault();
        setShowSettings(true);
      }

      // Ctrl/Cmd + N for new target (result screen)
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && step === 'result') {
        e.preventDefault();
        reset();
      }

      // Ctrl/Cmd + P to play audio (result screen)
      if ((e.ctrlKey || e.metaKey) && e.key === 'p' && step === 'result' && audioBufferRef.current && !isPlaying) {
        e.preventDefault();
        playAudio();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [step, input, showSettings, showLanguageSelect, isPlaying]);

  // Focus input on load
  useEffect(() => {
    if (step === 'input' && !showSettings && !showLanguageSelect && tourStep === null) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [step, showSettings, showLanguageSelect, tourStep]);
  // Pull to Refresh
  const { pullDistance, isRefreshing, containerRef: pullRefreshRef } = usePullToRefresh(
    () => {
      if (step === 'result') {
        reset();
      }
    },
    step === 'result' // Only enabled on result screen
  );

  // Initialize Audio Context on user interaction (if possible)
  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  // Cycle loading messages and handle loading phases
  useEffect(() => {
    if (step === 'loading') {
        const messages = language === 'de' ? LOADING_MESSAGES_DE : LOADING_MESSAGES_EN;
        let i = 0;
        setLoadingMsg(messages[0]);
        setLoadingPhase('skeleton');

        // Transition from skeleton to pong after a brief delay
        const skeletonTimer = setTimeout(() => {
            setLoadingPhase('pong');
        }, 800);

        const interval = setInterval(() => {
            i = (i + 1) % messages.length;
            setLoadingMsg(messages[i]);
        }, 1200);

        return () => {
            clearInterval(interval);
            clearTimeout(skeletonTimer);
        };
    }
  }, [step, language]);

  // Trigger highlighter on kill shot
  useEffect(() => {
    if (step === 'result' && killShotRef.current) {
      const timer = setTimeout(() => {
          const annotation = annotate(killShotRef.current!, {
            type: 'highlight',
            color: '#fff176', 
            animationDuration: 800,
            multiline: true,
            iterations: 2,
            padding: 4
          });
          annotation.show();
      }, 300); 
      return () => clearTimeout(timer);
    }
  }, [step, result]);

  const toggleRecording = () => {
    triggerHaptic('light');
    if (isRecording) {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsRecording(false);
        return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
        setError(language === 'de' 
            ? "Tut mir leid, dein Browser kann nicht zuhören. Probier Chrome." 
            : "Sorry mate, your browser doesn't do the listening thing. Try Chrome."
        );
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language === 'de' ? 'de-DE' : 'en-US';

    recognition.onstart = () => {
        setIsRecording(true);
        setInputFocused(true);
        setError("");
    };

    recognition.onend = () => {
        setIsRecording(false);
    };

    recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
        if (event.error === 'not-allowed') {
             setError(language === 'de' 
                ? "Mikrofon-Zugriff verweigert. Prüfe deine Browser-Einstellungen." 
                : "Mic access denied. Check your browser settings."
            );
        }
    };

    recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            }
        }
        
        if (finalTranscript) {
             setInput(prev => {
                const spacer = prev.length > 0 && !prev.endsWith(' ') ? ' ' : '';
                return prev + spacer + finalTranscript;
             });
        }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) {
        // Already stopped
      }
      audioSourceRef.current = null;
    }
    setIsPlaying(false);
  };

  const playAudio = async () => {
    if (!audioBufferRef.current || !audioContextRef.current) return;

    // Stop any currently playing audio
    stopAudio();

    // Ensure context is running
    if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.connect(audioContextRef.current.destination);
    source.onended = () => {
      setIsPlaying(false);
      audioSourceRef.current = null;
    };

    audioSourceRef.current = source;
    setIsPlaying(true);
    source.start();
  };

  const handleSilencer = async (forcedLanguage?: 'en' | 'de') => {
    if (!input.trim()) return;

    // Use forced language if provided, otherwise use state language
    const activeLanguage = forcedLanguage || language;

    if (!apiKey.trim()) {
        setError(activeLanguage === 'de'
            ? "API-Schlüssel fehlt. Füge ihn in den Einstellungen hinzu."
            : "API Key is missing. Add it in Settings."
        );
        setShowSettings(true);
        return;
    }

    // Show button loading state briefly before transitioning
    setBtnLoading(true);

    // Stop recording if active
    if (isRecording) {
        recognitionRef.current?.stop();
        setIsRecording(false);
    }

    // Stop any currently playing audio
    stopAudio();

    // Init audio context immediately on click
    initAudioContext();

    // Brief delay to show button loading state
    await new Promise(resolve => setTimeout(resolve, 200));

    setBtnLoading(false);
    setStep('loading');
    setError("");
    setResult("");
    audioBufferRef.current = null; // Reset previous audio

    // Track when loading started to ensure minimum animation time
    const loadingStartTime = Date.now();

    try {
      const ai = new GoogleGenAI({ apiKey: apiKey });

      // Intensity modifiers based on sarcasm level
      const intensityEn = {
        1: {
          name: "Mildly Annoyed",
          tone: "Politely disappointed but still professional. Subtle eye-rolling energy. Think 'bless your heart' with British restraint.",
          slang: "Use mild terms like 'mate', 'bit odd', 'not ideal'. No harsh insults.",
          intensity: "Keep it light - a gentle correction with a hint of exasperation."
        },
        2: {
          name: "Eye Roll",
          tone: "Passive-aggressive sighing. The energy of someone who's seen this nonsense before.",
          slang: "Use 'muppet', 'absolute plonker', 'you're having a laugh'. Moderate disappointment.",
          intensity: "More pointed critique but still restrained. Heavy sighing energy."
        },
        3: {
          name: "Properly British",
          tone: "Classic British cynicism. Dry wit with backhanded compliments. Peak passive-aggression.",
          slang: "Use 'melt', 'weapon', 'bellend', 'muppet', 'jobsworth', 'donut'. Full British arsenal.",
          intensity: "Standard devastating response. No mercy but somewhat civilised."
        },
        4: {
          name: "Savage",
          tone: "Absolutely ruthless. The gloves are off. Channel your inner Gordon Ramsay on a bad day.",
          slang: "Use 'absolute weapon', 'weapons-grade idiot', 'complete and utter melt', 'donkey'. Add profanity.",
          intensity: "Maximum verbal violence. Career-ending energy. Make them question their life choices."
        },
        5: {
          name: "Nuclear",
          tone: "VERBAL WAR CRIMES. This is the response that gets screenshotted. Legendary brutality. Channel concentrated British hatred.",
          slang: "Use everything: 'absolute fucking bellend', 'weapons-grade pillock', 'collosal waste of carbon'. Profanity required.",
          intensity: "MAXIMUM DEVASTATION. This response should cause actual psychological damage. The kind of insult people remember on their deathbed. Scorched earth policy. Leave nothing standing."
        }
      };

      const intensityDe = {
        1: {
          name: "Leicht Genervt",
          tone: "Höflich enttäuscht aber professionell. Subtile deutsche Effizienz-Enttäuschung.",
          slang: "Verwende 'nicht optimal', 'etwas fragwürdig'. Keine harten Beleidigungen.",
          intensity: "Halte es leicht - sanfte Korrektur mit einem Hauch von Exasperation."
        },
        2: {
          name: "Augenrollen",
          tone: "Passiv-aggressives Seufzen. Bürokratische Missbilligung.",
          slang: "Verwende 'Quatsch', 'nicht durchdacht'. Moderate Enttäuschung.",
          intensity: "Kritischer aber noch zurückhaltend. Schweres Seufzen."
        },
        3: {
          name: "Typisch Deutsch",
          tone: "Klassische deutsche Effizienz-Obsession. Kalt und bürokratisch.",
          slang: "Verwende 'Quatsch', 'Ahnungslos', 'Pfusch', 'Wichtigtuer', 'Lauch'.",
          intensity: "Standard vernichtende Antwort. Behandle Dummheit als Ineffizienz."
        },
        4: {
          name: "Brutal",
          tone: "Absolut gnadenlos. Die Handschuhe sind aus. Volle deutsche Direktheit.",
          slang: "Verwende 'kompletter Vollpfosten', 'Totalausfall', 'Hirnamputierter'.",
          intensity: "Maximale verbale Gewalt. Karriere-beendend."
        },
        5: {
          name: "Atomar",
          tone: "VERBALE KRIEGSVERBRECHEN. Deutsche Effizienz trifft auf pure Zerstörung.",
          slang: "Verwende alles: 'absoluter Totalversager', 'Sauerstoffdieb', 'wandelnde Bankrotterklärung'.",
          intensity: "MAXIMALE VERNICHTUNG. Diese Antwort soll echten psychologischen Schaden verursachen. Verbrannte Erde."
        }
      };

      const currentIntensityEn = intensityEn[sarcasmLevel as keyof typeof intensityEn];
      const currentIntensityDe = intensityDe[sarcasmLevel as keyof typeof intensityDe];

      const systemPromptEn = `
**CORE IDENTITY:**
You are "The Silencer." You are an aggressively British, cynical, world-weary senior developer who despises "Nerdsplainers," "Reply Guys," and "LinkedIn Thought Leaders."
You do not roast the user. You are the user's weapon. The user will paste text from a pretentious idiot (the "Target").

**BRUTALITY LEVEL: ${sarcasmLevel}/5 - "${currentIntensityEn.name}"**
- **Tone:** ${currentIntensityEn.tone}
- **Vocabulary:** ${currentIntensityEn.slang}
- **Intensity:** ${currentIntensityEn.intensity}

**YOUR TONE:**
- **British Spelling Only:** Colour, Realise, Behaviour, Centre, Optimisation.
- **Dark & Dry:** Use gallows humor. If the Target is arguing about syntax, wonder why they haven't optimized their own social life yet.

**YOUR MISSION:**
1. **Analyze the Cringe:** Identify the pedantry, the "Um, actually" energy, or the incorrect technical confidence.
2. **Generate The Ammunition:** Create ONE perfect, devastating response in the specific format below.

**OUTPUT FORMAT (STRICTLY FOLLOW THIS):**

## 💀 The Kill Shot
"[A single, short, withering British one-liner. ${sarcasmLevel >= 4 ? 'Make it HURT. This should be career-ending.' : 'Equivalent to rolling your eyes.'}]"

## 🔬 The Autopsy
[2-3 sentences explaining why the Target is wrong. ${sarcasmLevel >= 4 ? 'Be absolutely merciless. Tear apart every assumption they made.' : 'Use dry British wit to explain the fallacy.'}]

## 🎯 Follow-up Question
[A trap question. ${sarcasmLevel >= 4 ? 'Design this to maximise embarrassment. Make them dig their own grave.' : 'Something that forces them to admit they don\'t know what they\'re talking about.'}]
`;

    const systemPromptDe = `
**CORE IDENTITY:**
You are "Der Silencer." You are an aggressively German, efficiency-obsessed, world-weary senior developer who despises "Nerdsplainers," "Reply Guys," and "LinkedIn Thought Leaders."
You do not roast the user. You are the user's weapon. The user will paste text from a pretentious idiot (the "Target").

**BRUTALITÄTSSTUFE: ${sarcasmLevel}/5 - "${currentIntensityDe.name}"**
- **Ton:** ${currentIntensityDe.tone}
- **Vokabular:** ${currentIntensityDe.slang}
- **Intensität:** ${currentIntensityDe.intensity}

**YOUR TONE:**
- **Language:** Respond in German.
- **Cold & Bureaucratic:** Treat stupidity as an inefficiency.

**YOUR MISSION:**
1. **Analyze the Cringe:** Identify the pedantry, the "Um, actually" energy, or the incorrect technical confidence.
2. **Generate The Ammunition:** Create ONE perfect, devastating response in the specific format below.

**OUTPUT FORMAT (STRICTLY FOLLOW THIS):**

## 💀 The Kill Shot
"[A single, short, withering German one-liner. ${sarcasmLevel >= 4 ? 'Maximale Zerstörung.' : ''}]"

## 🔬 The Autopsy
"[2-3 sentences explaining why the Target is a 'Lauch'. ${sarcasmLevel >= 4 ? 'Sei absolut gnadenlos.' : 'Erkläre den Fehler mit trockenem deutschem Witz.'}]"

## 🎯 Follow-up Question
"[A trap question. In German. ${sarcasmLevel >= 4 ? 'Maximiere die Peinlichkeit.' : ''}]"
`;

      // 1. Generate Text content first
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: input,
        config: {
          systemInstruction: activeLanguage === 'de' ? systemPromptDe : systemPromptEn,
        },
      });
      
      const text = response.text;
      if (!text) throw new Error("I couldn't hear the rubbish.");

      // 2. Generate Audio while still in loading state
      // Remove section headers, emojis, and markdown formatting
      const cleanText = text
        .replace(/##\s*[💀🔬🎯]?\s*.*?(The Kill Shot|Der Gnadenschuss|The Autopsy|Die Obduktion|Follow-up Question|Nachfrage|Why he's.*?)[:.]?\s*/gi, '')
        .replace(/^["']/gm, '') // Remove leading quotes
        .replace(/["']$/gm, '') // Remove trailing quotes
        .replace(/[*#_]/g, '')
        .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Remove emojis
        .replace(/\n+/g, '. ') // Replace newlines with periods for natural pauses
        .replace(/\.\s*\./g, '.') // Remove double periods
        .replace(/\s+/g, ' ')
        .trim();

      let ttsPrompt;
      if (activeLanguage === 'de') {
        ttsPrompt = `Read the following German response with a bored, cynical tone. Read it naturally as continuous text: ${cleanText}`;
      } else {
        ttsPrompt = `Read the following response with a very cynical, bored British accent. Read it naturally as continuous text: ${cleanText}`;
      }

      try {
        const audioResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: ttsPrompt }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Fenrir' }, // Fenrir is usually deep/cynical enough
                    },
                },
            },
        });

        const base64Audio = audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio && audioContextRef.current) {
             const audioBuffer = await decodeAudioData(
                decode(base64Audio),
                audioContextRef.current,
                24000,
                1
            );
            audioBufferRef.current = audioBuffer;
        }
      } catch (audioErr) {
        console.warn("Audio generation failed, skipping.", audioErr);
      }

      // 3. Show Rage Meter, then Result & Play Audio
      // Ensure minimum loading time of 1.5s so animation completes
      const loadingDuration = Date.now() - loadingStartTime;
      const minimumLoadingTime = 1500; // 1.5 seconds
      const remainingTime = Math.max(0, minimumLoadingTime - loadingDuration);

      setTimeout(() => {
        setResult(text);
        playSuccessSound(); // Pleasant chime on result
        playThwackSound(); // Satisfying thwack on result
        triggerHaptic('heavy'); // Satisfying haptic on result
        setStep('result');

        // Auto-play if audio was successfully generated
        if (autoPlay && audioBufferRef.current) {
          // Small delay to let the UI settle
          setTimeout(() => playAudio(), 500);
        }
        // Transition to rage meter instead of directly to result
        setStep('rage');
      }, remainingTime);

    } catch (e: any) {
      const msg = e instanceof Error ? e.message : String(e);
      setBtnLoading(false);
      if (msg.includes('API_KEY') || msg.includes('401')) {
        setError(activeLanguage === 'de'
            ? "API-Schlüssel kaputt. Prüfe deine .env"
            : "API key's borked. Check your .env"
        );
      } else if (msg.includes('429') || msg.includes('quota')) {
        setError(activeLanguage === 'de'
            ? "Zu viel Geschwätz. Kontingent überschritten. Warte kurz."
            : "Too much waffle. Quota exceeded. Give it a minute."
        );
      } else {
        setError(msg || (activeLanguage === 'de'
            ? "Ich brauche erstmal einen Kaffee dafür."
            : "I need a proper cup of tea for this."
        ));
      }
      setStep('input');
    }
  };

  const reset = () => {
    stopAudio(); // Stop any playing audio
    triggerHaptic('light');
    setStep('input');
    setInput("");
    setResult("");
    audioBufferRef.current = null;
    setBtnHovered(false); // Clear button hover state
  };

  // Swipe gesture for going back from result to input
  const swipeContainerRef = useSwipeGesture(
    step === 'result' ? reset : undefined, // Swipe right to go back
    undefined
  );

  const renderResult = () => {
    const killShotMatch = result.match(/## (?:💀 )?(?:The Kill Shot|Der Gnadenschuss)\s*\n+["']?([^#]+?)["']?\s*(?=##|$)/is);
    const autopsyMatch = result.match(/## (?:🔬 )?(?:The Autopsy|Why he's (?:an idiot|wrong|a melt)|Die Obduktion)\s*\n+([^#]+?)(?=##|$)/is);
    const followUpMatch = result.match(/## (?:🎯 )?(?:Follow-up Question|Nachfrage)\s*\n+([^#]+?)(?=##|$)/is);

    const killShot = killShotMatch?.[1]?.trim().replace(/^["']|["']$/g, '') || '';
    const explanation = autopsyMatch?.[1]?.trim() || '';
    const followUp = followUpMatch?.[1]?.trim() || '';

    // Fallback if parsing fails
    if (!killShot && !explanation) {
        return (
          <div className="bg-white wobbly-input p-6 text-lg md:text-xl leading-relaxed text-gray-800 relative whitespace-pre-wrap">
             {result}
             <CopyButton text={result} language={language} />
          </div>
        );
    }

    return (
      <div className="flex flex-col gap-10 pb-4">
        {/* The Kill Shot Bubble */}
        {killShot && (
        <div className="relative group my-2 animate-bounce-in" style={{ animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards' }}>
             <div className="wobbly-box bg-white border-4 border-black text-black p-6 md:p-8 relative shadow-xl transform rotate-1 transition-transform duration-300 hover:rotate-0 hover:scale-[1.02]">
                <CopyButton text={killShot} language={language} />
                <div className="absolute -bottom-4 left-10 w-8 h-8 bg-white border-r-4 border-b-4 border-black rotate-45"></div>
                <div className="relative z-10 text-center">
                    <h3 ref={killShotRef} className="text-2xl md:text-4xl heading-xl tracking-tight inline-block">
                        "{killShot}"
                    </h3>
                </div>
             </div>
        </div>
        )}

        {/* The Explanation */}
        {explanation && (
            <ResultSection
                title={language === 'de' ? "Die Obduktion:" : "The Autopsy:"}
                text={explanation}
                color="#ef4444"
                delay={0}
                animationDelay={200}
                language={language}
            />
        )}

        {/* Follow Up */}
        {followUp && (
            <ResultSection
                title={language === 'de' ? "Nachfrage:" : "Follow-up Question:"}
                text={`"${followUp}"`}
                color="#2563eb"
                delay={0.1}
                headerWidth="w-64"
                animationDelay={400}
                language={language}
            />
        )}
      </div>
    );
  };

  // Handle regenerating result when language changes
  const handleRegenerateWithLanguage = async (newLanguage: 'en' | 'de') => {
    // Pass the new language directly to handleSilencer to avoid state timing issues
    await handleSilencer(newLanguage);
  };

  // Translation strings for accessibility
  const a11y = {
    skipToContent: language === 'de' ? 'Zum Hauptinhalt springen' : 'Skip to main content',
    helpTour: language === 'de' ? 'Hilfe und Tour öffnen' : 'Open help and tour',
    settingsOpen: language === 'de' ? 'Einstellungen öffnen' : 'Open settings',
    appTitle: language === 'de' ? 'Smartass Silencer - Ein Werkzeug zur Analyse von Aussagen' : "Smartass Silencer - A tool for analyzing statements",
    inputLabel: language === 'de' ? 'Gib die zu analysierende Aussage ein' : 'Enter the statement to analyze',
  };

  // Error ID for aria-describedby
  const errorId = 'input-error-message';
  const inputId = 'statement-input';

  return (
    <>
      {/* Skip to content link */}
      <a href="#main-content" className="skip-link">
        {a11y.skipToContent}
      </a>

      {/* Screen reader live region for status updates */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {step === 'loading' && loadingMsg}
        {step === 'result' && (language === 'de' ? 'Analyse abgeschlossen' : 'Analysis complete')}
      </div>

      <div className="min-h-screen relative flex flex-col items-center justify-center p-2 md:p-4 overflow-hidden">

        <LanguageSelectionModal
          isOpen={showLanguageSelect}
          onSelectLanguage={(lang) => {
            setLanguage(lang);
            setShowLanguageSelect(false);
          }}
        />

        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          language={language}
          setLanguage={setLanguage}
          onPlayAudio={playAudio}
          hasAudio={!!audioBufferRef.current}
          autoPlay={autoPlay}
          setAutoPlay={setAutoPlay}
          isPlaying={isPlaying}
          step={step}
          onRegenerateWithLanguage={handleRegenerateWithLanguage}
        />

        {/* Main Container */}
        <main
          id="main-content"
          className="w-full max-w-2xl relative z-10 my-2 md:my-6 px-2"
          role="main"
          aria-label={a11y.appTitle}
        >
  // Handle rage meter completion
  const handleRageComplete = () => {
    playThwackSound(); // Satisfying thwack on result
    setStep('result');

    // Auto-play if audio was successfully generated
    if (autoPlay && audioBufferRef.current) {
      // Small delay to let the UI settle
      setTimeout(() => playAudio(), 500);
    }
  };

  return (
    <div
      ref={swipeContainerRef}
      className="min-h-screen relative flex flex-col items-center justify-center p-2 md:p-4 overflow-hidden"
      style={{
        paddingBottom: isKeyboardVisible ? `${keyboardHeight}px` : undefined,
        transition: 'padding-bottom 0.2s ease-out'
      }}
    >
      ref={pullRefreshRef}
      className="min-h-screen relative flex flex-col items-center justify-center p-2 md:p-4 overflow-hidden"
      style={{
        transform: pullDistance > 0 ? `translateY(${pullDistance * 0.3}px)` : undefined,
        transition: pullDistance === 0 ? 'transform 0.3s ease-out' : undefined
      }}
    >
      {/* Pull to Refresh Indicator */}
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
      />

      <LanguageSelectionModal
        isOpen={showLanguageSelect}
        onSelectLanguage={(lang) => {
          setLanguage(lang);
          setShowLanguageSelect(false);
        }}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => { playClickSound(); setShowSettings(false); }}
        language={language}
        setLanguage={setLanguage}
        onPlayAudio={playAudio}
        hasAudio={!!audioBufferRef.current}
        autoPlay={autoPlay}
        setAutoPlay={setAutoPlay}
        sarcasmLevel={sarcasmLevel}
        setSarcasmLevel={setSarcasmLevel}
        isPlaying={isPlaying}
        step={step}
        onRegenerateWithLanguage={handleRegenerateWithLanguage}
      />

      {/* Main Container */}
      <div className="w-full max-w-2xl relative z-10 my-2 md:my-6 px-2">
        
        {/* The Card */}
        <div className="bg-white wobbly-box p-4 md:p-8 relative">

            {/* Header Controls */}
            <div className="absolute top-4 right-4 flex gap-2 z-30" role="toolbar" aria-label={language === 'de' ? 'App-Steuerung' : 'App controls'}>
                 {/* Help Button */}
                <button
                    onClick={() => setTourStep(0)}
                    className="text-gray-400 hover:text-black hover:scale-110 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-full p-1"
                    className="text-gray-400 hover:text-black hover:scale-110 transition-all duration-300 rounded-full p-1 focus-ring"
                    onClick={() => { playClickSound(); setTourStep(0); }}
                    className="text-gray-400 hover:text-black hover:scale-110 transition-all duration-300"
                    title={language === 'de' ? 'Hilfe & Tour' : 'Help & Tour'}
                    aria-label={language === 'de' ? 'Hilfe und Tour starten' : 'Start help tour'}
                >
                    <HelpCircle size={24} aria-hidden="true" />
                </button>

                {/* Settings Button */}
                <button
                    ref={settingsBtnRef}
                    onClick={() => setShowSettings(true)}
                    className="text-gray-400 hover:text-black hover:rotate-90 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-full p-1"
                    title={language === 'de' ? 'Einstellungen (Strg+,)' : 'Settings (Ctrl+,)'}
                    aria-label={language === 'de' ? 'Einstellungen öffnen' : 'Open settings'}
                    className="text-gray-400 hover:text-black hover:rotate-90 transition-all duration-300 rounded-full p-1 focus-ring"
                    onClick={() => { playClickSound(); setShowSettings(true); }}
                    className="text-gray-400 hover:text-black hover:rotate-90 transition-all duration-300"
                    title={language === 'de' ? 'Einstellungen' : 'Settings'}
                >
                    <Settings size={24} aria-hidden="true" />
                </button>
            </div>

          {/* The Card */}
          <article className="bg-white wobbly-box p-4 md:p-8 relative">

              {/* Header Controls */}
              <header className="absolute top-4 right-4 flex gap-2 z-30">
                   {/* Help Button */}
                  <button
                      onClick={() => setTourStep(0)}
                      className="p-2 min-w-[44px] min-h-[44px] text-gray-500 hover:text-black hover:scale-110 transition-all duration-300 flex items-center justify-center rounded-full hover:bg-gray-100"
                      aria-label={a11y.helpTour}
                  >
                      <HelpCircle size={24} aria-hidden="true" />
                  </button>

                  {/* Settings Button */}
                  <button
                      ref={settingsBtnRef}
                      onClick={() => setShowSettings(true)}
                      className="p-2 min-w-[44px] min-h-[44px] text-gray-500 hover:text-black hover:rotate-90 transition-all duration-300 flex items-center justify-center rounded-full hover:bg-gray-100"
                      aria-label={a11y.settingsOpen}
                  >
                      <Settings size={24} aria-hidden="true" />
                  </button>
              </header>

              {/* Tape Effect - decorative */}
              <div
                className="absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-10 bg-pink-200 opacity-80 -rotate-1 shadow-sm z-20"
                style={{clipPath: 'polygon(2% 0, 100% 0, 98% 100%, 0% 100%)'}}
                aria-hidden="true"
              ></div>

              {/* Title Section */}
              <div className="mb-6 mt-2 text-center relative flex flex-col items-center">
                  <h1 className="sr-only">
                    {language === 'de' ? "Jazz's Smartass Silencer" : "Jazz's Smartass Silencer"}
                  </h1>
                  <div className="relative w-full h-52 md:h-72 flex items-center justify-center px-2">
                      <img
                          src={logoImg}
                          alt=""
                          role="presentation"
                          className="w-full h-full object-contain transform -rotate-1 hover:rotate-0 transition-transform duration-300 drop-shadow-sm"
                          onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = document.getElementById('title-fallback');
                              if (fallback) fallback.style.display = 'block';
                          }}
                      />
                      <div id="title-fallback" style={{display: 'none'}} className="w-full h-full" aria-hidden="true">
                          <ScribbleHeader
                              text={language === 'de' ? "Der Rausschmeißer" : "Jazz's Smartass Silencer"}
                              className="w-full h-full"
                              as="span"
                          />
                      </div>
                  </div>
              </div>

            {step === 'input' && (
                <section className="flex flex-col gap-4" aria-labelledby="input-section-heading">
                    <div className="relative">
                        {/* Visual header with screen reader alternative */}
                        <div className="mb-4 mt-4 h-20 w-full overflow-visible" aria-hidden="true">
                <div className="flex flex-col gap-4 min-h-[300px]">
                    <div className="relative">
                <div className="flex flex-col gap-4 animate-fade-slide-in">
                    <div className="relative animate-bounce-in" style={{ animationDelay: '0.05s', opacity: 0, animationFillMode: 'forwards' }}>
                        <div className="mb-4 mt-4 h-20 w-full overflow-visible">
                           <ScribbleHeader
                                text={isRecording
                                    ? (language === 'de' ? "Höre zu..." : "Listening...")
                                    : (language === 'de' ? "Na los, erzähl schon" : "Go on then, let's hear it")
                                }
                                delay={0.2}
                                color={isRecording ? "#ef4444" : "#2a2a2a"}
                                as="span"
                            />
                        </div>
                        <h2 id="input-section-heading" className="sr-only">
                            {a11y.inputLabel}
                        </h2>

                        <div className="relative">
                            {/* Visually hidden label for screen readers */}
                            <label htmlFor={inputId} className="sr-only">
                                {a11y.inputLabel}
                            </label>
                            <RoughHighlight show={inputFocused} type="bracket" color="#ef4444" padding={4} strokeWidth={2} iterations={2} animationDuration={400}>
                                <textarea
                                    id={inputId}
                        <div className="relative animate-bounce-in" style={{ animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards' }}>
                            <RoughHighlight show={inputFocused} type="bracket" color="#ef4444" padding={4} strokeWidth={2} iterations={2} animationDuration={400}>
                                <textarea
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onFocus={() => setInputFocused(true)}
                                    onBlur={() => setInputFocused(false)}
                                    onKeyDown={(e) => {
                                        // Ctrl/Cmd + Enter to submit
                                        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && input.trim()) {
                                            e.preventDefault();
                                            playClickSound();
                                            handleSilencer();
                                        }
                                    }}
                                    className={`w-full h-40 wobbly-input p-4 pb-12 text-lg md:text-xl bg-gray-50 focus:bg-white focus:ring-0 outline-none resize-none font-hand text-gray-800 leading-normal shadow-inner placeholder:text-gray-300 relative z-10 transition-all duration-300 focus:ring-2 focus:ring-amber-400 ${inputFocused ? 'scale-[1.01] shadow-lg' : ''}`}
                                    placeholder={language === 'de' ? "z.B. 'Eigentlich ist HTML eine Programmiersprache'" : "e.g. 'Actually, HTML is a programming language'"}
                                    aria-label={language === 'de' ? 'Text zum Analysieren eingeben' : 'Enter text to analyze'}
                                    aria-describedby="input-hint"
                                    className={`w-full h-40 wobbly-input p-4 pb-12 text-lg md:text-xl bg-gray-50 focus:bg-white focus:ring-0 outline-none resize-none font-hand text-gray-800 leading-normal shadow-inner placeholder:text-gray-400 relative z-10 transition-all duration-300 ${inputFocused ? 'scale-[1.01] shadow-lg' : ''}`}
                                    className={`w-full h-40 wobbly-input p-4 pb-12 text-lg md:text-xl body-lg bg-gray-50 focus:bg-white focus:ring-0 outline-none resize-none font-hand text-gray-800 shadow-inner placeholder:text-gray-300 relative z-10 transition-all duration-300 ${inputFocused ? 'scale-[1.01] shadow-lg' : ''}`}
                                    placeholder={language === 'de' ? "z.B. 'Eigentlich ist HTML eine Programmiersprache'" : "e.g. 'Actually, HTML is a programming language'"}
                                    aria-describedby={error ? errorId : undefined}
                                    aria-invalid={error ? 'true' : 'false'}
                                />
                            </RoughHighlight>

                            {/* Screen reader hint */}
                            <span id="input-hint" className="sr-only">
                                {language === 'de' ? 'Strg+Enter zum Absenden, Strg+M für Mikrofon' : 'Press Ctrl+Enter to submit, Ctrl+M for microphone'}
                            </span>

                            <button
                                onClick={toggleRecording}
                                className={`absolute bottom-3 right-3 p-2 rounded-full transition-all duration-300 z-20 focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                                className={`absolute bottom-3 right-3 p-3 min-w-[44px] min-h-[44px] rounded-full transition-all duration-300 z-20 flex items-center justify-center ${
                                    isRecording
                                    ? "text-red-500 animate-pulse bg-red-50"
                                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                className={`absolute bottom-3 right-3 p-2 rounded-full transition-all duration-300 z-20 focus-ring ${
                                onClick={() => { playClickSound(); toggleRecording(); }}
                                className={`absolute bottom-3 right-3 p-2 rounded-full transition-all duration-300 z-20 ${
                                    isRecording
                                    ? "text-red-500 animate-pulse bg-red-50"
                                    : "text-gray-400/50 hover:text-gray-600 hover:opacity-100 hover:bg-gray-100"
                                }`}
                                title={language === 'de' ? 'Spracheingabe umschalten (Strg+M)' : 'Toggle voice input (Ctrl+M)'}
                                aria-label={isRecording
                                    ? (language === 'de' ? 'Aufnahme stoppen' : 'Stop recording')
                                    : (language === 'de' ? 'Spracheingabe starten' : 'Start voice input')
                                aria-label={isRecording
                                    ? (language === 'de' ? 'Sprachaufnahme beenden' : 'Stop voice recording')
                                    : (language === 'de' ? 'Sprachaufnahme starten' : 'Start voice recording')
                                }
                                aria-pressed={isRecording}
                            >
                                {isRecording ? <MicOff size={24} aria-hidden="true" /> : <Mic size={24} aria-hidden="true" />}
                            </button>
                        </div>
                    </div>

                    <RoughHighlight show={btnHovered && !btnLoading} type="circle" color="#000" padding={10} iterations={1} strokeWidth={2}>
                        <LoadingButton
                            ref={actionBtnRef}
                            onClick={() => { playClickSound(); handleSilencer(); }}
                            onMouseEnter={() => setBtnHovered(true)}
                            onMouseLeave={() => setBtnHovered(false)}
                            disabled={!input.trim()}
                            loading={btnLoading}
                            className="w-full wobbly-box bg-red-400 px-8 py-4 text-2xl md:text-3xl font-black hover:bg-red-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 hover:scale-[1.02] active:scale-95 active:translate-y-1 transition-all duration-150 mt-2 focus-ring"
                    <RoughHighlight show={btnHovered} type="circle" color="#000" padding={10} iterations={1} strokeWidth={2}>
                        <button
                          ref={actionBtnRef}
                          onClick={() => { playClickSound(); handleSilencer(); }}
                          onMouseEnter={() => setBtnHovered(true)}
                          onMouseLeave={() => setBtnHovered(false)}
                          disabled={!input.trim()}
                          className="w-full wobbly-box bg-red-500 px-8 py-4 min-h-[56px] text-2xl md:text-3xl font-black flex items-center justify-center gap-3 hover:bg-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 hover:scale-[1.02] active:scale-95 active:translate-y-1 transition-all duration-150 mt-2"
                          aria-disabled={!input.trim()}
                        >
                          {language === 'de' ? "Bullshit Analysieren" : "Analyse Bullshit"}
                        </button>
                    </RoughHighlight>

                    {error && (
                        <div
                          id={errorId}
                          role="alert"
                          className="wobbly-box bg-red-100 p-4 flex items-center gap-3 text-red-700 text-xl font-bold rotate-1"
                        >
                            <Coffee size={24} aria-hidden="true" /> {error}
                        ref={actionBtnRef}
                        onClick={() => { playClickSound(); triggerHaptic('medium'); handleSilencer(); }}
                        onMouseEnter={() => setBtnHovered(true)}
                        onMouseLeave={() => setBtnHovered(false)}
                        onFocus={() => setBtnHovered(true)}
                        onBlur={() => setBtnHovered(false)}
                        disabled={!input.trim()}
                        className="w-full wobbly-box bg-red-400 px-8 py-4 text-2xl md:text-3xl font-black flex items-center justify-center gap-3 hover:bg-red-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 hover:scale-[1.02] active:scale-95 active:translate-y-1 transition-all duration-150 mt-2 focus:outline-none focus:ring-4 focus:ring-amber-400 focus:ring-offset-2"
                        aria-describedby="submit-hint"
                        className="w-full wobbly-box bg-red-400 px-8 py-4 text-2xl md:text-3xl font-black flex items-center justify-center gap-3 hover:bg-red-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 hover:scale-[1.02] active:scale-95 active:translate-y-1 transition-all duration-150 mt-2 touch-feedback"
                        className="w-full wobbly-box bg-red-400 px-8 py-4 text-2xl md:text-3xl font-black flex items-center justify-center gap-3 hover:bg-red-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.96] active:translate-y-1 transition-all duration-150 mt-2 btn-press animate-bounce-in"
                        style={{ animationDelay: '0.15s', opacity: 0, animationFillMode: 'forwards' }}
                        >
                            {language === 'de' ? "Bullshit Analysieren" : "Analyse Bullshit"}
                        </LoadingButton>
                    </RoughHighlight>
                    <span id="submit-hint" className="sr-only">
                        {language === 'de' ? 'Oder Strg+Enter drücken' : 'Or press Ctrl+Enter'}
                    </span>

                    {error && (
                        <div role="alert" className="wobbly-box bg-red-100 p-4 flex items-center gap-3 text-red-600 text-xl font-bold rotate-1 animate-bounce">
                            <Coffee size={24} aria-hidden="true" /> {error}
                        <ErrorDisplay
                            error={error}
                            onDismiss={() => setError("")}
                            onRetry={() => handleSilencer()}
                            language={language}
                        />
                        <div className="wobbly-box bg-red-100 p-4 flex items-center gap-3 text-red-600 text-xl font-bold rotate-1 animate-bounce-in">
                            <Coffee size={24} className="animate-shake" /> {error}
                        </div>
                    )}
                </section>
            )}

            {step === 'loading' && (
                <section
                  className="h-80 flex flex-col items-center justify-center gap-6 animate-in fade-in duration-300"
                  aria-label={language === 'de' ? 'Analyse läuft' : 'Analysis in progress'}
                  aria-busy="true"
                >
                    <PongLoader />
                    <div className="text-center w-full">
                        <h2
                          className="text-3xl font-black animate-bounce min-h-[4rem] flex items-center justify-center px-4"
                          aria-live="polite"
                        >
                            {loadingMsg}
                        </h2>
                        <p className="text-gray-600 font-bold mt-2">
                <div className="min-h-[300px] h-80 flex flex-col items-center justify-center gap-6 animate-in fade-in duration-300 gpu-accelerated">
                    <PongLoader />
                    <div className="text-center w-full">
                <div className="min-h-[24rem] flex flex-col items-center justify-center gap-6 animate-fade-slide-in">
                    {/* Skeleton Phase - shows result structure preview */}
                    <div className={`w-full transition-all duration-500 ${loadingPhase === 'skeleton' ? 'opacity-100 scale-100' : 'opacity-0 scale-95 absolute pointer-events-none'}`}>
                        <ResultSkeleton />
                    </div>

                    {/* Pong Phase - interactive game */}
                    <div className={`w-full transition-all duration-500 ${loadingPhase === 'pong' ? 'opacity-100 scale-100' : 'opacity-0 scale-95 absolute pointer-events-none'}`}>
                        <PongLoader />
                    </div>

                    <div className="text-center w-full animate-bounce-in" style={{ animationDelay: '0.2s' }}>
                        <h2 className="text-3xl font-black animate-bounce min-h-[4rem] flex items-center justify-center px-4">
                            {loadingMsg}
                        </h2>
                        <p className="text-gray-500 font-bold mt-2 animate-fade-slide-in" style={{ animationDelay: '0.3s' }}>
                             {language === 'de' ? "Tee trinken, Fehler verurteilen." : "Sipping tea, judging errors."}
                        </p>
                    </div>
                </section>
            )}

            {step === 'rage' && (
                <div className="min-h-[300px] flex flex-col items-center justify-center animate-in fade-in duration-300">
                    <RageMeter onComplete={handleRageComplete} language={language} />
                </div>
            )}

            {step === 'result' && (
                <div className="animate-crossfade" role="region" aria-label={language === 'de' ? 'Analyse-Ergebnis' : 'Analysis result'}>
                    <div className="flex justify-between items-center mb-6 border-b-2 border-dashed border-gray-300 pb-2">
                        <div className="flex items-center gap-2 text-2xl font-black text-gray-400 uppercase">
                            <Receipt size={24} aria-hidden="true" />
                            <span className="tracking-widest">{language === 'de' ? 'QUITTUNG' : 'RECEIPT'}</span>
                <section className="animate-crossfade" aria-label={language === 'de' ? 'Analyseergebnis' : 'Analysis result'}>
                    <div className="flex justify-between items-center mb-6 border-b-2 border-dashed border-gray-300 pb-2">
                        <div className="flex items-center gap-2 text-2xl font-black text-gray-500 uppercase">
                            <Receipt size={24} aria-hidden="true" />
                            <h2 className="tracking-widest">{language === 'de' ? 'QUITTUNG' : 'RECEIPT'}</h2>
                <div className="animate-crossfade relative swipe-hint gpu-accelerated min-h-[300px]">
                    <div className="flex justify-between items-center mb-6 border-b-2 border-dashed border-gray-300 pb-2">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 text-2xl font-black text-gray-400 uppercase">
                                <Receipt size={24} />
                                <span className="tracking-widest">{language === 'de' ? 'QUITTUNG' : 'RECEIPT'}</span>
                            </div>
                            <div className="text-sm font-bold text-gray-400 mt-1 -rotate-1">
                                {language === 'de' ? `Bereits zerstört: ${roastCount}` : `Times demolished: ${roastCount}`}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                             {/* Audio Playback Control */}
                             {audioBufferRef.current && (
                                <button
                                    onClick={isPlaying ? stopAudio : playAudio}
                                    className={`p-2 min-w-[44px] min-h-[44px] rounded-full border-2 transition-all flex items-center justify-center ${
                                        isPlaying
                                            ? 'border-green-600 text-green-700 bg-green-50'
                                            : 'border-black text-black hover:bg-yellow-100'
                                    }`}
                                    aria-label={isPlaying
                                        ? (language === 'de' ? 'Audio stoppen' : 'Stop audio')
                                        : (language === 'de' ? 'Audio abspielen' : 'Play audio')
                                    }
                                    aria-pressed={isPlaying}
                                >
                                    {isPlaying
                                      ? <Square size={20} aria-hidden="true" />
                                      : <Volume2 size={24} aria-hidden="true" />
                                    }
                                </button>
                             )}

                            <button
                              onClick={reset}
                              className="p-2 min-h-[44px] text-gray-500 hover:text-black font-bold underline decoration-wavy flex items-center gap-1 group"
                              aria-label={language === 'de' ? 'Neues Ziel analysieren' : 'Analyze new target'}
                            >
                                <PenTool size={16} className="group-hover:rotate-12 transition-transform" aria-hidden="true" />
                                    onClick={() => { playClickSound(); playAudio(); }}
                                    disabled={isPlaying}
                                    title={isPlaying ? (language === 'de' ? 'Spricht... (Strg+P)' : 'Speaking... (Ctrl+P)') : (language === 'de' ? 'Anhören (Strg+P)' : 'Listen (Ctrl+P)')}
                                    aria-label={isPlaying
                                        ? (language === 'de' ? 'Audio wird abgespielt' : 'Audio is playing')
                                        : (language === 'de' ? 'Audio abspielen' : 'Play audio')
                                    }
                                    className={`p-2 rounded-full border-2 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 ${
                                    title={isPlaying ? (language === 'de' ? 'Spricht...' : 'Speaking...') : (language === 'de' ? 'Anhören' : 'Listen')}
                                    className={`p-2 rounded-full border-2 transition-all focus-ring ${
                                        isPlaying
                                            ? 'border-green-500 text-green-700 bg-green-50 animate-pulse'
                                            : 'border-black text-black hover:bg-yellow-100 hover:scale-110 active:scale-95'
                                    className={`p-2 rounded-full border-2 transition-all btn-press animate-bounce-in ${
                                        isPlaying
                                            ? 'border-green-500 text-green-700 bg-green-50'
                                            : 'border-black text-black hover:bg-yellow-100 active:scale-95'
                                    }`}
                                    aria-live="polite"
                                >
                                    <Volume2 size={24} className={isPlaying ? "animate-pulse" : ""} aria-hidden="true" />
                                </button>
                             )}

                            <button
                                onClick={reset}
                                className="text-gray-400 hover:text-black font-bold underline decoration-wavy flex items-center gap-1 group focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 rounded"
                                title={language === 'de' ? 'Neues Opfer (Strg+N)' : 'New Target (Ctrl+N)'}
                            >
                                <PenTool size={16} className="group-hover:rotate-12 transition-transform" aria-hidden="true" />
                                    style={{ animationDelay: '0.15s', opacity: 0, animationFillMode: 'forwards' }}
                                >
                                    <Volume2 size={24} className={isPlaying ? "animate-bounce" : ""} />
                                </button>
                             )}

                            <button onClick={reset} className="text-gray-400 hover:text-black font-bold underline decoration-wavy flex items-center gap-1 group px-2 py-1 rounded focus-ring transition-all hover:bg-gray-100">
                            <button onClick={() => { playClickSound(); reset(); }} className="text-gray-400 hover:text-black font-bold underline decoration-wavy flex items-center gap-1 group">
                                <PenTool size={16} className="group-hover:rotate-12 transition-transform"/> 
                            <button onClick={reset} className="text-gray-400 hover:text-black font-bold underline decoration-wavy flex items-center gap-1 group btn-press active:scale-95 transition-transform animate-bounce-in" style={{ animationDelay: '0.2s', opacity: 0, animationFillMode: 'forwards' }}>
                                <PenTool size={16} className="group-hover:rotate-12 transition-transform"/>
                                {language === 'de' ? "Neues Opfer" : "New Target"}
                            </button>
                        </div>
                    </div>

                    {/* Pull to refresh hint on mobile */}
                    <div className="text-center text-xs text-gray-400 mb-4 md:hidden animate-fade-slide-in" style={{ animationDelay: '0.5s' }}>
                        {language === 'de' ? '↓ Nach unten ziehen für neues Ziel' : '↓ Pull down for new target'}
                    </div>

                    {renderResult()}
                </section>
            )}
            
            {/* Footer */}
            <footer className="mt-6 pt-4 border-t-2 border-dashed border-gray-200/50 flex flex-col items-center text-center">
                <p className="font-bold text-base text-gray-600 rotate-1 mb-2">
                    {language === 'de' ? 'Kaffee trinken, urteilen' : 'Drinking coffee, passing judgement'}
                </p>
                <p className="text-sm text-gray-500 font-bold -rotate-1">
            <div className="mt-6 pt-4 border-t-2 border-dashed border-gray-200/50 flex flex-col items-center text-center">
                <div className="label text-base text-gray-600 rotate-1 mb-2">
                    {language === 'de' ? 'Kaffee trinken, urteilen' : 'Drinking coffee, passing judgement'}
                </div>
                <div className="text-sm text-gray-400 label -rotate-1">
                    {language === 'de' ? 'Verantwortungsvoll nutzen' : 'Use responsibly'}
                </p>
            </footer>

            {/* Onboarding Overlay - Only show on input screen */}
            {tourStep !== null && step === 'input' && (
                <OnboardingGuide
                    step={tourStep}
                    onNext={() => {
                        playClickSound();
                        if (tourStep < 3) {
                            setTourStep(tourStep + 1);
                        } else {
                            setTourStep(null);
                        }
                    }}
                    onClose={() => { playClickSound(); setTourStep(null); }}
                    refs={{
                        settings: settingsBtnRef,
                        input: inputRef,
                        button: actionBtnRef
                    }}
                    language={language}
                />
            )}

          </article>
        </main>

      </div>
    </>
  );
};

const root = createRoot(document.getElementById("root"));
root.render(<App />);