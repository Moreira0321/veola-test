const { gql } = require('apollo-server-express');

module.exports = gql`
  type User {
    id: ID!
    email: String!
    name: String
    role: String
    createdAt: String
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Appointment {
    id: ID!
    title: String!
    description: String
    startTime: String!
    endTime: String!
    userId: ID!
    status: String
    createdAt: String
    updatedAt: String
  }

  input AppointmentInput {
    title: String!
    description: String
    startTime: String!
    endTime: String!
    status: String
  }

  input AppointmentUpdateInput {
    title: String
    description: String
    startTime: String
    endTime: String
    status: String
  }

  type Query {
    me: User
    users: [User!]!
    appointments: [Appointment!]!
    appointment(id: ID!): Appointment
    myAppointments: [Appointment!]!
  }

  type Mutation {
    register(email: String!, password: String!, name: String): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    createAppointment(input: AppointmentInput!): Appointment!
    updateAppointment(id: ID!, input: AppointmentUpdateInput!): Appointment!
    deleteAppointment(id: ID!): Boolean!
  }
`;
