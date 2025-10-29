const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Appointment = require('../models/appointment.model');
const { jwtSecret, jwtExpiresIn } = require('../config');

function toUserDTO(userDoc) {
    if (!userDoc) return null;
    const { _id, email, name, role, createdAt } = userDoc;
    return { id: _id.toString(), email, name, role, createdAt };
}

function toAppointmentDTO(appointmentDoc) {
    if (!appointmentDoc) return null;
    const { _id, title, description, startTime, endTime, userId, status, createdAt, updatedAt } = appointmentDoc;
    return {
        id: _id.toString(),
        title,
        description,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        userId: userId.toString(),
        status,
        createdAt: createdAt ? createdAt.toISOString() : null,
        updatedAt: updatedAt ? updatedAt.toISOString() : null
    };
}

module.exports = {
    Query: {
        me: async (_, __, { user }) => {
            return user ? toUserDTO(user) : null;
        },
        users: async () => {
            const users = await User.find({}).sort({ createdAt: -1 });
            return users.map(toUserDTO);
        },
        appointments: async (_, __, { user }) => {
            if (!user) throw new Error('Authentication required');
            // Admins can see all appointments, regular users see only their own
            const filter = user.role === 'admin' ? {} : { userId: user._id };
            const appointments = await Appointment.find(filter).sort({ startTime: 1 });
            return appointments.map(toAppointmentDTO);
        },
        appointment: async (_, { id }, { user }) => {
            if (!user) throw new Error('Authentication required');
            const appointment = await Appointment.findById(id);
            if (!appointment) throw new Error('Appointment not found');
            // Users can only access their own appointments unless they're admin
            if (user.role !== 'admin' && appointment.userId.toString() !== user._id.toString()) {
                throw new Error('Access denied');
            }
            return toAppointmentDTO(appointment);
        },
        myAppointments: async (_, __, { user }) => {
            if (!user) throw new Error('Authentication required');
            const appointments = await Appointment.find({ userId: user._id }).sort({ startTime: 1 });
            return appointments.map(toAppointmentDTO);
        }
    },
    Mutation: {
        register: async (_, { email, password, name }) => {
            const existing = await User.findOne({ email });
            if (existing) throw new Error('Email already in use');
            const passwordHash = await bcrypt.hash(password, 10);
            const user = await User.create({ email, passwordHash, name });
            const token = jwt.sign({ sub: user._id.toString() }, jwtSecret, { expiresIn: jwtExpiresIn });
            return { token, user: toUserDTO(user) };
        },
        login: async (_, { email, password }) => {
            const user = await User.findOne({ email });
            if (!user) throw new Error('Invalid credentials');
            const ok = await bcrypt.compare(password, user.passwordHash);
            if (!ok) throw new Error('Invalid credentials');
            const token = jwt.sign({ sub: user._id.toString() }, jwtSecret, { expiresIn: jwtExpiresIn });
            return { token, user: toUserDTO(user) };
        },
        createAppointment: async (_, { input }, { user }) => {
            if (!user) throw new Error('Authentication required');
            const { title, description, startTime, endTime, status } = input;
            const appointment = await Appointment.create({
                title,
                description,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                userId: user._id,
                status: status || 'pending'
            });
            return toAppointmentDTO(appointment);
        },
        updateAppointment: async (_, { id, input }, { user }) => {
            if (!user) throw new Error('Authentication required');
            const appointment = await Appointment.findById(id);
            if (!appointment) throw new Error('Appointment not found');
            // Users can only update their own appointments unless they're admin
            if (user.role !== 'admin' && appointment.userId.toString() !== user._id.toString()) {
                throw new Error('Access denied');
            }
            const updateData = {};
            if (input.title !== undefined) updateData.title = input.title;
            if (input.description !== undefined) updateData.description = input.description;
            if (input.startTime !== undefined) updateData.startTime = new Date(input.startTime);
            if (input.endTime !== undefined) updateData.endTime = new Date(input.endTime);
            if (input.status !== undefined) updateData.status = input.status;
            updateData.updatedAt = new Date();
            const updated = await Appointment.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
            return toAppointmentDTO(updated);
        },
        deleteAppointment: async (_, { id }, { user }) => {
            if (!user) throw new Error('Authentication required');
            const appointment = await Appointment.findById(id);
            if (!appointment) throw new Error('Appointment not found');
            // Users can only delete their own appointments unless they're admin
            if (user.role !== 'admin' && appointment.userId.toString() !== user._id.toString()) {
                throw new Error('Access denied');
            }
            await Appointment.findByIdAndDelete(id);
            return true;
        }
    }
};
