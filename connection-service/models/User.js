const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  gender: { type: String, required: true, enum: ['Male', 'Female'] },
  age: { type: Number, required: true },
  dob: { type: Date, required: true },
  religion: { type: String, required: true },
  motherTongue: { type: String, required: true },
  location: { type: String, required: true },
  profession: { type: String, required: true },
  photoUrl: { type: String, default: '' },
  bio: { type: String, default: '' },
  height: { type: String, default: "5'5\"" },
  education: { type: String, default: 'Graduate' }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
