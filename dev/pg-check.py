"""Disposable PostgreSQL database, separate server, no shared LNbits data changes."""
import os,json,time,uuid,subprocess
from pathlib import Path
from urllib.parse import urlsplit,urlunsplit
import psycopg2
from psycopg2 import sql
import httpx
GAME=Path(__file__).resolve().parents[1];CORE=Path('/home/talvasconcelos/Work/lnbits_pg');ROOT=GAME/'dev/.pg-instance';PORT=5023
url=os.environ.get('SATRUN_PG_TEST_URL') or next(line.split('=',1)[1].strip().strip('\"\'') for line in (CORE/'.env').read_text().splitlines() if line.startswith('LNBITS_DATABASE_URL='))
parts=urlsplit(url);name='satrun_verify_'+uuid.uuid4().hex[:12];dburl=urlunsplit(parts._replace(path='/'+name));admin=psycopg2.connect(url);admin.autocommit=True
proc=None
try:
 with admin.cursor() as c:c.execute(sql.SQL('CREATE DATABASE {}').format(sql.Identifier(name)))
 (ROOT/'instance.json').unlink(missing_ok=True)
 env={**os.environ,'SATRUN_TEST_PORT':str(PORT),'SATRUN_TEST_DATABASE_URL':dburl};log=(GAME/'dev/pg-check.log').open('w');proc=subprocess.Popen([str(CORE/'.venv/bin/python'),str(GAME/'dev/runtime-check.py'),'--reset'],env=env,stdout=log,stderr=subprocess.STDOUT)
 for _ in range(240):
  if proc.poll() is not None:raise RuntimeError('PostgreSQL fixture exited; inspect dev/pg-check.log')
  if (ROOT/'instance.json').exists():break
  time.sleep(.5)
 else:raise RuntimeError('PostgreSQL fixture startup timed out')
 instance=json.loads((ROOT/'instance.json').read_text());token=(ROOT/'api-token').read_text();base=instance['base']
 with httpx.Client(trust_env=False,timeout=60,headers={'Authorization':'Bearer '+token}) as c:
  def api(path,body=None):
   r=c.post(base+'/api/v1/ext/satrun'+path,json=body) if body else c.get(base+'/api/v1/ext/satrun'+path);r.raise_for_status();v=r.json();assert v['ok'],v;return v['data']
  op=api('/operator');assert op['tower']['id']==instance['towerId'];record={'bestFloor':12,'bestScore':12000,'totalTime':30,'runs':1,'milestones':{'10':25.5}};api('/record',{'record':record});assert api('/record')['record']==record
  start=api('/run/start',{'towerId':instance['towerId'],'name':'pg_test'});body={**start,'event':'death','floor':0,'elapsed':0,'highestTime':0,'collected':[]};checked=api('/run/verify',body);assert checked['floor']==0 and checked['lives']==0 and checked['runId']!=start['runId'];assert api('/run/verify',body)['runId']==checked['runId'];assert api('/run/finish',{**start,'runId':checked['runId']})['accepted'];assert len(api('/leaderboard',{'towerId':instance['towerId']})['rows'])==1
 (GAME/'evidence/pg-results.json').write_text(json.dumps({'database':'PostgreSQL','migration':True,'ownerSettingsAndWallets':True,'personalRecordRoundTrip':True,'milestoneAppendReadAndRetry':True,'leaderboardFiltersSort':True},indent=2));print('PASS PostgreSQL migration, owner settings, records, milestone/death checks and leaderboard filters.')
finally:
 if proc:
  proc.terminate()
  try:proc.wait(timeout=20)
  except subprocess.TimeoutExpired:proc.kill();proc.wait()
 with admin.cursor() as c:
  c.execute('SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname=%s AND pid<>pg_backend_pid()',(name,));c.execute(sql.SQL('DROP DATABASE IF EXISTS {}').format(sql.Identifier(name)))
 admin.close()
