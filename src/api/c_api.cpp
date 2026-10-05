// SPDX-License-Identifier: Apache-2.0
// YUKTHI - C API implementation.
//
// Every entry point here does three things and nothing else: validate its arguments, call
// into the C++ core, and convert whatever comes back - including an exception - into a
// status code. There is no solver logic in this file and there must not be. The moment a
// decision lives only in the C wrapper, the C++ callers and the CLI stop agreeing with the
// bindings about what the library does.
//
// THE MATRIX IS ACCUMULATED, NOT BUILT. YUKTHI::SparseMatrix is frozen once finalized, but
// a C caller sets coefficients one at a time in whatever order suits it. So the handle keeps
// triplets in a map and materialises the matrix at solve time. The map also gives
// set_coefficient its REPLACE semantics for free, which is deliberately unlike the MPS
// reader's "a repeated entry is an error": a programmatic caller overwriting a cell is
// ordinary, whereas a file containing the same cell twice is a defect in the file.

#include "YUKTHI/YUKTHI.h"

#include <exception>
#include <map>
#include <new>
#include <string>
#include <utility>
#include <vector>

#include "YUKTHI/io.hpp"
#include "YUKTHI/model.hpp"
#include "YUKTHI/options.hpp"
#include "YUKTHI/version.hpp"

namespace {

// Thread-local so that concurrent solves cannot overwrite each other's diagnostics. A caller
// debugging one failing solve while another thread is busy would otherwise read a message
// belonging to a model it has never seen.
thread_local std::string g_error;

YUKTHI_status fail(YUKTHI_status code, std::string message) {
  g_error = std::move(message);
  return code;
}

YUKTHI_status ok() {
  g_error.clear();
  return YUKTHI_OK;
}

YUKTHI_solve_status to_c_status(YUKTHI::SolveStatus status) {
  switch (status) {
    case YUKTHI::SolveStatus::kNotSolved: return YUKTHI_NOT_SOLVED;
    case YUKTHI::SolveStatus::kOptimal: return YUKTHI_OPTIMAL;
    case YUKTHI::SolveStatus::kFeasible: return YUKTHI_FEASIBLE;
    case YUKTHI::SolveStatus::kInfeasible: return YUKTHI_INFEASIBLE;
    case YUKTHI::SolveStatus::kUnbounded: return YUKTHI_UNBOUNDED;
    case YUKTHI::SolveStatus::kInfeasibleOrUnbounded: return YUKTHI_INFEASIBLE_OR_UNBOUNDED;
    case YUKTHI::SolveStatus::kIterationLimit: return YUKTHI_ITERATION_LIMIT;
    case YUKTHI::SolveStatus::kTimeLimit: return YUKTHI_TIME_LIMIT;
    case YUKTHI::SolveStatus::kNodeLimit: return YUKTHI_NODE_LIMIT;
    case YUKTHI::SolveStatus::kNumericalError: return YUKTHI_NUMERICAL_ERROR;
    case YUKTHI::SolveStatus::kModelError: return YUKTHI_MODEL_ERROR;
  }
  return YUKTHI_NOT_SOLVED;
}

/// Copy one of the solution's vectors out, refusing a size mismatch.
YUKTHI_status copy_vector(const std::vector<double>& source, double* destination, int count,
                           const char* what) {
  if (destination == nullptr) return fail(YUKTHI_ERROR_ARGUMENT, "destination is null");
  if (count < 0 || static_cast<std::size_t>(count) != source.size()) {
    return fail(YUKTHI_ERROR_ARGUMENT, std::string("wrong buffer size for ") + what +
                                            ": the solution has " +
                                            std::to_string(source.size()) + " entries, " +
                                            std::to_string(count) + " were offered");
  }
  for (std::size_t i = 0; i < source.size(); ++i) destination[i] = source[i];
  return ok();
}

/// Reject an option the registry does not have, or has with another type, BEFORE the typed
/// setter is reached.
///
/// This is not defensive style, it is a hard requirement of the boundary. The C++ typed
/// accessors treat an unknown name as a programmer error and call std::abort() - correct for
/// C++ code, where a typo is a bug the compiler nearly caught, and fatal here. A C caller
/// passing a mistyped option string would take down the host process, and the Python
/// bindings that will sit on this API would take the interpreter with them. Measured: the
/// test for this crashed with 0xC0000409 until the check existed.
YUKTHI_status check_option(const char* name, YUKTHI::OptionType wanted) {
  if (!YUKTHI::Options::exists(name)) {
    return fail(YUKTHI_ERROR_OPTION, std::string("unknown option '") + name +
                                          "'; run `YUKTHI options` for the list");
  }
  const YUKTHI::OptionSpec* spec = YUKTHI::Options::find_spec(name);
  if (spec != nullptr && spec->type != wanted) {
    return fail(YUKTHI_ERROR_OPTION,
                std::string("option '") + name + "' is not of the type this setter writes");
  }
  return YUKTHI_OK;
}

}  // namespace

