"""Isolated FakeWallet LNbits instance; never restarts or edits port 5000."""
import os,sys,time,json,secrets,subprocess,hashlib
from pathlib import Path
import httpx
CORE=Path('/home/talvasconcelos/Work/lnbits_pg');GAME=Path(__file__).resolve().parents[1];PORT=int(os.environ.get('SATRUN_TEST_PORT','5022'));ROOT=GAME/('dev/.instance' if PORT==5022 else 'dev/.pg-instance');DATA=ROOT/'data';BASE=f'http://127.0.0.1:{PORT}'
if '--reset' in sys.argv:
 import shutil
 shutil.rmtree(ROOT,ignore_errors=True)
ROOT.mkdir(parents=True,exist_ok=True);(DATA/'wasm_extensions').mkdir(parents=True,exist_ok=True);link=DATA/'wasm_extensions/satrun'
if not link.exists():link.symlink_to(GAME,target_is_directory=True)
(ROOT/'python_extensions/extensions').mkdir(parents=True,exist_ok=True)
env={**os.environ,'PYTHONPATH':str(CORE),'HOST':'127.0.0.1','PORT':str(PORT),'LNBITS_DATA_FOLDER':str(DATA),'LNBITS_WASM_EXTENSIONS_PATH':str(DATA/'wasm_extensions'),'LNBITS_EXTENSIONS_PATH':str(ROOT/'python_extensions'),'LNBITS_DATABASE_URL':os.environ.get('SATRUN_TEST_DATABASE_URL',''),'LNBITS_EXTENSIONS_DEFAULT_INSTALL':'[]','LNBITS_EXTENSIONS_DEACTIVATE_ALL':'false','LNBITS_ADMIN_UI':'true','LNBITS_BACKEND_WALLET_CLASS':'FakeWallet','LNBITS_ALLOWED_FUNDING_SOURCES':'["FakeWallet"]','LNBITS_AUTH_SECRET_KEY':'satrun-isolated-test','AUTH_SECRET_KEY':'satrun-isolated-test','FIRST_INSTALL_TOKEN':'','AUTH_HTTPS_ONLY':'false','DEBUG':'false','NO_PROXY':'127.0.0.1,localhost','no_proxy':'127.0.0.1,localhost'}
log=(ROOT/'server.log').open('a');proc=subprocess.Popen([sys.executable,'-m','uvicorn','lnbits.__main__:app','--host','127.0.0.1','--port',str(PORT),'--workers','1'],cwd=CORE,env=env,stdout=log,stderr=subprocess.STDOUT)
try:
 with httpx.Client(trust_env=False,timeout=60) as c:
  for i in range(240):
   if proc.poll() is not None:raise RuntimeError('Server exited; see dev/.instance/server.log')
   try:c.get(BASE+'/api/v1/auth');break
   except httpx.HTTPError:time.sleep(.25)
  credentials_file=ROOT/'credentials.json'
  if credentials_file.exists():
   credentials=json.loads(credentials_file.read_text());auth=c.post(BASE+'/api/v1/auth',json=credentials)
  else:
   credentials={'username':'satrun_test','password':secrets.token_urlsafe(24)};auth=c.put(BASE+'/api/v1/auth/first_install',json={**credentials,'password_repeat':credentials['password']});credentials_file.write_text(json.dumps(credentials));credentials_file.chmod(0o600)
  auth.raise_for_status();token=auth.json()['access_token'];c.headers['Authorization']='Bearer '+token;(ROOT/'api-token').write_text(token);(ROOT/'api-token').chmod(0o600)
  c.put(BASE+'/api/v1/extension/satrun/enable').raise_for_status()
  c.put(BASE+'/api/v1/extension/satrun/permissions',json={'permissions':json.loads((GAME/'config.json').read_text())['permissions']}).raise_for_status()
  info=c.get(BASE+'/api/v1/ext/satrun/info');print('INFO',info.status_code,info.text[:500],flush=True)
  op=c.get(BASE+'/api/v1/ext/satrun/operator').json();print('OPERATOR',json.dumps(op)[:800],flush=True)
  if not op.get('ok'):raise RuntimeError('Operator initialization failed')
  if not op['data']['tower']:
   settings={**op['data']['defaults'],'continueEnabled':True,'walletId':op['data']['wallets'][0]['id']};op=c.post(BASE+'/api/v1/ext/satrun/operator',json={'save':True,'settings':settings}).json();print('CREATE',json.dumps(op)[:500],flush=True)
  tower=op['data']['tower'];instance={'base':BASE,'towerId':tower['id'],'play':BASE+'/ext/satrun/t/'+tower['id'],'runtimeCommit':subprocess.check_output(['git','-C',str(CORE),'rev-parse','HEAD'],text=True).strip(),'componentSha256':hashlib.sha256((GAME/'wasm/module.wasm').read_bytes()).hexdigest()};(ROOT/'instance.json').write_text(json.dumps(instance,indent=2));print('READY',instance['play'],flush=True)
  while proc.poll() is None:time.sleep(1)
finally:
 proc.terminate()
 try:proc.wait(timeout=15)
 except subprocess.TimeoutExpired:proc.kill()
