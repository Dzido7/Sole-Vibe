import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { Product, Review, Order, Notification } from "./src/types";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "src", "db.json");

app.use(express.json());

// Lazy-loaded Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

// Initial Database Structure
interface DatabaseSchema {
  products: Product[];
  reviews: Review[];
  orders: Order[];
  notifications: Notification[];
}

const INITIAL_PRODUCTS: Product[] = [
  {
    id: "zenith-carbon-x",
    name: "Zenith Carbon-X",
    category: "Running",
    description: "Built for elite racers, the Zenith Carbon-X blends an aggressive full-length carbon fiber propulsion plate with responsive, dual-density bio-foam cushioning. Its weightless aero-weave mesh is engineered for speed, offering breathable lockdowns through high-speed mileage.",
    price: 185.0,
    features: [
      "Aero-weave carbon flyplate for maximal snapback propulsion",
      "High-response cloud bio-foam shock absorption",
      "Deep contour friction traction layout",
      "Zero-drag lightweight silhouette"
    ],
    sizes: [7, 8, 9, 10, 11, 12],
    sizesStock: { 7: 3, 8: 10, 9: 1, 10: 8, 11: 4, 12: 5 },
    colors: ["Pulse Orange / Stealth Charcoal", "Obsidian Shadow / Volt"],
    images: ["/src/assets/images/carbon_runner_1779374427059.png"],
    rating: 4.8,
    reviewCount: 4
  },
  {
    id: "aerocraft-retro-85",
    name: "AeroCraft Retro '85",
    category: "Retro Basketball",
    description: "An homage to the golden era of court hoops. Features rich, full-grain cream leather overlays, supple perforated ventilation chambers on the toe box, and solid vintage forest green ankle guards. Built upon a classic stitched rubber cupsole and a heavy-traction vintage gum sole.",
    price: 160.0,
    features: [
      "Full-grain calfskin leather for pristine longevity",
      "Stitched protective cupsole with internal Air cushioning",
      "Comfort padded retro style collar",
      "Vintage wear-resistant gum sole"
    ],
    sizes: [7, 8, 9, 10, 11, 12],
    sizesStock: { 7: 2, 8: 0, 9: 5, 10: 2, 11: 12, 12: 1 },
    colors: ["Cream Leather / Forest Green", "Red Championship Velvet / Pearl"],
    images: ["/src/assets/images/retro_high_1779374450550.png"],
    rating: 4.7,
    reviewCount: 3
  },
  {
    id: "knitflow-bare",
    name: "KnitFlow Bare",
    category: "Lifestyle",
    description: "Crafted like a second skin, the KnitFlow Bare strips sneakers down to the absolute essentials. Features an eco-engineered, zero-waste stitch knit body and a flexible barefoot-inspired bio-algae foam sole that flexes instantly with your foot.",
    price: 140.0,
    features: [
      "Zero-waste multi-density stitch knit body",
      "Ultra-flexible bio-based algae shock absorption outsole",
      "Sock-like integrated elastic neck collar",
      "Featherweight foot contour structure"
    ],
    sizes: [7, 8, 9, 10, 11, 12],
    sizesStock: { 7: 6, 8: 5, 9: 10, 10: 0, 11: 7, 12: 3 },
    colors: ["Oatmeal Sand / Warm Pearl", "Minimalist Slate Grey / Charcoal"],
    images: ["/src/assets/images/knit_style_1779374469745.png"],
    rating: 4.5,
    reviewCount: 3
  },
  {
    id: "vapormax-pulse",
    name: "VaporMax Pulse",
    category: "Running",
    description: "The peak of pressurized air comfort. Engineered with independent multi-pod VaporMax responsive bubbles, creating instant springback. Fitted with structured dynamic lace lock cords for rapid adjustments.",
    price: 175.0,
    features: [
      "Pressurized air shock-absorbing bubble pods",
      "Dynamic lock cords for instant secure fit",
      "Post-consumer recycled ocean plastic mesh knit",
      "Luminous reflective striping details"
    ],
    sizes: [8, 9, 10, 11, 12],
    sizesStock: { 8: 6, 9: 3, 10: 1, 11: 5, 12: 2 },
    colors: ["Chalk White / Hyper Silver", "Electric Aqua / Graphite"],
    images: ["https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&auto=format&fit=crop&q=80"],
    rating: 4.6,
    reviewCount: 2
  },
  {
    id: "court-classic-lux",
    name: "Court Classic Lux",
    category: "Lifestyle",
    description: "Minimalism meets elite craftsmanship. Cut with buttery soft nappa leather panels and clean hand-bound tonal stitches. Exquisite comfort is achieved through a fully leather-lined collar and orthotic micro-cushions.",
    price: 125.0,
    features: [
      "Ultra soft top-grade Nappa leather finish",
      "Ortholite leather-lined inside shoe lining",
      "Wax-coated luxury flat fibers laces",
      "Sealed stitched support sole wall"
    ],
    sizes: [7, 8, 9, 10, 11],
    sizesStock: { 7: 5, 8: 8, 9: 2, 10: 4, 11: 0 },
    colors: ["Pristine Alabaster / Honey", "Stealth Onyx / Matte Charcoal"],
    images: ["https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600&auto=format&fit=crop&q=80"],
    rating: 4.9,
    reviewCount: 3
  },
  {
    id: "apex-trail-blazer",
    name: "Apex Trail-Blazer",
    category: "Outdoor",
    description: "The rugged adventurer. Fitted with advanced non-porous moisture repelling ripstop textures and heavy vulcanized framing buffers. Aggressive deep-groove tread sole layout ensures steady climbing stability.",
    price: 210.0,
    features: [
      "Micro-dense water shield repelling outer weave",
      "Vibram high-grip jagged hiking outsoles",
      "Heavy duty abrasion-proof rubber mudguard",
      "Quick-draw utility drawstring lock laces"
    ],
    sizes: [8, 9, 10, 11, 12],
    sizesStock: { 8: 4, 9: 3, 10: 6, 11: 2, 12: 0 },
    colors: ["Canyon Ochre / Obsidian", "Alpine Pine / Dark Moss Overlay"],
    images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80"],
    rating: 4.4,
    reviewCount: 2
  }
];

