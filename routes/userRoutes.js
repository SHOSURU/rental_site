const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/user');
const Service = require('../models/service');
const Provider = require('../models/provider');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
    try {
        const user = await User.findOne({ login: req.user.login });

        if (!user) {
            return res.redirect('/login');
        }

        // Найти провайдера с таким же _id, как у пользователя
        const provider = await Provider.findOne({ _id: user._id });

        let providerServices = [];

        if (provider) {
            // Найти все услуги, ID которых есть в provider.services (сравнение строк)
            providerServices = await Service.find({ id: { $in: provider.services } });
        }

        res.render('profile', { user, provider, providerServices });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/login', (req, res) => {
    res.render('login');
});

router.get('/register', (req, res) => {
    res.render('register');
});

router.post('/register', async (req, res) => {
    try {
        const { login, password, role } = req.body;

        // Проверяем, существует ли уже такой пользователь
        const existingUser = await User.findOne({ login });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Хешируем пароль
        const hashedPassword = await bcrypt.hash(password, 10);

        // Создаем нового пользователя
        const newUser = new User({
            login,
            hashed_password: hashedPassword,
            role
        });

        await newUser.save();

        // Если регистрируем провайдера, создаем запись в Provider
        if (role === 'provider') {
            const newProvider = new Provider({
                _id: newUser._id,  // Связываем по _id
                owner_name: login,
                owner_link: '',
                owner_about: '',
                owner_contact: '',
                services: []  // Пустой массив сервисов
            });

            await newProvider.save();
        }

        res.json({ message: 'User registered successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/login', async (req, res) => {
    const { login, password } = req.body;
    const user = await User.findOne({ login });

    if (!user || !(await bcrypt.compare(password, user.hashed_password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({_id:user._id, login, role: user.role }, 'secret_key', { expiresIn: '1h' });

    res.cookie('token', token, {
        httpOnly: true,
        maxAge: 3600000,
    });

    res.json({ success: true });
});

router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/');
});

router.post('/delete', async (req, res) => {
    try {
        console.log("Cookies received:", req.cookies);

        const token = req.cookies.token;
        if (!token) {
            return res.status(401).send('Unauthorized');
        }

        const decoded = jwt.verify(token, 'secret_key'); // Замени на свой секретный ключ
        const userId = decoded._id; // Используем _id из токена

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).send('Invalid User ID');
        }

        const objectId = new mongoose.Types.ObjectId(userId);

        const user = await User.findById(objectId);
        if (!user) return res.status(404).send('User not found');

        console.log("Deleting user with ID:", objectId);

        const deletedUser = await User.findByIdAndDelete(objectId);
        console.log("Deleted user:", deletedUser);

        const deletedProvider = await Provider.findByIdAndDelete(objectId);
        console.log("Deleted provider:", deletedProvider);

        res.clearCookie('token');
        res.redirect('/');
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).send('Error deleting user');
    }
});
router.post('/service/add', authMiddleware, async (req, res) => {
    try {
        
        // Extract the necessary data from the request body
        const { id, img, link, desc, pub_date, loc } = req.body;
        const userId = req.user._id;  // Get the _id of the user from the token
        console.log(req.body);  // Add this to debug

        // Find the provider associated with the user
        const provider = await Provider.findOne({ _id: userId });
        if (!provider) {
            return res.status(404).send('Provider not found');
        }

        // Create the new service
        const newService = new Service({
            id,
            img,
            link,
            desc,
            pub_date,
            loc,
        });

        // Save the new service to the database
        await newService.save();

        // Add the new service's ID to the provider's services array
        provider.services.push(newService.id);

        // Save the updated provider document
        await provider.save();

        // Redirect the user back to their profile
        res.redirect('/profile/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error adding service');
    }
});
router.post('/service/delete/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;  // Get the service ID from the URL parameter
        const userId = req.user._id;  // Get the _id of the current user from the token

        // Find the service by its ID
        const service = await Service.findOne({ id: id });
        if (!service) {
            return res.status(404).send('Service not found');
        }

        // Find the provider associated with the user
        const provider = await Provider.findOne({ _id: userId });
        if (!provider) {
            return res.status(404).send('Provider not found');
        }

        // Check if the service belongs to the current provider
        if (!provider.services.includes(service.id)) {  // Make sure we use _id, not id
            return res.status(403).send('You are not authorized to delete this service');
        }

        // Delete the service
        await Service.findOneAndDelete({ id: id });

        // Remove the service's ID from the provider's services array
        provider.services = provider.services.filter(serviceId => serviceId.toString() !== id);
        await provider.save();

        res.redirect('/profile');  // Redirect back to the profile page
    } catch (error) {
        console.error(error);
        res.status(500).send('Error deleting service');
    }
});
module.exports = router;
