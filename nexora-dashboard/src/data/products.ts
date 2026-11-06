import type { Product } from "../types";

export const LOW_STOCK_THRESHOLD = 10;

export const initialProducts: Product[] = [
  { id: "P001", name: "Samsung A55", brand: "Samsung", category: "Smartphones", price: 50000, cost: 30000, stock: 18,
    description: "5G smartphone with a 6.6-inch Super AMOLED display, 50MP camera and all-day battery.",
    features: ["6.6\" Super AMOLED", "50MP camera", "5000mAh battery", "5G"] },
  { id: "P002", name: "iPhone 15", brand: "Apple", category: "Smartphones", price: 245000, cost: 210000, stock: 6,
    description: "Apple smartphone with the A16 Bionic chip, USB-C and a 48MP main camera.",
    features: ["A16 Bionic", "48MP camera", "USB-C", "6.1\" display"] },
  { id: "P003", name: "Redmi Note 13", brand: "Xiaomi", category: "Smartphones", price: 62000, cost: 48000, stock: 34,
    description: "Value smartphone with a 120Hz AMOLED display and 108MP camera.",
    features: ["120Hz AMOLED", "108MP camera", "33W fast charging"] },
  { id: "P004", name: "JBL Flip 6", brand: "JBL", category: "Audio", price: 28500, cost: 19000, stock: 9,
    description: "Portable waterproof Bluetooth speaker with powerful JBL Original Pro Sound.",
    features: ["IP67 waterproof", "12h playtime", "Bluetooth 5.1"] },
  { id: "P005", name: "Anker 20K Power Bank", brand: "Anker", category: "Accessories", price: 12900, cost: 8200, stock: 52,
    description: "20,000mAh high-capacity power bank with fast charging for phones and tablets.",
    features: ["20000mAh", "22.5W output", "Dual USB ports"] },
  { id: "P006", name: "Sony WH-CH720N", brand: "Sony", category: "Audio", price: 38500, cost: 27000, stock: 4,
    description: "Lightweight wireless noise-cancelling headphones with up to 35 hours of battery life.",
    features: ["Noise cancelling", "35h battery", "Lightweight design"] },
];
