import csv, re, collections, statistics, sys

files = {
"8xwealth": "8xWealth (การเงิน/ธุรกิจ/ลงทุน)",
"kae_tae_kao": "แก่แต่เก๋า (สูงวัยแต่เท่/ใช้ชีวิต)",
"baan_kon_rak_arn": "บ้านคนรักการอ่าน (หนังสือ/แนะนำหนังสือ)",
"phutta_prawat": "พุทธประวัติ (พุทธศาสนา/ธรรมะ)",
"mr_beer": "มิสเตอร์เบียร์",
"luklub_tualok": "ลึกลับทั่วโลก (ปริศนา/เรื่องลึกลับ/ประวัติศาสตร์)",
"lungti": "ลุงตี่",
"lungti_inspiration": "ลุงตี่ inspiration",
"sate_siew_kwamruesuk": "เศษเสี้ยวความรู้สึก (สายอารมณ์/ความรู้สึก)",
"nangsuedi_arn": "หนังสือดีอ่านเปลี่ยนชีวิต",
"harairai_gasian": "หารายได้วัยเกษียณ",
"aphipunyaphinihan": "อภิปุญญาภินิหาร (เรื่องเหนือธรรมชาติ/ปาฏิหาริย์)",
}

def analyze(fname):
    rows = list(csv.DictReader(open(f"{fname}.csv")))
    posts = []
    titles = []
    for r in rows:
        p = (r.get('โพส') or '').strip()
        t = (r.get('หัวข้อ') or '').strip()
        if p and len(p) > 40:
            posts.append(p)
            titles.append(t)
    n = len(posts)
    if n == 0:
        return None
    lens = sorted(len(re.sub(r'#\S+','',p).strip()) for p in posts)
    def pct(p): return lens[int(len(lens)*p)] if lens else 0
    # opener 15 chars
    openers = collections.Counter(p.split('\n')[0][:16] for p in posts)
    # endings (last nonempty line, last 40 chars) - check hashtag pattern
    hashtags = collections.Counter()
    for p in posts:
        tags = re.findall(r'#\S+', p)
        if tags:
            hashtags[' '.join(tags)] += 1
    has_emoji = sum(bool(re.search(r'[\U0001F300-\U0001FAFF☀-➿]', p)) for p in posts)
    end_krub = sum(p.rstrip().split()[-1].endswith('ครับ') if p.rstrip() else False for p in posts)
    # crude, check last word before hashtag
    def last_word(p):
        body = re.sub(r'#\S+','',p).strip()
        return body[-6:] if body else ''
    end_krub2 = sum('ครับ' in last_word(p) for p in posts)
    end_kha2 = sum('ค่ะ' in last_word(p) or 'นะคะ' in last_word(p) for p in posts)
    paras = [len([x for x in p.split('\n') if x.strip()]) for p in posts]
    para_counter = collections.Counter(paras)
    print(f"\n=== {fname} ({files.get(fname,'')}) — n={n} ===")
    print(f"len p10/med/p90: {pct(0.1)}/{pct(0.5)}/{pct(0.9)}")
    print(f"paragraphs (top5): {para_counter.most_common(5)}")
    print(f"ends with ครับ: {end_krub2} ({end_krub2*100//n}%)  ends with ค่ะ/นะคะ: {end_kha2} ({end_kha2*100//n}%)")
    print(f"has emoji: {has_emoji} ({has_emoji*100//n}%)")
    print(f"top hashtag sets: {hashtags.most_common(3)}")
    print("top openers:")
    for k,v in openers.most_common(8):
        print(f"  {v} | {k}")
    print("sample titles:", titles[:6])
    print("--- sample post ---")
    print(posts[min(3,n-1)][:500])
    return posts

for fname in files:
    try:
        analyze(fname)
    except Exception as e:
        print(fname, "ERROR", e)
