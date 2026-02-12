from sqlalchemy import create_engine, text
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./profvirtuel-v2.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)

def upgrade():
    with engine.connect() as conn:
        print(f"Checking 'deadlines' table in {DATABASE_URL}...")
        try:
            # Check if teacher_id exists
            result = conn.execute(text("PRAGMA table_info(deadlines)")).fetchall()
            columns = [row[1] for row in result]
            
            if 'teacher_id' not in columns:
                print("Adding 'teacher_id' column to 'deadlines' table...")
                conn.execute(text("ALTER TABLE deadlines ADD COLUMN teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE"))
                conn.commit()
                print("Column added successfully.")
            else:
                print("'teacher_id' column already exists.")
                
        except Exception as e:
            print(f"Error during upgrade: {e}")

if __name__ == "__main__":
    upgrade()
