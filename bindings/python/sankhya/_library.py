# SPDX-License-Identifier: Apache-2.0
"""Locating and loading the YUKTHI shared library, and declaring the C signatures.

WHY ctypes AND NOT pybind11. A compiled extension module has to be built against the exact
Python it will be imported by, which turns "use the solver from Python" into a second build
system, a wheel, and an ABI to keep matching. ctypes needs none of that: the shared library
the C++ build already produces is the whole dependency, and the same file works from CPython,
PyPy, and anything else with an FFI. It also means these bindings exercise
`include/YUKTHI/YUKTHI.h` exactly as a third-party caller would, so a defect in that
boundary shows up here rather than being papered over by a C++-aware binding layer.

EVERY SIGNATURE IS DECLARED. ctypes defaults to `int` for any return type it was not told
about, which silently truncates a pointer on 64-bit Windows and returns garbage for a double.
Declaring `restype` and `argtypes` for every function is not tidiness - it is the difference
between a wrong answer and a working one, and the failure would appear as an implausible
objective rather than as a crash.
"""

from __future__ import annotations

import ctypes
import os
import sys
from pathlib import Path

__all__ = ["load", "YUKTHIError"]


class YUKTHIError(RuntimeError):
    """A call into the solver failed. Carries the C API's `last_error` text."""


_LIBRARY_NAMES = ("libYUKTHI.dll", "YUKTHI.dll", "libYUKTHI.so", "libYUKTHI.dylib")

# Searched in order. The build directories come first because a developer running from a
# checkout means the one they just built, not one installed elsewhere on the machine.
_SEARCH_DIRECTORIES = ("build", "build-release", "build-fresh", "cmake-build-release", ".")


def _repository_root() -> Path:
    # bindings/python/YUKTHI/_library.py -> up three.
    return Path(__file__).resolve().parents[3]


def _candidate_paths() -> list[Path]:
    override = os.environ.get("YUKTHI_LIBRARY")
    if override:
        # An explicit path wins outright and is not combined with the search. Someone who set
        # this is telling us which build to use, and quietly falling back to a different one
        # would be worse than failing.
        return [Path(override)]

    root = _repository_root()
    found: list[Path] = []
    for directory in _SEARCH_DIRECTORIES:
        base = root / directory
        for name in _LIBRARY_NAMES:
            found.append(base / name)
        # CMake gives the shared library a VERSION and SOVERSION, so on Linux the real file
        # is libYUKTHI.so.0.1.0 and the bare name is a symlink beside it. That symlink is
        # normally there - but it is created by the install rules as much as by the build,
        # and a tree where it is missing would otherwise fail with "not present" while the
        # library sits right there. Globbing the versioned names costs nothing and removes
        # a failure mode that only appears on the platform CI runs on.
        if base.is_dir():
            for pattern in ("libYUKTHI.so.*", "libYUKTHI.*.dylib"):
                found.extend(sorted(base.glob(pattern)))
    return found


def _add_dependency_directories() -> None:
    """Put the toolchain's bin directory on the DLL search path, on Windows.

    libYUKTHI.dll imports zlib1.dll, which lives beside the compiler in an MSYS2 or MinGW
    installation rather than anywhere Windows looks by default. Python 3.8 stopped honouring
    PATH for extension dependencies, so without this the load fails with a bare "Could not
    find module ... or one of its dependencies" that names the library we DID find and says
    nothing about the one we did not.
    """
    if sys.platform != "win32" or not hasattr(os, "add_dll_directory"):
        return
    candidates = [
        os.environ.get("YUKTHI_DLL_DIR"),
        r"C:\msys64\ucrt64\bin",
        r"C:\msys64\mingw64\bin",
        r"C:\Strawberry\c\bin",
    ]
    for directory in candidates:
        if directory and os.path.isdir(directory):
            try:
                os.add_dll_directory(directory)
            except OSError:
                # Not fatal: the dependency may already be resolvable, and a directory we
                # cannot register is not a reason to refuse to try the load.
                pass


