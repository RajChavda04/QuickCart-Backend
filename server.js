const mysql= require("mysql2");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { v4: uuidv4 } = require('uuid');
const bodyParser = require("body-parser");
const path = require('path');
const fs = require('fs');
const Nodemailer= require('nodemailer');
const dotenv=require("dotenv")
dotenv.config({
    path: './.env'
})

const PORT = process.env.PORT || 1337

const app = express();
app.use(express.json());
app.use(cors({
    origin: [
        process.env.FRONTEND_USER_URL,
        process.env.FRONTEND_ADMIN_URL,
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002"
    ],

}));
app.use(bodyParser.json());
app.use(express.static("public"));

// const con=mysql.createConnection({
//     host: "localhost",
//     user: "root",
//     password: "",
//     database: "quickcart"

// });
console.log(dotenv)
const con = mysql.createConnection({
    host: process.env.Host,
    port: process.env.SqlPort,
    user: process.env.User_Name,
    password: process.env.Password,
    database: process.env.DbName,
    ssl: {
        rejectUnauthorized: false
    }
});

con.connect((err) => {
    if (err) {
        console.log("Database connection failed:", err);
    } else {
        console.log("Connected to Aiven MySQL Database");
    }
});


// login api
app.get("/api/health", (res)=>{

  res.send ("Server is running")
})

app.all('*', (req, res) => {
  res.status(404).json({
    status: "fail",
    message: `Can't find ${req.originalUrl} on the server`
  });
});


app.post("/api/loginprocess",(req,resp)=>{
    var admin_email=req.body.admin_email;
    var admin_password=req.body.admin_password;
    const query="SELECT * FROM admin WHERE admin_email=? and admin_password=?";
    con.query(query,[admin_email,admin_password],(err,result)=>{
        if(result.length > 0)
        {
            resp.send(result);
        }
        else
        {
            resp.send({message: "Invalid Email or Password"});
        }
    });
});

// change password api 
app.post("/api/passchange",(req,resp)=>{
    const { admin_email, current_password , new_password} = req.body;
    
   if (!admin_email || !current_password || !new_password) {
    return resp.status(400).send({ message: "All feilds are required"});

   }

   const query = "SELECT * FROM admin WHERE admin_email=?";
   con.query(query, [admin_email], (err, result)=>{
    if(err){
        console.error("Database query error: ", err);
        return resp.status(500).send({ message:"Internal checking the error"})
    }
    if(result.length === 0){
        return resp.status(400).send({message: "User not found"});
    }
    const user= result[0];
    if(user.admin_password !== current_password){
        return resp.status(400).send({message: "current password is incorrect"});

    }
    const updateQuery = " UPDATE admin SET admin_password =? WHERE admin_email =?"
    con.query(updateQuery, [new_password, admin_email], (updateErr)=>{
        if(updateErr){
            return resp.status(500).send({ message: "Error upadating the password"})
        }
        resp.send({ message:"Password changed sucessfully"});
    });
   })
});

// user change password api 
app.post("/api/passchangeuser",(req,resp)=>{
    const { customer_email, current_password , new_password} = req.body;
    
   if (!customer_email || !current_password || !new_password) {
    return resp.status(400).send({ message: "All feilds are required"});

   }

   const query = "SELECT * FROM customer WHERE customer_email=?";
   con.query(query, [customer_email], (err, result)=>{
    if(err){
        console.error("Database query error: ", err);
        return resp.status(500).send({ message:"Internal checking the error"})
    }
    if(result.length === 0){
        return resp.status(400).send({message: "User not found"});
    }
    const user= result[0];
    if(user.customer_password !== current_password){
        return resp.status(400).send({message: "current password is incorrect"});

    }
    const updateQuery = " UPDATE customer SET customer_password =? WHERE customer_email =?"
    con.query(updateQuery, [new_password, customer_email], (updateErr)=>{
        if(updateErr){
            return resp.status(500).send({ message: "Error upadating the password"})
        }
        resp.send({ message:"Password changed sucessfully"});
    });
   })
});



// add product with image from 
const uploadDir = path.join(__dirname, './public/');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer Storage
 storage = multer.diskStorage({
    destination: uploadDir,
    filename: function(req, file, callback) {
        const filename = Date.now() + '-' + file.originalname;
        callback(null, filename);
    }
});

var upload1 = multer({ storage: storage });

const multi = upload1.fields([
    { name: 'product_image', maxCount: 1 },
    { name: 'category_image', maxCount: 1 }
]);

// var multi = upload1.fields([{ name: 'product_image' }]);
// var multi = upload1.fields ([{name: 'category_image'}])

// Insert Product API
app.post("/api/insertproduct", multi, (req, res) => {
    var product_name = req.body.product_name;
    var product_description = req.body.product_description;
    var product_price = req.body.product_price;
    var product_quantity = req.body.product_quantity;
    var category_id = req.body.category_id;

    // Validate file upload
    if (!req.files || !req.files.product_image) {
        return res.status(400).send({ message: "Please upload a file" });
    }

    var product_image = req.files.product_image[0].filename;

    const query = "INSERT INTO product_management (product_name, product_description, product_price,product_quantity, category_id, product_image) VALUES (?, ?, ?, ?,?,?)";
    
    con.query(query, [product_name, product_description, product_price ,product_quantity, category_id, product_image], (err, result) => {
        if (err) {
            console.error("Error inserting data:", err);
            return res.status(500).send({ message: "Database error", error: err });
        }
        res.send({ message: "Product inserted successfully", result });
    });
});

