# Thesis Package (LaTeX)

This folder contains a complete thesis package for the AI-ActivEdu project.

## Included
- `main.tex`: top-level thesis document
- `chapters/`: chaptered thesis content (Introduction to Conclusion)
- `figures/`: diagram sources in TikZ/PGFPlots
- `appendices/`: large evidence appendices sourced from project reports
- `references.bib`: 50-reference bibliography

## Build
Use a TeX distribution with `xelatex` and `bibtex`:

```bash
cd thesis
xelatex main.tex
bibtex main
xelatex main.tex
xelatex main.tex
```

## Notes on Length
The thesis combines core chapters with extensive reproducibility and evidence appendices (`VerbatimInput`) from repository documentation to support an 80-100 page submission target.

## Diagram Sources
- `figures/fig_system_architecture.tex`
- `figures/fig_ai_pipeline.tex`
- `figures/fig_deployment_topology.tex`
- `figures/fig_evaluation_metrics.tex`
