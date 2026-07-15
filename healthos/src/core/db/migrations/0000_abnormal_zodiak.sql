CREATE TABLE `activity_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`is_dirty` integer DEFAULT 1 NOT NULL,
	`day_date` text NOT NULL,
	`steps` integer,
	`active_kcal` real,
	`distance_m` integer,
	`source` text DEFAULT 'manual' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_activity_day_source` ON `activity_entries` (`day_date`,`source`);--> statement-breakpoint
CREATE TABLE `daily_aggregates` (
	`day_date` text PRIMARY KEY NOT NULL,
	`sleep_minutes` real,
	`nap_minutes` real,
	`sleep_quality` real,
	`bedtime_minute` real,
	`steps` integer,
	`active_kcal` real,
	`workout_count` integer,
	`workout_minutes` real,
	`strength_volume_kg` real,
	`water_ml` integer,
	`caffeine_mg` real,
	`last_caffeine_hour` real,
	`alcohol_units` real,
	`cigarettes` real,
	`vape_sessions` real,
	`kcal` real,
	`protein_g` real,
	`carbs_g` real,
	`fat_g` real,
	`fiber_g` real,
	`sugar_g` real,
	`saturated_fat_g` real,
	`sodium_mg` real,
	`meal_count` integer,
	`micro_coverage_pct` real,
	`weight_kg` real,
	`body_fat_pct` real,
	`mood` real,
	`energy` real,
	`stress` real,
	`libido` real,
	`soreness` real,
	`supplement_adherence_pct` real,
	`logged_modules` integer,
	`health_score` integer,
	`is_stale` integer DEFAULT 1 NOT NULL,
	`computed_at` integer
);
--> statement-breakpoint
CREATE TABLE `body_measurements` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`is_dirty` integer DEFAULT 1 NOT NULL,
	`day_date` text NOT NULL,
	`measured_at` integer NOT NULL,
	`weight_kg` real,
	`body_fat_pct` real,
	`waist_cm` real,
	`chest_cm` real,
	`arm_cm` real,
	`thigh_cm` real,
	`notes` text
);
--> statement-breakpoint
CREATE INDEX `idx_body_day` ON `body_measurements` (`day_date`);--> statement-breakpoint
CREATE TABLE `compound_definitions` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`is_dirty` integer DEFAULT 1 NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`brand` text,
	`default_dose_amount` real,
	`default_dose_unit` text,
	`schedule_json` text,
	`linked_nutrient_key` text,
	`is_active` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `compound_intakes` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`is_dirty` integer DEFAULT 1 NOT NULL,
	`compound_id` text NOT NULL,
	`day_date` text NOT NULL,
	`taken_at` integer NOT NULL,
	`dose_amount` real NOT NULL,
	`dose_unit` text NOT NULL,
	`skipped` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`compound_id`) REFERENCES `compound_definitions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_intake_day` ON `compound_intakes` (`day_date`);--> statement-breakpoint
CREATE TABLE `food_portions` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`is_dirty` integer DEFAULT 1 NOT NULL,
	`food_id` text NOT NULL,
	`name` text NOT NULL,
	`grams` real NOT NULL,
	FOREIGN KEY (`food_id`) REFERENCES `foods`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_portion_food` ON `food_portions` (`food_id`);--> statement-breakpoint
CREATE TABLE `foods` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`is_dirty` integer DEFAULT 1 NOT NULL,
	`name` text NOT NULL,
	`brand` text,
	`barcode` text,
	`source` text DEFAULT 'user' NOT NULL,
	`is_liquid` integer DEFAULT 0 NOT NULL,
	`kcal` real DEFAULT 0 NOT NULL,
	`protein_g` real DEFAULT 0 NOT NULL,
	`carbs_g` real DEFAULT 0 NOT NULL,
	`fat_g` real DEFAULT 0 NOT NULL,
	`fiber_g` real DEFAULT 0,
	`sugar_g` real DEFAULT 0,
	`saturated_fat_g` real DEFAULT 0,
	`monounsat_fat_g` real,
	`polyunsat_fat_g` real,
	`trans_fat_g` real,
	`cholesterol_mg` real,
	`sodium_mg` real,
	`potassium_mg` real,
	`calcium_mg` real,
	`iron_mg` real,
	`magnesium_mg` real,
	`zinc_mg` real,
	`phosphorus_mg` real,
	`selenium_ug` real,
	`copper_mg` real,
	`manganese_mg` real,
	`iodine_ug` real,
	`vitamin_a_ug` real,
	`vitamin_b1_mg` real,
	`vitamin_b2_mg` real,
	`vitamin_b3_mg` real,
	`vitamin_b5_mg` real,
	`vitamin_b6_mg` real,
	`vitamin_b7_ug` real,
	`vitamin_b9_ug` real,
	`vitamin_b12_ug` real,
	`vitamin_c_mg` real,
	`vitamin_d_ug` real,
	`vitamin_e_mg` real,
	`vitamin_k_ug` real,
	`choline_mg` real,
	`caffeine_mg` real,
	`alcohol_g` real,
	`water_g` real
);
--> statement-breakpoint
CREATE INDEX `idx_food_name` ON `foods` (`name`);--> statement-breakpoint
CREATE INDEX `idx_food_barcode` ON `foods` (`barcode`);--> statement-breakpoint
CREATE TABLE `hydration_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`is_dirty` integer DEFAULT 1 NOT NULL,
	`day_date` text NOT NULL,
	`logged_at` integer NOT NULL,
	`amount_ml` integer NOT NULL,
	`kind` text DEFAULT 'water' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_hydration_day` ON `hydration_entries` (`day_date`);--> statement-breakpoint
CREATE TABLE `insights` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`is_dirty` integer DEFAULT 1 NOT NULL,
	`rule_id` text NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`metrics_json` text NOT NULL,
	`severity` text NOT NULL,
	`relevance` real NOT NULL,
	`period_start` text NOT NULL,
	`period_end` text NOT NULL,
	`dedupe_key` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`valid_until` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_insight_dedupe` ON `insights` (`dedupe_key`);--> statement-breakpoint