const INITIAL_REVIEWS: Review[] = [
  {
    id: "rev-1",
    productId: "zenith-carbon-x",
    rating: 5,
    username: "SprintKing_88",
    title: "Best speed shoe I've ever laced up!",
    comment: "The pop you get from the carbon flyplate is absolutely insane. Put these on for a local 10k and immediately shaved 45 seconds off my PR. Unrivaled speed, super airy mesh.",
    date: "2026-05-18",
    verifiedPurchase: true
  },
  {
    id: "rev-2",
    productId: "zenith-carbon-x",
    rating: 4,
    username: "MilesToGo",
    title: "Incredibly snappy but very narrow",
    comment: "Materials and energy feedback are unmatched, but make sure to size up if your foot run wide. The middle lockdown is intense. Highly recommend the Pulse Orange colorway, visible from a mile away!",
    date: "2026-05-10",
    verifiedPurchase: true
  },
  {
    id: "rev-3",
    productId: "aerocraft-retro-85",
    rating: 5,
    username: "SoleCollectorNY",
    title: "Breathtaking leather quality!",
    comment: "The cream cowhide leather on these feels incredibly soft, far superior to standard mass-produced retro releases. The forest green contrasts pair incredibly with casual cargo pants or retro sports denim. Worth every penny.",
    date: "2026-05-20",
    verifiedPurchase: true
  },
  {
    id: "rev-4",
    productId: "knitflow-bare",
    rating: 4,
    username: "MinimalStich",
    title: "Insane comfort, feels like an elite sock",
    comment: "I wear these to the office and long commutes without socks. Genuinely feels like wearing high-end merino socks with a cloud glued underneath. I got the Oatmeal Sand variant and receive complements constantly.",
    date: "2026-05-14",
    verifiedPurchase: true
  },
  {
    id: "rev-5",
    productId: "court-classic-lux",
    rating: 5,
    username: "NappaClassic",
    title: "Prada-level craftsmanship at a third of the price",
    comment: "Honestly astonished by the stitch alignment and leather finishing here. Reminds me of premium designer brands. Extremely clean with sleek linen suits.",
    date: "2026-05-19",
    verifiedPurchase: true
  }
];

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "not-1",
    title: "Summer Flash Drop!",
    description: "The AeroCraft Retro '85 is almost sold out. Grab our classic Court Leather today before the rest go.",
    timestamp: "2026-05-21T10:00:00Z",
    read: false,
    type: "sale",
    productId: "aerocraft-retro-85"
  },
  {
    id: "not-2",
    title: "Exclusive Release: Zenith Carbon-X",
    description: "Propel your strides! Our freshest aero-propulsion running release Zenith is now fully stocked in standard fit.",
    timestamp: "2026-05-21T08:30:00Z",
    read: false,
    type: "new-arrival",
    productId: "zenith-carbon-x"
  }
];