//add  category api
app.post("/api/insertcategory", multi, (req, res) => {
    var category_name = req.body.category_name;
    var category_description = req.body.category_description;
    
    

    // Validate file upload
    if (!req.files || !req.files.category_image) {
        return res.status(400).send({ message: "Please upload a file" });
    }

    var category_image = req.files.category_image[0].filename;

    const query = "INSERT INTO category (category_name, category_description, category_image) VALUES (?, ?, ?)";
    
    con.query(query, [category_name, category_description, category_image], (err, result) => {
        if (err) {
            console.error("Error inserting data:", err);
            return res.status(500).send({ message: "Database error", error: err });
        }
        res.send({ message: "Category inserted successfully", result });
    });
});






// get category in add product page

app.get("/api/getcategory",(req,resp)=>{
    const ins = "SELECT * from category";
    con.query(ins,(err,result)=>{
        resp.send(result);
    });
});


//  edit category page api2

app.post('/api/editcategorydata1',(req,res) => {
    const category_id = req.body.category_id;
  
    const query ="SELECT * FROM category WHERE category_id = ?";

    con.query(query,[category_id],(err,result) => {
        if(err){
            return res.status(500).send({error:'Error to fetch data'});
        }

        if(result.length === 0){
            return res.status(404).send({message:'product not found'});
        }

        res.send(result[0]);
    
        });
});

//   product page api2
app.post('/api/categoryupdate1', multi, (req, res) => {
    const { category_id,category_name,category_description} = req.body;
    let category_image = null;
    if (req.files && req.files.category_image) {
        category_image = req.files.category_image[0].filename;
    }
    //console.log(Image);
    let query, params;
    if (category_image)
    {    
        query = "UPDATE category SET category_name = ?,category_description = ?,category_image = ? WHERE category_id = ?";
        params = [category_name,category_description,category_image,category_id];
    }
    else
    {    
        query = "UPDATE category SET category_name = ?, category_description = ? WHERE category_id = ?";
        params = [category_name,category_description,category_id];
    }
    con.query(query, params, (err, result) => {
        if (err) {
            console.error("Error updating service:", err);
            res.status(500).send({ message: "Error updating Category data" });
        } else {
            res.send({ message: "Category data updated successfully", result });
        }
    });
});


// list category api

app.get('/api/categorylist',(req,resp)=>{

    const query="SELECT * FROM category";
    con.query(query,(err,result)=>{
        resp.send(result);
    });
});

// delete category api
app.delete('/api/Category_Delete/:category_id',(req,resp)=>{
    const {category_id}=req.params;
    const query="DELETE from category where category_id=?";
    con.query(query,[category_id],(err,result)=>{
        if(result.affectedRows === 0){
            return resp.status(404).json({message:'Category not found'});
        }
        resp.status(200).json({message:'Category deleted successfully'})
    });
});

// list product api

app.get("/api/productlist",(req,resp)=>{

    const query="SELECT a.*,b.* FROM product_management as a,category as b where a.category_id = b.category_id";
    con.query(query,(err,result)=>{
        resp.send(result);
    });
});

// product edit page api

app.post('/api/editproductdata',(req,res) => {
    const product_id = req.body.product_id;
  
    const query ="SELECT * FROM product_management WHERE product_id = ?";

    con.query(query,[product_id],(err,result) => {
        if(err){
            return res.status(500).send({error:'Error to fetch data'});
        }

        if(result.length === 0){
            return res.status(404).send({message:'product not found'});
        }

        res.send(result[0]);
    
        });
});

//  update product page api
app.post('/api/productupdate', multi, (req, res) => {
    const { product_id,product_name,product_description, product_price, product_quantity,category_id } = req.body;
    let product_image = null;
    if (req.files && req.files.product_image) {
        product_image = req.files.product_image[0].filename;
    }
    //console.log(Image);
    let query, params;
    if (product_image)
    {    
        query = "UPDATE product_management SET product_name = ?,product_description = ?,product_price = ?, product_quantity=?, category_id=?,product_image=? WHERE product_id = ?";
        params = [product_name,product_description,product_price,product_quantity,category_id,product_image,product_id];
    }
    else
    {    
        query = "UPDATE product_management SET product_name = ?, product_description = ?,product_price = ? ,product_quantity = ?, category_id = ? WHERE product_id = ?";
        params = [product_name,product_description,product_price,product_quantity,category_id,product_id];
    }
    con.query(query, params, (err, result) => {
        if (err) {
            console.error("Error updating service:", err);
            res.status(500).send({ message: "Error updating Product data" });
        } else {
            res.send({ message: "Product data updated successfully", result });
        }
    });
});


// delete product api
app.delete('/api/Product_Delete/:product_id',(req,resp)=>{
    const {product_id}=req.params;
    const query="DELETE from product_management where product_id=?";
    con.query(query,[product_id],(err,result)=>{
        if(result.affectedRows === 0){
            return resp.status(404).json({message:'Product not found'});
        }
        resp.status(200).json({message:'Product deleted successfully'})
    });
});

