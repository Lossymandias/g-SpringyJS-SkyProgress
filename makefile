# ----------------------------------------------------------------------------
# SpringEngine - JS spring/graph library + Hypixel SkyBlock wiki & progression
# webapp (served by main.py)
#
# Usage: make help
# Override any variable on the CLI, e.g.  make run PORT=9000
# ----------------------------------------------------------------------------

SHELL := /usr/bin/env bash
.DEFAULT_GOAL := help

PYTHON      ?= python3
VENV        ?= .venv
HOST        ?= 127.0.0.1
PORT        ?= 5000
JS_SRC      ?= src
JS_ENTRY    ?= $(JS_SRC)/index.js
DIST        ?= dist
DATA_DIR    ?= data

VENV_BIN    := $(VENV)/bin
VENV_PY     := $(VENV_BIN)/python
VENV_PIP    := $(VENV_BIN)/pip

export HOST
export PORT

.PHONY: help
help: 
	@awk 'BEGIN {FS = ":.*
		/^[a-zA-Z0-9_-]+:.*
	@echo

$(VENV_PY):
	$(PYTHON) -m venv $(VENV)
	$(VENV_PIP) install --upgrade pip

.PHONY: venv
venv: $(VENV_PY) 

.PHONY: install
install: venv 
	@if [ -f requirements.txt ]; then $(VENV_PIP) install -r requirements.txt; \
	else echo "No requirements.txt found, skipping Python deps"; fi
	@if [ -f package.json ]; then npm install; \
	else echo "No package.json found, skipping JS deps"; fi

.PHONY: run
run: venv 
	$(VENV_PY) main.py

.PHONY: dev
dev: venv 
	FLASK_DEBUG=1 DEBUG=1 $(VENV_PY) main.py

.PHONY: open
open: 
	@url="http://$(HOST):$(PORT)"; \
	( command -v xdg-open >/dev/null && xdg-open $$url ) || \
	( command -v open >/dev/null && open $$url ) || echo "Open $$url manually"

.PHONY: build
build: 
	@mkdir -p $(DIST)
	npx --yes esbuild $(JS_ENTRY) --bundle --format=esm --outfile=$(DIST)/spring-engine.js
	npx --yes esbuild $(JS_ENTRY) --bundle --minify --format=iife \
		--global-name=SpringEngineLib --outfile=$(DIST)/spring-engine.min.js

.PHONY: lint-js
lint-js: 
	npx --yes eslint $(JS_SRC)

.PHONY: lint
lint: venv lint-js 
	$(VENV_PIP) install -q ruff
	$(VENV_BIN)/ruff check .

.PHONY: format
format: venv 
	$(VENV_PIP) install -q ruff
	$(VENV_BIN)/ruff format .

.PHONY: test
test: venv 
	$(VENV_PIP) install -q pytest
	@if [ -d tests ]; then $(VENV_BIN)/pytest -q; else echo "No tests/ directory, skipping pytest"; fi
	@if [ -f package.json ] && grep -q '"test"' package.json; then npm test; fi

.PHONY: data-check
data-check: 
	@test -d $(DATA_DIR) || { echo "Missing $(DATA_DIR)/"; exit 1; }
	@for f in $(DATA_DIR)/*.json; do \
		[ -e "$$f" ] || continue; \
		$(PYTHON) -m json.tool "$$f" >/dev/null && echo "ok  $$f" || { echo "BAD $$f"; exit 1; }; \
	done

.PHONY: clean
clean: 
	rm -rf $(DIST) .pytest_cache .ruff_cache
	find . -type d -name __pycache__ -not -path "./$(VENV)/*" -prune -exec rm -rf {} +

.PHONY: distclean
distclean: clean 
	rm -rf $(VENV) node_modules