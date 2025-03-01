import chromadb.config
from langchain_core.documents import Document
from langchain_text_splitters import CharacterTextSplitter
from tqdm import tqdm
import chromadb
from logging import getLogger, Formatter,StreamHandler
import re
import jieba  # 用于中文分词
import numpy as np
from collections import Counter
import random
import sys

logger = getLogger(__name__)
# file_handler = FileHandler("rag_process.log")
# file_handler.setFormatter(Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s"))
# logger.addHandler(file_handler)
logger.setLevel("INFO")

console_handler = StreamHandler(sys.stderr)  # 使用stderr而不是stdout
console_handler.setFormatter(Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s"))
logger.addHandler(console_handler)

# 添加颜色列表常量（ANSI 颜色代码）
COLORS = [
    "\033[31m",  # Red
    "\033[32m",  # Green
    "\033[33m",  # Yellow
    "\033[34m",  # Blue
    "\033[35m",  # Magenta
    "\033[36m",  # Cyan
]
from model_api import embedding, chat

embedding_model_spec = "ollama:nomic-embed-text"
llm_model_spec = "volcengine:deepseek-v3-241226"

# create vector collection
chromadb_settings = chromadb.config.Settings()
chromadb_settings.is_persistent = True
chromadb_settings.anonymized_telemetry = False
chromadb_settings.persist_directory = "./chromadb_data/nomic-embed-text"
chromadb_client = chromadb.Client(chromadb_settings)
collection = chromadb_client.get_or_create_collection("example")

# 新增：关键词提取和处理函数
def extract_keywords(text, top_n=10):
    """从文本中提取关键词"""
    # 使用jieba分词进行中文分词
    words = jieba.cut(text)
    # 过滤掉停用词和标点符号
    filtered_words = [word for word in words if len(word) > 1 and not re.match(r'[^\w\s]', word)]
    # 统计词频
    word_counts = Counter(filtered_words)
    # 返回出现频率最高的top_n个词
    return [word for word, _ in word_counts.most_common(top_n)]


def load_document(document_path = 'resouce/《西游记》.txt'):
    # load document
    with open(document_path, "r") as file:
        page_content = file.read()
    document = Document(page_content=page_content, metadata={"reference": document_path})
    
    # 改进: 使用更智能的分块策略，根据章节或自然段落分割
    # 尝试分别根据章节和段落进行分块
    text_splitter = CharacterTextSplitter(
        separator=r"第[一二三四五六七八九十百千0-9]+回",  # 段落分隔符
        chunk_size=10000,
        chunk_overlap=150,
        length_function=len,
        is_separator_regex=True,
    )
    
    splits = text_splitter.split_documents([document])

    if len(splits) == 1:
        logger.info("Document split into 1 chunk using default chunking")
        exit()

    logger.info(f"Document split into {len(splits)} chunks using improved chunking")
    print(splits[:2])
    
    # embedding paragraph
    logger.info("Embedding paragraphs...")
    for idx, split in enumerate(tqdm(splits, desc="Embedding paragraphs")):
        paragraph = split.page_content
        embedding_resp = embedding(input=paragraph, model_spec=embedding_model_spec)
        
        # 新增: 提取关键词并存储
        keywords = extract_keywords(paragraph)
        
        collection.add(
            ids=[f"id_{idx}"],
            embeddings=[embedding_resp.data[0].embedding],
            metadatas=[{
                "index": idx, 
                "chunk_length": len(paragraph),
                "keywords": ",".join(keywords)  # 存储关键词以供检索
            }],
            documents=[paragraph],
        )
    logger.info(f"Embedding completed. Total chunks: {len(splits)}")

# 重置和重新加载数据 (取消注释以重新处理数据)
# collection.delete(collection.get(include=["embeddings"])["ids"])
if collection.count() == 0:
    load_document()

# 新增：混合搜索函数
def hybrid_query(input_text, n_results=5, keyword_weight=0.3, vector_weight=0.7):
    """
    混合搜索函数，结合向量搜索和关键词搜索
    
    参数:
    - input_text: 查询文本
    - n_results: 返回结果数量
    - keyword_weight: 关键词匹配权重
    - vector_weight: 向量相似度权重
    """
    logger.info(f"Processing hybrid query: {input_text}")
    
    # 1. 向量搜索部分
    input_embedding = embedding(input=input_text, model_spec=embedding_model_spec).data[0].embedding
    vector_results = collection.query(
        query_embeddings=input_embedding,
        n_results=n_results * 2  # 获取更多候选结果以进行排序
    )
    
    # 2. 关键词搜索部分
    query_keywords = extract_keywords(input_text, top_n=5)
    logger.info(f"Query keywords: {query_keywords}")
    
    # 获取所有文档和元数据，用于关键词匹配评分
    all_ids = vector_results['ids'][0]
    all_documents = vector_results['documents'][0]
    all_metadatas = vector_results['metadatas'][0]
    all_distances = vector_results['distances'][0]
    
    # 计算关键词匹配得分
    keyword_scores = []
    for i, metadata in enumerate(all_metadatas):
        doc_keywords = metadata.get("keywords", "").split(",")
        # 计算查询关键词与文档关键词的重叠数
        overlap = sum(1 for keyword in query_keywords if keyword in doc_keywords)
        # 归一化至0-1范围
        keyword_score = overlap / max(len(query_keywords), 1)
        keyword_scores.append(keyword_score)
    
    # 向量距离转化为相似度分数 (距离越小，相似度越高)
    max_distance = max(all_distances) if all_distances else 1
    vector_scores = [1 - (distance / max_distance) for distance in all_distances]
    
    # 混合得分 = 向量得分 * 向量权重 + 关键词得分 * 关键词权重
    hybrid_scores = [
        (vector_scores[i] * vector_weight) + (keyword_scores[i] * keyword_weight)
        for i in range(len(all_ids))
    ]
    # 根据混合得分排序
    sorted_indices = np.argsort(hybrid_scores)[::-1]  # 降序排序
    
    # 构建混合搜索结果
    hybrid_results = {
        'ids': [[all_ids[i] for i in sorted_indices[:n_results]]],
        'documents': [[all_documents[i] for i in sorted_indices[:n_results]]],
        'metadatas': [[all_metadatas[i] for i in sorted_indices[:n_results]]],
        'scores': [[hybrid_scores[i] for i in sorted_indices[:n_results]]],
    }
    
    logger.info(f"Hybrid search completed. Found {len(hybrid_results['documents'][0])} results")
    return hybrid_results

# 获取知识库概要，用于确保生成的子问题与知识库相关
def get_knowledge_base_summary(num_samples=10):
    """随机抽取知识库中的文档进行概要分析"""
    # 获取所有文档ID
    all_ids = collection.get()['ids']
    
    if not all_ids:
        return "知识库为空"
    
    # 随机抽样
    sample_size = min(num_samples, len(all_ids))
    sample_ids = random.sample(all_ids, sample_size)
    
    # 获取样本文档
    samples = collection.get(ids=sample_ids)
    sample_docs = samples['documents']
    
    # 提取所有样本文档中的关键词
    all_keywords = []
    for doc in sample_docs:
        keywords = extract_keywords(doc, top_n=5)
        all_keywords.extend(keywords)
    
    # 统计关键词频率
    keyword_counter = Counter(all_keywords)
    top_keywords = [kw for kw, _ in keyword_counter.most_common(20)]
    
    # 构建知识库概要提示
    summary = f"根据知识库样本分析，知识库主要包含以下关键信息：{'、'.join(top_keywords)}。"
    return summary

# 改进：生成与知识库相关的子问题
def generate_relevant_subquestions(query):
    """生成与知识库内容相关的子问题"""
    # 获取知识库概要
    kb_summary = get_knowledge_base_summary()
    
    # 首先分析原始查询，确保与知识库相关
    KB_ANALYSIS_PROMPT = f"""你的任务是分析用户的查询，并确定这个查询是否与我们的知识库相关。
知识库概要：
{kb_summary}

原始查询：{query}

请遵循以下步骤：
1. 分析原始查询的核心主题和需求
2. 将其与知识库概要进行对比
3. 判断查询与知识库的相关性
4. 如果查询与知识库不相关，提供一个经过修改的、与知识库相关的查询

在<analysis>标签中提供详细分析，然后在<relevant_query>标签中给出一个与知识库相关的查询。
如果原始查询已经与知识库相关，则保持不变；否则提供一个相关的替代查询。
"""
    
    analysis_response = chat(prompt=KB_ANALYSIS_PROMPT, model_spec=llm_model_spec)
    logger.info(f"知识库相关性分析: {analysis_response}")
    
    # 尝试提取相关查询
    try:
        relevant_query = re.search(r'<relevant_query>(.*?)</relevant_query>', analysis_response, re.DOTALL).group(1).strip()
    except:
        # 如果无法提取，则使用原始查询
        relevant_query = query
        logger.warning("无法提取相关查询，将使用原始查询")
    
    logger.info(f"相关查询: {relevant_query}")
    
    # 生成与知识库相关的子问题
    SUBQUESTION_PROMPT = f"""你的任务是将用户提供的问题分解为四个相互独立且聚焦的子问题，这些子问题必须与我们的知识库内容相关。
    
知识库概要：
{kb_summary}

<原始问题>
{relevant_query}
</原始问题>

子问题生成规则：
1. 每个子问题必须与知识库内容直接相关，不要生成知识库无法回答的问题
2. 子问题之间保持逻辑独立性，避免内容重叠
3. 使用完整疑问句形式（包含疑问词：如何/哪些/为什么等）
4. 按由宏观到具体或时间顺序排列
5. 确保四个子问题组合后能帮助回答原始问题
6. 所有子问题都必须考虑知识库的实际内容范围

执行步骤：
1. 在<thinking>标签内分析原始问题的核心要素和知识库内容的关联
2. 识别至少四个可独立探究且知识库能回答的方向
3. 将每个方向转化为具体疑问句
4. 检查子问题是否满足所有生成规则，特别是与知识库的相关性
5. 按逻辑顺序排列子问题

输出要求：
- 在<sub_questions>标签内列出
- 每个子问题用<question>标签包裹
- 保持疑问句语法正确

现在开始分析，先在<thinking>标签中列出你的分解思路，然后在<sub_questions>标签中输出最终结果。
"""
    
    response = chat(prompt=SUBQUESTION_PROMPT, model_spec=llm_model_spec)
    logger.info(response)
    
    # 提取子问题
    if "<sub_questions>" not in response or "</sub_questions>" not in response:
        logger.error("生成的子问题格式不正确")
        return [relevant_query]  # 返回相关查询作为唯一问题
    
    sub_questions_content = response.split("<sub_questions>")[1].split("</sub_questions>")[0]
    sub_questions = sub_questions_content.split("<question>")
    sub_questions = [q.replace("</question>", "").strip() for q in sub_questions]
    questions = [q for q in sub_questions if q.strip()]
    
    # 如果提取失败或子问题数量不足，返回相关查询作为唯一问题
    if len(questions) < 2:
        logger.warning("提取到的子问题数量不足，将使用原始相关查询")
        return [relevant_query]
    
    # 验证子问题与知识库的相关性
    verified_questions = questions.copy()
    verified_questions.append(relevant_query)  # 添加相关查询作为最后一个问题
    
    return verified_questions

# 使用混合搜索代替原来的向量搜索
input_text = "孙悟空有几个师父"
results = hybrid_query(input_text, n_results=5)
logger.info(f"Query: {input_text}")
logger.info(f"Retrieved {len(results['documents'][0])} documents")
print("====================================")

# 输出混合搜索结果的评分
for i, (doc, score) in enumerate(zip(results['documents'][0], results['scores'][0])):
    logger.info(f"{COLORS[i % len(COLORS)]}Score {score:.4f}: {doc[:150]}...\033[0m")

# 替换原有的子问题生成逻辑
questions = generate_relevant_subquestions(input_text)
logger.info(f"生成的与知识库相关的子问题: {questions}")

# 改进: 更好的相关性判断提示词
HELPFUL_PROMPT = """你的任务是判断给定的文本块对解决特定问题是否有帮助。请遵循以下指导：
问题:
<question>
{query}
</question>
文本块:
<text_block>
{retrieved_chunk}
</text_block>
分析指南:
1. 仔细理解问题的核心需求和关键词
2. 分析文本块的内容和主题
3. 评估文本块是否包含:
   - 与问题直接相关的信息
   - 可以推导出答案的线索
   - 相关背景知识或上下文
4. 考虑信息的质量和具体程度

在<thinking>标签中分析文本块内容与问题的相关性，详细说明你的判断理由。然后在<answer>标签中给出一个介于0-10的相关性分数，其中:
- 0-3: 几乎无关
- 4-6: 部分相关
- 7-10: 高度相关

<thinking>
[详细分析文本块与问题的相关性]
</thinking>
<answer>
[给出0-10之间的相关性分数]
</answer>
"""

# 改进：使用混合搜索检索相关文本块，并进行相关性评分
def retrieve_relevant_chunks(questions, top_k=5):
    """对每个问题使用混合搜索检索相关文本块，并进行相关性评分"""
    all_relevant_chunks = []
    
    for question in questions:
        logger.info(f"{COLORS[0]}Querying for question: {question}\033[0m")
        results = hybrid_query(question, n_results=top_k)
        
        for i, doc in enumerate(results['documents'][0]):
            # 混合搜索得分
            hybrid_score = results['scores'][0][i]
            
            # 使用LLM进行相关性评分
            chat_prompt = HELPFUL_PROMPT.format(query=question, retrieved_chunk=doc)
            chat_resp = chat(prompt=chat_prompt, model_spec=llm_model_spec)
            
            try:
                score_text = chat_resp.split("<answer>")[1].split("</answer>")[0].strip()
                llm_score = float(score_text)
                # 综合考虑混合搜索得分和LLM评分
                final_score = (hybrid_score * 0.4) + (llm_score / 10 * 0.6)
                
                if final_score >= 0.6:  # 设置相关性阈值
                    all_relevant_chunks.append({
                        "question": question,
                        "chunk": doc,
                        "hybrid_score": hybrid_score,
                        "llm_score": llm_score,
                        "final_score": final_score
                    })
                    logger.info(f"Found relevant chunk with final score {final_score:.2f} (hybrid: {hybrid_score:.2f}, llm: {llm_score:.1f}): {doc[:100]}...")
            except Exception as e:
                logger.warning(f"Failed to parse relevance score: {e}")
        
    # 按相关性分数排序
    all_relevant_chunks.sort(key=lambda x: x['final_score'], reverse=True)
    return all_relevant_chunks

# 获取与问题相关的文本块
relevant_chunks = retrieve_relevant_chunks(questions)
logger.info(f"Found {len(relevant_chunks)} relevant chunks")

# 输出最相关的文本块
for i, chunk_data in enumerate(relevant_chunks[:5]):  # 只显示前5个最相关的块
    logger.info(f"\n{COLORS[i % len(COLORS)]}Question: {chunk_data['question']}")
    logger.info(f"Score: {chunk_data['final_score']:.2f} (hybrid: {chunk_data['hybrid_score']:.2f}, llm: {chunk_data['llm_score']:.1f})")
    logger.info(f"Chunk: {chunk_data['chunk'][:200]}...\033[0m")

