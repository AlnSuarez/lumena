import os

def make_dynamic_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        changed = False
        prod_url = "https://backend-production-5015.up.railway.app"
        
        # Replace occurrences of "https://backend-production-5015.up.railway.app/api"
        if f'"{prod_url}/api"' in content:
            content = content.replace(f'"{prod_url}/api"', '`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api`')
            changed = True
        elif f"'{prod_url}/api'" in content:
            content = content.replace(f"'{prod_url}/api'", '`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api`')
            changed = True
            
        # Replace occurrences of "https://backend-production-5015.up.railway.app"
        if f'"{prod_url}"' in content:
            content = content.replace(f'"{prod_url}"', '(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")')
            changed = True
        elif f"'{prod_url}'" in content:
            content = content.replace(f"'{prod_url}'", '(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")')
            changed = True
            
        # Replace occurrences in template literals e.g. `https://backend-production-5015.up.railway.app${url}`
        if prod_url in content:
            content = content.replace(prod_url, '${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}')
            changed = True

        if changed:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Made dynamic: {filepath}")
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

def walk_and_make_dynamic(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.js', '.jsx', '.ts', '.tsx')):
                filepath = os.path.join(root, file)
                make_dynamic_in_file(filepath)

if __name__ == "__main__":
    target_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'src'))
    print(f"Converting URLs to dynamic expressions in: {target_dir}")
    walk_and_make_dynamic(target_dir)
    print("All URLs are now dynamic!")
