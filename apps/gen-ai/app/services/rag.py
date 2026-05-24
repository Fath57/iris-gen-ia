from langchain_community.vectorstores import Chroma
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_ollama import ChatOllama
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.core.config import settings

_PROMPT_TEMPLATE = """
Utilise les éléments de contexte suivants pour répondre à la question à la fin.
Si tu ne sais pas, dis que tu ne sais pas, n'invente rien.
Réponds impérativement en FRANÇAIS.

Contexte : {context}
Question : {question}
Réponse utile :"""


class RAGEngine:
    def __init__(self):
        self.embeddings = HuggingFaceEmbeddings(model_name=settings.EMBEDDING_MODEL)
        self.llm = ChatOllama(model=settings.MODEL_NAME, base_url=settings.OLLAMA_BASE_URL)

    def _collection(self, collection_id: str) -> Chroma:
        return Chroma(
            collection_name=collection_id,
            persist_directory=settings.CHROMA_PERSIST_DIR,
            embedding_function=self.embeddings,
        )

    def ingest(self, file_path: str, collection_id: str) -> int:
        from app.services.loaders import load_documents

        documents = load_documents(file_path)
        chunks = RecursiveCharacterTextSplitter(chunk_size=800).split_documents(documents)
        self._collection(collection_id).add_documents(chunks)
        return len(chunks)

    def ask(self, question: str, collection_id: str) -> str:
        prompt = PromptTemplate.from_template(_PROMPT_TEMPLATE)
        retriever = self._collection(collection_id).as_retriever()
        chain = (
            {"context": retriever, "question": RunnablePassthrough()}
            | prompt
            | self.llm
            | StrOutputParser()
        )
        return chain.invoke(question)


rag_engine = RAGEngine()
