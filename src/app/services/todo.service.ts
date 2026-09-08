import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, catchError, of } from 'rxjs';
import { Todo, Priority } from '../models/todo.model';

const API_URL = 'https://jsonplaceholder.typicode.com/todos';
const PRIORITIES: Priority[] = ['low', 'medium', 'high'];

@Injectable({ providedIn: 'root' })
export class TodoService {
  private readonly _todos = signal<Todo[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private nextLocalId = 1000;
  private readonly LOCAL_ID_THRESHOLD = 1000;

  readonly todos = this._todos.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  constructor(private http: HttpClient) {}

  loadTodos(limit = 15): void {
    this._loading.set(true);
    this._error.set(null);

    this.http.get<Todo[]>(`${API_URL}?_limit=${limit}`).pipe(
      tap((todos) => {
        const withPriority = todos.map((t) => ({
          ...t,
          priority: this.randomPriority(),
        }));
        this._todos.set(withPriority);
        this._loading.set(false);
      }),
      catchError(() => {
        this._error.set('Не вдалося завантажити завдання з сервера.');
        this._loading.set(false);
        return of(null);
      })
    ).subscribe();
  }

  addTodo(title: string, priority: Priority): void {
    const payload = { title, completed: false, userId: 1 };

    this.http.post<Todo>(API_URL, payload).pipe(
      tap(() => {
        const newTodo: Todo = {
          id: this.nextLocalId++,
          title,
          completed: false,
          priority,
          userId: 1,
        };
        this._todos.update((list) => [newTodo, ...list]);
      }),
      catchError(() => {
        this._error.set('Не вдалося додати завдання.');
        return of(null);
      })
    ).subscribe();
  }

  private isLocalOnly(id: number): boolean {
    return id >= this.LOCAL_ID_THRESHOLD;
  }

  updateTodo(id: number, changes: Partial<Todo>): void {
    if (this.isLocalOnly(id)) {
      this._todos.update((list) =>
        list.map((t) => (t.id === id ? { ...t, ...changes } : t))
      );
      return;
    }

    this.http.put(`${API_URL}/${id}`, { id, ...changes }).pipe(
      tap(() => {
        this._todos.update((list) =>
          list.map((t) => (t.id === id ? { ...t, ...changes } : t))
        );
      }),
      catchError(() => {
        this._error.set('Не вдалося оновити завдання.');
        return of(null);
      })
    ).subscribe();
  }

  toggleCompleted(todo: Todo): void {
    this.updateTodo(todo.id, { completed: !todo.completed });
  }

  deleteTodo(id: number): void {
    if (this.isLocalOnly(id)) {
      this._todos.update((list) => list.filter((t) => t.id !== id));
      return;
    }

    this.http.delete(`${API_URL}/${id}`).pipe(
      tap(() => {
        this._todos.update((list) => list.filter((t) => t.id !== id));
      }),
      catchError(() => {
        this._error.set('Не вдалося видалити завдання.');
        return of(null);
      })
    ).subscribe();
  }

  private randomPriority(): Priority {
    return PRIORITIES[Math.floor(Math.random() * PRIORITIES.length)];
  }
}
