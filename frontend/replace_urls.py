import os

def replace_in_file(filepath, old_str, new_str):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if old_str in content:
            updated_content = content.replace(old_str, new_str)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(updated_content)
            print(f"Updated: {filepath}")
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

def walk_and_replace(directory, old_str, new_str):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.js', '.jsx', '.ts', '.tsx', '.json', '.html')):
                filepath = os.path.join(root, file)
                replace_in_file(filepath, old_str, new_str)

if __name__ == "__main__":
    target_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'src'))
    old_url = "http://localhost:8000"
    new_url = "https://backend-production-5015.up.railway.app"
    
    print(f"Starting URL replacement in: {target_dir}")
    print(f"Replacing '{old_url}' with '{new_url}'...")
    walk_and_replace(target_dir, old_url, new_url)
    print("URL replacement completed successfully!")
