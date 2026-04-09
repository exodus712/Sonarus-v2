import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { Play, Pause } from "lucide-react";

// Types
export interface WordAlignment {
  word: string;
  start: number; // Start time in seconds
  end: number; // End time in seconds
}

export interface TranscriptAlignment {
  words: WordAlignment[];
  duration: number;
}

interface TranscriptViewerContextValue {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  words: WordAlignment[];
  currentWordIndex: number;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  play: () => void;
  pause: () => void;
  seekToTime: (time: number) => void;
  seekToWord: (index: number) => void;
}

const TranscriptViewerContext =
  createContext<TranscriptViewerContextValue | null>(null);

const useTranscriptViewerContext = () => {
  const context = useContext(TranscriptViewerContext);
  if (!context) {
    throw new Error(
      "useTranscriptViewerContext must be used within a TranscriptViewerContainer",
    );
  }
  return context;
};

// Generate estimated word alignment based on audio duration
// This is used when we don't have actual word-level timing from the transcription engine
export function generateEstimatedAlignment(
  text: string,
  duration: number,
): TranscriptAlignment {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const avgWordDuration = duration / Math.max(words.length, 1);

  const alignedWords: WordAlignment[] = words.map((word, index) => ({
    word,
    start: index * avgWordDuration,
    end: Math.min((index + 1) * avgWordDuration, duration),
  }));

  return {
    words: alignedWords,
    duration,
  };
}

// Container Component
interface TranscriptViewerContainerProps {
  audioSrc: string;
  alignment: TranscriptAlignment;
  children: React.ReactNode;
  onPlay?: () => void;
  onPause?: () => void;
  onTimeUpdate?: (time: number) => void;
  onEnded?: () => void;
}

export const TranscriptViewerContainer: React.FC<
  TranscriptViewerContainerProps
