const express = require("express");
const cors = require("cors");
const SSLCommerzPayment = require('sslcommerz-lts')
// const jwt = require("jsonwebtoken");
// const cookieParser=require('cookie-parser')
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;


// ssl commerz cresentials
const store_id = process.env.storeID;
const store_passwd = process.env.storePasswd;
const is_live = false; //true for live, false for sandbox





// ==========middleware==========
app.use(
  cors({
    origin: ["http://localhost:5173", "https://one-mart-frontend.vercel.app"],
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
    const reviews = client.db("OneMart").collection("reviews");
    const appointments = client.db("OneMart").collection("appointments");
    // =================== crud operations ======================

    // post user info
    app.post("/users", async (req, res) => {
      const user = req.body;
      const isExist = await users.findOne({ email: user.email });
      if (isExist) {
        return res.send({ message: "already exists" });
      }
      const result = await users.insertOne(user);
      res.send(result);
    });
    // post service info
    app.post("/services", async (req, res) => {
      const service = req.body;
      const result = await services.insertOne(service);
      res.send(result);
    });
    // update service
    app.put("/admin/services/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          ...data,
        },
      };
      const result = await services.updateOne(filter, updatedDoc);
      res.send(result);
    });
    // delete service info
    app.delete("/admin/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await services.deleteOne(query);
      res.send(result);
    });

    // post user review
    app.post("/reviews", async (req, res) => {
      const user = req.body;
      const result = await reviews.insertOne(user);
      res.send(result);
    });
    // post appointments
    app.post("/appointments", async (req, res) => {
      const user = req.body;
      const result = await appointments.insertOne(user);
      res.send(result);
    });
    // get all appointments
    app.get("/appointments", async (req, res) => {
      const result = await appointments.find().toArray();
      res.send(result);
    });
    // get all appointments
    app.get("/appointments/:email", async (req, res) => {
      const email = req.params.email;
      const result = await appointments.find({ email }).toArray();
      res.send(result);
    });
    // delete appointments
    app.delete("/appointments/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await appointments.deleteOne(query);
      res.send(result);
    });

    // get services
    app.get("/services", async (req, res) => {
      const query = req.query.searchTerm; // Search query parameter
      const filter = query
        ? { service: { $regex: `.*${query}.*`, $options: "i" } }
        : {}; // Case-insensitive regex search

      const result = await services.find(filter).toArray();
      res.send(result);
    });

    // get specific service
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await services.findOne(query);
      res.send(result);
    });

    // get user info
    app.get("/admin/users", async (req, res) => {
      const result = await users.find().toArray();
      res.send(result);
    });
    // get user info
    app.get("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { serviceId: id };

      const result = await reviews.find(query).toArray();
      res.send(result);
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

    // make a user admin====
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
    // appointment reschedule
    app.put("/admin/appointments/:id", async (req, res) => {
      const { newDate } = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          reschedule_date: newDate,
        },
      };
      const result = await appointments.updateOne(filter, updatedDoc, {
        upsert: true,
      });
      res.send(result);
    });

    app.post("/payment", async (req, res) => {
      const tran_id = new ObjectId().toString();
      const id = new ObjectId().toString();

      const paymentInfo = req.body;

      const data = {
        total_amount: paymentInfo?.amount,
        currency: "BDT",
        tran_id: tran_id,
        success_url: `http://localhost:5000/api/v1/user/payment/success/${tran_id}?id=${paymentInfo?.id}`,
        fail_url: `http://localhost:5000/api/v1/user/payment/fail/${tran_id}?id=${paymentInfo?.id}`,
        cancel_url: "http://localhost:3030/cancel",
        ipn_url: "http://localhost:3030/ipn",
        shipping_method: "Courier",
        product_name: "combine food",
        product_category: "Mix category",
        product_profile: "general",
        cus_name: paymentInfo?.name,
        cus_email: paymentInfo?.email,
        cus_add1: "Dhaka",
        cus_add2: "Dhaka",
        cus_city: "Dhaka",
        cus_state: "Dhaka",
        cus_postcode: "1000",
        cus_country: "Bangladesh",
        cus_phone: "01711111111",
        cus_fax: "01711111111",
        ship_name: "Customer Name",
        ship_add1: "Dhaka",
        ship_add2: "Dhaka",
        ship_city: "Dhaka",
        ship_state: "Dhaka",
        ship_postcode: 1000,
        ship_country: "Bangladesh",
      };
      
      const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
      sslcz.init(data).then((apiResponse) => {
        // Redirect the user to payment gateway
        let GatewayPageURL = apiResponse.GatewayPageURL;
        res.send({ url: GatewayPageURL });
        console.log("Redirecting to: ", GatewayPageURL);
      });

      app.post("/api/v1/user/payment/success/:tranId", async (req, res) => {
        const result = await appointments.updateOne(
          { _id: new ObjectId(req.query.id)  },
          {
            $set: {
              payment: "complete",
              transactionId: req.params.tranId,
            },
        },{
          upsert: true,
        }
        );
        if (result.modifiedCount > 0) {
          res.redirect(
            `http://localhost:5173/api/v1/payment-complete/${req.params.tranId}`
          );
        }

      });
      app.post("/api/v1/user/payment/fail/:tranId", async (req, res) => {
        const result = await appointments.updateOne(
          { _id: new ObjectId(req.query.id)  },
          {
            $set: {
              payment: "failed",
              // transactionId: req.params.tranId
            },
          }
        );
        if (result.modifiedCount > 0) {
          res.redirect(
            `http://localhost:5173/api/v1/payment-failed/${req.params.tranId}`
          );
        }
      });
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
