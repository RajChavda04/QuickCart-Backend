# QuickCart — Backend API Server

REST API backend for the **QuickCart** e-commerce platform. It powers both the [Admin Panel](https://github.com/RajChavda04/QuickCart-Admin-Panel) and [User Panel](https://github.com/RajChavda04/QuickCart-User-Panel).

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime |
| **Express.js** | REST API & routing |
| **MySQL** (`mysql2`) | Database |
| **Multer** | Product & category image uploads |
| **Nodemailer** | Order confirmation, forgot-password emails |
| **CORS** | Cross-origin requests from React apps |
| **dotenv** | Environment variables |
| **UUID** | Unique order numbers |

---

## Features

### Authentication
- Admin login
- User registration & login
- Change password (admin & user)
- Forgot password via email (admin & user)

### Products & Categories
- Add / list / edit / delete products (with image upload)
- Add / list / edit / delete categories (with image upload)
- Product listing with category join
- Search products by name

### Customers (Admin)
- List all customers
- Block / unblock users (`customer_status`)

### Cart & Wishlist (User)
- Add to cart, update quantity, remove items
- Add to wishlist, remove, move wishlist item to cart
- Show cart & checkout data

### Orders & Payments
- Place order from cart (COD / online flow from frontend)
- Auto stock deduction on order
- Order confirmation emails (customer + admin)
- Order list, status update, order details & invoice APIs
- Latest order & order detail for user

### Feedback
- Submit feedback (user)
- List & delete feedback (admin)

### Dashboard
- Admin summary API: total products, categories, users, orders, sales, profit, feedback count

### Static Files
- Uploaded images served from `/public` folder

---

## Project Structure

```
Server/
├── server.js              # All API routes (single file)
├── package.json
├── database/
│   └── quickcart.sql      # Full database schema (import in phpMyAdmin)
├── .env                   # Your local DB credentials (not committed to Git)
├── public/                # Uploaded product & category images
└── docs/
    └── screenshots/       # Add API/server screenshots here (optional)
```

---

## Prerequisites

Before you begin, install:

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [XAMPP](https://www.apachefriends.org/) (includes **Apache** + **MySQL** + **phpMyAdmin**) — recommended for local setup
- [Git](https://git-scm.com/)

> You do **not** need to share database credentials publicly. Clone the repo, import `database/quickcart.sql` in phpMyAdmin, and use your own local MySQL user/password in `.env`.

---

## Installation (From GitHub)

### 1. Clone the repository

```bash
git clone https://github.com/RajChavda04/QuickCart-Backend.git
cd QuickCart-Backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up database with XAMPP & phpMyAdmin

#### Step A — Start XAMPP

1. Open **XAMPP Control Panel**
2. Start **Apache** (optional, for phpMyAdmin)
3. Start **MySQL** (required)

#### Step B — Import schema in phpMyAdmin

1. Open browser → **http://localhost/phpmyadmin**
2. Click **Import** tab (or **SQL** tab)
3. Choose file: `database/quickcart.sql` from this project
4. Click **Go** / **Import**

This creates database `quickcart` with all tables and a sample admin account:

| Field | Default value (change after import) |
|-------|-------------------------------------|
| Email | `admin@quickcart.com` |
| Password | `admin123` |

**Alternative (command line):**

```bash
mysql -u root -p < database/quickcart.sql
```

(XAMPP default user is `root` with **empty** password unless you changed it.)

### 4. Configure environment variables

Create a `.env` file in the project root (use **your own** local values — never commit real passwords to GitHub):

```env
PORT=1337

# MySQL — XAMPP defaults (change if you set a MySQL password)
Host=localhost
SqlPort=3306
User_Name=root
Password=
DbName=quickcart

# Frontend URLs (for CORS)
FRONTEND_USER_URL=http://localhost:3000
FRONTEND_ADMIN_URL=http://localhost:3001

# Gmail (Nodemailer) — use App Password, not regular password
Nodemailer_Email=your-email@gmail.com
Nodemailer_Password=your-gmail-app-password
```

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: `1337`) |
| `Host` | MySQL host |
| `SqlPort` | MySQL port |
| `User_Name` | MySQL username |
| `Password` | MySQL password (XAMPP default is empty: leave blank or `Password=`) |
| `DbName` | Database name (`quickcart`) |
| `FRONTEND_USER_URL` | User React app URL |
| `FRONTEND_ADMIN_URL` | Admin React app URL |
| `Nodemailer_Email` | Gmail for sending emails |
| `Nodemailer_Password` | Gmail App Password |

### 5. Run the server

**Development (with auto-restart):**

```bash
npm run dev
```

**Production:**

```bash
npm start
```

Server runs at: **http://localhost:1337**

### 6. Verify server is running

Open in browser or terminal:

```bash
curl http://localhost:1337/api/health
```

Expected response: `Server is running`

---

## API Overview

Base URL: `http://localhost:1337/api`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/loginprocess` | Admin login |
| POST | `/userregister` | User registration |
| POST | `/userloginprocess` | User login |
| POST | `/passchange` | Admin change password |
| POST | `/passchangeuser` | User change password |
| POST | `/insertproduct` | Add product (multipart) |
| GET | `/productlist` | List products |
| POST | `/editproductdata` | Get product for edit |
| POST | `/productupdate` | Update product |
| DELETE | `/Product_Delete/:id` | Delete product |
| POST | `/insertcategory` | Add category |
| GET | `/categorylist` | List categories |
| POST | `/categoryupdate1` | Update category |
| DELETE | `/Category_Delete/:id` | Delete category |
| GET | `/customerlist` | List customers |
| PUT | `/updatecustomerstatus` | Block/unblock user |
| POST | `/cartadd` | Add to cart |
| POST | `/showcart` | Get cart items |
| POST | `/pay` | Place order |
| GET | `/getorder` | List orders (admin) |
| PUT | `/updateorderstatus` | Update order status |
| GET | `/admin/summary` | Dashboard stats |
| GET | `/searchproductlist?search=` | Search products |
| ... | ... | See `server.js` for full list |

Uploaded images are available at: `http://localhost:1337/<filename>`

---

## Database Schema

Database name: **`quickcart`**

Import full SQL from: [`database/quickcart.sql`](./database/quickcart.sql)

### Tables overview

| Table | Description |
|-------|-------------|
| `admin` | Admin login (email, password) |
| `customer` | Registered users; `customer_status` 0 = active, 1 = blocked |
| `category` | Product categories with image |
| `product_management` | Products (price, stock, category, image) |
| `cart` | Cart items per customer |
| `wish` | Wishlist per customer |
| `order_table` | Order line items; `order_status` 0 = complete, 1 = pending |
| `order_details` | Shipping address per order |
| `feedback` | Ratings & reviews |

### Field details (all tables)

<details>
<summary><strong>admin</strong></summary>

| Column | Type | Notes |
|--------|------|-------|
| `admin_id` | INT, PK, AUTO_INCREMENT | Primary key |
| `admin_email` | VARCHAR(255), UNIQUE | Login email |
| `admin_password` | VARCHAR(255) | Login password |

</details>

<details>
<summary><strong>customer</strong></summary>

| Column | Type | Notes |
|--------|------|-------|
| `customer_id` | INT, PK, AUTO_INCREMENT | Primary key |
| `customer_name` | VARCHAR(255) | Full name |
| `customer_email` | VARCHAR(255), UNIQUE | Login email |
| `customer_password` | VARCHAR(255) | Login password |
| `customer_phone` | VARCHAR(20) | Phone number |
| `customer_address` | TEXT | Address |
| `customer_status` | TINYINT, default `0` | `0` = active, `1` = blocked |

</details>

<details>
<summary><strong>category</strong></summary>

| Column | Type | Notes |
|--------|------|-------|
| `category_id` | INT, PK, AUTO_INCREMENT | Primary key |
| `category_name` | VARCHAR(255) | Category name |
| `category_description` | TEXT | Description |
| `category_image` | VARCHAR(255) | Image filename (stored in `public/`) |

</details>

<details>
<summary><strong>product_management</strong></summary>

| Column | Type | Notes |
|--------|------|-------|
| `product_id` | INT, PK, AUTO_INCREMENT | Primary key |
| `product_name` | VARCHAR(255) | Product name |
| `product_description` | TEXT | Description |
| `product_price` | DECIMAL(10,2) | Price in ₹ |
| `product_quantity` | INT | Stock quantity |
| `category_id` | INT, FK → `category` | Category reference |
| `product_image` | VARCHAR(255) | Image filename |

</details>

<details>
<summary><strong>cart</strong></summary>

| Column | Type | Notes |
|--------|------|-------|
| `cart_id` | INT, PK | Generated by backend |
| `customer_id` | INT, FK → `customer` | Customer reference |
| `product_id` | INT, FK → `product_management` | Product reference |
| `product_quantity` | INT, default `1` | Quantity in cart |

</details>

<details>
<summary><strong>wish</strong></summary>

| Column | Type | Notes |
|--------|------|-------|
| `wish_id` | INT, PK, AUTO_INCREMENT | Primary key |
| `customer_id` | INT, FK → `customer` | Customer reference |
| `product_id` | INT, FK → `product_management` | Product reference |

</details>

<details>
<summary><strong>order_table</strong></summary>

| Column | Type | Notes |
|--------|------|-------|
| `order_id` | INT, PK, AUTO_INCREMENT | Primary key |
| `order_no` | VARCHAR(50) | Unique order number (e.g. `orderabc123`) |
| `customer_id` | INT, FK → `customer` | Customer reference |
| `product_id` | INT, FK → `product_management` | Product in order |
| `product_quantity` | INT | Quantity ordered |
| `total_amount` | DECIMAL(10,2) | Order total |
| `payment_method` | VARCHAR(50) | e.g. COD, Razorpay |
| `order_status` | TINYINT, default `1` | `0` = complete, `1` = pending |
| `order_date` | DATETIME | Auto-set on insert |

</details>

<details>
<summary><strong>order_details</strong></summary>

| Column | Type | Notes |
|--------|------|-------|
| `order_detail_id` | INT, PK, AUTO_INCREMENT | Primary key |
| `order_id` | INT | Links to `order_table.order_id` |
| `order_no` | VARCHAR(50) | Order number |
| `customer_id` | INT | Customer reference |
| `customer_name` | VARCHAR(255) | Name at checkout |
| `customer_email` | VARCHAR(255) | Email |
| `customer_phone` | VARCHAR(20) | Phone |
| `customer_state` | VARCHAR(100) | State |
| `customer_country` | VARCHAR(100) | Country |
| `customer_city` | VARCHAR(100) | City |
| `customer_pincode` | VARCHAR(20) | PIN / ZIP |
| `customer_address` | TEXT | Full address |

</details>

<details>
<summary><strong>feedback</strong></summary>

| Column | Type | Notes |
|--------|------|-------|
| `feed_id` | INT, PK, AUTO_INCREMENT | Primary key |
| `customer_name` | VARCHAR(255) | Reviewer name |
| `rating` | INT | Star rating (1–5) |
| `feed_message` | TEXT | Review message |
| `feed_date` | DATE | Review date |

</details>

### Entity relationship (simplified)

```
category ──< product_management
customer ──< cart
customer ──< wish
customer ──< order_table >── product_management
order_details (shipping info per order_no)
feedback (standalone reviews)
admin (standalone)
```

---

## How It Works

1. **Admin** and **User** React apps send HTTP requests to this server.
2. **Express** handles routes; **MySQL** stores all data.
3. **Multer** saves product/category images to the `public/` folder.
4. On checkout, orders are saved, stock is reduced, cart is cleared, and **Nodemailer** sends emails.
5. **CORS** allows only configured frontend URLs to access the API.

---

## Running With Frontend Apps

Run in this order:

| Step | Project | Command | URL |
|------|---------|---------|-----|
| 1 | **Server** (this repo) | `npm run dev` | http://localhost:1337 |
| 2 | **Admin** | `npm start` (PORT=3001) | http://localhost:3001 |
| 3 | **User** | `npm start` | http://localhost:3000 |

Update `FRONTEND_USER_URL` and `FRONTEND_ADMIN_URL` in `.env` if you use different ports.

---

## Screenshots

### Tables

![Tables](https://res.cloudinary.com/dmuedtbcs/image/upload/v1780049953/table_gbvsb8.png)

### Product Table (Example)

![Product Table](https://res.cloudinary.com/dmuedtbcs/image/upload/v1780049952/tablesdata_pzbghl.png)

### Server / API Health

![API Health Check](https://res.cloudinary.com/dmuedtbcs/image/upload/v1780049949/api_rruk36.png)

### Database Connected (Terminal)

![Server Running](https://res.cloudinary.com/dmuedtbcs/image/upload/v1780049950/server_q2jjc8.png)

---

## Related Repositories

- [QuickCart Admin Panel](https://github.com/RajChavda04/QuickCart-Admin-Panel)
- [QuickCart User Panel](https://github.com/RajChavda04/QuickCart-User-Panel)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `Database connection failed` | Check MySQL is running, `.env` credentials, and database exists |
| CORS errors | Add your frontend URL to `FRONTEND_USER_URL` / `FRONTEND_ADMIN_URL` |
| Emails not sending | Use Gmail App Password; enable 2FA on Google account |
| Images not loading | Ensure `public/` folder exists; check `MEDIA_BASE_URL` in frontend |

---

## Author

**Raj Chavda**

---

## License

ISC
