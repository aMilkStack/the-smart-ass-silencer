import React, { useState, useEffect, useRef } from "react";
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
  ArrowRight
} from "lucide-react";

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

const playClickSound = createSoundEffect(800, 0.08, 'square', 0.05);
const playThwackSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    // Start with higher freq and drop for "thwack"
    oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.1);
    oscillator.type = 'triangle';
    
    gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.15);
  } catch (e) {}
};

const playPopSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.05);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.1);
  } catch (e) {}
};

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

    const loop = () => {
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
                ball.x = playerPaddleRight + ballR; // Push ball out
                ball.dx = Math.abs(ball.dx) * 1.03; // Bounce right, slight speedup
                const hitOffset = (ball.y - playerY) / (paddleHeight/2);
                ball.dy += hitOffset * 1.5; // Add spin
            }
        }

        // AI Paddle (Right Side) Collision
        const aiPaddleLeft = w - paddleOffset - paddleWidth;
        if (ball.dx > 0 && ball.x + ballR >= aiPaddleLeft && ball.x - ballR <= w - paddleOffset) {
            if (ball.y >= aiY - paddleHeight/2 - ballR && ball.y <= aiY + paddleHeight/2 + ballR) {
                ball.x = aiPaddleLeft - ballR; // Push ball out
                ball.dx = -Math.abs(ball.dx) * 1.03; // Bounce left, slight speedup
                const hitOffset = (ball.y - aiY) / (paddleHeight/2);
                ball.dy += hitOffset * 1.5; // Add spin
            }
        }

        // Scoring if missed (Left or Right walls)
        if (ball.x < -ballR * 2) {
            // AI scored (ball went past player)
            aiScore++;
            if (aiScore >= winningScore) {
                gameOver = true;
            } else {
                ball = resetBall();
                ballPaused = true;
                pauseTimeout = window.setTimeout(() => {
                    ballPaused = false;
                }, 1000);
            }
        } else if (ball.x > w + ballR * 2) {
            // Player scored (ball went past AI)
            playerScore++;
            if (playerScore >= winningScore) {
                gameOver = true;
            } else {
                ball = resetBall();
                ballPaused = true;
                pauseTimeout = window.setTimeout(() => {
                    ballPaused = false;
                }, 1000);
            }
        }

        // Cap speed
        const maxSpeedX = 10;
        const maxSpeedY = 8;
        ball.dx = Math.max(-maxSpeedX, Math.min(maxSpeedX, ball.dx));
        ball.dy = Math.max(-maxSpeedY, Math.min(maxSpeedY, ball.dy));

        // Draw
        ctx.clearRect(0, 0, w, h);

        ctx.fillStyle = "#2a2a2a";
        ctx.strokeStyle = "#2a2a2a";
        ctx.lineWidth = 2;

        // Player Paddle (Left)
        drawRoundedRect(paddleOffset, playerY - paddleHeight/2, paddleWidth, paddleHeight, 4);

        // AI Paddle (Right)
        drawRoundedRect(w - paddleOffset - paddleWidth, aiY - paddleHeight/2, paddleWidth, paddleHeight, 4);

        // Net (Vertical Dashed Line)
        ctx.beginPath();
        ctx.setLineDash([5, 15]);
        ctx.moveTo(w/2, 0);
        ctx.lineTo(w/2, h);
        ctx.stroke();
        ctx.setLineDash([]);

        // Ball trail
        ctx.fillStyle = "rgba(239, 68, 68, 0.15)";
        ctx.beginPath();
        ctx.arc(ball.x - ball.dx * 2, ball.y - ball.dy * 2, ballR * 0.8, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = "rgba(239, 68, 68, 0.08)";
        ctx.beginPath();
        ctx.arc(ball.x - ball.dx * 4, ball.y - ball.dy * 4, ballR * 0.6, 0, Math.PI*2);
        ctx.fill();

        // Ball
        ctx.fillStyle = "#ef4444";
        ctx.strokeStyle = "#2a2a2a";
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ballR, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();

        // Draw Scores
        ctx.fillStyle = "#2a2a2a";
        ctx.font = "bold 32px 'Gochi Hand', cursive";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";

        // Player score (left side)
        ctx.fillText(playerScore.toString(), w / 4, 20);

        // AI score (right side)
        ctx.fillText(aiScore.toString(), (w * 3) / 4, 20);

        // Game Over message
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
            ctx.fillText("Tap to restart", w / 2, h / 2 + 30);
        }

        animationId = requestAnimationFrame(loop);
    };

    loop();

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

    container.addEventListener('touchmove', onTouch, { passive: false });
    container.addEventListener('mousemove', onMouse);
    container.addEventListener('click', onClick);

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
        window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-48 md:h-60 wobbly-box bg-white relative overflow-hidden cursor-none touch-none select-none">
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-200 font-black text-4xl md:text-5xl pointer-events-none -z-10 select-none opacity-40 rotate-12 text-center">
            MOVE TO<br />PLAY PONG
        </div>
        <div className="absolute bottom-2 left-2 text-xs text-gray-400 font-bold opacity-50 pointer-events-none">
            YOU
        </div>
        <div className="absolute top-2 right-2 text-xs text-gray-400 font-bold opacity-50 pointer-events-none">
            CPU
        </div>
    </div>
  );
};