CREATE TABLE `lab_markers` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`is_dirty` integer DEFAULT 1 NOT NULL,
	`panel_id` text,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`unit` text NOT NULL,
	`description` text,
	`higher_is_worse` integer,
	FOREIGN KEY (`panel_id`) REFERENCES `lab_panels`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `lab_panels` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`is_dirty` integer DEFAULT 1 NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`sort_index` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `lab_reference_ranges` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`is_dirty` integer DEFAULT 1 NOT NULL,
	`marker_id` text NOT NULL,
	`low` real,
	`high` real,
	`optimal_low` real,
	`optimal_high` real,
	`sex` text,
	`age_min` integer,
	`age_max` integer,
	`source_label` text,
	FOREIGN KEY (`marker_id`) REFERENCES `lab_markers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_range_marker` ON `lab_reference_ranges` (`marker_id`);--> statement-breakpoint
CREATE TABLE `lab_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`is_dirty` integer DEFAULT 1 NOT NULL,
	`collected_at` integer NOT NULL,
	`lab_name` text,
	`fasting` integer,
	`notes` text
);
--> statement-breakpoint
CREATE TABLE `lab_results` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`is_dirty` integer DEFAULT 1 NOT NULL,
	`report_id` text NOT NULL,
	`marker_id` text NOT NULL,
	`value` real NOT NULL,
	`unit` text NOT NULL,
	`flag` text,
	FOREIGN KEY (`report_id`) REFERENCES `lab_reports`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`marker_id`) REFERENCES `lab_markers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_result_marker` ON `lab_results` (`marker_id`);--> statement-breakpoint
CREATE INDEX `idx_result_report` ON `lab_results` (`report_id`);--> statement-breakpoint
CREATE TABLE `meal_items` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`is_dirty` integer DEFAULT 1 NOT NULL,
	`meal_id` text NOT NULL,
	`food_id` text NOT NULL,
	`grams` real NOT NULL,
	`portion_id` text,
	FOREIGN KEY (`meal_id`) REFERENCES `meals`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`food_id`) REFERENCES `foods`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_meal_item_meal` ON `meal_items` (`meal_id`);--> statement-breakpoint
CREATE TABLE `meal_template_items` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`is_dirty` integer DEFAULT 1 NOT NULL,
	`template_id` text NOT NULL,
	`food_id` text NOT NULL,
	`grams` real NOT NULL,
	FOREIGN KEY (`template_id`) REFERENCES `meal_templates`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`food_id`) REFERENCES `foods`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_tpl_item_tpl` ON `meal_template_items` (`template_id`);--> statement-breakpoint
CREATE TABLE `meal_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`is_dirty` integer DEFAULT 1 NOT NULL,
	`name` text NOT NULL,
	`slot` text
);
--> statement-breakpoint
CREATE TABLE `meals` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`is_dirty` integer DEFAULT 1 NOT NULL,
	`day_date` text NOT NULL,
	`eaten_at` integer NOT NULL,
	`slot` text NOT NULL,
	`name` text
);
--> statement-breakpoint
CREATE INDEX `idx_meal_day` ON `meals` (`day_date`);--> statement-breakpoint
CREATE TABLE `health_scores` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`is_dirty` integer DEFAULT 1 NOT NULL,
	`day_date` text NOT NULL,
	`score` integer,
	`components_json` text NOT NULL,
	`algo_version` integer NOT NULL,
	`computed_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_score_day` ON `health_scores` (`day_date`);--> statement-breakpoint
