import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { type Snippet } from "@/bindings";
import { useSnippetsStore } from "@/stores/snippetsStore";
import { Button } from "../../ui/Button";
import { SnippetListItem } from "./SnippetListItem";
import { SnippetFormModal } from "./SnippetFormModal";

export const SnippetsSettings: React.FC = () => {
  const { t } = useTranslation();
  const {
    snippets,
    loading,
    fetchSnippets,
    createSnippet,
    updateSnippet,
    deleteSnippet,
  } = useSnippetsStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);

  useEffect(() => {
    fetchSnippets();
  }, [fetchSnippets]);

  const handleCreate = async (trigger: string, expansion: string) => {
    await createSnippet(trigger, expansion);
    toast.success(t("settings.snippets.created"));
  };

  const handleEdit = async (trigger: string, expansion: string) => {
    if (!editingSnippet) return;
    await updateSnippet(
      editingSnippet.id,
      trigger,
      expansion,
      editingSnippet.is_enabled,
    );
    toast.success(t("settings.snippets.updated"));
  };

  const handleToggle = async (snippet: Snippet) => {
    try {
      await updateSnippet(
        snippet.id,
        snippet.trigger,
        snippet.expansion,
        !snippet.is_enabled,
      );
    } catch (err) {
      toast.error(t("settings.snippets.errors.toggleFailed"));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSnippet(id);
      toast.success(t("settings.snippets.deleted"));
    } catch (err) {
      toast.error(t("settings.snippets.errors.deleteFailed"));
    }
  };

  return (
    <div className="max-w-3xl w-full mx-auto space-y-6">
      <div className="space-y-2">
        <div className="px-4 flex items-center justify-between">
          <h2 className="text-xs font-medium text-text-secondary uppercase tracking-wide">
            {t("settings.snippets.listTitle")}
          </h2>
          <Button
            variant="secondary"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-4 h-4" />
            <span>{t("settings.snippets.addButton")}</span>
          </Button>
        </div>
        <div className="bg-background border border-mid-gray/20 rounded-lg overflow-visible">
          {loading ? (
            <div className="px-4 py-3 text-center text-text-secondary text-sm">
              {t("settings.snippets.loading")}
            </div>
          ) : snippets.length === 0 ? (
            <div className="px-4 py-8 text-center space-y-2">
              <p className="text-sm text-text-secondary">
                {t("settings.snippets.empty")}
              </p>
              <p className="text-xs text-text-secondary">
                {t("settings.snippets.emptyHint")}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-mid-gray/20">
              {snippets.map((snippet) => (
                <SnippetListItem
                  key={snippet.id}
                  snippet={snippet}
                  onEdit={(s) => setEditingSnippet(s)}
                  onDelete={handleDelete}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <SnippetFormModal
          onClose={() => setShowAddModal(false)}
          onSave={handleCreate}
        />
      )}

      {editingSnippet && (
        <SnippetFormModal
          snippet={editingSnippet}
          onClose={() => setEditingSnippet(null)}
          onSave={handleEdit}
        />
      )}
    </div>
  );
};
