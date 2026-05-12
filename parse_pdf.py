import sys
from pypdf import PdfReader
import re

def analyze_pdf(filepath):
    try:
        reader = PdfReader(filepath)
        outlines = reader.outline
        def print_outline(outlines, level=0):
            if not outlines: return
            for outline in outlines:
                if isinstance(outline, list):
                    print_outline(outline, level + 1)
                else:
                    title = outline.title
                    print("  " * level + str(title))
        
        print("--- Table of Contents ---")
        print_outline(outlines)
        
        print("\n--- Figure/Table counts ---")
        fig_count = 0
        table_count = 0
        for page in reader.pages:
            text = page.extract_text()
            if text:
                # Basic heuristic counting
                fig_count += len(re.findall(r'(?i)figure\s+\d+[\.\:]\d*', text))
                table_count += len(re.findall(r'(?i)table\s+\d+[\.\:]\d*', text))
        
        print(f"Figures (approx): {fig_count}")
        print(f"Tables (approx): {table_count}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    analyze_pdf('References/Thesis Dang Nguyen Nam Anh.pdf')
