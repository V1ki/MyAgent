# 功能开始: 导入必要模块
import os
import openai

# 如果使用 gemini 则需要导入 google.genai
from google import genai

import base64

# 从 .env 文件中加载环境变量
from dotenv import load_dotenv

load_dotenv()

# 功能结束: 导入必要模块


OPENAI_VENDOR_LIST = ["openai", "deepseek", "dashscope", "zhipu", "moonshot", "volcengine", "ollama"]

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
        elif vendor == "dashscope":
            return {
                "type": "dashscope",
                "endpoint": os.getenv("DASHSCOPE_ENDPOINT", "https://dashscope.aliyuncs.com/compatible-mode/v1"),
                "api_key": os.getenv("DASHSCOPE_API_KEY"),
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
        elif vendor == 'moonshot':
            return {
                "type": "moonshot",
                "endpoint": os.getenv("MOONSHOT_ENDPOINT"),
                "api_key": os.getenv("MOONSHOT_API_KEY"),
            }
        elif vendor == 'volcengine': # 火山引擎
            return {
                "type": "volcengine",
                "endpoint": os.getenv("VOLCENGINE_ENDPOINT"),
                "api_key": os.getenv("VOLCENGINE_API_KEY"),
            }
        elif vendor == 'ollama':
            return {
                "type": "ollama",
                "endpoint": os.getenv("OLLAMA_ENDPOINT", 'http://localhost:11434/v1'),
                "api_key": os.getenv("OLLAMA_API_KEY"),
            }
        else:
            return {
                "type": "openai",
                "endpoint": os.getenv("OPENAI_ENDPOINT", "https://api.openai.com"),
                "api_key": os.getenv("DEFAULT_API_KEY"),
            }


# 功能结束: 定义服务商选择器类


# 功能开始: encode image to base64
def encode_image(image_path):
    # get image format
    image_format = image_path.split(".")[-1]
    image_format = image_format.lower()
    if image_format == "jpg":
        image_format = "jpeg"
    
    with open(image_path, "rb") as f:
        return image_format, base64.b64encode(f.read()).decode("utf-8")
# 功能结束: encode image to base64

def parse_model_spec(model_spec):
    vendor = model_spec.split(":")[0]
    config = ModelProvider.get_vendor_config(vendor=vendor)
    model_variant = model_spec.split(":")[1]
    return config, model_variant


# 功能开始: 文本模型及视觉理解模型请求处理方法
def chat(prompt, model_spec="zhipu:glm-4-flash", image_path=None):
    """
    根据服务商配置调用对应 API 生成回复
    参数:
        prompt: 用户输入
        model_spec: 格式为 "vendor:model_variant"，例如 "zhipu:glm-4-flash"
    """
    if model_spec is None:
        model_spec = os.getenv("DEFAULT_MODEL")
    config, model_variant = parse_model_spec(model_spec)
    
    if image_path is not None:
        if not os.path.exists(image_path):
            raise ValueError("图像文件不存在")
    
    if model_variant is None:
        raise ValueError("DEFAULT_MODEL 环境变量未设置")
    
    if config["type"] in OPENAI_VENDOR_LIST:
        base_url = config["endpoint"]
        api_key = config["api_key"]
        client = openai.OpenAI(base_url=base_url, api_key=api_key)
        if image_path:
            with open(image_path, "rb") as f:
                img_encode_data = encode_image(image_path)
                content = [
                    {"type": "image_url", "image_url": {"url": f"data:image/{img_encode_data[0]};base64,{img_encode_data[1]}"}},
                    {"type": "text", "text": prompt}
                ]
        else:
            content = prompt
        
        response = client.chat.completions.create(
            model=model_variant, messages=[
                {"role": "user", "content": content}
            ]
        )
        reply = response.choices[0].message.content
    elif config["type"] == "gemini":
        try:
            client = genai.Client(
                api_key=config["api_key"],   
                http_options={'api_version':'v1alpha'},
                )
            response = client.models.generate_content(model=model_variant, contents=prompt)
            reply = response.text.strip()
        except Exception as e:
            reply = f"调用 gemini API 时出错: {e}"

    else:
        reply = f"未知的服务商类型: {config['type']}"
    return reply


# 功能结束: 文本模型及视觉理解模型请求处理方法

# 功能开始: embedding 模型
def embedding(input, model_spec="dashscope:text-embedding-v3", dimensions=1024, **kwargs):
    if model_spec is None:
        model_spec = os.getenv("DEFAULT_EMBEDDING_MODEL")
    config, model_variant = parse_model_spec(model_spec)
    if config["type"] in OPENAI_VENDOR_LIST:
        base_url = config["endpoint"]
        api_key = config["api_key"]
        client = openai.OpenAI(base_url=base_url, api_key=api_key)
        response = client.embeddings.create(
            model=model_variant, input=input, dimensions=dimensions
        )
        return response
    raise ValueError("未知的服务商类型")
# 功能结束: embedding 模型