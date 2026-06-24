import re

def read_file(path):
    with open(path, 'r') as f:
        return f.read()

def write_file(path, content):
    with open(path, 'w') as f:
        f.write(content)

ch3 = read_file('chapters/chapter3_requirements_and_methodology.tex')
ch4 = read_file('chapters/chapter4_system_architecture.tex')
ch5 = read_file('chapters/chapter5_implementation.tex')

# Extract blocks from Ch3
ch3_intro = ch3[:ch3.find('% ────')]
ch3_res_design = ch3[ch3.find('\\section{Requirements and Research Design}'):ch3.find('% ────', ch3.find('\\section{Requirements and Research Design}')+10)]
ch3_req_analysis = ch3[ch3.find('\\subsection{Requirements Analysis}'):ch3.find('% ────', ch3.find('\\subsection{Requirements Analysis}')+10)]
ch3_dev_method = ch3[ch3.find('\\section{Development Methodology}'):ch3.find('% ────', ch3.find('\\section{Development Methodology}')+10)]
ch3_eval_method = ch3[ch3.find('\\section{Evaluation Methodology}'):]

# Extract blocks from Ch4
ch4_intro = ch4[:ch4.find('% ────')]
ch4_sys_db = ch4[ch4.find('\\section{System and Database Architecture}'):ch4.find('% ────', ch4.find('\\section{System and Database Architecture}')+10)]
ch4_backend = ch4[ch4.find('\\section{Backend, Frontend, and H5P Integration}'):ch4.find('% ────', ch4.find('\\section{Backend, Frontend, and H5P Integration}')+10)]
ch4_inclusive = ch4[ch4.find('\\subsection{Inclusive Design'):ch4.find('% ────', ch4.find('\\subsection{Inclusive Design}')+10)]
ch4_ai_pipe = ch4[ch4.find('\\section{AI Pipeline Architecture}'):ch4.find('% ────', ch4.find('\\section{AI Pipeline Architecture}')+10)]
ch4_h5p = ch4[ch4.find('\\subsection{H5P Integration}'):ch4.find('% ────', ch4.find('\\subsection{H5P Integration}')+10)]
ch4_sec = ch4[ch4.find('\\subsection{Security Implementation}'):]

# Extract blocks from Ch5
ch5_intro = ch5[:ch5.find('% ────')]
ch5_discussion = ch5[ch5.find('\\section{Discussion}'):ch5.find('% ────', ch5.find('\\section{Discussion}')+10)]

# Need to split ch5_discussion and ch5_comparison to extract AI/API results
# Let's just use regex or split manually
# AI quality starts at: "Suggestion quality was assessed by having the project supervisor"
ch5_comparison = ch5[ch5.find('\\section{Comparison}'):]
ai_results_idx = ch5_comparison.find('Suggestion quality was assessed')
ch5_comparison_only = ch5_comparison[:ai_results_idx]
ch5_ai_api_eval = ch5_comparison[ai_results_idx:]
# The remaining part of ch5 has \section{Evaluation}
eval_idx = ch5_ai_api_eval.find('\\section{Evaluation}')
ch5_ai_api = ch5_ai_api_eval[:eval_idx]
ch5_eval = ch5_ai_api_eval[eval_idx:]

# Assemble NEW Chapter 3
new_ch3 = ch3_intro + """% ─────────────────────────────────────────────────────────────────────────────
\\section{Overview}

""" + ch3_res_design.replace('\\section{Requirements and Research Design}', '').replace('\\subsection{Research Design}', '\\textbf{Research Design.}') + """

% ─────────────────────────────────────────────────────────────────────────────
\\section{User requirement analysis}

""" + ch3_req_analysis.replace('\\subsection{Requirements Analysis}', '').replace('\\subsubsection{User Research}', '\\textbf{User Research.}').replace('\\subsubsection{Functional Requirements}', '\\subsection{Functional and Non-Functional Requirements}').replace('\\subsubsection{Non-Functional Requirements}', '\\textbf{Non-Functional Requirements.}') + """

% ─────────────────────────────────────────────────────────────────────────────
\\section{System Design}

""" + ch4_sys_db.replace('\\section{System and Database Architecture}', '').replace('\\subsection{Architectural Overview}', '\\textbf{Architectural Overview.}').replace('\\subsection{Database Design}', '\\subsection{Database design}') + """

""" + ch4_inclusive.replace('\\subsection{Inclusive Design for Non-Technical Educators}', '\\subsection{User Interface design}\n\n\\textbf{Inclusive Design for Non-Technical Educators.}') + """

% ─────────────────────────────────────────────────────────────────────────────
""" + ch4_ai_pipe

# Assemble NEW Chapter 4
new_ch4 = """\\chapter{IMPLEMENT AND RESULTS}

This chapter details the implementation of the backend, frontend, and security components, followed by the performance results of the AI pipeline and API endpoints.

% ─────────────────────────────────────────────────────────────────────────────
\\section{Implement}

\\subsection{Backend and Frontend Implementation}

""" + ch3_dev_method.replace('\\section{Development Methodology}', '') + """

""" + ch4_backend.replace('\\section{Backend, Frontend, and H5P Integration}', '').replace('\\subsection{Backend and Frontend Implementation}', '') + """

\\subsection{Security and H5P Integration}

""" + ch4_h5p.replace('\\subsection{H5P Integration}', '') + """

""" + ch4_sec.replace('\\subsection{Security Implementation}', '') + """

% ─────────────────────────────────────────────────────────────────────────────
\\section{Results}

\\subsection{AI Pipeline Performance Results}

""" + ch5_ai_api[:ch5_ai_api.find('Response times were measured')].strip() + """

\\subsection{API and Platform Performance Results}

""" + ch5_ai_api[ch5_ai_api.find('Response times were measured'):].strip() + "\n"

# Assemble NEW Chapter 5
new_ch5 = """\\chapter{DISCUSSION AND EVALUATION}

This chapter discusses the usability study outcomes, compares the platform against the baseline, and evaluates the overall success of the project.

% ─────────────────────────────────────────────────────────────────────────────
""" + ch5_discussion + """

""" + ch5_comparison_only + """

% ─────────────────────────────────────────────────────────────────────────────
\\section{Evaluation}

""" + ch3_eval_method.replace('\\section{Evaluation Methodology}', '\\textbf{Evaluation Methodology.}') + "\n\n" + ch5_eval.replace('\\section{Evaluation}', '').strip() + "\n"

write_file('chapters/chapter3_requirements_and_methodology.tex', new_ch3)
write_file('chapters/chapter4_system_architecture.tex', new_ch4)
write_file('chapters/chapter5_implementation.tex', new_ch5)
print("Files rewritten successfully.")
