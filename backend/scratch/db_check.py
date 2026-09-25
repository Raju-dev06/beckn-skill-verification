import mysql.connector

try:
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="skill_verification"
    )
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, name, email FROM users")
    users = cursor.fetchall()
    print("USERS:", users)
    
    for u in users:
        cursor.execute(f"SELECT skill_id, verification_status FROM candidate_skill WHERE candidate_id = {u[0]}")
        skills = cursor.fetchall()
        print(f"Skills for {u[1]}:", skills)
        
    conn.close()
except Exception as e:
    print(e)
