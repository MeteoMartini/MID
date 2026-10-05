"""Seekable, ordinary file handles for ecCodes, including DWD bzip2 files."""
import bz2
import shutil
import tempfile
from contextlib import contextmanager


@contextmanager
def open_grib_stream(path):
    if path.suffix != '.bz2':
        with path.open('rb') as stream:
            yield stream
        return
    # ecCodes consumes an ordinary file handle, not a Python BZ2File wrapper.
    # Stream decompression to disk to bound memory for large EPS files.
    with tempfile.TemporaryFile(mode='w+b') as stream:
        with bz2.open(path, 'rb') as compressed:
            shutil.copyfileobj(compressed, stream, length=1024 * 1024)
        stream.seek(0)
        yield stream
