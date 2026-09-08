import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TodoService } from '../../services/todo.service';
import { TodoFormComponent, TodoFormResult } from '../todo-form/todo-form.component';
import { FilterType, Priority, Todo } from '../../models/todo.model';

const PRIORITY_WEIGHT: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

@Component({
  selector: 'app-todo-list',
  standalone: true,
  imports: [CommonModule, TodoFormComponent],
  templateUrl: './todo-list.component.html',
  styleUrl: './todo-list.component.css',
})
export class TodoListComponent {
  private todoService = inject(TodoService);

  filter = signal<FilterType>('all');
  sortByPriority = signal<boolean>(false);
  editingTodo = signal<Todo | null>(null);

  readonly loading = this.todoService.loading;
  readonly error = this.todoService.error;

  readonly visibleTodos = computed(() => {
    const all = this.todoService.todos();
    const currentFilter = this.filter();

    let filtered = all;
    if (currentFilter === 'completed') filtered = all.filter((t) => t.completed);
    else if (currentFilter === 'active') filtered = all.filter((t) => !t.completed);

    if (this.sortByPriority()) {
      filtered = [...filtered].sort(
        (a, b) => PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]
      );
    }

    return filtered;
  });

  readonly stats = computed(() => {
    const all = this.todoService.todos();
    return {
      total: all.length,
      completed: all.filter((t) => t.completed).length,
      active: all.filter((t) => !t.completed).length,
    };
  });

  constructor() {
    this.todoService.loadTodos();
  }

  setFilter(filter: FilterType): void { this.filter.set(filter); }
  toggleSort(): void { this.sortByPriority.update((v) => !v); }

  onSave(result: TodoFormResult): void {
    const editing = this.editingTodo();
    if (editing) {
      this.todoService.updateTodo(editing.id, { title: result.title, priority: result.priority });
      this.editingTodo.set(null);
    } else {
      this.todoService.addTodo(result.title, result.priority);
    }
  }

  onCancelEdit(): void { this.editingTodo.set(null); }
  startEdit(todo: Todo): void { this.editingTodo.set(todo); }
  toggleCompleted(todo: Todo): void { this.todoService.toggleCompleted(todo); }
  remove(id: number): void { this.todoService.deleteTodo(id); }
  reload(): void { this.todoService.loadTodos(); }

  priorityLabel(priority: Priority): string {
    return { low: 'Низький', medium: 'Середній', high: 'Високий' }[priority];
  }

  trackById(index: number, todo: Todo): number { return todo.id; }
}
