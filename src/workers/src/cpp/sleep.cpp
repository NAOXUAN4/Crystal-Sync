#include <emscripten/bind.h>
#include <thread>
using namespace emscripten;

int sleepTen()
{
  std::this_thread::sleep_for(std::chrono::seconds(10));
  return 0;
}

EMSCRIPTEN_BINDINGS(convolution_module_js)
{
  function("sleepTen", &sleepTen);
}