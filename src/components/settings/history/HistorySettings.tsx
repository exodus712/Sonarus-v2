import React, { useCallback, useEffect, useRef, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { readFile, writeTextFile } from "@tauri-apps/plugin-fs";
import {
  Check,
  Copy,
  Download,
  FolderOpen,
  Play,
  RotateCcw,
  Trash2,
  Search,
  X,
} from "lucide-react";
import AnimatedStar from "../../icons/AnimatedStar";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  commands,
  events,
  type HistoryEntry,
  type HistoryUpdatePayload,
} from "@/bindings";
import { useOsType } from "@/hooks/useOsType";
import { formatDateTime } from "@/utils/dateFormat";
import { Button } from "../../ui/Button";
import {
  TranscriptViewerContainer,
  TranscriptViewerWords,
  TranscriptViewerPlayPauseButton,
  TranscriptViewerScrubBar,
  TranscriptViewerAudio,
  generateEstimatedAlignment,
  type TranscriptAlignment,
} from "../../ui/TranscriptViewer";

const IconButton: React.FC<{
  onClick: () => void;
  title: string;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}> = ({
  onClick,
  title,
  disabled,
  active,
  children,
  onMouseEnter,
  onMouseLeave,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    className={`p-1.5 rounded-md flex items-center justify-center transition-colors cursor-pointer disabled:cursor-not-allowed disabled:text-text-secondary ${
      active
        ? "text-logo-primary hover:text-logo-primary/80"
        : "text-text-secondary hover:text-logo-primary"
    }`}
    title={title}
  >
    {children}
  </button>
);

const PAGE_SIZE = 30;

interface OpenRecordingsButtonProps {
  onClick: () => void;
  label: string;
}

const OpenRecordingsButton: React.FC<OpenRecordingsButtonProps> = ({
  onClick,
  label,
}) => (
  <Button
    onClick={onClick}
    variant="secondary"
    size="sm"
    className="flex items-center gap-2"
    title={label}
  >
    <FolderOpen className="w-4 h-4" />
    <span>{label}</span>
  </Button>
);

export const HistorySettings: React.FC = () => {
  const { t } = useTranslation();
  const osType = useOsType();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const entriesRef = useRef<HistoryEntry[]>([]);
  const loadingRef = useRef(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keep ref in sync for use in IntersectionObserver callback
  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  const loadPage = useCallback(async (cursor?: number, query?: string) => {
    const isFirstPage = cursor === undefined;
    if (!isFirstPage && loadingRef.current) return;
    loadingRef.current = true;

    if (isFirstPage) setLoading(true);

    try {
      const result = query?.trim()
        ? await commands.searchHistoryEntries(query, cursor ?? null, PAGE_SIZE)
        : await commands.getHistoryEntries(cursor ?? null, PAGE_SIZE);

      if (result.status === "ok") {
        const { entries: newEntries, has_more } = result.data;
        setEntries((prev) =>
          isFirstPage ? newEntries : [...prev, ...newEntries],
        );
        setHasMore(has_more);
      } else {
        console.error("Search failed:", result.error);
      }
    } catch (error) {
      console.error("Failed to load history entries:", error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadPage(undefined, searchQuery);
  }, [loadPage, searchQuery]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (loading) return;

    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (observerEntries) => {
        const first = observerEntries[0];
        if (first.isIntersecting) {
          const lastEntry = entriesRef.current[entriesRef.current.length - 1];
          if (lastEntry) {
            loadPage(lastEntry.id, searchQuery);
          }
        }
      },
      { threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loading, hasMore, loadPage, searchQuery]);

  // Listen for new entries added from the transcription pipeline
  useEffect(() => {
    const unlisten = events.historyUpdatePayload.listen((event) => {
      const payload: HistoryUpdatePayload = event.payload;
      if (payload.action === "added") {
        setEntries((prev) => [payload.entry, ...prev]);
      } else if (payload.action === "updated") {
        setEntries((prev) =>
          prev.map((e) => (e.id === payload.entry.id ? payload.entry : e)),
        );
      }
      // "deleted" and "toggled" are handled by optimistic updates only,
      // so we intentionally ignore them here to avoid double-mutation.
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setIsSearching(value.length > 0);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    searchInputRef.current?.focus();
  };

  const toggleSaved = async (id: number) => {
    // Optimistic update
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, saved: !e.saved } : e)),
    );
    try {
      const result = await commands.toggleHistoryEntrySaved(id);
      if (result.status !== "ok") {
        // Revert on failure
        setEntries((prev) =>
          prev.map((e) => (e.id === id ? { ...e, saved: !e.saved } : e)),
        );
      }
    } catch (error) {
      console.error("Failed to toggle saved status:", error);
      // Revert on failure
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, saved: !e.saved } : e)),
      );
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  const getAudioUrl = useCallback(
    async (fileName: string) => {
      try {
        const result = await commands.getAudioFilePath(fileName);
        if (result.status === "ok") {
          if (osType === "linux") {
            const fileData = await readFile(result.data);
            const blob = new Blob([fileData], { type: "audio/wav" });
            return URL.createObjectURL(blob);
          }
          return convertFileSrc(result.data, "asset");
        }
        return null;
      } catch (error) {
        console.error("Failed to get audio file path:", error);
        return null;
      }
    },
    [osType],
  );

  const deleteAudioEntry = async (id: number) => {
    // Optimistically remove
    setEntries((prev) => prev.filter((e) => e.id !== id));
    try {
      const result = await commands.deleteHistoryEntry(id);
      if (result.status !== "ok") {
        // Reload on failure
        loadPage();
      }
    } catch (error) {
      console.error("Failed to delete entry:", error);
      loadPage();
    }
  };

  const retryHistoryEntry = async (id: number) => {
    const result = await commands.retryHistoryEntryTranscription(id);
    if (result.status !== "ok") {
      throw new Error(String(result.error));
    }
  };

  const openRecordingsFolder = async () => {
    try {
      const result = await commands.openRecordingsFolder();
      if (result.status !== "ok") {
        throw new Error(String(result.error));
      }
    } catch (error) {
      console.error("Failed to open recordings folder:", error);
    }
  };

  const filteredEntries = searchQuery.trim()
    ? entries.filter(
        (entry) =>
          entry.transcription_text
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          entry.title.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : entries;

  let content: React.ReactNode;

  if (loading) {
    content = (
      <div className="px-4 py-3 text-center text-text-secondary">
        {t("settings.history.loading")}
      </div>
    );
  } else if (filteredEntries.length === 0) {
    content = (
      <div className="px-4 py-3 text-center text-text-secondary">
        {isSearching
          ? t("settings.history.noSearchResults")
          : t("settings.history.empty")}
      </div>
    );
  } else {
    content = (
      <>
        <div className="divide-y divide-mid-gray/20">
          {filteredEntries.map((entry) => (
            <HistoryEntryComponent
              key={entry.id}
              entry={entry}
              onToggleSaved={() => toggleSaved(entry.id)}
              onCopyText={() => copyToClipboard(entry.transcription_text)}
              getAudioUrl={getAudioUrl}
              deleteAudio={deleteAudioEntry}
              retryTranscription={retryHistoryEntry}
              searchQuery={searchQuery}
            />
          ))}
        </div>
        {/* Sentinel for infinite scroll */}
        <div ref={sentinelRef} className="h-1" />
      </>
    );
  }

  return (
    <div className="max-w-3xl w-full mx-auto space-y-6">
      <div className="space-y-2">
        <div className="px-4 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-medium text-text-secondary uppercase tracking-wide">
              {t("settings.history.title")}
            </h2>
          </div>
          <OpenRecordingsButton
            onClick={openRecordingsFolder}
            label={t("settings.history.openFolder")}
          />
        </div>
        {/* Search input */}
        <div className="px-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder={t("settings.history.searchPlaceholder")}
              className="w-full pl-10 pr-10 py-2 bg-bg-primary border border-border-primary rounded-lg text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-logo-primary"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-bg-secondary text-text-secondary hover:text-text-primary transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
        <div className="bg-background border border-mid-gray/20 rounded-lg overflow-visible">
          {content}
        </div>
      </div>
    </div>
  );
};

interface HistoryEntryProps {
  entry: HistoryEntry;
  onToggleSaved: () => void;
  onCopyText: () => void;
  getAudioUrl: (fileName: string) => Promise<string | null>;
  deleteAudio: (id: number) => Promise<void>;
  retryTranscription: (id: number) => Promise<void>;
  searchQuery?: string;
}

const HistoryEntryComponent: React.FC<HistoryEntryProps> = ({
  entry,
  onToggleSaved,
  onCopyText,
  getAudioUrl,
  deleteAudio,
  retryTranscription,
  searchQuery = "",
}) => {
  const { t, i18n } = useTranslation();
  const [showCopied, setShowCopied] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [starHover, setStarHover] = useState(false);
  const [starTap, setStarTap] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [alignment, setAlignment] = useState<TranscriptAlignment | null>(null);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);
  const [duration, setDuration] = useState(0);

  const hasTranscription = entry.transcription_text.trim().length > 0;

  // Reset playing state when component unmounts or entry changes
  useEffect(() => {
    setIsPlaying(false);
    setHasStarted(false);
    setHasFinished(false);
  }, [entry.id]);

  // Load audio URL and generate alignment on mount
  useEffect(() => {
    let cancelled = false;

    const loadAudio = async () => {
      try {
        const url = await getAudioUrl(entry.file_name);
        if (cancelled) return;

        if (url) {
          setAudioUrl(url);

          // Get audio duration to generate accurate alignment
          const audio = new Audio(url);
          audio.addEventListener("loadedmetadata", () => {
            if (!cancelled) {
              const newAlignment = generateEstimatedAlignment(
                entry.transcription_text,
                audio.duration,
              );
              setAlignment(newAlignment);
              setDuration(audio.duration);
              setAudioLoaded(true);
            }
          });

          audio.addEventListener("error", () => {
            // Fallback: estimate based on speaking rate (150 words/min)
            if (!cancelled) {
              const words = entry.transcription_text
                .trim()
                .split(/\s+/)
                .filter(Boolean);
              const estimatedDuration = (words.length / 150) * 60;
              const newAlignment = generateEstimatedAlignment(
                entry.transcription_text,
                estimatedDuration,
              );
              setAlignment(newAlignment);
              setDuration(estimatedDuration);
              setAudioLoaded(true);
            }
          });
        }
      } catch (error) {
        console.error("Failed to load audio:", error);
      }
    };

    if (hasTranscription) {
      loadAudio();
    }

    return () => {
      cancelled = true;
    };
  }, [
    entry.file_name,
    entry.transcription_text,
    getAudioUrl,
    hasTranscription,
  ]);

  const formatTime = (time: number): string => {
    if (!isFinite(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Function to highlight search matches in text
  const highlightText = (text: string, query: string): React.ReactNode => {
    if (!query.trim()) return text;

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let searchIndex = 0;

    while (true) {
      const matchIndex = lowerText.indexOf(lowerQuery, searchIndex);
      if (matchIndex === -1) break;

      // Add text before match
      if (matchIndex > lastIndex) {
        parts.push(text.slice(lastIndex, matchIndex));
      }

      // Add highlighted match
      const matchText = text.slice(matchIndex, matchIndex + query.length);
      parts.push(
        <mark
          key={matchIndex}
          className="bg-logo-primary/20 text-logo-primary rounded px-0.5"
        >
          {matchText}
        </mark>,
      );

      lastIndex = matchIndex + query.length;
      searchIndex = lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  const handleCopyText = () => {
    if (!hasTranscription) {
      return;
    }

    onCopyText();
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const buildExportFileName = () => {
    const rawTitle = entry.title?.trim() || "transcription";
    const safeTitle = rawTitle.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_");
    const normalizedTitle = safeTitle.replace(/\s+/g, " ").trim();
    return `${normalizedTitle || "transcription"}.md`;
  };

  const buildMarkdownContent = () => {
    const timestamp = formatDateTime(String(entry.timestamp), i18n.language);
    return `# Transcription\n\n- Date: ${timestamp}\n\n${entry.transcription_text.trim()}\n`;
  };

  const handleExportMarkdown = async () => {
    if (!hasTranscription || retrying) {
      return;
    }

    try {
      const filePath = await save({
        defaultPath: buildExportFileName(),
        filters: [{ name: "Markdown", extensions: ["md"] }],
      });

      if (!filePath) {
        return;
      }

      await writeTextFile(filePath, buildMarkdownContent());
      toast.success(t("settings.history.exportSuccess"));
    } catch (error) {
      console.error("Failed to export transcription:", error);
      toast.error(t("settings.history.exportError"));
    }
  };

  const handleDeleteEntry = async () => {
    try {
      await deleteAudio(entry.id);
    } catch (error) {
      console.error("Failed to delete entry:", error);
      toast.error(t("settings.history.deleteError"));
    }
  };

  const handleRetranscribe = async () => {
    try {
      setRetrying(true);
      await retryTranscription(entry.id);
    } catch (error) {
      console.error("Failed to re-transcribe:", error);
      // Show the specific error message from the backend if available
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toast.error(t("settings.history.retranscribeError"), {
        description: errorMessage,
      });
    } finally {
      setRetrying(false);
    }
  };

  const handleStarClick = () => {
    setStarTap(true);
    onToggleSaved();
    setTimeout(() => setStarTap(false), 600);
  };

  const formattedDate = formatDateTime(String(entry.timestamp), i18n.language);

  return (
    <div className="px-4 py-2 pb-5 flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <p className="text-sm font-medium">{formattedDate}</p>
        <div className="flex items-center">
          <IconButton
            onClick={handleExportMarkdown}
            disabled={!hasTranscription || retrying}
            title={t("settings.history.exportMarkdown")}
          >
            <Download width={16} height={16} />
          </IconButton>
          <IconButton
            onClick={handleCopyText}
            disabled={!hasTranscription || retrying}
            title={t("settings.history.copyToClipboard")}
          >
            {showCopied ? (
              <Check width={16} height={16} />
            ) : (
              <CopyIcon
                size={16}
                animation="default-loop"
                animateOnHover={true}
              />
            )}
          </IconButton>
          <IconButton
            onClick={handleStarClick}
            disabled={retrying}
            active={entry.saved}
            title={
              entry.saved
                ? t("settings.history.unsave")
                : t("settings.history.save")
            }
            onMouseEnter={() => setStarHover(true)}
            onMouseLeave={() => setStarHover(false)}
          >
            <AnimatedStar
              size={16}
              fill={entry.saved ? "currentColor" : "none"}
              isSaved={entry.saved}
              onHover={starHover}
              onTap={starTap}
            />
          </IconButton>
          <IconButton
            onClick={handleRetranscribe}
            disabled={retrying}
            title={t("settings.history.retranscribe")}
          >
            <div
              className={`transition-transform duration-200 hover:-rotate-45 ${retrying ? "animate-[spin_1s_linear_infinite_reverse]" : ""}`}
            >
              <RotateCcw width={16} height={16} />
            </div>
          </IconButton>
          <IconButton
            onClick={handleDeleteEntry}
            disabled={retrying}
            title={t("settings.history.delete")}
          >
            <Trash2Icon
              size={16}
              animation="default-loop"
              animateOnHover={true}
            />
          </IconButton>
        </div>
      </div>

      {/* Transcript Viewer with word-by-word highlighting - show during play and pause, hide when finished */}
      {audioUrl &&
        alignment &&
        !retrying &&
        hasTranscription &&
        hasStarted &&
        !hasFinished && (
          <TranscriptViewerContainer
            audioSrc={audioUrl}
            alignment={alignment}
            onPlay={() => {
              setIsPlaying(true);
              setHasStarted(true);
              setHasFinished(false);
            }}
            onPause={() => setIsPlaying(false)}
            onEnded={() => {
              setIsPlaying(false);
              setHasStarted(false);
              setHasFinished(true);
            }}
          >
            <div className="space-y-3">
              {/* Words with search highlighting integrated */}
              <TranscriptViewerWords
                renderWord={({ word, status, index }) => {
                  // Check if this word matches the search query
                  const lowerWord = word.word.toLowerCase();
                  const lowerQuery = searchQuery.toLowerCase().trim();
                  const isMatch = lowerQuery && lowerWord.includes(lowerQuery);

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
                      className={`${baseClasses} ${statusClasses[status]} ${
                        isMatch ? "bg-logo-primary/20 text-logo-primary" : ""
                      }`}
                    >
                      {word.word}
                    </span>
                  );
                }}
              />

              {/* Playback controls */}
              <div className="flex items-center gap-3">
                <TranscriptViewerPlayPauseButton />
                <TranscriptViewerScrubBar />
              </div>
            </div>
            <TranscriptViewerAudio />
          </TranscriptViewerContainer>
        )}

      {/* Show simple text + scrub bar when playback hasn't started or has finished */}
      {(!audioUrl ||
        !alignment ||
        !hasTranscription ||
        retrying ||
        !hasStarted ||
        hasFinished) && (
        <>
          <p
            className={`italic text-sm pb-2 ${
              retrying
                ? ""
                : hasTranscription
                  ? "text-text-primary select-text cursor-text whitespace-pre-wrap wrap-break-word"
                  : "text-text-secondary"
            }`}
            style={
              retrying
                ? { animation: "transcribe-pulse 3s ease-in-out infinite" }
                : undefined
            }
          >
            {retrying && (
              <style>{`
                @keyframes transcribe-pulse {
                  0%, 100% { color: color-mix(in srgb, var(--color-text) 40%, transparent); }
                  50% { color: color-mix(in srgb, var(--color-text) 90%, transparent); }
                }
              `}</style>
            )}
            {retrying
              ? t("settings.history.transcribing")
              : hasTranscription
                ? highlightText(entry.transcription_text, searchQuery)
                : t("settings.history.transcriptionFailed")}
          </p>

          {/* Scrub bar always visible when audio is available - clicking play switches to TranscriptViewer */}
          {audioUrl && alignment && !retrying && hasTranscription && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setIsPlaying(true);
                  setHasStarted(true);
                  setHasFinished(false);
                }}
                className="transition-colors cursor-pointer text-text-primary hover:text-logo-primary"
                aria-label="Play"
              >
                <Play width={20} height={20} fill="currentColor" />
              </button>

              <span className="text-xs text-text-secondary min-w-[30px] tabular-nums">
                {formatTime(0)}
              </span>

              <div className="flex-1 h-1 rounded-lg bg-mid-gray/20" />

              <span className="text-xs text-text-secondary min-w-[30px] tabular-nums">
                {formatTime(duration)}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};