CREATE TABLE `goals` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`is_dirty` integer DEFAULT 1 NOT NULL,
	`metric_key` text NOT NULL,
	`target_value` real NOT NULL,
	`direction` text NOT NULL,
	`band_low_pct` real,
	`band_high_pct` real,
	`active_from` text NOT NULL,
	`active_to` text
);
--> statement-breakpoint
CREATE INDEX `idx_goal_metric` ON `goals` (`metric_key`);--> statement-breakpoint
CREATE TABLE `nutrient_targets` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`is_dirty` integer DEFAULT 1 NOT NULL,
	`nutrient_key` text NOT NULL,
	`rda_amount` real NOT NULL,
	`upper_limit` real,
	`unit` text NOT NULL,
	`display_name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_nutrient_key` ON `nutrient_targets` (`nutrient_key`);--> statement-breakpoint
CREATE TABLE `user_profile` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`is_dirty` integer DEFAULT 1 NOT NULL,
	`sex` text,
	`birth_date` text,
	`height_cm` real,
	`timezone` text NOT NULL,
	`unit_system` text DEFAULT 'metric' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sleep_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`is_dirty` integer DEFAULT 1 NOT NULL,
	`day_date` text NOT NULL,
	`start_at` integer NOT NULL,
	`end_at` integer NOT NULL,
	`is_nap` integer DEFAULT 0 NOT NULL,
	`quality_rating` integer,
	`awakenings` integer,
	`source` text DEFAULT 'manual' NOT NULL,
	`notes` text
);
--> statement-breakpoint
CREATE INDEX `idx_sleep_day` ON `sleep_sessions` (`day_date`);--> statement-breakpoint
CREATE TABLE `substance_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`is_dirty` integer DEFAULT 1 NOT NULL,
	`day_date` text NOT NULL,
	`consumed_at` integer NOT NULL,
	`type` text NOT NULL,
	`label` text,
	`quantity` real DEFAULT 1 NOT NULL,
	`volume_ml` integer,
	`caffeine_mg` real,
	`alcohol_grams` real,
	`nicotine_mg` real,
	`kcal` real
);
--> statement-breakpoint
CREATE INDEX `idx_substance_day` ON `substance_entries` (`day_date`);--> statement-breakpoint
CREATE INDEX `idx_substance_type` ON `substance_entries` (`type`);--> statement-breakpoint
CREATE TABLE `app_meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sync_state` (
	`table_name` text PRIMARY KEY NOT NULL,
	`last_pulled_at` integer,
	`last_pushed_at` integer
);
--> statement-breakpoint
CREATE TABLE `daily_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`is_dirty` integer DEFAULT 1 NOT NULL,
	`day_date` text NOT NULL,
	`content` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_note_day` ON `daily_notes` (`day_date`);--> statement-breakpoint
CREATE TABLE `wellbeing_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`is_dirty` integer DEFAULT 1 NOT NULL,
	`day_date` text NOT NULL,
	`logged_at` integer NOT NULL,
	`mood` integer,
	`energy` integer,
	`stress` integer,
	`libido` integer,
	`soreness` integer,
	`soreness_area` text
);
--> statement-breakpoint
CREATE INDEX `idx_wellbeing_day` ON `wellbeing_entries` (`day_date`);--> statement-breakpoint
CREATE TABLE `exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`is_dirty` integer DEFAULT 1 NOT NULL,
	`name` text NOT NULL,
	`muscle_group` text NOT NULL,
	`equipment` text,
	`is_custom` integer DEFAULT 0 NOT NULL,
	`notes` text
);
--> statement-breakpoint
CREATE TABLE `workout_exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`is_dirty` integer DEFAULT 1 NOT NULL,
	`workout_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`order_index` integer NOT NULL,
	`notes` text,
	FOREIGN KEY (`workout_id`) REFERENCES `workouts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_wex_workout` ON `workout_exercises` (`workout_id`);--> statement-breakpoint
CREATE TABLE `workout_sets` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`is_dirty` integer DEFAULT 1 NOT NULL,
	`workout_exercise_id` text NOT NULL,
	`set_index` integer NOT NULL,
	`reps` integer,
	`weight_kg` real,
	`rpe` real,
	`is_warmup` integer DEFAULT 0 NOT NULL,
	`duration_s` integer,
	`distance_m` integer,
	FOREIGN KEY (`workout_exercise_id`) REFERENCES `workout_exercises`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_set_wex` ON `workout_sets` (`workout_exercise_id`);--> statement-breakpoint
CREATE TABLE `workouts` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`is_dirty` integer DEFAULT 1 NOT NULL,
	`day_date` text NOT NULL,
	`type` text NOT NULL,
	`title` text,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	`perceived_exertion` integer,
	`kcal_burned` real,
	`distance_m` integer,
	`avg_hr` integer,
	`notes` text
);
--> statement-breakpoint
CREATE INDEX `idx_workout_day` ON `workouts` (`day_date`);