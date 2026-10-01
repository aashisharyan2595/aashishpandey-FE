#!/usr/bin/env python3
"""Copy benchmark: scores the visible text of every page against the site's writing style
(see the style guide in memory: feedback_writing-style). Run: python3 scripts/copy-check.py [--detail PAGE] [--strict]
Metrics per page: Flesch-Kincaid grade, average word length, share of 3+ syllable words, sentence-length spread (SD),
AI-sounding words, dashes, emoji, sentences copied across pages, and how often one opening word repeats.
Exit code 1 with --strict if any page fails. Not part of the Vercel build."""
import re,sys,glob,os,collections,statistics as st
ROOT=os.path.join(os.path.dirname(__file__),'..')
BANNED=r"\b(furthermore|moreover|regarding|crucial|essential|ensure|ensures|ensuring|leverage|leverages|leveraging|seamless|seamlessly|robust|unlock|delve|tapestry|landscape|journey|elevate|utilize|utilise|facilitate|comprehensive|cutting-edge|state-of-the-art|holistic|streamline|empower|empowering|game-changer|world-class|best-in-class|in conclusion|it is worth noting|it's worth noting)\b"
LIMITS=dict(fk=9.0,cv=0.40,cx=14.0,awl=5.0)  # cv = sentence-length SD divided by mean (human 0.53, ChatGPT 0.36 in the IJTES sample)
# job and product words that are long but unavoidable on a portfolio
JOB={'manager','management','architect','architecture','strategist','strategy','solution','solutions','performance','marketing','delivery','specialty','experience','production','transition','company','canada','australia'}
# pages that are lists or interface labels, not prose: scored for banned words only
LISTING={'Tools-Resume-Build','Tools-Resume-Templates','Tools-Resume-Examples','Proof-v3'}
def syl(w):
    w=re.sub(r'[^a-z]','',w.lower())
    if not w: return 0
    n=len(re.findall(r'[aeiouy]+',w))
    if w.endswith('e') and n>1 and not w.endswith('le'): n-=1
    return max(1,n)
def visible(f):
    s=open(f).read()
    a=s.find('<main'); b=s.find('</main>')
    if a<0: a=s.find('<x-dc>'); b=s.find('</x-dc>')
    if a<0: return []
    m=s[a:b]
    m=re.sub(r'<(script|style|svg)[^>]*>.*?</\1>','',m,flags=re.S)
    m=re.sub(r'<!--.*?-->','',m,flags=re.S)
    parts=[re.sub(r'\s+',' ',t.replace('&amp;','&').replace('&nbsp;',' ').replace('&middot;','·')).strip() for t in re.findall(r'>([^<>]+)<',m)]
    return [p for p in parts if p and '{{' not in p]
def sentences(parts):
    out=[]
    for p in parts:
        if len(re.findall(r"[A-Za-z']+",p))<4: continue
        for x in re.split(r'(?<=[.!?])\s+',p):
            if len(re.findall(r"[A-Za-z']+",x))>=3: out.append(x)
    return out
def score(sents):
    W=[w for s in sents for w in re.findall(r"[A-Za-z']+",s)]
    L=[len(re.findall(r"[A-Za-z']+",s)) for s in sents]
    if not W: return None
    n=len(W); sy=sum(syl(w) for w in W)
    return dict(words=n,fk=round(0.39*(n/len(sents))+11.8*(sy/n)-15.59,1),awl=round(sum(len(w) for w in W)/n,2),mean=round(sum(L)/len(L),1),
                sd=round(st.pstdev(L),1),cv=round(st.pstdev(L)/(sum(L)/len(L)),2),cx=round(100*sum(1 for w in W if syl(w)>=3 and w.lower() not in JOB)/n,1))
pages={os.path.basename(f).replace('.dc.html',''):sentences(visible(f)) for f in sorted(glob.glob(os.path.join(ROOT,'*.dc.html')))}
seen=collections.defaultdict(set)
for p,ss in pages.items():
    for s in ss:
        if len(s.split())>=10: seen[s].add(p)
rows=[]
for p,ss in pages.items():
    if len(ss)<8: continue
    sc=score(ss); txt=' '.join(ss)
    t2=re.sub(r'(\d{4}|[A-Z][a-z]{2}( \d{4})?) \u2013 (\d{4}|present|[A-Z][a-z]{2})','',txt)   # date ranges are fine
    t2=re.sub(r'^\u2013 ','',t2)
    t3=re.sub(r'portrait and landscape|journey mapping|\u201cMy journey\u201d','',t2)             # real terms, or advice about what not to write
    ban=re.findall(BANNED,t3,flags=re.I); dash=len(re.findall(r'\u2014|\u2013',t3)); emo=len(re.findall('[\U0001F300-\U0001FAFF\u2600-\u27BF]',txt))
    dup=[s for s in ss if len(seen[s])>=3 and len(s.split())>=10 and not re.search(r'brief|48 hours|hire|scope, design and build|read the code|team of 20',s,re.I)]
    op=collections.Counter(s.split()[0].lower() for s in ss); top,topn=op.most_common(1)[0]; opshare=round(100*topn/len(ss))
    fails=[] if p in LISTING else [k for k,l in LIMITS.items() if (sc[k]>l if k!='cv' else sc[k]<l) ] 
    if ban: fails.append('banned')
    if dash: fails.append('dash')
    if emo: fails.append('emoji')
    if len(dup)>=3: fails.append('copied')
    if opshare>=30: fails.append('opener')
    rows.append((p,sc,ban,dash,emo,dup,top,opshare,fails))
detail=sys.argv[sys.argv.index('--detail')+1] if '--detail' in sys.argv else None
if detail:
    for r in rows:
        if r[0]==detail:
            print(r[1],r[2],'dashes',r[3],'copied',len(r[5]),'opener',r[6],r[7])
            for s in pages[detail]:
                n=len(s.split()); c=sum(1 for w in re.findall(r"[A-Za-z']+",s) if syl(w)>=3)
                if n>24 or c>=4 or re.search(BANNED,s,re.I): print('  -',s[:200])
else:
    print(f"{'page':44}{'words':>6}{'FK':>6}{'AWL':>6}{'CV':>5}{'cx%':>6}  bad")
    for p,sc,ban,dash,emo,dup,top,opshare,fails in rows:
        print(f"{p:44}{sc['words']:>6}{sc['fk']:>6}{sc['awl']:>6}{sc['cv']:>5}{sc['cx']:>6}  {','.join(fails) or 'ok'}")
    bad=[r for r in rows if r[8]]; print(f"\n{len(rows)} pages, {len(bad)} fail. limits: FK<={LIMITS['fk']}, CV>={LIMITS['cv']}, 3+syl<={LIMITS['cx']}%, AWL<={LIMITS['awl']}, no banned words/dashes/emoji, <3 sentences copied across pages, one opener <30%")
    if '--strict' in sys.argv and bad: sys.exit(1)
