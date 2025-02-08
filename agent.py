#!/usr/bin/env python3

# 功能开始: 导入必要模块
import os
from dotenv import load_dotenv
from model_api import get_response
# 功能结束: 导入必要模块

# 功能开始: 加载环境变量
load_dotenv()  # 从 .env 文件中加载环境变量
# 功能结束: 加载环境变量

# 功能开始: 主程序入口
if __name__ == "__main__":
    user_input = "Explaining the concept of a neural network."
    result = get_response(user_input)  # 调用 model_api 模块中的请求方法
    print("Agent Answer:", result)
# 功能结束: 主程序入口
