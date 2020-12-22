import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import {getUserId} from '../utils'
import { createLogger } from '../../utils/logger'
import * as AWS  from 'aws-sdk'

const docClient = new AWS.DynamoDB.DocumentClient()
const logger = createLogger('updateToDos')
const todosTable = process.env.TODOS_TABLE

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  logger.info('Updating ToDo: ', { todoId: todoId })

  // get user ID from incoming request
  const id = getUserId(event)
  logger.info('User ID: ', { userId: id })

  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
  logger.info('Update for ToDo: ', updatedTodo)

  const result = await docClient.update({
    TableName : todosTable,
    Key: {"userId": id, "todoId": todoId},
    ExpressionAttributeNames: {"#n":"name" },
    UpdateExpression: "set #n=:n, dueDate=:dd, done=:d",
    ExpressionAttributeValues: {
        ':n': updatedTodo.name,
        ':dd': updatedTodo.dueDate,
        ':d': updatedTodo.done
    }
  }).promise()
  logger.info('result from DynamoDB: ', result)

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      result
    })
  }

}
