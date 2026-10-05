/* SPDX-License-Identifier: Apache-2.0
 *
 * YUKTHI - C API.
 *
 * A C89-compatible surface over the C++ core, for callers that cannot or will not link C++:
 * other languages' FFIs, and the Python bindings that sit on top of this rather than on the
 * C++ types directly. Nothing here exposes a C++ type, a template, or an exception - the
 * whole point is a boundary a `ctypes` script can cross.
 *
 * THE SHAPE IS DELIBERATELY FAMILIAR. create / set / solve / query, string-named options,
 * integer status codes. That is the surface every industrial solver presents, and matching
 * it is what makes this drop-in adoptable for someone with existing CPLEX or Gurobi calling
 * code. Per CLAUDE.md that is interface compatibility, not derivation: it is written from
 * the public shape those APIs document, and no solver source was read to produce it.
 *
 * ERRORS ARE RETURNED, NEVER THROWN. Every fallible call returns a YUKTHI_status. When one
 * is not YUKTHI_OK, YUKTHI_last_error() carries a human-readable reason for that thread.
 * A C caller cannot catch a C++ exception, so every entry point that could raise one wraps
 * its body and converts.
 *
 * OWNERSHIP. Handles returned by a *_create or *_solve function are owned by the caller and
 * must be released with the matching *_free. Every `const char*` returned by this API points
 * into storage owned by the library and is valid until the next call ON THE SAME THREAD that
 * could replace it - copy it if you need to keep it.
 *
 * THREADING. Handles are not internally synchronised: two threads must not touch one handle
 * at once. Distinct handles in distinct threads are fine, and the error string is
 * thread-local, so concurrent solves do not overwrite each other's diagnostics.
 */
#ifndef YUKTHI_H
#define YUKTHI_H

#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

/* ---- Status codes ---------------------------------------------------------------------- */

typedef enum YUKTHI_status {
  YUKTHI_OK = 0,
  YUKTHI_ERROR_ARGUMENT = 1, /**< a null handle, or an index outside the model */
  YUKTHI_ERROR_IO = 2,       /**< the file could not be read or parsed */
  YUKTHI_ERROR_MODEL = 3,    /**< the model is not internally consistent; see last_error */
  YUKTHI_ERROR_OPTION = 4,   /**< no such option, or a value it will not accept */
  YUKTHI_ERROR_MEMORY = 5,   /**< allocation failed */
  YUKTHI_ERROR_INTERNAL = 6  /**< a C++ exception crossed the boundary and was converted */
} YUKTHI_status;

/** Mirrors YUKTHI::SolveStatus. Values are stable; new ones are appended. */
typedef enum YUKTHI_solve_status {
  YUKTHI_NOT_SOLVED = 0,
  YUKTHI_OPTIMAL = 1,
  YUKTHI_FEASIBLE = 2, /**< a usable point; optimality NOT proven */
  YUKTHI_INFEASIBLE = 3,
  YUKTHI_UNBOUNDED = 4,
  /** Not both feasible and bounded, without separating the two. Some first-order
   *  methods legitimately stop here; reporting it beats guessing which it was. */
  YUKTHI_INFEASIBLE_OR_UNBOUNDED = 10,
  YUKTHI_ITERATION_LIMIT = 5,
  YUKTHI_TIME_LIMIT = 6,
  YUKTHI_NODE_LIMIT = 7,
  YUKTHI_NUMERICAL_ERROR = 8,
  YUKTHI_MODEL_ERROR = 9
} YUKTHI_solve_status;

/* ---- Opaque handles -------------------------------------------------------------------- */

typedef struct YUKTHI_model YUKTHI_model;
typedef struct YUKTHI_options YUKTHI_options;
typedef struct YUKTHI_solution YUKTHI_solution;

/* ---- Library ---------------------------------------------------------------------------- */

/** Version string, e.g. "0.1.0 (abc1234, Release)". Never NULL. */
const char* YUKTHI_version(void);

/**
 * Human-readable reason for the most recent failing call ON THIS THREAD.
 *
 * Returns an empty string when nothing has failed. The pointer is valid until the next
 * failing call on this thread.
 */
const char* YUKTHI_last_error(void);

/** The infinity this API uses for absent bounds. Bounds at or beyond it are treated as free. */
double YUKTHI_infinity(void);

/* ---- Model ------------------------------------------------------------------------------ */

/** An empty minimisation model with no rows or columns. NULL only on allocation failure. */
YUKTHI_model* YUKTHI_model_create(void);
void YUKTHI_model_free(YUKTHI_model* model);

/**
 * Read a model from an MPS, QPS or LP file, choosing the reader by extension and content.
 *
 * On failure the handle is left unmodified and last_error carries the parser's message,
 * which names the line - these readers refuse ambiguous files rather than guessing, so a
 * failure here is usually a genuine defect in the file.
 */
YUKTHI_status YUKTHI_model_read(YUKTHI_model* model, const char* path);

/** 0 to minimise (the default), non-zero to maximise. */
YUKTHI_status YUKTHI_model_set_maximize(YUKTHI_model* model, int maximize);

/** Constant added to the objective. */
YUKTHI_status YUKTHI_model_set_objective_offset(YUKTHI_model* model, double offset);

/**
 * Append one column, returning its index through `index` when that is non-NULL.
 *
 * `name` may be NULL. Use +/- YUKTHI_infinity() for absent bounds. `is_integer` non-zero
 * makes this an integer column, which makes the model a MILP.
 */
YUKTHI_status YUKTHI_model_add_column(YUKTHI_model* model, double cost, double lower,
                                        double upper, int is_integer, const char* name,
                                        int* index);

