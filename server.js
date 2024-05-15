
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb+srv://sowrabha:Sow%402003@cluster0.uehta0o.mongodb.net/yarn_db?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// User schema
const userSchema = new mongoose.Schema({
    fullname: String,
    email: { type: String, unique: true },
    password: String
});

const User = mongoose.model('User', userSchema);
const feedbackSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    message: String
}, { collection: 'feedback_collection' });
const Feedback = mongoose.model('Feedback', feedbackSchema);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'C:\\Users\\sowra\\OneDrive\\Desktop\\consultancy\\frontend\\Yarns\\public'); // Uploads will be stored in the 'uploads' directory
    },
    filename: (req, file, cb) => {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage });

// Product schema
const productSchema = new mongoose.Schema({
    productName: String,
    description: String,
    price: Number,
    image:String
},{ collection: 'products' });

const Product = mongoose.model('Product', productSchema);

const orderSchema = new mongoose.Schema({
    name: String,
    email: String,
    address: String,
    selectedProduct: String,
    price: Number,
    quantity: Number,
  },{ collection: 'orders' });
  
  // Define a model based on the schema
  const Order = mongoose.model('Order', orderSchema);
  
 
  // Define a route to handle order placement
  app.post('/api/place-order', async (req, res) => {
    try {
      
      const newOrder = new Order(req.body);
      // Save the order to the database
      await newOrder.save();
      // Send a success response
      res.status(200).send('Order placed successfully!');
    } catch (error) {
      // If an error occurs, send an error response
      console.error(error);
      res.status(500).send('Failed to place order');
    }
  });

// Define a route to retrieve orders
app.get('/api/orders', async (req, res) => {
    try {
      // Fetch all orders from the database
      const orders = await Order.find();
      res.json(orders); // Send the orders as JSON response
    } catch (error) {
      console.error(error);
      res.status(500).send('Failed to fetch orders');
    }
  });
// Define a route to delete an order by name
app.delete('/api/orders/:name', async (req, res) => {
    try {
        const name = req.params.name;
        // Find the order by name and delete it
        await Order.deleteOne({ name: name });
        res.status(200).send('Order deleted successfully');
    } catch (error) {
        console.error('Error deleting order:', error.message);
        res.status(500).send('Failed to delete order');
    }
});
  

app.get('/api/users', async (req, res) => {
    try {
        // Fetch all users from the database
        const users = await User.find();

        // Respond with the list of users
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
});
app.post('/api/signup', async (req, res) => {
    const { fullname, email, password } = req.body;

    try {
        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        const newUser = new User({ fullname, email, password });

        // Save user data to the database
        await newUser.save();

        // Respond with success message
        res.status(201).json({ message: 'User signed up successfully', user: newUser });
    } catch (error) {
        console.error('Error signing up:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email, password });

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check if the user is an admin based on their email
        const isAdmin = email === 'admin@example.com'; // Adjust this condition based on your admin logic

        // Return the isAdmin flag along with the user data
        res.status(200).json({ message: 'Login successful', user, isAdmin });
    } catch (error) {
        console.error('Error logging in:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/feedback', async (req, res) => {
    const { name, email, phone, message } = req.body;

    try {
        // Save feedback data to the database
        const newFeedback = new Feedback({ name, email, phone, message });
        await newFeedback.save();

        // Respond with success message
        res.status(201).json({ message: 'Feedback submitted successfully', feedback: newFeedback });
    } catch (error) {
        console.error('Error submitting feedback:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/api/feedback', async (req, res) => {
    try {
        // Fetch all feedback from the database
        const feedback = await Feedback.find();

        // Respond with the list of feedback
        res.status(200).json(feedback);
    } catch (error) {
        console.error('Error fetching feedback:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
});


app.post('/api/products', upload.single('image'), async (req, res) => {
    try {
        const { productName, description, price } = req.body;
        const image = req.file.filename; // Get the filename of the uploaded image

        // Create a new product with the received data
        const newProduct = new Product({ productName, description, price, image });

        // Save the new product to the database
        await newProduct.save();

        res.status(201).json({ message: 'Product added successfully', product: newProduct });
    } catch (error) {
        console.error('Error adding product:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// Product retrieval route
app.get('/api/products', async (req, res) => {
    try {
        // Fetch all products from the database
        const products = await Product.find();

        // Respond with the list of products
        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching products:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
});
app.delete('/api/products/:productName', async (req, res) => {
    const { productName } = req.params;

    try {
        // Find the product by name and delete it
        const deletedProduct = await Product.findOneAndDelete({ productName });
        if (!deletedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json({ message: 'Product deleted successfully', deletedProduct });
    } catch (error) {
        console.error('Error deleting product:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
