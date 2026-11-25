"""Convert source Met logs to dated observation assets. Originals remain untouched."""
import argparse, csv, hashlib, json, math
from pathlib import Path
from datetime import datetime

parser = argparse.ArgumentParser()
parser.add_argument('source', type=Path)
parser.add_argument('--output', type=Path, default=Path(__file__).resolve().parents[1] / 'public/data/buoy-test')
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=True)
names = ['电压','面板温度','2 m风速','2 m风向','3 m风速','3 m风向','5 m风速','5 m风向','2 m水汽压','2 m气温','2 m湿度','2 m气压','3 m水汽压','3 m气温','3 m湿度','3 m气压','5 m水汽压','5 m气温','5 m湿度','5 m气压','向下短波辐射','向上短波辐射','向下长波辐射','向上长波辐射','修正向上长波辐射','修正向下长波辐射','机体温度','温度原始值','净长波辐射','净短波辐射','净辐射','反照率','海温']
units = ['V','°C','m/s','°','m/s','°','m/s','°','kPa','°C','%','kPa','kPa','°C','%','kPa','kPa','°C','%','kPa'] + ['W/m²']*6 + ['°C',''] + ['W/m²']*3 + ['','°C']
days, seen, rejected, duplicates = {}, set(), 0, 0
for path in sorted(args.source.glob('Met-*.txt')):
    for line_number, line in enumerate(path.read_text(encoding='utf-8-sig', errors='replace').splitlines(), 1):
        if not line.strip(): continue
        try:
            row = next(csv.reader([line])); stamp = datetime.strptime(row[0].strip(), '%Y-%m-%d %H:%M:%S')
            offset = 1
            try: datetime.strptime(row[1].strip(), '%Y-%m-%d %H:%M:%S'); offset = 2
            except ValueError: pass
            if len(row)-offset != 33: raise ValueError('incomplete')
        except (ValueError, IndexError, csv.Error): rejected += 1; continue
        identity = hashlib.sha256(','.join(row).encode()).hexdigest()
        if identity in seen: duplicates += 1; continue
        seen.add(identity)
        values, flags = [], []
        for i, raw in enumerate(row[offset:]):
            try: value = float(raw)
            except ValueError: value = float('nan')
            invalid = not math.isfinite(value)
            if i in (10,14,18): invalid |= not 0 <= value <= 100
            if i in (3,5,7): invalid |= not 0 <= value <= 360
            if i in (2,4,6): invalid |= value < 0
            if i == 27: invalid = True  # unit unresolved; preserve in raw source
            values.append(None if invalid else value)
            if invalid: flags.append(i)
        days.setdefault(stamp.date().isoformat(), []).append({'time':row[0].strip(),'deviceTime':row[1].strip() if offset==2 else None,'values':values,'invalid':flags,'source':path.name,'line':line_number})
for day, records in days.items():
    records.sort(key=lambda r:(r['time'],r['source'],r['line']))
    (args.output/f'{day}.json').write_text(json.dumps(records,ensure_ascii=False,separators=(',',':'),allow_nan=False),encoding='utf-8')
manifest = {'name':'通量浮标深海中心测试数据','days':sorted(days),'fields':[{'name':n,'unit':u} for n,u in zip(names,units)],'records':sum(map(len,days.values())),'rejectedLines':rejected,'duplicates':duplicates}
(args.output/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in manifest.items() if k not in ('fields','days','name')}))
