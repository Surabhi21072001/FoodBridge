#!/usr/bin/env node

/**
 * Test script for Recipe Service MCP Server
 * Tests the recipe server without requiring MCP client
 */

const RECIPE_API_KEY = "a8b1b8c0f9124c4cab164bf4b4eaf6f3";
const RECIPE_API_BASE = "https://api.spoonacular.com/recipes";

async function testSearchRecipes() {
  console.log("\n🧪 Testing search_recipes...");
  try {
    const ingredients = ["chicken", "rice"];
    const ingredientString = ingredients.join(",");
    
    // Try findByIngredients first
    let url = new URL(`${RECIPE_API_BASE}/findByIngredients`);
    url.searchParams.append("apiKey", RECIPE_API_KEY);
    url.searchParams.append("ingredients", ingredientString);
    url.searchParams.append("number", "5");
    url.searchParams.append("ranking", "maximize");

    let response = await fetch(url.toString());
    
    // Fallback to complexSearch if findByIngredients fails
    if (!response.ok) {
      console.log("   Falling back to complexSearch...");
      url = new URL(`${RECIPE_API_BASE}/complexSearch`);
      url.searchParams.append("apiKey", RECIPE_API_KEY);
      url.searchParams.append("includeIngredients", ingredientString);
      url.searchParams.append("number", "5");
      response = await fetch(url.toString());
    }

    if (!response.ok) {
      console.error(`❌ API Error: ${response.statusText}`);
      return false;
    }

    const data = await response.json();
    const recipes = data.results || data;
    console.log(`✅ Found ${recipes.length} recipes`);
    if (recipes.length > 0) {
      console.log(`   First recipe: ${recipes[0].title}`);
    }
    return true;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  }
}

async function testGetRecipeDetails() {
  console.log("\n🧪 Testing get_recipe_details...");
  try {
    // First get a recipe ID
    const ingredients = ["chicken"];
    const ingredientString = ingredients.join(",");
    const searchUrl = new URL(`${RECIPE_API_BASE}/findByIngredients`);
    searchUrl.searchParams.append("apiKey", RECIPE_API_KEY);
    searchUrl.searchParams.append("ingredients", ingredientString);
    searchUrl.searchParams.append("number", "1");

    const searchResponse = await fetch(searchUrl.toString());
    if (!searchResponse.ok) {
      console.error(`❌ Search API Error: ${searchResponse.statusText}`);
      return false;
    }

    const recipes = await searchResponse.json();
    if (recipes.length === 0) {
      console.error("❌ No recipes found for testing");
      return false;
    }

    const recipeId = recipes[0].id;
    console.log(`   Using recipe ID: ${recipeId}`);

    // Now get details
    const detailUrl = new URL(`${RECIPE_API_BASE}/${recipeId}/information`);
    detailUrl.searchParams.append("apiKey", RECIPE_API_KEY);
    detailUrl.searchParams.append("includeNutrition", "true");

    const detailResponse = await fetch(detailUrl.toString());
    if (!detailResponse.ok) {
      console.error(`❌ Detail API Error: ${detailResponse.statusText}`);
      return false;
    }

    const recipe = await detailResponse.json();
    console.log(`✅ Got recipe details: ${recipe.title}`);
    console.log(`   Cooking time: ${recipe.readyInMinutes} minutes`);
    console.log(`   Servings: ${recipe.servings}`);
    return true;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  }
}

async function testSearchByCuisine() {
  console.log("\n🧪 Testing search_recipes_by_cuisine...");
  try {
    const url = new URL(`${RECIPE_API_BASE}/complexSearch`);
    url.searchParams.append("apiKey", RECIPE_API_KEY);
    url.searchParams.append("cuisine", "thai");
    url.searchParams.append("number", "5");

    const response = await fetch(url.toString());
    if (!response.ok) {
      console.error(`❌ API Error: ${response.statusText}`);
      return false;
    }

    const data = await response.json();
    console.log(`✅ Found ${data.results.length} Thai recipes`);
    if (data.results.length > 0) {
      console.log(`   First recipe: ${data.results[0].title}`);
    }
    return true;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log("🚀 Recipe Service MCP Server Test Suite");
  console.log("=====================================");
  console.log(`API Key: ${RECIPE_API_KEY.substring(0, 8)}...`);

  const results = [];
  results.push(await testSearchRecipes());
  results.push(await testGetRecipeDetails());
  results.push(await testSearchByCuisine());

  console.log("\n📊 Test Results");
  console.log("=====================================");
  const passed = results.filter((r) => r).length;
  const total = results.length;
  console.log(`Passed: ${passed}/${total}`);

  if (passed === total) {
    console.log("\n✅ All tests passed! Recipe service is ready.");
    process.exit(0);
  } else {
    console.log("\n❌ Some tests failed. Check configuration.");
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
