"""Immutable private snapshots; reads source objects and never deletes source or backup data."""
import hashlib
import json
import tempfile
import uuid
from datetime import datetime, timezone
from pathlib import Path

def read_chunks(body):
    try:
        while True:
            data = body.read(1024 * 1024)
            if not data: break
            yield data
    finally:
        body.close()

def snapshot_files(source, source_bucket, backup, backup_bucket, max_bytes=5 * 1024**3):
    records, total = [], 0
    with tempfile.TemporaryDirectory(prefix='stroysnab-files-') as directory:
        path = Path(directory) / 'object'
        for page in source.get_paginator('list_objects_v2').paginate(Bucket=source_bucket):
            for item in page.get('Contents', []):
                if len(records) >= 100000 or total + item['Size'] > max_bytes:
                    raise RuntimeError('File snapshot limit exceeded')
                digest, size = hashlib.sha256(), 0
                with path.open('wb') as handle:
                    for chunk in read_chunks(source.get_object(Bucket=source_bucket, Key=item['Key'])['Body']):
                        size += len(chunk)
                        if total + size > max_bytes: raise RuntimeError('File snapshot limit exceeded')
                        digest.update(chunk); handle.write(chunk)
                if size != item['Size']: raise RuntimeError('Source changed during snapshot; retry next run')
                checksum = digest.hexdigest()
                key = 'files/objects/' + checksum
                exists = False
                try:
                    existing = backup.head_object(Bucket=backup_bucket, Key=key)
                    exists = existing['ContentLength'] == size
                except Exception as error:
                    if getattr(error, 'response', {}).get('Error', {}).get('Code') not in ('404', 'NoSuchKey', 'NotFound'):
                        raise
                if not exists: backup.upload_file(str(path), backup_bucket, key)
                stored, stored_size = hashlib.sha256(), 0
                for chunk in read_chunks(backup.get_object(Bucket=backup_bucket, Key=key)['Body']):
                    stored.update(chunk); stored_size += len(chunk)
                if stored_size != size or stored.hexdigest() != checksum:
                    raise RuntimeError('File backup checksum mismatch')
                records.append({'source_key': item['Key'], 'backup_key': key, 'bytes': size, 'sha256': checksum})
                total += size
        now = datetime.now(timezone.utc)
        key = 'files/manifests/' + now.strftime('%Y%m%dT%H%M%SZ') + '-' + uuid.uuid4().hex[:8] + '.json'
        manifest = {'created_at': now.isoformat(), 'source_bucket': source_bucket, 'objects': records, 'bytes': total}
        payload = json.dumps(manifest, ensure_ascii=False).encode('utf-8')
        backup.put_object(Bucket=backup_bucket, Key=key, Body=payload, ContentType='application/json')
        stored = b''.join(read_chunks(backup.get_object(Bucket=backup_bucket, Key=key)['Body']))
        if stored != payload: raise RuntimeError('File manifest verification failed')
        return {'objects': len(records), 'bytes': total, 'manifest': key, 'verified': True}
