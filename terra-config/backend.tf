terraform {
  backend "s3" {
    bucket = "three-tier-jobboard-tfstate-2026-459499397949-ca-central-1-an"
    key    = "jobboard/terraform.tfstate"
    region = "ca-central-1"

    # Encrypts the state file at rest inside S3
    encrypt = true
  }
}