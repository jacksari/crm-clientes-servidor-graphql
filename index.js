const { ApolloServer } = require('apollo-server');
const typeDefs = require('./db/schema');
const resolvers = require('./db/resolvers');
const conectarDB = require('./config/db');
const jwt = require('jsonwebtoken');

conectarDB();


//Servidor
const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
        //console.log(req.headers['authotization']);
        const token = req.headers['authotization'] || '';
        if (token) {
            try {
                const usuario = jwt.verify(token, process.env.SECRETA);
                //console.log(usuario);
                return {
                    usuario
                }
            } catch (error) {
                console.log(error);
            }
        }
    }
});


server.listen().then(({ url }) => {
    console.log(`Servidor listo en la url ${url}`);
})