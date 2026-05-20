"use client";

import React, { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';

interface TodoFormProps {
  onAdd: (title: string) => Promise<void>;
  loading: boolean;
}

export default function TodoForm({ onAdd, loading }: TodoFormProps) {
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;

    setSubmitting(true);
    try {
      await onAdd(title.trim());
      setTitle('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative group" id="todo-form">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What needs to be done?"
        className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-5 pr-14 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-200 text-gray-700 placeholder:text-gray-400 font-medium"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={!title.trim() || submitting || loading}
        className="absolute right-2 top-2 p-2.5 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95 group-focus-within:ring-4 ring-blue-100"
      >
        {submitting ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
      </button>
    </form>
  );
}
