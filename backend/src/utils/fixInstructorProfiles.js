/**
 * fixInstructorProfiles.js
 * ────────────────────────
 * One-time utility script to find all users with role="instructor"
 * who do NOT have a matching record in the `instructors` table,
 * and creates one with empty bio/specialization.
 *
 * Usage:  node --experimental-specifier-resolution=node src/utils/fixInstructorProfiles.js
 *   or:   node src/utils/fixInstructorProfiles.js
 */

import { User, Instructor } from "../models/index.js";
import { sequelize } from "../config/index.js";
import { Op } from "sequelize";

const fix = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");

    // Find all instructor users
    const instructorUsers = await User.findAll({
      where: { role: "instructor" },
      attributes: ["user_id", "name", "email"],
    });

    console.log(`Found ${instructorUsers.length} user(s) with role = "instructor"`);

    let created = 0;
    let skipped = 0;

    for (const user of instructorUsers) {
      const existing = await Instructor.findByPk(user.user_id);
      if (existing) {
        skipped++;
        continue;
      }

      await Instructor.create({
        user_id: user.user_id,
        bio: null,
        specialization: null,
      });
      created++;
      console.log(`  ✅ Created instructor profile for user_id=${user.user_id} (${user.email})`);
    }

    console.log(`\nDone! Created: ${created}, Already existed: ${skipped}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

fix();
