import hashlib
import io
import unittest
from file_backup import snapshot_files

class Paginator:
    def __init__(self, store): self.store = store
    def paginate(self, **kwargs):
        yield {"Contents": [{"Key": k, "Size": len(v), "ETag": hashlib.md5(v).hexdigest()} for k, v in self.store.items()]}

class S3:
    def __init__(self, store=None): self.store = store or {}; self.uploads = 0
    def get_paginator(self, _): return Paginator(self.store)
    def get_object(self, **kwargs): return {"Body": io.BytesIO(self.store[kwargs['Key']])}
    def upload_file(self, path, bucket, key, **kwargs):
        from pathlib import Path
        self.store[key] = Path(path).read_bytes(); self.uploads += 1
    def head_object(self, **kwargs):
        if kwargs['Key'] not in self.store:
            error = RuntimeError('missing'); error.response = {'Error': {'Code': '404'}}; raise error
        return {'ContentLength': len(self.store[kwargs['Key']])}
    def put_object(self, **kwargs): self.store[kwargs['Key']] = kwargs['Body']

class FileBackupTests(unittest.TestCase):
    def test_snapshot_verifies_bytes_and_keeps_deleted_source_objects(self):
        source, backup = S3({'private/request.pdf': b'pdf', 'photo.webp': b'photo'}), S3()
        result = snapshot_files(source, 'source', backup, 'backup')
        self.assertEqual(result['objects'], 2)
        self.assertEqual(backup.uploads, 2)
        source.store.pop('photo.webp')
        snapshot_files(source, 'source', backup, 'backup')
        self.assertEqual(backup.uploads, 2)
        self.assertIn('files/objects/' + hashlib.sha256(b'photo').hexdigest(), backup.store)
    def test_changed_file_creates_new_version(self):
        source, backup = S3({'photo.webp': b'old'}), S3()
        snapshot_files(source, 'source', backup, 'backup')
        source.store['photo.webp'] = b'new'
        snapshot_files(source, 'source', backup, 'backup')
        self.assertEqual(backup.uploads, 2)

if __name__ == '__main__': unittest.main()
