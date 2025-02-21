const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    id: String,
    img: String,
    link: String,
    desc: String,
    pub_date: String,
    loc: String,
});

module.exports = mongoose.model('Service', serviceSchema);