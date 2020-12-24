import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import { createLogger } from '../../utils/logger'
import { getUserId } from '../utils'
import { generateUploadUrl } from '../../businessLogic/todos'

const logger = createLogger('generateUploadURL')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  logger.info('Upload URL for ToDoID: ', { todoId: todoId })

  // get user ID from incoming request
  const id = getUserId(event)
  logger.info('User ID: ', { userId: id })

  try {
    const signedURL = await generateUploadUrl(id, todoId)

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        uploadUrl: signedURL
      })
    }
  }
  catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: error
      })
    }
  }
}
