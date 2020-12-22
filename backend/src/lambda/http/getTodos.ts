import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import { createLogger } from '../../utils/logger'
import * as AWS  from 'aws-sdk'
import {getUserId} from '../utils'

const docClient = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE
const logger = createLogger('getToDos')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Processing event: ', event)

  const result = await docClient.scan({
    TableName: todosTable
  }).promise()

  // get user ID from incoming request
  const id = getUserId(event)
  logger.info('User ID: ', id)

  // return DB values matching user ID
  const items = result.Items.filter(function( obj ) {
    return obj['userId'] === id
  })
  logger.info('Matching TODO items: ', items)

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      items
    })
  }
}