// The handles. Defined here so the header can keep them opaque.
struct YUKTHI_model {
  YUKTHI::Model model;
  // (row, col) -> value, pending until the matrix is materialised.
  std::map<std::pair<int, int>, double> entries;
  std::map<std::pair<int, int>, double> quadratic;
};

struct YUKTHI_options {
  YUKTHI::Options options;
};

struct YUKTHI_solution {
  YUKTHI::Solution solution;
};

namespace {

/// Run `body`, converting any exception into a status code.
///
/// An exception crossing into C is undefined behaviour, so every escape route has to be
/// closed - including ones this file does not know about, hence the bare `catch (...)`.
///
/// A template rather than the macro this started as. A function-like macro splits its
/// argument on commas, so a body containing `entries[{row, col}]` arrives as two arguments
/// and the preprocessor rejects it - which it duly did, in four places.
template <typename Body>
YUKTHI_status guarded(Body&& body) {
  try {
    return body();
  } catch (const std::bad_alloc&) {
    return fail(YUKTHI_ERROR_MEMORY, "out of memory");
  } catch (const std::exception& error) {
    return fail(YUKTHI_ERROR_INTERNAL, error.what());
  } catch (...) {
    return fail(YUKTHI_ERROR_INTERNAL, "an unknown exception crossed the C API");
  }
}

}  // namespace

