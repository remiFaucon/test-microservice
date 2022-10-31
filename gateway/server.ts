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
        "content-type": "multipart/form-data"
    },
    supergraphSdl: new IntrospectAndCompose({
        subgraphs: [
            {name: "express", url: "http://localhost:3001/graphql"},
            {name: "auth", url: "http://localhost:3002/query"},
            {name: "face", url: "http://localhost:5000/graphql"}
        ],
        introspectionHeaders: {
            "content-type": "multipart/form-data"
        },
    }),
});

const serverApollo = new ApolloServer({
    gateway: gateway,
    csrfPrevention: { requestHeaders: ['Some-Special-Header']}
});

startStandaloneServer(serverApollo).then(obj => console.log(`🚀  Server ready at ${obj.url}`))