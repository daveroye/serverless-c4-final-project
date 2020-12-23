import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import { createLogger } from '../../utils/logger'
import * as AWS  from 'aws-sdk'
import {getUserId} from '../utils'

const logger = createLogger('generateUploadURL')
const s3 = new AWS.S3({ signatureVersion: 'v4' })
const bucketName = process.env.IMAGES_S3_BUCKET
const urlExpiration = process.env.SIGNED_URL_EXPIRATION
const docClient = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  logger.info('Upload URL for ToDoID: ', { todoId: todoId })

  const signedURL = getUploadUrl(todoId)
  logger.info('Upload URL: ', { signedURL: signedURL })

  // get user ID from incoming request
  const id = getUserId(event)
  logger.info('User ID: ', { userId: id })

  const result = await docClient.update({
    TableName : todosTable,
    Key: {"userId": id, "todoId": todoId},
    UpdateExpression: "set attachmentUrl=:a",
    ExpressionAttributeValues: {
        ':a': signedURL.split("?")[0]
    }
  }).promise()
  logger.info('result from DynamoDB: ', {result: result})

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

function getUploadUrl(imageId: string) {
  return s3.getSignedUrl('putObject', {
    Bucket: bucketName,
    Key: imageId,
    Expires: parseInt(urlExpiration, 10)
  })
}