// Reusable Scribble Text (SVG Animation)
const ScribbleHeader = ({ 
    text, 
    className = "", 
    delay = 0,
    color = "#2a2a2a"
}: { 
    text: string, 
    className?: string, 
    delay?: number,
    color?: string 
}) => {
  return (
    <div className={`relative ${className} overflow-visible`} aria-label={text}>
        <svg 
          viewBox="0 0 400 60" 
          className="w-full h-full scribble-text pointer-events-none overflow-visible"
          preserveAspectRatio="xMidYMid meet"
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
                fill: 'transparent' // Filled via CSS animation
            }}
          >
            {text.split('').map((char, i) => (
              <tspan 
                key={i} 
                style={{ 
                    animationDelay: `${delay + (i * 0.05)}s`,
                    fill: 'transparent' // Override to ensure animation controls fill
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

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(text);
            playPopSound();
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className={`absolute top-2 right-2 p-3 md:p-2 rounded-full hover:bg-black/5 transition-all duration-200 group z-20 ${copied ? 'animate-pop bg-green-50/50' : 'hover:scale-110 active:scale-90'}`}
            title={language === 'de' ? 'In Zwischenablage kopieren' : 'Copy to clipboard'}
        >
            <div className="relative w-5 h-5">
                {/* Copy Icon - scales down and rotates out when copied */}
                <div className={`absolute inset-0 transition-all duration-300 ease-out transform ${
                    copied ? 'opacity-0 scale-50 rotate-12' : 'opacity-100 scale-100 rotate-0'
                }`}>
                     <Copy size={20} className="text-gray-400 group-hover:text-black transition-colors" />
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

const LanguageSelectionModal = ({
    isOpen,
    onSelectLanguage
}: {
    isOpen: boolean;
    onSelectLanguage: (lang: 'en' | 'de') => void;
}) => {
    if (!isOpen) return null;

    const handleSelect = (lang: 'en' | 'de') => {
        localStorage.setItem('language_selected', 'true');
        localStorage.setItem('user_language', lang);
        onSelectLanguage(lang);
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white wobbly-box p-8 md:p-10 max-w-md w-full relative text-center space-y-6">
                <div className="space-y-2">
                    <h2 className="text-2xl md:text-3xl font-black">Choose Your Language</h2>
                    <p className="text-lg md:text-xl font-black">Wähle deine Sprache</p>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={() => handleSelect('en')}
                        className="w-full p-4 font-black text-xl bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all active:shadow-none active:translate-x-[6px] active:translate-y-[6px] hover:bg-yellow-100"
                    >
                        English
                    </button>
                    <button
                        onClick={() => handleSelect('de')}
                        className="w-full p-4 font-black text-xl bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all active:shadow-none active:translate-x-[6px] active:translate-y-[6px] hover:bg-yellow-100"
                    >
                        Deutsch
                    </button>
                </div>
            </div>
        </div>
    );
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
    isPlaying,
    step,
    onRegenerateWithLanguage
}: any) => {
    const [showLanguageConfirm, setShowLanguageConfirm] = useState(false);
    const [pendingLanguage, setPendingLanguage] = useState<'en' | 'de' | null>(null);

    if (!isOpen) return null;

    const handleLanguageChange = (newLang: 'en' | 'de') => {
        if (newLang === language) return;

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

    const t = {
        title: language === 'de' ? 'Einstellungen' : 'Settings',
        languageLabel: language === 'de' ? 'Sprach-Protokoll' : 'Language Protocol',
        autoPlayLabel: language === 'de' ? 'Beleidigungen automatisch abspielen' : 'Auto-play Insults',
        lastTransmission: language === 'de' ? 'Letzte Übertragung' : 'Last Transmission',
        replayAudio: language === 'de' ? 'Audio wiederholen' : 'Replay Audio',
        playing: language === 'de' ? 'Spielt ab...' : 'Playing...'
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white wobbly-box p-6 md:p-8 max-w-xs md:max-w-sm w-full relative">
                 <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <X size={24} />
                </button>

                <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
                    <Settings className="animate-spin-slow" /> {t.title}
                </h2>

                <div className="space-y-6">
                    {/* Language Switch */}
                    <div className="space-y-2">
                        <label className="font-bold text-gray-600 block">{t.languageLabel}</label>
                        {step === 'result' && (
                            <div className="text-xs text-amber-600 mb-2 flex items-start gap-1">
                                <span>⚠️</span>
                                <span>{language === 'de' ? 'Sprachwechsel erzeugt neues Ergebnis' : 'Changing language will regenerate result'}</span>
                            </div>
                        )}
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleLanguageChange('en')}
                                className={`flex-1 p-3 font-bold border-2 transition-all ${
                                    language === 'en'
                                    ? 'bg-black text-white border-black transform -rotate-1 shadow-md'
                                    : 'bg-white text-gray-400 border-gray-200 hover:border-black'
                                }`}
                            >
                                English
                            </button>
                            <button
                                onClick={() => handleLanguageChange('de')}
                                className={`flex-1 p-3 font-bold border-2 transition-all ${
                                    language === 'de'
                                    ? 'bg-black text-white border-black transform rotate-1 shadow-md'
                                    : 'bg-white text-gray-400 border-gray-200 hover:border-black'
                                }`}
                            >
                                Deutsch
                            </button>
                        </div>
                    </div>

                    {/* Auto Play Toggle */}
                    <div className="flex items-center justify-between">
                         <label className="font-bold text-gray-600">{t.autoPlayLabel}</label>
                         <button
                            onClick={() => setAutoPlay(!autoPlay)}
                            className={`w-14 h-8 rounded-full border-2 border-black flex items-center px-1 transition-all ${
                                autoPlay ? 'bg-green-400 justify-end' : 'bg-gray-200 justify-start'
                            }`}
                        >
                            <div className="w-5 h-5 bg-white border-2 border-black rounded-full shadow-sm"></div>
                         </button>
                    </div>

                     {/* Audio Playback */}
                     {hasAudio && (
                        <div className="pt-4 border-t-2 border-dashed border-gray-200">
                             <label className="font-bold text-gray-600 block mb-2">{t.lastTransmission}</label>
                             <button
                                onClick={onPlayAudio}
                                disabled={isPlaying}
                                className="w-full p-4 border-2 border-black bg-yellow-300 font-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 active:shadow-none active:translate-x-[4px] active:translate-y-[4px] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Volume2 size={24} className={isPlaying ? "animate-pulse" : ""} />
                                {isPlaying ? t.playing : t.replayAudio}
                            </button>
                        </div>
                     )}
                </div>
            </div>

            {/* Language Change Confirmation Dialog */}
            {showLanguageConfirm && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4 z-10">
                    <div className="bg-white wobbly-box p-6 max-w-xs w-full">
                        <h3 className="text-xl font-black mb-3">
                            {language === 'de' ? '⚠️ Sprache wechseln?' : '⚠️ Change Language?'}
                        </h3>
                        <p className="text-gray-700 mb-4 leading-relaxed">
                            {language === 'de'
                                ? 'Das Ergebnis wird neu generiert, um die Antwort und das Audio in der neuen Sprache zu erhalten.'
                                : 'This will regenerate the result to get the response and audio in the new language.'}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={cancelLanguageChange}
                                className="flex-1 p-3 border-2 border-gray-300 text-gray-600 font-bold hover:bg-gray-100 transition-all"
                            >
                                {language === 'de' ? 'Abbrechen' : 'Cancel'}
                            </button>
                            <button
                                onClick={confirmLanguageChange}
                                className="flex-1 p-3 bg-black text-white font-bold border-2 border-black hover:bg-gray-800 transition-all"
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

    return (
        <div className="absolute inset-0 z-50 pointer-events-none flex flex-col items-center justify-center overflow-visible">
             {/* Backdrop for step 0 to focus attention */}
             {step === 0 && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm -z-10 pointer-events-auto" onClick={onClose}></div>}

             {/* Positioning Wrapper: Handles Static Layout Position (Top/Bottom) and Flex Alignment */}
             <div 
                key={`wrapper-${step}`}
                className={`absolute left-0 w-full flex ${getPositionClass(currentStepData.position)} transition-all duration-300 pointer-events-none`}
             >
                {/* Animation Wrapper: Handles the Float/Bobbing Animation */}
                <div className="animate-float">
                    
                     {/* The Sticky Note Visual: Handles Entrance Animation (Slap) and Interactivity */}
                     <div className="w-[85vw] max-w-[300px] md:max-w-xs bg-yellow-200 text-black p-5 md:p-6 shadow-xl border-2 border-yellow-400/50 animate-slap origin-center pointer-events-auto mx-4" style={{ borderRadius: '2px 255px 5px 25px / 255px 5px 225px 5px' }}>
                        
                        {/* Tape */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-white/40 rotate-1"></div>

                        <button 
                            onClick={onClose} 
                            className="absolute -top-2 -right-2 bg-white rounded-full p-1 border border-gray-200 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <X size={16} />
                        </button>

                        <h3 className="font-black text-lg mb-2 flex items-center gap-2">
                            <span className="bg-black text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shrink-0">{step + 1}</span>
                            {currentStepData.title}
                        </h3>
                        
                        <p className="font-hand text-sm md:text-base leading-tight mb-4 text-gray-800">
                            {currentStepData.text}
                        </p>

                        <div className="flex justify-end">
                            <button 
                                onClick={onNext}
                                className="bg-black text-white px-3 py-1.5 md:px-4 md:py-2 font-bold transform rotate-1 hover:-rotate-1 transition-transform flex items-center gap-2 text-xs md:text-sm border-2 border-transparent hover:border-black hover:bg-white hover:text-black"
                            >
                                {step === steps.length - 1 
                                    ? (language === 'de' ? "Verstanden" : "Got it") 
                                    : (language === 'de' ? "Weiter" : "Next")
                                } <ArrowRight size={14} />
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
    const [hovered, setHovered] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), animationDelay);
        return () => clearTimeout(timer);
    }, [animationDelay]);

    return (
        <div 
            className={`relative mt-8 group transition-all duration-500 ease-out ${
                visible 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: `${animationDelay}ms` }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
             {/* Header */}
             <div className={`absolute -top-6 -left-2 ${headerWidth} h-12 z-20 pointer-events-none`}>
                <ScribbleHeader text={title} color={color} delay={delay} />
            </div>

            {/* Content Box */}
            <RoughHighlight 
                show={hovered} 
                type="box" 
                color={color} 
                padding={8} 
                strokeWidth={2} 
                animationDuration={300}
            >
                <div className={`bg-white/50 border border-gray-200 border-dashed rounded-lg p-5 md:p-6 pt-8 text-lg md:text-xl leading-relaxed text-gray-800 relative transition-all duration-300 group-hover:border-transparent group-hover:bg-transparent ${
                    hovered ? 'transform -translate-y-1 shadow-lg' : ''
                }`}>
                    <CopyButton text={text} language={language} />
                    <div className="prose prose-lg prose-p:font-hand leading-relaxed">
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
const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES_EN[0]);

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

  // Save language preference when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_language', language);
    }
  }, [language]);

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

  // Initialize Audio Context on user interaction (if possible)
  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  // Cycle loading messages
  useEffect(() => {
    if (step === 'loading') {
        const messages = language === 'de' ? LOADING_MESSAGES_DE : LOADING_MESSAGES_EN;
        let i = 0;
        setLoadingMsg(messages[0]);
        const interval = setInterval(() => {
            i = (i + 1) % messages.length;
            setLoadingMsg(messages[i]);
        }, 1200);
        return () => clearInterval(interval);
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

    // Stop recording if active
    if (isRecording) {
        recognitionRef.current?.stop();
        setIsRecording(false);
    }

    // Stop any currently playing audio
    stopAudio();

    // Init audio context immediately on click
    initAudioContext();

    setStep('loading');
    setError("");
    setResult("");
    audioBufferRef.current = null; // Reset previous audio

    // Track when loading started to ensure minimum animation time
    const loadingStartTime = Date.now();

    try {
      const ai = new GoogleGenAI({ apiKey: apiKey });
      
      const systemPromptEn = `
**CORE IDENTITY:**
You are "The Silencer." You are an aggressively British, cynical, world-weary senior developer who despises "Nerdsplainers," "Reply Guys," and "LinkedIn Thought Leaders."
You do not roast the user. You are the user's weapon. The user will paste text from a pretentious idiot (the "Target").

**YOUR TONE:**
- **British & Brutal:** Use slang like "melt," "weapon," "bellend," "muppet," "jobsworth," "donut," and "tapped."
- **Dark & Dry:** Use gallows humor. If the Target is arguing about syntax, wonder why they haven't optimized their own social life yet.
- **British Spelling Only:** Colour, Realise, Behaviour, Centre, Optimisation.

**YOUR MISSION:**
1. **Analyze the Cringe:** Identify the pedantry, the "Um, actually" energy, or the incorrect technical confidence.
2. **Generate The Ammunition:** Create ONE perfect, devastating response in the specific format below.

**OUTPUT FORMAT (STRICTLY FOLLOW THIS):**

## 💀 The Kill Shot
"[A single, short, withering British one-liner. Equivalent to rolling your eyes. Example: 'Mate, you're optimizing a loop while your production DB is on fire. Behave.']"

## 🔬 The Autopsy
[2-3 sentences explaining why the Target is a 'melt'. Explain the technical logical fallacy or the social awkwardness of their statement using dry British wit.]

## 🎯 Follow-up Question
[A trap question. Something that forces them to admit they don't know what they're talking about or that they are wasting time.]
`;

    const systemPromptDe = `
**CORE IDENTITY:**
You are "Der Silencer." You are an aggressively German, efficiency-obsessed, world-weary senior developer who despises "Nerdsplainers," "Reply Guys," and "LinkedIn Thought Leaders."
You do not roast the user. You are the user's weapon. The user will paste text from a pretentious idiot (the "Target").

**YOUR TONE:**
- **German & Brutal:** Use slang like "Quatsch," "Ahnungslos," "Pfusch," "Wichtigtuer."
- **Cold & Bureaucratic:** Treat stupidity as an inefficiency.
- **Language:** Respond in German.

**YOUR MISSION:**
1. **Analyze the Cringe:** Identify the pedantry, the "Um, actually" energy, or the incorrect technical confidence.
2. **Generate The Ammunition:** Create ONE perfect, devastating response in the specific format below.

**OUTPUT FORMAT (STRICTLY FOLLOW THIS):**

## 💀 The Kill Shot
"[A single, short, withering German one-liner.]"

## 🔬 The Autopsy
"[2-3 sentences explaining why the Target is a 'Lauch'. Explain the technical fallacy using dry German wit.]"

## 🎯 Follow-up Question
"[A trap question. In German.]"
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
        // Transition to rage meter instead of directly to result
        setStep('rage');
      }, remainingTime);

    } catch (e: any) {
      const msg = e instanceof Error ? e.message : String(e);
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
    setStep('input');
    setInput("");
    setResult("");
    audioBufferRef.current = null;
    setBtnHovered(false); // Clear button hover state
  };

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
        <div className="relative group my-2">
             <div className="wobbly-box bg-white border-4 border-black text-black p-6 md:p-8 relative shadow-xl transform rotate-1 transition-transform duration-300">
                <CopyButton text={killShot} language={language} />
                <div className="absolute -bottom-4 left-10 w-8 h-8 bg-white border-r-4 border-b-4 border-black rotate-45"></div>
                <div className="relative z-10 text-center">
                    <h3 ref={killShotRef} className="text-2xl md:text-4xl font-black leading-snug inline-block">
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
      <div className="w-full max-w-2xl relative z-10 my-2 md:my-6 px-2">
        
        {/* The Card */}
        <div className="bg-white wobbly-box p-4 md:p-8 relative">

            {/* Header Controls */}
            <div className="absolute top-4 right-4 flex gap-2 z-30">
                 {/* Help Button */}
                <button
                    onClick={() => setTourStep(0)}
                    className="text-gray-400 hover:text-black hover:scale-110 transition-all duration-300"
                    title={language === 'de' ? 'Hilfe & Tour' : 'Help & Tour'}
                >
                    <HelpCircle size={24} />
                </button>

                {/* Settings Button */}
                <button
                    ref={settingsBtnRef}
                    onClick={() => setShowSettings(true)}
                    className="text-gray-400 hover:text-black hover:rotate-90 transition-all duration-300"
                    title={language === 'de' ? 'Einstellungen' : 'Settings'}
                >
                    <Settings size={24} />
                </button>
            </div>

            {/* Tape Effect */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-10 bg-pink-200 opacity-80 -rotate-1 shadow-sm z-20" style={{clipPath: 'polygon(2% 0, 100% 0, 98% 100%, 0% 100%)'}}></div>

            {/* Title Section */}
            <div className="mb-6 mt-2 text-center relative flex flex-col items-center">
                <div className="relative w-full h-52 md:h-72 flex items-center justify-center px-2">
                    <img
                        src={logoImg}
                        alt="Jazz's Smartass Silencer"
                        className="w-full h-full object-contain transform -rotate-1 hover:rotate-0 transition-transform duration-300 drop-shadow-sm"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = document.getElementById('title-fallback');
                            if (fallback) fallback.style.display = 'block';
                        }}
                    />
                    <div id="title-fallback" style={{display: 'none'}} className="w-full h-full">
                        <ScribbleHeader
                            text={language === 'de' ? "Der Rausschmeißer" : "Jazz's Smartass Silencer"}
                            className="w-full h-full" 
                        />
                    </div>
                </div>
            </div>

            {step === 'input' && (
                <div className="flex flex-col gap-4">
                    <div className="relative">
                        <div className="mb-4 mt-4 h-20 w-full overflow-visible">
                           <ScribbleHeader
                                text={isRecording
                                    ? (language === 'de' ? "Höre zu..." : "Listening...")
                                    : (language === 'de' ? "Na los, erzähl schon" : "Go on then, let's hear it")
                                }
                                delay={0.2}
                                color={isRecording ? "#ef4444" : "#2a2a2a"}
                            />
                        </div>

                        <div className="relative">
                            <RoughHighlight show={inputFocused} type="bracket" color="#ef4444" padding={4} strokeWidth={2} iterations={2} animationDuration={400}>
                                <textarea 
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onFocus={() => setInputFocused(true)}
                                    onBlur={() => setInputFocused(false)}
                                    className={`w-full h-40 wobbly-input p-4 pb-12 text-lg md:text-xl bg-gray-50 focus:bg-white focus:ring-0 outline-none resize-none font-hand text-gray-800 leading-normal shadow-inner placeholder:text-gray-300 relative z-10 transition-all duration-300 ${inputFocused ? 'scale-[1.01] shadow-lg' : ''}`}
                                    placeholder={language === 'de' ? "z.B. 'Eigentlich ist HTML eine Programmiersprache'" : "e.g. 'Actually, HTML is a programming language'"}
                                />
                            </RoughHighlight>

                            <button
                                onClick={toggleRecording}
                                className={`absolute bottom-3 right-3 p-2 rounded-full transition-all duration-300 z-20 ${
                                    isRecording
                                    ? "text-red-500 animate-pulse"
                                    : "text-gray-400/50 hover:text-gray-600 hover:opacity-100"
                                }`}
                                title={language === 'de' ? 'Spracheingabe umschalten' : 'Toggle voice input'}
                            >
                                {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
                            </button>
                        </div>
                    </div>

                    <RoughHighlight show={btnHovered} type="circle" color="#000" padding={10} iterations={1} strokeWidth={2}>
                        <button 
                        ref={actionBtnRef}
                        onClick={() => { playClickSound(); handleSilencer(); }}
                        onMouseEnter={() => setBtnHovered(true)}
                        onMouseLeave={() => setBtnHovered(false)}
                        disabled={!input.trim()}
                        className="w-full wobbly-box bg-red-400 px-8 py-4 text-2xl md:text-3xl font-black flex items-center justify-center gap-3 hover:bg-red-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 hover:scale-[1.02] active:scale-95 active:translate-y-1 transition-all duration-150 mt-2"
                        >
                        {language === 'de' ? "Bullshit Analysieren" : "Analyse Bullshit"}
                        </button>
                    </RoughHighlight>

                    {error && (
                        <div className="wobbly-box bg-red-100 p-4 flex items-center gap-3 text-red-600 text-xl font-bold rotate-1 animate-bounce">
                            <Coffee size={24} /> {error}
                        </div>
                    )}
                </div>
            )}

            {step === 'loading' && (
                <div className="h-80 flex flex-col items-center justify-center gap-6 animate-in fade-in duration-300">
                    <PongLoader />
                    <div className="text-center w-full">
                        <h2 className="text-3xl font-black animate-bounce min-h-[4rem] flex items-center justify-center px-4">
                            {loadingMsg}
                        </h2>
                        <p className="text-gray-500 font-bold mt-2">
                             {language === 'de' ? "Tee trinken, Fehler verurteilen." : "Sipping tea, judging errors."}
                        </p>
                    </div>
                </div>
            )}

            {step === 'rage' && (
                <div className="min-h-[300px] flex flex-col items-center justify-center animate-in fade-in duration-300">
                    <RageMeter onComplete={handleRageComplete} language={language} />
                </div>
            )}

            {step === 'result' && (
                <div className="animate-crossfade">
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
                             {/* Re-added Audio Playback Control */}
                             {audioBufferRef.current && (
                                <button
                                    onClick={playAudio}
                                    disabled={isPlaying}
                                    title={isPlaying ? (language === 'de' ? 'Spricht...' : 'Speaking...') : (language === 'de' ? 'Anhören' : 'Listen')}
                                    className={`p-2 rounded-full border-2 transition-all ${
                                        isPlaying
                                            ? 'border-green-500 text-green-700 bg-green-50'
                                            : 'border-black text-black hover:bg-yellow-100'
                                    }`}
                                >
                                    <Volume2 size={24} className={isPlaying ? "animate-pulse" : ""} />
                                </button>
                             )}

                            <button onClick={reset} className="text-gray-400 hover:text-black font-bold underline decoration-wavy flex items-center gap-1 group">
                                <PenTool size={16} className="group-hover:rotate-12 transition-transform"/> 
                                {language === 'de' ? "Neues Opfer" : "New Target"}
                            </button>
                        </div>
                    </div>

                    {renderResult()}
                </div>
            )}
            
            {/* Footer */}
            <div className="mt-6 pt-4 border-t-2 border-dashed border-gray-200/50 flex flex-col items-center text-center">
                <div className="font-bold text-base text-gray-600 rotate-1 mb-2">
                    {language === 'de' ? 'Kaffee trinken, urteilen' : 'Drinking coffee, passing judgement'}
                </div>
                <div className="text-sm text-gray-400 font-bold -rotate-1">
                    {language === 'de' ? 'Verantwortungsvoll nutzen' : 'Use responsibly'}
                </div>
            </div>

            {/* Onboarding Overlay - Only show on input screen */}
            {tourStep !== null && step === 'input' && (
                <OnboardingGuide 
                    step={tourStep}
                    onNext={() => {
                        if (tourStep < 3) {
                            setTourStep(tourStep + 1);
                        } else {
                            setTourStep(null);
                        }
                    }}
                    onClose={() => setTourStep(null)}
                    refs={{
                        settings: settingsBtnRef,
                        input: inputRef,
                        button: actionBtnRef
                    }}
                    language={language}
                />
            )}

        </div>
      </div>

    </div>
  );
};

const root = createRoot(document.getElementById("root"));
root.render(<App />);