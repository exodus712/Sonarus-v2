import React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { type Snippet } from "@/bindings";

interface SnippetListItemProps {
  snippet: Snippet;
  onEdit: (snippet: Snippet) => void;
  onDelete: (id: number) => void;
  onToggle: (snippet: Snippet) => void;
}

export const SnippetListItem: React.FC<SnippetListItemProps> = ({
  snippet,
  onEdit,
  onDelete,
  onToggle,
}) => {
  const { t } = useTranslation();

  const expansionPreview =
    snippet.expansion.length > 80
      ? snippet.expansion.slice(0, 80) + "…"
      : snippet.expansion;

  return (
    <div
      className={`px-4 py-3 flex items-center gap-3 ${!snippet.is_enabled ? "opacity-50" : ""}`}
    >
      <label className="inline-flex items-center cursor-pointer shrink-0">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={snippet.is_enabled}
          onChange={() => onToggle(snippet)}
        />
        <div className="relative w-8 h-4 bg-mid-gray/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-background-ui" />
      </label>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-text-primary bg-logo-primary/10 border border-logo-primary/20 rounded px-2 py-0.5 font-mono shrink-0">
            {snippet.trigger}
          </span>
          <span
            className="text-text-secondary text-xs shrink-0"
            aria-hidden="true"
          >
            {"→"}
          </span>
          <span className="text-sm text-text-secondary truncate">
            {expansionPreview}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onEdit(snippet)}
          className="p-1.5 rounded-md text-text-secondary hover:text-logo-primary transition-colors cursor-pointer"
          title={t("settings.snippets.edit")}
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(snippet.id)}
          className="p-1.5 rounded-md text-text-secondary hover:text-red-400 transition-colors cursor-pointer"
          title={t("settings.snippets.delete")}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
