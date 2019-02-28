const express = require('express');
const graphqlHTTP = require('express-graphql');
const Schema = require('./graph/schema');
const schema = new Schema('./');
var app = express();

app.use('/graphql',graphqlHTTP({
    schema: schema.getSchema(),
    graphiql:true
}))

app.listen((8080), () => {
    console.log(`Server started on port ${8080}`);
});