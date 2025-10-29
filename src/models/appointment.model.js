const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { 
        type: String, 
        enum: ['pending', 'confirmed', 'cancelled', 'completed'], 
        default: 'pending' 
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
AppointmentSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Validate that endTime is after startTime
AppointmentSchema.pre('validate', function(next) {
    if (this.endTime <= this.startTime) {
        next(new Error('End time must be after start time'));
    } else {
        next();
    }
});

module.exports = mongoose.model('Appointment', AppointmentSchema);

