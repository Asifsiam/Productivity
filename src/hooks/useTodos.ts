import { useCallback } from 'react';
import { useStorage } from './useStorage';
import { STORAGE_KEYS } from '@/constants/storage';
import type { Todo } from '@/types';
import { format } from 'date-fns';

export function useTodos() {
  const { data: todos, save, loading } = useStorage<Todo[]>(STORAGE_KEYS.TODOS, []);

  const addTodo = useCallback(async (text: string) => {
    const newTodo: Todo = {
      id: Date.now().toString(),
      text,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    await save([newTodo, ...todos]);
  }, [todos, save]);

  const updateStatus = useCallback(async (id: string, status: 'completed' | 'skipped') => {
    const updated = todos.map(t => {
      if (t.id !== id) return t;
      return {
        ...t,
        status,
        completedAt: status === 'completed' ? new Date().toISOString() : undefined,
      };
    });
    await save(updated);
  }, [todos, save]);

  const deleteTodo = useCallback(async (id: string) => {
    await save(todos.filter(t => t.id !== id));
  }, [todos, save]);

  const pending = todos.filter(t => t.status === 'pending');
  const completed = todos.filter(t => t.status === 'completed');
  const skipped = todos.filter(t => t.status === 'skipped');

  return {
    todos,
    loading,
    pending,
    completed,
    skipped,
    addTodo,
    updateStatus,
    deleteTodo,
  };
}
