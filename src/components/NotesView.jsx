import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Download,
  Trash2,
  Plus,
  ChevronUp,
  ChevronDown,
  Maximize2,
  X,
  ExternalLink,
  Check,
  AlertCircle,
  Loader2,
  FileText,
  ChevronLeft,
  ChevronRight,
  Edit2,
  ArrowLeft,
  FolderPlus,
  MoreVertical,
  Calendar,
  BookOpen,
} from 'lucide-react';

// In-memory module cache to preserve notes & active selection across tab switches with zero flicker
let cachedNotes = null;
let cachedActiveNoteId = null;

export function NotesView() {
  const [notes, setNotes] = useState(() => cachedNotes || []);
  const [activeNoteId, setActiveNoteId] = useState(() => cachedActiveNoteId);
  const [isLoading, setIsLoading] = useState(() => !cachedNotes);

  // New Note Creation State
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const newNoteInputRef = useRef(null);

  // Rename Note State
  const [renamingNoteId, setRenamingNoteId] = useState(null);
  const [renameTitle, setRenameTitle] = useState('');
  const renameInputRef = useRef(null);

  // Confirm Deletion Modals
  const [deleteConfirmNoteId, setDeleteConfirmNoteId] = useState(null);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

  // Screenshot Capture & Export State
  const [isCapturing, setIsCapturing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activePreviewIndex, setActivePreviewIndex] = useState(null);
  const [exportSuccess, setExportSuccess] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Focus input when creating new note
  useEffect(() => {
    if (isCreatingNote && newNoteInputRef.current) {
      newNoteInputRef.current.focus();
    }
  }, [isCreatingNote]);

  // Focus input when renaming
  useEffect(() => {
    if (renamingNoteId && renameInputRef.current) {
      renameInputRef.current.focus();
    }
  }, [renamingNoteId]);

  // Load saved notes on mount (with migration for legacy single-collection screenshots)
  useEffect(() => {
    let isMounted = true;

    const loadNotes = async () => {
      let loadedNotes = null;

      // 1. Try loading from Electron IPC
      try {
        if (typeof window !== 'undefined' && window.deskflowAPI?.notes?.getSavedNotes) {
          const res = await window.deskflowAPI.notes.getSavedNotes();
          if (isMounted && res?.success) {
            if (Array.isArray(res.notes) && res.notes.length > 0) {
              loadedNotes = res.notes;
            } else if (Array.isArray(res.legacyPages) && res.legacyPages.length > 0) {
              // Migrate legacy single collection into a "General" note
              loadedNotes = [
                {
                  id: `note-general-${Date.now()}`,
                  title: 'General',
                  pages: res.legacyPages,
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                },
              ];
            } else if (Array.isArray(res.pages) && res.pages.length > 0) {
              // Legacy direct pages array
              loadedNotes = [
                {
                  id: `note-general-${Date.now()}`,
                  title: 'General',
                  pages: res.pages,
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                },
              ];
            }
          }
        }
      } catch (err) {
        console.warn('[DeskFlow Notes] IPC load error:', err);
      }

      // 2. LocalStorage Fallback if IPC didn't return notes
      if (!loadedNotes) {
        try {
          const localV2 = localStorage.getItem('deskflow_notes_collections_v2');
          if (localV2) {
            const parsed = JSON.parse(localV2);
            if (Array.isArray(parsed) && parsed.length > 0) {
              loadedNotes = parsed;
            }
          }
        } catch {
          // ignore
        }
      }

      // 3. Migrate from old localStorage 'deskflow_screenshot_notes_v1' if present
      if (!loadedNotes) {
        try {
          const oldLocal = localStorage.getItem('deskflow_screenshot_notes_v1');
          if (oldLocal) {
            const oldPages = JSON.parse(oldLocal);
            if (Array.isArray(oldPages) && oldPages.length > 0) {
              loadedNotes = [
                {
                  id: `note-general-${Date.now()}`,
                  title: 'General',
                  pages: oldPages,
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                },
              ];
            }
          }
        } catch {
          // ignore
        }
      }

      if (isMounted) {
        if (loadedNotes && loadedNotes.length > 0) {
          cachedNotes = loadedNotes;
          setNotes(loadedNotes);
        } else {
          cachedNotes = [];
          setNotes([]);
        }
        setIsLoading(false);
      }
    };

    loadNotes();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save notes helper
  const persistNotes = (updatedNotes) => {
    cachedNotes = updatedNotes;
    setNotes(updatedNotes);

    // Save to Electron IPC
    if (typeof window !== 'undefined' && window.deskflowAPI?.notes?.saveNotes) {
      window.deskflowAPI.notes
        .saveNotes({
          notes: updatedNotes,
          pages: activeNoteId
            ? (updatedNotes.find((n) => n.id === activeNoteId)?.pages || [])
            : [],
        })
        .catch((err) => {
          console.error('[DeskFlow Notes] IPC save error:', err);
        });
    }

    // Save light metadata to localStorage backup
    try {
      if (updatedNotes.length === 0) {
        localStorage.removeItem('deskflow_notes_collections_v2');
      } else {
        localStorage.setItem(
          'deskflow_notes_collections_v2',
          JSON.stringify(
            updatedNotes.map((n) => ({
              ...n,
              pages: n.pages.map((p) => ({
                ...p,
                dataUrl: p.dataUrl.slice(0, 100) + '...',
              })),
            }))
          )
        );
      }
    } catch {
      // ignore quota limits
    }
  };

  // Currently active note
  const activeNote = notes.find((n) => n.id === activeNoteId) || null;
  const activePages = activeNote ? activeNote.pages : [];

  // ----------------------------------------------------
  // NOTE COLLECTION MANAGEMENT
  // ----------------------------------------------------

  // Create Note
  const handleCreateNote = (e) => {
    if (e) e.preventDefault();
    const title = newNoteTitle.trim();
    if (!title) return;

    const newNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title,
      pages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updated = [newNote, ...notes];
    persistNotes(updated);
    setNewNoteTitle('');
    setIsCreatingNote(false);
    cachedActiveNoteId = newNote.id;
    setActiveNoteId(newNote.id); // Open the newly created note immediately
    setErrorMessage(null);
  };

  // Start Renaming
  const handleStartRename = (note, e) => {
    if (e) e.stopPropagation();
    setRenamingNoteId(note.id);
    setRenameTitle(note.title);
  };

  // Save Rename
  const handleSaveRename = (noteId, e) => {
    if (e) e.preventDefault();
    const title = renameTitle.trim();
    if (!title) {
      setRenamingNoteId(null);
      return;
    }

    const updated = notes.map((n) =>
      n.id === noteId ? { ...n, title, updatedAt: Date.now() } : n
    );
    persistNotes(updated);
    setRenamingNoteId(null);
    setRenameTitle('');
  };

  // Delete Note
  const handleDeleteNoteConfirm = (noteId) => {
    const updated = notes.filter((n) => n.id !== noteId);
    persistNotes(updated);
    if (activeNoteId === noteId) {
      cachedActiveNoteId = null;
      setActiveNoteId(null);
    }
    setDeleteConfirmNoteId(null);
  };

  // ----------------------------------------------------
  // SCREENSHOT & PAGE ACTIONS (FOR ACTIVE NOTE ONLY)
  // ----------------------------------------------------

  // Take Screenshot
  const handleTakeScreenshot = async () => {
    if (!activeNote || isCapturing) return;
    setIsCapturing(true);
    setErrorMessage(null);
    setExportSuccess(null);

    try {
      if (typeof window !== 'undefined' && window.deskflowAPI?.notes?.captureScreen) {
        const res = await window.deskflowAPI.notes.captureScreen();
        if (res.success && res.dataUrl) {
          const newPage = {
            id: `page-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            dataUrl: res.dataUrl,
            width: res.width || 1920,
            height: res.height || 1080,
            timestamp: res.timestamp || Date.now(),
          };

          const updatedNotes = notes.map((n) => {
            if (n.id === activeNote.id) {
              return {
                ...n,
                pages: [...n.pages, newPage],
                updatedAt: Date.now(),
              };
            }
            return n;
          });

          persistNotes(updatedNotes);
        } else {
          setErrorMessage(res.error || 'Failed to capture screen.');
        }
      } else if (typeof window !== 'undefined' && window.deskflowAPI?.isElectron) {
        setErrorMessage(
          'Restart required: in your terminal press Ctrl+C, then run "npm run electron:dev" to activate screenshot capture.'
        );
      } else {
        // Fallback for browsers
        if (navigator.mediaDevices?.getDisplayMedia) {
          const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          const track = stream.getVideoTracks()[0];
          const imageCapture = new ImageCapture(track);
          const bitmap = await imageCapture.grabFrame();
          track.stop();

          const canvas = document.createElement('canvas');
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(bitmap, 0, 0);
          const dataUrl = canvas.toDataURL('image/png');

          const newPage = {
            id: `page-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            dataUrl,
            width: bitmap.width,
            height: bitmap.height,
            timestamp: Date.now(),
          };

          const updatedNotes = notes.map((n) => {
            if (n.id === activeNote.id) {
              return {
                ...n,
                pages: [...n.pages, newPage],
                updatedAt: Date.now(),
              };
            }
            return n;
          });

          persistNotes(updatedNotes);
        } else {
          setErrorMessage('Screen capture requires running in DeskFlow Electron.');
        }
      }
    } catch (err) {
      if (err.name !== 'NotAllowedError') {
        console.error('[DeskFlow Notes] Capture error:', err);
        setErrorMessage(err.message || 'Error capturing screenshot.');
      }
    } finally {
      setIsCapturing(false);
    }
  };

  // Delete single page from active note
  const handleDeletePage = (pageIndex, e) => {
    if (e) e.stopPropagation();
    if (!activeNote) return;

    const newPages = activeNote.pages.filter((_, i) => i !== pageIndex);
    const updatedNotes = notes.map((n) =>
      n.id === activeNote.id ? { ...n, pages: newPages, updatedAt: Date.now() } : n
    );
    persistNotes(updatedNotes);

    if (activePreviewIndex === pageIndex) {
      setActivePreviewIndex(null);
    } else if (activePreviewIndex !== null && activePreviewIndex > pageIndex) {
      setActivePreviewIndex(activePreviewIndex - 1);
    }
  };

  // Move page up / down (reorder within active note)
  const handleMovePage = (pageIndex, direction, e) => {
    if (e) e.stopPropagation();
    if (!activeNote) return;

    const targetIndex = pageIndex + direction;
    if (targetIndex < 0 || targetIndex >= activeNote.pages.length) return;

    const copy = [...activeNote.pages];
    const [moved] = copy.splice(pageIndex, 1);
    copy.splice(targetIndex, 0, moved);

    const updatedNotes = notes.map((n) =>
      n.id === activeNote.id ? { ...n, pages: copy, updatedAt: Date.now() } : n
    );
    persistNotes(updatedNotes);
  };

  // Clear all pages in active note
  const handleClearActiveNotePages = () => {
    if (!activeNote) return;
    const updatedNotes = notes.map((n) =>
      n.id === activeNote.id ? { ...n, pages: [], updatedAt: Date.now() } : n
    );
    persistNotes(updatedNotes);
    setIsConfirmClearOpen(false);
    setActivePreviewIndex(null);
    setExportSuccess(null);
  };

  // Export PDF for ACTIVE NOTE ONLY
  const handleExportPdf = async () => {
    if (!activeNote || activeNote.pages.length === 0 || isExporting) return;
    setIsExporting(true);
    setErrorMessage(null);
    setExportSuccess(null);

    try {
      const sanitizedTitle = activeNote.title.replace(/[^a-zA-Z0-9_\-]/g, '_');
      const dateStr = new Date().toISOString().slice(0, 10);
      const defaultFilename = `${sanitizedTitle}_Notes_${dateStr}.pdf`;

      if (typeof window !== 'undefined' && window.deskflowAPI?.notes?.exportPdf) {
        // Export ONLY the screenshots belonging to this active note
        const res = await window.deskflowAPI.notes.exportPdf({
          pages: activeNote.pages,
          defaultFilename,
        });

        if (res.success && res.filePath) {
          setExportSuccess({
            filePath: res.filePath,
            filename: res.filePath.split(/[/\\]/).pop(),
          });
        } else if (!res.canceled) {
          setErrorMessage(res.error || 'Failed to export PDF.');
        }
      } else {
        setErrorMessage('PDF export requires running inside the DeskFlow desktop app.');
      }
    } catch (err) {
      console.error('[DeskFlow Notes] Export error:', err);
      setErrorMessage(err.message || 'Error exporting PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  // Open the exported file in system default viewer
  const handleOpenFile = (filePath) => {
    if (typeof window !== 'undefined' && window.deskflowAPI?.notes?.openFile) {
      window.deskflowAPI.notes.openFile(filePath);
    }
  };

  // Relative time helper
  const formatRelativeTime = (ts) => {
    if (!ts) return 'Today';
    const now = new Date();
    const d = new Date(ts);
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Clock time helper for pages
  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Note being deleted lookup
  const noteToDelete = notes.find((n) => n.id === deleteConfirmNoteId);

  // --------------------------------------------------------------------------
  // RENDER VIEW: 1. NOTES HOME (LIST VIEW)
  // --------------------------------------------------------------------------
  if (!activeNote) {
    return (
      <div className="notes-view">
        {/* Home Toolbar */}
        <div className="notes-toolbar">
          <div className="notes-toolbar-left">
            <div className="notes-toolbar-title">
              <BookOpen size={14} className="notes-title-icon" />
              <span>Notes</span>
            </div>
            <span className="notes-page-count-badge">
              {notes.length} {notes.length === 1 ? 'topic' : 'topics'}
            </span>
          </div>

          <div className="notes-toolbar-actions">
            {!isCreatingNote && (
              <button
                type="button"
                className="notes-btn notes-btn-primary"
                onClick={() => setIsCreatingNote(true)}
                title="Create a new Note topic"
              >
                <Plus size={13} />
                <span>New Note</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Error Banner if any */}
        {errorMessage && (
          <div className="notes-alert notes-alert-error animate-fade-in">
            <div className="notes-alert-text">
              <AlertCircle size={13} className="notes-alert-icon" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              className="notes-alert-close"
              onClick={() => setErrorMessage(null)}
              aria-label="Dismiss"
            >
              <X size={11} />
            </button>
          </div>
        )}

        {/* Inline New Note Creation Card */}
        {isCreatingNote && (
          <form onSubmit={handleCreateNote} className="notes-create-card animate-fade-in">
            <div className="notes-create-header">
              <span className="notes-create-title">New Note Topic</span>
              <button
                type="button"
                className="notes-icon-btn close"
                onClick={() => {
                  setIsCreatingNote(false);
                  setNewNoteTitle('');
                }}
              >
                <X size={12} />
              </button>
            </div>
            <div className="notes-create-input-row">
              <input
                ref={newNoteInputRef}
                type="text"
                className="notes-input"
                placeholder="Note name (e.g. Python, DSA, React)..."
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                maxLength={40}
              />
              <button
                type="submit"
                className="notes-btn notes-btn-primary"
                disabled={!newNoteTitle.trim()}
              >
                Create
              </button>
            </div>
          </form>
        )}

        {/* Notes Collections List */}
        {isLoading && notes.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '36px 0', color: 'var(--text-tertiary)', gap: 8 }}>
            <Loader2 size={15} className="notes-spin" />
            <span style={{ fontSize: 11.5 }}>Loading notes...</span>
          </div>
        ) : notes.length === 0 && !isCreatingNote ? (
          <div className="notes-empty-state">
            <div className="notes-empty-icon-wrap">
              <FolderPlus size={26} strokeWidth={1.75} />
            </div>
            <h3 className="notes-empty-title">No notes yet</h3>
            <p className="notes-empty-subtitle">
              Create a note topic (e.g. Python, DSA, React) to organize your screenshots into separate collections.
            </p>
            <button
              type="button"
              className="btn btn-primary notes-empty-action-btn"
              onClick={() => setIsCreatingNote(true)}
            >
              <Plus size={13} /> New Note
            </button>
          </div>
        ) : (
          <div className="notebook-cards-list">
            {notes.map((note) => {
              const isRenaming = renamingNoteId === note.id;

              return (
                <div
                  key={note.id}
                  className="notebook-card"
                  onClick={() => {
                    if (!isRenaming) {
                      cachedActiveNoteId = note.id;
                      setActiveNoteId(note.id);
                      setExportSuccess(null);
                      setErrorMessage(null);
                    }
                  }}
                >
                  <div className="notebook-card-content">
                    {/* Header Row: Title & Actions */}
                    <div className="notebook-card-top">
                      <div className="notebook-title-wrap">
                        <span className="notebook-emoji-icon">📝</span>
                        {isRenaming ? (
                          <form
                            onSubmit={(e) => handleSaveRename(note.id, e)}
                            className="notebook-rename-form"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              ref={renameInputRef}
                              type="text"
                              className="notebook-rename-input"
                              value={renameTitle}
                              onChange={(e) => setRenameTitle(e.target.value)}
                              onBlur={(e) => handleSaveRename(note.id, e)}
                              maxLength={40}
                            />
                            <button type="submit" className="note-icon-btn check">
                              <Check size={11} />
                            </button>
                          </form>
                        ) : (
                          <span className="notebook-card-title">{note.title}</span>
                        )}
                      </div>

                      {/* Card Action Icons */}
                      <div className="notebook-card-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="note-icon-btn"
                          title="Rename note"
                          onClick={(e) => handleStartRename(note, e)}
                        >
                          <Edit2 size={11} />
                        </button>
                        <button
                          type="button"
                          className="note-icon-btn delete"
                          title="Delete note"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmNoteId(note.id);
                          }}
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>

                    {/* Stats & Meta Row */}
                    <div className="notebook-card-meta">
                      <span className="notebook-page-count">
                        {note.pages.length} {note.pages.length === 1 ? 'page' : 'pages'}
                      </span>
                      <span className="notebook-meta-dot">•</span>
                      <span className="notebook-updated-time">
                        Last updated: {formatRelativeTime(note.updatedAt || note.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="notebook-card-chevron">
                    <ChevronRight size={13} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Delete Note Confirmation Dialog */}
        {deleteConfirmNoteId && noteToDelete && (
          <div className="modal-overlay notes-confirm-overlay animate-fade-in">
            <div className="notes-confirm-dialog animate-scale-in">
              <div className="notes-confirm-icon-wrap">
                <Trash2 size={20} />
              </div>
              <h4 className="notes-confirm-title">Delete Note?</h4>
              <p className="notes-confirm-desc">
                Are you sure you want to delete <strong>"{noteToDelete.title}"</strong> and all of its{' '}
                {noteToDelete.pages.length} {noteToDelete.pages.length === 1 ? 'page' : 'pages'}? This cannot be undone.
              </p>
              <div className="notes-confirm-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDeleteConfirmNoteId(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleDeleteNoteConfirm(deleteConfirmNoteId)}
                >
                  Delete Note
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // RENDER VIEW: 2. NOTE OPENED / DETAIL VIEW (FOR ACTIVE NOTE ONLY)
  // --------------------------------------------------------------------------
  return (
    <div className="notes-view">
      {/* Detail View Toolbar */}
      <div className="notes-toolbar">
        <div className="notes-toolbar-left">
          <button
            type="button"
            className="notes-back-btn"
            onClick={() => {
              cachedActiveNoteId = null;
              setActiveNoteId(null);
              setExportSuccess(null);
              setErrorMessage(null);
            }}
            title="Back to all Notes"
          >
            <ArrowLeft size={13} />
            <span>Notes</span>
          </button>
          <span className="notebook-meta-dot">/</span>
          <span className="notes-active-title" title={activeNote.title}>
            {activeNote.title}
          </span>
          <span className="notes-page-count-badge">
            {activePages.length} {activePages.length === 1 ? 'page' : 'pages'}
          </span>
        </div>

        <div className="notes-toolbar-actions">
          {/* Export PDF Button (Active note only) */}
          <button
            type="button"
            className="notes-btn notes-btn-export"
            onClick={handleExportPdf}
            disabled={activePages.length === 0 || isExporting}
            title={
              activePages.length === 0
                ? 'Capture screenshots in this note to export'
                : `Export all ${activePages.length} pages of ${activeNote.title} to PDF`
            }
          >
            {isExporting ? <Loader2 size={12} className="notes-spin" /> : <Download size={12} />}
            <span>Export PDF</span>
          </button>

          {/* Clear Note Pages Button */}
          {activePages.length > 0 && (
            <button
              type="button"
              className="notes-btn notes-btn-clear"
              onClick={() => setIsConfirmClearOpen(true)}
              title="Clear all pages from this note"
            >
              <Trash2 size={12} />
            </button>
          )}

          {/* Take Screenshot Primary Button */}
          <button
            type="button"
            className="notes-btn notes-btn-primary"
            onClick={handleTakeScreenshot}
            disabled={isCapturing}
            title={`Capture screenshot into ${activeNote.title}`}
          >
            {isCapturing ? (
              <>
                <Loader2 size={12} className="notes-spin" />
                <span>Capturing...</span>
              </>
            ) : (
              <>
                <Camera size={12} />
                <span>Take Screenshot</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Export Success Notification Banner */}
      {exportSuccess && (
        <div className="notes-alert notes-alert-success animate-fade-in">
          <div className="notes-alert-text">
            <Check size={13} className="notes-alert-icon" />
            <span title={exportSuccess.filePath}>
              Exported: <strong>{exportSuccess.filename}</strong>
            </span>
          </div>
          <button
            type="button"
            className="notes-alert-btn"
            onClick={() => handleOpenFile(exportSuccess.filePath)}
            title="Open exported PDF file"
          >
            <ExternalLink size={11} /> Open
          </button>
          <button
            type="button"
            className="notes-alert-close"
            onClick={() => setExportSuccess(null)}
            aria-label="Dismiss"
          >
            <X size={11} />
          </button>
        </div>
      )}

      {/* Error Notification Banner */}
      {errorMessage && (
        <div className="notes-alert notes-alert-error animate-fade-in">
          <div className="notes-alert-text">
            <AlertCircle size={13} className="notes-alert-icon" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            className="notes-alert-close"
            onClick={() => setErrorMessage(null)}
            aria-label="Dismiss"
          >
            <X size={11} />
          </button>
        </div>
      )}

      {/* Note Content Area */}
      {activePages.length === 0 ? (
        /* Empty State for opened note */
        <div className="notes-empty-state">
          <div className="notes-empty-icon-wrap">
            <Camera size={26} strokeWidth={1.75} />
          </div>
          <h3 className="notes-empty-title">No pages yet</h3>
          <p className="notes-empty-subtitle">
            No pages yet. Take a screenshot to start your note.
          </p>
          <button
            type="button"
            className="btn btn-primary notes-empty-action-btn"
            onClick={handleTakeScreenshot}
            disabled={isCapturing}
          >
            {isCapturing ? (
              <>
                <Loader2 size={13} className="notes-spin" /> Capturing Screen...
              </>
            ) : (
              <>
                <Camera size={13} /> Take Screenshot
              </>
            )}
          </button>
        </div>
      ) : (
        /* Pages List for opened note */
        <div className="notes-pages-list">
          {activePages.map((page, index) => (
            <div key={page.id} className="note-page-card animate-fade-in">
              {/* Card Header */}
              <div className="note-page-header">
                <div className="note-page-header-left">
                  <span className="note-page-badge">Page {index + 1}</span>
                  <span className="note-page-time">{formatTime(page.timestamp)}</span>
                </div>

                <div className="note-page-header-actions">
                  {/* Move Up */}
                  <button
                    type="button"
                    className="note-icon-btn"
                    onClick={(e) => handleMovePage(index, -1, e)}
                    disabled={index === 0}
                    title="Move up"
                  >
                    <ChevronUp size={12} />
                  </button>

                  {/* Move Down */}
                  <button
                    type="button"
                    className="note-icon-btn"
                    onClick={(e) => handleMovePage(index, 1, e)}
                    disabled={index === activePages.length - 1}
                    title="Move down"
                  >
                    <ChevronDown size={12} />
                  </button>

                  {/* Delete Page */}
                  <button
                    type="button"
                    className="note-icon-btn delete"
                    onClick={(e) => handleDeletePage(index, e)}
                    title="Delete page"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* Thumbnail with Click to Lightbox */}
              <div
                className="note-page-preview"
                onClick={() => setActivePreviewIndex(index)}
                title="Click to view full screenshot"
              >
                <img
                  src={page.dataUrl}
                  alt={`Screenshot Page ${index + 1}`}
                  className="note-page-img"
                  loading="lazy"
                />
                <div className="note-page-hover-overlay">
                  <Maximize2 size={15} />
                  <span>View Full</span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="note-page-footer">
                <span>
                  {page.width} × {page.height} px
                </span>
                <span
                  className="note-page-zoom-hint"
                  onClick={() => setActivePreviewIndex(index)}
                >
                  <Maximize2 size={10} /> Enlarge
                </span>
              </div>
            </div>
          ))}

          {/* Quick Add Another Screenshot at the bottom */}
          <button
            type="button"
            className="notes-add-bottom-btn"
            onClick={handleTakeScreenshot}
            disabled={isCapturing}
          >
            {isCapturing ? (
              <Loader2 size={13} className="notes-spin" />
            ) : (
              <Plus size={13} />
            )}
            <span>Take Another Screenshot</span>
          </button>
        </div>
      )}

      {/* Lightbox Modal (Previewing active note pages) */}
      {activePreviewIndex !== null && activePages[activePreviewIndex] && (
        <div
          className="modal-overlay notes-lightbox-overlay animate-fade-in"
          onClick={() => setActivePreviewIndex(null)}
        >
          <div
            className="notes-lightbox-content animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="notes-lightbox-header">
              <div className="notes-lightbox-title">
                <FileText size={13} />
                <span>
                  {activeNote.title} — Page {activePreviewIndex + 1} of {activePages.length}
                </span>
              </div>

              <div className="notes-lightbox-nav">
                <button
                  type="button"
                  className="notes-icon-btn"
                  onClick={() =>
                    setActivePreviewIndex((prev) => (prev > 0 ? prev - 1 : activePages.length - 1))
                  }
                  title="Previous page (Left arrow)"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  className="notes-icon-btn"
                  onClick={() =>
                    setActivePreviewIndex((prev) => (prev < activePages.length - 1 ? prev + 1 : 0))
                  }
                  title="Next page (Right arrow)"
                >
                  <ChevronRight size={14} />
                </button>
                <button
                  type="button"
                  className="notes-icon-btn close"
                  onClick={() => setActivePreviewIndex(null)}
                  title="Close preview (Escape)"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="notes-lightbox-image-wrap">
              <img
                src={activePages[activePreviewIndex].dataUrl}
                alt={`Full view Page ${activePreviewIndex + 1}`}
                className="notes-lightbox-img"
              />
            </div>

            <div className="notes-lightbox-footer">
              <span className="notes-lightbox-meta">
                {activePages[activePreviewIndex].width} × {activePages[activePreviewIndex].height} px •{' '}
                {formatTime(activePages[activePreviewIndex].timestamp)}
              </span>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: 11, padding: '3px 8px' }}
                onClick={() => {
                  const w = window.open('');
                  if (w) {
                    w.document.write(
                      `<img src="${activePages[activePreviewIndex].dataUrl}" style="max-width:100%; height:auto;" />`
                    );
                  }
                }}
              >
                Open in new tab
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Note Confirmation Modal */}
      {isConfirmClearOpen && (
        <div className="modal-overlay notes-confirm-overlay animate-fade-in">
          <div className="notes-confirm-dialog animate-scale-in">
            <div className="notes-confirm-icon-wrap">
              <Trash2 size={20} />
            </div>
            <h4 className="notes-confirm-title">Clear Note?</h4>
            <p className="notes-confirm-desc">
              Are you sure you want to remove all {activePages.length} screenshots from "{activeNote.title}"?
            </p>
            <div className="notes-confirm-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsConfirmClearOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleClearActiveNotePages}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