// Helper to Load / Sync Database
function readDb(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading db.json, generating default database schema", error);
  }

  // Create initial database
  const defaultDb: DatabaseSchema = {
    products: INITIAL_PRODUCTS,
    reviews: INITIAL_REVIEWS,
    orders: [],
    notifications: INITIAL_NOTIFICATIONS,
  };
  writeDb(defaultDb);
  return defaultDb;
}

function writeDb(db: DatabaseSchema) {
  try {
    // Ensure parent directory exists
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to write to db.json", error);
  }
}

// REST API Endpoints

// 1. Get all products with current real-time inventory
app.get("/api/products", (req, res) => {
  const db = readDb();
  res.json(db.products);
});

// 2. Get reviews for a product
app.get("/api/products/:id/reviews", (req, res) => {
  const db = readDb();
  const productReviews = db.reviews.filter(r => r.productId === req.params.id);
  res.json(productReviews);
});

// 3. Post a new user review (re-calculates average rating)
app.post("/api/products/:id/reviews", (req, res) => {
  const { rating, username, title, comment } = req.body;
  const productId = req.params.id;

  if (!rating || !username || !title || !comment) {
    return res.status(400).json({ error: "Missing required review fields" });
  }

  const db = readDb();
  const product = db.products.find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  const newReview: Review = {
    id: `rev-${Date.now()}`,
    productId,
    rating: Number(rating),
    username,
    title,
    comment,
    date: new Date().toISOString().split("T")[0],
    verifiedPurchase: true // Checkouts are simulated, let's treat submitting users as verified!
  };

  db.reviews.push(newReview);

  // Recalculate average rating and count
  const productReviews = db.reviews.filter(r => r.productId === productId);
  const totalRating = productReviews.reduce((sum, r) => sum + r.rating, 0);
  product.rating = parseFloat((totalRating / productReviews.length).toFixed(1));
  product.reviewCount = productReviews.length;

  writeDb(db);
  res.status(201).json(newReview);
});

