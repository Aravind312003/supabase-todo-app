"use client";

import { AnimatePresence } from 'framer-motion';
import { Todo } from '../types';
import TodoItem from './TodoItem';
import { Search } from 'lucide-react';

interface TodoListProps {
  todos: Todo[];
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, title: string) => void;
}

export default function TodoList({ todos, onToggle, onDelete, onEdit }: TodoListProps) {
  if (todos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-dashed border-gray-200" id="empty-state">
        <div className="p-4 bg-gray-50 rounded-2xl mb-4 text-gray-300">
          <Search size={40} />
        </div>
        <p className="text-gray-400 font-medium italic">No tasks found. Add something above!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" id="todo-list-container">
      <AnimatePresence mode="popLayout">
        {todos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={onToggle}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
