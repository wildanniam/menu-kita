import { dishSchema, type Dish } from "@/lib/schemas";

/**
 * Placeholder menu used until the live photo-to-menu extraction (task 4.4)
 * is wired up. Ingredients are set deliberately so the compatibility engine
 * produces a realistic, varied result set across the demo group.
 */
export const dummyMenuDishes: Dish[] = dishSchema.array().parse([
  {
    id: "fried-rice",
    originalName: "Fried Rice",
    translatedName: null,
    menuDescription: "Wok-fried rice with garlic, soy sauce, and vegetables.",
    price: "Rp35.000",
    listedIngredients: ["rice", "soy sauce", "vegetables", "garlic"],
  },
  {
    id: "fried-chicken-sambal",
    originalName: "Fried Chicken with Sambal and Fresh Vegetables",
    translatedName: null,
    menuDescription: "Crispy fried chicken served with sambal and fresh vegetables.",
    price: "Rp42.000",
    listedIngredients: ["chicken", "chili", "vegetables"],
  },
  {
    id: "chicken-porridge",
    originalName: "Chicken Porridge",
    translatedName: null,
    menuDescription: "Rice porridge with shredded chicken and ginger.",
    price: "Rp28.000",
    listedIngredients: ["rice", "chicken", "ginger"],
  },
  {
    id: "chicken-skewers",
    originalName: "Chicken Skewers",
    translatedName: null,
    menuDescription: "Grilled chicken skewers served with peanut sauce.",
    price: "Rp32.000",
    listedIngredients: ["chicken", "peanut sauce"],
  },
  {
    id: "chicken-soup",
    originalName: "Chicken Soup",
    translatedName: null,
    menuDescription: "Clear chicken broth with vegetables.",
    price: "Rp30.000",
    listedIngredients: ["chicken", "broth", "vegetables"],
  },
  {
    id: "beef-rendang",
    originalName: "Beef Rendang",
    translatedName: null,
    menuDescription: "Slow-cooked beef in coconut milk and spices.",
    price: "Rp48.000",
    listedIngredients: ["beef", "coconut milk", "spices"],
  },
  {
    id: "fried-noodles",
    originalName: "Fried Noodles",
    translatedName: null,
    menuDescription: "Stir-fried noodles with egg, shrimp, and vegetables.",
    price: "Rp36.000",
    listedIngredients: ["noodles", "egg", "shrimp", "vegetables"],
  },
]);
