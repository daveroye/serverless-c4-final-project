import * as uuid from 'uuid'
import { TodoItem } from '../models/TodoItem'
import { ToDoAccess } from '../dataLayer/todoAccess'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { bool } from 'aws-sdk/clients/signer'

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
    todoId: string): Promise<boolean>  {
    return await toDoAccess.updateTodo(userId, todoId, updatedTodo)
}

export async function deleteTodo(userId: string, todoId: string): Promise<boolean> {
    return await toDoAccess.deleteTodo(userId, todoId) as boolean
}

export async function generateUploadUrl(userId: string, todoId: string): Promise<string> {
    return await toDoAccess.generateUploadUrl(userId, todoId)
}
