const express = require("express");
const cors = require("cors");
// const jwt = require("jsonwebtoken");
// const cookieParser=require('cookie-parser')
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

// ==========middleware==========
app.use(
  cors({
    origin: ["http://localhost:5173","https://one-mart-frontend.vercel.app/"],
    credentials: true,
  })
);
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8pmiatd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const users = client.db("OneMart").collection("users");
    const services = client.db("OneMart").collection("services");
    const reviews= client.db("OneMart").collection("reviews")
    // =================== crud operations ======================

  
    // post user info
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await users.insertOne(user);
      res.send(result);
    });
    // post service info
    app.post("/services", async (req, res) => {
      const service = req.body;
      const result = await services.insertOne(service);
      res.send(result);
    });
    // post user review
    app.post("/reviews", async (req, res) => {
      const user = req.body;
      const result = await reviews.insertOne(user);
      res.send(result);
    });

    // get user info
    // app.get("/services", async (req, res) => {
   
    //   const result = await services.find().toArray();
    //   res.send(result);
    // });
    app.get("/services/:category", async (req, res) => {
      // Get the category parameter from the request and replace %20 with spaces
      const category = req.params.category.replace(/%20/g, ' ');
  
      // Construct a MongoDB query to match categories with or without spaces
      const query = { service: { $regex: new RegExp(category.replace(/\s+/g, '\\s*'), 'i') } };
  
      try {
          // Find documents matching the category query
          const result = await services.find(query).toArray();
          res.send(result);
      } catch (error) {
          console.error("Error fetching reviews:", error);
          res.status(500).send("Error fetching reviews");
      }
  });
  
    // get user info
    app.get("/admin/users", async (req, res) => {
   
      const result = await users.find().toArray();
      res.send(result);
    });
    // get user info
  //   app.get("/reviews/:category", async (req, res) => {
  //  const query={category: req.params.category}
  //     const result = await reviews.find(query).toArray();
  //     res.send(result);
  //   });
  app.get("/reviews/:category", async (req, res) => {
    // Get the category parameter from the request
    const category = req.params.category;
    
    // Construct a MongoDB query to match categories with or without spaces
    const query = { category: { $regex: new RegExp(category.replace(/\s+/g, '\\s*'), 'i') } };

    try {
        // Find documents matching the category query
        const result = await reviews.find(query).toArray();
        res.send(result);
    } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).send("Error fetching reviews");
    }
});


    // get user info
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await users.findOne(query);
      res.send(result);
    });

  
    // checking whether a user admin or not 
    app.get("/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = {
        email: email,
        role: "admin",
      };
      const result = await users.findOne(query);
      if (result) {
        res.send({ admin: true });
      } else {
        res.send({ admin: false });
      }
   
    });
// delete a user
    app.delete("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await users.deleteOne(query);
      res.send(result);
    });

    // make a user admin
    app.patch("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const updatedDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await users.updateOne(filter, updatedDoc);
      res.send(result);
    });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    //
  }
}
run().catch(console.dir);
app.get("/", (req, res) => {
  res.send("Backend is running");
});
app.listen(port, () => {
  console.log(`backend is running on port ${port}`);
});