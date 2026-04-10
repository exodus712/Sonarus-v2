use anyhow::{anyhow, Result};
use log::{debug, error, info};
use regex::Regex;
use rusqlite::{params, Connection, OptionalExtension};
use rusqlite_migration::{Migrations, M};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::path::PathBuf;
use tauri::AppHandle;

static MIGRATIONS: &[M] = &[M::up(
    "CREATE TABLE IF NOT EXISTS snippets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trigger TEXT NOT NULL,
        expansion TEXT NOT NULL,
        is_enabled BOOLEAN NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_snippets_trigger ON snippets(trigger);",
)];

#[derive(Clone, Debug, Serialize, Deserialize, Type)]
pub struct Snippet {
    pub id: i64,
    pub trigger: String,
    pub expansion: String,
    pub is_enabled: bool,
    pub created_at: i64,
    pub updated_at: i64,
}

pub struct SnippetManager {
    db_path: PathBuf,
}

impl SnippetManager {
    pub fn new(app_handle: &AppHandle) -> Result<Self> {
        let app_data_dir = crate::portable::app_data_dir(app_handle)?;
        let db_path = app_data_dir.join("snippets.db");

        let manager = Self { db_path };
        manager.init_database()?;

        Ok(manager)
    }

    fn init_database(&self) -> Result<()> {
        info!("Initializing snippets database at {:?}", self.db_path);

        let mut conn = Connection::open(&self.db_path)?;

        let migrations = Migrations::new(MIGRATIONS.to_vec());

        #[cfg(debug_assertions)]
        migrations.validate().expect("Invalid snippets migrations");

        let version_before: i32 =
            conn.pragma_query_value(None, "user_version", |row| row.get(0))?;
        debug!("Snippets database version before migration: {}", version_before);

        migrations.to_latest(&mut conn)?;

        let version_after: i32 =
            conn.pragma_query_value(None, "user_version", |row| row.get(0))?;

        if version_after > version_before {
            info!(
                "Snippets database migrated from version {} to {}",
                version_before, version_after
            );
        } else {
            debug!("Snippets database already at latest version {}", version_after);
        }

        Ok(())
    }

    fn get_connection(&self) -> Result<Connection> {
        Ok(Connection::open(&self.db_path)?)
    }

    fn map_snippet(row: &rusqlite::Row<'_>) -> rusqlite::Result<Snippet> {
        Ok(Snippet {
            id: row.get("id")?,
            trigger: row.get("trigger")?,
            expansion: row.get("expansion")?,
            is_enabled: row.get("is_enabled")?,
            created_at: row.get("created_at")?,
            updated_at: row.get("updated_at")?,
        })
    }

    pub fn list_snippets(&self) -> Result<Vec<Snippet>> {
        let conn = self.get_connection()?;
        let mut stmt = conn.prepare(
            "SELECT id, trigger, expansion, is_enabled, created_at, updated_at
             FROM snippets
             ORDER BY created_at DESC",
        )?;
        let snippets = stmt
            .query_map([], Self::map_snippet)?
            .collect::<std::result::Result<Vec<_>, _>>()?;
        Ok(snippets)
    }

    pub fn create_snippet(&self, trigger: String, expansion: String) -> Result<Snippet> {
        let trigger = trigger.trim().to_string();
        if trigger.is_empty() {
            return Err(anyhow!("Trigger cannot be empty"));
        }
        if trigger.len() > 75 {
            return Err(anyhow!("Trigger cannot exceed 75 characters"));
        }
        if expansion.len() > 2000 {
            return Err(anyhow!("Expansion cannot exceed 2000 characters"));
        }

        let now = chrono::Utc::now().timestamp();
        let conn = self.get_connection()?;
        conn.execute(
            "INSERT INTO snippets (trigger, expansion, is_enabled, created_at, updated_at)
             VALUES (?1, ?2, 1, ?3, ?4)",
            params![&trigger, &expansion, now, now],
        )?;

        let id = conn.last_insert_rowid();
        debug!("Created snippet with id {}", id);

        Ok(Snippet {
            id,
            trigger,
            expansion,
            is_enabled: true,
            created_at: now,
            updated_at: now,
        })
    }

    pub fn update_snippet(
        &self,
        id: i64,
        trigger: String,
        expansion: String,
        is_enabled: bool,
    ) -> Result<Snippet> {
        let trigger = trigger.trim().to_string();
        if trigger.is_empty() {
            return Err(anyhow!("Trigger cannot be empty"));
        }
        if trigger.len() > 75 {
            return Err(anyhow!("Trigger cannot exceed 75 characters"));
        }
        if expansion.len() > 2000 {
            return Err(anyhow!("Expansion cannot exceed 2000 characters"));
        }

        let now = chrono::Utc::now().timestamp();
        let conn = self.get_connection()?;
        let updated = conn.execute(
            "UPDATE snippets SET trigger = ?1, expansion = ?2, is_enabled = ?3, updated_at = ?4
             WHERE id = ?5",
            params![&trigger, &expansion, is_enabled, now, id],
        )?;

        if updated == 0 {
            return Err(anyhow!("Snippet {} not found", id));
        }

        let snippet = conn.query_row(
            "SELECT id, trigger, expansion, is_enabled, created_at, updated_at
             FROM snippets WHERE id = ?1",
            params![id],
            Self::map_snippet,
        )?;

        debug!("Updated snippet with id {}", id);
        Ok(snippet)
    }

    pub fn delete_snippet(&self, id: i64) -> Result<()> {
        let conn = self.get_connection()?;
        let deleted = conn.execute("DELETE FROM snippets WHERE id = ?1", params![id])?;

        if deleted == 0 {
            return Err(anyhow!("Snippet {} not found", id));
        }

        debug!("Deleted snippet with id {}", id);
        Ok(())
    }

    pub fn get_snippet(&self, id: i64) -> Result<Option<Snippet>> {
        let conn = self.get_connection()?;
        let snippet = conn
            .query_row(
                "SELECT id, trigger, expansion, is_enabled, created_at, updated_at
                 FROM snippets WHERE id = ?1",
                params![id],
                Self::map_snippet,
            )
            .optional()?;
        Ok(snippet)
    }

    /// Apply snippet expansions to the given text.
    /// Enabled snippets are matched as whole words (case-insensitive), longest trigger first.
    /// Returns the text with all matching triggers replaced.
    pub fn apply_expansions(&self, text: &str) -> Result<String> {
        let conn = self.get_connection()?;
        let mut stmt = conn.prepare(
            "SELECT id, trigger, expansion, is_enabled, created_at, updated_at
             FROM snippets
             WHERE is_enabled = 1
             ORDER BY LENGTH(trigger) DESC",
        )?;

        let snippets: Vec<Snippet> = stmt
            .query_map([], Self::map_snippet)?
            .collect::<std::result::Result<Vec<_>, _>>()?;

        if snippets.is_empty() {
            return Ok(text.to_string());
        }

        let mut result = text.to_string();

        for snippet in &snippets {
            let escaped = regex::escape(&snippet.trigger);
            let pattern = format!(r"(?i)\b{}\b", escaped);
            match Regex::new(&pattern) {
                Ok(re) => {
                    result = re.replace_all(&result, snippet.expansion.as_str()).to_string();
                }
                Err(e) => {
                    error!("Failed to compile regex for trigger '{}': {}", snippet.trigger, e);
                }
            }
        }

        Ok(result)
    }
}
