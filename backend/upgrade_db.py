import sqlite3

def add_column(cursor, table_name, column_name, data_type):
    try:
        cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {data_type}")
        print(f"Added column {column_name} to {table_name}")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e).lower():
            print(f"Column {column_name} already exists in {table_name}")
        else:
            print(f"Error adding {column_name}: {e}")

conn = sqlite3.connect("profvirtuel-v2.db")
cursor = conn.cursor()

# Add columns to users table
add_column(cursor, "users", "class_code", "TEXT")
add_column(cursor, "users", "student_password", "TEXT DEFAULT '0000'")
add_column(cursor, "users", "teacher_id", "INTEGER REFERENCES users(id)")

# Create StudentSubmission table if not exists (Create_all might have missed it if main didn't import it at start?)
# No, create_all should handle new tables. But let's let SQLAlchemy handle new tables by running init_db again after this fixes usage.

conn.commit()
conn.close()
print("Database schema updated.")
