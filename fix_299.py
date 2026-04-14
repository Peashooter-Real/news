import re

# อ่านไฟล์ dist/index.html
with open('c:/Users/User/Downloads/news/dist/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# ย้าย script (แบบที่รองรับทุก Attributes)
# ค้นหา <script ...>...</script>
script_match = re.search(r'<script.*?>.*?</script>', content, re.DOTALL)
if script_match:
    script_full = script_match.group(0)
    # ลบออกจากตำแหน่งเดิม
    content = content.replace(script_full, '')
    # เอาไปวางหลัง <div id="root"></div>
    content = content.replace('<div id="root"></div>', '<div id="root"></div>\n    ' + script_full)

# เขียนลงไฟล์ index.html (ตัวนอกสุด)
with open('c:/Users/User/Downloads/news/index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed index.html: Successfully moved ANY script tag to the end of body.")