app.post("/api/userregister", (req, resp) => {
    var customer_name = req.body.customer_name;
    var customer_email = req.body.customer_email;
    var customer_password = req.body.customer_password;
    var customer_phone = req.body.customer_phone;
    var customer_address = req.body.customer_address;

    const checkquery = "SELECT * FROM customer WHERE customer_email= ?";
    con.query(checkquery, [customer_email], (err, results) => {
        if (err) {
            console.error("User register email check error:", err);
            return resp.status(500).send({ message: "Error checking email" });
        }
        if (results.length > 0) {
            return resp.status(400).send({ message: "User email already exists" });
        }

        const query = "INSERT INTO customer(customer_name, customer_email, customer_password, customer_phone, customer_address, customer_status) VALUES (?, ?, ?, ?, ?, ?)";
        con.query(query, [customer_name, customer_email, customer_password, customer_phone, customer_address, 0], (err, result) => {
            if (err) {
                console.error("User register insert error:", err);
                return resp.status(500).send({ message: "Error in registration" });
            }
            resp.send({ message: "Registration successful", data: result });
        });
    });
});


// User Login api

// app.post("/api/userloginprocess",(req,resp)=>{
//     var customer_email=req.body.customer_email;
//     var customer_password=req.body.customer_password;
//     const query="SELECT * FROM customer WHERE customer_email=? and customer_password=?";
//     con.query(query,[customer_email,customer_password],(err,result)=>{
//         if(result.length > 0)
//         {
//             resp.send(result);
//         }
//         else
//         {
//             resp.send({message: "Invalid Email or Password"});
//         }
//     });
// });
app.post("/api/userloginprocess", (req, resp) => {
    var customer_email = req.body.customer_email;
    var customer_password = req.body.customer_password;

    const query = "SELECT * FROM customer WHERE customer_email=? and customer_password=?";

    con.query(query, [customer_email, customer_password], (err, result) => {
        if (err) {
            resp.send({ message: "Server error", error: err });
        }
        else if (result.length > 0) {
            if (result[0].customer_status == 1) {
                resp.send({ message: "Your account has been blocked by the admin." });
            } else {
                resp.send(result);
            }
        }
        else {
            resp.send({ message: "Invalid Email or Password" });
        }
    });
});




// list customer api in admin panel

app.get('/api/customerlist',(req,resp)=>{

    const query="SELECT * FROM customer";
    con.query(query,(err,result)=>{
        resp.send(result);
    });
});

// user side shopegrid page api
app.post('/api/productlistdata',(req,res) => {
    const category_id = req.body.category_id;
  
    const query ="SELECT * FROM product_management WHERE category_id = ?";
    // const query="SELECT a.*,b.category_id,b.category_name FROM product_management as a,category as b WHERE a.category_id = ?";
    

    con.query(query,[category_id],(err,result) => {
        if(err){
            return res.status(500).send({error:'Error to fetch data'});
        }

        if(result.length === 0){
            return res.status(404).send({message:'category not found'});
        }

        res.send(result);
    
        });
});



// user side single product page api
app.post('/api/singleproduct',(req,res) => {
    const product_id = req.body.product_id;
  
    const query ="SELECT * FROM product_management WHERE product_id = ?";

    con.query(query,[product_id],(err,result) => {
        if(err){
            return res.status(500).send({error:'Error to fetch data'});
        }

        if(result.length === 0){
            return res.status(404).send({message:'Product not found'});
        }

        res.send(result);
    
        });
});
// user side user profile page api
app.post('/api/userprofile',(req,res) => {
    const customer_id = req.body.customer_id;
  
    const query ="SELECT * FROM customer WHERE customer_id = ?";

    con.query(query,[customer_id],(err,result) => {
        if(err){
            return res.status(500).send({error:'Error to fetch data'});
        }

        if(result.length === 0){
            return res.status(404).send({message:'Product not found'});
        }

        res.send(result);
    
        });
});



// user side cart page api
app.post('/api/cartadd', (req, res) => {
    const product_id = req.body.product_id;

    const customer_id = req.body.customer_id;
    const quantity = 1;
    const checkquery="SELECT * FROM cart where product_id=? and customer_id =?";
    con.query(checkquery, [product_id, customer_id], (err, results) => {
        if (err) {
            return res.status(500).send({ message: "Error add product" });
        }
        if (results.length > 0) {
          return  res.send({ message: "Product already added"});

        } 

    const cart_id = Date.now() % 1000000; // Generate a unique cart_id within INT range
    const query = "INSERT INTO cart(cart_id, customer_id, product_id, product_quantity) VALUES (?,?,?,?)";

    con.query(query, [cart_id, customer_id, product_id, quantity], (err, result) => {
        if (err) {
            return res.status(500).send({ message: "Error in registration" });
        }
      res.send({ message: "Product added to the cart", data: result });
    
    });


});
});
        
//   whishlsit add product api  
app.post('/api/cartaddwish', (req, res) => {
    const { product_id, customer_id, fromWishlist } = req.body;
    const quantity = 1;

    const checkquery = "SELECT * FROM cart WHERE product_id = ? AND customer_id = ?";
    con.query(checkquery, [product_id, customer_id], (err, results) => {
        if (err) {
            return res.status(500).send({ message: "Error while checking the cart" });
        }

        if (results.length > 0) {
            return res.send({ message: "Product already added to the cart" });
        }

        const cart_id = Date.now() % 1000000; // Generate a unique cart_id within INT range
        const query = "INSERT INTO cart(cart_id, customer_id, product_id, product_quantity) VALUES (?,?,?,?)";
        con.query(query, [cart_id, customer_id, product_id, quantity], (err, result) => {
            if (err) {
                return res.status(500).send({ message: "Error while adding to cart" });
            }

            // If the product is coming from the wishlist, remove it from there
            if (fromWishlist) {
                const deleteQuery = "DELETE FROM wish WHERE product_id = ? AND customer_id = ?";
                con.query(deleteQuery, [product_id, customer_id], (delErr, delResult) => {
                    if (delErr) {
                        return res.status(500).send({ message: "Product added to cart, but error while removing from wishlist" });
                    }
                    res.send({ message: "Product moved from wishlist to cart", data: result });
                });
            } else {
                res.send({ message: "Product added to the cart", data: result });
            }
        });
    });
});
    
