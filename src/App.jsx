import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Calendar as CalendarIcon,
  Timer,
} from 'lucide-react';
import { TitleBar } from './components/TitleBar';
import { Header } from './components/Header';
import { ProgressBar } from './components/ProgressBar';
import { TaskCard } from './components/TaskCard';
import { AddTaskModal } from './components/AddTaskModal';



import { CalendarView } from './components/CalendarView';
import { PomodoroWidget } from './components/PomodoroWidget';
import { SettingsModal } from './components/SettingsModal';
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
  const handleToggleComplete = (id) => {
    toggleComplete(id);
  };
  const [widgetMode, setWidgetMode] = useState(() => {
    try {
      return localStorage.getItem('deskflow_widget_mode') || 'full';
    } catch (_) {
      return 'full';
    }
  });
  const [isClickThrough, setIsClickThrough] = useState(false);


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

      // 'Alt + C': Toggle Click-Through Ghost Mode
      if (e.altKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        toggleClickThrough();
        return;
      }

      // 'Alt + M': Toggle Compact Mini-Bar Mode
      if (e.altKey && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        toggleWidgetMode();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isAddTaskOpen,
    isSettingsOpen,
    widgetMode,
    isClickThrough,
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


  // Windows Integration Window Controls
  const isCompactMode = widgetMode === 'compact' || settings.widgetSize === 'compact';

  const toggleWidgetMode = (forcedMode) => {
    let nextMode;
    if (forcedMode) {
      nextMode = forcedMode;
    } else {
      nextMode = isCompactMode ? 'full' : 'compact';
    }
    setWidgetMode(nextMode);
    try {
      localStorage.setItem('deskflow_widget_mode', nextMode);
    } catch (_) {}
    if (typeof window !== 'undefined' && window.deskflowAPI?.windowControl?.setWidgetMode) {
      window.deskflowAPI.windowControl.setWidgetMode(nextMode);
    }
  };

  const toggleClickThrough = () => {
    const next = !isClickThrough;
    setIsClickThrough(next);
    if (typeof window !== 'undefined' && window.deskflowAPI?.windowControl?.setClickThrough) {
      window.deskflowAPI.windowControl.setClickThrough(next);
    }
  };

  const handleSnap = (edge = 'top-right') => {
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
        className={`compact-widget-container ${isClickThrough ? 'click-through-active' : ''}`}
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
        justifyContent: 'center',
        padding: '8px',
      }}
    >
      <div
        className={`widget-app ${isCompactMode ? 'layout-compact' : 'layout-large'} density-${settings.layoutDensity || 'medium'} ${isClickThrough ? 'click-through-active' : ''}`}
        style={{
          width: isCompactMode ? 'var(--widget-width, 380px)' : 'var(--widget-width, 480px)',
          maxWidth: '100%',
          height: '100%',
          maxHeight: isCompactMode ? '780px' : '840px',
        }}
      >
        {/* Borderless TitleBar with Window controls & Pin */}
        <TitleBar
          alwaysOnTop={settings.alwaysOnTop}
          onTogglePin={togglePin}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onToggleCompactMode={() => toggleWidgetMode()}
          isCompactMode={isCompactMode}
          isClickThrough={isClickThrough}
          onToggleClickThrough={toggleClickThrough}
          onSnapToRight={() => handleSnap('top-right')}
        />

        {/* Header, Clock & Filters */}
        <Header
          userName={settings.userName}
          filter={filter}
          setFilter={setFilter}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          onOpenAddTask={() => {
            setEditingTask(null);
            setIsAddTaskOpen(true);
          }}
          stats={stats}
          isCompactMode={isCompactMode}
        />

        {/* Overall Completion Progress */}
        {settings.enabledWidgets?.progressBar !== false && (
          <ProgressBar stats={stats} isCompactMode={isCompactMode} />
        )}

        {/* Feature Navigation Tabs */}
        <div className="nav-tab-bar">
          <button
            className={`nav-tab ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('tasks');
              setSelectedDate(null);
            }}
            title="Tasks"
          >
            <CheckSquare size={13} />
            <span>Tasks</span>
          </button>

          <button
            className={`nav-tab ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendar')}
            title="Calendar"
          >
            <CalendarIcon size={13} />
            <span>Calendar</span>
          </button>

          <button
            className={`nav-tab ${activeTab === 'focus' ? 'active' : ''}`}
            onClick={() => setActiveTab('focus')}
            title="Focus"
          >
            <Timer size={13} />
            <span>Focus</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="main-scroll-area">
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
                    'No tasks found in this view. Use Quick Add above to create one!'
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
                      onEdit={handleEditTask}
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
          {activeTab === 'focus' && (
            <PomodoroWidget tasks={tasks} soundEnabled={settings.soundEnabled} />
          )}


        </div>

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
          isClickThrough={isClickThrough}
          onToggleClickThrough={toggleClickThrough}
        />


      </div>
    </div>
  );
}