/**
 * Append one row, returning its index through `index` when that is non-NULL.
 *
 * A range row is lower <= a'x <= upper; pass equal bounds for an equality, and an infinite
 * bound on one side for a one-sided inequality.
 */
YUKTHI_status YUKTHI_model_add_row(YUKTHI_model* model, double lower, double upper,
                                     const char* name, int* index);

/**
 * Set one constraint-matrix coefficient.
 *
 * Entries may be supplied in any order. Setting the same (row, column) twice REPLACES the
 * earlier value rather than summing it - summing is what MPS files mean by a repeated entry
 * and this API deliberately does not inherit that, because silently doubling a coefficient
 * is not a mistake a caller can see in the answer.
 *
 * A value of exactly zero removes the entry.
 */
YUKTHI_status YUKTHI_model_set_coefficient(YUKTHI_model* model, int row, int col,
                                             double value);

/**
 * Set one entry of the objective Hessian Q, making this a quadratic program.
 *
 * The objective is c'x + 0.5 x'Qx and Q is symmetric, so ONLY THE LOWER TRIANGLE is stored:
 * an entry (i, j) with i > j stands for both Q[i][j] and Q[j][i]. Passing (j, i) instead is
 * accepted and means the same thing. The 0.5 belongs to the objective, not to the value you
 * pass here - the same convention QPS files use.
 *
 * A non-convex Q is REFUSED at solve time with YUKTHI_MODEL_ERROR rather than solved to a
 * local point.
 */
YUKTHI_status YUKTHI_model_set_quadratic_coefficient(YUKTHI_model* model, int row, int col,
                                                       double value);

int YUKTHI_model_num_cols(const YUKTHI_model* model);
int YUKTHI_model_num_rows(const YUKTHI_model* model);
int YUKTHI_model_num_nonzeros(const YUKTHI_model* model);

/**
 * Check the model for internal consistency without solving it.
 *
 * Returns YUKTHI_OK when the model is well formed, YUKTHI_ERROR_MODEL otherwise with the
 * reason in last_error.
 */
YUKTHI_status YUKTHI_model_validate(const YUKTHI_model* model);

/* ---- Options ---------------------------------------------------------------------------- */

/** Options preset to their documented defaults. Run `YUKTHI options` to list them. */
YUKTHI_options* YUKTHI_options_create(void);
void YUKTHI_options_free(YUKTHI_options* options);

YUKTHI_status YUKTHI_options_set_bool(YUKTHI_options* options, const char* name, int value);
YUKTHI_status YUKTHI_options_set_int(YUKTHI_options* options, const char* name, long value);
YUKTHI_status YUKTHI_options_set_double(YUKTHI_options* options, const char* name,
                                          double value);
YUKTHI_status YUKTHI_options_set_string(YUKTHI_options* options, const char* name,
                                          const char* value);

/* ---- Solve ------------------------------------------------------------------------------ */

/**
 * Solve, writing a newly allocated solution handle to `*solution`.
 *
 * `options` may be NULL for the defaults. The return value reports whether the CALL
 * succeeded, not what the solver concluded: a model proved infeasible returns YUKTHI_OK
 * with a solution whose status is YUKTHI_INFEASIBLE. Check both.
 */
YUKTHI_status YUKTHI_solve(const YUKTHI_model* model, const YUKTHI_options* options,
                             YUKTHI_solution** solution);

void YUKTHI_solution_free(YUKTHI_solution* solution);

YUKTHI_solve_status YUKTHI_solution_status(const YUKTHI_solution* solution);

/** Explanatory message from the solver. Empty when there is nothing to add. */
const char* YUKTHI_solution_message(const YUKTHI_solution* solution);

double YUKTHI_solution_objective(const YUKTHI_solution* solution);

/** Best proven bound. Equals the objective when optimality was proved. */
double YUKTHI_solution_dual_bound(const YUKTHI_solution* solution);

long YUKTHI_solution_iterations(const YUKTHI_solution* solution);
long YUKTHI_solution_nodes(const YUKTHI_solution* solution);
double YUKTHI_solution_seconds(const YUKTHI_solution* solution);

/**
 * MEASURED quality of the returned point, not asserted by the engine about itself.
 *
 * These are recomputed from the returned vectors before the solver reports anything, and
 * the dispatcher downgrades a status that disagrees with them. A caller writing its own
 * acceptance test should read these rather than trusting the status alone.
 */
double YUKTHI_solution_primal_infeasibility(const YUKTHI_solution* solution);
double YUKTHI_solution_dual_infeasibility(const YUKTHI_solution* solution);
double YUKTHI_solution_integrality_violation(const YUKTHI_solution* solution);

/**
 * Copy the primal column values into `values`, which must have room for `count` doubles.
 *
 * `count` must equal the model's column count; a mismatch returns YUKTHI_ERROR_ARGUMENT
 * rather than writing a partial vector, because a caller that has the dimension wrong is
 * about to misread every number it copies.
 */
YUKTHI_status YUKTHI_solution_col_values(const YUKTHI_solution* solution, double* values,
                                           int count);

/** Row activities a'x, same contract as YUKTHI_solution_col_values. */
YUKTHI_status YUKTHI_solution_row_activities(const YUKTHI_solution* solution, double* values,
                                               int count);

/** Row dual values (shadow prices), same contract. */
YUKTHI_status YUKTHI_solution_row_duals(const YUKTHI_solution* solution, double* values,
                                          int count);

/** Column reduced costs, same contract. */
YUKTHI_status YUKTHI_solution_col_duals(const YUKTHI_solution* solution, double* values,
                                          int count);

#ifdef __cplusplus
} /* extern "C" */
#endif

#endif /* YUKTHI_H */
