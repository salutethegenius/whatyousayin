"""
Seed script to populate the database with default rooms
Run with: python -m scripts.seed_rooms
"""
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext

# Database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://whatyousayin:whatyousayin@db:5432/whatyousayin")

# Create engine and session
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def seed_rooms():
    """Create default rooms for the platform"""
    db = SessionLocal()
    
    try:
        # Check if rooms already exist
        result = db.execute(text("SELECT COUNT(*) FROM rooms"))
        count = result.scalar()
        if count > 0:
            print(f"Database already has {count} rooms. Skipping seed.")
            return
        
        # Check for system user, create if not exists
        result = db.execute(text("SELECT id FROM users WHERE username = 'system'"))
        system_user_row = result.fetchone()
        
        if system_user_row:
            system_user_id = system_user_row[0]
        else:
            hashed_pw = pwd_context.hash("system-password-not-for-login")
            db.execute(text("""
                INSERT INTO users (username, email, hashed_password, is_admin, is_active)
                VALUES (:username, :email, :password, :is_admin, :is_active)
            """), {
                "username": "system",
                "email": "system@whatyousayin.com",
                "password": hashed_pw,
                "is_admin": True,
                "is_active": True
            })
            db.commit()
            result = db.execute(text("SELECT id FROM users WHERE username = 'system'"))
            system_user_id = result.scalar()
            print("Created system user")
        
        # Default rooms
        default_rooms = [
            ("Nassau Vibes", "General chat for Nassau locals and visitors", True),
            ("Island Life", "Share your island experiences and stories", True),
            ("Sports Talk", "Discuss Bahamian sports and international games", True),
            ("Music Corner", "Junkanoo, rake-n-scrape, and everything music", True),
            ("Food & Culture", "Bahamian cuisine, recipes, and cultural discussions", True),
            ("Tech & Gaming", "Technology news and gaming discussions", True),
        ]
        
        for name, description, is_public in default_rooms:
            db.execute(text("""
                INSERT INTO rooms (name, description, is_public, created_by)
                VALUES (:name, :description, :is_public, :created_by)
            """), {
                "name": name,
                "description": description,
                "is_public": is_public,
                "created_by": system_user_id
            })
            print(f"Created room: {name}")
        
        db.commit()
        print(f"\nSuccessfully seeded {len(default_rooms)} rooms!")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_rooms()

