import pymysql, datetime, bcrypt

conn = pymysql.connect(host='localhost', user='root', password='root', db='homeservices')
cur = conn.cursor()

cur.execute('SELECT id, role FROM users WHERE email = %s', ('admin@homeservice.com',))
row = cur.fetchone()
if row:
    print('Admin user exists, id=', row[0], 'role=', row[1])
else:
    pw_hash = bcrypt.hashpw(b'Admin@123', bcrypt.gensalt()).decode()
    cur.execute(
        'INSERT INTO users (role, full_name, email, password_hash, account_status, created_at, updated_at) VALUES (%s,%s,%s,%s,%s,%s,%s)',
        ('SUPER_ADMIN', 'Platform Admin', 'admin@homeservice.com', pw_hash, 'ACTIVE', datetime.datetime.now(), datetime.datetime.now())
    )
    conn.commit()
    print('Created admin user, id=', cur.lastrowid)

conn.close()
