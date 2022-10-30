import {log, user} from "../types";
import { AMQPPubSub } from 'graphql-amqp-subscriptions';
import amqp from "amqplib";
import {v1} from "uuid";

const log: log[] = [
    {user: {name: "default", email: "default@default.com", password: 123456}, uuid: 'khbkhvk'}
]

export const resolvers = {
    Query: {
        loginUser: ({uuid}: any, context: any): log => {
            return log.filter(e => e.uuid === uuid)[0]
        },
    },
    Mutation: {
        login: ({user}: any, context: any): any => {
            const uuid = v1()
            user.uuid = uuid
            log.push(user)
            return {uuid: uuid}
        }
    }
    // user: async ({email, password}: any, context: any): Promise<user|void> => {
    //     return amqp.connect('amqp://localhost').then(async conn => {
    //         const pubsub = new AMQPPubSub({
    //             connection: conn,
    //             exchange: {
    //                 name: 'exchange',
    //                 type: 'topic',
    //                 options: {
    //                     durable: false,
    //                     autoDelete: true
    //                 }
    //             },
    //             queue: {
    //                 name: 'login',
    //                 options: {
    //                     exclusive: true,
    //                     durable: false,
    //                     autoDelete: true
    //                 },
    //                 unbindOnDispose: false,
    //                 deleteOnDispose: false
    //             }
    //         });
    //         const response: user|void = await pubsub.publish("loginRep", {name: email, password: password})
    //         console.log(response)
    //         return response
    //     })
    //     .catch(err => {
    //         console.error(err);
    //     });
    // },



    // register: ({email, password, name}: any, context: any): any => {
    //     return amqp.connect('amqp://localhost').then(async conn => {
    //         const pubsub = new AMQPPubSub({
    //             connection: conn,
    //             exchange: {
    //                 name: 'registerRep',
    //                 type: 'fanout',
    //                 options: {
    //                     durable: false,
    //                     autoDelete: true
    //                 }
    //             },
    //             queue: {
    //                 name: 'register',
    //                 options: {
    //                     exclusive: true,
    //                     durable: true,
    //                     autoDelete: true
    //                 },
    //                 unbindOnDispose: false,
    //                 deleteOnDispose: false
    //             }
    //         });
    //         await pubsub.publish("registerRep", {name: name, email: email, password: password})
    //         const response: AsyncIterator<unknown> = await pubsub.asyncIterator("registerRep")
    //         console.log(response)
    //         return response
    //     })
    //     .catch(err => {
    //         console.error(err);
    //     });
    // },



}