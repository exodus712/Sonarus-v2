import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../ui/Button";
import { Textarea } from "../../ui/Textarea";
import { type Snippet } from "@/bindings";

const TRIGGER_MAX = 75;
const EXPANSION_MAX = 2000;

interface SnippetFormModalProps {
  snippet?: Snippet;
  onClose: () => void;
  onSave: (trigger: string, expansion: string) => Promise<void>;
}

export const SnippetFormModal: React.FC<SnippetFormModalProps> = ({
  snippet,
  onClose,
  onSave,
}) => {
  const { t } = useTranslation();
  const [trigger, setTrigger] = useState(snippet?.trigger ?? "");
  const [expansion, setExpansion] = useState(snippet?.expansion ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const triggerRef = useRef<HTMLInputElement>(null);
  const isEdit = !!snippet;

  useEffect(() => {
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const handleSave = async () => {
    const trimmedTrigger = trigger.trim();
    if (!trimmedTrigger) {
      setError(t("settings.snippets.errors.emptyTrigger"));
      return;
    }
    if (trimmedTrigger.length > TRIGGER_MAX) {
      setError(
        t("settings.snippets.errors.triggerTooLong", { max: TRIGGER_MAX }),
      );
      return;
    }
    if (expansion.length > EXPANSION_MAX) {
      setError(
        t("settings.snippets.errors.expansionTooLong", { max: EXPANSION_MAX }),
      );
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(trimmedTrigger, expansion);
      onClose();
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      e.target instanceof HTMLInputElement
    ) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-background border border-mid-gray/20 rounded-xl shadow-xl w-full max-w-md mx-4 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium text-text-primary">
            {isEdit
              ? t("settings.snippets.editTitle")
              : t("settings.snippets.addTitle")}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                {t("settings.snippets.triggerLabel")}
              </label>
              <span
                className={`text-xs ${trigger.length > TRIGGER_MAX ? "text-red-400" : "text-text-secondary"}`}
              >
                {trigger.length}/{TRIGGER_MAX}
              </span>
            </div>
            <input
              ref={triggerRef}
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("settings.snippets.triggerPlaceholder")}
              className="w-full px-3 py-2 text-sm font-mono bg-mid-gray/10 border border-mid-gray/80 rounded-md text-start transition-all duration-150 hover:bg-logo-primary/10 hover:border-logo-primary focus:outline-none focus:bg-logo-primary/20 focus:border-logo-primary"
              maxLength={TRIGGER_MAX + 1}
            />
            <p className="text-xs text-text-secondary">
              {t("settings.snippets.triggerHint")}
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                {t("settings.snippets.expansionLabel")}
              </label>
              <span
                className={`text-xs ${expansion.length > EXPANSION_MAX ? "text-red-400" : "text-text-secondary"}`}
              >
                {expansion.length}/{EXPANSION_MAX}
              </span>
            </div>
            <Textarea
              value={expansion}
              onChange={(e) => setExpansion(e.target.value)}
              placeholder={t("settings.snippets.expansionPlaceholder")}
              className="w-full min-h-[100px] font-normal"
              maxLength={EXPANSION_MAX + 1}
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={saving}
          >
            {t("settings.snippets.cancel")}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={saving || !trigger.trim()}
          >
            {saving
              ? t("settings.snippets.saving")
              : isEdit
                ? t("settings.snippets.saveChanges")
                : t("settings.snippets.add")}
          </Button>
        </div>
      </div>
    </div>
  );
};