// show Cart Items API
app.post('/api/showcart', (req, res) => {
    const customer_id = req.body.customer_id;

    const query = `
        SELECT c.product_id, c.product_quantity, p.product_name, p.product_image, p.product_price 
        FROM cart c 
        JOIN product_management p ON c.product_id = p.product_id 
        WHERE c.customer_id = ?`;

    con.query(query, [customer_id], (err, results) => {
        if (err) {
            return res.status(500).send({ message: "Error fetching cart data" });
        }
        res.send(results);
    });
});

// Update product quantity in cart
app.post('/api/updateQuantity', (req, res) => {
    const { product_id, customer_id, quantity } = req.body;

    const updateQuery = `
        UPDATE cart 
        SET product_quantity = ? 
        WHERE product_id = ? AND customer_id = ?`;

    con.query(updateQuery, [quantity, product_id, customer_id], (err, result) => {
        if (err) {
            return res.status(500).send({ message: "Error updating product quantity" });
        }
        res.send({ message: "Product quantity updated successfully" });
    });
});



// cartdata into checkout page api
app.post('/api/cartdata',(req,res) => {
    const cart_id = req.body.cart_id;
  
    const query ="SELECT * FROM cart WHERE prodcut_id = ?";

    con.query(query,[cart_id],(err,result) => {
        if(err){
            return res.status(500).send({error:'Error to fetch data'});
        }

        if(result.length === 0){
            return res.status(404).send({message:'Cart data not found'});
        }

        res.send(result);
    
        });
});

// show Cart Items API
app.post('/api/showcheckout', (req, res) => {
    const customer_id = req.body.customer_id;

    const query = `
        SELECT c.product_id, c.product_quantity, p.product_name, p.product_image, p.product_price 
        FROM cart c 
        JOIN product_management p ON c.product_id = p.product_id 
        WHERE c.customer_id = ?`;

    con.query(query, [customer_id], (err, results) => {
        if (err) {
            return res.status(500).send({ message: "Error fetching cart data" });
        }
        res.send(results);
    });
});

//  Get customer data in  checkout page api2

app.post('/api/usercheckout', (req, res) => {
    const customer_id = req.body.customer_id;

    const query = "SELECT * FROM customer WHERE customer_id = ?";

    con.query(query, [customer_id], (err, results) => {
        if (err) {
            return res.status(500).send({ message: "Error fetching cart data" });
        }
        res.send(results);
    });
});


//   product page api2
app.post('/api/customerdataupdate', multi, (req, res) => {
    const { customer_id,customer_name,customer_email,customer_phone, customer_address} = req.body;
   
    let query, params;
    if (customer_id)
    {    
        query = "UPDATE customer SET customer_name = ?,customer_email = ?,customer_phone = ?, customer_address= ? WHERE customer_id = ?";
        params = [customer_name,customer_email,customer_phone,customer_address,customer_id];
    }
    else
    {    
        query = "UPDATE customer SET customer_name = ?, customer_email = ?,customer_phone = ?, customer_address= ? WHERE customer_id = ?";
        params = [customer_name,customer_email,customer_phone,customer_address,customer_id];
    }
    con.query(query, params, (err, result) => {
        if (err) {
            console.error("Error updating service:", err);
            res.status(500).send({ message: "Error updating User data" });
        } else {
            res.send({ message: "User data updated successfully", result });
        }
    });
});

// Limited number of products show on home page api

app.get("/api/productlist2", (req, resp) => {
    const limit = parseInt(req.query.limit) || 4; // Default limit to 10 if not provided
    const query = "SELECT a.*, b.* FROM product_management as a, category as b WHERE a.category_id = b.category_id LIMIT ${limit}";
    con.query(query, (err, result) => {
        if (err) {
            return resp.status(500).send({ error: "Database query failed" });
        }
        resp.send(result);
    });
});

