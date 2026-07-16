import os

filepath = "db_backup.json"
if os.path.exists(filepath):
    with open(filepath, "rb") as f:
        content = f.read()

    # Detect UTF-16 LE BOM
    if content.startswith(b'\xff\xfe'):
        try:
            text = content.decode('utf-16')
            content_utf8 = text.encode('utf-8')
            with open(filepath, "wb") as f:
                f.write(content_utf8)
            print("Success: Converted UTF-16 LE to UTF-8.")
        except Exception as e:
            print(f"Error converting UTF-16 LE: {e}")
    # Detect UTF-16 BE BOM
    elif content.startswith(b'\xfe\xff'):
        try:
            text = content.decode('utf-16-be')
            content_utf8 = text.encode('utf-8')
            with open(filepath, "wb") as f:
                f.write(content_utf8)
            print("Success: Converted UTF-16 BE to UTF-8.")
        except Exception as e:
            print(f"Error converting UTF-16 BE: {e}")
    else:
        print("Encoding is already UTF-8 or standard ASCII.")
else:
    print("Error: db_backup.json not found.")
