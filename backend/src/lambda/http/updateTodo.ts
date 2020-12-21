import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { createLogger } from '../../utils/logger'

const logger = createLogger('getToDos')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  logger.info('Updating ToDo: ', todoId)

  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
  logger.info('Update for ToDo: ', updatedTodo)

  // TODO: Update a TODO item with the provided id using values in the "updatedTodo" object
  return undefined
}