// cart product delete api
app.delete('/api/cart_product_delete/:customer_id/:product_id', (req, res) => {
    const { customer_id, product_id } = req.params;

    const query = "DELETE FROM cart WHERE customer_id = ? AND product_id = ?";
    con.query(query, [customer_id, product_id], (err, result) => {
        if (err) {
            console.error("Error deleting cart product:", err);
            return res.status(500).json({ message: "Internal Server Error" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Product not found in user's cart" });
        }

        res.status(200).json({ message: "Product deleted from cart successfully" });
    });
});

// cart product delete api
app.delete('/api/wish_product_delete/:customer_id/:product_id', (req, res) => {
    const { customer_id, product_id } = req.params;

    const query = "DELETE FROM wish WHERE customer_id = ? AND product_id = ?";
    con.query(query, [customer_id, product_id], (err, result) => {
        if (err) {
            console.error("Error deleting cart product:", err);
            return res.status(500).json({ message: "Internal Server Error" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Product not found in user's cart" });
        }

        res.status(200).json({ message: "Product deleted from wishlist" });
    });
});





app.post('/api/pay', (req, res) => {
    const {
        customer_id,
        customer_name,
        customer_country,
        customer_state,
        customer_city,
        customer_phone,
        customer_email,
        customer_pincode,
        customer_address,
        total_amt,
        payment_method
    } = req.body;

    const order_no = 'order' + uuidv4().split('-').pop();

    const checkquery = "SELECT * FROM cart WHERE customer_id=?";
    con.query(checkquery, [customer_id], async (checkError, checkResult) => {
        if (checkError) {
            console.log("Error fetching cart items:", checkError);
            return res.status(500).send({ message: "Error fetching cart items" });
        }

        if (checkResult.length === 0) {
            return res.status(404).json({ message: 'No items in the cart' });
        }

        try {
            let order_id;

            for (const item of checkResult) {
                const { product_id, product_quantity } = item;

                // Insert into order_table
                const orderInsertPromise = new Promise((resolve, reject) => {
                    const ins = "INSERT INTO order_table (order_no, customer_id,product_id, product_quantity, total_amount,payment_method) VALUES (?, ?, ?, ?,?,?)";
                    con.query(ins, [order_no, customer_id,product_id, product_quantity, total_amt,payment_method], (err, result1) => {
                        if (err) return reject(err);
                        if (!order_id) order_id = result1.insertId; // Save first insertId as order_id
                        resolve();
                    });
                });

                const updateStockPromise = new Promise((resolve, reject) => {
                    const upd = "UPDATE product_management SET product_quantity = product_quantity - ? WHERE product_id = ?";
                    con.query(upd, [product_quantity, product_id], (err, result1) => {
                        if (err) return reject(err);
                        resolve();
                    });
                });

                await orderInsertPromise;
                await updateStockPromise;
            }

            // Delete cart items
            await new Promise((resolve, reject) => {
                const deleteQuery = "DELETE FROM cart WHERE customer_id=?";
                con.query(deleteQuery, [customer_id], (error, result) => {
                    if (error) return reject(error);
                    resolve();
                });
            });

            // Insert into order_details
            const query = "INSERT INTO order_details (order_id,order_no ,customer_id, customer_name, customer_email, customer_phone, customer_state, customer_country, customer_city, customer_pincode, customer_address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)";
            con.query(query, [order_id, order_no,customer_id, customer_name, customer_email, customer_phone, customer_state, customer_country, customer_city, customer_pincode, customer_address], (err, result) => {
                if (err) {
                    console.log("Error inserting into order_details:", err);
                    return res.status(500).send({ message: "Error inserting order details" });
                }

                const smtpTransport = nodemailer.createTransport({
                    host: "smtp.gmail.com",
                    port: 587,
                    secure: false,
                    service: "gmail",
                    auth: {
                        user: process.env.Nodemailer_Email,
                        pass: process.env.Nodemailer_Password, // App password
                    },
                    tls: {
                        rejectUnauthorized: false
                    }
                });

                const customerMessage = {
                    from: process.env.Nodemailer_Email,
                    to: customer_email,
                    subject: "Order Confirmation - QuickCart",
                    text: `Hello ${customer_name},\n\nThank you for your order on QuickCart! Your order (Order No: ${order_no}) has been successfully placed.\n\nTotal Amount: ₹${total_amt}\nPayment Method: ${payment_method}\n\nWe’ll notify you once your order is shipped!\n\nRegards,\nTeam QuickCart`
                };

                const adminMessage = {
                    from: process.env.Nodemailer_Email,
                    to: process.env.Nodemailer_Email,
                    subject: "New Order Received - QuickCart",
                    text: `New order received from ${customer_name} (${customer_email}).\n\nOrder No: ${order_no}\nTotal Amount: ₹${total_amt}\nPayment Method: ${payment_method}\n\nShipping Address:\n${customer_address}\n${customer_city}, ${customer_state}, ${customer_country} - ${customer_pincode}`
                };

                smtpTransport.sendMail(customerMessage, (error, info) => {
                    if (error) {
                        console.error("Customer mail send failed:", error);
                    } else {
                        console.log("Customer confirmation mail sent:", info.response);
                    }

                    smtpTransport.sendMail(adminMessage, (adminError, adminInfo) => {
                        if (adminError) {
                            console.error("Admin notification mail failed:", adminError);
                        } else {
                            console.log("Admin order notification sent:", adminInfo.response);
                        }

                        if (error) {
                            return res.send({ message: "Order placed successfully, but customer confirmation mail failed.", order_no });
                        }
                        return res.send({ message: "Order placed successfully and confirmation mail sent!", order_no });
                    });
                });
            });


        } catch (err) {
            console.log("Transaction failed:", err);
            res.status(500).send({ message: "Something went wrong during order processing." });
        }
    });
});


// user Panel---------------------

//Fetch Order detail

app.get("/api/getorder", (req, resp) => {
   const query = `
     SELECT
       order_no,
       MIN(order_id) AS order_id,
       MAX(order_date) AS order_date,
       MAX(payment_method) AS payment_method,
       MAX(order_status) AS order_status,
       SUM(product_quantity) AS total_quantity,
       MAX(total_amount) AS total_amount
     FROM order_table
     GROUP BY order_no
   `;
    con.query(query, (err, result) => {
        if (err) {
            console.error(err);
            return resp.status(500).send("Server error");
        }
        resp.send(result);
    });
});


// update order status in admin panel

app.put("/api/updateorderstatus", (req, res) => {
    const { order_no, newStatus } = req.body;
  
    if (!order_no || newStatus === undefined) {
      return res.status(400).send("Missing order_no or newStatus");
    }
  
    const query = "UPDATE order_table SET order_status = ? WHERE order_no = ?";
    con.query(query, [newStatus, order_no], (err, result) => {
      if (err) {
        console.error("Failed to update order status:", err);
        return res.status(500).send("Database update error");
      }
  
      if (result.affectedRows === 0) {
        return res.status(404).send("Order not found");
      }
  
      res.send("Order status updated successfully");
    });
  });


// update customer status in admin panel

app.put("/api/updatecustomerstatus", (req, res) => {
    const { customer_id, newStatus } = req.body;
  
    if (customer_id === undefined || newStatus === undefined) {
      return res.status(400).send("Missing customer_id or newStatus");
    }
  
    const query = "UPDATE customer SET customer_status = ? WHERE customer_id = ?";
    con.query(query, [newStatus, customer_id], (err, result) => {
      if (err) {
        console.error("Failed to update order status:", err);
        return res.status(500).send("Database update error");
      }
  
      if (result.affectedRows === 0) {
        return res.status(404).send("Order not found");
      }
  
    //   console.log(`Order ${Order_id} updated to ${newStatus}`);
      res.send("Order status updated successfully");
    });
  });

// Get the latest order number from the backend
app.get("/api/latestorder", (req, resp) => {
    const { customer_id } = req.query;
  
    const query = "SELECT order_no FROM order_table WHERE customer_id = ? ORDER BY order_date DESC LIMIT 1 ";
  
    con.query(query, [customer_id], (err, result) => {
      if (err) {
        console.error("Error fetching latest order number:", err);
        return resp.status(500).send("Server error");
      }
  
      if (result.length === 0) {
        return resp.status(404).send("No orders found for this customer");
      }
  
      resp.send(result[0]); 
    });
  });
  
  app.get("/api/orderdetail/:orderNo", (req, resp) => {
    const { orderNo } = req.params;
    const { customer_id } = req.query;
  
    const query = `
      SELECT a.*, b.product_name, b.product_price, b.product_image
      FROM order_table AS a
      JOIN product_management AS b ON a.product_id = b.product_id
      WHERE a.order_no = ? AND a.customer_id = ?
    `;
  
    con.query(query, [orderNo, customer_id], (err, result) => {
      if (err) {
        console.error("Error fetching order details:", err);
        return resp.status(500).send("Server error");
      }
  
      resp.send(result);
    });
  });
  
  app.post("/api/feedback", (req, res) => {
    
    const { customer_name , rating, feed_message, feed_date } = req.body;
  
    const query = "INSERT INTO feedback (customer_name, rating, feed_message, feed_date) VALUES (?, ?, ?, ?)";
    con.query(query, [customer_name, rating,feed_message, feed_date], (err, result) => {
      if (err) {
        console.error("Error saving feedback:", err);
        return res.status(500).send("Server error");
      }
      res.send({ success: true, message: "Feedback saved!" });
    });
  });


// feedbackshow api

// list product api
app.get("/api/feedbacklist", (req, res) => {
    const query = "SELECT * FROM feedback ";
  
    con.query(query, (err, result) => {
      if (err) {
        console.error("Error fetching feedback:", err);
        return res.status(500).send("Server error");
      }
      res.send(result);
    });
  });


// delete feedback api
app.delete('/api/feeddelete/:feed_id',(req,resp)=>{
    const {feed_id}=req.params;
    const query="DELETE from feedback where feed_id=?";
    con.query(query,[feed_id],(err,result)=>{
        if(result.affectedRows === 0){
            return resp.status(404).json({message:'Feedback not found'});
        }
        resp.status(200).json({message:'Feedback deleted successfully'})
    });
});


// show wish Items API
app.post('/api/showwish', (req, res) => {
    const customer_id = req.body.customer_id;

    const query = "SELECT w.product_id, p.product_name,p.category_id ,p.product_image, p.product_price FROM wish w JOIN product_management p ON w.product_id = p.product_id WHERE w.customer_id = ?";

    con.query(query, [customer_id], (err, results) => {
        if (err) {
            return res.status(500).send({ message: "Error fetching cart data" });
        }
        res.send(results);
    });
});



// user side wish page api
app.post('/api/wishadd', (req, res) => {
    const product_id = req.body.product_id;

    const customer_id = req.body.customer_id;
    
    

    const checkquery="SELECT * FROM wish where product_id=? and customer_id =?";
    con.query(checkquery, [product_id, customer_id], (err, results) => {
        if (err) {
            return res.status(500).send({ message: "Error add product" });
        }
        if (results.length > 0) {
          return  res.send({ message: "Product already added"});

        } 
    const query = "INSERT INTO wish(customer_id, product_id) VALUES (?,?)";

    con.query(query, [customer_id, product_id], (err, result) => {
        if (err) {
            return res.status(500).send({ message: "Error in registration" });
        }
      res.send({ message: "Product added to the cart", data: result });
    
    });


});
});


// forgot password api
const nodemailer = require("nodemailer");


app.post("/api/sendmail", (req, res) => {

    var email = req.body.email1;

    const ins = "select * from customer where customer_email=?";
    con.query(ins, [email], (err, result) => {
      if (result.length > 0) {
        var customer_email = result[0].customer_email;
        var customer_password = result[0].customer_password;

        const smtpTransport = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
        service: "gmail",
          auth: {
            user: process.env.Nodemailer_Email,
            pass: process.env.Nodemailer_Password ,
          },
          tls: {
            rejectUnauthorized: false
          }
        });
        const message = {
          from: process.env.Nodemailer_Email,
          to: customer_email,
          subject: "Quick Cart",
          text: "Hello, User Your Password is--->>" + customer_password + ".",
        };
 
        smtpTransport.sendMail(message, (error, info) => {
          if (error) {
            console.error(error);
          } else {
            //console.log("Email sent:", info.response);
            res.send({ message: "1" });
          }
        });
 
      }
      else {
        res.send({ message: "Please Enter Valid E-mail" });
      }
 
    });
  });

// forgot password api for admin
app.post("/api/adminsendmail", (req, res) => {

    var email = req.body.email1;

    const ins = "select * from admin where admin_email=?";
    con.query(ins, [email], (err, result) => {
      if (result.length > 0) {
        var admin_email = result[0].admin_email;
        var admin_password = result[0].admin_password;

        const smtpTransport = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
        service: "gmail",
          auth: {
            user: process.env.Nodemailer_Email,
            pass: process.env.Nodemailer_Password ,
          },
          tls: {
            rejectUnauthorized: false
          }
        });
        const message = {
          from: process.env.Nodemailer_Email,
          to: admin_email,
          subject: "Quick Cart",
          text: "Hello, User Your Password is--->>" + admin_password + ".",
        };
 
        smtpTransport.sendMail(message, (error, info) => {
          if (error) {
            console.error(error);
          } else {
            //console.log("Email sent:", info.response);
            res.send({ message: "1" });
          }
        });
 
      }
      else {
        res.send({ message: "Please Enter Valid E-mail" });
      }
 
    });
  });
 

