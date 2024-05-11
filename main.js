import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import session from 'express-session';
import User from './models/user.js';
import {v4 as uuid} from 'uuid';

const app = express();
app.use(express.json());
app.use(session({
    secret: uuid(),
    resave: true,
    saveUninitialized: true
}));

const uri = 'mongodb://localhost:27017/local'
mongoose.connect(uri,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        dbName: "userProfileDB"
    }
)
    .then(() => {
        const db = mongoose.connection;
        console.log("MongoDB connected to database:", db.name);
    })
    .catch(err => console.log(err));

app.get('/', (req, res) => {
    res.send('Welcome to the user profile API');
})

app.post('/register', async (req, res) => {
    const {password} = req.body.loginDetails;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
        ...req.body,
        loginDetails: {...req.body.loginDetails, password: hashedPassword}
    });

    try {
        await user.save();
        res.status(201).send('User registered');
    } catch (error) {
        res.status(400).send(error);
    }
});

// User Login
app.post('/login', async (req, res) => {
    const {email, password} = req.body;
    const user = await User.findOne({'loginDetails.email': email});

    if (user && bcrypt.compareSync(password, user.loginDetails.password)) {
        req.session.user = user;
        res.send('Logged in successfully');
    } else {
        res.status(400).send('Invalid credentials');
    }
});

// User Logout
app.post('/logout', (req, res) => {
    req.session.destroy();
    res.send('Logged out successfully');
});

app.get('/:id', async (req, res) => {
    const {id} = req.params;
    console.log(id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send('Invalid ID format');
    }
    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).send('User not found');
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        res.status(500).send('Error fetching user');
    }
});

// Update a user's profile
app.put('/:id', async (req, res) => {
    try {
        const {email} = req.session.user?.loginDetails || {};
        if (!email || email !== req.body.loginDetails?.email) {
            return res.status(403).send('Unauthorized access');
        }

        const user = await User.findByIdAndUpdate(req.params.id, req.body, {new: true});
        if (!user) {
            return res.status(404).send('User not found');
        }
        res.json(user);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Delete a user
app.delete('/:id', async (req, res) => {
    try {
        const {email} = req.session.user?.loginDetails || {};
        const userToDelete = await User.findById(req.params.id);
        if (!userToDelete) {
            return res.status(404).send('User not found');
        }
        if (!email || email !== userToDelete.loginDetails.email) {
            return res.status(403).send('Unauthorized access');
        }

        await User.findByIdAndDelete(req.params.id);
        res.send('User deleted successfully');
    } catch (error) {
        res.status(500).send(error);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
