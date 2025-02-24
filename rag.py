import chromadb.config
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from tqdm import tqdm

import chromadb
from logging import getLogger, basicConfig

logger = getLogger(__name__)
basicConfig(
    level="INFO", 
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

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
embedding_model_spec = "dashscope:text-embedding-v3"

# create vector collection
chromadb_settings = chromadb.config.Settings()
chromadb_settings.is_persistent = True
chromadb_settings.anonymized_telemetry = False
chromadb_settings.persist_directory = "./chromadb_data/text-embedding-v3"
chromadb_settings.persist_directory = "./chromadb_data/text-embedding-v3-handled-txt"
chromadb_client = chromadb.Client(chromadb_settings)
collection = chromadb_client.get_or_create_collection("example")

def handle_document(document_path = 'resouce/《西游记》.txt'):
    # replace \n\n with \n
    with open(document_path, "r") as file:
        page_content = file.read()
    while "\n\n" in page_content:
        page_content = page_content.replace("\n\n", "\n")
    # remove empty lines
    page_content = "\n".join([line.strip() for line in page_content.split("\n") if line.strip()])
    replaced_path = document_path.replace(".txt", "_replaced.txt")
    with open(replaced_path, "w") as file:
        file.write(page_content)
    
handle_document()

def load_document(document_path = 'resouce/《西游记》_replaced.txt'):
    # load document

    with open(document_path, "r") as file:
        page_content = file.read()
    document = Document(page_content=page_content, metadata={"reference": document_path})


    # split document 
    chunk_size = 1000
    chunk_overlap = 100
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)

    splits = text_splitter.split_documents([document])
    print(splits[:2])

    # embedding paragraph

    logger.info("Embedding paragraphs...")
    for idx, split in enumerate(tqdm(splits, desc="Embedding paragraphs")):
        paragraph = split.page_content
        embedding_resp = embedding(input=paragraph, model_spec=embedding_model_spec)
        collection.add(
            ids=[f"id_{idx}"],
            embeddings=[embedding_resp.data[0].embedding],
            metadatas=[{"index": idx}],
            documents=[paragraph],
        )

    logger.info("Embedding paragraphs done.")

if collection.count() == 0:
    load_document()


# query embedding
input_text = "孙悟空有几个师父"
input_embedding = embedding(input=input_text, model_spec=embedding_model_spec).data[0].embedding
results = collection.query(
    query_embeddings=input_embedding,
    n_results=3
)

logger.info(f"documents = {results['documents']}")
print("====================================")

PROMPT = """<think>
好的，用户让我帮忙编写一个指令，指导一个经验不足的AI助手将原始问题分解成四个子问题。首先，我需要理解任务的具体要求。用户提供的示例显示，输入变量应该是最小且互不重叠的，所以我需要确定哪些变量是必须的。这里显然需要一个原始问题变量，比如{{ORIGINAL_QUESTION}}。

接下来是结构部分。根据用户的要求，指令结构需要规划如何组织内容。我应该先介绍任务，然后放置输入变量，接着详细说明分解子问题的规则。可能的结构步骤包括：定义任务目标、提供输入变量、设定分解规则、输出格式要求，以及示例。

然后，具体指令的编写需要详细指导AI如何操作。需要明确子问题的生成规则，比如每个子问题应该聚焦原始问题的不同方面，保持独立性，使用清晰的疑问句等。同时，要确保子问题全面覆盖原始问题，并按逻辑顺序排列。可能还需要一个示例来帮助AI理解预期的输出格式。

需要注意的是，用户强调输出格式要求，比如在<sub_questions>标签内列出子问题，每个用<question>标签，此外，必须要求AI在生成子问题前进行思考，确保符合所有规则，这可能需要在指令中加入<thinking>标签的分析步骤。

还要检查是否符合其他注意事项，比如变量通过XML标签标记，避免使用花括号重复引用，指令结构清晰，没有不必要的部分。同时，确保指令详细到能让新手AI正确执行任务，包括检查和修正步骤，以及提供示例来辅助理解。

最后，整合所有部分，确保输入变量正确，指令结构合理，具体指令明确，并且输出格式符合要求。可能还需要测试一下示例是否符合预期，确保分解后的子问题确实独立且全面覆盖原始问题。
</think>
你的任务是将用户提供的复杂问题分解为四个相互独立且聚焦的子问题。请严格遵循以下步骤：

<原始问题>
{original_query}
</原始问题>

子问题生成规则：
1. 每个子问题必须聚焦原始问题的不同维度（如时间、对象、方法、影响等）
2. 子问题之间保持逻辑独立性，避免内容重叠
3. 使用完整疑问句形式（包含疑问词：如何/哪些/为什么等）
4. 按由宏观到具体或时间顺序排列
5. 确保四个子问题组合后能完整覆盖原始问题的各个方面

执行步骤：
1. 在<thinking>标签内分析原始问题的核心要素
2. 识别至少四个可独立探究的方向
3. 将每个方向转化为具体疑问句
4. 检查子问题是否满足所有生成规则
5. 按逻辑顺序排列子问题

输出要求：
- 在<sub_questions>标签内列出
- 每个子问题用<question>标签包裹
- 保持疑问句语法正确

示例参考：
<example>
原始问题：如何提高太阳能电池转化效率？
<sub_questions>
<question>当前主流太阳能电池材料的能量损失主要发生在哪些环节？</question>
<question>新型钙钛矿材料在提高光吸收率方面有哪些最新突破？</question>
<question>如何通过纳米结构设计减少载流子复合损失？</question>
<question>有哪些界面工程方法可以优化电荷传输效率？</question>
</sub_questions>
</example>

现在开始分析，先在<thinking>标签中列出你的分解思路，然后在<sub_questions>标签中输出最终结果。

</输出格式要求>
"""
input = PROMPT.format(original_query=input_text)
response = chat(prompt=input, model_spec="volcengine:doubao-1-5-pro-32k-250115")
logger.info(response)

