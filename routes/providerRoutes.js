const express = require('express');
const Provider = require('../models/provider');
const Service = require('../models/service');
const router = express.Router();

router.get('/api', async (req, res) => {
    try {
        const { city } = req.query;

        // Find all services available in the selected city
        const servicesInCity = await Service.find({ loc: { $regex: city, $options: 'i' } });
        const serviceIds = servicesInCity.map(service => service.id.toString());

        // Fetch all providers
        const allProviders = await Provider.find();

        let matchingProviders = [];

        // Loop through each provider
        for (let provider of allProviders) {
            let i = 0;
            let hasMatchingService = false;

            // Check if at least one of provider's services exists in city
            while (i < provider.services.length) {
                if (serviceIds.includes(provider.services[i].toString())) {
                    hasMatchingService = true;
                    break; // Stop searching if a match is found
                }
                i++;
            }

            if (hasMatchingService) {
                matchingProviders.push(provider);
            }
        }

        res.json(matchingProviders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch providers' });
    }
});

router.get('/', (req, res) => {
    res.render('providers');
});

module.exports = router;
