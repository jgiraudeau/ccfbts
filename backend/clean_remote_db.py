
import os
import psycopg2
from urllib.parse import urlparse

# URL de la base de données Railway (récupérée de votre navigateur précédemment)
DATABASE_URL = "postgresql://postgres:wRjChVvNnvfBccRjKzGkCqOPlQbLTVmK@roundhouse.proxy.rlwy.net:21639/railway"

def clean_database():
    try:
        conn = psycopg2.connect(DATABASE_URL, sslmode='require')
        cur = conn.cursor()
        
        print("Connected to PostgreSQL Database on Railway...")
        
        # 1. Supprimer les scores
        cur.execute("DELETE FROM evaluation_scores;")
        print(f"Deleted scores: {cur.rowcount}")

        # 2. Supprimer les pièces jointes
        cur.execute("DELETE FROM evaluation_attachments;")
        print(f"Deleted attachments: {cur.rowcount}")

        # 3. Supprimer les évaluations
        cur.execute("DELETE FROM evaluations;")
        print(f"Deleted evaluations: {cur.rowcount}")

        # 4. Supprimer les soumissions étudiants
        cur.execute("DELETE FROM student_submissions;")
        print(f"Deleted submissions: {cur.rowcount}")

        # 5. Supprimer les ETUDIANTS (mais garder les profs)
        cur.execute("DELETE FROM users WHERE role = 'student';")
        print(f"Deleted students: {cur.rowcount}")

        conn.commit()
        cur.close()
        conn.close()
        print("\nSUCCESS: Database cleaned successfully!")
        
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    confirm = input("ATTENTION: Cela va supprimer TOUS les étudiants et leurs données de la PROD. Tapez 'OUI' pour confirmer: ")
    if confirm == "OUI":
        clean_database()
    else:
        print("Annulé.")
