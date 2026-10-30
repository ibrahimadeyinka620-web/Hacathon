import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "data", "safequery.db");
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA foreign_keys = ON;");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  country TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price REAL NOT NULL,
  stock INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  total REAL NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  price REAL NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  plan TEXT NOT NULL,
  status TEXT NOT NULL,
  mrr REAL NOT NULL,
  started_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
`);

function seedIfEmpty() {
  const count = db.prepare("SELECT COUNT(*) AS c FROM users").get().c;
  if (count > 0) return;

  const countries = ["US","UK","DE","FR","IN","CA","AU","BR","JP","SG"];
  const firstNames = ["Alex","Sam","Jordan","Taylor","Morgan","Casey","Riley","Jamie","Drew","Quinn","Avery","Parker","Reese","Skyler","Dakota"];
  const lastNames = ["Smith","Lee","Patel","Garcia","Chen","Brown","Wilson","Taylor","Anderson","Thomas","Jackson","White","Harris","Martin","Thompson"];

  const insertUser = db.prepare("INSERT INTO users (name, email, country, created_at) VALUES (?, ?, ?, ?)");
  const users = [];
  for (let i = 0; i < 60; i++) {
    const fn = firstNames[Math.floor(Math.random()*firstNames.length)];
    const ln = lastNames[Math.floor(Math.random()*lastNames.length)];
    const name = fn+" "+ln;
    const email = fn.toLowerCase()+"."+ln.toLowerCase()+i+"@example.com";
    const country = countries[Math.floor(Math.random()*countries.length)];
    const created = new Date(Date.now() - Math.floor(Math.random()*365)*86400000).toISOString().slice(0,10);
    insertUser.run(name, email, country, created);
    users.push({ id: i+1 });
  }

  const categories = ["Electronics","Clothing","Home","Sports","Books"];
  const productNames = ["Wireless Headphones","Smart Watch","Laptop Stand","USB-C Cable","Mechanical Keyboard","Running Shoes","Yoga Mat","Water Bottle","Backpack","Sunglasses","Coffee Maker","Desk Lamp","Throw Pillow","Blanket","Plant Pot","Novel","Notebook","Pen Set","Board Game","Puzzle"];
  const insertProduct = db.prepare("INSERT INTO products (name, category, price, stock) VALUES (?, ?, ?, ?)");
  const products = [];
  productNames.forEach((n,i) => {
    const cat = categories[i % categories.length];
    const price = Math.round((10+Math.random()*290)*100)/100;
    const stock = Math.floor(Math.random()*200);
    insertProduct.run(n, cat, price, stock);
    products.push({ id: i+1, price });
  });
  const statuses = ["completed","completed","completed","pending","cancelled","shipped"];
  const insertOrder = db.prepare("INSERT INTO orders (user_id, total, status, created_at) VALUES (?, ?, ?, ?)");
  const insertItem = db.prepare("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)");
  for (let i = 0; i < 320; i++) {
    const u = users[Math.floor(Math.random()*users.length)];
    const status = statuses[Math.floor(Math.random()*statuses.length)];
    const created = new Date(Date.now() - Math.floor(Math.random()*180)*86400000).toISOString().slice(0,10);
    const itemCount = 1 + Math.floor(Math.random()*4);
    let total = 0;
    const items = [];
    for (let j = 0; j < itemCount; j++) {
      const p = products[Math.floor(Math.random()*products.length)];
      const qty = 1 + Math.floor(Math.random()*3);
      items.push({ product_id: p.id, quantity: qty, price: p.price });
      total += p.price * qty;
    }
    const orderId = insertOrder.run(u.id, Math.round(total*100)/100, status, created).lastInsertRowid;
    for (const it of items) insertItem.run(orderId, it.product_id, it.quantity, it.price);
  }

  const plans = ["Basic","Pro","Enterprise"];
  const subStatuses = ["active","active","active","cancelled","trialing"];
  const insertSub = db.prepare("INSERT INTO subscriptions (user_id, plan, status, mrr, started_at) VALUES (?, ?, ?, ?, ?)");
  for (const u of users) {
    if (Math.random() < 0.4) {
      const plan = plans[Math.floor(Math.random()*plans.length)];
      const status = subStatuses[Math.floor(Math.random()*subStatuses.length)];
      const mrr = plan === "Basic" ? 29 : plan === "Pro" ? 99 : 499;
      const started = new Date(Date.now() - Math.floor(Math.random()*365)*86400000).toISOString().slice(0,10);
      insertSub.run(u.id, plan, status, mrr, started);
    }
  }
}

seedIfEmpty();

export function getDatabaseSchema() {
  const tables = ["users","products","orders","order_items","subscriptions"];
  const lines = [];
  lines.push("Database: SQLite (analytics). Tables and columns:");
  for (const t of tables) {
    const cols = db.prepare(`PRAGMA table_info(${t})`).all();
    const colDesc = cols.map((c) => `${c.name} ${c.type}${c.pk ? " (PK)" : ""}${c.notnull ? " NOT NULL" : ""}`).join(", ");
    const count = db.prepare(`SELECT COUNT(*) AS c FROM ${t}`).get().c;
    lines.push(`- ${t} (${count} rows): ${colDesc}`);
  }
  lines.push("");
  lines.push("Relationships:");
  lines.push("- orders.user_id -> users.id");
  lines.push("- order_items.order_id -> orders.id");
  lines.push("- order_items.product_id -> products.id");
  lines.push("- subscriptions.user_id -> users.id");
  lines.push("");
  lines.push("Notes:");
  lines.push("- orders.status in ('completed','pending','cancelled','shipped')");
  lines.push("- products.category in ('Electronics','Clothing','Home','Sports','Books')");
  lines.push("- subscriptions.plan in ('Basic','Pro','Enterprise'); status in ('active','cancelled','trialing')");
  lines.push("- subscriptions.mrr is monthly recurring revenue per subscription");
  lines.push("- Use date functions on created_at/started_at (TEXT ISO dates).");
  return lines.join("\\n");
}

export function getDb() { return db; }
export default db;

