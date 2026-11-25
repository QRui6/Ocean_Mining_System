"""Idempotent observation import; DB_* environment variables configure PostgreSQL.
WIT decoding: https://wit-motion.gitbook.io/witmotion-sdk/wit-standard-protocol/wit-standard-communication-protocol
"""
import argparse,csv,hashlib,json,os,struct
from pathlib import Path
from datetime import datetime
import psycopg2
from psycopg2.extras import Json,execute_values

def decode_attitude(raw):
    frames=bytes.fromhex(raw); decoded={}; errors=[]
    if len(frames)!=44:return {},['length']
    for offset in range(0,44,11):
        f=frames[offset:offset+11]; kind=f[1]
        if f[0]!=0x55 or (sum(f[:10])&255)!=f[10]:errors.append(f'checksum:{offset}');continue
        values=struct.unpack('<hhh',f[2:8])
        if kind==0x51:decoded['accelerationG']=[v/32768*16 for v in values]
        elif kind==0x52:decoded['angularVelocity']=[v/32768*2000 for v in values]
        elif kind==0x53:decoded['angles']=[v/32768*180 for v in values]
        elif kind==0x54:decoded['magneticRaw']=list(values)
        else:errors.append(f'type:{kind}')
    return decoded,errors

def main(connection=None):
    parser=argparse.ArgumentParser();parser.add_argument('--observations',type=Path,required=True);parser.add_argument('--raw',type=Path,required=True);parser.add_argument('--station',default='deepsea-flux-test')
    args=parser.parse_args();manifest=json.loads((args.observations/'manifest.json').read_text('utf-8'))
    conn=connection or psycopg2.connect(host=os.getenv('DB_HOST','127.0.0.1'),port=os.getenv('DB_PORT','5432'),dbname=os.getenv('DB_NAME','ship_monitoring'),user=os.getenv('DB_USER','postgres'),password=os.environ['DB_PASSWORD'])
    total=attitude_count=invalid_frames=met_inserted=att_inserted=malformed_attitudes=0
    with conn,conn.cursor() as cur:
        cur.execute((Path(__file__).resolve().parents[1]/'java/src/main/resources/db/client-monitoring.sql').read_text('utf-8'))
        for day in manifest['days']:
            batch=[]
            for r in json.loads((args.observations/f'{day}.json').read_text('utf-8')):
                key=hashlib.sha256(json.dumps(r,sort_keys=True,ensure_ascii=False).encode()).hexdigest()
                batch.append((args.station,r['time'],key,r['deviceTime'],Json(r['values']),Json({'invalid':r['invalid']}),r['source'],r['line']))
            met_inserted+=len(execute_values(cur,'INSERT INTO buoy_test_observations(station_id,observed_at,record_key,device_time,values_json,quality,source_file,source_line) VALUES %s ON CONFLICT DO NOTHING RETURNING 1',batch,page_size=500,fetch=True))
            total+=len(batch)
        for path in sorted(args.raw.glob('Gyr-*.txt')):
            batch=[]
            for line_number,line in enumerate(path.read_text('utf-8-sig').splitlines(),1):
                if not line.strip():continue
                try:
                    row=next(csv.reader([line]));datetime.strptime(row[0],'%Y-%m-%d %H:%M:%S');decoded,errors=decode_attitude(row[1]);raw=row[1]
                except (ValueError,IndexError,csv.Error):
                    malformed_attitudes+=1
                    continue
                invalid_frames+=len(errors)
                key=hashlib.sha256(line.encode()).hexdigest()
                batch.append((args.station,row[0],key,Json(decoded),raw,Json({'errors':errors,'protocol':'WIT standard 0x51–0x54'}),path.name,line_number))
            att_inserted+=len(execute_values(cur,'INSERT INTO buoy_test_attitudes(station_id,observed_at,record_key,decoded,raw_hex,quality,source_file,source_line) VALUES %s ON CONFLICT DO NOTHING RETURNING 1',batch,page_size=500,fetch=True))
            attitude_count+=len(batch)
        manifest.update({'stationId':args.station,'attitudeRecords':attitude_count,'invalidFrames':invalid_frames,'protocol':'WIT standard 0x51–0x54'})
        cur.execute('INSERT INTO buoy_test_imports(station_id,manifest) VALUES(%s,%s) ON CONFLICT(station_id) DO UPDATE SET manifest=EXCLUDED.manifest,imported_at=now()',(args.station,Json(manifest)))
    print(json.dumps({'observations':total,'attitudes':attitude_count,'invalidFrames':invalid_frames,'observationsInserted':met_inserted,'attitudesInserted':att_inserted,'duplicates':total+attitude_count-met_inserted-att_inserted,'malformedAttitudes':malformed_attitudes}))
    conn.close()
if __name__=='__main__':main()
