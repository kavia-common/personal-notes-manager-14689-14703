import React, { useMemo, useState, useEffect, useCallback } from 'react';
import './App.css';
import './index.css';

/**
 * A lightweight, modern notes app with sidebar layout.
 * Features: Create, Edit, Delete, List, Search notes
 * Storage: LocalStorage (no backend dependency)
 * Palette: primary #1976d2, secondary #424242, accent #ffeb3b
 */

// Types
/**
 * @typedef {{ id: string; title: string; content: string; updatedAt: number; createdAt: number }} Note
 */

// Utilities
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const formatDateTime = (ts) => new Date(ts).toLocaleString();

// Storage keys
const STORAGE_KEY = 'notes-app:notes';
const STORAGE_THEME = 'notes-app:theme';

// Hooks
function useLocalStorage(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // ignore write errors
    }
  }, [key, state]);
  return [state, setState];
}

function useNotes() {
  const [notes, setNotes] = useLocalStorage(STORAGE_KEY, /** @type {Note[]} */([]));

  const createNote = useCallback(() => {
    const now = Date.now();
    const n = { id: uid(), title: 'Untitled', content: '', createdAt: now, updatedAt: now };
    setNotes((prev) => [n, ...prev]);
    return n.id;
  }, [setNotes]);

  const updateNote = useCallback((id, patch) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n))
    );
  }, [setNotes]);

  const deleteNote = useCallback((id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, [setNotes]);

  return { notes, setNotes, createNote, updateNote, deleteNote };
}

function useTheme() {
  const [theme, setTheme] = useLocalStorage(STORAGE_THEME, 'light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  return { theme, toggleTheme };
}

// Components

function Sidebar({ children }) {
  return <aside className="sb">{children}</aside>;
}

function Header({ theme, onToggleTheme }) {
  return (
    <header className="app-header">
      <div className="brand">
        <div className="logo">📝</div>
        <div className="brand-text">
          <div className="brand-title">Notes</div>
          <div className="brand-sub">Minimal</div>
        </div>
      </div>
      <div className="header-actions">
        <button className="btn ghost" onClick={onToggleTheme} aria-label="Toggle theme">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>
    </header>
  );
}

function SearchBar({ value, onChange }) {
  return (
    <div className="search">
      <span className="icon">🔎</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search notes…"
        aria-label="Search notes"
      />
    </div>
  );
}

function NoteList({ notes, activeId, onSelect, onCreate }) {
  return (
    <div className="list-wrap">
      <div className="list-header">
        <button className="btn primary w-full" onClick={onCreate}>+ New note</button>
      </div>
      <div className="list">
        {notes.length === 0 && <div className="empty">No notes found</div>}
        {notes.map((n) => (
          <button
            key={n.id}
            className={`item ${activeId === n.id ? 'active' : ''}`}
            onClick={() => onSelect(n.id)}
          >
            <div className="item-title">{n.title || 'Untitled'}</div>
            <div className="item-meta">{formatDateTime(n.updatedAt)}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Toolbar({ onDelete, canDelete }) {
  return (
    <div className="toolbar">
      <div />
      <div className="toolbar-actions">
        <button className="btn danger" disabled={!canDelete} onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
}

function NoteEditor({ note, onChange }) {
  if (!note) {
    return (
      <div className="editor empty-state">
        <div className="empty-illustration">🗒️</div>
        <div className="empty-title">Select or create a note</div>
        <div className="empty-sub">Your notes will appear here for editing.</div>
      </div>
    );
  }
  return (
    <div className="editor">
      <input
        className="title-input"
        value={note.title}
        onChange={(e) => onChange({ title: e.target.value })}
        placeholder="Note title"
        aria-label="Note title"
      />
      <textarea
        className="content-input"
        value={note.content}
        onChange={(e) => onChange({ content: e.target.value })}
        placeholder="Start typing your note..."
        aria-label="Note content"
      />
      <div className="timestamps">Last edited {formatDateTime(note.updatedAt)}</div>
    </div>
  );
}

// PUBLIC_INTERFACE
function App() {
  const { theme, toggleTheme } = useTheme();
  const { notes, createNote, updateNote, deleteNote } = useNotes();

  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((n) =>
      (n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q)
    );
  }, [notes, query]);

  const selected = useMemo(
    () => notes.find((n) => n.id === selectedId) || null,
    [notes, selectedId]
  );

  const handleCreate = () => {
    const id = createNote();
    setSelectedId(id);
  };

  const handleDelete = () => {
    if (!selected) return;
    const nextIndex = Math.max(0, notes.findIndex((n) => n.id === selected.id) - 1);
    deleteNote(selected.id);
    const remaining = notes.filter((n) => n.id !== selected.id);
    setSelectedId(remaining[nextIndex]?.id || null);
  };

  const handleUpdate = (patch) => {
    if (!selected) return;
    updateNote(selected.id, patch);
  };

  useEffect(() => {
    // On first load, select first note if exists
    if (notes.length && !selectedId) {
      setSelectedId(notes[0].id);
    }
  }, [notes, selectedId]);

  return (
    <div className="app">
      <Header theme={theme} onToggleTheme={toggleTheme} />
      <div className="layout">
        <Sidebar>
          <SearchBar value={query} onChange={setQuery} />
          <NoteList
            notes={filtered}
            activeId={selectedId}
            onSelect={setSelectedId}
            onCreate={handleCreate}
          />
        </Sidebar>
        <main className="main">
          <Toolbar onDelete={handleDelete} canDelete={!!selected} />
          <NoteEditor note={selected} onChange={handleUpdate} />
        </main>
      </div>
    </div>
  );
}

export default App;
