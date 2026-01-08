<?php

namespace Database\Factories;

use App\Models\DailyWork;
use App\Models\RfiObjection;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\RfiObjection>
 */
class RfiObjectionFactory extends Factory
{
    protected $model = RfiObjection::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $categories = RfiObjection::$categories;
        $category = $this->faker->randomElement($categories);

        return [
            'daily_work_id' => DailyWork::factory(),
            'title' => $this->generateTitle($category),
            'category' => $category,
            'description' => $this->faker->paragraph(3),
            'reason' => $this->faker->paragraph(2),
            'status' => RfiObjection::STATUS_DRAFT,
            'resolution_notes' => null,
            'resolved_by' => null,
            'resolved_at' => null,
            'created_by' => User::factory(),
            'updated_by' => null,
            'was_overridden' => false,
            'override_reason' => null,
            'overridden_by' => null,
            'overridden_at' => null,
        ];
    }

    /**
     * Generate a realistic objection title based on category.
     */
    private function generateTitle(string $category): string
    {
        return match ($category) {
            RfiObjection::CATEGORY_DESIGN_CONFLICT => $this->faker->randomElement([
                'Design discrepancy in foundation depth',
                'Structural reinforcement does not match drawings',
                'Column dimensions differ from approved plans',
                'Beam span exceeds design specifications',
            ]),
            RfiObjection::CATEGORY_SITE_MISMATCH => $this->faker->randomElement([
                'Ground level differs from survey data',
                'Existing utilities not shown on plans',
                'Site access restricted by unforeseen obstacles',
                'Water table higher than expected',
            ]),
            RfiObjection::CATEGORY_MATERIAL_CHANGE => $this->faker->randomElement([
                'Specified material unavailable in market',
                'Alternative material proposed for approval',
                'Material quality does not meet specifications',
                'Supplier unable to provide required grade',
            ]),
            RfiObjection::CATEGORY_SAFETY_CONCERN => $this->faker->randomElement([
                'Inadequate safety barriers at work zone',
                'Scaffolding does not meet safety standards',
                'Electrical hazard identified on site',
                'Confined space entry procedures not followed',
            ]),
            RfiObjection::CATEGORY_SPECIFICATION_ERROR => $this->faker->randomElement([
                'Specification contradicts drawing details',
                'Technical specification unclear or ambiguous',
                'Testing frequency not defined in specs',
                'Quality control procedure missing from specification',
            ]),
            RfiObjection::CATEGORY_OTHER => $this->faker->randomElement([
                'Clarification needed on construction sequence',
                'Weather conditions affecting planned activities',
                'Third-party delay impacting schedule',
                'Additional information required for execution',
            ]),
            default => 'General objection requiring clarification',
        };
    }

    /**
     * Indicate that the objection is in draft status.
     */
    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => RfiObjection::STATUS_DRAFT,
        ]);
    }

    /**
     * Indicate that the objection is submitted.
     */
    public function submitted(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => RfiObjection::STATUS_SUBMITTED,
        ]);
    }

    /**
     * Indicate that the objection is under review.
     */
    public function underReview(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => RfiObjection::STATUS_UNDER_REVIEW,
        ]);
    }

    /**
     * Indicate that the objection is resolved.
     */
    public function resolved(?User $resolver = null): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => RfiObjection::STATUS_RESOLVED,
            'resolution_notes' => $this->faker->paragraph(2),
            'resolved_by' => $resolver?->id ?? User::factory(),
            'resolved_at' => $this->faker->dateTimeBetween('-7 days', 'now'),
        ]);
    }

    /**
     * Indicate that the objection is rejected.
     */
    public function rejected(?User $resolver = null): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => RfiObjection::STATUS_REJECTED,
            'resolution_notes' => $this->faker->paragraph(2),
            'resolved_by' => $resolver?->id ?? User::factory(),
            'resolved_at' => $this->faker->dateTimeBetween('-7 days', 'now'),
        ]);
    }

    /**
     * Set a specific category.
     */
    public function category(string $category): static
    {
        return $this->state(fn (array $attributes) => [
            'category' => $category,
            'title' => $this->generateTitle($category),
        ]);
    }

    /**
     * Set as design conflict objection.
     */
    public function designConflict(): static
    {
        return $this->category(RfiObjection::CATEGORY_DESIGN_CONFLICT);
    }

    /**
     * Set as site mismatch objection.
     */
    public function siteMismatch(): static
    {
        return $this->category(RfiObjection::CATEGORY_SITE_MISMATCH);
    }

    /**
     * Set as material change objection.
     */
    public function materialChange(): static
    {
        return $this->category(RfiObjection::CATEGORY_MATERIAL_CHANGE);
    }

    /**
     * Set as safety concern objection.
     */
    public function safetyConcern(): static
    {
        return $this->category(RfiObjection::CATEGORY_SAFETY_CONCERN);
    }

    /**
     * Set as specification error objection.
     */
    public function specificationError(): static
    {
        return $this->category(RfiObjection::CATEGORY_SPECIFICATION_ERROR);
    }

    /**
     * Set a specific creator.
     */
    public function createdBy(User $user): static
    {
        return $this->state(fn (array $attributes) => [
            'created_by' => $user->id,
        ]);
    }

    /**
     * Set for a specific daily work.
     */
    public function forDailyWork(DailyWork $dailyWork): static
    {
        return $this->state(fn (array $attributes) => [
            'daily_work_id' => $dailyWork->id,
        ]);
    }

    /**
     * Set as overridden (for submission date changes).
     */
    public function overridden(?User $overrideUser = null, ?string $reason = null): static
    {
        return $this->state(fn (array $attributes) => [
            'was_overridden' => true,
            'override_reason' => $reason ?? $this->faker->sentence(),
            'overridden_by' => $overrideUser?->id ?? User::factory(),
            'overridden_at' => $this->faker->dateTimeBetween('-7 days', 'now'),
        ]);
    }
}