# check format of response 
if "<thinking>" not in response or "</thinking>" not in response:
    raise ValueError("Response format is incorrect")
if "<sub_questions>" not in response or "</sub_questions>" not in response:
    raise ValueError("Response format is incorrect")

thinking_content = response.split("<thinking>")[1].split("</thinking>")[0]
sub_questions_content = response.split("<sub_questions>")[1].split("</sub_questions>")[0]

# convert questions to list
sub_questions = sub_questions_content.split("<question>")
sub_questions = [q.replace("</question>", "").strip() for q in sub_questions]
questions = [q for q in sub_questions if q.strip()]
logger.info(questions)

HELPFUL_PROMPT = """你的任务是检查给定的文本块是否对于解决问题列表中的内容有帮助。请仔细阅读以下信息，并按照指示进行判断。
问题列表:
<question_list>
{query}
</question_list>
文本块:
<text_block>
{retrieved_chunk}
</text_block>
请按照以下步骤进行检查：
1. 仔细阅读整个问题列表，明确每个问题的核心内容。
2. 仔细阅读文本块内容。
3. 将文本块内容与问题列表中的每个问题逐一对照，看是否能为解决该问题提供相关信息或思路。
4. 形成初步判断。
5. 再次检查，确保没有遗漏重要细节。

在<thinking>标签中分析文本块是否对解决问题列表中的内容有帮助，并详细说明判断依据。然后在<answer>标签中给出你的最终判断，使用"true"或"false"。
<thinking>
[在此详细说明你对文本块是否有帮助的分析过程]
</thinking>
<answer>
[在此给出"true"或"false"的判断]
</answer>
请确保你的判断客观公正，并基于文本块和问题列表的实际内容。
"""


all_chunks = []

for question in questions:
    logger.info(f"{COLORS[0]}Querying for question: {question}\033[0m")
    # print(f"Querying for question: {question}")
    input_embedding = embedding(input=question, model_spec=embedding_model_spec).data[0].embedding
    results = collection.query(
        query_embeddings=input_embedding,
        n_results=3
    )
    all_chunks.extend(results['documents'][0])

    print("====================================")

# unique chunks
all_chunks = list(set(all_chunks))
helpful_chunks = []
for idx, doc in enumerate(all_chunks):
    # 使用 doc 的索引加 3 选取颜色, 并重置颜色
    chosen_color = COLORS[(idx+1) % len(COLORS)]
    logger.info(f"{chosen_color}{doc}\033[0m")
    chat_prompt = HELPFUL_PROMPT.format(query=questions, retrieved_chunk=doc)
    chat_resp = chat(prompt=chat_prompt, model_spec="volcengine:doubao-1-5-pro-32k-250115")
    answer = chat_resp.split("<answer>")[1].split("</answer>")[0].strip()
    if answer == "true":
        helpful_chunks.append(doc)
    
    logger.info(chat_resp)
    


# log helpful chunks   
logger.info(f"helpful_chunks = {helpful_chunks}")


# FIXME: 目前来看处理的不行, 可能是分块的效果不太好.