app.get("/api/invoice/:order_no", (req, res) => {
    const order_no = req.params.order_no;
  

            const sql = `
            SELECT
            o.order_no, o.order_date, o.product_quantity,
            o.total_amount, o.payment_method, o.order_status,
            p.product_id, p.product_name, p.product_price, p.product_image,
            c.customer_name, c.customer_email, c.customer_phone, c.customer_address
            FROM
            order_table o
            JOIN
            product_management p ON o.product_id = p.product_id
            JOIN
            customer c ON o.customer_id = c.customer_id
            WHERE
            o.order_no = ?
            `;
    con.query(sql, [order_no], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
  
      if (results.length === 0) {
        return res.status(404).json({ message: "Order not found" });
      }
  
      const first = results[0];
      const items = results.map(row => ({
        product_id: row.product_id,
        product_name: row.product_name,
        product_quantity: Number(row.product_quantity),
        product_price: Number(row.product_price),
        // product_image: row.product_image,
      }));
  
      const productTotal = items.reduce(
        (sum, item) => sum + item.product_quantity * item.product_price,
        0
      );
  
      const deliveryCharge = 50;
      const grandTotal = productTotal + deliveryCharge;
  
      const invoiceData = {
        order_no: first.order_no,
        order_date: first.order_date,
        payment_method: first.payment_method,
        order_status: first.order_status,
        user: {
          customer_name: first.customer_name,
          customer_email: first.customer_email,
          customer_phone: first.customer_phone,
          customer_address: first.customer_address,
          customer_state: first.customer_state,
          customer_city: first.customer_city,
          customer_pincode: first.customer_pincode,
        },
        product_total: productTotal,
        delivery_charge: deliveryCharge,
        total_amount: grandTotal,
        items,
      };
  
      res.json(invoiceData);
    });
  });
  
    
  // Optional: Endpoint to send invoice email
  app.post('/api/send-invoice', (req, res) => {
    // const { customer_email, invoiceData } = req.body;
    // console.log(`Sending invoice to ${customer_email}`);
    
    // Integrate with your email provider here
    return res.json({ message: "Invoice sent (mocked)" });
  });


