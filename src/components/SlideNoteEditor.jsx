import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Link2,
  ImagePlus,
  Clipboard,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Check,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';

// ── Custom ResizableImage: extends default Image with width/height attrs ──────
const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        renderHTML: (attrs) => (attrs.width ? { width: attrs.width } : {}),
      },
      style: {
        default: 'max-width:100%;border-radius:4px;cursor:pointer;',
        renderHTML: (attrs) => ({ style: attrs.style }),
      },
    };
  },
});

// ── Toolbar Button ─────────────────────────────────────────────────────────────
function ToolBtn({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      className={`rte-tool-btn${active ? ' active' : ''}`}
      onMouseDown={(e) => { e.preventDefault(); onClick?.(); }}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
}



// ── Main Editor Component ──────────────────────────────────────────────────────
export function SlideNoteEditor({ page, pageIndex, activeNoteTitle, onSave, onClose }) {
  const [saveStatus, setSaveStatus] = useState(null);
  const saveTimer = useRef(null);
  const fileInputRef = useRef(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const linkInputRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      ResizableImage.configure({ inline: false, allowBase64: true }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Write notes about this page…' }),
    ],
    content: page.slideNoteHtml || '',
    editorProps: {
      attributes: { class: 'rte-content' },
      handleDrop(view, event) {
        const files = Array.from(event.dataTransfer?.files || []).filter((f) =>
          f.type.startsWith('image/')
        );
        if (files.length === 0) return false;
        event.preventDefault();
        files.forEach((file) => insertImageFile(file));
        return true;
      },
      handlePaste(view, event) {
        const items = Array.from(event.clipboardData?.items || []);
        const imgItem = items.find((i) => i.type.startsWith('image/'));
        if (!imgItem) return false;
        event.preventDefault();
        const blob = imgItem.getAsFile();
        if (blob) insertImageFile(blob);
        return true;
      },
    },
    onUpdate: ({ editor: ed }) => {
      triggerAutosave(ed.getHTML());
    },
  });

  useEffect(() => {
    if (showLinkInput && linkInputRef.current) linkInputRef.current.focus();
  }, [showLinkInput]);

  useEffect(() => {
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, []);

  // ── Autosave ────────────────────────────────────────────────────────────────
  const triggerAutosave = useCallback(
    (html) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setSaveStatus('saving');
      saveTimer.current = setTimeout(() => {
        try {
          onSave(page.id, html);
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus((s) => (s === 'saved' ? null : s)), 2200);
        } catch {
          setSaveStatus('error');
        }
      }, 700);
    },
    [page.id, onSave]
  );

  // ── Image helpers ───────────────────────────────────────────────────────────
  const insertImageFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      editor?.chain().focus().setImage({ src: e.target.result }).run();
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e) => {
    Array.from(e.target.files || []).forEach(insertImageFile);
    e.target.value = '';
  };

  const handlePasteFromClipboard = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imgType = item.types.find((t) => t.startsWith('image/'));
        if (imgType) {
          const blob = await item.getType(imgType);
          insertImageFile(blob);
          break;
        }
      }
    } catch {
      editor?.commands.focus();
    }
  };

  // ── Link ────────────────────────────────────────────────────────────────────
  const applyLink = () => {
    if (!linkUrl.trim()) {
      editor?.chain().focus().unsetLink().run();
    } else {
      const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
      editor?.chain().focus().setLink({ href: url }).run();
    }
    setShowLinkInput(false);
    setLinkUrl('');
  };



  if (!editor) return null;

  const isActive = (name, attrs) => editor.isActive(name, attrs);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="slide-rte-panel animate-fade-in">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileInput}
      />

      {/* Header */}
      <div className="slide-rte-header">
        <span className="slide-rte-label">📄 Notes — Page {pageIndex + 1}</span>
        <div className="slide-rte-header-right">
          {saveStatus === 'saving' && (
            <span className="slide-save-status saving">
              <Loader2 size={10} className="notes-spin" /> Saving…
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="slide-save-status saved">
              <Check size={10} /> Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="slide-save-status error">
              <AlertCircle size={10} /> Error
            </span>
          )}
          <button
            type="button"
            className="note-icon-btn close"
            onClick={onClose}
            title="Close notes"
          >
            <X size={11} />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="slide-rte-toolbar">
        <div className="rte-toolbar-group">
          <ToolBtn
            active={isActive('heading', { level: 1 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            title="Heading 1"
          >
            <Heading1 size={12} />
          </ToolBtn>
          <ToolBtn
            active={isActive('heading', { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            title="Heading 2"
          >
            <Heading2 size={12} />
          </ToolBtn>
        </div>
        <div className="rte-toolbar-sep" />
        <div className="rte-toolbar-group">
          <ToolBtn active={isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold (Ctrl+B)">
            <Bold size={12} />
          </ToolBtn>
          <ToolBtn active={isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic (Ctrl+I)">
            <Italic size={12} />
          </ToolBtn>
          <ToolBtn active={isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline (Ctrl+U)">
            <UnderlineIcon size={12} />
          </ToolBtn>
        </div>
        <div className="rte-toolbar-sep" />
        <div className="rte-toolbar-group">
          <ToolBtn active={isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Align Left">
            <AlignLeft size={12} />
          </ToolBtn>
          <ToolBtn active={isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Center">
            <AlignCenter size={12} />
          </ToolBtn>
          <ToolBtn active={isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Align Right">
            <AlignRight size={12} />
          </ToolBtn>
        </div>
        <div className="rte-toolbar-sep" />
        <div className="rte-toolbar-group">
          <ToolBtn active={isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List">
            <List size={12} />
          </ToolBtn>
          <ToolBtn active={isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered List">
            <ListOrdered size={12} />
          </ToolBtn>
        </div>
        <div className="rte-toolbar-sep" />
        <div className="rte-toolbar-group">
          <ToolBtn
            active={isActive('link') || showLinkInput}
            onClick={() => {
              if (isActive('link')) {
                editor.chain().focus().unsetLink().run();
              } else {
                setShowLinkInput((v) => !v);
                setLinkUrl(editor.getAttributes('link').href || '');
              }
            }}
            title="Insert / Remove Link"
          >
            <Link2 size={12} />
          </ToolBtn>
        </div>
        <div className="rte-toolbar-sep" />
        <div className="rte-toolbar-group">
          <ToolBtn onClick={() => fileInputRef.current?.click()} title="Insert Image from file">
            <ImagePlus size={12} />
            <span className="rte-btn-label">Image</span>
          </ToolBtn>
          <ToolBtn onClick={handlePasteFromClipboard} title="Paste image from clipboard">
            <Clipboard size={12} />
            <span className="rte-btn-label">Paste</span>
          </ToolBtn>
        </div>
      </div>

      {/* Link input row */}
      {showLinkInput && (
        <div className="rte-link-row animate-fade-in">
          <Link2 size={11} className="rte-link-icon" />
          <input
            ref={linkInputRef}
            type="url"
            className="rte-link-input"
            placeholder="https://example.com"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyLink();
              if (e.key === 'Escape') { setShowLinkInput(false); setLinkUrl(''); }
            }}
          />
          <button type="button" className="rte-link-apply" onClick={applyLink} title="Apply">
            <Check size={11} />
          </button>
          <button type="button" className="rte-link-cancel" onClick={() => { setShowLinkInput(false); setLinkUrl(''); }} title="Cancel">
            <X size={11} />
          </button>
        </div>
      )}

      {/* Editor Body */}
      <EditorContent editor={editor} className="slide-rte-editor-wrap" />
    </div>
  );
}
