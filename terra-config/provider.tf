terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  # Every single AWS resource Terraform creates will automatically
  # get these tags — makes it easy to find and clean up in the console
  default_tags {
    tags = {
      Project     = "jobboard"
      Environment = var.environment
      ManagedBy   = "terraform"
      Owner       = "three-tier-user"
    }
  }
}

# Fetches your AWS account ID — used in outputs
data "aws_caller_identity" "current" {}