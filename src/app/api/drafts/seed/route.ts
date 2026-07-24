import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/core/db/init-db';
import { db } from '@/core/db';
import { aiDrafts } from '@/core/db/schema';

export async function GET(request: Request) {
  try {
    await initializeDatabase();
    const draftId = crypto.randomUUID();
    const now = new Date().toISOString();

    const sampleDrafts = [
      {
        title: 'Classic French Onion Soup',
        slug: 'classic-french-onion-soup',
        contentType: 'recipe',
        summary: 'Rich beef broth loaded with caramelized onions, topped with toasted baguette and melted Gruyère cheese.',
        servings: 6,
        prepTimeMinutes: 20,
        cookTimeMinutes: 60,
        cuisine: 'French',
        difficulty: 'medium',
        imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80',
        ingredients: [
          { itemName: 'Yellow Onions', amount: 5, unit: 'large', notes: 'thinly sliced' },
          { itemName: 'Unsalted Butter', amount: 3, unit: 'tbsp', notes: 'melted' },
          { itemName: 'Beef Stock or Broth', amount: 6, unit: 'cups', notes: 'rich & dark' },
          { itemName: 'Dry White Wine', amount: 0.5, unit: 'cup', notes: 'for deglazing' },
          { itemName: 'French Baguette', amount: 6, unit: 'slices', notes: 'toasted' },
          { itemName: 'Gruyère Cheese', amount: 1.5, unit: 'cups', notes: 'shredded' },
        ],
        instructions: [
          { stepNumber: 1, instructionText: 'Melt butter in a heavy Dutch oven over medium-low heat. Add sliced onions and cook slowly for 45 minutes until deep golden brown and caramelized.', timerMinutes: 45 },
          { stepNumber: 2, instructionText: 'Deglaze the pot with dry white wine, scraping up browned bits from the bottom. Simmer for 3 minutes.', timerMinutes: 3 },
          { stepNumber: 3, instructionText: 'Pour in rich beef stock, season with thyme, salt, and black pepper. Simmer gently for 20 minutes.', timerMinutes: 20 },
          { stepNumber: 4, instructionText: 'Ladle hot soup into oven-safe ramekins. Top with toasted baguette slices and mound generously with shredded Gruyère. Broil until bubbly and browned.', timerMinutes: 4 },
        ],
        tags: ['French', 'Soup', 'Comfort Food', 'Cheese'],
        reason: 'Scraped physical recipe card scan via OCR. Extracted 6 ingredients and 4 step instructions with 96% confidence score.',
      },
      {
        title: 'Crispy Double Smash Burger with Secret Sauce',
        slug: 'crispy-double-smash-burger',
        contentType: 'recipe',
        summary: 'Ultra-crispy lacy-edged beef patties with melted American cheese, pickles, and tangy secret burger sauce.',
        servings: 2,
        prepTimeMinutes: 10,
        cookTimeMinutes: 8,
        cuisine: 'American',
        difficulty: 'easy',
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
        ingredients: [
          { itemName: '80/20 Ground Beef', amount: 0.5, unit: 'lbs', notes: 'rolled into 2oz balls' },
          { itemName: 'American Cheese Slices', amount: 2, unit: 'slices', notes: 'melted' },
          { itemName: 'Brioche Burger Buns', amount: 2, unit: 'whole', notes: 'butter toasted' },
          { itemName: 'Dill Pickle Chips', amount: 6, unit: 'slices', notes: 'crisp' },
          { itemName: 'Mayonnaise & Mustard Sauce', amount: 3, unit: 'tbsp', notes: 'secret sauce' },
        ],
        instructions: [
          { stepNumber: 1, instructionText: 'Heat a heavy cast-iron skillet until smoking hot. Place beef balls on skillet.', timerMinutes: 1 },
          { stepNumber: 2, instructionText: 'Smash patties paper-thin with a heavy spatula. Season generously with salt and black pepper.', timerMinutes: 2 },
          { stepNumber: 3, instructionText: 'Flip patties once lacy brown edges form. Top with American cheese and stack patties together onto toasted brioche buns.', timerMinutes: 2 },
        ],
        tags: ['American', 'Burger', 'Fast & Easy', 'Street Food'],
        reason: 'Parsed text paste from recipe blog. Extracted 5 ingredients and 3 cooking instructions with 99% confidence score.',
      },
    ];

    // Pick random sample
    const sample = sampleDrafts[Math.floor(Math.random() * sampleDrafts.length)];

    await db.insert(aiDrafts).values({
      id: draftId,
      targetContentType: sample.contentType as any,
      proposedDataJSON: JSON.stringify(sample),
      reason: sample.reason,
      provider: 'openai',
      model: 'gpt-4o-mini',
      confidence: 97,
      tokenUsage: 380,
      latencyMs: 720,
      promptVersion: 'v1.0',
      createdBy: 'ai_gateway',
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.redirect(new URL(`/drafts/${draftId}`, request.url));
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: String(error) },
      { status: 500 }
    );
  }
}
