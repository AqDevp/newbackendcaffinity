const express = require("express");
const router = express.Router();
const Recipe = require("../models/Recipe");
const auth = require("../middleware/auth");

// Get all recipes
router.get("/", async (req, res) => {
  try {
    const recipes = await Recipe.find().sort({ date: 1 });

    if (req.user) {
      const recipesWithUserReaction = recipes.map(recipe => {
        const userReaction = recipe.userReactions.find(
          r => r.user.toString() === req.user.id
        );

        return {
          ...recipe._doc,
          userReaction: userReaction ? userReaction.reaction : null
        };
      });

      return res.json(recipesWithUserReaction);
    }

    res.json(recipes);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// Add a new recipe (admin only in a real app)
router.post("/", auth, async (req, res) => {
  const { title, description, image, recipe } = req.body;

  try {
    const newRecipe = new Recipe({
      title,
      description,
      image,
      recipe
    });

    const recipeDoc = await newRecipe.save();
    res.status(201).json(recipeDoc);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// React to a recipe
router.post("/:id/react", auth, async (req, res) => {
  const { reaction } = req.body;

  if (!["like", "dislike", "neutral"].includes(reaction)) {
    return res.status(400).json({ message: "Invalid reaction" });
  }

  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    // Check if user has already reacted to this recipe
    const userReactionIndex = recipe.userReactions.findIndex(
      r => r.user.toString() === req.user.id
    );

    if (userReactionIndex !== -1) {
      const previousReaction = recipe.userReactions[userReactionIndex].reaction;

      // Decrement previous reaction count
      recipe.reactions[`${previousReaction}s`]--;

      if (previousReaction === reaction) {
        recipe.userReactions.splice(userReactionIndex, 1);
      } else {
        recipe.userReactions[userReactionIndex].reaction = reaction;
        recipe.reactions[`${reaction}s`]++;
      }
    } else {
      recipe.userReactions.push({
        user: req.user.id,
        reaction
      });
      recipe.reactions[`${reaction}s`]++;
    }

    await recipe.save();
    res.json({ reactions: recipe.reactions });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// Fetch recommended coffees (top liked recipes)
router.get("/recommendations", async (req, res) => {
  try {
    // Fetch top 5 most liked recipes
    const recipes = await Recipe.find().sort({ "reactions.likes": -1 }).limit(5); // Top 5 liked coffees

    res.json(recipes);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// Fetch user reactions (for the current user)
router.get("/user-reactions", auth, async (req, res) => {
  try {
    // Fetch all recipes where the current user has reacted
    const recipes = await Recipe.find({
      "userReactions.user": req.user.id
    });

    // Map the data to return only the title and the user's reaction
    const userReactions = recipes.map(recipe => {
      const userReaction = recipe.userReactions.find(
        r => r.user.toString() === req.user.id
      );
      return {
        title: recipe.title,
        reaction: userReaction ? userReaction.reaction : null
      };
    });

    res.json(userReactions);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