> = ({
  audioSrc,
  alignment,
  children,
  onPlay,
  onPause,
  onTimeUpdate,
  onEnded,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(alignment.duration);

  // Calculate current word index based on time
  const currentWordIndex = useMemo(() => {
    const index = alignment.words.findIndex(
      (word) => currentTime >= word.start && currentTime < word.end,
    );
    return index === -1
      ? currentTime >= alignment.duration
        ? alignment.words.length - 1
        : 0
      : index;
  }, [currentTime, alignment.words, alignment.duration]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const time = audio.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [onPlay, onPause, onTimeUpdate, onEnded]);

  const play = useCallback(() => {
    audioRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const seekToTime = useCallback(
    (time: number) => {
      if (audioRef.current) {
        audioRef.current.currentTime = Math.max(0, Math.min(time, duration));
      }
    },
    [duration],
  );

  const seekToWord = useCallback(
    (index: number) => {
      const word = alignment.words[index];
      if (word && audioRef.current) {
        audioRef.current.currentTime = word.start;
      }
    },
    [alignment.words],
  );

  const value: TranscriptViewerContextValue = {
    audioRef,
    words: alignment.words,
    currentWordIndex,
    isPlaying,
    duration,
    currentTime,
    play,
    pause,
    seekToTime,
    seekToWord,
  };

  return (
    <TranscriptViewerContext.Provider value={value}>
      <audio ref={audioRef} src={audioSrc} preload="metadata" />
      {children}
    </TranscriptViewerContext.Provider>
  );
};

// Audio element (hidden, controlled via context)
export const TranscriptViewerAudio: React.FC = () => {
  // Audio is rendered by the container, this is just a placeholder for API compatibility
  return null;
};

// Words display component
interface TranscriptViewerWordsProps {
  renderWord?: (props: {
    word: WordAlignment;
    status: "spoken" | "unspoken" | "current";
    index: number;
  }) => React.ReactNode;
  wordClassNames?: string;
}

export const TranscriptViewerWords: React.FC<TranscriptViewerWordsProps> = ({
  renderWord,
  wordClassNames = "",
}) => {
  const { words, currentWordIndex, seekToWord } = useTranscriptViewerContext();

  const getWordStatus = (index: number): "spoken" | "unspoken" | "current" => {
    if (index < currentWordIndex) return "spoken";
    if (index === currentWordIndex) return "current";
    return "unspoken";
  };

  const defaultRenderWord = ({
    word,
    status,
    index,
  }: {
    word: WordAlignment;
    status: "spoken" | "unspoken" | "current";
    index: number;
  }) => {
    const baseClasses =
      "cursor-pointer transition-colors duration-150 px-0.5 rounded";
    const statusClasses = {
      spoken: "text-text-secondary",
      current: "text-logo-primary font-medium bg-logo-primary/10",
      unspoken: "text-text-primary",
    };

    return (
      <span
        key={index}
        className={`${baseClasses} ${statusClasses[status]} ${wordClassNames}`}
        onClick={() => seekToWord(index)}
      >
        {word.word}
      </span>
    );
  };

  return (
    <div className="flex flex-wrap gap-x-1 gap-y-1 text-sm leading-relaxed">
      {words.map((word, index) =>
        (renderWord || defaultRenderWord)({
          word,
          status: getWordStatus(index),
          index,
        }),
      )}
    </div>
  );
};

// Play/Pause button
interface TranscriptViewerPlayPauseButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: number;
}

export const TranscriptViewerPlayPauseButton: React.FC<
  TranscriptViewerPlayPauseButtonProps
> = ({ className = "", size = 20, ...props }) => {
  const { isPlaying, play, pause } = useTranscriptViewerContext();

  return (
    <button
      onClick={isPlaying ? pause : play}
      className={`transition-colors cursor-pointer text-text-primary hover:text-logo-primary disabled:opacity-50 ${className}`}
      aria-label={isPlaying ? "Pause" : "Play"}
      {...props}
    >
      {isPlaying ? (
        <Pause width={size} height={size} fill="currentColor" />
      ) : (
        <Play width={size} height={size} fill="currentColor" />
      )}
    </button>
  );
};

// Scrub bar component
interface TranscriptViewerScrubBarProps {
  showTimeLabels?: boolean;
  labelsClassName?: string;
  trackClassName?: string;
  progressClassName?: string;
  thumbClassName?: string;
}

export const TranscriptViewerScrubBar: React.FC<
  TranscriptViewerScrubBarProps
> = ({ showTimeLabels = true, labelsClassName = "", trackClassName = "" }) => {
  const { duration, currentTime, seekToTime, isPlaying } =
    useTranscriptViewerContext();
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);

  const displayTime = isDragging ? dragTime : currentTime;
  const progressPercent = duration > 0 ? (displayTime / duration) * 100 : 0;

  const formatTime = (time: number): string => {
    if (!isFinite(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setDragTime(newTime);
    if (!isDragging) {
      seekToTime(newTime);
    }
  };

  const handleMouseDown = () => {
    setIsDragging(true);
    setDragTime(currentTime);
  };

  const handleMouseUp = () => {
    if (isDragging) {
      seekToTime(dragTime);
      setIsDragging(false);
    }
  };

  // Global mouse up handler for drag release
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseUp = () => {
        seekToTime(dragTime);
        setIsDragging(false);
      };

      document.addEventListener("mouseup", handleGlobalMouseUp);
      document.addEventListener("touchend", handleGlobalMouseUp);

      return () => {
        document.removeEventListener("mouseup", handleGlobalMouseUp);
        document.removeEventListener("touchend", handleGlobalMouseUp);
      };
    }
  }, [isDragging, dragTime, seekToTime]);

  return (
    <div className={`flex items-center gap-2 flex-1 ${labelsClassName}`}>
      {showTimeLabels && (
        <span className="text-xs text-text-secondary min-w-[30px] tabular-nums">
          {formatTime(displayTime)}
        </span>
      )}

      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.01}
        value={displayTime}
        onChange={handleSeek}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        className={`flex-1 h-1 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-logo-primary ${trackClassName}`}
        style={{
          background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${progressPercent}%, rgba(128, 128, 128, 0.2) ${progressPercent}%, rgba(128, 128, 128, 0.2) 100%)`,
        }}
      />

      {showTimeLabels && (
        <span className="text-xs text-text-secondary min-w-[30px] tabular-nums">
          {formatTime(duration)}
        </span>
      )}
    </div>
  );
};

// Hook for headless usage
export const useTranscriptViewer = () => {
  return useTranscriptViewerContext();
};

// Convenience combined component for simple usage
interface TranscriptViewerProps {
  audioSrc: string;
  text: string;
  audioDuration?: number;
  className?: string;
}

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({
  audioSrc,
  text,
  audioDuration,
  className = "",
}) => {
  const [alignment, setAlignment] = useState<TranscriptAlignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get actual audio duration and generate alignment
  useEffect(() => {
    const audio = new Audio(audioSrc);

    const handleLoadedMetadata = () => {
      const duration = audioDuration || audio.duration;
      const newAlignment = generateEstimatedAlignment(text, duration);
      setAlignment(newAlignment);
      setIsLoading(false);
    };

    const handleError = () => {
      // Fallback: estimate based on average speaking rate (150 words per minute)
      const words = text.trim().split(/\s+/).filter(Boolean);
      const estimatedDuration = (words.length / 150) * 60;
      const newAlignment = generateEstimatedAlignment(text, estimatedDuration);
      setAlignment(newAlignment);
      setIsLoading(false);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("error", handleError);

    // If already cached, loadedmetadata might have fired
    if (audio.readyState >= 1) {
      handleLoadedMetadata();
    }

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("error", handleError);
    };
  }, [audioSrc, text, audioDuration]);

  if (isLoading || !alignment) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-mid-gray/20 rounded w-full mb-2" />
        <div className="h-4 bg-mid-gray/20 rounded w-3/4" />
      </div>
    );
  }

  return (
    <TranscriptViewerContainer audioSrc={audioSrc} alignment={alignment}>
      <div className={`space-y-3 ${className}`}>
        <TranscriptViewerWords />
        <div className="flex items-center gap-3">
          <TranscriptViewerPlayPauseButton />
          <TranscriptViewerScrubBar />
        </div>
      </div>
    </TranscriptViewerContainer>
  );
};
