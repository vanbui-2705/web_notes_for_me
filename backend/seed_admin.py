import sqlite3
import os

db_path = r"e:\Web\web-note-app\backend\test.db"
if not os.path.exists(db_path):
    print("❌ Database file does not exist!")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 1. Alter table to add column 'is_admin' if it doesn't exist
try:
    cursor.execute("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0;")
    conn.commit()
    print("✅ Successfully added 'is_admin' column to 'users' table!")
except sqlite3.OperationalError as e:
    # Column already exists
    if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
        print("ℹ️ 'is_admin' column already exists in 'users' table.")
    else:
        print(f"⚠️ Warning altering table: {e}")

# 2. Promote target user to admin
target_email = "vanbv.a3k48gtb@gmail.com"

# Check if user exists
cursor.execute("SELECT id, username, email, is_admin FROM users WHERE email = ?;", (target_email,))
user = cursor.fetchone()

if user:
    user_id, username, email, is_admin = user
    cursor.execute("UPDATE users SET is_admin = 1 WHERE email = ?;", (target_email,))
    conn.commit()
    print(f"🎉 Successfully promoted user '{username}' ({target_email}) to ADMIN!")
else:
    print(f"ℹ️ User with email '{target_email}' does not exist in database yet.")
    print("Checking other users in database...")
    cursor.execute("SELECT id, username, email, is_admin FROM users;")
    all_users = cursor.fetchall()
    if all_users:
        print("Current users in database:")
        for u in all_users:
            print(f"  - ID: {u[0]}, Username: {u[1]}, Email: {u[2]}, Admin: {u[3]}")
    else:
        print("No users found in database.")

conn.close()
