import * as uuid from 'uuid'
import { TodoItem } from '../models/TodoItem'
import { ToDoAccess } from '../dataLayer/todoAccess'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'

const toDoAccess = new ToDoAccess()

export async function getTodos(userId: string): Promise<TodoItem[]> {
  return toDoAccess.getTodos(userId)
}

export async function createTodo(
    newTodo: CreateTodoRequest,
    userId: string
): Promise<TodoItem> {

    const todoId = uuid.v4()

    return await toDoAccess.createTodo({
        userId: userId,
        todoId: todoId,
        createdAt: new Date().toISOString(),
        name: newTodo.name,
        dueDate: newTodo.dueDate,
        done: false
    })
}

export async function udpateTodo(
    updatedTodo: UpdateTodoRequest,
    userId: string,
    todoId: string) {
    await toDoAccess.updateTodo(userId, todoId, updatedTodo)
}
