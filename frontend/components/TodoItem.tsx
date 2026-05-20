"use client";

import { Check, Trash2, Edit2, X } from 'lucide-react';
import { Todo } from '../types';
import { motion } from 'framer-motion';
import { forwardRef, useState } from 'react';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, title: string) => void;
}

const TodoItem = forwardRef<HTMLDivElement, TodoItemProps>(({ todo, onToggle, onDelete, onEdit }, ref) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);

  const handleEditSubmit = () => {
    if (editTitle.trim() && editTitle !== todo.title) {
      onEdit(todo.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
      id={`todo-${todo.id}`}
    >
      <button
        onClick={() => onToggle(todo.id, !todo.completed)}
        className={`shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
          todo.completed
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-gray-200 hover:border-blue-400 group-hover:bg-gray-50'
        }`}
      >
        {todo.completed && <Check size={14} strokeWidth={3} />}
      </button>

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEditSubmit()}
              onBlur={handleEditSubmit}
              className="w-full bg-gray-50 border-none px-2 py-1 rounded text-sm focus:ring-1 ring-blue-200 outline-none"
            />
            <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-red-500">
              <X size={14} />
            </button>
          </div>
        ) : (
          <p className={`text-sm font-medium truncate ${todo.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
            {todo.title}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!todo.completed && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit2 size={16} />
          </button>
        )}
        <button
          onClick={() => onDelete(todo.id)}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </motion.div>
  );
});

export default TodoItem;
