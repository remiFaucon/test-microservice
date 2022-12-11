import {ApolloServer, GraphQLRequest} from '@apollo/server';
import {ApolloGateway, IntrospectAndCompose} from "@apollo/gateway";
import {startStandaloneServer} from '@apollo/server/standalone';
import FileUploadDataSource from "@profusion/apollo-federation-upload";

const gateway = new ApolloGateway({
    buildService: ({ url }) => new FileUploadDataSource({
        url,
        useChunkedTransfer: true,
        willSendRequest({ request, context }: any) {
            request.http.headers.set('userId', context.userId);
            request.http.headers.set('authorization', context.authorization);
            request.http.headers.set('permissions', context.permissions);
        },
    }),
    introspectionHeaders: {
        "content-type": "multipart/form-data",
        // "Access-Control-Allow-Origin": "192.168.56.12:3001"
    },
    supergraphSdl: new IntrospectAndCompose({
        subgraphs: [
            {name: "express", url: "http://192.168.56.12:3001/graphql"},
            {name: "auth", url: "http://192.168.56.10:3002/query"},
            {name: "face", url: "http://192.168.56.11:5000/graphql"}
        ],
        introspectionHeaders: {
            "content-type": "multipart/form-data",
            "Access-Control-Allow-Origin": "192.168.56.12:3001"
        },
    }),
});

const serverApollo = new ApolloServer({
    gateway: gateway,
    csrfPrevention: { requestHeaders: ['Some-Special-Header']}
});

startStandaloneServer(serverApollo).then(obj => console.log(`🚀  Server ready at ${obj.url}`))
