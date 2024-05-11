import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    personalInfo: {
        firstName: String,
        lastName: String,
        dateOfBirth: Date,
        placeOfBirth: String,
        nationality: String,
        educationalBackground: [String]  // Array of education details
    },
    employmentHistory: [{
        jobTitle: String,
        project: String,
        role: String,
        startDate: Date,
        endDate: Date,
        ongoing: { type: Boolean, default: false },
        companyName: String
    }],
    additionalInfo: {
        interests: [String],
        goals: [String]
    },
    loginDetails: {
        email: { type: String, unique: true, required: true },
        password: { type: String, required: true }
    }
});

const User = mongoose.model('User', userSchema);
export default User;
