# 功能开始: 导入必要模块
import os
import openai

# 如果使用 gemini 则需要导入 google.genai
from google import genai

# 功能结束: 导入必要模块


# 功能开始: 定义服务商选择器类
class ModelProvider:
    @staticmethod
    def get_vendor_config(vendor=None):
        if vendor is None:
            vendor = os.getenv("VENDOR", "openai").lower()
        if vendor == "openai":
            return {
                "type": "openai",
                "endpoint": os.getenv("OPENAI_ENDPOINT", "https://api.openai.com"),
                "api_key": os.getenv("OPENAI_API_KEY"),
            }
        elif vendor == "deepseek":
            return {
                "type": "deepseek",
                "endpoint": os.getenv("DEEPSEEK_ENDPOINT", "https://api.deepseek.com/v1"),
                "api_key": os.getenv("DEEPSEEK_API_KEY"),
            }
        elif vendor == "qwen":
            return {
                "type": "qwen",
                "endpoint": os.getenv(
                    "QWEN_ENDPOINT", "https://dashscope.aliyuncs.com/compatible-mode/v1"
                ),
                "api_key": os.getenv("QWEN_API_KEY"),
            }
        elif vendor == "gemini":
            return {
                "type": "gemini",
                "endpoint": os.getenv("GEMINI_ENDPOINT"),
                "api_key": os.getenv("GEMINI_API_KEY"),
            }
        elif vendor == "zhipu":
            return {
                "type": "zhipu",
                "endpoint": os.getenv("ZHIPU_ENDPOINT"),
                "api_key": os.getenv("ZHIPU_API_KEY"),
            }
        else:
            return {
                "type": "openai",
                "endpoint": os.getenv("OPENAI_ENDPOINT", "https://api.openai.com"),
                "api_key": os.getenv("DEFAULT_API_KEY"),
            }


# 功能结束: 定义服务商选择器类

# 功能开始: 定义请求处理方法
def get_response(prompt, model_spec="zhipu:glm-4-flash"):
    """
    根据服务商配置调用对应 API 生成回复
    参数:
        prompt: 用户输入
        model_spec: 格式为 "vendor:model_variant"，例如 "zhipu:glm-4-flash"
    """
    if model_spec is None:
        model_spec = os.getenv("DEFAULT_MODEL")
    vendor = model_spec.split(":")[0]
    config = ModelProvider.get_vendor_config(agent_type=vendor)
    model_variant = model_spec.split(":")[1]
    
    if model_variant is None:
        raise ValueError("DEFAULT_MODEL 环境变量未设置")
    
    if config["type"] in ["openai", "deepseek", "qwen", "zhipu"]:
        base_url = config["endpoint"]
        api_key = config["api_key"]
        client = openai.OpenAI(base_url=base_url, api_key=api_key)
        response = client.chat.completions.create(
            model=model_variant, messages=[{"role": "user", "content": prompt}], max_tokens=50
        )
        reply = response.choices[0].message.content
    elif config["type"] == "gemini":
        try:
            client = genai.Client(api_key=config["api_key"])
            response = client.models.generate_content(model=model_variant, contents=prompt)
            reply = response.text.strip()
        except Exception as e:
            reply = f"调用 gemini API 时出错: {e}"

    else:
        reply = f"未知的服务商类型: {config['type']}"
    return reply


# 功能结束: 定义请求处理方法