// 4. Secure checkout with mock processing and real inventory decrementing
app.post("/api/checkout", (req, res) => {
  const { cartItems, customerInfo, paymentDetails, paymentMethod } = req.body;

  if (!cartItems || cartItems.length === 0 || !customerInfo || !paymentMethod) {
    return res.status(400).json({ error: "Invalid checkout body parameters" });
  }

  const db = readDb();

  // Validate and deduct stock
  for (const item of cartItems) {
    const dbProduct = db.products.find(p => p.id === item.productId);
    if (!dbProduct) {
      return res.status(404).json({ error: `Product ${item.productId} not found` });
    }

    const size = Number(item.selectedSize);
    const availableStock = dbProduct.sizesStock[size] ?? 0;
    if (availableStock < item.quantity) {
      return res.status(400).json({
        error: `Insufficient inventory for ${dbProduct.name} (Size ${size}). Only ${availableStock} left in stock.`
      });
    }
  }

  // Deduct inventory
  for (const item of cartItems) {
    const dbProduct = db.products.find(p => p.id === item.productId)!;
    const size = Number(item.selectedSize);
    dbProduct.sizesStock[size] = (dbProduct.sizesStock[size] ?? 0) - item.quantity;
  }

  // Mock pricing calculations
  const subtotal = cartItems.reduce((acc: number, item: any) => acc + item.product.price * item.quantity, 0);
  const shipping = subtotal > 150 ? 0 : 15.0;
  const tax = parseFloat((subtotal * 0.0825).toFixed(2));
  const total = parseFloat((subtotal + shipping + tax).toFixed(2));

  // Generate unique tracking identifier
  const randomId = Math.floor(1000 + Math.random() * 9000);
  const trackingId = `SV-${randomId}-XE`;

  const newOrder: Order = {
    id: `ord-${Date.now()}`,
    trackingId,
    status: "processing",
    items: cartItems.map((item: any) => ({
      productId: item.productId,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      selectedSize: item.selectedSize,
      selectedColor: item.selectedColor,
      image: item.product.images[0]
    })),
    customerInfo,
    paymentMethod,
    totals: { subtotal, shipping, tax, total },
    date: new Date().toISOString(),
    history: [
      {
        status: "processing",
        timestamp: new Date().toISOString(),
        description: "Payment authorization successful. Order registered into packaging queue."
      }
    ]
  };

  db.orders.push(newOrder);

  // Push low stock alerts directly if subtraction triggered critical levels on certain sizes
  cartItems.forEach((item: any) => {
    const dbProduct = db.products.find(p => p.id === item.productId)!;
    const size = Number(item.selectedSize);
    const updatedStock = dbProduct.sizesStock[size] ?? 0;
    if (updatedStock > 0 && updatedStock <= 2) {
      db.notifications.unshift({
        id: `not-stock-${Date.now()}-${size}`,
        title: "Critical Stock Drop!",
        description: `Only ${updatedStock} pairs left of ${dbProduct.name} in Size ${size}!`,
        timestamp: new Date().toISOString(),
        read: false,
        type: "low-stock",
        productId: dbProduct.id
      });
    }
  });

  writeDb(db);
  res.status(201).json(newOrder);
});

// 5. Retrieve trackable order details
app.get("/api/orders/:trackingId", (req, res) => {
  const db = readDb();
  const order = db.orders.find(
    o => o.trackingId.toUpperCase() === req.params.trackingId.trim().toUpperCase()
  );
  if (!order) {
    return res.status(404).json({ error: "Tracking record not found" });
  }
  res.json(order);
});

// Simulate Order Progress stage updates (processing -> shipped -> in-transit -> delivered)
app.post("/api/orders/:trackingId/advance", (req, res) => {
  const db = readDb();
  const order = db.orders.find(
    o => o.trackingId.toUpperCase() === req.params.trackingId.trim().toUpperCase()
  );
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  const stages: ('processing' | 'shipped' | 'in-transit' | 'delivered')[] = [
    "processing",
    "shipped",
    "in-transit",
    "delivered"
  ];
  const currentIndex = stages.indexOf(order.status);
  if (currentIndex < 3) {
    const nextStatus = stages[currentIndex + 1];
    order.status = nextStatus;

    let desc = "";
    if (nextStatus === "shipped") {
      desc = "Carrier received package. Left SoleVibe Distribution Depot, Munchen.";
    } else if (nextStatus === "in-transit") {
      desc = "Arrived at sorting facility. Flight transit in progress to destination customs.";
    } else if (nextStatus === "delivered") {
      desc = "Signed and matched delivery. Handed directly to the resident at main porch.";
    }

    order.history.unshift({
      status: nextStatus,
      timestamp: new Date().toISOString(),
      description: desc
    });

    writeDb(db);
  }

  res.json(order);
});

