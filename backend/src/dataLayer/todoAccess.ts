import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'

const XAWS = AWSXRay.captureAWS(AWS)
const logger = createLogger('toDoAccess')
const s3 = new XAWS.S3({ signatureVersion: 'v4' })
const bucketName = process.env.IMAGES_S3_BUCKET
const urlExpiration = process.env.SIGNED_URL_EXPIRATION

export class ToDoAccess {

    constructor(
        private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly todoTable = process.env.TODOS_TABLE,
        private readonly indexName = process.env.INDEX_NAME) {
    }

    async getTodos(userId: string, sortAscending: boolean): Promise<TodoItem[]> {
        logger.info('Getting all todo items')

        // define query paramaters to be used to get all todo items including a key for pagination
        const queryParams = { TableName: this.todoTable,
//                              Limit: 4, // used to test pagination
                              IndexName: this.indexName,
                              ScanIndexForward: sortAscending,
                              KeyConditionExpression: 'userId = :userId',
                              ExpressionAttributeValues: { ':userId': userId }}
        
        // define routine to iteratively retrieve items by page
        const getAllData = async (params) => {
            const _getAllData = async (params, startKey) => {
                if (startKey) {
                    if (params.ExclusiveStartKey) {
                        params.ExclusiveStartKey = startKey
                    } else {
                    params = {...params, ExclusiveStartKey: startKey}
                    }
                }
                logger.info('Parameters used for query', params)
                return this.docClient.query(params).promise()
            }
            let lastEvaluatedKey = null
            let rows = []
            let pageNum : number = 0
            do {
                const result = await _getAllData(params, lastEvaluatedKey)
                rows = rows.concat(result.Items)
                lastEvaluatedKey = result.LastEvaluatedKey
                logger.info('LastEvalutatedKey from query: ', 
                            {lastEvaluatedKey: lastEvaluatedKey, 
                             pageNumber: ++pageNum})
            } while (lastEvaluatedKey)
            return rows
        }

        try {
            const allData = await getAllData(queryParams)
            logger.info('Matching TODO items: ', allData)
            return allData as TodoItem[]
        }
        catch (error) {
            logger.error('error from DB on getting todos: ', { error: error })
            return null
        }
    }

    async createTodo(todo: TodoItem): Promise<TodoItem> {
        try {
            const result = await this.docClient.put({
                TableName: this.todoTable,
                Item: todo
            }).promise()
            logger.info('result from DB on todo create: ', { result: result })
            return todo
        }
        catch (error) {
            logger.error('error from DB on creating todo: ', { error: error })
            return null
        }   
    }

    async updateTodo(userId: string, todoId: string, updatedTodo: TodoUpdate): Promise<boolean> {
        try {
            await this.docClient.update({
                TableName: this.todoTable,
                Key: { "userId": userId, "todoId": todoId },
                ExpressionAttributeNames: { "#n": "name" },
                UpdateExpression: "set #n=:n, dueDate=:dd, done=:d",
                ExpressionAttributeValues: {
                    ':n': updatedTodo.name,
                    ':dd': updatedTodo.dueDate,
                    ':d': updatedTodo.done
                }
            }).promise()
            logger.info('updated DB todo item: ', { todoId: todoId })
            return true
        }
        catch (error) {
            logger.error('error from DB on updating todo: ', { todoId: todoId, error: error })
            return false
        }
    }

    async deleteTodo(userId: string, todoId: string): Promise<boolean>  {
        try {
            await this.docClient.delete({
                TableName: this.todoTable,
                Key: { "userId": userId, "todoId": todoId }
            }).promise()
            logger.info('deleted from DB todo item: ', { todoId: todoId })
            return true
        }
        catch (error) {
            logger.error('error from DB on deleting todo: ', { todoId: todoId, error: error })
            return false
        }
    }

    async generateUploadUrl(userId: string, todoId: string): Promise<string> {
        const signedURL: string = getUploadUrl(todoId)
        logger.info('Upload URL: ', { signedURL: signedURL })

        try {
            const result = await this.docClient.update({
                TableName: this.todoTable,
                Key: { "userId": userId, "todoId": todoId },
                UpdateExpression: "set attachmentUrl=:a",
                ExpressionAttributeValues: {
                    ':a': signedURL.split("?")[0]
                }
            }).promise()
            logger.info('result from DB on updating image URL: ', { result: result })
        }
        catch (error) {
            logger.error('error from DB on updating image URL: ', { error: error })
            throw new Error('URL for todo item could not be stored in DB')
        }
        return signedURL as string
    }
}

function getUploadUrl(imageId: string) {
    return s3.getSignedUrl('putObject', {
        Bucket: bucketName,
        Key: imageId,
        Expires: parseInt(urlExpiration, 10)
    })
}
