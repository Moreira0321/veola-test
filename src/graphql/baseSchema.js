const { gql } = require('apollo-server-express');

const typeDefs = gql`
  scalar JSON

  type Query {
    getAll(model: String!): [JSON]
    getOne(model: String!, id: ID!): JSON
  }

  type Mutation {
    create(model: String!, input: JSON!): JSON
    update(model: String!, id: ID!, input: JSON!): JSON
    delete(model: String!, id: ID!): String
  }
`;

module.exports = typeDefs;
