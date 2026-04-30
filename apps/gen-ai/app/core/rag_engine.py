from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import Chroma
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_ollama import ChatOllama
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.config import CHROMA_PERSIST_DIR, EMBEDDING_MODEL, MODEL_NAME, OLLAMA_BASE_URL

_PROMPT_TEMPLATE = """
Utilise les éléments de contexte suivants pour répondre à la question à la fin.
Si tu ne sais pas, dis que tu ne sais pas, n'invente rien.
Réponds impérativement en FRANÇAIS.

Contexte : {context}
Question : {question}
Réponse utile :"""


class RAGEngine:
    def __init__(self, model_name: str = MODEL_NAME):
        self.embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
        self.llm = ChatOllama(model=model_name, base_url=OLLAMA_BASE_URL)
        self.vector_db = Chroma(
            persist_directory=CHROMA_PERSIST_DIR,
            embedding_function=self.embeddings,
        )

    def ingest(self, file_path: str) -> int:
        loader = PyPDFLoader(file_path)
        chunks = RecursiveCharacterTextSplitter(chunk_size=800).split_documents(
            loader.load()
        )
        self.vector_db.add_documents(chunks)
        return len(chunks)

    def ask(self, question: str) -> str:
        prompt = PromptTemplate.from_template(_PROMPT_TEMPLATE)
        chain = (
            {
                "context": self.vector_db.as_retriever(),
                "question": RunnablePassthrough(),
            }
            | prompt
            | self.llm
            | StrOutputParser()
        )
        return chain.invoke(question)
