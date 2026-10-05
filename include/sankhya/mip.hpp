// SPDX-License-Identifier: Apache-2.0
// YUKTHI - branch and bound for mixed-integer linear programming.
#pragma once

#include "YUKTHI/logging.hpp"
#include "YUKTHI/model.hpp"
#include "YUKTHI/options.hpp"

namespace YUKTHI::mip {

/// Solve a MILP by branch and bound over the revised primal simplex.
///
/// Accepts a model with or without integrality; with none it is a single LP solve and says
/// so. Never throws: every failure comes back as a status.
///
/// The returned Solution distinguishes the two outcomes that matter and are easy to
/// conflate: kOptimal means the search CLOSED - the incumbent is proven best - while
/// kFeasible means an incumbent exists but a limit stopped the proof, and dual_bound then
/// carries the best bound still open.
[[nodiscard]] Solution solve_branch_and_bound(const Model& model, const Options& options,
                                              Logger& logger);

}  // namespace YUKTHI::mip
