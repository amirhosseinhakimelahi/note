import { toLocalDateStr } from '../services/date';
import React, { useState, useMemo } from 'react';
import {
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  AlertTriangle,
  Repeat,
  Tag,
  ArrowUpDown,
  Trash2,
  Edit2,
  CheckSquare,
  ChevronDown,
  Filter
} from 'lucide-react';
import { Task, Category, Priority } from '../types';
import { formatToSolarHijri } from '../services/jalali';

interface PlannerScreenProps {
  tasks: Task[];
  categories: Category[];
  showSolarHijriDates: boolean;
  onOpenCreateTask: (defaultDate?: string) => void;
  onOpenEditTask: (task: Task) => void;
  onToggleTaskComplete: (id: string, completed: boolean) => void;
  onRequestDeleteTask: (id: string) => void;
  onOpenCategoryManager: () => void;
}

type TaskFilter = 'today' | 'upcoming' | 'overdue' | 'completed' | 'all';
type SortBy = 'dueDate' | 'priority' | 'createdAt';

export const PlannerScreen: React.FC<PlannerScreenProps> = ({
  tasks,
  categories,
  showSolarHijriDates,
  onOpenCreateTask,
  onOpenEditTask,
  onToggleTaskComplete,
  onRequestDeleteTask,
  onOpenCategoryManager,
}) => {
  const [activeFilter, setActiveFilter] = useState<TaskFilter>('today');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('dueDate');

  const todayStr = toLocalDateStr();

  // Helper map for categories
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  // Priority ranking
  const priorityScore: Record<Priority, number> = { High: 3, Medium: 2, Low: 1 };

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Category filter
      if (selectedCategory && t.categoryId !== selectedCategory) {
        return false;
      }

      switch (activeFilter) {
        case 'today':
          return t.dueDate === todayStr && !t.completed;
        case 'upcoming':
          return t.dueDate > todayStr && !t.completed;
        case 'overdue':
          return t.dueDate < todayStr && !t.completed;
        case 'completed':
          return t.completed;
        case 'all':
        default:
          return true;
      }
    });
  }, [tasks, activeFilter, selectedCategory, todayStr]);

  // Sort tasks
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      if (sortBy === 'dueDate') {
        const dateDiff = a.dueDate.localeCompare(b.dueDate);
        if (dateDiff !== 0) return dateDiff;
        if (a.dueTime && b.dueTime) return a.dueTime.localeCompare(b.dueTime);
        return priorityScore[b.priority] - priorityScore[a.priority];
      }
      if (sortBy === 'priority') {
        const pDiff = priorityScore[b.priority] - priorityScore[a.priority];
        if (pDiff !== 0) return pDiff;
        return a.dueDate.localeCompare(b.dueDate);
      }
      if (sortBy === 'createdAt') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });
  }, [filteredTasks, sortBy]);

  // Counts for tabs
  const counts = useMemo(() => {
    return {
      today: tasks.filter((t) => t.dueDate === todayStr && !t.completed).length,
      upcoming: tasks.filter((t) => t.dueDate > todayStr && !t.completed).length,
      overdue: tasks.filter((t) => t.dueDate < todayStr && !t.completed).length,
      completed: tasks.filter((t) => t.completed).length,
      all: tasks.length,
    };
  }, [tasks, todayStr]);

  const filterTabs: { id: TaskFilter; label: string; count: number }[] = [
    { id: 'today', label: 'Today', count: counts.today },
    { id: 'upcoming', label: 'Upcoming', count: counts.upcoming },
    { id: 'overdue', label: 'Overdue', count: counts.overdue },
    { id: 'completed', label: 'Completed', count: counts.completed },
    { id: 'all', label: 'All', count: counts.all },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 max-w-2xl mx-auto w-full pb-24">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 dark:text-white tracking-tight">
            Planner
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {counts.today} tasks due today • {counts.overdue} overdue
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenCreateTask()}
          className="min-h-[44px] px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      {/* Filter Tabs Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab.id;
          const isOverdueTab = tab.id === 'overdue' && tab.count > 0;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-2xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                isActive
                  ? isOverdueTab
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-indigo-600 text-white shadow-sm'
                  : isOverdueTab
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900'
                  : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Category Filter & Sorting Row */}
      <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
        {/* Category chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-[65%] pb-1">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`min-h-[32px] px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors cursor-pointer shrink-0 ${
              selectedCategory === null
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            All Categories
          </button>

          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCategory(selectedCategory === c.id ? null : c.id)}
              className={`min-h-[32px] px-2.5 py-1 rounded-full text-[11px] font-medium border flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                selectedCategory === c.id
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
              {c.name}
            </button>
          ))}

          <button
            type="button"
            onClick={onOpenCategoryManager}
            className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline px-1.5 font-medium shrink-0 cursor-pointer"
          >
            + Edit
          </button>
        </div>

        {/* Sort dropdown */}
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <ArrowUpDown className="w-3.5 h-3.5" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="bg-transparent border-0 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none cursor-pointer"
          >
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="createdAt">Date Created</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      {sortedTasks.length === 0 ? (
        <div className="py-14 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center mx-auto">
            <CheckSquare className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {activeFilter === 'today'
              ? 'No tasks due today'
              : activeFilter === 'overdue'
              ? 'Great news! No overdue tasks'
              : activeFilter === 'completed'
              ? 'No completed tasks yet'
              : 'No tasks found'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            {activeFilter === 'today'
              ? 'Add a task to schedule your work, homework, or personal goals for today.'
              : 'Keep yourself organized and on track by scheduling tasks with Daylight.'}
          </p>
          <button
            type="button"
            onClick={() => onOpenCreateTask(activeFilter === 'today' ? todayStr : undefined)}
            className="min-h-[44px] px-5 py-2.5 rounded-full bg-indigo-600 text-white text-xs font-semibold shadow hover:bg-indigo-700 cursor-pointer"
          >
            Add New Task
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {sortedTasks.map((task) => {
            const isOverdue = task.dueDate < todayStr && !task.completed;
            const category = categoryMap.get(task.categoryId);

            return (
              <div
                key={task.id}
                className={`group flex items-start gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all shadow-sm ${
                  isOverdue
                    ? 'border-rose-300 dark:border-rose-900/80 bg-rose-50/20'
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
                }`}
              >
                {/* Complete checkbox */}
                <button
                  type="button"
                  onClick={() => onToggleTaskComplete(task.id, !task.completed)}
                  className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer shrink-0"
                  title={task.completed ? 'Mark incomplete' : 'Mark completed'}
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100 dark:fill-emerald-950" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>

                {/* Task Details */}
                <div
                  className="flex-1 cursor-pointer min-w-0"
                  onClick={() => onOpenEditTask(task)}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-sm font-semibold truncate ${
                        task.completed
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {task.title}
                    </span>

                    {/* Overdue visual pill (badge + text + warning icon) */}
                    {isOverdue && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        OVERDUE
                      </span>
                    )}

                    {/* Priority badge */}
                    {task.priority === 'High' && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                        High Priority
                      </span>
                    )}
                    {task.priority === 'Low' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        Low
                      </span>
                    )}
                  </div>

                  {task.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {task.description}
                    </p>
                  )}

                  {/* Metadata tags */}
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                    {/* Due Date & Time */}
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3 h-3 text-indigo-500" />
                      {task.dueDate}
                      {showSolarHijriDates && (
                        <span className="text-[10px] text-slate-400">
                          ({formatToSolarHijri(task.dueDate)})
                        </span>
                      )}
                      {task.dueTime && (
                        <span className="text-slate-600 dark:text-slate-300 ml-0.5">
                          at {task.dueTime}
                        </span>
                      )}
                    </span>

                    {/* Category pill */}
                    {category && (
                      <span className="flex items-center gap-1">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </span>
                    )}

                    {/* Recurrence */}
                    {task.recurrence && task.recurrence !== 'None' && (
                      <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium">
                        <Repeat className="w-3 h-3" />
                        {task.recurrence}
                      </span>
                    )}

                    {/* Checklist stats */}
                    {task.checklist && task.checklist.length > 0 && (
                      <span className="text-slate-500">
                        Checklist ({task.checklist.filter((c) => c.completed).length}/{task.checklist.length})
                      </span>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onOpenEditTask(task)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    title="Edit task"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRequestDeleteTask(task.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                    title="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
