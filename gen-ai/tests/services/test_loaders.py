import pytest

from app.services.loaders import SUPPORTED_EXTENSIONS, load_documents


def test_supported_extensions_covers_all_categories():
    categories = set(SUPPORTED_EXTENSIONS.values())
    assert "pdf" in categories
    assert "word" in categories
    assert "excel" in categories
    assert "audio" in categories
    assert "video" in categories


def test_expected_extensions_present():
    for ext in (".pdf", ".docx", ".doc", ".xlsx", ".xls", ".mp3", ".wav", ".mp4", ".mov"):
        assert ext in SUPPORTED_EXTENSIONS, f"{ext} manquant dans SUPPORTED_EXTENSIONS"


def test_load_documents_raises_on_unsupported_extension():
    with pytest.raises(ValueError, match="non supporté"):
        load_documents("/tmp/notes.txt")


def test_load_documents_raises_on_unknown_extension():
    with pytest.raises(ValueError, match="non supporté"):
        load_documents("/tmp/archive.rar")


def test_load_documents_raises_on_no_extension():
    with pytest.raises(ValueError, match="non supporté"):
        load_documents("/tmp/fichier_sans_extension")
