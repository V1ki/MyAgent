#!/usr/bin/env python3

# 功能开始: 导入必要模块
import os
from dotenv import load_dotenv
from model_api import chat, embedding
# 功能结束: 导入必要模块

# 功能开始: 加载环境变量
load_dotenv()  # 从 .env 文件中加载环境变量
# 功能结束: 加载环境变量


# 测试开始: 文本模型
def test_text_model():
    user_input = "What is the meaning of life?"
    
    model_spec = "dashscope:qwen-max-latest"
    model_spec = "zhipu:glm-4-flash"
    model_spec = "gemini:gemini-2.0-flash-thinking-exp-01-21"
    model_spec = "gemini:gemini-2.0-flash"
    
    result = chat(prompt=user_input, model_spec=model_spec)  # 调用 model_api 模块中的请求方法
    print("Agent Answer:", result)
# 测试结束: 文本模型


# 测试开始: 视觉理解 模型 
def test_vlm_model():
    user_input = "extract the main content of the image"
    model_spec = "dashscope:qwen2.5-vl-72b-instruct"
    image_path = "resouce/lianpu.jpeg"
    result = chat(prompt=user_input, model_spec=model_spec, image_path=image_path)  # 调用 model_api 模块中的请求方法
    print("Agent Answer:", result)
# 测试结束: 视觉理解 模型

# 测试开始: Ebeddeing 模型
def test_embedding_model():
    user_input = "What is the meaning of life?"
    model_spec = "ollama:nomic-embed-text"
    result = embedding(input=user_input, model_spec=model_spec)  # 调用 model_api 模块中的请求方法
    print("Agent Answer:", result)
# 测试结束: Ebeddeing 模型

# 功能开始: 主程序入口
if __name__ == "__main__":
    
    # test_text_model()
    # print("====================================")
    # test_vlm_model()
    # print("====================================")
    test_embedding_model()
    
    
# 功能结束: 主程序入口
