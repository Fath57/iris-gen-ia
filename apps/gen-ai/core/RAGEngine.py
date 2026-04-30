from langchain.chains import RetrievalQA
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import PromptTemplate
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_ollama import ChatOllama
from langchain_text_splitters import RecursiveCharacterTextSplitter

from core.constants import MODEL_NAME


class RAGEngine:
    def __init__(self, model_name=MODEL_NAME):
        self.model_name = model_name
        self.embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
        self.llm = ChatOllama(model=self.model_name, base_url="http://host.docker.internal:11434")
        self.vector_db = None

    def ingest(self, file_path):
        loader = PyPDFLoader(file_path)
        chunks = RecursiveCharacterTextSplitter(chunk_size=800).split_documents(loader.load())
        self.vector_db = Chroma.from_documents(chunks, self.embeddings)

    def ask(self, question):
        if not self.vector_db:
            raise ValueError("Please load a file")
        template = """
                Utilise les éléments de contexte suivants pour répondre à la question à la fin.
                Si tu ne sais pas, dis que tu ne sais pas, n'invente rien.
                Réponds impérativement en FRANÇAIS.

                Contexte : {context}
                Question : {question}
                Réponse utile :"""
        QA_CHAIN_PROMPT = PromptTemplate.from_template(template)
        qa_chain = RetrievalQA.from_chain_type(llm=self.llm, retriever=self.vector_db.as_retriever(),
                                               chain_type_kwargs={"prompt": QA_CHAIN_PROMPT})
        return qa_chain.invoke(question)["result"]
