const express = require('express');
const Service = require('../models/service');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Fetch services in the selected city
router.get('/api', async (req, res) => {
    try {
        const { city } = req.query;
        const services = await Service.find({ loc: { $regex: city, $options: 'i' } });
        res.json(services);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch services' });
    }
});

// Render services page
router.get('/', (req, res) => {
    res.render('services');
});


module.exports = router;
