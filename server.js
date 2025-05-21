const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");      // <--- Added cors
require("dotenv").config();

const app = express();

app.use(cors());                   // <--- Use cors middleware here
app.use(express.json());

const startServer = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB Connected");

    // Initialize sample data
    await initializeData();

    // Define Routes
    app.use("/api/auth", require("./routes/auth"));
    app.use("/api/recipes", require("./routes/recipes"));

    // Serve static assets in production
    if (process.env.NODE_ENV === "production") {
      app.use(express.static("client/build"));
      app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
      });
    }

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () =>
      console.log(`🚀 Server running on port ${PORT}`)
    );

  } catch (err) {
    console.error("❌ Server failed to start:", err);
  }
};

// Data initializer
const initializeData = async () => {
  const Recipe = require("./models/Recipe");

  const count = await Recipe.countDocuments();
  if (count === 0) {
    const sampleRecipes = [
      // ... your recipes here
    ];
    await Recipe.insertMany(sampleRecipes);
    console.log("✅ Sample recipe data initialized");
  }
};

// Start everything
startServer();
