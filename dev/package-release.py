"""Package the runtime tree and check its layout and component bytes."""
import hashlib
import json
import zipfile
from pathlib import Path, PurePosixPath

root = Path(__file__).resolve().parents[1]
config = json.loads((root / 'config.json').read_text())
assert config['id'] == 'satrun' and config['extension_type'] == 'wasm'
manifest = json.loads((root / 'manifest.json').read_text())
assert manifest['repos'][0]['id'] == config['id']
files = [root / name for name in ['config.json', 'manifest.json', 'LICENSE', 'THIRD-PARTY-NOTICES.txt']]
files += sorted(p for name in ['ui', 'static', 'wasm', 'storage'] for p in (root / name).rglob('*') if p.is_file())
required = [config['wasm']['module'], config['wasm']['wit'], config['openapi'], 'storage/schema.json', 'static/assets/icon.png']
required += [route['entrypoint'] for route in config['ui_routes']]
assert all(root / name in files for name in required)
component = (root / config['wasm']['module']).read_bytes()
assert component[:8] == b'\x00asm\x0d\x00\x01\x00', 'Build a WebAssembly Component before packaging.'
out = root / 'dist'
out.mkdir(exist_ok=True)
archive = out / f"satrun-{config['version']}.zip"
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as z:
    for p in files:
        assert not any(part.is_symlink() for part in [p, *p.parents]), p
        name = PurePosixPath('satrun', p.relative_to(root).as_posix())
        assert not name.is_absolute() and '..' not in name.parts
        assert p.suffix not in {'.py', '.pyc', '.pyo', '.so', '.pyd'}
        info = zipfile.ZipInfo(str(name), (2026, 1, 1, 0, 0, 0))
        info.external_attr = 0o100644 << 16
        z.writestr(info, p.read_bytes(), compress_type=zipfile.ZIP_DEFLATED)
with zipfile.ZipFile(archive) as z:
    assert len(z.namelist()) == len(files)
    for p in files:
        assert z.read('satrun/' + p.relative_to(root).as_posix()) == p.read_bytes()
evidence = {'archive': archive.name, 'archiveSha256': hashlib.sha256(archive.read_bytes()).hexdigest(), 'componentSha256': hashlib.sha256(component).hexdigest(), 'files': len(files)}
(root / 'evidence').mkdir(exist_ok=True)
(root / 'evidence/package.json').write_text(json.dumps(evidence, indent=2) + '\n')
print(json.dumps(evidence))
