"""Exercise the release gate with temporary local Git repositories only."""
import json
import os
import subprocess
import tempfile
import textwrap
from pathlib import Path

workflow = (Path(__file__).resolve().parents[1] / '.github/workflows/release.yml').read_text()
assert '    paths:' not in workflow, 'Main pushes must reach the release gate.'
script = textwrap.dedent(workflow.split('        run: |\n', 1)[1].split('\n  release:', 1)[0])
subprocess.run(['bash', '-n'], input=script, text=True, check=True)

for case in ['first-push', 'unchanged-version-untagged', 'existing-tag', 'version-bump', 'matching-tag', 'mismatching-tag', 'invalid-version']:
    with tempfile.TemporaryDirectory(prefix='satrun-release-') as directory:
        repo = Path(directory) / 'repo'
        repo.mkdir()

        def git(*args):
            return subprocess.check_output(['git', '-C', str(repo), *args], text=True, stderr=subprocess.DEVNULL).strip()

        git('init', '-q', '-b', 'main')
        git('config', 'user.name', 'Release check')
        git('config', 'user.email', 'check@example.invalid')
        (repo / 'config.json').write_text(json.dumps({'version': 'invalid' if case == 'invalid-version' else '0.1.0'}))
        git('add', 'config.json')
        git('commit', '-qm', 'Config')
        if case == 'unchanged-version-untagged':
            git('commit', '--allow-empty', '-qm', 'Workflow-only change')
        if case in ['existing-tag', 'matching-tag']:
            git('tag', 'v0.1.0')
        if case == 'version-bump':
            git('tag', 'v0.0.9')
        origin = Path(directory) / 'origin.git'
        subprocess.run(['git', 'init', '-q', '--bare', str(origin)], check=True)
        git('remote', 'add', 'origin', str(origin))
        output = Path(directory) / 'output'
        is_tag = case in ['matching-tag', 'mismatching-tag']
        result = subprocess.run(['bash', '-eo', 'pipefail', '-c', script], cwd=repo, text=True, capture_output=True, env={
            **os.environ, 'GITHUB_OUTPUT': str(output),
            'REF_TYPE': 'tag' if is_tag else 'branch',
            'REF_NAME': 'v0.2.0' if case == 'mismatching-tag' else 'v0.1.0' if is_tag else 'main',
        })
        if case in ['mismatching-tag', 'invalid-version']:
            assert result.returncode != 0, case
        else:
            assert result.returncode == 0, (case, result.stdout, result.stderr)
            assert f"publish={'false' if case == 'existing-tag' else 'true'}" in output.read_text(), case
            if not is_tag and case != 'existing-tag':
                assert 'refs/tags/v0.1.0' in git('ls-remote', '--tags', 'origin'), case

print('PASS: seven release cases; all Git pushes stayed in temporary local repositories.')
