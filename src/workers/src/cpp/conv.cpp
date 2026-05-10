#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <vector>
#include <cmath>

using namespace emscripten;

// 最简单的实现，直接返回JavaScript数组
val convolution3DFlatJS(
    val input_js,
    int x, int y,
    val kernel_js,
    int a, int b)
{
  // 将JavaScript数组转换为std::vector
  std::vector<double> input_vec;
  std::vector<double> kernel_vec;

  unsigned int input_len = input_js["length"].as<unsigned int>();
  unsigned int kernel_len = kernel_js["length"].as<unsigned int>();

  input_vec.reserve(input_len);
  kernel_vec.reserve(kernel_len);

  for (unsigned int i = 0; i < input_len; i++)
  {
    input_vec.push_back(input_js[i].as<double>());
  }

  for (unsigned int i = 0; i < kernel_len; i++)
  {
    kernel_vec.push_back(kernel_js[i].as<double>());
  }

  // 验证长度
  if (input_vec.size() != static_cast<size_t>(x * y * 3))
  {
    val result = val::array();
    for (int i = 0; i < x * y * 3; i++)
    {
      result.call<void>("push", 0.0);
    }
    return result;
  }

  if (kernel_vec.size() != static_cast<size_t>(a * b))
  {
    val result = val::array();
    for (int i = 0; i < x * y * 3; i++)
    {
      result.call<void>("push", 0.0);
    }
    return result;
  }

  int channels = 3;
  int pad_x = a / 2;
  int pad_y = b / 2;

  // 创建JavaScript数组作为输出
  val result = val::array();
  std::vector<double> output_vec(x * y * channels, 0.0);

  // 卷积计算
  for (int ch = 0; ch < channels; ++ch)
  {
    int channel_offset = ch * x * y;

    for (int i = 0; i < x; ++i)
    {
      for (int j = 0; j < y; ++j)
      {
        double sum = 0.0;

        for (int ki = 0; ki < a; ++ki)
        {
          for (int kj = 0; kj < b; ++kj)
          {
            int input_i = i + ki - pad_x;
            int input_j = j + kj - pad_y;

            if (input_i >= 0 && input_i < x && input_j >= 0 && input_j < y)
            {
              int input_idx = channel_offset + input_i * y + input_j;
              int kernel_idx = ki * b + kj;

              sum += input_vec[input_idx] * kernel_vec[kernel_idx];
            }
          }
        }

        output_vec[channel_offset + i * y + j] = sum;
      }
    }
  }

  // 填充到JavaScript数组
  for (const auto &value : output_vec)
  {
    result.call<void>("push", value);
  }

  return result;
}

val createGaussianKernelJS(int size)
{
  val result = val::array();
  double sigma = 1.0;
  double sum = 0.0;
  int center = size / 2;

  std::vector<double> kernel(size * size, 0.0);

  // 生成高斯核
  for (int i = 0; i < size; ++i)
  {
    for (int j = 0; j < size; ++j)
    {
      int x = i - center;
      int y = j - center;
      double value = std::exp(-(x * x + y * y) / (2 * sigma * sigma));
      kernel[i * size + j] = value;
      sum += value;
    }
  }

  // 归一化并添加到JavaScript数组
  for (int i = 0; i < size * size; ++i)
  {
    result.call<void>("push", kernel[i] / sum);
  }

  return result;
}

EMSCRIPTEN_BINDINGS(convolution_module_js)
{
  function("convolution3DFlatJS", &convolution3DFlatJS);
  function("createGaussianKernelJS", &createGaussianKernelJS);
}