const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    login: String,
    hashed_password: String,
    role: String,
});

module.exports = mongoose.model('User', userSchema);