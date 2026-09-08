import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Priority, Todo } from '../../models/todo.model';

export interface TodoFormResult {
  title: string;
  priority: Priority;
}

@Component({
  selector: 'app-todo-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './todo-form.component.html',
  styleUrl: './todo-form.component.css',
})
export class TodoFormComponent implements OnChanges {
  @Input() editingTodo: Todo | null = null;
  @Output() save = new EventEmitter<TodoFormResult>();
  @Output() cancel = new EventEmitter<void>();

  title = '';
  priority: Priority = 'medium';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editingTodo']) {
      if (this.editingTodo) {
        this.title = this.editingTodo.title;
        this.priority = this.editingTodo.priority;
      } else {
        this.reset();
      }
    }
  }

  get isEditing(): boolean {
    return !!this.editingTodo;
  }

  submit(): void {
    const trimmed = this.title.trim();
    if (!trimmed) return;

    this.save.emit({ title: trimmed, priority: this.priority });
    if (!this.isEditing) this.reset();
  }

  onCancel(): void {
    this.reset();
    this.cancel.emit();
  }

  private reset(): void {
    this.title = '';
    this.priority = 'medium';
  }
}
