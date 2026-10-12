
require("dotenv").config();

const bcrypt = require("bcrypt");
const { Pool } = require("pg");
const readline = require("node:readline");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function main() {
  try {
    const email = (
      await ask("Enter admin email: ")
    ).trim().toLowerCase();

    const password = await ask("Enter new password: ");

    if (password.length < 8 || password.length > 72) {
      throw new Error(
        "Password must be between 8 and 72 characters."
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `
      UPDATE admin_users
      SET password_hash = $1
      WHERE LOWER(email) = $2
      RETURNING id, email
      `,
      [passwordHash, email]
    );

    if (result.rowCount === 0) {
      console.log("Admin account not found.");
    } else {
      console.log(
        "Password updated successfully for:",
        result.rows[0].email
      );
    }
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    rl.close();
    await pool.end();
  }
}

main();
