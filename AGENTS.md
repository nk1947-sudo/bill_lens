## Learned User Preferences

## Learned Workspace Facts
- `F:\Cluade-healthcare-usecase` is a Streamlit medical bill advocate app that analyzes uploaded bill PDFs/images.
- The app's intended flow uses local extraction first: `pdfplumber` for PDFs, `PaddleOCR` for images, deterministic rule checks for bill issues, and optional text-only LLM output.
- The workspace is configured to use Groq's OpenAI-compatible endpoint for text analysis; vision LLM calls were intentionally removed.
- The project uses `uv` for Python dependency management and includes OCR dependencies (`paddleocr`, `paddlepaddle`) alongside Streamlit, OpenAI, pdfplumber, Pillow, and python-dotenv.