extern "C" {

// ---- Library -----------------------------------------------------------------------------

const char* YUKTHI_version(void) {
  static const std::string version = YUKTHI::version_string();
  return version.c_str();
}

const char* YUKTHI_last_error(void) {
  return g_error.c_str();
}

double YUKTHI_infinity(void) {
  return YUKTHI::kInfinity;
}

// ---- Model -------------------------------------------------------------------------------

YUKTHI_model* YUKTHI_model_create(void) {
  try {
    return new YUKTHI_model();
  } catch (...) {
    return nullptr;
  }
}

void YUKTHI_model_free(YUKTHI_model* model) {
  delete model;
}

YUKTHI_status YUKTHI_model_read(YUKTHI_model* model, const char* path) {
  if (model == nullptr || path == nullptr) {
    return fail(YUKTHI_ERROR_ARGUMENT, "model or path is null");
  }
  return guarded([&]() -> YUKTHI_status {
    YUKTHI::Model fresh;
    const YUKTHI::io::ReadResult result = YUKTHI::io::read_model(path, &fresh);
    if (!result.ok) return fail(YUKTHI_ERROR_IO, result.error);
    // Only on success. A half-populated handle after a failed read would be the worst of
    // both outcomes: the caller sees an error and still holds something solvable.
    model->model = std::move(fresh);
    model->entries.clear();
    model->quadratic.clear();
    return ok();
  });
}

YUKTHI_status YUKTHI_model_set_maximize(YUKTHI_model* model, int maximize) {
  if (model == nullptr) return fail(YUKTHI_ERROR_ARGUMENT, "model is null");
  model->model.sense =
      maximize != 0 ? YUKTHI::ObjSense::kMaximize : YUKTHI::ObjSense::kMinimize;
  return ok();
}

YUKTHI_status YUKTHI_model_set_objective_offset(YUKTHI_model* model, double offset) {
  if (model == nullptr) return fail(YUKTHI_ERROR_ARGUMENT, "model is null");
  model->model.objective_offset = offset;
  return ok();
}

YUKTHI_status YUKTHI_model_add_column(YUKTHI_model* model, double cost, double lower,
                                        double upper, int is_integer, const char* name,
                                        int* index) {
  if (model == nullptr) return fail(YUKTHI_ERROR_ARGUMENT, "model is null");
  return guarded([&]() -> YUKTHI_status {
    YUKTHI::Model& m = model->model;
    const int position = static_cast<int>(m.col_cost.size());
    m.col_cost.push_back(cost);
    m.col_lower.push_back(lower);
    m.col_upper.push_back(upper);
    m.col_type.push_back(is_integer != 0 ? YUKTHI::VarType::kInteger
                                         : YUKTHI::VarType::kContinuous);
    // Names are all-or-nothing: the solution writer and the verifier match on them, so a
    // model with names for only some columns would write a file neither can read back.
    // Columns added without one are given a positional name so the vector stays complete.
    m.col_names.push_back(name != nullptr ? std::string(name)
                                          : "C" + std::to_string(position + 1));
    if (index != nullptr) *index = position;
    return ok();
  });
}

YUKTHI_status YUKTHI_model_add_row(YUKTHI_model* model, double lower, double upper,
                                     const char* name, int* index) {
  if (model == nullptr) return fail(YUKTHI_ERROR_ARGUMENT, "model is null");
  return guarded([&]() -> YUKTHI_status {
    YUKTHI::Model& m = model->model;
    const int position = static_cast<int>(m.row_lower.size());
    m.row_lower.push_back(lower);
    m.row_upper.push_back(upper);
    m.row_names.push_back(name != nullptr ? std::string(name)
                                          : "R" + std::to_string(position + 1));
    if (index != nullptr) *index = position;
    return ok();
  });
}

YUKTHI_status YUKTHI_model_set_coefficient(YUKTHI_model* model, int row, int col,
                                             double value) {
  if (model == nullptr) return fail(YUKTHI_ERROR_ARGUMENT, "model is null");
  const YUKTHI::Model& m = model->model;
  if (row < 0 || row >= static_cast<int>(m.row_lower.size())) {
    return fail(YUKTHI_ERROR_ARGUMENT, "row " + std::to_string(row) +
                                            " is outside the model, which has " +
                                            std::to_string(m.row_lower.size()) + " row(s)");
  }
  if (col < 0 || col >= static_cast<int>(m.col_cost.size())) {
    return fail(YUKTHI_ERROR_ARGUMENT, "column " + std::to_string(col) +
                                            " is outside the model, which has " +
                                            std::to_string(m.col_cost.size()) + " column(s)");
  }
  return guarded([&]() -> YUKTHI_status {
    if (value == 0.0) {
      model->entries.erase({row, col});
    } else {
      model->entries[{row, col}] = value;
    }
    return ok();
  });
}

YUKTHI_status YUKTHI_model_set_quadratic_coefficient(YUKTHI_model* model, int row, int col,
                                                       double value) {
  if (model == nullptr) return fail(YUKTHI_ERROR_ARGUMENT, "model is null");
  const int columns = static_cast<int>(model->model.col_cost.size());
  if (row < 0 || row >= columns || col < 0 || col >= columns) {
    return fail(YUKTHI_ERROR_ARGUMENT, "quadratic index (" + std::to_string(row) + ", " +
                                            std::to_string(col) +
                                            ") is outside the model, which has " +
                                            std::to_string(columns) + " column(s)");
  }
  return guarded([&]() -> YUKTHI_status {
    // Normalised to the lower triangle, so (i, j) and (j, i) name one entry of the symmetric
    // Q rather than two. A caller giving both would otherwise set the same coefficient twice
    // and, on a naive implementation, double it.
    const int lower_row = row > col ? row : col;
    const int lower_col = row > col ? col : row;
    if (value == 0.0) {
      model->quadratic.erase({lower_row, lower_col});
    } else {
      model->quadratic[{lower_row, lower_col}] = value;
    }
    return ok();
  });
}

int YUKTHI_model_num_cols(const YUKTHI_model* model) {
  return model == nullptr ? 0 : static_cast<int>(model->model.col_cost.size());
}

int YUKTHI_model_num_rows(const YUKTHI_model* model) {
  return model == nullptr ? 0 : static_cast<int>(model->model.row_lower.size());
}

int YUKTHI_model_num_nonzeros(const YUKTHI_model* model) {
  if (model == nullptr) return 0;
  // Pending triplets when the caller built the model programmatically; the frozen matrix
  // when it was read from a file. Reporting only one of the two would make this function
  // answer a different question depending on how the handle was populated.
  const int pending = static_cast<int>(model->entries.size());
  return pending > 0 ? pending : static_cast<int>(model->model.matrix.num_nonzeros());
}

namespace {

/// Materialise the pending triplets into the Model's frozen matrices.
///
/// Called on a COPY at solve time rather than mutating the handle, so that a caller can
/// solve, add another column, and solve again without the first solve having frozen
/// anything underneath it.
void materialise(const YUKTHI_model& handle, YUKTHI::Model* out) {
  *out = handle.model;
  const auto rows = static_cast<YUKTHI::Index>(out->row_lower.size());
  const auto cols = static_cast<YUKTHI::Index>(out->col_cost.size());

  if (!handle.entries.empty() || out->matrix.num_nonzeros() == 0) {
    out->matrix.reset(rows, cols);
    out->matrix.reserve(handle.entries.size());
    for (const auto& entry : handle.entries) {
      out->matrix.add_entry(static_cast<YUKTHI::Index>(entry.first.first),
                            static_cast<YUKTHI::Index>(entry.first.second), entry.second);
    }
    out->matrix.finalize();
  }

  if (!handle.quadratic.empty()) {
    out->hessian.reset(cols, cols);
    out->hessian.reserve(handle.quadratic.size());
    for (const auto& entry : handle.quadratic) {
      out->hessian.add_entry(static_cast<YUKTHI::Index>(entry.first.first),
                             static_cast<YUKTHI::Index>(entry.first.second), entry.second);
    }
    out->hessian.finalize();
  }
}

}  // namespace

YUKTHI_status YUKTHI_model_validate(const YUKTHI_model* model) {
  if (model == nullptr) return fail(YUKTHI_ERROR_ARGUMENT, "model is null");
  return guarded([&]() -> YUKTHI_status {
    YUKTHI::Model built;
    materialise(*model, &built);
    const std::string problem = built.validate();
    if (!problem.empty()) return fail(YUKTHI_ERROR_MODEL, problem);
    return ok();
  });
}

// ---- Options -------------------------------------------------------------------------------

YUKTHI_options* YUKTHI_options_create(void) {
  try {
    return new YUKTHI_options();
  } catch (...) {
    return nullptr;
  }
}

void YUKTHI_options_free(YUKTHI_options* options) {
  delete options;
}

YUKTHI_status YUKTHI_options_set_bool(YUKTHI_options* options, const char* name, int value) {
  if (options == nullptr || name == nullptr) {
    return fail(YUKTHI_ERROR_ARGUMENT, "options or name is null");
  }
  const YUKTHI_status check = check_option(name, YUKTHI::OptionType::Bool);
  if (check != YUKTHI_OK) return check;
  return guarded([&]() -> YUKTHI_status {
    options->options.set_bool(name, value != 0);
    return ok();
  });
}

YUKTHI_status YUKTHI_options_set_int(YUKTHI_options* options, const char* name, long value) {
  if (options == nullptr || name == nullptr) {
    return fail(YUKTHI_ERROR_ARGUMENT, "options or name is null");
  }
  const YUKTHI_status check = check_option(name, YUKTHI::OptionType::Int);
  if (check != YUKTHI_OK) return check;
  return guarded([&]() -> YUKTHI_status {
    options->options.set_int(name, static_cast<std::int64_t>(value));
    return ok();
  });
}

YUKTHI_status YUKTHI_options_set_double(YUKTHI_options* options, const char* name,
                                          double value) {
  if (options == nullptr || name == nullptr) {
    return fail(YUKTHI_ERROR_ARGUMENT, "options or name is null");
  }
  const YUKTHI_status check = check_option(name, YUKTHI::OptionType::Double);
  if (check != YUKTHI_OK) return check;
  return guarded([&]() -> YUKTHI_status {
    options->options.set_double(name, value);
    return ok();
  });
}

YUKTHI_status YUKTHI_options_set_string(YUKTHI_options* options, const char* name,
                                          const char* value) {
  if (options == nullptr || name == nullptr || value == nullptr) {
    return fail(YUKTHI_ERROR_ARGUMENT, "options, name or value is null");
  }
  const YUKTHI_status check = check_option(name, YUKTHI::OptionType::String);
  if (check != YUKTHI_OK) return check;
  return guarded([&]() -> YUKTHI_status {
    options->options.set_string(name, value);
    return ok();
  });
}

// ---- Solve ---------------------------------------------------------------------------------

YUKTHI_status YUKTHI_solve(const YUKTHI_model* model, const YUKTHI_options* options,
                             YUKTHI_solution** solution) {
  if (model == nullptr || solution == nullptr) {
    return fail(YUKTHI_ERROR_ARGUMENT, "model or solution pointer is null");
  }
  *solution = nullptr;
  return guarded([&]() -> YUKTHI_status {
    YUKTHI::Model built;
    materialise(*model, &built);

    YUKTHI::Options effective;
    if (options != nullptr) effective = options->options;

    auto* result = new YUKTHI_solution();
    result->solution = YUKTHI::solve(built, effective);
    *solution = result;
    return ok();
  });
}

void YUKTHI_solution_free(YUKTHI_solution* solution) {
  delete solution;
}

YUKTHI_solve_status YUKTHI_solution_status(const YUKTHI_solution* solution) {
  return solution == nullptr ? YUKTHI_NOT_SOLVED : to_c_status(solution->solution.status);
}

const char* YUKTHI_solution_message(const YUKTHI_solution* solution) {
  return solution == nullptr ? "" : solution->solution.message.c_str();
}

double YUKTHI_solution_objective(const YUKTHI_solution* solution) {
  return solution == nullptr ? 0.0 : solution->solution.objective;
}

double YUKTHI_solution_dual_bound(const YUKTHI_solution* solution) {
  return solution == nullptr ? 0.0 : solution->solution.dual_bound;
}

long YUKTHI_solution_iterations(const YUKTHI_solution* solution) {
  return solution == nullptr ? 0 : static_cast<long>(solution->solution.iterations);
}

long YUKTHI_solution_nodes(const YUKTHI_solution* solution) {
  return solution == nullptr ? 0 : static_cast<long>(solution->solution.nodes);
}

double YUKTHI_solution_seconds(const YUKTHI_solution* solution) {
  return solution == nullptr ? 0.0 : solution->solution.solve_seconds;
}

double YUKTHI_solution_primal_infeasibility(const YUKTHI_solution* solution) {
  return solution == nullptr ? 0.0 : solution->solution.primal_infeasibility;
}

double YUKTHI_solution_dual_infeasibility(const YUKTHI_solution* solution) {
  return solution == nullptr ? 0.0 : solution->solution.dual_infeasibility;
}

double YUKTHI_solution_integrality_violation(const YUKTHI_solution* solution) {
  return solution == nullptr ? 0.0 : solution->solution.integrality_violation;
}

YUKTHI_status YUKTHI_solution_col_values(const YUKTHI_solution* solution, double* values,
                                           int count) {
  if (solution == nullptr) return fail(YUKTHI_ERROR_ARGUMENT, "solution is null");
  return copy_vector(solution->solution.col_value, values, count, "column values");
}

YUKTHI_status YUKTHI_solution_row_activities(const YUKTHI_solution* solution, double* values,
                                               int count) {
  if (solution == nullptr) return fail(YUKTHI_ERROR_ARGUMENT, "solution is null");
  return copy_vector(solution->solution.row_activity, values, count, "row activities");
}

YUKTHI_status YUKTHI_solution_row_duals(const YUKTHI_solution* solution, double* values,
                                          int count) {
  if (solution == nullptr) return fail(YUKTHI_ERROR_ARGUMENT, "solution is null");
  return copy_vector(solution->solution.row_dual, values, count, "row duals");
}

YUKTHI_status YUKTHI_solution_col_duals(const YUKTHI_solution* solution, double* values,
                                          int count) {
  if (solution == nullptr) return fail(YUKTHI_ERROR_ARGUMENT, "solution is null");
  return copy_vector(solution->solution.col_dual, values, count, "column duals");
}

}  // extern "C"
