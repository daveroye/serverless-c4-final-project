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
        private readonly todoTable = process.env.TODOS_TABLE) {
    }

    async getTodos(userId: string): Promise<TodoItem[]> {
        logger.info('Getting all todo items')

        const result = await this.docClient.query({
            TableName: this.todoTable,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        }).promise()

        const items = result.Items
        logger.info('Matching TODO items: ', items)

        return items as TodoItem[]
    }

    async createTodo(todo: TodoItem): Promise<TodoItem> {
        const result = await this.docClient.put({
            TableName: this.todoTable,
            Item: todo
        }).promise()
        logger.info('result from DB on todo create: ', { result: result })

        return todo
    }

    async updateTodo(userId: string, todoId: string, updatedTodo: TodoUpdate) {
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
    }

    async deleteTodo(userId: string, todoId: string) {
        await this.docClient.delete({
            TableName: this.todoTable,
            Key: { "userId": userId, "todoId": todoId }
        }).promise()
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
