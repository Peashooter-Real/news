import re
f = 'c:/Users/User/Downloads/news/dist/index.html'
c = open(f, encoding='utf-8').read()
c = re.sub(r'<script\s+type=[\"\']module[\"\']\s+crossorigin>', '<script>', c)
open(f, 'w', encoding='utf-8').write(c)
