import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import { createLogger } from '../../utils/logger'
import { getUserId } from '../utils'
import { getTodos } from '../../businessLogic/todos'

const logger = createLogger('getToDos')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

  // get user ID from incoming request
  const userId = getUserId(event)
  if (userId == "") {
    return {
      statusCode: 406,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        error: 'User ID cannot be an empty string'
      })
    }
  }
  logger.info('User ID: ', { userId: userId })

  // get sort parameter for DB query from incoming URL query string
  const sortAscending = event.queryStringParameters.sort

  // fetch list of user's todos
  const todos = await getTodos(userId, (sortAscending=='true')?true:false)

  if (!todos) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        error: 'DB server could not get a list of items'
      })
    }
  } else {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        items: todos
      })
    }
  }
}
