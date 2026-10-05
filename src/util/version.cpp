// SPDX-License-Identifier: Apache-2.0
// YUKTHI - build identification. The macros are supplied by CMake.

#include "YUKTHI/version.hpp"

#include <string>

#include <fmt/format.h>

#ifndef YUKTHI_VERSION
#define YUKTHI_VERSION "0.0.0-unconfigured"
#endif
#ifndef YUKTHI_GIT_COMMIT
#define YUKTHI_GIT_COMMIT "unknown"
#endif
#ifndef YUKTHI_BUILD_TYPE
#define YUKTHI_BUILD_TYPE "unknown"
#endif
#ifndef YUKTHI_COMPILER
#define YUKTHI_COMPILER "unknown"
#endif

namespace YUKTHI {

const char* version_string() noexcept {
  return YUKTHI_VERSION;
}
const char* git_commit() noexcept {
  return YUKTHI_GIT_COMMIT;
}
const char* build_type() noexcept {
  return YUKTHI_BUILD_TYPE;
}
const char* compiler_string() noexcept {
  return YUKTHI_COMPILER;
}

bool cuda_enabled() noexcept {
#ifdef YUKTHI_ENABLE_CUDA
  return true;
#else
  return false;
#endif
}

const char* banner() noexcept {
  static const std::string text =
      fmt::format("YUKTHI {} ({}, {}, {}, CUDA {})", version_string(), git_commit(),
                  build_type(), compiler_string(), cuda_enabled() ? "on" : "off");
  return text.c_str();
}

}  // namespace YUKTHI
