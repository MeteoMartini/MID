#!/usr/bin/env python3
"""Small no-network tests for the Durable Objects physical-storage surrogate."""
import sqlite3
import tempfile
import unittest
from pathlib import Path
from ruc_do_sqlite_physical_qa import SEGMENT, fake_bytes, sqlite_range

class PhysicalSqliteQA(unittest.TestCase):
    def setUp(self):
        self.dir=tempfile.TemporaryDirectory(prefix="mid-do-physical-unit-")
        self.addCleanup(self.dir.cleanup)
        self.db=sqlite3.connect(Path(self.dir.name)/"test.db")
        self.addCleanup(self.db.close)
        self.db.execute("CREATE TABLE segment(name TEXT NOT NULL,part INTEGER NOT NULL,payload BLOB NOT NULL,PRIMARY KEY(name,part)) WITHOUT ROWID")
        self.sizes={"a.zlib":SEGMENT+1234}
        for p,sz in [(0,SEGMENT),(1,1234)]:
            self.db.execute("INSERT INTO segment VALUES (?,?,?)",("a.zlib",p,fake_bytes("a.zlib",p,sz)))
        self.db.commit()

    def test_unmodified_complete_full_bytes(self):
        actual,count=sqlite_range(self.db,self.sizes,"a.zlib",0,64)
        self.assertEqual(actual,fake_bytes("a.zlib",0,64))
        self.assertEqual(count,1)

    def test_cross_sql_blob_boundary(self):
        actual,count=sqlite_range(self.db,self.sizes,"a.zlib",SEGMENT-100,200)
        self.assertEqual(count,2)
        self.assertEqual(actual,fake_bytes("a.zlib",0,SEGMENT)[-100:]+fake_bytes("a.zlib",1,1234)[:100])

    def test_invalid_bounds_and_missing_object_fail_closed(self):
        for key,pos,nb in [("a.zlib",-1,64),("a.zlib",0,0),("a.zlib",SEGMENT+1233,100),
                           ("missing",0,50),("a.zlib",0,40000000)]:
            with self.assertRaises(ValueError):
                sqlite_range(self.db,self.sizes,key,pos,nb)

    def test_tampering_rejected_without_false_success(self):
        self.db.execute("UPDATE segment SET payload=? WHERE name='a.zlib' AND part=1",(b"x"*1234,))
        self.db.commit()
        with self.assertRaisesRegex(ValueError,"payload mismatch"):
            sqlite_range(self.db,self.sizes,"a.zlib",SEGMENT,1234)

if __name__=="__main__":
    unittest.main()
