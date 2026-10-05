import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Timer,
  FileText,
  Plus,
} from 'lucide-react';
import { TitleBar } from './components/TitleBar';
import { TaskCard } from './components/TaskCard';
import { AddTaskModal } from './components/AddTaskModal';



import { CalendarView } from './components/CalendarView';
import { PomodoroWidget } from './components/PomodoroWidget';
import { NotesView } from './components/NotesView';
import { SettingsModal } from './components/SettingsModal';
import { WelcomeNameModal } from './components/WelcomeNameModal';
import { CompactWidgetBar } from './components/CompactWidgetBar';

import { useTasks } from './hooks/useTasks';
import { useSettings } from './hooks/useSettings';
import { storage } from './services/storage';

import './styles/index.css';
import './styles/components.css';

export function App() {
  const { settings, updateSetting, updateNestedSetting, togglePin } = useSettings();
  const {
    tasks,
    filteredTasks,
    stats,
    filter,
    setFilter,
    categoryFilter,
    setCategoryFilter,
    selectedDate,
    setSelectedDate,
    addTask,
    updateTask,
    deleteTask,
    togglePinTask,
    toggleArchiveTask,
    duplicateTask,
    toggleComplete,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    reorderTasks,
    bulkComplete,
    bulkDelete,
    bulkArchive,
    bulkSetPriority,
    bulkSetDueDate,
    reloadTasks,
  } = useTasks(settings.soundEnabled);

  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' | 'calendar' | 'focus' | 'system' | 'integrations'

  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNameSetupOpen, setIsNameSetupOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  useEffect(() => {
    if (settings.hasCompletedNameSetup === false) {
      setIsNameSetupOpen(true);
    }
  }, [settings.hasCompletedNameSetup]);

  const handleSaveName = (enteredName) => {
    updateSetting('userName', enteredName);
    updateSetting('hasCompletedNameSetup', true);
    setIsNameSetupOpen(false);
  };

  const handleSkipName = () => {
    updateSetting('userName', '');
    updateSetting('hasCompletedNameSetup', true);
    setIsNameSetupOpen(false);
  };

  const handleToggleComplete = (id) => {
    toggleComplete(id);
  };
  // Default to compact mode on startup
  const widgetMode = 'compact';
  const [isFullScreen, setIsFullScreen] = useState(false);
  const widgetSizeRef = React.useRef(settings.widgetSize);

  useEffect(() => {
    widgetSizeRef.current = settings.widgetSize;
  }, [settings.widgetSize]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.deskflowAPI?.windowControl) {
      if (window.deskflowAPI.windowControl.isMaximized) {
        window.deskflowAPI.windowControl.isMaximized().then((max) => {
          setIsFullScreen(Boolean(max));
        });
      }
      if (window.deskflowAPI.windowControl.onMaximizeChange) {
        const cleanup = window.deskflowAPI.windowControl.onMaximizeChange((maximized) => {
          setIsFullScreen(Boolean(maximized));
          if (!maximized && widgetSizeRef.current === 'fullscreen') {
            updateSetting('widgetSize', 'compact');
          }
        });
        return cleanup;
      }
      // Snap to top-right on initial app load as default
      if (window.deskflowAPI.windowControl.snapTo) {
        window.deskflowAPI.windowControl.snapTo('top-right');
      }
    }
  }, []);

  const toggleFullScreen = async () => {
    if (typeof window !== 'undefined' && window.deskflowAPI?.windowControl) {
      if (window.deskflowAPI.windowControl.toggleMaximize) {
        const next = await window.deskflowAPI.windowControl.toggleMaximize();
        setIsFullScreen(Boolean(next));
        if (next) {
          updateSetting('widgetSize', 'fullscreen');
        } else {
          updateSetting('widgetSize', settings.widgetSize === 'medium' ? 'medium' : 'compact');
        }
      } else if (window.deskflowAPI.windowControl.setWidgetMode) {
        const next = !isFullScreen;
        setIsFullScreen(next);
        const currentSize = settings.widgetSize || 'compact';
        window.deskflowAPI.windowControl.setWidgetMode(next ? 'fullscreen' : currentSize);
      }
    } else {
      setIsFullScreen((prev) => !prev);
    }
  };

  const handleToggleMedium = () => {
    const isCurrentlyMedium = !isFullScreen && settings.widgetSize === 'medium';
    if (isFullScreen) {
      setIsFullScreen(false);
      updateSetting('widgetSize', 'medium');
      if (typeof window !== 'undefined' && window.deskflowAPI?.windowControl?.setSizePreset) {
        window.deskflowAPI.windowControl.setSizePreset('medium');
      }
    } else if (isCurrentlyMedium) {
      updateSetting('widgetSize', 'compact');
      if (typeof window !== 'undefined' && window.deskflowAPI?.windowControl?.setSizePreset) {
        window.deskflowAPI.windowControl.setSizePreset('compact');
      }
    } else {
      updateSetting('widgetSize', 'medium');
      if (typeof window !== 'undefined' && window.deskflowAPI?.windowControl?.setSizePreset) {
        window.deskflowAPI.windowControl.setSizePreset('medium');
      }
    }
  };

  // Drag-and-Drop state
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isTyping = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';

      // Global Escape
      if (e.key === 'Escape') {
        if (isAddTaskOpen) setIsAddTaskOpen(false);
        else if (isSettingsOpen) setIsSettingsOpen(false);
        return;
      }

      if (isTyping) return;

      // 'N': New Task / Focus Quick Add
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        const quickInput = document.getElementById('quick-add-task-input');
        if (quickInput) {
          quickInput.focus();
        } else {
          setEditingTask(null);
          setIsAddTaskOpen(true);
        }
      }

    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isAddTaskOpen,
    isSettingsOpen,
    widgetMode,
  ]);


  // Drag and Drop Handlers
  const handleDragStart = (e, id) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedId(id);
  };

  const handleDragOver = (e, id) => {
    e.preventDefault();
    if (dragOverId !== id) {
      setDragOverId(id);
    }
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (draggedId && draggedId !== targetId) {
      reorderTasks(draggedId, targetId);
    }
    setDraggedId(null);
    setDragOverId(null);
  };


  // Windows Integration Window Controls - Compact is default
  const isCompactMode = !isFullScreen && (settings.widgetSize || 'compact') === 'compact';
  const isMediumMode = !isFullScreen && settings.widgetSize === 'medium';

  const handleSnap = (edge = 'top-right') => {
    if (isFullScreen) {
      setIsFullScreen(false);
      window.deskflowAPI?.windowControl?.setWidgetMode('compact');
    }
    if (typeof window !== 'undefined' && window.deskflowAPI?.windowControl?.snapTo) {
      window.deskflowAPI.windowControl.snapTo(edge);
    }
  };

  const handleSaveTask = (taskData) => {
    if (editingTask) {
      updateTask(editingTask.id, taskData);
      setEditingTask(null);
    } else {
      addTask(taskData);
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setIsAddTaskOpen(true);
  };

  const handleRescheduleTask = (taskId, newDueDate) => {
    updateTask(taskId, {
      dueDate: newDueDate,
      dueDateTime: `${newDueDate}T12:00:00`,
    });
  };

  // Mini Desktop Ticker Bar (optional ultra-compact mode)
  if (widgetMode === 'mini') {
    const urgentTask = filteredTasks.find((t) => !t.completed) || tasks.find((t) => !t.completed);
    return (
      <div
        className="compact-widget-container"
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px',
        }}
      >
        <CompactWidgetBar
          nextTask={urgentTask}
          onToggleTask={handleToggleComplete}
          onExpandToFull={() => toggleWidgetMode('compact')}
          alwaysOnTop={settings.alwaysOnTop}
          onTogglePin={togglePin}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        padding: 0,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <div
        className={`widget-app ${isFullScreen ? 'layout-fullscreen layout-large' : (isMediumMode ? 'layout-medium' : (isCompactMode ? 'layout-compact' : 'layout-large'))} density-${settings.layoutDensity || 'large'}`}
        style={{
          width: '100%',
          height: '100%',
          maxWidth: '100%',
          maxHeight: '100%',
          borderRadius: isFullScreen ? '0px' : undefined,
        }}
      >
        {/* Borderless TitleBar with Window controls */}
        <TitleBar
          onOpenSettings={() => setIsSettingsOpen(true)}
          isLocked={settings.lockWidget}
        >
          {/* Feature Navigation Tabs */}
          <div className="nav-tab-bar" style={{ padding: 0, border: 'none', background: 'transparent' }}>
            <button
              className={`nav-tab ${activeTab === 'tasks' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('tasks');
                setSelectedDate(null);
              }}
              title="Tasks"
            >
              <CheckSquare size={16} />
            </button>

            <button
              className={`nav-tab ${activeTab === 'focus' ? 'active' : ''}`}
              onClick={() => setActiveTab('focus')}
              title="Focus"
            >
              <Timer size={16} />
            </button>

            <button
              className={`nav-tab ${activeTab === 'notes' ? 'active' : ''}`}
              onClick={() => setActiveTab('notes')}
              title="Notes"
            >
              <FileText size={16} />
            </button>
          </div>
        </TitleBar>

        <div 
          className="main-scroll-area"
          style={{ 
            paddingBottom: activeTab === 'tasks' ? '60px' : undefined,
            filter: isSettingsOpen ? 'blur(5px) brightness(0.8)' : 'none',
            transition: 'filter 0.2s ease',
            pointerEvents: isSettingsOpen ? 'none' : 'auto'
          }}
        >
          {/* TAB 1: TASKS */}
          {activeTab === 'tasks' && (
            <>




              {/* Task Items List */}
              {filteredTasks.length === 0 ? (
                <div
                  style={{
                    padding: '30px 12px',
                    textAlign: 'center',
                    color: 'var(--text-tertiary)',
                    fontSize: 12,
                  }}
                >
                  {filter === 'archived' ? (
                    'No archived tasks.'
                  ) : filter === 'completed' ? (
                    'No completed tasks yet.'
                  ) : filter === 'upcoming' ? (
                    'No upcoming tasks scheduled.'
                  ) : (
                    'No tasks yet. Click "+ Add" above to create one!'
                  )}
                </div>
              ) : (
                <div className="task-items-container">
                  {filteredTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggle={handleToggleComplete}
                      onDelete={deleteTask}
                      onUpdate={updateTask}
                      onPin={togglePinTask}
                      onArchive={toggleArchiveTask}
                      onDuplicate={duplicateTask}
                      onAddSubtask={addSubtask}
                      onToggleSubtask={toggleSubtask}
                      onDeleteSubtask={deleteSubtask}
                      onSelectTag={() => {}}
                      isBulkMode={false}
                      draggable={true}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDragEnd={handleDragEnd}
                      onDrop={handleDrop}
                      isDragOver={dragOverId === task.id}
                      isCompactMode={isCompactMode}
                    />
                  ))}
                </div>
              )}

            </>
          )}

          {/* TAB 2: CALENDAR (Month, Week, Agenda) */}
          {activeTab === 'calendar' && (
            <CalendarView
              tasks={tasks}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onRescheduleTask={handleRescheduleTask}
              onToggleTask={handleToggleComplete}
              onDeleteTask={deleteTask}
              onEditTask={handleEditTask}
            />
          )}

          {/* TAB 3: FOCUS SUITE */}
          <div style={{ display: activeTab === 'focus' ? 'flex' : 'none', flex: 1, flexDirection: 'column', minHeight: 0 }}>
            <PomodoroWidget tasks={tasks} soundEnabled={settings.soundEnabled} />
          </div>

          {/* TAB 4: SCREENSHOT NOTES */}
          <div style={{ display: activeTab === 'notes' ? 'flex' : 'none', flex: 1, flexDirection: 'column', minHeight: 0 }}>
            <NotesView />
          </div>
        </div>

        {/* Fixed Bottom Input for Tasks */}
        {activeTab === 'tasks' && (
          <div style={{ 
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '12px 10px 10px 10px', 
            background: 'transparent',
            zIndex: 10
          }}>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (newTaskTitle.trim()) {
                  addTask({ title: newTaskTitle.trim() });
                  setNewTaskTitle('');
                  setTimeout(() => {
                    const scrollArea = document.querySelector('.main-scroll-area');
                    if (scrollArea) scrollArea.scrollTop = scrollArea.scrollHeight;
                  }, 50);
                }
              }}
              style={{ display: 'flex', gap: '8px' }}
            >
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Enter new task..."
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  borderRadius: '24px',
                  border: '1px solid var(--border-card)',
                  background: 'var(--bg-input)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={!newTaskTitle.trim()}
                style={{
                  padding: '8px 12px',
                  borderRadius: '24px',
                  background: 'var(--accent-primary)',
                  color: 'white',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: newTaskTitle.trim() ? 'pointer' : 'not-allowed',
                  opacity: newTaskTitle.trim() ? 1 : 0.6
                }}
              >
                <Plus size={16} strokeWidth={3} />
              </button>
            </form>
          </div>
        )}

        {/* Modals */}
        <AddTaskModal
          isOpen={isAddTaskOpen}
          onClose={() => {
            setIsAddTaskOpen(false);
            setEditingTask(null);
          }}
          onSave={handleSaveTask}
          initialTask={editingTask}
        />

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          updateSetting={updateSetting}
          updateNestedSetting={updateNestedSetting}
          togglePin={togglePin}
        />

        <WelcomeNameModal
          isOpen={isNameSetupOpen}
          currentName={settings.userName}
          onSave={handleSaveName}
          onSkip={handleSkipName}
        />


      </div>
    </div>
  );
}
