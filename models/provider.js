const mongoose = require('mongoose');

const providerSchema = new mongoose.Schema({
    owner_link: String,
    owner_name: String,
    owner_about: String,
    owner_contact: String,
    services: [String],
});

module.exports = mongoose.model('Provider', providerSchema);