//  api for admin to get all details of the order on order2 page

app.get("/api/order-details/:order_no", (req, res) => {
    const order_no = req.params.order_no;
    
    const sql = `
    SELECT
    o.order_no, o.order_date, o.product_quantity,
    o.total_amount, o.payment_method, o.order_status,
    p.product_id, p.product_name, p.product_price, p.product_image,
    c.customer_name, c.customer_email, c.customer_phone, c.customer_address
    FROM
    order_table o
    JOIN
    product_management p ON o.product_id = p.product_id
    JOIN
    customer c ON o.customer_id = c.customer_id
    WHERE
    o.order_no = ?
    `;

    con.query(sql, [order_no], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
  
      if (results.length === 0) {
        return res.status(404).json({ message: "Order not found" });
      }
  
      const first = results[0];
      const items = results.map(row => ({
        product_id: row.product_id,
        product_name: row.product_name,
        product_image: row.product_image,
        product_quantity: Number(row.product_quantity),
        product_price: Number(row.product_price),
        // product_image: row.product_image,
      }));
  
      const productTotal = items.reduce(
        (sum, item) => sum + item.product_quantity * item.product_price,
        0
      );
  
      const deliveryCharge = 50;
      const grandTotal = productTotal + deliveryCharge;
  
      const invoiceData = {
        order_no: first.order_no,
        order_date: first.order_date,
        payment_method: first.payment_method,
        order_status: first.order_status,
        user: {
          customer_name: first.customer_name,
          customer_email: first.customer_email,
          customer_phone: first.customer_phone,
          customer_address: first.customer_address,
        },
        product_total: productTotal,
        delivery_charge: deliveryCharge,
        total_amount: grandTotal,
        items,
      };
  
      res.json(invoiceData);
    });
  });
  



