const express = require('express');
const axios = require('axios');
const cors = require('cors');
const connectDB = require('./config/db');
const cookieParser = require('cookie-parser');
const path = require('path');
const userRoutes = require('./routes/userRoutes');
const providerRoutes = require('./routes/providerRoutes');
const serviceRoutes = require('./routes/serviceRoutes');

const app = express();

const PORT = 3000;

connectDB();

app.set('view engine', 'ejs'); // Set EJS as the template engine
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(cookieParser());

// Routes
app.use('/profile', userRoutes);
app.use('/providers', providerRoutes);
app.use('/services', serviceRoutes);

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/api/get-city', async (req, res) => {
    const { latitude, longitude } = req.body;

    try {
        const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const city = response.data.address.city || response.data.address.town || response.data.address.village || "Неизвестный город";
        res.json({ city });
    } catch (error) {
        res.status(500).json({ error: "Ошибка определения города" });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
