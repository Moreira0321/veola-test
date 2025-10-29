const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const routes = require("./routes");
const log = require("./utils/logger");
const errorHandler = require("./middleware/errorHandler");
const { ApolloServer } = require("apollo-server-express");
const { ApolloServerPluginLandingPageLocalDefault } = require("apollo-server-core");
const typeDefs = require("./graphql/schema");
const resolvers = require("./graphql/resolvers");
const { getUserFromToken } = require("./middleware/auth");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// REST routes
app.use("/", routes);

// GraphQL server
const server = new ApolloServer({
    typeDefs,
    resolvers,

    context: async ({ req }) => {
        const token = req.headers.authorization || "";
        const user = await getUserFromToken(token);
        return { user };
    }
});

// Expose a promise that resolves when Apollo middleware is mounted
server.start().then(() => {
    return server.applyMiddleware({ app, path: "/graphql" });
}).then(() => {
    log.info("✅ Apollo GraphQL middleware mounted at /graphql");

    // Fallback for unknown routes
    app.use((req, res) => {
        res.status(404).json({ message: "Route not found" });
    });
    // Error handling middleware
    app.use(errorHandler);
});



module.exports = app;
