import os

filepath = "db_backup.json"
if os.path.exists(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        lines = f.readlines()

    # Find where the JSON array starts
    start_index = -1
    for idx, line in enumerate(lines):
        if line.strip() == '[':
            start_index = idx
            break

    if start_index != -1:
        clean_lines = lines[start_index:]
        with open(filepath, "w", encoding="utf-8") as f:
            f.writelines(clean_lines)
        print(f"Success: Stripped {start_index} debug lines. File now starts with '['.")
    else:
        print("Error: Could not find the starting '[' of the JSON array.")
else:
    print("Error: db_backup.json not found.")
