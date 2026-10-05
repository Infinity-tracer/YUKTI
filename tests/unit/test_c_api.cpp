// SPDX-License-Identifier: Apache-2.0
// YUKTHI - C API tests.
//
// These go through include/YUKTHI/YUKTHI.h ONLY. Nothing here includes model.hpp or calls
// YUKTHI::solve, because the thing under test is the boundary rather than the solver: a
// test that reached past the header would still pass if the C surface were wired to the
// wrong field, which is precisely the defect this layer can introduce and the core cannot.
//
// The answers are hand-derived rather than taken from a previous run, so a wrong wiring
// fails here instead of being frozen in as expected output.

#include <cmath>
#include <string>
#include <vector>

#include <gtest/gtest.h>

#include "YUKTHI/YUKTHI.h"

#include "support/temp_file.hpp"

namespace {

using YUKTHI::testing::TempFile;

/// RAII for the C handles, so a failing assertion cannot leak them.
struct ModelHandle {
  YUKTHI_model* handle = YUKTHI_model_create();
  ~ModelHandle() { YUKTHI_model_free(handle); }
  operator YUKTHI_model*() const { return handle; }
};

struct SolutionHandle {
  YUKTHI_solution* handle = nullptr;
  ~SolutionHandle() { YUKTHI_solution_free(handle); }
};

TEST(CApi, ReportsAVersionAndAnInfinity) {
  ASSERT_NE(YUKTHI_version(), nullptr);
  EXPECT_FALSE(std::string(YUKTHI_version()).empty());
  EXPECT_TRUE(std::isinf(YUKTHI_infinity()));
  EXPECT_GT(YUKTHI_infinity(), 0.0);
}

TEST(CApi, SolvesAnLpBuiltEntirelyThroughTheCSurface) {
  //   maximise  3x + 2y
  //   s.t.      x +  y <= 4
  //             x + 3y <= 6
  //             0 <= x <= 3,  y >= 0
  //
  // The vertex where both rows are tight is x = 3, y = 1, objective 11. x is at its upper
  // bound there, so this also exercises a boxed column rather than only the origin cone.
  ModelHandle model;
  ASSERT_NE(model.handle, nullptr);

  int x = -1;
  int y = -1;
  ASSERT_EQ(YUKTHI_model_add_column(model, 3.0, 0.0, 3.0, 0, "x", &x), YUKTHI_OK);
  ASSERT_EQ(YUKTHI_model_add_column(model, 2.0, 0.0, YUKTHI_infinity(), 0, "y", &y),
            YUKTHI_OK);
  EXPECT_EQ(x, 0);
  EXPECT_EQ(y, 1);

  int r0 = -1;
  int r1 = -1;
  ASSERT_EQ(YUKTHI_model_add_row(model, -YUKTHI_infinity(), 4.0, "c0", &r0), YUKTHI_OK);
  ASSERT_EQ(YUKTHI_model_add_row(model, -YUKTHI_infinity(), 6.0, "c1", &r1), YUKTHI_OK);

  ASSERT_EQ(YUKTHI_model_set_coefficient(model, r0, x, 1.0), YUKTHI_OK);
  ASSERT_EQ(YUKTHI_model_set_coefficient(model, r0, y, 1.0), YUKTHI_OK);
  ASSERT_EQ(YUKTHI_model_set_coefficient(model, r1, x, 1.0), YUKTHI_OK);
  ASSERT_EQ(YUKTHI_model_set_coefficient(model, r1, y, 3.0), YUKTHI_OK);
  ASSERT_EQ(YUKTHI_model_set_maximize(model, 1), YUKTHI_OK);

  EXPECT_EQ(YUKTHI_model_num_cols(model), 2);
  EXPECT_EQ(YUKTHI_model_num_rows(model), 2);
  EXPECT_EQ(YUKTHI_model_num_nonzeros(model), 4);
  ASSERT_EQ(YUKTHI_model_validate(model), YUKTHI_OK) << YUKTHI_last_error();

  SolutionHandle solution;
  ASSERT_EQ(YUKTHI_solve(model, nullptr, &solution.handle), YUKTHI_OK)
      << YUKTHI_last_error();
  ASSERT_NE(solution.handle, nullptr);
  ASSERT_EQ(YUKTHI_solution_status(solution.handle), YUKTHI_OPTIMAL)
      << YUKTHI_solution_message(solution.handle);
  EXPECT_NEAR(YUKTHI_solution_objective(solution.handle), 11.0, 1e-9);

  std::vector<double> values(2, 0.0);
  ASSERT_EQ(YUKTHI_solution_col_values(solution.handle, values.data(), 2), YUKTHI_OK);
  EXPECT_NEAR(values[0], 3.0, 1e-9);
  EXPECT_NEAR(values[1], 1.0, 1e-9);

  std::vector<double> activities(2, 0.0);
  ASSERT_EQ(YUKTHI_solution_row_activities(solution.handle, activities.data(), 2), YUKTHI_OK);
  EXPECT_NEAR(activities[0], 4.0, 1e-9);
  EXPECT_NEAR(activities[1], 6.0, 1e-9);

  // The MEASURED quality, which is what a caller writing its own acceptance test should read.
  EXPECT_LE(YUKTHI_solution_primal_infeasibility(solution.handle), 1e-7);
  EXPECT_GT(YUKTHI_solution_iterations(solution.handle), 0);
}

TEST(CApi, SettingACoefficientTwiceReplacesItRatherThanSummingIt) {
  // The MPS reader treats a repeated entry as an error, because in a FILE it is a defect.
  // Through an API, overwriting a cell is ordinary, and summing would silently double a
  // coefficient - a change the caller cannot see in the answer. The two layers therefore
  // differ deliberately, and that difference is worth pinning.
  //
  //   minimise x  s.t.  2x >= 6,  x >= 0   ->   x = 3.
  // If the second set_coefficient summed onto the first, the row would read 3x >= 6 and the
  // answer would be 2.
  ModelHandle model;
  int x = -1;
  int row = -1;
  ASSERT_EQ(YUKTHI_model_add_column(model, 1.0, 0.0, YUKTHI_infinity(), 0, "x", &x),
            YUKTHI_OK);
  ASSERT_EQ(YUKTHI_model_add_row(model, 6.0, YUKTHI_infinity(), "c", &row), YUKTHI_OK);

  ASSERT_EQ(YUKTHI_model_set_coefficient(model, row, x, 1.0), YUKTHI_OK);
  ASSERT_EQ(YUKTHI_model_set_coefficient(model, row, x, 2.0), YUKTHI_OK);
  EXPECT_EQ(YUKTHI_model_num_nonzeros(model), 1) << "the entry was duplicated, not replaced";

  SolutionHandle solution;
  ASSERT_EQ(YUKTHI_solve(model, nullptr, &solution.handle), YUKTHI_OK);
  ASSERT_EQ(YUKTHI_solution_status(solution.handle), YUKTHI_OPTIMAL);
  EXPECT_NEAR(YUKTHI_solution_objective(solution.handle), 3.0, 1e-9);

  // Zero removes the entry, leaving an empty row rather than a zero-valued one.
  ASSERT_EQ(YUKTHI_model_set_coefficient(model, row, x, 0.0), YUKTHI_OK);
  EXPECT_EQ(YUKTHI_model_num_nonzeros(model), 0);
}

TEST(CApi, SolvesAQpAndTakesTheHessianInEitherTriangle) {
  // minimise 0.5 * (2x^2 + 2y^2) - 2x - 6y  subject to x + y <= 3, x, y >= 0.
  // Unconstrained stationary point is (1, 3), which violates the row, so the optimum sits on
  // x + y = 3. Substituting y = 3 - x: f(x) = x^2 + (3-x)^2 - 2x - 6(3-x) = 2x^2 - 2x - 9,
  // minimised at x = 0.5, y = 2.5, objective 2(0.25) - 1 - 9 = -9.5.
  ModelHandle model;
  int x = -1;
  int y = -1;
  ASSERT_EQ(YUKTHI_model_add_column(model, -2.0, 0.0, YUKTHI_infinity(), 0, "x", &x),
            YUKTHI_OK);
  ASSERT_EQ(YUKTHI_model_add_column(model, -6.0, 0.0, YUKTHI_infinity(), 0, "y", &y),
            YUKTHI_OK);
  int row = -1;
  ASSERT_EQ(YUKTHI_model_add_row(model, -YUKTHI_infinity(), 3.0, "c", &row), YUKTHI_OK);
  ASSERT_EQ(YUKTHI_model_set_coefficient(model, row, x, 1.0), YUKTHI_OK);
  ASSERT_EQ(YUKTHI_model_set_coefficient(model, row, y, 1.0), YUKTHI_OK);

  // Diagonal entries, and note the objective carries the 0.5 - so Q_xx = 2 means x^2.
  ASSERT_EQ(YUKTHI_model_set_quadratic_coefficient(model, x, x, 2.0), YUKTHI_OK);
  // Deliberately the UPPER index pair for the second one. Q is symmetric and only the lower
  // triangle is stored, so (y, y) is the same cell either way; the ordering matters for
  // off-diagonals and is asserted below.
  ASSERT_EQ(YUKTHI_model_set_quadratic_coefficient(model, y, y, 2.0), YUKTHI_OK);

  YUKTHI_options* options = YUKTHI_options_create();
  ASSERT_NE(options, nullptr);
  ASSERT_EQ(YUKTHI_options_set_bool(options, "log_to_console", 0), YUKTHI_OK);
  ASSERT_EQ(YUKTHI_options_set_double(options, "qp_tolerance", 1e-11), YUKTHI_OK);
  ASSERT_EQ(YUKTHI_options_set_int(options, "iteration_limit", 500000), YUKTHI_OK);

  SolutionHandle solution;
  ASSERT_EQ(YUKTHI_solve(model, options, &solution.handle), YUKTHI_OK)
      << YUKTHI_last_error();
  YUKTHI_options_free(options);

  ASSERT_EQ(YUKTHI_solution_status(solution.handle), YUKTHI_OPTIMAL)
      << YUKTHI_solution_message(solution.handle);
  EXPECT_NEAR(YUKTHI_solution_objective(solution.handle), -9.5, 1e-5);

  std::vector<double> values(2, 0.0);
  ASSERT_EQ(YUKTHI_solution_col_values(solution.handle, values.data(), 2), YUKTHI_OK);
  EXPECT_NEAR(values[0], 0.5, 1e-4);
  EXPECT_NEAR(values[1], 2.5, 1e-4);
}

TEST(CApi, AnOffDiagonalHessianEntryMeansTheSameThingInEitherOrder) {
  // (i, j) and (j, i) name ONE entry of a symmetric Q. A wrapper that stored them separately
  // would set the coefficient twice and, on the second call, either double it or overwrite a
  // different cell. Building the same problem both ways and comparing the objective pins the
  // meaning rather than the storage.
  const auto build = [](bool upper_first) {
    YUKTHI_model* model = YUKTHI_model_create();
    YUKTHI_model_add_column(model, 0.0, -10.0, 10.0, 0, "a", nullptr);
    YUKTHI_model_add_column(model, 0.0, -10.0, 10.0, 0, "b", nullptr);
    int row = -1;
    YUKTHI_model_add_row(model, 2.0, 2.0, "c", &row);
    YUKTHI_model_set_coefficient(model, row, 0, 1.0);
    YUKTHI_model_set_coefficient(model, row, 1, 1.0);
    YUKTHI_model_set_quadratic_coefficient(model, 0, 0, 2.0);
    YUKTHI_model_set_quadratic_coefficient(model, 1, 1, 2.0);
    if (upper_first) {
      YUKTHI_model_set_quadratic_coefficient(model, 0, 1, 1.0);
    } else {
      YUKTHI_model_set_quadratic_coefficient(model, 1, 0, 1.0);
    }
    return model;
  };

  double objectives[2] = {0.0, 0.0};
  for (int variant = 0; variant < 2; ++variant) {
    YUKTHI_model* model = build(variant == 0);
    YUKTHI_options* options = YUKTHI_options_create();
    YUKTHI_options_set_bool(options, "log_to_console", 0);
    YUKTHI_options_set_double(options, "qp_tolerance", 1e-11);
    YUKTHI_options_set_int(options, "iteration_limit", 500000);

    YUKTHI_solution* solution = nullptr;
    ASSERT_EQ(YUKTHI_solve(model, options, &solution), YUKTHI_OK) << YUKTHI_last_error();
    ASSERT_EQ(YUKTHI_solution_status(solution), YUKTHI_OPTIMAL)
        << YUKTHI_solution_message(solution);
    objectives[variant] = YUKTHI_solution_objective(solution);

    YUKTHI_solution_free(solution);
    YUKTHI_options_free(options);
    YUKTHI_model_free(model);
  }
  EXPECT_NEAR(objectives[0], objectives[1], 1e-6)
      << "the index order changed the problem, so the two triangles are being stored apart";
}

TEST(CApi, ReadsAModelFromAFile) {
  const TempFile file(
      "NAME          TINY\n"
      "ROWS\n"
      " N  COST\n"
      " G  R1\n"
      "COLUMNS\n"
      "    X         COST         1.0   R1           1.0\n"
      "RHS\n"
      "    RHS       R1           4.0\n"
      "ENDATA\n",
      ".mps");

  ModelHandle model;
  ASSERT_EQ(YUKTHI_model_read(model, file.path().c_str()), YUKTHI_OK) << YUKTHI_last_error();
  EXPECT_EQ(YUKTHI_model_num_cols(model), 1);
  EXPECT_EQ(YUKTHI_model_num_rows(model), 1);
  EXPECT_EQ(YUKTHI_model_num_nonzeros(model), 1);

  SolutionHandle solution;
  ASSERT_EQ(YUKTHI_solve(model, nullptr, &solution.handle), YUKTHI_OK);
  ASSERT_EQ(YUKTHI_solution_status(solution.handle), YUKTHI_OPTIMAL);
  EXPECT_NEAR(YUKTHI_solution_objective(solution.handle), 4.0, 1e-9);
}

TEST(CApi, AFailedReadLeavesTheHandleUntouched) {
  // The worst outcome for a failed read is a HALF-populated handle: the caller sees an error
  // and still holds something that solves, answering a question no one asked.
  ModelHandle model;
  ASSERT_EQ(YUKTHI_model_add_column(model, 1.0, 0.0, 1.0, 0, "keep", nullptr), YUKTHI_OK);

  const TempFile broken("NAME          BAD\nROWS\n N  COST\nCOLUMNS\n    X  NOSUCHROW  1.0\n",
                        ".mps");
  EXPECT_EQ(YUKTHI_model_read(model, broken.path().c_str()), YUKTHI_ERROR_IO);
  EXPECT_FALSE(std::string(YUKTHI_last_error()).empty()) << "a failure with no explanation";

  EXPECT_EQ(YUKTHI_model_num_cols(model), 1) << "the failed read modified the handle";
}

TEST(CApi, RejectsBadArgumentsRatherThanCrashing) {
  // A C caller gets null and out-of-range wrong eventually. Each of these would be undefined
  // behaviour if the boundary did not check, so the checks are the feature.
  EXPECT_EQ(YUKTHI_model_set_maximize(nullptr, 1), YUKTHI_ERROR_ARGUMENT);
  EXPECT_EQ(YUKTHI_model_read(nullptr, "x.mps"), YUKTHI_ERROR_ARGUMENT);
  EXPECT_EQ(YUKTHI_options_set_bool(nullptr, "presolve", 0), YUKTHI_ERROR_ARGUMENT);
  EXPECT_EQ(YUKTHI_model_num_cols(nullptr), 0);
  EXPECT_EQ(YUKTHI_solution_status(nullptr), YUKTHI_NOT_SOLVED);

  ModelHandle model;
  YUKTHI_model_add_column(model, 1.0, 0.0, 1.0, 0, "x", nullptr);
  YUKTHI_model_add_row(model, 0.0, 1.0, "r", nullptr);
  EXPECT_EQ(YUKTHI_model_set_coefficient(model, 5, 0, 1.0), YUKTHI_ERROR_ARGUMENT);
  EXPECT_EQ(YUKTHI_model_set_coefficient(model, 0, 5, 1.0), YUKTHI_ERROR_ARGUMENT);
  EXPECT_EQ(YUKTHI_model_set_coefficient(model, -1, 0, 1.0), YUKTHI_ERROR_ARGUMENT);
  EXPECT_EQ(YUKTHI_model_set_quadratic_coefficient(model, 0, 9, 1.0), YUKTHI_ERROR_ARGUMENT);

  // A wrong buffer size must be refused outright rather than partially filled: a caller with
  // the dimension wrong is about to misread every number it copies.
  SolutionHandle solution;
  ASSERT_EQ(YUKTHI_solve(model, nullptr, &solution.handle), YUKTHI_OK);
  double one = 0.0;
  EXPECT_EQ(YUKTHI_solution_col_values(solution.handle, &one, 7), YUKTHI_ERROR_ARGUMENT);
  EXPECT_EQ(YUKTHI_solution_col_values(solution.handle, nullptr, 1), YUKTHI_ERROR_ARGUMENT);
}

TEST(CApi, RejectsAnUnknownOption) {
  YUKTHI_options* options = YUKTHI_options_create();
  ASSERT_NE(options, nullptr);
  // The registry refuses unknown names rather than storing them, so a typo in a caller's
  // option string fails where it is written instead of being silently ignored for a whole run.
  const YUKTHI_status status = YUKTHI_options_set_double(options, "no_such_option", 1.0);
  EXPECT_NE(status, YUKTHI_OK);
  EXPECT_FALSE(std::string(YUKTHI_last_error()).empty());
  YUKTHI_options_free(options);
}

TEST(CApi, SolvesAMilpAndReportsIntegrality) {
  //   maximise x + y   s.t.  2x + 2y <= 3,  x, y in {0, 1}
  // The relaxation gives x = y = 0.75 for 1.5; the integer optimum is any single unit, 1.
  ModelHandle model;
  ASSERT_EQ(YUKTHI_model_add_column(model, 1.0, 0.0, 1.0, 1, "x", nullptr), YUKTHI_OK);
  ASSERT_EQ(YUKTHI_model_add_column(model, 1.0, 0.0, 1.0, 1, "y", nullptr), YUKTHI_OK);
  int row = -1;
  ASSERT_EQ(YUKTHI_model_add_row(model, -YUKTHI_infinity(), 3.0, "c", &row), YUKTHI_OK);
  ASSERT_EQ(YUKTHI_model_set_coefficient(model, row, 0, 2.0), YUKTHI_OK);
  ASSERT_EQ(YUKTHI_model_set_coefficient(model, row, 1, 2.0), YUKTHI_OK);
  ASSERT_EQ(YUKTHI_model_set_maximize(model, 1), YUKTHI_OK);

  YUKTHI_options* options = YUKTHI_options_create();
  YUKTHI_options_set_bool(options, "log_to_console", 0);

  SolutionHandle solution;
  ASSERT_EQ(YUKTHI_solve(model, options, &solution.handle), YUKTHI_OK)
      << YUKTHI_last_error();
  YUKTHI_options_free(options);

  ASSERT_EQ(YUKTHI_solution_status(solution.handle), YUKTHI_OPTIMAL)
      << YUKTHI_solution_message(solution.handle);
  EXPECT_NEAR(YUKTHI_solution_objective(solution.handle), 1.0, 1e-9);
  EXPECT_LE(YUKTHI_solution_integrality_violation(solution.handle), 1e-6);

  std::vector<double> values(2, 0.0);
  ASSERT_EQ(YUKTHI_solution_col_values(solution.handle, values.data(), 2), YUKTHI_OK);
  for (double v : values) {
    EXPECT_TRUE(std::fabs(v) < 1e-6 || std::fabs(v - 1.0) < 1e-6) << "fractional: " << v;
  }
}

TEST(CApi, AModelCanBeExtendedAndResolvedWithoutBeingFrozenByTheFirstSolve) {
  // materialise() builds the matrix on a COPY so the handle stays mutable. Without that, the
  // first solve would freeze the sparse matrix and the second add_column would either be
  // ignored or assert - the kind of failure that only appears in a caller doing something
  // perfectly reasonable.
  ModelHandle model;
  ASSERT_EQ(YUKTHI_model_add_column(model, 1.0, 0.0, YUKTHI_infinity(), 0, "x", nullptr),
            YUKTHI_OK);
  int row = -1;
  ASSERT_EQ(YUKTHI_model_add_row(model, 2.0, YUKTHI_infinity(), "c", &row), YUKTHI_OK);
  ASSERT_EQ(YUKTHI_model_set_coefficient(model, row, 0, 1.0), YUKTHI_OK);

  SolutionHandle first;
  ASSERT_EQ(YUKTHI_solve(model, nullptr, &first.handle), YUKTHI_OK);
  ASSERT_EQ(YUKTHI_solution_status(first.handle), YUKTHI_OPTIMAL);
  EXPECT_NEAR(YUKTHI_solution_objective(first.handle), 2.0, 1e-9);

  // A cheaper second column that can satisfy the same row.
  ASSERT_EQ(YUKTHI_model_add_column(model, 0.25, 0.0, YUKTHI_infinity(), 0, "y", nullptr),
            YUKTHI_OK);
  ASSERT_EQ(YUKTHI_model_set_coefficient(model, row, 1, 1.0), YUKTHI_OK);
  EXPECT_EQ(YUKTHI_model_num_cols(model), 2);

  SolutionHandle second;
  ASSERT_EQ(YUKTHI_solve(model, nullptr, &second.handle), YUKTHI_OK) << YUKTHI_last_error();
  ASSERT_EQ(YUKTHI_solution_status(second.handle), YUKTHI_OPTIMAL);
  EXPECT_NEAR(YUKTHI_solution_objective(second.handle), 0.5, 1e-9);
}

}  // namespace
