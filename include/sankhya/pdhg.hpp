// SPDX-License-Identifier: Apache-2.0
// YUKTHI - restarted PDHG, the first-order LP engine.
#pragma once

#include "YUKTHI/logging.hpp"
#include "YUKTHI/model.hpp"
#include "YUKTHI/options.hpp"

namespace YUKTHI::pdhg {

/// Solve an LP with restarted primal-dual hybrid gradient.
///
/// Requires a model with no integrality and no quadratic objective; the solve() dispatcher
/// checks that. Never throws: every failure comes back as a status.
[[nodiscard]] Solution solve_pdhg(const Model& model, const Options& options, Logger& logger);

}  // namespace YUKTHI::pdhg
