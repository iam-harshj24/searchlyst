SHELL    := /bin/bash
ENV      ?= staging
PROJECT  ?= $(GCP_PROJECT_ID)
BUCKET   ?= $(PROJECT)-tfstate
PREFIX   := searchlyst/$(ENV)
TFVARS   := envs/$(ENV).tfvars

.PHONY: help init plan apply destroy refresh outputs secrets fmt validate

help:
	@echo "Usage:"
	@echo "  ENV=staging make init       # initialise + select workspace"
	@echo "  ENV=staging make plan       # preview changes"
	@echo "  ENV=staging make apply      # apply changes"
	@echo "  ENV=staging make outputs    # show all outputs (non-sensitive)"
	@echo "  ENV=staging make secrets    # print sensitive outputs to copy into GitHub secrets"
	@echo "  ENV=staging make destroy    # tear everything down (be careful in prod)"
	@echo ""
	@echo "Required env: GCP_PROJECT_ID (or pass PROJECT=...)"

init:
	@test -n "$(PROJECT)" || (echo "Set GCP_PROJECT_ID or PROJECT="; exit 1)
	terraform init -reconfigure \
		-backend-config="bucket=$(BUCKET)" \
		-backend-config="prefix=$(PREFIX)"
	@terraform workspace select $(ENV) 2>/dev/null || terraform workspace new $(ENV)

plan:
	terraform plan -var-file=$(TFVARS)

apply:
	terraform apply -var-file=$(TFVARS)

destroy:
	terraform destroy -var-file=$(TFVARS)

refresh:
	terraform refresh -var-file=$(TFVARS)

outputs:
	terraform output

secrets:
	@echo "──── Copy these into your GitHub repo Settings → Secrets and variables → Actions ────"
	@echo
	@echo "GCP_SA_KEY:"
	@terraform output -raw gha_sa_key_json
	@echo
	@echo
	@echo "DATABASE_URL:"
	@terraform output -raw database_url
	@echo
	@echo
	@terraform output -raw github_secrets_summary

fmt:
	terraform fmt -recursive

validate:
	terraform validate
