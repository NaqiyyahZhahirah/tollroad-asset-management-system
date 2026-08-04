const express = require('express');
const cors = require('cors');
require('dotenv').config();

const kategoriRoutes = require('./routes/kategori.routes');
const asetRoutes = require('./routes/aset.routes');
const fotoRoutes = require('./routes/foto.routes');
const authRoutes = require('./routes/auth.routes');
const logRoutes = require('./routes/log.routes');
const userRoutes = require('./routes/user.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/kategori', kategoriRoutes);
app.use('/api/aset', asetRoutes);
app.use('/api/foto', fotoRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/log', logRoutes);
app.use('/api/users', userRoutes);
app.get('/', (req, res) => {
    res.json({ message: 'JMTM-AMS API running' });
});

const PORT = process.env.PORT || 5000;
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;