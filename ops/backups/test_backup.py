import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import MagicMock

spec = importlib.util.spec_from_file_location("backup", Path(__file__).with_name("backup.py"))
backup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(backup)


class BackupTests(unittest.TestCase):
    def test_retention_only_removes_complete_owned_pairs(self):
        old = "postgres/stroysnab-20261110T220000Z-12345678.dump"
        newest = "postgres/stroysnab-20261111T220000Z-12345678.dump"
        incomplete = "postgres/stroysnab-20261109T220000Z-12345678.dump"
        keys = [old, old + ".json", newest, newest + ".json", incomplete, "photos/customer.png", "postgres/other.dump"]
        self.assertEqual(backup.obsolete_archives([{"Key": k} for k in keys], 1), [old, old + ".json"])

    def test_invalid_retention_fails_before_deletion(self):
        for value in (0, -1, 366):
            with self.assertRaises(ValueError):
                backup.obsolete_archives([], value)

    def test_corrupt_download_cannot_publish_manifest_or_prune(self):
        s3 = MagicMock()
        s3.get_object.return_value = {"Body": MagicMock()}
        s3.get_object.return_value["Body"].iter_chunks.return_value = [b"corrupt"]
        with tempfile.TemporaryDirectory() as directory:
            archive = Path(directory) / "database.dump"
            archive.write_bytes(b"valid")
            with self.assertRaises(RuntimeError):
                backup.publish(s3, "bucket", archive, "key", {"bytes": 5, "sha256": backup.digest_file(archive)}, 30)
        s3.put_object.assert_not_called()
        s3.get_paginator.assert_not_called()
        s3.delete_object.assert_not_called()

    def test_upload_failure_cannot_prune_existing_backups(self):
        s3 = MagicMock()
        s3.upload_file.side_effect = RuntimeError("upload failed")
        with self.assertRaises(RuntimeError):
            backup.publish(s3, "bucket", Path("archive"), "key", {}, 30)
        s3.delete_object.assert_not_called()


if __name__ == "__main__":
    unittest.main()
