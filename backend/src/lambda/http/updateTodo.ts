import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { createLogger } from '../../utils/logger'
import { getUserId } from '../utils'
import { udpateTodo } from '../../businessLogic/todos'

const logger = createLogger('updateToDos')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  const id = getUserId(event)
  if (todoId == "" || id == "") {
    return {
      statusCode: 406,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        error: 'User and TodoItem IDs cannot be empty strings'
      })
    }
  }
  logger.info('Updating ToDo: ', { todoId: todoId, userId: id })

  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
  logger.info('Update for ToDo: ', updatedTodo)

  if (await udpateTodo(updatedTodo, id, todoId)) {

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: ""
    }
  } else {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        error: 'DB server did not update todo item'
      })
    }
  }

}
