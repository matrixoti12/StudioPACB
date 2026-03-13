import sys
try:
    from pypdf import PdfReader
    reader = PdfReader('c:/Users/German Rauda/.gemini/antigravity/playground/ancient-feynman/Guía Técnica API Biblia RVR1960.pdf')
    for page in reader.pages:
        print(page.extract_text() or '')
except Exception as e:
    print(f"Error: {e}")
