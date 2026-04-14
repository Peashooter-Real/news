import re

# อ่านไฟล์ dist/index.html
with open('c:/Users/User/Downloads/news/dist/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# ย้าย script จาก head ไปไว้ล่างสุดของ body
# 1. หาโค้ด script
script_match = re.search(r'<script>(.*?)</script>', content, re.DOTALL)
if script_match:
    script_code = script_match.group(0)
    # ลบ script ออกจากตำแหน่งเดิม
    content = content.replace(script_code, '')
    # เอาไปวางหลัง <div id="root"></div>
    content = content.replace('<div id="root"></div>', '<div id="root"></div>\n    ' + script_code)

# เขียนลงไฟล์ index.html (ตัวนอกสุด)
with open('c:/Users/User/Downloads/news/index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed index.html: Moved script to end of body to prevent Error #299")
