import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { TodoItem } from '../../models/TodoItem'
import { createLogger } from '../../utils/logger'
import {getUserId} from '../utils'
import * as uuid from 'uuid'
import * as AWS  from 'aws-sdk'

const docClient = new AWS.DynamoDB.DocumentClient()
const logger = createLogger('createToDos')
const todosTable = process.env.TODOS_TABLE

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const newTodo: CreateTodoRequest = JSON.parse(event.body)
  logger.info('Creating ToDo: ', newTodo)

  // get user ID from incoming request
  const id = getUserId(event)
  logger.info('User ID: ', { userId: id })

  const itemId = uuid.v4()

  const newItem: TodoItem = {
    userId: id,
    todoId: itemId,
    createdAt: new Date().toISOString(),
    name: newTodo.name,
    dueDate: newTodo.dueDate,
    done: false
  }
  logger.info('New ToDo: ', newItem)

  const result = await docClient.put({
    TableName : todosTable,
    Item: newItem
  }).promise()
  logger.info('result from DynamoDB: ', { result: result })

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      item: newItem
    })
  }

}