// count api for admin panel
app.get('/api/admin/summary', (req, res) => {
//     const query = ` 
//     SELECT 
//       (SELECT COUNT(product_id) FROM product_management) AS totalProducts,
//       (SELECT COUNT(category_id) FROM category) AS totalCategories,
//       (SELECT COUNT(customer_id) FROM customer) AS totalUsers,
//       (SELECT COUNT(feed_id) FROM feedback) AS totalFeed,
//       (SELECT COUNT(DISTINCT order_no) FROM order_table) AS totalOrders,
//       (
//         SELECT SUM(total_amount) 
//         FROM (
//           SELECT order_no, MAX(total_amount) AS total_amount
//           FROM order_table
//           GROUP BY order_no
//         ) AS unique_orders
//       ) AS totalSales
       
//   `;

// const query = ` 
//     SELECT 
//       (SELECT COUNT(product_id) FROM product_management) AS totalProducts,
//       (SELECT COUNT(category_id) FROM category) AS totalCategories,
//       (SELECT COUNT(customer_id) FROM customer) AS totalUsers,
//       (SELECT COUNT(feed_id) FROM feedback) AS totalFeed,
//       (SELECT COUNT(DISTINCT order_no) FROM order_table) AS totalOrders,
      
     
//       (
//         SELECT SUM(total_amount) 
//         FROM (
//           SELECT order_no, MAX(total_amount) AS total_amount
//           FROM order_table
//           GROUP BY order_no
//         ) AS unique_orders
//       ) AS totalSales,

//       (
//         SELECT SUM(product_price * product_quantity * 0.9 )
//         FROM product_management
//       ) AS productValueAfterDiscount
//   `;

  const query = `
  SELECT 
  (SELECT COUNT(product_id) FROM product_management) AS totalProducts,
  (SELECT COUNT(category_id) FROM category) AS totalCategories,
  (SELECT COUNT(customer_id) FROM customer) AS totalUsers,
  (SELECT COUNT(feed_id) FROM feedback) AS totalFeed,
  (SELECT COUNT(DISTINCT order_no) FROM order_table) AS totalOrders,

  (
    SELECT SUM(total_amount) 
    FROM (
      SELECT order_no, MAX(total_amount) AS total_amount
      FROM order_table
      GROUP BY order_no
    ) AS unique_orders
  ) AS totalSales,

  (
    SELECT SUM(product_price * product_quantity * 0.9)
    FROM product_management
  ) AS productValueAfterDiscount,

 (
  (
    SELECT SUM(total_amount)
    FROM (
      SELECT order_no, MAX(total_amount) AS total_amount
      FROM order_table
      GROUP BY order_no
    ) AS unique_orders
  ) * 0.1
) AS totalProfit;

  
  `;
  
    con.query(query, (err, results) => {
      if (err) {
        console.error("Error fetching summary:", err);
        return res.status(500).json({ error: 'Error fetching summary' });
      }
  
      res.json(results[0]);
    });
  });
  
  
  
  


//   search bar api
app.get("/api/searchproductlist", (req, resp) => {
    const search = req.query.search;

    let query = `SELECT a.*, b.category_name , b.category_id FROM product_management AS a JOIN category AS b ON a.category_id = b.category_id`;

    // Add WHERE clause if there's a search term
    if (search) {
        query += `WHERE a.product_name LIKE ? `;
    }else if(search){
        query += `WHERE b.category_name LIKE ? `;
    }

    const values = search ? [`%${search}%`] : [];

    con.query(query, values, (err, result) => {
        if (err) {
            console.error(err);
            return resp.status(500).send({ error: "Database error" });
        }
        resp.send(result);
    });
});


// API to get complete order details by order number

app.get("/api/admin/order/:order_no", (req, res) => {
    const orderId = req.params.order_no; 

    const orderQuery = `
        SELECT o.*, c.customer_name AS customer_name, c.customer_email, c.customer_phone 
        FROM order_details o
        JOIN customer c ON o.customer_id = c.customer_id
        WHERE o.order_id = ?
    `;

    const itemsQuery = `
        SELECT oi.*, p.product_name AS product_name, p.product_image, p.product_price 
        FROM order_items oi
        JOIN product_management p ON oi.product_id = p.product_id
        WHERE oi.order_id = ?
    `;

    con.query(orderQuery, [orderId], (err, orderResult) => {
        if (err) {
            return res.status(500).send({ message: "Order fetch error", error: err });
        }

        if (orderResult.length === 0) {
            return res.status(404).send({ message: "Order not found" });
        }

        con.query(itemsQuery, [orderId], (err2, itemsResult) => {
            if (err2) {
                return res.status(500).send({ message: "Order items fetch error", error: err2 });
            }

            res.send({
                order: orderResult[0],
                items: itemsResult
            });
        });
    });
});



app.listen(PORT, () => {
    console.log(`server is running on ${PORT}`);
})