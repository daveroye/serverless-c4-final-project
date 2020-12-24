import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import { createLogger } from '../../utils/logger'
import {getUserId} from '../utils'
import {deleteTodo} from '../../businessLogic/todos'

const logger = createLogger('deleteToDos')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  logger.info('Deleting ToDo: ', { todoId: todoId })

  // get user ID from incoming request
  const id = getUserId(event)
  logger.info('User ID: ', { userId: id })

  await deleteTodo(id, todoId)

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: ""
  }
}