// 6. Gemini Recommended Engines based on browsing history
app.post("/api/recommendations", async (req, res) => {
  const { viewHistory } = req.body; // List of product IDs viewed, e.g. ["knitflow-bare", "zenith-carbon-x"]
  const db = readDb();

  const history = Array.isArray(viewHistory) ? viewHistory : [];

  const ai = getGeminiClient();

  if (ai) {
    try {
      // Craft a descriptive prompt with view history and catalog details
      const catalogInfo = db.products.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.price,
        description: p.description,
        features: p.features
      }));

      const prompt = `You are the ultimate sneakerhead AI recommendation engine for "SoleVibe Sneaker Store".
We have a minimalist store with the following products:
${JSON.stringify(catalogInfo, null, 2)}

The active customer has just viewed these sneakers in this specific order (newest first):
${JSON.stringify(history)}

Task:
1. Generate an elite, casual, stylish "SoleVibe AI Curator Note" (1-2 sentences maximum!) describing their sneaker subculture vibe (e.g. runner-centric, vintage nostalgia, minimalist designer) and why certain sneakers match their exact browsing path.
2. Select exactly two product IDs from our catalog that they should look at next (as primary recommendations, excluding their topmost viewed item unless they have only viewed 1).

Your response must be structured in strictly valid JSON format exactly as follows:
{
  "curatorNote": "Your custom curation review text here...",
  "recommendedIds": ["id1", "id2"]
}

Do not include any markdown backticks, explanations, or wrapper texts outside the JSON body response. Just return the raw JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text?.trim() || "{}";
      const result = JSON.parse(responseText);
      if (result.curatorNote && Array.isArray(result.recommendedIds)) {
        return res.json(result);
      }
    } catch (error) {
      console.error("Gemini recommendation AI error, falling back to heuristic engine", error);
    }
  }

  // Elegant fallback rule-based matching
  let curatorNote = "Based on your refined taste, we've compiled a selection of premium silhouettes that seamlessly fit your lifestyle.";
  let recommendedIds = ["zenith-carbon-x", "aerocraft-retro-85"];

  if (history.length > 0) {
    const freshView = history[0];
    const viewItem = db.products.find(p => p.id === freshView);
    if (viewItem) {
      if (viewItem.category.toLowerCase().includes("running")) {
        curatorNote = `We detected your passion for high-performance speed. We recommend lacing up the responsive Zenith Carbon-X or pressurized VaporMax Pulse to maximize your mileage.`;
        recommendedIds = ["zenith-carbon-x", "vapormax-pulse"];
      } else if (viewItem.category.toLowerCase().includes("retro")) {
        curatorNote = `You appreciate heritage leather contours and timeless basketball classics. The AeroCraft Retro '85 is an essential standard, alongside our clean Court Classic.`;
        recommendedIds = ["aerocraft-retro-85", "court-classic-lux"];
      } else {
        curatorNote = `You prefer ultra-clean aesthetics and sock-knit minimalist ergonomics. Consider matching KnitFlow Bare together with our supple Court Classic Lux for refined daily wearing.`;
        recommendedIds = ["knitflow-bare", "court-classic-lux"];
      }
    }
  }

  res.json({ curatorNote, recommendedIds });
});

// 7. Push alert logs API
app.get("/api/notifications", (req, res) => {
  const db = readDb();
  res.json(db.notifications);
});

// Clear notifications (mark all as read)
app.post("/api/notifications/read", (req, res) => {
  const db = readDb();
  db.notifications.forEach(n => n.read = true);
  writeDb(db);
  res.json({ success: true });
});

// Simulate a background Drop arrival notification dynamically to test simulation
app.post("/api/notifications/simulate", (req, res) => {
  const db = readDb();
  const alertStyles = [
    { title: "SoleVibe Exclusive Flash Restock", desc: "Just arrived: Vintage Forest Green Retro laces available now.", type: "new-arrival" },
    { title: "Mid-Season Price Cut Alert", desc: "Unlock 15% off at checkout on all knit minimalist lifestyle lines.", type: "sale" },
    { title: "Hurry: Stock Alert", desc: "Only 1 pair of Zenith Carbon-X Size 9 remains in our logistics center.", type: "low-stock" }
  ];
  const randomAlert = alertStyles[Math.floor(Math.random() * alertStyles.length)];
  const newNot: Notification = {
    id: `not-sim-${Date.now()}`,
    title: randomAlert.title,
    description: randomAlert.desc,
    timestamp: new Date().toISOString(),
    read: false,
    type: randomAlert.type as any
  };
  db.notifications.unshift(newNot);
  writeDb(db);
  res.status(201).json(newNot);
});

// Vite Setup: serve generated files and middleware
async function startServer() {
  // Service generated local assets securely
  app.use("/src/assets/images", express.static(path.join(process.cwd(), "src", "assets", "images")));

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express custom server running safely on port ${PORT}`);
  });
}

startServer();