def _declare(lib: ctypes.CDLL) -> None:
    """Declare argtypes and restype for every entry point. See the module docstring."""
    c_double_p = ctypes.POINTER(ctypes.c_double)
    c_int_p = ctypes.POINTER(ctypes.c_int)
    model_p = ctypes.c_void_p
    options_p = ctypes.c_void_p
    solution_p = ctypes.c_void_p

    lib.YUKTHI_version.argtypes = []
    lib.YUKTHI_version.restype = ctypes.c_char_p
    lib.YUKTHI_last_error.argtypes = []
    lib.YUKTHI_last_error.restype = ctypes.c_char_p
    lib.YUKTHI_infinity.argtypes = []
    lib.YUKTHI_infinity.restype = ctypes.c_double

    lib.YUKTHI_model_create.argtypes = []
    lib.YUKTHI_model_create.restype = model_p
    lib.YUKTHI_model_free.argtypes = [model_p]
    lib.YUKTHI_model_free.restype = None
    lib.YUKTHI_model_read.argtypes = [model_p, ctypes.c_char_p]
    lib.YUKTHI_model_read.restype = ctypes.c_int
    lib.YUKTHI_model_set_maximize.argtypes = [model_p, ctypes.c_int]
    lib.YUKTHI_model_set_maximize.restype = ctypes.c_int
    lib.YUKTHI_model_set_objective_offset.argtypes = [model_p, ctypes.c_double]
    lib.YUKTHI_model_set_objective_offset.restype = ctypes.c_int
    lib.YUKTHI_model_add_column.argtypes = [
        model_p, ctypes.c_double, ctypes.c_double, ctypes.c_double, ctypes.c_int,
        ctypes.c_char_p, c_int_p,
    ]
    lib.YUKTHI_model_add_column.restype = ctypes.c_int
    lib.YUKTHI_model_add_row.argtypes = [
        model_p, ctypes.c_double, ctypes.c_double, ctypes.c_char_p, c_int_p,
    ]
    lib.YUKTHI_model_add_row.restype = ctypes.c_int
    lib.YUKTHI_model_set_coefficient.argtypes = [
        model_p, ctypes.c_int, ctypes.c_int, ctypes.c_double,
    ]
    lib.YUKTHI_model_set_coefficient.restype = ctypes.c_int
    lib.YUKTHI_model_set_quadratic_coefficient.argtypes = [
        model_p, ctypes.c_int, ctypes.c_int, ctypes.c_double,
    ]
    lib.YUKTHI_model_set_quadratic_coefficient.restype = ctypes.c_int
    for name in ("YUKTHI_model_num_cols", "YUKTHI_model_num_rows",
                 "YUKTHI_model_num_nonzeros"):
        getattr(lib, name).argtypes = [model_p]
        getattr(lib, name).restype = ctypes.c_int
    lib.YUKTHI_model_validate.argtypes = [model_p]
    lib.YUKTHI_model_validate.restype = ctypes.c_int

    lib.YUKTHI_options_create.argtypes = []
    lib.YUKTHI_options_create.restype = options_p
    lib.YUKTHI_options_free.argtypes = [options_p]
    lib.YUKTHI_options_free.restype = None
    lib.YUKTHI_options_set_bool.argtypes = [options_p, ctypes.c_char_p, ctypes.c_int]
    lib.YUKTHI_options_set_bool.restype = ctypes.c_int
    lib.YUKTHI_options_set_int.argtypes = [options_p, ctypes.c_char_p, ctypes.c_long]
    lib.YUKTHI_options_set_int.restype = ctypes.c_int
    lib.YUKTHI_options_set_double.argtypes = [options_p, ctypes.c_char_p, ctypes.c_double]
    lib.YUKTHI_options_set_double.restype = ctypes.c_int
    lib.YUKTHI_options_set_string.argtypes = [options_p, ctypes.c_char_p, ctypes.c_char_p]
    lib.YUKTHI_options_set_string.restype = ctypes.c_int

    lib.YUKTHI_solve.argtypes = [model_p, options_p, ctypes.POINTER(ctypes.c_void_p)]
    lib.YUKTHI_solve.restype = ctypes.c_int
    lib.YUKTHI_solution_free.argtypes = [solution_p]
    lib.YUKTHI_solution_free.restype = None
    lib.YUKTHI_solution_status.argtypes = [solution_p]
    lib.YUKTHI_solution_status.restype = ctypes.c_int
    lib.YUKTHI_solution_message.argtypes = [solution_p]
    lib.YUKTHI_solution_message.restype = ctypes.c_char_p
    for name in ("YUKTHI_solution_objective", "YUKTHI_solution_dual_bound",
                 "YUKTHI_solution_seconds", "YUKTHI_solution_primal_infeasibility",
                 "YUKTHI_solution_dual_infeasibility",
                 "YUKTHI_solution_integrality_violation"):
        getattr(lib, name).argtypes = [solution_p]
        getattr(lib, name).restype = ctypes.c_double
    for name in ("YUKTHI_solution_iterations", "YUKTHI_solution_nodes"):
        getattr(lib, name).argtypes = [solution_p]
        getattr(lib, name).restype = ctypes.c_long
    for name in ("YUKTHI_solution_col_values", "YUKTHI_solution_row_activities",
                 "YUKTHI_solution_row_duals", "YUKTHI_solution_col_duals"):
        getattr(lib, name).argtypes = [solution_p, c_double_p, ctypes.c_int]
        getattr(lib, name).restype = ctypes.c_int


_cached: ctypes.CDLL | None = None


def load() -> ctypes.CDLL:
    """Load the shared library once and return it, with every signature declared."""
    global _cached
    if _cached is not None:
        return _cached

    _add_dependency_directories()

    tried: list[str] = []
    for path in _candidate_paths():
        if not path.is_file():
            tried.append(f"{path}  (not present)")
            continue
        try:
            library = ctypes.CDLL(str(path))
        except OSError as error:
            # Reported rather than skipped. A library that EXISTS and will not load is a
            # different problem from one that is missing - usually a dependency Windows
            # cannot find - and telling the two apart is most of the diagnosis.
            tried.append(f"{path}  (present, failed to load: {error})")
            continue
        _declare(library)
        _cached = library
        return library

    raise YUKTHIError(
        "could not load the YUKTHI shared library. Build it with\n"
        "    scripts/configure.sh build Release && cmake --build build -j\n"
        "or set YUKTHI_LIBRARY to its full path. On Windows, if the library is present but\n"
        "will not load, its zlib1.dll dependency is probably not on the search path - set\n"
        "YUKTHI_DLL_DIR to the directory holding it.\n\nTried:\n  " + "\n  ".join(tried)
    )
