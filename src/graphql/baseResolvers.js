const mongoose = require('mongoose');

/**
 * Removes sensitive fields from a Mongoose document before returning
 */
const sanitize = (doc) => {
    const obj = doc.toObject();
    if (obj.passwordHash) delete obj.passwordHash;
    return obj;
};

const baseResolvers = {
    Query: {
        getAll: async (_, { model }) => {
            const Model = mongoose.models[model];
            if (!Model) throw new Error(`Model '${model}' not found`);
            const docs = await Model.find();
            return docs.map(sanitize);
        },
        getOne: async (_, { model, id }) => {
            const Model = mongoose.models[model];
            if (!Model) throw new Error(`Model '${model}' not found`);
            const doc = await Model.findById(id);
            if (!doc) throw new Error(`${model} not found`);
            return sanitize(doc);
        },
    },

    Mutation: {
        create: async (_, { model, input }) => {
            const Model = mongoose.models[model];
            if (!Model) throw new Error(`Model '${model}' not found`);
            const doc = await Model.create(input);
            return sanitize(doc);
        },
        update: async (_, { model, id, input }) => {
            const Model = mongoose.models[model];
            if (!Model) throw new Error(`Model '${model}' not found`);
            const doc = await Model.findByIdAndUpdate(id, input, { new: true });
            if (!doc) throw new Error(`${model} not found`);
            return sanitize(doc);
        },
        delete: async (_, { model, id }) => {
            const Model = mongoose.models[model];
            if (!Model) throw new Error(`Model '${model}' not found`);
            const doc = await Model.findByIdAndDelete(id);
            if (!doc) throw new Error(`${model} not found`);
            return `${model} deleted`;
        },
    },
};

module.exports = baseResolvers;
